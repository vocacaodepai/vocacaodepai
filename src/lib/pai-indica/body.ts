// Preparo do body Tiptap de um Pai Indica para renderização (doc 04 §5.2): enriquece os nós
// `fotosModelos`/`galeriaProduto`/`buyCard` com os dados reais de `products` (foto oficial,
// affiliate_url, faixa de preço) e divide o corpo em trechos para o React inserir os blocos
// estruturados (veredito, critérios, tabela, "Qual comprar") em posições fixas.
import type { TipTapNode } from "@/lib/content";
import { enhanceReviewBody } from "@/lib/review-body";
import { faixaCurta, replaceFaixa, withAffiliateTag } from "./price";
import type { PaiIndicaProduct } from "./types";

export interface ModeloData {
  src: string;
  name: string;
  href: string;
  slug?: string;
  faixa?: string;
}

function h2Text(node: TipTapNode): string | null {
  if (node.type !== "heading" || Number(node.attrs?.["level"] ?? 2) !== 2) return null;
  return (node.content ?? [])
    .map((n) => n.text ?? "")
    .join("")
    .trim();
}

type Mark = { type?: string; attrs?: Record<string, unknown> };

/** Troca `{FAIXA:slug}` nos textos e `{AMAZON:slug}` nos hrefs dos botões (affiliate_url real + tag). */
function replaceFaixaDeep(
  node: TipTapNode,
  faixas: Record<string, string>,
  hrefs: Record<string, string>,
): TipTapNode {
  const next: TipTapNode & { marks?: Mark[] } = { ...node };
  if (typeof node.text === "string" && node.text.includes("{FAIXA:"))
    next.text = replaceFaixa(node.text, faixas);
  const marks = (node as { marks?: Mark[] }).marks;
  if (Array.isArray(marks)) {
    next.marks = marks.map((m) => {
      const href = typeof m.attrs?.["href"] === "string" ? (m.attrs["href"] as string) : "";
      const am = /^\{AMAZON:([a-z0-9-]+)\}$/.exec(href);
      if (m.type !== "link" || !am) return m;
      return { ...m, attrs: { ...m.attrs, href: hrefs[am[1]!] ?? "#" } };
    });
  }
  if (node.content) next.content = node.content.map((n) => replaceFaixaDeep(n, faixas, hrefs));
  return next;
}

/**
 * Enriquecimento + `enhanceReviewBody` (galeria e cartões "Onde comprar"). Se o post ainda não tem
 * nó `fotosModelos` (seed antiga), cria um a partir dos produtos para o fluxo continuar igual.
 */
export function prepareBody(
  doc: TipTapNode,
  products: PaiIndicaProduct[],
  opts: { kind: "review" | "comparativo" | "lista"; dropFirstTable?: boolean },
): TipTapNode {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const faixas = Object.fromEntries(products.map((p) => [p.slug, faixaCurta(p)]));
  const hrefs = Object.fromEntries(
    products.map((p) => [p.slug, withAffiliateTag(p.affiliate_url ?? "")]),
  );
  let content = [...(doc.content ?? [])];

  const enrich = (m: Partial<ModeloData>): ModeloData => {
    const p = m.slug ? bySlug.get(m.slug) : undefined;
    return {
      slug: m.slug,
      name: m.name || p?.name || m.slug || "",
      src: m.src || p?.image_url || "",
      href: withAffiliateTag(m.href || p?.affiliate_url || ""),
      faixa: m.faixa || (p ? faixaCurta(p) : undefined),
    };
  };

  let hasFotos = false;
  content = content.map((n) => {
    if (n.type === "fotosModelos") {
      hasFotos = true;
      const data = (n.attrs?.["data"] ?? {}) as { modelos?: Partial<ModeloData>[] };
      const modelos = (data.modelos ?? []).map(enrich).filter((m) => m.name && m.href);
      return { ...n, attrs: { ...(n.attrs ?? {}), data: { ...data, modelos } } };
    }
    if (n.type === "galeriaProduto") {
      const data = (n.attrs?.["data"] ?? {}) as { slug?: string; nome?: string; images?: string[] };
      const p = data.slug ? bySlug.get(data.slug) : undefined;
      const images = data.images?.length ? data.images : (p?.images ?? []);
      return {
        ...n,
        attrs: { ...(n.attrs ?? {}), data: { ...data, nome: data.nome ?? p?.name, images } },
      };
    }
    if (n.type === "buyCard") {
      const data = (n.attrs?.["data"] ?? {}) as Partial<ModeloData> & { photo?: string };
      const m = enrich({ ...data, src: data.photo ?? data.src });
      return {
        ...n,
        attrs: { ...(n.attrs ?? {}), data: { ...data, name: m.name, photo: m.src, href: m.href } },
      };
    }
    return n;
  });

  if (!hasFotos && products.length > 0) {
    const modelos = products.map((p) => enrich({ slug: p.slug }));
    // Logo depois de "Em 3 pontos" (ou da abertura) para o leitor ver os modelos cedo.
    const idx = content.findIndex(
      (n, i) => i > 0 && h2Text(n) !== null && !/em 3 pontos/i.test(h2Text(n)!),
    );
    const node: TipTapNode = { type: "fotosModelos", attrs: { data: { modelos } } };
    if (idx > 0) content.splice(idx, 0, node);
    else content.push(node);
  }

  if (opts.dropFirstTable) {
    const t = content.findIndex((n) => n.type === "table");
    if (t >= 0) content.splice(t, 1);
  }

  const prepared = replaceFaixaDeep({ ...doc, content }, faixas, hrefs);
  // Galeria + "Onde comprar" (review única: cartão no começo e no fim; comparativo: um por produto no fim).
  const enhanced = enhanceReviewBody(prepared);
  // Galeria criada pelo enhanceReviewBody só traz slug/nome: completa as fotos.
  return {
    ...enhanced,
    content: (enhanced.content ?? []).map((n) => {
      if (n.type !== "galeriaProduto") return n;
      const data = (n.attrs?.["data"] ?? {}) as { slug?: string; nome?: string; images?: string[] };
      if (data.images?.length) return n;
      const p = data.slug ? bySlug.get(data.slug) : undefined;
      return { ...n, attrs: { ...(n.attrs ?? {}), data: { ...data, images: p?.images ?? [] } } };
    }),
  };
}

export type SplitPoint = { key: string; index: number };

/**
 * Pontos de inserção dos blocos React (índices no `content` do body):
 * - `afterIntro`: antes do 1º H2 que não é "Em 3 pontos" (depois da abertura + "Em 3 pontos" + fotos);
 * - `beforeQualComprar`: antes do H2 "Qual comprar";
 * - `afterComoAvaliamos`: antes do H2 seguinte a "Como avaliamos" (ou fim);
 * - `prosCons`: depois da seção "Pontos de atenção" (antes do H2 seguinte) ou antes de "Variação de preço".
 */
export function splitPoints(doc: TipTapNode): Record<string, number> {
  const content = doc.content ?? [];
  const out: Record<string, number> = {};
  const nextH2After = (i: number) => {
    for (let j = i + 1; j < content.length; j++) if (h2Text(content[j]!) !== null) return j;
    return content.length;
  };
  let atencao = -1;
  content.forEach((n, i) => {
    const t = h2Text(n);
    if (t === null) return;
    if (out["afterIntro"] === undefined && !/em 3 pontos/i.test(t)) out["afterIntro"] = i;
    if (/^qual comprar/i.test(t) && out["beforeQualComprar"] === undefined)
      out["beforeQualComprar"] = i;
    if (/^como avaliamos/i.test(t) && out["afterComoAvaliamos"] === undefined)
      out["afterComoAvaliamos"] = nextH2After(i);
    if (/pontos de aten[çc][ãa]o/i.test(t)) atencao = i;
    if (/^varia[çc][ãa]o de pre[çc]o/i.test(t) && out["beforeVariacao"] === undefined)
      out["beforeVariacao"] = i;
  });
  if (out["afterIntro"] === undefined) out["afterIntro"] = content.length;
  out["prosCons"] = atencao >= 0 ? nextH2After(atencao) : (out["beforeVariacao"] ?? content.length);
  return out;
}

/** Fatia o body em trechos entre os índices dados (ordenados), devolvendo [docParcial…]. */
export function sliceDoc(doc: TipTapNode, cuts: number[]): TipTapNode[] {
  const content = doc.content ?? [];
  const points = Array.from(
    new Set([0, ...cuts.filter((c) => c > 0 && c < content.length), content.length]),
  ).sort((a, b) => a - b);
  const out: TipTapNode[] = [];
  for (let i = 0; i < points.length - 1; i++)
    out.push({ ...doc, content: content.slice(points[i], points[i + 1]) });
  return out;
}
