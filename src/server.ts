import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// A client that disconnects mid-render (navigation away, refresh, closed tab)
// surfaces as an "aborted" / ECONNRESET error. That is not an app failure.
function isClientAbort(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const e = current as { message?: unknown; code?: unknown; name?: unknown; cause?: unknown };
    if (e.code === "ECONNRESET" || e.code === "ECONNABORTED") return true;
    if (e.name === "AbortError") return true;
    if (typeof e.message === "string" && /aborted|ECONNRESET/i.test(e.message)) return true;
    current = e.cause;
  }
  return false;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(
  response: Response,
  request: Request,
): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  const captured = consumeLastCapturedError();
  if (request.signal?.aborted || isClientAbort(captured)) {
    // Client went away before the response finished; nothing to report.
    return new Response(null, { status: 499 });
  }

  console.error(captured ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Cabeçalhos de segurança em toda resposta HTML. frame-ancestors 'self'
// impede que o site seja embutido em iframe de terceiros.
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "frame-ancestors 'self'",
};

function isHtml(response: Response): boolean {
  return (response.headers.get("content-type") ?? "").includes("text/html");
}

function withSecurityHeaders(response: Response): Response {
  if (!isHtml(response)) return response;
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

// Cache de borda (Workers Cache API) do HTML público. O SSR é anônimo (os
// loaders usam a chave publicável), então a mesma página serve para todo
// mundo; o estado de login hidrata no navegador. TTL curto para um post
// novo aparecer em até 2 minutos.
const EDGE_TTL_SECONDS = 120;
const UNCACHED_PREFIXES = ["/admin", "/api", "/_serverFn", "/minha-conta", "/busca", "/auth"];

type WaitUntilContext = { waitUntil?: (promise: Promise<unknown>) => void };

function edgeCache(): Cache | undefined {
  const store = (globalThis as { caches?: { default?: Cache } }).caches;
  return store?.default;
}

function isEdgeCacheable(request: Request): boolean {
  if (request.method !== "GET") return false;
  const { pathname, search } = new URL(request.url);
  if (UNCACHED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return false;
  if (search.includes("preview")) return false;
  if (request.headers.has("Authorization")) return false;
  if (/sb-[^=]*=/.test(request.headers.get("Cookie") ?? "")) return false;
  return true;
}

async function fetchWithEdgeCache(
  request: Request,
  ctx: unknown,
  render: () => Promise<Response>,
): Promise<Response> {
  const cache = edgeCache();
  if (!cache || !isEdgeCacheable(request)) return render();

  // Qualquer problema no cache (runtime sem Cache API de verdade, put
  // recusado) nunca pode derrubar a página: cai para o render normal.
  try {
    const cached = await cache.match(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set("X-Edge-Cache", "HIT");
      return new Response(cached.body, { status: cached.status, headers });
    }
  } catch (error) {
    console.warn("edge cache match falhou", error);
  }

  const response = await render();
  if (response.status !== 200 || !isHtml(response) || response.headers.has("Set-Cookie")) {
    return response;
  }

  let body = response.body;
  try {
    const [forClient, forCache] = response.body ? response.body.tee() : [null, null];
    body = forClient;
    const cacheHeaders = new Headers(response.headers);
    cacheHeaders.set("Cache-Control", `public, max-age=${EDGE_TTL_SECONDS}`);
    const toStore = new Response(forCache, { status: response.status, headers: cacheHeaders });
    const put = cache.put(request, toStore).catch((error: unknown) => {
      console.warn("edge cache put falhou", error);
    });
    const waitUntil = (ctx as WaitUntilContext | null)?.waitUntil;
    if (typeof waitUntil === "function") waitUntil.call(ctx, put);
  } catch (error) {
    console.warn("edge cache put falhou", error);
  }

  const headers = new Headers(response.headers);
  headers.set("X-Edge-Cache", "MISS");
  // O navegador não guarda a página (só a borda), para o login/tema não
  // ficarem presos numa cópia antiga.
  headers.set("Cache-Control", "no-cache");
  return new Response(body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await fetchWithEdgeCache(request, ctx, async () =>
        withSecurityHeaders(
          await normalizeCatastrophicSsrResponse(await handler.fetch(request, env, ctx), request),
        ),
      );
      return response;
    } catch (error) {
      if (request.signal?.aborted || isClientAbort(error)) {
        return new Response(null, { status: 499 });
      }
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
