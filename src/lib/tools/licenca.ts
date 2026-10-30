import regras from "./licenca-regras.json" with { type: "json" };

// Cálculo da licença-paternidade (doc 06 §3.4). O JSON é a única fonte das regras.
export interface Regime {
  id: string;
  nome: string;
  dias: number | null;
  contagem: string;
  base: string;
  inicio: string;
  aviso: string;
}
export const REGRAS = regras as {
  atualizado_em: string;
  fontes: Array<{ nome: string; url: string }>;
  regimes: Regime[];
  marcos_legais: Array<{ vigencia: string; dias_clt: number; base: string }>;
  feriados_nacionais: string[];
};

const DAY = 86400000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(`${s}T00:00:00Z`);

export const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

export function isFeriado(d: Date) {
  return REGRAS.feriados_nacionais.includes(iso(d).slice(5));
}
export function isDiaUtil(d: Date) {
  const wd = d.getUTCDay();
  return wd !== 0 && wd !== 6 && !isFeriado(d);
}
export function proximoDiaUtil(d: Date) {
  let x = d;
  while (!isDiaUtil(x)) x = addDays(x, 1);
  return x;
}
/** Soma n dias úteis a partir de d (exclusivo). */
export function addDiasUteis(d: Date, n: number) {
  let x = d;
  let c = 0;
  while (c < n) {
    x = addDays(x, 1);
    if (isDiaUtil(x)) c++;
  }
  return x;
}

/** Marco legal da CLT que vale na data informada (10 dias em 2027, 15 em 2028, 20 em 2029). */
export function marcoVigente(nascimento: string) {
  return [...REGRAS.marcos_legais].reverse().find((m) => nascimento >= m.vigencia) ?? null;
}

export interface LicencaEntrada {
  regime: string;
  nascimento: string; // YYYY-MM-DD
  diasManuais?: number;
  empresaCidada?: boolean;
}

export function calcularLicenca(e: LicencaEntrada) {
  const regime = REGRAS.regimes.find((r) => r.id === e.regime) ?? REGRAS.regimes[0];
  const marco = marcoVigente(e.nascimento);
  let dias = regime.dias ?? e.diasManuais ?? 0;
  let baseLegal = regime.base;
  if (regime.id === "clt" && marco) {
    dias = marco.dias_clt;
    baseLegal = marco.base;
  }
  if (regime.id === "clt-empresa-cidada" && marco) {
    dias = marco.dias_clt + 15; // lei geral + 15 dias de prorrogação do programa
    baseLegal = `${marco.base}; + 15 dias da Lei 11.770/2008`;
  }
  const nasc = utc(e.nascimento);
  const inicio =
    regime.id === "servidor-federal" || regime.id === "autonomo"
      ? nasc
      : proximoDiaUtil(addDays(nasc, 1));
  const fim = dias > 0 ? addDays(inicio, dias - 1) : inicio;
  const retorno = dias > 0 ? proximoDiaUtil(addDays(fim, 1)) : proximoDiaUtil(addDays(nasc, 1));
  const prazoProrrogacao = regime.id === "clt-empresa-cidada" ? addDiasUteis(nasc, 2) : null;
  return {
    regime,
    dias,
    baseLegal,
    marco,
    inicio: iso(inicio),
    fim: iso(fim),
    retorno: iso(retorno),
    prazoProrrogacao: prazoProrrogacao ? iso(prazoProrrogacao) : null,
    nascimentoFimDeSemana: !isDiaUtil(addDays(nasc, 1)),
  };
}
