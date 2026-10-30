import { createFileRoute } from "@tanstack/react-router";
import BlogPage from "@/pages/BlogPage";
import { getBlogData, parseBlogParams } from "@/lib/hub.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const BLOG_TITLE = `Blog do ${SITE_NAME}`;
const BLOG_DESCRIPTION =
  "Artigos para o pai, o marido e o provedor: paternidade por fase, casamento, dinheiro, fé, saúde do homem, churrasco, ferramentas e muito mais.";

export const Route = createFileRoute("/_site/blog")({
  loaderDeps: ({ search }) => parseBlogParams(search as Record<string, unknown>),
  loader: ({ deps }) => getBlogData({ data: deps }),
  head: (ctx) => {
    const search = ctx.match.search as Record<string, string | undefined>;
    const categoria = search?.["categoria"];
    const page = Math.max(1, Number(search?.["page"] ?? "1") || 1);
    const active = ctx.loaderData?.active ?? null;
    // /blog?categoria=X duplica /categoria/X (página própria): canonical
    // aponta para lá; paginação sem filtro é autorreferente.
    const canonical = categoria
      ? `${SITE_URL}/categoria/${categoria}${page > 1 ? `?page=${page}` : ""}`
      : page > 1
        ? `${SITE_URL}/blog?page=${page}`
        : `${SITE_URL}/blog`;
    const title = active ? `${active.name} | ${BLOG_TITLE}` : `${BLOG_TITLE} | ${SITE_NAME}`;
    const description = active?.description ?? BLOG_DESCRIPTION;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonical },
        { property: "og:image", content: SITE_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: SITE_OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: canonical }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbJsonLd([{ name: "Blog", path: "/blog" }])),
        },
      ],
    };
  },
  component: BlogPage,
});
