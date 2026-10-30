/**
 * Taxonomia do Pai Indica Mídia (doc 14 §3): tipos, faixas etárias do pai, as 10 categorias de
 * conteúdo em bolinhas, a escala moral -4..+4, os selos ClassInd e as plataformas. Única fonte dos
 * rótulos (UI, admin, JSON-LD e validador). Não apagar nem renomear slug publicado.
 */
import { CONTENT_KEYS, type ClassInd, type ContentKey, type MediaType } from "./types";

export const mediaTypeLabels: Record<
  MediaType,
  { label: string; plural: string; help: string; schema: string }
> = {
  filme: { label: "Filme", plural: "Filmes", help: "Cinema e streaming.", schema: "Movie" },
  serie: { label: "Série", plural: "Séries", help: "Séries e desenhos.", schema: "TVSeries" },
  jogo: { label: "Jogo", plural: "Jogos", help: "Console, PC e celular.", schema: "VideoGame" },
  app: {
    label: "App",
    plural: "Apps",
    help: "Aplicativos e plataformas.",
    schema: "MobileApplication",
  },
  livro: { label: "Livro", plural: "Livros", help: "Livros e quadrinhos.", schema: "Book" },
};

/** Faixa etária na visão do pai (modelo Decent Films em 3 níveis + "só adultos"). */
export const ageTiers = [
  { slug: "criancas", name: "Crianças", min: 0, max: 9, help: "Até 9 anos" },
  { slug: "pre-adolescentes", name: "Pré-adolescentes", min: 10, max: 13, help: "10 a 13 anos" },
  { slug: "adolescentes", name: "Adolescentes", min: 14, max: 17, help: "14 a 17 anos" },
  { slug: "adultos", name: "Só adultos", min: 18, max: 99, help: "18 anos ou mais" },
] as const;
export type AgeTierSlug = (typeof ageTiers)[number]["slug"];

export function tierOf(paiAgeMin: number): (typeof ageTiers)[number] {
  return ageTiers.find((t) => paiAgeMin >= t.min && paiAgeMin <= t.max) ?? ageTiers[3];
}

/** "Pai Indica: 10+" / "Pai Indica: livre". */
export function paiAgeLabel(paiAgeMin: number): string {
  return paiAgeMin <= 0 ? "livre" : `${paiAgeMin}+`;
}

/** As 10 categorias de conteúdo (bolinhas 0-5). `positive` = quanto mais, melhor. */
export const contentCategories: {
  key: ContentKey;
  name: string;
  help: string;
  positive: boolean;
}[] = [
  { key: "violencia", name: "Violência", help: "Lutas, armas, sangue, morte.", positive: false },
  {
    key: "sexo",
    name: "Sexo e sensualidade",
    help: "Beijos, nudez, insinuação, romance.",
    positive: false,
  },
  {
    key: "linguagem",
    name: "Linguagem",
    help: "Palavrão, vulgaridade, deboche.",
    positive: false,
  },
  {
    key: "drogas",
    name: "Álcool, fumo e drogas",
    help: "Uso ou apologia de álcool, cigarro e drogas.",
    positive: false,
  },
  {
    key: "consumismo",
    name: "Consumismo",
    help: "Compras no app, anúncios, produtos, marcas.",
    positive: false,
  },
  {
    key: "medo",
    name: "Medo e tensão",
    help: "Cenas assustadoras, suspense, perdas.",
    positive: false,
  },
  {
    key: "valores_positivos",
    name: "Valores positivos",
    help: "Família, coragem, honestidade, trabalho, perdão.",
    positive: true,
  },
  {
    key: "modelos_positivos",
    name: "Modelos positivos",
    help: "Pai, mãe, amigos e adultos que valem como exemplo.",
    positive: true,
  },
  {
    key: "fe",
    name: "Fé",
    help: "Conteúdo espiritual, oração, sentido da vida.",
    positive: true,
  },
  {
    key: "mensagem",
    name: "Mensagem",
    help: "A história ensina algo que o pai assinaria embaixo.",
    positive: true,
  },
];

export function contentCategory(key: ContentKey) {
  return contentCategories.find((c) => c.key === key)!;
}

export const CONTENT_MAX = 5;

/** Escala moral/espiritual -4..+4 (modelo Decent Films/Movieguide). */
export const moralScale: { value: number; label: string; text: string }[] = [
  { value: 4, label: "Edificante", text: "Faz bem à alma: a família sai melhor do que entrou." },
  {
    value: 3,
    label: "Muito positivo",
    text: "Valores claros, com um ou outro detalhe a conversar.",
  },
  { value: 2, label: "Positivo", text: "Mais bem do que mal; vale ver junto e comentar." },
  { value: 1, label: "Levemente positivo", text: "Inofensivo, com algum bom exemplo." },
  { value: 0, label: "Neutro", text: "Entretenimento sem mensagem relevante nos dois sentidos." },
  {
    value: -1,
    label: "Levemente problemático",
    text: "Algum valor torto, fácil de corrigir na conversa.",
  },
  {
    value: -2,
    label: "Problemático",
    text: "Mensagem contrária à família em ponto importante; exige discernimento.",
  },
  {
    value: -3,
    label: "Muito problemático",
    text: "Normaliza o que a família rejeita; só adulto formado, se tanto.",
  },
  { value: -4, label: "Ofensivo", text: "Contrário à fé e à família; não recomendamos." },
];

export function moralOf(value: number) {
  const v = Math.max(-4, Math.min(4, Math.round(value)));
  return moralScale.find((m) => m.value === v) ?? moralScale[4]!;
}

export function formatMoral(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** Selos oficiais ClassInd (cores do MJSP; a fonte é sempre citada com o link da consulta). */
export const classindLabels: Record<ClassInd, { label: string; text: string; color: string }> = {
  L: { label: "L", text: "Livre para todos os públicos", color: "bg-[#0E9A3C] text-white" },
  "10": {
    label: "10",
    text: "Não recomendado para menores de 10 anos",
    color: "bg-[#2A9FD6] text-white",
  },
  "12": {
    label: "12",
    text: "Não recomendado para menores de 12 anos",
    color: "bg-[#F3B52F] text-black",
  },
  "14": {
    label: "14",
    text: "Não recomendado para menores de 14 anos",
    color: "bg-[#E8792B] text-white",
  },
  "16": {
    label: "16",
    text: "Não recomendado para menores de 16 anos",
    color: "bg-[#D62B2B] text-white",
  },
  "18": {
    label: "18",
    text: "Não recomendado para menores de 18 anos",
    color: "bg-black text-white",
  },
};

export const CLASSIND_CONSULTA = {
  filmes: "https://classindportal.mj.gov.br/consulta-filmes",
  jogos: "https://classindportal.mj.gov.br/consulta-jogos",
  sobre: "https://www.gov.br/mj/pt-br/assuntos/seus-direitos/classificacao-1",
} as const;

/** Link da consulta pública oficial conforme o tipo (livro não tem ClassInd). */
export function classindConsultaUrl(type: MediaType): string | null {
  if (type === "livro") return null;
  return type === "jogo" || type === "app" ? CLASSIND_CONSULTA.jogos : CLASSIND_CONSULTA.filmes;
}

/** Plataformas conhecidas (texto livre no banco; esta lista só ordena e sugere no admin). */
export const PLATFORMS = [
  "Cinema",
  "Disney+",
  "Netflix",
  "Prime Video",
  "Globoplay",
  "HBO Max",
  "Apple TV+",
  "YouTube",
  "TV aberta",
  "Nintendo Switch",
  "PlayStation",
  "Xbox",
  "PC",
  "Android",
  "iOS",
  "Livro físico",
  "Kindle",
] as const;

export function platformSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Garante as 10 chaves, cada uma entre 0 e 5 (inteiro). */
export function normalizeContentScores(input: unknown): Record<ContentKey, number> {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  return Object.fromEntries(
    CONTENT_KEYS.map((k) => {
      const n = Math.round(Number(src[k] ?? 0));
      return [k, Number.isFinite(n) ? Math.max(0, Math.min(CONTENT_MAX, n)) : 0];
    }),
  ) as Record<ContentKey, number>;
}
