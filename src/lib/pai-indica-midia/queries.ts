// Consultas do Pai Indica Mídia (doc 14 §5): recebem o client (navegador ou read-only do servidor),
// como src/lib/pai-indica/queries.ts. Colunas de 0017_pai_indica_midia.sql (media_reviews).
import type { SupabaseClient } from "@supabase/supabase-js";
import { PUBLISHED, nowIso } from "@/lib/queries";
import { normalizeContentScores } from "./taxonomia";
import {
  isClassInd,
  isMediaType,
  type MediaCardRow,
  type MediaReview,
  type MediaType,
} from "./types";

export type DbClient = SupabaseClient;

export const MEDIA_CARD_SELECT =
  "id,slug,title,original_title,type,year,platforms,classind,classind_descriptors,pai_age_min,pai_age_note,score_quality,score_moral,content_scores,summary,poster_url,poster_credit,poster_license,affiliate_url,status,publish_at,updated_at,seo_title,seo_description";

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];

export function toMediaCard(row: Record<string, unknown>): MediaCardRow {
  return {
    ...(row as unknown as MediaCardRow),
    type: isMediaType(row["type"]) ? row["type"] : "filme",
    platforms: strArray(row["platforms"]),
    classind: isClassInd(row["classind"]) ? row["classind"] : null,
    classind_descriptors: strArray(row["classind_descriptors"]),
    pai_age_min: Number(row["pai_age_min"] ?? 0),
    score_quality: Number(row["score_quality"] ?? 0),
    score_moral: Number(row["score_moral"] ?? 0),
    content_scores: normalizeContentScores(row["content_scores"]),
    summary: String(row["summary"] ?? ""),
  };
}

export function toMedia(row: Record<string, unknown>): MediaReview {
  return {
    ...(row as unknown as MediaReview),
    ...toMediaCard(row),
    body: (row["body"] as MediaReview["body"]) ?? null,
    talk_with_your_kids: strArray(row["talk_with_your_kids"]),
  };
}

export interface MediaListOpts {
  type?: MediaType;
  limit?: number;
  excludeId?: string;
}

/** Fichas publicadas (sem paginação: até 500, como /pai-indica). */
export async function queryMediaList(
  db: DbClient,
  opts: MediaListOpts = {},
): Promise<MediaCardRow[]> {
  let q = db
    .from("media_reviews")
    .select(MEDIA_CARD_SELECT)
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso());
  if (opts.type) q = q.eq("type", opts.type);
  if (opts.excludeId) q = q.neq("id", opts.excludeId);
  const { data, error } = await q
    .order("publish_at", { ascending: false })
    .limit(opts.limit ?? 500);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toMediaCard);
}

export async function queryMediaBySlug(db: DbClient, slug: string): Promise<MediaReview | null> {
  const { data, error } = await db
    .from("media_reviews")
    .select("*")
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso())
    .maybeSingle();
  if (error) throw error;
  return data ? toMedia(data as Record<string, unknown>) : null;
}

/** "Veja também": 3 do mesmo tipo + 3 de outros tipos. */
export async function queryRelatedMedia(
  db: DbClient,
  media: { id: string; type: MediaType },
): Promise<MediaCardRow[]> {
  const same = await queryMediaList(db, { type: media.type, excludeId: media.id, limit: 3 });
  const others = await queryMediaList(db, { excludeId: media.id, limit: 12 });
  const seen = new Set(same.map((m) => m.id));
  const rest = others.filter((m) => !seen.has(m.id) && m.type !== media.type);
  return [...same, ...rest.slice(0, 3)];
}
