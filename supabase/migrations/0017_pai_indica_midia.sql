-- 0017_pai_indica_midia.sql — Fase 9: Pai Indica Mídia (doc 14 §2)
-- Projeto: Vocação de Pai · Supabase <SUPABASE_PROJECT_REF> (sa-east-1)
-- Idempotente: create table if not exists / add column if not exists / drop policy if exists antes de create policy.
-- Depende de 0001_core.sql (set_updated_at, is_admin, pt_unaccent, pg_trgm) e 0002_blog.sql (tiptap_text).

-- ---------- media_reviews ----------
create table if not exists public.media_reviews (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  original_title text,
  type text not null check (type in ('filme','serie','jogo','app','livro')),
  year integer check (year is null or (year between 1900 and 2100)),
  platforms text[] not null default '{}',
  -- Selo oficial do MJSP, copiado do portal classindportal.mj.gov.br. Livro não recebe ClassInd (null).
  classind text check (classind is null or classind in ('L','10','12','14','16','18')),
  classind_descriptors text[] not null default '{}',
  -- Nota tripla do pai (doc 14 §2.2): idade (0 = livre … 18), qualidade 0-10, moral -4..+4.
  pai_age_min integer not null default 0 check (pai_age_min between 0 and 18),
  pai_age_note text,
  score_quality numeric(3,1) not null default 7.0 check (score_quality between 0 and 10),
  score_moral integer not null default 0 check (score_moral between -4 and 4),
  -- 10 categorias em bolinhas 0-5 (modelo Common Sense); as chaves são obrigatórias, o valor é conferido pelo validador.
  content_scores jsonb not null default '{"violencia":0,"sexo":0,"linguagem":0,"drogas":0,"consumismo":0,"medo":0,"valores_positivos":0,"modelos_positivos":0,"fe":0,"mensagem":0}'::jsonb
    check (
      jsonb_typeof(content_scores) = 'object'
      and content_scores ?& array['violencia','sexo','linguagem','drogas','consumismo','medo','valores_positivos','modelos_positivos','fe','mensagem']
    ),
  summary text not null default '',
  body jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  what_parents_need_to_know text,
  talk_with_your_kids text[] not null default '{}',
  -- Pôster: só Wikimedia Commons (CC/PD) com crédito; null = cartão tipográfico. Nunca IA.
  poster_url text check (poster_url is null or poster_url ~ '^https://upload\.wikimedia\.org/'),
  poster_credit text,
  poster_license text,
  -- Afiliado Amazon só para livro/jogo (CLAUDE.md §5.1).
  affiliate_url text check (
    affiliate_url is null
    or (type in ('livro','jogo') and affiliate_url ~ '^https://(www\.)?amazon\.com\.br/')
  ),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  publish_at timestamptz,
  author_id uuid references public.profiles(id) on delete set null,
  search_content tsvector,
  seo_title text check (seo_title is null or length(seo_title) <= 60),
  seo_description text check (seo_description is null or length(seo_description) <= 155),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_media_reviews_status_publish on public.media_reviews(status, publish_at desc);
create index if not exists idx_media_reviews_type on public.media_reviews(type);
create index if not exists idx_media_reviews_age on public.media_reviews(pai_age_min);
create index if not exists idx_media_reviews_platforms on public.media_reviews using gin(platforms);
create index if not exists idx_media_reviews_search on public.media_reviews using gin(search_content);
create index if not exists idx_media_reviews_title_trgm on public.media_reviews using gin(title gin_trgm_ops);

create or replace trigger trg_media_reviews_updated before update on public.media_reviews
  for each row execute function public.set_updated_at();

-- search_content: título (A), título original + resumo (B), "o que o pai precisa saber" + body (C)
create or replace function public.media_reviews_search_content()
returns trigger language plpgsql as $$
declare v_text text := coalesce(new.what_parents_need_to_know, '') || ' ' || public.tiptap_text(new.body);
begin
  new.search_content :=
    setweight(to_tsvector('public.pt_unaccent', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('public.pt_unaccent', coalesce(new.original_title,'') || ' ' || coalesce(new.summary,'')), 'B') ||
    setweight(to_tsvector('public.pt_unaccent', v_text), 'C');
  if new.publish_at is null and new.status = 'published' then
    new.publish_at := now();
  end if;
  return new;
end; $$;
create or replace trigger trg_media_reviews_search
  before insert or update of title, original_title, summary, body, what_parents_need_to_know, status on public.media_reviews
  for each row execute function public.media_reviews_search_content();

-- RLS: anônimo lê só published com publish_at <= now(); equipe (is_admin) tudo. Sem delete público.
alter table public.media_reviews enable row level security;
drop policy if exists "media_reviews: public read published" on public.media_reviews;
create policy "media_reviews: public read published" on public.media_reviews
  for select using (status = 'published' and (publish_at is null or publish_at <= now()));
drop policy if exists "media_reviews: staff read all" on public.media_reviews;
create policy "media_reviews: staff read all" on public.media_reviews for select using ((select public.is_admin()));
drop policy if exists "media_reviews: staff insert" on public.media_reviews;
create policy "media_reviews: staff insert" on public.media_reviews for insert with check ((select public.is_admin()));
drop policy if exists "media_reviews: staff update" on public.media_reviews;
create policy "media_reviews: staff update" on public.media_reviews
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "media_reviews: staff delete" on public.media_reviews;
create policy "media_reviews: staff delete" on public.media_reviews for delete using ((select public.is_admin()));

-- ---------- search_media ----------
create or replace function public.search_media(p_query text, p_limit integer default 20, p_offset integer default 0)
returns table (
  id uuid, slug text, title text, type text, year integer, classind text, pai_age_min integer,
  score_quality numeric, score_moral integer, summary text, poster_url text, publish_at timestamptz, rank real
)
language sql stable security definer set search_path = public as $$
  with q as (
    select websearch_to_tsquery('public.pt_unaccent', coalesce(nullif(btrim(p_query),''), 'x')) as tsq
  )
  select m.id, m.slug, m.title, m.type, m.year, m.classind, m.pai_age_min,
         m.score_quality, m.score_moral, m.summary, m.poster_url, m.publish_at,
         (ts_rank_cd(m.search_content, q.tsq) + similarity(m.title, p_query))::real as rank
  from public.media_reviews m
  cross join q
  where m.status = 'published' and (m.publish_at is null or m.publish_at <= now())
    and (m.search_content @@ q.tsq or m.title % p_query)
  order by rank desc, m.publish_at desc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;
grant execute on function public.search_media(text, integer, integer) to anon, authenticated;
