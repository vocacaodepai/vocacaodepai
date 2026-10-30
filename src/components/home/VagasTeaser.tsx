import { Briefcase, PlusCircle } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { JobCard } from "@/components/pai-indica-pai/JobCard";
import type { JobPublic } from "@/lib/pai-indica-pai/types";
import { SectionHeading } from "./SectionHeading";

// Bloco "Vagas indicadas por pais" da home (doc 08 §3.1): as 3 últimas vagas
// aprovadas e ao vivo (view `jobs_public`, via o loader da rota). Sem vaga
// (banco vazio ou fora do ar) mostra o estado vazio com a chamada para publicar.
export function VagasTeaser({ jobs }: { jobs: JobPublic[] }) {
  const list = (jobs ?? []).slice(0, 3);
  return (
    <section aria-labelledby="vagas-title">
      <SectionHeading
        id="vagas-title"
        eyebrow="Pai Indica Pai"
        title="Vagas indicadas por pais"
        subtitle="Oportunidades de trabalho que um pai indica para outro, moderadas uma a uma. Grátis para quem publica e para quem procura."
        linkTo="/pai-indica-pai/vagas"
        linkLabel="Ver todas as vagas"
      />
      {list.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {list.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link
              to="/pai-indica-pai/vagas/nova"
              className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              Publicar uma vaga
            </Link>
            <Link
              to="/pai-indica-pai/vagas"
              className="font-semibold text-muted-foreground hover:text-primary sm:hidden"
            >
              Ver todas as vagas →
            </Link>
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-soft md:p-8">
          <Briefcase className="mx-auto h-9 w-9 text-primary" aria-hidden />
          <p className="mt-3 font-display text-xl font-bold">
            Conhece uma vaga boa? Indique para outro pai.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Toda vaga passa por moderação antes de aparecer aqui. Publique a da sua empresa ou a que
            você viu por aí e ajude um pai a sustentar a família.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/pai-indica-pai/vagas/nova"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PlusCircle className="h-4 w-4" aria-hidden />
              Publicar vaga
            </Link>
            <Link
              to="/pai-indica-pai"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
            >
              Conhecer o Pai Indica Pai
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
