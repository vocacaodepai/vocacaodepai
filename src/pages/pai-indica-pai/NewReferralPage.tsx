import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { MyPublications } from "@/components/pai-indica-pai/MyPublications";
import { ReferralForm } from "@/components/pai-indica-pai/ReferralForm";
import { LoginGate, PipNav, btnOutline, btnPrimary } from "@/components/pai-indica-pai/shared";

/** /pai-indica-pai/indicacoes/nova (doc 08 §3.6): mesmo fluxo da vaga (login, preview, Turnstile, pending). */
export default function NewReferralPage() {
  const [done, setDone] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  return (
    <div className="container max-w-3xl space-y-8 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Indicações", path: "/pai-indica-pai/indicacoes" },
          { name: "Nova indicação", path: "/pai-indica-pai/indicacoes/nova" },
        ]}
      />
      <PipNav current="/pai-indica-pai/indicacoes" />
      <header>
        <h1 className="font-display text-4xl font-bold">
          Indicar profissional, serviço ou empresa
        </h1>
        <p className="mt-1 text-muted-foreground">
          Só indique quem você usou de verdade. Passa por moderação e fica 90 dias no ar.
        </p>
      </header>
      <LoginGate what="indicar">
        {done ? (
          <div className="space-y-8">
            <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 font-display text-3xl font-bold">Recebemos sua indicação</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Ela está em moderação. Você recebe um e-mail quando for ao ar.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link to="/pai-indica-pai/indicacoes" className={btnPrimary}>
                  Ver indicações
                </Link>
                <button type="button" onClick={() => setDone(false)} className={btnOutline}>
                  Indicar outra
                </button>
              </div>
            </div>
            <MyPublications refreshKey={refreshKey} />
          </div>
        ) : (
          <ReferralForm
            onCreated={() => {
              setDone(true);
              setRefreshKey((k) => k + 1);
            }}
          />
        )}
      </LoginGate>
    </div>
  );
}
