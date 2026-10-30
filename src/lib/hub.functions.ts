import { createServerFn } from "@tanstack/react-start";
import { createReadOnlySupabaseClient } from "./seo.functions";
import { readingTime } from "./content";
import { queryCategories, queryPublishedPosts } from "./queries";
import type { Category, PostWithRelations } from "./types";

// TODO Fase 3 (Loja do Pai) e Fase 7 (Irmandade): getStoreData, getProductData,
// getStoriesData e getStoryData voltam aqui com as COLUNAS-CHAVE do CLAUDE.md §8.
// Dados das páginas-hub (home, blog, categoria) carregados no
// servidor pelos loaders das rotas, para o HTML já sair com o conteúdo em vez
// de um esqueleto que só enche depois do JavaScript rodar no navegador.
// Usam o client read-only (chave publicável), então só enxergam o que o RLS
// libera para o público.

const PER_PAGE = 9;

// O `body` do post é JSON livre do Tiptap (attrs: Record<string, unknown>) e o
// validador de serialização do TanStack Start não aceita `unknown`. Na
// fronteira servidor→página os posts viajam como JSON genérico e a página
// converte de volta para PostWithRelations (mesmo padrão do getPostFull).
type Serialized =
  string | number | boolean | null | Serialized[] | { [key: string]: Serialized | undefined };
export type PostWire = Serialized;
// Cards não precisam do corpo do artigo nem do texto de busca; mandar isso
// para o navegador só engordava o HTML (o body de 7 posts na home dava 300 KB).
const wire = (posts: PostWithRelations[]) =>
  posts.map((p) => ({
    ...p,
    body: { type: "doc", content: [] },
    search_content: "",
    reading_minutes: readingTime(p.body),
  })) as unknown as PostWire[];
export const unwirePosts = (posts: PostWire[] | undefined) =>
  (posts ?? []) as unknown as PostWithRelations[];

// Backend fora do ar não pode derrubar a página inteira: volta vazio e a
// página renderiza sem aquela seção.
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

const EMPTY_PAGE = { posts: [] as PostWithRelations[], total: 0 };

export interface HomeData {
  latest: PostWire[];
  popular: PostWire[];
  categories: Category[];
}

// A rotina publica vários reviews do Pai Indica por dia; sem isso a
// vitrine fica toda de reviews. Primeiro um artigo de cada categoria (mais
// recente de cada), depois completa por data, mantendo a ordem final por data.
function mixByCategory(posts: PostWithRelations[], size: number): PostWithRelations[] {
  const picked = new Set<string>();
  const seenCategories = new Set<string>();
  for (const post of posts) {
    if (picked.size >= size) break;
    const key = post.category?.slug ?? "sem-categoria";
    if (seenCategories.has(key)) continue;
    seenCategories.add(key);
    picked.add(post.id);
  }
  for (const post of posts) {
    if (picked.size >= size) break;
    picked.add(post.id);
  }
  return posts.filter((post) => picked.has(post.id));
}

export const getHomeData = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeData> => {
    const db = await createReadOnlySupabaseClient();
    const [latest, popular, categories] = await Promise.all([
      safe(queryPublishedPosts(db, { limit: 40 }), EMPTY_PAGE),
      safe(queryPublishedPosts(db, { limit: 4, orderBy: "view_count" }), EMPTY_PAGE),
      safe(queryCategories(db), [] as Category[]),
    ]);
    return {
      latest: wire(mixByCategory(latest.posts, 7)),
      popular: wire(popular.posts),
      categories,
    };
  },
);

export interface BlogParams {
  categoria: string;
  page: number;
  ordem: string;
}

export function parseBlogParams(search: Record<string, unknown>): BlogParams {
  return {
    categoria: search["categoria"] ? String(search["categoria"]) : "",
    page: Math.max(1, Number(search["page"] ?? 1) || 1),
    ordem: search["ordem"] ? String(search["ordem"]) : "recent",
  };
}

export interface BlogData {
  categories: Category[];
  posts: PostWire[];
  total: number;
  perPage: number;
}

export const getBlogData = createServerFn({ method: "GET" })
  .inputValidator((data: BlogParams) => parseBlogParams(data as unknown as Record<string, unknown>))
  .handler(async ({ data }): Promise<BlogData> => {
    const db = await createReadOnlySupabaseClient();
    const categories = await safe(queryCategories(db), [] as Category[]);
    const category = categories.find((c) => c.slug === data.categoria);
    const orderBy =
      data.ordem === "views" ? "view_count" : data.ordem === "likes" ? "like_count" : "publish_at";
    const res = await safe(
      queryPublishedPosts(db, {
        categoryId: category?.id,
        offset: (data.page - 1) * PER_PAGE,
        limit: PER_PAGE,
        orderBy,
      }),
      EMPTY_PAGE,
    );
    return { categories, posts: wire(res.posts), total: res.total, perPage: PER_PAGE };
  });

export interface CategoryData {
  category: Category | null;
  posts: PostWire[];
  total: number;
  perPage: number;
}

export const getCategoryData = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string; page?: number }) => ({
    slug: String(data.slug ?? ""),
    page: Math.max(1, Number(data.page ?? 1) || 1),
  }))
  .handler(async ({ data }): Promise<CategoryData> => {
    const db = await createReadOnlySupabaseClient();
    const categories = await safe(queryCategories(db), [] as Category[]);
    const category = categories.find((c) => c.slug === data.slug) ?? null;
    if (!category) return { category: null, posts: [], total: 0, perPage: PER_PAGE };
    const res = await safe(
      queryPublishedPosts(db, {
        categoryId: category.id,
        offset: (data.page - 1) * PER_PAGE,
        limit: PER_PAGE,
      }),
      EMPTY_PAGE,
    );
    return { category, posts: wire(res.posts), total: res.total, perPage: PER_PAGE };
  });
