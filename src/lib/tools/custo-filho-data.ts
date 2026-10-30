// Quanto custa um filho (doc 06 §3.3): faixas mensais DE REFERÊNCIA (nunca valor exato), R$/mês, arredondadas a R$ 10.
// Revisar todo janeiro e registrar a data em ATUALIZADO_EM. Fonte: pesquisa de preço no varejo online (2 lojas por
// item) e tabelas públicas de mensalidade de creche/escola; URLs em FONTES.
export type Fase = "0-1" | "1-3" | "4-6" | "7-11" | "12-17";
export type Perfil = "enxuto" | "medio" | "amplo";
export type Categoria =
  | "alimentacao"
  | "fraldas-higiene"
  | "roupas-calcados"
  | "saude"
  | "educacao"
  | "lazer-esporte"
  | "transporte"
  | "outros";
export interface FaixaCusto {
  fase: Fase;
  categoria: Categoria;
  faixa: Record<Perfil, [number, number]>;
}

export const FASES: Array<{ id: Fase; nome: string; anos: number }> = [
  { id: "0-1", nome: "Recém-nascido (0 a 1 ano)", anos: 1 },
  { id: "1-3", nome: "Primeira infância (1 a 3 anos)", anos: 3 },
  { id: "4-6", nome: "Pré-escola (4 a 6 anos)", anos: 3 },
  { id: "7-11", nome: "Ensino fundamental (7 a 11 anos)", anos: 5 },
  { id: "12-17", nome: "Adolescência (12 a 17 anos)", anos: 6 },
];
export const CATEGORIAS: Array<{ id: Categoria; nome: string }> = [
  { id: "alimentacao", nome: "Alimentação" },
  { id: "fraldas-higiene", nome: "Fraldas e higiene" },
  { id: "roupas-calcados", nome: "Roupas e calçados" },
  { id: "saude", nome: "Saúde" },
  { id: "educacao", nome: "Educação" },
  { id: "lazer-esporte", nome: "Lazer e esporte" },
  { id: "transporte", nome: "Transporte" },
  { id: "outros", nome: "Outros" },
];

const f = (
  fase: Fase,
  categoria: Categoria,
  enxuto: [number, number],
  medio: [number, number],
  amplo: [number, number],
): FaixaCusto => ({
  fase,
  categoria,
  faixa: { enxuto, medio, amplo },
});

export const FAIXAS: FaixaCusto[] = [
  f("0-1", "fraldas-higiene", [150, 250], [250, 400], [400, 600]),
  f("0-1", "alimentacao", [0, 150], [150, 500], [500, 900]), // 0 = amamentação exclusiva
  f("0-1", "roupas-calcados", [30, 80], [80, 200], [200, 450]),
  f("0-1", "saude", [0, 100], [200, 450], [450, 900]), // 0 = só SUS
  f("0-1", "educacao", [0, 0], [0, 900], [900, 2500]), // creche
  f("0-1", "lazer-esporte", [0, 30], [30, 100], [100, 300]),
  f("0-1", "transporte", [0, 50], [50, 150], [150, 400]),
  f("0-1", "outros", [30, 80], [80, 200], [200, 500]),

  f("1-3", "fraldas-higiene", [120, 200], [200, 320], [320, 500]),
  f("1-3", "alimentacao", [150, 300], [300, 600], [600, 1000]),
  f("1-3", "roupas-calcados", [40, 100], [100, 250], [250, 500]),
  f("1-3", "saude", [0, 100], [200, 450], [450, 900]),
  f("1-3", "educacao", [0, 0], [500, 1200], [1200, 3000]),
  f("1-3", "lazer-esporte", [20, 60], [60, 200], [200, 500]),
  f("1-3", "transporte", [0, 60], [60, 200], [200, 450]),
  f("1-3", "outros", [30, 80], [80, 200], [200, 500]),

  f("4-6", "fraldas-higiene", [30, 60], [60, 120], [120, 200]),
  f("4-6", "alimentacao", [200, 350], [350, 650], [650, 1100]),
  f("4-6", "roupas-calcados", [50, 120], [120, 280], [280, 550]),
  f("4-6", "saude", [0, 100], [200, 450], [450, 900]),
  f("4-6", "educacao", [0, 50], [600, 1500], [1500, 3500]),
  f("4-6", "lazer-esporte", [30, 80], [80, 250], [250, 600]),
  f("4-6", "transporte", [0, 80], [80, 250], [250, 500]),
  f("4-6", "outros", [40, 100], [100, 250], [250, 600]),

  f("7-11", "fraldas-higiene", [30, 60], [60, 120], [120, 200]),
  f("7-11", "alimentacao", [250, 400], [400, 750], [750, 1300]),
  f("7-11", "roupas-calcados", [60, 130], [130, 300], [300, 600]),
  f("7-11", "saude", [0, 120], [200, 500], [500, 1000]),
  f("7-11", "educacao", [30, 100], [700, 1800], [1800, 4000]),
  f("7-11", "lazer-esporte", [40, 100], [100, 300], [300, 800]),
  f("7-11", "transporte", [0, 100], [100, 300], [300, 600]),
  f("7-11", "outros", [50, 120], [120, 300], [300, 700]),

  f("12-17", "fraldas-higiene", [40, 80], [80, 150], [150, 250]),
  f("12-17", "alimentacao", [300, 500], [500, 900], [900, 1600]),
  f("12-17", "roupas-calcados", [80, 160], [160, 350], [350, 800]),
  f("12-17", "saude", [0, 120], [200, 500], [500, 1000]),
  f("12-17", "educacao", [50, 150], [800, 2000], [2000, 4500]),
  f("12-17", "lazer-esporte", [50, 150], [150, 400], [400, 1000]),
  f("12-17", "transporte", [30, 150], [150, 400], [400, 800]),
  f("12-17", "outros", [60, 150], [150, 350], [350, 800]),
];
export const ATUALIZADO_EM = "2026-10-30";
export const FONTES: Array<{ item: string; url: string }> = [
  {
    item: "Pesquisa de preços de fraldas, fórmula e vestuário infantil em varejo online (2 lojas por item)",
    url: "https://www.amazon.com.br",
  },
  {
    item: "Mensalidades de creche e escola particular por região (tabelas públicas das escolas)",
    url: "https://www.gov.br/inep",
  },
];
export const ECONOMIA_SEGUNDO_FILHO = 0.15; // roupas, brinquedos e material reaproveitados
const CATEGORIAS_REAPROVEITADAS: Categoria[] = ["roupas-calcados", "lazer-esporte", "outros"];

export interface CustoEntrada {
  fase: Fase;
  perfil: Perfil;
  escolaParticular: boolean;
  planoSaude: boolean;
  filhos: number;
  renda?: number | null;
}

function faixaAjustada(fx: FaixaCusto, e: CustoEntrada): [number, number] {
  let [min, max] = fx.faixa[e.perfil];
  if (fx.categoria === "educacao") {
    if (!e.escolaParticular) [min, max] = [Math.min(min, 50), Math.min(max, 150)];
    else if (e.perfil === "enxuto") [min, max] = fx.faixa.medio;
  }
  if (fx.categoria === "saude") {
    if (!e.planoSaude) [min, max] = [Math.min(min, 50), Math.min(max, 150)];
    else if (e.perfil === "enxuto") [min, max] = fx.faixa.medio;
  }
  return [min, max];
}

export function calcularCusto(e: CustoEntrada) {
  const filhos = Math.max(1, Math.floor(e.filhos));
  const porCategoria = CATEGORIAS.map((c) => {
    const fx = FAIXAS.find((x) => x.fase === e.fase && x.categoria === c.id)!;
    const [min, max] = faixaAjustada(fx, e);
    const desconto = CATEGORIAS_REAPROVEITADAS.includes(c.id) ? 1 - ECONOMIA_SEGUNDO_FILHO : 1;
    const mult = 1 + (filhos - 1) * desconto;
    return { id: c.id, nome: c.nome, min: min * mult, max: max * mult };
  });
  const min = porCategoria.reduce((s, c) => s + c.min, 0);
  const max = porCategoria.reduce((s, c) => s + c.max, 0);
  // até os 18: soma de todas as fases a partir da fase atual, em valores de hoje
  const idx = FASES.findIndex((x) => x.id === e.fase);
  let ate18Min = 0;
  let ate18Max = 0;
  for (const fase of FASES.slice(idx)) {
    for (const c of CATEGORIAS) {
      const fx = FAIXAS.find((x) => x.fase === fase.id && x.categoria === c.id)!;
      const [a, b] = faixaAjustada(fx, { ...e, fase: fase.id });
      const desconto = CATEGORIAS_REAPROVEITADAS.includes(c.id) ? 1 - ECONOMIA_SEGUNDO_FILHO : 1;
      const mult = 1 + (filhos - 1) * desconto;
      ate18Min += a * mult * 12 * fase.anos;
      ate18Max += b * mult * 12 * fase.anos;
    }
  }
  const maisPesa = [...porCategoria].sort((a, b) => b.max - a.max)[0];
  const pctRenda = e.renda && e.renda > 0 ? (max / e.renda) * 100 : null;
  const semaforo: "ok" | "warn" | "bad" | null =
    pctRenda == null ? null : pctRenda <= 25 ? "ok" : pctRenda <= 40 ? "warn" : "bad";
  return { min, max, porCategoria, ate18Min, ate18Max, maisPesa, pctRenda, semaforo, filhos };
}
