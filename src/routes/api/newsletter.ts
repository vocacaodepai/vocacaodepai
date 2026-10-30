import { createFileRoute } from "@tanstack/react-router";
import {
  NEWSLETTER_GENERIC_OK,
  isValidEmail,
  type NewsletterSubscribeInput,
  type NewsletterSubscribeResult,
} from "@/lib/newsletter";

// POST /api/newsletter — double opt-in, passo 1 (doc 03 §4.6 item 3; doc 11 §5.2).
// Valida o e-mail, grava `pending` em newsletter_subscribers e envia o e-mail de
// confirmação (Resend). A resposta é sempre genérica ("Verifique seu e-mail"):
// não revela se o endereço já existia. Antispam: Turnstile (se houver chave),
// honeypot, tempo mínimo de preenchimento e rate limit de 10/hora por IP.

const SECURITY_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function json(body: NewsletterSubscribeResult, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: SECURITY_HEADERS });
}

export const Route = createFileRoute("/api/newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const srv = await import("@/lib/newsletter.server");
        const ip = srv.getClientIp(request);

        if (!srv.checkRateLimit("newsletter", ip)) {
          return json({ ok: false, message: "Muitas tentativas. Tente de novo em uma hora." }, 429);
        }

        let input: NewsletterSubscribeInput;
        try {
          input = (await request.json()) as NewsletterSubscribeInput;
        } catch {
          return json({ ok: false, message: "Pedido inválido." }, 400);
        }

        if (!isValidEmail(input.email)) {
          return json({ ok: false, message: "Informe um e-mail válido." }, 400);
        }

        // Robô: responde como se tivesse dado certo, sem gravar nada.
        if (srv.looksLikeBot(input)) return json({ ok: true, message: NEWSLETTER_GENERIC_OK });

        if (!(await srv.verifyTurnstile(input.turnstileToken, ip))) {
          return json(
            {
              ok: false,
              message: "Não foi possível confirmar que você não é um robô. Tente de novo.",
            },
            403,
          );
        }

        const source = typeof input.source === "string" ? input.source.slice(0, 40) : "site";

        try {
          const { token } = await srv.upsertPendingSubscriber(input.email, source);
          if (token) {
            await srv.sendEmail({
              to: input.email.trim().toLowerCase(),
              ...srv.buildConfirmEmail(token),
            });
          }
          await srv.forwardSpouseToVdm(input.spouseEmail);
        } catch (err) {
          console.error("[newsletter] falha ao gravar inscrição", err);
          return json(
            { ok: false, message: "Não foi possível assinar agora. Tente de novo em instantes." },
            500,
          );
        }

        return json({ ok: true, message: NEWSLETTER_GENERIC_OK });
      },
    },
  },
});
