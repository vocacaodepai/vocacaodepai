import { MessageCircle } from "lucide-react";

/**
 * "Para conversar com seu filho" (doc 14 §4.5): 3-5 perguntas para o pai puxar a conversa depois
 * do filme, do jogo ou do livro. Sem link, sem spoiler além do que o texto já contou.
 */
export function TalkWithKids({
  questions,
  className = "",
}: {
  questions: string[];
  className?: string;
}) {
  if (questions.length === 0) return null;
  return (
    <section
      aria-labelledby="conversar-title"
      className={`rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6 ${className}`}
    >
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
        <h2 id="conversar-title" className="font-display text-2xl font-bold">
          Para conversar com seu filho
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Assistir junto vale mais do que proibir. Depois, puxe uma destas e ouça antes de responder.
      </p>
      <ol className="mt-4 space-y-2">
        {questions.map((q, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-xl bg-background/70 p-3 text-sm leading-relaxed"
          >
            <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
            <span>{q}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
