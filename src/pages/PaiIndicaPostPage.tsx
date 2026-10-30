import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { CalendarDays, Clock } from "lucide-react";
import { Link } from "@/lib/router-compat";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { QuizWidget } from "@/components/blog/QuizWidget";
import { AdSlot } from "@/components/blog/AdSlot";
import { ToolEmbedHost } from "@/components/blog/ToolEmbedHost";
import { StickyBuyBar } from "@/components/blog/StickyBuyBar";
import { Comments } from "@/components/blog/Comments";
import { SaveButton } from "@/components/area-do-pai/SaveButton";
import { AffiliateButton } from "@/components/pai-indica/AffiliateButton";
import { AffiliateDisclosure } from "@/components/pai-indica/AffiliateDisclosure";
import { ComparisonTable } from "@/components/pai-indica/ComparisonTable";
import { CriteriaScores } from "@/components/pai-indica/CriteriaScores";
import { PaiIndicaCard } from "@/components/pai-indica/PaiIndicaCard";
import { PriceRange } from "@/components/pai-indica/PriceRange";
import { ProsCons } from "@/components/pai-indica/ProsCons";
import { ReviewBadge } from "@/components/pai-indica/ReviewBadge";
import { VerdictByProfile } from "@/components/pai-indica/VerdictByProfile";
import { addHeadingIds, readingTime, type TipTapNode } from "@/lib/content";
import { registerView } from "@/lib/db";
import { prepareBody, sliceDoc, splitPoints } from "@/lib/pai-indica/body";
import { faixasPorSlug, withAffiliateTag } from "@/lib/pai-indica/price";
import { categoryName, subcategoryName } from "@/lib/pai-indica/taxonomia";
import {
  kindLabels,
  roleLabels,
  type PaiIndicaPost,
  type PaiIndicaProduct,
} from "@/lib/pai-indica/types";
import { formatScore } from "@/lib/pai-indica/score";
import type { BlogPost } from "@/lib/queries";
import { tiptapToHtml } from "@/lib/tiptap-html";
import { DEFAULT_AUTHOR, formatDate } from "@/lib/site";

type Full = BlogPost & PaiIndicaPost;

function Chunk({ doc }: { doc: TipTapNode }) {
  const html = useMemo(() => tiptapToHtml(doc), [doc]);
  if (!html) return null;
  return <div className="tiptap" dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * Página de um Pai Indica (doc 04 §5.2): review individual, comparativo e lista. O body (Tiptap)
 * é renderizado em trechos e os blocos estruturados (veredito, critérios, tabela, "Qual comprar")
 * entram pelo React, a partir de `review`/`comparison`, em posições fixas.
 */
export default function PaiIndicaPostPage({
  post,
  products,
  related,
}: {
  post: Full;
  products: PaiIndicaProduct[];
  related: PaiIndicaPost[];
}) {
  const registered = useRef(false);
  useEffect(() => {
    if (!registered.current) {
      registered.current = true;
      registerView(post.id).catch(() => {});
    }
  }, [post.id]);

  const isReview = post.kind === "review";
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const hrefs = useMemo(
    () =>
      Object.fromEntries(products.map((p) => [p.slug, withAffiliateTag(p.affiliate_url ?? "")])),
    [products],
  );
  const faixas = useMemo(() => faixasPorSlug(products), [products]);

  const prepared = useMemo(
    () =>
      addHeadingIds(
        prepareBody(post.body, products, {
          kind: post.kind,
          dropFirstTable: !isReview && Boolean(post.comparison?.table),
        }),
      ) ?? { type: "doc", content: [] },
    [post, products, isReview],
  );
  const points = useMemo(() => splitPoints(prepared), [prepared]);

  const reviewProduct = isReview ? bySlug.get(post.review?.product_slug ?? "") : undefined;
  const winner = !isReview ? bySlug.get(post.comparison?.winner_slug ?? "") : undefined;
  const minutes = post.reading_time ?? readingTime(post.body);
  const authorName = post.author?.full_name || DEFAULT_AUTHOR;

  // Trechos do body + blocos React entre eles, na ordem da seção 5.2 do doc 04.
  const blocks: ReactNode[] = [];
  if (isReview && post.review) {
    const r = post.review;
    const [intro, middle, tail] = sliceDoc(prepared, [points["afterIntro"]!, points["prosCons"]!]);
    blocks.push(<Chunk key="intro" doc={intro!} />);
    blocks.push(
      <section
        key="veredito"
        aria-labelledby="veredito-title"
        className="not-prose my-8 rounded-2xl border-2 border-accent/50 bg-accent/5 p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="veredito-title" className="font-display text-2xl font-bold">
            Veredito do Pai Indica
          </h2>
          <ReviewBadge score={r.score} size="md" showLabel />
        </div>
        <p className="mt-3 text-base leading-relaxed">{r.verdict}</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-success/5 p-3 text-sm">
            <dt className="font-bold text-success">Para quem é</dt>
            <dd className="mt-1 text-foreground/90">{r.ideal_for}</dd>
          </div>
          <div className="rounded-xl bg-danger/5 p-3 text-sm">
            <dt className="font-bold text-danger">Para quem não é</dt>
            <dd className="mt-1 text-foreground/90">{r.not_ideal_for}</dd>
          </div>
        </dl>
        {reviewProduct && <PriceRange product={reviewProduct} className="mt-4" />}
        {hrefs[r.product_slug] && (
          <AffiliateButton
            href={hrefs[r.product_slug]!}
            productSlug={r.product_slug}
            size="lg"
            className="mt-4 w-full sm:w-auto"
          />
        )}
        {reviewProduct && (
          <p className="mt-3 text-xs text-muted-foreground">
            Ficha completa e review da loja em{" "}
            <Link
              to={`/loja/${reviewProduct.slug}`}
              className="font-semibold text-primary hover:underline"
            >
              {reviewProduct.name}
            </Link>
            .
          </p>
        )}
      </section>,
    );
    blocks.push(
      <div key="criterios" className="not-prose my-8">
        <CriteriaScores criteria={r.criteria} total={r.score} />
      </div>,
    );
    if (middle) blocks.push(<Chunk key="middle" doc={middle} />);
    blocks.push(<ProsCons key="proscons" pros={r.pros} cons={r.cons} className="not-prose my-8" />);
    if (tail) blocks.push(<Chunk key="tail" doc={tail} />);
  } else if (post.comparison) {
    const c = post.comparison;
    const cuts = [points["afterIntro"]!, points["beforeQualComprar"], points["afterComoAvaliamos"]]
      .filter((n): n is number => typeof n === "number")
      .sort((a, b) => a - b);
    const parts = sliceDoc(prepared, cuts);
    const content = prepared.content ?? [];
    // Mapa índice-de-corte → bloco React que entra ANTES daquele trecho.
    const before = new Map<number, ReactNode>();
    if (c.table && points["afterIntro"]! < content.length) {
      before.set(
        points["afterIntro"]!,
        <div key="tabela" className="not-prose my-8">
          <ComparisonTable data={c} faixas={faixas} />
        </div>,
      );
    }
    if (typeof points["beforeQualComprar"] === "number") {
      before.set(
        points["beforeQualComprar"],
        <div key="qual" className="not-prose my-8">
          <VerdictByProfile data={c} hrefs={hrefs} />
        </div>,
      );
    }
    if (typeof points["afterComoAvaliamos"] === "number") {
      before.set(
        points["afterComoAvaliamos"],
        <div
          key="criterios"
          className="not-prose my-8 rounded-2xl border border-border bg-card p-5 shadow-soft"
        >
          <h3 className="font-display text-xl font-bold">Os 5 critérios e os pesos</h3>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {c.criteria.map((k) => (
              <li
                key={k.name}
                className="flex justify-between gap-3 rounded-lg bg-background px-3 py-2"
              >
                <span>{k.name}</span>
                <span className="font-mono font-semibold">peso {k.weight}</span>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 text-sm">
            {c.products.map((p) => (
              <li key={p.product_slug} className="flex flex-wrap justify-between gap-2">
                <span>
                  <strong>{p.name}</strong>
                  {roleLabels[p.role] ? ` · ${roleLabels[p.role]}` : ""}
                </span>
                <span className="font-mono font-semibold">{formatScore(p.score)}</span>
              </li>
            ))}
          </ul>
        </div>,
      );
    }
    let offset = 0;
    parts.forEach((part, i) => {
      if (before.has(offset)) blocks.push(before.get(offset));
      blocks.push(<Chunk key={`part-${i}`} doc={part} />);
      offset += part.content?.length ?? 0;
    });
    // Corte no fim do body (ex.: "Como avaliamos" é a última seção): bloco entra depois do último trecho.
    if (before.has(offset)) blocks.push(before.get(offset));
  } else {
    blocks.push(<Chunk key="all" doc={prepared} />);
  }

  const stickyModelo =
    isReview && reviewProduct
      ? {
          src: reviewProduct.image_url ?? "",
          name: reviewProduct.name,
          href: hrefs[reviewProduct.slug] ?? reviewProduct.affiliate_url,
          slug: reviewProduct.slug,
        }
      : null;

  return (
    <div className="pb-24">
      <ReadingProgress />
      <div className="container py-6">
        <Breadcrumbs
          items={[
            { name: "Pai Indica", path: "/pai-indica" },
            { name: post.title, path: `/pai-indica/${post.slug}` },
          ]}
        />
      </div>

      <article>
        <header className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold">
              <Link
                to={`/pai-indica#cat=${post.product_category}`}
                className="rounded-full bg-secondary/70 px-3 py-1.5 text-secondary-foreground hover:bg-secondary"
              >
                {categoryName(post.product_category)}
              </Link>
              <span className="rounded-full bg-muted px-3 py-1.5 text-muted-foreground">
                {subcategoryName(post.product_subcategory)}
              </span>
              <span className="rounded-full bg-accent/15 px-3 py-1.5 text-accent">
                {kindLabels[post.kind]?.label}
              </span>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
              {post.title}
            </h1>
            {post.subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-foreground/70">{post.subtitle}</p>
            )}
            <div className="mt-5 flex justify-center">
              <ReviewBadge score={Number(post.product_score)} size="lg" showLabel />
            </div>
            {!isReview && winner && (
              <p className="mt-2 text-xs text-muted-foreground">
                Nota do vencedor: <strong className="text-foreground">{winner.name}</strong>
              </p>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">{authorName}</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <time dateTime={post.publish_at ?? undefined}>{formatDate(post.publish_at)}</time>
              </span>
              {post.updated_at &&
                post.updated_at.slice(0, 10) !== post.publish_at?.slice(0, 10) && (
                  <span>atualizado em {formatDate(post.updated_at)}</span>
                )}
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {minutes} min de leitura
              </span>
            </div>
          </div>
        </header>

        {post.cover_image_url && (
          <div className="container mt-8">
            <div className="mx-auto max-w-4xl">
              <img
                src={post.cover_image_url}
                alt={post.cover_image_alt ?? post.title}
                decoding="async"
                fetchPriority="high"
                width={1280}
                height={720}
                className="aspect-video w-full rounded-3xl bg-background object-contain shadow-elegant"
              />
            </div>
          </div>
        )}

        <div className="container mt-10">
          <div className="mx-auto max-w-3xl">
            <AffiliateDisclosure className="mb-8" />
            <div id="post-body" className="article-content review-article">
              {blocks}
            </div>
            <ToolEmbedHost scope="#post-body" />

            <AdSlot format="rect" className="mt-8" />

            {post.quiz && post.quiz.length > 0 && (
              <section className="mt-10" aria-label="Teste o que você aprendeu">
                <QuizWidget quiz={post.quiz} postId={post.id} />
              </section>
            )}

            {Array.isArray(post.faq) && post.faq.length > 0 && (
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

            <div className="mt-10 flex flex-wrap items-center gap-3 border-y border-border py-5">
              {/* Salvar na Área do Pai (saved_items, item_type 'post') */}
              <SaveButton itemType="post" itemId={post.id} className="px-5" />
              <div className="ml-auto">
                <ShareButtons
                  title={post.title}
                  slug={post.slug}
                  path={`/pai-indica/${post.slug}`}
                />
              </div>
            </div>

            <Comments postId={post.id} />
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="container mt-14" aria-labelledby="related-title">
          <h2 id="related-title" className="font-display text-2xl font-bold md:text-3xl">
            Continue no Pai Indica
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.slice(0, 6).map((p) => (
              <PaiIndicaCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {stickyModelo && <StickyBuyBar modelo={stickyModelo} />}
    </div>
  );
}
