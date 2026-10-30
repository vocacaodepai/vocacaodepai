// Newsletter — lado do servidor (double opt-in, antispam, e-mail). Importar só de
// dentro de handlers (`await import("@/lib/newsletter.server")`): este módulo lê
// segredos de process.env e nunca pode ir para o bundle do cliente.
import { CONTACT_EMAIL, EMAIL_FROM, SITE_NAME, SITE_URL, VDM_NAME } from "@/lib/site";
import {
  VDM_NEWSLETTER_ENDPOINT,
  VDM_SPOUSE_SEGMENT,
  isValidEmail,
  normalizeEmail,
  type NewsletterSubscribeInput,
} from "@/lib/newsletter";

/* ---------------- Rate limit em memória (10 req/hora por IP e rota) ---------------- */

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** true = pode seguir; false = estourou o limite (responder 429). */
export function checkRateLimit(route: string, ip: string): boolean {
  const now = Date.now();
  const key = `${route}:${ip}`;
  const rec = buckets.get(key);
  if (!rec || rec.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    // limpeza preguiçosa para o Map não crescer sem limite
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
    }
    return true;
  }
  if (rec.count >= RATE_LIMIT) return false;
  rec.count++;
  return true;
}

/* ---------------- Honeypot + tempo mínimo ---------------- */

const MIN_FILL_MS = 2500;

export function looksLikeBot(input: NewsletterSubscribeInput): boolean {
  if (typeof input.website === "string" && input.website.trim() !== "") return true;
  if (typeof input.startedAt === "number" && Date.now() - input.startedAt < MIN_FILL_MS)
    return true;
  return false;
}

/* ---------------- Cloudflare Turnstile ---------------- */

/**
 * Valida o token no servidor. Sem TURNSTILE_SECRET_KEY, degrada para
 * honeypot + rate limit (doc 03 §4.6 item 4) e devolve true.
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/* ---------------- Resend ---------------- */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Envia via API HTTP do Resend (sem SDK: evita dependência nova).
 * Sem RESEND_API_KEY: registra no log e segue (o cadastro fica `pending`).
 */
export async function sendEmail(input: SendEmailInput): Promise<"sent" | "skipped" | "failed"> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    console.warn(
      "[newsletter] RESEND_API_KEY ausente — e-mail de confirmação não enviado para",
      input.to,
    );
    return "skipped";
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [input.to],
        reply_to: CONTACT_EMAIL,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      console.error("[newsletter] Resend respondeu", res.status, await res.text().catch(() => ""));
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("[newsletter] falha ao chamar o Resend", err);
    return "failed";
  }
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function confirmUrl(token: string): string {
  return `${SITE_URL}/api/newsletter/confirmar?token=${encodeURIComponent(token)}`;
}

export function buildConfirmEmail(token: string): { subject: string; html: string; text: string } {
  const url = confirmUrl(token);
  const subject = `Confirme sua inscrição no ${SITE_NAME}`;
  const text = [
    `Você pediu para receber a newsletter do ${SITE_NAME}.`,
    "",
    "Para confirmar, abra este link:",
    url,
    "",
    "Se não foi você, ignore este e-mail: nada será enviado sem a confirmação.",
    "",
    `${SITE_NAME} — Para o homem que segura a casa.`,
  ].join("\n");
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F4EFE6;font-family:Inter,Arial,sans-serif;color:#1B1F23">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:8px;padding:32px">
<tr><td style="font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-size:28px;font-weight:700;color:#14505C;padding-bottom:16px">${escapeHtml(SITE_NAME)}</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:16px">Você pediu para receber a newsletter do ${escapeHtml(SITE_NAME)}. Falta só um passo: confirmar que este e-mail é seu.</td></tr>
<tr><td style="padding:8px 0 24px"><a href="${url}" style="display:inline-block;background:#D9822B;color:#FFFFFF;text-decoration:none;font-family:'Barlow Condensed','Arial Narrow',Arial,sans-serif;font-size:18px;font-weight:600;padding:12px 24px;border-radius:8px">Confirmar inscrição</a></td></tr>
<tr><td style="font-size:13px;line-height:1.6;color:#555">Se o botão não abrir, copie este link: <a href="${url}" style="color:#14505C">${url}</a><br><br>Se não foi você, ignore este e-mail: nada será enviado sem a confirmação.</td></tr>
<tr><td style="font-size:12px;color:#777;padding-top:24px;border-top:1px solid #DED7CA;margin-top:16px">${escapeHtml(SITE_NAME)} — Para o homem que segura a casa. Um site do grupo VDP, irmão do ${escapeHtml(VDM_NAME)}.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, html, text };
}

/* ---------------- Banco (newsletter_subscribers) ---------------- */

type SubscriberRow = {
  id: string;
  email: string;
  status: "pending" | "confirmed" | "unsubscribed" | "bounced";
  confirm_token: string;
  segments: Record<string, unknown> | null;
};

async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // A tabela `newsletter_subscribers` (0001_core.sql) ainda não está nos tipos
  // gerados (herdados do VDM); o cast evita depender da regeneração.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabaseAdmin as unknown as { from: (table: string) => any };
}

/**
 * Double opt-in, passo 1: garante a linha com status 'pending' e devolve o token.
 * - e-mail novo → insert (confirm_token vem do default da tabela);
 * - já pendente ou descadastrado → volta para 'pending' com token novo (reenvio);
 * - já confirmado → não muda nada e não devolve token (resposta genérica igual).
 */
export async function upsertPendingSubscriber(
  email: string,
  source: string,
): Promise<{ token: string | null }> {
  const db = await getAdmin();
  const normalized = normalizeEmail(email);
  const { data: existing, error: selErr } = await db
    .from("newsletter_subscribers")
    .select("id, email, status, confirm_token, segments")
    .eq("email", normalized)
    .maybeSingle();
  if (selErr) throw selErr;

  const row = existing as SubscriberRow | null;
  if (row?.status === "confirmed") return { token: null };

  const segments = {
    ...(row?.segments ?? {}),
    frequencia: (row?.segments as { frequencia?: string } | null)?.frequencia ?? "semanal",
    origem: source,
  };

  if (!row) {
    const { data, error } = await db
      .from("newsletter_subscribers")
      .insert({ email: normalized, source, status: "pending", segments })
      .select("confirm_token")
      .single();
    if (error) throw error;
    return { token: (data as { confirm_token: string }).confirm_token };
  }

  const { data, error } = await db
    .from("newsletter_subscribers")
    .update({
      status: "pending",
      confirm_token: crypto.randomUUID(),
      source,
      segments,
      confirmed_at: null,
    })
    .eq("id", row.id)
    .select("confirm_token")
    .single();
  if (error) throw error;
  return { token: (data as { confirm_token: string }).confirm_token };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Double opt-in, passo 2: marca 'confirmed'. Devolve 'invalid' se o token não existe. */
export async function confirmSubscriber(
  token: string,
): Promise<"confirmed" | "already" | "invalid"> {
  if (!UUID_RE.test(token)) return "invalid";
  const db = await getAdmin();
  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("id, status, segments")
    .eq("confirm_token", token)
    .maybeSingle();
  if (error) throw error;
  const row = data as Pick<SubscriberRow, "id" | "status" | "segments"> | null;
  if (!row) return "invalid";
  if (row.status === "confirmed") return "already";

  const now = new Date().toISOString();
  const segments = { ...(row.segments ?? {}), welcome_step: 0, welcome_next_at: now };
  const { error: updErr } = await db
    .from("newsletter_subscribers")
    .update({ status: "confirmed", confirmed_at: now, segments })
    .eq("id", row.id);
  if (updErr) throw updErr;
  return "confirmed";
}

/* ---------------- Esposa → Vocação de Mãe (doc 00 §9.1 item 8) ---------------- */

/** Encaminha o e-mail da esposa à API do VDM com o segmento `indicado-pelo-marido`. Sem endpoint, ignora. */
export async function forwardSpouseToVdm(spouseEmail: string | undefined): Promise<void> {
  if (!VDM_NEWSLETTER_ENDPOINT || !isValidEmail(spouseEmail)) return;
  try {
    await fetch(VDM_NEWSLETTER_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizeEmail(spouseEmail),
        segment: VDM_SPOUSE_SEGMENT,
        source: "vocacaodepai",
      }),
    });
  } catch (err) {
    console.warn("[newsletter] não foi possível encaminhar o e-mail da esposa ao VDM", err);
  }
}
