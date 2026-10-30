import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

export const Route = createFileRoute("/_site/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Pol\u00edtica de privacidade | Voca\u00e7\u00e3o de M\u00e3e" },
      {
        name: "description",
        content:
          "Como coletamos, usamos e protegemos os seus dados na Voca\u00e7\u00e3o de M\u00e3e.",
      },
      {
        property: "og:title",
        content: "Pol\u00edtica de privacidade | Voca\u00e7\u00e3o de M\u00e3e",
      },
      {
        property: "og:description",
        content:
          "Como coletamos, usamos e protegemos os seus dados na Voca\u00e7\u00e3o de M\u00e3e.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://vocacaodepai.com.br/politica-de-privacidade" },
    ],
    links: [{ rel: "canonical", href: "https://vocacaodepai.com.br/politica-de-privacidade" }],
  }),
  component: PrivacyPolicy,
});
