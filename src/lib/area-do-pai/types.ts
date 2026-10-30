// Tipos locais da Área do Pai (Fase 5). Os tipos gerados do Supabase ainda são
// os herdados do VDM; as consultas usam estes tipos + casts explícitos.
import type { PhaseSlug } from "@/lib/phases";

export type MemberRole = "member" | "editor" | "admin";

/** Linha de public.profiles (0001_core + colunas da 0013). */
export interface MemberProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: MemberRole;
  bio: string | null;
  city: string | null;
  uf: string | null;
  onboarding_done: boolean;
  newsletter_opt_in: boolean;
  interests: string[];
  consent_terms_at: string | null;
  consent_privacy_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ChildSex = "M" | "F";

export interface Child {
  id: string;
  user_id: string;
  name: string | null;
  birth_date: string;
  birth_precision: "day" | "month";
  sex: ChildSex;
  created_at: string;
}

export interface ChildWithPhase extends Child {
  phase: PhaseSlug;
}

export type SavedItemType = "post" | "product" | "tool" | "job" | "track";
export const SAVED_ITEM_TYPES: SavedItemType[] = ["post", "product", "tool", "job", "track"];

export interface SavedItem {
  id: string;
  item_type: SavedItemType;
  item_id: string;
  created_at: string;
}

/** Item salvo hidratado para exibição (título/link/capa vindos da tabela de origem). */
export interface SavedItemView extends SavedItem {
  title: string;
  href: string;
  image: string | null;
  subtitle: string | null;
  /** false quando o registro de origem não existe mais (post arquivado, produto inativo…). */
  found: boolean;
}

export interface RecommendedPost {
  post_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  kind: string;
  phase: string;
}

export interface BadgeView {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  earned_at: string | null;
}

export type NewsletterStatus = "none" | "pending" | "confirmed" | "unsubscribed";

export interface MarketSnapshot {
  usdBrl: number | null;
  eurBrl: number | null;
  btcBrl: number | null;
  selic: number | null;
  fetchedAt: string | null;
}

export interface PainelData {
  profile: MemberProfile | null;
  children: ChildWithPhase[];
  recommended: RecommendedPost[];
  savedCount: number;
  savedRecent: SavedItemView[];
  tracksInProgress: Array<{ slug: string; title: string; done: number; total: number }>;
  activeChallenges: Array<{ slug: string; title: string; day: number; days: number }>;
  badges: BadgeView[];
  myJobs: Array<{ slug: string; title: string; status: string }>;
  myReferrals: Array<{ id: string; slug: string | null; title: string; status: string }>;
  myStories: Array<{ id: string; title: string; status: string }>;
  newsletter: { status: NewsletterStatus };
  plan: { slug: string; name: string; premium: boolean };
  /** null quando market_cache está vazia (o bloco "Mercado do pai hoje" não aparece). */
  market: MarketSnapshot | null;
}

export const EMPTY_PAINEL: PainelData = {
  profile: null,
  children: [],
  recommended: [],
  savedCount: 0,
  savedRecent: [],
  tracksInProgress: [],
  activeChallenges: [],
  badges: [],
  myJobs: [],
  myReferrals: [],
  myStories: [],
  newsletter: { status: "none" },
  plan: { slug: "gratuito", name: "Pai de Família", premium: false },
  market: null,
};

export interface PlanView {
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  interval: "month" | "year";
  features: string[];
  active: boolean;
}

export const PLAN_NAMES: Record<string, string> = {
  gratuito: "Pai de Família",
  "pai-de-valor": "Pai de Valor",
};
