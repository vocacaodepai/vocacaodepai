/**
 * Acesso a dados do admin da Irmandade e da Formação (doc 09 §13). Cliente Supabase do navegador
 * com a sessão do editor/admin; RLS `is_admin()` libera pendentes e escrita; moderação via RPCs
 * moderate_story / moderate_question / moderate_answer (grava moderation_log e concede insígnias).
 */
import { supabase } from "@/integrations/supabase/client";
import type { AnswerRow, EventRow, QuestionRow, StoryRow } from "@/lib/irmandade/types";
import type { ChallengeRow, TrackRow } from "@/lib/formacao/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ModerationAction = "approve" | "reject";
export interface AdminAnswer extends AnswerRow {
  question: { slug: string; title: string } | null;
  report_count?: number;
}
export interface ReportRow {
  id: string;
  entity: string;
  entity_id: string;
  action: string;
  note: string | null;
  created_at: string;
}

const order = (q: ReturnType<typeof db.from>) =>
  q.order("report_count", { ascending: false }).order("created_at", { ascending: true });

export async function fetchAdminStories(status: string): Promise<StoryRow[]> {
  const { data, error } = await order(
    db
      .from("stories")
      .select(
        "id,user_id,author_name,title,category,content,photo_url,status,like_count,report_count,rejection_reason,created_at,updated_at",
      )
      .eq("status", status),
  ).limit(200);
  if (error) throw error;
  return (data ?? []) as StoryRow[];
}
export async function fetchAdminQuestions(status: string): Promise<QuestionRow[]> {
  const { data, error } = await order(
    db
      .from("questions")
      .select(
        "id,slug,title,body,category_id,status,answers_count,accepted_answer_id,views,tags,last_answer_at,report_count,rejection_reason,created_at,user_id,categories(id,name,slug),author:irmandade_members(display_name,avatar_url)",
      )
      .eq("status", status),
  ).limit(200);
  if (error) throw error;
  return (data ?? []) as QuestionRow[];
}
export async function fetchAdminAnswers(status: string): Promise<AdminAnswer[]> {
  const { data, error } = await order(
    db
      .from("answers")
      .select(
        "id,question_id,body,like_count,status,report_count,created_at,user_id,author:irmandade_members(display_name,avatar_url),question:questions(slug,title)",
      )
      .eq("status", status),
  ).limit(200);
  if (error) throw error;
  return (data ?? []) as AdminAnswer[];
}
export async function fetchReports(): Promise<ReportRow[]> {
  const { data, error } = await db
    .from("moderation_log")
    .select("id,entity,entity_id,action,note,created_at")
    .eq("action", "flag")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}
export async function moderate(
  entity: "story" | "question" | "answer",
  id: string,
  action: ModerationAction | "close",
  reason?: string,
) {
  const fn =
    entity === "story"
      ? "moderate_story"
      : entity === "question"
        ? "moderate_question"
        : "moderate_answer";
  const key =
    entity === "story" ? "p_story_id" : entity === "question" ? "p_question_id" : "p_answer_id";
  const { error } = await db.rpc(fn, { [key]: id, p_action: action, p_reason: reason ?? null });
  if (error) throw error;
}

/* ---------- eventos ---------- */
export type AdminEventInput = Omit<EventRow, "id" | "created_at" | "updated_at" | "rsvp_count"> & {
  id?: string;
};
export async function fetchAdminEvents(): Promise<EventRow[]> {
  const { data, error } = await db
    .from("events")
    .select("*")
    .order("starts_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as EventRow[];
}
export async function saveEvent(input: AdminEventInput): Promise<EventRow> {
  const { id, ...rest } = input;
  const q = id ? db.from("events").update(rest).eq("id", id) : db.from("events").insert(rest);
  const { data, error } = await q.select("*").single();
  if (error) throw error;
  return data as EventRow;
}
export async function setEventStatus(id: string, status: EventRow["status"]) {
  const { error } = await db.from("events").update({ status }).eq("id", id);
  if (error) throw error;
}
export async function fetchEventRsvps(eventId: string): Promise<
  {
    user_id: string;
    status: string;
    created_at: string;
    member: { display_name: string | null } | null;
  }[]
> {
  const { data, error } = await db
    .from("event_rsvps")
    .select("user_id,status,created_at,member:irmandade_members(display_name)")
    .eq("event_id", eventId);
  if (error) throw error;
  return data ?? [];
}

/* ---------- formação ---------- */
export async function fetchAdminTracks(): Promise<(TrackRow & { steps_count: number })[]> {
  const { data, error } = await db
    .from("tracks")
    .select("*,track_steps(count)")
    .order("sort_order");
  if (error) throw error;
  return ((data ?? []) as (TrackRow & { track_steps?: { count: number }[] })[]).map(
    ({ track_steps, ...t }) => ({ ...t, steps_count: track_steps?.[0]?.count ?? 0 }),
  );
}
export async function fetchAdminChallenges(): Promise<(ChallengeRow & { days_count: number })[]> {
  const { data, error } = await db
    .from("challenges")
    .select("*,challenge_days(count)")
    .order("sort_order");
  if (error) throw error;
  return ((data ?? []) as (ChallengeRow & { challenge_days?: { count: number }[] })[]).map(
    ({ challenge_days, ...c }) => ({ ...c, days_count: challenge_days?.[0]?.count ?? 0 }),
  );
}
export async function setFormacaoStatus(
  table: "tracks" | "challenges",
  id: string,
  status: "draft" | "published" | "archived",
) {
  const { error } = await db.from(table).update({ status }).eq("id", id);
  if (error) throw error;
}
