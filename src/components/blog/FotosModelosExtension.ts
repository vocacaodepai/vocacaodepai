import { Node, mergeAttributes } from "@tiptap/core";
import type { FotosModelosData } from "@/components/blog/FotosModelos";

/**
 * Bloco "fotos dos modelos": faixa com as fotos reais dos produtos lado a
 * lado (dividindo a largura do artigo em 5). O conteúdo (fotos/nomes/links)
 * viaja no atributo `data`. O `ToolEmbedHost` monta o `FotosModelosWidget`
 * no marcador `[data-fotos-modelos]`; no editor admin vira placeholder.
 */
export const FotosModelosExtension = Node.create({
  name: "fotosModelos",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      data: {
        default: null,
        parseHTML: (el) => {
          const raw = (el as HTMLElement).getAttribute("data-fotos-modelos-json");
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        renderHTML: (attrs) => ({
          "data-fotos-modelos-json":
            typeof attrs.data === "string" ? attrs.data : JSON.stringify(attrs.data ?? null),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-fotos-modelos]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const data = node.attrs.data as FotosModelosData | null;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-fotos-modelos": "",
        "data-fotos-modelos-json": typeof data === "string" ? data : JSON.stringify(data ?? null),
        class: "fotos-modelos-placeholder",
      }),
      "Fotos dos modelos (5 lado a lado)",
    ];
  },
});
