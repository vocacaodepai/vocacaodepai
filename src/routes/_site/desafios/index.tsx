import { createFileRoute } from "@tanstack/react-router";
import DesafiosPage from "@/pages/formacao/DesafiosPage";
import { getDesafiosData } from "@/lib/tracks.functions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/desafios/")({
  loader: () => getDesafiosData(),
  head: () => {
    const title = `Desafios do Pai | ${SITE_NAME}`;
    const description =
      "Desafios de 30 dias: presença com os filhos, provedor e disciplina do homem. Uma tarefa por dia e recomeço suave.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/desafios` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/desafios` }],
    };
  },
  component: DesafiosPage,
});
