// Faixa de preço (CLAUDE.md §5.2): nunca preço exato; texto "Faixa de preço pesquisada em <data>: R$ X a R$ Y".
import { formatDateShort } from "@/lib/site";
import type { PaiIndicaProduct } from "./types";

export const PRICE_FALLBACK = "consulte o preço na Amazon";

const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

export function hasRange(p: Pick<PaiIndicaProduct, "price_min" | "price_max"> | undefined | null) {
  return Boolean(p && p.price_min != null && p.price_max != null && p.price_min > 0);
}

/** "R$ 180 a R$ 260" (sem data) ou o fallback. Usado em células e no fotosModelos. */
export function faixaCurta(p: PaiIndicaProduct | undefined | null): string {
  if (!hasRange(p)) return PRICE_FALLBACK;
  return `${brl(p!.price_min!)} a ${brl(p!.price_max!)}`;
}

/** Frase completa com a data da pesquisa (CLAUDE.md §5.2). */
export function faixaTexto(p: PaiIndicaProduct | undefined | null): string {
  if (!hasRange(p)) return "Faixa de preço ainda não pesquisada: consulte o preço na Amazon.";
  const when = p!.price_range_checked_at
    ? ` pesquisada em ${formatDateShort(p!.price_range_checked_at)}`
    : " (estimativa)";
  return `Faixa de preço${when}: ${brl(p!.price_min!)} a ${brl(p!.price_max!)}`;
}

/** Mapa slug → faixa curta, para `{FAIXA:slug}` na tabela do comparativo. */
export function faixasPorSlug(products: PaiIndicaProduct[]): Record<string, string> {
  return Object.fromEntries(products.map((p) => [p.slug, faixaCurta(p)]));
}

/** Troca `{FAIXA:slug}` por texto em uma string. */
export function replaceFaixa(text: string, faixas: Record<string, string>): string {
  return text.replace(/\{FAIXA:([a-z0-9-]+)\}/g, (_, s: string) => faixas[s] ?? PRICE_FALLBACK);
}

/** Garante `?tag=` no link de afiliado quando faltar (doc 02 §6.3). */
export function withAffiliateTag(href: string): string {
  const tag = (import.meta.env.PUBLIC_AMAZON_TAG as string | undefined) || "";
  if (!href || !tag || /[?&]tag=/.test(href)) return href;
  return `${href}${href.includes("?") ? "&" : "?"}tag=${encodeURIComponent(tag)}`;
}
