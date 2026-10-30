// Consultas públicas compartilhadas entre o navegador (src/lib/db.ts) e os
// loaders SSR (src/lib/hub.functions.ts). Recebem o client como parâmetro para
// rodar tanto com o client do navegador quanto com o read-only do servidor.
// TODO Fase 3 (Loja do Pai) e Fase 7 (Irmandade): consultas de products e stories.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Category, PostWithRelations } from "./types";

export type DbClient = SupabaseClient<Database>;

export const POST_SELECT = `*, category:categories(*), author:profiles(id, full_name, bio, avatar_url, role)`;
export const PUBLISHED = "published";

export const nowIso = () => new Date().toISOString();

export function toPostWithRelations(row: Record<string, unknown>): PostWithRelations {
  return row as unknown as PostWithRelations;
}

export async function queryCategories(db: DbClient): Promise<Category[]> {
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export interface PublishedPostsOpts {
  limit?: number;
  categoryId?: string;
  offset?: number;
  orderBy?: "publish_at" | "view_count" | "like_count";
  excludeId?: string;
}

export async function queryPublishedPosts(
  db: DbClient,
  opts: PublishedPostsOpts,
): Promise<{ posts: PostWithRelations[]; total: number }> {
  let query = db
    .from("posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso());

  if (opts.categoryId) {
    query = query.eq("category_id", opts.categoryId);
  }
  if (opts.excludeId) {
    query = query.neq("id", opts.excludeId);
  }
  query = query
    .order(opts.orderBy ?? "publish_at", { ascending: false })
    .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 12) - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    posts: (data ?? []).map(toPostWithRelations),
    total: count ?? 0,
  };
}

/** Posts de uma categoria do blog (por slug), para seções cruzadas. */
export async function queryPostsByCategorySlug(
  db: DbClient,
  slug: string,
  limit = 3,
): Promise<PostWithRelations[]> {
  const { data: category } = await db
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!category) return [];
  const { data, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso())
    .eq("category_id", category.id)
    .order("publish_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(toPostWithRelations);
}
