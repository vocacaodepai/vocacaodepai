import { getRouteApi } from "@tanstack/react-router";
import { useSearchParams, Link } from "@/lib/router-compat";
import { Flame, Heart, Clock } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { Pagination } from "@/components/blog/Pagination";
import { AdSlot } from "@/components/blog/AdSlot";
import { cn } from "@/lib/utils";
import { unwirePosts } from "@/lib/hub.functions";

const blogRouteApi = getRouteApi("/_site/blog");

type SortKey = "recent" | "views" | "likes";

const SORT_OPTIONS: { key: SortKey; label: string; icon: typeof Clock }[] = [
  { key: "recent", label: "Mais recentes", icon: Clock },
  { key: "views", label: "Mais acessados", icon: Flame },
  { key: "likes", label: "Mais curtidos", icon: Heart },
];

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("categoria") ?? "";
  const sort = (searchParams.get("ordem") ?? "recent") as SortKey;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  // Lista, categorias e total vêm do loader da rota (SSR); qualquer troca de
  // filtro/página muda a URL e o loader roda de novo.
  const { categories, posts: wirePosts, total, perPage } = blogRouteApi.useLoaderData();
  const posts = unwirePosts(wirePosts);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const pickCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set("categoria", slug);
    else params.delete("categoria");
    params.delete("page");
    setSearchParams(params, { replace: false });
  };

  const pickSort = (key: SortKey) => {
    const params = new URLSearchParams(searchParams);
    if (key === "recent") params.delete("ordem");
    else params.set("ordem", key);
    params.delete("page");
    setSearchParams(params, { replace: false });
  };

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }]} />

      <AdSlot format="leaderboard" className="mt-6" />

      <header className="mt-6">
        <h1 className="font-display text-3xl font-bold md:text-4xl">
          Artigos para o pai, o marido e o provedor
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Todos os artigos do blog, organizados por categoria.
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">
          {total} {"artigos"}
        </p>
      </header>

      {/* Filters: categoria + ordenação */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => pickCategory("")}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              !activeCategory
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => pickCategory(cat.slug)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
                activeCategory === cat.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <span className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5">
          {SORT_OPTIONS.map((opt, i) => {
            const Icon = opt.icon;
            return (
              <span key={opt.key} className="flex items-center">
                {i > 0 && <span className="mx-1 h-4 w-px bg-border" />}
                <button
                  onClick={() => pickSort(opt.key)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors",
                    sort === opt.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-primary",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              </span>
            );
          })}
        </span>
      </div>

      <h2 className="mt-10 font-display text-2xl font-bold">{"Artigos recentes"}</h2>

      {posts.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">
          {"Ainda não há artigos publicados nesta categoria."}
        </p>
      ) : (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="mt-10">
            <Pagination page={page} totalPages={totalPages} basePath="/blog" />
          </div>
        </>
      )}

      {/* Tools banner (após a paginação) */}
      {/* TODO Fase 4 (Caixa de Ferramentas): banner de ferramentas */}
    </div>
  );
}
