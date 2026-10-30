import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/** Grade de dias do desafio (doc 09 §10.3): feito · hoje · perdido · futuro. */
export function ChallengeCalendar({
  days,
  done,
  currentDay,
  selected,
  onPick,
}: {
  days: { day: number; title: string }[];
  done: Set<number>;
  currentDay: number;
  selected?: number;
  onPick: (d: number) => void;
}) {
  return (
    <div>
      <ol className="grid grid-cols-6 gap-2 sm:grid-cols-10" aria-label="Dias do desafio">
        {days.map(({ day, title }) => {
          const state = done.has(day)
            ? "feito"
            : day === currentDay
              ? "hoje"
              : day < currentDay
                ? "perdido"
                : "futuro";
          return (
            <li key={day}>
              <button
                type="button"
                disabled={state === "futuro"}
                onClick={() => onPick(day)}
                title={title}
                aria-label={`Dia ${day}: ${title}`}
                className={cn(
                  "flex aspect-square w-full items-center justify-center rounded-xl border text-sm font-bold transition-colors",
                  state === "feito" && "border-success bg-success/15 text-success",
                  state === "hoje" && "border-accent bg-accent/15 text-accent animate-pulse",
                  state === "perdido" && "border-warning bg-warning/10 text-warning",
                  state === "futuro" && "border-border bg-muted text-muted-foreground",
                  selected === day && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                {state === "feito" ? (
                  <Check className="h-4 w-4" />
                ) : state === "futuro" ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  day
                )}
              </button>
            </li>
          );
        })}
      </ol>
      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <li>
          <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-success/40 align-middle" /> feito
        </li>
        <li>
          <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-accent/40 align-middle" /> hoje
        </li>
        <li>
          <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-warning/40 align-middle" />{" "}
          perdido (pode marcar depois)
        </li>
        <li>
          <span className="mr-1 inline-block h-3 w-3 rounded-sm bg-muted align-middle" /> ainda não
          chegou
        </li>
      </ul>
    </div>
  );
}
