import { createFileRoute } from "@tanstack/react-router";
import SearchPage from "@/pages/SearchPage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/busca")({
  head: () => ({
    meta: [
      { title: `Busca | ${SITE_NAME}` },
      {
        name: "description",
        content: "Encontre artigos sobre paternidade, família e formação do homem.",
      },
      { property: "og:title", content: `Busca | ${SITE_NAME}` },
      {
        property: "og:description",
        content: "Encontre artigos sobre paternidade, família e formação do homem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/busca` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/busca` }],
  }),
  component: SearchPage,
});
