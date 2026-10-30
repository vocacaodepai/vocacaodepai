import { Flame } from "lucide-react";

/** "7 dias seguidos · Pai firme (320 pts)" — só o próprio pai vê (doc 09 §11). */
export function StreakChip({
  streak,
  points,
  title,
}: {
  streak: number;
  points: number;
  title: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold">
      <Flame className={streak > 0 ? "h-4 w-4 text-accent" : "h-4 w-4 text-muted-foreground"} />
      {streak} {streak === 1 ? "dia seguido" : "dias seguidos"} · {title} ({points} pts)
    </span>
  );
}
