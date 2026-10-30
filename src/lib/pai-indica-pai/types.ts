// Tipos locais do Pai Indica Pai (os tipos gerados do Supabase são antigos — doc 08 §4).
// Colunas = 0005_pai_indica_pai.sql + 0014_pai_indica_pai_extra.sql.
import type { JobArea, JobType, MentorshipArea, ReferralKind, UF } from "./taxonomies";

export type PipStatus = "pending" | "approved" | "rejected" | "expired";
export type ProfessionalStatus = "pending" | "approved" | "rejected" | "archived";
export type MentorshipStatus = "requested" | "accepted" | "declined" | "completed" | "cancelled";
export type PipEntity = "job" | "job_referral" | "professional";

/** Linha completa de `jobs` (só chega ao cliente filtrada por `safeJob`). */
export interface JobRow {
  id: string;
  slug: string;
  title: string;
  company: string;
  city: string | null;
  uf: UF | null;
  remote: boolean;
  type: JobType;
  area: JobArea | null;
  salary_min: number | null;
  salary_max: number | null;
  description: string;
  how_to_apply: string | null;
  contact_email: string | null;
  contact_url: string | null;
  contact_phone: string | null;
  consent_contact: boolean;
  status: PipStatus;
  rejection_reason: string | null;
  auto_hidden: boolean;
  report_count: number;
  renewed_count: number;
  expires_at: string;
  posted_by: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  views: number;
  apply_clicks: number;
  created_at: string;
  updated_at: string;
}

/** View `jobs_public` (listas, RSS, sitemap, digest). */
export interface JobPublic {
  id: string;
  slug: string;
  title: string;
  company: string;
  city: string | null;
  uf: UF | null;
  remote: boolean;
  type: JobType;
  area: JobArea | null;
  salary_min: number | null;
  salary_max: number | null;
  summary: string;
  expires_at: string;
  published_at: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

/** Vaga na página de detalhe: sem `posted_by`, contato só se consentido e ao vivo. */
export interface JobDetailData {
  job: Omit<JobRow, "posted_by" | "moderated_by" | "rejection_reason">;
  live: boolean;
  similar: JobPublic[];
}

export interface ReferralRow {
  id: string;
  slug: string;
  kind: ReferralKind;
  title: string;
  category: string;
  city: string | null;
  uf: UF | null;
  description: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_url: string | null;
  consent_contact: boolean;
  referred_by: string | null;
  status: PipStatus;
  rejection_reason: string | null;
  auto_hidden: boolean;
  report_count: number;
  renewed_count: number;
  expires_at: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  views: number;
  created_at: string;
  updated_at: string;
  /** Nome de exibição de quem indicou (via get_public_profile; nunca e-mail). */
  referrer_name?: string | null;
}

export interface ProfessionalRow {
  id: string;
  user_id: string;
  slug: string;
  profession: string;
  area: JobArea | null;
  description: string;
  city: string | null;
  uf: UF | null;
  remote: boolean;
  contact_phone: string | null;
  contact_email: string | null;
  contact_url: string | null;
  consent_contact: boolean;
  is_mentor: boolean;
  mentor_areas: MentorshipArea[];
  mentor_capacity: number;
  status: ProfessionalStatus;
  rejection_reason: string | null;
  auto_hidden: boolean;
  report_count: number;
  moderated_by: string | null;
  moderated_at: string | null;
  views: number;
  created_at: string;
  updated_at: string;
  /** Perfil público do pai (display_name/avatar/cidade), nunca e-mail. */
  profile?: { display_name: string; avatar_url: string | null } | null;
  /** Só na Mentoria: vagas livres = mentor_capacity - aceitas. */
  mentor_slots?: number;
}

export interface MentorshipRow {
  id: string;
  mentor_id: string;
  mentee_id: string;
  area: MentorshipArea;
  status: MentorshipStatus;
  message: string;
  reply: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModerationLogRow {
  id: string;
  actor_id: string | null;
  entity: string;
  entity_id: string;
  action: string;
  note: string | null;
  created_at: string;
}

export interface JobsListData {
  items: JobPublic[];
  total: number;
  page: number;
  perPage: number;
  /** Cidades distintas das vagas aprovadas (datalist do filtro). */
  cities: string[];
}

export interface PipHubData {
  counts: { jobs: number; referrals: number; professionals: number; mentors: number };
  latestJobs: JobPublic[];
  professionals: ProfessionalRow[];
}

export interface ModerationQueue {
  jobs: JobRow[];
  referrals: ReferralRow[];
  professionals: ProfessionalRow[];
  mentorships: MentorshipRow[];
  reports: ModerationLogRow[];
  blocked: {
    id: string;
    display_name: string;
    blocked_at: string;
    blocked_reason: string | null;
  }[];
  authors: Record<string, string>;
  metrics: {
    pending: number;
    approved7d: number;
    rejected7d: number;
    activeJobs: number;
    views: number;
    applyClicks: number;
  };
}
