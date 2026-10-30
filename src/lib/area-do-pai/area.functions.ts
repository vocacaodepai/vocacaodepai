import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { childPhase, type PhaseSlug } from "@/lib/phases";
import {
  EMPTY_PAINEL,
  PLAN_NAMES,
  SAVED_ITEM_TYPES,
  type BadgeView,
  type ChildWithPhase,
  type MarketSnapshot,
  type MemberProfile,
  type NewsletterStatus,
  type PainelData,
  type PlanView,
  type RecommendedPost,
  type SavedItem,
  type SavedItemType,
  type SavedItemView,
} from "./types";

// Server functions da Área do Pai (doc 07 §4.9, §5.1, §6.5). Todas recebem o
// `accessToken` do usuário e criam um client que respeita o RLS (requireUser).
// Banco placeholder ou tabela de fase futura ausente → listas vazias (try/catch).

type Row = Record<string, unknown>;

async function safe<T>(p: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

const TokenInput = z.object({ accessToken: z.string().min(20) });

/* ---------------- Painel ---------------- */

function parseMarket(rows: Row[]): MarketSnapshot | null {
  if (!rows.length) return null;
  const get = (key: string) => rows.find((r) => r.key === key);
  const fx = get("fx:last");
  const fxData = (fx?.data ?? {}) as Row;
  const pick = (code: string): number | null => {
    const entry = (fxData[code] ?? (fxData.rates as Row | undefined)?.[code]) as Row | undefined;
    const raw = entry?.bid ?? entry?.price ?? entry?.value ?? (entry as unknown);
    const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const sgs = (get("sgs:indicators")?.data ?? {}) as Row;
  const selicRaw = (sgs.selic as Row | undefined)?.value ?? sgs.selic ?? sgs["432"];
  const selic =
    typeof selicRaw === "number" ? selicRaw : typeof selicRaw === "string" ? Number(selicRaw) : NaN;
  const fetchedAt = (fx?.fetched_at ?? rows[0]?.fetched_at ?? null) as string | null;
  const snap: MarketSnapshot = {
    usdBrl: pick("USDBRL") ?? pick("USD-BRL") ?? pick("USD"),
    eurBrl: pick("EURBRL") ?? pick("EUR-BRL") ?? pick("EUR"),
    btcBrl: pick("BTCBRL") ?? pick("BTC-BRL") ?? pick("BTC"),
    selic: Number.isFinite(selic) ? selic : null,
    fetchedAt,
  };
  const hasAny = snap.usdBrl ?? snap.eurBrl ?? snap.btcBrl ?? snap.selic;
  return hasAny == null ? null : snap;
}

export const getPainelData = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.parse(d))
  .handler(async ({ data }): Promise<PainelData> => {
    const srv = await import("./area.server");
    const { sb, user } = await srv.requireUser(data.accessToken);

    const [dash, recommended, savedRows, newsRow, planSlug, referrals, stories, allBadges, market] =
      await Promise.all([
        safe(
          sb.rpc("get_member_dashboard").then((r) => (r.data ?? null) as Row | null),
          null,
        ),
        safe(
          sb
            .rpc("get_content_for_user", { p_limit: 16 })
            .then((r) => (r.data ?? []) as RecommendedPost[]),
          [] as RecommendedPost[],
        ),
        safe(
          sb
            .from("saved_items")
            .select("id, item_type, item_id, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(6)
            .then((r) => (r.data ?? []) as SavedItem[]),
          [] as SavedItem[],
        ),
        safe(
          sb
            .from("newsletter_subscribers")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle()
            .then((r) => (r.data ?? null) as { status: string } | null),
          null,
        ),
        safe(
          sb.rpc("my_plan_slug").then((r) => (r.data as string | null) ?? "gratuito"),
          "gratuito",
        ),
        safe(
          sb
            .from("job_referrals")
            .select("id, slug, title, status")
            .eq("referred_by", user.id)
            .order("created_at", { ascending: false })
            .limit(10)
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        ),
        safe(
          sb
            .from("stories")
            .select("id, title, status")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        ),
        safe(
          sb
            .from("badges")
            .select("slug, name, description, icon")
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        ),
        safe(
          sb
            .from("market_cache")
            .select("key, data, fetched_at")
            .in("key", ["fx:last", "sgs:indicators"])
            .then((r) => (r.data ?? []) as Row[]),
          [] as Row[],
        ),
      ]);

    let profile = (dash?.profile as MemberProfile | null) ?? null;
    if (!profile) {
      profile = await safe(
        sb
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()
          .then((r) => (r.data ?? null) as MemberProfile | null),
        null,
      );
    }

    const childrenRaw = (dash?.children as Row[] | undefined) ?? [];
    const children: ChildWithPhase[] = (
      childrenRaw.length
        ? childrenRaw
        : await safe(
            sb
              .from("children")
              .select("*")
              .eq("user_id", user.id)
              .order("birth_date")
              .then((r) => (r.data ?? []) as Row[]),
            [] as Row[],
          )
    ).map((c) => ({
      id: String(c.id),
      user_id: String(c.user_id),
      name: (c.name as string | null) ?? null,
      birth_date: String(c.birth_date),
      birth_precision: ((c.birth_precision as string) ?? "day") as "day" | "month",
      sex: c.sex as "M" | "F",
      created_at: String(c.created_at ?? ""),
      phase: childPhase(String(c.birth_date)) as PhaseSlug,
    }));

    const earned = ((dash?.badges as Row[] | undefined) ?? []).map((b) => ({
      slug: String(b.slug),
      earned_at: (b.earned_at as string | null) ?? null,
    }));
    const badges: BadgeView[] = allBadges.map((b) => ({
      slug: String(b.slug),
      name: String(b.name),
      description: (b.description as string | null) ?? null,
      icon: (b.icon as string | null) ?? null,
      earned_at: earned.find((e) => e.slug === b.slug)?.earned_at ?? null,
    }));

    const tracks = ((dash?.tracks as Row[] | undefined) ?? []).map((t) => ({
      slug: String(t.slug),
      title: String(t.title),
      done: Number(t.done ?? 0),
      total: Number(t.total ?? 0),
    }));
    const challenges = ((dash?.challenges as Row[] | undefined) ?? []).map((c) => ({
      slug: String(c.slug),
      title: String(c.title),
      day: Number(c.done ?? 0),
      days: Number(c.days ?? 0),
    }));
    const jobs = ((dash?.jobs as Row[] | undefined) ?? []).map((j) => ({
      slug: String(j.slug),
      title: String(j.title),
      status: String(j.status),
    }));

    const savedCount = Number(dash?.saved_count ?? savedRows.length);
    const savedRecent: SavedItemView[] = savedRows.length
      ? await srv.hydrateSavedItems(sb, savedRows)
      : [];

    const newsletterStatus: NewsletterStatus =
      newsRow?.status === "confirmed"
        ? "confirmed"
        : newsRow?.status === "pending"
          ? "pending"
          : newsRow?.status === "unsubscribed"
            ? "unsubscribed"
            : "none";

    return {
      ...EMPTY_PAINEL,
      profile,
      children,
      recommended,
      savedCount,
      savedRecent,
      tracksInProgress: tracks,
      activeChallenges: challenges,
      badges,
      myJobs: jobs,
      myReferrals: referrals.map((r) => ({
        id: String(r.id),
        slug: (r.slug as string | null) ?? null,
        title: String(r.title),
        status: String(r.status),
      })),
      myStories: stories.map((s) => ({
        id: String(s.id),
        title: String(s.title),
        status: String(s.status),
      })),
      newsletter: { status: newsletterStatus },
      plan: {
        slug: planSlug,
        name: PLAN_NAMES[planSlug] ?? planSlug,
        premium: planSlug === "pai-de-valor",
      },
      market: parseMarket(market),
    };
  });

/* ---------------- Salvos ---------------- */

const ItemType = z.enum(SAVED_ITEM_TYPES as [SavedItemType, ...SavedItemType[]]);

export const getSavedItems = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.extend({ itemType: ItemType.optional() }).parse(d))
  .handler(async ({ data }): Promise<SavedItemView[]> => {
    const srv = await import("./area.server");
    const { sb, user } = await srv.requireUser(data.accessToken);
    let q = sb
      .from("saved_items")
      .select("id, item_type, item_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.itemType) q = q.eq("item_type", data.itemType);
    const rows = await safe(
      q.then((r) => (r.data ?? []) as SavedItem[]),
      [] as SavedItem[],
    );
    return rows.length ? srv.hydrateSavedItems(sb, rows) : [];
  });

export const toggleSavedItem = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    TokenInput.extend({ itemType: ItemType, itemId: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }): Promise<{ saved: boolean }> => {
    const srv = await import("./area.server");
    const { sb, user } = await srv.requireUser(data.accessToken);
    srv.rateLimit(`save:${user.id}`, 60, 60_000);

    const { data: existing } = await sb
      .from("saved_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_type", data.itemType)
      .eq("item_id", data.itemId)
      .maybeSingle();
    if (existing) {
      const { error } = await sb.from("saved_items").delete().eq("id", existing.id);
      if (error) throw new Error("Não foi possível remover agora. Tente de novo.");
      return { saved: false };
    }
    const { error } = await sb
      .from("saved_items")
      .insert({ user_id: user.id, item_type: data.itemType, item_id: data.itemId });
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error("Não foi possível salvar agora. Tente de novo.");
    }
    void safe(sb.rpc("grant_badges_for_me"), null);
    return { saved: true };
  });

export const listMySavedIds = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.extend({ itemType: ItemType }).parse(d))
  .handler(async ({ data }): Promise<string[]> => {
    const srv = await import("./area.server");
    try {
      const { sb, user } = await srv.requireUser(data.accessToken);
      const { data: rows } = await sb
        .from("saved_items")
        .select("item_id")
        .eq("user_id", user.id)
        .eq("item_type", data.itemType);
      return ((rows ?? []) as { item_id: string }[]).map((r) => r.item_id);
    } catch {
      return [];
    }
  });

/* ---------------- Newsletter do membro ---------------- */

export const setNewsletterPref = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.extend({ optIn: z.boolean() }).parse(d))
  .handler(async ({ data }): Promise<{ status: NewsletterStatus; emailed: boolean }> => {
    const srv = await import("./area.server");
    const { sb, user } = await srv.requireUser(data.accessToken);
    srv.rateLimit(`news:${user.id}`, 6, 60 * 60 * 1000);
    if (!user.email) throw new Error("Sua conta não tem e-mail. Adicione um em Minha conta.");

    await safe(
      sb.from("profiles").update({ newsletter_opt_in: data.optIn }).eq("id", user.id),
      null,
    );

    const admin = srv.getServiceClient();
    if (!admin) {
      // Sem service role o cadastro fica só na preferência do perfil; o dono liga a chave depois.
      return { status: data.optIn ? "pending" : "unsubscribed", emailed: false };
    }

    const news = await import("@/lib/newsletter.server");
    const email = user.email.toLowerCase();

    if (!data.optIn) {
      await admin
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed" })
        .eq("email", email);
      return { status: "unsubscribed", emailed: false };
    }

    const { token } = await news.upsertPendingSubscriber(email, "cadastro");
    await admin.from("newsletter_subscribers").update({ user_id: user.id }).eq("email", email);
    if (!token) return { status: "confirmed", emailed: false };
    const sent = await news.sendEmail({ to: email, ...news.buildConfirmEmail(token) });
    return { status: "pending", emailed: sent === "sent" };
  });

/* ---------------- E-mail de boas-vindas ---------------- */

export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.parse(d))
  .handler(async ({ data }): Promise<{ sent: boolean }> => {
    const srv = await import("./area.server");
    const { sb, user } = await srv.requireUser(data.accessToken);
    srv.rateLimit(`welcome:${user.id}`, 2, 24 * 60 * 60 * 1000);
    if (!user.email) return { sent: false };
    const name = await safe(
      sb
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle()
        .then((r) => (r.data as { display_name?: string } | null)?.display_name ?? "pai"),
      "pai",
    );
    const email = await import("./email.server");
    const news = await import("@/lib/newsletter.server");
    const sent = await news.sendEmail({ to: user.email, ...email.buildWelcomeEmail(name) });
    return { sent: sent === "sent" };
  });

/* ---------------- Planos ---------------- */

const PAGO_FALLBACK: PlanView = {
  slug: "pai-de-valor",
  name: "Pai de Valor",
  description: "Plano pago da Área do Pai. Em breve.",
  price_cents: 1990,
  interval: "month",
  features: [
    "Tudo do plano gratuito",
    "Trilhas avançadas e certificados",
    "Grupos fechados da Irmandade",
    "E-books e guias em PDF",
    "Descontos de parceiros",
    "Mentorias em grupo mensais",
    "Sem anúncios",
  ],
  active: false,
};

const GRATUITO_FALLBACK: PlanView = {
  slug: "gratuito",
  name: "Pai de Família",
  description: "Acesso gratuito à Área do Pai.",
  price_cents: 0,
  interval: "month",
  features: [
    "Blog, Pai Indica, Loja e Ferramentas",
    "Salvar conteúdos",
    "Perfil dos filhos e conteúdo por fase",
    "Trilhas básicas e desafios",
    "Pai Indica Pai: vagas e indicações",
    "Newsletter semanal",
  ],
  active: true,
};

const FEATURE_LABELS: Record<string, string> = {
  sem_anuncios: "Sem anúncios",
  trilhas_premium: "Trilhas avançadas e certificados",
  grupos_fechados: "Grupos fechados da Irmandade",
  ebooks: "E-books e guias em PDF",
  descontos_parceiros: "Descontos de parceiros",
  mentoria_em_grupo: "Mentorias em grupo mensais",
};

/** Planos para /area-do-pai/plano: o gratuito do banco (RLS: só ativos) e o pago sempre "em breve". */
export const getPlans = createServerFn({ method: "GET" }).handler(async (): Promise<PlanView[]> => {
  const srv = await import("./area.server");
  const rows = await safe(
    srv
      .getAnonClient()
      .from("plans")
      .select("slug, name, description, price_cents, interval, features, active")
      .then((r) => (r.data ?? []) as Row[]),
    [] as Row[],
  );
  const toView = (r: Row): PlanView => ({
    slug: String(r.slug),
    name: String(r.name),
    description: (r.description as string | null) ?? null,
    price_cents: Number(r.price_cents ?? 0),
    interval: (r.interval as "month" | "year") ?? "month",
    features: (Array.isArray(r.features) ? (r.features as string[]) : []).map(
      (f) => FEATURE_LABELS[f] ?? f,
    ),
    active: Boolean(r.active),
  });
  const gratuito = rows.find((r) => r.slug === "gratuito");
  const pago = rows.find((r) => r.slug === "pai-de-valor");
  return [
    gratuito ? toView(gratuito) : GRATUITO_FALLBACK,
    pago ? { ...toView(pago), features: PAGO_FALLBACK.features } : PAGO_FALLBACK,
  ];
});

/** "Em breve — me avise": registra o interesse no plano pago em newsletter_subscribers.segments. */
export const registerPlanInterest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TokenInput.parse(d))
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const srv = await import("./area.server");
    const { user } = await srv.requireUser(data.accessToken);
    srv.rateLimit(`plan:${user.id}`, 3, 60 * 60 * 1000);
    const admin = srv.getServiceClient();
    if (!admin || !user.email) return { ok: false };
    const email = user.email.toLowerCase();
    const { data: row } = await admin
      .from("newsletter_subscribers")
      .select("id, segments")
      .eq("email", email)
      .maybeSingle();
    const segments = ((row as Row | null)?.segments as Row | undefined) ?? {};
    const interesses = new Set<string>(
      Array.isArray(segments.interesses) ? (segments.interesses as string[]) : [],
    );
    interesses.add("pai-de-valor");
    const next = { ...segments, interesses: Array.from(interesses) };
    if (row) {
      await admin
        .from("newsletter_subscribers")
        .update({ segments: next, user_id: user.id })
        .eq("id", (row as Row).id as string);
    } else {
      await admin
        .from("newsletter_subscribers")
        .insert({ email, user_id: user.id, source: "cadastro", status: "pending", segments: next });
    }
    return { ok: true };
  });
