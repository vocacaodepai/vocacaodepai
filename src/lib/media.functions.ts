import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Bucket público `covers` (doc 02 §4.1; policy "covers: staff write").
const BUCKET = "covers";
const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = /^data:(image\/(webp|png|jpeg));base64,(.+)$/;

const STAFF_FOLDERS = new Set(["covers", "inline"]);

// `public.is_admin()` = profiles.role in ('editor','admin') (doc 03 §3.1).
async function isStaff(supabase: {
  rpc: (fn: string) => Promise<{ data: unknown; error: unknown }>;
}) {
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

const uploadSchema = z.object({
  dataUrl: z.string(),
  folder: z.enum(["covers", "inline", "stories", "avatars"]).default("inline"),
});

export const uploadImageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => uploadSchema.parse(data))
  .handler(async ({ data, context }) => {
    if (STAFF_FOLDERS.has(data.folder) && !(await isStaff(context.supabase as never))) {
      throw new Error("acesso restrito à equipe editorial");
    }

    const match = data.dataUrl.match(ALLOWED);
    if (!match) throw new Error("formato não suportado (use webp, png ou jpeg)");

    const mime = match[1]!;
    const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
    const bytes = Uint8Array.from(atob(match[3]!), (c) => c.charCodeAt(0));
    if (bytes.byteLength > MAX_BYTES) throw new Error("imagem muito grande (máx. 4MB)");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${data.folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: mime });
    if (error) throw new Error(error.message);

    // Bucket público: a URL da CDN do Supabase vai direto para `cover_image_url`.
    const pub = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.data.publicUrl };
  });

const searchSchema = z.object({
  query: z.string().min(1),
  per_page: z.number().int().min(1).max(30).default(12),
  orientation: z.enum(["landscape", "portrait", "square"]).default("landscape"),
});

export interface PexelsResult {
  id: number | string;
  alt: string;
  photographer: string;
  page_url: string;
  url: string;
  thumb: string;
  width: number;
  height: number;
  license?: string;
}

// Both pexelsSearchFn and googleImageSearchFn call the "stock-photos" edge
// function instead of hitting the provider API directly: that function is
// the single place that reads the API keys from Supabase Vault, so there is
// only one location to configure per environment (see CLAUDE.md).
async function searchStockPhotos(
  supabase: {
    functions: {
      invoke: (
        name: string,
        opts: { body: Record<string, unknown> },
      ) => Promise<{ data: unknown; error: unknown }>;
    };
  },
  source: "pexels" | "wikimedia" | "google",
  data: { query: string; per_page: number },
): Promise<{ success: boolean; photos: PexelsResult[]; message?: string }> {
  const { data: payload, error } = await supabase.functions.invoke("stock-photos", {
    body: { source, query: data.query.trim(), perPage: data.per_page },
  });

  if (error) {
    return {
      success: false,
      photos: [],
      message: "Falha ao consultar o banco de imagens. Tente novamente.",
    };
  }

  const raw = payload as {
    error?: string;
    results?: Array<{
      id: number | string;
      url: string;
      width: number;
      height: number;
      alt: string;
      thumb?: string;
      photographer?: string;
      page_url?: string;
      license?: string;
    }>;
  };

  if (raw.error) {
    return { success: false, photos: [], message: raw.error };
  }

  const photos: PexelsResult[] = (raw.results ?? []).map((r) => ({
    id: r.id,
    alt: r.alt || "Foto gratuita",
    photographer: r.photographer || "",
    page_url: r.page_url || r.url,
    url: r.url,
    thumb: r.thumb || r.url,
    width: r.width,
    height: r.height,
    license: r.license,
  }));

  return { success: true, photos };
}

export const pexelsSearchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ success: boolean; photos: PexelsResult[]; message?: string }> => {
      if (!(await isStaff(context.supabase as never))) {
        return { success: false, photos: [], message: "Acesso restrito à equipe editorial." };
      }
      return searchStockPhotos(context.supabase, "pexels", data);
    },
  );

// Wikimedia Commons: API pública, sem chave, e devolve a licença real de
// cada arquivo (não um filtro de busca como o do Google). Prioridade atual
// de fonte para fotos reais (ver CLAUDE.md).
export const wikimediaSearchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ success: boolean; photos: PexelsResult[]; message?: string }> => {
      if (!(await isStaff(context.supabase as never))) {
        return { success: false, photos: [], message: "Acesso restrito à equipe editorial." };
      }
      return searchStockPhotos(context.supabase, "wikimedia", data);
    },
  );

// Busca no Google (Custom Search), restrita no servidor a imagens com
// direitos de reuso documentados (domínio público ou CC). Usar para o que
// Pexels/Pixabay não cobrem: figuras públicas, produtos de marca específicos
// etc. Sempre confira a página de origem (page_url) antes de publicar.
export const googleImageSearchFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ success: boolean; photos: PexelsResult[]; message?: string }> => {
      if (!(await isStaff(context.supabase as never))) {
        return { success: false, photos: [], message: "Acesso restrito à equipe editorial." };
      }
      return searchStockPhotos(context.supabase, "google", data);
    },
  );
