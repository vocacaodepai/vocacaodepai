import { PostCard } from "@/components/blog/PostCard";
import { Link } from "@/lib/router-compat";
import type { PostWithRelations } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

// Seção 2 da home: até 7 posts (1 por categoria primeiro), o primeiro em destaque largo.
export function LatestArticles({ posts }: { posts: PostWithRelations[] }) {
  const [first, ...rest] = posts;
  return (
    <section aria-labelledby="latest-title">
      <SectionHeading
        id="latest-title"
        title="Últimos artigos"
        subtitle="Tudo o que um pai precisa saber, fase por fase e assunto por assunto, escrito para homem adulto."
        linkTo="/blog"
        linkLabel="Ver todos"
      />
      {first ? (
        <>
          <PostCard post={first} featured />
          {rest.length > 0 && (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <p className="font-display text-lg font-bold">Ainda não há artigos publicados.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            O blog está sendo abastecido. Assine a newsletter no fim da página e avisamos quando o
            primeiro guia sair.
          </p>
        </div>
      )}
      <Link
        to="/blog"
        className="mt-6 inline-flex items-center text-sm font-semibold text-primary hover:underline sm:hidden"
      >
        Ver todos os artigos →
      </Link>
    </section>
  );
}
