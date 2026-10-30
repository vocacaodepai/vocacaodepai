import { createServerFn } from "@tanstack/react-start";
import type {
  Cached,
  FxDailyPoint,
  FxLast,
  Indicators,
  MarketSnapshot,
  PtaxQuote,
  TickerItem,
} from "./types";

// Server functions chamadas pelo cliente/loader. Cada uma usa cached() → nunca bate na fonte
// se o cron já abasteceu; sem banco, o cache vive na memória do processo (cache.ts).
export const KEYS = {
  fxLast: "fx:last",
  fxDaily: (pair: string, days: number) => `fx:daily:${pair}:${days}`,
  ptax: (code: string) => `ptax:${code}`,
  crypto: "crypto:simple",
  stocks: "b3:quotes",
  indicators: "sgs:indicators",
} as const;

const safe = async <T>(p: Promise<Cached<T>>): Promise<Cached<T> | null> => p.catch(() => null);

export const getFxLast = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cached<FxLast>> => {
    const { cached, TTL } = await import("./cache");
    const { fetchFxLast } = await import("./sources/awesomeapi");
    return cached(KEYS.fxLast, TTL.FX_LAST, () => fetchFxLast());
  },
);

export const getFxDaily = createServerFn({ method: "GET" })
  .inputValidator((d: { pair: string; days?: number }) => ({
    pair: String(d.pair).toUpperCase().slice(0, 7),
    days: Math.min(Math.max(Number(d.days ?? 30), 7), 365),
  }))
  .handler(async ({ data }): Promise<Cached<FxDailyPoint[]>> => {
    const { cached, TTL } = await import("./cache");
    const { fetchFxDaily } = await import("./sources/awesomeapi");
    return cached(KEYS.fxDaily(data.pair, data.days), TTL.FX_DAILY, () =>
      fetchFxDaily(data.pair, data.days),
    );
  });

export const getPtax = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => ({ code: String(d.code).toUpperCase().slice(0, 3) }))
  .handler(async ({ data }): Promise<Cached<PtaxQuote> | null> => {
    const { PTAX_CODES, fetchPtax } = await import("./sources/bcb-ptax");
    if (!(PTAX_CODES as readonly string[]).includes(data.code)) return null;
    const { cached, TTL } = await import("./cache");
    return safe(cached(KEYS.ptax(data.code), TTL.PTAX, () => fetchPtax(data.code)));
  });

export const getIndicators = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cached<Indicators> | null> => {
    const { cached, TTL } = await import("./cache");
    const { fetchIndicators } = await import("./sources/bcb-sgs");
    return safe(cached(KEYS.indicators, TTL.SGS, fetchIndicators));
  },
);

export const getMarketSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketSnapshot> => {
    const { cached, TTL } = await import("./cache");
    const [{ fetchFxLast }, { fetchPtax }, { fetchCrypto }, { fetchStocks }, { fetchIndicators }] =
      await Promise.all([
        import("./sources/awesomeapi"),
        import("./sources/bcb-ptax"),
        import("./sources/coingecko"),
        import("./sources/brapi"),
        import("./sources/bcb-sgs"),
      ]);
    const [fx, ptaxUsd, crypto, stocks, indicators] = await Promise.all([
      safe(cached(KEYS.fxLast, TTL.FX_LAST, () => fetchFxLast())),
      safe(cached(KEYS.ptax("USD"), TTL.PTAX, () => fetchPtax("USD"))),
      safe(cached(KEYS.crypto, TTL.CRYPTO, fetchCrypto)),
      process.env["BRAPI_TOKEN"]
        ? safe(cached(KEYS.stocks, TTL.STOCKS, fetchStocks))
        : Promise.resolve(null),
      safe(cached(KEYS.indicators, TTL.SGS, fetchIndicators)),
    ]);
    return { fx, ptaxUsd, crypto, stocks, indicators, generatedAt: new Date().toISOString() };
  },
);

/** Bloco "Mercado do pai hoje" (home): SÓ lê o cache, nunca chama fonte externa. Vazio → o bloco não aparece. */
export const getMarketTickerItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<TickerItem[]> => {
    const { readCache } = await import("./cache");
    const fmt = (v: number, d = 2) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: d,
        minimumFractionDigits: d,
      }).format(v);
    const items: TickerItem[] = [];
    try {
      const [fx, crypto, ind, stocks] = await Promise.all([
        readCache<FxLast>(KEYS.fxLast),
        readCache<Array<{ symbol: string; brl: number; change24h: number }>>(KEYS.crypto),
        readCache<Indicators>(KEYS.indicators),
        readCache<Array<{ symbol: string; price: number; changePct: number }>>(KEYS.stocks),
      ]);
      if (fx?.data.USD)
        items.push({
          label: "Dólar",
          value: fmt(fx.data.USD.bid),
          changePct: fx.data.USD.pctChange,
        });
      const ibov = stocks?.data.find((s) => s.symbol === "^BVSP");
      if (ibov)
        items.push({
          label: "Ibovespa",
          value: `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(ibov.price)} pts`,
          changePct: ibov.changePct,
        });
      else if (fx?.data.EUR)
        items.push({
          label: "Euro",
          value: fmt(fx.data.EUR.bid),
          changePct: fx.data.EUR.pctChange,
        });
      const btc = crypto?.data.find((c) => c.symbol === "BTC");
      if (btc) items.push({ label: "Bitcoin", value: fmt(btc.brl, 0), changePct: btc.change24h });
      if (ind?.data.selicMeta)
        items.push({
          label: "Selic",
          value: `${ind.data.selicMeta.value.toFixed(2).replace(".", ",")}% a.a.`,
          changePct: null,
        });
    } catch (e) {
      console.warn("[market] ticker", (e as Error).message);
    }
    return items.slice(0, 4);
  },
);
