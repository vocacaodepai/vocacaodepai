import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ptError, safeNext } from "@/lib/auth";
import { loadMyMember } from "@/lib/auth-ui";

// /auth/callback (doc 07 §4.7): troca o `code` (PKCE) por sessão, decide entre
// onboarding e `next` (só caminho interno) e usa replace para não voltar aqui.

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Entrando na Área do Pai…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const next = safeNext(url.searchParams.get("next"));
      const errorDescription = url.searchParams.get("error_description");
      if (errorDescription) {
        toast.error(errorDescription);
        window.location.replace("/entrar");
        return;
      }
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }
        // Fluxo implícito (hash com access_token) é tratado por detectSessionInUrl no client.
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          if (!cancelled) setMessage("Sessão não encontrada. Redirecionando para o login…");
          window.location.replace(`/entrar?next=${encodeURIComponent(next)}`);
          return;
        }
        if (next.startsWith("/recuperar-senha")) {
          window.location.replace(next);
          return;
        }
        const member = await loadMyMember(user.id);
        if (member && !member.onboarding_done) {
          window.location.replace("/area-do-pai/onboarding");
          return;
        }
        window.location.replace(next);
      } catch (e) {
        toast.error(ptError(e));
        window.location.replace("/entrar");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container flex min-h-[50vh] items-center justify-center py-16 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      {message}
    </div>
  );
}
