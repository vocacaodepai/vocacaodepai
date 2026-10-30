import { Briefcase, Cross, Dumbbell, Home, Lock } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { LEVEL_LABEL, PILLAR_LABEL, type Pillar, type TrackRow } from "@/lib/formacao/types";
import { ProgressRing } from "./ProgressRing";

export const PILLAR_ICON: Record<Pillar, typeof Home> = {
  casa: Home,
  trabalho: Briefcase,
  corpo: Dumbbell,
  alma: Cross,
};

/** Cartão de trilha (doc 09 §10.3): capa, pilar, nível, dias, anel se houver progresso, cadeado premium. */
export function TrackCard({
  track,
  progress,
}: {
  track: TrackRow;
  progress?: { done: number; total: number };
}) {
  const Icon = PILLAR_ICON[track.pillar ?? "casa"];
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-colors hover:border-primary/60">
      {track.cover_image_url ? (
        <img
          src={track.cover_image_url}
          alt={track.title}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center bg-primary/10">
          <Icon className="h-10 w-10 text-primary/70" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
            <Icon className="h-3 w-3" /> {PILLAR_LABEL[track.pillar ?? "casa"]}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-muted-foreground">
            {LEVEL_LABEL[track.level]}
          </span>
          {track.estimated_days && (
            <span className="text-muted-foreground">
              {track.estimated_days} dias · {track.steps_count ?? 0} passos
            </span>
          )}
          {track.is_premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 font-bold text-accent">
              <Lock className="h-3 w-3" /> Pai de Valor
            </span>
          )}
        </div>
        <h3 className="mt-2 font-display text-xl font-bold leading-snug">
          <Link to={`/formacao/${track.slug}`} className="hover:text-primary">
            {track.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{track.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4">
          <Link
            to={`/formacao/${track.slug}`}
            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            {progress && progress.done > 0 ? "Continuar" : "Começar trilha"}
          </Link>
          {progress && progress.done > 0 && (
            <ProgressRing done={progress.done} total={progress.total} size={48} />
          )}
        </div>
      </div>
    </article>
  );
}
