import { createServerFn } from "@tanstack/react-start";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";

export interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  reading_time: number | null;
  category: { slug: string; name: string } | null;
}

/** Artigos relacionados a uma ferramenta: 1) full-text pelos termos, 2) completa por categoria. Nunca quebra. */
export const getRelatedPostsForTool = createServerFn({ method: "GET" })
  .inputValidator((d: { categories: string[]; terms: string[] }) => ({
    categories: (d.categories ?? []).slice(0, 4).map(String),
    terms: (d.terms ?? []).slice(0, 6).map(String),
  }))
  .handler(async ({ data }): Promise<RelatedPost[]> => {
    const out: RelatedPost[] = [];
    try {
      const sb = await createReadOnlySupabaseClient();
      const select =
        "slug,title,excerpt,cover_image_url,reading_time,category:categories!inner(slug,name)";
      if (data.terms.length) {
        const q = data.terms.map((t) => `'${t.replace(/'/g, "")}'`).join(" | ");
        const { data: rows } = await sb
          .from("posts")
          .select(select)
          .eq("status", "published")
          .textSearch("search_content", q, { config: "portuguese" })
          .limit(4);
        out.push(...((rows ?? []) as unknown as RelatedPost[]));
      }
      if (out.length < 4 && data.categories.length) {
        const { data: rows } = await sb
          .from("posts")
          .select(select)
          .eq("status", "published")
          .in("categories.slug", data.categories)
          .order("publish_at", { ascending: false })
          .limit(8);
        for (const r of (rows ?? []) as unknown as RelatedPost[]) {
          if (out.length >= 4) break;
          if (!out.some((o) => o.slug === r.slug)) out.push(r);
        }
      }
    } catch (e) {
      console.warn("[tools] related posts", (e as Error).message);
    }
    return out;
  });

/** Quais slugs de /post/ estão publicados (para só linkar o que existe). */
export const getPublishedSlugs = createServerFn({ method: "GET" })
  .inputValidator((d: { slugs: string[] }) => ({ slugs: (d.slugs ?? []).slice(0, 40).map(String) }))
  .handler(async ({ data }): Promise<string[]> => {
    if (!data.slugs.length) return [];
    try {
      const sb = await createReadOnlySupabaseClient();
      const { data: rows } = await sb
        .from("posts")
        .select("slug")
        .eq("status", "published")
        .in("slug", data.slugs);
      return ((rows ?? []) as Array<{ slug: string }>).map((r) => r.slug);
    } catch {
      return [];
    }
  });
