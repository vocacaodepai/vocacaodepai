import { useEffect, useState } from "react";
import { cardsOf, chipClass, clearKey, setHidden } from "./filterVisibility";

type Cat = { slug: string; name: string };
type Sub = { slug: string; name: string; category: string };

/** Segunda camada do filtro: categoria → subcategoria de produto (doc 04 §4.4), no navegador. */
export function ProductCategoryFilter({
  categories,
  subcategories,
  rootId,
  className = "",
  initialCategory = "todos",
}: {
  categories: Cat[];
  subcategories: Sub[];
  rootId: string;
  className?: string;
  initialCategory?: string;
}) {
  const [cat, setCat] = useState(initialCategory);
  const [sub, setSub] = useState("todos");

  function apply(c: string, s: string) {
    cardsOf(rootId).forEach((card) => {
      const okC = c === "todos" || card.dataset.productCategory === c;
      const okS = s === "todos" || card.dataset.productSubcategory === s;
      setHidden(card, "prod", !(okC && okS));
    });
  }
  useEffect(() => {
    if (initialCategory !== "todos") apply(initialCategory, "todos");
    return () => clearKey(rootId, "prod");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootId]);

  const subs = subcategories.filter((s) => s.category === cat);
  return (
    <div className={className}>
      <nav aria-label="Filtrar por categoria de produto">
        <ul className="no-scrollbar flex snap-x flex-wrap gap-2 pb-1">
          <li>
            <button
              type="button"
              aria-pressed={cat === "todos"}
              className={chipClass(cat === "todos")}
              onClick={() => {
                setCat("todos");
                setSub("todos");
                apply("todos", "todos");
              }}
            >
              Todas as categorias
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                aria-pressed={cat === c.slug}
                className={chipClass(cat === c.slug)}
                onClick={() => {
                  setCat(c.slug);
                  setSub("todos");
                  apply(c.slug, "todos");
                }}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {cat !== "todos" && subs.length > 0 && (
        <nav aria-label="Filtrar por tipo de produto" className="mt-2">
          <ul className="no-scrollbar flex snap-x flex-wrap gap-2 pb-1">
            <li>
              <button
                type="button"
                aria-pressed={sub === "todos"}
                className={chipClass(sub === "todos", true)}
                onClick={() => {
                  setSub("todos");
                  apply(cat, "todos");
                }}
              >
                Todos
              </button>
            </li>
            {subs.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  aria-pressed={sub === s.slug}
                  className={chipClass(sub === s.slug, true)}
                  onClick={() => {
                    setSub(s.slug);
                    apply(cat, s.slug);
                  }}
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
