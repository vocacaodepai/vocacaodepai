// Server functions da Irmandade (doc 09 §3.3, §4, §8 e §10.1). Leitura anônima com o client
// read-only (RLS: só approved/published); escrita com a sessão do membro via requireSupabaseAuth
// (bearer anexado por attachSupabaseAuth) + RLS/RPC security definer + rateLimit + blacklist.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import type { DbClient } from "@/lib/queries";
import { rateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/slugify";
import {
  assertCleanText,
  ConteudoBloqueadoError,
  MENSAGEM_BLOQUEIO,
} from "@/lib/irmandade/blacklist";
import { STORY_CATEGORY_VALUES } from "@/lib/irmandade/story-categories";
import {
  queryEventBySlug,
  queryEvents,
  queryQuestionBySlug,
  queryQuestionCategories,
  queryQuestions,
  queryStories,
  queryStoryById,
} from "@/lib/db/irmandade";
import type { AnswerRow, EventRow, QuestionRow, RsvpStatus, StoryRow } from "@/lib/irmandade/types";

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

const asDb = (client: unknown) => client as DbClient;

function friendly(error: { message: string } | null, fallback: string): never {
  const m = error?.message ?? fallback;
  if (/row-level security|violates row-level/i.test(m)) {
    throw new Error("Confirme seu e-mail para publicar na Irmandade.");
  }
  throw new Error(m);
}

/* ---------- Hub ---------- */
export interface IrmandadeHubData {
  stories: StoryRow[];
  questions: QuestionRow[];
  events: EventRow[];
}
export const getIrmandadeHubData = createServerFn({ method: "GET" }).handler(
  async (): Promise<IrmandadeHubData> => {
    const db = await createReadOnlySupabaseClient();
    const [stories, questions, events] = await Promise.all([
      safe(queryStories(db, { limit: 3 }), [] as StoryRow[]),
      safe(queryQuestions(db, { filter: "sem-resposta", limit: 3 }), [] as QuestionRow[]),
      safe(queryEvents(db, { when: "proximos", limit: 2 }), [] as EventRow[]),
    ]);
    return { stories, questions, events };
  },
);

/* ---------- Histórias ---------- */
export const getStoriesData = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; sort?: string } | undefined) => ({
    category: d?.category ? String(d.category) : undefined,
    sort: (d?.sort === "oldest" || d?.sort === "liked" ? d.sort : "recent") as
      "recent" | "oldest" | "liked",
  }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    return {
      stories: await safe(
        queryStories(db, { limit: 48, category: data.category, sort: data.sort }),
        [] as StoryRow[],
      ),
    };
  });

export const getStoryData = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id ?? "") }))
  .handler(async ({ data }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.id)) return null;
    const db = await createReadOnlySupabaseClient();
    const story = await safe(queryStoryById(db, data.id), null);
    if (!story) return null;
    const others = (
      await safe(queryStories(db, { limit: 4, category: story.category }), [] as StoryRow[])
    )
      .filter((s) => s.id !== story.id)
      .slice(0, 3);
    return { story, others };
  });

const StoryInput = z.object({
  title: z.string().trim().min(5).max(140),
  category: z.enum(STORY_CATEGORY_VALUES),
  authorName: z.string().trim().min(2).max(60),
  content: z.string().trim().min(100).max(10000),
  photoUrl: z.string().url().startsWith("https://").nullable(),
  acceptedConduct: z.literal(true),
  website: z.string().max(0).optional(),
});
export const createStoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => StoryInput.parse(d))
  .handler(async ({ data, context }) => {
    rateLimit(`story:${context.userId}`, 2, 24 * 60 * 60_000);
    try {
      assertCleanText(`${data.title}\n${data.content}`);
    } catch (e) {
      throw new Error(e instanceof ConteudoBloqueadoError ? MENSAGEM_BLOQUEIO : String(e));
    }
    const { data: row, error } = await asDb(context.supabase)
      .from("stories")
      .insert({
        user_id: context.userId,
        title: data.title,
        category: data.category,
        author_name: data.authorName,
        content: data.content,
        photo_url: data.photoUrl,
      })
      .select("id,status")
      .single();
    if (error) friendly(error, "Não foi possível enviar a história.");
    return row as { id: string; status: string };
  });

export const likeStoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ storyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: total, error } = await asDb(context.supabase).rpc("like_story", {
      p_story_id: data.storyId,
    });
    if (error) throw new Error(error.message);
    return { likeCount: Number(total ?? 0) };
  });

export const myStoryLikeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ storyId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await asDb(context.supabase)
      .from("story_likes")
      .select("story_id")
      .eq("story_id", data.storyId)
      .eq("user_id", context.userId);
    return { liked: (rows?.length ?? 0) > 0 };
  });

/* ---------- Perguntas ---------- */
export const getQuestionsData = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; filter?: string; sort?: string } | undefined) => ({
    category: d?.category ? String(d.category) : undefined,
    filter: (d?.filter === "sem-resposta" || d?.filter === "resolvidas" ? d.filter : undefined) as
      "sem-resposta" | "resolvidas" | undefined,
    sort: (d?.sort === "respondidas" ? "respondidas" : "recentes") as "recentes" | "respondidas",
  }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    const [questions, categories] = await Promise.all([
      safe(queryQuestions(db, { ...data, limit: 50 }), [] as QuestionRow[]),
      safe(queryQuestionCategories(db), []),
    ]);
    return { questions, categories };
  });

export const getQuestionData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    const result = await safe(queryQuestionBySlug(db, data.slug), null);
    if (result) {
      await safe(
        Promise.resolve(
          db.rpc("increment_question_views", { p_question_id: result.question.id }),
        ).then(() => undefined),
        undefined,
      );
    }
    return result;
  });

export const getQuestionCategoriesFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await createReadOnlySupabaseClient();
  return safe(queryQuestionCategories(db), []);
});

const QuestionInput = z.object({
  title: z.string().trim().min(10).max(160),
  body: z.string().trim().min(20).max(6000),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().trim().min(2).max(24)).max(3).default([]),
  acceptedConduct: z.literal(true),
  website: z.string().max(0).optional(),
});
export const createQuestionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => QuestionInput.parse(d))
  .handler(async ({ data, context }) => {
    rateLimit(`question:${context.userId}`, 3, 24 * 60 * 60_000);
    try {
      assertCleanText(`${data.title}\n${data.body}`, 2);
    } catch (e) {
      throw new Error(e instanceof ConteudoBloqueadoError ? MENSAGEM_BLOQUEIO : String(e));
    }
    const db = asDb(context.supabase);
    // Duplicidade: mesmo título (normalizado) nos últimos 30 dias.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
    const { data: dup } = await db
      .from("questions")
      .select("slug,title")
      .in("status", ["approved", "closed"])
      .gte("created_at", since)
      .ilike("title", data.title.slice(0, 60) + "%")
      .limit(1);
    if (dup && dup.length > 0) {
      throw new Error(
        `Já existe uma pergunta parecida: /perguntas/${(dup[0] as { slug: string }).slug}`,
      );
    }
    const slug = `${slugify(data.title).slice(0, 80) || "pergunta"}-${Math.random().toString(36).slice(2, 8)}`;
    const { data: row, error } = await db
      .from("questions")
      .insert({
        user_id: context.userId,
        slug,
        title: data.title,
        body: data.body,
        category_id: data.categoryId,
        tags: data.tags.map((t) => slugify(t)).filter(Boolean),
      })
      .select("id,slug,status")
      .single();
    if (error) friendly(error, "Não foi possível enviar a pergunta.");
    return row as { id: string; slug: string; status: string };
  });

const AnswerInput = z.object({
  questionId: z.string().uuid(),
  body: z.string().trim().min(10).max(6000),
  acceptedConduct: z.literal(true),
  website: z.string().max(0).optional(),
});
export const createAnswerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnswerInput.parse(d))
  .handler(async ({ data, context }) => {
    rateLimit(`answer:${context.userId}`, 20, 24 * 60 * 60_000);
    try {
      assertCleanText(data.body, 2);
    } catch (e) {
      throw new Error(e instanceof ConteudoBloqueadoError ? MENSAGEM_BLOQUEIO : String(e));
    }
    const { data: row, error } = await asDb(context.supabase)
      .from("answers")
      .insert({ question_id: data.questionId, user_id: context.userId, body: data.body })
      .select("id,question_id,body,like_count,status,created_at,user_id")
      .single();
    if (error) friendly(error, "Não foi possível enviar a resposta.");
    return row as unknown as AnswerRow;
  });

export const voteAnswerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        answerId: z.string().uuid(),
        value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: total, error } = await asDb(context.supabase).rpc("vote_answer", {
      p_answer_id: data.answerId,
      p_value: data.value,
    });
    if (error) throw new Error(error.message);
    return { likeCount: Number(total ?? 0) };
  });

export const acceptAnswerFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ questionId: z.string().uuid(), answerId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await asDb(context.supabase).rpc("accept_answer", {
      p_question_id: data.questionId,
      p_answer_id: data.answerId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reportFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        entity: z.enum(["story", "question", "answer"]),
        entityId: z.string().uuid(),
        reason: z.string().trim().min(5).max(500),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    rateLimit(`report:${context.userId}`, 10, 24 * 60 * 60_000);
    const { error } = await asDb(context.supabase).rpc("report_irmandade", {
      p_entity: data.entity,
      p_entity_id: data.entityId,
      p_reason: data.reason,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Encontros ---------- */
export const getEventsData = createServerFn({ method: "GET" }).handler(async () => {
  const db = await createReadOnlySupabaseClient();
  const [proximos, passados] = await Promise.all([
    safe(queryEvents(db, { when: "proximos" }), [] as EventRow[]),
    safe(queryEvents(db, { when: "passados", limit: 24 }), [] as EventRow[]),
  ]);
  return { proximos, passados };
});

export const getEventData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    return safe(queryEventBySlug(db, data.slug), null);
  });

export const myRsvpFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ eventId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await asDb(context.supabase)
      .from("event_rsvps")
      .select("status")
      .eq("event_id", data.eventId)
      .eq("user_id", context.userId)
      .maybeSingle();
    return {
      status: ((rows as { status: RsvpStatus } | null)?.status ?? null) as RsvpStatus | null,
    };
  });

export const rsvpFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({ eventId: z.string().uuid(), status: z.enum(["going", "maybe", "canceled"]) })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await asDb(context.supabase).rpc("rsvp_event", {
      p_event_id: data.eventId,
      p_status: data.status,
    });
    if (error) throw new Error(/LOTADO/.test(error.message) ? "LOTADO" : error.message);
    return { status: data.status };
  });
