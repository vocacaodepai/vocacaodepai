import type { TipTapNode } from "./content";

// Tipos do Blog (Fase 1). Os tipos de Loja do Pai (products), Área do Pai
// (children, saved_items) e Irmandade (stories) voltam nas Fases 3, 5 e 7 com
// os nomes das COLUNAS-CHAVE do CLAUDE.md §8.

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface Author {
  id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  role: "admin" | "editor" | "author";
}

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  tags: string[];
  body: TipTapNode;
  excerpt: string | null;
  search_content: string;
  author_id: string | null;
  status: PostStatus;
  publish_at: string | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  faq?: FaqItem[];
  quiz?: QuizQuestion[];
  view_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithRelations extends Post {
  category?: Category | null;
  author?: Author | null;
  /** Minutos de leitura já calculados no servidor (listas vêm sem o body). */
  reading_minutes?: number;
  likes_count?: number;
  saves_count?: number;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}
