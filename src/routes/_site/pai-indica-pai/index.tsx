import { createFileRoute } from "@tanstack/react-router";
import PipHubPage from "@/pages/pai-indica-pai/PipHubPage";
import { getPipHubData } from "@/lib/pai-indica-pai/functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Pai Indica Pai | ${SITE_NAME}`;
const DESCRIPTION =
  "Um pai ajuda outro pai a sustentar a família: vagas, indicações, Pai Profissional e mentoria. Gratuito, moderado, sem intermediação.";

// Hub do Pai Indica Pai (doc 08 §3.1). `?alertas=cancelar&email=` vem do link de cancelamento do digest.
export const Route = createFileRoute("/_site/pai-indica-pai/")({
  validateSearch: (s: Record<string, unknown>): { alertas?: string; email?: string } => ({
    ...(typeof s["alertas"] === "string" ? { alertas: s["alertas"] as string } : {}),
    ...(typeof s["email"] === "string" ? { email: s["email"] as string } : {}),
  }),
  loader: () => getPipHubData(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pai-indica-pai` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pai-indica-pai` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([{ name: "Pai Indica Pai", path: "/pai-indica-pai" }]),
        ),
      },
    ],
  }),
  component: PipHubPage,
});
