// Helpers de Tiptap para os specs do seed (importados por gen.mjs e por posts/*.mjs; sem efeito colateral).
// ---------------------------------------------------------------- Tiptap
const link = (href) => ({
  type: "link",
  attrs: { href, class: null, rel: null, target: null },
});
const btnMark = (href) => ({
  type: "link",
  attrs: { href, class: "btn-comprar", rel: "sponsored nofollow noopener", target: "_blank" },
});
export function inline(md) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  for (const m of md.matchAll(re)) {
    if (m.index > last) out.push({ type: "text", text: md.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**"))
      out.push({ type: "text", text: tok.slice(2, -2), marks: [{ type: "bold" }] });
    else {
      const [, t, h] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(tok);
      out.push({ type: "text", text: t, marks: [link(h)] });
    }
    last = m.index + tok.length;
  }
  if (last < md.length) out.push({ type: "text", text: md.slice(last) });
  return out;
}
export const p = (md) => ({ type: "paragraph", content: inline(md) });
export const h2 = (t) => ({
  type: "heading",
  attrs: { level: 2 },
  content: [{ type: "text", text: t }],
});
export const h3 = (t) => ({
  type: "heading",
  attrs: { level: 3 },
  content: [{ type: "text", text: t }],
});
export const ul = (items) => ({
  type: "bulletList",
  content: items.map((i) => ({ type: "listItem", content: [p(i)] })),
});
export const ol = (items) => ({
  type: "orderedList",
  content: items.map((i) => ({ type: "listItem", content: [p(i)] })),
});
export const btn = (slug, name) => ({
  type: "paragraph",
  attrs: { class: "btn-comprar-wrap" },
  content: [
    {
      type: "text",
      text: name ? `Comprar ${name} agora na Amazon` : "Comprar agora na Amazon",
      marks: [btnMark(`{AMAZON:${slug}}`)],
    },
  ],
});
export const callout = (tone, text) => ({ type: "callout", attrs: { tone }, content: [p(text)] });
export const semaforo = (tema, ok, warn, bad) => [
  h2(`Semáforo do pai: ${tema}`),
  callout("ok", `Sinal verde: ${ok}`),
  callout("warn", `Sinal de atenção: ${warn}`),
  callout("bad", `Sinal de alerta: ${bad}`),
];
export const table = (cols, rows) => ({
  type: "table",
  content: [
    {
      type: "tableRow",
      content: cols.map((c) => ({
        type: "tableHeader",
        attrs: { colspan: 1, rowspan: 1 },
        content: [p(c)],
      })),
    },
    ...rows.map((r) => ({
      type: "tableRow",
      content: r.map((c) => ({
        type: "tableCell",
        attrs: { colspan: 1, rowspan: 1 },
        content: [p(String(c))],
      })),
    })),
  ],
});
export const fotos = (modelos) => ({
  type: "fotosModelos",
  attrs: {
    data: { modelos: modelos.map((m) => ({ slug: m.slug, name: m.name, src: "", href: "" })) },
  },
});
export const words = (doc) => {
  let n = 0;
  const walk = (x) => {
    if (Array.isArray(x)) return x.forEach(walk);
    if (x && typeof x === "object") {
      if (x.type === "text" && x.text) n += x.text.split(/\s+/).filter(Boolean).length;
      if (x.content) walk(x.content);
    }
  };
  walk(doc);
  return n;
};
const weighted = (cs) =>
  Math.round(
    (cs.reduce((s, c) => s + c.weight * c.score, 0) / cs.reduce((s, c) => s + c.weight, 0)) * 10,
  ) / 10;
