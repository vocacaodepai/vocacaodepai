import { Link } from "@/lib/router-compat";
import { Star } from "lucide-react";
import type { Product } from "@/lib/loja/types";
import { productImageThumb } from "@/lib/image";
import { productPriceRange, priceRangeLabel } from "@/lib/loja/price-range";
import { BuyButton } from "./BuyButton";
import { cn } from "@/lib/utils";

/** Card da vitrine (doc 05 §4.8): foto oficial, categoria, nota de compradores, faixa e botão. */
export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const info = productPriceRange(product);
  const hasRating = product.rating != null && product.rating_count > 0;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant",
        className,
      )}
    >
      <Link
        to={`/loja/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-white"
        aria-label={product.name}
      >
        {product.image_url ? (
          <img
            src={productImageThumb(product.image_url)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm font-semibold text-muted-foreground">
            Foto oficial em breve
          </div>
        )}
        {product.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground shadow-sm">
            Destaque do Pai
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            {product.category.name}
          </p>
        )}
        <h3 className="mt-1 font-display text-base font-bold leading-snug">
          <Link to={`/loja/${product.slug}`} className="transition-colors hover:text-primary">
            {product.name}
          </Link>
        </h3>
        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}

        {hasRating && (
          <div
            className="mt-1.5 flex items-center gap-0.5"
            aria-label={`Nota de compradores: ${product.rating} de 5`}
            title="Nota de compradores da Amazon (não é a nota editorial)"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.round(product.rating!)
                    ? "fill-accent text-accent"
                    : "fill-muted text-muted-foreground/40",
                )}
              />
            ))}
            <span className="ml-1.5 text-[11px] font-semibold text-muted-foreground">
              {product.rating!.toFixed(1).replace(".", ",")} · compradores
            </span>
          </div>
        )}
        {product.short_description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {product.short_description}
          </p>
        )}

        <div className="mt-3">
          {info ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {priceRangeLabel(info)}
                {info.checkedOn ? ` · ${info.checkedOn}` : ""}
              </p>
              <p className="text-lg font-extrabold text-foreground">{info.text}</p>
            </>
          ) : (
            <p className="text-xs font-semibold text-muted-foreground">
              Faixa de preço em pesquisa
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Link
            to={`/loja/${product.slug}`}
            className="flex h-10 flex-1 items-center justify-center rounded-xl border border-border text-sm font-bold transition-colors hover:border-primary hover:text-primary"
          >
            Ver análise
          </Link>
          <BuyButton
            href={product.affiliate_url}
            network={product.affiliate_network}
            productName={product.name}
            size="sm"
            className="rounded-xl shadow-soft"
          />
        </div>
      </div>
    </article>
  );
}
