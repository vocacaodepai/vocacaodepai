// Consultas do Pai Indica (doc 04 §5): recebem o client (navegador ou read-only do servidor),
// como src/lib/queries.ts. Colunas de 0002_blog.sql (posts) e 0003_loja.sql (products,
// products_for_post, posts_for_product).
import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLISHED, nowIso } from "@/lib/queries";
import {
  PAI_INDICA_KINDS,
  type PaiIndicaKind,
  type PaiIndicaPost,
  type PaiIndicaProduct,
} from "./types";

export type DbClient = SupabaseClient;

export const PAI_INDICA_CARD_SELECT =
  "id,slug,title,subtitle,excerpt,cover_image_url,cover_image_alt,kind,product_category,product_subcategory,product_score,publish_at,updated_at,reading_time";

export const PRODUCT_SELECT =
  "id,slug,name,brand,asin,affiliate_url,image_url,images,price_min,price_max,price_range_checked_at,rating,rating_count";

function toCard(row: Record<string, unknown>): PaiIndicaPost {
  return {
    ...(row as unknown as PaiIndicaPost),
    review: (row["review"] as PaiIndicaPost["review"]) ?? null,
    comparison: (row["comparison"] as PaiIndicaPost["comparison"]) ?? null,
    faq: (row["faq"] as PaiIndicaPost["faq"]) ?? null,
    product_score: Number(row["product_score"] ?? 0),
  };
}

export function toProduct(row: Record<string, unknown>): PaiIndicaProduct {
  const images = row["images"];
  return {
    ...(row as unknown as PaiIndicaProduct),
    images: Array.isArray(images) ? (images as string[]).filter((s) => typeof s === "string") : [],
    price_min: row["price_min"] == null ? null : Number(row["price_min"]),
    price_max: row["price_max"] == null ? null : Number(row["price_max"]),
  };
}

export interface PaiIndicaListOpts {
  kind?: PaiIndicaKind;
  category?: string;
  subcategory?: string;
  limit?: number;
  excludeId?: string;
}

/** Posts publicados do Pai Indica (sem paginação: até 500, doc 04 §5.1). */
export async function queryPaiIndicaPosts(
  db: DbClient,
  opts: PaiIndicaListOpts = {},
): Promise<PaiIndicaPost[]> {
  let q = db
    .from("posts")
    .select(PAI_INDICA_CARD_SELECT)
    .in("kind", opts.kind ? [opts.kind] : [...PAI_INDICA_KINDS])
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso());
  if (opts.category) q = q.eq("product_category", opts.category);
  if (opts.subcategory) q = q.eq("product_subcategory", opts.subcategory);
  if (opts.excludeId) q = q.neq("id", opts.excludeId);
  const { data, error } = await q
    .order("publish_at", { ascending: false })
    .limit(opts.limit ?? 500);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toCard);
}

/** Produtos ativos por slug (ordem preservada conforme `slugs`). */
export async function queryProductsBySlugs(
  db: DbClient,
  slugs: string[],
): Promise<PaiIndicaProduct[]> {
  const clean = Array.from(new Set(slugs.filter(Boolean)));
  if (clean.length === 0) return [];
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .in("slug", clean)
    .eq("active", true);
  if (error) throw error;
  const rows = ((data ?? []) as Record<string, unknown>[]).map(toProduct);
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return clean.map((s) => bySlug.get(s)).filter((p): p is PaiIndicaProduct => Boolean(p));
}

/** `products_for_post(p_post_id)` da 0003_loja.sql. */
export async function queryProductsForPost(
  db: DbClient,
  postId: string,
): Promise<PaiIndicaProduct[]> {
  const { data, error } = await db.rpc("products_for_post", { p_post_id: postId });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toProduct);
}

export interface PostForProduct {
  id: string;
  slug: string;
  title: string;
  kind: PaiIndicaKind;
  product_score: number | null;
  cover_image_url: string | null;
  publish_at: string | null;
}

/** `posts_for_product(p_product_slug)` da 0003_loja.sql (a Loja do Pai lista os Pai Indica do produto). */
export async function queryPostsForProduct(
  db: DbClient,
  productSlug: string,
): Promise<PostForProduct[]> {
  const { data, error } = await db.rpc("posts_for_product", { p_product_slug: productSlug });
  if (error) throw error;
  return (data ?? []) as PostForProduct[];
}

/** Slugs de produto citados por um post (review.product_slug ou comparison.products[].product_slug). */
export function productSlugsOf(post: {
  kind: string;
  review?: { product_slug?: string } | null;
  comparison?: { products?: { product_slug: string }[] } | null;
}): string[] {
  if (post.kind === "review") return post.review?.product_slug ? [post.review.product_slug] : [];
  return (post.comparison?.products ?? []).map((p) => p.product_slug).filter(Boolean);
}

/** "Continue no Pai Indica": 3 da mesma categoria de produto + 3 de outras (doc 04 §5.2). */
export async function queryRelatedPaiIndica(
  db: DbClient,
  post: { id: string; product_category: string },
): Promise<PaiIndicaPost[]> {
  const same = await queryPaiIndicaPosts(db, {
    category: post.product_category,
    excludeId: post.id,
    limit: 3,
  });
  const others = await queryPaiIndicaPosts(db, { excludeId: post.id, limit: 12 });
  const seen = new Set(same.map((p) => p.id));
  const rest = others.filter(
    (p) => !seen.has(p.id) && p.product_category !== post.product_category,
  );
  return [...same, ...rest.slice(0, 3)];
}
