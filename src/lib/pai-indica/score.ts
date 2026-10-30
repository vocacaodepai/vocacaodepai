// Régua de nota do Pai Indica (doc 04 §1.1 e §2.6; CLAUDE.md §7). Única fonte dos rótulos e faixas.
import type { Criterion } from "./types";

export function weightedScore(criteria: { weight: number; score: number }[]): number {
  const total = criteria.reduce((s, c) => s + c.weight, 0);
  if (total === 0) return 0;
  const sum = criteria.reduce((s, c) => s + c.weight * c.score, 0);
  return Math.round((sum / total) * 10) / 10;
}

export function formatScore(n: number): string {
  return Number(n).toFixed(1).replace(".", ",");
}

export type ScoreBand = {
  min: number;
  max: number;
  label: string;
  text: string;
  tone: "bad" | "warn" | "ok" | "good" | "great";
};

export const SCORE_BANDS: ScoreBand[] = [
  {
    min: 0,
    max: 5.9,
    label: "Não indicamos",
    tone: "bad",
    text: "Tem problema que compromete o uso ou a segurança.",
  },
  {
    min: 6,
    max: 6.9,
    label: "Vale com ressalva",
    tone: "warn",
    text: "Resolve o básico, mas tem um ponto fraco real que pesa na decisão.",
  },
  {
    min: 7,
    max: 7.9,
    label: "Bom, compensa o preço",
    tone: "ok",
    text: "Sem defeito grave; é a faixa da maioria das indicações daqui.",
  },
  {
    min: 8,
    max: 8.9,
    label: "Muito bom",
    tone: "good",
    text: "Se destaca de verdade dentro da própria categoria.",
  },
  {
    min: 9,
    max: 10,
    label: "Excelente",
    tone: "great",
    text: "Poucos produtos chegam aqui; indicação sem ressalva.",
  },
];

export function bandOf(score: number): ScoreBand {
  const s = Math.round(Number(score) * 10) / 10;
  return SCORE_BANDS.find((b) => s >= b.min && s <= b.max) ?? SCORE_BANDS[2]!;
}

export function validateCriteria(criteria: Criterion[], declared: number): string[] {
  const errs: string[] = [];
  if (criteria.length !== 5) errs.push("review.criteria precisa ter exatamente 5 itens");
  const w = criteria.reduce((s, c) => s + c.weight, 0);
  if (w !== 100) errs.push(`pesos somam ${w}, precisam somar 100`);
  const calc = weightedScore(criteria);
  if (Math.abs(calc - declared) > 0.15)
    errs.push(`score ${declared} difere da média ponderada ${calc}`);
  criteria.forEach((c) => {
    if (c.score < 0 || c.score > 10) errs.push(`critério ${c.name} fora de 0-10`);
  });
  return errs;
}
