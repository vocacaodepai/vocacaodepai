// Consultas de leitura da Formação (anon/SSR), doc 09 §5 e §6.
import type { DbClient } from "@/lib/queries";
import type {
  ChallengeDayRow,
  ChallengeRow,
  StepPost,
  TrackRow,
  TrackStepRow,
} from "@/lib/formacao/types";

export const TRACK_SELECT =
  "id,slug,title,description,cover_image_url,level,estimated_minutes,estimated_days,audience,pillar,is_premium,outcomes,status,sort_order";
export const STEP_SELECT =
  "id,track_id,position,module,type,title,summary,body,completion_rule,related_post_slug,post_id,video_url,estimated_minutes";
export const CHALLENGE_SELECT =
  "id,slug,title,description,cover_image_url,days,pillar,badge_slug,is_premium,status,sort_order";

export async function queryTracks(db: DbClient): Promise<TrackRow[]> {
  const { data, error } = await db
    .from("tracks")
    .select(`${TRACK_SELECT},track_steps(count)`)
    .eq("status", "published")
    .order("sort_order");
  if (error) throw error;
  return ((data ?? []) as unknown as Array<TrackRow & { track_steps?: { count: number }[] }>).map(
    ({ track_steps, ...t }) => ({ ...t, steps_count: track_steps?.[0]?.count ?? 0 }),
  );
}

export async function queryTrackBySlug(
  db: DbClient,
  slug: string,
): Promise<{ track: TrackRow; steps: TrackStepRow[] } | null> {
  const { data: t, error } = await db
    .from("tracks")
    .select(TRACK_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!t) return null;
  const track = t as unknown as TrackRow;
  const { data: s } = await db
    .from("track_steps")
    .select(STEP_SELECT)
    .eq("track_id", track.id)
    .order("position");
  const steps = (s ?? []) as unknown as TrackStepRow[];
  const postIds = steps.map((x) => x.post_id).filter((x): x is string => !!x);
  if (postIds.length > 0) {
    const { data: posts } = await db
      .from("posts")
      .select("id,slug,title,cover_image_url")
      .in("id", postIds)
      .eq("status", "published");
    const byId = new Map(((posts ?? []) as StepPost[]).map((p) => [p.id, p]));
    for (const step of steps) step.post = step.post_id ? (byId.get(step.post_id) ?? null) : null;
  }
  return { track: { ...track, steps_count: steps.length }, steps };
}

export async function queryChallenges(db: DbClient): Promise<ChallengeRow[]> {
  const { data, error } = await db
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("status", "published")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as unknown as ChallengeRow[];
}

export async function queryChallengeBySlug(
  db: DbClient,
  slug: string,
): Promise<{ challenge: ChallengeRow; days: ChallengeDayRow[] } | null> {
  const { data: c, error } = await db
    .from("challenges")
    .select(CHALLENGE_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!c) return null;
  const challenge = c as unknown as ChallengeRow;
  const { data: d } = await db
    .from("challenge_days")
    .select("id,challenge_id,day,title,task,reflection,body")
    .eq("challenge_id", challenge.id)
    .order("day");
  return { challenge, days: (d ?? []) as unknown as ChallengeDayRow[] };
}
