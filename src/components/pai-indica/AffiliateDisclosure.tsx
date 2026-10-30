import { Link } from "@/lib/router-compat";

/** Aviso curto de afiliado (doc 02 §6.3 e CLAUDE.md §5.1): toda página com link de afiliado mostra e linka a política. */
export function AffiliateDisclosure({ className = "" }: { className?: string }) {
  return (
    <p
      className={`rounded-xl border border-border bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground ${className}`}
    >
      Este conteúdo tem links de afiliado da Amazon. Se você comprar por eles, o Vocação de Pai
      recebe uma comissão, sem custo extra para você. Isso não muda a nota nem a ordem dos produtos.{" "}
      <Link
        to="/politica-de-afiliados"
        className="font-semibold text-primary underline-offset-2 hover:underline"
      >
        Política de afiliados
      </Link>
      .
    </p>
  );
}
