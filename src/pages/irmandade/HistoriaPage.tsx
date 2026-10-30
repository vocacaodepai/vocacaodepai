import { useEffect, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { CalendarDays, Lock, UserRound } from "lucide-react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { StoryCard } from "@/components/irmandade/StoryCard";
import { LikeStoryButton } from "@/components/irmandade/LikeStoryButton";
import { ReportButton } from "@/components/irmandade/ReportButton";
import { storyCategoryLabel } from "@/lib/irmandade/story-categories";
import { canReadAnonymousStory, markStoryRead } from "@/lib/irmandade/stories-read";
import { formatDate } from "@/lib/site";

const routeApi = getRouteApi("/_site/historias/$id");

/** /historias/$id (doc 09 §3): leitura, gate de 1 grátis, "Esse relato me ajudou", denúncia, outras histórias. */
export default function HistoriaPage() {
  const { story, others } = routeApi.useLoaderData();
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (user) {
      setAllowed(true);
      return;
    }
    if (canReadAnonymousStory(story.id)) {
      markStoryRead(story.id);
      setAllowed(true);
    } else setAllowed(false);
  }, [ready, user, story.id]);

  const paragraphs = story.content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Irmandade", path: "/irmandade" },
          { name: "Histórias", path: "/historias" },
          { name: story.title, path: `/historias/${story.id}` },
        ]}
      />
      <article className="mx-auto mt-6 max-w-3xl">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {storyCategoryLabel(story.category)}
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
          {story.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
            <UserRound className="h-4 w-4" /> {story.author_name}
          </span>
          <time dateTime={story.created_at} className="inline-flex items-center gap-1">
            <CalendarDays className="h-4 w-4" /> {formatDate(story.created_at)}
          </time>
        </div>
        {story.photo_url && (
          <img
            src={story.photo_url}
            alt={story.title}
            className="mt-6 w-full rounded-2xl object-cover"
          />
        )}
        {allowed === false ? (
          <div className="mt-8 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <Lock className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 font-display text-2xl font-bold">
              Entre na Irmandade para continuar lendo
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Visitante lê uma história de graça. Membro lê todas, conta a sua e responde a outros
              pais. É gratuito.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/entrar?next=/historias/${story.id}`)}
              className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
            >
              Entrar ou criar conta
            </button>
          </div>
        ) : (
          <div className="prose prose-lg mt-8 max-w-none text-foreground/90">
            {allowed === null ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            )}
          </div>
        )}
        {allowed && (
          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-border pt-6">
            <LikeStoryButton storyId={story.id} initialCount={story.like_count} />
            <ReportButton entity="story" entityId={story.id} next={`/historias/${story.id}`} />
          </div>
        )}
        <AdSlot format="rect" className="mt-8" />
      </article>
      {others.length > 0 && (
        <section className="mx-auto mt-12 max-w-5xl" aria-labelledby="h-outras">
          <h2 id="h-outras" className="font-display text-2xl font-bold">
            Outras histórias
          </h2>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {others.map((s) => (
              <StoryCard key={s.id} story={s} />
            ))}
          </div>
          <Link
            to="/historias"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Todas as histórias
          </Link>
        </section>
      )}
    </div>
  );
}
