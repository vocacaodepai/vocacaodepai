// Google AdSense do Vocação de Pai (doc 11 §2; doc 10 §12 "AdSense" nas pendências do dono).
//
// PLACEHOLDER: a conta AdSense do Vocação de Pai AINDA NÃO EXISTE. O ID abaixo é um marcador claro;
// enquanto ele não for trocado pelo publisher real (formato "pub-" + 16 dígitos, o mesmo de
// public/ads.txt), `isAdsenseConfigured()` devolve false, o AdSlot não renderiza anúncio nenhum e o
// script do AdSense não entra em src/routes/__root.tsx. Não é variável de ambiente (CLAUDE.md §13):
// quando o dono tiver o ID, trocar AQUI e em public/ads.txt no mesmo commit.
export const ADSENSE_PLACEHOLDER_ID = "pub-0000000000000000";
export const ADSENSE_PUBLISHER_ID = ADSENSE_PLACEHOLDER_ID;

/** true só quando o publisher real estiver preenchido (nunca com o placeholder). */
export function isAdsenseConfigured(): boolean {
  return (
    /^pub-\d{16}$/.test(ADSENSE_PUBLISHER_ID) && ADSENSE_PUBLISHER_ID !== ADSENSE_PLACEHOLDER_ID
  );
}

/** URL do loader (usada pelo __root quando `isAdsenseConfigured()`). */
export const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${ADSENSE_PUBLISHER_ID}`;

/** Unidade padrão (criada no painel do AdSense depois da aprovação); cada AdSlot pode passar a sua. */
export const ADSENSE_DEFAULT_SLOT = "0000000000";
