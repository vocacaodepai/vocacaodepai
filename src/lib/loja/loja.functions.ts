import { createServerFn } from "@tanstack/react-start";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { normalizeAffiliate } from "./affiliate";
import {
  queryPostsForProduct,
  queryPriceChecks,
  queryProductBySlug,
  queryProductCategories,
  queryProductsBySlugs,
  queryStoreProducts,
} from "./queries";
import type {
  Product,
  ProductCategory,
  ProductLite,
  ProductPost,
  ProductPriceCheck,
} from "./types";

// Server functions da Loja do Pai (doc 05 §4.4). Rodam no servidor com o client
// read-only (chave publicável): só enxergam o que o RLS libera (active = true).
// A tag de afiliado entra aqui (normalizeAffiliate), nunca no cliente.
// Banco fora do ar ou placeholder: devolve listas vazias e a página renderiza
// o estado vazio (mesmo padrão de hub.functions.ts).

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

const withTag = <
  T extends { asin: string | null; affiliate_url: string; affiliate_network: string },
>(
  p: T,
): T => ({ ...p, affiliate_url: normalizeAffiliate(p) });

export interface StoreData {
  categories: ProductCategory[];
  products: Product[];
}

export const getStoreData = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreData> => {
    const db = await createReadOnlySupabaseClient();
    const [categories, products] = await Promise.all([
      safe(queryProductCategories(db), [] as ProductCategory[]),
      safe(queryStoreProducts(db, { light: true }), [] as Product[]),
    ]);
    return { categories, products: products.map(withTag) };
  },
);

export interface StoreCategoryData {
  category: ProductCategory;
  categories: ProductCategory[];
  products: Product[];
}

export const getStoreCategoryData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }): Promise<StoreCategoryData | null> => {
    const db = await createReadOnlySupabaseClient();
    const categories = await safe(queryProductCategories(db), [] as ProductCategory[]);
    const category = categories.find((c) => c.slug === data.slug) ?? null;
    if (!category) return null;
    const products = await safe(
      queryStoreProducts(db, { light: true, categoryId: category.id }),
      [] as Product[],
    );
    return { category, categories, products: products.map(withTag) };
  });

export interface ProductData {
  product: Product;
  similar: Product[];
  relatedPosts: ProductPost[];
  /** Só chega preenchido para admin logado (RLS); a página mostra loja + data, sem valor. */
  priceChecks: ProductPriceCheck[];
}

export const getProductData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }): Promise<ProductData | null> => {
    if (!data.slug) return null;
    const db = await createReadOnlySupabaseClient();
    const product = await safe(queryProductBySlug(db, data.slug), null);
    if (!product) return null;
    const [all, relatedPosts, priceChecks] = await Promise.all([
      safe(queryStoreProducts(db, { light: true }), [] as Product[]),
      safe(queryPostsForProduct(db, product.slug, 3), [] as ProductPost[]),
      safe(queryPriceChecks(db, product.id, 6), [] as ProductPriceCheck[]),
    ]);
    // Parecidos: mesma subcategoria → mesma categoria → resto (doc 05 §4.7).
    const others = all.filter((x) => x.id !== product.id);
    const sameSub = others.filter(
      (x) => x.category_id === product.category_id && x.subcategory === product.subcategory,
    );
    const sameCat = others.filter(
      (x) => x.category_id === product.category_id && x.subcategory !== product.subcategory,
    );
    const rest = others.filter((x) => x.category_id !== product.category_id);
    return {
      product: withTag(product),
      similar: [...sameSub, ...sameCat, ...rest].slice(0, 4).map(withTag),
      relatedPosts,
      priceChecks: priceChecks.map((c) => ({ ...c, price: 0, url: null })),
    };
  });

/** Widgets de artigo (fotosModelos, product, buyCard, galeriaProduto): nunca chamam o Supabase direto. */
export const getProductsBySlugs = createServerFn({ method: "GET" })
  .inputValidator((d: { slugs: string[] }) => ({
    slugs: Array.isArray(d.slugs) ? d.slugs.map(String).slice(0, 20) : [],
  }))
  .handler(async ({ data }): Promise<ProductLite[]> => {
    if (data.slugs.length === 0) return [];
    const db = await createReadOnlySupabaseClient();
    const products = await safe(queryProductsBySlugs(db, data.slugs), [] as ProductLite[]);
    return products.map(withTag);
  });
