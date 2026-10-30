import { createFileRoute } from "@tanstack/react-router";
import MidiaListPage from "@/pages/pai-indica-midia/MidiaListPage";
import { getMediaList } from "@/lib/pai-indica-midia.functions";
import { mediaListJsonLd } from "@/lib/pai-indica-midia/jsonld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Pai Indica Mídia: filmes, séries, jogos, apps e livros por idade | ${SITE_NAME}`;
const DESCRIPTION =
  "Classificação oficial ClassInd + nota tripla do pai (qualidade, moral e idade) para filmes, séries, jogos, apps e livros, com o que conversar com seu filho.";

export const Route = createFileRoute("/_site/pai-indica/midia/")({
  loader: async () => ({ items: await getMediaList() }),
  head: ({ loaderData }) => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pai-indica/midia` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pai-indica/midia` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Pai Indica", path: "/pai-indica" },
            { name: "Mídia", path: "/pai-indica/midia" },
          ]),
        ),
      },
      ...(loaderData && loaderData.items.length > 0
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify(mediaListJsonLd(loaderData.items)),
            },
          ]
        : []),
    ],
  }),
  component: Page,
});

function Page() {
  const { items } = Route.useLoaderData();
  return <MidiaListPage items={items} />;
}
