import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Vocação de Pai — notifica contato@vocacaodepai.com.br por e-mail quando
// alguém envia o formulário de contato (`public.contact_messages`, doc 02 §4.1).
// Disparada por trigger AFTER INSERT (pg_net) ou por `/api/contato`, nunca
// pelo cliente: a autenticação é o segredo `CRON_SECRET` (doc 02 §8, único
// segredo de crons/integrações) no header `x-cron-secret`. `RESEND_API_KEY`
// e `CRON_SECRET` vêm dos secrets da edge function (`Deno.env`) ou do Vault
// (`public.get_secret`). Body esperado: { name, email, subject, message }.

const RESEND_FROM = "Vocação de Pai <contato@vocacaodepai.com.br>";
const NOTIFY_TO = "contato@vocacaodepai.com.br";

async function readSecret(
  supabase: { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message?: string } | null }> },
  name: string,
): Promise<{ value: string | null; error?: string }> {
  const fromEnv = Deno.env.get(name);
  if (fromEnv) return { value: fromEnv };
  const { data, error } = await supabase.rpc("get_secret", { secret_name: name });
  return { value: typeof data === "string" && data ? data : null, error: error?.message };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Comparação em tempo constante para evitar timing attack no segredo interno.
function timingSafeEqual(a: string, b: string): boolean {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  if (bytesA.length !== bytesB.length) return false;
  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { value: expectedSecret } = await readSecret(supabase, "CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    if (!expectedSecret || !providedSecret || !timingSafeEqual(providedSecret, expectedSecret)) {
      return new Response(JSON.stringify({ error: "Acesso restrito" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.slice(0, 200) : "";
    const email = typeof body.email === "string" ? body.email.slice(0, 320) : "";
    const subject = typeof body.subject === "string" ? body.subject.slice(0, 200) : "";
    const message = typeof body.message === "string" ? body.message.slice(0, 5000) : "";

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "name, email e message são obrigatórios" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { value: resendKey, error: keyError } = await readSecret(supabase, "RESEND_API_KEY");
    if (keyError || !resendKey) {
      return new Response(
        JSON.stringify({ error: "Não foi possível obter RESEND_API_KEY", details: keyError }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [NOTIFY_TO],
        reply_to: email,
        subject: `Novo contato pelo site: ${subject || "(sem assunto)"}`,
        html: `
          <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
          <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
          <p><strong>Assunto:</strong> ${escapeHtml(subject || "(sem assunto)")}</p>
          <p><strong>Mensagem:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      return new Response(
        JSON.stringify({ error: "Erro ao enviar e-mail", status: emailRes.status, details: text.slice(0, 1000) }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }

    const emailJson = await emailRes.json();
    return new Response(JSON.stringify({ ok: true, email_id: emailJson.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro inesperado", details: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
