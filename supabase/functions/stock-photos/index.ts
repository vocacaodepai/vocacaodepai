import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Vocação de Pai — busca fotos de estoque no Pexels, Pixabay, Wikimedia
// Commons ou Google (Custom Search, só imagens com direitos de reuso). As
// chaves (`PEXELS_API_KEY`, `PIXABAY_API_KEY`; doc 02 §8) vêm dos secrets da
// edge function (`Deno.env`) ou, como fallback, do Vault via `public.get_secret`
// — nunca expostas ao cliente. Chamar autenticado (JWT), com body JSON:
// { "source": "pixabay" | "pexels" | "wikimedia" | "google", "query": "...", "perPage": 10 }
//
// Para "google": o filtro `rights` é fixo no servidor (não vem do client) e
// restringe a imagens com uso livre documentado — domínio público ou
// licenças Creative Commons que permitem reuso (com ou sem atribuição).
// Mesmo assim, a página de origem (page_url) deve ser conferida antes de
// publicar: o Google filtra pelo metadado de direitos da página indexada,
// não confirma a licença real do arquivo.
const GOOGLE_RIGHTS_FILTER = "cc_publicdomain|cc_attribute|cc_sharealike";

// Wikimedia Commons: API pública, sem chave. Diferente do Google, o
// metadado de licença (extmetadata) vem do próprio arquivo, então a
// `license` devolvida aqui é real, não um filtro de busca.
const WIKIMEDIA_USER_AGENT =
  "VocacaoDePai-StockPhotos/1.0 (https://vocacaodepai.com.br)";

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

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { source, query, perPage } = await req.json();

    if (
      source !== "pixabay" &&
      source !== "pexels" &&
      source !== "wikimedia" &&
      source !== "google"
    ) {
      return new Response(
        JSON.stringify({ error: "source deve ser 'pixabay', 'pexels', 'wikimedia' ou 'google'" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const limit = Math.min(Math.max(Number(perPage) || 10, 1), 30);

    if (source === "wikimedia") {
      const params = new URLSearchParams({
        action: "query",
        generator: "search",
        gsrsearch: query,
        gsrnamespace: "6", // namespace File:
        gsrlimit: String(Math.min(limit, 20)),
        prop: "imageinfo",
        iiprop: "url|extmetadata|mime",
        iiurlwidth: "800",
        format: "json",
        origin: "*",
      });
      const apiRes = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { "User-Agent": WIKIMEDIA_USER_AGENT },
      });
      if (!apiRes.ok) {
        const text = await apiRes.text();
        return new Response(
          JSON.stringify({ error: "Erro na API wikimedia", status: apiRes.status, details: text.slice(0, 500) }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }

      const raw = await apiRes.json();
      const pages = Object.values(raw.query?.pages ?? {}) as any[];
      const results = pages
        .filter((p) => {
          const mime = p.imageinfo?.[0]?.mime ?? "";
          return typeof mime === "string" && mime.startsWith("image/");
        })
        .map((p) => {
          const info = p.imageinfo?.[0] ?? {};
          const meta = info.extmetadata ?? {};
          const licenseShort = meta.LicenseShortName?.value ?? "Ver licença na página de origem";
          const artist = meta.Artist?.value ? stripHtml(meta.Artist.value) : "";
          return {
            id: p.pageid,
            url: info.thumburl ?? info.url,
            width: info.thumbwidth ?? info.width ?? 0,
            height: info.thumbheight ?? info.height ?? 0,
            alt: (p.title ?? "").replace(/^File:/, "").replace(/\.[a-zA-Z0-9]+$/, ""),
            thumb: info.thumburl ?? info.url,
            page_url: info.descriptionurl ?? `https://commons.wikimedia.org/?curid=${p.pageid}`,
            license: artist ? `${licenseShort} — ${artist}` : licenseShort,
            source: "wikimedia",
          };
        });

      return new Response(JSON.stringify({ results }), {
        headers: { "Content-Type": "application/json", Connection: "keep-alive" },
      });
    }

    if (source === "google") {
      const [{ value: apiKey, error: keyError }, { value: cx, error: cxError }] = await Promise.all([
        readSecret(supabase, "GOOGLE_CSE_API_KEY"),
        readSecret(supabase, "GOOGLE_CSE_CX"),
      ]);

      if (keyError || cxError || !apiKey || !cx) {
        return new Response(
          JSON.stringify({
            error: "Não foi possível obter as credenciais do Google Custom Search",
            details: keyError || cxError,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }

      const params = new URLSearchParams({
        key: String(apiKey),
        cx: String(cx),
        q: query,
        searchType: "image",
        safe: "active",
        num: String(Math.min(limit, 10)), // a API do Google limita a 10 por página
        rights: GOOGLE_RIGHTS_FILTER,
      });
      const apiRes = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
      if (!apiRes.ok) {
        const text = await apiRes.text();
        return new Response(
          JSON.stringify({ error: "Erro na API google", status: apiRes.status, details: text.slice(0, 500) }),
          { status: 502, headers: { "Content-Type": "application/json" } },
        );
      }

      const raw = await apiRes.json();
      const results = (raw.items ?? []).map((it: any) => ({
        id: it.link,
        url: it.link,
        width: it.image?.width ?? 0,
        height: it.image?.height ?? 0,
        alt: it.title ?? "",
        thumb: it.image?.thumbnailLink ?? it.link,
        page_url: it.image?.contextLink ?? it.link,
        license:
          "Uso livre (domínio público ou licença CC que permite reuso) — confira a página de origem antes de publicar.",
        source: "google",
      }));

      return new Response(JSON.stringify({ results }), {
        headers: { "Content-Type": "application/json", Connection: "keep-alive" },
      });
    }

    const secretName = source === "pixabay" ? "PIXABAY_API_KEY" : "PEXELS_API_KEY";
    const { value: apiKey, error: secretError } = await readSecret(supabase, secretName);

    if (secretError || !apiKey) {
      return new Response(
        JSON.stringify({ error: `Não foi possível obter ${secretName}`, details: secretError }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    let apiUrl: string;
    let headers: Record<string, string> = {};

    if (source === "pixabay") {
      apiUrl = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&per_page=${limit}`;
    } else {
      apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${limit}`;
      headers = { Authorization: apiKey };
    }

    const apiRes = await fetch(apiUrl, { headers });
    if (!apiRes.ok) {
      const text = await apiRes.text();
      return new Response(
        JSON.stringify({ error: `Erro na API ${source}`, status: apiRes.status, details: text.slice(0, 500) }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const raw = await apiRes.json();

    // Normaliza para um formato comum, independente da fonte
    let results: Array<{
      id: string | number;
      url: string;
      width: number;
      height: number;
      alt: string;
      thumb?: string;
      photographer?: string;
      page_url?: string;
      source: string;
    }>;
    if (source === "pixabay") {
      results = (raw.hits ?? []).map((h: any) => ({
        id: h.id,
        url: h.largeImageURL,
        width: h.imageWidth,
        height: h.imageHeight,
        alt: h.tags ?? "",
        thumb: h.previewURL,
        page_url: h.pageURL,
        source: "pixabay",
      }));
    } else {
      results = (raw.photos ?? []).map((p: any) => ({
        id: p.id,
        url: p.src?.large2x ?? p.src?.large,
        width: p.width,
        height: p.height,
        alt: p.alt ?? "",
        thumb: p.src?.small ?? p.src?.tiny,
        photographer: p.photographer,
        page_url: p.url,
        source: "pexels",
      }));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json", Connection: "keep-alive" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Erro inesperado", details: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
