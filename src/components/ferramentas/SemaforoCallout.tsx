import type { ReactNode } from "react";

// Semáforo do Pai dentro das ferramentas (CLAUDE.md §6.3 e §12): sempre 3 tons na ordem ok → warn → bad.
// O artigo usa a extensão Tiptap `callout` (src/components/blog/Callout.tsx, CSS escopado em .article-content);
// este componente reproduz o mesmo visual com os tokens do tema para fora do corpo do artigo.
export type SemaforoTone = "ok" | "warn" | "bad";

const PREFIX: Record<SemaforoTone, string> = {
  ok: "Sinal verde: ",
  warn: "Sinal de atenção: ",
  bad: "Sinal de alerta: ",
};

const STYLE: Record<SemaforoTone, string> = {
  ok: "border-success bg-success/10",
  warn: "border-warning bg-warning/15",
  bad: "border-destructive bg-destructive/10",
};

const LABEL: Record<SemaforoTone, string> = {
  ok: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
};

export function SemaforoCallout({
  tone,
  children,
  muted = false,
}: {
  tone: SemaforoTone;
  children: ReactNode;
  /** sinal "apagado" hoje (cinza) */
  muted?: boolean;
}) {
  const text = typeof children === "string" ? children : null;
  const hasPrefix = text ? text.startsWith(PREFIX[tone]) : false;
  return (
    <div
      role="note"
      className={`rounded-xl border-l-4 px-4 py-3 text-sm leading-relaxed ${muted ? "border-border bg-muted/40 text-muted-foreground" : STYLE[tone]}`}
    >
      {!hasPrefix && <strong className={muted ? "" : LABEL[tone]}>{PREFIX[tone]}</strong>}
      {hasPrefix && text ? (
        <>
          <strong className={muted ? "" : LABEL[tone]}>{PREFIX[tone]}</strong>
          {text.slice(PREFIX[tone].length)}
        </>
      ) : (
        children
      )}
    </div>
  );
}
