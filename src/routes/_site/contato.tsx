import { createFileRoute } from "@tanstack/react-router";
import Contact from "@/pages/Contact";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `Contato | ${SITE_NAME}`;
const DESCRIPTION =
  "Fale com o Vocação de Pai: dúvidas, sugestões de pauta, correções e parcerias. Respondemos por e-mail.";

export const Route = createFileRoute("/_site/contato")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/contato` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/contato` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(breadcrumbJsonLd([{ name: "Contato", path: "/contato" }])),
      },
    ],
  }),
  component: Contact,
});
