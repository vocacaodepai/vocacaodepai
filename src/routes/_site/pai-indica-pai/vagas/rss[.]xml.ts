import { createFileRoute } from "@tanstack/react-router";
import { jobAreaLabel, jobTypeLabel, formatLocation } from "@/lib/pai-indica-pai/format";
import { queryJobs } from "@/lib/pai-indica-pai/queries";
import { jobsSearchSchema } from "@/lib/pai-indica-pai/schemas";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// RSS 2.0 das vagas (doc 08 §8.3): 50 mais recentes de jobs_public; filtros ?uf=, ?area=, ?remoto=1.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const Route = createFileRoute("/_site/pai-indica-pai/vagas/rss.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const search = jobsSearchSchema.parse(Object.fromEntries(url.searchParams));
        const self = `${SITE_URL}/pai-indica-pai/vagas/rss.xml${url.search}`;
        let items: string[] = [];
        try {
          const db = await createReadOnlySupabaseClient();
          const page1 = await queryJobs(db, { ...search, pagina: 1, ordem: "recentes" });
          const page2 =
            page1.total > 12
              ? await queryJobs(db, { ...search, pagina: 2, ordem: "recentes" })
              : null;
          const all = [...page1.items, ...(page2?.items ?? [])].slice(0, 50);
          items = all.map((j) => {
            const link = `${SITE_URL}/pai-indica-pai/vagas/${j.slug}`;
            return [
              "    <item>",
              `      <title>${esc(`${j.title} — ${j.company} (${formatLocation(j)})`)}</title>`,
              `      <link>${esc(link)}</link>`,
              `      <guid isPermaLink="true">${esc(link)}</guid>`,
              `      <pubDate>${new Date(j.published_at ?? j.created_at).toUTCString()}</pubDate>`,
              `      <description>${esc(j.summary)}</description>`,
              j.area ? `      <category>${esc(jobAreaLabel(j.area))}</category>` : "",
              `      <category>${esc(jobTypeLabel(j.type))}</category>`,
              "    </item>",
            ]
              .filter(Boolean)
              .join("\n");
          });
        } catch (error) {
          console.error("[vagas/rss.xml]", error);
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`Vagas — Pai Indica Pai | ${SITE_NAME}`)}</title>
    <link>${esc(`${SITE_URL}/pai-indica-pai/vagas`)}</link>
    <description>Vagas de trabalho indicadas por pais e moderadas pelo Vocação de Pai. Sem taxa, sem intermediação.</description>
    <language>pt-BR</language>
    <atom:link href="${esc(self)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;
        return new Response(xml, {
          headers: {
            "content-type": "application/rss+xml; charset=utf-8",
            "cache-control": "public, max-age=900, s-maxage=3600",
          },
        });
      },
    },
  },
});
