import { Link } from "@/lib/router-compat";
import type { RelatedPost } from "@/lib/tools/related.functions";

export function ToolRelatedArticles({ posts }: { posts: RelatedPost[] }) {
  if (!posts.length) return null;
  return (
    <section aria-labelledby="leia-tambem" className="mt-12">
      <h2 id="leia-tambem" className="font-display text-2xl font-bold">
        Leia também
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {posts.slice(0, 4).map((p) => (
          <Link
            key={p.slug}
            to={`/post/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-primary"
          >
            {p.cover_image_url && (
              <img
                src={p.cover_image_url}
                alt=""
                loading="lazy"
                className="aspect-[16/9] w-full object-cover"
              />
            )}
            <div className="flex flex-1 flex-col p-4">
              {p.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  {p.category.name}
                </span>
              )}
              <span className="mt-1 font-display text-base font-bold leading-snug group-hover:text-primary">
                {p.title}
              </span>
              {p.reading_time ? (
                <span className="mt-auto pt-2 text-xs text-muted-foreground">
                  {p.reading_time} min de leitura
                </span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
