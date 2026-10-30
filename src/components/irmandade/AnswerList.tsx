import { useState } from "react";
import { Award, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@/lib/router-compat";
import { acceptAnswerFn, voteAnswerFn } from "@/lib/community.functions";
import { formatDate } from "@/lib/site";
import type { AnswerRow } from "@/lib/irmandade/types";
import { cn } from "@/lib/utils";
import { ReportButton } from "./ReportButton";

function VoteButtons({ answer, next }: { answer: AnswerRow; next: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [count, setCount] = useState(answer.like_count);
  const [mine, setMine] = useState<1 | -1 | 0>(0);
  const own = user?.id === answer.user_id;
  const vote = async (v: 1 | -1) => {
    if (!user) return navigate(`/entrar?next=${encodeURIComponent(next)}`);
    const value = mine === v ? 0 : v;
    try {
      const r = await voteAnswerFn({ data: { answerId: answer.id, value } });
      setCount(r.likeCount);
      setMine(value);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível votar.");
    }
  };
  return (
    <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
      <button
        type="button"
        aria-label="Voto positivo"
        disabled={own}
        onClick={() => vote(1)}
        className={cn(
          "rounded-md p-1 hover:text-primary disabled:opacity-40",
          mine === 1 && "text-primary",
        )}
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <span className="text-sm font-bold text-foreground">{count}</span>
      <button
        type="button"
        aria-label="Voto negativo"
        disabled={own}
        onClick={() => vote(-1)}
        className={cn(
          "rounded-md p-1 hover:text-destructive disabled:opacity-40",
          mine === -1 && "text-destructive",
        )}
      >
        <ChevronDown className="h-5 w-5" />
      </button>
    </div>
  );
}

/** Lista de respostas: melhor resposta primeiro, votos, "Marcar como melhor" só para o autor/staff. */
export function AnswerList({
  questionId,
  answers,
  acceptedId,
  canAccept,
  next,
  onAccepted,
}: {
  questionId: string;
  answers: AnswerRow[];
  acceptedId: string | null;
  canAccept: boolean;
  next: string;
  onAccepted: (id: string) => void;
}) {
  const ordered = [...answers].sort((a, b) => {
    if (a.id === acceptedId) return -1;
    if (b.id === acceptedId) return 1;
    return b.like_count - a.like_count || a.created_at.localeCompare(b.created_at);
  });
  const accept = async (answerId: string) => {
    try {
      await acceptAnswerFn({ data: { questionId, answerId } });
      onAccepted(answerId);
      toast.success("Melhor resposta marcada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível marcar.");
    }
  };
  if (ordered.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Ainda sem resposta. Se você já passou por isso, conte o que fez.
      </p>
    );
  }
  return (
    <ol className="space-y-4">
      {ordered.map((a) => {
        const best = a.id === acceptedId;
        return (
          <li
            key={a.id}
            id={`resposta-${a.id}`}
            className={cn(
              "flex gap-4 rounded-2xl border bg-card p-5 shadow-soft",
              best ? "border-success" : "border-border",
            )}
          >
            <VoteButtons answer={a} next={next} />
            <div className="min-w-0 flex-1">
              {best && (
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success">
                  <Award className="h-3 w-3" /> Melhor resposta
                </span>
              )}
              <div className="whitespace-pre-line text-sm leading-relaxed">{a.body}</div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground/80">
                  {a.author?.display_name ?? "Irmão da Irmandade"}
                </span>
                <time dateTime={a.created_at}>{formatDate(a.created_at)}</time>
                {canAccept && !best && (
                  <button
                    type="button"
                    onClick={() => accept(a.id)}
                    className="font-bold text-primary hover:underline"
                  >
                    Marcar como melhor
                  </button>
                )}
                <ReportButton entity="answer" entityId={a.id} next={next} />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
