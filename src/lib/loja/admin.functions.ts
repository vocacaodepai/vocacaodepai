import { createServerFn } from "@tanstack/react-start";

// Server fns do admin de produtos (doc 05 §7.2/§7.3). Só conferência de URL de
// imagem (HEAD 200, content-type de imagem, > 15 KB) — o navegador não consegue
// fazer HEAD em m.media-amazon.com por CORS. A escrita no banco é feita pelo
// cliente autenticado (src/admin/admin-products-db.ts), e o RLS garante que só
// admin grava.

export interface ImageCheck {
  url: string;
  ok: boolean;
  status: number;
  bytes: number | null;
  contentType: string | null;
  reason: string | null;
}

const MIN_BYTES = 15 * 1024;

async function headImage(url: string): Promise<ImageCheck> {
  const base: ImageCheck = {
    url,
    ok: false,
    status: 0,
    bytes: null,
    contentType: null,
    reason: null,
  };
  if (!/^https:\/\/m\.media-amazon\.com\//i.test(url)) {
    return { ...base, reason: "só foto oficial da Amazon (m.media-amazon.com)" };
  }
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    const contentType = r.headers.get("content-type");
    const len = Number(r.headers.get("content-length") ?? "0");
    const bytes = Number.isFinite(len) && len > 0 ? len : null;
    if (!r.ok) return { ...base, status: r.status, reason: `HTTP ${r.status}` };
    if (!contentType || !contentType.startsWith("image/")) {
      return { ...base, status: r.status, contentType, bytes, reason: "não é imagem" };
    }
    if (bytes != null && bytes < MIN_BYTES) {
      return { ...base, status: r.status, contentType, bytes, reason: "menor que 15 KB" };
    }
    return { ...base, ok: true, status: r.status, contentType, bytes };
  } catch (error) {
    return { ...base, reason: error instanceof Error ? error.message : "falha de rede" };
  }
}

/** Confere até 8 URLs de foto oficial (HEAD 200, image/*, > 15 KB). */
export const checkImageUrls = createServerFn({ method: "POST" })
  .inputValidator((d: { urls: string[] }) => ({
    urls: Array.isArray(d.urls)
      ? d.urls
          .map(String)
          .map((u) => u.trim())
          .filter(Boolean)
          .slice(0, 8)
      : [],
  }))
  .handler(async ({ data }): Promise<ImageCheck[]> => Promise.all(data.urls.map(headImage)));
