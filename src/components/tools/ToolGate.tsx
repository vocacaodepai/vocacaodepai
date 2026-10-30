import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * TRAVA DE LOGIN DAS FERRAMENTAS (decisão da dona):
 * false = ferramentas liberadas para qualquer visitante (sem login).
 * true  = volta a exigir login (trava suave "gostinho") em todas as ferramentas.
 * A dona pediu para liberar por enquanto, mas manter o mecanismo para reativar no futuro.
 */
const TOOLS_GATED = false;

/**
 * Trava suave ("gostinho") para ferramentas: quem não está logado vê o começo
 * da ferramenta e, conforme desce, o conteúdo ganha opacidade e surge um card
 * de login obrigatório para liberar o acesso completo.
 */
export function ToolGate({ children }: { children: React.ReactNode }) {
  const { user, ready, openLogin } = useAuth();

  // Liberado: ferramentas abertas para todos, sem login.
  if (!TOOLS_GATED) {
    return <>{children}</>;
  }

  // Usuário logado (ou ainda carregando o estado de auth) vê o conteúdo.
  if (ready && user) {
    return <>{children}</>;
  }

  // Não logado: bloqueado, sem opção de "ver a ferramenta inteira".
  return (
    <div className="relative">
      {/* Conteúdo com fade no fim (gostinho) */}
      <div className="pointer-events-none select-none">
        <div className="max-h-[560px] overflow-hidden">{children}</div>
      </div>

      {/* Degradê de opacidade sobre o fim do conteúdo */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.55) 35%, hsl(var(--background) / 0.92) 75%, hsl(var(--background)) 100%)",
        }}
      />

      {/* Card de login */}
      <div className="relative z-10 -mt-28 flex justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-card p-6 text-center shadow-elegant">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </span>
          <h3 className="mt-3 font-display text-xl font-bold">
            {"Para continuar utilizando a ferramenta"}
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            {
              "Faça o seu login no site (ou crie uma conta grátis) para liberar o acesso completo e salvar o seu acompanhamento."
            }
          </p>
          <button
            onClick={openLogin}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-elegant transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            {"Entrar / Criar conta grátis"}
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {"Grátis, sem compromisso. Leva menos de 1 minuto."}
          </p>
        </div>
      </div>
    </div>
  );
}
