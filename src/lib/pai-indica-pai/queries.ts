// Consultas do Pai Indica Pai sobre um SupabaseClient (anônimo/read-only nos loaders,
// service role nos crons e no detalhe de vaga). Sem segredo aqui. Banco fora do ar ou
// placeholder → listas vazias (padrão de hub.functions.ts).
import type { SupabaseClient } from "@supabase/supabase-js";
import type { JobsSearch, MentorsSearch, ProfessionalsSearch, ReferralsSearch } from "./schemas";
import type {
  JobDetailData,
  JobPublic,
  JobRow,
  JobsListData,
  PipHubData,
  ProfessionalRow,
  ReferralRow,
} from "./types";

export const JOBS_PER_PAGE = 12;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = { from: (table: string) => any; rpc: (fn: string, args?: unknown) => any };
const raw = (db: SupabaseClient): AnyClient => db as unknown as AnyClient;

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error("[pai-indica-pai]", error);
    return fallback;
  }
}

const nowIso = () => new Date().toISOString();

/* ---------------- Vagas ---------------- */

export async function queryJobs(db: SupabaseClient, s: JobsSearch): Promise<JobsListData> {
  const page = s.pagina ?? 1;
  const from = (page - 1) * JOBS_PER_PAGE;
  const ordem = s.ordem ?? "recentes";
  const run = async (): Promise<JobsListData> => {
    let q = raw(db).from("jobs_public").select("*", { count: "exact" });
    if (s.uf) q = q.eq("uf", s.uf);
    if (s.cidade) q = q.ilike("city", `%${s.cidade}%`);
    if (s.remoto) q = q.eq("remote", true);
    if (s.tipo) q = q.eq("type", s.tipo);
    if (s.area) q = q.eq("area", s.area);
    if (s.q) {
      // Busca full-text na tabela base (a view não expõe search_content); mesmo filtro público.
      q = raw(db)
        .from("jobs")
        .select(
          "id, slug, title, company, city, uf, remote, type, area, salary_min, salary_max, summary:description, expires_at, published_at:moderated_at, views, created_at, updated_at",
          { count: "exact" },
        )
        .eq("status", "approved")
        .gt("expires_at", nowIso())
        .textSearch("search_content", s.q, { type: "websearch", config: "portuguese" });
      if (s.uf) q = q.eq("uf", s.uf);
      if (s.cidade) q = q.ilike("city", `%${s.cidade}%`);
      if (s.remoto) q = q.eq("remote", true);
      if (s.tipo) q = q.eq("type", s.tipo);
      if (s.area) q = q.eq("area", s.area);
    }
    q =
      ordem === "expiram"
        ? q.order("expires_at", { ascending: true })
        : ordem === "vistas"
          ? q.order("views", { ascending: false })
          : q.order(s.q ? "moderated_at" : "published_at", { ascending: false, nullsFirst: false });
    const { data, count, error } = await q.range(from, from + JOBS_PER_PAGE - 1);
    if (error) throw error;
    const items = ((data ?? []) as JobPublic[]).map((j) => ({
      ...j,
      summary: (j.summary ?? "").slice(0, 240),
    }));
    return { items, total: count ?? 0, page, perPage: JOBS_PER_PAGE, cities: [] };
  };
  const result = await safe(run(), {
    items: [],
    total: 0,
    page,
    perPage: JOBS_PER_PAGE,
    cities: [],
  });
  result.cities = await safe(queryJobCities(db), []);
  return result;
}

export async function queryJobCities(db: SupabaseClient): Promise<string[]> {
  const { data } = await raw(db)
    .from("jobs_public")
    .select("city")
    .not("city", "is", null)
    .limit(500);
  const set = new Set<string>();
  for (const r of (data ?? []) as { city: string | null }[]) if (r.city) set.add(r.city.trim());
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function queryLatestJobs(db: SupabaseClient, limit = 6): Promise<JobPublic[]> {
  const { data, error } = await raw(db)
    .from("jobs_public")
    .select("*")
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as JobPublic[];
}

/** Página da vaga: `db` deve enxergar também expiradas/rejeitadas (service role) para a página "encerrada". */
export async function queryJobBySlug(
  db: SupabaseClient,
  publicDb: SupabaseClient,
  slug: string,
): Promise<JobDetailData | null> {
  const { data } = await raw(db).from("jobs").select("*").eq("slug", slug).maybeSingle();
  const job = data as JobRow | null;
  if (!job) return null;
  const live = job.status === "approved" && new Date(job.expires_at).getTime() > Date.now();
  const { posted_by: _p, moderated_by: _m, rejection_reason: _r, ...rest } = job;
  const safeJob: JobDetailData["job"] = {
    ...rest,
    contact_email: live && job.consent_contact ? job.contact_email : null,
    contact_phone: live && job.consent_contact ? job.contact_phone : null,
    contact_url: live ? job.contact_url : null,
    description: live ? job.description : "",
    how_to_apply: live ? job.how_to_apply : null,
  };
  const similar = await safe(querySimilarJobs(publicDb, job), []);
  return { job: safeJob, live, similar };
}

export async function querySimilarJobs(
  db: SupabaseClient,
  job: JobRow,
  limit = 3,
): Promise<JobPublic[]> {
  const filters: string[] = [];
  if (job.area) filters.push(`area.eq.${job.area}`);
  if (job.uf) filters.push(`uf.eq.${job.uf}`);
  if (job.remote) filters.push("remote.eq.true");
  let q = raw(db).from("jobs_public").select("*").neq("id", job.id);
  if (filters.length) q = q.or(filters.join(","));
  const { data, error } = await q
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as JobPublic[];
}

/* ---------------- Indicações ---------------- */

export async function queryReferrals(
  db: SupabaseClient,
  s: ReferralsSearch,
): Promise<ReferralRow[]> {
  const run = async () => {
    let q = raw(db).from("job_referrals").select("*").eq("status", "approved");
    if (s.tipo) q = q.eq("kind", s.tipo);
    if (s.uf) q = q.eq("uf", s.uf);
    if (s.cidade) q = q.ilike("city", `%${s.cidade}%`);
    if (s.categoria) q = q.ilike("category", `%${s.categoria}%`);
    const { data, error } = await q
      .order("moderated_at", { ascending: false, nullsFirst: false })
      .limit(200);
    if (error) throw error;
    return ((data ?? []) as ReferralRow[]).map(stripReferralContact);
  };
  return safe(run(), []);
}

function stripReferralContact(r: ReferralRow): ReferralRow {
  return {
    ...r,
    referred_by: null,
    contact_email: r.consent_contact ? r.contact_email : null,
    contact_phone: r.consent_contact ? r.contact_phone : null,
  };
}

/* ---------------- Pai Profissional ---------------- */

export async function queryProfessionals(
  db: SupabaseClient,
  s: ProfessionalsSearch & { limit?: number },
): Promise<ProfessionalRow[]> {
  const run = async () => {
    let q = raw(db).from("professionals").select("*").eq("status", "approved");
    if (s.area) q = q.eq("area", s.area);
    if (s.uf) q = q.eq("uf", s.uf);
    if (s.cidade) q = q.ilike("city", `%${s.cidade}%`);
    if (s.remoto) q = q.eq("remote", true);
    if (s.mentor) q = q.eq("is_mentor", true);
    if (s.q) q = q.or(`profession.ilike.%${s.q}%,description.ilike.%${s.q}%`);
    const { data, error } = await q
      .order("moderated_at", { ascending: false, nullsFirst: false })
      .limit(s.limit ?? 200);
    if (error) throw error;
    return ((data ?? []) as ProfessionalRow[]).map(stripProfessionalContact);
  };
  return safe(run(), []);
}

function stripProfessionalContact(p: ProfessionalRow): ProfessionalRow {
  return {
    ...p,
    contact_email: p.consent_contact ? p.contact_email : null,
    contact_phone: p.consent_contact ? p.contact_phone : null,
  };
}

export async function queryProfessionalBySlug(
  db: SupabaseClient,
  slug: string,
): Promise<ProfessionalRow | null> {
  const { data } = await raw(db)
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();
  return data ? stripProfessionalContact(data as ProfessionalRow) : null;
}

/**
 * Anexa display_name/avatar dos pais (profiles). Anônimo não lê profiles de membros (RLS), então
 * o chamador passa um client com service role quando houver; sem ele, fica "Pai".
 */
export async function attachProfiles<
  T extends { user_id: string; profile?: ProfessionalRow["profile"] },
>(db: SupabaseClient | null, rows: T[]): Promise<T[]> {
  if (!db || rows.length === 0) return rows;
  const ids = [...new Set(rows.map((r) => r.user_id))];
  const { data } = await safe(
    raw(db).from("profiles").select("id, display_name, avatar_url").in("id", ids),
    { data: [] as unknown[] },
  );
  const map = new Map<string, { display_name: string; avatar_url: string | null }>();
  for (const p of (data ?? []) as { id: string; display_name: string; avatar_url: string | null }[])
    map.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
  return rows.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
}

/* ---------------- Mentoria ---------------- */

export async function queryMentors(
  db: SupabaseClient,
  s: MentorsSearch,
): Promise<ProfessionalRow[]> {
  const run = async () => {
    let q = raw(db)
      .from("professionals")
      .select("*")
      .eq("status", "approved")
      .eq("is_mentor", true);
    if (s.area) q = q.contains("mentor_areas", [s.area]);
    const { data, error } = await q
      .order("moderated_at", { ascending: false, nullsFirst: false })
      .limit(100);
    if (error) throw error;
    return ((data ?? []) as ProfessionalRow[]).map(stripProfessionalContact);
  };
  return safe(run(), []);
}

/** Vagas livres por mentor = mentor_capacity - mentorias aceitas (precisa de client com leitura de mentorships). */
export async function attachMentorSlots(
  db: SupabaseClient | null,
  mentors: ProfessionalRow[],
): Promise<ProfessionalRow[]> {
  if (!db || mentors.length === 0)
    return mentors.map((m) => ({ ...m, mentor_slots: m.mentor_capacity }));
  const ids = mentors.map((m) => m.user_id);
  const { data } = await safe(
    raw(db).from("mentorships").select("mentor_id").eq("status", "accepted").in("mentor_id", ids),
    { data: [] as unknown[] },
  );
  const taken = new Map<string, number>();
  for (const r of (data ?? []) as { mentor_id: string }[])
    taken.set(r.mentor_id, (taken.get(r.mentor_id) ?? 0) + 1);
  return mentors.map((m) => ({
    ...m,
    mentor_slots: Math.max(0, m.mentor_capacity - (taken.get(m.user_id) ?? 0)),
  }));
}

/* ---------------- Hub ---------------- */

export async function queryHubData(db: SupabaseClient): Promise<PipHubData> {
  const count = async (table: string, extra?: (q: unknown) => unknown) => {
    let q = raw(db).from(table).select("id", { count: "exact", head: true });
    if (extra) q = extra(q);
    const { count: c } = await q;
    return c ?? 0;
  };
  const [jobs, referrals, professionals, mentors, latestJobs, pros] = await Promise.all([
    safe(count("jobs_public"), 0),
    safe(
      count("job_referrals", (q) =>
        (q as { eq: (a: string, b: unknown) => unknown }).eq("status", "approved"),
      ),
      0,
    ),
    safe(
      count("professionals", (q) =>
        (q as { eq: (a: string, b: unknown) => unknown }).eq("status", "approved"),
      ),
      0,
    ),
    safe(
      count("professionals", (q) =>
        (q as { eq: (a: string, b: unknown) => { eq: (a: string, b: unknown) => unknown } })
          .eq("status", "approved")
          .eq("is_mentor", true),
      ),
      0,
    ),
    safe(queryLatestJobs(db, 6), []),
    queryProfessionals(db, { limit: 6 }),
  ]);
  return { counts: { jobs, referrals, professionals, mentors }, latestJobs, professionals: pros };
}
