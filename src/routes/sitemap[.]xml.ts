import { createFileRoute } from "@tanstack/react-router";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { PUBLISHED, nowIso } from "@/lib/queries";
import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/tools/registry";

// Sitemap (doc 03 §6.6 + doc 04 §5.3 + doc 05 §7): home, blog, Pai Indica, Loja do Pai
// (/loja, /loja/categoria/<slug>, /loja/<slug> ativos), páginas institucionais, categorias
// e posts publicados (artigo/noticia em /post, review/comparativo/lista em /pai-indica).
// SEM os placeholders das seções futuras (/ferramentas, /area-do-pai, /pai-indica-pai):
// cada fase acrescenta as suas rotas quando elas existirem de verdade. Fase 7 acrescentou
// /irmandade, /historias, /perguntas, /eventos, /formacao, /desafios e os detalhes publicados.
const STATIC_PAGES: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/blog", changefreq: "daily", priority: "0.9" },
  { path: "/pai-indica", changefreq: "daily", priority: "0.9" },
  { path: "/sobre", changefreq: "monthly", priority: "0.5" },
  { path: "/contato", changefreq: "monthly", priority: "0.4" },
  { path: "/politica-de-privacidade", changefreq: "yearly", priority: "0.2" },
  { path: "/termos-de-uso", changefreq: "yearly", priority: "0.2" },
  { path: "/politica-de-afiliados", changefreq: "yearly", priority: "0.2" },
  // Fase 3 — Loja do Pai
  { path: "/loja", changefreq: "daily", priority: "0.8" },
  // Fase 5 — Área do Pai: só as públicas (/area-do-pai e /minha-conta são noindex)
  { path: "/entrar", changefreq: "monthly", priority: "0.3" },
  { path: "/cadastro", changefreq: "monthly", priority: "0.4" },
  // Fase 7 — Irmandade e Formação (doc 09 §10.1)
  { path: "/irmandade", changefreq: "daily", priority: "0.7" },
  { path: "/historias", changefreq: "daily", priority: "0.7" },
  { path: "/perguntas", changefreq: "daily", priority: "0.7" },
  { path: "/eventos", changefreq: "weekly", priority: "0.6" },
  { path: "/formacao", changefreq: "weekly", priority: "0.8" },
  { path: "/desafios", changefreq: "weekly", priority: "0.7" },
];

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function toLastmod(value: string | null | undefined): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function urlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

interface PostRow {
  slug: string;
  kind: string | null;
  updated_at: string | null;
  publish_at: string | null;
}
const PAI_INDICA_KINDS = new Set(["review", "comparativo", "lista"]);

interface CategoryRow {
  slug: string;
  parent_id: string | null;
  sort_order: number;
}

interface ProductRow {
  slug: string;
  updated_at: string | null;
}

interface ProductCategoryRow {
  slug: string;
}

interface SlugRow {
  slug: string;
  updated_at: string | null;
}

async function buildSitemap(): Promise<string> {
  const supabase = await createReadOnlySupabaseClient();

  // TODO Fase 6 (vagas) e 7 (histórias):
  // acrescentar as rotas quando as páginas existirem.
  const [
    postsRes,
    categoriesRes,
    productCategoriesRes,
    productsRes,
    storiesRes,
    questionsRes,
    eventsRes,
    tracksRes,
    challengesRes,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, kind, updated_at, publish_at")
      .eq("status", PUBLISHED)
      .lte("publish_at", nowIso())
      .order("publish_at", { ascending: false }),
    supabase.from("categories").select("slug, parent_id, sort_order").order("sort_order"),
    // Fase 3 — Loja do Pai: categorias e produtos ativos (RLS já filtra active = true).
    supabase.from("product_categories").select("slug").order("sort_order"),
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("active", true)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true }),
    // Fase 7 — Irmandade e Formação (RLS já filtra approved/published).
    supabase
      .from("stories")
      .select("id, updated_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase
      .from("questions")
      .select("slug, updated_at")
      .in("status", ["approved", "closed"])
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("starts_at", { ascending: true }),
    supabase
      .from("tracks")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("sort_order"),
    supabase
      .from("challenges")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("sort_order"),
  ]);

  const today = toLastmod(null);
  const entries: string[] = STATIC_PAGES.map((p) =>
    urlEntry(`${SITE_URL}${p.path}`, today, p.changefreq, p.priority),
  );

  // Fase 4 (doc 06 §4.1): índice + uma URL por ferramenta do registry.
  entries.push(urlEntry(`${SITE_URL}/ferramentas`, today, "weekly", "0.8"));
  for (const t of TOOLS) {
    const live = Boolean(t.usesMarketData);
    entries.push(
      urlEntry(
        `${SITE_URL}/ferramentas/${t.slug}`,
        today,
        live ? "hourly" : "monthly",
        live ? "0.9" : "0.7",
      ),
    );
  }

  // Categorias-mãe primeiro (prioridade maior), subcategorias depois.
  const categories = ((categoriesRes.data ?? []) as unknown as CategoryRow[]).filter(
    (c) => c.sort_order < 900,
  );
  for (const category of categories) {
    entries.push(
      urlEntry(
        `${SITE_URL}/categoria/${category.slug}`,
        today,
        "daily",
        category.parent_id ? "0.6" : "0.7",
      ),
    );
  }

  // Pai Indica (review/comparativo/lista) tem canônico único em /pai-indica/<slug>;
  // /post/<slug> desses posts redireciona (301) e fica fora do sitemap.
  for (const post of (postsRes.data ?? []) as unknown as PostRow[]) {
    const prefix = PAI_INDICA_KINDS.has(post.kind ?? "") ? "/pai-indica" : "/post";
    entries.push(
      urlEntry(
        `${SITE_URL}${prefix}/${post.slug}`,
        toLastmod(post.updated_at ?? post.publish_at),
        "weekly",
        "0.8",
      ),
    );
  }

  for (const category of (productCategoriesRes.data ?? []) as unknown as ProductCategoryRow[]) {
    entries.push(urlEntry(`${SITE_URL}/loja/categoria/${category.slug}`, today, "weekly", "0.7"));
  }
  for (const product of (productsRes.data ?? []) as unknown as ProductRow[]) {
    entries.push(
      urlEntry(`${SITE_URL}/loja/${product.slug}`, toLastmod(product.updated_at), "weekly", "0.7"),
    );
  }

  for (const s of (storiesRes.data ?? []) as unknown as {
    id: string;
    updated_at: string | null;
  }[]) {
    entries.push(
      urlEntry(`${SITE_URL}/historias/${s.id}`, toLastmod(s.updated_at), "monthly", "0.5"),
    );
  }
  for (const q of (questionsRes.data ?? []) as unknown as SlugRow[]) {
    entries.push(
      urlEntry(`${SITE_URL}/perguntas/${q.slug}`, toLastmod(q.updated_at), "weekly", "0.6"),
    );
  }
  for (const e of (eventsRes.data ?? []) as unknown as SlugRow[]) {
    entries.push(
      urlEntry(`${SITE_URL}/eventos/${e.slug}`, toLastmod(e.updated_at), "weekly", "0.6"),
    );
  }
  for (const t of (tracksRes.data ?? []) as unknown as SlugRow[]) {
    entries.push(
      urlEntry(`${SITE_URL}/formacao/${t.slug}`, toLastmod(t.updated_at), "monthly", "0.7"),
    );
  }
  for (const c of (challengesRes.data ?? []) as unknown as SlugRow[]) {
    entries.push(
      urlEntry(`${SITE_URL}/desafios/${c.slug}`, toLastmod(c.updated_at), "monthly", "0.7"),
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const xml = await buildSitemap();
          return new Response(xml, {
            headers: {
              "content-type": "application/xml; charset=utf-8",
              "cache-control": "public, max-age=3600, s-maxage=3600",
            },
          });
        } catch (error) {
          console.error("[sitemap.xml] failed to build:", error);
          return new Response(
            '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
            {
              status: 500,
              headers: { "content-type": "application/xml; charset=utf-8" },
            },
          );
        }
      },
    },
  },
});
