// Tipos locais da Formação (trilhas, passos, desafios, progresso) — doc 09 §5 e §6.
import type { BadgeView } from "@/lib/irmandade/types";

// JSON serializável (o validador do TanStack Start não aceita `unknown` no body Tiptap).
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };

export type Pillar = "casa" | "trabalho" | "corpo" | "alma";
export type TrackLevel = "iniciante" | "intermediario" | "avancado";
export type StepType = "artigo" | "video" | "exercicio" | "checklist" | "leitura";
export type CompletionRule = "manual" | "read_post" | "video" | "checklist_all" | "exercise_text";

export const PILLAR_LABEL: Record<Pillar, string> = {
  casa: "Casa",
  trabalho: "Trabalho",
  corpo: "Corpo",
  alma: "Alma",
};
export const PILLAR_ORDER: Pillar[] = ["casa", "trabalho", "corpo", "alma"];
export const LEVEL_LABEL: Record<TrackLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};
export const STEP_TYPE_LABEL: Record<StepType, string> = {
  leitura: "Leitura",
  artigo: "Artigo",
  video: "Vídeo",
  checklist: "Checklist",
  exercicio: "Exercício",
};

export interface TrackRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  level: TrackLevel;
  estimated_minutes: number | null;
  estimated_days: number | null;
  audience: string | null;
  pillar: Pillar | null;
  is_premium: boolean;
  outcomes: string[];
  status: "draft" | "published" | "archived";
  sort_order: number;
  steps_count?: number;
}

export interface StepPost {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
}

export interface TrackStepRow {
  id: string;
  track_id: string;
  position: number;
  module: string | null;
  type: StepType;
  title: string;
  summary: string | null;
  body: JsonValue;
  completion_rule: CompletionRule;
  related_post_slug: string | null;
  post_id: string | null;
  video_url: string | null;
  estimated_minutes: number | null;
  post?: StepPost | null;
}

export interface TrackProgressRow {
  step_id: string;
  completed_at: string;
  note: string | null;
}

export interface ChallengeRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  days: number;
  pillar: Pillar | null;
  badge_slug: string | null;
  is_premium: boolean;
  status: "draft" | "published" | "archived";
  sort_order: number;
}

export interface ChallengeDayRow {
  id: string;
  challenge_id: string;
  day: number;
  title: string;
  task: string;
  reflection: string | null;
  body: JsonValue | null;
}

export interface ChallengeProgressRow {
  day: number;
  completed_at: string;
  note: string | null;
}

export interface MyChallengeState {
  started_at: string | null;
  finished_at: string | null;
  current_day: number;
  progress: ChallengeProgressRow[];
}

export interface FormacaoSummary {
  streak: number;
  points: number;
  title: string;
  tracks: Array<{
    slug: string;
    title: string;
    done: number;
    total: number;
    next_step: { position: number; title: string } | null;
  }>;
  challenges: Array<{
    slug: string;
    title: string;
    days: number;
    current_day: number;
    done: number;
    today: { title: string; task: string } | null;
  }>;
  badges: BadgeView[];
}

export interface MyFormacao {
  formacao: FormacaoSummary;
  badges_all: BadgeView[];
}
