import { createFileRoute, notFound } from "@tanstack/react-router";
import MidiaPage from "@/pages/pai-indica-midia/MidiaPage";
import { getMediaBySlug, getRelatedMedia } from "@/lib/pai-indica-midia.functions";
import { mediaJsonLd } from "@/lib/pai-indica-midia/jsonld";
import { mediaTypeLabels } from "@/lib/pai-indica-midia/taxonomia";
import type { MediaReview } from "@/lib/pai-indica-midia/types";
import { DEFAULT_AUTHOR, SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/pai-indica/midia/$slug")({
  loader: async ({ params }) => {
    // A ficha viaja como JSON genérico (ver getMediaBySlug) e volta a ser MediaReview aqui.
    const wire = await getMediaBySlug({ data: { slug: params.slug } });
    if (!wire) throw notFound();
    const media = wire as unknown as MediaReview;
    const related = await getRelatedMedia({ data: { id: media.id, type: media.type } });
    return { media: wire, related };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/pai-indica/midia/${params.slug}`;
    const m = loaderData?.media as unknown as MediaReview | undefined;
    const title = m
      ? `${m.seo_title ?? `${m.title}: é para o seu filho?`} | ${SITE_NAME}`
      : `Pai Indica Mídia | ${SITE_NAME}`;
    const description =
      m?.seo_description ??
      m?.summary ??
      "Ficha do Pai Indica Mídia: ClassInd oficial, nota tripla do pai e o que conversar com seu filho.";
    const image = m?.poster_url ?? SITE_OG_IMAGE;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        ...(m?.publish_at ? [{ property: "article:published_time", content: m.publish_at }] : []),
        ...(m?.updated_at ? [{ property: "article:modified_time", content: m.updated_at }] : []),
        {
          property: "article:section",
          content: m ? `Pai Indica Mídia · ${mediaTypeLabels[m.type].label}` : "Pai Indica Mídia",
        },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: m
        ? mediaJsonLd({ url, media: m, authorName: DEFAULT_AUTHOR }).map((obj) => ({
            type: "application/ld+json",
            children: JSON.stringify(obj),
          }))
        : [],
    };
  },
  component: Page,
});

function Page() {
  const { media, related } = Route.useLoaderData();
  return <MidiaPage media={media as unknown as MediaReview} related={related} />;
}
