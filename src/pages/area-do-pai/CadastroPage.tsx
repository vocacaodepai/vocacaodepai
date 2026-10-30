import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import {
  isValidPassword,
  passwordStrength,
  ptError,
  resendConfirmation,
  safeNext,
} from "@/lib/auth";
import { signUpFn } from "@/lib/area-do-pai/auth.functions";
import { isValidEmail } from "@/lib/newsletter";
import {
  AuthShell,
  DbNotice,
  GoogleButton,
  authInput,
  authPrimary,
  useAuthConfig,
} from "@/components/area-do-pai/AuthShell";
import { TurnstileWidget } from "@/components/area-do-pai/TurnstileWidget";
import { cn } from "@/lib/utils";

// /cadastro (doc 07 §4.7): nome, e-mail, senha (medidor), newsletter, consentimento LGPD,
// Turnstile (se houver chave) + honeypot + tempo mínimo. Submit → signUpFn (servidor).

export default function CadastroPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"), "/area-do-pai/onboarding");
  const cfg = useAuthConfig();
  const { user, ready } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [accept, setAccept] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (ready && user) navigate("/area-do-pai", { replace: true });
  }, [ready, user, navigate]);

  const strength = passwordStrength(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) return void toast.error("Digite seu nome.");
    if (!isValidEmail(email)) return void toast.error("Informe um e-mail válido.");
    if (!isValidPassword(password))
      return void toast.error("A senha precisa de 8 caracteres ou mais, com letras e números.");
    if (!accept) return void toast.error("Aceite os Termos de Uso e a Política de Privacidade.");
    setLoading(true);
    try {
      const r = await signUpFn({
        data: {
          email: email.trim(),
          password,
          displayName: displayName.trim(),
          newsletterOptIn: newsletter,
          acceptTerms: true,
          turnstileToken: turnstileToken || undefined,
          website,
          startedAt: startedAt.current,
        },
      });
      if (r.session) {
        await supabase.auth.setSession(r.session);
        toast.success("Conta criada. Bem-vindo.");
        navigate(next, { replace: true });
        return;
      }
      setPendingEmail(email.trim().toLowerCase());
    } catch (err) {
      toast.error(ptError(err));
      setResetKey((k) => k + 1);
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!pendingEmail) return;
    setResending(true);
    try {
      await resendConfirmation(pendingEmail);
      toast.success("Reenviamos o link de confirmação.");
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setResending(false);
    }
  };

  if (pendingEmail) {
    return (
      <AuthShell title="Confira seu e-mail" subtitle="Falta um passo para ativar sua conta.">
        <div
          role="status"
          className="rounded-xl border border-success/40 bg-success/10 p-4 text-sm"
        >
          <p className="flex items-center gap-2 font-bold">
            <Mail className="h-4 w-4 text-success" aria-hidden />
            Enviamos um link para {pendingEmail}
          </p>
          <p className="mt-1 text-foreground/80">
            Clique no link para confirmar o e-mail e entrar na Área do Pai. Se não chegar em alguns
            minutos, olhe a caixa de spam.
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={resend} disabled={resending} className={authPrimary}>
            {resending && <Loader2 className="h-4 w-4 animate-spin" />}
            Reenviar e-mail
          </button>
          <Link
            to="/entrar"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-bold text-foreground hover:border-primary"
          >
            Já confirmei, quero entrar
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Crie sua conta grátis"
      subtitle="Leva um minuto. Sem cartão."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/entrar" className="font-bold text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <DbNotice cfg={cfg} />
      <GoogleButton cfg={cfg} next="/area-do-pai/onboarding" label="Cadastrar com Google" />

      <form onSubmit={submit} className="space-y-3" noValidate>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Seu nome
          </span>
          <input
            type="text"
            autoComplete="name"
            required
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Como quer ser chamado"
            className={authInput}
          />
        </label>
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
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Senha
          </span>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres, com letras e números"
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
          {password && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "h-1.5 flex-1 rounded-full bg-muted",
                      strength.score >= n &&
                        (strength.score <= 1
                          ? "bg-danger"
                          : strength.score === 2
                            ? "bg-warning"
                            : "bg-success"),
                    )}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Força da senha: {strength.label}</p>
            </div>
          )}
        </label>

        {/* Honeypot: invisível para pessoas; robôs preenchem e são descartados. */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
          <label htmlFor="cadastro-website">Não preencha este campo</label>
          <input
            type="text"
            id="cadastro-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-foreground/85">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          Quero receber o resumo semanal por e-mail (confirmação em dois passos; sai quando quiser).
        </label>
        <label className="flex items-start gap-2 text-sm text-foreground/85">
          <input
            type="checkbox"
            required
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            Li e aceito os{" "}
            <Link
              to="/termos-de-uso"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link
              to="/politica-de-privacidade"
              className="font-semibold text-primary underline underline-offset-2"
            >
              Política de Privacidade
            </Link>
            .
          </span>
        </label>

        <TurnstileWidget onToken={setTurnstileToken} resetKey={resetKey} />

        <button
          type="submit"
          disabled={loading || cfg?.dbConfigured === false}
          className={authPrimary}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          Criar conta
        </button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Seus dados são tratados conforme a LGPD. Você pode exportar ou excluir sua conta a
          qualquer momento em Minha conta.
        </p>
      </form>
    </AuthShell>
  );
}
