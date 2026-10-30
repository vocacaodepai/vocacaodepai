import { createFileRoute, notFound } from "@tanstack/react-router";
import StoreCategoryPage from "@/pages/StoreCategoryPage";
import { getStoreCategoryData } from "@/lib/loja/loja.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { STORE_CATEGORY_META } from "@/lib/loja/categories";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

// /loja/categoria/$slug (doc 05 §4.6): 404 para slug inexistente; JSON-LD
// BreadcrumbList + ItemList com os produtos da categoria.
export const Route = createFileRoute("/_site/loja/categoria/$slug")({
  loader: async ({ params }) => {
    const data = await getStoreCategoryData({ data: { slug: params.slug } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    const meta = STORE_CATEGORY_META[params.slug];
    const name = loaderData?.category.name ?? meta?.seoTitle ?? "Categoria";
    const url = `${SITE_URL}/loja/categoria/${params.slug}`;
    const title = `${name} | Loja do Pai | ${SITE_NAME}`;
    const description =
      meta?.seoDescription ??
      loaderData?.category.description ??
      `${name} na Loja do Pai: produtos com review honesta e faixa de preço pesquisada.`;
    const products = loaderData?.products ?? [];
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: products[0]?.image_url ?? SITE_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Loja do Pai", path: "/loja" },
              { name, path: `/loja/categoria/${params.slug}` },
            ]),
          ),
        },
        ...(products.length > 0
          ? [
              {
                type: "application/ld+json",
                children: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "ItemList",
                  name: `${name} — Loja do Pai`,
                  itemListElement: products.map((p, i) => ({
                    "@type": "ListItem",
                    position: i + 1,
                    name: p.name,
                    url: `${SITE_URL}/loja/${p.slug}`,
                  })),
                }),
              },
            ]
          : []),
      ],
    };
  },
  component: StoreCategoryPage,
});
