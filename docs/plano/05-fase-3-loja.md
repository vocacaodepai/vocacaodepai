# Fase 3 — Loja do Pai ("O pai também quer desconto")

> Documento de execução. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code em `/home/user/vocacaodepai`.
> Base de código: clone adaptado de `/home/user/vocacaodemae` (só leitura, serve de referência).
> Pré-requisitos: Fase 1 (fundação: `0001_core.sql`, `0002_blog.sql`, layout `_site`, auth, admin básico) e Fase 2
> (Pai Indica: posts com `kind`, `review`, `comparison`) concluídas. Veja `docs/plano/03-fase-1-fundacao.md` e `04-fase-2-pai-indica-reviews.md`.
> Se `docs/plano/02-arquitetura-e-stack.md` existir e divergir deste documento em nome de coluna ou tabela, **ele prevalece**.

Nomes fixos usados aqui (DECISÕES FIXAS do briefing):

| Item | Valor |
|---|---|
| Nome da seção | Loja do Pai |
| Slogan | O pai também quer desconto |
| Rotas | `/loja`, `/loja/categoria/$slug`, `/loja/$slug`, `/politica-de-afiliados` |
| Tabelas | `products`, `product_categories`, `product_price_checks` |
| Migration | `supabase/migrations/0003_loja.sql` |
| Bucket Storage | `products` (público para leitura) |
| Botão de compra | **sempre** "Comprar agora na Amazon" (nunca "Ver preço na Amazon") |
| Preço | **sempre** faixa pesquisada na internet (2 lojas, mesmo item, `max ≤ 3×min`), nunca preço exato |
| Tag de afiliado | variável de ambiente `PUBLIC_AMAZON_TAG` (ex.: `vocacaodepai-20`) |
| Site | `https://vocacaodepai.com.br` |
| Supabase | projeto novo, região `sa-east-1`, ref `<SUPABASE_PROJECT_REF>` |

---

## 1. Conceito, promessa e aviso de afiliado

### 1.1 Conceito

A Loja do Pai não é um e-commerce: é uma **curadoria com review**. Cada produto tem ficha, galeria com fotos oficiais, prós e
contras, faixa de preço pesquisada na internet, uma review longa com veredito de 0 a 10 e um único botão de ação:
"Comprar agora na Amazon" (link de afiliado). O leitor compra na Amazon; nós ganhamos comissão. Mais tarde, outros
marketplaces (Mercado Livre, Shopee) entram no mesmo produto via `affiliate_network` + `marketplace_urls` (seção 9).

Promessa para o leitor (texto que vai no topo de `/loja`):

> **O pai também quer desconto.** Aqui só entra o que a gente colocaria na própria casa, na própria oficina ou na
> própria churrasqueira: produto bom, com marca e modelo de verdade, análise honesta e a faixa de preço que você
> encontra hoje na internet. Sem achismo, sem preço inventado.

Diferença em relação ao Vocação de Mãe: lá a loja fala de enxoval, bebê e gestante; aqui fala de **churrasco, ferramentas,
carro, tecnologia, outdoor, paternidade prática, livros, barba, casa e presentes**. A mecânica (faixa de preço, review longa,
fotos oficiais, botão Amazon) é **idêntica** e deve ser copiada, não reinventada.

### 1.2 Aviso de afiliado — texto EXATO do rodapé (todas as páginas de `/loja/*` e artigos do Pai Indica com produto)

```
Aviso de transparência: o Vocação de Pai participa do Programa de Associados da Amazon Brasil. Os links "Comprar agora na Amazon"
são links de afiliado: se você comprar por eles, podemos receber uma comissão, sem custo extra para você. As faixas de preço
mostradas foram pesquisadas na internet em várias lojas e não são o preço da Amazon; o valor do dia pode ser diferente.
```

Arquivo: `src/components/store/AffiliateNotice.tsx` (componente de uma frase, usado em `ProductPage`, `StorePage`, `StoreCategoryPage`
e no `PostPage` quando o post tem `kind in ('review','comparativo','lista')`).

### 1.3 Página `/politica-de-afiliados` — texto EXATO

Arquivo: `src/routes/_site/politica-de-afiliados.tsx` (componente estático, sem loader). Conteúdo:

```
# Política de afiliados

O Vocação de Pai (vocacaodepai.com.br) é um site editorial independente mantido pelo grupo VDP. Para financiar o conteúdo,
participamos de programas de afiliados. Esta página explica como isso funciona.

## Amazon Associados
O Vocação de Pai é participante do Programa de Associados da Amazon Brasil, um programa de publicidade de afiliados que oferece
um meio de ganhar comissões ao anunciar e linkar para a Amazon.com.br. Quando você clica em um botão "Comprar agora na Amazon"
e conclui uma compra, podemos receber uma comissão. Isso não altera o preço que você paga.

## Como escolhemos os produtos
Os produtos entram na Loja do Pai por critério editorial: utilidade real para o pai e para a casa, reputação da marca,
ficha técnica, manual do fabricante e opiniões de compradores fora da Amazon (Reclame Aqui, outras lojas, fóruns, vídeos).
Nenhuma marca paga para aparecer. A comissão não muda a nota nem o veredito.

## Preços
Não mostramos o preço exato de nenhuma loja. Mostramos uma faixa de preço pesquisada na internet, em pelo menos duas lojas
diferentes, com a data da pesquisa. A faixa não é o preço da Amazon e pode estar desatualizada: confira sempre o valor na
página da loja antes de comprar.

## Testes
Nossas análises se baseiam na ficha técnica, no manual do fabricante, nos anúncios oficiais e em opiniões públicas de
compradores. Quando um produto foi testado fisicamente por nossa equipe, isso é dito no texto. Quando não foi, também.

## Outros programas
Podemos vir a participar de programas de afiliados de outros marketplaces (como Mercado Livre e Shopee). Quando isso acontecer,
o botão correspondente indicará a loja de destino e esta página será atualizada.

## Contato
Dúvidas sobre esta política: use a página /contato.
Última atualização: {data da publicação}.
```

Critério: a frase "participante do Programa de Associados da Amazon Brasil" **precisa** existir (exigência do programa).

---

## 2. Migration `supabase/migrations/0003_loja.sql` (completa)

Pressupostos vindos de `0001_core.sql`: existem `public.profiles`, a função `public.is_admin()` (retorna `boolean`, `security definer`,
`profiles.role = 'admin'`) e a função de gatilho `public.set_updated_at()`. Se `set_updated_at()` não existir em `0001`, o bloco
`create or replace function public.set_updated_at()` abaixo cria (é idempotente).

Passos:

1. `ls /home/user/vocacaodepai/supabase/migrations/` — confirmar que `0001_core.sql` e `0002_blog.sql` existem e que `0003_loja.sql` **não** existe.
2. Criar o arquivo com o conteúdo abaixo, sem alterar nomes de coluna.
3. Aplicar: `supabase db push` (CLI linkada ao `<SUPABASE_PROJECT_REF>`) **ou** `mcp__Supabase__apply_migration` com `name = "0003_loja"`.
4. Validar com as queries da seção 2.2.

### 2.1 Conteúdo do arquivo

```sql
-- 0003_loja.sql — Loja do Pai ("O pai também quer desconto")
-- Tabelas: product_categories, products, product_price_checks. Bucket: products.
-- Regras: anon lê só active = true; admin (public.is_admin()) edita; preço exibido é FAIXA (price_min/price_max).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- product_categories
create table if not exists public.product_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int  not null default 0
);
comment on table public.product_categories is 'As 10 categorias da Loja do Pai. Ícone lucide fica no código (src/lib/store-categories.ts).';

-- ---------------------------------------------------------------- products
create table if not exists public.products (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  name                    text not null,
  brand                   text,
  asin                    text,
  affiliate_network       text not null default 'amazon'
                            check (affiliate_network in ('amazon','mercadolivre','shopee','outro')),
  affiliate_url           text,
  marketplace_urls        jsonb not null default '{}'::jsonb,
  image_url               text,
  images                  jsonb not null default '[]'::jsonb,
  short_description       text,
  description             text,
  pros                    jsonb not null default '[]'::jsonb,
  cons                    jsonb not null default '[]'::jsonb,
  review                  jsonb,
  category_id             uuid references public.product_categories(id) on delete set null,
  subcategory             text,
  price                   numeric(10,2),
  price_min               numeric(10,2),
  price_max               numeric(10,2),
  price_range_checked_at  timestamptz,
  rating                  numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  rating_count            int,
  featured                boolean not null default false,
  sort_order              int not null default 0,
  active                  boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint products_asin_unique unique (asin),
  constraint products_price_range_ok check (
    price_min is null or price_max is null or (price_min > 0 and price_max >= price_min and price_max <= price_min * 3)
  ),
  constraint products_images_is_array check (jsonb_typeof(images) = 'array'),
  constraint products_pros_is_array   check (jsonb_typeof(pros) = 'array'),
  constraint products_cons_is_array   check (jsonb_typeof(cons) = 'array')
);
comment on column public.products.price is 'Último preço de referência (numeric). NUNCA exibido; serve só para a faixa estimada -15%/+20%.';
comment on column public.products.price_min is 'Menor preço encontrado na internet (2 lojas, mesmo item). Exibido como faixa.';
comment on column public.products.price_max is 'Maior preço encontrado. Regra: max <= 3 * min (constraint).';
comment on column public.products.review is 'Review longa (nota 0-10, 5 critérios, em_3_pontos, secoes[], ficha[], faq[{q,a}], opiniao, como_avaliamos, preco_texto, ideal_para).';
comment on column public.products.images is 'Array JSON de até 8 URLs de fotos oficiais em alta (Amazon _AC_SL1500_).';
comment on column public.products.marketplace_urls is 'Previsão multi-marketplace: {"mercadolivre": "https://...", "shopee": "https://..."}';

create index if not exists products_category_active_idx on public.products (category_id, active, sort_order);
create index if not exists products_featured_idx on public.products (featured) where active;
create index if not exists products_price_queue_idx on public.products (price_range_checked_at nulls first, featured desc, sort_order) where active;
create index if not exists products_search_idx on public.products
  using gin (to_tsvector('portuguese', coalesce(name,'') || ' ' || coalesce(brand,'') || ' ' || coalesce(short_description,'')));

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- product_price_checks
create table if not exists public.product_price_checks (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  store       text not null,
  price       numeric(10,2) not null check (price > 0),
  url         text,
  checked_at  timestamptz not null default now()
);
comment on table public.product_price_checks is 'Histórico da pesquisa de faixa: uma linha por loja consultada (mínimo 2 por rodada).';
create index if not exists product_price_checks_product_idx on public.product_price_checks (product_id, checked_at desc);

-- ---------------------------------------------------------------- RLS
alter table public.product_categories enable row level security;
alter table public.products            enable row level security;
alter table public.product_price_checks enable row level security;

-- Leitura pública
drop policy if exists "product_categories: public read" on public.product_categories;
create policy "product_categories: public read" on public.product_categories
  for select using (true);

drop policy if exists "products: public read active" on public.products;
create policy "products: public read active" on public.products
  for select using (active = true);

drop policy if exists "products: admin read all" on public.products;
create policy "products: admin read all" on public.products
  for select using ((select public.is_admin()));

-- Escrita: só admin
drop policy if exists "product_categories: admin write" on public.product_categories;
create policy "product_categories: admin write" on public.product_categories
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "products: admin insert" on public.products;
create policy "products: admin insert" on public.products
  for insert with check ((select public.is_admin()));
drop policy if exists "products: admin update" on public.products;
create policy "products: admin update" on public.products
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "products: admin delete" on public.products;
create policy "products: admin delete" on public.products
  for delete using ((select public.is_admin()));

drop policy if exists "product_price_checks: admin all" on public.product_price_checks;
create policy "product_price_checks: admin all" on public.product_price_checks
  for all using ((select public.is_admin())) with check ((select public.is_admin()));
-- Histórico de preço é visível ao público (transparência da faixa)
drop policy if exists "product_price_checks: public read" on public.product_price_checks;
create policy "product_price_checks: public read" on public.product_price_checks
  for select using (exists (select 1 from public.products p where p.id = product_id and p.active));

grant select on public.product_categories, public.products, public.product_price_checks to anon, authenticated;
grant insert, update, delete on public.product_categories, public.products, public.product_price_checks to authenticated;
grant all on public.product_categories, public.products, public.product_price_checks to service_role;

-- ---------------------------------------------------------------- Storage bucket "products"
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('products', 'products', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true;

drop policy if exists "products bucket: public read" on storage.objects;
create policy "products bucket: public read" on storage.objects
  for select using (bucket_id = 'products');
drop policy if exists "products bucket: admin write" on storage.objects;
create policy "products bucket: admin write" on storage.objects
  for all using (bucket_id = 'products' and (select public.is_admin()))
  with check (bucket_id = 'products' and (select public.is_admin()));

-- ---------------------------------------------------------------- Categorias (10)
insert into public.product_categories (slug, name, description, sort_order) values
 ('churrasco-e-cozinha',  'Churrasco e Cozinha',   'Facas, tábuas, chapas, termômetros e o que faz diferença no fogo e na cozinha do pai.', 1),
 ('ferramentas',          'Ferramentas',           'Furadeiras, parafusadeiras, kits e medição para consertar a casa sem chamar ninguém.', 2),
 ('carro-e-moto',         'Carro e Moto',          'Manutenção, limpeza, segurança e acessórios para quem cuida do próprio veículo.', 3),
 ('tecnologia',           'Tecnologia',            'Eletrônicos úteis de verdade: leitura, som, energia, casa conectada e rede.', 4),
 ('esporte-e-outdoor',    'Esporte e Outdoor',     'Acampamento, trilha, bola no quintal e equipamento para sair de casa com os filhos.', 5),
 ('paternidade-pratica',  'Paternidade Prática',   'Canguru, cadeirinha, babá eletrônica e tudo que o pai usa com o filho no colo.', 6),
 ('livros-e-formacao',    'Livros e Formação',     'Leitura para ser um homem, um marido e um pai melhor: finanças, hábitos, fé e família.', 7),
 ('estilo-e-barba',       'Estilo e Barba',        'Barba, cabelo, perfume e relógio: cuidar de si com simplicidade.', 8),
 ('casa-e-jardim',        'Casa e Jardim',         'Lavadora de pressão, grama, mangueira, escada e segurança da casa.', 9),
 ('presentes-para-o-pai', 'Presentes para o Pai',  'Ideias testadas para Dia dos Pais, aniversário e Natal, por faixa de preço.', 10)
on conflict (slug) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;
```

### 2.2 Validação da migration (rodar no SQL do Supabase)

```sql
select count(*) from public.product_categories;                 -- esperado: 10
select relrowsecurity from pg_class where relname = 'products'; -- esperado: true
select policyname from pg_policies where tablename = 'products' order by 1;
-- esperado: "products: admin delete", "products: admin insert", "products: admin read all", "products: admin update", "products: public read active"
select id, public from storage.buckets where id = 'products';   -- esperado: products | true
```

Teste de RLS como anon (via REST, com a anon key): `GET /rest/v1/products?select=slug&active=eq.false` deve voltar `[]` mesmo
que exista produto inativo.

---

## 3. As 10 categorias da Loja do Pai

Arquivo de código: `src/lib/store-categories.ts` (ícone lucide e textos de UI; o banco guarda só slug/nome/descrição/ordem).

| # | slug | Nome | Descrição curta (card) | Ícone lucide |
|---|---|---|---|---|
| 1 | `churrasco-e-cozinha` | Churrasco e Cozinha | Facas, tábuas, chapas, termômetros e o que faz diferença no fogo. | `Flame` |
| 2 | `ferramentas` | Ferramentas | Furadeiras, parafusadeiras, kits e medição para consertar a casa. | `Wrench` |
| 3 | `carro-e-moto` | Carro e Moto | Manutenção, limpeza, segurança e acessórios do veículo. | `Car` |
| 4 | `tecnologia` | Tecnologia | Eletrônicos úteis: leitura, som, energia, casa conectada e rede. | `Cpu` |
| 5 | `esporte-e-outdoor` | Esporte e Outdoor | Acampamento, trilha, bola no quintal e equipamento para sair com os filhos. | `Tent` |
| 6 | `paternidade-pratica` | Paternidade Prática | Canguru, cadeirinha, babá eletrônica: o que o pai usa com o filho no colo. | `Baby` |
| 7 | `livros-e-formacao` | Livros e Formação | Leitura para ser homem, marido e pai melhor. | `BookOpen` |
| 8 | `estilo-e-barba` | Estilo e Barba | Barba, cabelo, perfume e relógio. | `Scissors` |
| 9 | `casa-e-jardim` | Casa e Jardim | Lavadora de pressão, grama, mangueira, escada e segurança da casa. | `Home` |
| 10 | `presentes-para-o-pai` | Presentes para o Pai | Ideias para Dia dos Pais, aniversário e Natal, por faixa de preço. | `Gift` |

```ts
// src/lib/store-categories.ts
import { Baby, BookOpen, Car, Cpu, Flame, Gift, Home, Scissors, Tent, Wrench, type LucideIcon } from "lucide-react";

export interface StoreCategoryMeta { slug: string; icon: LucideIcon; seoTitle: string; seoDescription: string }

export const STORE_CATEGORY_META: Record<string, StoreCategoryMeta> = {
  "churrasco-e-cozinha":  { slug: "churrasco-e-cozinha",  icon: Flame,    seoTitle: "Churrasco e Cozinha",   seoDescription: "Facas, tábuas, chapas e termômetros com review honesta e faixa de preço pesquisada." },
  "ferramentas":          { slug: "ferramentas",          icon: Wrench,   seoTitle: "Ferramentas",           seoDescription: "Furadeiras, parafusadeiras e kits para consertar a casa, analisados pelo Vocação de Pai." },
  "carro-e-moto":         { slug: "carro-e-moto",         icon: Car,      seoTitle: "Carro e Moto",          seoDescription: "Manutenção, limpeza e segurança do veículo com review e faixa de preço." },
  "tecnologia":           { slug: "tecnologia",           icon: Cpu,      seoTitle: "Tecnologia",            seoDescription: "Eletrônicos úteis de verdade, com prós, contras e veredito." },
  "esporte-e-outdoor":    { slug: "esporte-e-outdoor",    icon: Tent,     seoTitle: "Esporte e Outdoor",     seoDescription: "Acampamento, trilha e esporte com os filhos: equipamento analisado." },
  "paternidade-pratica":  { slug: "paternidade-pratica",  icon: Baby,     seoTitle: "Paternidade Prática",   seoDescription: "Canguru, cadeirinha e babá eletrônica: o que o pai usa no dia a dia." },
  "livros-e-formacao":    { slug: "livros-e-formacao",    icon: BookOpen, seoTitle: "Livros e Formação",     seoDescription: "Leitura para ser homem, marido e pai melhor." },
  "estilo-e-barba":       { slug: "estilo-e-barba",       icon: Scissors, seoTitle: "Estilo e Barba",        seoDescription: "Barba, cabelo, perfume e relógio com review honesta." },
  "casa-e-jardim":        { slug: "casa-e-jardim",        icon: Home,     seoTitle: "Casa e Jardim",         seoDescription: "Lavadora de pressão, grama e segurança da casa, analisados." },
  "presentes-para-o-pai": { slug: "presentes-para-o-pai", icon: Gift,     seoTitle: "Presentes para o Pai",  seoDescription: "Ideias de presente para o pai por faixa de preço, com review." },
};

export const DEFAULT_CATEGORY_ICON = Gift;
```

Subcategorias são texto livre em `products.subcategory` (ex.: `facas`, `parafusadeiras`, `limpeza`, `leitura`, `canguru`), sem tabela própria.
Regra: minúsculas, sem acento, hífen (`slugify`). O filtro de subcategoria em `/loja/categoria/$slug` é montado a partir dos valores
distintos existentes.

---

## 4. Páginas — o que copiar do vocacaodemae e o que adaptar, arquivo por arquivo

Caminhos de origem (confirmados com `ls` em `/home/user/vocacaodemae`):

```
src/routes/_site/loja/index.tsx          (45 linhas)   -> copiar e adaptar
src/routes/_site/loja/$slug.tsx          (85 linhas)   -> copiar e adaptar
src/pages/StorePage.tsx                  (510 linhas)  -> copiar e adaptar (remover i18n)
src/pages/ProductPage.tsx                (505 linhas)  -> copiar e adaptar (remover i18n, age_range)
src/components/store/ProductCard.tsx     (113 linhas)  -> copiar e adaptar (remover i18n, badge)
src/components/store/ProductReviewArticle.tsx (239)    -> copiar e adaptar (textos "Review de Mãe" -> "Review do Pai")
src/components/store/StorePromo.tsx      (46 linhas)   -> copiar e adaptar
src/lib/price-range.ts                   (53 linhas)   -> herdar (ver seção 5)
src/lib/hub.functions.ts (getStoreData, getProductData) -> copiar os 2 server functions
src/lib/queries.ts (queryStoreProducts, queryProductBySlug) -> copiar e adaptar (category_id em vez de category texto)
src/lib/seo.ts (productJsonLd, breadcrumbJsonLd)       -> herdar
src/lib/types.ts (interface Product)                   -> reescrever conforme COLUNAS-CHAVE
```

Antes de cada cópia: `cat` o arquivo de origem inteiro. **Remover** toda chamada `useTranslation`/`t("store.*")` e escrever a string em PT-BR
direto no JSX (o site não tem i18n). Remover `@/lib/router-compat` se a Fase 1 já padronizou `Link` de `@tanstack/react-router`
(conferir em `src/components/layout/Header.tsx` qual import está em uso e seguir o mesmo).

### 4.1 `src/lib/types.ts` — interface `Product` (novo)

```ts
export interface ProductReviewCriterion { nome: string; nota: number }
export interface ProductReviewSection { titulo: string; paragrafos: string[]; cta?: boolean }
export interface ProductReviewData {
  titulo: string; resumo: string; nota: number;            // 0-10, 1 casa decimal
  criterios: ProductReviewCriterion[];                     // exatamente 5
  ideal_para: string; em_3_pontos: string[];               // 3
  secoes: ProductReviewSection[];                          // >= 6, >= 3 com cta
  preco_texto: string; ficha: string[];                    // >= 5 linhas
  como_avaliamos: string; opiniao: string;
  faq: { q: string; a: string }[];                         // >= 4
  atualizado_em?: string;
}
export interface ProductCategory { id: string; slug: string; name: string; description: string | null; sort_order: number }
export interface Product {
  id: string; slug: string; name: string; brand: string | null; asin: string | null;
  affiliate_network: "amazon" | "mercadolivre" | "shopee" | "outro";
  affiliate_url: string | null; marketplace_urls: Record<string, string>;
  image_url: string | null; images: string[];
  short_description: string | null; description: string | null;
  pros: string[]; cons: string[]; review: ProductReviewData | null;
  category_id: string | null; category?: ProductCategory | null; subcategory: string | null;
  price: number | null; price_min: number | null; price_max: number | null; price_range_checked_at: string | null;
  rating: number | null; rating_count: number | null;
  featured: boolean; sort_order: number; active: boolean; created_at: string; updated_at: string;
}
```

### 4.2 `src/lib/affiliate.ts` (novo)

```ts
const AMAZON_RE = /amazon\.com\.br\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i;
export function amazonTag(): string {
  return process.env.PUBLIC_AMAZON_TAG ?? "vocacaodepai-20"; // só no servidor (loader/server fn)
}
export function buildAmazonUrl(asin: string, tag = amazonTag()): string {
  return `https://www.amazon.com.br/dp/${asin}?tag=${encodeURIComponent(tag)}&linkCode=ssc`;
}
export function asinFromUrl(url: string | null | undefined): string | null {
  const m = url ? AMAZON_RE.exec(url) : null; return m ? m[1].toUpperCase() : null;
}
/** Garante a tag atual no link salvo no banco. Chamar no server fn, antes de devolver o produto. */
export function normalizeAffiliate(p: { asin: string | null; affiliate_url: string | null; affiliate_network: string }) {
  if (p.affiliate_network !== "amazon") return p.affiliate_url;
  const asin = p.asin ?? asinFromUrl(p.affiliate_url);
  return asin ? buildAmazonUrl(asin) : p.affiliate_url;
}
```

Variável de ambiente: `PUBLIC_AMAZON_TAG` em `.env.example`, `.env.local` e no projeto Vercel (Production + Preview). Nunca expor
service role. A tag entra no link **no servidor** (`hub.functions.ts`), então o cliente nunca precisa dela.

### 4.3 `src/lib/queries.ts` — adicionar

```ts
const PRODUCT_CARD_SELECT =
  "id,slug,name,brand,image_url,short_description,price,price_min,price_max,price_range_checked_at,rating,rating_count,featured,sort_order,subcategory,category_id,affiliate_url,affiliate_network,asin,active,category:product_categories(id,slug,name,sort_order)";

export async function queryProductCategories(db: DbClient): Promise<ProductCategory[]> {
  const { data, error } = await db.from("product_categories").select("*").order("sort_order");
  if (error) throw error; return (data ?? []) as ProductCategory[];
}
export async function queryStoreProducts(db: DbClient, o: { categorySlug?: string; featured?: boolean; limit?: number; light?: boolean } = {}) {
  let q = db.from("products").select(o.light ? PRODUCT_CARD_SELECT : "*, category:product_categories(id,slug,name,sort_order)")
    .eq("active", true).order("featured", { ascending: false }).order("sort_order", { ascending: true });
  if (o.featured) q = q.eq("featured", true);
  if (o.categorySlug) q = q.eq("product_categories.slug", o.categorySlug); // ou filtrar em memória após select
  if (o.limit) q = q.limit(o.limit);
  const { data, error } = await q; if (error) throw error;
  return (data ?? []) as unknown as Product[];
}
export async function queryProductBySlug(db: DbClient, slug: string): Promise<Product | null> { /* igual ao vocacaodemae, com o join de categoria */ }
export async function queryPostsMentioningProduct(db: DbClient, slug: string, limit = 3) {
  // Artigos do Pai Indica que citam o produto: busca o slug dentro do body (nó product/fotosModelos) ou no comparison
  const { data, error } = await db.from("posts")
    .select("id,slug,title,excerpt,cover_image_url,kind,publish_at")
    .eq("status", "published").in("kind", ["review", "comparativo", "lista"])
    .or(`body::text.ilike.%"slug":"${slug}"%,comparison::text.ilike.%"${slug}"%`)
    .order("publish_at", { ascending: false }).limit(limit);
  if (error) throw error; return data ?? [];
}
```

Observação: o filtro por slug de categoria via join nem sempre funciona com PostgREST em `select` embutido; a forma segura é buscar
`category_id` por slug primeiro (`queryProductCategories`) e filtrar `.eq("category_id", id)`. Fazer assim no server fn.

### 4.4 `src/lib/hub.functions.ts` — server functions (copiar `getStoreData`/`getProductData` e adaptar)

```ts
export const getStoreData = createServerFn({ method: "GET" }).handler(async () => {
  const db = await createReadOnlySupabaseClient();
  const [categories, products] = await Promise.all([
    safe(queryProductCategories(db), [] as ProductCategory[]),
    safe(queryStoreProducts(db, { light: true }), [] as Product[]),
  ]);
  return { categories, products: products.map((p) => ({ ...p, affiliate_url: normalizeAffiliate(p) })) };
});

export const getStoreCategoryData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    const categories = await safe(queryProductCategories(db), [] as ProductCategory[]);
    const category = categories.find((c) => c.slug === data.slug) ?? null;
    if (!category) return null;
    const all = await safe(queryStoreProducts(db, { light: true }), [] as Product[]);
    const products = all.filter((p) => p.category_id === category.id).map((p) => ({ ...p, affiliate_url: normalizeAffiliate(p) }));
    return { category, categories, products };
  });

export const getProductData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    const product = await safe(queryProductBySlug(db, data.slug), null);
    if (!product) return null;
    const [all, relatedPosts, priceChecks] = await Promise.all([
      safe(queryStoreProducts(db, { light: true }), [] as Product[]),
      safe(queryPostsMentioningProduct(db, product.slug, 3), []),
      safe(queryPriceChecks(db, product.id, 6), []),
    ]);
    const others = all.filter((x) => x.id !== product.id);
    const sameSub = others.filter((x) => x.category_id === product.category_id && x.subcategory === product.subcategory);
    const sameCat = others.filter((x) => x.category_id === product.category_id && x.subcategory !== product.subcategory);
    const rest = others.filter((x) => x.category_id !== product.category_id);
    return {
      product: { ...product, affiliate_url: normalizeAffiliate(product) },
      similar: [...sameSub, ...sameCat, ...rest].slice(0, 4).map((p) => ({ ...p, affiliate_url: normalizeAffiliate(p) })),
      relatedPosts, priceChecks,
    };
  });
```

### 4.5 `/loja` — `src/routes/_site/loja/index.tsx` + `src/pages/StorePage.tsx`

Copiar os dois arquivos do vocacaodemae. Adaptar:

1. `head`: título `Loja do Pai | Vocação de Pai`; descrição `"O pai também quer desconto: produtos para churrasco, ferramentas, carro, tecnologia e paternidade, com review honesta e faixa de preço pesquisada."`; `og:url`/canonical `https://vocacaodepai.com.br/loja` (manter o tratamento de `?categoria=`/`?subcategoria=` como no original).
2. `loader: () => getStoreData()`.
3. `StorePage`: hero com o slogan e a promessa (seção 1.1); **faixa de 10 cards de categoria** (ícone de `STORE_CATEGORY_META`, nome, contagem de produtos, link para `/loja/categoria/$slug`); bloco "Destaques do Pai" (`featured = true`, até 8); busca local por `name`/`brand`/`short_description` (input `?q=`); grade de todos os produtos com filtro por categoria (chips) e subcategoria (select), ordenação `featured desc, sort_order`.
4. Remover `age_range`, `audience`, `badge`, `old_price`, tudo de i18n.
5. Rodapé da página: `<AffiliateNotice />`.

### 4.6 `/loja/categoria/$slug` — `src/routes/_site/loja/categoria/$slug.tsx` + `src/pages/StoreCategoryPage.tsx` (novos)

```ts
// src/routes/_site/loja/categoria/$slug.tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import StoreCategoryPage from "@/pages/StoreCategoryPage";
import { getStoreCategoryData } from "@/lib/hub.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { STORE_CATEGORY_META } from "@/lib/store-categories";

const SITE_URL = "https://vocacaodepai.com.br";

export const Route = createFileRoute("/_site/loja/categoria/$slug")({
  loader: async ({ params }) => {
    const data = await getStoreCategoryData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const meta = STORE_CATEGORY_META[params.slug];
    const name = loaderData?.category.name ?? meta?.seoTitle ?? "Categoria";
    const url = `${SITE_URL}/loja/categoria/${params.slug}`;
    const title = `${name} | Loja do Pai | Vocação de Pai`;
    const description = meta?.seoDescription ?? loaderData?.category.description ?? "";
    return {
      meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title },
             { property: "og:description", content: description }, { property: "og:type", content: "website" }, { property: "og:url", content: url }],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(breadcrumbJsonLd([{ name: "Loja do Pai", path: "/loja" }, { name, path: `/loja/categoria/${params.slug}` }])) }],
    };
  },
  component: StoreCategoryPage,
});
```

`StoreCategoryPage`: cabeçalho (ícone + nome + descrição), chips de subcategoria (distintos de `products.subcategory`), grade de `ProductCard`,
"Outras categorias" (9 restantes) e `<AffiliateNotice />`. Também emitir JSON-LD `ItemList` com os produtos (`url` de cada `/loja/$slug`).

### 4.7 `/loja/$slug` — `src/routes/_site/loja/$slug.tsx` + `src/pages/ProductPage.tsx`

Copiar os dois arquivos. Adaptar, bloco a bloco, de cima para baixo em `ProductPage.tsx`:

| Bloco (vocacaodemae) | O que fazer no Vocação de Pai |
|---|---|
| Galeria (`product.images`, setas, miniaturas, contador `n / N`) | **Herdar.** `images` agora é `jsonb` lido como `string[]` (até 8). Alt = `${product.name} — foto ${i+1}`. `object-contain`, 4:3. |
| Nome, marca, estrelas (`rating`/`review_count`) | Herdar; renomear `review_count` → `rating_count`. Mostrar "nota de compradores" com 1 casa decimal. |
| Faixa de preço | Herdar `productPriceRange`. Texto EXATO quando `kind === "market"`: **"Faixa pesquisada na internet em {dd/mm}: {R$ X a R$ Y}. Não é o preço da Amazon."** Quando `estimate`: **"Faixa estimada: {R$ X a R$ Y}. É só uma estimativa, não o preço da Amazon."** |
| Botão principal | `<a href={product.affiliate_url} target="_blank" rel="noopener noreferrer sponsored nofollow">` com texto **"Comprar agora na Amazon"** e ícone `ShoppingBag`. Se `affiliate_network !== 'amazon'`, texto "Comprar agora no Mercado Livre"/"na Shopee" (seção 9). |
| `t("store.affiliateNote")` | Substituir por `<AffiliateNotice />`. |
| "O que amamos / o que não gostamos" | Renomear para **"Prós" / "Contras"** (listas `pros`/`cons`). |
| `age_range`, `audience`, `badge`, `isbn` | **Remover** (não existem na Loja do Pai). |
| `ProductReviewArticle` | Herdar; rótulo `Review do Pai`, `id="review-do-pai"`, título da opinião "A opinião do Vocação de Pai". |
| "Produtos parecidos" (`similar`) | Herdar (4 cards, ordem: mesma subcategoria → mesma categoria → resto). |
| "Artigos relacionados" (`relatedPosts`) | Renomear para **"No Pai Indica"**: posts que citam o produto (`queryPostsMentioningProduct`). Link para `/pai-indica/$slug`. Se vazio, não renderizar. |
| `StickyBuyBar` (barra fixa no mobile) | Herdar se existir em `src/components/store/`; senão criar: nome + faixa + botão "Comprar agora na Amazon", `position: fixed; bottom: 0` só em `< md`. |
| Rodapé | `<AffiliateNotice />` + histórico curto "Onde pesquisamos o preço" (lista de `priceChecks`: loja + data, **sem o valor**). |

Rota `$slug.tsx`: copiar; trocar `SITE_URL`, sufixo `| Vocação de Pai`; em `productJsonLd` manter `price: null` (não declarar `Offer` exato) e
passar `brand`, `rating` (0-5) e `reviewCount: product.rating_count`. Acrescentar um segundo bloco JSON-LD `Review` quando `product.review` existir:

```ts
{
  "@context": "https://schema.org", "@type": "Review",
  itemReviewed: { "@type": "Product", name: product.name, brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined, image: product.image_url },
  author: { "@type": "Organization", name: "Vocação de Pai" },
  reviewRating: { "@type": "Rating", ratingValue: product.review.nota, bestRating: 10, worstRating: 0 },
  name: product.review.titulo, reviewBody: product.review.resumo,
  datePublished: product.review.atualizado_em ?? product.updated_at.slice(0, 10),
}
```

### 4.8 `src/components/store/ProductCard.tsx`

Copiar. Trocar `t("store.seePrice")` → `"Ver faixa de preço"`, `t("store.seeProduct")` → `"Ver análise"`, `aria-label` do botão → `"Comprar agora na Amazon - {nome}"`.
Mostrar `product.category?.name` (join) em vez de `product.category` texto. Remover `badge`. Quando `review?.nota` vier no select light
(adicionar `review->nota` só se necessário; alternativa: coluna virtual não — manter simples e mostrar só estrelas de compradores).

### 4.9 `src/components/store/StorePromo.tsx`

Copiar. Títulos: "Da Loja do Pai" / "O pai também quer desconto: quatro destaques com review." / "Ver a loja". Troca `fetchStoreProducts` por
chamada ao server fn `getStoreData` filtrando `featured` (ou aceitar `products` por prop vindos do loader da página hospedeira — preferir prop,
evita fetch no cliente).

### 4.10 Header / Footer

Adicionar item de menu **"Loja do Pai"** → `/loja` (ordem definida na Fase 1). No rodapé, link "Política de afiliados" → `/politica-de-afiliados`.

---

## 5. `src/lib/price-range.ts` — herdar (faixa de mercado vs. estimativa -15%/+20%)

Copiar o arquivo inteiro de `/home/user/vocacaodemae/src/lib/price-range.ts`. Única adaptação: `price` passa a ser `numeric` (número), então
`parseBRL` precisa aceitar número **ou** texto:

```ts
function parseBRL(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const n = Number.parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
export interface PriceRangeInput { price?: string | number | null; price_min?: number | null; price_max?: number | null; price_range_checked_at?: string | null }
```

Regras herdadas (não mudar): `LOW_FACTOR = 0.85`, `HIGH_FACTOR = 1.2`; faixa de mercado só quando `price_min > 0 && price_max >= price_min`;
`kind: "market"` traz `checkedOn` em `dd/mm`; `kind: "estimate"` nunca é apresentado como preço da Amazon; formatação `R$ 1.234` sem centavos.

Teste rápido (vitest, `src/lib/price-range.test.ts`):

```ts
import { productPriceRange } from "./price-range";
test("mercado", () => expect(productPriceRange({ price_min: 100, price_max: 150, price_range_checked_at: "2026-10-24T10:00:00Z" })).toEqual({ text: "R$ 100 a R$ 150", kind: "market", checkedOn: "24/10" }));
test("estimativa", () => expect(productPriceRange({ price: 100 })).toEqual({ text: "R$ 85 a R$ 120", kind: "estimate", checkedOn: null }));
test("sem preço", () => expect(productPriceRange({})).toBeNull());
```

---

## 6. Widget de produto dentro de artigos (nó Tiptap `fotosModelos` / `product`)

### 6.1 Como o vocacaodemae faz (referência)

- `src/components/blog/FotosModelosExtension.ts`: `Node.create({ name: "fotosModelos", group: "block", atom: true, draggable: true })`, com um único
  atributo `data` (JSON) serializado em `data-fotos-modelos-json`. `parseHTML: div[data-fotos-modelos]`. `renderHTML` devolve um `div` placeholder
  com classe `fotos-modelos-placeholder` e o texto "Fotos dos modelos (5 lado a lado)".
- `src/components/blog/FotosModelos.tsx`: tipos `FotoModelo { src, name, href, slug? }` e `FotosModelosData { modelos: FotoModelo[] }`; o widget React
  mostra as fotos lado a lado, com a faixa de preço (`productPriceRange`) e o botão "Comprar agora na Amazon" por produto, buscando o produto
  na loja pelo `slug` quando presente.
- `src/lib/tiptap-html.ts` (SSR): `case "fotosModelos"` → `<div data-fotos-modelos="" data-fotos-modelos-json="…" class="fotos-modelos-placeholder">`.
  Há também `buyCard` (`data-buy-card`) e `galeriaProduto` (`data-galeria-produto`).
- `src/components/blog/ToolEmbedHost.tsx`: no cliente, varre `[data-fotos-modelos]`, faz `JSON.parse(slot.dataset.fotosModelosJson)` e monta
  `createRoot(slot).render(<FotosModelosWidget data={data} />)`; um `MutationObserver` repete a varredura quando o DOM muda.
- `src/lib/review-body.ts` (`enhanceReviewBody`): em posts de review, troca a imagem inline do produto por `galeriaProduto` e insere `buyCard`s ao longo do texto.

### 6.2 Replicar no Vocação de Pai (mesmos nomes de nó, para o gerador `cmp_gen.py` continuar válido)

1. Copiar `FotosModelosExtension.ts`, `FotosModelos.tsx`, `ToolEmbedHost.tsx`, `review-body.ts` e os `case`s de `tiptap-html.ts` (`fotosModelos`, `buyCard`, `galeriaProduto`).
2. Em `FotosModelos.tsx`, o lookup por `slug` chama um server fn novo `getProductsBySlugs({ slugs })` (em `hub.functions.ts`) que devolve
   `slug, name, image_url, affiliate_url (normalizado), price, price_min, price_max, price_range_checked_at`. Nunca chamar o Supabase direto do widget.
3. Adicionar um nó **`product`** (cartão de produto único, usado em reviews individuais e artigos do blog), arquivo `src/components/blog/ProductEmbedExtension.ts`:

```ts
import { Node, mergeAttributes } from "@tiptap/core";
export interface ProductEmbedData { slug: string; variant?: "card" | "inline" }
export const ProductEmbedExtension = Node.create({
  name: "product", group: "block", atom: true, draggable: true,
  addAttributes() {
    return { data: { default: null,
      parseHTML: (el) => { try { return JSON.parse((el as HTMLElement).getAttribute("data-product-json") ?? "null"); } catch { return null; } },
      renderHTML: (a) => ({ "data-product-json": JSON.stringify(a.data ?? null) }) } };
  },
  parseHTML() { return [{ tag: "div[data-product]" }]; },
  renderHTML({ HTMLAttributes, node }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-product": "", "data-product-json": JSON.stringify(node.attrs.data ?? null), class: "fotos-modelos-placeholder" }), "Produto da Loja do Pai"];
  },
});
```

4. `tiptap-html.ts`: `case "product": return \`<div data-product="" data-product-json="${escapeHtml(jsonAttr(a.data))}" class="fotos-modelos-placeholder">Produto da Loja do Pai</div>\`;`
5. `ToolEmbedHost.tsx`: varrer também `[data-product]` e montar `<ProductEmbedWidget data={…} />` (`src/components/blog/ProductEmbed.tsx`): foto oficial
   (4:3, contain), nome, marca, faixa de preço (texto da seção 4.7), botão "Comprar agora na Amazon", link "Ver análise completa" → `/loja/$slug`.
6. Editor admin (`src/routes/_admin/admin/editor/$id.tsx`): botão de toolbar "Inserir produto" que abre uma busca por `name`/`slug` na tabela `products`
   e insere `{ type: "product", attrs: { data: { slug } } }`. Botão "Fotos dos modelos" insere `fotosModelos` com até 5 `modelos` escolhidos da loja.
7. Regra editorial herdada: **nunca digitar valor em reais no texto**; os geradores usam `{FAIXA:slug}` e o componente escreve a faixa.

Critério: um post publicado com `{"type":"product","attrs":{"data":{"slug":"<seed>"}}}` no `body` renderiza o cartão no SSR (placeholder) e hidrata
no cliente com foto, faixa e botão.

---

## 7. Admin de produtos

No vocacaodemae **não existe** tela de admin de produtos (`ls src/routes/_admin/admin/` → só `editor/` e `index.tsx`); os produtos entram por SQL
gerado pelos scripts. No Vocação de Pai vamos criar a tela, mantendo os scripts como caminho principal da rotina.

Arquivos novos (todos sob o layout `_admin` já criado na Fase 1, com guarda `is_admin`):

```
src/routes/_admin/admin/produtos/index.tsx        -> lista + filtros + ações
src/routes/_admin/admin/produtos/novo.tsx         -> formulário de criação
src/routes/_admin/admin/produtos/$id.tsx          -> edição (mesmo formulário)
src/routes/_admin/admin/produtos/fila-fotos.tsx   -> fila de fotos
src/routes/_admin/admin/produtos/fila-precos.tsx  -> fila de faixa de preço
src/components/admin/ProductForm.tsx
src/lib/admin-products.functions.ts               -> server fns com cliente autenticado do admin (RLS cuida da permissão)
```

### 7.1 Listar (`produtos/index.tsx`)

Tabela: miniatura, nome, marca, categoria, subcategoria, `featured`, `active`, nº de fotos (`jsonb_array_length(images)`), tem review (`review is not null`),
faixa (`price_min`–`price_max` ou "estimativa"/"—"), `price_range_checked_at`. Filtros: categoria, `active`, "sem review", "sem faixa", "menos de 5 fotos".
Busca por nome/ASIN. Ações em linha: Editar, Ativar/Desativar, Destacar, Abrir na Amazon.

### 7.2 Criar/editar (`ProductForm.tsx`)

Campos (ordem): `asin` (com botão **"Importar da Amazon"** que chama o server fn `importAmazonProduct({ asin })` — ele roda a mesma lógica do `amz.py`
em TS **ou** devolve instrução para rodar o script; na v1, o botão apenas preenche `affiliate_url` com `buildAmazonUrl(asin)` e deixa os campos para o
operador), `name`, `slug` (auto via `slugify(name)`, editável), `brand`, `category_id` (select das 10), `subcategory`, `short_description` (≤ 130 chars),
`description`, `images` (lista de URLs, até 8, com preview e botão "testar" = HEAD 200 e > 15 KB, via server fn `checkImageUrl`), `image_url` (= `images[0]`
por padrão), `pros`/`cons` (4 a 6 linhas cada), `price` (numérico, oculto no site), `price_min`/`price_max` (validação `max ≤ 3×min`), `rating`/`rating_count`,
`featured`, `sort_order`, `active`, `affiliate_network`, `marketplace_urls` (JSON), `review` (textarea JSON validada no cliente com as mesmas regras do
`review_gen.py`: nota 0–10, 5 critérios, 3 pontos, ≥ 6 seções com ≥ 3 `cta`, ≥ 4 FAQ, ≥ 5 linhas de ficha, sem `R$ 0,00`).

Upload opcional para o bucket `products` (quando a foto oficial não estiver disponível por URL): `supabase.storage.from("products").upload(\`${slug}/${n}.jpg\`)`,
URL pública gravada em `images`.

### 7.3 Fila de fotos (`fila-fotos.tsx`)

Query (mesma lógica de `photo_upgrade.py`): produtos ativos com `image_url` sem `_AC_SL1500_` **ou** `jsonb_array_length(images) < 5`, ordem
`featured desc, sort_order`. Mostra ASIN, fotos atuais e botão "Copiar comando": `python3 scripts/rotina/amz.py <ASIN>`. Botão "Aplicar fotos" cola o JSON
do `amz.py` e grava `images`/`image_url` (após `checkImageUrl` em cada uma).

### 7.4 Fila de faixa de preço (`fila-precos.tsx`)

Query: `active and price_range_checked_at is null` (depois os com mais de 60 dias), `order by featured desc, sort_order`, limite 15 (seção 8.4). Formulário
por produto: 2+ linhas `loja | preço | url` → grava em `product_price_checks` e atualiza `price_min`/`price_max`/`price_range_checked_at = now()`; recusa se
menos de 2 lojas ou `max > 3×min` (a constraint do banco também recusa).

Server fns (`admin-products.functions.ts`): `listAdminProducts`, `getAdminProduct`, `upsertProduct`, `toggleProduct`, `savePriceChecks`, `applyPhotos`,
`checkImageUrl`. Todas usam `createServerSupabaseClient()` com a sessão do usuário (cookie) — a RLS garante que só admin escreve.

---

## 8. Scripts adaptados (`scripts/rotina/`)

Copiar de `/home/user/vocacaodemae/scripts/rotina/`: `amz.py`, `photo_upgrade.py`, `review_gen.py`, `BRIEF_REVIEW.md` (→ renomear
`BRIEF_REVIEW_LOJA_PAI.md`), `README.md`. **Não** copiar `cmp_gen.py`/`rev_art_gen.py` nesta fase (são da Fase 2/8).

### 8.1 `scripts/rotina/amz.py` — ficha e fotos por ASIN

Herdar sem mudança de lógica. Entrada/saída:

```
Uso:    python3 scripts/rotina/amz.py <ASIN> [--file caminho.html] [--tries N]
Saída:  JSON em stdout:
{
  "title": "Furadeira de Impacto Bosch GSB 13 RE 650W ...",
  "images": ["https://m.media-amazon.com/images/I/<id>._AC_SL1500_.jpg", ...],   // até 8, oficiais, em alta
  "bullets": ["...", ...],            // até 12
  "description": "...",               // até 1500 chars
  "rating": "4,8", "reviews": "12.345", "price": "R$ 399,00" | null, "available": true,
  "details": {"Marca": "Bosch", "Potência": "650 W", ...}
}
```

Observações herdadas: lê a página mobile `https://www.amazon.com.br/gp/aw/d/<ASIN>` com UA de iPhone; a Amazon bloqueia com frequência
(resposta ~2 KB) e o script repete com pausas (25 s + 10 s·i). Cache em `/tmp/amzcache-vocacaodepai` (trocar o nome da pasta de cache).
O `price` do JSON **só** alimenta `products.price` (base da estimativa) — nunca vai para o texto.

### 8.2 `scripts/rotina/photo_upgrade.py`

Adaptar 3 coisas:
1. `BASE = "https://<SUPABASE_PROJECT_REF>.supabase.co/rest/v1/products"`.
2. `_anon_key()` lê `src/integrations/supabase/client.ts` (manter o mesmo caminho na Fase 1) ou `process.env` via `os.environ["SUPABASE_ANON_KEY"]` — preferir env.
3. `queue()`: usar `asin` da coluna (`select=slug,name,asin,image_url,images,...`) e cair no regex `/dp/([A-Z0-9]{10})` só se `asin` for nulo. `images` é jsonb (lista).
Saída: `photo_upgrade_out.sql` (um `UPDATE` curto por produto: `update products set images='[...]'::jsonb, image_url='...' where slug='...';`) e `photo_upgrade_log.txt`.
Fotos só entram se `HEAD 200` e `> 15 KB`. Fila: ~20 produtos/dia.

### 8.3 `scripts/rotina/review_gen.py` + `BRIEF_REVIEW_LOJA_PAI.md`

Adaptar o gerador:
- `INSERT` usa as colunas novas: `(id, slug, name, brand, asin, affiliate_network, affiliate_url, image_url, images, short_description, description, pros, cons, review, category_id, subcategory, price, featured, active, sort_order)`;
  `images` como `'[...]'::jsonb`; `category_id = (select id from product_categories where slug = '<categoria>')`; `affiliate_url = 'https://www.amazon.com.br/dp/<ASIN>?tag=' || '<TAG>' || '&linkCode=ssc'` com `<TAG>` lido de `os.environ.get("PUBLIC_AMAZON_TAG", "vocacaodepai-20")`.
- `price`: número (`399.00`) ou `NULL` (converter de "R$ 399,00").
- Validações herdadas **iguais**: nota 0–10; exatamente 5 critérios; 3 pontos; ≥ 6 seções, ≥ 3 com `cta`; ≥ 4 FAQ `{q,a}`; ficha ≥ 5; pros/cons 4–6; ≥ 3 fotos
  oficiais válidas; ≥ 900 palavras; proíbe `R$ 0,00` no texto e "ver preço".
- Produto existente: `<slug>.stg.sql` (staging em `_tmp_post_staging`, `k = 'review:<slug>'`) + `<slug>.upd.sql` (UPDATE curto com `md5`).

`BRIEF_REVIEW_LOJA_PAI.md` = cópia do `BRIEF_REVIEW.md` com estas trocas obrigatórias:
- "A mãe quer desconto!" → "Loja do Pai (O pai também quer desconto)"; "Review de Mãe" → "Pai Indica"; "tom de mãe para mãe: acolhedor" → "tom de pai para pai: direto, prático, respeitoso, sem vulgaridade e sem machismo tóxico".
- "Segurança infantil primeiro" → "Segurança primeiro (elétrica, corte, calor, trânsito, uso com criança por perto)".
- Fila SQL: trocar `c.slug='review-de-mae'` por `p.kind in ('review','comparativo','lista')` e `project_id` por `<SUPABASE_PROJECT_REF>`.
- Seção "A opinião da Vocação de Mãe" → "A opinião do Vocação de Pai". Manter: 10 produtos/dia; "O que dizem outros compradores" fora da Amazon; linha editorial.

### 8.4 Rotina de faixa de preço (2 lojas, mesmo item, `max ≤ 3×min`, 15/dia)

Arquivo: `scripts/rotina/BRIEF_FAIXA_PRECO.md` (novo, 1 página) com este procedimento, executado pela rotina diária (Fase 8) após o trabalho principal:

1. Fila: `select slug, name, brand, asin from products where active and price_range_checked_at is null order by featured desc, sort_order limit 15;`
   Quando zerar, refazer os com `price_range_checked_at < now() - interval '60 days'`.
2. Para cada produto: `WebSearch` do **mesmo** item (nome + marca + modelo + cor/quantidade) em Mercado Livre, Magalu, Americanas, Casas Bahia, Shopee,
   Kabum, Leroy Merlin, Centauro, Decathlon, site do fabricante.
3. Só vale com preço em reais em **pelo menos 2 lojas** diferentes e comprovadamente o mesmo item. Kit parecido ou outra voltagem **não conta**.
4. `min` = menor, `max` = maior. Se `max > 3 × min`: descartar (provável item diferente), não gravar.
5. Gravar em uma transação:
   ```sql
   insert into product_price_checks (product_id, store, price, url) values
     ((select id from products where slug='<slug>'), 'Mercado Livre', 389.90, 'https://...'),
     ((select id from products where slug='<slug>'), 'Magalu', 429.00, 'https://...');
   update products set price_min=389.90, price_max=429.00, price_range_checked_at=now() where slug='<slug>' returning slug;
   ```
6. Sem confirmação: não gravar nada (continua a estimativa). Registrar no resumo: quantos ganharam faixa, quantos foram pulados.

---

## 9. Regras do Amazon Associados BR e previsão de Mercado Livre/Shopee

### 9.1 Regras que o código e o conteúdo precisam respeitar

| Regra | Como garantimos |
|---|---|
| Não exibir preço exato nem "preço da Amazon" capturado (preço só via API oficial PA-API, que não usamos) | `products.price` nunca aparece; só `productPriceRange`; constraint + validador de texto (`R\$\s?\d[\d.]*,\d{2}`) |
| Identificação clara de participante do programa | `AffiliateNotice` em toda página com link + `/politica-de-afiliados` com a frase oficial |
| Link com tag correta, sem encurtadores/cloaking | `buildAmazonUrl(asin)` = `https://www.amazon.com.br/dp/<ASIN>?tag=<PUBLIC_AMAZON_TAG>&linkCode=ssc`; `rel="sponsored nofollow noopener noreferrer"` |
| Não usar links de afiliado em e-mail/PDF/offline | Newsletter linka para `/loja/$slug`, nunca direto para a Amazon |
| Fotos: usar imagens oficiais do anúncio (não editadas, sem marca d'água) | `amz.py` → `_AC_SL1500_`; nada de montagem com logo |
| Não copiar avaliações de clientes da Amazon | Seção "O que dizem outros compradores" só com fontes **fora** da Amazon |
| **180 dias / 3 vendas**: a conta precisa registrar 3 vendas qualificadas nos primeiros 180 dias ou é encerrada | Lançar a loja já com os 60 produtos, destaque no header e no fim de todo post; acompanhar no painel Lisieux (Fase 8) |
| Texto do botão | Sempre **"Comprar agora na Amazon"** |

### 9.2 Previsão multi-marketplace (`affiliate_network`, `marketplace_urls`)

- `affiliate_network` define o **botão principal**: `amazon` (padrão) → "Comprar agora na Amazon"; `mercadolivre` → "Comprar agora no Mercado Livre";
  `shopee` → "Comprar agora na Shopee"; `outro` → "Comprar agora".
- `marketplace_urls` guarda links alternativos `{ "mercadolivre": "...", "shopee": "..." }`. Quando preenchido, `ProductPage` mostra abaixo do botão
  principal uma linha discreta "Também disponível em: Mercado Livre · Shopee" (links `sponsored nofollow`). O card da vitrine só mostra o principal.
- Env futuras: `PUBLIC_MELI_AFFILIATE_ID`, `PUBLIC_SHOPEE_AFFILIATE_ID` (não criar agora; só reservar o nome em `.env.example` comentado).
- Nada disso bloqueia a Fase 3: os 60 produtos entram como `amazon`.

---

## 10. Os 60 primeiros produtos (6 por categoria)

ASIN: pesquisar com `amz.py`/busca da Amazon antes de inserir; **nunca inventar**. "pesquisar" = confirmar ASIN, nome exato do anúncio e disponibilidade.

### 10.1 Churrasco e Cozinha

| Produto (marca/modelo real) | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Faca de churrasco Tramontina Polywood 8" (lâmina inox, cabo vermelho) | facas | A faca mais vendida do país; base de qualquer kit | pesquisar |
| Kit churrasco Tramontina Polywood 3 peças (faca, garfo e chaira) | kits | Entrada completa para quem assa em casa | pesquisar |
| Tábua para churrasco Tramontina madeira teca com canaleta | tabuas | Canaleta segura o suco da carne; madeira resistente | pesquisar |
| Chapa de ferro fundido Fundição Santana (bifeteira/chapa lisa) | chapas-e-panelas | Selagem perfeita de picanha e hambúrguer no fogão | pesquisar |
| Termômetro culinário digital de espeto ThermoPro TP-01S | termometros | Ponto da carne sem adivinhar; barato e preciso | pesquisar |
| Frigideira de ferro fundido Fundição Santana 26 cm | chapas-e-panelas | Dura a vida inteira; vai do fogão ao forno | pesquisar |

### 10.2 Ferramentas

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Parafusadeira/furadeira a bateria Bosch GSR 120-LI 12V (2 baterias) | parafusadeiras | A ferramenta nº 1 da casa: prateleira, móvel, cortina | pesquisar |
| Furadeira de impacto Bosch GSB 13 RE 650 W | furadeiras | Fura concreto e alvenaria; robusta e acessível | pesquisar |
| Kit de ferramentas Tramontina Master 110 peças com maleta | kits | Um kit para começar a oficina do pai | pesquisar |
| Trena a laser Bosch GLM 20 (20 m) | medicao | Medir cômodo sozinho em segundos | pesquisar |
| Jogo de chaves combinadas Gedore 8 a 22 mm (12 peças) | chaves | Marca profissional, aço de qualidade | pesquisar |
| Serra tico-tico Bosch GST 650 450 W | serras | Corte de madeira e MDF para projetos de casa | pesquisar |

### 10.3 Carro e Moto

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Compressor de ar portátil 12V Multilaser AU608 | manutencao | Calibrar pneu no portão de casa | pesquisar |
| Aspirador de pó automotivo Black+Decker AV1200 12V | limpeza | Carro com cadeirinha vive cheio de migalha | pesquisar |
| Carregador de bateria inteligente NOCO Genius1 6V/12V | manutencao | Carro parado por semanas não deixa o pai na mão | pesquisar |
| Cera automotiva Vonixx Blend Carnaúba Sílica Paste Wax 100 ml | limpeza | Marca brasileira de referência em estética | pesquisar |
| Shampoo automotivo Vonixx V-Floc 1,5 L | limpeza | Lavagem em casa sem riscar a pintura | pesquisar |
| Capacete LS2 FF353 Rapid (monocolor) | moto-seguranca | Capacete certificado com bom custo-benefício | pesquisar |

### 10.4 Tecnologia

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Echo Dot 5ª geração com Alexa | casa-conectada | Timer de churrasco, música, lembrete do remédio das crianças | pesquisar |
| Kindle Paperwhite 16 GB (12ª geração) | leitura | Leitura noturna sem acordar ninguém | pesquisar |
| Fone de ouvido JBL Tune 520BT (Bluetooth) | audio | Barato, bateria longa, bom para chamadas | pesquisar |
| Carregador portátil Anker PowerCore 10000 mAh | energia | Viagem, acampamento, consulta longa com os filhos | pesquisar |
| Xiaomi Smart Band 9 | relogios-inteligentes | Passos, sono e notificações sem gastar muito | pesquisar |
| Roteador TP-Link Archer AX23 Wi-Fi 6 AX1800 | rede | Casa com home office e crianças no streaming | pesquisar |

### 10.5 Esporte e Outdoor

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Barraca Nautika Indy 3/4 pessoas | acampamento | Primeira barraca para acampar com os filhos | pesquisar |
| Garrafa térmica Stanley Classic 1 L | hidratacao | Café quente por 24 h; indestrutível | pesquisar |
| Lanterna de cabeça Ledlenser MH3 | iluminacao | Mãos livres no acampamento e no conserto | pesquisar |
| Caixa térmica Coleman 28 QT (26 L) | acampamento | Churrasco, praia, pesca | pesquisar |
| Bola de futebol de campo Penalty S11 R2 XXIII | bola | A pelada com o filho no fim de semana | pesquisar |
| Canivete suíço Victorinox Huntsman | canivetes | Ferramenta de bolso clássica do pai | pesquisar |

### 10.6 Paternidade Prática

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Canguru ergonômico Ergobaby Omni Breeze | canguru | Pai com o bebê no colo e mãos livres | pesquisar |
| Mochila para bebê Masterbag Baby Urban (estilo masculino) | mochilas | Mochila de passeio que o pai usa sem constrangimento | pesquisar |
| Babá eletrônica Motorola MBP36XL (vídeo) | monitoramento | Ver o bebê do quintal ou da garagem | pesquisar |
| Cadeira para auto Chicco Unico Plus 0-36 kg (isofix) | cadeirinha | Instalação correta é tarefa do pai; dura do nascimento aos 12 anos | pesquisar |
| Termômetro digital infravermelho G-Tech FR1DZ1 | saude | Febre à noite sem acordar a criança | pesquisar |
| Cadeira de alimentação portátil Chicco Pocket Snack | alimentacao | Vai no carro, cabe em qualquer cadeira de restaurante | pesquisar |

### 10.7 Livros e Formação

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| O Homem Mais Rico da Babilônia — George S. Clason (HarperCollins Brasil) | financas | Base de educação financeira para provedor | pesquisar |
| Pai Rico, Pai Pobre — Robert T. Kiyosaki (Alta Books, ed. atualizada) | financas | O livro de finanças mais lido por pais | pesquisar |
| Hábitos Atômicos — James Clear (Alta Books) | habitos | Disciplina prática para rotina de pai | pesquisar |
| Seja Homem! — Padre Larry Richards (Ecclesiae) | fe-e-familia | Formação do homem católico como pai e marido | pesquisar |
| Como Fazer Amigos e Influenciar Pessoas — Dale Carnegie (Sextante) | lideranca | Liderar em casa e no trabalho | pesquisar |
| Pais Fortes, Filhas Felizes — Meg Meeker | paternidade | O papel do pai na vida da filha, com base médica | pesquisar |

### 10.8 Estilo e Barba

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Aparador Philips OneBlade QP2724/10 | barba | Barba e corpo com uma lâmina só; o mais vendido | pesquisar |
| Máquina de cortar cabelo Wahl Clipper Super Taper | cabelo | Cortar o próprio cabelo e o dos filhos em casa | pesquisar |
| Óleo para barba Sobrebarba 30 ml | barba | Marca brasileira especializada; barba macia | pesquisar |
| Loção pós-barba Nivea Men Sensitive 100 ml | barba | Sem álcool; pele sem ardência | pesquisar |
| Natura Essencial Clássico deo parfum 100 ml | perfume | Perfume masculino nacional de referência | pesquisar |
| Relógio Casio G-Shock DW-5600E-1V | relogios | Resistente a tudo; clássico de pai | pesquisar |

### 10.9 Casa e Jardim

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Lavadora de alta pressão WAP Eco Wash 2200 | limpeza-externa | Calçada, carro, churrasqueira | pesquisar |
| Aparador de grama Tramontina AP1000T 1000 W | jardim | Grama do quintal em 20 minutos | pesquisar |
| Cortador de grama elétrico Tramontina CE35M | jardim | Quintal médio, sem gasolina | pesquisar |
| Mangueira Tramontina Flex 30 m com esguicho | jardim | Lavar, regar, brincar com as crianças | pesquisar |
| Escada de alumínio Mor 5 degraus | manutencao | Trocar lâmpada e limpar calha com segurança | pesquisar |
| Câmera Wi-Fi Intelbras Mibo iM3 | seguranca | Ver o portão e o quintal pelo celular | pesquisar |

### 10.10 Presentes para o Pai

| Produto | Subcategoria | Por que entra | ASIN |
|---|---|---|---|
| Kit churrasco Tramontina Jumbo 15 peças com maleta | ate-300 | Presente clássico de Dia dos Pais | pesquisar |
| Cafeteira italiana Bialetti Moka Express 6 xícaras | ate-300 | Café de verdade, sem cápsula | pesquisar |
| Caneca térmica Stanley Classic Trigger-Action 473 ml | ate-200 | Café quente no trânsito | pesquisar |
| Carteira masculina Nordweg couro legítimo (slim) | ate-200 | Couro brasileiro, dura anos | pesquisar |
| Caixa de som Bluetooth JBL Go 3 | ate-300 | Música na churrasqueira e no banho das crianças | pesquisar |
| Jogo de xadrez e damas em madeira Xalingo | ate-100 | Tempo de qualidade pai e filho | pesquisar |

---

## 11. Seed SQL com 5 produtos completos — `supabase/seed/0003_loja_seed.sql`

Rodar **depois** da migration. Trocar `<TAG>` por `PUBLIC_AMAZON_TAG`, `<ASIN_x>` pelo ASIN confirmado e `<IMG_x_n>` pelas URLs `_AC_SL1500_` vindas do `amz.py`
(validadas HTTP 200 e > 15 KB). As reviews abaixo são **estruturalmente válidas** (5 critérios, 3 pontos, 6 seções/3 CTA, 5 linhas de ficha, 4 FAQ) mas
curtas: antes do lançamento, substituir pelas reviews reais geradas com `review_gen.py` (≥ 900 palavras).

```sql
-- supabase/seed/0003_loja_seed.sql
insert into public.products
 (slug, name, brand, asin, affiliate_network, affiliate_url, image_url, images, short_description, description, pros, cons, review, category_id, subcategory, price, featured, active, sort_order)
values
-- 1) Churrasco e Cozinha
('faca-churrasco-tramontina-polywood-8', 'Faca de churrasco Tramontina Polywood 8"', 'Tramontina', '<ASIN_1>', 'amazon',
 'https://www.amazon.com.br/dp/<ASIN_1>?tag=<TAG>&linkCode=ssc', '<IMG_1_1>', '["<IMG_1_1>","<IMG_1_2>","<IMG_1_3>"]'::jsonb,
 'A faca de churrasco mais vendida do Brasil: inox, cabo de madeira tratada e fio que segura.',
 'Faca de 8 polegadas em aço inox com cabo Polywood (madeira com resina), resistente à lava-louças. Serve para fatiar picanha, costela e frango na tábua, com peso equilibrado e fio fácil de afiar em casa.',
 '["Aço inox que aceita afiação em chaira comum","Cabo Polywood resistente à umidade e à lava-louças","Peso equilibrado para fatiar carne quente","Preço acessível para a qualidade","Reposição fácil em qualquer loja"]'::jsonb,
 '["Não vem com bainha nem estojo","Fio de fábrica pede uma passada na chaira antes do primeiro uso","Cabo vermelho pode não combinar com kits de outra cor","Não é faca de desossa: lâmina larga demais para isso"]'::jsonb,
 $r${"titulo":"Tramontina Polywood 8\": a faca que todo pai deveria ter na churrasqueira","resumo":"Uma faca simples, honesta e barata que faz o básico muito bem: fatiar carne na tábua sem rasgar. Não é faca de chef, é faca de churrasco de verdade.","nota":8.4,"criterios":[{"nome":"Corte","nota":8.5},{"nome":"Cabo e pegada","nota":8.5},{"nome":"Durabilidade","nota":9.0},{"nome":"Manutenção","nota":8.0},{"nome":"Custo-benefício","nota":8.0}],"ideal_para":"Quem assa em casa toda semana e quer uma faca que aguenta anos sem cuidado especial.","em_3_pontos":["Inox que afia fácil e não enferruja com o uso normal.","Cabo Polywood vai na lava-louças sem rachar.","Custa pouco e dura muito: compra sem arrependimento."],"secoes":[{"titulo":"O que a Polywood entrega","paragrafos":["Lâmina de 8 polegadas em inox, larga o bastante para fatiar peças grandes sem serrilhar a carne.","O cabo de madeira com resina não absorve gordura e seca rápido."],"cta":true},{"titulo":"No dia a dia da churrasqueira","paragrafos":["Fatia picanha, fraldinha e frango com um movimento só quando o fio está em ordem.","Pesa o suficiente para não exigir força, sem cansar o punho."],"cta":false},{"titulo":"Prós e contras na prática","paragrafos":["Ponto alto é a manutenção: uma passada de chaira antes de cada churrasco resolve.","O ponto baixo é não vir com bainha, então guarde separada das outras facas."],"cta":true},{"titulo":"Para quem vale a pena (e para quem não)","paragrafos":["Vale para o pai que faz churrasco em casa e quer uma faca de trabalho.","Não vale para quem quer desossar ou fazer cortes finos de sashimi."],"cta":false},{"titulo":"Segurança e cuidados","paragrafos":["Secar depois de lavar prolonga o fio. Guardar longe do alcance das crianças, em suporte ou gaveta com trava."],"cta":false},{"titulo":"Como ela se compara a outras opções","paragrafos":["Facas de aço carbono cortam mais mas enferrujam; facas forjadas premium custam muitas vezes mais pelo mesmo resultado na churrasqueira de casa."],"cta":true}],"preco_texto":"O preço varia conforme o vendedor, a cor do cabo e se vem em kit com garfo e chaira.","ficha":["Lâmina: aço inox, 8 polegadas (20 cm)","Cabo: Polywood (madeira com resina), vermelho","Resistente à lava-louças: sim (cabo)","Uso: fatiar carnes assadas","Garantia: conforme fabricante"],"como_avaliamos":"Análise baseada na ficha técnica da Tramontina, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, YouTube). Não é teste físico nosso.","opiniao":"Compra segura para a maioria dos pais. Só não serve para quem precisa de faca de desossa ou corte de precisão.","faq":[{"q":"Pode ir na lava-louças?","a":"O cabo Polywood sim; recomendamos lavar a mão para preservar o fio."},{"q":"Precisa afiar antes de usar?","a":"Uma passada rápida na chaira ajuda; o fio de fábrica é bom, mas melhora."},{"q":"Serve para desossar?","a":"Não, a lâmina é larga demais. Para isso existe faca de desossa."},{"q":"Vem com bainha?","a":"Não. Guarde em suporte ou gaveta com trava."}]}$r$::jsonb,
 (select id from public.product_categories where slug = 'churrasco-e-cozinha'), 'facas', 59.90, true, true, 10),

-- 2) Ferramentas
('parafusadeira-furadeira-bosch-gsr-120-li', 'Parafusadeira/Furadeira a bateria Bosch GSR 120-LI 12V', 'Bosch', '<ASIN_2>', 'amazon',
 'https://www.amazon.com.br/dp/<ASIN_2>?tag=<TAG>&linkCode=ssc', '<IMG_2_1>', '["<IMG_2_1>","<IMG_2_2>","<IMG_2_3>","<IMG_2_4>"]'::jsonb,
 'A parafusadeira que resolve prateleira, móvel e cortina sem fio e sem drama.',
 'Parafusadeira e furadeira de 12 V com duas baterias de lítio, 20 posições de torque, duas velocidades e LED. Fura madeira e metal leve e parafusa móveis com controle de torque para não espanar.',
 '["Duas baterias: uma carrega enquanto a outra trabalha","Leve e compacta, cabe na gaveta","Controle de torque evita espanar o móvel","Marca com assistência técnica em todo o país","LED ilumina o ponto de trabalho"]'::jsonb,
 '["Não fura concreto (não é de impacto)","Maleta plástica simples","Mandril de 10 mm limita brocas grandes","Bateria de 1,5 Ah pede recarga em trabalho longo"]'::jsonb,
 $r${"titulo":"Bosch GSR 120-LI: a parafusadeira para 90% dos consertos da casa","resumo":"Leve, com duas baterias e torque regulável, ela cobre quase tudo que um pai precisa montar ou fixar em casa. Só não fura concreto.","nota":8.6,"criterios":[{"nome":"Potência","nota":8.0},{"nome":"Autonomia","nota":8.5},{"nome":"Ergonomia","nota":9.0},{"nome":"Acessórios","nota":8.0},{"nome":"Custo-benefício","nota":9.0}],"ideal_para":"Quem monta móvel, instala prateleira e cortina e quer ferramenta sem fio confiável.","em_3_pontos":["Duas baterias de lítio: nunca para no meio.","Torque regulável protege o móvel.","Leve o bastante para trabalhar com o braço esticado."],"secoes":[{"titulo":"O que a GSR 120-LI entrega","paragrafos":["Motor de 12 V com duas velocidades e 20 posições de torque.","Mandril de 10 mm sem chave e LED frontal."],"cta":true},{"titulo":"No uso em casa","paragrafos":["Monta guarda-roupa inteiro com uma bateria.","Fura madeira e drywall com facilidade; metal leve com broca certa."],"cta":false},{"titulo":"Prós e contras na prática","paragrafos":["Ponto alto é a leveza; ponto baixo é não ter impacto para alvenaria."],"cta":true},{"titulo":"Para quem vale a pena","paragrafos":["Para o pai que faz manutenção leve. Para concreto, veja a GSB 13 RE."],"cta":false},{"titulo":"Segurança e cuidados","paragrafos":["Retire a bateria antes de trocar broca; guarde fora do alcance das crianças."],"cta":false},{"titulo":"Como ela se compara","paragrafos":["Modelos de 18 V são mais fortes e pesados; modelos genéricos de 12 V perdem em bateria e assistência."],"cta":true}],"preco_texto":"O preço varia conforme o kit (1 ou 2 baterias) e a presença de maleta e brocas.","ficha":["Tensão: 12 V (bateria de lítio)","Baterias: 2 x 1,5 Ah","Torque: 20 posições + furação","Mandril: 10 mm sem chave","Velocidades: 2"],"como_avaliamos":"Ficha técnica da Bosch, manual, anúncio da Amazon Brasil e opiniões fora da Amazon (Reclame Aqui, Leroy Merlin, YouTube). Sem teste físico.","opiniao":"A compra certa para a primeira parafusadeira da casa. Não serve para furar parede de concreto.","faq":[{"q":"Fura concreto?","a":"Não. Ela não é de impacto. Para alvenaria, use uma furadeira de impacto."},{"q":"Quanto dura a bateria?","a":"Monta um móvel grande com uma carga; a segunda bateria cobre o resto."},{"q":"Tem assistência técnica?","a":"Sim, rede Bosch em todo o Brasil."},{"q":"Vem com brocas?","a":"Depende do kit; confira o anúncio."}]}$r$::jsonb,
 (select id from public.product_categories where slug = 'ferramentas'), 'parafusadeiras', 399.00, true, true, 20),

-- 3) Tecnologia
('kindle-paperwhite-16gb-12a-geracao', 'Kindle Paperwhite 16 GB (12ª geração)', 'Amazon', '<ASIN_3>', 'amazon',
 'https://www.amazon.com.br/dp/<ASIN_3>?tag=<TAG>&linkCode=ssc', '<IMG_3_1>', '["<IMG_3_1>","<IMG_3_2>","<IMG_3_3>"]'::jsonb,
 'Leitura noturna sem acordar a esposa nem o bebê: tela sem brilho, luz quente e semanas de bateria.',
 'Leitor digital com tela de 7 polegadas sem reflexo, luz ajustável com tom quente, resistência à água e bateria de semanas. Para o pai que quer voltar a ler.',
 '["Tela sem reflexo, lê no sol e no escuro","Luz quente não incomoda quem dorme do lado","Bateria de semanas","Resistente à água","Leve, cabe no bolso da jaqueta"]'::jsonb,
 '["Só preto e branco","Loja fechada no ecossistema Amazon","Capa vendida à parte","Sem botões físicos de página"]'::jsonb,
 $r${"titulo":"Kindle Paperwhite: o jeito mais fácil de o pai voltar a ler","resumo":"Tela de papel, luz quente e bateria infinita. Se o seu problema é tempo e cansaço, ele resolve mais que um celular.","nota":8.8,"criterios":[{"nome":"Tela","nota":9.5},{"nome":"Bateria","nota":9.5},{"nome":"Conforto de leitura","nota":9.0},{"nome":"Ecossistema","nota":7.5},{"nome":"Custo-benefício","nota":8.5}],"ideal_para":"Quem quer ler à noite, em viagem ou na sala de espera sem distração de notificação.","em_3_pontos":["Tela sem brilho que não cansa.","Luz quente para ler com o bebê dormindo.","Semanas de bateria."],"secoes":[{"titulo":"O que o Paperwhite entrega","paragrafos":["Tela de 7 polegadas e-ink, luz frontal ajustável e tom quente.","Armazena milhares de livros."],"cta":true},{"titulo":"No dia a dia","paragrafos":["Vinte minutos antes de dormir já viram um livro por mês."],"cta":false},{"titulo":"Prós e contras na prática","paragrafos":["Ponto alto: a tela. Ponto baixo: ecossistema fechado."],"cta":true},{"titulo":"Para quem vale a pena","paragrafos":["Para quem lê ou quer voltar a ler. Não serve para quadrinhos coloridos."],"cta":false},{"titulo":"Cuidados","paragrafos":["Resistente à água, mas não a quedas: compre uma capa."],"cta":false},{"titulo":"Comparado a outras opções","paragrafos":["O Kindle básico tem tela menor e sem luz quente; o Scribe é maior e bem mais caro."],"cta":true}],"preco_texto":"O preço varia com a capacidade, a presença de anúncios na tela de bloqueio e promoções sazonais.","ficha":["Tela: 7 polegadas, 300 ppi","Armazenamento: 16 GB","Luz: ajustável, com tom quente","Resistência à água: IPX8","Bateria: semanas"],"como_avaliamos":"Ficha oficial, anúncio da Amazon Brasil e opiniões fora da Amazon (Reclame Aqui, YouTube, fóruns de leitura). Sem teste físico.","opiniao":"Compra excelente para quem quer ler mais. Não serve para quem quer tela colorida.","faq":[{"q":"Dá para ler no escuro?","a":"Sim, com a luz frontal ajustável."},{"q":"Precisa de assinatura?","a":"Não; a assinatura Kindle Unlimited é opcional."},{"q":"Aceita PDF?","a":"Sim, mas a experiência é melhor com e-books."},{"q":"É resistente à água?","a":"Sim, IPX8."}]}$r$::jsonb,
 (select id from public.product_categories where slug = 'tecnologia'), 'leitura', 749.00, true, true, 30),

-- 4) Paternidade Prática
('cadeira-auto-chicco-unico-plus-0-36kg', 'Cadeira para auto Chicco Unico Plus 0-36 kg (isofix)', 'Chicco', '<ASIN_4>', 'amazon',
 'https://www.amazon.com.br/dp/<ASIN_4>?tag=<TAG>&linkCode=ssc', '<IMG_4_1>', '["<IMG_4_1>","<IMG_4_2>","<IMG_4_3>","<IMG_4_4>"]'::jsonb,
 'Uma cadeirinha só do nascimento aos 36 kg, com isofix: instalar certo é tarefa do pai.',
 'Cadeira para automóvel grupo 0+/1/2/3 (0 a 36 kg), com isofix e top tether, reclinável, voltada para trás até 18 kg. Certificada pelo Inmetro.',
 '["Cobre do nascimento aos 36 kg","Isofix e top tether reduzem erro de instalação","Reclina em várias posições","Tecido removível e lavável","Certificação Inmetro"]'::jsonb,
 '["Pesada para trocar de carro","Volumosa em carros compactos","Preço acima das cadeirinhas de grupo único","Instalação com cinto é menos intuitiva"]'::jsonb,
 $r${"titulo":"Chicco Unico Plus: a cadeirinha que o pai instala uma vez e esquece","resumo":"Isofix, 0 a 36 kg e reclinação: resolve a cadeirinha do nascimento até o fim da obrigação legal.","nota":8.5,"criterios":[{"nome":"Segurança","nota":9.0},{"nome":"Instalação","nota":8.5},{"nome":"Conforto","nota":8.5},{"nome":"Durabilidade","nota":8.5},{"nome":"Custo-benefício","nota":8.0}],"ideal_para":"Pais com um carro principal com isofix que querem comprar uma vez só.","em_3_pontos":["Isofix elimina o erro mais comum de instalação.","0 a 36 kg: uma compra para anos.","Reclina para o bebê dormir no caminho."],"secoes":[{"titulo":"O que a Unico Plus entrega","paragrafos":["Grupos 0+ a 3, isofix, top tether, reclinação e proteção lateral."],"cta":true},{"titulo":"Instalação: o papel do pai","paragrafos":["Encaixe nos pontos isofix, puxe o top tether e confira os indicadores verdes."],"cta":false},{"titulo":"Prós e contras na prática","paragrafos":["Ponto alto: segurança e versatilidade. Ponto baixo: peso."],"cta":true},{"titulo":"Para quem vale a pena","paragrafos":["Para quem usa sempre o mesmo carro. Não serve para trocar de carro toda semana."],"cta":false},{"titulo":"Segurança e cuidados","paragrafos":["Voltada para trás o máximo possível; cinto no ombro sem folga; nunca após colisão."],"cta":false},{"titulo":"Comparada a outras opções","paragrafos":["Cadeirinhas de grupo único são mais leves, mas exigem 2 ou 3 compras ao longo dos anos."],"cta":true}],"preco_texto":"O preço varia com a cor, o vendedor e lançamentos de versões novas.","ficha":["Grupos: 0+/1/2/3 (0 a 36 kg)","Fixação: isofix + top tether (ou cinto)","Reclinação: múltiplas posições","Certificação: Inmetro","Tecido: removível e lavável"],"como_avaliamos":"Manual da Chicco, anúncio da Amazon Brasil e opiniões fora da Amazon (Reclame Aqui, Mercado Livre, YouTube). Sem teste físico nem crash test próprio.","opiniao":"Ótima escolha para carro único com isofix. Não serve para quem precisa trocar de carro com frequência.","faq":[{"q":"Até quando fica voltada para trás?","a":"Até 18 kg, conforme o manual."},{"q":"Serve em carro sem isofix?","a":"Sim, com o cinto de 3 pontos."},{"q":"É homologada no Brasil?","a":"Sim, Inmetro."},{"q":"Posso usar após um acidente?","a":"Não; substitua a cadeirinha."}]}$r$::jsonb,
 (select id from public.product_categories where slug = 'paternidade-pratica'), 'cadeirinha', 1899.00, true, true, 40),

-- 5) Livros e Formação
('o-homem-mais-rico-da-babilonia-clason', 'O Homem Mais Rico da Babilônia — George S. Clason', 'HarperCollins Brasil', '<ASIN_5>', 'amazon',
 'https://www.amazon.com.br/dp/<ASIN_5>?tag=<TAG>&linkCode=ssc', '<IMG_5_1>', '["<IMG_5_1>","<IMG_5_2>","<IMG_5_3>"]'::jsonb,
 'As regras de ouro do dinheiro em parábolas curtas: a base de educação financeira do provedor.',
 'Clássico de 1926 que ensina, em histórias ambientadas na Babilônia, a poupar pelo menos 10%, controlar gastos, fazer o dinheiro trabalhar e proteger o patrimônio. Leitura rápida e direta.',
 '["Curto e direto: lê em um fim de semana","Princípios simples e atemporais","Linguagem acessível para quem nunca estudou finanças","Serve para ler junto com filhos adolescentes","Edição com boa tradução e preço baixo"]'::jsonb,
 '["Não ensina investimento prático atual","Estilo de parábola pode parecer repetitivo","Sem exercícios ou planilhas","Alguns exemplos datados"]'::jsonb,
 $r${"titulo":"O Homem Mais Rico da Babilônia: o primeiro livro de finanças que todo pai deve ler","resumo":"Em parábolas curtas, ensina o que a maioria de nós não aprendeu em casa: guardar antes de gastar. Simples, direto e atemporal.","nota":8.7,"criterios":[{"nome":"Clareza","nota":9.5},{"nome":"Aplicabilidade","nota":8.5},{"nome":"Profundidade","nota":7.5},{"nome":"Leitura","nota":9.0},{"nome":"Custo-benefício","nota":9.0}],"ideal_para":"Quem nunca organizou o dinheiro e precisa de princípios, não de planilha.","em_3_pontos":["Guarde 10% antes de qualquer gasto.","Controle o que sai; o salário raramente é o problema.","Faça o dinheiro trabalhar e proteja-o de aventuras."],"secoes":[{"titulo":"O que o livro entrega","paragrafos":["Sete regras de ouro em histórias curtas e memoráveis."],"cta":true},{"titulo":"Na vida do pai provedor","paragrafos":["Dá vocabulário para conversar sobre dinheiro com a esposa e os filhos."],"cta":false},{"titulo":"Prós e contras na prática","paragrafos":["Ponto alto: simplicidade. Ponto baixo: não fala de investimentos atuais."],"cta":true},{"titulo":"Para quem vale a pena","paragrafos":["Para quem está começando. Não serve para quem já investe e quer estratégia."],"cta":false},{"titulo":"Como ler com os filhos","paragrafos":["Uma parábola por noite com adolescentes funciona bem."],"cta":false},{"titulo":"Comparado a outros livros","paragrafos":["Pai Rico, Pai Pobre vai mais fundo em ativos; Hábitos Atômicos trata de disciplina. Este é a base."],"cta":true}],"preco_texto":"O preço varia entre edições (capa comum, capa dura, bolso) e vendedores.","ficha":["Autor: George S. Clason","Editora: HarperCollins Brasil","Páginas: cerca de 160","Idioma: português","Formato: capa comum"],"como_avaliamos":"Leitura da obra, ficha da editora, anúncio da Amazon Brasil e opiniões fora da Amazon (Skoob, YouTube, blogs de finanças).","opiniao":"Leitura obrigatória para começar. Quem já tem reserva e investe pode pular para livros mais técnicos.","faq":[{"q":"É difícil de ler?","a":"Não; são histórias curtas em linguagem simples."},{"q":"Ensina a investir?","a":"Ensina princípios, não produtos financeiros."},{"q":"Serve para adolescente?","a":"Sim, a partir de 14 anos."},{"q":"Quantas páginas?","a":"Cerca de 160, conforme a edição."}]}$r$::jsonb,
 (select id from public.product_categories where slug = 'livros-e-formacao'), 'financas', 29.90, true, true, 50)
on conflict (slug) do nothing;

-- Faixa de preço de exemplo para 1 produto (2 lojas, mesmo item): substituir pelos valores reais pesquisados.
insert into public.product_price_checks (product_id, store, price, url) values
 ((select id from public.products where slug='faca-churrasco-tramontina-polywood-8'), 'Mercado Livre', 54.90, 'https://www.mercadolivre.com.br/<url-real>'),
 ((select id from public.products where slug='faca-churrasco-tramontina-polywood-8'), 'Magalu', 64.90, 'https://www.magazineluiza.com.br/<url-real>');
update public.products set price_min = 54.90, price_max = 64.90, price_range_checked_at = now()
 where slug = 'faca-churrasco-tramontina-polywood-8';
```

Conferência pós-seed:

```sql
select slug, review->>'nota' as nota, jsonb_array_length(review->'secoes') as secoes, jsonb_array_length(images) as fotos, price_min, price_max
from public.products order by sort_order;   -- 5 linhas; secoes = 6; fotos >= 3
```

---

## 12. Critérios de aceite da Fase 3

1. `0003_loja.sql` aplicada; as 3 tabelas existem, RLS ativa, 10 categorias, bucket `products` público.
2. Como anon, `GET /rest/v1/products?active=eq.false` retorna `[]`; como admin logado, a tela `/admin/produtos` lista também inativos.
3. `/loja` renderiza no SSR (view-source mostra os nomes dos produtos), com hero + slogan, 10 cards de categoria, destaques, busca e filtros; `canonical` = `https://vocacaodepai.com.br/loja`.
4. `/loja/categoria/churrasco-e-cozinha` lista só produtos da categoria; `/loja/categoria/nao-existe` → 404.
5. `/loja/<seed>`: galeria com setas e miniaturas; faixa de preço com o texto exato da seção 4.7 ("… não é o preço da Amazon"); botão **"Comprar agora na Amazon"** com `href` contendo `tag=<PUBLIC_AMAZON_TAG>` e `rel="noopener noreferrer sponsored nofollow"`; Prós/Contras; `ProductReviewArticle` com nota e 5 barras de critério; "Produtos parecidos"; "No Pai Indica" (ou ausente); `AffiliateNotice`.
6. JSON-LD: `Product` **sem** `offers` + `Review` com `bestRating: 10` + `BreadcrumbList`; validado em https://validator.schema.org sem erro.
7. `grep -rn "Ver preço" src/` → vazio. `grep -rn "R\$ [0-9]*,[0-9][0-9]" src/` → vazio (nenhum preço exato hard-coded).
8. `/politica-de-afiliados` existe, contém "participante do Programa de Associados da Amazon Brasil" e está linkada no rodapé.
9. Um post com nó `product` e um com `fotosModelos` renderizam o widget hidratado com foto, faixa e botão.
10. `python3 scripts/rotina/amz.py <ASIN real>` devolve JSON com `images` ≥ 3; `python3 scripts/rotina/review_gen.py exemplo.json` gera `.insert.sql` que roda sem erro no banco.
11. `fila-precos` e `fila-fotos` listam os produtos certos; gravar uma faixa com `max > 3×min` é recusado (UI e banco).
12. `pnpm typecheck && pnpm lint && pnpm build` sem erro; `pnpm test` com `price-range.test.ts` verde.
13. 60 produtos cadastrados (`select count(*) from products where active` = 60), cada um com ≥ 3 fotos oficiais; ≥ 20 com review longa real; ≥ 15 com faixa de mercado.
14. Lighthouse mobile em `/loja/<seed>` ≥ 85 em Performance e 100 em SEO.

---

## 13. Prompt para iniciar esta fase no Sonnet

```
Você está em /home/user/vocacaodepai (TanStack Start + React 19 + Tailwind 4 + Supabase + Vercel). Leia primeiro, nesta ordem:
CLAUDE.md, docs/plano/02-arquitetura-e-stack.md (se existir, ele prevalece em nomes de colunas), docs/plano/05-fase-3-loja.md (este plano, inteiro),
e docs/plano/PROGRESSO.md. A referência de código é /home/user/vocacaodemae (SOMENTE LEITURA): use cat para ler cada arquivo citado na seção 4
antes de copiar/adaptar.

Execute a Fase 3 (Loja do Pai, slogan "O pai também quer desconto") exatamente como o documento descreve, nesta ordem:
1) Criar supabase/migrations/0003_loja.sql com o SQL da seção 2.1 (sem mudar nome de coluna) e aplicar (supabase db push ou mcp__Supabase__apply_migration). Validar com a seção 2.2.
2) Criar src/lib/store-categories.ts, src/lib/affiliate.ts, atualizar src/lib/types.ts (Product/ProductCategory/ProductReviewData), src/lib/queries.ts e src/lib/hub.functions.ts (seções 3 e 4.1-4.4). Adicionar PUBLIC_AMAZON_TAG em .env.example e no Vercel.
3) Copiar e adaptar de vocacaodemae: src/lib/price-range.ts (seção 5), src/components/store/{ProductCard,ProductReviewArticle,StorePromo}.tsx, criar AffiliateNotice.tsx, src/pages/{StorePage,ProductPage}.tsx e as rotas src/routes/_site/loja/index.tsx, $slug.tsx, categoria/$slug.tsx (seções 4.5-4.9). Remover todo i18n. Texto do botão: sempre "Comprar agora na Amazon".
4) Criar src/routes/_site/politica-de-afiliados.tsx com o texto exato da seção 1.3 e linkar no rodapé; adicionar "Loja do Pai" no menu.
5) Widgets em artigos (seção 6): copiar FotosModelosExtension/FotosModelos/ToolEmbedHost/review-body e os cases de tiptap-html; criar o nó `product` e o ProductEmbed; botões no editor admin.
6) Admin de produtos (seção 7): rotas /admin/produtos, /admin/produtos/novo, /admin/produtos/$id, fila-fotos, fila-precos, ProductForm e server fns.
7) Scripts (seção 8): copiar amz.py, photo_upgrade.py, review_gen.py e BRIEF_REVIEW.md -> BRIEF_REVIEW_LOJA_PAI.md com as adaptações listadas; criar BRIEF_FAIXA_PRECO.md.
8) Seed (seção 11): confirmar os 5 ASINs com amz.py, preencher fotos oficiais e rodar supabase/seed/0003_loja_seed.sql. Depois cadastrar os outros 55 produtos da seção 10 (ASIN confirmado, >= 3 fotos oficiais, pros/cons), sem inventar dado.
9) Rodar pnpm typecheck, pnpm lint, pnpm test, pnpm build; abrir /loja, /loja/categoria/ferramentas e /loja/<slug> e conferir os critérios da seção 12.
10) Atualizar docs/plano/PROGRESSO.md (Fase 3: o que ficou pronto, pendências) e fazer commits pequenos por etapa em branch claude/fase-3-loja; abrir PR.

Regras invioláveis: nunca mostrar preço exato (só faixa pesquisada na internet; "não é o preço da Amazon"); botão sempre "Comprar agora na Amazon";
fotos só oficiais da Amazon (_AC_SL1500_, HTTP 200, > 15 KB); linha editorial de família tradicional; nunca rodar DELETE/DROP no banco;
nunca inventar ASIN, especificação ou nota. Se algo do plano não bater com o código real da Fase 1/2, siga o código e anote a diferença no PROGRESSO.md.
```

---

## 14. Checklist de pronto

- [ ] `supabase/migrations/0003_loja.sql` criado, aplicado e validado (10 categorias, RLS, bucket)
- [ ] `PUBLIC_AMAZON_TAG` em `.env.example`, `.env.local` e Vercel (Production e Preview)
- [ ] `src/lib/store-categories.ts`, `src/lib/affiliate.ts`, `src/lib/price-range.ts` (+ teste) prontos
- [ ] `types.ts`, `queries.ts`, `hub.functions.ts` com `getStoreData`, `getStoreCategoryData`, `getProductData`, `getProductsBySlugs`
- [ ] `ProductCard`, `ProductReviewArticle` ("Review do Pai"), `StorePromo`, `AffiliateNotice`, `StickyBuyBar`
- [ ] Rotas `/loja`, `/loja/categoria/$slug`, `/loja/$slug` com SSR, canonical, OG e JSON-LD (Product sem offers, Review, Breadcrumb)
- [ ] `/politica-de-afiliados` com o texto exato; rodapé linka; menu tem "Loja do Pai"
- [ ] Nós Tiptap `fotosModelos`, `product`, `buyCard`, `galeriaProduto` renderizando no SSR e hidratando no cliente
- [ ] Admin: listar, criar, editar, fila de fotos, fila de faixa de preço (recusa `max > 3×min` e menos de 2 lojas)
- [ ] Scripts: `amz.py`, `photo_upgrade.py`, `review_gen.py` adaptados; `BRIEF_REVIEW_LOJA_PAI.md` e `BRIEF_FAIXA_PRECO.md`
- [ ] Seed com 5 produtos completos aplicado; 60 produtos cadastrados com ASIN confirmado e ≥ 3 fotos oficiais
- [ ] `grep` sem "Ver preço" e sem preço exato hard-coded; `typecheck`, `lint`, `test`, `build` verdes
- [ ] Lighthouse mobile `/loja/<slug>` ≥ 85 Performance / 100 SEO
- [ ] `docs/plano/PROGRESSO.md` atualizado; PR `claude/fase-3-loja` aberto com os critérios da seção 12 marcados
