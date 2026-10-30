// Filtro no navegador (portado do Portal da AI, doc 04 §4.1): cada filtro liga/desliga a própria
// marca data-hide-<chave> no <article data-kind …>; o card some se qualquer marca estiver ligada.
export function setHidden(card: HTMLElement, key: string, hidden: boolean): void {
  const attr = `hide${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  if (hidden) card.dataset[attr] = "1";
  else delete card.dataset[attr];
  const anyHidden = Object.keys(card.dataset).some((k) => k.startsWith("hide"));
  card.style.display = anyHidden ? "none" : "";
}
export function cardsOf(rootId: string): HTMLElement[] {
  if (typeof document === "undefined") return [];
  const root = document.getElementById(rootId);
  return root ? Array.from(root.querySelectorAll<HTMLElement>("article[data-kind]")) : [];
}
export function clearKey(rootId: string, key: string): void {
  cardsOf(rootId).forEach((c) => setHidden(c, key, false));
}
export function visibleCount(rootId: string): number {
  return cardsOf(rootId).filter((c) => c.style.display !== "none").length;
}
export function chipClass(active: boolean, small = false): string {
  return `inline-flex items-center whitespace-nowrap rounded-full border font-semibold transition-colors ${
    small ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs"
  } ${
    active
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-muted-foreground hover:border-accent/60 hover:text-foreground"
  }`;
}
