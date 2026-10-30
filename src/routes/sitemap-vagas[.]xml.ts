import { createFileRoute } from "@tanstack/react-router";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { SITE_URL } from "@/lib/site";

// Sitemap do Pai Indica Pai (doc 08 §8.2): páginas da seção, vagas aprovadas não expiradas (jobs_public)
// e perfis Pai Profissional aprovados. Registrar em robots.txt / sitemap index (Fase 8).
const STATIC: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/pai-indica-pai", changefreq: "daily", priority: "0.8" },
  { path: "/pai-indica-pai/vagas", changefreq: "daily", priority: "0.8" },
  { path: "/pai-indica-pai/indicacoes", changefreq: "daily", priority: "0.6" },
  { path: "/pai-indica-pai/profissionais", changefreq: "daily", priority: "0.6" },
  { path: "/pai-indica-pai/mentoria", changefreq: "weekly", priority: "0.5" },
];

const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const lastmod = (v: string | null | undefined) =>
  v ? v.slice(0, 10) : new Date().toISOString().slice(0, 10);
const entry = (loc: string, mod: string, freq: string, prio: string) =>
  `  <url>\n    <loc>${esc(loc)}</loc>\n    <lastmod>${mod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;

async function build(): Promise<string> {
  const entries = STATIC.map((p) =>
    entry(`${SITE_URL}${p.path}`, lastmod(null), p.changefreq, p.priority),
  );
  try {
    const db = await createReadOnlySupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const any = db as unknown as { from: (t: string) => any };
    const [jobs, pros] = await Promise.all([
      any
        .from("jobs_public")
        .select("slug, updated_at")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(2000),
      any.from("professionals").select("slug, updated_at").eq("status", "approved").limit(2000),
    ]);
    for (const j of (jobs.data ?? []) as { slug: string; updated_at: string | null }[])
      entries.push(
        entry(`${SITE_URL}/pai-indica-pai/vagas/${j.slug}`, lastmod(j.updated_at), "daily", "0.7"),
      );
    for (const p of (pros.data ?? []) as { slug: string; updated_at: string | null }[])
      entries.push(
        entry(
          `${SITE_URL}/pai-indica-pai/profissionais/${p.slug}`,
          lastmod(p.updated_at),
          "weekly",
          "0.5",
        ),
      );
  } catch (error) {
    console.error("[sitemap-vagas.xml]", error);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap-vagas.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(await build(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=900, s-maxage=3600",
          },
        }),
    },
  },
});
