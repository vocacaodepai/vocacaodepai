import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { isNoAdsRoute } from "@/lib/ads/no-ads-routes";
import { ADSENSE_DEFAULT_SLOT, ADSENSE_PUBLISHER_ID, isAdsenseConfigured } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const HEIGHTS = {
  rect: "min-h-[250px]",
  leaderboard: "min-h-[90px]",
  skyscraper: "min-h-[600px]",
} as const;

/**
 * Espaço de anúncio (doc 11 §2.5). Regras:
 * - nunca nas rotas de `isNoAdsRoute` (/admin, /area-do-pai, institucionais, /api…);
 * - com o publisher real em src/lib/adsense.ts, renderiza a unidade do AdSense;
 * - sem publisher (placeholder atual), mostra só para a equipe (admin/editor) um
 *   retângulo tracejado "Espaço reservado", nunca para o público.
 */
export function AdSlot({
  className = "",
  format = "rect",
  slot,
}: {
  className?: string;
  format?: keyof typeof HEIGHTS;
  slot?: string;
}) {
  const { pathname } = useLocation();
  const { ready, profile } = useAuth();
  const configured = isAdsenseConfigured();
  const noAds = isNoAdsRoute(pathname);

  useEffect(() => {
    if (!configured || noAds) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* script ainda não carregou; o AdSense tenta de novo sozinho */
    }
  }, [configured, noAds, pathname]);

  if (noAds) return null;

  if (configured) {
    return (
      <div
        className={`flex justify-center ${HEIGHTS[format]} ${className}`}
        aria-label="Publicidade"
      >
        <ins
          className="adsbygoogle block w-full"
          data-ad-client={`ca-${ADSENSE_PUBLISHER_ID}`}
          data-ad-slot={slot ?? ADSENSE_DEFAULT_SLOT}
          data-ad-format={format === "leaderboard" ? "horizontal" : "auto"}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  const show = ready && (profile?.role === "admin" || profile?.role === "editor");
  if (!show) return null;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-6 text-center ${HEIGHTS[format]} ${className}`}
      aria-label="Publicidade"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
        Publicidade
      </span>
      <span className="text-xs text-muted-foreground">
        Espaço reservado para anúncios — visível apenas para a equipe (AdSense ainda sem publisher)
      </span>
    </div>
  );
}
