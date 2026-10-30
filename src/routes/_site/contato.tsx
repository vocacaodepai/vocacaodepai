import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/Contact";

export const Route = createFileRoute("/_site/contato")({
  head: () => ({
    meta: [
      { title: "Contato | Voca\u00e7\u00e3o de M\u00e3e" },
      {
        name: "description",
        content:
          "Fale com a equipe da Voca\u00e7\u00e3o de M\u00e3e: d\u00favidas, parcerias e sugest\u00f5es.",
      },
      { property: "og:title", content: "Contato | Voca\u00e7\u00e3o de M\u00e3e" },
      {
        property: "og:description",
        content:
          "Fale com a equipe da Voca\u00e7\u00e3o de M\u00e3e: d\u00favidas, parcerias e sugest\u00f5es.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://vocacaodepai.com.br/contato" },
    ],
    links: [{ rel: "canonical", href: "https://vocacaodepai.com.br/contato" }],
  }),
  component: Contact,
});
