import { fetchJsonWithTimeout } from "../cache";
import type { PtaxQuote } from "../types";

const BASE = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";
export const PTAX_CODES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CHF",
  "CAD",
  "AUD",
  "DKK",
  "NOK",
  "SEK",
] as const;

function mmddyyyy(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("month")}-${g("day")}-${g("year")}`;
}

interface Row {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
  tipoBoletim?: string;
}

/** PTAX de fechamento; não há PTAX em fim de semana/feriado, então recua até 6 dias. */
export async function fetchPtax(code: string): Promise<PtaxQuote> {
  for (let back = 0; back <= 6; back++) {
    const dc = mmddyyyy(new Date(Date.now() - back * 86400000));
    const url =
      code === "USD"
        ? `${BASE}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dc}'&$format=json`
        : `${BASE}/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${code}'&@dataCotacao='${dc}'&$format=json`;
    const raw = await fetchJsonWithTimeout<{ value: Row[] }>(url);
    const rows =
      code === "USD" ? raw.value : raw.value.filter((r) => r.tipoBoletim === "Fechamento");
    const last = rows.at(-1);
    if (last)
      return {
        code,
        compra: last.cotacaoCompra,
        venda: last.cotacaoVenda,
        dataHora: last.dataHoraCotacao,
        dataCotacao: dc,
      };
  }
  throw new Error(`PTAX ${code}: sem cotação nos últimos 7 dias`);
}
