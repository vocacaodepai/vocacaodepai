import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { TrackCard, PILLAR_ICON } from "@/components/formacao/TrackCard";
import { ChallengeCard } from "@/components/formacao/ChallengeCard";
import { StreakChip } from "@/components/formacao/StreakChip";
import { BadgeGrid } from "@/components/formacao/BadgeGrid";
import { getMyFormacaoFn } from "@/lib/tracks.functions";
import { PILLAR_LABEL, PILLAR_ORDER, type MyFormacao } from "@/lib/formacao/types";

const routeApi = getRouteApi("/_site/formacao/");

/** /formacao (doc 09 §5): catálogo das trilhas agrupado por pilar + desafios + resumo do membro. */
export default function FormacaoPage() {
  const { tracks, challenges } = routeApi.useLoaderData();
  const { user } = useAuth();
  const [mine, setMine] = useState<MyFormacao | null>(null);
  useEffect(() => {
    if (!user) return setMine(null);
    getMyFormacaoFn()
      .then(setMine)
      .catch(() => setMine(null));
  }, [user]);
  const progressOf = (slug: string) => mine?.formacao.tracks.find((t) => t.slug === slug);
  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Formação", path: "/formacao" }]} />
      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Formação</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
          A escola do pai: trilhas e desafios, no seu ritmo
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Oito trilhas com passos de leitura, artigo, vídeo, checklist e exercício; três desafios de
          30 dias com recomeço suave. Progresso, insígnias e Caderno do Pai na sua Área do Pai.
          Gratuito.
        </p>
        {mine && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <StreakChip
              streak={mine.formacao.streak}
              points={mine.formacao.points}
              title={mine.formacao.title}
            />
            <Link to="/area-do-pai" className="text-sm font-semibold text-primary hover:underline">
              Minha Área do Pai
            </Link>
          </div>
        )}
      </header>

      {PILLAR_ORDER.map((pillar) => {
        const list = tracks.filter((t) => (t.pillar ?? "casa") === pillar);
        if (list.length === 0) return null;
        const Icon = PILLAR_ICON[pillar];
        return (
          <section key={pillar} className="mt-10" aria-labelledby={`h-${pillar}`}>
            <h2
              id={`h-${pillar}`}
              className="inline-flex items-center gap-2 font-display text-2xl font-bold"
            >
              <Icon className="h-6 w-6 text-primary" /> {PILLAR_LABEL[pillar]}
            </h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {list.map((t) => {
                const p = progressOf(t.slug);
                return (
                  <TrackCard
                    key={t.id}
                    track={t}
                    progress={p ? { done: p.done, total: p.total } : undefined}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
      {tracks.length === 0 && (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          As trilhas estão sendo publicadas. Volte em breve.
        </p>
      )}

      <section className="mt-12" aria-labelledby="h-desafios">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="h-desafios" className="font-display text-2xl font-bold">
            Desafios do Pai
          </h2>
          <Link to="/desafios" className="text-sm font-semibold text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {challenges.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              done={mine?.formacao.challenges.find((x) => x.slug === c.slug)?.done}
            />
          ))}
        </div>
      </section>

      {mine && (
        <section className="mt-12" aria-labelledby="h-insignias">
          <h2 id="h-insignias" className="font-display text-2xl font-bold">
            Suas insígnias
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            Vinte insígnias, da Badge de pai presente ao Filho de São José. Só você vê; aqui não há
            ranking.
          </p>
          <BadgeGrid badges={mine.badges_all} />
        </section>
      )}
    </div>
  );
}
