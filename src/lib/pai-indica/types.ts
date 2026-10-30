// Tipos do Pai Indica (doc 04 §2.5). Formato ÚNICO de posts.review / posts.comparison (doc 02 §5.3 e §5.4).
export type PaiIndicaKind = "review" | "comparativo" | "lista";

export const PAI_INDICA_KINDS: readonly PaiIndicaKind[] = ["review", "comparativo", "lista"];

export function isPaiIndicaKind(kind: unknown): kind is PaiIndicaKind {
  return typeof kind === "string" && (PAI_INDICA_KINDS as readonly string[]).includes(kind);
}

export type Criterion = { name: string; weight: number; score: number; comment?: string };

export type OtherBuyers = {
  intro: string;
  praises: string[];
  complaints: string[];
  sources: string[];
  none_found: boolean;
};

export type ReviewData = {
  product_slug: string;
  score: number;
  criteria: [Criterion, Criterion, Criterion, Criterion, Criterion];
  pros: string[];
  cons: string[];
  ideal_for: string;
  not_ideal_for: string;
  verdict: string;
  how_we_evaluated: string;
  sources?: string[];
  other_buyers?: OtherBuyers;
};

export type ComparisonRole =
  | "vencedor"
  | "custo-beneficio"
  | "premium"
  | "alternativa"
  | "nao-indicamos"
  | "escolha-do-editor"
  | "melhor-custo-beneficio"
  | "melhor-premium"
  | "melhor-barato"
  | "melhor-para-iniciantes"
  | "melhor-compacto"
  | "melhor-para-familias"
  | "melhor-silencioso"
  | "melhor-desempenho"
  | "sem-selo";

export type ComparisonProduct = {
  product_slug: string;
  name: string;
  role: ComparisonRole;
  score: number;
  criteria_scores?: number[];
  one_liner?: string;
};

export type ComparisonData = {
  criteria: { name: string; weight: number }[];
  products: ComparisonProduct[];
  table?: { columns: string[]; rows: string[][] };
  winner_slug: string;
  verdict_by_profile: { profile: string; pick_slug: string; reason: string }[];
  how_we_evaluated: string;
};

export type FaqItem = { question: string; answer: string };

/** Linha de `posts` já tipada para o Pai Indica (subconjunto). */
export type PaiIndicaPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  cover_image_alt?: string | null;
  kind: PaiIndicaKind;
  review: ReviewData | null;
  comparison: ComparisonData | null;
  product_category: string;
  product_subcategory: string;
  product_score: number;
  faq: FaqItem[] | null;
  publish_at: string | null;
  updated_at: string | null;
  reading_time: number | null;
};

/** Produto como o Pai Indica precisa dele (colunas-chave de `products`, CLAUDE.md §8). */
export type PaiIndicaProduct = {
  id?: string;
  slug: string;
  name: string;
  brand: string | null;
  asin: string | null;
  affiliate_url: string;
  image_url: string | null;
  images: string[];
  price_min: number | null;
  price_max: number | null;
  price_range_checked_at: string | null;
  rating?: number | null;
  rating_count?: number | null;
};

export const roleLabels: Record<ComparisonRole, string> = {
  vencedor: "Nossa escolha",
  "custo-beneficio": "Melhor custo-benefício",
  premium: "Opção premium",
  alternativa: "Alternativa",
  "nao-indicamos": "Não indicamos",
  "escolha-do-editor": "Escolha do editor",
  "melhor-custo-beneficio": "Melhor custo-benefício",
  "melhor-premium": "Melhor premium",
  "melhor-barato": "Melhor barato",
  "melhor-para-iniciantes": "Melhor para iniciantes",
  "melhor-compacto": "Melhor compacto",
  "melhor-para-familias": "Melhor para famílias",
  "melhor-silencioso": "Melhor silencioso",
  "melhor-desempenho": "Melhor desempenho",
  "sem-selo": "",
};

export const COMPARATIVO_ROLES: readonly ComparisonRole[] = [
  "vencedor",
  "custo-beneficio",
  "premium",
  "alternativa",
  "nao-indicamos",
];

export const LISTA_ROLES: readonly ComparisonRole[] = [
  "escolha-do-editor",
  "melhor-custo-beneficio",
  "melhor-premium",
  "melhor-barato",
  "melhor-para-iniciantes",
  "melhor-compacto",
  "melhor-para-familias",
  "melhor-silencioso",
  "melhor-desempenho",
  "sem-selo",
];

export const kindLabels: Record<PaiIndicaKind, { label: string; help: string }> = {
  review: {
    label: "Review individual",
    help: "Um único produto a fundo, com nota por critério, prós, contras e veredito.",
  },
  comparativo: {
    label: "Comparativo",
    help: "2 ou 3 produtos da mesma categoria lado a lado; dizemos qual compensa para cada perfil.",
  },
  lista: {
    label: "Lista",
    help: "De 3 a 7 produtos ranqueados para um uso ou perfil, com selo para cada um.",
  },
};
