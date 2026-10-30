import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AnswerList } from "@/components/irmandade/AnswerList";
import { AnswerForm } from "@/components/irmandade/AnswerForm";
import { ReportButton } from "@/components/irmandade/ReportButton";
import type { AnswerRow } from "@/lib/irmandade/types";
import { formatDate } from "@/lib/site";
import { AVISO_PROFISSIONAL } from "@/content/irmandade/codigo-de-conduta";

const routeApi = getRouteApi("/_site/perguntas/$slug");

/** /perguntas/$slug (doc 09 §4): pergunta, respostas com voto, melhor resposta, form de resposta. */
export default function PerguntaPage() {
  const { question, answers: initial } = routeApi.useLoaderData();
  const { user, profile } = useAuth();
  const [answers, setAnswers] = useState<AnswerRow[]>(initial);
  const [acceptedId, setAcceptedId] = useState<string | null>(question.accepted_answer_id);
  const isAuthor = user?.id === question.user_id;
  const isStaff = profile?.role === "admin" || profile?.role === "editor";
  const next = `/perguntas/${question.slug}`;
  const paragraphs = question.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Irmandade", path: "/irmandade" },
          { name: "Perguntas", path: "/perguntas" },
          { name: question.title, path: next },
        ]}
      />
      <div className="mx-auto mt-6 max-w-3xl">
        <article className="rounded-3xl border border-border bg-card p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {question.categories && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                {question.categories.name}
              </span>
            )}
            {question.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-muted-foreground"
              >
                #{t}
              </span>
            ))}
            {question.status === "closed" && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 font-bold text-muted-foreground">
                Fechada
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight">{question.title}</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground/80">
              {question.author?.display_name ?? "Pai da Irmandade"}
            </span>{" "}
            · <time dateTime={question.created_at}>{formatDate(question.created_at)}</time> ·{" "}
            {question.answers_count + (answers.length - initial.length)} resposta
            {question.answers_count === 1 ? "" : "s"}
          </div>
          <div className="prose mt-5 max-w-none text-foreground/90">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-4">
            <ReportButton entity="question" entityId={question.id} next={next} />
          </div>
        </article>

        <section className="mt-8" aria-labelledby="h-respostas">
          <h2 id="h-respostas" className="font-display text-2xl font-bold">
            Respostas
          </h2>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">{AVISO_PROFISSIONAL}</p>
          <AnswerList
            questionId={question.id}
            answers={answers}
            acceptedId={acceptedId}
            canAccept={!!user && (isAuthor || isStaff)}
            next={next}
            onAccepted={setAcceptedId}
          />
        </section>

        <section className="mt-8">
          {question.status !== "approved" ? (
            <p className="text-sm text-muted-foreground">
              Esta pergunta está fechada para novas respostas.
            </p>
          ) : !user ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm">
              Já passou por isso?{" "}
              <Link
                to={`/entrar?next=${encodeURIComponent(next)}`}
                className="font-bold text-primary hover:underline"
              >
                Entre na Irmandade
              </Link>{" "}
              para responder.
            </div>
          ) : isAuthor ? (
            <p className="text-sm text-muted-foreground">
              Você fez esta pergunta. Quando chegarem respostas, marque a que mais ajudou.
            </p>
          ) : (
            <AnswerForm
              questionId={question.id}
              onCreated={(a) =>
                setAnswers((list) => [
                  ...list,
                  {
                    ...a,
                    author: { display_name: profile?.full_name ?? "Você", avatar_url: null },
                  },
                ])
              }
            />
          )}
        </section>
      </div>
    </div>
  );
}
