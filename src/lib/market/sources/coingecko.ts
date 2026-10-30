import { fetchJsonWithTimeout } from "../cache";
import type { CryptoQuote } from "../types";
import { fetchFxLastAwesome } from "./awesomeapi";

const IDS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
];

/** CoinGecko público (sem chave; 1 chamada a cada 15 min via cache). Fallback: BTC-BRL/ETH-BRL da AwesomeAPI. */
export async function fetchCrypto(): Promise<CryptoQuote[]> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${IDS.map((c) => c.id).join(",")}&vs_currencies=brl,usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`;
  try {
    const raw = await fetchJsonWithTimeout<Record<string, Record<string, number>>>(url);
    const out = IDS.filter((c) => raw[c.id]?.brl).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      brl: raw[c.id].brl,
      usd: raw[c.id].usd ?? 0,
      change24h: raw[c.id].brl_24h_change ?? 0,
      marketCapBrl: raw[c.id].brl_market_cap ?? 0,
      updatedAt: new Date((raw[c.id].last_updated_at ?? Date.now() / 1000) * 1000).toISOString(),
    }));
    if (!out.length) throw new Error("CoinGecko vazio");
    return out;
  } catch {
    const fx = await fetchFxLastAwesome(["BTC", "ETH", "USD"]);
    const usd = fx.USD?.bid ?? 0;
    const out = IDS.filter((c) => fx[c.symbol]).map((c) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      brl: fx[c.symbol].bid,
      usd: usd ? fx[c.symbol].bid / usd : 0,
      change24h: fx[c.symbol].pctChange,
      marketCapBrl: 0,
      updatedAt: fx[c.symbol].timestamp,
    }));
    if (!out.length) throw new Error("Cripto indisponível (CoinGecko e AwesomeAPI)");
    return out;
  }
}
