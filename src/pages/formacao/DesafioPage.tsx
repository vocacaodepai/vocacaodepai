import { useEffect, useMemo, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Award, Play } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ChallengeCalendar } from "@/components/formacao/ChallengeCalendar";
import { ChallengeDayCard } from "@/components/formacao/ChallengeDayCard";
import { PILLAR_ICON } from "@/components/formacao/TrackCard";
import { completeDayFn, getMyChallengeFn, startChallengeFn } from "@/lib/tracks.functions";
import { PILLAR_LABEL, type MyChallengeState } from "@/lib/formacao/types";

const routeApi = getRouteApi("/_site/desafios/$slug");

/** /desafios/$slug (doc 09 §6): calendário 30 dias, começar, marcar dia (recomeço suave), streak. */
export default function DesafioPage() {
  const { challenge, days } = routeApi.useLoaderData();
  const { user, ready } = useAuth();
  const [state, setState] = useState<MyChallengeState | null>(null);
  const [selected, setSelected] = useState(1);
  const [busy, setBusy] = useState(false);
  const Icon = PILLAR_ICON[challenge.pillar ?? "casa"];

  const load = () =>
    getMyChallengeFn({ data: { challengeId: challenge.id } })
      .then((s) => {
        setState(s);
        if (s.started_at) setSelected(Math.max(1, Math.min(s.current_day, challenge.days)));
      })
      .catch(() => setState(null));
  useEffect(() => {
    if (!user) return setState(null);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, challenge.id]);

  const done = useMemo(() => new Set((state?.progress ?? []).map((p) => p.day)), [state]);
  const started = !!state?.started_at;
  const currentDay = started ? state!.current_day : 1;
  const missed = started
    ? Array.from({ length: currentDay - 1 }, (_, i) => i + 1).filter((d) => !done.has(d))
    : [];
  const day = days.find((d) => d.day === selected) ?? days[0];

  const start = async () => {
    setBusy(true);
    try {
      await startChallengeFn({ data: { challengeId: challenge.id } });
      await load();
      toast.success("Desafio começado. Hoje é o dia 1.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível começar.");
    } finally {
      setBusy(false);
    }
  };
  const markDone = async (note: string) => {
    if (!day) return;
    setBusy(true);
    try {
      const r = await completeDayFn({
        data: { challengeId: challenge.id, day: day.day, note: note || undefined },
      });
      await load();
      for (const b of r.newBadges) toast.success(`Nova insígnia: ${b.replace(/-/g, " ")}`);
      toast.success(`Dia ${day.day} feito.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível marcar.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Formação", path: "/formacao" },
          { name: "Desafios do Pai", path: "/desafios" },
          { name: challenge.title, path: `/desafios/${challenge.slug}` },
        ]}
      />
      <header className="mt-6 max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
          <Icon className="h-4 w-4" /> {PILLAR_LABEL[challenge.pillar ?? "casa"]} · {challenge.days}{" "}
          dias
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">{challenge.title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{challenge.description}</p>
        {challenge.badge_slug && (
          <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent">
            <Award className="h-4 w-4" /> Ao concluir: insígnia{" "}
            {challenge.badge_slug.replace(/-/g, " ")}
          </p>
        )}
      </header>

      <div className="mt-6">
        {ready && !user ? (
          <p className="rounded-2xl border border-dashed border-border p-4 text-sm">
            Veja o dia 1 por inteiro e os títulos dos outros dias.{" "}
            <Link
              to={`/entrar?next=/desafios/${challenge.slug}`}
              className="font-bold text-primary hover:underline"
            >
              Entre na Área do Pai
            </Link>{" "}
            para começar o desafio e marcar os dias.
          </p>
        ) : user && state && !started ? (
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Play className="h-4 w-4" /> Começar o desafio (hoje é o dia 1)
          </button>
        ) : state?.finished_at ? (
          <p className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm font-semibold text-success">
            Desafio concluído. Parabéns, irmão. Repita quando quiser, do dia 1.
          </p>
        ) : started ? (
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-accent/15 px-3 py-1 font-bold text-accent">
              Dia {currentDay} de {challenge.days}
            </span>
            <span className="text-muted-foreground">
              {done.size} dia{done.size === 1 ? "" : "s"} feitos
            </span>
            {missed.length >= 3 && (
              <button
                type="button"
                onClick={() => setSelected(missed[0]!)}
                className="rounded-full border border-warning px-3 py-1 font-bold text-warning"
              >
                Pausa? Retome do dia {missed[0]}
              </button>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <ChallengeCalendar
          days={days.map((d) => ({ day: d.day, title: d.title }))}
          done={done}
          currentDay={user && started ? currentDay : 1}
          selected={selected}
          onPick={setSelected}
        />
        {day && (
          <ChallengeDayCard
            day={
              user
                ? day
                : selected === 1
                  ? day
                  : {
                      ...day,
                      task: "Entre na Área do Pai para ver a tarefa do dia.",
                      reflection: null,
                    }
            }
            done={done.has(day.day)}
            note={state?.progress.find((p) => p.day === day.day)?.note ?? null}
            locked={!user || !started}
            busy={busy}
            onDone={markDone}
          />
        )}
      </div>

      {!user && (
        <ol className="mt-8 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => (
            <li key={d.id} className="rounded-xl border border-border bg-card px-3 py-2">
              <span className="font-bold text-primary">Dia {d.day}</span> · {d.title}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
