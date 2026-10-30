import { useEffect, useState } from "react";
import { Award, Medal, Trophy, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchQuizRanking, fetchMyQuizPoints, type QuizRankRow } from "@/lib/db";
import { fatherRank } from "@/lib/rank";
import { cn } from "@/lib/utils";

const MEDALS = [Trophy, Medal, Award];

export function QuizRanking({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<QuizRankRow[]>([]);
  const [myPoints, setMyPoints] = useState(0);

  useEffect(() => {
    fetchQuizRanking(100)
      .then(setRanking)
      .catch(() => setRanking([]));
    fetchMyQuizPoints()
      .then(setMyPoints)
      .catch(() => setMyPoints(0));
  }, []);

  if (ranking.length === 0 && !user) return null;

  const top = ranking.slice(0, compact ? 3 : 5);
  const myIndex = user ? ranking.findIndex((r) => r.user_id === user.id) : -1;

  return (
    <section
      className="mt-10 rounded-2xl border border-secondary bg-secondary/25 p-6"
      aria-labelledby="ranking-title"
    >
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        <h2 id="ranking-title" className="font-display text-xl font-bold">
          {"Ranking do Pai Expert"}
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{"Os pais que mais acertam os quizzes"}</p>

      {top.length === 0 ? (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-center text-sm text-muted-foreground">
          {"Nenhum pai pontuou ainda — faça login, responda um quiz e seja o primeiro no pódio!"}
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {top.map((row, i) => {
            const RankIcon = MEDALS[i] ?? null;
            const isMe = user?.id === row.user_id;
            return (
              <li
                key={row.user_id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-2.5",
                  isMe ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-secondary-foreground">
                  {RankIcon ? (
                    <RankIcon
                      className={cn(
                        "h-5 w-5",
                        i === 0 && "text-amber-500",
                        i === 1 && "text-slate-400",
                        i === 2 && "text-amber-700",
                      )}
                    />
                  ) : (
                    <span className="text-sm font-bold">{i + 1}</span>
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">
                  {isMe ? "Você" : (row.full_name?.split(" ")[0] ?? "Pai")}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {fatherRank(row.points).title}
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {row.points} {"pontos"}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {user && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="inline-flex items-center gap-2 font-bold">
            <UserRound className="h-4 w-4 text-primary" />
            {myIndex >= 0 ? (
              <>
                {"Sua posição"}: #{myIndex + 1}
              </>
            ) : (
              "Jogue os quizzes para entrar no ranking"
            )}
          </span>
          <span className="text-xs font-bold text-primary">
            {myPoints} {"pontos"} · {fatherRank(myPoints).title}
          </span>
        </div>
      )}
    </section>
  );
}
