import { ExternalLink } from "lucide-react";
import { ReviewBadge } from "@/components/pai-indica/ReviewBadge";
import {
  classindConsultaUrl,
  classindLabels,
  formatMoral,
  moralOf,
  paiAgeLabel,
  tierOf,
} from "@/lib/pai-indica-midia/taxonomia";
import type { ClassInd, MediaType } from "@/lib/pai-indica-midia/types";

/** Selo oficial ClassInd (quadrado nas cores do MJSP). Livro: "sem ClassInd". */
export function ClassIndSeal({
  classind,
  size = "sm",
  className = "",
}: {
  classind: ClassInd | null;
  size?: "sm" | "lg";
  className?: string;
}) {
  const box = size === "lg" ? "h-12 w-12 text-xl" : "h-7 w-7 text-xs";
  if (!classind) {
    return (
      <span
        title="Livros não recebem Classificação Indicativa oficial"
        className={`inline-flex ${box} items-center justify-center rounded-md border border-border bg-muted font-display font-bold text-muted-foreground ${className}`}
      >
        —
      </span>
    );
  }
  const c = classindLabels[classind];
  return (
    <span
      title={`ClassInd: ${c.text}`}
      aria-label={`Classificação Indicativa: ${c.text}`}
      className={`inline-flex ${box} items-center justify-center rounded-md font-display font-bold shadow-sm ${c.color} ${className}`}
    >
      {c.label}
    </span>
  );
}

/** Chip da nota moral -4..+4 com cor do semáforo (sucesso / atenção / alerta). */
export function MoralChip({
  value,
  size = "sm",
  className = "",
}: {
  value: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const m = moralOf(value);
  const tone =
    value >= 2
      ? "bg-success/15 text-success"
      : value >= 0
        ? "bg-warning/20 text-foreground"
        : "bg-danger/15 text-danger";
  const pad = size === "lg" ? "px-3 py-1.5 text-sm" : "px-1.5 py-0.5 text-[11px]";
  return (
    <span
      title={`Nota moral ${formatMoral(value)}: ${m.label}. ${m.text}`}
      className={`inline-flex items-center gap-1 rounded-md font-semibold ${tone} ${pad} ${className}`}
    >
      <span className="font-mono">{formatMoral(value)}</span>
      {size === "lg" && <span className="font-normal">{m.label}</span>}
    </span>
  );
}

/**
 * Selo do Pai Indica Mídia (doc 14 §4.2): ClassInd oficial + nota tripla (qualidade 0-10,
 * moral -4..+4, idade do pai). `size="sm"` no card; `size="lg"` no topo da ficha, com o link da
 * consulta oficial e os descritores do ClassInd.
 */
export function MediaBadge({
  type,
  classind,
  classindDescriptors = [],
  paiAgeMin,
  scoreQuality,
  scoreMoral,
  size = "sm",
  className = "",
}: {
  type: MediaType;
  classind: ClassInd | null;
  classindDescriptors?: string[];
  paiAgeMin: number;
  scoreQuality: number;
  scoreMoral: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const tier = tierOf(paiAgeMin);
  if (size === "sm") {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        <ClassIndSeal classind={classind} />
        <span
          title={`Idade mínima na visão do pai: ${paiAgeLabel(paiAgeMin)} (${tier.name})`}
          className="rounded-md bg-background/90 px-1.5 py-1 text-[10px] font-bold text-foreground shadow-sm"
        >
          Pai Indica {paiAgeLabel(paiAgeMin)}
        </span>
        <ReviewBadge score={scoreQuality} />
        <MoralChip value={scoreMoral} />
      </div>
    );
  }
  const consulta = classindConsultaUrl(type);
  return (
    <div className={`grid gap-3 sm:grid-cols-2 ${className}`}>
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
        <ClassIndSeal classind={classind} size="lg" />
        <div className="min-w-0 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Classificação oficial (ClassInd)
          </p>
          <p className="font-semibold">
            {classind ? classindLabels[classind].text : "Livros não recebem ClassInd"}
          </p>
          {classindDescriptors.length > 0 && (
            <p className="text-xs text-muted-foreground">{classindDescriptors.join(" · ")}</p>
          )}
          {consulta && (
            <a
              href={consulta}
              target="_blank"
              rel="noopener"
              className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-2 hover:underline"
            >
              Conferir no portal do Ministério da Justiça
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border-2 border-accent/50 bg-accent/5 p-3">
        <div className="min-w-0 flex-1 text-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent">
            Pai Indica: {paiAgeLabel(paiAgeMin)} · {tier.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <ReviewBadge score={scoreQuality} size="md" showLabel />
            <MoralChip value={scoreMoral} size="lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
