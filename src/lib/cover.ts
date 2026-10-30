// Capas de "review-de-mae" antigas são fotos soltas de produto (fundo branco):
// mostrar inteiras, sem cortar. As capas compostas (/images/covers/) já saem em
// 16:9 e as demais categorias usam foto de ambiente; essas preenchem o quadro.
export function isProductCover(post: {
  cover_image_url?: string | null;
  category?: { slug?: string | null } | null;
}): boolean {
  if (post.cover_image_url?.startsWith("/images/covers/")) return false;
  return post.category?.slug === "review-de-mae";
}
