import { ChevronDown } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { SCORE_BANDS } from "@/lib/pai-indica/score";

export const COMO_AVALIAMOS_PATH = "/pai-indica#como-avaliamos";

/** Régua de nota, retrátil e fechada por padrão (doc 04 §4.3). Números vêm de SCORE_BANDS, nunca digitados. */
export function ScoreScaleNote({ className = "" }: { className?: string }) {
  return (
    <details className={`group rounded-2xl border border-border bg-card shadow-soft ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-accent">
            Como ler a nota
          </span>
          <span className="mt-1 block font-display text-lg font-bold">
            Nota de 0 a 10, com casa decimal de propósito
          </span>
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          A nota não é a avaliação de estrelas da Amazon: é a nossa análise, com 5 critérios e pesos
          declarados em "Como avaliamos", a partir de ficha técnica, manual, anúncio e opiniões de
          compradores fora da Amazon, sem teste físico. A casa decimal (ex.: 7,8) mostra a diferença
          entre dois produtos que, arredondados, pareceriam iguais. Links de afiliado não mudam a
          nota.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SCORE_BANDS.map((b) => (
            <div key={b.label} className="rounded-lg border border-border bg-background p-3.5">
              <p className="font-mono text-xs font-semibold text-accent">
                {b.min.toFixed(1).replace(".", ",")} a {b.max.toFixed(1).replace(".", ",")}
              </p>
              <p className="mt-1 font-display text-sm font-semibold">{b.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs">
          <Link
            to={COMO_AVALIAMOS_PATH}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            Como avaliamos: critérios, pesos e independência →
          </Link>
        </p>
      </div>
    </details>
  );
}
