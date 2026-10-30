// Consultas públicas compartilhadas entre o navegador (src/lib/db.ts) e os
// loaders SSR (src/lib/hub.functions.ts). Recebem o client como parâmetro para
// rodar tanto com o client do navegador quanto com o read-only do servidor.
//
// Colunas e funções seguem supabase/migrations/0002_blog.sql (posts.kind,
// seo_title, product_score, categories.parent_id/color…). Os tipos gerados em
// src/integrations/supabase/types.ts ainda são os do VDM e serão regenerados;
// por isso as consultas usam o client sem o genérico `Database` e os
// resultados são convertidos para os tipos locais declarados abaixo.
// TODO Fase 3 (Loja do Pai) e Fase 7 (Irmandade): consultas de products e stories.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Author, Category, PostWithRelations } from "./types";

// Client "solto" (sem o genérico Database): aceita tanto o client tipado do
// navegador quanto o read-only do servidor.
export type DbClient = SupabaseClient;

/** Categoria com as colunas da 0002 (parent_id = null → categoria-mãe). */
export interface BlogCategory extends Category {
  parent_id: string | null;
  color: string | null;
  pillar: "casa" | "trabalho" | "corpo" | "alma" | null;
  /** Categoria-mãe (só preenchida em getPostFull, para subcategorias). */
  parent?: { id: string; slug: string; name: string; icon: string | null } | null;
}

export type PostKind = "artigo" | "noticia" | "review" | "comparativo" | "lista";

// O `body` do post é JSON livre do Tiptap (attrs: Record<string, unknown>) e o
// validador de serialização do TanStack Start não aceita `unknown`. Na
// fronteira servidor→página os posts viajam como JSON genérico e a página
// converte de volta para BlogPost (unwirePosts em hub.functions.ts).
type Serialized =
  string | number | boolean | null | Serialized[] | { [key: string]: Serialized | undefined };
export type PostWire = Serialized;

/** Post com as colunas da 0002 que o tipo herdado do VDM não conhece. */
export interface BlogPost extends PostWithRelations {
  kind: PostKind;
  seo_title: string | null;
  seo_description: string | null;
  product_category: string | null;
  product_subcategory: string | null;
  product_score: number | null;
  reading_time: number | null;
  category?: BlogCategory | null;
}

export const POST_SELECT = `*, category:categories(*), author:profiles(id, display_name, bio, avatar_url, role)`;
export const PUBLISHED = "published";

/** Categorias técnicas (pai-indica, noticias) ficam fora do filtro do blog. */
export const TECHNICAL_SORT_ORDER = 900;

export const nowIso = () => new Date().toISOString();

/**
 * `profiles` tem `display_name` (doc 02); o tipo herdado do VDM usa
 * `full_name`. Preenche os dois para os componentes antigos continuarem lendo.
 */
export function toPostWithRelations(row: Record<string, unknown>): BlogPost {
  const rawAuthor = row["author"] as (Partial<Author> & { display_name?: string }) | null;
  const author: Author | null = rawAuthor
    ? ({
        ...rawAuthor,
        full_name: rawAuthor.display_name ?? rawAuthor.full_name ?? "",
      } as Author)
    : null;
  return { ...row, author } as unknown as BlogPost;
}

export async function queryCategories(db: DbClient): Promise<BlogCategory[]> {
  const { data, error } = await db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BlogCategory[];
}

/** Só as categorias-mãe editoriais (sem subcategorias e sem as técnicas). */
export function motherCategories(all: BlogCategory[]): BlogCategory[] {
  return all.filter((c) => c.parent_id == null && c.sort_order < TECHNICAL_SORT_ORDER);
}

export function childCategories(all: BlogCategory[], parentId: string): BlogCategory[] {
  return all.filter((c) => c.parent_id === parentId);
}

export interface PublishedPostsOpts {
  limit?: number;
  /** Uma categoria só (compatibilidade). */
  categoryId?: string;
  /** Várias categorias (mãe + subcategorias). Tem precedência sobre categoryId. */
  categoryIds?: string[];
  offset?: number;
  orderBy?: "publish_at" | "view_count" | "like_count";
  excludeId?: string;
}

export async function queryPublishedPosts(
  db: DbClient,
  opts: PublishedPostsOpts,
): Promise<{ posts: BlogPost[]; total: number }> {
  let query = db
    .from("posts")
    .select(POST_SELECT, { count: "exact" })
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso());

  if (opts.categoryIds && opts.categoryIds.length > 0) {
    query = query.in("category_id", opts.categoryIds);
  } else if (opts.categoryId) {
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
    posts: ((data ?? []) as Record<string, unknown>[]).map(toPostWithRelations),
    total: count ?? 0,
  };
}

/** Posts de uma categoria do blog (por slug), para seções cruzadas. */
export async function queryPostsByCategorySlug(
  db: DbClient,
  slug: string,
  limit = 3,
): Promise<BlogPost[]> {
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
    .eq("category_id", (category as { id: string }).id)
    .order("publish_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toPostWithRelations);
}

/** Resultado de `search_posts(p_query, p_limit, p_offset)` (doc 02 §4.2). */
export interface SearchResult {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  kind: PostKind;
  product_score: number | null;
  category_slug: string | null;
  category_name: string | null;
  publish_at: string | null;
  rank: number;
}

export async function querySearchPosts(
  db: DbClient,
  q: string,
  limit = 20,
  offset = 0,
): Promise<SearchResult[]> {
  const term = q.trim();
  if (!term) return [];
  const { data, error } = await db.rpc("search_posts", {
    p_query: term,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data ?? []) as SearchResult[];
}

/** Converte um resultado da busca em algo que o PostCard sabe renderizar. */
export function searchResultToPost(r: SearchResult): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: null,
    excerpt: r.excerpt,
    cover_image_url: r.cover_image_url,
    cover_image_alt: null,
    category_id: null,
    tags: [],
    body: { type: "doc", content: [] },
    search_content: "",
    author_id: null,
    status: "published",
    publish_at: r.publish_at,
    seo_meta_title: null,
    seo_meta_description: null,
    view_count: 0,
    like_count: 0,
    created_at: r.publish_at ?? "",
    updated_at: r.publish_at ?? "",
    kind: r.kind,
    seo_title: null,
    seo_description: null,
    product_category: null,
    product_subcategory: null,
    product_score: r.product_score,
    reading_time: null,
    category: r.category_slug
      ? {
          id: "",
          slug: r.category_slug,
          name: r.category_name ?? r.category_slug,
          description: null,
          icon: null,
          sort_order: 0,
          parent_id: null,
          color: null,
          pillar: null,
        }
      : null,
    author: null,
  };
}
