import { getRouteApi } from "@tanstack/react-router";
import {
  BookOpenText,
  CalendarDays,
  HandHelping,
  MessageCircleQuestion,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { StoryCard } from "@/components/irmandade/StoryCard";
import { QuestionCard } from "@/components/irmandade/QuestionCard";
import { EventCard } from "@/components/irmandade/EventCard";
import {
  AVISO_PROFISSIONAL,
  CODIGO_DE_CONDUTA_IRMANDADE,
  IRMANDADE_POSICIONAMENTO,
} from "@/content/irmandade/codigo-de-conduta";

const routeApi = getRouteApi("/_site/irmandade");

const AREAS = [
  {
    to: "/historias",
    icon: BookOpenText,
    title: "Histórias de pai",
    text: "Relato real de um pai: o que deu certo e o que deu errado. Moderado antes de ir ao ar.",
  },
  {
    to: "/perguntas",
    icon: MessageCircleQuestion,
    title: "Perguntas da Irmandade",
    text: "Pergunta prática respondida por quem já passou por aquilo. O autor marca a melhor resposta.",
  },
  {
    to: "/eventos",
    icon: CalendarDays,
    title: "Encontros",
    text: "Café dos pais, lives, retiros e o Galpão do Pai: ombro a ombro, presencial ou on-line.",
  },
];

/** /irmandade (doc 09 §0 e §1): hub + código de conduta + próximos encontros + CTA de grupo. */
export default function IrmandadePage() {
  const { stories, questions, events } = routeApi.useLoaderData();
  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Irmandade", path: "/irmandade" }]} />
      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Irmandade</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
          {IRMANDADE_POSICIONAMENTO}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Nenhum pai caminha sozinho. Um homem conta o que viveu, outro pergunta o que não sabe, um
          terceiro responde com o que aprendeu, e de vez em quando eles se encontram ombro a ombro.
          Gratuita, moderada e com porta.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Áreas da Irmandade">
        {AREAS.map(({ to, icon: Icon, title, text }) => (
          <Link
            key={to}
            to={to}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary"
          >
            <Icon className="h-7 w-7 text-primary" />
            <h2 className="mt-3 font-display text-xl font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </Link>
        ))}
      </section>

      {stories.length > 0 && (
        <section className="mt-12" aria-labelledby="h-historias">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="h-historias" className="font-display text-2xl font-bold">
              Últimas histórias
            </h2>
            <Link to="/historias" className="text-sm font-semibold text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {stories.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
        </section>
      )}

      {questions.length > 0 && (
        <section className="mt-12" aria-labelledby="h-perguntas">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="h-perguntas" className="font-display text-2xl font-bold">
              Perguntas sem resposta
            </h2>
            <Link
              to="/perguntas?filter=sem-resposta"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Responder
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {questions.map((q) => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12" aria-labelledby="h-encontros">
        <div className="mb-4 flex items-end justify-between">
          <h2 id="h-encontros" className="font-display text-2xl font-bold">
            Próximos encontros
          </h2>
          <Link to="/eventos" className="text-sm font-semibold text-primary hover:underline">
            Agenda completa
          </Link>
        </div>
        {events.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Nenhum encontro agendado por enquanto. Os próximos aparecem aqui e no resumo semanal por
            e-mail.
          </p>
        )}
      </section>

      <section
        id="codigo-de-conduta"
        className="mt-12 rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8"
        aria-labelledby="h-codigo"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h2 id="h-codigo" className="font-display text-2xl font-bold">
            Código de conduta da Irmandade
          </h2>
        </div>
        <ol className="mt-4 grid gap-2 text-sm leading-relaxed md:grid-cols-2">
          {CODIGO_DE_CONDUTA_IRMANDADE.map((regra) => (
            <li key={regra} className="rounded-xl bg-muted/50 p-3">
              {regra}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">{AVISO_PROFISSIONAL}</p>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-primary/5 p-6">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="mt-2 font-display text-xl font-bold">
            Quer abrir um grupo na sua paróquia?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fraternidades de 4 a 6 homens com um âncora, reunião semanal e check-in diário. Fale com
            a gente.
          </p>
          <Link
            to="/contato?assunto=grupo"
            className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
          >
            Fale com a gente
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-accent/5 p-6">
          <HandHelping className="h-6 w-6 text-accent" />
          <h2 className="mt-2 font-display text-xl font-bold">Formação do pai</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Trilhas com passos e desafios de 30 dias. As insígnias ligam a Irmandade à Formação na
            sua Área do Pai.
          </p>
          <Link
            to="/formacao"
            className="mt-4 inline-flex h-10 items-center rounded-full border border-accent px-5 text-sm font-bold text-accent"
          >
            Ver a Formação
          </Link>
        </div>
      </section>
    </div>
  );
}
