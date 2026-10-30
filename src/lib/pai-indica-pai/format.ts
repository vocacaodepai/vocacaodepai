// Helpers puros (cliente e servidor) do Pai Indica Pai: faixa salarial, prazo, local, slug.
import { slugify } from "@/lib/slugify";
import { JOB_AREAS, JOB_TYPES } from "./taxonomies";
import type { JobPublic } from "./types";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** "R$ 3.000 a R$ 4.500/mês", "a partir de R$ 3.000/mês", "até R$ 4.500/mês" ou "A combinar". */
export function formatSalaryRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return "A combinar";
  if (min && max) return `${brl(min)} a ${brl(max)}/mês`;
  return `${min ? "a partir de " + brl(min) : "até " + brl(max!)}/mês`;
}

export function daysUntil(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export function formatLocation(j: {
  remote: boolean;
  city: string | null;
  uf: string | null;
}): string {
  if (j.remote) return "Remoto — Brasil";
  if (j.city && j.uf) return `${j.city}/${j.uf}`;
  return j.uf ?? j.city ?? "Brasil";
}

export function jobTypeLabel(t: string): string {
  return (JOB_TYPES as Record<string, string>)[t] ?? t;
}

export function jobAreaLabel(a: string | null | undefined): string {
  if (!a) return "";
  return (JOB_AREAS as Record<string, string>)[a] ?? a;
}

/** "há 3 dias" / "hoje" / "há 2 h". */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 30) return `há ${d} dias`;
  const m = Math.floor(d / 30);
  return m === 1 ? "há 1 mês" : `há ${m} meses`;
}

/** Slug único: slugify(base) + sufixo base36 de 4 caracteres (doc 08 §4). */
export function makeSlug(base: string): string {
  const core = slugify(base).slice(0, 80) || "item";
  const suffix = Math.random().toString(36).slice(2, 6).padEnd(4, "0");
  return `${core}-${suffix}`;
}

/** Link do WhatsApp para compartilhar uma vaga (doc 08 §3.3). */
export function whatsappShareUrl(
  job: Pick<JobPublic, "title" | "company" | "slug">,
  siteUrl: string,
) {
  const text = `Vaga: ${job.title} na ${job.company} — ${siteUrl}/pai-indica-pai/vagas/${job.slug} (via Vocação de Pai)`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** "(11) 99999-9999" → "5511999999999" para wa.me. */
export function whatsappNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") ? digits : `55${digits}`;
}

export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}
