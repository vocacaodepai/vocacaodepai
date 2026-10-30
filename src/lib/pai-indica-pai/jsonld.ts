// JSON-LD JobPosting (doc 08 §8.1) — só para vaga ao vivo (approved e não expirada).
// Campos obrigatórios do Google for Jobs: title, description, datePosted, hiringOrganization,
// jobLocation OU jobLocationType TELECOMMUTE (+ applicantLocationRequirements), validThrough.
import type { JobDetailData } from "./types";

const EMPLOYMENT: Record<string, string> = {
  clt: "FULL_TIME",
  pj: "CONTRACTOR",
  freela: "CONTRACTOR",
  estagio: "INTERN",
  temporario: "TEMPORARY",
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toHtml = (s: string) =>
  s
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

export function jobPostingJsonLd(job: JobDetailData["job"], url: string) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: toHtml(
      job.description + (job.how_to_apply ? "\n\nComo se candidatar:\n" + job.how_to_apply : ""),
    ),
    datePosted: (job.moderated_at ?? job.created_at).slice(0, 10),
    validThrough: job.expires_at,
    employmentType: EMPLOYMENT[job.type] ?? "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: job.company },
    identifier: { "@type": "PropertyValue", name: job.company, value: job.id },
    directApply: false,
    url,
  };
  if (job.remote) {
    ld.jobLocationType = "TELECOMMUTE";
    ld.applicantLocationRequirements = { "@type": "Country", name: "Brasil" };
  } else {
    ld.jobLocation = {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.city,
        addressRegion: job.uf,
        addressCountry: "BR",
      },
    };
  }
  if (job.salary_min || job.salary_max) {
    const value: Record<string, unknown> = { "@type": "QuantitativeValue", unitText: "MONTH" };
    if (job.salary_min) value.minValue = job.salary_min;
    if (job.salary_max) value.maxValue = job.salary_max;
    if (!(job.salary_min && job.salary_max)) value.value = job.salary_min ?? job.salary_max;
    ld.baseSalary = { "@type": "MonetaryAmount", currency: "BRL", value };
  }
  return ld;
}
