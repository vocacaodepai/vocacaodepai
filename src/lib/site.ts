// Configuração global do site (usada em canonical, OG/Twitter, sitemap e JSON-LD).
export const SITE_NAME = "Vocação de Pai";
export const SITE_URL = "https://vocacaodepai.com.br";
export const SITE_DESCRIPTION =
  "Paternidade, família e formação do homem: guias práticos para ser um pai presente, um marido firme e um provedor consciente.";
export const SITE_OG_IMAGE = `${SITE_URL}/og-default.jpg`; // gerar na etapa 6.6
export const DEFAULT_AUTHOR = "Bruno Danello";
export const SITE_TAGLINE = "Para o homem que quer ser um pai melhor";

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
