import { createFileRoute } from "@tanstack/react-router";
import PaiIndicaListPage from "@/pages/PaiIndicaListPage";
import { getPaiIndicaList } from "@/lib/pai-indica.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Pai Indica: reviews e comparativos com nota de 0 a 10 | ${SITE_NAME}`;
const DESCRIPTION =
  "Reviews, comparativos e listas de produtos para o pai: nota por critério, prós e contras, faixa de preço pesquisada e link direto para comprar.";

export const Route = createFileRoute("/_site/pai-indica/")({
  loader: async () => ({ posts: await getPaiIndicaList() }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pai-indica` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pai-indica` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd([{ name: "Pai Indica", path: "/pai-indica" }])),
      },
    ],
  }),
  component: Page,
});

function Page() {
  const { posts } = Route.useLoaderData();
  return <PaiIndicaListPage posts={posts} />;
}
