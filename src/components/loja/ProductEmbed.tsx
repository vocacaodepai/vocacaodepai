import { useEffect, useState } from "react";
import { getProductsBySlugs } from "@/lib/loja/loja.functions";
import type { ProductLite } from "@/lib/loja/types";
import { productImageThumb } from "@/lib/image";
import { priceRangeSentence, productPriceRange } from "@/lib/loja/price-range";
import { BuyButton } from "./BuyButton";

export interface ProductEmbedData {
  slug: string;
  variant?: "card" | "inline";
}

/**
 * Cartão de produto único dentro de artigos (nó Tiptap `product`, doc 05 §6.2):
 * foto oficial 4:3 (contain), nome, marca, faixa de preço, botão "Comprar agora na
 * Amazon" e link "Ver análise completa" → /loja/$slug. Os dados vêm do server fn
 * `getProductsBySlugs` (nunca do Supabase direto).
 */
export function ProductEmbedWidget({ data }: { data: ProductEmbedData }) {
  const [product, setProduct] = useState<ProductLite | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    if (!data?.slug) {
      setState("missing");
      return;
    }
    let alive = true;
    getProductsBySlugs({ data: { slugs: [data.slug] } })
      .then((list) => {
        if (!alive) return;
        const p = list[0] ?? null;
        setProduct(p);
        setState(p ? "ok" : "missing");
      })
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [data?.slug]);

  if (state === "missing") return null;
  if (state === "loading" || !product) {
    return <div className="my-8 h-40 animate-pulse rounded-2xl bg-muted" aria-hidden="true" />;
  }

  const sentence = priceRangeSentence(productPriceRange(product));
  const inline = data.variant === "inline";

  return (
    <aside
      className="product-embed not-prose my-8 flex flex-col gap-4 rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center"
      aria-label={`Produto da Loja do Pai: ${product.name}`}
    >
      {product.image_url && (
        <a
          href={`/loja/${product.slug}`}
          className={inline ? "shrink-0 sm:w-24" : "shrink-0 sm:w-40"}
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={productImageThumb(product.image_url)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="mx-auto aspect-[4/3] w-full rounded-xl bg-white object-contain p-2"
            style={{ margin: 0, boxShadow: "none" }}
          />
        </a>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Loja do Pai</p>
        <p className="mt-1 font-display text-lg font-bold leading-snug text-foreground">
          {product.name}
        </p>
        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
        {sentence && <p className="mt-1 text-sm text-muted-foreground">{sentence}</p>}
        <a
          href={`/loja/${product.slug}`}
          className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
        >
          Ver análise completa
        </a>
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
        <BuyButton
          href={product.affiliate_url}
          network={product.affiliate_network}
          productName={product.name}
          className="rounded-xl shadow-soft"
        />
      </div>
    </aside>
  );
}
