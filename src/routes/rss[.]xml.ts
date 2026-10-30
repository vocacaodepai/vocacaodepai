import { createFileRoute } from "@tanstack/react-router";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { PUBLISHED, nowIso } from "@/lib/queries";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";

// RSS do blog (doc 03 §6.5): os 30 posts publicados mais recentes.
// Mesmo padrão de handler server de src/routes/sitemap[.]xml.ts.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

interface RssRow {
  slug: string;
  title: string;
  excerpt: string | null;
  publish_at: string | null;
  updated_at: string | null;
  cover_image_url: string | null;
  category: { name?: string | null } | null;
}

function imageType(url: string): string {
  const clean = url.split("?")[0].toLowerCase();
  if (clean.endsWith(".png")) return "image/png";
  if (clean.endsWith(".webp")) return "image/webp";
  if (clean.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function buildRss(): Promise<string> {
  const db = await createReadOnlySupabaseClient();
  const { data, error } = await db
    .from("posts")
    .select(
      "slug, title, excerpt, publish_at, updated_at, cover_image_url, category:categories(name)",
    )
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso())
    .order("publish_at", { ascending: false })
    .limit(30);
  if (error) throw error;

  const rows = (data ?? []) as unknown as RssRow[];
  const items = rows
    .map((p) => {
      const link = `${SITE_URL}/post/${p.slug}`;
      const date = new Date(p.publish_at ?? p.updated_at ?? Date.now()).toUTCString();
      const category = p.category?.name ? `<category>${esc(p.category.name)}</category>` : "";
      const enclosure = p.cover_image_url
        ? `<enclosure url="${esc(p.cover_image_url)}" type="${imageType(p.cover_image_url)}" length="0"/>`
        : "";
      return `<item><title>${esc(p.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${date}</pubDate><description>${esc(p.excerpt ?? "")}</description>${category}${enclosure}</item>`;
    })
    .join("");

  const lastBuild = new Date(rows[0]?.publish_at ?? Date.now()).toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(SITE_NAME)}</title><link>${SITE_URL}</link><atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/><description>${esc(SITE_DESCRIPTION)}</description><language>pt-BR</language><lastBuildDate>${lastBuild}</lastBuildDate><image><url>${SITE_URL}/og-default.jpg</url><title>${esc(SITE_NAME)}</title><link>${SITE_URL}</link></image>${items}</channel></rss>`;
}

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildRss();
          return new Response(xml, {
            headers: {
              "content-type": "application/rss+xml; charset=utf-8",
              "cache-control": "public, max-age=1800, s-maxage=1800",
            },
          });
        } catch (error) {
          console.error("[rss.xml] failed to build:", error);
          const empty = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE_NAME)}</title><link>${SITE_URL}</link><description>${esc(SITE_DESCRIPTION)}</description><language>pt-BR</language></channel></rss>`;
          return new Response(empty, {
            status: 500,
            headers: { "content-type": "application/rss+xml; charset=utf-8" },
          });
        }
      },
    },
  },
});
