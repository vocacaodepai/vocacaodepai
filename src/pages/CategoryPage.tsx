import { getRouteApi } from "@tanstack/react-router";
import { Link, useParams, useSearchParams } from "@/lib/router-compat";
import { ArrowRight } from "lucide-react";
import { PostCard } from "@/components/blog/PostCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { Pagination } from "@/components/blog/Pagination";
import { CategoryIcon } from "@/components/blog/category-icon";
import { AdSlot } from "@/components/blog/AdSlot";
import { unwirePosts } from "@/lib/hub.functions";

const categoryRouteApi = getRouteApi("/_site/categoria/$slug");

export default function CategoryPage() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  // Categoria e posts vêm do loader da rota (SSR); categoria inexistente já
  // vira 404 no próprio loader.
  const { category, posts: wirePosts, total, perPage } = categoryRouteApi.useLoaderData();
  const posts = unwirePosts(wirePosts);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: category?.name ?? slug, path: `/categoria/${slug}` }]} />

      <AdSlot format="leaderboard" className="mt-6" />

      <header className="mt-6 flex items-start gap-4 rounded-2xl border border-border bg-gradient-soft p-6 shadow-soft md:items-center">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/70 text-secondary-foreground">
          <CategoryIcon name={category?.icon} className="h-7 w-7" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold">{category?.name ?? slug}</h1>
          {category?.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
          )}
          <p className="mt-2 text-xs font-semibold text-primary">
            {total} {total === 1 ? "artigo" : "artigos"}
          </p>
        </div>
      </header>

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
            <Pagination page={page} totalPages={totalPages} basePath={`/categoria/${slug}`} />
          </div>

          {/* Conheça a nossa loja */}
          {/* TODO Fase 3 (Loja do Pai): StorePromo */}

          {/* TODO Fase 4 (Caixa de Ferramentas): banner de ferramentas */}
        </>
      )}
    </div>
  );
}
