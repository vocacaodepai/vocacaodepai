// Server functions do Pai Indica Pai (doc 08 §4.4). Leitura com o client anônimo (RLS pública);
// escrita como o usuário logado (middleware requireSupabaseAuth → RLS do autor); service role só para
// e-mails (ler o e-mail do autor em auth.users), para a página "vaga encerrada" e para o digest.
// Segredos só via process.env dentro dos handlers; nada vai para o bundle do cliente.
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { SITE_URL } from "@/lib/site";
import { containsBlacklisted } from "./blacklist";
import {
  emailMentorshipAccepted,
  emailMentorshipRequested,
  emailModerated,
  emailReceived,
} from "./emails";
import { makeSlug } from "./format";
import {
  attachMentorSlots,
  attachProfiles,
  queryHubData,
  queryJobBySlug,
  queryJobs,
  queryMentors,
  queryProfessionalBySlug,
  queryProfessionals,
  queryReferrals,
} from "./queries";
import {
  alertsSchema,
  blockSchema,
  jobSchema,
  jobsSearchSchema,
  mentorshipRequestSchema,
  mentorsSearchSchema,
  moderateSchema,
  professionalSchema,
  professionalsSearchSchema,
  referralSchema,
  referralsSearchSchema,
  reportSchema,
} from "./schemas";
import { DAILY_LIMIT, JOB_AREAS, MENTORSHIP_AREAS } from "./taxonomies";
import type {
  JobDetailData,
  JobRow,
  JobsListData,
  MentorshipRow,
  ModerationLogRow,
  ModerationQueue,
  PipHubData,
  ProfessionalRow,
  ReferralRow,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyClient = {
  from: (t: string) => any;
  rpc: (f: string, a?: unknown) => any;
  auth: SupabaseClient["auth"];
};
/* eslint-enable @typescript-eslint/no-explicit-any */
const raw = (db: unknown): AnyClient => db as AnyClient;

/** Service role quando configurada; null em ambiente placeholder (tudo degrada para estados vazios). */
async function serviceClient(): Promise<SupabaseClient | null> {
  if (!process.env["SUPABASE_SERVICE_ROLE_KEY"] || !process.env["VITE_SUPABASE_URL"]) return null;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return supabaseAdmin as unknown as SupabaseClient;
  } catch (error) {
    console.error("[pai-indica-pai] service role indisponível", error);
    return null;
  }
}

async function clientIp(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const srv = await import("@/lib/newsletter.server");
    return srv.getClientIp(getRequest());
  } catch {
    return "unknown";
  }
}

async function assertTurnstile(token: string | undefined) {
  const srv = await import("@/lib/newsletter.server");
  if (!(await srv.verifyTurnstile(token, await clientIp()))) {
    throw new Error("TURNSTILE_FALHOU: confirme que você não é um robô e tente de novo.");
  }
}

async function sendMail(
  to: string | null | undefined,
  content: { subject: string; html: string; text: string },
) {
  if (!to) return;
  try {
    const srv = await import("@/lib/newsletter.server");
    await srv.sendEmail({ to, ...content });
  } catch (error) {
    console.error("[pai-indica-pai] e-mail não enviado", error);
  }
}

async function userEmail(userId: string): Promise<string | null> {
  const svc = await serviceClient();
  if (!svc) return null;
  try {
    const { data } = await svc.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

/** Rate limit 3 publicações/24h (doc 08 §7.1) — o trigger do banco é a garantia; aqui é a mensagem amigável. */
async function assertDailyLimit(sb: AnyClient, userId: string) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const count = async (table: string, col: string) => {
    const { count: c } = await sb
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(col, userId)
      .gt("created_at", since);
    return c ?? 0;
  };
  const total =
    (await count("jobs", "posted_by")) +
    (await count("job_referrals", "referred_by")) +
    (await count("professionals", "user_id"));
  if (total >= DAILY_LIMIT)
    throw new Error(
      "LIMITE_DIARIO: você já publicou 3 itens nas últimas 24 horas. Tente novamente amanhã.",
    );
}

const empty = (v: string | undefined | null) => (v ? v : null);

/* ======================= Leitura (loaders) ======================= */

export const getPipHubData = createServerFn({ method: "GET" }).handler(
  async (): Promise<PipHubData> => {
    const db = await createReadOnlySupabaseClient();
    const data = await queryHubData(db);
    data.professionals = await attachProfiles(await serviceClient(), data.professionals);
    return data;
  },
);

export const listJobs = createServerFn({ method: "GET" })
  .inputValidator(jobsSearchSchema)
  .handler(async ({ data }): Promise<JobsListData> =>
    queryJobs(await createReadOnlySupabaseClient(), data),
  );

export const getJobBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(3).max(200) }))
  .handler(async ({ data }): Promise<JobDetailData | null> => {
    const anon = await createReadOnlySupabaseClient();
    // Service role também acha expiradas/rejeitadas para a página "encerrada" (sem contato, sem JSON-LD).
    const db = (await serviceClient()) ?? anon;
    try {
      return await queryJobBySlug(db, anon, data.slug);
    } catch (error) {
      console.error("[pai-indica-pai] getJobBySlug", error);
      return null;
    }
  });

export const listReferrals = createServerFn({ method: "GET" })
  .inputValidator(referralsSearchSchema)
  .handler(async ({ data }): Promise<ReferralRow[]> =>
    queryReferrals(await createReadOnlySupabaseClient(), data),
  );

export const listProfessionals = createServerFn({ method: "GET" })
  .inputValidator(professionalsSearchSchema)
  .handler(async ({ data }): Promise<ProfessionalRow[]> => {
    const rows = await queryProfessionals(await createReadOnlySupabaseClient(), data);
    return attachProfiles(await serviceClient(), rows);
  });

export const getProfessionalBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(1).max(200) }))
  .handler(async ({ data }): Promise<ProfessionalRow | null> => {
    try {
      const row = await queryProfessionalBySlug(await createReadOnlySupabaseClient(), data.slug);
      if (!row) return null;
      const svc = await serviceClient();
      const [withProfile] = await attachProfiles(svc, [row]);
      const [withSlots] = await attachMentorSlots(svc, [withProfile]);
      return withSlots;
    } catch (error) {
      console.error("[pai-indica-pai] getProfessionalBySlug", error);
      return null;
    }
  });

export const listMentors = createServerFn({ method: "GET" })
  .inputValidator(mentorsSearchSchema)
  .handler(async ({ data }): Promise<ProfessionalRow[]> => {
    const rows = await queryMentors(await createReadOnlySupabaseClient(), data);
    const svc = await serviceClient();
    return attachMentorSlots(svc, await attachProfiles(svc, rows));
  });

/* ======================= Escrita (usuário logado) ======================= */

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(jobSchema)
  .handler(async ({ data, context }): Promise<{ id: string; slug: string }> => {
    // Honeypot preenchido = robô: finge sucesso e não grava nada.
    if (data.website) return { id: "", slug: "" };
    await assertTurnstile(data.turnstile_token);
    const bad = containsBlacklisted([
      data.title,
      data.company,
      data.description,
      data.how_to_apply,
      data.contact_url,
    ]);
    if (bad) throw new Error(`CONTEUDO_BLOQUEADO: o texto contém termo não permitido (${bad}).`);
    const sb = raw(context.supabase);
    await assertDailyLimit(sb, context.userId);
    const slug = makeSlug(`${data.title} ${data.company}`);
    const { data: row, error } = await sb
      .from("jobs")
      .insert({
        slug,
        title: data.title,
        company: data.company,
        type: data.type,
        area: data.area,
        remote: data.remote,
        city: data.remote ? null : empty(data.city),
        uf: data.remote ? null : empty(data.uf),
        salary_min: data.salary_min ?? null,
        salary_max: data.salary_max ?? null,
        description: data.description,
        how_to_apply: data.how_to_apply,
        contact_email: empty(data.contact_email),
        contact_url: empty(data.contact_url),
        contact_phone: empty(data.contact_phone),
        consent_contact: data.consent_contact,
        posted_by: context.userId,
      })
      .select("id, slug, title")
      .single();
    if (error) throw new Error(error.message);
    const email = (context.claims as { email?: string }).email ?? (await userEmail(context.userId));
    await sendMail(email, emailReceived({ entity: "job", title: row.title }));
    return { id: row.id, slug: row.slug };
  });

export const createReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(referralSchema)
  .handler(async ({ data, context }): Promise<{ id: string; slug: string }> => {
    if (data.website) return { id: "", slug: "" };
    await assertTurnstile(data.turnstile_token);
    const bad = containsBlacklisted([
      data.title,
      data.category,
      data.description,
      data.contact_url,
    ]);
    if (bad) throw new Error(`CONTEUDO_BLOQUEADO: o texto contém termo não permitido (${bad}).`);
    const sb = raw(context.supabase);
    await assertDailyLimit(sb, context.userId);
    const { data: row, error } = await sb
      .from("job_referrals")
      .insert({
        slug: makeSlug(`${data.kind} ${data.title}`),
        kind: data.kind,
        title: data.title,
        category: data.category,
        city: empty(data.city),
        uf: empty(data.uf),
        description: data.description,
        contact_phone: empty(data.contact_phone),
        contact_email: empty(data.contact_email),
        contact_url: empty(data.contact_url),
        consent_contact: data.consent_contact,
        referred_by: context.userId,
      })
      .select("id, slug, title")
      .single();
    if (error) throw new Error(error.message);
    const email = (context.claims as { email?: string }).email ?? (await userEmail(context.userId));
    await sendMail(email, emailReceived({ entity: "job_referral", title: row.title }));
    return { id: row.id, slug: row.slug };
  });

export const createProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(professionalSchema)
  .handler(async ({ data, context }): Promise<{ id: string; slug: string; updated: boolean }> => {
    if (data.website) return { id: "", slug: "", updated: false };
    await assertTurnstile(data.turnstile_token);
    const bad = containsBlacklisted([data.profession, data.description, data.contact_url]);
    if (bad) throw new Error(`CONTEUDO_BLOQUEADO: o texto contém termo não permitido (${bad}).`);
    const sb = raw(context.supabase);
    const payload = {
      profession: data.profession,
      area: data.area,
      description: data.description,
      city: empty(data.city),
      uf: empty(data.uf),
      remote: data.remote,
      contact_phone: empty(data.contact_phone),
      contact_email: empty(data.contact_email),
      contact_url: empty(data.contact_url),
      consent_contact: data.consent_contact,
      is_mentor: data.is_mentor,
      mentor_areas: data.is_mentor ? data.mentor_areas : [],
      mentor_capacity: data.mentor_capacity,
    };
    // Um perfil por usuário (user_id unique): existe → edita (trigger devolve para a fila se mudou conteúdo).
    const { data: existing } = await sb
      .from("professionals")
      .select("id, slug")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      const { error } = await sb
        .from("professionals")
        .update({ ...payload, status: "pending" })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { id: existing.id, slug: existing.slug, updated: true };
    }
    await assertDailyLimit(sb, context.userId);
    const { data: me } = await sb
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const { data: row, error } = await sb
      .from("professionals")
      .insert({
        ...payload,
        slug: makeSlug(`${me?.display_name ?? "pai"} ${data.profession}`),
        user_id: context.userId,
      })
      .select("id, slug")
      .single();
    if (error) throw new Error(error.message);
    const email = (context.claims as { email?: string }).email ?? (await userEmail(context.userId));
    await sendMail(email, emailReceived({ entity: "professional", title: data.profession }));
    return { id: row.id, slug: row.slug, updated: false };
  });

export const requestMentorship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(mentorshipRequestSchema)
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    if (data.website) return { id: "" };
    const sb = raw(context.supabase);
    const { data: row, error } = await sb
      .from("mentorships")
      .insert({
        mentor_id: data.mentor_id,
        mentee_id: context.userId,
        area: data.area,
        message: data.message,
      })
      .select("id")
      .single();
    if (error) {
      if (/row-level security/i.test(error.message))
        throw new Error("AGENDA_CHEIA: este mentor está com a agenda cheia no momento.");
      throw new Error(error.message);
    }
    const { data: me } = await sb
      .from("profiles")
      .select("display_name")
      .eq("id", context.userId)
      .maybeSingle();
    await sendMail(
      await userEmail(data.mentor_id),
      emailMentorshipRequested({
        menteeName: me?.display_name ?? "Um pai",
        area: MENTORSHIP_AREAS[data.area],
        message: data.message,
      }),
    );
    return { id: row.id };
  });

export const respondMentorship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.uuid(),
      status: z.enum(["accepted", "declined", "completed"]),
      reply: z.string().trim().max(1000).optional(),
    }),
  )
  .handler(async ({ data, context }): Promise<MentorshipRow> => {
    const sb = raw(context.supabase);
    const { data: row, error } = await sb.rpc("respond_mentorship", {
      p_id: data.id,
      p_status: data.status,
      p_reply: data.reply ?? null,
    });
    if (error) throw new Error(error.message);
    const m = row as MentorshipRow;
    if (data.status === "accepted") {
      const area = MENTORSHIP_AREAS[m.area] ?? m.area;
      const [{ data: mentorProfile }, { data: mentorPro }] = await Promise.all([
        sb.from("profiles").select("display_name").eq("id", m.mentor_id).maybeSingle(),
        sb
          .from("professionals")
          .select("consent_contact, contact_email")
          .eq("user_id", m.mentor_id)
          .maybeSingle(),
      ]);
      const svc = await serviceClient();
      const { data: menteeProfile } = svc
        ? await raw(svc).from("profiles").select("display_name").eq("id", m.mentee_id).maybeSingle()
        : { data: null };
      const mentorEmail = await userEmail(m.mentor_id);
      const menteeEmail = await userEmail(m.mentee_id);
      // Mentorado consentiu no pedido; mentor só se consent_contact no perfil profissional.
      await sendMail(
        menteeEmail,
        emailMentorshipAccepted({
          otherName: mentorProfile?.display_name ?? "seu mentor",
          otherEmail: mentorPro?.consent_contact ? (mentorPro.contact_email ?? mentorEmail) : null,
          area,
          reply: m.reply,
        }),
      );
      await sendMail(
        mentorEmail,
        emailMentorshipAccepted({
          otherName: menteeProfile?.display_name ?? "o pai mentorado",
          otherEmail: menteeEmail,
          area,
          reply: null,
        }),
      );
    }
    return m;
  });

/* ======================= Denúncia (anônimo ou logado) ======================= */

export const reportEntity = createServerFn({ method: "POST" })
  .inputValidator(reportSchema)
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    if (data.website) return { ok: true };
    await assertTurnstile(data.turnstile_token);
    const srv = await import("@/lib/newsletter.server");
    if (!srv.checkRateLimit("pip-report", await clientIp()))
      throw new Error("Muitas denúncias em pouco tempo. Tente mais tarde.");
    // Logado: usa o token para o anti-flood por usuário (auth.uid() dentro da RPC); anônimo: client público.
    let db: SupabaseClient = await createReadOnlySupabaseClient();
    try {
      const { getRequest } = await import("@tanstack/react-start/server");
      const auth = getRequest().headers.get("authorization");
      const url = process.env["VITE_SUPABASE_URL"];
      const key = process.env["VITE_SUPABASE_ANON_KEY"];
      if (auth?.startsWith("Bearer ") && auth.split(".").length === 3 && url && key) {
        const { createClient } = await import("@supabase/supabase-js");
        db = createClient(url, key, {
          global: { headers: { Authorization: auth } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
      }
    } catch {
      /* segue anônimo */
    }
    const { error } = await raw(db).rpc("report_entity", {
      p_entity: data.entity,
      p_entity_id: data.entity_id,
      p_reason: data.reason,
      p_note: data.note || null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ======================= Admin: fila, moderação e bloqueio ======================= */

export const getModerationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ModerationQueue> => {
    const sb = raw(context.supabase);
    const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const list = async <T>(table: string, order: (q: any) => unknown): Promise<T[]> => {
      try {
        const { data, error } = await (order(sb.from(table).select("*")) as Promise<{
          data: T[] | null;
          error: unknown;
        }>);
        if (error) throw error;
        return data ?? [];
      } catch (error) {
        console.error("[pai-indica-pai] fila", table, error);
        return [];
      }
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byQueue = (q: any) =>
      q
        .order("auto_hidden", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(300);
    const [jobs, referrals, professionals, mentorships, reports, blockedRows] = await Promise.all([
      list<JobRow>("jobs", byQueue),
      list<ReferralRow>("job_referrals", byQueue),
      list<ProfessionalRow>("professionals", byQueue),
      list<MentorshipRow>("mentorships", (q) =>
        q.order("created_at", { ascending: false }).limit(200),
      ),
      list<ModerationLogRow>("moderation_log", (q) =>
        q
          .in("action", ["report", "auto_hide", "review"])
          .order("created_at", { ascending: false })
          .limit(200),
      ),
      list<{ id: string; display_name: string; blocked_at: string; blocked_reason: string | null }>(
        "profiles",
        (q) => q.not("blocked_at", "is", null).order("blocked_at", { ascending: false }).limit(100),
      ),
    ]);
    const authorIds = new Set<string>();
    for (const j of jobs) if (j.posted_by) authorIds.add(j.posted_by);
    for (const r of referrals) if (r.referred_by) authorIds.add(r.referred_by);
    for (const p of professionals) authorIds.add(p.user_id);
    for (const m of mentorships) {
      authorIds.add(m.mentor_id);
      authorIds.add(m.mentee_id);
    }
    const authors: Record<string, string> = {};
    if (authorIds.size) {
      const { data } = await sb
        .from("profiles")
        .select("id, display_name")
        .in("id", [...authorIds]);
      for (const p of (data ?? []) as { id: string; display_name: string }[])
        authors[p.id] = p.display_name;
    }
    const all = [...jobs, ...referrals, ...professionals];
    const metrics = {
      pending: all.filter((x) => x.status === "pending").length,
      approved7d: all.filter((x) => x.status === "approved" && (x.moderated_at ?? "") >= since7)
        .length,
      rejected7d: all.filter((x) => x.status === "rejected" && (x.moderated_at ?? "") >= since7)
        .length,
      activeJobs: jobs.filter(
        (j) => j.status === "approved" && new Date(j.expires_at).getTime() > Date.now(),
      ).length,
      views: jobs.reduce((a, j) => a + (j.views ?? 0), 0),
      applyClicks: jobs.reduce((a, j) => a + (j.apply_clicks ?? 0), 0),
    };
    return {
      jobs,
      referrals,
      professionals,
      mentorships,
      reports,
      blocked: blockedRows,
      authors,
      metrics,
    };
  });

/** Aprova/rejeita via moderate_job / moderate_referral / moderate_professional (gravam em moderation_log) e avisa o autor. */
export const moderateEntity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(moderateSchema)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sb = raw(context.supabase);
    const reason = data.reason || null;
    let row: {
      title?: string;
      profession?: string;
      slug: string;
      posted_by?: string | null;
      referred_by?: string | null;
      user_id?: string;
      expires_at?: string | null;
    } | null = null;
    if (data.entity === "job") {
      const { error } = await sb.rpc("moderate_job", {
        p_job_id: data.id,
        p_action: data.status === "approved" ? "approve" : "reject",
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      const { data: j } = await sb
        .from("jobs")
        .select("title, slug, posted_by, expires_at")
        .eq("id", data.id)
        .maybeSingle();
      row = j;
    } else {
      const fn = data.entity === "job_referral" ? "moderate_referral" : "moderate_professional";
      const { data: r, error } = await sb.rpc(fn, {
        p_id: data.id,
        p_status: data.status,
        p_reason: reason,
      });
      if (error) throw new Error(error.message);
      row = r;
    }
    const authorId = row?.posted_by ?? row?.referred_by ?? row?.user_id ?? null;
    if (row && authorId) {
      await sendMail(
        await userEmail(authorId),
        emailModerated({
          entity: data.entity,
          title: row.title ?? row.profession ?? "",
          slug: row.slug,
          status: data.status,
          reason,
          expiresAt: row.expires_at ?? null,
        }),
      );
    }
    return { ok: true };
  });

export const blockUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(blockSchema)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await raw(context.supabase).rpc("block_user", {
      p_user_id: data.user_id,
      p_reason: data.reason,
      p_block: data.block,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Denúncia revisada: grava `review` em moderation_log (policy "moderation: staff insert"). */
export const markReportReviewed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ entity: z.string().max(40), entity_id: z.string().max(80) }))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await raw(context.supabase).from("moderation_log").insert({
      entity: data.entity,
      entity_id: data.entity_id,
      action: "review",
      actor_id: context.userId,
      note: "denúncia revisada",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ======================= Alertas de vagas por e-mail (doc 08 §5.1) ======================= */

export const saveJobAlerts = createServerFn({ method: "POST" })
  .inputValidator(alertsSchema)
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    const generic =
      "Pronto. Se o e-mail ainda não estiver confirmado, enviamos um link de confirmação.";
    if (data.website) return { ok: true, message: generic };
    await assertTurnstile(data.turnstile_token);
    const srv = await import("@/lib/newsletter.server");
    if (!srv.checkRateLimit("pip-alerts", await clientIp()))
      return { ok: false, message: "Muitas tentativas. Tente de novo em uma hora." };
    const svc = await serviceClient();
    if (!svc) return { ok: false, message: "Banco ainda não configurado. Tente mais tarde." };
    try {
      const { token } = await srv.upsertPendingSubscriber(data.email, "pai-indica-pai");
      const email = data.email.trim().toLowerCase();
      const { data: row } = await raw(svc)
        .from("newsletter_subscribers")
        .select("segments")
        .eq("email", email)
        .maybeSingle();
      const segments = {
        ...((row?.segments as Record<string, unknown>) ?? {}),
        vagas: { ufs: data.ufs, areas: data.areas, remoto: data.remoto, freq: "diario" },
      };
      await raw(svc).from("newsletter_subscribers").update({ segments }).eq("email", email);
      if (token) await srv.sendEmail({ to: email, ...srv.buildConfirmEmail(token) });
      return { ok: true, message: generic };
    } catch (error) {
      console.error("[pai-indica-pai] alertas", error);
      return { ok: false, message: "Não foi possível salvar agora. Tente de novo em instantes." };
    }
  });

export const cancelJobAlerts = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.email() }))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const svc = await serviceClient();
    if (!svc) return { ok: false };
    const email = data.email.trim().toLowerCase();
    const { data: row } = await raw(svc)
      .from("newsletter_subscribers")
      .select("segments")
      .eq("email", email)
      .maybeSingle();
    if (!row) return { ok: true };
    const { vagas: _v, ...rest } = (row.segments as Record<string, unknown>) ?? {};
    await raw(svc).from("newsletter_subscribers").update({ segments: rest }).eq("email", email);
    return { ok: true };
  });

/** Lista de áreas para o datalist das preferências (evita importar a taxonomia inteira na rota). */
export const jobAreaOptions = Object.entries(JOB_AREAS) as [keyof typeof JOB_AREAS, string][];
export const pipSiteUrl = SITE_URL;
