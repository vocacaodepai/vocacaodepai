// Fases do filho (doc 07 §3.1) — fonte única no app. Espelho exato de
// public.child_phase(date) na 0013_membros_extra.sql: mantenha os dois em sincronia.

export type PhaseSlug =
  | "gestacao"
  | "recem-nascido"
  | "bebe"
  | "primeira-infancia"
  | "infancia"
  | "pre-adolescencia"
  | "adolescencia"
  | "adulto";

export interface Phase {
  slug: PhaseSlug;
  name: string;
  short: string;
  tagSlug: `fase-${PhaseSlug}`;
  icon: string;
  /** Temas-chave para pauta (doc 07 §3.1). */
  themes: string;
}

export const PHASES: Phase[] = [
  {
    slug: "gestacao",
    name: "Gestação",
    short: "Gestação",
    tagSlug: "fase-gestacao",
    icon: "heart-pulse",
    themes: "enxoval do pai, finanças do bebê, apoio à esposa, licença-paternidade",
  },
  {
    slug: "recem-nascido",
    name: "Recém-nascido (0-3 meses)",
    short: "0-3 m",
    tagSlug: "fase-recem-nascido",
    icon: "baby",
    themes: "sono, troca de fralda, puerpério da mãe, rotina, segurança no carro",
  },
  {
    slug: "bebe",
    name: "Bebê (4-12 meses)",
    short: "4-12 m",
    tagSlug: "fase-bebe",
    icon: "baby",
    themes: "introdução alimentar, vacinas, brincar, primeiros passos",
  },
  {
    slug: "primeira-infancia",
    name: "1 a 3 anos",
    short: "1-3 a",
    tagSlug: "fase-primeira-infancia",
    icon: "blocks",
    themes: "limites, birras, linguagem, desfralde, brincadeiras ao ar livre",
  },
  {
    slug: "infancia",
    name: "4 a 7 anos",
    short: "4-7 a",
    tagSlug: "fase-infancia",
    icon: "backpack",
    themes: "escola, fé em família, esportes, mesada, leitura",
  },
  {
    slug: "pre-adolescencia",
    name: "8 a 12 anos",
    short: "8-12 a",
    tagSlug: "fase-pre-adolescencia",
    icon: "bike",
    themes: "telas, amizades, responsabilidades, educação financeira, puberdade",
  },
  {
    slug: "adolescencia",
    name: "13 a 17 anos",
    short: "13-17 a",
    tagSlug: "fase-adolescencia",
    icon: "graduation-cap",
    themes: "identidade, vocação, namoro, drogas, autonomia, carreira",
  },
  {
    slug: "adulto",
    name: "Filho adulto",
    short: "18+",
    tagSlug: "fase-adulto",
    icon: "users",
    themes: "relação adulto-adulto, netos, herança, conselhos de carreira",
  },
];

export const phaseBySlug = (s: string | null | undefined): Phase | undefined =>
  PHASES.find((p) => p.slug === s);

function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  // "AAAA-MM-DD" → data local (evita o deslocamento de fuso do `new Date("2026-01-01")`).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Date(value);
}

/** Meses completos entre `from` e `to` (negativo se `from` está no futuro). */
export function monthsBetween(from: string | Date, to: Date = new Date()): number {
  const b = parseDate(from);
  let months = (to.getFullYear() - b.getFullYear()) * 12 + (to.getMonth() - b.getMonth());
  if (to.getDate() < b.getDate()) months -= 1;
  return months;
}

/** Espelho exato de public.child_phase(date). */
export function childPhase(birthDate: string | Date, today: Date = new Date()): PhaseSlug {
  const b = parseDate(birthDate);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (b > t) return "gestacao";
  const months = monthsBetween(b, t);
  if (months < 4) return "recem-nascido";
  if (months < 12) return "bebe";
  const years = months / 12;
  if (years < 4) return "primeira-infancia";
  if (years < 8) return "infancia";
  if (years < 13) return "pre-adolescencia";
  if (years < 18) return "adolescencia";
  return "adulto";
}

/** Idade humanizada: "1 ano e 3 meses", "7 meses", "nasce em 2 meses". */
export function humanAge(birthDate: string | Date, today: Date = new Date()): string {
  const months = monthsBetween(birthDate, today);
  if (months < 0) {
    const left = Math.abs(months);
    return left <= 1 ? "nasce em breve" : `nasce em ${left} meses`;
  }
  if (months === 0) return "recém-nascido";
  if (months < 24) {
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y === 0) return `${m} ${m === 1 ? "mês" : "meses"}`;
    return m === 0 ? "1 ano" : `1 ano e ${m} ${m === 1 ? "mês" : "meses"}`;
  }
  const years = Math.floor(months / 12);
  return `${years} anos`;
}

/** Em quantos meses o filho muda de fase (null para filho adulto). */
export function monthsToNextPhase(
  birthDate: string | Date,
  today: Date = new Date(),
): number | null {
  const months = monthsBetween(birthDate, today);
  const limits = [0, 4, 12, 48, 96, 156, 216];
  for (const l of limits) if (months < l) return l - months;
  return null;
}

/** Interesses do onboarding (doc 07 §4.8). */
export const INTERESTS: { slug: string; label: string }[] = [
  { slug: "paternidade", label: "Paternidade" },
  { slug: "casamento", label: "Casamento" },
  { slug: "financas", label: "Finanças" },
  { slug: "carreira", label: "Carreira" },
  { slug: "fe", label: "Fé" },
  { slug: "saude", label: "Saúde" },
  { slug: "esportes", label: "Esportes" },
  { slug: "churrasco-e-cozinha", label: "Churrasco e cozinha" },
  { slug: "ferramentas-e-reparos", label: "Ferramentas e reparos" },
  { slug: "carros", label: "Carros" },
  { slug: "tecnologia", label: "Tecnologia" },
  { slug: "leitura", label: "Leitura" },
];

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
