import { CalendarDays, Heart, Lock, UserRound } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatDate } from "@/lib/site";
import { storyCategoryLabel } from "@/lib/irmandade/story-categories";
import type { StoryRow } from "@/lib/irmandade/types";

/** Cartão de história de pai (doc 09 §10.3): capa 4:3 ou inicial do autor, chip, 3 linhas, autor + data. */
export function StoryCard({
  story,
  locked = false,
  onOpen,
}: {
  story: StoryRow;
  locked?: boolean;
  onOpen?: (id: string) => void;
}) {
  const excerpt =
    story.content.length > 220 ? `${story.content.slice(0, 220).trim()}…` : story.content;
  const handleOpen = (e: React.MouseEvent) => {
    if (onOpen) {
      e.preventDefault();
      onOpen(story.id);
    }
  };
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <Link
        to={`/historias/${story.id}`}
        onClick={handleOpen}
        className="relative block aspect-[4/3] overflow-hidden bg-primary/10"
      >
        {story.photo_url ? (
          <img
            src={story.photo_url}
            alt={story.title}
            loading="lazy"
            decoding="async"
            width={800}
            height={600}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 font-display text-3xl font-bold text-primary">
              {story.author_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-background/90 px-3 py-1 text-[11px] font-bold text-primary shadow-sm backdrop-blur">
          {storyCategoryLabel(story.category)}
        </span>
        {locked && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">
            <Lock className="h-3 w-3" /> Entre para ler
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold leading-snug">
          <Link
            to={`/historias/${story.id}`}
            onClick={handleOpen}
            className="transition-colors hover:text-primary"
          >
            {story.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-foreground/70">{excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
            <UserRound className="h-3.5 w-3.5" /> {story.author_name}
          </span>
          <time dateTime={story.created_at} className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(story.created_at)}
          </time>
          {story.like_count > 0 && (
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {story.like_count}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
