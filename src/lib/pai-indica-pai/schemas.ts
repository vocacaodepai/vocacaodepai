// Schemas zod (v4) do Pai Indica Pai — doc 08 §4.1. Compartilhados pelo formulário
// (react-hook-form) e pelas server functions (inputValidator).
import { z } from "zod";
import {
  JOB_AREAS,
  JOB_ORDERS,
  JOB_TYPES,
  MENTORSHIP_AREAS,
  REFERRAL_KINDS,
  REPORT_REASONS,
  UFS,
} from "./taxonomies";

const key = <T extends Record<string, string>>(o: T) =>
  z.enum(Object.keys(o) as [keyof T & string, ...(keyof T & string)[]]);

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const phoneBR = z
  .string()
  .trim()
  .regex(/^\+?(55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido (DDD + número)")
  .optional()
  .or(z.literal(""));
const urlHttp = z
  .string()
  .trim()
  .regex(/^https?:\/\/[^\s/$.?#].[^\s]*$/i, "Link inválido (comece com http:// ou https://)")
  .max(500)
  .optional()
  .or(z.literal(""));
const emailOpt = z.email("E-mail inválido").optional().or(z.literal(""));
const money = z
  .union([z.literal(""), z.coerce.number().min(0).max(1_000_000)])
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

/** Campos comuns antifraude: código de conduta, Turnstile (opcional sem chave) e honeypot. */
const guard = {
  accept_conduct: z.literal(true, { error: "Você precisa aceitar o código de conduta" }),
  turnstile_token: z.string().optional().default(""),
  /** Honeypot: humano não vê; robô preenche. */
  website: z.string().optional().default(""),
};

export const jobSchema = z
  .object({
    title: z.string().trim().min(5, "Mínimo 5 caracteres").max(120, "Máximo 120 caracteres"),
    company: z.string().trim().min(2, "Informe a empresa").max(120),
    type: key(JOB_TYPES),
    area: key(JOB_AREAS),
    remote: z.boolean().default(false),
    city: optionalText(80),
    uf: z.enum(UFS).optional().or(z.literal("")),
    salary_min: money,
    salary_max: money,
    description: z
      .string()
      .trim()
      .min(100, "Descreva a vaga com pelo menos 100 caracteres")
      .max(8000, "Máximo 8.000 caracteres"),
    how_to_apply: z
      .string()
      .trim()
      .min(10, "Explique como se candidatar (mín. 10 caracteres)")
      .max(2000),
    contact_email: emailOpt,
    contact_url: urlHttp,
    contact_phone: phoneBR,
    consent_contact: z.boolean().default(false),
    ...guard,
  })
  .superRefine((v, ctx) => {
    if (!v.remote && (!v.city || !v.uf))
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Informe cidade e UF ou marque Remoto",
      });
    if (!v.contact_email && !v.contact_url && !v.contact_phone)
      ctx.addIssue({
        code: "custom",
        path: ["contact_email"],
        message: "Informe ao menos um contato",
      });
    if (v.salary_min && v.salary_max && v.salary_min > v.salary_max)
      ctx.addIssue({ code: "custom", path: ["salary_max"], message: "Máximo menor que o mínimo" });
    if ((v.contact_email || v.contact_phone) && !v.consent_contact)
      ctx.addIssue({
        code: "custom",
        path: ["consent_contact"],
        message: "Para exibir e-mail/telefone, autorize a publicação do contato",
      });
  });
export type JobInput = z.input<typeof jobSchema>;
export type JobOutput = z.output<typeof jobSchema>;

export const referralSchema = z
  .object({
    kind: key(REFERRAL_KINDS),
    title: z.string().trim().min(3, "Mínimo 3 caracteres").max(120),
    category: z.string().trim().min(2, "Informe a categoria").max(60),
    city: optionalText(80),
    uf: z.enum(UFS).optional().or(z.literal("")),
    description: z
      .string()
      .trim()
      .min(50, "Conte por que você indica (mín. 50 caracteres)")
      .max(4000),
    contact_phone: phoneBR,
    contact_email: emailOpt,
    contact_url: urlHttp,
    consent_contact: z.boolean().default(false),
    ...guard,
  })
  .superRefine((v, ctx) => {
    if (!v.contact_email && !v.contact_url && !v.contact_phone)
      ctx.addIssue({
        code: "custom",
        path: ["contact_email"],
        message: "Informe ao menos um contato",
      });
    if ((v.contact_email || v.contact_phone) && !v.consent_contact)
      ctx.addIssue({
        code: "custom",
        path: ["consent_contact"],
        message: "Para exibir e-mail/telefone, autorize a publicação do contato",
      });
  });
export type ReferralInput = z.input<typeof referralSchema>;
export type ReferralOutput = z.output<typeof referralSchema>;

export const professionalSchema = z
  .object({
    profession: z.string().trim().min(3, "Mínimo 3 caracteres").max(80),
    area: key(JOB_AREAS),
    description: z.string().trim().min(50, "Apresente seu trabalho (mín. 50 caracteres)").max(3000),
    city: optionalText(80),
    uf: z.enum(UFS).optional().or(z.literal("")),
    remote: z.boolean().default(false),
    contact_phone: phoneBR,
    contact_email: emailOpt,
    contact_url: urlHttp,
    consent_contact: z.boolean().default(false),
    is_mentor: z.boolean().default(false),
    mentor_areas: z.array(key(MENTORSHIP_AREAS)).max(4, "No máximo 4 áreas").default([]),
    mentor_capacity: z.coerce.number().int().min(0).max(10).default(2),
    ...guard,
  })
  .superRefine((v, ctx) => {
    if (v.is_mentor && v.mentor_areas.length === 0)
      ctx.addIssue({
        code: "custom",
        path: ["mentor_areas"],
        message: "Escolha ao menos uma área de mentoria",
      });
    if ((v.contact_email || v.contact_phone) && !v.consent_contact)
      ctx.addIssue({
        code: "custom",
        path: ["consent_contact"],
        message: "Para exibir e-mail/telefone, autorize a publicação do contato",
      });
  });
export type ProfessionalInput = z.input<typeof professionalSchema>;
export type ProfessionalOutput = z.output<typeof professionalSchema>;

export const mentorshipRequestSchema = z.object({
  mentor_id: z.uuid(),
  area: key(MENTORSHIP_AREAS),
  message: z
    .string()
    .trim()
    .min(30, "Conte um pouco do seu momento (mín. 30 caracteres)")
    .max(1500),
  share_contact: z.literal(true, {
    error: "Precisamos compartilhar seu e-mail com o mentor se ele aceitar",
  }),
  website: z.string().optional().default(""),
});
export type MentorshipRequestInput = z.input<typeof mentorshipRequestSchema>;
export type MentorshipRequestOutput = z.output<typeof mentorshipRequestSchema>;

export const reportSchema = z.object({
  entity: z.enum(["job", "job_referral", "professional"]),
  entity_id: z.uuid(),
  reason: key(REPORT_REASONS),
  note: z.string().trim().max(500).optional().or(z.literal("")),
  turnstile_token: z.string().optional().default(""),
  website: z.string().optional().default(""),
});
export type ReportInput = z.infer<typeof reportSchema>;

export const moderateSchema = z
  .object({
    entity: z.enum(["job", "job_referral", "professional"]),
    id: z.uuid(),
    status: z.enum(["approved", "rejected"]),
    reason: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((v) => v.status === "approved" || (v.reason ?? "").length >= 10, {
    path: ["reason"],
    message: "Informe o motivo da rejeição (mín. 10 caracteres)",
  });
export type ModerateInput = z.infer<typeof moderateSchema>;

export const blockSchema = z.object({
  user_id: z.uuid(),
  reason: z.string().trim().min(10, "Mínimo 10 caracteres").max(500),
  block: z.boolean().default(true),
});

/** Search params de /pai-indica-pai/vagas (validateSearch). Tudo opcional; página 1 por padrão. */
export const jobsSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  uf: z.enum(UFS).optional().catch(undefined),
  cidade: z.string().trim().max(80).optional().catch(undefined),
  remoto: z.coerce.boolean().optional().catch(undefined),
  tipo: key(JOB_TYPES).optional().catch(undefined),
  area: key(JOB_AREAS).optional().catch(undefined),
  ordem: key(JOB_ORDERS).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
});
export type JobsSearch = z.infer<typeof jobsSearchSchema>;

export const professionalsSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  area: key(JOB_AREAS).optional().catch(undefined),
  uf: z.enum(UFS).optional().catch(undefined),
  cidade: z.string().trim().max(80).optional().catch(undefined),
  remoto: z.coerce.boolean().optional().catch(undefined),
  mentor: z.coerce.boolean().optional().catch(undefined),
});
export type ProfessionalsSearch = z.infer<typeof professionalsSearchSchema>;

export const referralsSearchSchema = z.object({
  tipo: key(REFERRAL_KINDS).optional().catch(undefined),
  uf: z.enum(UFS).optional().catch(undefined),
  cidade: z.string().trim().max(80).optional().catch(undefined),
  categoria: z.string().trim().max(60).optional().catch(undefined),
});
export type ReferralsSearch = z.infer<typeof referralsSearchSchema>;

export const mentorsSearchSchema = z.object({
  area: key(MENTORSHIP_AREAS).optional().catch(undefined),
});
export type MentorsSearch = z.infer<typeof mentorsSearchSchema>;

/** Preferências de alerta de vagas (doc 08 §5.1) → newsletter_subscribers.segments.vagas. */
export const alertsSchema = z.object({
  email: z.email("Informe um e-mail válido"),
  ufs: z.array(z.enum(UFS)).max(27).default([]),
  areas: z.array(key(JOB_AREAS)).max(14).default([]),
  remoto: z.boolean().default(true),
  turnstile_token: z.string().optional().default(""),
  website: z.string().optional().default(""),
});
export type AlertsInput = z.infer<typeof alertsSchema>;
