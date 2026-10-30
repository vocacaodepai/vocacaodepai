import { useEffect, useMemo, useRef, useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import {
  Bookmark,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Star,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fetchRelatedPosts, fetchReactions, registerView, toggleReaction } from "@/lib/db";
import type { BlogPost } from "@/lib/queries";
import { unwirePosts } from "@/lib/hub.functions";
import { addHeadingIds, extractHeadings, readingTime, type TipTapNode } from "@/lib/content";
import { findParaAEsposa, tiptapToHtml } from "@/lib/tiptap-html";
import { isProductCover } from "@/lib/cover";
import { formatDate, DEFAULT_AUTHOR } from "@/lib/site";
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
import { ContentNotice } from "@/components/blog/ContentNotice";
import { ParaAEsposa } from "@/components/blog/ParaAEsposa";
import { CategoryIcon } from "@/components/blog/category-icon";
import { ToolEmbedHost } from "@/components/blog/ToolEmbedHost";
import { useAuth } from "@/lib/auth-context";

const postRouteApi = getRouteApi("/_site/post/$slug");

const PRODUCT_KINDS = new Set(["review", "comparativo", "lista"]);

/**
 * Divide o corpo em duas partes para o AdSlot entrar depois do 2º H2
 * (doc 03 §6.2: um anúncio após o 2º H2 e outro no fim).
 */
function splitAtSecondHeading(doc: TipTapNode | null): [TipTapNode | null, TipTapNode | null] {
  if (!doc || !Array.isArray(doc.content)) return [doc, null];
  let seen = 0;
  let cut = -1;
  for (let i = 0; i < doc.content.length; i++) {
    const node = doc.content[i];
    if (node.type === "heading" && ((node.attrs?.level as number) ?? 2) === 2) {
      seen++;
      if (seen === 3) {
        cut = i;
        break;
      }
    }
  }
  if (cut <= 0) return [doc, null];
  return [
    { ...doc, content: doc.content.slice(0, cut) },
    { ...doc, content: doc.content.slice(cut) },
  ];
}

export default function PostPage() {
  // O loader da rota já traz o post completo (SSR): o Google e o leitor
  // recebem o texto no primeiro HTML, sem esqueleto de carregamento.
  const { full, related: relatedWire } = postRouteApi.useLoaderData();
  const post = full as unknown as BlogPost | null;
  const related = unwirePosts(relatedWire);

  if (!post) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-3xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">
          Este artigo não existe ou ainda não foi publicado.
        </p>
        <Link
          to="/blog"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground"
        >
          Ver todos os artigos
        </Link>
      </div>
    );
  }

  return <ArticleView key={post.id} post={post} initialRelated={related} />;
}

function ArticleView({ post, initialRelated }: { post: BlogPost; initialRelated: BlogPost[] }) {
  const { user, openLogin } = useAuth();
  const registered = useRef(false);
  const [related, setRelated] = useState<BlogPost[]>(initialRelated);
  const [reactions, setReactions] = useState({
    likes: post.like_count ?? 0,
    saves: 0,
    likedByMe: false,
    savedByMe: false,
  });
  const [toggling, setToggling] = useState<null | "like" | "save">(null);

  const headings = useMemo(() => extractHeadings(post.body), [post]);
  const isProduct = PRODUCT_KINDS.has(post.kind);
  // O corpo vira HTML estático (renderizado também no servidor). O editor
  // TipTap fica só no admin. Padrão A: callout (semáforo), table, taskList,
  // image e os demais nós são tratados em tiptap-html.ts.
  const [bodyHtmlA, bodyHtmlB] = useMemo(() => {
    const [a, b] = splitAtSecondHeading(addHeadingIds(post.body));
    return [tiptapToHtml(a), b ? tiptapToHtml(b) : ""];
  }, [post]);
  const paraAEsposa = useMemo(() => findParaAEsposa(post.body), [post]);
  const category = post.category ?? null;
  const parentCategory = (category as { parent?: { slug?: string; name?: string } | null } | null)
    ?.parent;

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
      li.setAttribute("data-checked", String(input.checked));
    };
    root.addEventListener("click", onCheck);
    return () => root.removeEventListener("click", onCheck);
  }, []);

  // `increment_post_views(p_post_id, p_user_key)`: 1 contagem por leitor por dia.
  useEffect(() => {
    if (!registered.current) {
      registered.current = true;
      registerView(post.id).catch(() => {});
    }
  }, [post.id]);

  useEffect(() => {
    fetchReactions(post.id)
      .then(setReactions)
      .catch(() => {});
    if (initialRelated.length === 0) {
      fetchRelatedPosts(post)
        .then(setRelated)
        .catch(() => {});
    }
  }, [post, initialRelated.length]);

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

  const minutes = post.reading_time ?? readingTime(post.body);
  const hasToc = headings.length >= 3;
  const authorName = post.author?.full_name || DEFAULT_AUTHOR;

  return (
    <div className="pb-8">
      <ReadingProgress />

      <div className="container py-6">
        <Breadcrumbs
          items={[
            { name: "Blog", path: "/blog" },
            ...(category ? [{ name: category.name, path: `/categoria/${category.slug}` }] : []),
            { name: post.title, path: `/post/${post.slug}` },
          ]}
        />
      </div>

      <article>
        {/* Cabeçalho */}
        <header className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {category && (
                <Link
                  to={`/categoria/${category.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary/70 px-4 py-1.5 text-xs font-bold text-secondary-foreground transition-colors hover:bg-secondary"
                >
                  <CategoryIcon name={category.icon} slug={category.slug} className="h-3.5 w-3.5" />
                  {category.name}
                </Link>
              )}
              {isProduct && typeof post.product_score === "number" && (
                // ReviewBadge (Fase 2 detalha): nota editorial do Pai Indica.
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground"
                  title="Nota editorial do Pai Indica (0 a 10)"
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  Nota {post.product_score.toFixed(1).replace(".", ",")}
                </span>
              )}
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/70">{post.subtitle}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{authorName}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={post.publish_at ?? undefined}>{formatDate(post.publish_at)}</time>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {minutes} min de leitura
              </span>
            </div>
          </div>
        </header>

        {/* Capa */}
        <div className="container mt-8">
          <div className="mx-auto max-w-4xl">
            {post.cover_image_url && (
              <>
                <img
                  src={post.cover_image_url}
                  alt={post.cover_image_alt ?? post.title}
                  decoding="async"
                  fetchPriority="high"
                  width={1280}
                  height={720}
                  className={`aspect-video w-full rounded-3xl shadow-elegant ${
                    isProductCover(post) ? "bg-white object-contain p-6" : "object-cover"
                  }`}
                />
                {post.cover_image_alt && (
                  <p className="mt-2 text-center text-[11px] italic leading-tight text-muted-foreground/60">
                    {post.cover_image_alt}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Corpo */}
        <div className="container mt-10">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_280px]">
            <div className="min-w-0">
              <ContentNotice
                category={category?.slug}
                parentCategory={parentCategory?.slug}
                kind={post.kind}
                className="mb-8"
              />

              <div
                id="post-body"
                className={isProduct ? "article-content review-article" : "article-content"}
                ref={articleRef}
              >
                <div className="tiptap" dangerouslySetInnerHTML={{ __html: bodyHtmlA }} />
                {bodyHtmlB && (
                  <>
                    <AdSlot format="rect" className="my-8" />
                    <div className="tiptap" dangerouslySetInnerHTML={{ __html: bodyHtmlB }} />
                  </>
                )}
              </div>

              {/* Ferramentas embutidas dentro do artigo */}
              <ToolEmbedHost scope="#post-body" />

              <AdSlot format="rect" className="mt-8" />

              {/* Quiz + ranking */}
              {post.quiz && post.quiz.length > 0 && (
                <section className="mt-10" aria-label="Teste o que você aprendeu">
                  <QuizWidget quiz={post.quiz} postId={post.id} />
                  <QuizRanking />
                </section>
              )}

              {/* Reações + compartilhar */}
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
                  Curtir · {reactions.likes}
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
                  {reactions.savedByMe ? "Salvo" : "Salvar"}
                </button>
                <div className="ml-auto">
                  <ShareButtons title={post.title} slug={post.slug} />
                </div>
              </div>

              {/* FAQ */}
              {post.faq && post.faq.length > 0 && (
                <section className="mt-10" aria-label="Perguntas frequentes">
                  <h2 className="font-display text-2xl font-bold">Perguntas frequentes</h2>
                  <Accordion type="single" collapsible className="mt-4">
                    {post.faq.map((item, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-left font-semibold">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="leading-relaxed text-muted-foreground">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              )}

              {/* Para a sua esposa: Vocação de Mãe (antes do "Continue lendo") */}
              {paraAEsposa && <ParaAEsposa slug={paraAEsposa.slug} title={paraAEsposa.title} />}

              {/* Comentários */}
              <Comments postId={post.id} />

              {/* Autor */}
              <section className="mt-12 flex flex-col items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-2xl font-bold text-secondary-foreground">
                  {authorName.charAt(0)}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Sobre o autor
                  </p>
                  <p className="mt-1 font-display text-lg font-bold">{authorName}</p>
                  {post.author?.bio && (
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                      {post.author.bio}
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Barra lateral */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                {hasToc && <TableOfContents headings={headings} />}
                <div className="rounded-2xl bg-gradient-soft p-5 shadow-soft">
                  <p className="mb-3 text-sm font-bold">Gostou deste artigo?</p>
                  <NewsletterSignup compact source="artigo" />
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* Sumário no celular */}
        {hasToc && (
          <div className="container mt-8 lg:hidden">
            <TableOfContents headings={headings} />
          </div>
        )}

        {/* Newsletter no celular */}
        <div className="container mt-8 lg:hidden">
          <div className="rounded-2xl bg-gradient-soft p-5 shadow-soft">
            <p className="mb-3 text-sm font-bold">Gostou deste artigo?</p>
            <NewsletterSignup compact source="artigo" />
          </div>
        </div>
      </article>

      {/* Continue lendo: 3 posts da mesma categoria */}
      {related.length > 0 && (
        <section className="container mt-14" aria-labelledby="related-title">
          <h2 id="related-title" className="font-display text-2xl font-bold md:text-3xl">
            Continue lendo
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 3).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Anterior / próximo */}
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
