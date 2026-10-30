import { createFileRoute } from "@tanstack/react-router";
import PerguntasPage from "@/pages/irmandade/PerguntasPage";
import { getQuestionsData } from "@/lib/community.functions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/perguntas/")({
  loader: () => getQuestionsData({ data: {} }),
  head: () => {
    const title = `Perguntas da Irmandade | ${SITE_NAME}`;
    const description =
      "Pergunta prática de pai, respondida por quem já passou por aquilo. Votos, melhor resposta e moderação.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/perguntas` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/perguntas` }],
    };
  },
  component: PerguntasPage,
});
