import { Medal } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { PILLAR_LABEL, type ChallengeRow } from "@/lib/formacao/types";
import { PILLAR_ICON } from "./TrackCard";

export function ChallengeCard({ challenge, done }: { challenge: ChallengeRow; done?: number }) {
  const Icon = PILLAR_ICON[challenge.pillar ?? "casa"];
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/60">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
          <Icon className="h-3 w-3" /> {PILLAR_LABEL[challenge.pillar ?? "casa"]}
        </span>
        <span className="text-muted-foreground">{challenge.days} dias</span>
        {challenge.badge_slug && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 font-bold text-accent">
            <Medal className="h-3 w-3" /> Insígnia ao concluir
          </span>
        )}
      </div>
      <h3 className="mt-2 font-display text-xl font-bold leading-snug">
        <Link to={`/desafios/${challenge.slug}`} className="hover:text-primary">
          {challenge.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{challenge.description}</p>
      {typeof done === "number" && done > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-success"
            style={{ width: `${Math.round((done / challenge.days) * 100)}%` }}
          />
        </div>
      )}
      <Link
        to={`/desafios/${challenge.slug}`}
        className="mt-4 inline-flex h-10 w-fit items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
      >
        {done ? `Dia ${Math.min(done + 1, challenge.days)}` : "Ver o desafio"}
      </Link>
    </article>
  );
}
