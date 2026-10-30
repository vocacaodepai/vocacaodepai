import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { usePlan, type PremiumFeature } from "@/hooks/usePlan";

// <PremiumGate feature="ebooks" fallback={<UpsellCard/>}>…</PremiumGate> (doc 07 §7.4).
// Só UX: o gating real é RLS/funções com public.is_premium() no banco.

export function UpsellCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
      <p className="flex items-center gap-2 font-display text-xl font-bold text-foreground">
        <Lock className="h-5 w-5 text-accent" aria-hidden />
        Pai de Valor
      </p>
      {!compact && (
        <p className="mt-2 text-sm leading-relaxed text-foreground/80">
          Trilhas avançadas, grupos fechados, e-books e descontos de parceiros. Em breve: o plano
          pago ainda não está aberto.
        </p>
      )}
      <Link
        to="/area-do-pai/plano"
        className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
      >
        Quero ser Pai de Valor
      </Link>
    </div>
  );
}

export function PremiumGate({
  feature,
  children,
  fallback,
}: {
  feature: PremiumFeature;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can, loading } = usePlan();
  if (loading) return null;
  if (can(feature)) return <>{children}</>;
  return <>{fallback ?? <UpsellCard />}</>;
}
