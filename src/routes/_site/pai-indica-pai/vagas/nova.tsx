import { createFileRoute } from "@tanstack/react-router";
import NewJobPage from "@/pages/pai-indica-pai/NewJobPage";
import { SITE_NAME } from "@/lib/site";

// Formulário de vaga (doc 08 §3.4): noindex, exige login (porta na própria página).
export const Route = createFileRoute("/_site/pai-indica-pai/vagas/nova")({
  head: () => ({
    meta: [
      { title: `Publicar vaga | Pai Indica Pai | ${SITE_NAME}` },
      {
        name: "description",
        content: "Publique uma vaga de trabalho para outros pais. Gratuito, com moderação.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewJobPage,
});
