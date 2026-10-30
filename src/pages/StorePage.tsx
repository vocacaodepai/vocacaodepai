import { useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Link, useSearchParams } from "@/lib/router-compat";
import { ArrowRight, Search, X } from "lucide-react";
import type { ProductCategory } from "@/lib/loja/types";
import { STORE_CATEGORY_META, storeCategoryIcon, subcategoryName } from "@/lib/loja/categories";
import { matchesProductQuery } from "@/lib/loja/queries";
import { ProductCard } from "@/components/loja/ProductCard";
import { AffiliateNotice } from "@/components/loja/AffiliateNotice";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { cn } from "@/lib/utils";

const storeRouteApi = getRouteApi("/_site/loja/");

/**
 * /loja — Loja do Pai (doc 05 §4.5): hero com o slogan e a promessa, faixa de 10
 * cards de categoria, "Destaques do Pai" (featured, até 8), busca local (?q=),
 * grade de todos os produtos com filtro por categoria (chips) e subcategoria
 * (select), ordem `featured desc, sort_order`. Tudo vem do loader (SSR).
 */
export default function StorePage() {
  const { categories, products } = storeRouteApi.useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoria = searchParams.get("categoria") ?? "";
  const subcategoria = searchParams.get("subcategoria") ?? "";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key === "categoria") next.delete("subcategoria");
    setSearchParams(next, { replace: true });
  };

  const countByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products)
      if (p.category_id) m.set(p.category_id, (m.get(p.category_id) ?? 0) + 1);
    return m;
  }, [products]);

  const activeCategory = categories.find((c) => c.slug === categoria) ?? null;

  const subcategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (activeCategory && p.category_id !== activeCategory.id) continue;
      if (p.subcategory) set.add(p.subcategory);
    }
    return [...set].sort((a, b) => subcategoryName(a).localeCompare(subcategoryName(b), "pt-BR"));
  }, [products, activeCategory]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (!activeCategory || p.category_id === activeCategory.id) &&
          (!subcategoria || p.subcategory === subcategoria) &&
          matchesProductQuery(p, query),
      ),
    [products, activeCategory, subcategoria, query],
  );

  const featured = useMemo(() => products.filter((p) => p.featured).slice(0, 8), [products]);
  const isFiltering = Boolean(activeCategory || subcategoria || query.trim());

  return (
    <div className="pb-12">
      <div className="container py-6">
        <Breadcrumbs items={[{ name: "Loja do Pai", path: "/loja" }]} />
      </div>

      {/* Hero: slogan e promessa (doc 05 §1.1) */}
      <section className="container" aria-labelledby="loja-title">
        <div className="rounded-3xl bg-gradient-soft p-6 shadow-soft md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Loja do Pai</p>
          <h1
            id="loja-title"
            className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl"
          >
            O pai também quer desconto.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/80 md:text-lg">
            Aqui só entra o que a gente colocaria na própria casa, na própria oficina ou na própria
            churrasqueira: produto bom, com marca e modelo de verdade, análise honesta e a faixa de
            preço que você encontra hoje na internet. Sem achismo, sem preço inventado.
          </p>
          <form
            role="search"
            className="mt-6 flex max-w-xl items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setParam("q", query.trim());
            }}
          >
            <label className="relative flex-1">
              <span className="sr-only">Buscar produto</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, marca ou tipo (ex.: parafusadeira)"
                className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </label>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setParam("q", "");
                }}
                aria-label="Limpar busca"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </form>
        </div>
      </section>

      {/* 10 cards de categoria */}
      <section className="container mt-10" aria-labelledby="categorias-title">
        <h2 id="categorias-title" className="font-display text-2xl font-bold md:text-3xl">
          Por onde começar
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} count={countByCategory.get(c.id) ?? 0} />
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground sm:col-span-2 lg:col-span-5">
              As categorias aparecem assim que o catálogo for publicado.
            </p>
          )}
        </div>
      </section>

      {/* Destaques do Pai */}
      {featured.length > 0 && !isFiltering && (
        <section className="container mt-12" aria-labelledby="destaques-title">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 id="destaques-title" className="font-display text-2xl font-bold md:text-3xl">
                Destaques do Pai
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Os produtos que a gente indicaria primeiro, com review e faixa de preço.
              </p>
            </div>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <AdSlot format="leaderboard" className="container mt-10" />

      {/* Grade com filtros */}
      <section className="container mt-12" aria-labelledby="todos-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="todos-title" className="font-display text-2xl font-bold md:text-3xl">
              {activeCategory ? activeCategory.name : "Todos os produtos"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "produto" : "produtos"}
              {query.trim() ? ` para "${query.trim()}"` : ""}
            </p>
          </div>
          {subcategories.length > 1 && (
            <label className="text-sm">
              <span className="sr-only">Subcategoria</span>
              <select
                value={subcategoria}
                onChange={(e) => setParam("subcategoria", e.target.value)}
                className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-semibold"
              >
                <option value="">Todas as subcategorias</option>
                {subcategories.map((s) => (
                  <option key={s} value={s}>
                    {subcategoryName(s)}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
          <button
            type="button"
            onClick={() => setParam("categoria", "")}
            className={chip(!activeCategory)}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setParam("categoria", c.slug)}
              className={chip(activeCategory?.id === c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="font-display text-xl font-bold">
              {products.length === 0
                ? "A Loja do Pai está sendo abastecida."
                : "Nenhum produto com esse filtro."}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {products.length === 0
                ? "Os primeiros produtos entram com review longa, faixa de preço pesquisada e botão direto para a Amazon."
                : "Tente outra categoria ou limpe a busca."}
            </p>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSearchParams(new URLSearchParams(), { replace: true });
                }}
                className="mt-4 inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-bold hover:border-primary hover:text-primary"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </section>

      <div className="container mt-12">
        <AffiliateNotice />
      </div>
    </div>
  );
}

function chip(active: boolean) {
  return cn(
    "rounded-full border px-4 py-1.5 text-xs font-bold transition-colors",
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
  );
}

function CategoryCard({ category, count }: { category: ProductCategory; count: number }) {
  const Icon = storeCategoryIcon(category.slug);
  const meta = STORE_CATEGORY_META[category.slug];
  return (
    <Link
      to={`/loja/categoria/${category.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-3 font-display text-base font-bold leading-snug">{category.name}</span>
      <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {category.description ?? meta?.description ?? ""}
      </span>
      <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-primary">
        {count} {count === 1 ? "produto" : "produtos"}
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
