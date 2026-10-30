import { fetchJsonWithTimeout } from "../cache";
import type { Indicators, SgsPoint } from "../types";

const BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
// Códigos fixos (anexo res-tecnico): 432 Selic meta, 11 Selic diária, 12 CDI diário, 4389 CDI anual,
// 433 IPCA mensal, 13522 IPCA 12 m, 1 dólar venda.
export const SGS = {
  SELIC_META: 432,
  SELIC_DIARIA: 11,
  CDI_DIARIO: 12,
  CDI_ANUAL: 4389,
  IPCA_MENSAL: 433,
  IPCA_12M: 13522,
  DOLAR_VENDA: 1,
} as const;

export async function fetchSgsLast(code: number, n = 1): Promise<SgsPoint[]> {
  const raw = await fetchJsonWithTimeout<Array<{ data: string; valor: string }>>(
    `${BASE}.${code}/dados/ultimos/${n}?formato=json`,
  );
  return raw.map((r) => {
    const [d, m, y] = r.data.split("/");
    return { date: `${y}-${m}-${d}`, value: Number(String(r.valor).replace(",", ".")) };
  });
}

/** Regra da poupança (Lei 12.703/2012): Selic > 8,5% a.a. → 0,5% a.m. + TR; senão 70% da Selic (mensalizada). */
export function poupancaMensalPelaSelic(selicAnual: number): number {
  if (selicAnual > 8.5) return 0.5;
  return ((1 + (0.7 * selicAnual) / 100) ** (1 / 12) - 1) * 100;
}

export async function fetchIndicators(): Promise<Indicators> {
  const [selic, selicD, cdi, ipca, ipca12, dolar] = await Promise.allSettled([
    fetchSgsLast(SGS.SELIC_META),
    fetchSgsLast(SGS.SELIC_DIARIA),
    fetchSgsLast(SGS.CDI_ANUAL),
    fetchSgsLast(SGS.IPCA_MENSAL),
    fetchSgsLast(SGS.IPCA_12M),
    fetchSgsLast(SGS.DOLAR_VENDA),
  ]);
  const pick = (r: PromiseSettledResult<SgsPoint[]>) =>
    r.status === "fulfilled" ? (r.value.at(-1) ?? null) : null;
  let cdiAnual = pick(cdi);
  if (!cdiAnual) {
    const d = await fetchSgsLast(SGS.CDI_DIARIO).catch(() => [] as SgsPoint[]);
    const last = d.at(-1);
    if (last) cdiAnual = { date: last.date, value: ((1 + last.value / 100) ** 252 - 1) * 100 };
  }
  const selicMeta = pick(selic);
  const out: Indicators = {
    selicMeta,
    selicDiaria: pick(selicD),
    cdiAnual,
    ipcaMensal: pick(ipca),
    ipca12m: pick(ipca12),
    dolarVendaBcb: pick(dolar),
    poupancaMensal: selicMeta
      ? { date: selicMeta.date, value: poupancaMensalPelaSelic(selicMeta.value) }
      : null,
  };
  if (!out.selicMeta && !out.ipcaMensal) throw new Error("SGS indisponível");
  return out;
}
