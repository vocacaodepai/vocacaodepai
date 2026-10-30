import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createReadOnlySupabaseClient } from "./seo.functions";
import { readingTime } from "./content";
import type { PostWire } from "./hub.functions";
import { queryLatestJobs } from "./pai-indica-pai/queries";
import type { JobPublic } from "./pai-indica-pai/types";
import type { Category, PostWithRelations } from "./types";

// Consultas extras da home (doc 03 §5.2): vitrine do Pai Indica (posts com
// kind review/comparativo/lista) e as 14 categorias-mãe do blog. Vivem aqui,
// separadas de hub.functions.ts, para a home evoluir sem mexer nos hubs do
// blog (blog, categoria) que outras etapas mantêm.
//
// As colunas `kind` e `product_score` (posts) e `parent_id` (categories)
// existem no banco (0002_blog.sql) mas ainda não nos tipos gerados do
// Supabase; por isso as consultas saem com o client sem tipagem de tabela.

/** Post do Pai Indica como chega na home (sem body, com a nota editorial). */
export interface PaiIndicaPost extends PostWithRelations {
  kind: "review" | "comparativo" | "lista" | "artigo" | "noticia";
  product_score: number | null;
}

export interface HomeExtras {
  paiIndica: PostWire[];
  mainCategories: Category[];
  /** Últimas 3 vagas aprovadas e ao vivo (view `jobs_public`, Fase 6) para o bloco da home. */
  latestJobs: JobPublic[];
}

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

async function queryPaiIndica(db: SupabaseClient): Promise<PostWire[]> {
  const { data, error } = await db
    .from("posts")
    .select("*, category:categories(id, slug, name, description, icon, sort_order)")
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .in("kind", ["review", "comparativo", "lista"])
    .order("publish_at", { ascending: false })
    .limit(6);
  if (error) throw error;
  // Cards não precisam do corpo nem do texto de busca (mesmo padrão de hub.functions).
  return (data ?? []).map((row: Record<string, unknown>) => {
    const post = row as unknown as PaiIndicaPost;
    return {
      ...post,
      body: { type: "doc", content: [] },
      search_content: "",
      reading_minutes: readingTime(post.body),
    };
  }) as unknown as PostWire[];
}

async function queryMainCategories(db: SupabaseClient): Promise<Category[]> {
  const { data, error } = await db
    .from("categories")
    .select("id, slug, name, description, icon, sort_order")
    .is("parent_id", null)
    .lt("sort_order", 900)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export const getHomeExtras = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeExtras> => {
    const db = await createReadOnlySupabaseClient();
    const untyped = db as unknown as SupabaseClient;
    const [paiIndica, mainCategories, latestJobs] = await Promise.all([
      safe(queryPaiIndica(untyped), [] as PostWire[]),
      safe(queryMainCategories(untyped), [] as Category[]),
      safe(queryLatestJobs(untyped, 3), [] as JobPublic[]),
    ]);
    return { paiIndica, mainCategories, latestJobs };
  },
);

export const unwirePaiIndica = (posts: PostWire[] | undefined) =>
  (posts ?? []) as unknown as PaiIndicaPost[];
