// Google Analytics 4 (gtag.js) — tag de medição do site.
//
// Regras (doc 03 §4.6 / doc 11 §2.7):
// - O ID vem de `PUBLIC_GA4_ID` (CLAUDE.md §13). Sem a variável, o GA4 fica
//   desligado (nada é carregado) — nunca usar o ID de outro site do grupo.
// - O Consent Mode v2 nasce "denied" num script inline do head() da rota raiz
//   (src/routes/__root.tsx), ANTES de qualquer script do Google.
// - O gtag.js só é injetado (loadGa4) depois que o visitante concede
//   `analytics_storage` no CookieConsent. Sem aceite, nenhuma requisição a
//   googletagmanager.com acontece.

export const GA_MEASUREMENT_ID: string = import.meta.env.PUBLIC_GA4_ID || "";

export const GA_ENABLED = /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    __vdpGa4Loaded?: boolean;
  }
}

/** Garante que `window.gtag` existe (mesmo sem o gtag.js carregado, a fila dataLayer guarda os comandos). */
function ensureGtag(): ((...args: unknown[]) => void) | null {
  if (typeof window === "undefined") return null;
  if (typeof window.gtag !== "function") {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

/**
 * Injeta o gtag.js uma única vez. Chamar SOMENTE após o consentimento analítico
 * (CookieConsent → analytics_storage = granted). Sem `PUBLIC_GA4_ID`, não faz nada.
 */
export function loadGa4(): void {
  if (typeof window === "undefined" || !GA_ENABLED) return;
  if (window.__vdpGa4Loaded) return;
  window.__vdpGa4Loaded = true;

  const gtag = ensureGtag();
  if (!gtag) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
}

/**
 * Registra uma visualização de página no GA4.
 * Em SPA as rotas não recarregam a página, então enviamos o page_view
 * manualmente a cada navegação com o caminho correto.
 */
export function trackPageView(path: string): void {
  if (typeof window === "undefined" || !GA_ENABLED) return;
  if (!window.__vdpGa4Loaded) return; // sem consentimento, não há o que medir
  window.gtag?.("config", GA_MEASUREMENT_ID, { page_path: path });
}

/**
 * Evento customizado (doc 02 §7: `affiliate_click`, `tool_use`,
 * `newsletter_subscribe`, `job_view`, `job_post`, `challenge_day_done`).
 * Sem consentimento o evento é descartado em silêncio.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || !GA_ENABLED) return;
  if (!window.__vdpGa4Loaded) return;
  window.gtag?.("event", name, params);
}
