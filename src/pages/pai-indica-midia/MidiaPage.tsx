import { useMemo } from "react";
import { CalendarDays, ExternalLink } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { AffiliateButton } from "@/components/pai-indica/AffiliateButton";
import { AffiliateDisclosure } from "@/components/pai-indica/AffiliateDisclosure";
import { ContentDots } from "@/components/pai-indica-midia/ContentDots";
import { MediaBadge } from "@/components/pai-indica-midia/MediaBadge";
import { MediaCard } from "@/components/pai-indica-midia/MediaCard";
import { PosterFrame } from "@/components/pai-indica-midia/PosterFrame";
import { TalkWithKids } from "@/components/pai-indica-midia/TalkWithKids";
import { addHeadingIds } from "@/lib/content";
import {
  classindConsultaUrl,
  mediaTypeLabels,
  moralOf,
  formatMoral,
} from "@/lib/pai-indica-midia/taxonomia";
import type { MediaCardRow, MediaReview } from "@/lib/pai-indica-midia/types";
import { tiptapToHtml } from "@/lib/tiptap-html";
import { formatDate } from "@/lib/site";

/**
 * Ficha do Pai Indica Mídia (doc 14 §5.2): cabeçalho com pôster (ou cartão tipográfico) e os dois
 * selos, "O que o pai precisa saber", bolinhas de conteúdo, análise (body Tiptap), "Para conversar
 * com seu filho", botão "Comprar agora na Amazon" (só livro/jogo com affiliate_url) + aviso, e
 * "Veja também".
 */
export default function MidiaPage({
  media,
  related,
}: {
  media: MediaReview;
  related: MediaCardRow[];
}) {
  const html = useMemo(
    () => tiptapToHtml(addHeadingIds(media.body) ?? media.body ?? undefined),
    [media.body],
  );
  const typeLabel = mediaTypeLabels[media.type].label;
  const consulta = classindConsultaUrl(media.type);
  const showBuy = (media.type === "livro" || media.type === "jogo") && Boolean(media.affiliate_url);
  const moral = moralOf(media.score_moral);
  const path = `/pai-indica/midia/${media.slug}`;

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Pai Indica", path: "/pai-indica" },
          { name: "Mídia", path: "/pai-indica/midia" },
          { name: media.title, path },
        ]}
      />

      <header className="mt-6 grid gap-6 md:grid-cols-[200px_1fr]">
        <PosterFrame
          title={media.title}
          type={media.type}
          year={media.year}
          posterUrl={media.poster_url}
          posterCredit={media.poster_credit}
          posterLicense={media.poster_license}
          showCredit
          className="w-48 md:w-full"
        />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            Pai Indica Mídia · {typeLabel}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight md:text-4xl">
            {media.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {media.original_title && media.original_title !== media.title
              ? `${media.original_title} · `
              : ""}
            {media.year ?? ""}
            {media.platforms.length ? ` · ${media.platforms.join(", ")}` : ""}
          </p>
          <p className="mt-3 text-base leading-relaxed">{media.summary}</p>
          <MediaBadge
            type={media.type}
            classind={media.classind}
            classindDescriptors={media.classind_descriptors}
            paiAgeMin={media.pai_age_min}
            scoreQuality={media.score_quality}
            scoreMoral={media.score_moral}
            size="lg"
            className="mt-4"
          />
          {media.pai_age_note && (
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {media.pai_age_note}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {media.publish_at && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                {formatDate(media.publish_at)}
              </span>
            )}
            <ShareButtons title={media.title} slug={media.slug} path={path} compact />
          </div>
        </div>
      </header>

      {showBuy && (
        <div className="mt-6 flex flex-col items-start gap-3">
          <AffiliateButton href={media.affiliate_url!} productSlug={`midia:${media.slug}`} />
          <AffiliateDisclosure />
        </div>
      )}

      <AdSlot format="leaderboard" className="mt-6" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          {media.what_parents_need_to_know && (
            <section
              aria-labelledby="pai-saber-title"
              className="rounded-2xl border-2 border-accent/50 bg-accent/5 p-5 sm:p-6"
            >
              <h2 id="pai-saber-title" className="font-display text-2xl font-bold">
                O que o pai precisa saber
              </h2>
              <p className="mt-3 whitespace-pre-line text-base leading-relaxed">
                {media.what_parents_need_to_know}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Nota moral <strong className="font-mono">{formatMoral(media.score_moral)}</strong> ·{" "}
                {moral.label}: {moral.text}
              </p>
            </section>
          )}

          <section aria-labelledby="conteudo-title">
            <h2 id="conteudo-title" className="font-display text-2xl font-bold">
              O que aparece na tela, em bolinhas
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              De 0 a 5, modelo usado pelos melhores guias de pais do mundo. Esquerda: o que pede
              cuidado. Direita: o que edifica.
            </p>
            <ContentDots scores={media.content_scores} className="mt-4" />
          </section>

          {html && (
            <section aria-label="Análise" className="article-content review-article">
              <div className="tiptap" dangerouslySetInnerHTML={{ __html: html }} />
            </section>
          )}

          <TalkWithKids questions={media.talk_with_your_kids} />

          {showBuy && (
            <div className="flex flex-col items-start gap-3">
              <AffiliateButton
                href={media.affiliate_url!}
                productSlug={`midia:${media.slug}`}
                size="lg"
              />
              <AffiliateDisclosure />
            </div>
          )}

          <p className="text-xs leading-relaxed text-muted-foreground">
            Classificação Indicativa: fonte oficial do Ministério da Justiça e Segurança Pública
            {consulta ? (
              <>
                {" "}
                (
                <a
                  href={consulta}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  consulta pública <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
                )
              </>
            ) : (
              "; livros não recebem classificação oficial"
            )}
            . A idade do Pai Indica é opinião editorial de pai, não substitui a lei nem a sua
            decisão.
          </p>
        </div>

        <aside className="space-y-4">
          <AdSlot format="rect" />
          <div className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Ficha</p>
            <dl className="mt-2 space-y-1.5">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tipo</dt>
                <dd className="font-semibold">{typeLabel}</dd>
              </div>
              {media.year && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Ano</dt>
                  <dd className="font-semibold">{media.year}</dd>
                </div>
              )}
              {media.platforms.length > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Onde</dt>
                  <dd className="text-right font-semibold">{media.platforms.join(", ")}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">ClassInd</dt>
                <dd className="font-semibold">{media.classind ?? "não se aplica"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Pai Indica</dt>
                <dd className="font-semibold">
                  {media.pai_age_min <= 0 ? "livre" : `${media.pai_age_min}+`}
                </dd>
              </div>
            </dl>
            <Link
              to="/pai-indica/midia#como-avaliamos"
              className="mt-3 inline-block text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Como avaliamos →
            </Link>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="veja-tambem-title" className="mt-14">
          <h2 id="veja-tambem-title" className="font-display text-2xl font-bold md:text-3xl">
            Veja também no Pai Indica Mídia
          </h2>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {related.map((m) => (
              <MediaCard key={m.id} media={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
