import { createFileRoute } from "@tanstack/react-router";
import NewReferralPage from "@/pages/pai-indica-pai/NewReferralPage";
import { SITE_NAME } from "@/lib/site";

// Nova indicação (doc 08 §3.6): noindex, exige login (porta na própria página).
export const Route = createFileRoute("/_site/pai-indica-pai/indicacoes/nova")({
  head: () => ({
    meta: [
      { title: `Indicar profissional, serviço ou empresa | Pai Indica Pai | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Indique um profissional, serviço ou empresa de confiança para outros pais. Gratuito, com moderação.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewReferralPage,
});
