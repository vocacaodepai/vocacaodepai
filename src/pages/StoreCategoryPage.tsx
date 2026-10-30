import { useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { ArrowRight, Gift } from "lucide-react";
import { STORE_CATEGORY_META, storeCategoryIcon, subcategoryName } from "@/lib/loja/categories";
import { ProductCard } from "@/components/loja/ProductCard";
import { AffiliateNotice } from "@/components/loja/AffiliateNotice";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/_site/loja/categoria/$slug");

type SortMode = "relevancia" | "menor-faixa" | "maior-nota";

/**
 * /loja/categoria/$slug (doc 05 §4.6): cabeçalho com ícone, chips de subcategoria
 * (valores distintos de `products.subcategory`), ordenação (relevância, menor
 * faixa, maior nota de compradores), grade de ProductCard, "Outras categorias".
 */
export default function StoreCategoryPage() {
  const { category, categories, products } = routeApi.useLoaderData();
  const [sub, setSub] = useState("");
  const [sort, setSort] = useState<SortMode>("relevancia");
  const meta = STORE_CATEGORY_META[category.slug];
  const Icon = storeCategoryIcon(category.slug);

  const subcategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.subcategory) set.add(p.subcategory);
    return [...set].sort((a, b) => subcategoryName(a).localeCompare(subcategoryName(b), "pt-BR"));
  }, [products]);

  const list = useMemo(() => {
    const base = products.filter((p) => !sub || p.subcategory === sub);
    if (sort === "menor-faixa") {
      return [...base].sort(
        (a, b) => (a.price_min ?? a.price ?? 1e9) - (b.price_min ?? b.price ?? 1e9),
      );
    }
    if (sort === "maior-nota") {
      return [...base].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    return base;
  }, [products, sub, sort]);

  const others = categories.filter((c) => c.id !== category.id);

  return (
    <div className="pb-12">
      <div className="container py-6">
        <Breadcrumbs
          items={[
            { name: "Loja do Pai", path: "/loja" },
            { name: category.name, path: `/loja/categoria/${category.slug}` },
          ]}
        />
      </div>

      <header className="container">
        <div className="flex items-start gap-4 rounded-3xl bg-gradient-soft p-6 shadow-soft md:p-8">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Icon className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Loja do Pai</p>
            <h1 className="mt-1 font-display text-3xl font-bold leading-tight md:text-4xl">
              {category.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/80 md:text-base">
              {category.description ?? meta?.description ?? ""}
            </p>
          </div>
        </div>
      </header>

      <section className="container mt-8" aria-labelledby="cat-products-title">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="cat-products-title" className="font-display text-2xl font-bold">
              {list.length} {list.length === 1 ? "produto" : "produtos"}
              {sub ? ` em ${subcategoryName(sub)}` : ""}
            </h2>
          </div>
          <label className="text-sm">
            <span className="mr-2 text-muted-foreground">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-semibold"
            >
              <option value="relevancia">Relevância</option>
              <option value="menor-faixa">Menor faixa de preço</option>
              <option value="maior-nota">Maior nota de compradores</option>
            </select>
          </label>
        </div>

        {subcategories.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Subcategorias">
            <button type="button" onClick={() => setSub("")} className={chip(!sub)}>
              Todas
            </button>
            {subcategories.map((s) => (
              <button key={s} type="button" onClick={() => setSub(s)} className={chip(sub === s)}>
                {subcategoryName(s)}
              </button>
            ))}
          </div>
        )}

        {list.length > 0 ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <p className="font-display text-xl font-bold">Ainda não há produtos nesta categoria.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Os produtos entram com review longa, faixa de preço pesquisada e botão direto para a
              Amazon. Enquanto isso, veja as outras categorias.
            </p>
          </div>
        )}
      </section>

      <AdSlot format="leaderboard" className="container mt-10" />

      {/* Procurando presente? (doc 05 §4.12: /loja/presentes é rota futura; por ora, categorias) */}
      <section className="container mt-12" aria-labelledby="outras-title">
        <h2 id="outras-title" className="font-display text-2xl font-bold">
          Outras categorias
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {others.map((c) => {
            const OtherIcon = storeCategoryIcon(c.slug);
            return (
              <Link
                key={c.id}
                to={`/loja/categoria/${c.slug}`}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft transition-colors hover:border-primary"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  <OtherIcon className="h-4 w-4" />
                </span>
                <span className="text-sm font-bold leading-snug">{c.name}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
        <Link
          to="/loja"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-bold shadow-soft transition-colors hover:border-primary hover:text-primary"
        >
          <Gift className="h-4 w-4" />
          Procurando presente? Veja a loja inteira
        </Link>
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
