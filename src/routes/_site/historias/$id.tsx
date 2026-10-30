import { createFileRoute, notFound } from "@tanstack/react-router";
import HistoriaPage from "@/pages/irmandade/HistoriaPage";
import { getStoryData } from "@/lib/community.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

// /historias/$id (doc 09 §3.2): JSON-LD Article (author Person = author_name) + BreadcrumbList.
export const Route = createFileRoute("/_site/historias/$id")({
  loader: async ({ params }) => {
    const data = await getStoryData({ data: { id: params.id } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const story = loaderData?.story ?? null;
    const pageUrl = `${SITE_URL}/historias/${params.id}`;
    const title = story
      ? `${story.title} | Histórias de pai | ${SITE_NAME}`
      : `História | ${SITE_NAME}`;
    const description = story
      ? story.content.replace(/\s+/g, " ").trim().slice(0, 155)
      : "Relato de um pai da Irmandade.";
    const image = story?.photo_url?.startsWith("https://") ? story.photo_url : SITE_OG_IMAGE;
    const scripts = story
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: story.title,
              description,
              url: pageUrl,
              ...(story.photo_url ? { image: story.photo_url } : {}),
              datePublished: story.created_at,
              dateModified: story.updated_at,
              author: { "@type": "Person", name: story.author_name },
              publisher: { "@type": "Organization", name: SITE_NAME },
            }),
          },
          {
            type: "application/ld+json",
            children: JSON.stringify(
              breadcrumbJsonLd([
                { name: "Irmandade", path: "/irmandade" },
                { name: "Histórias", path: "/historias" },
                { name: story.title, path: `/historias/${params.id}` },
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
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts,
    };
  },
  component: HistoriaPage,
});
