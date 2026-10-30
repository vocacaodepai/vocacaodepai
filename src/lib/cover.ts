// Capas de review/comparativo/lista do Pai Indica costumam ser a foto oficial
// do produto (fundo branco, m.media-amazon.com): mostrar inteiras, sem cortar.
// As capas compostas (/images/covers/) já saem em 16:9 e os artigos usam foto
// de ambiente; essas preenchem o quadro.
const PRODUCT_KINDS = new Set(["review", "comparativo", "lista"]);

export function isProductCover(post: {
  cover_image_url?: string | null;
  kind?: string | null;
  category?: { slug?: string | null } | null;
}): boolean {
  const url = post.cover_image_url ?? "";
  if (url.startsWith("/images/covers/")) return false;
  if (url.includes("media-amazon.com")) return true;
  return PRODUCT_KINDS.has(post.kind ?? "") || post.category?.slug === "pai-indica";
}
