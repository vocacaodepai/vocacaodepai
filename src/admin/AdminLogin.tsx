import { useState } from "react";
import { Heart } from "lucide-react";
import { resetPassword, signIn, signUp } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";

export default function AdminLogin() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useSeo({ title: "Entrar no painel", noindex: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "reset") {
        if (!email) {
          toast.error("Informe o e-mail cadastrado.");
          return;
        }
        await resetPassword(email);
        toast.success("Enviamos um link de redefinição para o seu e-mail.");
        setMode("login");
        return;
      }
      if (!email || password.length < 6) {
        toast.error("Informe e-mail e senha (mínimo 6 caracteres).");
        return;
      }
      if (mode === "login") {
        await signIn(email, password);
        // Garante que a sessão realmente foi criada antes de navegar.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Sessão não iniciada. Tente novamente ou use "Esqueci minha senha".');
          return;
        }
        toast.success("Login realizado! Entrando no painel...");
        // Redirecionamento REAL (recarrega a página): elimina qualquer problema
        // de navegação interna do SPA — o painel abre em uma carga completa.
        window.location.href = "/admin";
      } else {
        await signUp(email, password, fullName || email.split("@")[0]);
        toast.success("Conta criada! Bem-vinda ao painel.");
        window.location.href = "/admin";
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível entrar. Tente novamente.";
      toast.error(
        msg === "Invalid login credentials"
          ? "E-mail ou senha incorretos. Verifique e tente novamente."
          : msg,
      );
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-soft">
            <Heart className="h-6 w-6 fill-current" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">{"Entrar no painel"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {"Acesse para criar, editar e publicar artigos."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
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
          {mode !== "reset" && (
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={"Senha"}
              className={inputCls}
            />
          )}
          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {mode === "reset"
              ? "Enviar link de redefinição"
              : mode === "login"
                ? "Entrar"
                : "Cadastrar"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          {mode === "login" && (
            <button
              onClick={() => setMode("reset")}
              className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-primary hover:underline"
            >
              Esqueci minha senha
            </button>
          )}
          {mode === "reset" ? (
            <button
              onClick={() => setMode("login")}
              className="w-full text-center text-sm font-semibold text-primary hover:underline"
            >
              Voltar ao login
            </button>
          ) : (
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="w-full text-center text-sm font-semibold text-primary hover:underline"
            >
              {mode === "login" ? "Criar uma conta" : "Entrar"}
            </button>
          )}
        </div>

        {mode === "signup" && (
          <p className="mt-4 rounded-xl bg-secondary/40 p-3 text-center text-xs text-secondary-foreground">
            A primeira conta criada neste site recebe o papel de administradora.
          </p>
        )}
      </div>
    </div>
  );
}
