// Funções puras de finanças (doc 06 §3.8–§3.10). Sem React, sem imports com alias: testáveis em Node.

export interface JurosEntrada {
  inicial: number;
  aporteMensal: number;
  taxaAnual: number;
  meses: number;
  inflacaoAnual?: number;
}
export interface JurosPonto {
  mes: number;
  aportado: number;
  juros: number;
  saldo: number;
}

export const taxaMensal = (anual: number) => (1 + anual / 100) ** (1 / 12) - 1;

export function jurosCompostos(e: JurosEntrada): {
  serie: JurosPonto[];
  final: number;
  aportado: number;
  juros: number;
  finalReal: number | null;
} {
  const i = taxaMensal(e.taxaAnual);
  const serie: JurosPonto[] = [];
  let saldo = e.inicial;
  let aportado = e.inicial;
  for (let m = 1; m <= e.meses; m++) {
    saldo = saldo * (1 + i) + e.aporteMensal;
    aportado += e.aporteMensal;
    serie.push({ mes: m, aportado, juros: saldo - aportado, saldo });
  }
  const finalReal =
    e.inflacaoAnual != null ? saldo / (1 + e.inflacaoAnual / 100) ** (e.meses / 12) : null;
  return { serie, final: saldo, aportado, juros: saldo - aportado, finalReal };
}

/** Semáforo do simulador: taxa ≤ CDI + 2 p.p. ok; acima warn; > 30% a.a. bad. */
export function semaforoTaxa(taxaAnual: number, cdiAnual: number | null): "ok" | "warn" | "bad" {
  if (taxaAnual > 30) return "bad";
  const ref = cdiAnual ?? 12;
  return taxaAnual <= ref + 2 ? "ok" : "warn";
}

export type TipoRenda = "clt" | "servidor" | "autonomo";
export interface ReservaEntrada {
  gastoMensal: number;
  tipoRenda: TipoRenda;
  dependentes: number;
  guardado: number;
  aporteMensal: number;
  taxaAnual?: number;
}
export const MESES_BASE: Record<TipoRenda, [number, number]> = {
  clt: [3, 6],
  servidor: [3, 4],
  autonomo: [6, 12],
};

export function reservaEmergencia(e: ReservaEntrada) {
  const extra = Math.min(Math.max(e.dependentes, 0), 3);
  const [bMin, bMax] = MESES_BASE[e.tipoRenda];
  const mesesMin = bMin + extra;
  const mesesMax = bMax + extra;
  const metaMin = e.gastoMensal * mesesMin;
  const metaMax = e.gastoMensal * mesesMax;
  const falta = Math.max(metaMin - e.guardado, 0);
  const i = taxaMensal(e.taxaAnual ?? 0);
  const mesesPara = (meta: number): number | null => {
    if (e.guardado >= meta) return 0;
    if (e.aporteMensal <= 0) return null;
    let saldo = e.guardado;
    for (let m = 1; m <= 1200; m++) {
      saldo = saldo * (1 + i) + e.aporteMensal;
      if (saldo >= meta) return m;
    }
    return null;
  };
  return {
    mesesMin,
    mesesMax,
    metaMin,
    metaMax,
    falta,
    mesesParaMetaMin: mesesPara(metaMin),
    mesesParaMetaMax: mesesPara(metaMax),
  };
}

/** Pensão: faixas observadas na prática forense (CC art. 1.694 §1º: necessidade × possibilidade; não há % legal). */
export const FAIXAS_PENSAO: Array<{ filhosMin: number; pct: [number, number] }> = [
  { filhosMin: 1, pct: [15, 25] },
  { filhosMin: 2, pct: [25, 33] },
  { filhosMin: 3, pct: [33, 40] },
];
export const REDUCAO_GUARDA_COMPARTILHADA = 5; // p.p.

export function pensaoEstimativa(e: {
  rendaLiquida: number;
  filhos: number;
  guarda: "compartilhada" | "unilateral";
  custosFixosFilho?: number;
}) {
  const n = Math.max(1, Math.floor(e.filhos));
  const faixa = [...FAIXAS_PENSAO].reverse().find((f) => n >= f.filhosMin)!.pct;
  const pctMin = faixa[0];
  const pctMax = faixa[1];
  const valor = (p: number) => (e.rendaLiquida * p) / 100;
  const reduzida: [number, number] | null =
    e.guarda === "compartilhada"
      ? [
          Math.max(pctMin - REDUCAO_GUARDA_COMPARTILHADA, 5),
          Math.max(pctMax - REDUCAO_GUARDA_COMPARTILHADA, 10),
        ]
      : null;
  return {
    filhos: n,
    pctMin,
    pctMax,
    totalMin: valor(pctMin),
    totalMax: valor(pctMax),
    porFilhoMin: valor(pctMin) / n,
    porFilhoMax: valor(pctMax) / n,
    reduzida: reduzida
      ? {
          pctMin: reduzida[0],
          pctMax: reduzida[1],
          totalMin: valor(reduzida[0]),
          totalMax: valor(reduzida[1]),
        }
      : null,
    custosFixosFilho: e.custosFixosFilho ?? null,
  };
}
