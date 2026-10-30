import { cached, TTL } from "./cache";
import { KEYS } from "./fetchers";
import { fetchFxDaily, fetchFxLast } from "./sources/awesomeapi";
import { fetchPtax } from "./sources/bcb-ptax";
import { fetchIndicators } from "./sources/bcb-sgs";
import { fetchCrypto } from "./sources/coingecko";
import { fetchStocks, isB3TradingWindow } from "./sources/brapi";

const DAILY_PAIRS = ["USD-BRL", "EUR-BRL", "GBP-BRL", "BTC-BRL"];

/** Usado pelo cron (POST /api/market/refresh): força câmbio e cripto; o resto respeita o TTL. */
export async function refreshAll() {
  const started = Date.now();
  const jobs: Record<string, () => Promise<unknown>> = {
    [KEYS.fxLast]: () => cached(KEYS.fxLast, TTL.FX_LAST, () => fetchFxLast(), { force: true }),
    [KEYS.ptax("USD")]: () => cached(KEYS.ptax("USD"), TTL.PTAX, () => fetchPtax("USD")),
    [KEYS.ptax("EUR")]: () => cached(KEYS.ptax("EUR"), TTL.PTAX, () => fetchPtax("EUR")),
    [KEYS.crypto]: () => cached(KEYS.crypto, TTL.CRYPTO, fetchCrypto, { force: true }),
    [KEYS.indicators]: () => cached(KEYS.indicators, TTL.SGS, fetchIndicators),
    ...Object.fromEntries(
      DAILY_PAIRS.map((p) => [
        KEYS.fxDaily(p, 30),
        () => cached(KEYS.fxDaily(p, 30), TTL.FX_DAILY, () => fetchFxDaily(p, 30)),
      ]),
    ),
  };
  if (process.env["BRAPI_TOKEN"] && isB3TradingWindow()) {
    jobs[KEYS.stocks] = () => cached(KEYS.stocks, TTL.STOCKS, fetchStocks, { force: true });
  }
  const keys = Object.keys(jobs);
  const results = await Promise.allSettled(keys.map((k) => jobs[k]()));
  const refreshed: string[] = [];
  const failed: Array<{ key: string; error: string }> = [];
  results.forEach((res, i) => {
    if (res.status === "fulfilled") refreshed.push(keys[i]);
    else failed.push({ key: keys[i], error: String((res.reason as Error)?.message ?? res.reason) });
  });
  return { ok: failed.length === 0, refreshed, failed, durationMs: Date.now() - started };
}
