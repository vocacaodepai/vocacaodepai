import { createFileRoute } from "@tanstack/react-router";
import ProfessionalsPage from "@/pages/pai-indica-pai/ProfessionalsPage";
import { listProfessionals } from "@/lib/pai-indica-pai/functions";
import { professionalsSearchSchema } from "@/lib/pai-indica-pai/schemas";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Pai Profissional — diretório de pais que fazem bem o que fazem | ${SITE_NAME}`;
const DESCRIPTION =
  "Eletricista, contador, pedreiro, desenvolvedor: pais profissionais indicados pela rede Pai Indica Pai. Busque por profissão, cidade e UF.";

export const Route = createFileRoute("/_site/pai-indica-pai/profissionais/")({
  validateSearch: (s: Record<string, unknown>) => professionalsSearchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => listProfessionals({ data: deps }),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/pai-indica-pai/profissionais` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pai-indica-pai/profissionais` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbJsonLd([
            { name: "Pai Indica Pai", path: "/pai-indica-pai" },
            { name: "Pai Profissional", path: "/pai-indica-pai/profissionais" },
          ]),
        ),
      },
    ],
  }),
  component: ProfessionalsPage,
});
