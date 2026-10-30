// Utilities for working with TipTap JSON documents.

export interface TipTapNode {
  type?: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
}

/** Walk a TipTap doc and return the plain text content. */
export function jsonToPlainText(doc: TipTapNode | null | undefined): string {
  if (!doc) return "";
  let out = "";
  const walk = (node: TipTapNode) => {
    if (node.type === "text" && node.text) {
      out += node.text + " ";
    }
    if (node.content) {
      node.content.forEach(walk);
    }
  };
  walk(doc);
  return out.trim();
}

export interface Heading {
  level: number;
  text: string;
  id: string;
}

/** Extract H2/H3 headings from a TipTap doc (for the table of contents). */
export function extractHeadings(doc: TipTapNode | null | undefined): Heading[] {
  if (!doc || !Array.isArray(doc.content)) return [];
  const headings: Heading[] = [];
  let index = 0;
  for (const node of doc.content) {
    if (node.type === "heading") {
      const level = (node.attrs?.level as number) ?? 2;
      if (level >= 2 && level <= 3) {
        headings.push({
          level,
          text: jsonToPlainText(node),
          id: `secao-${index++}`,
        });
      }
    }
  }
  return headings;
}

/**
 * Deep-clone a TipTap doc adding stable id attributes to every H2/H3 node,
 * so the table of contents anchors match the rendered headings.
 */
export function addHeadingIds(doc: TipTapNode | null | undefined): TipTapNode | null {
  if (!doc) return null;
  let index = 0;
  const clone = (node: TipTapNode): TipTapNode => {
    const next: TipTapNode = { ...node };
    if (node.type === "heading" && ((node.attrs?.level as number) ?? 2) >= 2) {
      next.attrs = { ...(node.attrs ?? {}), id: `secao-${index++}` };
    }
    if (node.content) {
      next.content = node.content.map(clone);
    }
    return next;
  };
  return clone(doc);
}

/** Estimate reading time in minutes (pt-BR ~200 words/min). */
export function readingTime(doc: TipTapNode | null | undefined): number {
  const words = jsonToPlainText(doc).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** Build the searchable text stored in posts.search_content. */
export function buildSearchContent(
  title: string,
  subtitle: string | null | undefined,
  doc: TipTapNode | null | undefined,
  tags: string[] = [],
): string {
  return [title, subtitle, jsonToPlainText(doc), tags.join(" ")].filter(Boolean).join(" ");
}

/** Build the excerpt from the first paragraphs of a doc. */
export function buildExcerpt(doc: TipTapNode | null | undefined, maxLength = 220): string {
  const text = jsonToPlainText(doc);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/** HTML-escape a string for embedding in meta tags / XML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
