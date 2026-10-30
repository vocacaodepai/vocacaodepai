import { useState } from "react";
import { pexelsSearchFn, wikimediaSearchFn, googleImageSearchFn } from "@/lib/media.functions";
import { ImageOff, Loader2, Search, X } from "lucide-react";

interface PexelsPhoto {
  id: number | string;
  alt: string;
  photographer: string;
  page_url: string;
  url: string;
  thumb: string;
  width: number;
  height: number;
  license?: string;
}

type ImageSource = "wikimedia" | "pexels" | "google";

const SEARCH_FNS: Record<ImageSource, typeof pexelsSearchFn> = {
  wikimedia: wikimediaSearchFn,
  pexels: pexelsSearchFn,
  google: googleImageSearchFn,
};

const SOURCE_LABELS: Record<ImageSource, string> = {
  wikimedia: "Wikimedia",
  pexels: "Pexels",
  google: "Google (use com cautela)",
};

// Wikimedia e Google devolvem licença/página de origem por foto; Pexels
// (banco de estoque comercial) não precisa dessa conferência.
function needsLicenseCheck(source: ImageSource): boolean {
  return source === "wikimedia" || source === "google";
}

interface ImageSearchDialogProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, alt: string) => void;
}

export function ImageSearchDialog({ title, open, onClose, onSelect }: ImageSearchDialogProps) {
  const [source, setSource] = useState<ImageSource>("wikimedia");
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!open) return null;

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setPhotos([]);
    setHasSearched(true);
    try {
      const data = await SEARCH_FNS[source]({
        data: { query: q, per_page: 15, orientation: "landscape" },
      });
      if (!data?.success) {
        throw new Error(data?.message || "Falha na busca.");
      }
      setPhotos(data.photos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na busca.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-card p-6 shadow-elegant"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {source === "wikimedia"
                ? "Wikimedia Commons — a licença mostrada vem do próprio arquivo."
                : source === "google"
                  ? "Google (filtrado por direitos de reuso) — confira a página de origem de cada foto antes de publicar."
                  : "Fotos reais gratuitas (Pexels, licença livre para uso comercial)."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {(["wikimedia", "pexels", "google"] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                setSource(s);
                setHasSearched(false);
                setPhotos([]);
                setError(null);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                source === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {SOURCE_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Ex.: pai brincando com o filho"
            className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={search}
            disabled={loading || !query.trim()}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Buscar
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-video animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          )}
          {!loading && !error && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-muted-foreground">
              <ImageOff className="mb-2 h-8 w-8" />
              Digite uma busca para encontrar fotos reais de banco gratuito.
            </div>
          )}
          {!loading && !error && hasSearched && photos.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma foto encontrada. Tente outros termos.
            </p>
          )}
          {!loading && !error && photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => onSelect(photo.url, photo.alt)}
                  className="group relative overflow-hidden rounded-xl border border-border text-left"
                  title="Usar esta foto"
                >
                  <img
                    src={photo.thumb}
                    alt={photo.alt}
                    loading="lazy"
                    className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1 pt-6 text-left text-[10px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {needsLicenseCheck(source)
                      ? photo.license || "Confira a licença na página de origem"
                      : `Foto: ${photo.photographer}`}
                  </span>
                  {needsLicenseCheck(source) && (
                    <a
                      href={photo.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-black/80"
                    >
                      ver origem
                    </a>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="h-10 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
