import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Vocação de Pai — consulta a Google Search Console API e a Indexing API com a
// service account `GSC_SERVICE_ACCOUNT_JSON` (secret da edge function, doc 02
// §8; Vault `public.get_secret` como fallback), nunca exposta ao cliente.
// Grava em `public.seo_search_stats` (doc 02 §4.1). Autenticação: JWT de
// service_role ou o segredo `CRON_SECRET` no header `x-cron-secret`
// (agendamento na Fase 8). Body JSON:
//   { "action": "list_sites" }
//   { "action": "sync", "site_url": "https://vocacaodepai.com.br/", "days": 28 }
//   { "action": "notify_index", "urls": ["https://vocacaodepai.com.br/post/slug", ...] }
//
// "list_sites" serve para diagnosticar quais propriedades a service account
// enxerga (confirma se foi adicionada como usuária no Search Console) e o
// formato exato do site_url a usar (URL-prefix "https://.../" ou
// domain-property "sc-domain:vocacaodepai.com.br").
//
// "notify_index" pede ao Google para rastrear/atualizar cada URL o quanto
// antes (Indexing API), em vez de esperar o crawl natural — usado logo após
// publicar ou reformar um post.

const SCOPE_SEARCH_CONSOLE = "https://www.googleapis.com/auth/webmasters.readonly";
const SCOPE_INDEXING = "https://www.googleapis.com/auth/indexing";

// Secret da edge function primeiro; Vault (`public.get_secret`) como fallback.
async function readSecret(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> },
  name: string,
): Promise<{ value: string | null; error?: string }> {
  const fromEnv = Deno.env.get(name);
  if (fromEnv) return { value: fromEnv };
  const { data, error } = await supabase.rpc("get_secret", { secret_name: name });
  return { value: typeof data === "string" && data ? data : null, error: error?.message };
}

function base64url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(sa: any, scope: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope,
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const pemBody = sa.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`;

  const tokenRes = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Falha ao obter access token: ${tokenRes.status} ${text.slice(0, 500)}`);
  }

  const tokenJson = await tokenRes.json();
  return tokenJson.access_token;
}

// Decodifica (sem verificar assinatura — o gateway do Supabase já validou o
// JWT antes de chamar a função, graças a verify_jwt: true) o payload do JWT
// recebido para checar a role. Endpoint interno: só service_role, ou quem
// conhecer o segredo compartilhado CRON_SECRET, pode disparar
// sync/list_sites — nunca a chave anon pública, para não deixar qualquer
// visitante do site consumir a cota da API do Google nem ver a config do
// Search Console.
function getJwtRole(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

// Comparação em tempo constante para evitar timing attack no segredo interno.
function timingSafeEqual(a: string, b: string): boolean {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  if (bytesA.length !== bytesB.length) return false;
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const isServiceRole = getJwtRole(req.headers.get("Authorization")) === "service_role";
    let isValidInternalSecret = false;
    const providedSecret = req.headers.get("x-cron-secret");
    if (!isServiceRole && providedSecret) {
      const { value: expectedSecret } = await readSecret(supabase, "CRON_SECRET");
      isValidInternalSecret = !!expectedSecret && timingSafeEqual(providedSecret, expectedSecret);
    }

    if (!isServiceRole && !isValidInternalSecret) {
      return new Response(JSON.stringify({ error: "Acesso restrito" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = ["list_sites", "notify_index"].includes(body.action) ? body.action : "sync";

    const { value: saJson, error: secretError } = await readSecret(
      supabase,
      "GSC_SERVICE_ACCOUNT_JSON",
    );

    if (secretError || !saJson) {
      return new Response(
        JSON.stringify({ error: "Não foi possível obter GSC_SERVICE_ACCOUNT_JSON", details: secretError }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const sa = JSON.parse(saJson);

    if (action === "list_sites") {
      const accessToken = await getAccessToken(sa, SCOPE_SEARCH_CONSOLE);
      const sitesRes = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const sitesJson = await sitesRes.json();
      if (!sitesRes.ok) {
        return new Response(
          JSON.stringify({ error: "Erro ao listar sites", status: sitesRes.status, details: sitesJson }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify(sitesJson), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "notify_index") {
      const urls: string[] = Array.isArray(body.urls)
        ? body.urls.filter((u: unknown) => typeof u === "string" && u.startsWith("https://vocacaodepai.com.br/"))
        : [];
      if (urls.length === 0) {
        return new Response(
          JSON.stringify({ error: "urls precisa ser uma lista não vazia de URLs de vocacaodepai.com.br" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
      const accessToken = await getAccessToken(sa, SCOPE_INDEXING);
      const results = [];
      for (const url of urls.slice(0, 100)) {
        const idxRes = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url, type: "URL_UPDATED" }),
        });
        const idxJson = await idxRes.json().catch(() => ({}));
        results.push({ url, ok: idxRes.ok, status: idxRes.status, details: idxRes.ok ? undefined : idxJson });
      }
      return new Response(JSON.stringify({ results }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // action === "sync"
    const accessToken = await getAccessToken(sa, SCOPE_SEARCH_CONSOLE);
    const siteUrl = typeof body.site_url === "string" && body.site_url.length > 0
      ? body.site_url
      : "https://vocacaodepai.com.br/";
    const days = Math.min(Math.max(Number(body.days) || 28, 1), 90);

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const gscRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ["query", "page"],
          rowLimit: 5000,
        }),
      },
    );

    if (!gscRes.ok) {
      const text = await gscRes.text();
      return new Response(
        JSON.stringify({ error: "Erro na Search Console API", status: gscRes.status, details: text.slice(0, 1000), site_url: siteUrl }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const gscJson = await gscRes.json();
    const rows = gscJson.rows ?? [];
    const today = fmt(endDate);

    const records = rows.map((r: any) => ({
      snapshot_date: today,
      period_days: days,
      query: r.keys?.[0] ?? null,
      page: r.keys?.[1] ?? null,
      clicks: r.clicks ?? 0,
      impressions: r.impressions ?? 0,
      ctr: r.ctr ?? 0,
      position: r.position ?? 0,
    }));

    for (let i = 0; i < records.length; i += 1000) {
      const batch = records.slice(i, i + 1000);
      const { error: insertError } = await supabase
        .from("seo_search_stats")
        .upsert(batch, { onConflict: "snapshot_date,period_days,query,page" });
      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Erro ao salvar no banco", details: insertError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(
      JSON.stringify({ ok: true, rows_synced: records.length, period_days: days, snapshot_date: today, site_url: siteUrl }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
