import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";

const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/sobre", changefreq: "monthly", priority: "0.5" },
  { path: "/contato", changefreq: "monthly", priority: "0.4" },
  { path: "/politica-de-privacidade", changefreq: "yearly", priority: "0.2" },
  { path: "/termos-de-uso", changefreq: "yearly", priority: "0.2" },
];

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toLastmod(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

// Fallback to the same public URL/publishable key baked into the client bundle
// (src/integrations/supabase/client.ts) when the VITE_SUPABASE_URL/
// VITE_SUPABASE_ANON_KEY env vars aren't configured on the server.
// Placeholders substituídos pelos valores reais no fim da Etapa 1 (doc 03 §1.3).
const FALLBACK_SUPABASE_URL = "<SUPABASE_URL>";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "<SUPABASE_PUBLISHABLE_KEY>";

// Public, read-only client — same pattern as src/lib/seo.functions.ts. Works
// during SSR without a session and only needs the publishable key, since the
// sitemap only ever lists content that's already publicly readable via RLS.
async function createReadOnlyClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["VITE_SUPABASE_URL"] || FALLBACK_SUPABASE_URL;
  const key = process.env["VITE_SUPABASE_ANON_KEY"] || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

async function buildSitemap(): Promise<string> {
  const supabase = await createReadOnlyClient();

  // TODO Fase 3 (loja) e Fase 7 (histórias): voltar a listar /loja/<slug> e /historias/<id>.
  const [postsRes, categoriesRes] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, updated_at, publish_at")
      .eq("status", "published")
      .lte("publish_at", new Date().toISOString()),
    supabase.from("categories").select("slug"),
  ]);

  const entries: string[] = STATIC_PAGES.map((p) =>
    urlEntry(`${SITE_URL}${p.path}`, toLastmod(null), p.changefreq, p.priority),
  );

  for (const post of postsRes.data ?? []) {
    entries.push(
      urlEntry(
        `${SITE_URL}/post/${post.slug as string}`,
        toLastmod((post.updated_at as string) ?? (post.publish_at as string)),
        "weekly",
        "0.8",
      ),
    );
  }

  for (const category of categoriesRes.data ?? []) {
    entries.push(
      urlEntry(`${SITE_URL}/categoria/${category.slug as string}`, toLastmod(null), "daily", "0.7"),
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildSitemap();
          return new Response(xml, {
            headers: {
              "content-type": "application/xml; charset=utf-8",
              "cache-control": "public, max-age=3600, s-maxage=3600",
            },
          });
        } catch (error) {
          console.error("[sitemap.xml] failed to build:", error);
          return new Response(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            {
              status: 500,
              headers: { "content-type": "application/xml; charset=utf-8" },
            },
          );
        }
      },
    },
  },
});
