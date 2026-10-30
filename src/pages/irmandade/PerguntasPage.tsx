import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { MessageCircleQuestion } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { QuestionCard } from "@/components/irmandade/QuestionCard";
import { getQuestionsData } from "@/lib/community.functions";
import type { QuestionRow } from "@/lib/irmandade/types";
import { AVISO_PROFISSIONAL } from "@/content/irmandade/codigo-de-conduta";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/_site/perguntas/");
type Filter = "todas" | "sem-resposta" | "resolvidas";
type Sort = "recentes" | "respondidas";

/** /perguntas (doc 09 §4.1): chips de categoria + "Sem resposta" + "Resolvidas"; ordem recentes/respondidas. */
export default function PerguntasPage() {
  const { user } = useAuth();
  const data = routeApi.useLoaderData();
  const [questions, setQuestions] = useState<QuestionRow[]>(data.questions);
  const [category, setCategory] = useState<string>("todas");
  const [filter, setFilter] = useState<Filter>("todas");
  const [sort, setSort] = useState<Sort>("recentes");
  const [loading, setLoading] = useState(false);
  const isDefault = category === "todas" && filter === "todas" && sort === "recentes";

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("filter") === "sem-resposta"
    )
      setFilter("sem-resposta");
  }, []);
  useEffect(() => {
    if (isDefault) {
      setQuestions(data.questions);
      return;
    }
    setLoading(true);
    getQuestionsData({
      data: {
        category: category === "todas" ? undefined : category,
        filter: filter === "todas" ? undefined : filter,
        sort,
      },
    })
      .then((r) => setQuestions(r.questions))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [category, filter, sort, isDefault, data.questions]);

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-xs font-bold border",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground",
    );
  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Irmandade", path: "/irmandade" },
          { name: "Perguntas", path: "/perguntas" },
        ]}
      />
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Irmandade</p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
            Perguntas da Irmandade
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Pergunta prática respondida por quem já passou por aquilo. {AVISO_PROFISSIONAL}
          </p>
        </div>
        <Link
          to={user ? "/perguntas/nova" : "/entrar?next=/perguntas/nova"}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft"
        >
          <MessageCircleQuestion className="h-4 w-4" /> Fazer uma pergunta
        </Link>
      </header>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={chip(category === "todas")}
          onClick={() => setCategory("todas")}
        >
          Todas
        </button>
        {data.categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className={chip(category === c.slug)}
            onClick={() => setCategory(c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          className={chip(filter === "sem-resposta")}
          onClick={() => setFilter(filter === "sem-resposta" ? "todas" : "sem-resposta")}
        >
          Sem resposta
        </button>
        <button
          type="button"
          className={chip(filter === "resolvidas")}
          onClick={() => setFilter(filter === "resolvidas" ? "todas" : "resolvidas")}
        >
          Resolvidas
        </button>
        <span className="ml-auto flex gap-1">
          <button
            type="button"
            className={chip(sort === "recentes")}
            onClick={() => setSort("recentes")}
          >
            Recentes
          </button>
          <button
            type="button"
            className={chip(sort === "respondidas")}
            onClick={() => setSort("respondidas")}
          >
            Mais respondidas
          </button>
        </span>
      </div>
      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>
      ) : questions.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma pergunta aqui ainda. Faça a primeira.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
