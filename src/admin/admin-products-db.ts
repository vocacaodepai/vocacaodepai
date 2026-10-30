/**
 * Acesso a dados do admin de produtos da Loja do Pai (doc 05 §7).
 *
 * Mesmo padrão de admin-db.ts: cliente Supabase do navegador com a sessão do
 * editor/admin; o RLS da 0003_loja.sql (`public.is_admin()`) garante que só a
 * equipe lê inativos e grava. Tipos locais (os gerados ainda são os do VDM).
 * Nunca `delete`: produto sai do ar com `active = false`.
 */
import { supabase } from "@/integrations/supabase/client";
import { toProduct } from "@/lib/loja/queries";
import { isSanePriceRange } from "@/lib/loja/price-range";
import { asinFromUrl } from "@/lib/loja/affiliate";
import type {
  Product,
  ProductCategory,
  ProductPriceCheck,
  ProductReviewData,
} from "@/lib/loja/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const CATEGORY_JOIN = "category:product_categories(id,slug,name,description,icon,sort_order)";

/** Campos gravados pelo formulário (o restante é calculado por default/trigger). */
export type AdminProductInput = Omit<
  Product,
  "id" | "created_at" | "updated_at" | "category" | "review"
> & { id?: string; review: ProductReviewData | null };

export async function fetchProductCategories(): Promise<ProductCategory[]> {
  const { data, error } = await db
    .from("product_categories")
    .select("id,slug,name,description,icon,parent_id,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ProductCategory[];
}

/** Todos os produtos (ativos e inativos), `featured desc, sort_order`. */
export async function fetchAdminProducts(): Promise<Product[]> {
  const { data, error } = await db
    .from("products")
    .select(`*,${CATEGORY_JOIN}`)
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toProduct);
}

export async function fetchAdminProduct(id: string): Promise<Product | null> {
  const { data, error } = await db
    .from("products")
    .select(`*,${CATEGORY_JOIN}`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toProduct(data as Record<string, unknown>) : null;
}

export async function fetchProductSlugs(): Promise<string[]> {
  const { data, error } = await db.from("products").select("slug");
  if (error) throw error;
  return ((data ?? []) as { slug: string }[]).map((r) => r.slug);
}

/** Validação mínima do cliente (a constraint do banco repete as regras de preço). */
export function validateProductInput(p: AdminProductInput): string[] {
  const errors: string[] = [];
  if (!p.name.trim()) errors.push("Nome obrigatório.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))
    errors.push("Slug em kebab-case (a-z, 0-9, hífen).");
  if (p.asin && !/^[A-Z0-9]{10}$/.test(p.asin))
    errors.push("ASIN precisa de 10 caracteres (A-Z, 0-9).");
  if (!p.affiliate_url.trim())
    errors.push("affiliate_url obrigatório (link da Amazon ou busca PENDENTE).");
  if (p.images.length > 8) errors.push("Até 8 fotos.");
  for (const u of p.images)
    if (!/^https:\/\/m\.media-amazon\.com\//.test(u))
      errors.push(`Foto fora de m.media-amazon.com: ${u.slice(0, 60)}`);
  if (p.image_url && !/^https:\/\/m\.media-amazon\.com\//.test(p.image_url))
    errors.push("image_url precisa ser foto oficial da Amazon.");
  if ((p.short_description ?? "").length > 130) errors.push("Descrição curta: até 130 caracteres.");
  if (p.price_min != null || p.price_max != null) {
    if (p.price_min == null || p.price_max == null)
      errors.push("Faixa: preencha price_min e price_max.");
    else if (!isSanePriceRange(p.price_min, p.price_max))
      errors.push("Faixa inválida: price_max ≤ 3 × price_min e ambos > 0.");
  }
  if (p.rating != null && (p.rating < 0 || p.rating > 5))
    errors.push("Nota de compradores entre 0 e 5.");
  const textBlob = JSON.stringify({
    d: p.description,
    s: p.short_description,
    r: p.review,
    p: p.pros,
    c: p.cons,
  });
  if (/R\$\s?\d/.test(textBlob))
    errors.push('Nunca "R$ <número>" em texto (só faixa escrita pelo componente).');
  if (/ver pre[çc]o/i.test(textBlob))
    errors.push('Texto proibido: o botão é sempre "Comprar agora na Amazon".');
  if (p.review) errors.push(...validateReviewJson(p.review).map((e) => `Review: ${e}`));
  if (p.active && !p.image_url) errors.push("Produto ativo precisa de foto oficial (image_url).");
  if (p.active && !asinFromUrl(p.affiliate_url) && !p.asin)
    errors.push("Produto ativo precisa de ASIN (link /dp/<ASIN>).");
  return errors;
}

/** Mesmas regras do review_gen.py (doc 05 §7.2). */
export function validateReviewJson(r: ProductReviewData): string[] {
  const e: string[] = [];
  if (typeof r.nota !== "number" || r.nota < 0 || r.nota > 10) e.push("nota 0-10");
  if (!Array.isArray(r.criterios) || r.criterios.length !== 5)
    e.push("exatamente 5 critérios {nome, nota}");
  if (!Array.isArray(r.em_3_pontos) || r.em_3_pontos.length !== 3)
    e.push("em_3_pontos precisa ter 3");
  const secs = Array.isArray(r.secoes) ? r.secoes : [];
  if (secs.length < 6) e.push("mínimo 6 seções");
  if (secs.filter((s) => s.cta).length < 3) e.push("mínimo 3 seções com cta: true");
  if (!Array.isArray(r.faq) || r.faq.length < 4) e.push("mínimo 4 perguntas no faq {q, a}");
  if (!Array.isArray(r.ficha) || r.ficha.length < 5) e.push("ficha com pelo menos 5 linhas");
  for (const k of [
    "titulo",
    "resumo",
    "ideal_para",
    "como_avaliamos",
    "opiniao",
    "preco_texto",
  ] as const)
    if (!r[k]) e.push(`faltou ${k}`);
  return e;
}

export async function upsertAdminProduct(input: AdminProductInput): Promise<Product> {
  const payload: Record<string, unknown> = { ...input };
  delete payload["category"];
  if (!payload["id"]) delete payload["id"];
  const { data, error } = await db
    .from("products")
    .upsert(payload, { onConflict: "id" })
    .select(`*,${CATEGORY_JOIN}`)
    .single();
  if (error) throw error;
  return toProduct(data as Record<string, unknown>);
}

export async function setProductFlags(id: string, flags: { active?: boolean; featured?: boolean }) {
  const { error } = await db.from("products").update(flags).eq("id", id);
  if (error) throw error;
}

/** Grava fotos conferidas (HEAD 200 e > 15 KB, via checkImageUrls) e a principal. */
export async function applyProductPhotos(id: string, images: string[]) {
  const clean = images.filter((u) => /^https:\/\/m\.media-amazon\.com\//.test(u)).slice(0, 8);
  if (clean.length === 0) throw new Error("Nenhuma foto oficial válida.");
  const { error } = await db
    .from("products")
    .update({ images: clean, image_url: clean[0] })
    .eq("id", id);
  if (error) throw error;
}

export interface PriceCheckInput {
  store: string;
  price: number;
  url: string;
}

/**
 * Fila de faixa de preço (doc 05 §7.4 e §8.4): ≥ 2 lojas, mesmo item, `max ≤ 3×min`.
 * Insere em product_price_checks e atualiza price_min/price_max/price_range_checked_at.
 */
export async function savePriceChecks(productId: string, checks: PriceCheckInput[]) {
  const rows = checks
    .map((c) => ({ store: c.store.trim(), price: Number(c.price), url: c.url.trim() || null }))
    .filter((c) => c.store && Number.isFinite(c.price) && c.price > 0);
  const stores = new Set(rows.map((c) => c.store.toLowerCase()));
  if (rows.length < 2 || stores.size < 2)
    throw new Error("Precisa de preço em pelo menos 2 lojas diferentes.");
  const min = Math.min(...rows.map((c) => c.price));
  const max = Math.max(...rows.map((c) => c.price));
  if (!isSanePriceRange(min, max)) {
    throw new Error(
      `Faixa recusada: máximo (${max}) maior que 3 × mínimo (${min}). Provável item diferente; descarte o outlier.`,
    );
  }
  const { error: insErr } = await db
    .from("product_price_checks")
    .insert(rows.map((c) => ({ product_id: productId, ...c })));
  if (insErr) throw insErr;
  const { error: updErr } = await db
    .from("products")
    .update({ price_min: min, price_max: max, price_range_checked_at: new Date().toISOString() })
    .eq("id", productId);
  if (updErr) throw updErr;
  return { min, max };
}

export async function fetchPriceChecks(
  productId: string,
  limit = 10,
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

/* ---------------- Filas (mesma lógica de photo_upgrade.py e BRIEF_FAIXA_PRECO.md) ---------------- */

const DAYS_60 = 60 * 24 * 3600 * 1000;

/** Fila de fotos: ativos sem foto `_AC_SL1500_` ou com menos de 5 fotos, `featured desc, sort_order`. */
export function photoQueue(products: Product[]): Product[] {
  return products.filter(
    (p) =>
      p.active && (!p.image_url || !p.image_url.includes("_AC_SL1500_") || p.images.length < 5),
  );
}

/** Fila de faixa: ativos sem `price_range_checked_at` primeiro, depois os com mais de 60 dias. Limite 15. */
export function priceQueue(products: Product[], limit = 15): Product[] {
  const now = Date.now();
  const never = products.filter((p) => p.active && !p.price_range_checked_at);
  const stale = products.filter(
    (p) =>
      p.active &&
      p.price_range_checked_at &&
      now - new Date(p.price_range_checked_at).getTime() > DAYS_60,
  );
  return [...never, ...stale].slice(0, limit);
}

/** Fila de ASIN: produtos (ativos ou não) sem ASIN confirmado (link de busca PENDENTE). */
export function asinQueue(products: Product[]): Product[] {
  return products.filter((p) => !p.asin && !asinFromUrl(p.affiliate_url));
}
