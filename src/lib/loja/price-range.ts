// Faixa de preço da Loja do Pai (doc 05 §5, herdado do Vocação de Mãe).
// Regras fixas: nunca preço exato; faixa de mercado quando há price_min/price_max
// pesquisados; senão estimativa -15% / +20% sobre o último `price` interno.
// Texto no site: "Faixa de preço pesquisada em <data>: R$ X a R$ Y" (CLAUDE.md §5.2).

const LOW_FACTOR = 0.85;
const HIGH_FACTOR = 1.2;

function parseBRL(value: string | number | null | undefined): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : null;
  const n = Number.parseFloat(value.replace(/[^\d,]/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

const fmt = (n: number) => `R$ ${n.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

function range(low: number, high: number): string {
  return low === high ? fmt(low) : `${fmt(low)} a ${fmt(high)}`;
}

export interface PriceRangeInput {
  price?: string | number | null;
  price_min?: number | null;
  price_max?: number | null;
  price_range_checked_at?: string | null;
}

export interface PriceRangeInfo {
  /** "R$ 100 a R$ 150" (sem centavos). */
  text: string;
  /** "market": pesquisado em lojas; "estimate": margem sobre o último preço interno. */
  kind: "market" | "estimate";
  /** Data da pesquisa (dd/mm), só para kind "market" com `price_range_checked_at`. */
  checkedOn: string | null;
}

export function productPriceRange(p: PriceRangeInput | null | undefined): PriceRangeInfo | null {
  if (!p) return null;
  const min = p.price_min != null ? Number(p.price_min) : null;
  const max = p.price_max != null ? Number(p.price_max) : null;
  if (min && max && min > 0 && max >= min) {
    const checkedOn = p.price_range_checked_at
      ? new Date(p.price_range_checked_at).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
        })
      : null;
    return { text: range(Math.floor(min), Math.ceil(max)), kind: "market", checkedOn };
  }
  const base = parseBRL(p.price);
  if (base === null) return null;
  return {
    text: range(Math.floor(base * LOW_FACTOR), Math.ceil(base * HIGH_FACTOR)),
    kind: "estimate",
    checkedOn: null,
  };
}

/**
 * Frase completa para a página (doc 05 §4.7). Nunca apresenta a faixa como preço da Amazon.
 * - market com data: "Faixa de preço pesquisada em 24/10: R$ 100 a R$ 150. Não é o preço da Amazon."
 * - market sem data: "Faixa de preço: R$ 100 a R$ 150 (pesquisa de loja ainda não registrada). Não é o preço da Amazon."
 * - estimate: "Faixa estimada: R$ 85 a R$ 120. É só uma estimativa, não o preço da Amazon."
 */
export function priceRangeSentence(info: PriceRangeInfo | null | undefined): string | null {
  if (!info) return null;
  if (info.kind === "estimate") {
    return `Faixa estimada: ${info.text}. É só uma estimativa, não o preço da Amazon.`;
  }
  if (info.checkedOn) {
    return `Faixa de preço pesquisada em ${info.checkedOn}: ${info.text}. Não é o preço da Amazon.`;
  }
  return `Faixa de preço: ${info.text} (pesquisa de loja ainda não registrada). Não é o preço da Amazon.`;
}

/** Rótulo curto para cards: "Faixa de preço" ou "Faixa estimada". */
export function priceRangeLabel(info: PriceRangeInfo | null | undefined): string {
  return info?.kind === "estimate" ? "Faixa estimada" : "Faixa de preço";
}

/** Regra do CLAUDE.md §5.2: `price_max ≤ 3 × price_min` e os dois > 0. */
export function isSanePriceRange(min: number, max: number): boolean {
  return Number.isFinite(min) && Number.isFinite(max) && min > 0 && max >= min && max <= min * 3;
}
