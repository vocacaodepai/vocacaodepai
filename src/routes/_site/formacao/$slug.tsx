import { createFileRoute, notFound } from "@tanstack/react-router";
import TrilhaPage from "@/pages/formacao/TrilhaPage";
import { getTrackData } from "@/lib/tracks.functions";
import { courseJsonLd } from "@/lib/irmandade/jsonld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

// /formacao/$slug (doc 09 §5.4): JSON-LD Course + BreadcrumbList.
export const Route = createFileRoute("/_site/formacao/$slug")({
  loader: async ({ params }) => {
    const data = await getTrackData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const t = loaderData?.track ?? null;
    const pageUrl = `${SITE_URL}/formacao/${params.slug}`;
    const title = t ? `${t.title} | Formação | ${SITE_NAME}` : `Trilha | ${SITE_NAME}`;
    const description = (t?.description ?? "Trilha de formação do Vocação de Pai.").slice(0, 155);
    const image = t?.cover_image_url?.startsWith("https://") ? t.cover_image_url : SITE_OG_IMAGE;
    const scripts = t
      ? [
          { type: "application/ld+json", children: JSON.stringify(courseJsonLd(t, pageUrl)) },
          {
            type: "application/ld+json",
            children: JSON.stringify(
              breadcrumbJsonLd([
                { name: "Formação", path: "/formacao" },
                { name: t.title, path: `/formacao/${params.slug}` },
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
        { property: "og:type", content: "website" },
        { property: "og:url", content: pageUrl },
        { property: "og:image", content: image },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts,
    };
  },
  component: TrilhaPage,
});
