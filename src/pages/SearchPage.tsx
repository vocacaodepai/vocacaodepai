import { useEffect, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { Search } from "lucide-react";
import { searchPosts } from "@/lib/db";
import type { PostWithRelations } from "@/lib/types";
import { PostCard } from "@/components/blog/PostCard";
import { useSeo } from "@/lib/seo";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<PostWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useSeo({
    title: q ? `${"Resultados para"} "${q}"` : "Buscar no blog",
    description: "Buscar no blog",
    canonicalPath: "/busca",
    noindex: true,
  });

  useEffect(() => {
    if (!q) {
      setResults([]);
      setSearched(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchPosts(q)
      .then((r) => {
        if (!cancelled) {
          setResults(r);
          setSearched(true);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div className="container py-10">
      <h1 className="font-display text-3xl font-bold">{"Buscar no blog"}</h1>

      <form onSubmit={submit} className="mt-6 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <label htmlFor="site-search" className="sr-only">
            {"O que você procura? Ex.: sono, amamentação, desfralde"}
          </label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="site-search"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"O que você procura? Ex.: sono, amamentação, desfralde"}
            className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          type="submit"
          className="h-12 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          {"Buscar"}
        </button>
      </form>

      {q && (
        <p className="mt-6 text-sm text-muted-foreground">
          {"Resultados para"} <strong className="text-foreground">"{q}"</strong>
          {!loading && searched && (
            <>
              {" "}
              · {results.length} {"resultados"}
            </>
          )}
        </p>
      )}

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {searched && results.length === 0 && (
        <p className="mt-8 text-center text-muted-foreground">
          {"Nenhum artigo encontrado para a sua busca. Tente outros termos."}
        </p>
      )}
    </div>
  );
}
