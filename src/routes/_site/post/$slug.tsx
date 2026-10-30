import { createFileRoute, notFound } from "@tanstack/react-router";
import PostPage from "@/pages/PostPage";
import { getPostFull, getPostSeo } from "@/lib/seo.functions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/post/$slug")({
  loader: async ({ params }) => {
    const [seo, full] = await Promise.all([
      getPostSeo({ data: { slug: params.slug } }),
      getPostFull({ data: { slug: params.slug } }),
    ]);
    if (!seo) throw notFound();
    return { seo, full };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/post/${params.slug}`;
    const loaderSeo = loaderData?.seo;
    const title = loaderSeo?.title ?? `Artigo | ${SITE_NAME}`;
    const description = loaderSeo?.description ?? "Leia o artigo completo no blog Vocação de Pai.";
    const rawFaq = (loaderData?.full as { faq?: unknown } | null | undefined)?.faq;
    const faq = Array.isArray(rawFaq)
      ? (rawFaq as Array<{ question?: unknown; answer?: unknown }>).filter(
          (item) => typeof item?.question === "string" && typeof item?.answer === "string",
        )
      : [];

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderSeo?.image
          ? [
              { property: "og:image", content: loaderSeo.image },
              { name: "twitter:image", content: loaderSeo.image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: loaderSeo
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: loaderSeo.title,
                description: loaderSeo.description,
                image: loaderSeo.image ?? undefined,
                datePublished: loaderSeo.publishedAt ?? undefined,
                dateModified: loaderSeo.updatedAt ?? loaderSeo.publishedAt ?? undefined,
                mainEntityOfPage: url,
                author: {
                  "@type": "Person",
                  name: loaderSeo.authorName ?? SITE_NAME,
                },
                publisher: { "@type": "Organization", name: SITE_NAME },
                articleSection: loaderSeo.categoryName ?? undefined,
              }),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
                  ...(loaderSeo.categorySlug
                    ? [
                        {
                          "@type": "ListItem",
                          position: 2,
                          name: loaderSeo.categoryName,
                          item: `${SITE_URL}/categoria/${loaderSeo.categorySlug}`,
                        },
                      ]
                    : []),
                  {
                    "@type": "ListItem",
                    position: loaderSeo.categorySlug ? 3 : 2,
                    name: loaderSeo.title,
                    item: url,
                  },
                ],
              }),
            },
            ...(faq.length > 0
              ? [
                  {
                    type: "application/ld+json",
                    children: JSON.stringify({
                      "@context": "https://schema.org",
                      "@type": "FAQPage",
                      mainEntity: faq.map((item) => ({
                        "@type": "Question",
                        name: item.question,
                        acceptedAnswer: { "@type": "Answer", text: item.answer },
                      })),
                    }),
                  },
                ]
              : []),
          ]
        : [],
    };
  },
  component: PostPage,
});
