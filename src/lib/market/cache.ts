import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cached } from "./types";

// Cache de mercado (só servidor). Prioridade: market_cache (Supabase, service role) →
// memória do processo (quando o banco ainda não existe ou falha) → fonte externa.
const FETCH_TIMEOUT_MS = 8000;

interface Row {
  data: unknown;
  fetched_at: string;
  ttl_seconds: number;
}

const memory = new Map<string, Row>();

// Tipos gerados ainda são os do VDM (sem market_cache): cliente sem o genérico Database.
async function admin(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

function hasDb() {
  return Boolean(process.env["VITE_SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
}

function toCached<T>(row: Row, source: "cache" | "memory"): Cached<T> & { ttl: number } {
  const fetchedAt = new Date(row.fetched_at);
  const fresh = fetchedAt.getTime() + row.ttl_seconds * 1000 > Date.now();
  return {
    data: row.data as T,
    fetchedAt: fetchedAt.toISOString(),
    stale: !fresh,
    source: fresh ? source : "stale",
    ttl: row.ttl_seconds,
  };
}

export async function readCache<T>(key: string): Promise<(Cached<T> & { ttl: number }) | null> {
  if (hasDb()) {
    try {
      const sb = await admin();
      const { data, error } = await sb
        .from("market_cache")
        .select("data,fetched_at,ttl_seconds")
        .eq("key", key)
        .maybeSingle();
      if (!error && data) return toCached<T>(data as unknown as Row, "cache");
    } catch (e) {
      console.warn("[market] readCache", key, (e as Error).message);
    }
  }
  const m = memory.get(key);
  return m ? toCached<T>(m, "memory") : null;
}

export async function writeCache<T>(key: string, data: T, ttlSeconds: number) {
  const row: Row = { data, fetched_at: new Date().toISOString(), ttl_seconds: ttlSeconds };
  memory.set(key, row);
  if (!hasDb()) return;
  try {
    const sb = await admin();
    const { error } = await sb
      .from("market_cache")
      .upsert(
        { key, data: data as never, fetched_at: row.fetched_at, ttl_seconds: ttlSeconds },
        { onConflict: "key" },
      );
    if (error) console.error("market_cache upsert", key, error.message);
  } catch (e) {
    console.error("market_cache upsert", key, (e as Error).message);
  }
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  init: RequestInit = {},
  ms = FETCH_TIMEOUT_MS,
): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        accept: "application/json",
        "user-agent": "VocacaoDePai/1.0 (+https://vocacaodepai.com.br)",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} em ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Padrão stale-while-error:
 * 1) cache fresco → devolve; 2) senão busca na fonte → grava e devolve "live";
 * 3) fonte falhou e há cache vencido → "stale"; 4) sem nada → lança (quem chama mostra "indisponível").
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
  opts: { force?: boolean } = {},
): Promise<Cached<T>> {
  const hit = await readCache<T>(key);
  if (hit && !hit.stale && !opts.force) return hit;
  try {
    const data = await fetcher();
    await writeCache(key, data, ttlSeconds);
    return { data, fetchedAt: new Date().toISOString(), stale: false, source: "live" };
  } catch (err) {
    console.warn(`[market] ${key} falhou:`, (err as Error).message);
    if (hit) return { ...hit, stale: true, source: "stale" };
    throw err;
  }
}

// TTLs do CLAUDE.md §10: câmbio 15 min, índices 60 min, BCB 24 h.
export const TTL = {
  FX_LAST: 15 * 60,
  FX_DAILY: 6 * 3600,
  PTAX: 24 * 3600,
  CRYPTO: 15 * 60,
  STOCKS: 60 * 60,
  SGS: 24 * 3600,
} as const;
