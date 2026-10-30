import { createFileRoute } from "@tanstack/react-router";
import TermsOfUse from "@/pages/TermsOfUse";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `Termos de uso | ${SITE_NAME}`;
const DESCRIPTION =
  "Condições de uso do Vocação de Pai: natureza informativa do conteúdo, regras da comunidade, conta na Área do Pai e propriedade intelectual.";

export const Route = createFileRoute("/_site/termos-de-uso")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/termos-de-uso` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/termos-de-uso` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Termos de uso", path: "/termos-de-uso" }]),
        ),
      },
    ],
  }),
  component: TermsOfUse,
});
