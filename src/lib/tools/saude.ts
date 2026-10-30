// IMC e gasto calórico (doc 06 §3.16): OMS para IMC e cintura; Mifflin-St Jeor para TMB.
export const imc = (kg: number, cm: number) => kg / (cm / 100) ** 2;

export const classeImc = (v: number) =>
  v < 18.5
    ? "abaixo do peso"
    : v < 25
      ? "peso adequado"
      : v < 30
        ? "sobrepeso"
        : v < 35
          ? "obesidade grau I"
          : v < 40
            ? "obesidade grau II"
            : "obesidade grau III";

export const tmbMifflin = (kg: number, cm: number, idade: number, sexo: "homem" | "mulher") =>
  10 * kg + 6.25 * cm - 5 * idade + (sexo === "homem" ? 5 : -161);

export const FATOR_ATIVIDADE = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  intenso: 1.725,
  atleta: 1.9,
} as const;
export type NivelAtividade = keyof typeof FATOR_ATIVIDADE;

export const gastoDiario = (tmb: number, nivel: NivelAtividade) => tmb * FATOR_ATIVIDADE[nivel];

export const metaCalorica = (get: number, objetivo: "manter" | "perder" | "ganhar") =>
  objetivo === "manter" ? get : objetivo === "perder" ? get - 500 : get + 300;

export const aguaDiariaMl = (kg: number) => kg * 35;

/** Cintura (OMS): homem > 94 cm atenção, > 102 cm risco aumentado; mulher > 80 / > 88. */
export function riscoCintura(
  cm: number | null,
  sexo: "homem" | "mulher",
): "ok" | "warn" | "bad" | null {
  if (cm == null || !Number.isFinite(cm) || cm <= 0) return null;
  const [a, b] = sexo === "homem" ? [94, 102] : [80, 88];
  return cm > b ? "bad" : cm > a ? "warn" : "ok";
}

export function semaforoSaude(
  imcValor: number,
  cintura: number | null,
  sexo: "homem" | "mulher",
): "ok" | "warn" | "bad" {
  const rc = riscoCintura(cintura, sexo);
  if (imcValor >= 30 || rc === "bad") return "bad";
  if (imcValor >= 25 || imcValor < 18.5 || rc === "warn") return "warn";
  return "ok";
}
