import { createFileRoute } from "@tanstack/react-router";
import ReferralsPage from "@/pages/pai-indica-pai/ReferralsPage";
import { listReferrals } from "@/lib/pai-indica-pai/functions";
import { referralsSearchSchema } from "@/lib/pai-indica-pai/schemas";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Indicações de confiança | Pai Indica Pai | ${SITE_NAME}`;
const DESCRIPTION =
  "Profissional, serviço ou empresa indicados por pais que já usaram e aprovaram. Filtre por tipo, cidade e UF.";

export const Route = createFileRoute("/_site/pai-indica-pai/indicacoes/")({
  validateSearch: (s: Record<string, unknown>) => referralsSearchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listReferrals({ data: deps }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pai-indica-pai/indicacoes` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pai-indica-pai/indicacoes` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Pai Indica Pai", path: "/pai-indica-pai" },
            { name: "Indicações", path: "/pai-indica-pai/indicacoes" },
          ]),
        ),
      },
    ],
  }),
  component: ReferralsPage,
});
