import { Node, mergeAttributes } from "@tiptap/core";
import type { DecisorData } from "@/components/blog/DecisorRapido";

/**
 * Bloco interativo "Decisor rápido" (pergunta + botões que revelam a
 * resposta e links). O conteúdo viaja no atributo `data` (objeto JSON).
 * No PostPage, o `ToolEmbedHost` monta o `DecisorRapidoWidget` no
 * marcador `[data-decisor]`; no editor admin aparece como placeholder.
 */
export const DecisorRapidoExtension = Node.create({
  name: "decisorRapido",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      data: {
        default: null,
        parseHTML: (el) => {
          const raw = (el as HTMLElement).getAttribute("data-decisor-json");
          if (!raw) return null;
          try {
            return JSON.parse(raw);
          } catch {
            return null;
          }
        },
        renderHTML: (attrs) => ({
          "data-decisor-json":
            typeof attrs.data === "string" ? attrs.data : JSON.stringify(attrs.data ?? null),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-decisor]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const data = node.attrs.data as DecisorData | null;
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-decisor": "",
        "data-decisor-json": typeof data === "string" ? data : JSON.stringify(data ?? null),
        class: "decisor-rapido-placeholder",
      }),
      "Decisor rápido interativo",
    ];
  },
});
