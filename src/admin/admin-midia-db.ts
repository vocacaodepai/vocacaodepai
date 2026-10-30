/**
 * Acesso a dados do admin do Pai Indica Mídia (doc 14 §6).
 *
 * Mesmo padrão de admin-db.ts / admin-products-db.ts: cliente Supabase do navegador com a
 * sessão do editor/admin; o RLS da 0017_pai_indica_midia.sql (`public.is_admin()`) garante que só a
 * equipe lê rascunhos e grava. Nunca `delete`: ficha sai do ar com `status = 'archived'`.
 */
import { supabase } from "@/integrations/supabase/client";
import type { TipTapNode } from "@/lib/content";
import { toMedia } from "@/lib/pai-indica-midia/queries";
import { CONTENT_MAX, normalizeContentScores } from "@/lib/pai-indica-midia/taxonomia";
import {
  CONTENT_KEYS,
  MEDIA_STATUSES,
  MEDIA_TYPES,
  emptyContentScores,
  isClassInd,
  type MediaReview,
} from "@/lib/pai-indica-midia/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Campos gravados pelo formulário (o restante é calculado por default/trigger). */
export type AdminMediaInput = Omit<MediaReview, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

export const LIST_SELECT =
  "id,slug,title,type,year,classind,pai_age_min,score_quality,score_moral,status,publish_at,updated_at,poster_url";

export interface AdminMediaRow {
  id: string;
  slug: string;
  title: string;
  type: MediaReview["type"];
  year: number | null;
  classind: MediaReview["classind"];
  pai_age_min: number;
  score_quality: number;
  score_moral: number;
  status: MediaReview["status"];
  publish_at: string | null;
  updated_at: string;
  poster_url: string | null;
}

export async function fetchAdminMedia(): Promise<AdminMediaRow[]> {
  const { data, error } = await db
    .from("media_reviews")
    .select(LIST_SELECT)
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as AdminMediaRow[];
}

export async function fetchAdminMediaById(id: string): Promise<MediaReview | null> {
  const { data, error } = await db.from("media_reviews").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toMedia(data as Record<string, unknown>) : null;
}

export async function fetchMediaSlugs(): Promise<string[]> {
  const { data, error } = await db.from("media_reviews").select("slug");
  if (error) throw error;
  return ((data ?? []) as { slug: string }[]).map((r) => r.slug);
}

export function emptyMedia(): AdminMediaInput {
  return {
    slug: "",
    title: "",
    original_title: null,
    type: "filme",
    year: null,
    platforms: [],
    classind: "L",
    classind_descriptors: [],
    pai_age_min: 0,
    pai_age_note: null,
    score_quality: 7,
    score_moral: 1,
    content_scores: emptyContentScores(),
    summary: "",
    body: { type: "doc", content: [] },
    what_parents_need_to_know: null,
    talk_with_your_kids: [],
    poster_url: null,
    poster_credit: null,
    poster_license: null,
    affiliate_url: null,
    status: "draft",
    publish_at: null,
    author_id: null,
    seo_title: null,
    seo_description: null,
  };
}

/** Texto simples (um parágrafo por linha em branco) → documento Tiptap. Para o admin sem editor. */
export function paragraphsToDoc(text: string): TipTapNode {
  const blocks = text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    type: "doc",
    content: blocks.map((t) =>
      /^##\s+/.test(t)
        ? {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: t.replace(/^##\s+/, "") }],
          }
        : { type: "paragraph", content: [{ type: "text", text: t }] },
    ),
  };
}

const AMAZON_RE = /^https:\/\/(www\.)?amazon\.com\.br\//;
const WIKIMEDIA_RE = /^https:\/\/upload\.wikimedia\.org\//;

/** Validação do cliente (as mesmas regras do validador, doc 14 §8). */
export function validateMediaInput(m: AdminMediaInput): string[] {
  const errors: string[] = [];
  if (!m.title.trim()) errors.push("Título obrigatório.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.slug))
    errors.push("Slug em kebab-case (a-z, 0-9, hífen).");
  if (!(MEDIA_TYPES as readonly string[]).includes(m.type)) errors.push("Tipo inválido.");
  if (!(MEDIA_STATUSES as readonly string[]).includes(m.status)) errors.push("Status inválido.");
  if (m.year != null && (m.year < 1900 || m.year > new Date().getFullYear() + 1))
    errors.push("Ano fora do intervalo.");
  if (m.type === "livro") {
    if (m.classind) errors.push("Livro não recebe ClassInd: deixe vazio.");
  } else if (!isClassInd(m.classind)) {
    errors.push("ClassInd obrigatório (L, 10, 12, 14, 16 ou 18) para filme, série, jogo e app.");
  }
  if (!Number.isInteger(m.pai_age_min) || m.pai_age_min < 0 || m.pai_age_min > 18)
    errors.push("Idade do pai: inteiro entre 0 (livre) e 18.");
  if (m.score_quality < 0 || m.score_quality > 10) errors.push("Qualidade entre 0 e 10.");
  if (!Number.isInteger(m.score_moral) || m.score_moral < -4 || m.score_moral > 4)
    errors.push("Nota moral: inteiro entre -4 e +4.");
  for (const k of CONTENT_KEYS) {
    const v = m.content_scores[k];
    if (!Number.isInteger(v) || v < 0 || v > CONTENT_MAX)
      errors.push(`Categoria "${k}" precisa de inteiro entre 0 e ${CONTENT_MAX}.`);
  }
  if (m.summary.trim().length < 40 || m.summary.length > 300)
    errors.push("Resumo entre 40 e 300 caracteres.");
  if (m.status === "published") {
    if (!m.what_parents_need_to_know?.trim())
      errors.push('"O que o pai precisa saber" é obrigatório para publicar.');
    if (m.talk_with_your_kids.length < 3 || m.talk_with_your_kids.length > 5)
      errors.push('"Para conversar com seu filho": de 3 a 5 perguntas.');
    if (!m.body || !Array.isArray(m.body.content) || m.body.content.length === 0)
      errors.push("Análise (body) vazia.");
  }
  if (m.poster_url && !WIKIMEDIA_RE.test(m.poster_url))
    errors.push("Pôster só de upload.wikimedia.org (CC/PD) ou vazio (cartão tipográfico).");
  if (m.poster_url && !m.poster_credit) errors.push("Pôster exige crédito (autor/fonte).");
  if (m.affiliate_url) {
    if (!(m.type === "livro" || m.type === "jogo"))
      errors.push("Link de afiliado só para livro ou jogo.");
    else if (!AMAZON_RE.test(m.affiliate_url))
      errors.push("Link de afiliado precisa ser da amazon.com.br.");
  }
  if ((m.seo_title ?? "").length > 60) errors.push("seo_title: até 60 caracteres.");
  if ((m.seo_description ?? "").length > 155) errors.push("seo_description: até 155 caracteres.");
  const blob = JSON.stringify([
    m.summary,
    m.what_parents_need_to_know,
    m.talk_with_your_kids,
    m.body,
  ]);
  if (/R\$\s?\d/.test(blob)) errors.push('Nunca "R$" no texto (sem preço exato).');
  return errors;
}

/** Insere ou atualiza (upsert por id). Devolve a linha gravada. */
export async function upsertAdminMedia(input: AdminMediaInput): Promise<MediaReview> {
  const payload: Record<string, unknown> = {
    ...input,
    content_scores: normalizeContentScores(input.content_scores),
    classind: input.type === "livro" ? null : input.classind,
    publish_at:
      input.status === "published"
        ? (input.publish_at ?? new Date().toISOString())
        : input.publish_at,
  };
  if (!payload["id"]) delete payload["id"];
  const { data, error } = await db
    .from("media_reviews")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return toMedia(data as Record<string, unknown>);
}

export async function setAdminMediaStatus(id: string, status: MediaReview["status"]) {
  const patch: Record<string, unknown> = { status };
  if (status === "published") patch["publish_at"] = new Date().toISOString();
  const { error } = await db.from("media_reviews").update(patch).eq("id", id);
  if (error) throw error;
}
