import { fetchJsonWithTimeout } from "../cache";
import type { StockQuote } from "../types";

// Plano gratuito da Brapi: 1 ticker por requisição, 15.000 req/mês; ^BVSP exige token.
export const TICKERS = [
  "^BVSP",
  "PETR4",
  "VALE3",
  "ITUB4",
  "BBDC4",
  "BBAS3",
  "WEGE3",
  "ABEV3",
  "B3SA3",
] as const;
const NAMES: Record<string, string> = {
  "^BVSP": "Ibovespa",
  PETR4: "Petrobras PN",
  VALE3: "Vale ON",
  ITUB4: "Itaú Unibanco PN",
  BBDC4: "Bradesco PN",
  BBAS3: "Banco do Brasil ON",
  WEGE3: "WEG ON",
  ABEV3: "Ambev ON",
  B3SA3: "B3 ON",
};

export function isB3TradingWindow(now = new Date()) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(now);
  const hour = Number(p.find((x) => x.type === "hour")!.value);
  const wd = p.find((x) => x.type === "weekday")!.value;
  return !["Sat", "Sun"].includes(wd) && hour >= 10 && hour < 18;
}

interface Result {
  symbol: string;
  shortName?: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  logourl?: string;
}

/** Sem BRAPI_TOKEN → lança; o snapshot devolve stocks = null e o card da bolsa some. */
export async function fetchStocks(): Promise<StockQuote[]> {
  const token = process.env["BRAPI_TOKEN"];
  if (!token) throw new Error("BRAPI_TOKEN ausente");
  const out: StockQuote[] = [];
  for (const t of TICKERS) {
    try {
      const raw = await fetchJsonWithTimeout<{ results: Result[] }>(
        `https://brapi.dev/api/quote/${encodeURIComponent(t)}?token=${encodeURIComponent(token)}`,
      );
      const r = raw.results?.[0];
      if (r)
        out.push({
          symbol: r.symbol,
          name: NAMES[r.symbol] ?? r.shortName ?? r.symbol,
          price: r.regularMarketPrice,
          changePct: r.regularMarketChangePercent,
          updatedAt: r.regularMarketTime,
          logo: r.logourl,
        });
    } catch (e) {
      console.warn("brapi", t, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!out.length) throw new Error("Brapi sem resultados");
  return out;
}
