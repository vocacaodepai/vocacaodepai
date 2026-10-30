import { ShoppingBag } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Tipos do conteúdo do widget (vêm do atributo `data` do nó TipTap)   */
/* ------------------------------------------------------------------ */

export interface FotoModelo {
  /** URL da foto oficial do produto (Amazon). */
  src: string;
  /** Nome do modelo. */
  name: string;
  /** Link de compra na Amazon. */
  href: string;
  /** Slug do produto na Loja do Pai. */
  slug?: string;
  /** Faixa de preço já resolvida ("R$ X a R$ Y"), preenchida por prepareBody (Fase 2). */
  faixa?: string;
}

export interface FotosModelosData {
  modelos: FotoModelo[];
}

/* ------------------------------------------------------------------ */
/* Widget React: fotos oficiais lado a lado com faixa e botão de compra.*/
/* A faixa (products.price_min/max) chega em `faixa`, resolvida por     */
/* src/lib/pai-indica/body.ts (prepareBody) a partir de `products`.     */
/* ------------------------------------------------------------------ */

export function FotosModelosWidget({ data }: { data: FotosModelosData }) {
  if (!data || !Array.isArray(data.modelos) || data.modelos.length === 0) {
    return null;
  }

  return (
    <div className="fotos-modelos my-6">
      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${data.modelos.length >= 4 ? "lg:grid-cols-5" : ""}`}
      >
        {data.modelos.map((m, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft"
          >
            <div className="flex aspect-square items-center justify-center bg-white p-2">
              {m.src ? (
                <img
                  src={m.src}
                  alt={m.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="px-2 text-center text-[11px] text-muted-foreground">
                  Foto oficial em breve
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center gap-1.5 p-2.5 text-center">
              <p className="text-xs font-bold leading-snug text-foreground">{m.name}</p>
              {m.faixa && (
                <p className="text-[11px] leading-snug text-muted-foreground">
                  Faixa de preço: {m.faixa}
                </p>
              )}
              <a
                href={m.href}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="btn-comprar mt-auto inline-flex min-h-9 w-full flex-wrap items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold leading-snug"
                style={{
                  backgroundColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary-foreground))",
                }}
              >
                <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                Comprar agora na Amazon
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
