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
  /** Faixa de preço já resolvida ("R$ X a R$ Y"), preenchida por prepareBody (Fase 2). */
  faixa?: string;
}

export interface FotosModelosData {
  modelos: FotoModelo[];
}

/* ------------------------------------------------------------------ */
/* Widget React: fotos oficiais lado a lado com faixa de preço e botão.*/
/* Duas origens de dados, nesta ordem:                                  */
/*  1. `products` (Fase 3): quando o modelo tem `slug`, foto oficial,   */
/*     link com a tag e faixa vêm do server fn getProductsBySlugs       */
/*     (doc 05 §6.2) e têm prioridade;                                   */
/*  2. o conteúdo do nó (Fase 2): `src`/`href`/`faixa` já resolvidos por */
/*     src/lib/pai-indica/body.ts (prepareBody) ou escritos no editor.  */
/* Sem slug, ou enquanto o produto não carrega, vale o conteúdo do nó;  */
/* `src` vazio é tolerado ("Foto oficial em breve").                     */
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
      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${modelos.length >= 4 ? "lg:grid-cols-5" : ""}`}
      >
        {modelos.map((m, i) => {
          const p = m.slug ? products[m.slug] : undefined;
          const src = p?.image_url || m.src || "";
          const href = p?.affiliate_url || m.href || "";
          const info = productPriceRange(p);
          const faixaLabel = info
            ? `${priceRangeLabel(info)}${info.checkedOn ? ` (${info.checkedOn})` : ""}`
            : "Faixa de preço";
          const faixaText = info ? info.text : m.faixa;
          return (
            <div
              key={m.slug ?? i}
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
                  <span className="px-2 text-center text-[11px] text-muted-foreground">
                    Foto oficial em breve
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col items-center gap-1.5 p-2.5 text-center">
                <p className="text-xs font-bold leading-snug text-foreground">{m.name}</p>
                {faixaText && (
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {faixaLabel}: <strong>{faixaText}</strong>
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
