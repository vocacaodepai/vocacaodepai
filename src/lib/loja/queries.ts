// Consultas públicas da Loja do Pai (doc 05 §4.3). Recebem o client como parâmetro
// para rodar tanto no navegador quanto no read-only do servidor (mesmo padrão de
// src/lib/queries.ts). Colunas de supabase/migrations/0003_loja.sql; RLS: anon lê só
// `active = true`, e `product_price_checks` só o admin lê.
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Product,
  ProductCategory,
  ProductLite,
  ProductPost,
  ProductPriceCheck,
} from "./types";

export type DbClient = SupabaseClient;

const CATEGORY_JOIN = "category:product_categories(id,slug,name,description,icon,sort_order)";

/** Colunas dos cards (sem description/review, que pesam na vitrine). */
export const PRODUCT_CARD_SELECT = `id,slug,name,brand,asin,affiliate_network,affiliate_url,image_url,images,short_description,price,price_min,price_max,price_range_checked_at,rating,rating_count,featured,sort_order,subcategory,category_id,active,created_at,updated_at,${CATEGORY_JOIN}`;

export const PRODUCT_FULL_SELECT = `*,${CATEGORY_JOIN}`;

const LITE_SELECT =
  "id,slug,name,brand,asin,image_url,images,affiliate_url,affiliate_network,price,price_min,price_max,price_range_checked_at";

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

/** Normaliza jsonb (images/pros/cons/marketplace_urls) e números vindos do PostgREST. */
export function toProduct(row: Record<string, unknown>): Product {
  const r = row as Record<string, unknown>;
  const num = (v: unknown) => (v == null || v === "" ? null : Number(v));
  return {
    ...(r as unknown as Product),
    images: asArray(r["images"]),
    pros: asArray(r["pros"]),
    cons: asArray(r["cons"]),
    marketplace_urls:
      r["marketplace_urls"] && typeof r["marketplace_urls"] === "object"
        ? (r["marketplace_urls"] as Record<string, string>)
        : {},
    review:
      r["review"] && typeof r["review"] === "object" ? (r["review"] as Product["review"]) : null,
    price: num(r["price"]),
    price_min: num(r["price_min"]),
    price_max: num(r["price_max"]),
    rating: num(r["rating"]),
    rating_count: Number(r["rating_count"] ?? 0),
    category: (r["category"] as ProductCategory | null | undefined) ?? null,
  };
}

export async function queryProductCategories(db: DbClient): Promise<ProductCategory[]> {
  const { data, error } = await db
    .from("product_categories")
    .select("id,slug,name,description,icon,parent_id,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

export interface StoreProductsOpts {
  categoryId?: string;
  featured?: boolean;
  limit?: number;
  /** Só as colunas dos cards. */
  light?: boolean;
}

/** Produtos ativos, `featured desc, sort_order asc` (doc 05 §4.5). */
export async function queryStoreProducts(
  db: DbClient,
  o: StoreProductsOpts = {},
): Promise<Product[]> {
  let q = db
    .from("products")
    .select(o.light ? PRODUCT_CARD_SELECT : PRODUCT_FULL_SELECT)
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (o.featured) q = q.eq("featured", true);
  if (o.categoryId) q = q.eq("category_id", o.categoryId);
  if (o.limit) q = q.limit(o.limit);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as Record<string, unknown>[]).map(toProduct);
}

export async function queryProductBySlug(db: DbClient, slug: string): Promise<Product | null> {
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_FULL_SELECT)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toProduct(data as Record<string, unknown>) : null;
}

/** Produtos resumidos para os widgets de artigo (fotosModelos, product, buyCard, galeriaProduto). */
export async function queryProductsBySlugs(db: DbClient, slugs: string[]): Promise<ProductLite[]> {
  const clean = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))].slice(0, 20);
  if (clean.length === 0) return [];
  const { data, error } = await db
    .from("products")
    .select(LITE_SELECT)
    .eq("active", true)
    .in("slug", clean);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => {
    const p = toProduct(r);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      asin: p.asin,
      image_url: p.image_url,
      images: p.images,
      affiliate_url: p.affiliate_url,
      affiliate_network: p.affiliate_network,
      price: p.price,
      price_min: p.price_min,
      price_max: p.price_max,
      price_range_checked_at: p.price_range_checked_at,
    };
  });
}

/** Posts do Pai Indica que citam o produto (`posts_for_product`, 0003_loja.sql). */
export async function queryPostsForProduct(
  db: DbClient,
  slug: string,
  limit = 3,
): Promise<ProductPost[]> {
  const { data, error } = await db.rpc("posts_for_product", { p_product_slug: slug });
  if (error) throw error;
  return ((data ?? []) as ProductPost[]).slice(0, limit);
}

/** Checagens de preço (RLS: só admin lê; anon recebe lista vazia). */
export async function queryPriceChecks(
  db: DbClient,
  productId: string,
  limit = 6,
): Promise<ProductPriceCheck[]> {
  const { data, error } = await db
    .from("product_price_checks")
    .select("id,product_id,store,price,url,checked_at")
    .eq("product_id", productId)
    .order("checked_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as unknown as ProductPriceCheck),
    price: Number(r["price"]),
  }));
}

/** Busca local (vitrine): nome, marca, descrição curta e subcategoria. */
export function matchesProductQuery(p: Product, q: string): boolean {
  const term = q.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  if (!term) return true;
  const hay = [p.name, p.brand, p.short_description, p.subcategory, p.category?.name]
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
  return term.split(/\s+/).every((t) => hay.includes(t));
}
