import { createServerFn } from "@tanstack/react-start";
import { createReadOnlySupabaseClient } from "./seo.functions";
import {
  queryPaiIndicaPosts,
  queryProductsBySlugs,
  queryRelatedPaiIndica,
} from "./pai-indica/queries";
import type { PaiIndicaPost, PaiIndicaProduct } from "./pai-indica/types";

// Server functions do Pai Indica (doc 04 §5.1/5.2): listagem sem paginação, produtos citados
// por um post e "Continue no Pai Indica". Usam o client read-only (chave publicável): só o que o
// RLS libera ao público. Backend fora do ar → lista vazia (a página renderiza o estado vazio).

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

export const getPaiIndicaList = createServerFn({ method: "GET" }).handler(
  async (): Promise<PaiIndicaPost[]> => {
    const db = await createReadOnlySupabaseClient();
    return safe(queryPaiIndicaPosts(db), [] as PaiIndicaPost[]);
  },
);

export const getProductsBySlugs = createServerFn({ method: "GET" })
  .inputValidator((data: { slugs: string[] }) => ({
    slugs: Array.isArray(data?.slugs) ? data.slugs.map(String) : [],
  }))
  .handler(async ({ data }): Promise<PaiIndicaProduct[]> => {
    const db = await createReadOnlySupabaseClient();
    return safe(queryProductsBySlugs(db, data.slugs), [] as PaiIndicaProduct[]);
  });

export const getRelatedPaiIndica = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; product_category: string }) => ({
    id: String(data?.id ?? ""),
    product_category: String(data?.product_category ?? ""),
  }))
  .handler(async ({ data }): Promise<PaiIndicaPost[]> => {
    if (!data.id) return [];
    const db = await createReadOnlySupabaseClient();
    return safe(queryRelatedPaiIndica(db, data), [] as PaiIndicaPost[]);
  });
