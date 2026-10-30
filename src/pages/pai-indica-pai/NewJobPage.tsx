import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Link as PlainLink } from "@/lib/router-compat";
import { CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { JobForm } from "@/components/pai-indica-pai/JobForm";
import { MyPublications } from "@/components/pai-indica-pai/MyPublications";
import {
  AntifraudNotice,
  LoginGate,
  PipNav,
  btnOutline,
  btnPrimary,
} from "@/components/pai-indica-pai/shared";

/** /pai-indica-pai/vagas/nova (doc 08 §3.4): porta de login, formulário, tela "Recebemos sua vaga", minhas vagas. */
export default function NewJobPage() {
  const [done, setDone] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="container max-w-3xl space-y-8 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Vagas", path: "/pai-indica-pai/vagas" },
          { name: "Publicar vaga", path: "/pai-indica-pai/vagas/nova" },
        ]}
      />
      <PipNav current="/pai-indica-pai/vagas" />
      <header>
        <h1 className="font-display text-4xl font-bold">Publicar vaga</h1>
        <p className="mt-1 text-muted-foreground">
          Gratuito. Passa por moderação em até 48 h e fica 45 dias no ar. Limite de 3 publicações
          por dia.
        </p>
      </header>
      <AntifraudNotice />
      <LoginGate what="publicar uma vaga">
        {done ? (
          <div className="space-y-8">
            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 font-display text-3xl font-bold">Recebemos sua vaga</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Ela está <strong>em moderação</strong>. Você recebe um e-mail quando for ao ar ou se
                precisar de ajuste. Acompanhe também na Área do Pai.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <PlainLink to="/minha-conta" className={btnPrimary}>
                  Ir para a Área do Pai
                </PlainLink>
                <button
                  type="button"
                  onClick={() => {
                    setDone(null);
                    setRefreshKey((k) => k + 1);
                  }}
                  className={btnOutline}
                >
                  Publicar outra vaga
                </button>
              </div>
            </div>
            <MyPublications refreshKey={refreshKey} />
          </div>
        ) : (
          <div className="space-y-10">
            <JobForm
              onCreated={(slug) => {
                setDone(slug);
                setRefreshKey((k) => k + 1);
              }}
            />
            <section>
              <h2 className="font-display text-2xl font-bold">Minhas publicações</h2>
              <div className="mt-3">
                <MyPublications refreshKey={refreshKey} />
              </div>
            </section>
          </div>
        )}
      </LoginGate>
    </div>
  );
}
