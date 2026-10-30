#!/usr/bin/env node
// Gera supabase/migrations/0011_seed_pai_indica.sql a partir dos specs em ./posts/*.mjs e ./products.mjs.
// Body no Padrão B do Pai Indica (CLAUDE.md §7; doc 04 §5.2). Marcação nos textos: **negrito**, [texto](href).
// Botões: href "{AMAZON:slug}" (resolvido por src/lib/pai-indica/body.ts com products.affiliate_url + tag);
// faixa: "{FAIXA:slug}". Uso: node scripts/rotina/seed_pai_indica/gen.mjs
import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");
const OUT = join(ROOT, "supabase/migrations/0011_seed_pai_indica.sql");
const AUTHOR =
  "coalesce((select id from auth.users where lower(email) = 'contato@vocacaodepai.com.br'), 'e8bb17c5-ce46-4d2c-bda7-4d86d975f6fa'::uuid)";
const CATEGORY = "(select id from public.categories where slug = 'pai-indica')";

import { words } from "./tiptap.mjs";
const weighted = (cs) =>
  Math.round(
    (cs.reduce((s, c) => s + c.weight * c.score, 0) / cs.reduce((s, c) => s + c.weight, 0)) * 10,
  ) / 10;

// ---------------------------------------------------------------- SQL
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const j = (tag, v) => `$${tag}$${JSON.stringify(v)}$${tag}$::jsonb`;

function postSql(spec, i) {
  const doc = { type: "doc", content: spec.body };
  const n = words(doc);
  if (n < 1100) throw new Error(`${spec.slug}: ${n} palavras (mínimo 1100)`);
  const score =
    spec.kind === "review"
      ? spec.review.score
      : spec.comparison.products.find((x) => x.product_slug === spec.comparison.winner_slug).score;
  if (spec.kind === "review") {
    const calc = weighted(spec.review.criteria);
    if (Math.abs(calc - spec.review.score) > 0.15)
      throw new Error(`${spec.slug}: score ${spec.review.score} ≠ ${calc}`);
  } else {
    for (const x of spec.comparison.products) {
      const calc = weighted(
        spec.comparison.criteria.map((k, idx) => ({
          weight: k.weight,
          score: x.criteria_scores[idx],
        })),
      );
      if (Math.abs(calc - x.score) > 0.15)
        throw new Error(`${spec.slug}/${x.product_slug}: score ${x.score} ≠ ${calc}`);
    }
  }
  const cols =
    "slug, title, subtitle, excerpt, body, cover_image_url, cover_image_alt, category_id, author_id, kind, review, comparison, product_category, product_subcategory, product_score, faq, quiz, status, publish_at, reading_time, seo_title, seo_description";
  const vals = [
    q(spec.slug),
    q(spec.title),
    q(spec.subtitle),
    q(spec.excerpt),
    j("body", doc),
    q(`/images/covers/${spec.slug}.jpg`),
    q(spec.cover_alt),
    CATEGORY,
    AUTHOR,
    q(spec.kind),
    spec.kind === "review" ? j("rev", spec.review) : "null",
    spec.kind === "review" ? "null" : j("cmp", spec.comparison),
    q(spec.product_category),
    q(spec.product_subcategory),
    String(score),
    j("faq", spec.faq),
    j("quiz", spec.quiz ?? []),
    "'published'",
    `now() - interval '${5 - i} days'`,
    String(Math.max(1, Math.ceil(n / 200))),
    q(spec.seo_title),
    q(spec.seo_description),
  ];
  return `-- ${i + 1}. ${spec.title} (${spec.kind}, ${n} palavras)
insert into public.posts (${cols})
values (
  ${vals.join(",\n  ")}
)
on conflict (slug) do update set
  title = excluded.title, subtitle = excluded.subtitle, excerpt = excluded.excerpt, body = excluded.body,
  cover_image_url = excluded.cover_image_url, cover_image_alt = excluded.cover_image_alt, category_id = excluded.category_id,
  author_id = excluded.author_id, kind = excluded.kind, review = excluded.review, comparison = excluded.comparison,
  product_category = excluded.product_category, product_subcategory = excluded.product_subcategory, product_score = excluded.product_score,
  faq = excluded.faq, quiz = excluded.quiz, reading_time = excluded.reading_time, seo_title = excluded.seo_title,
  seo_description = excluded.seo_description, status = 'published',
  publish_at = coalesce(public.posts.publish_at, excluded.publish_at), updated_at = now();
`;
}

function productSql(pr) {
  const cols =
    "slug, name, brand, asin, affiliate_network, affiliate_url, image_url, images, short_description, description, pros, cons, review, category_id, subcategory, price, price_min, price_max, price_range_checked_at, rating, rating_count, featured, sort_order, active";
  const vals = [
    q(pr.slug),
    q(pr.name),
    q(pr.brand),
    pr.asin ? q(pr.asin) : "null",
    "'amazon'",
    q(pr.affiliate_url),
    pr.image_url ? q(pr.image_url) : "null",
    j("img", pr.images ?? []),
    q(pr.short_description),
    q(pr.description),
    j("pros", pr.pros),
    j("cons", pr.cons),
    pr.review ? j("rv", pr.review) : "null",
    `(select id from public.product_categories where slug = ${q(pr.category)})`,
    q(pr.subcategory),
    "null",
    String(pr.price_min),
    String(pr.price_max),
    "null",
    "null",
    "0",
    pr.featured ? "true" : "false",
    String(pr.sort_order ?? 0),
    "true",
  ];
  return `insert into public.products (${cols})
values (${vals.join(", ")})
on conflict (slug) do update set
  name = excluded.name, brand = excluded.brand, asin = coalesce(public.products.asin, excluded.asin),
  affiliate_url = case when public.products.asin is null then excluded.affiliate_url else public.products.affiliate_url end,
  image_url = coalesce(public.products.image_url, excluded.image_url),
  images = case when jsonb_array_length(public.products.images) >= 3 then public.products.images else excluded.images end,
  short_description = excluded.short_description, description = excluded.description, pros = excluded.pros, cons = excluded.cons,
  review = coalesce(public.products.review, excluded.review), category_id = excluded.category_id, subcategory = excluded.subcategory,
  price_min = coalesce(public.products.price_min, excluded.price_min), price_max = coalesce(public.products.price_max, excluded.price_max),
  featured = excluded.featured, sort_order = excluded.sort_order, active = true, updated_at = now();
`;
}

const { products } = await import(pathToFileURL(join(HERE, "products.mjs")).href);
const files = readdirSync(join(HERE, "posts"))
  .filter((f) => f.endsWith(".mjs"))
  .sort();
const specs = [];
for (const f of files)
  specs.push((await import(pathToFileURL(join(HERE, "posts", f)).href)).default);

const header = `-- 0011_seed_pai_indica.sql — os 6 primeiros Pai Indica (doc 04 §10: 3 reviews, 2 comparativos, 1 lista) + os produtos citados.
-- Gerado por scripts/rotina/seed_pai_indica/gen.mjs (NÃO editar à mão: edite os specs e rode o gerador).
-- Idempotente: on conflict (slug) do update. Posts entram publicados (CLAUDE.md §4.2); publish_at escalonado (1 por dia).
-- Produtos: ASIN e foto oficial ainda NÃO confirmados (Amazon bloqueia a consulta no container): asin null,
-- affiliate_url com busca na Amazon e image_url null, marcados como PENDENTE em docs/plano/progresso-fase-2.md.
-- Antes de aplicar em produção: preencher asin/affiliate_url (/dp/<ASIN>/?tag=<PUBLIC_AMAZON_TAG>), image_url/images
-- (fotos oficiais _AC_SL1500_, HEAD 200) e a review longa (products.review) de cada produto; regerar as capas com cover_cmp.py.
-- Faixas de preço: plausíveis, price_max ≤ 3×price_min, price_range_checked_at null (= "estimativa" no site) até a pesquisa em 2 lojas.
-- Botões no body usam href "{AMAZON:slug}" e a faixa "{FAIXA:slug}": o site troca pelos dados de products (src/lib/pai-indica/body.ts).
-- Validar: node scripts/validate-content.mjs --files supabase/migrations/0011_seed_pai_indica.sql

-- ===== Produtos (products; product_categories vem da 0003_loja.sql) =====
`;
let sql =
  header +
  products.map(productSql).join("\n") +
  "\n-- ===== Posts do Pai Indica =====\n\n" +
  specs.map(postSql).join("\n");
writeFileSync(OUT, sql);
console.log(`✓ ${OUT}: ${products.length} produtos, ${specs.length} posts`);
for (const s of specs)
  console.log(
    `  ${s.kind.padEnd(11)} ${s.slug} (${words({ type: "doc", content: s.body })} palavras)`,
  );
