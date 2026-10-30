import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Info,
  Lock,
  Loader2,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchMyAttempt, fetchMyQuizPoints, submitQuiz } from "@/lib/db";
import type { QuizQuestion } from "@/lib/types";
import { fatherRank } from "@/lib/rank";
import { cn } from "@/lib/utils";

interface Answered {
  question: string;
  options: string[];
  chosen: number;
  answer: number;
  explanation?: string;
}

export function QuizWidget({ quiz: rawQuiz, postId }: { quiz: QuizQuestion[]; postId: string }) {
  // Seeds e editor gravam `correct` (CLAUDE.md §6); conteúdo antigo pode trazer `answer`.
  const quiz = rawQuiz.map((q) => {
    const c = (q as unknown as { correct?: number }).correct;
    return typeof q.answer === "number" ? q : { ...q, answer: typeof c === "number" ? c : 0 };
  });
  const { user, openLogin } = useAuth();
  const [attempt, setAttempt] = useState<{ score: number; total: number } | null | undefined>(
    undefined,
  );
  const [points, setPoints] = useState(0);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);

  useEffect(() => {
    if (!user || !quiz.length) return;
    fetchMyAttempt(postId)
      .then((a) => setAttempt(a ? { score: a.score, total: a.total } : null))
      .catch(() => setAttempt(null));
    fetchMyQuizPoints()
      .then(setPoints)
      .catch(() => setPoints(0));
  }, [user, postId, quiz.length]);

  if (!quiz || quiz.length === 0) return null;

  // ----- Not logged in: explain the game and ask for login -----
  if (!user) {
    return (
      <div className="mt-10 flex flex-col items-center gap-3 rounded-2xl border border-secondary bg-secondary/25 p-8 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Trophy className="h-6 w-6" />
        </span>
        <p className="font-display text-xl font-bold">{"Participe do Ranking do Pai Expert"}</p>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {
            "Entre para jogar e acumular pontos: cada acerto vale ponto e a sua resposta é única — depois de enviar, não dá para mudar. Quanto mais quizzes você acertar, mais alto sobe no ranking. Complete todos os artigos e vire um Pai Lenda!"
          }
        </p>
        <button
          onClick={openLogin}
          className="mt-1 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          {"Entrar / Criar conta"}
        </button>
      </div>
    );
  }

  // ----- Already played this quiz: locked, cannot change -----
  if (attempt) {
    return (
      <div className="mt-10 rounded-2xl border border-secondary bg-secondary/25 p-6 md:p-8">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70 text-secondary-foreground">
            <Lock className="h-6 w-6" />
          </span>
          <p className="mt-3 font-display text-2xl font-bold">{"Você já participou deste quiz"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {
              "Sua resposta foi registrada e não pode ser alterada. Revise abaixo as respostas certas e siga para os outros quizzes para subir no ranking."
            }
          </p>
          <p className="mt-3 font-display text-xl font-bold text-primary">
            {"Você acertou"} {attempt.score} {"de"} {attempt.total}
          </p>
        </div>

        <div className="mt-6 space-y-3">
          {quiz.map((q, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm font-bold leading-snug">
                {i + 1}. {q.question}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {"Resposta certa"}:{" "}
                <span className="font-semibold text-primary">{q.options[q.answer]}</span>
              </p>
              {q.explanation && (
                <p className="mt-1.5 text-xs leading-relaxed text-foreground/70">
                  <Info className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-muted-foreground" />
                  {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ----- Play (first time) -----
  const question = quiz[index];
  const isLast = index + 1 === quiz.length;

  const pick = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setAnswers((prev) => [
      ...prev,
      {
        question: question.question,
        options: question.options,
        chosen: i,
        answer: question.answer,
        explanation: question.explanation,
      },
    ]);
  };

  const finish = async () => {
    const score = answers.filter((a) => a.chosen === a.answer).length;
    setSubmitting(true);
    setSubmitError(false);
    try {
      await submitQuiz(postId, score, quiz.length);
      setPoints((p) => p + score);
      setAttempt({ score, total: quiz.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("already_submitted")) {
        setAttempt({ score, total: quiz.length });
      } else {
        setSubmitError(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (!isLast) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      void finish();
    }
  };

  const optionState = (i: number) => {
    if (selected === null) return "idle";
    if (i === question.answer) return "correct";
    if (i === selected) return "wrong";
    return "dimmed";
  };

  return (
    <div className="mt-10 rounded-2xl border border-secondary bg-secondary/25 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-display text-lg font-bold text-secondary-foreground">
          <BookOpen className="h-5 w-5" />
          {"Teste o que você aprendeu"}
        </p>
        <span className="text-xs font-bold text-muted-foreground">
          {"Pergunta"} {index + 1} {"de"} {quiz.length}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {"Responda o quiz e veja se ficou com alguma dúvida."}
      </p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((index + (selected !== null ? 1 : 0)) / quiz.length) * 100}%` }}
        />
      </div>

      <p className="mt-5 font-display text-xl font-bold">{question.question}</p>

      <div className="mt-4 space-y-2.5">
        {question.options.map((option, i) => {
          const state = optionState(i);
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={selected !== null}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all",
                state === "idle" && "border-border bg-card text-foreground hover:border-primary",
                state === "correct" && "border-primary bg-primary/10 text-primary",
                state === "wrong" && "border-destructive bg-destructive/10 text-destructive",
                state === "dimmed" && "border-border bg-card/50 text-foreground/50",
              )}
            >
              <span>{option}</span>
              {state === "correct" && <CheckCircle2 className="h-4 w-4 shrink-0" />}
              {state === "wrong" && <XCircle className="h-4 w-4 shrink-0" />}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mt-4 space-y-3">
          <p
            className={cn(
              "text-sm font-bold",
              selected === question.answer ? "text-primary" : "text-destructive",
            )}
          >
            {selected === question.answer
              ? "Resposta certa!"
              : "Não foi dessa vez. A resposta certa está em destaque."}
          </p>
          {question.explanation && (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm leading-relaxed text-foreground/80">{question.explanation}</p>
            </div>
          )}
          <div className="flex items-center justify-end gap-2">
            {submitError && (
              <span className="text-xs font-bold text-destructive">
                {"Não foi possível registrar. Tente de novo."}
              </span>
            )}
            <button
              onClick={goNext}
              disabled={submitting}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Registrando..." : isLast ? "Enviar resposta" : "Próxima"}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Points earned so far / current rank hint */}
      <div className="mt-4 flex items-center justify-between rounded-xl bg-card/60 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/80">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {"Ranking do Pai Expert"}
        </span>
        <span>
          {points} {"pontos"} · {fatherRank(points).title}
        </span>
      </div>
    </div>
  );
}
