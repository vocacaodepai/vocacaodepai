import { createServerFn } from "@tanstack/react-start";
import { createReadOnlySupabaseClient } from "./seo.functions";
import { CONTACT_TO_EMAIL, RESEND_FROM, SITE_NAME } from "./site";

// Envio do formulário de contato (doc 03 §7). Roda no servidor:
// 1. grava sempre em public.contact_messages (RLS permite insert público;
//    com SUPABASE_SERVICE_ROLE_KEY usa a chave de serviço);
// 2. se RESEND_API_KEY existir, avisa o dono por e-mail via Resend;
//    sem a chave, a mensagem fica só no banco (visível no admin) e segue.
// A edge function notify-contact-message continua disponível para o trigger
// AFTER INSERT (pg_net) quando o dono configurar CONTACT_NOTIFY_SECRET no Vault.

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Campo-isca anti-spam: humano não vê; robô preenche. */
  website?: string;
}

export interface ContactResult {
  ok: boolean;
  saved: boolean;
  emailed: boolean;
  error?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateContact(input: ContactInput): string | null {
  if (input.name.length < 2 || input.name.length > 120) {
    return "Digite seu nome (2 a 120 caracteres).";
  }
  if (!EMAIL_RE.test(input.email) || input.email.length > 320) {
    return "Digite um e-mail válido.";
  }
  if (input.subject.length > 200) {
    return "O assunto pode ter no máximo 200 caracteres.";
  }
  if (input.message.length < 10) {
    return "Escreva pelo menos 10 caracteres na mensagem.";
  }
  if (input.message.length > 5000) {
    return "A mensagem pode ter no máximo 5.000 caracteres.";
  }
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function createContactClient() {
  const url = process.env["VITE_SUPABASE_URL"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (url && serviceKey) {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return createReadOnlySupabaseClient();
}

async function saveMessage(input: ContactInput): Promise<boolean> {
  const db = await createContactClient();
  const { error } = await db.from("contact_messages").insert({
    name: input.name,
    email: input.email,
    subject: input.subject || null,
    message: input.message,
  });
  if (error) {
    console.error("[contato] falha ao gravar contact_messages:", error.message);
    return false;
  }
  return true;
}

async function notifyByResend(input: ContactInput): Promise<boolean> {
  const key = process.env["RESEND_API_KEY"];
  if (!key) return false;
  const subject = input.subject || "(sem assunto)";
  const html = `
    <p><strong>Nome:</strong> ${escapeHtml(input.name)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(input.email)}</p>
    <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Mensagem:</strong></p>
    <p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>
  `;
  const text = `Nome: ${input.name}\nE-mail: ${input.email}\nAssunto: ${subject}\n\n${input.message}`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [CONTACT_TO_EMAIL],
        reply_to: input.email,
        subject: `Novo contato pelo site ${SITE_NAME}: ${subject}`,
        html,
        text,
      }),
    });
    if (!res.ok) {
      console.error("[contato] Resend respondeu", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[contato] falha ao chamar o Resend:", error);
    return false;
  }
}

export const sendContact = createServerFn({ method: "POST" })
  .inputValidator((data: ContactInput): ContactInput => ({
    name: String(data?.name ?? "").trim(),
    email: String(data?.email ?? "")
      .trim()
      .toLowerCase(),
    subject: String(data?.subject ?? "").trim(),
    message: String(data?.message ?? "").trim(),
    website: String(data?.website ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<ContactResult> => {
    // Robô que preencheu o campo-isca: responde "ok" sem gravar nada.
    if (data.website) return { ok: true, saved: false, emailed: false };

    const error = validateContact(data);
    if (error) return { ok: false, saved: false, emailed: false, error };

    const saved = await saveMessage(data);
    const emailed = await notifyByResend(data);
    if (!saved && !emailed) {
      return {
        ok: false,
        saved,
        emailed,
        error: "Não foi possível enviar agora. Tente de novo em instantes.",
      };
    }
    return { ok: true, saved, emailed };
  });
