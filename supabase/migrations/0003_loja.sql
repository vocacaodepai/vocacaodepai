-- 0003_loja.sql — Loja do Pai: categorias de produto, produtos, checagens de faixa de preço, get_home_data

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  parent_id uuid references public.product_categories(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.product_categories enable row level security;
drop policy if exists "product_categories: public read" on public.product_categories;
create policy "product_categories: public read" on public.product_categories for select using (true);
drop policy if exists "product_categories: staff write" on public.product_categories;
create policy "product_categories: staff write" on public.product_categories
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text,
  asin text check (asin is null or asin ~ '^[A-Z0-9]{10}$'),
  affiliate_network text not null default 'amazon' check (affiliate_network in ('amazon','mercadolivre','shopee','magalu','outro')),
  affiliate_url text not null,
  marketplace_urls jsonb not null default '{}'::jsonb,
  image_url text,
  images jsonb not null default '[]'::jsonb,
  short_description text,
  description text,
  pros jsonb not null default '[]'::jsonb,
  cons jsonb not null default '[]'::jsonb,
  review jsonb,
  category_id uuid references public.product_categories(id) on delete set null,
  subcategory text,
  price numeric(10,2),
  price_min numeric(10,2),
  price_max numeric(10,2),
  price_range_checked_at timestamptz,
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  rating_count integer not null default 0,
  featured boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_range_sane check (
    price_min is null or price_max is null or (price_max >= price_min and price_max <= price_min * 3)
  )
);
create index if not exists idx_products_active_featured on public.products(active, featured, sort_order);
create index if not exists idx_products_category on public.products(category_id, subcategory);
create index if not exists idx_products_name_trgm on public.products using gin(name gin_trgm_ops);
create or replace trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
alter table public.products enable row level security;
drop policy if exists "products: public read active" on public.products;
create policy "products: public read active" on public.products for select using (active = true);
drop policy if exists "products: staff read all" on public.products;
create policy "products: staff read all" on public.products for select using ((select public.is_admin()));
drop policy if exists "products: staff insert" on public.products;
create policy "products: staff insert" on public.products for insert with check ((select public.is_admin()));
drop policy if exists "products: staff update" on public.products;
create policy "products: staff update" on public.products for update using ((select public.is_admin()));
drop policy if exists "products: staff delete" on public.products;
create policy "products: staff delete" on public.products for delete using ((select public.is_admin()));

create table if not exists public.product_price_checks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store text not null,
  price numeric(10,2) not null check (price > 0),
  url text,
  checked_at timestamptz not null default now()
);
create index if not exists idx_price_checks_product on public.product_price_checks(product_id, checked_at desc);
alter table public.product_price_checks enable row level security;
drop policy if exists "price_checks: staff read" on public.product_price_checks;
create policy "price_checks: staff read" on public.product_price_checks for select using ((select public.is_admin()));
drop policy if exists "price_checks: staff insert" on public.product_price_checks;
create policy "price_checks: staff insert" on public.product_price_checks for insert with check ((select public.is_admin()));

-- Recalcula a faixa a partir das 2+ checagens mais recentes (≤ 30 dias)
create or replace function public.refresh_price_range(p_product_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_min numeric; v_max numeric; v_n integer;
begin
  select min(price), max(price), count(*) into v_min, v_max, v_n
  from public.product_price_checks
  where product_id = p_product_id and checked_at > now() - interval '30 days';
  if v_n >= 2 and v_max <= v_min * 3 then
    update public.products set price_min = v_min, price_max = v_max, price_range_checked_at = now() where id = p_product_id;
  end if;
end; $$;
revoke all on function public.refresh_price_range(uuid) from public, anon, authenticated;

-- Produtos citados em um post (para a página de produto listar reviews e vice-versa)
create or replace function public.products_for_post(p_post_id uuid)
returns setof public.products language sql stable security definer set search_path = public as $$
  select pr.* from public.products pr
  where pr.active and pr.slug in (
    select jsonb_array_elements(coalesce(p.comparison->'products','[]'::jsonb))->>'product_slug'
    from public.posts p where p.id = p_post_id
    union
    select p.review->>'product_slug' from public.posts p where p.id = p_post_id
  );
$$;
grant execute on function public.products_for_post(uuid) to anon, authenticated;

create or replace function public.posts_for_product(p_product_slug text)
returns table (id uuid, slug text, title text, kind text, product_score numeric, cover_image_url text, publish_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.slug, p.title, p.kind, p.product_score, p.cover_image_url, p.publish_at
  from public.posts p
  where p.status = 'published' and (p.publish_at is null or p.publish_at <= now())
    and (p.review->>'product_slug' = p_product_slug
         or exists (select 1 from jsonb_array_elements(coalesce(p.comparison->'products','[]'::jsonb)) e where e->>'product_slug' = p_product_slug))
  order by p.publish_at desc;
$$;
grant execute on function public.posts_for_product(text) to anon, authenticated;

-- ---------- get_home_data ----------
create or replace function public.get_home_data()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'latest', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.kind, p.publish_at, p.reading_time,
               c.slug as category_slug, c.name as category_name
        from public.posts p left join public.categories c on c.id = p.category_id
        where p.status = 'published' and (p.publish_at is null or p.publish_at <= now()) and p.kind in ('artigo','noticia')
        order by p.publish_at desc limit 9
      ) x
    ),
    'reviews', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.kind, p.product_score, p.product_category, p.publish_at
        from public.posts p
        where p.status = 'published' and (p.publish_at is null or p.publish_at <= now()) and p.kind in ('review','comparativo','lista')
        order by p.publish_at desc limit 6
      ) x
    ),
    'products', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select id, slug, name, brand, image_url, price_min, price_max, rating, affiliate_url
        from public.products where active and featured order by sort_order, created_at desc limit 8
      ) x
    ),
    'categories', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb) from (
        select id, slug, name, icon, color, sort_order from public.categories
        where parent_id is null and sort_order < 900          -- só as 14 categorias-mãe; pai-indica/noticias ficam fora do filtro
      ) x
    ),
    'popular', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select id, slug, title, view_count from public.posts
        where status = 'published' order by view_count desc limit 5
      ) x
    )
  );
$$;
grant execute on function public.get_home_data() to anon, authenticated;

-- Taxonomia de produto: ÚNICA fonte = src/lib/pai-indica/taxonomia.ts (doc 04 §3). Os 10 slugs abaixo são
-- `productCategories` desse arquivo; `products.subcategory` e `posts.product_subcategory` usam os slugs de
-- `productSubcategories` do mesmo arquivo. "Presentes para o pai" NÃO é categoria: é a rota/tag `/loja/presentes`.
insert into public.product_categories (slug, name, icon, sort_order) values
('churrasco-e-cozinha','Churrasco e Cozinha','flame',1),
('ferramentas','Ferramentas','wrench',2),
('carro-e-moto','Carro e Moto','car',3),
('tecnologia','Tecnologia','smartphone',4),
('esporte-e-outdoor','Esporte e Outdoor','tent',5),
('bebe-e-crianca','Bebê e Criança','baby',6),
('casa-e-jardim','Casa e Jardim','home',7),
('saude-do-homem','Saúde do Homem','heart-pulse',8),
('estilo-e-barba','Estilo e Barba','shirt',9),
('livros-e-formacao','Livros e Formação','book-open',10)
on conflict (slug) do update set name = excluded.name, icon = excluded.icon, sort_order = excluded.sort_order;
