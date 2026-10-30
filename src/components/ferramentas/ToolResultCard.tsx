export type ResultTone = "primary" | "neutral" | "success" | "warning" | "danger";

const TONES: Record<ResultTone, string> = {
  primary: "border-primary/30 bg-primary/5",
  neutral: "border-border bg-card",
  success: "border-success/40 bg-success/5",
  warning: "border-warning/50 bg-warning/10",
  danger: "border-destructive/40 bg-destructive/5",
};

const VALUE: Record<ResultTone, string> = {
  primary: "text-primary",
  neutral: "text-foreground",
  success: "text-success",
  warning: "text-foreground",
  danger: "text-destructive",
};

/** Cartão padrão de resultado das ferramentas (doc 06 §1.4). */
export function ToolResultCard({
  label,
  value,
  hint,
  tone = "neutral",
  big = false,
  className = "",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: ResultTone;
  big?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${TONES[tone]} ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-display font-bold leading-tight ${big ? "text-3xl md:text-4xl" : "text-2xl"} ${VALUE[tone]}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
