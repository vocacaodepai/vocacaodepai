import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getProductsBySlugs } from "@/lib/loja/loja.functions";

export interface GaleriaData {
  slug?: string;
  nome?: string;
  images?: string[];
}

/**
 * Galeria de fotos do produto: todas no mesmo retângulo 4:3 (sem cortar), deslizando
 * para o lado. Quando só vem `slug`, busca `products.images` (até 8 fotos oficiais)
 * pelo server fn getProductsBySlugs (doc 05 §6).
 */
export function GaleriaProdutoWidget({ data }: { data: GaleriaData }) {
  const [fetched, setFetched] = useState<{ images: string[]; nome: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const own = (data.images ?? []).filter(Boolean);
    if (!data.slug || own.length > 0) return;
    let alive = true;
    getProductsBySlugs({ data: { slugs: [data.slug] } })
      .then((list) => {
        const p = list[0];
        if (alive && p) setFetched({ images: p.images, nome: p.name });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [data.slug, data.images]);

  const images = (
    (data.images ?? []).filter(Boolean).length > 0
      ? (data.images ?? []).filter(Boolean)
      : (fetched?.images ?? [])
  ).slice(0, 8);

  if (images.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const nome = data.nome ?? fetched?.nome ?? "produto";

  return (
    <div className="galeria-produto not-prose relative my-6">
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {images.map((src, i) => (
          <div
            key={src}
            className="relative aspect-[4/3] w-[86%] shrink-0 snap-center overflow-hidden rounded-2xl border border-border bg-white sm:w-[calc(50%-6px)]"
          >
            <img
              src={src}
              alt={`${nome}, foto ${i + 1} de ${images.length}`}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-3"
              style={{ margin: 0, boxShadow: "none", borderRadius: 0 }}
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Foto anterior"
            className="absolute left-2 top-[42%] hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-soft hover:bg-background sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Próxima foto"
            className="absolute right-2 top-[42%] hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-background/90 shadow-soft hover:bg-background sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            {images.length} fotos, deslize para o lado
          </p>
        </>
      )}
      {data.slug && (
        <p className="mt-1 text-center text-xs">
          <a href={`/loja/${data.slug}`} className="font-semibold text-primary hover:underline">
            Ver análise completa na Loja do Pai
          </a>
        </p>
      )}
    </div>
  );
}
