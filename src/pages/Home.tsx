import { getRouteApi } from "@tanstack/react-router";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { PostCard } from "@/components/blog/PostCard";
import { CategoryCard } from "@/components/blog/CategoryCard";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { AdSlot } from "@/components/blog/AdSlot";
import { unwirePosts } from "@/lib/hub.functions";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

const homeRouteApi = getRouteApi("/_site/");

// Home simples da Fase 1 (etapa 2): hero + últimos artigos + categorias + newsletter.
// As etapas 4-6 do doc 03 refazem a home com as seções oficiais.
// TODO Fase 3 (Loja do Pai): vitrine de produtos em destaque.
// TODO Fase 4 (Caixa de Ferramentas): teaser de ferramentas.
// TODO Fase 7 (Irmandade): histórias em destaque.
export default function Home() {
  // Tudo já vem do loader da rota (SSR): o HTML chega com os artigos, sem
  // esqueleto esperando o navegador buscar no Supabase.
  const data = homeRouteApi.useLoaderData();
  const latest = unwirePosts(data.latest);
  const popular = unwirePosts(data.popular);
  const { categories } = data;

  return (
    <div>
      {/* Hero — TODO Fase 1 (etapa 6): imagem/ilustração de fundo. */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="relative container py-14 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Blog do pai
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight text-foreground drop-shadow-sm md:text-5xl">
              {SITE_TAGLINE}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-foreground/85 md:text-lg">
              {SITE_DESCRIPTION}
            </p>
          </div>
        </div>
      </section>

      <AdSlot format="leaderboard" className="container mt-8" />

      <div className="container mt-12 space-y-16">
        {/* Featured + latest */}
        <section aria-labelledby="latest-title">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="latest-title" className="font-display text-2xl font-bold md:text-3xl">
              Artigos mais recentes
            </h2>
            <Link
              to="/blog"
              className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
            >
              Ver todos os artigos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {latest.slice(0, 4).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.slice(4, 7).map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>

        {/* Most popular */}
        {popular.length > 0 && (
          <section aria-labelledby="popular-title">
            <div className="mb-6 flex items-center gap-2">
              <Flame className="h-5 w-5 text-primary" />
              <h2 id="popular-title" className="font-display text-2xl font-bold md:text-3xl">
                Mais populares
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section aria-labelledby="categories-title">
          <div className="mb-6">
            <h2 id="categories-title" className="font-display text-2xl font-bold md:text-3xl">
              Explore por categoria
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Conteúdo organizado para cada fase da vida do pai
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.slice(0, 9).map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>

        {/* Newsletter */}
        <section className="rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-elegant md:p-12">
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            Receba conteúdo por e-mail
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm opacity-90">
            Uma newsletter direta, sem spam: guias, dicas e novidades do blog.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <NewsletterSignup source="home" />
          </div>
        </section>
      </div>
    </div>
  );
}
