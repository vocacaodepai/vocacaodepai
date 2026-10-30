import { createFileRoute, notFound } from "@tanstack/react-router";
import CategoryPage from "@/pages/CategoryPage";
import { getCategoryData } from "@/lib/hub.functions";

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
    const data = await getCategoryData({ data: { slug: params.slug, page: deps.page } });
    if (!data.category) throw notFound();
    return data;
  },
  head: (ctx) => {
    const { params, loaderData } = ctx;
    const name = loaderData?.category?.name ?? titleize(params.slug);
    const title = `${name} | Vocação de Pai`;
    const description =
      loaderData?.category?.description ??
      `Artigos sobre ${name.toLowerCase()} no blog Vocação de Pai: orientações práticas e diretas para o pai de família.`;
    const search = ctx.match.search as Record<string, string | undefined>;
    const page = Math.max(1, Number(search?.["page"] ?? "1") || 1);
    const url =
      page > 1
        ? `https://vocacaodepai.com.br/categoria/${params.slug}?page=${page}`
        : `https://vocacaodepai.com.br/categoria/${params.slug}`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Início",
                item: "https://vocacaodepai.com.br",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: "https://vocacaodepai.com.br/blog",
              },
              { "@type": "ListItem", position: 3, name, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: CategoryPage,
});
