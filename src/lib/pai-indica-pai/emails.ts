// Templates de e-mail do Pai Indica Pai (doc 08 §4, §5). Sem segredo aqui: quem envia é
// `sendEmail` de src/lib/newsletter.server.ts (Resend por HTTP, remetente contato@).
import { SITE_NAME, SITE_URL, formatDateShort } from "@/lib/site";
import { AVISO_ANTIFRAUDE, JOB_AREAS, JOB_TYPES } from "./taxonomies";
import type { JobPublic } from "./types";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

function layout(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F4EFE6;font-family:Inter,Arial,sans-serif;color:#1B1F23">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:8px;padding:32px">
<tr><td style="font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-size:28px;font-weight:700;color:#14505C;padding-bottom:4px">${esc(SITE_NAME)}</td></tr>
<tr><td style="font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-size:20px;font-weight:600;color:#1F2429;padding-bottom:16px">${esc(title)}</td></tr>
${bodyHtml}
<tr><td style="font-size:12px;color:#777;padding-top:24px;border-top:1px solid #DED7CA">${esc(AVISO_ANTIFRAUDE)}<br><br>${esc(SITE_NAME)} — Para o homem que segura a casa. Pai Indica Pai: um pai ajuda outro pai a sustentar a família.</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (s: string) =>
  `<tr><td style="font-size:16px;line-height:1.6;padding-bottom:12px">${s}</td></tr>`;
const button = (href: string, label: string) =>
  `<tr><td style="padding:8px 0 20px"><a href="${href}" style="display:inline-block;background:#D9822B;color:#FFFFFF;text-decoration:none;font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-size:18px;font-weight:600;padding:12px 24px;border-radius:8px">${esc(label)}</a></td></tr>`;

const ENTITY_LABEL: Record<string, string> = {
  job: "vaga",
  job_referral: "indicação",
  professional: "perfil de Pai Profissional",
};

const ENTITY_PATH: Record<string, string> = {
  job: "/pai-indica-pai/vagas",
  job_referral: "/pai-indica-pai/indicacoes",
  professional: "/pai-indica-pai/profissionais",
};

/** "Recebemos sua vaga/indicação/perfil": vai para a fila de moderação. */
export function emailReceived(input: { entity: string; title: string }): EmailContent {
  const label = ENTITY_LABEL[input.entity] ?? "publicação";
  const subject = `Recebemos sua ${label}: ${input.title}`;
  const text = [
    `Recebemos sua ${label} "${input.title}" no Pai Indica Pai.`,
    "",
    "Ela passa por moderação humana em até 48 horas. Você recebe outro e-mail quando for ao ar ou se precisar de ajuste.",
    "",
    `Acompanhe em ${SITE_URL}/minha-conta`,
    "",
    AVISO_ANTIFRAUDE,
  ].join("\n");
  const html = layout(
    `Recebemos sua ${label}`,
    p(`Sua ${label} <strong>${esc(input.title)}</strong> chegou e entrou na fila de moderação.`) +
      p(
        "Um pai da equipe revisa em até 48 horas. Você recebe outro e-mail quando ela for ao ar ou se precisar de ajuste.",
      ) +
      button(`${SITE_URL}/minha-conta`, "Acompanhar na Área do Pai"),
  );
  return { subject, html, text };
}

/** Aprovada ou rejeitada (com motivo). Aprovada: link + "Compartilhar no WhatsApp". */
export function emailModerated(input: {
  entity: string;
  title: string;
  slug: string;
  status: "approved" | "rejected";
  reason?: string | null;
  expiresAt?: string | null;
}): EmailContent {
  const label = ENTITY_LABEL[input.entity] ?? "publicação";
  const path = ENTITY_PATH[input.entity] ?? "/pai-indica-pai";
  const url =
    input.entity === "professional"
      ? `${SITE_URL}${path}/${input.slug}`
      : `${SITE_URL}${path}/${input.slug}`;
  if (input.status === "approved") {
    const until = input.expiresAt ? ` até ${formatDateShort(input.expiresAt)}` : "";
    const subject = `Sua ${label} está no ar${until}: ${input.title}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(`${input.title} — ${url} (via ${SITE_NAME})`)}`;
    const text = [
      `Sua ${label} "${input.title}" foi aprovada e está no ar${until}.`,
      "",
      url,
      "",
      `Compartilhe no WhatsApp: ${wa}`,
      "",
      AVISO_ANTIFRAUDE,
    ].join("\n");
    const html = layout(
      `Sua ${label} está no ar${until}`,
      p(`<strong>${esc(input.title)}</strong> foi aprovada. Obrigado por ajudar outro pai.`) +
        button(url, `Ver ${label}`) +
        p(
          `Quer alcançar mais pais? <a href="${wa}" style="color:#14505C">Compartilhe no WhatsApp</a>.`,
        ),
    );
    return { subject, html, text };
  }
  const subject = `Sua ${label} precisa de ajuste: ${input.title}`;
  const reason = input.reason ?? "Não atende ao código de conduta do Pai Indica Pai.";
  const text = [
    `Sua ${label} "${input.title}" não foi aprovada.`,
    "",
    `Motivo: ${reason}`,
    "",
    `Você pode ajustar e enviar de novo em ${SITE_URL}/minha-conta`,
    "",
    AVISO_ANTIFRAUDE,
  ].join("\n");
  const html = layout(
    `Sua ${label} precisa de ajuste`,
    p(`<strong>${esc(input.title)}</strong> não foi aprovada desta vez.`) +
      p(`<strong>Motivo:</strong> ${esc(reason)}`) +
      p(
        "Ajuste o que foi apontado e envie de novo. A moderação existe para proteger os pais que confiam na rede.",
      ) +
      button(`${SITE_URL}/minha-conta`, "Ajustar na Área do Pai"),
  );
  return { subject, html, text };
}

/** Digest diário: vagas novas da UF/área do assinante (doc 08 §5.2). */
export function emailJobsDigest(input: { jobs: JobPublic[]; email: string }): EmailContent {
  const n = input.jobs.length;
  const subject = `${n} ${n === 1 ? "nova vaga" : "novas vagas"} para você — Pai Indica Pai`;
  const list = input.jobs
    .map((j) => {
      const local = j.remote ? "Remoto — Brasil" : `${j.city}/${j.uf}`;
      const meta = [JOB_TYPES[j.type], j.area ? JOB_AREAS[j.area] : null]
        .filter(Boolean)
        .join(" · ");
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #EEE8DA"><a href="${SITE_URL}/pai-indica-pai/vagas/${j.slug}" style="font-size:16px;font-weight:700;color:#14505C;text-decoration:none">${esc(j.title)}</a><br><span style="font-size:14px;color:#555">${esc(j.company)} · ${esc(local)} · ${esc(meta)}</span></td></tr>`;
    })
    .join("");
  const text = [
    `${n} ${n === 1 ? "nova vaga" : "novas vagas"} no Pai Indica Pai:`,
    "",
    ...input.jobs.map(
      (j) =>
        `- ${j.title} — ${j.company} (${j.remote ? "Remoto" : `${j.city}/${j.uf}`}): ${SITE_URL}/pai-indica-pai/vagas/${j.slug}`,
    ),
    "",
    `Ver todas: ${SITE_URL}/pai-indica-pai/vagas`,
    `Cancelar alertas de vagas: ${SITE_URL}/pai-indica-pai?alertas=cancelar&email=${encodeURIComponent(input.email)}`,
    "",
    AVISO_ANTIFRAUDE,
  ].join("\n");
  const html = layout(
    "Vagas novas na sua região",
    p("Vagas aprovadas nas últimas 24 horas que batem com a sua UF e área:") +
      list +
      button(`${SITE_URL}/pai-indica-pai/vagas`, "Ver todas as vagas") +
      p(
        `<span style="font-size:13px;color:#777">Não quer mais receber? <a href="${SITE_URL}/pai-indica-pai?alertas=cancelar&email=${encodeURIComponent(input.email)}" style="color:#14505C">Cancelar alertas de vagas</a>.</span>`,
      ),
  );
  return { subject, html, text };
}

/** Pedido de mentoria recebido (vai para o mentor). */
export function emailMentorshipRequested(input: {
  menteeName: string;
  area: string;
  message: string;
}): EmailContent {
  const subject = `Pedido de mentoria em ${input.area} — Pai Indica Pai`;
  const text = [
    `${input.menteeName} pediu sua mentoria em ${input.area}.`,
    "",
    `"${input.message}"`,
    "",
    `Aceite ou recuse em ${SITE_URL}/minha-conta?tab=mentoria`,
  ].join("\n");
  const html = layout(
    "Um pai pediu sua mentoria",
    p(
      `<strong>${esc(input.menteeName)}</strong> pediu sua orientação em <strong>${esc(input.area)}</strong>:`,
    ) +
      p(`<em>${esc(input.message).replace(/\n/g, "<br>")}</em>`) +
      button(`${SITE_URL}/minha-conta?tab=mentoria`, "Responder ao pedido"),
  );
  return { subject, html, text };
}

/** Mentoria aceita: cada parte recebe o contato da outra (só com consentimento). */
export function emailMentorshipAccepted(input: {
  otherName: string;
  otherEmail: string | null;
  area: string;
  reply?: string | null;
}): EmailContent {
  const subject = `Mentoria em ${input.area} confirmada — Pai Indica Pai`;
  const contact = input.otherEmail
    ? `Contato: ${input.otherEmail}`
    : "O contato será combinado pela Área do Pai.";
  const text = [
    `A mentoria em ${input.area} com ${input.otherName} foi confirmada.`,
    input.reply ? `\nMensagem: "${input.reply}"` : "",
    "",
    contact,
    "",
    "Sugestão: uma conversa por semana, por 4 a 8 semanas. Não é terapia nem consultoria paga.",
  ].join("\n");
  const html = layout(
    "Mentoria confirmada",
    p(
      `A mentoria em <strong>${esc(input.area)}</strong> com <strong>${esc(input.otherName)}</strong> foi confirmada.`,
    ) +
      (input.reply ? p(`<em>${esc(input.reply)}</em>`) : "") +
      p(esc(contact)) +
      p(
        "Sugestão: uma conversa por semana, por 4 a 8 semanas. Não é terapia nem consultoria paga.",
      ),
  );
  return { subject, html, text };
}
