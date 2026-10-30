import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { productImageThumb } from "@/lib/image";
import { cn } from "@/lib/utils";

/**
 * Galeria da página do produto (doc 05 §4.7): até 8 fotos oficiais da Amazon,
 * 4:3 com `object-contain`, setas, miniaturas e contador "n / N".
 */
export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const gallery = images.filter(Boolean).slice(0, 8);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [name]);

  const total = gallery.length;
  const src = gallery[index] ?? gallery[0] ?? null;

  return (
    <div className="flex flex-col gap-3">
      <figure className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-soft">
        {src ? (
          <img
            src={src}
            alt={`${name} — foto ${index + 1}`}
            decoding="async"
            fetchPriority="high"
            className="aspect-[4/3] w-full object-contain p-6"
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center p-6 text-center text-sm font-semibold text-muted-foreground">
            Foto oficial em breve
          </div>
        )}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + total) % total)}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % total)}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/80 text-foreground shadow-soft backdrop-blur transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-background/80 px-3 py-1 text-xs font-bold text-foreground shadow-soft backdrop-blur">
              {index + 1} / {total}
            </span>
          </>
        )}
      </figure>
      {total > 1 && (
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          role="tablist"
          aria-label="Fotos do produto"
        >
          {gallery.map((url, i) => (
            <button
              key={url + i}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setIndex(i)}
              aria-label={`Foto ${i + 1}`}
              className={cn(
                "shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all",
                i === index
                  ? "border-primary shadow-soft"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={productImageThumb(url)}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-16 w-16 object-contain p-1"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
