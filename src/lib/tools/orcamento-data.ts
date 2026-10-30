// Orçamento familiar do pai (doc 06 §3.7): grupos fixos e a "regra do pai" 50-20-20-10.
export const GRUPOS = [
  {
    id: "essenciais",
    nome: "Essenciais",
    meta: { max: 0.5 },
    categorias: [
      "Moradia (aluguel/prestação, condomínio, IPTU)",
      "Alimentação",
      "Contas (luz, água, gás, internet, celular)",
      "Transporte",
      "Saúde (plano, remédios)",
      "Educação dos filhos",
      "Seguros",
    ],
  },
  {
    id: "futuro",
    nome: "Futuro",
    meta: { min: 0.2 },
    categorias: ["Reserva de emergência", "Investimentos e aposentadoria", "Quitação de dívidas"],
  },
  {
    id: "estilo",
    nome: "Estilo de vida",
    meta: { max: 0.2 },
    categorias: [
      "Lazer e passeios",
      "Churrasco, hobbies e esporte",
      "Roupas e cuidados",
      "Assinaturas e streaming",
      "Presentes",
    ],
  },
  {
    id: "doacoes",
    nome: "Dízimo e caridade",
    meta: { sugerido: 0.1 },
    categorias: ["Dízimo e ofertas", "Ajuda a familiares e caridade"],
  },
] as const;

export type GrupoId = (typeof GRUPOS)[number]["id"];
export interface Orcamento {
  rendas: Array<{ nome: string; valor: number }>;
  gastos: Record<string, number>; // chave = categoria
}

export const PLANILHA_URL: string | null = null; // CTA da planilha completa (doc 11 §7) — oculto até a Fase 7

export function resumir(o: Orcamento) {
  const renda = o.rendas.reduce((s, r) => s + (Number.isFinite(r.valor) ? r.valor : 0), 0);
  const grupos = GRUPOS.map((g) => {
    const total = g.categorias.reduce((s, c) => s + (o.gastos[c] ?? 0), 0);
    const pct = renda > 0 ? total / renda : 0;
    const meta = g.meta as { max?: number; min?: number; sugerido?: number };
    const status: "ok" | "warn" | "neutral" =
      meta.max != null
        ? pct <= meta.max
          ? "ok"
          : "warn"
        : meta.min != null
          ? pct >= meta.min
            ? "ok"
            : "warn"
          : "neutral";
    return { id: g.id, nome: g.nome, total, pct, meta, status };
  });
  const gastos = grupos.reduce((s, g) => s + g.total, 0);
  const sobra = renda - gastos;
  const sobraPct = renda > 0 ? sobra / renda : 0;
  const essenciais = grupos.find((g) => g.id === "essenciais")!.pct;
  const futuro = grupos.find((g) => g.id === "futuro")!.pct;
  const semaforo: "ok" | "warn" | "bad" =
    sobra < 0
      ? "bad"
      : sobraPct < 0.1 || essenciais > 0.6
        ? "warn"
        : futuro >= 0.15
          ? "ok"
          : "warn";
  return { renda, gastos, sobra, sobraPct, grupos, semaforo };
}

export function orcamentoCsv(o: Orcamento): string {
  const linhas = ["grupo;categoria;valor"];
  for (const r of o.rendas) linhas.push(`Renda;${r.nome};${r.valor.toFixed(2).replace(".", ",")}`);
  for (const g of GRUPOS)
    for (const c of g.categorias)
      linhas.push(`${g.nome};${c};${(o.gastos[c] ?? 0).toFixed(2).replace(".", ",")}`);
  return linhas.join("\n");
}
