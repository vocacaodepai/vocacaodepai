import { CONTENT_MAX, contentCategories } from "@/lib/pai-indica-midia/taxonomia";
import type { ContentScores } from "@/lib/pai-indica-midia/types";

function Dots({ value, positive, label }: { value: number; positive: boolean; label: string }) {
  const on = positive
    ? "bg-success"
    : value >= 4
      ? "bg-danger"
      : value >= 2
        ? "bg-warning"
        : "bg-accent";
  return (
    <span
      role="img"
      aria-label={`${label}: ${value} de ${CONTENT_MAX}`}
      className="inline-flex items-center gap-1"
    >
      {Array.from({ length: CONTENT_MAX }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={`h-2.5 w-2.5 rounded-full ${i < value ? on : "bg-border"}`}
        />
      ))}
    </span>
  );
}

/**
 * Tabela de conteúdo em bolinhas 0-5 (modelo Common Sense, doc 14 §4.3). As 6 primeiras categorias
 * medem o que preocupa (quanto mais bolinhas, mais cuidado); as 4 últimas medem o que edifica
 * (quanto mais, melhor). `compact` mostra só as categorias com valor > 0 (card).
 */
export function ContentDots({
  scores,
  compact = false,
  className = "",
}: {
  scores: ContentScores;
  compact?: boolean;
  className?: string;
}) {
  const rows = compact ? contentCategories.filter((c) => scores[c.key] > 0) : contentCategories;
  if (rows.length === 0) return null;
  if (compact) {
    return (
      <ul
        className={`flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground ${className}`}
      >
        {rows.map((c) => (
          <li key={c.key} className="inline-flex items-center gap-1.5">
            <span>{c.name}</span>
            <Dots value={scores[c.key]} positive={c.positive} label={c.name} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
      {[false, true].map((positive) => (
        <div key={String(positive)} className="rounded-2xl border border-border bg-card p-4">
          <p
            className={`text-[11px] font-bold uppercase tracking-wider ${positive ? "text-success" : "text-danger"}`}
          >
            {positive
              ? "O que edifica (quanto mais, melhor)"
              : "O que preocupa (quanto mais, mais cuidado)"}
          </p>
          <dl className="mt-2 divide-y divide-border">
            {rows
              .filter((c) => c.positive === positive)
              .map((c) => (
                <div key={c.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <dt title={c.help} className="font-semibold">
                    {c.name}
                  </dt>
                  <dd>
                    <Dots value={scores[c.key]} positive={c.positive} label={c.name} />
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      ))}
    </div>
  );
}
