import { faixaTexto } from "@/lib/pai-indica/price";
import type { PaiIndicaProduct } from "@/lib/pai-indica/types";

/** "Faixa de preço pesquisada em dd/mm/aaaa: R$ X a R$ Y" (CLAUDE.md §5.2). Nunca preço único. */
export function PriceRange({
  product,
  className = "",
}: {
  product: PaiIndicaProduct | null | undefined;
  className?: string;
}) {
  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      <span className="font-semibold text-foreground">{faixaTexto(product)}</span>
      <span className="block text-xs">
        Faixa consultada na internet (várias lojas), não é o preço da Amazon. O valor do dia aparece
        ao clicar no botão.
      </span>
    </p>
  );
}
