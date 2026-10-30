export const formatBRL = (v: number, digits = 2) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);

export const formatNumber = (v: number, digits = 2) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v);

export const formatMoney = (v: number, currency: string, digits = 2) => {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(v);
  } catch {
    // BTC/ETH não são códigos ISO 4217
    return `${currency} ${formatNumber(v, digits)}`;
  }
};

export const formatPct = (v: number, digits = 2) =>
  `${v > 0 ? "+" : ""}${formatNumber(v, digits)}%`;

/** "24/10/2026 14:30" em America/Sao_Paulo */
export const formatDateTimeBR = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));

export const formatDateBR = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(
    new Date(iso),
  );

/** Converte "1.234,56" ou "1234.56" para número; NaN se inválido */
export function parseBRNumber(input: string): number {
  const s = (input ?? "").trim().replace(/\s/g, "");
  if (!s) return NaN;
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  return Number(s);
}

/** Faixa "R$ X a R$ Y" sem centavos (CLAUDE.md §5.2: nunca preço exato) */
export const formatFaixaBRL = (min: number, max: number) =>
  `${formatBRL(min, 0)} a ${formatBRL(max, 0)}`;
