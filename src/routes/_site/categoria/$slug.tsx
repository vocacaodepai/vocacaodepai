import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import CategoryPage from "@/pages/CategoryPage";
import { getCategoryData } from "@/lib/hub.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

function titleize(slug: string) {
  return slug
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export const Route = createFileRoute("/_site/categoria/$slug")({
  loaderDeps: ({ search }) => ({
    page: Math.max(1, Number((search as Record<string, unknown>)["page"] ?? 1) || 1),
  }),
  loader: async ({ params, deps }) => {
    // Categoria técnica "pai-indica": a listagem oficial é /pai-indica (doc 04 §5.3).
    if (params.slug === "pai-indica") throw redirect({ to: "/pai-indica", statusCode: 301 });
    const data = await getCategoryData({ data: { slug: params.slug, page: deps.page } });
    if (!data.category) throw notFound();
    return data;
  },
  head: (ctx) => {
    const { params, loaderData } = ctx;
    const name = loaderData?.category?.name ?? titleize(params.slug);
    const parent = loaderData?.parent ?? null;
    const title = `${name} | Blog do ${SITE_NAME}`;
    const description =
      loaderData?.category?.description ??
      `Artigos sobre ${name.toLowerCase()} no blog Vocação de Pai: orientações práticas e diretas para o pai de família.`;
    const search = ctx.match.search as Record<string, string | undefined>;
    const page = Math.max(1, Number(search?.["page"] ?? "1") || 1);
    const path = `/categoria/${params.slug}`;
    const url = page > 1 ? `${SITE_URL}${path}?page=${page}` : `${SITE_URL}${path}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: SITE_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: SITE_OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Blog", path: "/blog" },
              ...(parent ? [{ name: parent.name, path: `/categoria/${parent.slug}` }] : []),
              { name, path },
            ]),
          ),
        },
      ],
    };
  },
  component: CategoryPage,
});
