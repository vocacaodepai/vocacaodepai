import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2, LogIn, Mail, UserPlus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Author } from "@/lib/types";
import { AuthContext } from "@/lib/auth-context";
import { toast } from "sonner";

// Login com Google: ativado em 24/08/2026 (Enter Cloud já possui a
// configuração do provedor). Se voltar a dar erro "forbidden", conferir
// no Google Cloud se o app OAuth está publicado e com a URL de retorno certa.
const GOOGLE_LOGIN_ENABLED = true;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Author | null>(null);
  const [ready, setReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = (userId: string) => {
      setTimeout(async () => {
        try {
          void userId;
          const { data } = await supabase.rpc("get_my_profile");
          if (mounted) setProfile((data as unknown as Author) ?? null);
        } catch {
          if (mounted) setProfile(null);
        }
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
      setProfile(null);
      if (session?.user) loadProfile(session.user.id);
    });

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
        if (data.user) loadProfile(data.user.id);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
      void sub.subscription.unsubscribe();
    };
  }, []);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);
  const refreshProfile = useCallback(async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) {
      setProfile(null);
      return;
    }
    const { data } = await supabase.rpc("get_my_profile");
    setProfile((data as unknown as Author) ?? null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, ready, openLogin, logout, refreshProfile }}>
      {children}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </AuthContext.Provider>
  );
}

function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");

  if (!open) return null;

  if (pendingEmail) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-7 text-center shadow-elegant">
          <Mail className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-4 font-display text-2xl font-bold">{"Confirme seu e-mail"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {`Enviamos um link de confirmação para ${pendingEmail}. Clique no link para ativar sua conta e depois volte para entrar.`}
          </p>
          <button
            onClick={onClose}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            {"Entendi"}
          </button>
        </div>
      </div>
    );
  }

  const googleLogin = async () => {
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/` },
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ops, não foi possível assinar. Tente novamente.",
      );
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) {
      toast.error("Informe e-mail e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await supabase.auth.signInWithPassword({ email, password });
        onClose();
      } else {
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        setPendingEmail(email);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("email not confirmed")) {
        toast.error(
          "Este e-mail ainda não foi confirmado. Verifique sua caixa de entrada e clique no link de confirmação.",
        );
      } else {
        toast.error(message || "Ops, não foi possível assinar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-elegant"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">
              {mode === "login" ? "Que bom ter você de volta!" : "Crie sua conta"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {
                "Entre para comentar, curtir, responder aos quizzes, ler histórias e compartilhar a sua."
              }
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {GOOGLE_LOGIN_ENABLED && (
          <>
            <button
              onClick={googleLogin}
              disabled={loading}
              className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-background text-sm font-bold transition-colors hover:border-primary disabled:opacity-60"
            >
              <GoogleIcon className="h-5 w-5" />
              {"Continuar com Google"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {"ou"}
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={"Seu nome"}
              className={inputCls}
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={"E-mail"}
            className={inputCls}
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={"Senha"}
            className={inputCls}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? (
              <>
                <LogIn className="h-4 w-4" />
                {"Entrar"}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {"Criar conta"}
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-4 w-full text-center text-sm font-semibold text-primary hover:underline"
        >
          {mode === "login" ? "Não tem conta? Crie uma grátis" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
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
