import { createFileRoute } from "@tanstack/react-router";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = `Política de privacidade | ${SITE_NAME}`;
const DESCRIPTION =
  "Como o Vocação de Pai coleta, usa e protege os seus dados (LGPD): cookies, GA4, AdSense, newsletter, Área do Pai e seus direitos como titular.";

export const Route = createFileRoute("/_site/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/politica-de-privacidade` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/politica-de-privacidade` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Política de privacidade", path: "/politica-de-privacidade" }]),
        ),
      },
    ],
  }),
  component: PrivacyPolicy,
});
