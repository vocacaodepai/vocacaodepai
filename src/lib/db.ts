import { supabase } from "@/integrations/supabase/client";
import { getAnonId } from "@/lib/anon-id";
import { uploadImageFn } from "@/lib/media.functions";
import {
  POST_SELECT,
  PUBLISHED,
  nowIso,
  queryCategories,
  queryPostsByCategorySlug,
  queryPublishedPosts,
  querySearchPosts,
  searchResultToPost,
  toPostWithRelations,
  type BlogPost,
  type DbClient,
  type PublishedPostsOpts,
} from "./queries";
import type { Comment, Post, PostWithRelations } from "./types";

// TODO Fase 3 (Loja do Pai: products, saved_items), Fase 5 (Área do Pai: children,
// saved_items) e Fase 7 (Irmandade: stories): funções de leitura/escrita voltam aqui.

// Os tipos gerados (src/integrations/supabase/types.ts) ainda são os do VDM e
// serão regenerados; as consultas do blog usam o client "solto" e os tipos
// locais de src/lib/queries.ts (colunas e funções da 0002_blog.sql).
const db = supabase as unknown as DbClient;

export const fetchCategories = () => queryCategories(db);

export const fetchPublishedPosts = (opts: PublishedPostsOpts) => queryPublishedPosts(db, opts);

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await db
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso())
    .maybeSingle();
  if (error) throw error;
  return data ? toPostWithRelations(data as Record<string, unknown>) : null;
}

/** 3 posts da mesma categoria (ou os mais recentes) para o "Continue lendo". */
export async function fetchRelatedPosts(post: Post, limit = 3): Promise<BlogPost[]> {
  let query = db
    .from("posts")
    .select(POST_SELECT)
    .eq("status", PUBLISHED)
    .lte("publish_at", nowIso())
    .neq("id", post.id);

  if (post.category_id) {
    query = query.eq("category_id", post.category_id);
  }

  const { data, error } = await query.order("publish_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toPostWithRelations);
}

/** Busca via `search_posts(p_query, p_limit, p_offset)` (doc 02 §4.2). */
export async function searchPosts(query: string, limit = 20, offset = 0): Promise<BlogPost[]> {
  const rows = await querySearchPosts(db, query, limit, offset);
  return rows.map(searchResultToPost);
}

export async function registerView(postId: string) {
  // `increment_post_views(p_post_id, p_user_key)`: conta uma visualização por
  // leitor (logado ou id anônimo) por post por dia, em vez de somar a cada
  // carregamento.
  await db.rpc("increment_post_views", { p_post_id: postId, p_user_key: getAnonId() });
}

/* ---------------- Comments ---------------- */

export async function fetchApprovedComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_id, author_name, content, status, created_at")
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Comment[];
}

/**
 * Comentário de membro logado (RLS da 0002: `auth.uid() = user_id` e nasce
 * `pending`; aparece só depois de aprovado no admin).
 */
export async function submitComment(input: {
  post_id: string;
  user_id: string;
  author_name: string;
  content: string;
}) {
  const { error } = await db.from("comments").insert({ ...input, status: "pending" });
  if (error) throw error;
}

/* ---------------- Reactions (likes / saves) ---------------- */

// `reactions.type` na 0002 é 'like' | 'useful' | 'saved'; a UI fala em "save".
const REACTION_TYPE: Record<"like" | "save", "like" | "saved"> = { like: "like", save: "saved" };

/**
 * Estado das reações: o total de curtidas vem de `posts.like_count` (público);
 * "curti/salvei" só é lido para usuário logado (RLS `reactions: own read`).
 * Anônimo começa sem marcação e o `toggle_reaction` devolve o estado real.
 */
export async function fetchReactions(postId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: postRow } = await db
    .from("posts")
    .select("like_count")
    .eq("id", postId)
    .maybeSingle();
  const likes = Number((postRow as { like_count?: number } | null)?.like_count ?? 0);

  let likedByMe = false;
  let savedByMe = false;
  if (user) {
    const { data } = await db
      .from("reactions")
      .select("type")
      .eq("post_id", postId)
      .eq("user_key", user.id);
    const types = new Set(((data ?? []) as { type: string }[]).map((r) => r.type));
    likedByMe = types.has("like");
    savedByMe = types.has("saved");
  }
  return { likes, saves: 0, likedByMe, savedByMe };
}

export async function toggleReaction(postId: string, type: "like" | "save") {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userKey = user?.id ?? getAnonId();
  const { data, error } = await db.rpc("toggle_reaction", {
    p_post_id: postId,
    p_type: REACTION_TYPE[type],
    p_user_key: userKey,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as
    { active: boolean; count: number } | undefined;
  return { active: Boolean(row?.active), count: Number(row?.count ?? 0) };
}

/** Artigos que o usuário logado curtiu ou salvou (para a área de membros). */
export async function fetchMyArticleActivity(): Promise<
  { post_id: string; type: "like" | "save" }[]
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await db
    .from("reactions")
    .select("post_id, type")
    .eq("user_key", user.id)
    .in("type", ["like", "saved"]);
  if (error) throw error;
  return ((data ?? []) as { post_id: string; type: string }[]).map((r) => ({
    post_id: r.post_id,
    type: r.type === "saved" ? "save" : "like",
  }));
}

/** Busca vários artigos pelo id (título e slug, para listar na conta). */
export async function fetchPostsByIds(ids: string[]): Promise<PostWithRelations[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from("posts").select(POST_SELECT).in("id", ids);
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toPostWithRelations);
}

/* ---------------- Newsletter & contact ---------------- */

export async function subscribeNewsletter(email: string, source: string) {
  const { error } = await supabase
    .from("subscribers")
    .insert({ email, status: "subscribed", source });
  if (error) throw error;
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { error } = await supabase.from("contact_messages").insert(input as never);
  if (error) throw error;
}

/** Posts de uma categoria do blog (por slug), para seções cruzadas. */
export const fetchPostsByCategorySlug = (slug: string, limit = 3) =>
  queryPostsByCategorySlug(db, slug, limit);

/* ---------------- Quiz gamification ---------------- */

export interface QuizAttempt {
  id: string;
  user_id: string;
  post_id: string;
  score: number;
  total: number;
  created_at: string;
}

export interface QuizRankRow {
  user_id: string;
  full_name: string | null;
  points: number;
  quizzes: number;
}

/** Submit a quiz result. Throws if the user already submitted this post. */
export async function submitQuiz(postId: string, score: number, total: number) {
  const { data, error } = await supabase.rpc("submit_quiz", {
    p_post_id: postId,
    p_score: score,
    p_total: total,
  });
  if (error) throw error;
  return data as { ok: boolean; score: number; total: number };
}

/** The logged user's attempt on a specific post (null if not played yet). */
export async function fetchMyAttempt(postId: string): Promise<QuizAttempt | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("user_id", user.id)
    .eq("post_id", postId)
    .maybeSingle();
  if (error) throw error;
  return (data as QuizAttempt) ?? null;
}

/** Total points the logged user has accumulated across quizzes. */
export async function fetchMyQuizPoints(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data, error } = await supabase.from("quiz_attempts").select("score");
  if (error) throw error;
  return (data ?? []).reduce((acc, row) => acc + ((row as { score: number }).score ?? 0), 0);
}

/** Ranking global, melhores pais primeiro. */
export async function fetchQuizRanking(limit = 100): Promise<QuizRankRow[]> {
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: unknown }>
  )("quiz_ranking", { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as QuizRankRow[];
}

/* ---------------- Admin / auth ---------------- */

export async function signUp(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/** Envia e-mail de redefinição de senha. */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin`,
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function fetchMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.rpc("get_my_profile");
  if (error) throw error;
  return (data as unknown as { id: string; full_name: string; role: string } | null) ?? null;
}

/** Update the logged user's own profile (name, bio, avatar, signature). */
export async function updateMyProfile(input: {
  full_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not logged in");
  const { error } = await supabase.from("profiles").update(input).eq("id", user.id);
  if (error) throw error;
}

export async function fetchAllPosts(): Promise<PostWithRelations[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[]).map(toPostWithRelations);
}

export async function fetchPostById(id: string): Promise<PostWithRelations | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toPostWithRelations(data as Record<string, unknown>) : null;
}

export async function createPost(input: Partial<Post>): Promise<Post> {
  const { data, error } = await supabase
    .from("posts")
    .insert(input as never)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Post;
}

export async function updatePost(id: string, input: Partial<Post>) {
  const { error } = await supabase
    .from("posts")
    .update(input as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deletePost(id: string) {
  const { error } = await db.from("posts").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchCommentsAdmin(status?: string): Promise<Comment[]> {
  const { data, error } = await supabase.rpc("admin_list_comments", {
    p_status: status ?? undefined,
  });
  if (error) throw error;
  return (data ?? []) as unknown as Comment[];
}

export async function moderateComment(id: string, status: Comment["status"]) {
  const { error } = await supabase.from("comments").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSubscribers() {
  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchContactMessages() {
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteContactMessage(id: string) {
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadImage(
  dataUrl: string,
  folder: "covers" | "inline" | "stories" | "avatars",
) {
  const { url } = await uploadImageFn({ data: { dataUrl, folder } });
  if (!url) throw new Error("upload falhou");
  return url;
}

/* ---------------- Existing slugs (for unique slug generation) ---------------- */

export async function fetchAllSlugs(): Promise<string[]> {
  const { data, error } = await db.from("posts").select("slug");
  if (error) throw error;
  return (data ?? []).map((r) => r.slug as string);
}
