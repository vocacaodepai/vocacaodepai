import { createServerFn } from "@tanstack/react-start";
import { createReadOnlySupabaseClient } from "./seo.functions";
import type { PostWire } from "./queries";
import { queryMediaBySlug, queryMediaList, queryRelatedMedia } from "./pai-indica-midia/queries";
import { isMediaType, type MediaCardRow } from "./pai-indica-midia/types";

// Server functions do Pai Indica Mídia (doc 14 §5): listagem sem paginação, ficha por slug e
// "Veja também". Client read-only (chave publicável): só o que o RLS libera ao público.
// Backend fora do ar (placeholder) → lista vazia / null: a página renderiza o estado vazio.

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

export const getMediaList = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaCardRow[]> => {
    const db = await createReadOnlySupabaseClient();
    return safe(queryMediaList(db), [] as MediaCardRow[]);
  },
);

export const getMediaBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data?.slug ?? "") }))
  // O body (Tiptap, attrs livres) viaja como JSON genérico (PostWire), como getPostFull;
  // a rota converte de volta para MediaReview.
  .handler(async ({ data }): Promise<PostWire | null> => {
    if (!/^[a-z0-9-]{3,120}$/.test(data.slug)) return null;
    const db = await createReadOnlySupabaseClient();
    const media = await safe(queryMediaBySlug(db, data.slug), null);
    return media ? (media as unknown as PostWire) : null;
  });

export const getRelatedMedia = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string; type: string }) => ({
    id: String(data?.id ?? ""),
    type: isMediaType(data?.type) ? data.type : ("filme" as const),
  }))
  .handler(async ({ data }): Promise<MediaCardRow[]> => {
    if (!data.id) return [];
    const db = await createReadOnlySupabaseClient();
    return safe(queryRelatedMedia(db, data), [] as MediaCardRow[]);
  });
