import { SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";

// Bússola do Pai (doc 00 §7.2-§7.4): símbolo inline em SVG para herdar
// `currentColor` (funciona no modo escuro e nos fundos petróleo). O arquivo
// estático equivalente é `public/logo.svg` (e-mail, OG, terceiros).

export function LogoSymbol({
  className,
  colored = true,
  title,
}: {
  className?: string;
  /** Cruz e círculo em âmbar (versão colorida); false = monocromático em currentColor. */
  colored?: boolean;
  title?: string;
}) {
  const accent = colored ? "hsl(var(--accent))" : "currentColor";
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-8 w-8 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.8"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}
      <polygon points="12,1 9,5.6 15,5.6" />
      <polygon points="12,23 9,18.4 15,18.4" />
      <polygon points="23,12 18.4,9 18.4,15" />
      <polygon points="1,12 5.6,9 5.6,15" />
      <rect x="8" y="3.6" width="8" height="1.6" rx="0.4" fill={accent} stroke={accent} />
      <circle cx="12" cy="12" r="5" fill="none" stroke={accent} strokeWidth="1.8" />
      <text
        x="12"
        y="14.4"
        textAnchor="middle"
        fontFamily="'Barlow Condensed','Arial Narrow',Arial,sans-serif"
        fontWeight="600"
        fontSize="6.6"
        letterSpacing="-0.1"
        stroke="none"
      >
        VP
      </text>
    </svg>
  );
}

/** Logo horizontal: símbolo + "Vocação de Pai" ("Pai" em âmbar na versão colorida). */
export function Logo({
  className,
  colored = true,
  symbolClassName,
  textClassName,
}: {
  className?: string;
  colored?: boolean;
  symbolClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label={SITE_NAME}>
      <LogoSymbol className={symbolClassName} colored={colored} />
      <span
        className={cn(
          "font-display text-2xl font-semibold leading-none tracking-[-0.01em] sm:text-[1.7rem]",
          textClassName,
        )}
      >
        Vocação de <span className={colored ? "text-accent" : undefined}>Pai</span>
      </span>
    </span>
  );
}
