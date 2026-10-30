// Tipos do Pai Indica Mídia (doc 14 §2): tabela `media_reviews` (0017_pai_indica_midia.sql).
// Formato ÚNICO: chaves só em inglês, como em posts.review (CLAUDE.md §7).
import type { TipTapNode } from "@/lib/content";

export const MEDIA_TYPES = ["filme", "serie", "jogo", "app", "livro"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export function isMediaType(v: unknown): v is MediaType {
  return typeof v === "string" && (MEDIA_TYPES as readonly string[]).includes(v);
}

/** Faixas oficiais da Classificação Indicativa (MJSP). Livro não recebe ClassInd → `null`. */
export const CLASSIND_VALUES = ["L", "10", "12", "14", "16", "18"] as const;
export type ClassInd = (typeof CLASSIND_VALUES)[number];

export function isClassInd(v: unknown): v is ClassInd {
  return typeof v === "string" && (CLASSIND_VALUES as readonly string[]).includes(v);
}

/** As 10 categorias de conteúdo em bolinhas 0-5 (modelo Common Sense Media, doc 14 §2.3). Ordem fixa. */
export const CONTENT_KEYS = [
  "violencia",
  "sexo",
  "linguagem",
  "drogas",
  "consumismo",
  "medo",
  "valores_positivos",
  "modelos_positivos",
  "fe",
  "mensagem",
] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];
export type ContentScores = Record<ContentKey, number>;

export const MEDIA_STATUSES = ["draft", "published", "archived"] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

/** Linha de `media_reviews` como o site usa (subconjunto de card + ficha completa). */
export interface MediaReview {
  id: string;
  slug: string;
  title: string;
  original_title: string | null;
  type: MediaType;
  year: number | null;
  platforms: string[];
  classind: ClassInd | null;
  classind_descriptors: string[];
  pai_age_min: number;
  pai_age_note: string | null;
  score_quality: number;
  score_moral: number;
  content_scores: ContentScores;
  summary: string;
  body: TipTapNode | null;
  what_parents_need_to_know: string | null;
  talk_with_your_kids: string[];
  poster_url: string | null;
  poster_credit: string | null;
  poster_license: string | null;
  affiliate_url: string | null;
  status: MediaStatus;
  publish_at: string | null;
  author_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Colunas do card da listagem (sem body). */
export type MediaCardRow = Omit<
  MediaReview,
  "body" | "what_parents_need_to_know" | "talk_with_your_kids" | "author_id" | "created_at"
>;

export const emptyContentScores = (): ContentScores =>
  Object.fromEntries(CONTENT_KEYS.map((k) => [k, 0])) as ContentScores;
