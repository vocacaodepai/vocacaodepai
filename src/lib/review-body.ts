import type { TipTapNode } from "@/lib/content";

export interface ReviewModelo {
  src: string;
  name: string;
  href: string;
  slug?: string;
}

/** Produtos do artigo do Pai Indica (vêm do bloco "fotos dos modelos"). */
export function reviewModelos(doc: TipTapNode | null | undefined): ReviewModelo[] {
  const node = doc?.content?.find((n) => n.type === "fotosModelos");
  const data = node?.attrs?.["data"] as { modelos?: ReviewModelo[] } | null | undefined;
  return Array.isArray(data?.modelos) ? data.modelos.filter((m) => m && m.href && m.name) : [];
}

const buyCard = (m: ReviewModelo): TipTapNode => ({
  type: "buyCard",
  attrs: { data: { name: m.name, photo: m.src, href: m.href } },
});

/**
 * Deixa o artigo do Pai Indica com o mesmo conforto do site Review Produtos,
 * sem reescrever o corpo salvo: troca a foto solta de cada produto por uma galeria
 * deslizante (todas as fotos do produto no mesmo retângulo), põe o cartão
 * "Onde comprar" no começo (review única) e no fim do artigo.
 */
export function enhanceReviewBody(doc: TipTapNode): TipTapNode {
  const nodes = doc.content ?? [];
  const modelos = reviewModelos(doc);
  if (modelos.length === 0) return doc;
  if (nodes.some((n) => n.type === "buyCard" || n.type === "galeriaProduto")) return doc;

  const bySrc = new Map(modelos.map((m) => [m.src, m]));
  const out: TipTapNode[] = [];
  let topCardDone = modelos.length !== 1;

  for (const n of nodes) {
    if (!topCardDone && n.type === "heading") {
      out.push(buyCard(modelos[0]!));
      topCardDone = true;
    }
    const src = typeof n.attrs?.["src"] === "string" ? (n.attrs["src"] as string) : "";
    const m = n.type === "image" ? bySrc.get(src) : undefined;
    if (m?.slug) {
      out.push({ type: "galeriaProduto", attrs: { data: { slug: m.slug, nome: m.name } } });
      continue;
    }
    out.push(n);
  }

  if (modelos.length === 1) {
    out.push(buyCard(modelos[0]!));
  } else {
    out.push({
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Onde comprar" }],
    });
    for (const m of modelos) out.push(buyCard(m));
  }
  return { ...doc, content: out };
}
