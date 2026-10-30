import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";

export const Route = createFileRoute("/_site/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre n\u00f3s | Voca\u00e7\u00e3o de M\u00e3e" },
      {
        name: "description",
        content:
          "Conhe\u00e7a a miss\u00e3o da Voca\u00e7\u00e3o de M\u00e3e e quem escreve nossos conte\u00fados.",
      },
      { property: "og:title", content: "Sobre n\u00f3s | Voca\u00e7\u00e3o de M\u00e3e" },
      {
        property: "og:description",
        content:
          "Conhe\u00e7a a miss\u00e3o da Voca\u00e7\u00e3o de M\u00e3e e quem escreve nossos conte\u00fados.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://vocacaodepai.com.br/sobre" },
    ],
    links: [{ rel: "canonical", href: "https://vocacaodepai.com.br/sobre" }],
  }),
  component: About,
});
