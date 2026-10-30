import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface GaleriaData {
  slug?: string;
  nome?: string;
  images?: string[];
}

/** Galeria de fotos do produto: todas no mesmo retângulo 4:3 (sem cortar), deslizando para o lado. */
export function GaleriaProdutoWidget({ data }: { data: GaleriaData }) {
  // TODO Fase 3 (Loja do Pai): quando só vier `slug`, buscar `products.images`.
  const images = (data.images ?? []).filter(Boolean);
  const scroller = useRef<HTMLDivElement>(null);

  if (images.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const nome = data.nome ?? "produto";

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
    </div>
  );
}
