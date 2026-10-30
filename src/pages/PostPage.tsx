import { isProductCover } from "@/lib/cover";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "@/lib/router-compat";
import { ToolEmbedHost } from "@/components/blog/ToolEmbedHost";
import { Bookmark, CalendarDays, ChevronLeft, ChevronRight, Clock, Heart } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  fetchPostBySlug,
  fetchRelatedPosts,
  fetchReactions,
  registerView,
  toggleReaction,
} from "@/lib/db";
import type { PostWithRelations } from "@/lib/types";
import { addHeadingIds, extractHeadings, readingTime } from "@/lib/content";
import { tiptapToHtml } from "@/lib/tiptap-html";
import { enhanceReviewBody, reviewModelos } from "@/lib/review-body";
import { StickyBuyBar } from "@/components/blog/StickyBuyBar";
import { formatDate } from "@/lib/site";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { QuizWidget } from "@/components/blog/QuizWidget";
import { QuizRanking } from "@/components/blog/QuizRanking";
import { Comments } from "@/components/blog/Comments";
import { PostCard } from "@/components/blog/PostCard";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { AdSlot } from "@/components/blog/AdSlot";
import { useAuth } from "@/lib/auth-context";
import { getRouteApi } from "@tanstack/react-router";

const postRouteApi = getRouteApi("/_site/post/$slug");

export default function PostPage() {
  const { slug = "" } = useParams();
  // The route loader already fetched the full post server-side (so
  // Googlebot's first crawl sees real content, not a loading skeleton).
  // Use it as the initial render and only fall back to a client fetch if
  // it's somehow missing.
  const loaderFull = postRouteApi.useLoaderData({
    select: (d) => (d?.full as unknown as PostWithRelations | null) ?? null,
  });

  const [post, setPost] = useState<PostWithRelations | null>(loaderFull);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(!loaderFull);

  useEffect(() => {
    if (loaderFull) {
      setPost(loaderFull);
      setNotFound(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    fetchPostBySlug(slug)
      .then((p) => {
        if (!p) setNotFound(true);
        else setPost(p);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, loaderFull]);

  if (loading) {
    return (
      <div className="container py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
          <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">
          Este artigo não existe ou ainda não foi publicado.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
        >
          Voltar para o início
        </Link>
      </div>
    );
  }

  return <ArticleView key={post.id} post={post} />;
}

function ArticleView({ post }: { post: PostWithRelations }) {
  const { user, openLogin } = useAuth();
  const registered = useRef(false);
  const [related, setRelated] = useState<PostWithRelations[]>([]);
  const [reactions, setReactions] = useState({
    likes: 0,
    saves: 0,
    likedByMe: false,
    savedByMe: false,
  });
  const [toggling, setToggling] = useState<null | "like" | "save">(null);

  const headings = useMemo(() => extractHeadings(post.body), [post]);
  // O corpo vira HTML estático (renderizado também no servidor, então o
  // Google e o leitor recebem o texto no primeiro HTML). O editor TipTap
  // fica só no admin.
  const isReview = post.category?.slug === "review-de-mae";
  const bodyHtml = useMemo(
    () => tiptapToHtml(addHeadingIds(isReview ? enhanceReviewBody(post.body) : post.body)),
    [post, isReview],
  );
  const singleReviewProduct = useMemo(() => {
    const modelos = isReview ? reviewModelos(post.body) : [];
    return modelos.length === 1 ? modelos[0]! : null;
  }, [post, isReview]);

  // Checklist clicável: permite marcar/desmarcar os itens de tarefa no modo leitura.
  const articleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const onCheck = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const li = target.closest("li");
      if (!li) return;
      const input = li.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
      if (!input) return;
      e.preventDefault();
      input.disabled = false;
      input.checked = !input.checked;
    };
    root.addEventListener("click", onCheck);
    return () => root.removeEventListener("click", onCheck);
  }, []);

  useEffect(() => {
    if (!registered.current) {
      registered.current = true;
      registerView(post.id);
    }
  }, [post.id]);

  useEffect(() => {
    fetchReactions(post.id)
      .then(setReactions)
      .catch(() => {});
    fetchRelatedPosts(post)
      .then(setRelated)
      .catch(() => {});
  }, [post]);

  const handleToggle = async (type: "like" | "save") => {
    if (toggling) return;
    if (!user) {
      openLogin();
      return;
    }
    setToggling(type);
    try {
      const res = await toggleReaction(post.id, type);
      setReactions((prev) => ({
        ...prev,
        likes: type === "like" ? res.count : prev.likes,
        saves: type === "save" ? res.count : prev.saves,
        likedByMe: type === "like" ? res.active : prev.likedByMe,
        savedByMe: type === "save" ? res.active : prev.savedByMe,
      }));
    } catch {
      // sem ação
    } finally {
      setToggling(null);
    }
  };

  const minutes = readingTime(post.body);
  const hasToc = headings.length >= 3;

  return (
    <div className="pb-8">
      <ReadingProgress />

      <div className="container py-6">
        <Breadcrumbs
          items={[
            ...(post.category
              ? [{ name: post.category.name, path: `/categoria/${post.category.slug}` }]
              : []),
            { name: post.title, path: `/post/${post.slug}` },
          ]}
        />
      </div>

      <article>
        {/* Header */}
        <header className="container">
          <div className="mx-auto max-w-3xl text-center">
            {post.category && (
              <Link
                to={`/categoria/${post.category.slug}`}
                className="inline-block rounded-full bg-secondary/70 px-4 py-1.5 text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary"
              >
                {post.category.name}
              </Link>
            )}
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/70">{post.subtitle}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {post.author && (
                <span className="font-bold text-foreground">{post.author.full_name}</span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={post.publish_at ?? undefined}>{formatDate(post.publish_at)}</time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {minutes} {"min de leitura"}
              </span>
            </div>
          </div>
        </header>

        {/* Cover */}
        <div className="container mt-8">
          <div className="mx-auto max-w-4xl">
            {post.cover_image_url && (
              <>
                <img
                  src={post.cover_image_url}
                  alt={post.cover_image_alt ?? post.title}
                  crossOrigin="anonymous"
                  decoding="async"
                  fetchPriority="high"
                  width={1280}
                  height={720}
                  className={`aspect-video w-full rounded-3xl shadow-elegant ${
                    isProductCover(post) ? "bg-white object-contain p-6" : "object-cover"
                  }`}
                />
                <p className="mt-2 text-center text-[11px] italic leading-tight text-muted-foreground/60">
                  {`${post.cover_image_alt ?? post.title}`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="container mt-10">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_280px]">
            <div className="min-w-0">
              <AdSlot format="leaderboard" className="mb-8" />

              <div
                id="post-body"
                className={isReview ? "article-content review-article" : "article-content"}
                ref={articleRef}
              >
                <div className="tiptap" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              </div>

              {/* Ferramentas embutidas dentro do artigo */}
              <ToolEmbedHost scope="#post-body" />
              {singleReviewProduct && <StickyBuyBar modelo={singleReviewProduct} />}

              {/* Quiz + ranking: o convite do quiz vem primeiro; o ranking
                  aparece abaixo, depois que o pai vê o desafio. */}
              {post.quiz && post.quiz.length > 0 && (
                <section className="mt-10" aria-label={"Teste o que você aprendeu"}>
                  <QuizWidget quiz={post.quiz ?? []} postId={post.id} />
                  <QuizRanking />
                </section>
              )}

              {/* Reactions + share */}
              <div className="mt-10 flex flex-wrap items-center gap-3 border-y border-border py-5">
                <button
                  onClick={() => handleToggle("like")}
                  disabled={!!toggling}
                  aria-pressed={reactions.likedByMe}
                  className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold transition-all disabled:opacity-60 ${
                    reactions.likedByMe
                      ? "border-primary bg-primary text-primary-foreground shadow-soft"
                      : "border-border bg-card text-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${reactions.likedByMe ? "fill-current" : ""}`} />
                  {"Curtir"} · {reactions.likes}
                </button>
                <button
                  onClick={() => handleToggle("save")}
                  disabled={!!toggling}
                  aria-pressed={reactions.savedByMe}
                  className={`inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold transition-all disabled:opacity-60 ${
                    reactions.savedByMe
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-border bg-card text-foreground hover:border-secondary hover:text-secondary-foreground"
                  }`}
                >
                  <Bookmark className={`h-4 w-4 ${reactions.savedByMe ? "fill-current" : ""}`} />
                  {reactions.savedByMe ? "Salvo" : "Salvar"} · {reactions.saves}
                </button>
                <div className="ml-auto">
                  <ShareButtons title={post.title} slug={post.slug} />
                </div>
              </div>

              {/* FAQ */}
              {post.faq && post.faq.length > 0 && (
                <section className="mt-10" aria-label={"Perguntas frequentes"}>
                  <h2 className="font-display text-2xl font-bold">{"Perguntas frequentes"}</h2>
                  <Accordion type="single" collapsible className="mt-4">
                    {post.faq.map((item, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left font-semibold">
                          {item.question ?? (item as unknown as { q?: string }).q}
                        </AccordionTrigger>
                        <AccordionContent className="leading-relaxed text-muted-foreground">
                          {item.answer ?? (item as unknown as { a?: string }).a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              )}

              {/* Comments */}
              <Comments postId={post.id} />

              {/* Author bio */}
              {post.author && (
                <section className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-2xl font-bold text-secondary-foreground">
                    {post.author.full_name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">
                      {"Sobre a autora"}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold">{post.author.full_name}</p>
                    {post.author.bio && (
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                        {post.author.bio}
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {hasToc && <TableOfContents headings={headings} />}
                <div className="rounded-2xl bg-gradient-soft p-5 shadow-soft">
                  <p className="mb-3 text-sm font-bold">{"Gostou deste artigo?"}</p>
                  <NewsletterSignup compact source="artigo" />
                </div>
                <AdSlot format="skyscraper" />
              </div>
            </aside>
          </div>
        </div>

        {/* Mobile TOC */}
        {hasToc && (
          <div className="container mt-8 lg:hidden">
            <TableOfContents headings={headings} />
          </div>
        )}

        {/* Mobile newsletter */}
        <div className="container mt-8 lg:hidden">
          <div className="rounded-2xl bg-gradient-soft p-5 shadow-soft">
            <p className="mb-3 text-sm font-bold">{"Gostou deste artigo?"}</p>
            <NewsletterSignup compact source="artigo" />
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="container mt-14" aria-labelledby="related-title">
          <h2 id="related-title" className="font-display text-2xl font-bold md:text-3xl">
            {"Você também pode gostar"}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Next / prev */}
      {related.length >= 2 && (
        <div className="container mt-12 flex flex-col justify-between gap-3 sm:flex-row">
          <Link
            to={`/post/${related[0].slug}`}
            className="group inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="line-clamp-1">{related[0].title}</span>
          </Link>
          <Link
            to={`/post/${related[1].slug}`}
            className="group inline-flex items-center justify-end gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <span className="line-clamp-1">{related[1].title}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
