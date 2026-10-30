import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ChallengeCard } from "@/components/formacao/ChallengeCard";
import { getMyFormacaoFn } from "@/lib/tracks.functions";
import type { MyFormacao } from "@/lib/formacao/types";

const routeApi = getRouteApi("/_site/desafios/");

/** /desafios (doc 09 §6): lista dos desafios publicados. */
export default function DesafiosPage() {
  const { challenges } = routeApi.useLoaderData();
  const { user } = useAuth();
  const [mine, setMine] = useState<MyFormacao | null>(null);
  useEffect(() => {
    if (!user) return setMine(null);
    getMyFormacaoFn()
      .then(setMine)
      .catch(() => setMine(null));
  }, [user]);
  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Formação", path: "/formacao" },
          { name: "Desafios do Pai", path: "/desafios" },
        ]}
      />
      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Formação</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
          Desafios do Pai: 30 dias, uma tarefa por dia
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Presença, provisão e disciplina. Perder um dia não zera: você marca depois e segue. Ao
          concluir os 30, ganha a insígnia do desafio.
        </p>
      </header>
      {challenges.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Os desafios estão sendo publicados. Volte em breve.
        </p>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {challenges.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              done={mine?.formacao.challenges.find((x) => x.slug === c.slug)?.done}
            />
          ))}
        </div>
      )}
    </div>
  );
}
