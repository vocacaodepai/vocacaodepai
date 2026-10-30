import { createFileRoute } from "@tanstack/react-router";
import MentorshipPage from "@/pages/pai-indica-pai/MentorshipPage";
import { listMentors } from "@/lib/pai-indica-pai/functions";
import { mentorsSearchSchema } from "@/lib/pai-indica-pai/schemas";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Mentoria de pai para pai | Pai Indica Pai | ${SITE_NAME}`;
const DESCRIPTION =
  "Pai experiente orienta pai iniciante em carreira, negócio, finanças da família, fé, casamento e ofício. De graça, com moderação.";

export const Route = createFileRoute("/_site/pai-indica-pai/mentoria/")({
  validateSearch: (s: Record<string, unknown>) => mentorsSearchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listMentors({ data: deps }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pai-indica-pai/mentoria` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pai-indica-pai/mentoria` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Pai Indica Pai", path: "/pai-indica-pai" },
            { name: "Mentoria", path: "/pai-indica-pai/mentoria" },
          ]),
        ),
      },
    ],
  }),
  component: MentorshipPage,
});
