// Helpers do navegador (client autenticado, RLS): minhas publicações, renovar, excluir,
// salvar vaga, métricas e tradução de erros do banco para PT-BR (doc 08 §4.5).
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/ga4";
import type { JobRow, MentorshipRow, ProfessionalRow, ReferralRow } from "./types";

// Os tipos gerados do Supabase são antigos (sem jobs/professionals): usamos o client sem genérico.
/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = supabase as unknown as {
  from: (t: string) => any;
  rpc: (f: string, a?: unknown) => any;
  auth: SupabaseClient["auth"];
};
/* eslint-enable @typescript-eslint/no-explicit-any */

const ERROR_MAP: Array<[RegExp, string]> = [
  [/LIMITE_DIARIO/i, "Você já publicou 3 itens nas últimas 24 horas. Tente novamente amanhã."],
  [/CONTEUDO_BLOQUEADO/i, "O texto contém um termo ou link não permitido pelo código de conduta."],
  [/TURNSTILE_FALHOU/i, "Não foi possível confirmar que você não é um robô. Tente de novo."],
  [/jobs_title_company_active_uniq/i, "Já existe uma vaga ativa com este título nesta empresa."],
  [/jobs_location/i, "Informe cidade e UF ou marque a vaga como remota."],
  [/jobs_contact/i, "Informe ao menos um contato: e-mail, link ou WhatsApp."],
  [/mentorships_active_pair_uniq/i, "Você já tem um pedido ativo com este mentor."],
  [
    /row-level security|RLS/i,
    "Sem permissão. Confirme seu e-mail e verifique se sua conta não está bloqueada.",
  ],
  [/NAO_AUTENTICADO|Unauthorized|No authorization/i, "Faça login para continuar."],
  [/SEM_PERMISSAO/i, "Ação restrita à equipe de moderação."],
  [/MOTIVO_OBRIGATORIO/i, "Informe o motivo da rejeição (mín. 10 caracteres)."],
  [/AINDA_NAO_RENOVAVEL/i, "Esta vaga só pode ser renovada a 7 dias do fim do prazo."],
  [/EXPIRADA_HA_MUITO_TEMPO/i, "Vaga encerrada há mais de 30 dias: publique uma nova."],
  [/SO_APROVADA_OU_EXPIRADA/i, "Só vagas aprovadas ou encerradas podem ser renovadas."],
  [/NAO_ENCONTRADA/i, "Registro não encontrado."],
  [/Missing Supabase environment/i, "Banco ainda não configurado. Tente mais tarde."],
];

export function translatePipError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === "string" ? e : JSON.stringify(e ?? "");
  for (const [re, text] of ERROR_MAP) if (re.test(msg)) return text;
  return msg && msg.length < 160
    ? msg
    : "Não foi possível concluir agora. Tente de novo em instantes.";
}

/* ---------------- Métricas ---------------- */

export async function trackJobView(job: {
  id: string;
  area: string | null;
  uf: string | null;
  remote: boolean;
}) {
  if (typeof window === "undefined") return;
  const k = `job_view_${job.id}`;
  try {
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* sem sessionStorage: conta mesmo assim */
  }
  trackEvent("job_view", { job_id: job.id, area: job.area, uf: job.uf, remote: job.remote });
  try {
    await sb.rpc("increment_job_views", { p_job_id: job.id });
  } catch {
    /* métrica nunca quebra a página */
  }
}

export async function trackJobApply(jobId: string, channel: "email" | "url" | "whatsapp") {
  trackEvent("job_apply_click", { job_id: jobId, channel });
  try {
    await sb.rpc("track_job_apply_click", { p_job_id: jobId });
  } catch {
    /* idem */
  }
}

/* ---------------- Minhas publicações ---------------- */

export async function fetchMyJobs(userId: string): Promise<JobRow[]> {
  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .eq("posted_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobRow[];
}

export async function fetchMyReferrals(userId: string): Promise<ReferralRow[]> {
  const { data, error } = await sb
    .from("job_referrals")
    .select("*")
    .eq("referred_by", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReferralRow[];
}

export async function fetchMyProfessional(userId: string): Promise<ProfessionalRow | null> {
  const { data, error } = await sb
    .from("professionals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfessionalRow | null) ?? null;
}

export async function renewJob(id: string): Promise<JobRow> {
  const { data, error } = await sb.rpc("renew_job", { p_job_id: id });
  if (error) throw error;
  return data as JobRow;
}

export async function renewReferral(id: string): Promise<ReferralRow> {
  const { data, error } = await sb.rpc("renew_referral", { p_id: id });
  if (error) throw error;
  return data as ReferralRow;
}

/** Remoção a pedido (LGPD): hard delete pelo autor. */
export async function deleteJob(id: string) {
  const { error } = await sb.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteReferral(id: string) {
  const { error } = await sb.from("job_referrals").delete().eq("id", id);
  if (error) throw error;
}

export async function archiveProfessional(id: string) {
  const { error } = await sb.from("professionals").update({ status: "archived" }).eq("id", id);
  if (error) throw error;
}

/* ---------------- Salvar vaga (saved_items, item_type='job') ---------------- */

export async function isJobSaved(userId: string, jobId: string): Promise<boolean> {
  const { data } = await sb
    .from("saved_items")
    .select("id")
    .eq("user_id", userId)
    .eq("item_type", "job")
    .eq("item_id", jobId)
    .maybeSingle();
  return Boolean(data);
}

export async function toggleSaveJob(userId: string, jobId: string): Promise<boolean> {
  if (await isJobSaved(userId, jobId)) {
    const { error } = await sb
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .eq("item_type", "job")
      .eq("item_id", jobId);
    if (error) throw error;
    return false;
  }
  const { error } = await sb
    .from("saved_items")
    .insert({ user_id: userId, item_type: "job", item_id: jobId });
  if (error) throw error;
  return true;
}

/* ---------------- E-mail verificado ---------------- */

export async function resendConfirmation(email: string) {
  const { error } = await sb.auth.resend({ type: "signup", email });
  if (error) throw error;
}

/* ---------------- Mentoria (minha conta) ---------------- */

export async function fetchMyMentorships(
  userId: string,
): Promise<{ asMentor: MentorshipRow[]; asMentee: MentorshipRow[] }> {
  const [{ data: a }, { data: b }] = await Promise.all([
    sb
      .from("mentorships")
      .select("*")
      .eq("mentor_id", userId)
      .order("created_at", { ascending: false }),
    sb
      .from("mentorships")
      .select("*")
      .eq("mentee_id", userId)
      .order("created_at", { ascending: false }),
  ]);
  return { asMentor: (a ?? []) as MentorshipRow[], asMentee: (b ?? []) as MentorshipRow[] };
}

export async function cancelMentorship(id: string) {
  const { error } = await sb.from("mentorships").update({ status: "cancelled" }).eq("id", id);
  if (error) throw error;
}
