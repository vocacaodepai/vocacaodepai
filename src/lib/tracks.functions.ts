// Server functions da Formação (doc 09 §10.2): leitura anônima (trilhas e desafios publicados)
// e progresso do membro via RPCs security definer (complete_track_step, save_step_note,
// start_challenge, complete_challenge_day) seguidas de grant_badges_for_me() (insígnias novas).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import type { DbClient } from "@/lib/queries";
import { rateLimit } from "@/lib/rate-limit";
import {
  queryChallengeBySlug,
  queryChallenges,
  queryTrackBySlug,
  queryTracks,
} from "@/lib/db/formacao";
import type {
  ChallengeProgressRow,
  ChallengeRow,
  MyChallengeState,
  MyFormacao,
  TrackProgressRow,
  TrackRow,
} from "@/lib/formacao/types";

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}
const asDb = (client: unknown) => client as DbClient;

async function newBadges(db: DbClient): Promise<string[]> {
  const { data } = await db.rpc("grant_badges_for_me");
  return Array.isArray(data) ? (data as string[]) : [];
}

export const getFormacaoData = createServerFn({ method: "GET" }).handler(async () => {
  const db = await createReadOnlySupabaseClient();
  const [tracks, challenges] = await Promise.all([
    safe(queryTracks(db), [] as TrackRow[]),
    safe(queryChallenges(db), [] as ChallengeRow[]),
  ]);
  return { tracks, challenges };
});

export const getTrackData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    return safe(queryTrackBySlug(db, data.slug), null);
  });

export const getMyTrackProgressFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await asDb(context.supabase)
      .from("track_progress")
      .select("step_id,completed_at,note")
      .eq("user_id", context.userId)
      .eq("track_id", data.trackId);
    return (rows ?? []) as unknown as TrackProgressRow[];
  });

export const completeStepFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ stepId: z.string().uuid(), note: z.string().max(4000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    rateLimit(`step:${context.userId}`, 60, 60_000);
    const db = asDb(context.supabase);
    const { error } = await db.rpc("complete_track_step", { p_step_id: data.stepId });
    if (error)
      throw new Error(
        /PREMIUM/.test(error.message) ? "Esta trilha é do plano Pai de Valor." : error.message,
      );
    if (data.note) await db.rpc("save_step_note", { p_step_id: data.stepId, p_note: data.note });
    return { newBadges: await newBadges(db) };
  });

export const saveStepNoteFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ stepId: z.string().uuid(), note: z.string().max(4000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await asDb(context.supabase).rpc("save_step_note", {
      p_step_id: data.stepId,
      p_note: data.note,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDesafiosData = createServerFn({ method: "GET" }).handler(async () => {
  const db = await createReadOnlySupabaseClient();
  return { challenges: await safe(queryChallenges(db), [] as ChallengeRow[]) };
});

export const getChallengeData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    return safe(queryChallengeBySlug(db, data.slug), null);
  });

export const getMyChallengeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ challengeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<MyChallengeState> => {
    const db = asDb(context.supabase);
    const [{ data: enr }, { data: prog }, { data: cur }] = await Promise.all([
      db
        .from("challenge_enrollments")
        .select("started_at,finished_at")
        .eq("challenge_id", data.challengeId)
        .eq("user_id", context.userId)
        .maybeSingle(),
      db
        .from("challenge_progress")
        .select("day,completed_at,note")
        .eq("challenge_id", data.challengeId)
        .eq("user_id", context.userId)
        .order("day"),
      db.rpc("challenge_current_day", {
        p_user_id: context.userId,
        p_challenge_id: data.challengeId,
      }),
    ]);
    const e = enr as { started_at: string; finished_at: string | null } | null;
    return {
      started_at: e?.started_at ?? null,
      finished_at: e?.finished_at ?? null,
      current_day: Number(cur ?? 0) || 0,
      progress: (prog ?? []) as unknown as ChallengeProgressRow[],
    };
  });

export const startChallengeFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ challengeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: started, error } = await asDb(context.supabase).rpc("start_challenge", {
      p_challenge_id: data.challengeId,
    });
    if (error) throw new Error(error.message);
    return { startedAt: String(started) };
  });

export const completeDayFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        challengeId: z.string().uuid(),
        day: z.number().int().min(1).max(90),
        note: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    rateLimit(`day:${context.userId}`, 60, 60_000);
    const db = asDb(context.supabase);
    const { error } = await db.rpc("complete_challenge_day", {
      p_challenge_id: data.challengeId,
      p_day: data.day,
      p_note: data.note ?? null,
    });
    if (error)
      throw new Error(
        /DIA_FUTURO/.test(error.message) ? "Esse dia ainda não chegou." : error.message,
      );
    return { newBadges: await newBadges(db) };
  });

export const getMyFormacaoFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyFormacao> => {
    const db = asDb(context.supabase);
    await safe(newBadges(db), []);
    const { data, error } = await db.rpc("get_member_dashboard");
    if (error) throw new Error(error.message);
    return data as unknown as MyFormacao;
  });
