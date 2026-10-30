import { useEffect, useState } from "react";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { isValidPassword, ptError, requestPasswordReset, updatePassword } from "@/lib/auth";
import {
  AuthShell,
  DbNotice,
  authInput,
  authPrimary,
  useAuthConfig,
} from "@/components/area-do-pai/AuthShell";
import { isValidEmail } from "@/lib/newsletter";

// /recuperar-senha (doc 07 §4.7): step=pedir (padrão) e step=nova (vindo do callback de recovery).

export default function RecuperarSenhaPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const step = params.get("step") === "nova" ? "nova" : "pedir";
  const cfg = useAuthConfig();
  const { user, ready } = useAuth();

  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  // step=nova exige a sessão de recovery; sem ela, volta a pedir o link.
  useEffect(() => {
    if (step === "nova" && ready && !user) {
      toast.error("O link expirou. Peça um novo.");
      navigate("/recuperar-senha", { replace: true });
    }
  }, [step, ready, user, navigate]);

  const ask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) return void toast.error("Informe um e-mail válido.");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setLoading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword(pw))
      return void toast.error("A senha precisa de 8 caracteres ou mais, com letras e números.");
    if (pw !== pw2) return void toast.error("As senhas não conferem.");
    setLoading(true);
    try {
      await updatePassword(pw);
      toast.success("Senha atualizada.");
      navigate("/area-do-pai", { replace: true });
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setLoading(false);
    }
  };

  if (step === "nova") {
    return (
      <AuthShell title="Crie uma nova senha" subtitle="Escolha uma senha forte e guarde bem.">
        <form onSubmit={save} className="space-y-3" noValidate>
          <input
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Nova senha (mínimo 8, letras e números)"
            className={authInput}
          />
          <input
            type="password"
            autoComplete="new-password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Repita a nova senha"
            className={authInput}
          />
          <button type="submit" disabled={loading || !user} className={authPrimary}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Salvar nova senha
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe o e-mail da conta. Se existir, enviamos o link."
      footer={
        <Link to="/entrar" className="font-bold text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      <DbNotice cfg={cfg} />
      {sent ? (
        <div
          role="status"
          className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm"
        >
          <p className="flex items-center gap-2 font-bold">
            <Mail className="h-4 w-4 text-success" aria-hidden />
            Se existir conta com esse e-mail, enviamos o link
          </p>
          <p className="mt-1 text-foreground/80">
            Abra o link para criar uma senha nova. Ele vale por 1 hora. Não chegou? Olhe o spam.
          </p>
        </div>
      ) : (
        <form onSubmit={ask} className="space-y-3" noValidate>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com.br"
            className={authInput}
          />
          <button
            type="submit"
            disabled={loading || cfg?.dbConfigured === false}
            className={authPrimary}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Enviar link de recuperação
          </button>
        </form>
      )}
    </AuthShell>
  );
}
