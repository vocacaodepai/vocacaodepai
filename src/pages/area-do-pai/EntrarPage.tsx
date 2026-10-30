import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { ptError, safeNext, signInWithMagicLink, signInWithPassword } from "@/lib/auth";
import {
  AuthShell,
  DbNotice,
  GoogleButton,
  authInput,
  authPrimary,
  useAuthConfig,
} from "@/components/area-do-pai/AuthShell";
import { cn } from "@/lib/utils";

// /entrar (doc 07 §4.7): Google (se configurado) + abas "E-mail e senha" | "Link por e-mail".

type Mode = "senha" | "link";

export default function EntrarPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const cfg = useAuthConfig();
  const { user, ready } = useAuth();

  const [mode, setMode] = useState<Mode>("senha");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  // Já logado: vai direto.
  useEffect(() => {
    if (ready && user) navigate(next, { replace: true });
  }, [ready, user, next, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Informe o seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "senha") {
        if (!password) {
          toast.error("Informe a sua senha.");
          return;
        }
        await signInWithPassword(email.trim(), password);
        toast.success("Bem-vindo de volta.");
        navigate(next, { replace: true });
      } else {
        await signInWithMagicLink(email.trim(), next);
        setLinkSent(true);
      }
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (active: boolean) =>
    cn(
      "flex-1 rounded-lg px-3 py-2 text-sm font-bold transition-colors",
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <AuthShell
      title="Entre na Área do Pai"
      subtitle="Seu lugar para crescer como pai, marido e homem."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            to={`/cadastro${next !== "/area-do-pai" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-bold text-primary hover:underline"
          >
            Criar conta grátis
          </Link>
        </>
      }
    >
      <DbNotice cfg={cfg} />
      <GoogleButton cfg={cfg} next={next} />

      <div
        role="tablist"
        className="mb-4 flex gap-1 rounded-xl border border-border bg-muted/50 p-1"
      >
        <button
          role="tab"
          type="button"
          aria-selected={mode === "senha"}
          onClick={() => setMode("senha")}
          className={tabClass(mode === "senha")}
        >
          E-mail e senha
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={mode === "link"}
          onClick={() => setMode("link")}
          className={tabClass(mode === "link")}
        >
          Link por e-mail
        </button>
      </div>

      {linkSent ? (
        <div
          role="status"
          className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm"
        >
          <p className="flex items-center gap-2 font-bold">
            <Mail className="h-4 w-4 text-success" aria-hidden />
            Confira seu e-mail
          </p>
          <p className="mt-1 text-foreground/80">
            Enviamos um link de acesso para <strong>{email}</strong>. Ele vale por 1 hora. Se não
            chegar, olhe o spam.
          </p>
          <button
            type="button"
            onClick={() => setLinkSent(false)}
            className="mt-3 text-sm font-bold text-primary hover:underline"
          >
            Usar outro e-mail
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              E-mail
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com.br"
              className={authInput}
            />
          </label>
          {mode === "senha" && (
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Senha
              </span>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className={cn(authInput, "pr-12")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Link
                to="/recuperar-senha"
                className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
              >
                Esqueci minha senha
              </Link>
            </label>
          )}
          <button
            type="submit"
            disabled={loading || cfg?.dbConfigured === false}
            className={authPrimary}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "senha" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {mode === "senha" ? "Entrar" : "Enviar link de acesso"}
          </button>
          {mode === "link" && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Sem senha: você recebe um link e entra com um clique. Se ainda não tem conta, ela é
              criada na hora.
            </p>
          )}
        </form>
      )}
    </AuthShell>
  );
}
