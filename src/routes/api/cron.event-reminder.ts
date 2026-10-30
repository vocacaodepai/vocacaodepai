import { createFileRoute } from "@tanstack/react-router";

// GET /api/cron/event-reminder — protegido por CRON_SECRET (CLAUDE.md §13), chamado de hora em
// hora pelo cron (Supabase pg_cron ou Vercel). Envia o lembrete "Amanhã: <título>" aos RSVPs.
export const Route = createFileRoute("/api/cron/event-reminder")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["CRON_SECRET"];
        const got =
          request.headers.get("x-internal-secret") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          "";
        if (!secret || got !== secret) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        try {
          const { sendEventReminders } = await import("@/lib/event-reminder.server");
          const result = await sendEventReminders();
          return new Response(JSON.stringify(result), {
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("[event-reminder]", error);
          return new Response(JSON.stringify({ error: "failed" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
