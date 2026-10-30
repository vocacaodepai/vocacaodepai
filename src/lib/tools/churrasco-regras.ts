// Calculadora de churrasco (doc 06 §3.5; anexo res-ecossistema Tabela 4: 400–500 g por adulto).
export const GRAMAS = { homem: 450, mulher: 350, crianca: 200 } as const; // carne crua por pessoa, 4 h
export const FATOR_DURACAO = { "2h": 0.8, "4h": 1, "6h+": 1.25 } as const;
export const PRESETS = {
  classico: [
    ["picanha", 0.3],
    ["contrafile", 0.2],
    ["fraldinha", 0.2],
    ["linguica", 0.15],
    ["frango", 0.15],
  ],
  economico: [
    ["alcatra", 0.25],
    ["fraldinha", 0.25],
    ["linguica", 0.25],
    ["frango", 0.25],
  ],
  premium: [
    ["picanha", 0.4],
    ["ancho", 0.25],
    ["costela", 0.2],
    ["linguica", 0.15],
  ],
} as const;
export const NOMES_CORTES: Record<string, string> = {
  picanha: "Picanha",
  contrafile: "Contrafilé",
  fraldinha: "Fraldinha",
  linguica: "Linguiça",
  frango: "Frango (coxa/sobrecoxa ou asa)",
  alcatra: "Alcatra",
  ancho: "Bife ancho",
  costela: "Costela",
};
export const POR_PESSOA = {
  paoDeAlho: 1.5,
  farofaG: 60,
  vinagreteG: 50,
  arrozCruG: 80,
  refrigeranteMl: 500,
  aguaMl: 400,
};
export const POR_ADULTO_QUE_BEBE = { cervejaMl: 1000, geloKg: 1 };
export const CARVAO_KG_POR_KG_CARNE = 1 / 1.5; // mínimo 3 kg; +50% se 6h+
export const SAL_GROSSO_G_POR_KG = 30;
export const FOLGA = 1.1;

export interface Entrada {
  homens: number;
  mulheres: number;
  criancas: number;
  adultosQueBebem: number;
  duracao: keyof typeof FATOR_DURACAO;
  preset: keyof typeof PRESETS;
  extras?: { queijoCoalho?: boolean; abacaxi?: boolean };
}
export interface Lista {
  pessoas: number;
  carneKg: number;
  porCorte: Array<{ corte: string; nome: string; kg: number }>;
  carvaoKg: number;
  carvaoSacos: string;
  salG: number;
  paoDeAlho: number;
  farofaKg: number;
  vinagreteKg: number;
  arrozKg: number;
  cervejaL: number;
  cervejaLatas: number;
  refrigeranteL: number;
  aguaL: number;
  geloKg: number;
  queijoCoalhoUn: number;
  abacaxiUn: number;
}

const up = (v: number, step: number) => Math.ceil(v / step - 1e-9) * step;

export function calcularChurrasco(e: Entrada): Lista {
  const homens = Math.max(0, e.homens);
  const mulheres = Math.max(0, e.mulheres);
  const criancas = Math.max(0, e.criancas);
  const pessoas = homens + mulheres + criancas;
  const bebem = Math.min(Math.max(0, e.adultosQueBebem), homens + mulheres);
  const f = FATOR_DURACAO[e.duracao] * FOLGA;
  const carneG = (homens * GRAMAS.homem + mulheres * GRAMAS.mulher + criancas * GRAMAS.crianca) * f;
  const carneKg = up(carneG / 1000, 0.1);
  const porCorte = PRESETS[e.preset].map(([corte, p]) => ({
    corte,
    nome: NOMES_CORTES[corte] ?? corte,
    kg: up((carneKg * p) as number, 0.1),
  }));
  let carvaoKg = Math.max(3, carneKg * CARVAO_KG_POR_KG_CARNE);
  if (e.duracao === "6h+") carvaoKg *= 1.5;
  carvaoKg = up(carvaoKg, 1);
  const sacos5 = Math.floor(carvaoKg / 5);
  const resto = carvaoKg - sacos5 * 5;
  const sacos3 = resto > 0 ? Math.ceil(resto / 3) : 0;
  const carvaoSacos = [
    sacos5 ? `${sacos5} saco(s) de 5 kg` : "",
    sacos3 ? `${sacos3} saco(s) de 3 kg` : "",
  ]
    .filter(Boolean)
    .join(" + ");
  const cervejaL = up((bebem * POR_ADULTO_QUE_BEBE.cervejaMl * f) / 1000, 0.35);
  return {
    pessoas,
    carneKg,
    porCorte,
    carvaoKg,
    carvaoSacos,
    salG: up(carneKg * SAL_GROSSO_G_POR_KG, 50),
    paoDeAlho: Math.ceil(pessoas * POR_PESSOA.paoDeAlho),
    farofaKg: up((pessoas * POR_PESSOA.farofaG) / 1000, 0.5),
    vinagreteKg: up((pessoas * POR_PESSOA.vinagreteG) / 1000, 0.25),
    arrozKg: up((pessoas * POR_PESSOA.arrozCruG) / 1000, 0.5),
    cervejaL,
    cervejaLatas: Math.ceil(cervejaL / 0.35 / 12) * 12,
    refrigeranteL: up((pessoas * POR_PESSOA.refrigeranteMl) / 1000, 2),
    aguaL: up((pessoas * POR_PESSOA.aguaMl) / 1000, 1.5),
    geloKg: Math.max(bebem > 0 ? 2 : 0, up(bebem * POR_ADULTO_QUE_BEBE.geloKg, 2)),
    queijoCoalhoUn: e.extras?.queijoCoalho ? Math.ceil(pessoas / 2) : 0,
    abacaxiUn: e.extras?.abacaxi ? Math.ceil(pessoas / 8) : 0,
  };
}

export function listaComoTexto(l: Lista): string {
  const linhas = [
    `Lista de compras do churrasco (${l.pessoas} pessoas)`,
    `Carne: ${l.carneKg.toFixed(1)} kg`,
    ...l.porCorte.map((c) => `  - ${c.nome}: ${c.kg.toFixed(1)} kg`),
    `Carvão: ${l.carvaoKg} kg (${l.carvaoSacos})`,
    `Sal grosso: ${l.salG} g`,
    `Pão de alho: ${l.paoDeAlho} un`,
    `Farofa: ${l.farofaKg.toFixed(1)} kg · Vinagrete: ${l.vinagreteKg.toFixed(2)} kg · Arroz: ${l.arrozKg.toFixed(1)} kg`,
    l.cervejaL > 0 ? `Cerveja: ${l.cervejaL.toFixed(1)} L (${l.cervejaLatas} latas)` : "",
    `Refrigerante: ${l.refrigeranteL} L · Água: ${l.aguaL.toFixed(1)} L · Gelo: ${l.geloKg} kg`,
    l.queijoCoalhoUn ? `Queijo coalho: ${l.queijoCoalhoUn} espetos` : "",
    l.abacaxiUn ? `Abacaxi: ${l.abacaxiUn} un` : "",
    "Gerado em vocacaodepai.com.br/ferramentas/calculadora-de-churrasco",
  ];
  return linhas.filter(Boolean).join("\n");
}
