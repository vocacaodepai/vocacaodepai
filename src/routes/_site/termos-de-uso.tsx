import { createFileRoute } from "@tanstack/react-router";
import TermsOfUse from "@/pages/TermsOfUse";

export const Route = createFileRoute("/_site/termos-de-uso")({
  head: () => ({
    meta: [
      { title: "Termos de uso | Voca\u00e7\u00e3o de M\u00e3e" },
      {
        name: "description",
        content:
          "Condi\u00e7\u00f5es de uso do site e dos conte\u00fados da Voca\u00e7\u00e3o de M\u00e3e.",
      },
      { property: "og:title", content: "Termos de uso | Voca\u00e7\u00e3o de M\u00e3e" },
      {
        property: "og:description",
        content:
          "Condi\u00e7\u00f5es de uso do site e dos conte\u00fados da Voca\u00e7\u00e3o de M\u00e3e.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://vocacaodepai.com.br/termos-de-uso" },
    ],
    links: [{ rel: "canonical", href: "https://vocacaodepai.com.br/termos-de-uso" }],
  }),
  component: TermsOfUse,
});
