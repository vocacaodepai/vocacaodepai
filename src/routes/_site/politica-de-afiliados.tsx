import { createFileRoute } from "@tanstack/react-router";
import AffiliatePolicy from "@/pages/AffiliatePolicy";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `Política de afiliados | ${SITE_NAME}`;
const DESCRIPTION =
  "Como o Vocação de Pai ganha com links de afiliado da Amazon, por que a comissão não muda o preço nem a nota, e o que significa a faixa de preço pesquisada.";

export const Route = createFileRoute("/_site/politica-de-afiliados")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/politica-de-afiliados` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/politica-de-afiliados` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Política de afiliados", path: "/politica-de-afiliados" }]),
        ),
      },
    ],
  }),
  component: AffiliatePolicy,
});
