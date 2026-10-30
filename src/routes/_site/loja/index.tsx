import { createFileRoute } from "@tanstack/react-router";
import StorePage from "@/pages/StorePage";
import { getStoreData } from "@/lib/loja/loja.functions";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = `Loja do Pai | ${SITE_NAME}`;
const DESCRIPTION =
  "O pai também quer desconto: produtos para churrasco, ferramentas, carro, tecnologia e paternidade, com review honesta e faixa de preço pesquisada.";

// /loja (doc 05 §4.5): catálogo inteiro no loader (SSR); filtros ?categoria=/
// ?subcategoria=/?q= só no navegador. A canonical é autorreferente com os
// filtros de categoria/subcategoria (não há página própria para consolidar).
export const Route = createFileRoute("/_site/loja/")({
  loader: () => getStoreData(),
  head: (ctx) => {
    const search = (ctx.match.search ?? {}) as Record<string, string | undefined>;
    const filterQuery = new URLSearchParams();
    if (search["categoria"]) filterQuery.set("categoria", search["categoria"]);
    if (search["subcategoria"]) filterQuery.set("subcategoria", search["subcategoria"]);
    const url = filterQuery.toString() ? `${SITE_URL}/loja?${filterQuery}` : `${SITE_URL}/loja`;
    return {
      meta: [
        { title: TITLE },
        { name: "description", content: DESCRIPTION },
        { property: "og:title", content: TITLE },
        { property: "og:description", content: DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: SITE_OG_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(breadcrumbJsonLd([{ name: "Loja do Pai", path: "/loja" }])),
        },
      ],
    };
  },
  component: StorePage,
});
