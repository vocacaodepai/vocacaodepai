import { formatDateTimeBR } from "@/lib/tools/format";

/** Aviso de atualização/cache dos dados de mercado (CLAUDE.md §10: "dados de <data>"). */
export function MarketStale({
  fetchedAt,
  stale,
  sources,
}: {
  fetchedAt: string;
  stale: boolean;
  sources: string[];
}) {
  return (
    <p className={`text-xs ${stale ? "font-semibold text-warning" : "text-muted-foreground"}`}>
      {stale
        ? `Sinal de atenção: usando dados de ${formatDateTimeBR(fetchedAt)}; as fontes estão instáveis agora.`
        : `Atualizado às ${formatDateTimeBR(fetchedAt).split(" ").pop()} (cache)`}
      {sources.length > 0 && (
        <span className="text-muted-foreground"> · Fontes: {sources.join(", ")}</span>
      )}
    </p>
  );
}

export function MarketUnavailable({ what }: { what: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
      {what} indisponível agora. As fontes públicas não responderam e ainda não há dado em cache;
      tente de novo em alguns minutos.
    </p>
  );
}
