import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Bloco "ferramenta embutida" para artigos. No editor, renderiza um
 * placeholder com `data-tool-slug`. No PostPage, o componente `mountToolEmbeds`
 * encontra esses marcadores e monta a ferramenta interativa dentro do artigo.
 */
export const ToolEmbedExtension = Node.create({
  name: "toolEmbed",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      slug: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-tool-embed]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const slug = node.attrs.slug as string;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-tool-embed": "",
        "data-tool-slug": slug,
        class: "tool-embed-placeholder",
      }),
      `Ferramenta embutida: ${slug}`,
    ];
  },
});
