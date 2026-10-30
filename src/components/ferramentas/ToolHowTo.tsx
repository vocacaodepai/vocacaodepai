import type { ToolHowToStep } from "@/lib/tools/registry";

export function ToolHowTo({ steps, text }: { steps: ToolHowToStep[]; text?: string }) {
  const blocks = (text ?? "")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return (
    <section aria-labelledby="como-usar" className="mt-12 max-w-3xl">
      <h2 id="como-usar" className="font-display text-2xl font-bold">
        Como usar
      </h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li
            key={s.name}
            id={`como-usar-${i + 1}`}
            className="flex gap-4 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              {i + 1}
            </span>
            <div>
              <h3 className="font-bold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {blocks.length > 0 && (
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/90">
          {blocks.map((b, i) =>
            b.startsWith("## ") ? (
              <h3 key={i} className="pt-2 font-display text-xl font-bold">
                {b.slice(3)}
              </h3>
            ) : (
              <p key={i}>{b}</p>
            ),
          )}
        </div>
      )}
    </section>
  );
}
