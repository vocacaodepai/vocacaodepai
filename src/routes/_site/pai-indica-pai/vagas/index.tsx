import { createFileRoute } from "@tanstack/react-router";
import JobsListPage from "@/pages/pai-indica-pai/JobsListPage";
import { listJobs } from "@/lib/pai-indica-pai/functions";
import { jobsSearchSchema } from "@/lib/pai-indica-pai/schemas";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Vagas indicadas por pais | Pai Indica Pai | ${SITE_NAME}`;
const DESCRIPTION =
  "Vagas de trabalho publicadas por pais, moderadas uma a uma. Filtre por UF, cidade, remoto, tipo e área. Sem taxa, sem intermediação.";

// Lista de vagas (doc 08 §3.2): filtros validados na URL (zod), loader no servidor, canonical limpa.
export const Route = createFileRoute("/_site/pai-indica-pai/vagas/")({
  validateSearch: (s: Record<string, unknown>) => jobsSearchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listJobs({ data: deps }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pai-indica-pai/vagas` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: `${SITE_URL}/pai-indica-pai/vagas` },
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "Vagas — Pai Indica Pai",
        href: `${SITE_URL}/pai-indica-pai/vagas/rss.xml`,
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Pai Indica Pai", path: "/pai-indica-pai" },
            { name: "Vagas", path: "/pai-indica-pai/vagas" },
          ]),
        ),
      },
    ],
  }),
  component: JobsListPage,
});
