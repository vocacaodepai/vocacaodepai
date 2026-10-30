import { Link } from "@/lib/router-compat";
import type { PaiIndicaPost } from "@/lib/pai-indica/types";
import { kindLabels } from "@/lib/pai-indica/types";
import { categoryName, subcategoryName } from "@/lib/pai-indica/taxonomia";
import { ReviewBadge } from "./ReviewBadge";

/** Card da listagem /pai-indica, com data-attributes para o filtro no navegador. */
export function PaiIndicaCard({ post }: { post: PaiIndicaPost }) {
  const isComposed = (post.cover_image_url ?? "").startsWith("/images/covers/");
  return (
    <article
      data-kind={post.kind}
      data-product-category={post.product_category}
      data-product-subcategory={post.product_subcategory}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
    >
      <Link
        to={`/pai-indica/${post.slug}`}
        aria-label={`Ler: ${post.title}`}
        className={`relative block aspect-video overflow-hidden ${isComposed ? "" : "bg-white"}`}
      >
        {post.cover_image_url ? (
          <img
            src={post.cover_image_url}
            alt={post.cover_image_alt ?? post.title}
            loading="lazy"
            decoding="async"
            width={640}
            height={360}
            className={`h-full w-full ${isComposed ? "object-cover" : "object-contain p-3"}`}
          />
        ) : (
          <div className="h-full w-full bg-gradient-soft" />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <ReviewBadge score={post.product_score} />
          <span
            title={kindLabels[post.kind]?.help}
            className="rounded-md bg-background/90 px-1.5 py-1 text-[10px] font-semibold text-foreground shadow-sm"
          >
            {kindLabels[post.kind]?.label ?? "Pai Indica"}
          </span>
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
          {categoryName(post.product_category)} · {subcategoryName(post.product_subcategory)}
        </p>
        <h3 className="mt-1 font-display text-lg font-bold leading-snug">
          <Link
            to={`/pai-indica/${post.slug}`}
            className="transition-colors group-hover:text-primary"
          >
            {post.title}
          </Link>
        </h3>
        {(post.subtitle || post.excerpt) && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {post.subtitle || post.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}
