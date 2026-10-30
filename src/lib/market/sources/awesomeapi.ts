import { fetchJsonWithTimeout } from "../cache";
import type { FxDailyPoint, FxLast, FxQuote } from "../types";
import { CURRENCIES } from "@/lib/tools/currencies";

const BASE = "https://economia.awesomeapi.com.br";
const CHUNK = 10;

interface Raw {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
}

export const ALL_CODES = CURRENCIES.filter((c) => c.code !== "BRL").map((c) => c.code);
const nameOf = (code: string, fallback: string) =>
  CURRENCIES.find((c) => c.code === code)?.name ?? fallback;

/** AwesomeAPI /last — cotação comercial quase em tempo real (cache próprio de 15 min). */
export async function fetchFxLastAwesome(codes: string[] = ALL_CODES): Promise<FxLast> {
  const out: FxLast = {};
  for (let i = 0; i < codes.length; i += CHUNK) {
    const pairs = codes
      .slice(i, i + CHUNK)
      .map((c) => `${c}-BRL`)
      .join(",");
    const raw = await fetchJsonWithTimeout<Record<string, Raw>>(`${BASE}/last/${pairs}`);
    for (const r of Object.values(raw)) {
      if (!r || typeof r !== "object" || !r.code) continue;
      const q: FxQuote = {
        code: r.code,
        name: nameOf(
          r.code,
          String(r.name ?? "")
            .split("/")[0]
            .trim(),
        ),
        bid: Number(r.bid),
        ask: Number(r.ask),
        high: Number(r.high),
        low: Number(r.low),
        pctChange: Number(r.pctChange),
        timestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
        provider: "awesomeapi",
      };
      if (Number.isFinite(q.bid) && q.bid > 0) out[q.code] = q;
    }
  }
  if (!Object.keys(out).length) throw new Error("AwesomeAPI devolveu vazio");
  return out;
}

/** Frankfurter (BCE, diário, sem chave): fallback 1. Base USD → X-BRL = BRL/X. */
export async function fetchFxLastFrankfurter(codes: string[] = ALL_CODES): Promise<FxLast> {
  const symbols = ["BRL", ...codes.filter((c) => !["BTC", "ETH"].includes(c))].join(",");
  const raw = await fetchJsonWithTimeout<{ date: string; rates: Record<string, number> }>(
    `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${symbols}`,
  );
  return fromUsdBase(raw.rates, `${raw.date}T12:00:00Z`, "frankfurter", codes);
}

/** open.er-api.com (1 atualização/dia, sem chave): fallback 2. Atribuição "Rates By Exchange Rate API" no rodapé. */
export async function fetchFxLastErApi(codes: string[] = ALL_CODES): Promise<FxLast> {
  const raw = await fetchJsonWithTimeout<{
    result: string;
    time_last_update_utc: string;
    rates: Record<string, number>;
  }>("https://open.er-api.com/v6/latest/USD");
  if (raw.result !== "success") throw new Error("open.er-api sem sucesso");
  return fromUsdBase(raw.rates, new Date(raw.time_last_update_utc).toISOString(), "erapi", codes);
}

function fromUsdBase(
  rates: Record<string, number>,
  ts: string,
  provider: string,
  codes: string[],
): FxLast {
  const brl = rates.BRL;
  if (!brl) throw new Error(`${provider}: sem BRL`);
  const out: FxLast = {};
  out.USD = {
    code: "USD",
    name: nameOf("USD", "Dólar"),
    bid: brl,
    ask: brl,
    high: brl,
    low: brl,
    pctChange: 0,
    timestamp: ts,
    provider,
  };
  for (const c of codes) {
    if (c === "USD" || !rates[c]) continue;
    const v = brl / rates[c];
    out[c] = {
      code: c,
      name: nameOf(c, c),
      bid: v,
      ask: v,
      high: v,
      low: v,
      pctChange: 0,
      timestamp: ts,
      provider,
    };
  }
  return out;
}

/** Cascata: AwesomeAPI → Frankfurter → open.er-api (o cache stale cobre o resto). */
export async function fetchFxLast(codes: string[] = ALL_CODES): Promise<FxLast> {
  const errors: string[] = [];
  for (const fn of [fetchFxLastAwesome, fetchFxLastFrankfurter, fetchFxLastErApi]) {
    try {
      return await fn(codes);
    } catch (e) {
      errors.push(`${fn.name}: ${(e as Error).message}`);
    }
  }
  throw new Error(errors.join(" | "));
}

export async function fetchFxDaily(pair: string, days = 30): Promise<FxDailyPoint[]> {
  if (!/^[A-Z]{3}-[A-Z]{3}$/.test(pair)) throw new Error("par inválido");
  const n = Math.min(Math.max(days, 1), 360);
  const raw = await fetchJsonWithTimeout<Raw[]>(`${BASE}/json/daily/${pair}/${n}`);
  if (!Array.isArray(raw) || !raw.length) throw new Error("AwesomeAPI daily vazio");
  return raw
    .map((r) => ({
      date: new Date(Number(r.timestamp) * 1000).toISOString().slice(0, 10),
      bid: Number(r.bid),
      ask: Number(r.ask),
      high: Number(r.high),
      low: Number(r.low),
      pctChange: Number(r.pctChange ?? 0),
    }))
    .filter((p) => Number.isFinite(p.bid))
    .reverse();
}
