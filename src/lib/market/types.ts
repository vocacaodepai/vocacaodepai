export type CacheSource = "live" | "cache" | "stale" | "memory";

export interface Cached<T> {
  data: T;
  fetchedAt: string; // ISO
  stale: boolean; // true = TTL vencido e fonte falhou; servimos o último valor
  source: CacheSource;
}

export interface FxQuote {
  code: string; // "USD"
  name: string; // "Dólar americano"
  bid: number; // compra (em BRL)
  ask: number; // venda (em BRL)
  high: number;
  low: number;
  pctChange: number; // variação % do dia (0 quando a fonte é diária)
  timestamp: string; // ISO
  /** fonte do dado: awesomeapi | frankfurter | erapi */
  provider?: string;
}
export type FxLast = Record<string, FxQuote>;

export interface FxDailyPoint {
  date: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  pctChange: number;
}

export interface PtaxQuote {
  code: string;
  compra: number;
  venda: number;
  dataHora: string;
  dataCotacao: string;
}

export interface CryptoQuote {
  id: string;
  symbol: string;
  name: string;
  brl: number;
  usd: number;
  change24h: number;
  marketCapBrl: number;
  updatedAt: string;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  updatedAt: string;
  logo?: string;
}

export interface SgsPoint {
  date: string; // "YYYY-MM-DD"
  value: number;
}

export interface Indicators {
  selicMeta: SgsPoint | null; // SGS 432 (% a.a.)
  selicDiaria: SgsPoint | null; // SGS 11 (% a.d.)
  cdiAnual: SgsPoint | null; // SGS 4389 (% a.a.) ou SGS 12 anualizado
  ipcaMensal: SgsPoint | null; // SGS 433 (% a.m.)
  ipca12m: SgsPoint | null; // SGS 13522 (% 12 meses)
  dolarVendaBcb: SgsPoint | null; // SGS 1 (R$)
  /** poupança (% a.m.) pela regra vigente: Selic > 8,5% → 0,5% + TR; senão 70% da Selic */
  poupancaMensal: SgsPoint | null;
}

export interface MarketSnapshot {
  fx: Cached<FxLast> | null;
  ptaxUsd: Cached<PtaxQuote> | null;
  crypto: Cached<CryptoQuote[]> | null;
  stocks: Cached<StockQuote[]> | null;
  indicators: Cached<Indicators> | null;
  generatedAt: string;
}

export interface TickerItem {
  label: string;
  value: string;
  changePct: number | null;
}
