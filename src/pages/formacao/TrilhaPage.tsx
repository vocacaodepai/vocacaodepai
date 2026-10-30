import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Award, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { TrackPlayer } from "@/components/formacao/TrackPlayer";
import { ProgressRing } from "@/components/formacao/ProgressRing";
import { PILLAR_ICON } from "@/components/formacao/TrackCard";
import { SaveButton } from "@/components/area-do-pai/SaveButton";
import { completeStepFn, getMyTrackProgressFn } from "@/lib/tracks.functions";
import { LEVEL_LABEL, PILLAR_LABEL, type TrackProgressRow } from "@/lib/formacao/types";

const routeApi = getRouteApi("/_site/formacao/$slug");

/** /formacao/$slug (doc 09 §5.4): cabeçalho + TrackPlayer; conclusão da trilha com insígnias. */
export default function TrilhaPage() {
  const { track, steps } = routeApi.useLoaderData();
  const { user, ready } = useAuth();
  const [progress, setProgress] = useState<TrackProgressRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState<string[] | null>(null);
  const Icon = PILLAR_ICON[track.pillar ?? "casa"];

  useEffect(() => {
    if (!user) return setProgress([]);
    getMyTrackProgressFn({ data: { trackId: track.id } })
      .then(setProgress)
      .catch(() => setProgress([]));
  }, [user, track.id]);

  const onComplete = async (stepId: string, note?: string) => {
    setBusy(true);
    try {
      const r = await completeStepFn({ data: { stepId, note } });
      setProgress((p) => {
        const rest = p.filter((x) => x.step_id !== stepId);
        return [
          ...rest,
          { step_id: stepId, completed_at: new Date().toISOString(), note: note ?? null },
        ];
      });
      for (const b of r.newBadges) toast.success(`Nova insígnia: ${b.replace(/-/g, " ")}`);
      const doneCount = new Set([...progress.map((x) => x.step_id), stepId]).size;
      if (doneCount >= steps.length) setFinished(r.newBadges);
      else toast.success("Passo concluído.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Formação", path: "/formacao" },
          { name: track.title, path: `/formacao/${track.slug}` },
        ]}
      />
      <header className="mt-6 grid gap-6 md:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
            <Icon className="h-4 w-4" /> {PILLAR_LABEL[track.pillar ?? "casa"]} ·{" "}
            {LEVEL_LABEL[track.level]}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{track.title}</h1>
          <p className="mt-2 text-base text-muted-foreground">{track.description}</p>
          <ul className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {track.estimated_days && (
              <li className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" /> {track.estimated_days} dias · {steps.length} passos
              </li>
            )}
            {track.audience && (
              <li className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" /> {track.audience}
              </li>
            )}
          </ul>
          {track.outcomes.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {track.outcomes.map((o) => (
                <li
                  key={o}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-4 md:flex-col md:items-end">
          {user && <ProgressRing done={progress.length} total={steps.length} size={80} />}
          {/* Salvar na Área do Pai (saved_items, item_type 'track') */}
          <SaveButton itemType="track" itemId={track.id} />
        </div>
      </header>
      {ready && !user && (
        <p className="mt-6 rounded-2xl border border-dashed border-border p-4 text-sm">
          Você pode ler os passos à vontade.{" "}
          <Link
            to={`/entrar?next=/formacao/${track.slug}`}
            className="font-bold text-primary hover:underline"
          >
            Entre na Área do Pai
          </Link>{" "}
          para marcar seu progresso, guardar anotações e ganhar insígnias.
        </p>
      )}
      {finished && (
        <div className="mt-6 rounded-3xl border border-accent/40 bg-accent/10 p-6 text-center">
          <Award className="mx-auto h-10 w-10 text-accent" />
          <h2 className="mt-2 font-display text-2xl font-bold">Trilha concluída</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {finished.length > 0
              ? `Insígnia nova: ${finished.join(", ")}.`
              : "Suas insígnias estão na Área do Pai."}{" "}
            O certificado em PDF chega na Fase 8.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              to="/formacao"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              Próxima trilha
            </Link>
            <Link
              to="/area-do-pai"
              className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-bold"
            >
              Área do Pai
            </Link>
          </div>
        </div>
      )}
      <div className="mt-8">
        <TrackPlayer
          track={track}
          steps={steps}
          progress={progress}
          loggedIn={!!user}
          busy={busy}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}
