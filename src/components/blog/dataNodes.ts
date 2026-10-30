import { Node, mergeAttributes } from "@tiptap/core";

/**
 * Cria um bloco "atom" do TipTap cujo conteúdo viaja em JSON num atributo
 * `data-...-json`. O `ToolEmbedHost` monta o componente React no marcador;
 * no editor admin vira só um placeholder (mesmo padrão do FotosModelos).
 */
function makeDataNode(name: string, marker: string, placeholderClass: string, label: string) {
  const jsonAttr = `${marker}-json`;
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    addAttributes() {
      return {
        data: {
          default: null,
          parseHTML: (el) => {
            const raw = (el as HTMLElement).getAttribute(jsonAttr);
            if (!raw) return null;
            try {
              return JSON.parse(raw);
            } catch {
              return null;
            }
          },
          renderHTML: (attrs) => ({
            [jsonAttr]:
              typeof attrs.data === "string" ? attrs.data : JSON.stringify(attrs.data ?? null),
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: `div[${marker}]` }];
    },
    renderHTML({ HTMLAttributes, node }) {
      const data = node.attrs.data;
      return [
        "div",
        mergeAttributes(HTMLAttributes, {
          [marker]: "",
          [jsonAttr]: typeof data === "string" ? data : JSON.stringify(data ?? null),
          class: placeholderClass,
        }),
        label,
      ];
    },
  });
}

export const BuyCardExtension = makeDataNode(
  "buyCard",
  "data-buy-card",
  "fotos-modelos-placeholder",
  "Cartão Onde comprar",
);
export const GaleriaProdutoExtension = makeDataNode(
  "galeriaProduto",
  "data-galeria-produto",
  "fotos-modelos-placeholder",
  "Galeria de fotos do produto",
);
