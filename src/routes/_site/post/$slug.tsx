import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { isPaiIndicaKind } from "@/lib/pai-indica/types";
import PostPage from "@/pages/PostPage";
import { getPostFull, getPostSeo, getRelatedPosts } from "@/lib/seo.functions";
import type { BlogPost } from "@/lib/queries";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL, DEFAULT_AUTHOR } from "@/lib/site";

export const Route = createFileRoute("/_site/post/$slug")({
  loader: async ({ params }) => {
    const [seo, full] = await Promise.all([
      getPostSeo({ data: { slug: params.slug } }),
      getPostFull({ data: { slug: params.slug } }),
    ]);
    if (!seo || !full) throw notFound();
    const post = full as unknown as BlogPost;
    // Pai Indica (review/comparativo/lista) mora em /pai-indica/$slug (doc 04 §5.2): 301.
    if (isPaiIndicaKind(post.kind)) {
      throw redirect({ to: "/pai-indica/$slug", params: { slug: params.slug }, statusCode: 301 });
    }
    // "Continue lendo": 3 posts da mesma categoria, já no servidor.
    const related = await getRelatedPosts({
      data: { postId: post.id, categoryId: post.category_id ?? null },
    });
    // O body é JSON livre do Tiptap; na fronteira servidor→página viaja como
    // JSON genérico (PostWire, ver queries.ts).
    return { seo, full, related };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/post/${params.slug}`;
    const seo = loaderData?.seo;
    const title = seo ? `${seo.title} | ${SITE_NAME}` : `Artigo | ${SITE_NAME}`;
    const description = seo?.description ?? "Leia o artigo completo no blog Vocação de Pai.";
    const image = seo?.image ?? SITE_OG_IMAGE;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        ...(seo?.imageAlt ? [{ property: "og:image:alt", content: seo.imageAlt }] : []),
        ...(seo?.publishedAt
          ? [{ property: "article:published_time", content: seo.publishedAt }]
          : []),
        ...(seo?.updatedAt ? [{ property: "article:modified_time", content: seo.updatedAt }] : []),
        ...(seo?.categoryName ? [{ property: "article:section", content: seo.categoryName }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: seo
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(
                articleJsonLd({
                  title: seo.title,
                  description: seo.description,
                  url,
                  image: seo.image,
                  datePublished: seo.publishedAt,
                  dateModified: seo.updatedAt ?? seo.publishedAt,
                  authorName: seo.authorName ?? DEFAULT_AUTHOR,
                  category: seo.categoryName,
                  publisherLogo: SITE_OG_IMAGE,
                }),
              ),
            },
            {
              type: "application/ld+json",
              children: JSON.stringify(
                breadcrumbJsonLd([
                  { name: "Blog", path: "/blog" },
                  ...(seo.categorySlug && seo.categoryName
                    ? [{ name: seo.categoryName, path: `/categoria/${seo.categorySlug}` }]
                    : []),
                  { name: seo.title, path: `/post/${params.slug}` },
                ]),
              ),
            },
            ...(seo.faq.length > 0
              ? [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(seo.faq)) }]
              : []),
          ]
        : [],
    };
  },
  component: PostPage,
});
