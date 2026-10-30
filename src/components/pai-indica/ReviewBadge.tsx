import { Star } from "lucide-react";
import { bandOf, formatScore } from "@/lib/pai-indica/score";

/** Selo de nota 0-10 (régua de nota, CLAUDE.md §7) no card e no topo da página. `size="lg"` para o hero. */
export function ReviewBadge({
  score,
  size = "sm",
  showLabel = false,
  className = "",
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) {
  const band = bandOf(score);
  const base =
    size === "lg"
      ? "gap-2 rounded-xl px-3 py-2 font-display text-2xl font-bold"
      : size === "md"
        ? "gap-1.5 rounded-lg px-2 py-1 font-display text-base font-bold"
        : "gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold";
  const icon = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center bg-secondary/90 text-secondary-foreground shadow-sm backdrop-blur-sm ${base} ${className}`}
      title={`${formatScore(score)} de 10 — ${band.label}`}
    >
      <Star className={`${icon} text-accent`} fill="currentColor" aria-hidden />
      <span aria-label={`Nota ${formatScore(score)} de 10`}>{formatScore(score)}</span>
      {showLabel && (
        <span className="ml-1 text-xs font-normal text-secondary-foreground/80">{band.label}</span>
      )}
    </span>
  );
}
