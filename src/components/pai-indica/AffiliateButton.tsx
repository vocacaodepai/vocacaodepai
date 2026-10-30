import { ShoppingBag } from "lucide-react";
import { trackEvent } from "@/lib/ga4";
import { withAffiliateTag } from "@/lib/pai-indica/price";

/**
 * Botão de afiliado (CLAUDE.md §5.1): texto SEMPRE "Comprar agora na Amazon" (em comparativos,
 * "Comprar <produto> agora na Amazon"), classe `btn-comprar`, rel="sponsored nofollow noopener",
 * target="_blank", `?tag=` garantido, evento GA4 `affiliate_click {product_slug}`. Sem preço.
 */
export function AffiliateButton({
  href,
  productSlug,
  productName,
  className = "",
  size = "md",
}: {
  href: string;
  productSlug?: string;
  productName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!href) return null;
  const sizeClass =
    size === "lg"
      ? "min-h-14 px-8 py-4 text-base"
      : size === "sm"
        ? "min-h-10 px-4 py-2 text-sm"
        : "min-h-12 px-6 py-3 text-sm";
  return (
    <a
      href={withAffiliateTag(href)}
      target="_blank"
      rel="sponsored nofollow noopener"
      onClick={() => trackEvent("affiliate_click", { product_slug: productSlug ?? "" })}
      className={`btn-comprar inline-flex items-center justify-center gap-2 rounded-xl bg-accent font-display font-bold text-accent-foreground shadow-soft transition-transform hover:scale-[1.02] ${sizeClass} ${className}`}
    >
      <ShoppingBag className="h-4 w-4" aria-hidden />
      {productName ? `Comprar ${productName} agora na Amazon` : "Comprar agora na Amazon"}
    </a>
  );
}
