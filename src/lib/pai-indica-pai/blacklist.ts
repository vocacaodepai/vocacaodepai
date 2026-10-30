// Lista negra de domínios e termos (doc 08 §7.3). Case-insensitive, sem acento.
// Extensível pela env PIP_BLACKLIST_EXTRA (CSV) só no servidor.

const DOMAINS = [
  "bit.ly",
  "t.me",
  "wa.link",
  "tinyurl.com",
  "cutt.ly",
  "is.gd",
  "rb.gy",
  "shorturl.at",
  "encurtador.com.br",
  "linktr.ee",
];

const TERMS = [
  "renda extra garantida",
  "ganhe sem sair de casa",
  "ganhos garantidos",
  "deposito",
  "taxa de inscricao",
  "taxa de cadastro",
  "pix para",
  "aposta",
  "cassino",
  "bet",
  "adulto",
  "massagem",
  "sugar",
  "marketing multinivel",
  "mmn",
  "hinode",
  "herbalife",
  "fique rico",
  "agiota",
  "emprestimo facil",
];

/** Palavrões e vulgaridade (linha editorial, CLAUDE.md §3). Mantida curta e sem acento. */
const PALAVROES_BR = ["porra", "caralho", "puta", "foda", "merda", "viado", "buceta", "cu "];

const normalize = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extraTerms(): string[] {
  const raw = typeof process !== "undefined" ? process.env["PIP_BLACKLIST_EXTRA"] : undefined;
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => normalize(t.trim()))
    .filter(Boolean);
}

/** Devolve o termo encontrado (para a mensagem CONTEUDO_BLOQUEADO) ou null. */
export function containsBlacklisted(texts: Array<string | null | undefined>): string | null {
  const haystack = normalize(texts.filter(Boolean).join("\n"));
  for (const d of DOMAINS) {
    if (haystack.includes(d)) return d;
  }
  for (const t of [...TERMS, ...PALAVROES_BR, ...extraTerms()]) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRe(t.trim())}($|[^a-z0-9])`, "i");
    if (re.test(haystack)) return t.trim();
  }
  if (/\.xyz(\/|\s|$)/i.test(haystack)) return ".xyz";
  return null;
}
