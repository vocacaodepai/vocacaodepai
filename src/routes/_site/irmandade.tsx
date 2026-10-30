import { createFileRoute } from "@tanstack/react-router";
import IrmandadePage from "@/pages/irmandade/IrmandadePage";
import { getIrmandadeHubData } from "@/lib/community.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { IRMANDADE_POSICIONAMENTO } from "@/content/irmandade/codigo-de-conduta";

// /irmandade (doc 09 §0): hub da comunidade + código de conduta.
export const Route = createFileRoute("/_site/irmandade")({
  loader: () => getIrmandadeHubData(),
  head: () => {
    const title = `Irmandade | ${SITE_NAME}`;
    return {
      meta: [
        { title },
        { name: "description", content: IRMANDADE_POSICIONAMENTO },
        { property: "og:title", content: title },
        { property: "og:description", content: IRMANDADE_POSICIONAMENTO },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `${SITE_URL}/irmandade` },
      ],
      links: [{ rel: "canonical", href: `${SITE_URL}/irmandade` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbJsonLd([{ name: "Irmandade", path: "/irmandade" }])),
        },
      ],
    };
  },
  component: IrmandadePage,
});
