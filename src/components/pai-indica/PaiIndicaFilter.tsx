import { useEffect, useState } from "react";
import { kindLabels, type PaiIndicaKind } from "@/lib/pai-indica/types";
import { ProductCategoryFilter } from "./ProductCategoryFilter";
import { cardsOf, chipClass, clearKey, setHidden } from "./filterVisibility";

export type PaiIndicaFilterData = Record<
  PaiIndicaKind | "todos",
  {
    categories: { slug: string; name: string }[];
    subcategories: { slug: string; name: string; category: string }[];
  }
>;

/**
 * Primeiro o tipo (Todos / Review individual / Comparativo / Lista); depois categoria e
 * subcategoria de produto, só com as opções que existem dentro do tipo escolhido.
 * Filtra no navegador escondendo <article data-kind data-product-category data-product-subcategory>.
 */
export function PaiIndicaFilter({
  data,
  rootId,
  className = "",
  initialCategory = "todos",
}: {
  data: PaiIndicaFilterData;
  rootId: string;
  className?: string;
  initialCategory?: string;
}) {
  const [kind, setKind] = useState<"todos" | PaiIndicaKind>("todos");
  function select(next: "todos" | PaiIndicaKind) {
    setKind(next);
    cardsOf(rootId).forEach((card) =>
      setHidden(card, "kind", !(next === "todos" || card.dataset.kind === next)),
    );
  }
  useEffect(() => () => clearKey(rootId, "kind"), [rootId]);
  const kinds = Object.keys(kindLabels) as PaiIndicaKind[];
  return (
    <div className={className}>
      <nav aria-label="Filtrar por tipo de Pai Indica">
        <ul className="no-scrollbar flex snap-x flex-wrap gap-2 pb-1">
          <li>
            <button
              type="button"
              aria-pressed={kind === "todos"}
              className={chipClass(kind === "todos")}
              onClick={() => select("todos")}
            >
              Todos
            </button>
          </li>
          {kinds.map((k) => (
            <li key={k}>
              <button
                type="button"
                aria-pressed={kind === k}
                title={kindLabels[k].help}
                className={chipClass(kind === k)}
                onClick={() => select(k)}
              >
                {kindLabels[k].label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {kind === "todos"
          ? kinds.map((k) => `${kindLabels[k].label}: ${kindLabels[k].help}`).join(" ")
          : kindLabels[kind].help}
      </p>
      <ProductCategoryFilter
        key={kind}
        categories={data[kind].categories}
        subcategories={data[kind].subcategories}
        rootId={rootId}
        initialCategory={initialCategory}
        className="mt-3"
      />
    </div>
  );
}
