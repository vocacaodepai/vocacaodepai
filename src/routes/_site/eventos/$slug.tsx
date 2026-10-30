import { createFileRoute, notFound } from "@tanstack/react-router";
import EventoPage from "@/pages/irmandade/EventoPage";
import { getEventData } from "@/lib/community.functions";
import { eventJsonLd } from "@/lib/irmandade/jsonld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

// /eventos/$slug (doc 09 §8): JSON-LD Event (só published/done) + BreadcrumbList.
export const Route = createFileRoute("/_site/eventos/$slug")({
  loader: async ({ params }) => {
    const data = await getEventData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const e = loaderData ?? null;
    const pageUrl = `${SITE_URL}/eventos/${params.slug}`;
    const title = e ? `${e.title} | Encontros | ${SITE_NAME}` : `Encontro | ${SITE_NAME}`;
    const description = (e?.description ?? "Encontro da Irmandade do Vocação de Pai.")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155);
    const image = e?.cover_image_url?.startsWith("https://") ? e.cover_image_url : SITE_OG_IMAGE;
    const scripts = e
      ? [
          ...(e.status === "published" || e.status === "done"
            ? [{ type: "application/ld+json", children: JSON.stringify(eventJsonLd(e, pageUrl)) }]
            : []),
          {
            type: "application/ld+json",
            children: JSON.stringify(
              breadcrumbJsonLd([
                { name: "Irmandade", path: "/irmandade" },
                { name: "Encontros", path: "/eventos" },
                { name: e.title, path: `/eventos/${params.slug}` },
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
  component: EventoPage,
});
