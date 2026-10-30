import { CheckCircle2, XCircle } from "lucide-react";

/** Pontos fortes / pontos de atenção (de review.pros/cons ou do produto no comparativo). */
export function ProsCons({
  pros,
  cons,
  className = "",
}: {
  pros: string[];
  cons: string[];
  className?: string;
}) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${className}`}>
      <section className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <h3 className="font-display text-lg font-bold text-success">Pontos fortes</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {pros.map((p) => (
            <li key={p} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-2xl border border-danger/30 bg-danger/5 p-5">
        <h3 className="font-display text-lg font-bold text-danger">Pontos de atenção</h3>
        <ul className="mt-3 space-y-2 text-sm">
          {cons.map((c) => (
            <li key={c} className="flex gap-2">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
