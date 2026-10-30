import { ArrowRight, BookOpen, Clock, UserRound } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatDate } from "@/lib/site";
import { readingTime } from "@/lib/content";
import type { PostWithRelations } from "@/lib/types";

// Seção 1 da home (doc 03 §5.2): H1 fixo, dois botões e o artigo mais recente
// em destaque à direita. Com banco vazio, o cartão vira um convite.
export function HomeHero({ latest }: { latest: PostWithRelations | undefined }) {
  return (
    <section className="relative overflow-hidden bg-gradient-hero" aria-labelledby="hero-title">
      <div className="relative container grid gap-10 py-14 md:grid-cols-[1.2fr_1fr] md:items-center md:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground backdrop-blur">
            <UserRound className="h-3.5 w-3.5" />
            Para o pai e o homem de família
          </span>
          <h1
            id="hero-title"
            className="mt-5 font-display text-4xl font-bold leading-tight text-foreground drop-shadow-sm md:text-5xl lg:text-6xl"
          >
            Ser pai é vocação. Ser homem é construção.
          </h1>
          <p className="mt-4 max-w-xl text-base text-foreground/85 md:text-lg">
            Guias práticos sobre paternidade, casamento, dinheiro, saúde e tudo que forma um homem
            de família.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/blog"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              <BookOpen className="h-4 w-4" />
              Ler o blog
            </Link>
            <Link
              to="/area-do-pai"
              className="inline-flex h-12 items-center gap-2 rounded-xl border-2 border-primary bg-transparent px-6 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
            >
              Entrar na Área do Pai
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {latest ? (
          <article className="group overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
            <Link
              to={`/post/${latest.slug}`}
              aria-label={`Ler o artigo mais recente: ${latest.title}`}
              className="relative block aspect-[16/10] overflow-hidden"
            >
              {latest.cover_image_url ? (
                <img
                  src={latest.cover_image_url}
                  alt={latest.cover_image_alt ?? latest.title}
                  width={640}
                  height={400}
                  decoding="async"
                  fetchPriority="high"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-gradient-soft" />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur">
                Mais recente
              </span>
            </Link>
            <div className="p-5 md:p-6">
              {latest.category && (
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  {latest.category.name}
                </p>
              )}
              <h2 className="mt-2 font-display text-xl font-bold leading-snug md:text-2xl">
                <Link to={`/post/${latest.slug}`} className="transition-colors hover:text-primary">
                  {latest.title}
                </Link>
              </h2>
              {latest.subtitle && (
                <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{latest.subtitle}</p>
              )}
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <time dateTime={latest.publish_at ?? undefined}>
                  {formatDate(latest.publish_at)}
                </time>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {latest.reading_minutes ?? readingTime(latest.body)} min
                </span>
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-3xl border border-dashed border-primary/40 bg-card/70 p-8 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Em breve</p>
            <p className="mt-2 font-display text-2xl font-bold">
              Os primeiros artigos estão a caminho.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Enquanto isso, conheça o que o Vocação de Pai promete e deixe seu e-mail para receber
              o primeiro guia.
            </p>
            <Link
              to="/sobre"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              Conhecer o Vocação de Pai
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
