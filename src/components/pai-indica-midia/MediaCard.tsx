import { Link } from "@/lib/router-compat";
import { mediaTypeLabels, platformSlug, tierOf } from "@/lib/pai-indica-midia/taxonomia";
import type { MediaCardRow } from "@/lib/pai-indica-midia/types";
import { ContentDots } from "./ContentDots";
import { MediaBadge } from "./MediaBadge";
import { PosterFrame } from "./PosterFrame";

/** Card da listagem /pai-indica/midia, com data-attributes para o MediaFilter (data-kind = tipo). */
export function MediaCard({ media }: { media: MediaCardRow }) {
  const href = `/pai-indica/midia/${media.slug}`;
  return (
    <article
      data-kind={media.type}
      data-age-tier={tierOf(media.pai_age_min).slug}
      data-platforms={media.platforms.map(platformSlug).join(" ")}
      className="group flex overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
    >
      <Link
        to={href}
        aria-label={`Ler a ficha: ${media.title}`}
        className="block w-28 shrink-0 sm:w-32"
      >
        <PosterFrame
          title={media.title}
          type={media.type}
          year={media.year}
          posterUrl={media.poster_url}
          className="h-full rounded-none"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
          {mediaTypeLabels[media.type].label}
          {media.year ? ` · ${media.year}` : ""}
          {media.platforms.length ? ` · ${media.platforms.slice(0, 2).join(", ")}` : ""}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold leading-snug">
          <Link to={href} className="transition-colors group-hover:text-primary">
            {media.title}
          </Link>
        </h3>
        <MediaBadge
          type={media.type}
          classind={media.classind}
          paiAgeMin={media.pai_age_min}
          scoreQuality={media.score_quality}
          scoreMoral={media.score_moral}
          className="mt-2"
        />
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{media.summary}</p>
        <ContentDots scores={media.content_scores} compact className="mt-3" />
      </div>
    </article>
  );
}
