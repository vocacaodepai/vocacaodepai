import { SITE_NAME, SITE_URL } from "@/lib/site";

// head() das rotas da Área do Pai: páginas privadas em noindex,nofollow (doc 07 §4.7);
// /entrar e /cadastro públicas com canonical (entram no sitemap).

export function privateHead(title: string, description?: string) {
  return {
    meta: [
      { title: `${title} | ${SITE_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
      ...(description ? [{ name: "description", content: description }] : []),
    ],
  };
}

export function publicAuthHead(title: string, description: string, path: string) {
  return {
    meta: [
      { title: `${title} | ${SITE_NAME}` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | ${SITE_NAME}` },
      { property: "og:description", content: description },
      { property: "og:url", content: `${SITE_URL}${path}` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}${path}` }],
  };
}
