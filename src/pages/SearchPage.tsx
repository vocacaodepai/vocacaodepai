import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Link, useSearchParams } from "@/lib/router-compat";
import { Search } from "lucide-react";
import { searchPosts } from "@/lib/db";
import type { BlogPost } from "@/lib/queries";
import { PostCard } from "@/components/blog/PostCard";
import { CategoryCard } from "@/components/blog/CategoryCard";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";

const searchRouteApi = getRouteApi("/_site/busca");

const PAGE_SIZE = 20;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const suggestions = searchRouteApi.useLoaderData() ?? [];

  // `search_posts(p_query, p_limit, p_offset)` (doc 02 §4.2): busca no título,
  // subtítulo, resumo e corpo, com peso e tolerância a acento.
  useEffect(() => {
    setInput(q);
    if (!q) {
      setResults([]);
      setSearched(false);
      setHasMore(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchPosts(q, PAGE_SIZE, 0)
      .then((r) => {
        if (!cancelled) {
          setResults(r);
          setHasMore(r.length === PAGE_SIZE);
          setSearched(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults([]);
          setSearched(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const more = await searchPosts(q, PAGE_SIZE, results.length);
      setResults((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = input.trim();
    if (term) setSearchParams({ q: term });
  };

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Busca", path: "/busca" }]} />
      <h1 className="mt-6 font-display text-3xl font-bold">Buscar no Vocação de Pai</h1>

      <form onSubmit={submit} className="mt-6 flex max-w-xl gap-2" role="search">
        <div className="relative flex-1">
          <label htmlFor="site-search" className="sr-only">
            O que você procura? Ex.: churrasco, orçamento, cadeirinha
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="site-search"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="O que você procura? Ex.: churrasco, orçamento, cadeirinha"
            className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          Buscar
        </button>
      </form>

      {q && (
        <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
          Resultados para <strong className="text-foreground">"{q}"</strong>
          {!loading && searched && (
            <>
              {" "}
              · {results.length} {results.length === 1 ? "resultado" : "resultados"}
              {hasMore ? "+" : ""}
            </>
          )}
        </p>
      )}

      {loading && results.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">Buscando…</p>
      )}

      {results.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-8 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex h-11 items-center rounded-xl border border-border bg-card px-6 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
          >
            Carregar mais resultados
          </button>
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="mt-8">
          <p className="text-center text-muted-foreground">
            Nada encontrado para "{q}". Tente outra palavra.
          </p>
        </div>
      )}

      {/* Sugestões de categorias: estado vazio e sem busca (doc 03 §6.4) */}
      {(!q || (searched && !loading && results.length === 0)) && suggestions.length > 0 && (
        <section className="mt-10" aria-labelledby="search-suggestions">
          <h2 id="search-suggestions" className="font-display text-xl font-bold">
            Explore por categoria
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.slice(0, 6).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Ou veja{" "}
            <Link to="/blog" className="font-semibold text-primary hover:underline">
              todos os artigos do blog
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}
