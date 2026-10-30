import {
  priceRangeLabel,
  priceRangeSentence,
  productPriceRange,
  type PriceRangeInput,
} from "@/lib/loja/price-range";
import { cn } from "@/lib/utils";

/**
 * Faixa de preço (nunca preço exato). `variant="sentence"` escreve a frase completa
 * do doc 05 §4.7 ("Faixa de preço pesquisada em dd/mm: R$ X a R$ Y. Não é o preço da
 * Amazon."); `variant="compact"` mostra rótulo + faixa para cards.
 */
export function PriceRange({
  product,
  variant = "sentence",
  className,
}: {
  product: PriceRangeInput | null | undefined;
  variant?: "sentence" | "compact";
  className?: string;
}) {
  const info = productPriceRange(product);
  if (!info) {
    return variant === "compact" ? (
      <span className={cn("text-xs font-semibold text-muted-foreground", className)}>
        Faixa de preço em pesquisa
      </span>
    ) : (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Faixa de preço ainda em pesquisa. Veja o valor do dia no botão de compra.
      </p>
    );
  }
  if (variant === "compact") {
    return (
      <span className={cn("flex flex-col", className)}>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {priceRangeLabel(info)}
          {info.checkedOn ? ` · ${info.checkedOn}` : ""}
        </span>
        <span className="text-lg font-extrabold text-foreground">{info.text}</span>
      </span>
    );
  }
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>{priceRangeSentence(info)}</p>
  );
}
