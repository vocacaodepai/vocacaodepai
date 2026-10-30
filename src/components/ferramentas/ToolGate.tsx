import { Lock, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * TRAVA DE LOGIN DAS FERRAMENTAS (doc 06 §0.4 item 3):
 * false = ferramentas liberadas para qualquer visitante (padrão do Vocação de Pai).
 * O campo `gated` do registry permite travar uma ferramenta específica no futuro.
 */
const TOOLS_GATED = false;

export function ToolGate({ children }: { children: React.ReactNode }) {
  const { user, ready, openLogin } = useAuth();

  if (!TOOLS_GATED) return <>{children}</>;
  if (ready && user) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none">
        <div className="max-h-[560px] overflow-hidden">{children}</div>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, hsl(var(--background) / 0.55) 35%, hsl(var(--background) / 0.92) 75%, hsl(var(--background)) 100%)",
        }}
      />
      <div className="relative z-10 -mt-28 flex justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-card p-6 text-center shadow-elegant">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </span>
          <h3 className="mt-3 font-display text-xl font-bold">
            Entre para usar a ferramenta completa
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Crie sua conta grátis na Área do Pai e salve seus resultados.
          </p>
          <button
            type="button"
            onClick={openLogin}
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-elegant transition-colors hover:bg-primary/90"
          >
            <LogIn className="h-4 w-4" />
            Entrar ou criar conta
          </button>
          <p className="mt-3 text-[11px] text-muted-foreground">Leva 30 segundos. Sem spam.</p>
        </div>
      </div>
    </div>
  );
}
