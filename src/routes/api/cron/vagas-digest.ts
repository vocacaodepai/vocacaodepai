import { createFileRoute } from "@tanstack/react-router";
import { emailJobsDigest } from "@/lib/pai-indica-pai/emails";
import type { JobPublic } from "@/lib/pai-indica-pai/types";

// GET /api/cron/vagas-digest (doc 08 §5.2): vagas aprovadas nas últimas 24 h → assinantes confirmados
// com `segments.vagas` (UF/área/remoto). Chamado por .github/workflows/vagas-digest.yml com
// `Authorization: Bearer CRON_SECRET`. Service role (lê newsletter_subscribers) + Resend por HTTP.

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

type Prefs = { ufs?: string[]; areas?: string[]; remoto?: boolean };

export function matchJobs(jobs: JobPublic[], p: Prefs): JobPublic[] {
  return jobs.filter((j) => {
    const ufOk = p.ufs?.length ? p.ufs.includes(j.uf ?? "") : true;
    const areaOk = p.areas?.length ? p.areas.includes(j.area ?? "") : true;
    const remoteOk =
      Boolean(p.remoto) && j.remote && (p.areas?.length ? p.areas.includes(j.area ?? "") : true);
    return (ufOk && areaOk) || remoteOk;
  });
}

export const Route = createFileRoute("/api/cron/vagas-digest")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!(await authorized(request))) return new Response("unauthorized", { status: 401 });
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const srv = await import("@/lib/newsletter.server");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sb = supabaseAdmin as unknown as { from: (t: string) => any };
          const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
          const { data: jobs } = await sb
            .from("jobs_public")
            .select("*")
            .gte("published_at", since)
            .order("published_at", { ascending: false });
          const fresh = (jobs ?? []) as JobPublic[];
          if (!fresh.length) return Response.json({ sent: 0, jobs: 0, reason: "sem vagas novas" });
          const { data: subs } = await sb
            .from("newsletter_subscribers")
            .select("email, segments")
            .eq("status", "confirmed")
            .not("confirmed_at", "is", null)
            .not("segments->vagas", "is", null);
          let sent = 0;
          for (const s of (subs ?? []) as { email: string; segments: { vagas?: Prefs } | null }[]) {
            const mine = matchJobs(fresh, s.segments?.vagas ?? {});
            if (!mine.length) continue;
            const r = await srv.sendEmail({
              to: s.email,
              ...emailJobsDigest({ jobs: mine.slice(0, 10), email: s.email }),
            });
            if (r === "sent") sent++;
          }
          return Response.json({ sent, jobs: fresh.length, subscribers: subs?.length ?? 0 });
        } catch (error) {
          console.error("[cron/vagas-digest]", error);
          return Response.json({ ok: false, error: "falha no digest" }, { status: 500 });
        }
      },
    },
  },
});
