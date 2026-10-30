// Consultas de leitura da Irmandade (anon/SSR ou client), doc 09 §3.1, §4.2 e §8.
// Escrita fica nas server functions (community.functions.ts) e nas RPCs security definer.
import type { DbClient } from "@/lib/queries";
import type { AnswerRow, EventRow, QuestionRow, StoryRow } from "@/lib/irmandade/types";

export const STORY_SELECT =
  "id,user_id,author_name,title,category,content,photo_url,status,like_count,created_at,updated_at";

export const QUESTION_SELECT =
  "id,slug,title,body,category_id,status,answers_count,accepted_answer_id,views,tags,last_answer_at,created_at,user_id,categories(id,name,slug,color),author:irmandade_members(display_name,avatar_url)";

export const ANSWER_SELECT =
  "id,question_id,body,like_count,status,created_at,user_id,author:irmandade_members(display_name,avatar_url)";

export const EVENT_SELECT =
  "id,slug,title,description,starts_at,ends_at,mode,kind,city,uf,address,url,cover_image_url,capacity,status,organizer,price_text,rsvp_count,created_at,updated_at";

export interface StoriesOpts {
  limit?: number;
  offset?: number;
  category?: string;
  since?: string | null;
  sort?: "recent" | "oldest" | "liked";
}

export async function queryStories(db: DbClient, o: StoriesOpts = {}): Promise<StoryRow[]> {
  let q = db.from("stories").select(STORY_SELECT).eq("status", "approved");
  if (o.category) q = q.eq("category", o.category);
  if (o.since) q = q.gte("created_at", o.since);
  q =
    o.sort === "oldest"
      ? q.order("created_at", { ascending: true })
      : o.sort === "liked"
        ? q.order("like_count", { ascending: false }).order("created_at", { ascending: false })
        : q.order("created_at", { ascending: false });
  const from = o.offset ?? 0;
  const { data, error } = await q.range(from, from + (o.limit ?? 24) - 1);
  if (error) throw error;
  return (data ?? []) as unknown as StoryRow[];
}

export async function queryStoryById(db: DbClient, id: string): Promise<StoryRow | null> {
  const { data, error } = await db.from("stories").select(STORY_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as StoryRow | null) ?? null;
}

export interface QuestionsOpts {
  category?: string;
  filter?: "sem-resposta" | "resolvidas";
  sort?: "recentes" | "respondidas";
  limit?: number;
  offset?: number;
}

export async function queryQuestions(db: DbClient, o: QuestionsOpts = {}): Promise<QuestionRow[]> {
  let q = db.from("questions").select(QUESTION_SELECT).in("status", ["approved", "closed"]);
  if (o.filter === "sem-resposta") q = q.eq("answers_count", 0);
  if (o.filter === "resolvidas") q = q.not("accepted_answer_id", "is", null);
  q =
    o.sort === "respondidas"
      ? q.order("answers_count", { ascending: false }).order("created_at", { ascending: false })
      : q.order("created_at", { ascending: false });
  const from = o.offset ?? 0;
  const { data, error } = await q.range(from, from + (o.limit ?? 30) - 1);
  if (error) throw error;
  const rows = (data ?? []) as unknown as QuestionRow[];
  // Filtro por slug da categoria no cliente (o join aninhado não filtra a linha-mãe).
  return o.category ? rows.filter((r) => r.categories?.slug === o.category) : rows;
}

export async function queryQuestionBySlug(
  db: DbClient,
  slug: string,
): Promise<{ question: QuestionRow; answers: AnswerRow[] } | null> {
  const { data: q, error } = await db
    .from("questions")
    .select(QUESTION_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!q) return null;
  const question = q as unknown as QuestionRow;
  const { data: answers } = await db
    .from("answers")
    .select(ANSWER_SELECT)
    .eq("question_id", question.id)
    .eq("status", "approved")
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: true });
  return { question, answers: (answers ?? []) as unknown as AnswerRow[] };
}

export async function queryEvents(
  db: DbClient,
  o: { when?: "proximos" | "passados"; limit?: number } = {},
): Promise<EventRow[]> {
  const nowIso = new Date().toISOString();
  let q = db.from("events").select(EVENT_SELECT);
  q =
    o.when === "passados"
      ? q
          .or(`status.eq.done,and(status.eq.published,starts_at.lt.${nowIso})`)
          .order("starts_at", { ascending: false })
      : q.eq("status", "published").gt("starts_at", nowIso).order("starts_at", { ascending: true });
  const { data, error } = await q.limit(o.limit ?? 50);
  if (error) throw error;
  return (data ?? []) as unknown as EventRow[];
}

export async function queryEventBySlug(db: DbClient, slug: string): Promise<EventRow | null> {
  const { data, error } = await db
    .from("events")
    .select(EVENT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as EventRow | null) ?? null;
}

/** Categorias de nível 1 do Blog para o select de /perguntas/nova e os chips de /perguntas. */
export async function queryQuestionCategories(db: DbClient) {
  const { data, error } = await db
    .from("categories")
    .select("id,name,slug,color")
    .is("parent_id", null)
    .lt("sort_order", 900)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as { id: string; name: string; slug: string; color: string | null }[];
}
