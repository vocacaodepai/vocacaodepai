/**
 * Acesso a dados do painel administrativo (Etapa 8).
 *
 * Usa o cliente Supabase do navegador (sessão do editor/admin; RLS com
 * `public.is_admin()`). Os tipos gerados em `integrations/supabase/types.ts`
 * ainda são os herdados e serão regenerados, por isso as consultas aqui usam
 * tipos locais e casts explícitos.
 */
import { supabase } from "@/integrations/supabase/client";
import type { TipTapNode } from "@/lib/content";
import { slugify } from "@/lib/slugify";

export type PostKind = "artigo" | "noticia" | "review" | "comparativo" | "lista";
export type AdminPostStatus = "draft" | "scheduled" | "published" | "archived";

export interface AdminCategory {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  sort_order: number;
}

export interface AdminProfile {
  id: string;
  display_name: string;
  role: "member" | "editor" | "admin";
  avatar_url: string | null;
}

export interface AdminFaqItem {
  question: string;
  answer: string;
}

export interface AdminQuizItem {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body: TipTapNode;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  author_id: string | null;
  kind: PostKind;
  review: Record<string, unknown> | null;
  comparison: Record<string, unknown> | null;
  product_category: string | null;
  product_subcategory: string | null;
  product_score: number | null;
  faq: AdminFaqItem[];
  quiz: AdminQuizItem[];
  status: AdminPostStatus;
  publish_at: string | null;
  reading_time: number | null;
  view_count: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

/** Linha enxuta da lista do painel (sem body). */
export interface AdminPostRow {
  id: string;
  slug: string;
  title: string;
  kind: PostKind;
  status: AdminPostStatus;
  publish_at: string | null;
  updated_at: string;
  view_count: number;
  category: { id: string; name: string; slug: string } | null;
}

/** Campos gravados pelo editor (o restante é calculado por trigger). */
export type AdminPostInput = Omit<
  AdminPost,
  "created_at" | "updated_at" | "view_count" | "reading_time" | "id"
> & { id?: string };

// Cliente sem o tipo `Database` gerado (que ainda é o herdado).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/* ---------------- Sessão e guarda ---------------- */

export async function fetchAdminProfile(): Promise<AdminProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await db
    .from("profiles")
    .select("id, display_name, role, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as AdminProfile | null) ?? null;
}

/** `public.is_admin()`: true para `profiles.role in ('editor','admin')`. */
export async function fetchIsAdmin(): Promise<boolean> {
  const { data, error } = await db.rpc("is_admin");
  if (error) return false;
  return data === true;
}

/* ---------------- Categorias ---------------- */

export async function fetchAdminCategories(): Promise<AdminCategory[]> {
  const { data, error } = await db
    .from("categories")
    .select("id, slug, name, parent_id, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AdminCategory[];
}

/* ---------------- Posts ---------------- */

const ROW_SELECT =
  "id, slug, title, kind, status, publish_at, updated_at, view_count, category:categories(id, name, slug)";

export async function fetchAdminPosts(): Promise<AdminPostRow[]> {
  const { data, error } = await db
    .from("posts")
    .select(ROW_SELECT)
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as AdminPostRow[];
}

export async function fetchAdminPostById(id: string): Promise<AdminPost | null> {
  const { data, error } = await db.from("posts").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as AdminPost | null) ?? null;
}

/** Slug + título dos posts publicados (busca de link interno e "Continue lendo"). */
export async function fetchPublishedPostIndex(): Promise<
  { slug: string; title: string; kind: PostKind }[]
> {
  const { data, error } = await db
    .from("posts")
    .select("slug, title, kind")
    .eq("status", "published")
    .order("publish_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as { slug: string; title: string; kind: PostKind }[];
}

export async function fetchAllPostSlugs(): Promise<string[]> {
  const { data, error } = await db.from("posts").select("slug");
  if (error) throw error;
  return ((data ?? []) as { slug: string }[]).map((r) => r.slug);
}

/** Insere ou atualiza o post (upsert por id). Devolve a linha gravada. */
export async function upsertAdminPost(input: AdminPostInput): Promise<AdminPost> {
  const payload: Record<string, unknown> = { ...input };
  if (!payload.id) delete payload.id;
  const { data, error } = await db
    .from("posts")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as AdminPost;
}

export async function setAdminPostStatus(id: string, status: AdminPostStatus) {
  const { error } = await db.from("posts").update({ status }).eq("id", id);
  if (error) throw error;
}

/* ---------------- Capa (bucket `covers`) ---------------- */

/**
 * Envia a capa para o bucket público `covers` (policy "covers: staff write")
 * e devolve a URL pública. `dataUrl` vem de `compressToWebP`.
 */
export async function uploadCoverDataUrl(dataUrl: string, hint = "capa"): Promise<string> {
  const match = dataUrl.match(/^data:(image\/(webp|png|jpeg));base64,(.+)$/);
  if (!match) throw new Error("Formato não suportado (use webp, png ou jpeg).");
  const mime = match[1]!;
  const ext = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
  const bytes = Uint8Array.from(atob(match[3]!), (c) => c.charCodeAt(0));
  if (bytes.byteLength > 4 * 1024 * 1024) throw new Error("Imagem muito grande (máx. 4 MB).");
  const stamp = new Date().toISOString().slice(0, 10);
  const path = `${stamp}/${slugify(hint) || "capa"}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("covers")
    .upload(path, bytes, { contentType: mime, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("covers").getPublicUrl(path);
  return data.publicUrl;
}

/* ---------------- Moderação simples (comentários, contato, newsletter) ---------------- */

export interface AdminComment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  post: { slug: string; title: string } | null;
}

export async function fetchAdminComments(): Promise<AdminComment[]> {
  const { data, error } = await db
    .from("comments")
    .select("id, post_id, author_name, content, status, created_at, post:posts(slug, title)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AdminComment[];
}

export async function moderateAdminComment(id: string, status: AdminComment["status"]) {
  const { error } = await db.from("comments").update({ status }).eq("id", id);
  if (error) throw error;
}

export interface AdminContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
}

export async function fetchAdminContactMessages(): Promise<AdminContactMessage[]> {
  const { data, error } = await db
    .from("contact_messages")
    .select("id, name, email, subject, message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AdminContactMessage[];
}

export interface AdminSubscriber {
  id: string;
  email: string;
  status: string;
  source: string | null;
  created_at: string;
}

export async function fetchAdminSubscribers(): Promise<AdminSubscriber[]> {
  const { data, error } = await db
    .from("newsletter_subscribers")
    .select("id, email, status, source, created_at")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as AdminSubscriber[];
}

/** Cartão "Search Console" (vazio até a Fase 8 agendar a edge function). */
export async function fetchSeoSnapshot(): Promise<{
  clicks: number;
  impressions: number;
  rows: number;
  snapshot_date: string | null;
}> {
  const { data, error } = await db
    .from("seo_search_stats")
    .select("snapshot_date, clicks, impressions")
    .order("snapshot_date", { ascending: false })
    .limit(500);
  if (error || !data?.length) return { clicks: 0, impressions: 0, rows: 0, snapshot_date: null };
  const rows = data as { snapshot_date: string; clicks: number; impressions: number }[];
  const latest = rows[0]!.snapshot_date;
  const same = rows.filter((r) => r.snapshot_date === latest);
  return {
    clicks: same.reduce((a, r) => a + (r.clicks ?? 0), 0),
    impressions: same.reduce((a, r) => a + (r.impressions ?? 0), 0),
    rows: same.length,
    snapshot_date: latest,
  };
}
