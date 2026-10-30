-- 0002_blog.sql — categorias, tags, posts (blog + Pai Indica), comentários, reações, views, busca

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  color text,                                                        -- hex da categoria-mãe (doc 00 §3.4)
  parent_id uuid null references public.categories(id) on delete set null,   -- null = categoria-mãe; preenchido = subcategoria
  pillar text null check (pillar in ('casa','trabalho','corpo','alma')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_parent_id_idx on public.categories(parent_id);
alter table public.categories enable row level security;
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories for select using (true);
drop policy if exists "categories: staff insert" on public.categories;
create policy "categories: staff insert" on public.categories for insert with check ((select public.is_admin()));
drop policy if exists "categories: staff update" on public.categories;
create policy "categories: staff update" on public.categories for update using ((select public.is_admin()));
drop policy if exists "categories: staff delete" on public.categories;
create policy "categories: staff delete" on public.categories for delete using ((select public.is_admin()));

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
drop policy if exists "tags: public read" on public.tags;
create policy "tags: public read" on public.tags for select using (true);
drop policy if exists "tags: staff write" on public.tags;
create policy "tags: staff write" on public.tags for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- posts ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  excerpt text,
  body jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  cover_image_url text,
  cover_image_alt text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'artigo' check (kind in ('artigo','noticia','review','comparativo','lista')),
  review jsonb,
  comparison jsonb,
  product_category text,
  product_subcategory text,
  product_score numeric(3,1) check (product_score is null or (product_score >= 0 and product_score <= 10)),
  faq jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  publish_at timestamptz,
  reading_time integer,
  view_count integer not null default 0,
  like_count integer not null default 0,
  search_content tsvector,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_review_requires_kind check (kind <> 'review' or review is not null),
  constraint posts_comparison_requires_kind check (kind not in ('comparativo','lista') or comparison is not null)
);
create index if not exists idx_posts_status_publish on public.posts(status, publish_at desc);
create index if not exists idx_posts_category on public.posts(category_id);
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_kind on public.posts(kind);
create index if not exists idx_posts_product_cat on public.posts(product_category, product_subcategory);
create index if not exists idx_posts_search on public.posts using gin(search_content);
create index if not exists idx_posts_title_trgm on public.posts using gin(title gin_trgm_ops);
create or replace trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

-- Extrai texto do body Tiptap (recursivo) para o tsvector
create or replace function public.tiptap_text(doc jsonb)
returns text language sql immutable as $$
  select coalesce(string_agg(n->>'text', ' '), '')
  from jsonb_path_query(doc, 'strict $.** ? (@.type == "text")') as n;
$$;

create or replace function public.posts_search_content()
returns trigger language plpgsql as $$
declare v_text text := public.tiptap_text(new.body);
begin
  new.search_content :=
    setweight(to_tsvector('public.pt_unaccent', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('public.pt_unaccent', coalesce(new.subtitle,'') || ' ' || coalesce(new.excerpt,'')), 'B') ||
    setweight(to_tsvector('public.pt_unaccent', v_text), 'C');
  if new.reading_time is null then
    new.reading_time := greatest(1, ceil(coalesce(array_length(regexp_split_to_array(v_text, '\s+'), 1), 0) / 200.0));
  end if;
  return new;
end; $$;
create or replace trigger trg_posts_search before insert or update of title, subtitle, excerpt, body on public.posts
  for each row execute function public.posts_search_content();

alter table public.posts enable row level security;
drop policy if exists "posts: public read published" on public.posts;
create policy "posts: public read published" on public.posts
  for select using (status = 'published' and (publish_at is null or publish_at <= now()));
drop policy if exists "posts: staff read all" on public.posts;
create policy "posts: staff read all" on public.posts for select using ((select public.is_admin()));
drop policy if exists "posts: staff insert" on public.posts;
create policy "posts: staff insert" on public.posts for insert with check ((select public.is_admin()));
drop policy if exists "posts: author or staff update" on public.posts;
create policy "posts: author or staff update" on public.posts
  for update using ((select auth.uid()) = author_id or (select public.is_admin()))
  with check ((select auth.uid()) = author_id or (select public.is_admin()));
drop policy if exists "posts: staff delete" on public.posts;
create policy "posts: staff delete" on public.posts for delete using ((select public.is_admin()));

-- ---------- post_tags ----------
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists idx_post_tags_tag on public.post_tags(tag_id);
alter table public.post_tags enable row level security;
drop policy if exists "post_tags: public read" on public.post_tags;
create policy "post_tags: public read" on public.post_tags for select using (true);
drop policy if exists "post_tags: staff write" on public.post_tags;
create policy "post_tags: staff write" on public.post_tags for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- comments ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  content text not null check (length(content) between 2 and 3000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_comments_post on public.comments(post_id, status);
create index if not exists idx_comments_user on public.comments(user_id);
create or replace trigger trg_comments_updated before update on public.comments
  for each row execute function public.set_updated_at();
alter table public.comments enable row level security;
drop policy if exists "comments: public read approved" on public.comments;
create policy "comments: public read approved" on public.comments for select using (status = 'approved');
drop policy if exists "comments: own read" on public.comments;
create policy "comments: own read" on public.comments for select using ((select auth.uid()) = user_id);
drop policy if exists "comments: staff read" on public.comments;
create policy "comments: staff read" on public.comments for select using ((select public.is_admin()));
drop policy if exists "comments: auth insert pending" on public.comments;
create policy "comments: auth insert pending" on public.comments
  for insert with check ((select auth.uid()) = user_id and status = 'pending');
drop policy if exists "comments: own update" on public.comments;
create policy "comments: own update" on public.comments
  for update using ((select auth.uid()) = user_id and status = 'pending');
drop policy if exists "comments: staff moderate" on public.comments;
create policy "comments: staff moderate" on public.comments
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "comments: own or staff delete" on public.comments;
create policy "comments: own or staff delete" on public.comments
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

-- ---------- reactions ----------
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_key text not null,
  type text not null default 'like' check (type in ('like','useful','saved')),
  created_at timestamptz not null default now(),
  unique (post_id, user_key, type)
);
create index if not exists idx_reactions_post on public.reactions(post_id, type);
alter table public.reactions enable row level security;
drop policy if exists "reactions: own read" on public.reactions;
create policy "reactions: own read" on public.reactions
  for select using ((select auth.uid())::text = user_key or (select public.is_admin()));
drop policy if exists "reactions: own delete" on public.reactions;
create policy "reactions: own delete" on public.reactions
  for delete using ((select auth.uid())::text = user_key or (select public.is_admin()));

create or replace function public.toggle_reaction(p_post_id uuid, p_type text, p_user_key text default null)
returns table (active boolean, count bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_key text := coalesce(auth.uid()::text, nullif(btrim(p_user_key), ''));
  v_exists boolean;
begin
  if v_key is null or length(v_key) > 128 then
    raise exception 'user_key inválido';
  end if;
  select exists(select 1 from public.reactions where post_id = p_post_id and user_key = v_key and type = p_type) into v_exists;
  if v_exists then
    delete from public.reactions where post_id = p_post_id and user_key = v_key and type = p_type;
  else
    insert into public.reactions (post_id, user_key, type) values (p_post_id, v_key, p_type);
  end if;
  if p_type = 'like' then
    update public.posts set like_count = (select count(*) from public.reactions where post_id = p_post_id and type = 'like') where id = p_post_id;
  end if;
  return query select not v_exists, (select count(*) from public.reactions where post_id = p_post_id and type = p_type);
end; $$;
grant execute on function public.toggle_reaction(uuid, text, text) to anon, authenticated;

-- ---------- post_view_events + increment_post_views ----------
create table if not exists public.post_view_events (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_key text not null,
  viewed_on date not null default current_date,
  primary key (post_id, user_key, viewed_on)
);
alter table public.post_view_events enable row level security;
revoke all on public.post_view_events from anon, authenticated;

create or replace function public.increment_post_views(p_post_id uuid, p_user_key text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_key text := coalesce(auth.uid()::text, nullif(btrim(p_user_key), ''));
begin
  if v_key is null or length(v_key) > 128 then return; end if;
  insert into public.post_view_events (post_id, user_key) values (p_post_id, v_key) on conflict do nothing;
  if found then
    update public.posts set view_count = view_count + 1 where id = p_post_id and status = 'published';
  end if;
end; $$;
grant execute on function public.increment_post_views(uuid, text) to anon, authenticated;

-- ---------- search_posts ----------
create or replace function public.search_posts(p_query text, p_limit integer default 20, p_offset integer default 0)
returns table (
  id uuid, slug text, title text, excerpt text, cover_image_url text, kind text,
  product_score numeric, category_slug text, category_name text, publish_at timestamptz, rank real
)
language sql stable security definer set search_path = public as $$
  with q as (
    select websearch_to_tsquery('public.pt_unaccent', coalesce(nullif(btrim(p_query),''), 'x')) as tsq
  )
  select p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.kind, p.product_score,
         c.slug, c.name, p.publish_at,
         (ts_rank_cd(p.search_content, q.tsq) + similarity(p.title, p_query))::real as rank
  from public.posts p
  cross join q
  left join public.categories c on c.id = p.category_id
  where p.status = 'published' and (p.publish_at is null or p.publish_at <= now())
    and (p.search_content @@ q.tsq or p.title % p_query)
  order by rank desc, p.publish_at desc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;
grant execute on function public.search_posts(text, integer, integer) to anon, authenticated;

-- ---------- get_home_data (products existe só após 0003: a função referencia a tabela em runtime,
-- language sql valida na criação → este bloco fica no FIM de 0003_loja.sql; aqui só o comentário) ----------
-- get_home_data: ver 0003_loja.sql

-- ---------- categorias iniciais ----------
-- Taxonomia normativa = doc 00 §3.2–3.5 (14 categorias-mãe + 103 subcategorias com parent_id/color/pillar).
-- O bloco abaixo é o SQL do doc 00 §3.4, copiado literalmente (idempotente: on conflict (slug) do update).
-- 0002_blog.sql — seed da taxonomia (categorias-mãe e subcategorias)
alter table public.categories
  add column if not exists parent_id uuid null references public.categories(id) on delete set null,
  add column if not exists pillar text null check (pillar in ('casa','trabalho','corpo','alma'));

create index if not exists categories_parent_id_idx on public.categories(parent_id);

-- Categorias-mãe
insert into public.categories (slug, name, description, color, sort_order, pillar) values
('paternidade-por-fase', 'Paternidade por fase', 'O que o pai precisa saber e fazer em cada idade do filho, da gestação ao filho adulto. Marcos, rotina, saúde, limites e vínculo, fase por fase.', '#14505C', 10, 'casa'),
('casamento-e-familia', 'Casamento e família', 'Namoro, noivado, casamento e a vida a dois com filhos. Como ser marido, liderar servindo, cuidar da esposa e construir uma casa que dura.', '#8C3B4A', 20, 'casa'),
('provedor-e-carreira', 'Provedor e carreira', 'Trabalho, salário, mudança de emprego, empreender e liderar. O pai como provedor que sustenta a casa sem perder a casa de vista.', '#2E5E8C', 30, 'trabalho'),
('dinheiro-do-pai', 'Dinheiro do Pai', 'Orçamento familiar, dívidas, reserva, investimentos, moedas e bitcoin explicados para quem sustenta uma casa. Sem promessa de enriquecer rápido.', '#2F7D4F', 40, 'trabalho'),
('fe-e-virtude', 'Fé e virtude', 'Oração, sacramentos, virtudes e santos para o homem que quer ser santo no meio da família. São José como modelo do pai.', '#6B4C9A', 50, 'alma'),
('corpo-e-saude-do-homem', 'Corpo e saúde do homem', 'Check-up, sono, treino, alimentação, saúde mental e sexual do homem adulto. Informação séria para estar vivo e forte para a família.', '#1F7A7A', 60, 'corpo'),
('churrasco-e-cozinha', 'Churrasco e cozinha', 'Cortes de carne, fogo, facas, receitas e a cozinha do dia a dia. O pai que alimenta a família e reúne os amigos em volta da brasa.', '#B23A3A', 70, 'corpo'),
('caixa-de-ferramentas-e-reparos', 'Caixa de ferramentas e reparos', 'Ferramentas, reparos, elétrica, hidráulica e marcenaria para resolver a casa com as próprias mãos. Passo a passo e o que comprar.', '#D9822B', 80, 'corpo'),
('carro-e-moto', 'Carro e moto', 'Comprar, manter e dirigir com segurança. Carro de família, cadeirinha, revisão, documentação e ensinar o filho a dirigir.', '#3D4650', 90, 'corpo'),
('estilo-e-cuidados', 'Estilo e cuidados', 'Barba, cabelo, roupa, relógio e postura. Apresentar-se bem com simplicidade, para o trabalho, a missa e a vida.', '#7A5C3E', 100, 'corpo'),
('esporte-e-lazer-com-os-filhos', 'Esporte e lazer com os filhos', 'Futebol, bicicleta, pesca, acampamento, jogos e filmes. Ideias de vínculo pai e filho por idade, tempo e custo.', '#3F8F5A', 110, 'corpo'),
('tecnologia-do-pai', 'Tecnologia do Pai', 'Celular, controle parental, casa conectada, computador e inteligência artificial a serviço da família. Proteger os filhos e trabalhar melhor.', '#3A6EA5', 120, 'trabalho'),
('direitos-do-pai', 'Direitos do pai', 'Licença-paternidade, registro, guarda, pensão, convivência e herança explicados em linguagem simples. Informação, não parecer jurídico.', '#5C6B73', 130, 'casa'),
('historias-de-pai', 'Histórias de pai', 'Relatos reais de pais, avós e filhos. Lições, erros, conversões e vitórias contadas por quem viveu, para quem está vivendo.', '#C2703A', 140, 'casa')
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, color = excluded.color,
  sort_order = excluded.sort_order, pillar = excluded.pillar;

-- Subcategorias: herdam color e pillar da mãe
with sub(parent_slug, slug, name, pos) as (values
  -- 1. paternidade-por-fase
  ('paternidade-por-fase','gestacao-e-parto','Gestação e parto',1),
  ('paternidade-por-fase','recem-nascido','Recém-nascido (0 a 12 meses)',2),
  ('paternidade-por-fase','1-a-3-anos','1 a 3 anos',3),
  ('paternidade-por-fase','4-a-7-anos','4 a 7 anos',4),
  ('paternidade-por-fase','8-a-12-anos','8 a 12 anos',5),
  ('paternidade-por-fase','adolescencia','Adolescência (12 a 18)',6),
  ('paternidade-por-fase','filho-adulto','Filho adulto',7),
  -- 2. casamento-e-familia
  ('casamento-e-familia','namoro-e-noivado','Namoro e noivado',1),
  ('casamento-e-familia','preparacao-para-o-casamento','Preparação para o casamento',2),
  ('casamento-e-familia','vida-a-dois','Vida a dois',3),
  ('casamento-e-familia','comunicacao-e-conflitos','Comunicação e conflitos',4),
  ('casamento-e-familia','intimidade-conjugal','Intimidade conjugal',5),
  ('casamento-e-familia','rotina-da-casa','Rotina da casa',6),
  ('casamento-e-familia','familia-grande','Família grande e irmãos',7),
  -- 3. provedor-e-carreira
  ('provedor-e-carreira','primeiro-emprego-e-recolocacao','Primeiro emprego e recolocação',1),
  ('provedor-e-carreira','salario-e-negociacao','Salário e negociação',2),
  ('provedor-e-carreira','lideranca-no-trabalho','Liderança no trabalho',3),
  ('provedor-e-carreira','empreender-com-familia','Empreender com família',4),
  ('provedor-e-carreira','equilibrio-trabalho-e-casa','Equilíbrio entre trabalho e casa',5),
  ('provedor-e-carreira','habilidades-e-cursos','Habilidades e cursos',6),
  ('provedor-e-carreira','trabalho-remoto-e-home-office','Trabalho remoto e home office',7),
  -- 4. dinheiro-do-pai
  ('dinheiro-do-pai','orcamento-familiar','Orçamento familiar',1),
  ('dinheiro-do-pai','dividas-e-credito','Dívidas e crédito',2),
  ('dinheiro-do-pai','reserva-e-seguros','Reserva de emergência e seguros',3),
  ('dinheiro-do-pai','investimentos-para-a-familia','Investimentos para a família',4),
  ('dinheiro-do-pai','bitcoin-e-cripto','Bitcoin e cripto',5),
  ('dinheiro-do-pai','cambio-e-moedas','Câmbio e moedas',6),
  ('dinheiro-do-pai','casa-propria-e-financiamento','Casa própria e financiamento',7),
  ('dinheiro-do-pai','aposentadoria-e-sucessao','Aposentadoria e sucessão',8),
  -- 5. fe-e-virtude
  ('fe-e-virtude','oracao-do-pai','Oração do pai',1),
  ('fe-e-virtude','sacramentos-e-liturgia','Sacramentos e liturgia',2),
  ('fe-e-virtude','virtudes-masculinas','Virtudes masculinas',3),
  ('fe-e-virtude','sao-jose-e-os-santos','São José e os santos',4),
  ('fe-e-virtude','transmitir-a-fe-aos-filhos','Transmitir a fé aos filhos',5),
  ('fe-e-virtude','castidade-e-pureza','Castidade e pureza',6),
  ('fe-e-virtude','luto-e-esperanca','Luto e esperança',7),
  ('fe-e-virtude','vocacao-e-discernimento','Vocação e discernimento',8),
  -- 6. corpo-e-saude-do-homem
  ('corpo-e-saude-do-homem','check-up-por-idade','Check-up por idade',1),
  ('corpo-e-saude-do-homem','sono-e-energia','Sono e energia',2),
  ('corpo-e-saude-do-homem','treino-em-casa-e-academia','Treino em casa e na academia',3),
  ('corpo-e-saude-do-homem','alimentacao-do-homem','Alimentação do homem',4),
  ('corpo-e-saude-do-homem','saude-mental-e-estresse','Saúde mental e estresse',5),
  ('corpo-e-saude-do-homem','saude-sexual-e-prostata','Saúde sexual e próstata',6),
  ('corpo-e-saude-do-homem','vicios-e-liberdade','Vícios e liberdade',7),
  ('corpo-e-saude-do-homem','primeiros-socorros-em-casa','Primeiros socorros em casa',8),
  -- 7. churrasco-e-cozinha
  ('churrasco-e-cozinha','cortes-de-carne','Cortes de carne',1),
  ('churrasco-e-cozinha','tecnicas-de-churrasco','Técnicas de churrasco',2),
  ('churrasco-e-cozinha','churrasqueiras-facas-e-acessorios','Churrasqueiras, facas e acessórios',3),
  ('churrasco-e-cozinha','receitas-de-churrasco','Receitas de churrasco',4),
  ('churrasco-e-cozinha','cozinha-do-dia-a-dia','Cozinha do dia a dia',5),
  ('churrasco-e-cozinha','cafe-da-manha-e-lanche-dos-filhos','Café da manhã e lanche dos filhos',6),
  ('churrasco-e-cozinha','bebidas-e-harmonizacao','Bebidas e harmonização',7),
  ('churrasco-e-cozinha','cozinhar-com-os-filhos','Cozinhar com os filhos',8),
  -- 8. caixa-de-ferramentas-e-reparos
  ('caixa-de-ferramentas-e-reparos','ferramentas-essenciais','Ferramentas essenciais',1),
  ('caixa-de-ferramentas-e-reparos','eletrica-basica','Elétrica básica',2),
  ('caixa-de-ferramentas-e-reparos','hidraulica-e-vazamentos','Hidráulica e vazamentos',3),
  ('caixa-de-ferramentas-e-reparos','pintura-e-acabamento','Pintura e acabamento',4),
  ('caixa-de-ferramentas-e-reparos','marcenaria-e-montagem','Marcenaria e montagem',5),
  ('caixa-de-ferramentas-e-reparos','jardim-e-quintal','Jardim e quintal',6),
  ('caixa-de-ferramentas-e-reparos','seguranca-da-casa','Segurança da casa',7),
  ('caixa-de-ferramentas-e-reparos','projetos-com-os-filhos','Projetos com os filhos',8),
  -- 9. carro-e-moto
  ('carro-e-moto','carro-de-familia','Carro de família',1),
  ('carro-e-moto','manutencao-e-revisao','Manutenção e revisão',2),
  ('carro-e-moto','seguranca-e-cadeirinha','Segurança e cadeirinha',3),
  ('carro-e-moto','documentos-multas-e-seguro','Documentos, multas e seguro',4),
  ('carro-e-moto','viagem-de-carro-com-filhos','Viagem de carro com filhos',5),
  ('carro-e-moto','moto-no-dia-a-dia','Moto no dia a dia',6),
  ('carro-e-moto','ensinar-o-filho-a-dirigir','Ensinar o filho a dirigir',7),
  -- 10. estilo-e-cuidados
  ('estilo-e-cuidados','barba-e-cabelo','Barba e cabelo',1),
  ('estilo-e-cuidados','guarda-roupa-essencial','Guarda-roupa essencial',2),
  ('estilo-e-cuidados','sapatos-e-relogios','Sapatos e relógios',3),
  ('estilo-e-cuidados','higiene-e-pele','Higiene e pele',4),
  ('estilo-e-cuidados','como-se-vestir-por-ocasiao','Como se vestir por ocasião',5),
  ('estilo-e-cuidados','etiqueta-e-postura','Etiqueta e postura',6),
  ('estilo-e-cuidados','cuidar-dos-filhos-no-dia-a-dia','Cuidar dos filhos no dia a dia',7),
  -- 11. esporte-e-lazer-com-os-filhos
  ('esporte-e-lazer-com-os-filhos','atividades-por-idade','Atividades por idade',1),
  ('esporte-e-lazer-com-os-filhos','fim-de-semana-de-940','Fim de semana de 940',2),
  ('esporte-e-lazer-com-os-filhos','futebol-e-esportes-coletivos','Futebol e esportes coletivos',3),
  ('esporte-e-lazer-com-os-filhos','bicicleta-natacao-e-corrida','Bicicleta, natação e corrida',4),
  ('esporte-e-lazer-com-os-filhos','pesca-acampamento-e-natureza','Pesca, acampamento e natureza',5),
  ('esporte-e-lazer-com-os-filhos','jogos-de-mesa-e-brincadeiras','Jogos de mesa e brincadeiras',6),
  ('esporte-e-lazer-com-os-filhos','filmes-livros-e-musica','Filmes, livros e música',7),
  ('esporte-e-lazer-com-os-filhos','viagens-em-familia','Viagens em família',8),
  -- 12. tecnologia-do-pai
  ('tecnologia-do-pai','controle-parental-e-telas','Controle parental e telas',1),
  ('tecnologia-do-pai','celular-e-acessorios','Celular e acessórios',2),
  ('tecnologia-do-pai','casa-conectada','Casa conectada',3),
  ('tecnologia-do-pai','computador-e-home-office','Computador e home office',4),
  ('tecnologia-do-pai','seguranca-digital-da-familia','Segurança digital da família',5),
  ('tecnologia-do-pai','ia-no-dia-a-dia-do-pai','IA no dia a dia do pai',6),
  ('tecnologia-do-pai','games-e-filhos','Games e filhos',7),
  -- 13. direitos-do-pai
  ('direitos-do-pai','licenca-paternidade-e-trabalho','Licença-paternidade e trabalho',1),
  ('direitos-do-pai','registro-e-documentos-do-filho','Registro e documentos do filho',2),
  ('direitos-do-pai','guarda-e-convivencia','Guarda e convivência',3),
  ('direitos-do-pai','pensao-alimenticia','Pensão alimentícia',4),
  ('direitos-do-pai','alienacao-parental','Alienação parental',5),
  ('direitos-do-pai','heranca-e-testamento','Herança e testamento',6),
  ('direitos-do-pai','escola-saude-e-direitos-do-filho','Escola, saúde e direitos do filho',7),
  -- 14. historias-de-pai
  ('historias-de-pai','meu-pai-me-ensinou','Meu pai me ensinou',1),
  ('historias-de-pai','primeiros-dias','Primeiros dias',2),
  ('historias-de-pai','conversao-e-fe','Conversão e fé',3),
  ('historias-de-pai','recomeco','Recomeço',4),
  ('historias-de-pai','pais-que-inspiram','Pais que inspiram',5),
  ('historias-de-pai','cartas-ao-filho','Cartas ao filho',6)
)
insert into public.categories (slug, name, description, color, sort_order, pillar, parent_id)
select s.slug, s.name, p.name || ' — ' || s.name || '.', p.color, p.sort_order * 10 + s.pos, p.pillar, p.id
from sub s
join public.categories p on p.slug = s.parent_slug
on conflict (slug) do update set
  name = excluded.name, color = excluded.color, sort_order = excluded.sort_order,
  pillar = excluded.pillar, parent_id = excluded.parent_id;

-- Categorias TÉCNICAS (fora do filtro de /blog e do menu; sort_order >= 900). Ids fixos para a rotina e o validador,
-- mas quem confere é SEMPRE o slug: `select id from categories where slug = 'pai-indica'` (doc 04 §2.2).
insert into public.categories (id, slug, name, description, icon, sort_order) values
('10000000-0000-0000-0000-000000000010','pai-indica','Pai Indica','Reviews, comparativos e listas de produtos indicados pelo pai.','badge-check',900),
('10000000-0000-0000-0000-000000000011','noticias','Notícias','Novidades e acontecimentos que interessam ao pai e à família. A série "Mercado do pai" usa esta categoria + tag serie:mercado-do-pai.','newspaper',910)
on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, sort_order = excluded.sort_order;

-- Aceite: 14 linhas com parent_id is null e sort_order < 900; 103 com parent_id preenchido; 2 técnicas (sort_order >= 900).
