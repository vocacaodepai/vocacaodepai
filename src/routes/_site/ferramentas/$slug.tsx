import { createFileRoute, notFound } from "@tanstack/react-router";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";
import { toolBySlug } from "@/lib/tools/registry";
import { toolJsonLd } from "@/lib/tools/jsonld";
import { getRelatedPostsForTool } from "@/lib/tools/related.functions";
import { ToolLayout } from "@/components/ferramentas/ToolLayout";
import NotFound from "@/pages/NotFound";

// Rota dinâmica das ferramentas (doc 06 §1.6): SEO, 4 JSON-LD e artigos relacionados saem do registry.
export const Route = createFileRoute("/_site/ferramentas/$slug")({
  loader: async ({ params }) => {
    const tool = toolBySlug(params.slug);
    if (!tool) throw notFound();
    const [related, preloaded] = await Promise.all([
      getRelatedPostsForTool({
        data: { categories: tool.relatedCategories, terms: tool.relatedTerms },
      }).catch(() => []),
      tool.preload ? tool.preload().catch(() => null) : Promise.resolve(null),
    ]);
    return { slug: tool.slug, related, preloaded };
  },
  head: ({ params }) => {
    const tool = toolBySlug(params.slug);
    if (!tool) return { meta: [{ title: `Ferramenta não encontrada | ${SITE_NAME}` }] };
    const url = `${SITE_URL}/ferramentas/${tool.slug}`;
    const title = `${tool.seoTitle} | ${SITE_NAME}`;
    const image = tool.ogImage ? `${SITE_URL}${tool.ogImage}` : SITE_OG_IMAGE;
    return {
      meta: [
        { title },
        { name: "description", content: tool.description },
        { property: "og:title", content: title },
        { property: "og:description", content: tool.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: toolJsonLd(tool).map((j) => ({
        type: "application/ld+json",
        children: JSON.stringify(j),
      })),
    };
  },
  notFoundComponent: NotFound,
  component: ToolPage,
});

function ToolPage() {
  const { slug, related } = Route.useLoaderData();
  const tool = toolBySlug(slug)!;
  const Component = tool.component;
  return (
    <ToolLayout tool={tool} related={related}>
      <Component />
    </ToolLayout>
  );
}
