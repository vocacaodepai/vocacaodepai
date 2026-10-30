// JSON-LD do Pai Indica (doc 04 §7): Review + Product (review), ItemList de Product (comparativo/lista),
// Article, BreadcrumbList e FAQPage. NUNCA aggregateRating com estrelas da Amazon; NUNCA preço em offers.
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";
import type { PaiIndicaPost, PaiIndicaProduct } from "./types";

export interface PaiIndicaJsonLdInput {
  url: string;
  post: PaiIndicaPost & { author?: { full_name?: string | null } | null };
  products: PaiIndicaProduct[];
  authorName: string;
  /** Caminho do autor (/autor/<slug>), quando existir. */
  authorPath?: string | null;
}

function person(name: string, path?: string | null) {
  return path
    ? { "@type": "Person", name, url: `${SITE_URL}${path}` }
    : { "@type": "Person", name };
}

function productNode(p: PaiIndicaProduct | undefined, name: string) {
  const node: Record<string, unknown> = { "@type": "Product", name: p?.name ?? name };
  if (p?.brand) node.brand = { "@type": "Brand", name: p.brand };
  if (p?.image_url) node.image = p.image_url;
  if (p?.asin) node.sku = p.asin;
  if (p?.affiliate_url) {
    // Sem price: a faixa é pesquisada na internet e nunca vira preço exato (CLAUDE.md §5.2).
    node.offers = {
      "@type": "Offer",
      url: p.affiliate_url,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
    };
  }
  return node;
}

function toItemList(items: string[]) {
  return {
    "@type": "ItemList",
    itemListElement: items.map((name, i) => ({ "@type": "ListItem", position: i + 1, name })),
  };
}

export function paiIndicaJsonLd(input: PaiIndicaJsonLdInput): object[] {
  const { url, post, products, authorName, authorPath } = input;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const datePublished = post.publish_at?.slice(0, 10) ?? undefined;
  const dateModified = (post.updated_at ?? post.publish_at)?.slice(0, 10) ?? undefined;
  const out: object[] = [];

  out.push(
    articleJsonLd({
      title: post.title,
      description: post.excerpt,
      url,
      image: post.cover_image_url
        ? `${SITE_URL}${post.cover_image_url}`.replace(`${SITE_URL}http`, "http")
        : null,
      datePublished: post.publish_at,
      dateModified: post.updated_at ?? post.publish_at,
      authorName,
      category: "Pai Indica",
      publisherLogo: SITE_OG_IMAGE,
    }),
  );
  // author.url aponta para /autor/<slug> quando a rota existir (doc 04 §5.5).
  if (authorPath) {
    const article = out[0] as Record<string, unknown>;
    article.author = person(authorName, authorPath);
  }

  if (post.kind === "review" && post.review) {
    const r = post.review;
    const p = bySlug.get(r.product_slug);
    out.push({
      "@context": "https://schema.org",
      "@type": "Review",
      name: post.title,
      url,
      datePublished,
      dateModified,
      author: person(authorName, authorPath),
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: { "@type": "ImageObject", url: SITE_OG_IMAGE },
      },
      reviewBody: r.verdict,
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.score,
        bestRating: 10,
        worstRating: 0,
      },
      positiveNotes: toItemList(r.pros),
      negativeNotes: toItemList(r.cons),
      itemReviewed: productNode(p, r.product_slug),
    });
  } else if (post.comparison) {
    const c = post.comparison;
    const ordered = [...c.products].sort((a, b) => b.score - a.score);
    out.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: post.title,
      url,
      numberOfItems: ordered.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: ordered.map((cp, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          ...productNode(bySlug.get(cp.product_slug), cp.name),
          review: {
            "@type": "Review",
            author: person(authorName, authorPath),
            reviewRating: { "@type": "Rating", ratingValue: cp.score, bestRating: 10 },
          },
        },
      })),
    });
  }

  out.push(
    breadcrumbJsonLd([
      { name: "Pai Indica", path: "/pai-indica" },
      { name: post.title, path: `/pai-indica/${post.slug}` },
    ]),
  );
  if (Array.isArray(post.faq) && post.faq.length > 0) out.push(faqJsonLd(post.faq));
  return out;
}
