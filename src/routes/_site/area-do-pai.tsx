import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { RequireAuth } from "@/components/area-do-pai/RequireAuth";
import { privateHead } from "@/lib/area-do-pai/head";

// Layout de /area-do-pai/* (Fase 5): guarda de sessão + redirecionamento para o
// onboarding. As páginas ficam em area-do-pai/{index,onboarding,filhos,salvos,plano}.tsx.
export const Route = createFileRoute("/_site/area-do-pai")({
  head: () => privateHead("Área do Pai"),
  component: AreaLayout,
});

function AreaLayout() {
  const { pathname } = useLocation();
  const onboarding = pathname.replace(/\/$/, "").endsWith("/onboarding");
  return (
    <RequireAuth allowOnboarding={onboarding}>
      <Outlet />
    </RequireAuth>
  );
}
