import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { fetchIsAdmin } from "./admin-db";

/**
 * `/admin/login` (doc 03 §8.6): e-mail e senha pela Supabase Auth. Não há
 * cadastro aqui — a conta é criada na Área do Pai (Fase 5) ou pelo dono no
 * painel do Supabase, e o papel `editor`/`admin` é dado em `profiles.role`.
 */
export default function AdminLogin() {
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useSeo({ title: "Entrar no painel", noindex: true });

  // Já logado com papel de equipe? Vai direto para o painel.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user || !mounted) return;
      if (await fetchIsAdmin()) window.location.replace("/admin");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const friendly = (message: string) => {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("email not confirmed"))
      return "Este e-mail ainda não foi confirmado. Verifique a caixa de entrada.";
    if (m.includes("rate limit") || m.includes("too many"))
      return "Muitas tentativas. Aguarde um minuto e tente de novo.";
    return message || "Não foi possível entrar. Tente novamente.";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    if (!email.trim()) {
      setNotice("Informe o e-mail.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/admin/login`,
        });
        if (error) throw error;
        toast.success("Enviamos um link de redefinição para o seu e-mail.");
        setMode("login");
        return;
      }
      if (password.length < 6) {
        setNotice("Informe a senha (mínimo 6 caracteres).");
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      const isStaff = await fetchIsAdmin();
      if (!isStaff) {
        setNotice(
          "Acesso restrito à equipe: esta conta não tem papel de editor ou admin. Peça ao administrador para liberar.",
        );
        await supabase.auth.signOut();
        return;
      }
      toast.success("Bem-vindo ao painel.");
      // Carga completa: o painel abre já com a sessão persistida.
      window.location.href = "/admin";
    } catch (err) {
      setNotice(friendly(err instanceof Error ? err.message : ""));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elegant">
        <div className="flex flex-col items-center text-center">
          <span className="font-display text-xl font-bold text-primary">{SITE_NAME}</span>
          <h1 className="mt-4 font-display text-2xl font-bold">
            {mode === "reset" ? "Redefinir senha" : "Entrar no painel"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acesso restrito à equipe editorial (editor ou admin).
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            className={inputCls}
          />
          {mode === "login" && (
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              className={inputCls}
            />
          )}
          {notice && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive"
            >
              {notice}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {mode === "reset" ? "Enviar link de redefinição" : "Entrar"}
          </button>
        </form>

        <div className="mt-4 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNotice(null);
              setMode(mode === "login" ? "reset" : "login");
            }}
            className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-primary hover:underline"
          >
            {mode === "login" ? "Esqueci minha senha" : "Voltar ao login"}
          </button>
          <a href="/" className="text-xs text-muted-foreground hover:underline">
            Voltar ao site
          </a>
        </div>
      </div>
    </div>
  );
}
