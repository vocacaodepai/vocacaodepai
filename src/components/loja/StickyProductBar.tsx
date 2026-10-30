import { useEffect, useState } from "react";
import type { Product } from "@/lib/loja/types";
import { productImageThumb } from "@/lib/image";
import { productPriceRange } from "@/lib/loja/price-range";
import { BuyButton } from "./BuyButton";

/**
 * Barra fixa de compra da página do produto (doc 05 §4.7): nome + faixa + botão,
 * `position: fixed; bottom: 0`, só no celular (`md:hidden`), depois de rolar.
 */
export function StickyProductBar({ product }: { product: Product }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show || !product.affiliate_url) return null;
  const info = productPriceRange(product);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-2.5 shadow-elegant backdrop-blur md:hidden print:hidden">
      <div className="flex items-center gap-3">
        {product.image_url && (
          <img
            src={productImageThumb(product.image_url)}
            alt=""
            className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain p-1"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{product.name}</p>
          {info && (
            <p className="truncate text-xs text-muted-foreground">
              {info.kind === "estimate" ? "Faixa estimada" : "Faixa de preço"}: {info.text}
            </p>
          )}
        </div>
        <BuyButton
          href={product.affiliate_url}
          network={product.affiliate_network}
          productName={product.name}
          size="sm"
          className="rounded-xl shadow-soft"
        />
      </div>
    </div>
  );
}
