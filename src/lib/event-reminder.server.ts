// Lembrete de encontro 24 h antes (doc 09 §8): RSVPs `going` sem `reminded_at` de eventos
// `published` com início entre now()+23h e now()+25h recebem e-mail via Resend e ganham
// `reminded_at`. Idempotente. Chamado por /api/cron/event-reminder (CRON_SECRET) — o cron do
// Supabase (0015 bloco 13) ou o cron da Vercel disparam a rota de hora em hora.
import { EMAIL_FROM, SITE_NAME, SITE_URL } from "@/lib/site";

interface RsvpRow {
  event_id: string;
  user_id: string;
  events: {
    slug: string;
    title: string;
    starts_at: string;
    mode: string;
    city: string | null;
    uf: string | null;
    address: string | null;
    url: string | null;
    status: string;
  } | null;
}

function fmt(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

export async function sendEventReminders(): Promise<{ sent: number; skipped: number }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabaseAdmin as any;
  const from = new Date(Date.now() + 23 * 3600_000).toISOString();
  const to = new Date(Date.now() + 25 * 3600_000).toISOString();
  const { data, error } = await db
    .from("event_rsvps")
    .select("event_id,user_id,events!inner(slug,title,starts_at,mode,city,uf,address,url,status)")
    .eq("status", "going")
    .is("reminded_at", null)
    .eq("events.status", "published")
    .gte("events.starts_at", from)
    .lte("events.starts_at", to);
  if (error) throw new Error(error.message);
  const key = process.env["RESEND_API_KEY"];
  let sent = 0;
  let skipped = 0;
  for (const r of (data ?? []) as RsvpRow[]) {
    const ev = r.events;
    if (!ev) continue;
    const { data: u } = await db.auth.admin.getUserById(r.user_id);
    const email = u?.user?.email as string | undefined;
    if (!email || !key) {
      skipped++;
      continue;
    }
    const where =
      ev.mode === "online"
        ? `On-line${ev.url ? `: ${ev.url}` : ""}`
        : `${ev.address ?? ""} ${ev.city ?? ""}${ev.uf ? `/${ev.uf}` : ""}`.trim();
    const link = `${SITE_URL}/eventos/${ev.slug}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [email],
        subject: `Amanhã: ${ev.title}`,
        html: `<p>Irmão, é amanhã.</p><p><strong>${ev.title}</strong><br>${fmt(ev.starts_at)}<br>${where}</p><p><a href="${link}">Ver encontro</a></p><p>${SITE_NAME}</p>`,
        text: `Irmão, é amanhã.\n\n${ev.title}\n${fmt(ev.starts_at)}\n${where}\n\nVer encontro: ${link}\n\n${SITE_NAME}`,
      }),
    });
    if (!res.ok) {
      skipped++;
      continue;
    }
    await db
      .from("event_rsvps")
      .update({ reminded_at: new Date().toISOString() })
      .eq("event_id", r.event_id)
      .eq("user_id", r.user_id);
    sent++;
  }
  if (sent > 0) {
    await db.from("moderation_log").insert({
      entity: "event",
      entity_id: "reminder",
      action: "edit",
      note: `lembretes=${sent}`,
    });
  }
  return { sent, skipped };
}
