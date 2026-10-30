import { Link } from "@/lib/router-compat";
import { cn } from "@/lib/utils";

/**
 * Aviso de transparência (texto EXATO do doc 05 §1.2), em toda página de /loja/*
 * e nos artigos do Pai Indica com produto. Linka /politica-de-afiliados (CLAUDE.md §5.1).
 */
export function AffiliateNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
      Aviso de transparência: o Vocação de Pai participa do Programa de Associados da Amazon Brasil.
      Os links &quot;Comprar agora na Amazon&quot; são links de afiliado: se você comprar por eles,
      podemos receber uma comissão, sem custo extra para você. As faixas de preço mostradas foram
      pesquisadas na internet em várias lojas e não são o preço da Amazon; o valor do dia pode ser
      diferente.{" "}
      <Link to="/politica-de-afiliados" className="font-semibold text-primary hover:underline">
        Política de afiliados
      </Link>
      .
    </p>
  );
}
