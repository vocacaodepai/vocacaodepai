import type { ComparisonData } from "@/lib/pai-indica/types";
import { roleLabels } from "@/lib/pai-indica/types";
import { formatScore } from "@/lib/pai-indica/score";
import { replaceFaixa } from "@/lib/pai-indica/price";

/** Tabela de especificações + selo e nota por linha. `faixas` já resolvidas (slug → "R$ X a R$ Y"). */
export function ComparisonTable({
  data,
  faixas,
}: {
  data: ComparisonData;
  faixas: Record<string, string>;
}) {
  if (!data.table) return null;
  const rows = data.table.rows.map((r) => r.map((cell) => replaceFaixa(String(cell), faixas)));
  return (
    <div className="table-wrap overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            {data.table.columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 text-left font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const p = data.products[i];
            const winner = p?.product_slug === data.winner_slug;
            return (
              <tr key={i} className={winner ? "bg-accent/10" : ""}>
                {r.map((cell, j) => (
                  <td key={j} className="px-3 py-2 align-top">
                    {j === 0 && p ? (
                      <span className="flex flex-col">
                        <span className="font-semibold">{cell}</span>
                        <span className="text-xs text-muted-foreground">
                          {roleLabels[p.role] ? `${roleLabels[p.role]} · ` : ""}nota{" "}
                          {formatScore(p.score)}
                        </span>
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-muted-foreground">
        Faixas de preço pesquisadas na internet (várias lojas), não o preço da Amazon. O valor do
        dia aparece no botão. "Nota de compradores" é a avaliação da Amazon; a nota editorial é a
        nossa.
      </p>
    </div>
  );
}
