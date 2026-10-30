import { createFileRoute } from "@tanstack/react-router";
import FormacaoPage from "@/pages/formacao/FormacaoPage";
import { getFormacaoData } from "@/lib/tracks.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// /formacao (doc 09 §5): catálogo das 8 trilhas por pilar + desafios.
export const Route = createFileRoute("/_site/formacao/")({
  loader: () => getFormacaoData(),
  head: () => {
    const title = `Formação | ${SITE_NAME}`;
    const description =
      "Trilhas e desafios para crescer como pai, marido e homem de fé: passos no seu ritmo, insígnias e o Caderno do Pai.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/formacao` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/formacao` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbJsonLd([{ name: "Formação", path: "/formacao" }])),
        },
      ],
    };
  },
  component: FormacaoPage,
});
