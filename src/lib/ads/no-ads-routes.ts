// Rotas SEM anúncio — lista fixa do doc 11 §2.5. `AdSlot` deve renderizar `null`
// quando `isNoAdsRoute(pathname)` for verdadeiro. As regras que dependem de
// conteúdo (categoria com < 5 posts, página com < 300 palavras, assinante ativo)
// são decididas pelo componente que conhece os dados, não aqui.

/** Caminhos exatos. */
export const NO_ADS_EXACT: readonly string[] = [
  "/busca",
  "/404",
  "/entrar",
  "/cadastro",
  "/minha-conta",
  "/newsletter/confirmar",
  "/newsletter/obrigado",
  "/sobre",
  "/contato",
  "/termos-de-uso",
  "/anuncie",
  "/pai-indica-pai/vagas/nova",
  "/historias/nova",
  "/loja/ofertas",
];

/** Prefixos: a rota e tudo abaixo dela. */
export const NO_ADS_PREFIXES: readonly string[] = [
  "/area-do-pai",
  "/admin",
  "/politica-", // /politica-de-privacidade, /politica-de-afiliados…
  "/newsletter",
  "/api",
];

function normalize(pathname: string): string {
  const path = (pathname || "/").split("?")[0].split("#")[0];
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path;
}

export function isNoAdsRoute(pathname: string): boolean {
  const path = normalize(pathname);
  if (NO_ADS_EXACT.includes(path)) return true;
  return NO_ADS_PREFIXES.some((prefix) =>
    prefix.endsWith("-")
      ? path.startsWith(prefix)
      : path === prefix || path.startsWith(`${prefix}/`),
  );
}
