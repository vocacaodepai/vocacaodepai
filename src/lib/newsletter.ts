// Newsletter — constantes e helpers compartilhados entre cliente e servidor
// (nada de segredo aqui; o que é só servidor fica em newsletter.server.ts).

/** Versão do fluxo; sobe quando o texto de consentimento mudar. */
export const NEWSLETTER_CONSENT_VERSION = 1;

/** Origem do cadastro (`newsletter_subscribers.source` e `segments.origem`). */
export const NEWSLETTER_SOURCES = [
  "home",
  "post",
  "ferramenta",
  "cadastro",
  "loja",
  "rodape",
  "site",
] as const;
export type NewsletterSource = (typeof NEWSLETTER_SOURCES)[number];

/**
 * Caixa opcional "Minha esposa também quer receber o Vocação de Mãe" (doc 00 §9.1 item 8).
 * A API de newsletter do Vocação de Mãe ainda não aceita o POST com o segmento
 * `indicado-pelo-marido`; até lá a caixa fica escondida (doc 03 §4.6 item 3) e o
 * endpoint abaixo fica vazio. Quando a API existir: preencher a URL e ligar a flag.
 */
export const VDM_NEWSLETTER_ENDPOINT = "";
export const SPOUSE_NEWSLETTER_ENABLED = VDM_NEWSLETTER_ENDPOINT.length > 0;
export const VDM_SPOUSE_SEGMENT = "indicado-pelo-marido";

/** Site key pública do Cloudflare Turnstile (chega ao cliente via envPrefix). Vazia = widget não renderiza. */
export const TURNSTILE_SITE_KEY: string = import.meta.env.TURNSTILE_SITE_KEY || "";

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Corpo do POST /api/newsletter (JSON). */
export interface NewsletterSubscribeInput {
  email: string;
  source?: string;
  /** Honeypot: campo invisível que humanos deixam vazio. */
  website?: string;
  /** Timestamp (ms) de quando o formulário foi montado; envio rápido demais = robô. */
  startedAt?: number;
  /** Token do widget Turnstile (opcional quando não há chave configurada). */
  turnstileToken?: string;
  /** E-mail da esposa, só quando SPOUSE_NEWSLETTER_ENABLED. */
  spouseEmail?: string;
}

/** Resposta genérica da API — nunca revela se o e-mail já existia. */
export interface NewsletterSubscribeResult {
  ok: boolean;
  message: string;
}

export const NEWSLETTER_GENERIC_OK =
  "Verifique seu e-mail: enviamos um link para confirmar a inscrição.";
