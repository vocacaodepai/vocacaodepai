import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ptError, signInWithGoogle } from "@/lib/auth";
import { getAuthConfig, type AuthConfig } from "@/lib/area-do-pai/auth.functions";

// Cartão das páginas de autenticação (/entrar, /cadastro, /recuperar-senha).

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="container flex max-w-lg flex-col py-10 md:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant sm:p-8">
        <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
    </div>
  );
}

/** Lê a configuração do servidor (Google ligado? banco ligado?). */
export function useAuthConfig(): AuthConfig | null {
  const [cfg, setCfg] = useState<AuthConfig | null>(null);
  useEffect(() => {
    let mounted = true;
    getAuthConfig()
      .then((c) => mounted && setCfg(c))
      .catch(() => mounted && setCfg({ googleEnabled: false, dbConfigured: false }));
    return () => {
      mounted = false;
    };
  }, []);
  return cfg;
}

export function DbNotice({ cfg }: { cfg: AuthConfig | null }) {
  if (!cfg || cfg.dbConfigured) return null;
  return (
    <p
      role="status"
      className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold text-foreground"
    >
      A Área do Pai ainda não está ligada ao banco de dados. O cadastro abre assim que o dono
      configurar o Supabase.
    </p>
  );
}

/** Botão "Entrar com Google": só aparece quando GOOGLE_CLIENT_ID está configurado. */
export function GoogleButton({
  cfg,
  next,
  label = "Entrar com Google",
}: {
  cfg: AuthConfig | null;
  next?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  if (!cfg?.googleEnabled) return null;
  const go = async () => {
    setLoading(true);
    try {
      await signInWithGoogle(next);
    } catch (e) {
      toast.error(ptError(e));
      setLoading(false);
    }
  };
  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-bold transition-colors hover:border-primary disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleIcon className="h-5 w-5" />
        )}
        {label}
      </button>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export const authInput =
  "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-60";
export const authPrimary =
  "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60";
