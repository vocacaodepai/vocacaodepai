import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Semáforo do Pai (verde/amarelo/vermelho) para artigos.
 * Renderização nativa (sem React) para garantir que o texto do callout
 * fique DENTRO do box colorido, ao lado do rótulo. As cores vêm do CSS.
 * Rótulos: tone `ok` → "Sinal verde", `warn` → "Sinal de atenção", `bad` → "Sinal de alerta".
 */
export const CALLOUT_PREFIX: Record<string, string> = {
  ok: "Sinal verde: ",
  warn: "Sinal de atenção: ",
  bad: "Sinal de alerta: ",
};

export const CalloutExtension = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,

  addAttributes() {
    return { tone: { default: "warn" } };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const tone = (node.attrs.tone as string) ?? "warn";
    const label =
      tone === "ok"
        ? "Sinal verde"
        : tone === "bad"
          ? "Sinal de alerta"
          : tone === "tip"
            ? "Dica"
            : "Sinal de atenção";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-callout": "",
        "data-tone": tone,
        class: `callout-box callout-${tone}`,
      }),
      ["div", { class: "callout-label-wrap" }, ["span", { class: "callout-label" }, label]],
      ["div", { class: "callout-body" }, 0],
    ];
  },
});
