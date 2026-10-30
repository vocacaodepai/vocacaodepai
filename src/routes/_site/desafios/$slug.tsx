import { createFileRoute, notFound } from "@tanstack/react-router";
import DesafioPage from "@/pages/formacao/DesafioPage";
import { getChallengeData } from "@/lib/tracks.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// /desafios/$slug (doc 09 §6): sem JSON-LD de desafio (só BreadcrumbList).
export const Route = createFileRoute("/_site/desafios/$slug")({
  loader: async ({ params }) => {
    const data = await getChallengeData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const c = loaderData?.challenge ?? null;
    const pageUrl = `${SITE_URL}/desafios/${params.slug}`;
    const title = c ? `${c.title} | Desafios do Pai | ${SITE_NAME}` : `Desafio | ${SITE_NAME}`;
    const description = (c?.description ?? "Desafio de 30 dias do Vocação de Pai.").slice(0, 155);
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: pageUrl },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts: c
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(
                breadcrumbJsonLd([
                  { name: "Formação", path: "/formacao" },
                  { name: "Desafios do Pai", path: "/desafios" },
                  { name: c.title, path: `/desafios/${params.slug}` },
                ]),
              ),
            },
          ]
        : [],
    };
  },
  component: DesafioPage,
});
