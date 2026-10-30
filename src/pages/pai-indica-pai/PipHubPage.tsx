import { useEffect, useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Compass, Handshake, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AlertsPreferencesForm } from "@/components/pai-indica-pai/AlertsPreferencesForm";
import { JobCard } from "@/components/pai-indica-pai/JobCard";
import { ProfessionalCard } from "@/components/pai-indica-pai/ProfessionalCard";
import {
  AntifraudNotice,
  ConductNotice,
  EmptyState,
  PipNav,
  btnOutline,
  btnPrimary,
} from "@/components/pai-indica-pai/shared";
import { cancelJobAlerts } from "@/lib/pai-indica-pai/functions";

const routeApi = getRouteApi("/_site/pai-indica-pai/");

/** Hub do Pai Indica Pai (doc 08 §3.1): 4 frentes, como funciona, conduta, últimas vagas, profissionais, alertas. */
export default function PipHubPage() {
  const { counts, latestJobs, professionals } = routeApi.useLoaderData();
  const search = routeApi.useSearch() as { alertas?: string; email?: string };
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    if (search.alertas === "cancelar" && search.email && !cancelled) {
      cancelJobAlerts({ data: { email: search.email } })
        .then((r) => {
          setCancelled(true);
          if (r.ok) toast.success("Alertas de vagas cancelados para " + search.email);
        })
        .catch(() => {});
    }
  }, [search.alertas, search.email, cancelled]);

  const fronts = [
    {
      to: "/pai-indica-pai/vagas",
      icon: Briefcase,
      title: "Vagas",
      count: `${counts.jobs} ${counts.jobs === 1 ? "vaga aberta" : "vagas abertas"}`,
      text: "Pai publica vaga da própria empresa ou que conhece; outro pai se candidata.",
      cta: "Ver vagas",
    },
    {
      to: "/pai-indica-pai/indicacoes",
      icon: Handshake,
      title: "Indicações",
      count: `${counts.referrals} ${counts.referrals === 1 ? "indicação" : "indicações"}`,
      text: "Profissional, serviço ou empresa de confiança, indicados por quem já usou.",
      cta: "Ver indicações",
    },
    {
      to: "/pai-indica-pai/profissionais",
      icon: Wrench,
      title: "Pai Profissional",
      count: `${counts.professionals} ${counts.professionals === 1 ? "profissional" : "profissionais"}`,
      text: "Diretório de pais que fazem bem o que fazem: eletricista, contador, dev, pedreiro.",
      cta: "Ver diretório",
    },
    {
      to: "/pai-indica-pai/mentoria",
      icon: Compass,
      title: "Mentoria",
      count: `${counts.mentors} ${counts.mentors === 1 ? "mentor" : "mentores"}`,
      text: "Pai experiente orienta pai iniciante em carreira, negócio, finanças, fé e casamento.",
      cta: "Pedir mentoria",
    },
  ] as const;

  return (
    <div className="container space-y-12 pb-16 pt-6">
      <Breadcrumbs items={[{ name: "Pai Indica Pai", path: "/pai-indica-pai" }]} />
      <header className="space-y-5">
        <PipNav current="/pai-indica-pai" />
        <div className="rounded-3xl bg-secondary p-8 text-secondary-foreground md:p-12">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Pai Indica Pai</p>
          <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">
            Um pai ajuda outro pai a sustentar a família.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-secondary-foreground/80">
            Vagas, indicações, profissionais e mentoria. Gratuito, moderado, sem intermediação.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/pai-indica-pai/vagas/nova" className={btnPrimary}>
              <Briefcase className="h-4 w-4" /> Publicar vaga
            </Link>
            <Link to="/pai-indica-pai/indicacoes/nova" className={btnOutline}>
              <Handshake className="h-4 w-4" /> Indicar alguém
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fronts.map((f) => (
          <Link
            key={f.to}
            to={f.to}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
          >
            <f.icon className="h-8 w-8 text-primary" />
            <h2 className="font-display text-2xl font-bold group-hover:text-primary">{f.title}</h2>
            <p className="text-sm font-bold text-accent">{f.count}</p>
            <p className="text-sm text-muted-foreground">{f.text}</p>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold text-primary">
              {f.cta} <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          [
            "1. Publique",
            "Vaga, indicação ou seu perfil profissional. Só membro com e-mail confirmado.",
          ],
          [
            "2. Moderamos em até 48 h",
            "Um pai da equipe revisa: empresa real, sem golpe, sem cobrança do candidato.",
          ],
          [
            "3. Vai ao ar",
            "Vaga fica 45 dias, indicação 90, perfil até você desativar. Renovável.",
          ],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-display text-xl font-bold">{t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <AntifraudNotice />

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-bold">Últimas vagas</h2>
          <Link
            to="/pai-indica-pai/vagas"
            className="text-sm font-bold text-primary hover:underline"
          >
            Todas as vagas
          </Link>
        </div>
        {latestJobs.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestJobs.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhuma vaga no ar ainda"
            text="Publique a primeira: uma vaga da sua empresa ou que você conhece pode ser o sustento de outro pai."
            action={
              <Link to="/pai-indica-pai/vagas/nova" className={btnPrimary}>
                Publicar vaga
              </Link>
            }
          />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-3xl font-bold">Pais profissionais em destaque</h2>
          <Link
            to="/pai-indica-pai/profissionais"
            className="text-sm font-bold text-primary hover:underline"
          >
            Ver diretório
          </Link>
        </div>
        {professionals.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {professionals.map((p) => (
              <ProfessionalCard key={p.id} pro={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="O diretório está começando"
            text="Você faz bem o que faz? Cadastre seu perfil de Pai Profissional e seja encontrado por outros pais."
            action={
              <Link to="/pai-indica-pai/profissionais/novo" search={{}} className={btnPrimary}>
                Criar meu perfil
              </Link>
            }
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <ConductNotice />
        <AlertsPreferencesForm />
      </div>
    </div>
  );
}
