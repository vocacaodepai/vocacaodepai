// Configuração global do site (usada em canonical, OG/Twitter, sitemap, JSON-LD,
// e-mails e rodapé). Nomes e slogans fixos do doc 00 §7.9 / §12.
export const SITE_NAME = "Vocação de Pai";
export const SITE_URL: string = import.meta.env.PUBLIC_SITE_URL || "https://vocacaodepai.com.br";
// Slogan escolhido (doc 00 §7.9): entra no <title> da home e na assinatura do rodapé.
export const SITE_TAGLINE = "Para o homem que segura a casa";
// Meta description padrão da home (doc 00 §7.9, slogan 5).
export const SITE_DESCRIPTION =
  "Do berço ao churrasco, tudo o que um pai precisa saber: paternidade por fase, casamento, dinheiro, fé, ferramentas, reviews honestos e uma irmandade de pais.";
export const SITE_OG_IMAGE = `${SITE_URL}/og-default.jpg`; // gerar na etapa 6.6
export const DEFAULT_AUTHOR = "Bruno Danello";
export const SITE_GROUP = "Grupo VDP";
// Assinatura fixa do rodapé (doc 00 §7.9).
export const SITE_FOOTER_SIGNATURE = `${SITE_NAME} — ${SITE_TAGLINE}. Um site do grupo VDP, irmão do Vocação de Mãe.`;

// O "casal de sites" (doc 00 §9.1): link natural, rel="noopener" sem nofollow.
export const VDM_NAME = "Vocação de Mãe";
export const VDM_URL = "https://vocacaodemae.com.br";

// E-mail (doc 02 §8: remetente e destino são constantes, não variáveis de ambiente).
export const CONTACT_EMAIL = "contato@vocacaodepai.com.br";
export const EMAIL_FROM = `${SITE_NAME} <${CONTACT_EMAIL}>`;

// Redes sociais (preencher quando o dono criar os perfis; vazio = não aparece no rodapé).
export const SOCIAL_LINKS: { label: string; href: string }[] = [];

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function formatDateShort(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
