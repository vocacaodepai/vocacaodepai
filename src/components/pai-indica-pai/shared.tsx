import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@/lib/router-compat";
import {
  Briefcase,
  Compass,
  Handshake,
  Loader2,
  LogIn,
  Mail,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { resendConfirmation, translatePipError } from "@/lib/pai-indica-pai/client";
import { AVISO_ANTIFRAUDE, CODIGO_DE_CONDUTA } from "@/lib/pai-indica-pai/taxonomies";
import { cn } from "@/lib/utils";

// Peças compartilhadas do Pai Indica Pai: navegação das 4 frentes, campo de formulário,
// código de conduta, aviso antifraude e a "porta" de login/e-mail verificado (doc 08 §1.1, §3.4).

export const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60";
export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60";

export const PIP_SECTIONS = [
  { to: "/pai-indica-pai", label: "Pai Indica Pai", icon: Compass, end: true },
  { to: "/pai-indica-pai/vagas", label: "Vagas", icon: Briefcase, end: false },
  { to: "/pai-indica-pai/indicacoes", label: "Indicações", icon: Handshake, end: false },
  { to: "/pai-indica-pai/profissionais", label: "Pai Profissional", icon: Wrench, end: false },
  { to: "/pai-indica-pai/mentoria", label: "Mentoria", icon: Compass, end: false },
] as const;

export function PipNav({ current }: { current: string }) {
  return (
    <nav aria-label="Seções do Pai Indica Pai" className="flex flex-wrap gap-2">
      {PIP_SECTIONS.map((s) => {
        const active = s.end ? current === s.to : current.startsWith(s.to);
        return (
          <Link
            key={s.to}
            to={s.to}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <label className="text-sm font-bold">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}

export function ConductNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-5">
      <h3 className="font-display text-lg font-bold">Código de conduta do Pai Indica Pai</h3>
      <ol
        className={cn(
          "mt-2 list-decimal space-y-1 pl-5 text-sm",
          compact ? "text-muted-foreground" : "",
        )}
      >
        {CODIGO_DE_CONDUTA.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
    </div>
  );
}

export function AntifraudNotice() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
      <p>
        <strong>Sinal de alerta:</strong> {AVISO_ANTIFRAUDE}
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
      <h3 className="font-display text-2xl font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * Porta de entrada dos formulários: anônimo → "Entre para publicar"; logado sem e-mail
 * confirmado → aviso + "Reenviar e-mail de confirmação"; verificado → children.
 */
export function LoginGate({ children, what = "publicar" }: { children: ReactNode; what?: string }) {
  const { user, ready, openLogin } = useAuth();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      setVerified(null);
      return;
    }
    let mounted = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (mounted) setVerified(Boolean(data.user?.email_confirmed_at));
      })
      .catch(() => {
        if (mounted) setVerified(false);
      });
    return () => {
      mounted = false;
    };
  }, [user]);

  if (!ready || (user && verified === null)) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando sua conta…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <LogIn className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Entre para {what}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          O Pai Indica Pai é uma rede de pais de verdade: só membro logado com e-mail confirmado
          publica. Ler é livre para todos.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={openLogin} className={btnPrimary}>
            <LogIn className="h-4 w-4" /> Entrar ou criar conta
          </button>
          <Link to="/entrar" className={btnOutline}>
            Ir para a página de login
          </Link>
        </div>
      </div>
    );
  }

  if (!verified) {
    const resend = async () => {
      if (!user.email) return;
      setSending(true);
      try {
        await resendConfirmation(user.email);
        toast.success("E-mail de confirmação reenviado. Verifique sua caixa de entrada.");
      } catch (e) {
        toast.error(translatePipError(e));
      } finally {
        setSending(false);
      }
    };
    return (
      <div className="rounded-3xl border border-accent/40 bg-accent/10 p-8 text-center">
        <Mail className="mx-auto h-10 w-10 text-accent" />
        <h2 className="mt-4 font-display text-2xl font-bold">Confirme seu e-mail para {what}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Enviamos um link de confirmação para {user.email}. Clique nele e volte aqui. Isso protege
          a rede contra vagas falsas.
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className={cn(btnPrimary, "mt-6")}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{" "}
          Reenviar e-mail de confirmação
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    pending: ["Em moderação", "bg-accent/20 text-accent-foreground"],
    approved: ["No ar", "bg-primary/15 text-primary"],
    rejected: ["Não aprovada", "bg-destructive/10 text-destructive"],
    expired: ["Encerrada", "bg-muted text-muted-foreground"],
    archived: ["Arquivado", "bg-muted text-muted-foreground"],
    requested: ["Aguardando", "bg-accent/20 text-accent-foreground"],
    accepted: ["Aceita", "bg-primary/15 text-primary"],
    declined: ["Recusada", "bg-destructive/10 text-destructive"],
    completed: ["Concluída", "bg-muted text-muted-foreground"],
    cancelled: ["Cancelada", "bg-muted text-muted-foreground"],
  };
  const [label, cls] = map[status] ?? [status, "bg-muted text-muted-foreground"];
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", cls)}>{label}</span>;
}
