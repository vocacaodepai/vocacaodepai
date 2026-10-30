import { CheckCircle2, Eye, MessageSquare } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatDate } from "@/lib/site";
import type { QuestionRow } from "@/lib/irmandade/types";

/** Cartão de pergunta (doc 09 §10.3): título, categoria, respostas, selo "Resolvida", autor + data, views. */
export function QuestionCard({ question }: { question: QuestionRow }) {
  const q = question;
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/50">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {q.categories && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
            {q.categories.name}
          </span>
        )}
        {q.accepted_answer_id && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 font-bold text-success">
            <CheckCircle2 className="h-3 w-3" /> Resolvida
          </span>
        )}
        {q.status === "closed" && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-bold text-muted-foreground">
            Fechada
          </span>
        )}
      </div>
      <h3 className="mt-2 font-display text-lg font-bold leading-snug">
        <Link to={`/perguntas/${q.slug}`} className="hover:text-primary">
          {q.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{q.body}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground/80">
          {q.author?.display_name ?? "Pai da Irmandade"}
        </span>
        <time dateTime={q.created_at}>{formatDate(q.created_at)}</time>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" /> {q.answers_count}{" "}
          {q.answers_count === 1 ? "resposta" : "respostas"}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {q.views}
        </span>
      </div>
    </article>
  );
}
