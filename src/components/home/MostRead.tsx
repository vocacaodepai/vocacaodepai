import { Flame } from "lucide-react";
import { Link } from "@/lib/router-compat";
import type { PostWithRelations } from "@/lib/types";

// Seção 9 da home: lista compacta dos mais lidos (view_count).
export function MostRead({ posts }: { posts: PostWithRelations[] }) {
  return (
    <section aria-labelledby="popular-title">
      <div className="mb-6 flex items-center gap-2">
        <Flame className="h-5 w-5 text-primary" />
        <h2 id="popular-title" className="font-display text-2xl font-bold md:text-3xl">
          Mais lidos
        </h2>
      </div>
      {posts.length > 0 ? (
        <ol className="grid gap-3 md:grid-cols-2">
          {posts.map((post, index) => (
            <li key={post.id}>
              <Link
                to={`/post/${post.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant"
              >
                <span className="font-display text-3xl font-bold leading-none text-primary/40 transition-colors group-hover:text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  {post.category && (
                    <span className="block text-xs font-bold uppercase tracking-wider text-primary">
                      {post.category.name}
                    </span>
                  )}
                  <span className="mt-1 block font-display text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {post.title}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          Os mais lidos aparecem aqui assim que os primeiros artigos ganharem leitores.
        </p>
      )}
    </section>
  );
}
