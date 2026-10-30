import { useEffect } from "react";
import { SITE_URL, SITE_NAME, SITE_OG_IMAGE, SITE_DESCRIPTION } from "./site";

export interface SeoOptions {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  noindex?: boolean;
  jsonLd?: object[];
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function removeMeta(attr: "name" | "property", key: string) {
  document.head
    .querySelectorAll<HTMLMetaElement>(`meta[${attr}="${key}"]`)
    .forEach((el) => el.remove());
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function removeLink(rel: string) {
  document.head
    .querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`)
    .forEach((el) => el.remove());
}

let jsonLdContainer: HTMLScriptElement | null = null;

function renderJsonLd(entries: object[]) {
  if (jsonLdContainer) {
    jsonLdContainer.remove();
    jsonLdContainer = null;
  }
  if (entries.length === 0) return;
  jsonLdContainer = document.createElement("script");
  jsonLdContainer.type = "application/ld+json";
  jsonLdContainer.textContent = JSON.stringify(entries.length === 1 ? entries[0] : entries);
  document.head.appendChild(jsonLdContainer);
}

const DEFAULT_DESCRIPTION = SITE_DESCRIPTION;

/**
 * Lightweight SEO manager: sets document.title, meta description, canonical,
 * OG/Twitter tags and JSON-LD for the current page, and cleans up on unmount.
 */
export function useSeo({
  title,
  description,
  canonicalPath,
  ogImage,
  ogType = "website",
  noindex = false,
  jsonLd = [],
}: SeoOptions) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;
    setMeta("name", "description", description ?? DEFAULT_DESCRIPTION);

    const canonical = canonicalPath ? `${SITE_URL}${canonicalPath}` : SITE_URL;
    upsertLink("canonical", canonical);
    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      removeMeta("name", "robots");
    }

    // Open Graph
    setMeta("property", "og:site_name", SITE_NAME);
    setMeta("property", "og:locale", "pt_BR");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description ?? DEFAULT_DESCRIPTION);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:image", ogImage ?? SITE_OG_IMAGE);

    // Twitter
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description ?? DEFAULT_DESCRIPTION);
    setMeta("name", "twitter:image", ogImage ?? SITE_OG_IMAGE);

    renderJsonLd(jsonLd);
  }, [title, description, canonicalPath, ogImage, ogType, noindex, jsonLd]);
}

/* ---------- JSON-LD builders ---------- */

export function articleJsonLd(input: {
  title: string;
  description?: string | null;
  url: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName: string;
  category?: string | null;
  publisherLogo: string;
}) {
  const absoluteUrl = input.url.startsWith("http") ? input.url : `${SITE_URL}${input.url}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl },
    image: input.image ?? undefined,
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    author: { "@type": "Person", name: input.authorName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: input.publisherLogo },
    },
    ...(input.category ? { articleSection: input.category } : {}),
  };
}

/** BreadcrumbList sempre começa em "Início" (Início → Blog → Categoria → Post). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  const all = [{ name: "Início", path: "" }, ...items.filter((i) => i.path !== "/")];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    logo: SITE_OG_IMAGE,
    sameAs: [],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/busca?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

/** Valida o dígito verificador de um ISBN-13 (13 dígitos). */
function isValidIsbn13(isbn13: string): boolean {
  if (!/^\d{13}$/.test(isbn13)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(isbn13[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(isbn13[12]);
}

/**
 * Normaliza um ISBN armazenado (frequentemente ISBN-10) para ISBN-13 válido.
 * O Google exige ISBN-13 no schema Product; ISBN-10 é convertido prefixando
 * "978" e recalculando o dígito verificador. Retorna null se não for possível
 * obter um ISBN-13 válido (evita publicar um identificador inválido).
 */
function toValidIsbn13(raw: string): string | null {
  const clean = raw.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (clean.length === 13) {
    return isValidIsbn13(clean) ? clean : null;
  }
  if (clean.length !== 10) return null;
  const core9 = clean.slice(0, 9);
  if (!/^\d{9}$/.test(core9)) return null;
  const digits = `978${core9}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${digits}${check}`;
}

/** Schema.org Product with pricing, brand/ISBN, shipping, returns, rating and reviews. */
export function productJsonLd(input: {
  name: string;
  description?: string | null;
  image?: string | null;
  price?: string | null;
  ageRange?: string | null;
  url: string;
  category?: string | null;
  brand?: string | null;
  isbn?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviews?: Array<{
    author_name: string;
    rating: number;
    title?: string | null;
    content: string;
    created_at: string;
  }>;
}) {
  const priceMatch = input.price?.replace(/\./g, "").match(/([\d,]+)/);
  const priceValue = priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null;

  const ageMatch = input.ageRange?.match(/(\d+)\s*a\s*(\d+)/i);
  const minAge = ageMatch ? parseInt(ageMatch[1], 10) : undefined;
  const maxAge = ageMatch ? parseInt(ageMatch[2], 10) : undefined;

  const realReviews = (input.reviews ?? []).filter(
    (r) => r.rating > 0 && r.rating <= 5 && r.content && r.author_name,
  );

  const hasRating = input.rating != null && (input.reviewCount ?? 0) > 0;

  const validIsbn13 = input.isbn ? toValidIsbn13(input.isbn) : null;

  // Entrega e devolução: o site é um catálogo com venda via Amazon BR.
  // Valores padrão (frete grátis / devolução gratuita em 30 dias) — ajustáveis.
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "BR" },
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "BRL" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: {
        "@type": "QuantitativeValue",
        minValue: 1,
        maxValue: 2,
        unitCode: "DAY",
      },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: 3,
        maxValue: 6,
        unitCode: "DAY",
      },
    },
  };

  const merchantReturnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: "BR",
    merchantReturnDays: 30,
    returnMethod: "https://schema.org/ReturnByMail",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    returnFees: "https://schema.org/FreeReturn",
  };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    description: input.description ?? undefined,
    image: input.image ?? undefined,
    ...(input.brand ? { brand: { "@type": "Brand", name: input.brand } } : {}),
    ...(validIsbn13 ? { isbn: validIsbn13 } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(minAge !== undefined
      ? {
          audience: {
            "@type": "PeopleAudience",
            suggestedMinAge: minAge,
            suggestedMaxAge: maxAge,
          },
        }
      : {}),
    ...(hasRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            reviewCount: input.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(realReviews.length > 0
      ? {
          review: realReviews.map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.author_name },
            datePublished: r.created_at,
            ...(r.title ? { name: r.title } : {}),
            reviewBody: r.content,
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
    offers: priceValue
      ? {
          "@type": "Offer",
          price: priceValue,
          priceCurrency: "BRL",
          availability: "https://schema.org/InStock",
          url: input.url.startsWith("http") ? input.url : `${SITE_URL}${input.url}`,
          shippingDetails,
          hasMerchantReturnPolicy: merchantReturnPolicy,
        }
      : {
          "@type": "Offer",
          url: input.url.startsWith("http") ? input.url : `${SITE_URL}${input.url}`,
          shippingDetails,
          hasMerchantReturnPolicy: merchantReturnPolicy,
        },
  };
}
