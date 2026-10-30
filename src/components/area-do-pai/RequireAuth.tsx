import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";

// Guarda das páginas privadas (doc 07 §4.7): sem sessão → /entrar?next=<rota>;
// com perfil sem onboarding (e rota ≠ onboarding) → /area-do-pai/onboarding.

export function RequireAuth({
  children,
  allowOnboarding = false,
}: {
  children: ReactNode;
  allowOnboarding?: boolean;
}) {
  const { user, member, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const needsOnboarding = !!member && !member.onboarding_done && !allowOnboarding;

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      navigate(`/entrar?next=${encodeURIComponent(location.pathname + location.search)}`, {
        replace: true,
      });
      return;
    }
    if (needsOnboarding) navigate("/area-do-pai/onboarding", { replace: true });
  }, [ready, user, needsOnboarding, navigate, location.pathname, location.search]);

  if (!ready || !user || needsOnboarding) {
    return (
      <div className="container flex min-h-[50vh] items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        {ready && !user ? "Redirecionando para o login…" : "Carregando sua Área do Pai…"}
      </div>
    );
  }
  return <>{children}</>;
}
