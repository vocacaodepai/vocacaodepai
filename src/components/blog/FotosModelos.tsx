import { useEffect, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { getProductsBySlugs } from "@/lib/loja/loja.functions";
import type { ProductLite } from "@/lib/loja/types";
import { priceRangeLabel, productPriceRange } from "@/lib/loja/price-range";
import { AFFILIATE_REL } from "@/lib/loja/affiliate";

/* ------------------------------------------------------------------ */
/* Tipos do conteúdo do widget (vêm do atributo `data` do nó TipTap)   */
/* ------------------------------------------------------------------ */

export interface FotoModelo {
  /** URL da foto oficial do produto (Amazon). */
  src: string;
  /** Nome do modelo. */
  name: string;
  /** Link de compra na Amazon. */
  href: string;
  /** Slug do produto na Loja do Pai. */
  slug?: string;
}

export interface FotosModelosData {
  modelos: FotoModelo[];
}

/* ------------------------------------------------------------------ */
/* Widget React: fotos oficiais lado a lado com faixa de preço e botão.*/
/* Quando o modelo tem `slug`, os dados (foto, link com a tag, faixa)  */
/* vêm de `products` pelo server fn getProductsBySlugs (doc 05 §6.2).  */
/* ------------------------------------------------------------------ */

export function FotosModelosWidget({ data }: { data: FotosModelosData }) {
  const modelos = useMemo(
    () => (Array.isArray(data?.modelos) ? data.modelos.filter((m) => m && m.name) : []),
    [data],
  );
  const slugs = useMemo(
    () => modelos.map((m) => m.slug).filter((s): s is string => Boolean(s)),
    [modelos],
  );
  const [products, setProducts] = useState<Record<string, ProductLite>>({});

  useEffect(() => {
    if (slugs.length === 0) return;
    let alive = true;
    getProductsBySlugs({ data: { slugs } })
      .then((list) => {
        if (!alive) return;
        setProducts(Object.fromEntries(list.map((p) => [p.slug, p])));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slugs]);

  if (modelos.length === 0) return null;

  return (
    <div className="fotos-modelos my-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {modelos.map((m, i) => {
          const p = m.slug ? products[m.slug] : undefined;
          const src = m.src || p?.image_url || "";
          const href = p?.affiliate_url || m.href;
          const info = productPriceRange(p);
          return (
            <div
              key={i}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft"
            >
              <div className="flex aspect-square items-center justify-center bg-white p-2">
                {src ? (
                  <img
                    src={src}
                    alt={m.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Foto oficial em breve</span>
                )}
              </div>
              <div className="flex flex-1 flex-col items-center gap-1.5 p-2.5 text-center">
                <p className="text-xs font-bold leading-snug text-foreground">{m.name}</p>
                {info && (
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {priceRangeLabel(info)}
                    {info.checkedOn ? ` (${info.checkedOn})` : ""}: <strong>{info.text}</strong>
                  </p>
                )}
                {m.slug && (
                  <a
                    href={`/loja/${m.slug}`}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Ver análise
                  </a>
                )}
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel={AFFILIATE_REL}
                    className="btn-comprar mt-auto inline-flex min-h-9 w-full flex-wrap items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold leading-snug"
                    style={{
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                    Comprar agora na Amazon
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
