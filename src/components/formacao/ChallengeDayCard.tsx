import { useEffect, useState } from "react";
import { Check, Loader2, Lock } from "lucide-react";
import type { ChallengeDayRow } from "@/lib/formacao/types";

/** Cartão do dia (doc 09 §10.3): título, tarefa, reflexão, "Como foi?" (500), botão "Feito". */
export function ChallengeDayCard({
  day,
  done,
  note,
  locked,
  busy,
  onDone,
}: {
  day: ChallengeDayRow;
  done: boolean;
  note: string | null;
  locked: boolean;
  busy?: boolean;
  onDone: (note: string) => void;
}) {
  const [text, setText] = useState(note ?? "");
  useEffect(() => setText(note ?? ""), [note, day.day]);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Dia {day.day}</p>
      <h3 className="mt-1 font-display text-2xl font-bold">{day.title}</h3>
      <p className="mt-3 rounded-xl bg-primary/5 p-4 text-base font-semibold">{day.task}</p>
      {day.reflection && (
        <p className="mt-3 text-sm italic text-muted-foreground">{day.reflection}</p>
      )}
      {locked ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Entre na Área do Pai para marcar o dia e guardar sua
          anotação.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-semibold">
            Como foi?{" "}
            <span className="font-normal text-muted-foreground">
              (opcional, até 500 caracteres)
            </span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              rows={3}
              className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => onDone(text)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
            {done ? "Atualizar anotação" : "Feito"}
          </button>
        </div>
      )}
    </div>
  );
}
