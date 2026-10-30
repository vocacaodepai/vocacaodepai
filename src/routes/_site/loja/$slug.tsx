import { createFileRoute, notFound } from "@tanstack/react-router";
import ProductPage from "@/pages/ProductPage";
import { getProductData } from "@/lib/loja/loja.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

// /loja/$slug (doc 05 §4.7). JSON-LD: Product SEM offers (a faixa não é preço
// exato), Review com bestRating 10 quando há review longa, e BreadcrumbList.
export const Route = createFileRoute("/_site/loja/$slug")({
  loader: async ({ params }) => {
    const data = await getProductData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const product = loaderData?.product ?? null;
    const pageUrl = `${SITE_URL}/loja/${params.slug}`;
    const title = product
      ? `${product.name} | Loja do Pai | ${SITE_NAME}`
      : `Produto | Loja do Pai | ${SITE_NAME}`;
    const description = (
      product?.short_description ??
      product?.description ??
      (product
        ? `${product.name}: análise honesta com prós, contras, faixa de preço pesquisada e veredito do Vocação de Pai.`
        : "Análise completa do produto com prós, contras e faixa de preço pesquisada.")
    )
      .replace(/\s+/g, " ")
      .slice(0, 155);
    const image = product?.image_url?.startsWith("https://") ? product.image_url : SITE_OG_IMAGE;

    const scripts: { type: string; children: string }[] = [];
    if (product) {
      const brand = product.brand ? { "@type": "Brand", name: product.brand } : undefined;
      const hasRating = product.rating != null && product.rating_count > 0;
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description,
          image: product.images.length > 0 ? product.images : (product.image_url ?? undefined),
          sku: product.asin ?? undefined,
          brand,
          category: product.category?.name ?? undefined,
          url: pageUrl,
          ...(hasRating
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.rating,
                  reviewCount: product.rating_count,
                  bestRating: 5,
                  worstRating: 1,
                },
              }
            : {}),
        }),
      });
      if (product.review && typeof product.review.nota === "number") {
        scripts.push({
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            itemReviewed: {
              "@type": "Product",
              name: product.name,
              brand,
              image: product.image_url ?? undefined,
            },
            author: { "@type": "Organization", name: SITE_NAME },
            publisher: { "@type": "Organization", name: SITE_NAME },
            reviewRating: {
              "@type": "Rating",
              ratingValue: product.review.nota,
              bestRating: 10,
              worstRating: 0,
            },
            name: product.review.titulo,
            reviewBody: product.review.resumo,
            datePublished: product.review.atualizado_em ?? product.updated_at.slice(0, 10),
          }),
        });
      }
      scripts.push({
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Loja do Pai", path: "/loja" },
            ...(product.category
              ? [{ name: product.category.name, path: `/loja/categoria/${product.category.slug}` }]
              : []),
            { name: product.name, path: `/loja/${params.slug}` },
          ]),
        ),
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: pageUrl },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
      scripts,
    };
  },
  component: ProductPage,
});
