// Blacklist de termos e links da Irmandade (doc 09 §3.2 e §4.1; mesma linha do doc 08 §7.3).
// Texto bloqueado → erro CONTEUDO_BLOQUEADO ("Seu texto tem termo ou link que não aceitamos").
const TERMOS_BLOQUEADOS = [
  "renda extra",
  "ganhe dinheiro",
  "fique rico",
  "pirâmide",
  "marketing multinível",
  "bet365",
  "aposta",
  "cassino",
  "bitcoin grátis",
  "clique aqui e ganhe",
  "whatsapp.com/",
  "wa.me/",
  "bit.ly/",
  "tinyurl.com/",
  "t.me/",
  "amzn.to/",
  "tag=",
  "porn",
  "sexo",
  "nudes",
  "onlyfans",
];

const ENCURTADORES = /(bit\.ly|tinyurl\.com|t\.me|wa\.me|amzn\.to|cutt\.ly|goo\.gl)\//i;

export class ConteudoBloqueadoError extends Error {
  constructor() {
    super("CONTEUDO_BLOQUEADO");
    this.name = "ConteudoBloqueadoError";
  }
}

export function findBlockedTerm(text: string): string | null {
  const t = text.toLowerCase();
  for (const termo of TERMOS_BLOQUEADOS) if (t.includes(termo)) return termo;
  if (ENCURTADORES.test(text)) return "link encurtado";
  return null;
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\//g) ?? []).length;
}

/** Lança CONTEUDO_BLOQUEADO se houver termo proibido, encurtador ou mais de `maxLinks` links. */
export function assertCleanText(text: string, maxLinks = 2): void {
  if (findBlockedTerm(text) || countLinks(text) > maxLinks) throw new ConteudoBloqueadoError();
}

export const MENSAGEM_BLOQUEIO =
  "Seu texto tem termo ou link que não aceitamos. Revise e tente de novo.";
