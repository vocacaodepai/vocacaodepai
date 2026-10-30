import { createFileRoute } from "@tanstack/react-router";
import BlogPage from "@/pages/BlogPage";
import { getBlogData, parseBlogParams } from "@/lib/hub.functions";
import { breadcrumbJsonLd } from "@/lib/seo";

export const Route = createFileRoute("/_site/blog")({
  loaderDeps: ({ search }) => parseBlogParams(search as Record<string, unknown>),
  loader: ({ deps }) => getBlogData({ data: deps }),
  head: (ctx) => {
    const search = ctx.match.search as Record<string, string | undefined>;
    const categoria = search?.["categoria"];
    const page = Math.max(1, Number(search?.["page"] ?? "1") || 1);
    // /blog?categoria=X duplica /categoria/X (que j\u00e1 existe como p\u00e1gina
    // pr\u00f3pria) \u2014 apontar a canonical pra l\u00e1; pagina\u00e7\u00e3o sem filtro \u00e9
    // autorreferente.
    const canonical = categoria
      ? `https://vocacaodepai.com.br/categoria/${categoria}${page > 1 ? `?page=${page}` : ""}`
      : page > 1
        ? `https://vocacaodepai.com.br/blog?page=${page}`
        : "https://vocacaodepai.com.br/blog";

    return {
      meta: [
        { title: "Blog | Voca\u00e7\u00e3o de M\u00e3e" },
        {
          name: "description",
          content:
            "Artigos sobre gesta\u00e7\u00e3o, parto, amamenta\u00e7\u00e3o, sono do beb\u00ea e desenvolvimento infantil.",
        },
        { property: "og:title", content: "Blog | Voca\u00e7\u00e3o de M\u00e3e" },
        {
          property: "og:description",
          content:
            "Artigos sobre gesta\u00e7\u00e3o, parto, amamenta\u00e7\u00e3o, sono do beb\u00ea e desenvolvimento infantil.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:url", content: canonical },
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
