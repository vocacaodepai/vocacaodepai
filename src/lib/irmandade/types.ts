// Tipos locais da Irmandade (os tipos gerados do Supabase ainda são os do VDM).
import type { StoryCategory } from "./story-categories";

export type ModerationStatus = "pending" | "approved" | "rejected";

export interface StoryRow {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  category: StoryCategory | string;
  content: string;
  photo_url: string | null;
  status: ModerationStatus;
  like_count: number;
  created_at: string;
  updated_at: string;
  rejection_reason?: string | null;
  report_count?: number;
}

export interface MemberByline {
  display_name: string | null;
  avatar_url: string | null;
}

export interface QuestionCategory {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
}

export interface QuestionRow {
  id: string;
  slug: string;
  title: string;
  body: string;
  category_id: string | null;
  status: "pending" | "approved" | "rejected" | "closed";
  answers_count: number;
  accepted_answer_id: string | null;
  views: number;
  tags: string[];
  last_answer_at: string | null;
  created_at: string;
  user_id: string;
  categories: QuestionCategory | null;
  author: MemberByline | null;
  rejection_reason?: string | null;
  report_count?: number;
}

export interface AnswerRow {
  id: string;
  question_id?: string;
  body: string;
  like_count: number;
  status?: ModerationStatus;
  created_at: string;
  user_id: string;
  author: MemberByline | null;
}

export type EventMode = "online" | "presencial";
export type EventKind = "encontro" | "live" | "retiro" | "cafe-dos-pais" | "galpao-do-pai";
export type EventStatus = "draft" | "published" | "canceled" | "done";
export type RsvpStatus = "going" | "maybe" | "canceled";

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  mode: EventMode;
  kind: EventKind;
  city: string | null;
  uf: string | null;
  address: string | null;
  url: string | null;
  cover_image_url: string | null;
  capacity: number | null;
  status: EventStatus;
  organizer: string | null;
  price_text: string | null;
  rsvp_count: number;
  created_at: string;
  updated_at?: string;
}

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  encontro: "Encontro",
  live: "Live",
  retiro: "Retiro",
  "cafe-dos-pais": "Café dos pais",
  "galpao-do-pai": "Galpão do Pai",
};

export const REJECTION_REASONS = [
  "Fora da linha editorial",
  "Identifica terceiros",
  "Linguagem imprópria",
  "Conteúdo comercial",
  "Duplicado",
  "Outro",
];

export interface BadgeView {
  slug: string;
  name: string;
  description?: string | null;
  icon: string | null;
  earned_at: string | null;
}
