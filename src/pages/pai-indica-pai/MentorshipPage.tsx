import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Link as PlainLink } from "@/lib/router-compat";
import { Compass } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { MentorCard } from "@/components/pai-indica-pai/MentorCard";
import { EmptyState, PipNav, btnOutline, btnPrimary } from "@/components/pai-indica-pai/shared";
import type { MentorsSearch } from "@/lib/pai-indica-pai/schemas";
import { MENTORSHIP_AREAS } from "@/lib/pai-indica-pai/taxonomies";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/_site/pai-indica-pai/mentoria/");

/** Mentoria (doc 08 §3.7): o que é/não é, mentores por área, vagas disponíveis, "Quero ser mentor". */
export default function MentorshipPage() {
  const mentors = routeApi.useLoaderData();
  const search = routeApi.useSearch();
  const navigate = useNavigate();
  const go = (area?: MentorsSearch["area"]) =>
    void navigate({ to: "/pai-indica-pai/mentoria", search: area ? { area } : {} });

  return (
    <div className="container space-y-8 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Mentoria", path: "/pai-indica-pai/mentoria" },
        ]}
      />
      <PipNav current="/pai-indica-pai/mentoria" />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Mentoria de pai para pai</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Pai experiente orienta pai iniciante numa área: carreira, negócio, finanças da família,
            fé, casamento, ofício. De graça, com responsabilidade.
          </p>
        </div>
        <Link
          to="/pai-indica-pai/profissionais/novo"
          search={{ mentor: "1" }}
          className={btnPrimary}
        >
          <Compass className="h-4 w-4" /> Quero ser mentor
        </Link>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <h2 className="font-display text-xl font-bold">O que é</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Um pai com estrada numa área ajudando outro que está começando.</li>
            <li>Sugestão: uma conversa por semana, por 4 a 8 semanas.</li>
            <li>Conselho prático, exemplo e oração — de homem para homem.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h2 className="font-display text-xl font-bold">O que não é</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Não é terapia, nem consultoria paga, nem aconselhamento profissional.</li>
            <li>
              Sinal de alerta: problema de saúde, dívida grave ou crise no casamento pede médico,
              contador, advogado ou padre.
            </li>
            <li>Ninguém cobra nada. Quem cobrar, denuncie.</li>
          </ul>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => go(undefined)}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-bold",
            !search.area
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          Todas as áreas
        </button>
        {Object.entries(MENTORSHIP_AREAS).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => go(k as MentorsSearch["area"])}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-bold",
              search.area === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {mentors.length === 0 ? (
        <EmptyState
          title="Ainda não há mentor nesta área"
          text="Você tem estrada em carreira, negócio, finanças, fé ou casamento? Seja o primeiro mentor e ajude um pai que está começando."
          action={
            <Link
              to="/pai-indica-pai/profissionais/novo"
              search={{ mentor: "1" }}
              className={btnOutline}
            >
              Quero ser mentor
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mentors.map((m) => (
            <MentorCard key={m.id} mentor={m} />
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Pedidos recebidos e feitos ficam em{" "}
        <PlainLink to="/minha-conta" className="font-semibold text-primary hover:underline">
          Área do Pai → Mentoria
        </PlainLink>
        : o mentor aceita ou recusa, e os dois recebem e-mail com o contato um do outro.
      </p>
    </div>
  );
}
