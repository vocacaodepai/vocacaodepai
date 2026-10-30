import { createFileRoute } from "@tanstack/react-router";
import EventosPage from "@/pages/irmandade/EventosPage";
import { getEventsData } from "@/lib/community.functions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/eventos/")({
  loader: () => getEventsData(),
  head: () => {
    const title = `Encontros da Irmandade | ${SITE_NAME}`;
    const description =
      "Café dos pais, lives, retiros e Galpão do Pai: encontros presenciais e on-line de pais católicos.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/eventos` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/eventos` }],
    };
  },
  component: EventosPage,
});
