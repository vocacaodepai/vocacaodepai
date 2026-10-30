import { useEffect, useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ProfessionalForm } from "@/components/pai-indica-pai/ProfessionalForm";
import { LoginGate, PipNav, StatusBadge, btnPrimary } from "@/components/pai-indica-pai/shared";
import { useAuth } from "@/lib/auth-context";
import { fetchMyProfessional } from "@/lib/pai-indica-pai/client";
import type { ProfessionalRow } from "@/lib/pai-indica-pai/types";

const routeApi = getRouteApi("/_site/pai-indica-pai/profissionais/novo");

function FormWithExisting({ mentorDefault }: { mentorDefault: boolean }) {
  const { user } = useAuth();
  const [existing, setExisting] = useState<ProfessionalRow | null | undefined>(undefined);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!user) return;
    fetchMyProfessional(user.id)
      .then(setExisting)
      .catch(() => setExisting(null));
  }, [user]);
  if (existing === undefined)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando seu perfil…
      </div>
    );
  if (done) {
    return (
      <div className="rounded-3xl border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <h2 className="mt-4 font-display text-3xl font-bold">Perfil enviado para moderação</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Aprovado, ele aparece no diretório Pai Profissional{mentorDefault ? " e na Mentoria" : ""}
          . Você recebe um e-mail quando for ao ar.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/pai-indica-pai/profissionais" className={btnPrimary}>
            Ver diretório
          </Link>
        </div>
      </div>
    );
  }
  return (
    <>
      {existing && (
        <p className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-muted/40 p-4 text-sm">
          Você já tem um perfil <StatusBadge status={existing.status} />. Editar o conteúdo devolve
          o perfil para a fila de moderação.
        </p>
      )}
      <ProfessionalForm
        existing={existing}
        mentorDefault={mentorDefault}
        onSaved={() => setDone(true)}
      />
    </>
  );
}

/** /pai-indica-pai/profissionais/novo (doc 08 §3.5): um perfil por usuário; `?mentor=1` pré-marca "Quero ser mentor". */
export default function NewProfessionalPage() {
  const search = routeApi.useSearch() as { mentor?: string | boolean };
  const mentorDefault = search.mentor === "1" || search.mentor === true;
  return (
    <div className="container max-w-3xl space-y-8 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Pai Profissional", path: "/pai-indica-pai/profissionais" },
          { name: "Meu perfil", path: "/pai-indica-pai/profissionais/novo" },
        ]}
      />
      <PipNav current="/pai-indica-pai/profissionais" />
      <header>
        <h1 className="font-display text-4xl font-bold">
          {mentorDefault ? "Quero ser mentor" : "Meu perfil de Pai Profissional"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Um perfil por pai, gratuito, com moderação. Contato só aparece com sua autorização.
        </p>
      </header>
      <LoginGate what="criar seu perfil">
        <FormWithExisting mentorDefault={mentorDefault} />
      </LoginGate>
    </div>
  );
}
