import { createFileRoute } from "@tanstack/react-router";
import About from "@/pages/About";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `Sobre o Vocação de Pai | ${SITE_NAME}`;
const DESCRIPTION =
  "Manifesto do Vocação de Pai: no que acreditamos, o que você encontra aqui, o que prometemos e quem faz o site do pai e do homem de família.";

export const Route = createFileRoute("/_site/sobre")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/sobre` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/sobre` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Sobre o Vocação de Pai", path: "/sobre" }]),
        ),
      },
    ],
  }),
  component: About,
});
