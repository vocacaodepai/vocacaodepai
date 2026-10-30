import { Link } from "@/lib/router-compat";
import type { Criterion } from "@/lib/pai-indica/types";
import { formatScore } from "@/lib/pai-indica/score";
import { COMO_AVALIAMOS_PATH } from "./ScoreScaleNote";

/** Nota por critério (5 itens, pesos da categoria) com barra; nota final = média ponderada. */
export function CriteriaScores({ criteria, total }: { criteria: Criterion[]; total: number }) {
  return (
    <section
      aria-labelledby="criterios-title"
      className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="criterios-title" className="font-display text-2xl font-bold">
          Nota por critério
        </h2>
        <span className="font-display text-3xl font-bold text-primary">
          {formatScore(total)}
          <span className="text-base text-muted-foreground">/10</span>
        </span>
      </div>
      <ul className="mt-4 space-y-3">
        {criteria.map((c) => (
          <li key={c.name}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {c.name} <span className="text-xs text-muted-foreground">(peso {c.weight})</span>
              </span>
              <span className="font-mono font-semibold">{formatScore(c.score)}</span>
            </div>
            <div
              className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuenow={c.score}
              aria-label={c.name}
            >
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(c.score / 10) * 100}%` }}
              />
            </div>
            {c.comment && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.comment}</p>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Nota final = média ponderada dos 5 critérios. Não é a estrela da Amazon.{" "}
        <Link
          to={COMO_AVALIAMOS_PATH}
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Como avaliamos
        </Link>
      </p>
    </section>
  );
}
