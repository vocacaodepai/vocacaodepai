import { ArrowRight, BadgeCheck, Star } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { isProductCover } from "@/lib/cover";
import type { PaiIndicaPost } from "@/lib/home.functions";
import { SectionHeading } from "./SectionHeading";

const KIND_LABEL: Record<string, string> = {
  review: "Review individual",
  comparativo: "Comparativo",
  lista: "Lista",
};

function formatScore(score: number | null | undefined) {
  if (score == null || Number.isNaN(Number(score))) return null;
  return Number(score).toFixed(1).replace(".", ",");
}

// Seção 3 da home: reviews, comparativos e listas (kind review/comparativo/lista).
// Na Fase 1 costuma vir vazio: mostra o cartão-convite do plano (doc 03 §5.2).
export function PaiIndicaTeaser({ posts }: { posts: PaiIndicaPost[] }) {
  return (
    <section aria-labelledby="pai-indica-title">
      <SectionHeading
        id="pai-indica-title"
        eyebrow="Pai Indica"
        title="Pai Indica em destaque"
        subtitle="Reviews honestos de produto para a casa, o carro, a churrasqueira e o filho: nota de 0 a 10, prós, contras e para quem é."
        linkTo="/pai-indica"
        linkLabel="Ver o Pai Indica"
      />
      {posts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => {
            const score = formatScore(post.product_score);
            return (
              <article
                key={post.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
              >
                <Link
                  to={`/post/${post.slug}`}
                  aria-label={`Ler: ${post.title}`}
                  className={`relative block aspect-video overflow-hidden ${
                    isProductCover(post) ? "bg-white" : ""
                  }`}
                >
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt={post.cover_image_alt ?? post.title}
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
                  {score && (
                    <span
                      className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-sm"
                      title="Nota editorial do Vocação de Pai, de 0 a 10"
                    >
                      <Star className="h-3 w-3" />
                      {score}
                    </span>
                  )}
                </Link>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    {KIND_LABEL[post.kind] ?? "Pai Indica"}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug">
                    <Link
                      to={`/post/${post.slug}`}
                      className="transition-colors hover:text-primary"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  {post.subtitle && (
                    <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{post.subtitle}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-6 rounded-3xl border border-secondary bg-secondary/25 p-6 shadow-soft md:grid-cols-[auto_1fr_auto] md:items-center md:p-8">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <BadgeCheck className="h-7 w-7" />
          </span>
          <div>
            <p className="font-display text-xl font-bold md:text-2xl">
              O Pai Indica está chegando: reviews honestas, comparativos e listas do que vale o seu
              dinheiro.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Nota de 0 a 10 com cinco critérios, defeito no mesmo tamanho do elogio e faixa de
              preço pesquisada em mais de uma loja. Sem teste físico inventado e sem preço exato.
            </p>
          </div>
          <Link
            to="/pai-indica"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Conhecer o Pai Indica
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}
