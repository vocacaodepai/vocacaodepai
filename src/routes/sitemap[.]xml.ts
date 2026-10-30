import { createFileRoute } from "@tanstack/react-router";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { PUBLISHED, nowIso } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";

// Sitemap (doc 03 §6.6 + doc 04 §5.3): home, blog, Pai Indica, páginas institucionais,
// categorias e posts publicados. SEM os placeholders das seções futuras (/loja,
// /ferramentas, /area-do-pai, /pai-indica-pai, /irmandade, /formacao): cada
// fase acrescenta as suas rotas quando elas existirem de verdade.
const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/pai-indica", changefreq: "daily", priority: "0.9" },
  { path: "/sobre", changefreq: "monthly", priority: "0.5" },
  { path: "/contato", changefreq: "monthly", priority: "0.4" },
  { path: "/politica-de-privacidade", changefreq: "yearly", priority: "0.2" },
  { path: "/termos-de-uso", changefreq: "yearly", priority: "0.2" },
  { path: "/politica-de-afiliados", changefreq: "yearly", priority: "0.2" },
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

interface PostRow {
  slug: string;
  kind: string | null;
  updated_at: string | null;
  publish_at: string | null;
}
const PAI_INDICA_KINDS = new Set(["review", "comparativo", "lista"]);

interface CategoryRow {
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

async function buildSitemap(): Promise<string> {
  const supabase = await createReadOnlySupabaseClient();

  // TODO Fase 3 (Loja), 4 (Ferramentas), 6 (vagas) e 7 (histórias):
  // acrescentar as rotas quando as páginas existirem.
  const [postsRes, categoriesRes] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, kind, updated_at, publish_at")
      .eq("status", PUBLISHED)
      .lte("publish_at", nowIso())
      .order("publish_at", { ascending: false }),
    supabase.from("categories").select("slug, parent_id, sort_order").order("sort_order"),
  ]);

  const today = toLastmod(null);
  const entries: string[] = STATIC_PAGES.map((p) =>
    urlEntry(`${SITE_URL}${p.path}`, today, p.changefreq, p.priority),
  );

  // Categorias-mãe primeiro (prioridade maior), subcategorias depois.
  const categories = ((categoriesRes.data ?? []) as unknown as CategoryRow[]).filter(
    (c) => c.sort_order < 900,
  );
  for (const category of categories) {
    entries.push(
      urlEntry(
        `${SITE_URL}/categoria/${category.slug}`,
        today,
        "daily",
        category.parent_id ? "0.6" : "0.7",
      ),
    );
  }

  // Pai Indica (review/comparativo/lista) tem canônico único em /pai-indica/<slug>;
  // /post/<slug> desses posts redireciona (301) e fica fora do sitemap.
  for (const post of (postsRes.data ?? []) as unknown as PostRow[]) {
    const prefix = PAI_INDICA_KINDS.has(post.kind ?? "") ? "/pai-indica" : "/post";
    entries.push(
      urlEntry(
        `${SITE_URL}${prefix}/${post.slug}`,
        toLastmod(post.updated_at ?? post.publish_at),
        "weekly",
        "0.8",
      ),
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
