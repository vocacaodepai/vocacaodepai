-- 0007_ferramentas.sql — cache de mercado e uso de ferramentas (sem pg_cron: agendamentos só em 0008_cron.sql)

create table if not exists public.market_cache (
  key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now(),
  ttl_seconds integer not null default 1800
);
alter table public.market_cache enable row level security;
-- Leitura pública (dados de mercado não são sensíveis); escrita só service_role (supabaseAdmin em src/lib/market/cache.ts, via POST /api/market/refresh)
drop policy if exists "market_cache: public read" on public.market_cache;
create policy "market_cache: public read" on public.market_cache for select using (true);

-- Chaves de market_cache = `KEYS` de src/lib/market/fetchers.ts (doc 06 §2.5); TTLs em src/lib/market/cache.ts (doc 06 §2.3):
--   'fx:last'                 → AwesomeAPI /last (USD, EUR, GBP, ARS, BTC… em BRL), TTL 15 min; se falhar, PTAX do BCB marca source 'bcb'
--   'fx:daily:<PAR>:<dias>'   → AwesomeAPI /json/daily (ex.: fx:daily:USD-BRL:30), TTL 6 h
--   'ptax:<codigo>'           → BCB PTAX (ex.: ptax:USD), TTL 6 h
--   'crypto:simple'           → CoinGecko (BTC/ETH em BRL), TTL 10 min
--   'b3:quotes'               → Brapi (Ibovespa e ações; BRAPI_TOKEN opcional), TTL 30 min
--   'sgs:indicators'          → BCB SGS (Selic 432, CDI 4389, IPCA 13522…), TTL 12 h
--   'tesouro:titulos'         → Tesouro Direto, TTL 6 h
-- Quem grava é POST /api/market/refresh (src/lib/market/refresh.ts), chamado a cada 30 min por .github/workflows/market-refresh.yml.

create or replace function public.get_market(p_keys text[])
returns setof public.market_cache language sql stable security definer set search_path = public as $$
  select * from public.market_cache where key = any(p_keys);
$$;
grant execute on function public.get_market(text[]) to anon, authenticated;

create or replace function public.market_is_stale(p_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select fetched_at + (ttl_seconds || ' seconds')::interval < now() from public.market_cache where key = p_key), true);
$$;
grant execute on function public.market_is_stale(text) to anon, authenticated;

-- tool_usage: uso das ferramentas, anônimo (user_id null) ou identificado. Insert direto pelo client (doc 06 §1.3 usage.ts);
-- leitura só staff. Colunas fixas do CLAUDE.md §8: id, tool_slug, user_id (nullable), created_at.
create table if not exists public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null check (length(tool_slug) <= 64),
  user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_tool_usage_slug_created on public.tool_usage(tool_slug, created_at desc);
create index if not exists idx_tool_usage_user on public.tool_usage(user_id) where user_id is not null;
alter table public.tool_usage enable row level security;
drop policy if exists "tool_usage: anon insert" on public.tool_usage;
create policy "tool_usage: anon insert" on public.tool_usage for insert to anon with check (user_id is null);
drop policy if exists "tool_usage: auth insert" on public.tool_usage;
create policy "tool_usage: auth insert" on public.tool_usage for insert to authenticated
  with check (user_id is null or user_id = (select auth.uid()));
drop policy if exists "tool_usage: staff read" on public.tool_usage;
create policy "tool_usage: staff read" on public.tool_usage for select using ((select public.is_admin()));

-- Estatísticas para o admin e para o Painel Lisieux
create or replace function public.tool_usage_stats(p_days integer default 30)
returns table (tool_slug text, uses bigint, unique_users bigint)
language sql stable security definer set search_path = public as $$
  select tool_slug, count(*), count(distinct user_id)
  from public.tool_usage where created_at >= now() - make_interval(days => p_days)
  group by tool_slug order by 2 desc;
$$;
revoke all on function public.tool_usage_stats(integer) from public, anon;
grant execute on function public.tool_usage_stats(integer) to authenticated;
