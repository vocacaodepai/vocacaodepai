import { Info } from "lucide-react";

export function ToolDisclaimer({ text, strong = false }: { text: string; strong?: boolean }) {
  return (
    <aside
      className={`mt-6 flex max-w-3xl gap-3 rounded-xl border p-4 text-sm ${strong ? "border-destructive/40 bg-destructive/10" : "border-border bg-muted/40"}`}
    >
      <Info
        className={`mt-0.5 h-4 w-4 shrink-0 ${strong ? "text-destructive" : "text-muted-foreground"}`}
      />
      <div>
        <p className="font-bold">Aviso</p>
        <p className="mt-0.5 leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </aside>
  );
}
