// E-mails da Área do Pai (doc 07 §6.3, §6.6) — server-only. Templates HTML
// inline (600px, cores da marca) e o resumo semanal por fase do filho, enviado
// pela rota POST /api/newsletter/weekly (Authorization: Bearer CRON_SECRET).
import { CONTACT_EMAIL, EMAIL_FROM, SITE_GROUP, SITE_NAME, SITE_URL } from "@/lib/site";
import { PHASES, phaseBySlug } from "@/lib/phases";
import { getServiceClient, phasesFromChildren } from "./area.server";

function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

const BRAND_FONT = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";

function shell(title: string, bodyHtml: string, footerHtml: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#F4EFE6;font-family:Inter,Arial,sans-serif;color:#1B1F23">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4EFE6;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:8px;padding:32px">
<tr><td style="font-family:${BRAND_FONT};font-size:28px;font-weight:700;color:#14505C;padding-bottom:8px">${esc(SITE_NAME)}</td></tr>
<tr><td style="font-family:${BRAND_FONT};font-size:22px;font-weight:600;color:#1B1F23;padding-bottom:16px">${esc(title)}</td></tr>
${bodyHtml}
<tr><td style="font-size:12px;line-height:1.6;color:#777;padding-top:24px;border-top:1px solid #DED7CA">${footerHtml}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<tr><td style="padding:8px 0 24px"><a href="${href}" style="display:inline-block;background:#D9822B;color:#FFFFFF;text-decoration:none;font-family:${BRAND_FONT};font-size:18px;font-weight:600;padding:12px 24px;border-radius:8px">${esc(label)}</a></td></tr>`;

const para = (text: string) =>
  `<tr><td style="font-size:16px;line-height:1.6;padding-bottom:14px">${text}</td></tr>`;

const SIGNATURE = `${SITE_NAME} — Para o homem que segura a casa. Um site do ${SITE_GROUP}.`;

/* ---------------- Boas-vindas ---------------- */

export function buildWelcomeEmail(name: string): { subject: string; html: string; text: string } {
  const first = name.trim().split(/\s+/)[0] || "pai";
  const subject = `Bem-vindo à Área do Pai, ${first}`;
  const url = `${SITE_URL}/area-do-pai`;
  const body =
    para(
      `Você entrou para a Irmandade. A Área do Pai é o seu lugar para crescer como pai, marido e homem, sem enrolação.`,
    ) +
    para(
      `O que fazer agora: <strong>cadastre seus filhos</strong> para receber o conteúdo certo para a fase de cada um, <strong>salve artigos, produtos e ferramentas</strong> para voltar depois e explore a <strong>Caixa de Ferramentas</strong>.`,
    ) +
    button(url, "Abrir minha Área do Pai") +
    para(
      `Qualquer dúvida, responda este e-mail. Fala de homem para homem.<br>Bruno Danello — ${esc(SITE_NAME)}`,
    );
  const html = shell("Você entrou para a Irmandade.", body, esc(SIGNATURE));
  const text = [
    `Bem-vindo à Área do Pai, ${first}.`,
    "",
    "Você entrou para a Irmandade. O que fazer agora: cadastre seus filhos, salve conteúdos e explore a Caixa de Ferramentas.",
    "",
    `Abrir minha Área do Pai: ${url}`,
    "",
    `Bruno Danello — ${SITE_NAME}`,
    SIGNATURE,
  ].join("\n");
  return { subject, html, text };
}

/* ---------------- Resumo semanal ---------------- */

export interface DigestPost {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  kind: string;
}

export interface DigestSection {
  heading: string;
  posts: DigestPost[];
}

export interface DigestInput {
  name: string;
  sections: DigestSection[];
  paiIndica: DigestPost | null;
  market: { usd: number | null; btc: number | null; selic: number | null } | null;
  unsubscribeUrl: string;
}

const postHref = (p: DigestPost) =>
  `${SITE_URL}/${["review", "comparativo", "lista"].includes(p.kind) ? "pai-indica" : "post"}/${p.slug}`;

function postRow(p: DigestPost): string {
  const img = p.cover_image_url
    ? `<td width="96" valign="top" style="padding-right:12px"><img src="${esc(p.cover_image_url)}" width="96" height="64" alt="" style="display:block;width:96px;height:64px;object-fit:cover;border-radius:6px"></td>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px"><tr>${img}<td valign="top"><a href="${postHref(p)}" style="font-family:${BRAND_FONT};font-size:18px;font-weight:600;color:#14505C;text-decoration:none">${esc(p.title)}</a>${p.excerpt ? `<div style="font-size:14px;line-height:1.5;color:#444;margin-top:2px">${esc(p.excerpt)}</div>` : ""}</td></tr></table>`;
}

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export function buildWeeklyDigest(input: DigestInput): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Seu resumo da semana — ${SITE_NAME}`;
  const first = input.name.trim().split(/\s+/)[0] || "pai";
  let body = para(`Olá, ${esc(first)}. Aqui vai o essencial da semana para a sua casa.`);
  const textLines = [`Seu resumo da semana — ${SITE_NAME}`, ""];
  for (const s of input.sections) {
    body += `<tr><td style="font-family:${BRAND_FONT};font-size:20px;font-weight:600;color:#14505C;padding:12px 0 8px">${esc(s.heading)}</td></tr>`;
    body += `<tr><td>${s.posts.map(postRow).join("")}</td></tr>`;
    textLines.push(s.heading, ...s.posts.map((p) => `- ${p.title}: ${postHref(p)}`), "");
  }
  if (input.paiIndica) {
    body += `<tr><td style="font-family:${BRAND_FONT};font-size:20px;font-weight:600;color:#14505C;padding:12px 0 8px">Pai Indica da semana</td></tr><tr><td>${postRow(input.paiIndica)}</td></tr>`;
    textLines.push(
      "Pai Indica da semana",
      `- ${input.paiIndica.title}: ${postHref(input.paiIndica)}`,
      "",
    );
  }
  if (input.market) {
    const parts: string[] = [];
    if (input.market.usd != null) parts.push(`Dólar ${brl(input.market.usd)}`);
    if (input.market.btc != null) parts.push(`Bitcoin ${brl(input.market.btc)}`);
    if (input.market.selic != null)
      parts.push(`Selic ${input.market.selic.toFixed(2).replace(".", ",")}% a.a.`);
    if (parts.length) {
      body += `<tr><td style="font-family:${BRAND_FONT};font-size:20px;font-weight:600;color:#14505C;padding:12px 0 8px">Mercado em 1 minuto</td></tr>`;
      body += para(
        `${esc(parts.join(" · "))}<br><span style="font-size:13px;color:#666">Informação educativa, não é recomendação de investimento. <a href="${SITE_URL}/ferramentas/mercado-financeiro" style="color:#14505C">Ver o Mercado do pai</a></span>`,
      );
      textLines.push("Mercado em 1 minuto", parts.join(" · "), "");
    }
  }
  body += button(`${SITE_URL}/area-do-pai`, "Abrir minha Área do Pai");
  const footer = `${esc(SIGNATURE)}<br>Você recebe este e-mail porque confirmou a inscrição no resumo semanal. <a href="${input.unsubscribeUrl}" style="color:#14505C">Sair da lista</a> · <a href="${SITE_URL}/politica-de-privacidade" style="color:#14505C">Privacidade</a> · ${esc(CONTACT_EMAIL)}`;
  textLines.push(
    `Abrir minha Área do Pai: ${SITE_URL}/area-do-pai`,
    "",
    `Sair da lista: ${input.unsubscribeUrl}`,
    SIGNATURE,
  );
  return { subject, html: shell("Seu resumo da semana", body, footer), text: textLines.join("\n") };
}

/* ---------------- Envio do resumo semanal ---------------- */

type Row = Record<string, unknown>;

export interface DigestRunResult {
  ok: boolean;
  dryRun: boolean;
  subscribers: number;
  sent: number;
  skipped: number;
  failed: number;
  segments: Record<string, number>;
  reason?: string;
}

async function postsForPhases(
  admin: NonNullable<ReturnType<typeof getServiceClient>>,
  phases: string[],
  cache: Map<string, DigestPost[]>,
): Promise<DigestSection[]> {
  const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
  const sections: DigestSection[] = [];
  for (const phase of phases.length ? phases : ["todas"]) {
    if (!cache.has(phase)) {
      const tagSlugs = phase === "todas" ? ["fase-todas"] : [`fase-${phase}`, "fase-todas"];
      const { data: tagRows } = await admin.from("tags").select("id").in("slug", tagSlugs);
      const tagIds = ((tagRows ?? []) as Row[]).map((t) => String(t.id));
      let posts: DigestPost[] = [];
      if (tagIds.length) {
        const { data: pt } = await admin
          .from("post_tags")
          .select("post_id")
          .in("tag_id", tagIds)
          .limit(400);
        const postIds = Array.from(new Set(((pt ?? []) as Row[]).map((r) => String(r.post_id))));
        if (postIds.length) {
          const base = admin
            .from("posts")
            .select("slug, title, excerpt, cover_image_url, kind, publish_at")
            .eq("status", "published")
            .lte("publish_at", new Date().toISOString())
            .in("id", postIds)
            .order("publish_at", { ascending: false })
            .limit(3);
          const recent = await base.gte("publish_at", since);
          posts = ((recent.data ?? []) as Row[]).map(toDigestPost);
          if (posts.length < 3) {
            const older = await admin
              .from("posts")
              .select("slug, title, excerpt, cover_image_url, kind, publish_at")
              .eq("status", "published")
              .lte("publish_at", new Date().toISOString())
              .in("id", postIds)
              .order("publish_at", { ascending: false })
              .limit(3);
            posts = ((older.data ?? []) as Row[]).map(toDigestPost);
          }
        }
      }
      if (!posts.length) {
        // Sem tag por fase ainda: os 3 artigos mais recentes do Blog.
        const { data } = await admin
          .from("posts")
          .select("slug, title, excerpt, cover_image_url, kind, publish_at")
          .eq("status", "published")
          .lte("publish_at", new Date().toISOString())
          .in("kind", ["artigo", "noticia"])
          .order("publish_at", { ascending: false })
          .limit(3);
        posts = ((data ?? []) as Row[]).map(toDigestPost);
      }
      cache.set(phase, posts);
    }
    const posts = cache.get(phase) ?? [];
    if (!posts.length) continue;
    const ph = phaseBySlug(phase);
    sections.push({
      heading: ph ? `Para a fase ${ph.name.toLowerCase()}` : "Para a sua casa",
      posts,
    });
  }
  return sections;
}

const toDigestPost = (r: Row): DigestPost => ({
  slug: String(r.slug),
  title: String(r.title),
  excerpt: (r.excerpt as string | null) ?? null,
  cover_image_url: (r.cover_image_url as string | null) ?? null,
  kind: String(r.kind ?? "artigo"),
});

/**
 * Envia o resumo semanal a todos os assinantes confirmados (lotes de 100 via Resend Batch).
 * Idempotente: pula quem recebeu há menos de 6 dias (`segments.last_digest_at`).
 */
export async function runWeeklyDigest(opts: { dryRun: boolean }): Promise<DigestRunResult> {
  const result: DigestRunResult = {
    ok: true,
    dryRun: opts.dryRun,
    subscribers: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    segments: {},
  };
  const admin = getServiceClient();
  if (!admin) return { ...result, ok: false, reason: "SUPABASE_SERVICE_ROLE_KEY ausente" };
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  if (!apiKey && !opts.dryRun) return { ...result, ok: false, reason: "RESEND_API_KEY ausente" };

  const cache = new Map<string, DigestPost[]>();
  const sixDaysAgo = Date.now() - 6 * 24 * 3600 * 1000;

  const { data: piRow } = await admin
    .from("posts")
    .select("slug, title, excerpt, cover_image_url, kind")
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .in("kind", ["review", "comparativo", "lista"])
    .order("publish_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const paiIndica = piRow ? toDigestPost(piRow as Row) : null;

  let market: DigestInput["market"] = null;
  try {
    const { data: mk } = await admin
      .from("market_cache")
      .select("key, data")
      .in("key", ["fx:last", "sgs:indicators"]);
    const fx = ((mk ?? []) as Row[]).find((r) => r.key === "fx:last")?.data as Row | undefined;
    const sgs = ((mk ?? []) as Row[]).find((r) => r.key === "sgs:indicators")?.data as
      Row | undefined;
    const num = (v: unknown) => {
      const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
      return Number.isFinite(n) ? n : null;
    };
    const bid = (code: string) => num(((fx?.[code] as Row | undefined) ?? {}).bid);
    const selic = num((sgs?.selic as Row | undefined)?.value ?? sgs?.selic);
    if (fx || sgs) market = { usd: bid("USDBRL"), btc: bid("BTCBRL"), selic };
  } catch {
    market = null;
  }

  let offset = 0;
  const batchSize = 100;
  for (;;) {
    const { data: subs, error } = await admin
      .from("newsletter_subscribers")
      .select("id, email, name, user_id, segments, confirm_token")
      .eq("status", "confirmed")
      .order("created_at")
      .range(offset, offset + batchSize - 1);
    if (error) return { ...result, ok: false, reason: error.message };
    const rows = (subs ?? []) as Row[];
    if (!rows.length) break;
    result.subscribers += rows.length;

    const outgoing: Array<{ id: string; segments: Row; email: Row }> = [];
    for (const s of rows) {
      const segments = ((s.segments as Row | null) ?? {}) as Row;
      const last =
        typeof segments.last_digest_at === "string" ? Date.parse(segments.last_digest_at) : 0;
      if (last && last > sixDaysAgo) {
        result.skipped++;
        continue;
      }
      let phases: string[] = [];
      let name = typeof s.name === "string" && s.name ? s.name : "pai";
      if (s.user_id) {
        const [{ data: kids }, { data: prof }] = await Promise.all([
          admin
            .from("children")
            .select("birth_date")
            .eq("user_id", s.user_id as string),
          admin
            .from("profiles")
            .select("display_name")
            .eq("id", s.user_id as string)
            .maybeSingle(),
        ]);
        phases = phasesFromChildren((kids ?? []) as Array<{ birth_date: string }>);
        name = ((prof as Row | null)?.display_name as string | undefined) ?? name;
      }
      if (!phases.length && Array.isArray(segments.fases)) {
        phases = (segments.fases as string[]).filter((f) => PHASES.some((p) => p.slug === f));
      }
      for (const ph of phases.length ? phases : ["todas"]) {
        result.segments[`fase:${ph}`] = (result.segments[`fase:${ph}`] ?? 0) + 1;
      }
      const sections = await postsForPhases(admin, phases, cache);
      const unsubscribeUrl = `${SITE_URL}/api/newsletter/sair?token=${encodeURIComponent(String(s.confirm_token))}`;
      const tpl = buildWeeklyDigest({ name, sections, paiIndica, market, unsubscribeUrl });
      outgoing.push({
        id: String(s.id),
        segments,
        email: {
          from: EMAIL_FROM,
          to: [String(s.email)],
          reply_to: CONTACT_EMAIL,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          tags: [{ name: "type", value: "weekly-digest" }],
        },
      });
    }

    if (opts.dryRun) {
      result.sent += outgoing.length;
    } else if (outgoing.length) {
      try {
        const res = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(outgoing.map((o) => o.email)),
        });
        if (!res.ok) {
          console.error("[weekly] Resend batch", res.status, (await res.text()).slice(0, 300));
          result.failed += outgoing.length;
        } else {
          result.sent += outgoing.length;
          const now = new Date().toISOString();
          await Promise.all(
            outgoing.map((o) =>
              admin
                .from("newsletter_subscribers")
                .update({ segments: { ...o.segments, last_digest_at: now } })
                .eq("id", o.id),
            ),
          );
        }
      } catch (err) {
        console.error("[weekly] falha no envio", err);
        result.failed += outgoing.length;
      }
    }

    if (rows.length < batchSize) break;
    offset += batchSize;
  }

  if (!opts.dryRun) {
    await admin.from("moderation_log").insert({
      actor_id: null,
      entity: "newsletter",
      entity_id: new Date().toISOString().slice(0, 10),
      action: "weekly_digest",
      note: `enviados=${result.sent} falhas=${result.failed} pulados=${result.skipped}`,
    });
  }
  return result;
}
