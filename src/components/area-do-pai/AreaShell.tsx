import type { ReactNode } from "react";
import { Baby, Bookmark, Crown, LayoutDashboard, UserCog } from "lucide-react";
import { NavLink } from "@/lib/router-compat";
import { cn } from "@/lib/utils";

// Casca das páginas privadas: título + sub-navegação da Área do Pai.

const TABS = [
  { to: "/area-do-pai", label: "Painel", icon: LayoutDashboard, end: true },
  { to: "/area-do-pai/filhos", label: "Filhos", icon: Baby, end: false },
  { to: "/area-do-pai/salvos", label: "Salvos", icon: Bookmark, end: false },
  { to: "/area-do-pai/plano", label: "Plano", icon: Crown, end: false },
  { to: "/minha-conta", label: "Minha conta", icon: UserCog, end: false },
];

export function AreaShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="container max-w-6xl py-8 md:py-10">
      <nav aria-label="Área do Pai" className="mb-6 -mx-4 overflow-x-auto px-4">
        <ul className="flex min-w-max gap-1 rounded-full border border-border bg-card p-1">
          {TABS.map((t) => (
            <li key={t.to}>
              <NavLink
                to={t.to}
                end={t.end}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                  )
                }
              >
                <t.icon className="h-4 w-4" aria-hidden />
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{title}</h1>
          {description && <p className="mt-1 text-base text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </div>
  );
}

export function Card({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export const inputClass =
  "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60";
export const primaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60";
export const secondaryBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60";
export const dangerBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-destructive px-5 text-sm font-bold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-60";
