import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";
import { getHomeData } from "@/lib/hub.functions";
import { websiteJsonLd } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/")({
  loader: () => getHomeData(),
  head: () => ({
    meta: [
      { title: `${SITE_NAME} — ${SITE_TAGLINE}` },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: `${SITE_NAME} — ${SITE_TAGLINE}` },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: SITE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(websiteJsonLd()) }],
  }),
  component: Home,
});
