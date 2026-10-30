import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import PaiIndicaPostPage from "@/pages/PaiIndicaPostPage";
import { getPostFull, getPostSeo } from "@/lib/seo.functions";
import { getProductsBySlugs, getRelatedPaiIndica } from "@/lib/pai-indica.functions";
import { paiIndicaJsonLd } from "@/lib/pai-indica/jsonld";
import { productSlugsOf } from "@/lib/pai-indica/queries";
import { isPaiIndicaKind, type PaiIndicaPost } from "@/lib/pai-indica/types";
import type { BlogPost } from "@/lib/queries";
import { DEFAULT_AUTHOR, SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

export type PaiIndicaFull = BlogPost & PaiIndicaPost;

export const Route = createFileRoute("/_site/pai-indica/$slug")({
  loader: async ({ params }) => {
    const [seo, fullWire] = await Promise.all([
      getPostSeo({ data: { slug: params.slug } }),
      getPostFull({ data: { slug: params.slug } }),
    ]);
    if (!seo || !fullWire) throw notFound();
    const full = fullWire as unknown as PaiIndicaFull;
    // Canônico único: artigo comum mora em /post/$slug (doc 04 §5.2).
    if (!isPaiIndicaKind(full.kind)) {
      throw redirect({ to: "/post/$slug", params: { slug: params.slug }, statusCode: 301 });
    }
    const [products, related] = await Promise.all([
      getProductsBySlugs({ data: { slugs: productSlugsOf(full) } }),
      getRelatedPaiIndica({
        data: { id: full.id, product_category: full.product_category ?? "" },
      }),
    ]);
    return { seo, full: fullWire, products, related };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/pai-indica/${params.slug}`;
    const seo = loaderData?.seo;
    const full = loaderData?.full as unknown as PaiIndicaFull | undefined;
    const title = seo ? `${seo.title} | ${SITE_NAME}` : `Pai Indica | ${SITE_NAME}`;
    const description = seo?.description ?? "Review do Pai Indica, com nota de 0 a 10.";
    const rawImage = seo?.image ?? SITE_OG_IMAGE;
    const image = rawImage.startsWith("/") ? `${SITE_URL}${rawImage}` : rawImage;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        ...(seo?.publishedAt
          ? [{ property: "article:published_time", content: seo.publishedAt }]
          : []),
        ...(seo?.updatedAt ? [{ property: "article:modified_time", content: seo.updatedAt }] : []),
        { property: "article:section", content: "Pai Indica" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts:
        full && loaderData
          ? paiIndicaJsonLd({
              url,
              post: full,
              products: loaderData.products,
              authorName: seo?.authorName ?? DEFAULT_AUTHOR,
            }).map((obj) => ({ type: "application/ld+json", children: JSON.stringify(obj) }))
          : [],
    };
  },
  component: Page,
});

function Page() {
  const d = Route.useLoaderData();
  return (
    <PaiIndicaPostPage
      post={d.full as unknown as PaiIndicaFull}
      products={d.products}
      related={d.related}
    />
  );
}
