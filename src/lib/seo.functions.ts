import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  POST_SELECT,
  PUBLISHED,
  nowIso,
  toPostWithRelations,
  type BlogPost,
  type PostWire,
} from "./queries";

// Fallback to the same public URL/publishable key baked into the client bundle
// (src/integrations/supabase/client.ts). These are not secrets — the
// publishable key is already shipped to every browser — so using them here
// when the VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY env vars aren't configured
// on the server keeps SSR working instead of silently 404ing every page.
// Placeholders substituídos pelos valores reais no fim da Etapa 1 (doc 03 §1.3).
// Sem variáveis (placeholder ainda não preenchido) o servidor precisa responder com estados vazios,
// não quebrar na criação do cliente ("Invalid supabaseUrl").
const FALLBACK_SUPABASE_URL = "https://placeholder.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "placeholder-key";

// Client sem o genérico `Database`: os tipos gerados ainda são os do VDM e
// serão regenerados; as consultas usam os tipos locais de src/lib/queries.ts.
export async function createReadOnlySupabaseClient(): Promise<SupabaseClient> {
  const { createClient } = await import("@supabase/supabase-js");
  const url = (process.env["VITE_SUPABASE_URL"] || "").startsWith("http")
    ? process.env["VITE_SUPABASE_URL"]!
    : FALLBACK_SUPABASE_URL;
  const key = process.env["VITE_SUPABASE_ANON_KEY"] || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export interface PostSeo {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  imageAlt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  authorName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  kind: string;
  productScore: number | null;
  faq: { question: string; answer: string }[];
}

// Public, read-only SEO payload for the article route head().
// Uses the publishable key so it works during SSR/prerender without a session.
// Colunas conforme 0002_blog.sql: seo_title, seo_description, cover_image_alt, kind…
export const getPostSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "") }))
  .handler(async ({ data }): Promise<PostSeo | null> => {
    if (!data.slug) return null;

    const supabase = await createReadOnlySupabaseClient();

    const { data: row } = await supabase
      .from("posts")
      .select(
        "slug, title, subtitle, excerpt, seo_title, seo_description, cover_image_url, cover_image_alt, publish_at, updated_at, status, kind, product_score, faq, author:profiles(display_name), category:categories(name, slug)",
      )
      .eq("slug", data.slug)
      .eq("status", PUBLISHED)
      .lte("publish_at", nowIso())
      .maybeSingle();

    if (!row) return null;
    const post = row as Record<string, unknown>;

    const author = post["author"] as { display_name?: string } | null;
    const category = post["category"] as { name?: string; slug?: string } | null;
    const rawFaq = post["faq"];
    const faq = Array.isArray(rawFaq)
      ? (rawFaq as Array<{ question?: unknown; answer?: unknown }>)
          .filter((item) => typeof item?.question === "string" && typeof item?.answer === "string")
          .map((item) => ({ question: String(item.question), answer: String(item.answer) }))
      : [];

    return {
      slug: post["slug"] as string,
      title: (post["seo_title"] as string | null) || (post["title"] as string),
      description:
        (post["seo_description"] as string | null) ||
        (post["excerpt"] as string | null) ||
        (post["subtitle"] as string | null) ||
        (post["title"] as string),
      image: (post["cover_image_url"] as string | null) ?? null,
      imageAlt: (post["cover_image_alt"] as string | null) ?? null,
      publishedAt: (post["publish_at"] as string | null) ?? null,
      updatedAt: (post["updated_at"] as string | null) ?? null,
      authorName: author?.display_name ?? null,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
      kind: (post["kind"] as string | null) ?? "artigo",
      productScore: (post["product_score"] as number | null) ?? null,
      faq,
    };
  });

// Full article payload for the post route loader — used both for head() SEO
// tags and to render the article body during SSR, so Googlebot's first-wave
// (non-JS) crawl sees real content instead of the client-fetch loading
// skeleton. Client-side interactivity (reactions, related posts, quiz
// ranking) still loads separately in PostPage.
export const getPostFull = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "") }))
  .handler(async ({ data }): Promise<PostWire | null> => {
    if (!data.slug) return null;

    const supabase = await createReadOnlySupabaseClient();

    const { data: post } = await supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("slug", data.slug)
      .eq("status", PUBLISHED)
      .lte("publish_at", nowIso())
      .maybeSingle();

    if (!post) return null;
    const full = toPostWithRelations(post as Record<string, unknown>);

    // Subcategoria: anexa a categoria-mãe (slug/nome) para breadcrumb e avisos
    // (ContentNotice casa pela mãe, ex.: corpo-e-saude-do-homem).
    const parentId = full.category?.parent_id ?? null;
    if (parentId) {
      const { data: parent } = await supabase
        .from("categories")
        .select("id, slug, name, icon")
        .eq("id", parentId)
        .maybeSingle();
      if (parent && full.category) {
        full.category = {
          ...full.category,
          parent: parent as { id: string; slug: string; name: string; icon: string | null },
        };
      }
    }
    // Viaja como JSON genérico (ver PostWire em queries.ts).
    return full as unknown as PostWire;
  });

/** 3 posts da mesma categoria para o "Continue lendo" (doc 03 §6.2), no servidor. */
export const getRelatedPosts = createServerFn({ method: "GET" })
  .inputValidator((data: { postId: string; categoryId: string | null }) => ({
    postId: String(data.postId ?? ""),
    categoryId: data.categoryId ? String(data.categoryId) : null,
  }))
  .handler(async ({ data }): Promise<PostWire[]> => {
    if (!data.postId) return [];
    const supabase = await createReadOnlySupabaseClient();
    let query = supabase
      .from("posts")
      .select(POST_SELECT)
      .eq("status", PUBLISHED)
      .lte("publish_at", nowIso())
      .neq("id", data.postId);
    if (data.categoryId) query = query.eq("category_id", data.categoryId);
    const { data: rows } = await query.order("publish_at", { ascending: false }).limit(3);
    const posts: BlogPost[] = ((rows ?? []) as Record<string, unknown>[]).map((row) => {
      const post = toPostWithRelations(row);
      return { ...post, body: { type: "doc", content: [] }, search_content: "" };
    });
    return posts as unknown as PostWire[];
  });

export interface CategorySeo {
  slug: string;
  name: string;
  description: string | null;
}

// Public, read-only SEO payload for the category route head().
export const getCategorySeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "") }))
  .handler(async ({ data }): Promise<CategorySeo | null> => {
    if (!data.slug) return null;

    const supabase = await createReadOnlySupabaseClient();

    const { data: category } = await supabase
      .from("categories")
      .select("slug, name, description")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!category) return null;
    const row = category as Record<string, unknown>;
    return {
      slug: row["slug"] as string,
      name: row["name"] as string,
      description: (row["description"] as string | null) ?? null,
    };
  });

// TODO Fase 3 (Loja do Pai) e Fase 7 (Irmandade): getProductSeo e getStorySeo.
