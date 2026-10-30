-- 0001_core.sql — extensões, utilitários, perfis, filhos, contato, newsletter, storage e tabelas internas
-- Projeto: Vocação de Pai · Supabase <SUPABASE_PROJECT_REF> (sa-east-1)

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ---------- utilitários ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Configuração de busca em português sem acentos
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'pt_unaccent') then
    create text search configuration public.pt_unaccent (copy = portuguese);
    alter text search configuration public.pt_unaccent
      alter mapping for hword, hword_part, word with unaccent, portuguese_stem;
  end if;
end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pai',
  avatar_url text,
  role text not null default 'member' check (role in ('member','editor','admin')),
  bio text,
  city text,
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  onboarding_done boolean not null default false,
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
create or replace trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- is_admin(): admin ou editor (staff). Security definer para não recursar nas policies de profiles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','editor')
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Impede que o próprio usuário troque o role (só service_role/admin)
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and auth.role() <> 'service_role' then
    raise exception 'Não é permitido alterar o papel do perfil';
  end if;
  return new;
end; $$;
create or replace trigger trg_guard_profile_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Cria o perfil automaticamente ao registrar no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create or replace trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "profiles: read own or staff or authors" on public.profiles;
create policy "profiles: read own or staff or authors" on public.profiles
  for select using (
    (select auth.uid()) = id
    or (select public.is_admin())
    or role in ('editor','admin')
  );
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check ((select auth.uid()) = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "profiles: staff update" on public.profiles;
create policy "profiles: staff update" on public.profiles
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

-- Perfil público reduzido (sem e-mail; usado em bylines e comunidade)
create or replace function public.get_public_profile(p_id uuid)
returns table (id uuid, display_name text, avatar_url text, role text, bio text, city text, uf char(2))
language sql stable security definer set search_path = public as $$
  select id, display_name, avatar_url, role, bio, city, uf from public.profiles where id = p_id;
$$;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;

-- ---------- children ----------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  birth_date date not null,             -- se o pai preferir só mês/ano (doc 00 risco 11), gravar dia 01 e marcar birth_precision='month'
  birth_precision text not null default 'day' check (birth_precision in ('day','month')),
  sex text not null check (sex in ('M','F')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_children_user on public.children(user_id);
create or replace trigger trg_children_updated before update on public.children
  for each row execute function public.set_updated_at();
alter table public.children enable row level security;
drop policy if exists "children: own all" on public.children;
create policy "children: own all" on public.children
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------- contact_messages ----------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null check (length(message) between 10 and 5000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
drop policy if exists "contact: public insert" on public.contact_messages;
create policy "contact: public insert" on public.contact_messages for insert with check (true);
drop policy if exists "contact: staff read" on public.contact_messages;
create policy "contact: staff read" on public.contact_messages for select using ((select public.is_admin()));
drop policy if exists "contact: staff update" on public.contact_messages;
create policy "contact: staff update" on public.contact_messages for update using ((select public.is_admin()));
drop policy if exists "contact: staff delete" on public.contact_messages;
create policy "contact: staff delete" on public.contact_messages for delete using ((select public.is_admin()));

-- ---------- newsletter_subscribers ----------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name text,
  source text,
  user_id uuid references public.profiles(id) on delete set null,
  segments jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed','bounced')),
  confirm_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_newsletter_user on public.newsletter_subscribers(user_id);
-- segments (formato ÚNICO, doc 11 §5.1 — vale para docs 07, 08, 10 e 11):
--   { "frequencia": "diaria"|"semanal",
--     "fases": [slugs do doc 07 §3.1: "gestacao","recem-nascido","bebe","primeira-infancia","infancia","pre-adolescencia","adolescencia","adulto"],
--     "interesses": ["churrasco","ferramentas","carro","dinheiro","fe","saude","carreira","esporte"],
--     "origem": "home|post|ferramenta|cadastro|loja", "vagas": {"ufs": []},
--     "welcome_step": 0, "welcome_next_at": null, "last_sent_at": null }
-- Para membros (user_id preenchido), "fases" é recalculada a partir de children.birth_date com public.child_phase() (doc 07 §3.1).
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "newsletter: public insert" on public.newsletter_subscribers;
create policy "newsletter: public insert" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "newsletter: staff read" on public.newsletter_subscribers;
create policy "newsletter: staff read" on public.newsletter_subscribers for select using ((select public.is_admin()));
drop policy if exists "newsletter: staff update" on public.newsletter_subscribers;
create policy "newsletter: staff update" on public.newsletter_subscribers for update using ((select public.is_admin()));

-- ---------- moderation_log (interno) ----------
create table if not exists public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity text not null,
  entity_id text not null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_moderation_entity on public.moderation_log(entity, entity_id);
alter table public.moderation_log enable row level security;
drop policy if exists "moderation: staff read" on public.moderation_log;
create policy "moderation: staff read" on public.moderation_log for select using ((select public.is_admin()));
drop policy if exists "moderation: staff insert" on public.moderation_log;
create policy "moderation: staff insert" on public.moderation_log for insert with check ((select public.is_admin()));

-- ---------- _tmp_post_staging (interno; rotina) ----------
create table if not exists public._tmp_post_staging (
  k text primary key,
  data text,
  created_at timestamptz not null default now()
);
alter table public._tmp_post_staging enable row level security;
revoke all on public._tmp_post_staging from anon, authenticated;

-- ---------- seo_search_stats (interno; edge function seo-search-console) ----------
create table if not exists public.seo_search_stats (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  period_days integer not null,
  query text,
  page text,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric not null default 0,
  position numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (snapshot_date, period_days, query, page)
);
create index if not exists idx_seo_search_stats_snapshot_date on public.seo_search_stats(snapshot_date desc);
create index if not exists idx_seo_search_stats_page on public.seo_search_stats(page);
alter table public.seo_search_stats enable row level security;
revoke all on public.seo_search_stats from anon, authenticated;

-- ---------- Vault helper (segredos só para service_role) ----------
create or replace function public.get_secret(secret_name text)
returns text language sql stable security definer set search_path = public, vault as $$
  select decrypted_secret from vault.decrypted_secrets where name = secret_name limit 1;
$$;
revoke all on function public.get_secret(text) from public, anon, authenticated;

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public) values
  ('covers','covers', true),
  ('products','products', true),
  ('avatars','avatars', true)
on conflict (id) do nothing;

drop policy if exists "covers: public read" on storage.objects;
create policy "covers: public read" on storage.objects for select using (bucket_id = 'covers');
drop policy if exists "covers: staff write" on storage.objects;
create policy "covers: staff write" on storage.objects for insert with check (bucket_id = 'covers' and public.is_admin());
drop policy if exists "covers: staff update" on storage.objects;
create policy "covers: staff update" on storage.objects for update using (bucket_id = 'covers' and public.is_admin());
drop policy if exists "covers: staff delete" on storage.objects;
create policy "covers: staff delete" on storage.objects for delete using (bucket_id = 'covers' and public.is_admin());

drop policy if exists "products: public read" on storage.objects;
create policy "products: public read" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "products: staff write" on storage.objects;
create policy "products: staff write" on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "products: staff update" on storage.objects;
create policy "products: staff update" on storage.objects for update using (bucket_id = 'products' and public.is_admin());
drop policy if exists "products: staff delete" on storage.objects;
create policy "products: staff delete" on storage.objects for delete using (bucket_id = 'products' and public.is_admin());

-- avatars/<uid>/arquivo.jpg : o dono escreve na própria pasta
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars: own write" on storage.objects;
create policy "avatars: own write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: own update" on storage.objects;
create policy "avatars: own update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: own delete" on storage.objects;
create policy "avatars: own delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
