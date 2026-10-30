import { icons, Award } from "lucide-react";
import type { BadgeView } from "@/lib/irmandade/types";
import { formatDateShort } from "@/lib/site";
import { cn } from "@/lib/utils";

function kebabToPascal(s: string): string {
  return s
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}
export function badgeIcon(name: string | null) {
  const key = name ? kebabToPascal(name) : "";
  return (icons as Record<string, typeof Award>)[key] ?? Award;
}

/** BadgeGrid / BadgesWall (doc 09 §7): conquistadas coloridas com data; bloqueadas em cinza com dica. */
export function BadgeGrid({ badges, compact = false }: { badges: BadgeView[]; compact?: boolean }) {
  const earned = badges.filter((b) => b.earned_at);
  const list = compact ? earned : badges;
  if (list.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma insígnia ainda. Conclua um passo de trilha ou um dia de desafio para começar.
      </p>
    );
  return (
    <ul
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-5",
      )}
    >
      {list.map((b) => {
        const Icon = badgeIcon(b.icon);
        const got = !!b.earned_at;
        return (
          <li
            key={b.slug}
            title={b.description ?? b.name}
            className={cn(
              "flex flex-col items-center rounded-2xl border p-3 text-center",
              got
                ? "border-accent/40 bg-accent/10"
                : "border-border bg-muted/40 opacity-60 grayscale",
            )}
          >
            <Icon className={cn("h-7 w-7", got ? "text-accent" : "text-muted-foreground")} />
            <span className="mt-2 text-xs font-bold leading-tight">{b.name}</span>
            {!compact && (
              <span className="mt-1 text-[11px] text-muted-foreground">
                {got ? formatDateShort(b.earned_at) : b.description}
              </span>
            )}
          </li>
        );
      })}
      {compact && badges.length > earned.length && (
        <li className="flex items-center justify-center rounded-2xl border border-dashed border-border p-3 text-xs font-bold text-muted-foreground">
          +{badges.length - earned.length}
        </li>
      )}
    </ul>
  );
}
