import { createFileRoute } from "@tanstack/react-router";

// GET /api/cron/expire-jobs (doc 08 §1.3, §2.6): disparo manual/redundante de public.expire_jobs().
// O agendamento principal é o pg_cron `vdp-expire-jobs` (0008_cron.sql); aqui só com
// `Authorization: Bearer CRON_SECRET` (comparação em tempo constante).

async function authorized(request: Request): Promise<boolean> {
  const secret = process.env["CRON_SECRET"];
  const header = request.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const given = header.slice(7);
  const { timingSafeEqual } = await import("node:crypto");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/cron/expire-jobs")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await authorized(request))) return new Response("unauthorized", { status: 401 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          /* eslint-disable @typescript-eslint/no-explicit-any */
          const { data, error } = await (
            supabaseAdmin as unknown as { rpc: (f: string) => any }
          ).rpc("expire_jobs");
          /* eslint-enable @typescript-eslint/no-explicit-any */
          if (error) throw error;
          const row = Array.isArray(data) ? data[0] : data;
          return Response.json({
            ok: true,
            expired_jobs: row?.expired_jobs ?? 0,
            expired_referrals: row?.expired_referrals ?? 0,
          });
        } catch (error) {
          console.error("[cron/expire-jobs]", error);
          return Response.json({ ok: false, error: "falha ao expirar" }, { status: 500 });
        }
      },
    },
  },
});
