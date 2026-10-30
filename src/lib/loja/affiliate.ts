// Links de afiliado da Loja do Pai (doc 05 §4.2 e §9). A tag entra no servidor
// (server functions), a partir de PUBLIC_AMAZON_TAG (CLAUDE.md §13); o cliente
// recebe o link pronto. Sem encurtador, sem cloaking.
import type { AffiliateNetwork } from "./types";

const AMAZON_RE = /amazon\.com\.br\/(?:[^/?#]+\/)?(?:dp|gp\/product)\/([A-Z0-9]{10})/i;
const DEFAULT_TAG = "vocacaodepai-20";

/** Tag do Amazon Associados BR. Só faz sentido no servidor (process.env). */
export function amazonTag(): string {
  const fromEnv =
    typeof process !== "undefined" && process.env ? process.env["PUBLIC_AMAZON_TAG"] : undefined;
  const tag = (fromEnv ?? "").trim();
  return tag && !tag.startsWith("<") ? tag : DEFAULT_TAG;
}

/** `https://www.amazon.com.br/dp/<ASIN>/?tag=<PUBLIC_AMAZON_TAG>` (CLAUDE.md §5.1). */
export function buildAmazonUrl(asin: string, tag = amazonTag()): string {
  return `https://www.amazon.com.br/dp/${asin.toUpperCase()}/?tag=${encodeURIComponent(tag)}`;
}

export function asinFromUrl(url: string | null | undefined): string | null {
  const m = url ? AMAZON_RE.exec(url) : null;
  return m ? m[1]!.toUpperCase() : null;
}

/**
 * Garante a tag atual no link salvo no banco. Chamar no server fn antes de devolver o
 * produto. Link de busca (sem ASIN, produto PENDENTE) só ganha a tag se ainda não tiver.
 */
export function normalizeAffiliate(p: {
  asin: string | null;
  affiliate_url: string | null;
  affiliate_network: string;
}): string {
  const url = p.affiliate_url ?? "";
  if (p.affiliate_network !== "amazon") return url;
  const asin = p.asin ?? asinFromUrl(url);
  if (asin) return buildAmazonUrl(asin);
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.get("tag")) u.searchParams.set("tag", amazonTag());
    return u.toString();
  } catch {
    return url;
  }
}

/** Texto do botão principal (doc 05 §9.2). Amazon: sempre "Comprar agora na Amazon". */
export function buyButtonLabel(network: AffiliateNetwork | string | null | undefined): string {
  switch (network) {
    case "mercadolivre":
      return "Comprar agora no Mercado Livre";
    case "shopee":
      return "Comprar agora na Shopee";
    case "magalu":
      return "Comprar agora no Magalu";
    case "outro":
      return "Comprar agora";
    default:
      return "Comprar agora na Amazon";
  }
}

export const MARKETPLACE_NAMES: Record<string, string> = {
  amazon: "Amazon",
  mercadolivre: "Mercado Livre",
  shopee: "Shopee",
  magalu: "Magalu",
};

/** Atributos fixos de todo link de afiliado (CLAUDE.md §5.1). */
export const AFFILIATE_REL = "sponsored nofollow noopener noreferrer";
