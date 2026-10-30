import { mediaTypeLabels } from "@/lib/pai-indica-midia/taxonomia";
import type { MediaType } from "@/lib/pai-indica-midia/types";

const TYPE_GRADIENT: Record<MediaType, string> = {
  filme: "from-primary to-secondary",
  serie: "from-secondary to-primary",
  jogo: "from-accent to-secondary",
  app: "from-primary to-accent",
  livro: "from-secondary to-accent",
};

/**
 * Pôster da ficha (doc 14 §4.6). Pôster de filme/série/jogo é obra protegida: só entra com
 * `poster_url` do Wikimedia Commons (CC/PD) e crédito visível; sem pôster licenciado, o cartão
 * tipográfico abaixo (nunca imagem gerada por IA). Proporção 2:3 em todos os casos.
 */
export function PosterFrame({
  title,
  type,
  year,
  posterUrl,
  posterCredit,
  posterLicense,
  className = "",
  showCredit = false,
}: {
  title: string;
  type: MediaType;
  year?: number | null;
  posterUrl?: string | null;
  posterCredit?: string | null;
  posterLicense?: string | null;
  className?: string;
  showCredit?: boolean;
}) {
  const label = mediaTypeLabels[type].label;
  if (posterUrl) {
    return (
      <figure className={`overflow-hidden rounded-2xl bg-muted ${className}`}>
        <img
          src={posterUrl}
          alt={`Pôster de ${title}`}
          loading="lazy"
          decoding="async"
          width={400}
          height={600}
          className="aspect-[2/3] h-full w-full object-cover"
        />
        {showCredit && (posterCredit || posterLicense) && (
          <figcaption className="px-3 py-2 text-[11px] leading-snug text-muted-foreground">
            Imagem: {posterCredit ?? "Wikimedia Commons"}
            {posterLicense ? ` (${posterLicense})` : ""}
          </figcaption>
        )}
      </figure>
    );
  }
  return (
    <div
      role="img"
      aria-label={`${label}: ${title}${year ? ` (${year})` : ""}`}
      className={`relative flex aspect-[2/3] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white ${TYPE_GRADIENT[type]} ${className}`}
    >
      <span className="w-fit rounded-md bg-white/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em]">
        {label}
      </span>
      <span className="font-display text-2xl font-bold leading-tight drop-shadow-sm sm:text-3xl">
        {title}
      </span>
      <span className="text-xs font-semibold text-white/80">
        {year ?? ""}
        {year ? " · " : ""}Pai Indica Mídia
      </span>
    </div>
  );
}
