// JSON-LD do Pai Indica Mídia (doc 14 §7): Movie / TVSeries / VideoGame / MobileApplication / Book
// conforme `type`, com contentRating ClassInd, audience (idade mínima do pai) e Review aninhada
// (autor Organization "Vocação de Pai", nota 0-10 = score_quality). Listagem emite ItemList.
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";
import { mediaTypeLabels } from "./taxonomia";
import type { MediaCardRow, MediaReview } from "./types";

const publisher = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: { "@type": "ImageObject", url: SITE_OG_IMAGE },
};

export function mediaJsonLd(input: {
  url: string;
  media: MediaReview;
  authorName: string;
}): object[] {
  const { url, media, authorName } = input;
  const work: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": mediaTypeLabels[media.type].schema,
    name: media.title,
    url,
    description: media.summary,
  };
  if (media.original_title) work.alternateName = media.original_title;
  if (media.year) work.datePublished = String(media.year);
  if (media.poster_url) work.image = media.poster_url;
  if (media.classind) work.contentRating = `ClassInd ${media.classind}`;
  work.audience = { "@type": "PeopleAudience", suggestedMinAge: media.pai_age_min };
  if (media.type === "app") {
    work.applicationCategory = "EducationalApplication";
    if (media.platforms.length) work.operatingSystem = media.platforms.join(", ");
  }
  if (media.type === "jogo" && media.platforms.length) work.gamePlatform = media.platforms;
  work.review = {
    "@type": "Review",
    url,
    datePublished: media.publish_at?.slice(0, 10) ?? undefined,
    dateModified: (media.updated_at ?? media.publish_at)?.slice(0, 10) ?? undefined,
    author: { "@type": "Person", name: authorName },
    publisher,
    reviewBody: media.what_parents_need_to_know ?? media.summary,
    reviewRating: {
      "@type": "Rating",
      ratingValue: media.score_quality,
      bestRating: 10,
      worstRating: 0,
    },
  };
  return [
    work,
    breadcrumbJsonLd([
      { name: "Pai Indica", path: "/pai-indica" },
      { name: "Mídia", path: "/pai-indica/midia" },
      { name: media.title, path: `/pai-indica/midia/${media.slug}` },
    ]),
  ];
}

export function mediaListJsonLd(items: MediaCardRow[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Pai Indica Mídia",
    url: `${SITE_URL}/pai-indica/midia`,
    numberOfItems: items.length,
    itemListElement: items.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.title,
      url: `${SITE_URL}/pai-indica/midia/${m.slug}`,
    })),
  };
}
