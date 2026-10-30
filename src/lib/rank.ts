// Títulos de "patente" do pai conforme os pontos acumulados nos quizzes.
// 11 quizzes x 7 perguntas = 77 pontos possíveis.

export interface FatherRank {
  title: string;
  min: number;
}

const RANKS: FatherRank[] = [
  { title: "Pai em Formação", min: 0 },
  { title: "Pai Qualificado", min: 14 },
  { title: "Pai Expert", min: 28 },
  { title: "Pai Master", min: 42 },
  { title: "Pai Lenda", min: 56 },
];

export function fatherRank(points: number): FatherRank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (points >= rank.min) current = rank;
  }
  return current;
}

/** Próxima patente e quantos pontos faltam para alcançá-la. */
export function nextFatherRank(points: number): { title: string; missing: number } | null {
  const next = RANKS.find((r) => points < r.min);
  return next ? { title: next.title, missing: next.min - points } : null;
}
