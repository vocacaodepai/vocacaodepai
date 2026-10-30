import data from "./vacinas-data.json" with { type: "json" };

// Calendário de vacinação (doc 06 §3.14): dados próprios do Calendário Nacional de Vacinação (vacinas-data.json).
export interface DoseVacina {
  id: string;
  vacina: string;
  dose: string;
  idadeMeses: number;
  ateMeses?: number;
  protege: string;
  obs?: string;
}
export const VACINAS = data as unknown as {
  atualizado_em: string;
  fonte: { nome: string; url: string; nota: string };
  doses: DoseVacina[];
};
export const DOSES: DoseVacina[] = VACINAS.doses;
export const ATUALIZADO_EM = VACINAS.atualizado_em;

export type EstadoDose =
  "feita" | "no-prazo" | "proxima" | "atrasada" | "fora-da-janela" | "futura";

const DAY = 86400000;

/** Idade em meses (decimal) na data `hoje`. */
export function idadeEmMeses(nascimento: string, hoje = new Date()): number {
  const n = new Date(`${nascimento}T12:00:00Z`).getTime();
  return Math.max(0, (hoje.getTime() - n) / (DAY * 30.4375));
}

/** Data (YYYY-MM-DD) em que a dose entra no prazo. */
export function dataDaDose(nascimento: string, dose: DoseVacina): string {
  const n = new Date(`${nascimento}T12:00:00Z`);
  const d = new Date(n.getTime() + dose.idadeMeses * 30.4375 * DAY);
  return d.toISOString().slice(0, 10);
}

/**
 * Regras (doc 06 §3.14): feita → marcada; fora-da-janela → passou `ateMeses`; atrasada → idade > idadeMeses + 1 mês;
 * no-prazo → idade entre idadeMeses e idadeMeses + 1; proxima → falta menos de 2 meses; futura → o resto.
 */
export function estadoDaDose(dose: DoseVacina, idadeMeses: number, feita: boolean): EstadoDose {
  if (feita) return "feita";
  if (dose.ateMeses != null && idadeMeses > dose.ateMeses) return "fora-da-janela";
  if (idadeMeses > dose.idadeMeses + 1)
    return dose.dose === "anual" || dose.dose.includes("10 anos") ? "no-prazo" : "atrasada";
  if (idadeMeses >= dose.idadeMeses) return "no-prazo";
  if (dose.idadeMeses - idadeMeses <= 2) return "proxima";
  return "futura";
}

export function diasAte(nascimento: string, dose: DoseVacina, hoje = new Date()): number {
  const alvo = new Date(`${dataDaDose(nascimento, dose)}T12:00:00Z`).getTime();
  return Math.ceil((alvo - hoje.getTime()) / DAY);
}

const pad = (n: number) => String(n).padStart(2, "0");
const icsDate = (iso: string) => iso.replace(/-/g, "");

/** Arquivo .ics com um evento (dia inteiro) por dose e alarme 3 dias antes. */
export function gerarIcs(nascimento: string, doses: DoseVacina[], nome = "seu filho"): string {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const ev = doses.map((d) => {
    const dt = dataDaDose(nascimento, d);
    const next = new Date(new Date(`${dt}T12:00:00Z`).getTime() + DAY).toISOString().slice(0, 10);
    return [
      "BEGIN:VEVENT",
      `UID:vdp-vacina-${d.id}-${nascimento}@vocacaodepai.com.br`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(dt)}`,
      `DTEND;VALUE=DATE:${icsDate(next)}`,
      `SUMMARY:Vacina de ${nome}: ${d.vacina} (${d.dose})`,
      `DESCRIPTION:Protege contra ${d.protege}. Leve a caderneta à UBS. Vocação de Pai.`,
      "BEGIN:VALARM",
      "TRIGGER:-P3D",
      "ACTION:DISPLAY",
      `DESCRIPTION:Em 3 dias: ${d.vacina} (${d.dose})`,
      "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vocacao de Pai//Calendario de vacinacao//PT",
    "CALSCALE:GREGORIAN",
    ...ev,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function rotuloIdade(meses: number): string {
  if (meses === 0) return "Ao nascer";
  if (meses < 24) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  const anos = Math.floor(meses / 12);
  return `${anos} anos`;
}
