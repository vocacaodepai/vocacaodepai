import { createFileRoute } from "@tanstack/react-router";
import Home from "@/pages/Home";
import { getHomeData } from "@/lib/hub.functions";
import { getHomeExtras } from "@/lib/home.functions";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_OG_IMAGE, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const Route = createFileRoute("/_site/")({
  loader: async () => {
    const [base, extras] = await Promise.all([getHomeData(), getHomeExtras()]);
    return { ...base, ...extras };
  },
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([websiteJsonLd(), organizationJsonLd()]),
      },
    ],
  }),
  component: Home,
});
