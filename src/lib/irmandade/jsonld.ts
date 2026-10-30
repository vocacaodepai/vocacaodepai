// JSON-LD da Irmandade e da Formação (doc 09 §4.1, §8 e §5.4).
import { SITE_NAME, SITE_URL } from "@/lib/site";
import type { AnswerRow, EventRow, QuestionRow } from "./types";
import type { TrackRow } from "@/lib/formacao/types";

const personName = (a: { display_name: string | null } | null | undefined, fallback: string) =>
  a?.display_name?.trim() || fallback;

/** QAPage: só com respostas visíveis; sem respostas emite só Question (regra do Google). */
export function qaPageJsonLd(q: QuestionRow, answers: AnswerRow[], url: string) {
  const ans = (a: AnswerRow) => ({
    "@type": "Answer",
    text: a.body,
    dateCreated: a.created_at,
    upvoteCount: Math.max(0, a.like_count),
    url: `${url}#resposta-${a.id}`,
    author: { "@type": "Person", name: personName(a.author, "Irmão da Irmandade") },
  });
  const accepted = answers.find((a) => a.id === q.accepted_answer_id);
  const suggested = answers.filter((a) => a.id !== q.accepted_answer_id).slice(0, 10);
  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: q.title,
      text: q.body,
      answerCount: q.answers_count,
      dateCreated: q.created_at,
      url,
      author: { "@type": "Person", name: personName(q.author, "Pai da Irmandade") },
      ...(accepted ? { acceptedAnswer: ans(accepted) } : {}),
      ...(suggested.length > 0 ? { suggestedAnswer: suggested.map(ans) } : {}),
    },
  };
}

/** Event (só published/done): modo on-line × presencial, organizer, offers só se "Gratuito". */
export function eventJsonLd(e: EventRow, url: string) {
  const online = e.mode === "online";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: e.description ?? undefined,
    url,
    image: e.cover_image_url ?? undefined,
    startDate: e.starts_at,
    ...(e.ends_at ? { endDate: e.ends_at } : {}),
    eventStatus:
      e.status === "canceled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: online
      ? { "@type": "VirtualLocation", url: e.url ?? url }
      : {
          "@type": "Place",
          name: e.address ?? `${e.city ?? ""}${e.uf ? `/${e.uf}` : ""}`,
          address: {
            "@type": "PostalAddress",
            streetAddress: e.address ?? undefined,
            addressLocality: e.city ?? undefined,
            addressRegion: e.uf ?? undefined,
            addressCountry: "BR",
          },
        },
    organizer: { "@type": "Organization", name: e.organizer || SITE_NAME, url: SITE_URL },
    ...(e.price_text?.toLowerCase().startsWith("gratuito")
      ? {
          offers: {
            "@type": "Offer",
            price: 0,
            priceCurrency: "BRL",
            url,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

/** Course (trilha): provider Organização "Vocação de Pai", instância on-line com carga em minutos. */
export function courseJsonLd(t: TrackRow, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: t.title,
    description: t.description ?? undefined,
    url,
    image: t.cover_image_url ?? undefined,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    isAccessibleForFree: !t.is_premium,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${t.estimated_minutes ?? 60}M`,
    },
    offers: { "@type": "Offer", price: 0, priceCurrency: "BRL", category: "Free" },
  };
}
