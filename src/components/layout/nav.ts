// Menu principal do Vocação de Pai (doc 03 §4.3): as 7 seções + Sobre/Contato.
// Rótulos e rotas são nomes oficiais (CLAUDE.md §1 e §12) — não renomear.

export interface NavItem {
  to: string;
  label: string;
  end: boolean;
  /** Item da Loja do Pai: ganha destaque em âmbar ("O pai também quer desconto"). */
  store?: boolean;
}

export const NAV_MAIN: readonly NavItem[] = [
  { to: "/blog", label: "Blog", end: false },
  { to: "/pai-indica", label: "Pai Indica", end: false },
  { to: "/loja", label: "Loja do Pai", end: false, store: true },
  { to: "/ferramentas", label: "Ferramentas", end: false },
  { to: "/pai-indica-pai", label: "Pai Indica Pai", end: false },
  { to: "/irmandade", label: "Irmandade", end: false },
  { to: "/formacao", label: "Formação", end: false },
];

export const NAV_END: readonly NavItem[] = [
  { to: "/sobre", label: "Sobre", end: false },
  { to: "/contato", label: "Contato", end: false },
];

export const NAV_INSTITUCIONAL: readonly NavItem[] = [
  { to: "/sobre", label: "Sobre", end: false },
  { to: "/contato", label: "Contato", end: false },
  { to: "/politica-de-privacidade", label: "Política de Privacidade", end: false },
  { to: "/termos-de-uso", label: "Termos de Uso", end: false },
  { to: "/politica-de-afiliados", label: "Política de Afiliados", end: false },
];
