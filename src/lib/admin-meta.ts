/**
 * Cabeçalhos SEO compartilhados pelas páginas do painel admin.
 */
export function buildAdminHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} | Vocação de Pai` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} | Vocação de Pai` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
