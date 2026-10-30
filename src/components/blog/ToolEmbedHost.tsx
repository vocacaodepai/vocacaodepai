import { useEffect, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DecisorRapidoWidget, type DecisorData } from "@/components/blog/DecisorRapido";
import { FotosModelosWidget, type FotosModelosData } from "@/components/blog/FotosModelos";
import { BuyCardWidget, type BuyCardData } from "@/components/blog/BuyCard";
import { GaleriaProdutoWidget, type GaleriaData } from "@/components/blog/GaleriaProduto";
import { ProductEmbedWidget, type ProductEmbedData } from "@/components/loja/ProductEmbed";

/**
 * Encontra os marcadores `[data-tool-embed]`, `[data-decisor]` e
 * `[data-fotos-modelos]`, `[data-buy-card]`, `[data-galeria-produto]` e `[data-product]` dentro do artigo e monta os componentes
 * interativos correspondentes ali mesmo (React dentro do TipTap).
 */
export function ToolEmbedHost({ scope }: { scope: string }) {
  useEffect(() => {
    const roots: Root[] = [];
    const done = new WeakSet<Element>();

    // Idempotente: monta só os marcadores ainda sem widget. Roda de novo quando o
    // HTML do artigo é recriado (ex.: hidratação refaz o DOM depois do 1º efeito).
    const scan = () => {
      const rootEl = document.querySelector(scope);
      if (!rootEl) return;
      const slots = rootEl.querySelectorAll<HTMLElement>(
        "[data-tool-embed], [data-decisor], [data-fotos-modelos], [data-buy-card], [data-galeria-produto], [data-product]",
      );
      slots.forEach((slot) => {
        if (done.has(slot) || !slot.isConnected) return;
        done.add(slot);
        slot.className = slot.className.replace(/\S*-placeholder/g, "").trim();
        const slug = slot.dataset.toolSlug;
        if (slug) {
          // TODO Fase 4 (Caixa de Ferramentas): mapear slug → ferramenta embutida.
          const component: ReactElement | null = null;
          if (component) {
            slot.innerHTML = "";
            const root = createRoot(slot);
            root.render(component);
            roots.push(root);
          }
          return;
        }

        const json = slot.dataset.decisorJson;
        if (json) {
          try {
            const data = JSON.parse(json) as DecisorData;
            if (data && Array.isArray(data.questions)) {
              slot.innerHTML = "";
              const root = createRoot(slot);
              root.render(<DecisorRapidoWidget data={data} />);
              roots.push(root);
            }
          } catch {
            // JSON inválido: mantém o placeholder
          }
          return;
        }

        const buyJson = slot.dataset.buyCardJson;
        if (buyJson) {
          try {
            const data = JSON.parse(buyJson) as BuyCardData;
            if (data && data.href && data.name) {
              slot.innerHTML = "";
              const root = createRoot(slot);
              root.render(<BuyCardWidget data={data} />);
              roots.push(root);
            }
          } catch {
            // JSON inválido: mantém o placeholder
          }
          return;
        }

        const productJson = slot.dataset.productJson;
        if (productJson) {
          try {
            const data = JSON.parse(productJson) as ProductEmbedData;
            if (data && data.slug) {
              slot.innerHTML = "";
              const root = createRoot(slot);
              root.render(<ProductEmbedWidget data={data} />);
              roots.push(root);
            }
          } catch {
            // JSON inválido: mantém o placeholder
          }
          return;
        }

        const galeriaJson = slot.dataset.galeriaProdutoJson;
        if (galeriaJson) {
          try {
            const data = JSON.parse(galeriaJson) as GaleriaData;
            if (data && (data.slug || data.images?.length)) {
              slot.innerHTML = "";
              const root = createRoot(slot);
              root.render(<GaleriaProdutoWidget data={data} />);
              roots.push(root);
            }
          } catch {
            // JSON inválido: mantém o placeholder
          }
          return;
        }

        const fotosJson = slot.dataset.fotosModelosJson;
        if (fotosJson) {
          try {
            const data = JSON.parse(fotosJson) as FotosModelosData;
            if (data && Array.isArray(data.modelos)) {
              slot.innerHTML = "";
              const root = createRoot(slot);
              root.render(<FotosModelosWidget data={data} />);
              roots.push(root);
            }
          } catch {
            // JSON inválido: mantém o placeholder
          }
        }
      });
    };

    scan();
    const observer = new MutationObserver(() => scan());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      roots.forEach((r) => r.unmount());
    };
  }, [scope]);

  return null;
}
