import { createServerFn } from "@tanstack/react-start";
import type { Database } from "@/integrations/supabase/types";

// Fallback to the same public URL/publishable key baked into the client bundle
// (src/integrations/supabase/client.ts). These are not secrets — the
// publishable key is already shipped to every browser — so using them here
// when the VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY env vars aren't configured
// on the server keeps SSR working instead of silently 404ing every page.
// Placeholders substituídos pelos valores reais no fim da Etapa 1 (doc 03 §1.3).
const FALLBACK_SUPABASE_URL = "<SUPABASE_URL>";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "<SUPABASE_PUBLISHABLE_KEY>";

export async function createReadOnlySupabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");
  const url = process.env["VITE_SUPABASE_URL"] || FALLBACK_SUPABASE_URL;
  const key = process.env["VITE_SUPABASE_ANON_KEY"] || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
  return createClient<Database>(url, key, {
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
  publishedAt: string | null;
  updatedAt: string | null;
  authorName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

// Public, read-only SEO payload for the article route head().
// Uses the publishable key so it works during SSR/prerender without a session.
export const getPostSeo = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "") }))
  .handler(async ({ data }): Promise<PostSeo | null> => {
    if (!data.slug) return null;

    const supabase = await createReadOnlySupabaseClient();

    const { data: post } = await supabase
      .from("posts")
      .select(
        "slug, title, subtitle, excerpt, seo_meta_title, seo_meta_description, cover_image_url, publish_at, updated_at, status, author:profiles(full_name), category:categories(name, slug)",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!post) return null;

    const author = post.author as { full_name?: string } | null;
    const category = post.category as { name?: string; slug?: string } | null;

    return {
      slug: post.slug as string,
      title: (post.seo_meta_title as string) || (post.title as string),
      description:
        (post.seo_meta_description as string) ||
        (post.excerpt as string) ||
        (post.subtitle as string) ||
        (post.title as string),
      image: (post.cover_image_url as string) ?? null,
      publishedAt: (post.publish_at as string) ?? null,
      updatedAt: (post.updated_at as string) ?? null,
      authorName: author?.full_name ?? null,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
    };
  });

// Full article payload for the post route loader — used both for head() SEO
// tags and to render the article body during SSR, so Googlebot's first-wave
// (non-JS) crawl sees real content instead of the client-fetch loading
// skeleton. Client-side interactivity (reactions, related posts, quiz
// ranking) still loads separately in PostPage.
export const getPostFull = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "") }))
  .handler(async ({ data }) => {
    if (!data.slug) return null;

    const supabase = await createReadOnlySupabaseClient();

    const { data: post } = await supabase
      .from("posts")
      .select("*, category:categories(*), author:profiles(id, full_name, bio, avatar_url, role)")
      .eq("slug", data.slug)
      .eq("status", "published")
      .lte("publish_at", new Date().toISOString())
      .maybeSingle();

    return post ?? null;
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
    return {
      slug: category.slug as string,
      name: category.name as string,
      description: (category.description as string) ?? null,
    };
  });

// TODO Fase 3 (Loja do Pai) e Fase 7 (Irmandade): getProductSeo e getStorySeo.
