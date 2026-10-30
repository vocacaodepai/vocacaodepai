import { createFileRoute } from "@tanstack/react-router";
import NovaPerguntaPage from "@/pages/irmandade/NovaPerguntaPage";
import { SITE_NAME } from "@/lib/site";

export const Route = createFileRoute("/_site/perguntas/nova")({
  head: () => ({
    meta: [
      { title: `Faça uma pergunta | ${SITE_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NovaPerguntaPage,
});
