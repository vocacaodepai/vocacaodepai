import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";

/** Cabeçalho padrão das seções da home: título, linha de apoio e link "ver todos". */
export function SectionHeading({
  id,
  title,
  subtitle,
  linkTo,
  linkLabel,
  eyebrow,
}: {
  id: string;
  title: string;
  subtitle?: string;
  linkTo?: string;
  linkLabel?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 id={id} className="font-display text-2xl font-bold md:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {linkTo && linkLabel && (
        <Link
          to={linkTo}
          className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline sm:inline-flex"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
