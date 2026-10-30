import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { StoryCard } from "@/components/irmandade/StoryCard";
import { getStoriesData } from "@/lib/community.functions";
import { STORY_CATEGORIES } from "@/lib/irmandade/story-categories";
import { getReadStoryIds } from "@/lib/irmandade/stories-read";
import type { StoryRow } from "@/lib/irmandade/types";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/_site/historias/");
const SORTS = [
  { value: "recent", label: "Recentes" },
  { value: "liked", label: "Mais ajudaram" },
  { value: "oldest", label: "Antigas" },
] as const;

/** /historias (doc 09 §3): lista approved, filtros por categoria e ordem, gate "1 história grátis". */
export default function HistoriasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const loaderStories = routeApi.useLoaderData({ select: (d) => d.stories });
  const [stories, setStories] = useState<StoryRow[]>(loaderStories);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("recent");
  const [loading, setLoading] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const isDefault = category === "all" && sort === "recent";

  useEffect(() => setReadCount(getReadStoryIds().length), []);
  useEffect(() => {
    if (isDefault) {
      setStories(loaderStories);
      return;
    }
    setLoading(true);
    getStoriesData({ data: { category: category === "all" ? undefined : category, sort } })
      .then((r) => setStories(r.stories))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [category, sort, isDefault, loaderStories]);

  const locked = !user && readCount >= 1;
  const openStory = (id: string) => {
    if (!user) {
      const read = getReadStoryIds();
      if (read.length >= 1 && !read.includes(id)) return navigate(`/entrar?next=/historias/${id}`);
    }
    navigate(`/historias/${id}`);
  };

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Irmandade", path: "/irmandade" },
          { name: "Histórias", path: "/historias" },
        ]}
      />
      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Irmandade</p>
          <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">Histórias de pai</h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Relatos reais de pais da Irmandade: o que deu certo, o que deu errado e o que ficou.
            Testemunho, não boato.
          </p>
          {!user && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Visitante lê uma história de graça; para ler todas e contar a sua, entre na Irmandade.
            </p>
          )}
        </div>
        <Link
          to={user ? "/historias/nova" : "/entrar?next=/historias/nova"}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft"
        >
          <PenLine className="h-4 w-4" /> Conte sua história
        </Link>
      </header>
      <AdSlot format="leaderboard" className="mt-6" />
      <div className="mt-6 flex flex-wrap gap-2">
        {[{ value: "all", label: "Todas" }, ...STORY_CATEGORIES].map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold",
              category === c.value
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border",
            )}
          >
            {c.label}
          </button>
        ))}
        <span className="ml-auto flex gap-1">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setSort(s.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold",
                sort === s.value
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </span>
      </div>
      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Carregando…</p>
      ) : stories.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Ainda não há histórias aprovadas aqui. Seja o primeiro a contar a sua.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <StoryCard
              key={s.id}
              story={s}
              locked={locked && !getReadStoryIds().includes(s.id)}
              onOpen={openStory}
            />
          ))}
        </div>
      )}
    </div>
  );
}
