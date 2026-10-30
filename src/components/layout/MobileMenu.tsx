import { useEffect, useRef } from "react";
import { Link, NavLink } from "@/lib/router-compat";
import { LogIn, LogOut, ShieldCheck, User, UserRound } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NAV_END, NAV_MAIN } from "./nav";

// Menu móvel (abaixo de xl). Acessível: região com rótulo, foco vai para o
// primeiro link ao abrir, Escape fecha, e o SiteLayout fecha ao navegar.

interface MobileMenuProps {
  id: string;
  open: boolean;
  onClose: () => void;
  categories: Category[];
  ready: boolean;
  user: { id: string; email?: string } | null;
  isStaff: boolean;
  onLogout: () => void;
}

const itemClass = (isActive: boolean) =>
  cn(
    "rounded-lg px-4 py-3 text-base font-semibold transition-colors",
    isActive ? "bg-primary/10 text-primary" : "text-foreground/85 hover:bg-muted",
  );

export function MobileMenu({
  id,
  open,
  onClose,
  categories,
  ready,
  user,
  isStaff,
  onLogout,
}: MobileMenuProps) {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    navRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <nav
      ref={navRef}
      id={id}
      aria-label="Menu móvel"
      className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background xl:hidden"
    >
      <div className="container flex flex-col gap-1 py-3">
        {NAV_MAIN.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(itemClass(isActive), item.store && !isActive && "text-accent")
            }
          >
            {item.label}
            {item.store && (
              <span className="ml-2 text-xs font-bold uppercase tracking-wider text-accent/80">
                O pai também quer desconto
              </span>
            )}
          </NavLink>
        ))}

        {categories.length > 0 && (
          <>
            <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Categorias do Blog
            </p>
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categoria/${cat.slug}`}
                  onClick={onClose}
                  className="rounded-sm border-[1.5px] border-primary/60 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </>
        )}

        <div className="my-2 h-px bg-border" />

        {NAV_END.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => itemClass(isActive)}
          >
            {item.label}
          </NavLink>
        ))}

        <div className="my-2 h-px bg-border" />

        {ready &&
          (user ? (
            <>
              <Link
                to="/area-do-pai"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-bold text-primary"
              >
                <UserRound className="h-4 w-4" aria-hidden />
                Área do Pai
              </Link>
              <Link
                to="/minha-conta"
                onClick={onClose}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-semibold text-foreground/85"
              >
                <User className="h-4 w-4" aria-hidden />
                Minha conta
              </Link>
              {isStaff && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-semibold text-foreground/85"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-left text-base font-semibold text-foreground/85"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sair
              </button>
            </>
          ) : (
            <Link
              to="/entrar"
              onClick={onClose}
              className="mx-4 my-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-base font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Entrar
            </Link>
          ))}
      </div>
    </nav>
  );
}
