import { isProductCover } from "@/lib/cover";
import { Link } from "@/lib/router-compat";
import { Clock } from "lucide-react";
import type { PostWithRelations } from "@/lib/types";
import { formatDate } from "@/lib/site";
import { readingTime } from "@/lib/content";

export function PostCard({
  post,
  featured = false,
}: {
  post: PostWithRelations;
  featured?: boolean;
}) {
  // Listas viajam sem o body (hub.functions.ts); sem minutos calculados e sem
  // corpo (ex.: resultado da busca) o tempo de leitura fica de fora.
  const minutes =
    post.reading_minutes ??
    (post.body?.content && post.body.content.length > 0 ? readingTime(post.body) : null);
  const score = (post as { product_score?: number | null }).product_score;
  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant ${
        featured ? "md:flex-row md:items-stretch" : ""
      }`}
    >
      <Link
        to={`/post/${post.slug}`}
        aria-label={`Ler o artigo completo: ${post.title}`}
        className={`relative block overflow-hidden ${
          featured ? "md:w-1/2" : "aspect-video w-full"
        } ${isProductCover(post) ? "bg-white" : ""}`}
      >
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            crossOrigin="anonymous"
            loading="lazy"
            decoding="async"
            width={640}
            height={360}
            className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${
              isProductCover(post) ? "object-contain p-3" : "object-cover"
            }`}
          />
        ) : (
          <div className="h-full w-full bg-gradient-soft" />
        )}
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">
            {post.category.name}
          </span>
        )}
        {typeof score === "number" && (
          <span
            className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-sm"
            title="Nota editorial do Pai Indica (0 a 10)"
          >
            {score.toFixed(1).replace(".", ",")}
          </span>
        )}
      </Link>

      {!featured && post.cover_image_url && (
        <p className="border-b border-border/50 px-4 py-1.5 text-center text-[10px] italic leading-tight text-muted-foreground/55">
          {`${post.cover_image_alt ?? post.title}`}
        </p>
      )}

      <div className={`flex flex-1 flex-col p-5 ${featured ? "md:p-8" : ""}`}>
        <h3
          className={`font-display font-bold leading-snug text-foreground ${
            featured ? "text-2xl md:text-3xl" : "text-lg"
          }`}
        >
          <Link to={`/post/${post.slug}`} className="transition-colors hover:text-primary">
            {post.title}
          </Link>
        </h3>
        {post.subtitle && (
          <p
            className={`mt-2 text-foreground/70 ${featured ? "text-base" : "text-sm"} line-clamp-2`}
          >
            {post.subtitle}
          </p>
        )}
        <div className="mt-auto flex items-center gap-3 pt-4 text-xs text-muted-foreground">
          {post.author && (
            <span className="font-semibold text-foreground/80">{post.author.full_name}</span>
          )}
          <span aria-hidden>·</span>
          <time dateTime={post.publish_at ?? undefined}>{formatDate(post.publish_at)}</time>
          {minutes != null && (
            <>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" /> {minutes} min
              </span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
