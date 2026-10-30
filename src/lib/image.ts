// Client-side image optimization: downscale + WebP compression via canvas,
// returning a data URL ready for the upload-image backend function.

export async function compressToWebP(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas não suportado");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/webp", quality);
}

/**
 * Gera uma miniatura (355px de altura) a partir da URL grande da Amazon.
 * Os cards baixam a imagem em 355px em vez de 1500px — muito mais leve.
 * Retorna a URL original se o padrão não casar (fallback seguro).
 */
export function productImageThumb(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(/\._AC_SL\d+_\./, "._AC_SY355_.");
}
