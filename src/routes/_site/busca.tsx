import { createFileRoute } from "@tanstack/react-router";
import SearchPage from "@/pages/SearchPage";
import { getSearchCategories } from "@/lib/hub.functions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const DESCRIPTION = "Encontre artigos sobre paternidade, família e formação do homem.";

export const Route = createFileRoute("/_site/busca")({
  loader: () => getSearchCategories(),
  head: () => ({
    meta: [
      { title: `Busca | ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      // Página de busca não entra no índice (doc 11 §2.5).
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: `Busca | ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/busca` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/busca` }],
  }),
  component: SearchPage,
});
