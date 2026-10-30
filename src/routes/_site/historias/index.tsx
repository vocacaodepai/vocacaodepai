import { createFileRoute } from "@tanstack/react-router";
import HistoriasPage from "@/pages/irmandade/HistoriasPage";
import { getStoriesData } from "@/lib/community.functions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/historias/")({
  loader: () => getStoriesData({ data: {} }),
  head: () => {
    const title = `Histórias de pai | ${SITE_NAME}`;
    const description =
      "Relatos reais de pais da Irmandade: o que deu certo, o que deu errado e o que ficou.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/historias` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/historias` }],
    };
  },
  component: HistoriasPage,
});
