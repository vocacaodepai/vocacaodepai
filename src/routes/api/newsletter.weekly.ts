import { createFileRoute } from "@tanstack/react-router";

// POST /api/newsletter/weekly — resumo semanal da Área do Pai (doc 07 §6.6 adaptado:
// sem edge function/pg_cron; quem agenda é .github/workflows/newsletter-weekly.yml).
// Protegida por `Authorization: Bearer CRON_SECRET` (comparação em tempo constante).
// `?dry_run=true` só conta assinantes e segmentos, sem enviar nem gravar.

const HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: HEADERS });

export const Route = createFileRoute("/api/newsletter/weekly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const srv = await import("@/lib/area-do-pai/area.server");
        const secret = process.env["CRON_SECRET"]?.trim();
        if (!secret) return json({ ok: false, error: "CRON_SECRET não configurado" }, 503);
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
        if (!token || !srv.safeEqual(token, secret)) {
          return json({ ok: false, error: "Não autorizado" }, 401);
        }
        const dryRun = new URL(request.url).searchParams.get("dry_run") === "true";
        try {
          const email = await import("@/lib/area-do-pai/email.server");
          const result = await email.runWeeklyDigest({ dryRun });
          return json(result, result.ok ? 200 : 503);
        } catch (err) {
          console.error("[weekly] falha", err);
          return json({ ok: false, error: "Falha ao processar o resumo semanal" }, 500);
        }
      },
      GET: async () => json({ ok: false, error: "Use POST" }, 405),
    },
  },
});
