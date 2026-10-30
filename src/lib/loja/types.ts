// Tipos da Loja do Pai (Fase 3). Colunas conforme supabase/migrations/0003_loja.sql
// (COLUNAS-CHAVE do CLAUDE.md §8). Os tipos gerados do Supabase ainda são os do VDM,
// por isso tudo aqui é local.

export type AffiliateNetwork = "amazon" | "mercadolivre" | "shopee" | "magalu" | "outro";

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  parent_id?: string | null;
  sort_order: number;
}

/** Review longa da página do produto (`products.review`, formato do doc 05 §4.1 / `review_gen.py`). */
export interface ProductReviewCriterion {
  nome: string;
  nota: number;
}
export interface ProductReviewSection {
  titulo: string;
  paragrafos: string[];
  cta?: boolean;
}
export interface ProductReviewData {
  titulo: string;
  resumo: string;
  /** 0-10, uma casa decimal. */
  nota: number;
  /** Exatamente 5. */
  criterios: ProductReviewCriterion[];
  ideal_para: string;
  /** 3 frases. */
  em_3_pontos: string[];
  /** ≥ 6 seções, ≥ 3 com cta. */
  secoes: ProductReviewSection[];
  preco_texto: string;
  /** ≥ 5 linhas. */
  ficha: string[];
  como_avaliamos: string;
  opiniao: string;
  /** ≥ 4 itens. */
  faq: { q: string; a: string }[];
  atualizado_em?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  asin: string | null;
  affiliate_network: AffiliateNetwork;
  affiliate_url: string;
  marketplace_urls: Record<string, string>;
  image_url: string | null;
  /** Até 8 fotos oficiais da Amazon (`_AC_SL1500_`). */
  images: string[];
  short_description: string | null;
  description: string | null;
  pros: string[];
  cons: string[];
  review: ProductReviewData | null;
  category_id: string | null;
  /** Join de `product_categories` (quando o select pede). */
  category?: ProductCategory | null;
  subcategory: string | null;
  /** Uso interno (base da estimativa). Nunca é exibido. */
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  price_range_checked_at: string | null;
  /** Nota de compradores (0-5), diferente da nota editorial. */
  rating: number | null;
  rating_count: number;
  featured: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Linha de `product_price_checks` (só o admin lê; a página pública mostra loja + data, sem valor). */
export interface ProductPriceCheck {
  id: string;
  product_id: string;
  store: string;
  price: number;
  url: string | null;
  checked_at: string;
}

/** Post do Pai Indica que cita o produto (`posts_for_product`). */
export interface ProductPost {
  id: string;
  slug: string;
  title: string;
  kind: string;
  product_score: number | null;
  cover_image_url: string | null;
  publish_at: string | null;
}

/** Produto resumido para widgets de artigo (`getProductsBySlugs`). */
export interface ProductLite {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  asin: string | null;
  image_url: string | null;
  images: string[];
  affiliate_url: string;
  affiliate_network: AffiliateNetwork;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  price_range_checked_at: string | null;
}
