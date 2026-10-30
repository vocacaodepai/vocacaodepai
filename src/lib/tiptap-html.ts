// Renderiza o JSON do TipTap (coluna posts.body) em HTML estático.
//
// Substitui o editor TipTap no caminho de leitura: o HTML sai pronto no SSR
// (o Google vê o texto do artigo) e o leitor não baixa o ProseMirror. A saída
// espelha o renderHTML das extensões usadas no editor (StarterKit, Image,
// Link, Table, TaskList e os blocos customizados Callout/ToolEmbed/
// DecisorRapido/FotosModelos/ParaAEsposa), para que o CSS de .article-content
// .tiptap e o ToolEmbedHost continuem funcionando sem mudanças.

import type { TipTapNode } from "@/lib/content";

type Attrs = Record<string, unknown>;

interface Mark {
  type?: string;
  attrs?: Attrs;
}

interface RichNode extends TipTapNode {
  marks?: Mark[];
}

const ESCAPE: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPE[ch] ?? ch);
}

const SAFE_URL = /^(https?:|mailto:|tel:|\/(?!\/)|#)/i;

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return SAFE_URL.test(trimmed) ? trimmed : null;
}

function attr(name: string, value: unknown): string {
  if (value === null || value === undefined || value === false) return "";
  if (value === true) return ` ${name}`;
  return ` ${name}="${escapeHtml(value)}"`;
}

function attrs(pairs: Record<string, unknown>): string {
  return Object.entries(pairs)
    .map(([k, v]) => attr(k, v))
    .join("");
}

function plainText(node: RichNode): string {
  if (typeof node.text === "string") return node.text;
  return ((node.content ?? []) as RichNode[]).map(plainText).join(" ");
}

function renderChildren(node: RichNode): string {
  return (node.content ?? []).map((child) => renderNode(child as RichNode)).join("");
}

function renderMarks(text: string, marks: Mark[] | undefined): string {
  if (!marks || marks.length === 0) return text;
  // TipTap aplica a primeira mark por fora: [bold, italic] -> <strong><em>…</em></strong>
  return [...marks].reverse().reduce((inner, mark) => {
    const a = mark.attrs ?? {};
    switch (mark.type) {
      case "bold":
        return `<strong>${inner}</strong>`;
      case "italic":
        return `<em>${inner}</em>`;
      case "underline":
        return `<u>${inner}</u>`;
      case "strike":
        return `<s>${inner}</s>`;
      case "code":
        return `<code>${inner}</code>`;
      case "highlight":
        return `<mark>${inner}</mark>`;
      case "subscript":
        return `<sub>${inner}</sub>`;
      case "superscript":
        return `<sup>${inner}</sup>`;
      case "link": {
        const href = safeUrl(a.href);
        if (!href) return inner;
        return `<a${attrs({ href, target: a.target, rel: a.rel, class: a.class })}>${inner}</a>`;
      }
      default:
        return inner;
    }
  }, text);
}

// Rótulos do Semáforo do Pai (CLAUDE.md §6 e Callout.tsx):
// ok → "Sinal verde", warn → "Sinal de atenção", bad → "Sinal de alerta".
function calloutLabel(tone: string): string {
  if (tone === "ok") return "Sinal verde";
  if (tone === "bad") return "Sinal de alerta";
  if (tone === "tip") return "Dica";
  return "Sinal de atenção";
}

// No Padrão A o texto do callout já começa com "Sinal verde: " etc. Como o
// rótulo aparece no box, o prefixo repetido é retirado do primeiro texto.
function stripCalloutPrefix(node: RichNode, label: string): RichNode {
  const prefix = `${label}: `;
  const first = node.content?.[0] as RichNode | undefined;
  const text = first?.content?.[0] as RichNode | undefined;
  if (!first || !text || typeof text.text !== "string") return node;
  if (!text.text.toLowerCase().startsWith(prefix.toLowerCase())) return node;
  const trimmedText: RichNode = { ...text, text: text.text.slice(prefix.length) };
  const trimmedFirst: RichNode = {
    ...first,
    content: [trimmedText, ...(first.content ?? []).slice(1)],
  };
  return { ...node, content: [trimmedFirst, ...(node.content ?? []).slice(1)] };
}

function jsonAttr(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value ?? null);
}

function renderNode(node: RichNode): string {
  const a = (node.attrs ?? {}) as Attrs;
  switch (node.type) {
    case "doc":
      return renderChildren(node);
    case "text":
      return renderMarks(escapeHtml(node.text ?? ""), node.marks);
    case "paragraph":
      return `<p${attr("style", a.textAlign ? `text-align: ${a.textAlign}` : null)}>${renderChildren(node)}</p>`;
    case "heading": {
      const level = Math.min(6, Math.max(1, Number(a.level) || 2));
      return `<h${level}${attr("id", a.id)}>${renderChildren(node)}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${renderChildren(node)}</ul>`;
    case "orderedList":
      return `<ol${attr("start", a.start && a.start !== 1 ? a.start : null)}>${renderChildren(node)}</ol>`;
    case "listItem":
      return `<li>${renderChildren(node)}</li>`;
    case "taskList":
      return `<ul data-type="taskList">${renderChildren(node)}</ul>`;
    case "taskItem": {
      const checked = a.checked === true;
      return `<li data-type="taskItem" data-checked="${checked}"><label><input type="checkbox"${checked ? " checked" : ""}><span></span></label><div>${renderChildren(node)}</div></li>`;
    }
    case "blockquote":
      return `<blockquote>${renderChildren(node)}</blockquote>`;
    case "horizontalRule":
      return "<hr>";
    case "hardBreak":
      return "<br>";
    case "codeBlock":
      return `<pre><code${attr("class", a.language ? `language-${a.language}` : null)}>${renderChildren(node)}</code></pre>`;
    case "image": {
      const src = safeUrl(a.src);
      if (!src) return "";
      return `<img${attrs({ src, alt: a.alt ?? "", title: a.title, loading: "lazy", decoding: "async" })}>`;
    }
    case "table": {
      // Rótulos das colunas (1ª linha) viram data-label nas células: no celular
      // a tabela vira uma lista de cartões e cada valor mostra o seu rótulo.
      const rows = (node.content ?? []) as RichNode[];
      const labels = ((rows[0]?.content ?? []) as RichNode[]).map((c) => plainText(c).trim());
      const body = rows
        .map((row, ri) => {
          const cells = ((row.content ?? []) as RichNode[]).map((cell, ci) => {
            const isHead = cell.type === "tableHeader";
            const ca = (cell.attrs ?? {}) as Attrs;
            const colspan = Number(ca.colspan) > 1 ? Number(ca.colspan) : null;
            const rowspan = Number(ca.rowspan) > 1 ? Number(ca.rowspan) : null;
            const label = !isHead && ri > 0 ? labels[ci] || null : null;
            const tag = isHead ? "th" : "td";
            return `<${tag}${attrs({ colspan, rowspan, "data-label": label })}>${renderChildren(cell)}</${tag}>`;
          });
          return `<tr>${cells.join("")}</tr>`;
        })
        .join("");
      return `<div class="table-wrap"><table><tbody>${body}</tbody></table></div>`;
    }
    case "tableRow":
      return `<tr>${renderChildren(node)}</tr>`;
    case "tableHeader":
    case "tableCell": {
      const tag = node.type === "tableHeader" ? "th" : "td";
      const colspan = Number(a.colspan) > 1 ? Number(a.colspan) : null;
      const rowspan = Number(a.rowspan) > 1 ? Number(a.rowspan) : null;
      return `<${tag}${attrs({ colspan, rowspan })}>${renderChildren(node)}</${tag}>`;
    }
    case "callout": {
      const tone = typeof a.tone === "string" ? a.tone : "warn";
      const label = calloutLabel(tone);
      return `<div data-callout="" data-tone="${escapeHtml(tone)}" class="callout-box callout-${escapeHtml(tone)}"><div class="callout-label-wrap"><span class="callout-label">${label}</span></div><div class="callout-body">${renderChildren(stripCalloutPrefix(node, label))}</div></div>`;
    }
    case "paraAEsposa":
      // "Para a sua esposa: Vocação de Mãe" é renderizado em React (ParaAEsposa.tsx)
      // antes do "Continue lendo"; no HTML do corpo o nó não aparece.
      return "";
    case "toolEmbed": {
      const slug = typeof a.slug === "string" ? a.slug : "";
      return `<div data-tool-embed="" data-tool-slug="${escapeHtml(slug)}" class="tool-embed-placeholder">Ferramenta embutida: ${escapeHtml(slug)}</div>`;
    }
    case "decisorRapido":
      return `<div data-decisor="" data-decisor-json="${escapeHtml(jsonAttr(a.data))}" class="decisor-rapido-placeholder">Decisor rápido interativo</div>`;
    case "fotosModelos":
      return `<div data-fotos-modelos="" data-fotos-modelos-json="${escapeHtml(jsonAttr(a.data))}" class="fotos-modelos-placeholder">Fotos dos modelos (5 lado a lado)</div>`;
    case "buyCard":
      return `<div data-buy-card="" data-buy-card-json="${escapeHtml(jsonAttr(a.data))}" class="fotos-modelos-placeholder">Cartão Onde comprar</div>`;
    case "product":
      return `<div data-product="" data-product-json="${escapeHtml(jsonAttr(a.data))}" class="fotos-modelos-placeholder">Produto da Loja do Pai</div>`;
    case "galeriaProduto":
      return `<div data-galeria-produto="" data-galeria-produto-json="${escapeHtml(jsonAttr(a.data))}" class="fotos-modelos-placeholder">Galeria de fotos do produto</div>`;
    default:
      return renderChildren(node);
  }
}

/** Converte um documento TipTap em HTML pronto para dangerouslySetInnerHTML. */
export function tiptapToHtml(doc: TipTapNode | null | undefined): string {
  if (!doc || typeof doc !== "object") return "";
  return renderNode(doc as RichNode);
}

export interface ParaAEsposaData {
  slug: string;
  title: string;
}

/** Nó `paraAEsposa {slug, title}` do body (preenchido pela rotina, doc 03 §6.2). */
export function findParaAEsposa(doc: TipTapNode | null | undefined): ParaAEsposaData | null {
  const node = doc?.content?.find((n) => n.type === "paraAEsposa");
  const slug = node?.attrs?.["slug"];
  const title = node?.attrs?.["title"];
  if (typeof slug !== "string" || !slug.trim() || typeof title !== "string" || !title.trim()) {
    return null;
  }
  return { slug: slug.trim(), title: title.trim() };
}
