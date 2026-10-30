import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { STORE_CATEGORIES } from "@/lib/loja/categories";
import { getStoreData } from "@/lib/loja/loja.functions";
import type { Product } from "@/lib/loja/types";
import { ProductCard } from "@/components/loja/ProductCard";
import { SectionHeading } from "./SectionHeading";

// Seção 8 da home (doc 03 §5.2 / doc 05 §4.9): slogan oficial, as 10 categorias
// da Loja do Pai e até 4 destaques (`featured`). A home não muda o loader
// (Home.tsx fica como está): os destaques chegam pelo server fn no cliente e a
// seção renderiza sem eles enquanto carrega ou se a loja estiver vazia.
const TEASER_CATEGORIES = STORE_CATEGORIES.slice(0, 5);

export function LojaTeaser() {
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true;
    getStoreData()
      .then((d) => alive && setFeatured(d.products.filter((p) => p.featured).slice(0, 4)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section aria-labelledby="loja-title">
      <SectionHeading
        id="loja-title"
        eyebrow="Loja do Pai"
        title="O pai também quer desconto"
        subtitle="Produtos que a gente indicaria para um irmão, com review honesta, faixa de preço pesquisada e botão direto para a Amazon."
        linkTo="/loja"
        linkLabel="Ver a loja"
      />
      {featured.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TEASER_CATEGORIES.map((category) => (
          <Link
            key={category.slug}
            to={`/loja/categoria/${category.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <category.icon className="h-5 w-5" />
            </span>
            <span className="mt-3 font-display text-base font-bold leading-snug">
              {category.name}
            </span>
            <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {category.description}
            </span>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-primary">
              Ver categoria
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        O Vocação de Pai participa do Programa de Associados da Amazon: quando você compra pelos
        nossos links, recebemos uma comissão, sem custo extra para você. Isso não muda a nota.{" "}
        <Link to="/politica-de-afiliados" className="font-semibold text-primary hover:underline">
          Política de afiliados
        </Link>
        .
      </p>
    </section>
  );
}
