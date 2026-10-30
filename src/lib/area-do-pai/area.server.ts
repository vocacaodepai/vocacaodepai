// Área do Pai — lado do servidor (doc 07 §4.5, §4.6). Importar só de dentro de
// handlers (`await import("@/lib/area-do-pai/area.server")`): lê segredos de
// process.env e nunca pode ir para o bundle do cliente.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { childPhase } from "@/lib/phases";
import type { SavedItem, SavedItemView } from "./types";

const FALLBACK_URL = "https://placeholder.supabase.co";
const FALLBACK_KEY = "placeholder-key";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function supabaseUrl(): string {
  const url = env("VITE_SUPABASE_URL") ?? "";
  return url.startsWith("http") ? url : FALLBACK_URL;
}

export function supabaseAnonKey(): string {
  const key = env("VITE_SUPABASE_ANON_KEY") ?? "";
  return key && !key.startsWith("<") ? key : FALLBACK_KEY;
}

export function isDbConfigured(): boolean {
  return supabaseUrl() !== FALLBACK_URL;
}

function withApiKey(key: string, bearer?: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set("apikey", key);
    if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
    else if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
      headers.delete("Authorization");
    return fetch(input, { ...init, headers });
  };
}

/** Client que respeita o RLS do usuário (JWT no Authorization). */
export function createUserClient(accessToken: string): SupabaseClient {
  const key = supabaseAnonKey();
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: withApiKey(key, accessToken) },
  });
}

export interface ServerUser {
  id: string;
  email: string | null;
  emailConfirmed: boolean;
}

export class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Valida o token e devolve client + usuário. Lança 401 em PT-BR. */
export async function requireUser(
  accessToken: string | null | undefined,
): Promise<{ sb: SupabaseClient; user: ServerUser }> {
  if (!accessToken || accessToken.split(".").length !== 3) {
    throw new HttpError("Faça login para continuar.", 401);
  }
  if (!isDbConfigured()) {
    throw new HttpError("A Área do Pai ainda não está ligada ao banco. Volte em breve.", 503);
  }
  const sb = createUserClient(accessToken);
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data.user) throw new HttpError("Sessão expirada. Entre novamente.", 401);
  return {
    sb,
    user: {
      id: data.user.id,
      email: data.user.email ?? null,
      emailConfirmed: !!data.user.email_confirmed_at,
    },
  };
}

/** Client com service_role (ignora RLS). null quando a chave não está configurada. */
export function getServiceClient(): SupabaseClient | null {
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!key || !isDbConfigured()) return null;
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: withApiKey(key) },
  });
}

/** Client público (chave anon, sem sessão): só o que o RLS libera a todos. */
export function getAnonClient(): SupabaseClient {
  const key = supabaseAnonKey();
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: withApiKey(key) },
  });
}

/* ---------------- Rate limit em memória (por instância; doc 07 §4.5) ---------------- */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    return;
  }
  if (++b.count > max) {
    throw new HttpError("Muitas tentativas. Tente de novo em alguns minutos.", 429);
  }
}

export async function requestIp(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const req = getRequest();
    return (
      req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req?.headers.get("x-real-ip") ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

/** Comparação em tempo constante (CRON_SECRET). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* ---------------- Cloudflare Turnstile ---------------- */

/** Sem TURNSTILE_SECRET_KEY degrada para honeypot + rate limit (devolve true). */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = env("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/* ---------------- Itens salvos: hidratação ---------------- */

async function safe<T>(p: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

type Row = Record<string, unknown>;

const slugToTitle = (slug: string) =>
  slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** Liga cada saved_item ao registro de origem (posts, products, jobs, tracks; ferramentas pelo slug). */
export async function hydrateSavedItems(
  sb: SupabaseClient,
  items: SavedItem[],
): Promise<SavedItemView[]> {
  const byType = (t: SavedItem["item_type"]) => items.filter((i) => i.item_type === t);
  const ids = (t: SavedItem["item_type"]) => byType(t).map((i) => i.item_id);

  const [posts, products, jobs, tracks] = await Promise.all([
    ids("post").length
      ? safe(
          sb
            .from("posts")
            .select("id, slug, title, excerpt, cover_image_url, kind")
            .in("id", ids("post"))
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        )
      : ([] as Row[]),
    ids("product").length
      ? safe(
          sb
            .from("products")
            .select("id, slug, name, image_url, short_description")
            .in("id", ids("product"))
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        )
      : ([] as Row[]),
    ids("job").length
      ? safe(
          sb
            .from("jobs")
            .select("id, slug, title, company")
            .in("id", ids("job"))
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        )
      : ([] as Row[]),
    ids("track").length
      ? safe(
          sb
            .from("tracks")
            .select("id, slug, title, cover_image_url")
            .in("id", ids("track"))
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        )
      : ([] as Row[]),
  ]);

  const PAI_INDICA = new Set(["review", "comparativo", "lista"]);
  const find = (rows: Row[], id: string) => rows.find((r) => r.id === id);

  return items.map((item): SavedItemView => {
    const base = { ...item, image: null as string | null, subtitle: null as string | null };
    switch (item.item_type) {
      case "post": {
        const p = find(posts, item.item_id);
        if (!p) return { ...base, title: "Artigo indisponível", href: "/blog", found: false };
        const slug = String(p.slug);
        return {
          ...base,
          title: String(p.title),
          href: PAI_INDICA.has(String(p.kind)) ? `/pai-indica/${slug}` : `/post/${slug}`,
          image: (p.cover_image_url as string | null) ?? null,
          subtitle: (p.excerpt as string | null) ?? null,
          found: true,
        };
      }
      case "product": {
        const p = find(products, item.item_id);
        if (!p) return { ...base, title: "Produto indisponível", href: "/loja", found: false };
        return {
          ...base,
          title: String(p.name),
          href: `/loja/${String(p.slug)}`,
          image: (p.image_url as string | null) ?? null,
          subtitle: (p.short_description as string | null) ?? null,
          found: true,
        };
      }
      case "tool":
        // Ferramentas salvam o slug (0004: item_id text; doc 06 §1.3).
        return {
          ...base,
          title: slugToTitle(item.item_id),
          href: `/ferramentas/${item.item_id}`,
          subtitle: "Caixa de Ferramentas",
          found: true,
        };
      case "job": {
        const j = find(jobs, item.item_id);
        if (!j)
          return { ...base, title: "Vaga encerrada", href: "/pai-indica-pai/vagas", found: false };
        return {
          ...base,
          title: String(j.title),
          href: `/pai-indica-pai/vagas/${String(j.slug)}`,
          subtitle: (j.company as string | null) ?? null,
          found: true,
        };
      }
      case "track": {
        const t = find(tracks, item.item_id);
        if (!t) return { ...base, title: "Trilha indisponível", href: "/formacao", found: false };
        return {
          ...base,
          title: String(t.title),
          href: `/formacao/${String(t.slug)}`,
          image: (t.cover_image_url as string | null) ?? null,
          subtitle: "Formação",
          found: true,
        };
      }
      default:
        return { ...base, title: item.item_id, href: "/area-do-pai", found: false };
    }
  });
}

/* ---------------- Fases dos filhos (para o resumo semanal) ---------------- */

export function phasesFromChildren(rows: Array<{ birth_date: string }>): string[] {
  return Array.from(new Set(rows.map((r) => childPhase(r.birth_date))));
}
