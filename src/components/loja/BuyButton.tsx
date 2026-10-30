import { ShoppingBag } from "lucide-react";
import { AFFILIATE_REL, buyButtonLabel } from "@/lib/loja/affiliate";
import { cn } from "@/lib/utils";

/**
 * Botão de afiliado da Loja do Pai (CLAUDE.md §5.1): texto fixo "Comprar agora na
 * Amazon" (ou o marketplace de `affiliate_network`), classe `btn-comprar`,
 * `rel="sponsored nofollow noopener"` e `target="_blank"`.
 */
export function BuyButton({
  href,
  network = "amazon",
  productName,
  size = "md",
  className,
}: {
  href: string;
  network?: string | null;
  /** Só para o aria-label ("Comprar agora na Amazon - <nome>"). */
  productName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!href) return null;
  const label = buyButtonLabel(network);
  return (
    <a
      href={href}
      target="_blank"
      rel={AFFILIATE_REL}
      aria-label={productName ? `${label} - ${productName}` : undefined}
      className={cn(
        "btn-comprar inline-flex items-center justify-center gap-2 rounded-2xl bg-primary font-bold text-primary-foreground shadow-elegant transition-transform hover:scale-[1.02]",
        size === "sm" && "min-h-10 px-4 text-sm",
        size === "md" && "min-h-12 px-6 py-3 text-sm",
        size === "lg" && "min-h-14 px-8 text-base",
        className,
      )}
    >
      <ShoppingBag className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} />
      {label}
    </a>
  );
}
