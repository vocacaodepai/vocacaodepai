// Google Analytics 4 (gtag.js) — tag de medição do site.
// A tag é pública (Measurement ID) e o script é injetado via head() da
// rota raiz (src/routes/__root.tsx), não em um index.html estático.
//
// IMPORTANTE: cada item de `scripts` no head() deve ter src/async/children
// como propriedades DIRETAS do objeto (igual às props de um <script> em
// JSX) — NUNCA embrulhadas em `attrs: {...}`. O TanStack Router espalha
// `{...script, nonce}` diretamente em `attrs`; se `src`/`async` estiverem
// dentro de um `attrs` aninhado, eles ficam um nível fundo demais e o
// componente <Script> não encontra `attrs.src`, então o script vira uma
// <script> vazia sem src — quebrando o gtag.js silenciosamente (isso já
// aconteceu 2x: uma reformatação automática de editor e depois uma
// "correção" equivocada em cima dela).

export const GA_MEASUREMENT_ID = "G-RSP3KRCSEF";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Registra uma visualização de página no GA4.
 * Em SPA as rotas não recarregam a página, então enviamos o page_view
 * manualmente a cada navegação com o caminho correto.
 */
export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag === "function") {
    window.gtag("config", GA_MEASUREMENT_ID, { page_path: path });
  }
}
