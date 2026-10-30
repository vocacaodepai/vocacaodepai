import { createFileRoute, notFound } from "@tanstack/react-router";
import PerguntaPage from "@/pages/irmandade/PerguntaPage";
import { getQuestionData } from "@/lib/community.functions";
import { qaPageJsonLd } from "@/lib/irmandade/jsonld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// /perguntas/$slug (doc 09 §4.1): JSON-LD QAPage (só Question sem respostas) + BreadcrumbList.
export const Route = createFileRoute("/_site/perguntas/$slug")({
  loader: async ({ params }) => {
    const data = await getQuestionData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const q = loaderData?.question ?? null;
    const answers = loaderData?.answers ?? [];
    const pageUrl = `${SITE_URL}/perguntas/${params.slug}`;
    const title = q
      ? `${q.title} | Perguntas da Irmandade | ${SITE_NAME}`
      : `Pergunta | ${SITE_NAME}`;
    const description = q
      ? q.body.replace(/\s+/g, " ").trim().slice(0, 155)
      : "Pergunta da Irmandade.";
    const scripts = q
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify(qaPageJsonLd(q, answers, pageUrl)),
          },
          {
            type: "application/ld+json",
            children: JSON.stringify(
              breadcrumbJsonLd([
                { name: "Irmandade", path: "/irmandade" },
                { name: "Perguntas", path: "/perguntas" },
                { name: q.title, path: `/perguntas/${params.slug}` },
              ]),
            ),
          },
        ]
      : [];
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: pageUrl },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts,
    };
  },
  component: PerguntaPage,
});
