import { useEffect, useState } from "react";
import { Check, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken, ptError } from "@/lib/auth";
import { usePlan } from "@/hooks/usePlan";
import { getPlans, registerPlanInterest } from "@/lib/area-do-pai/area.functions";
import type { PlanView } from "@/lib/area-do-pai/types";
import { AreaShell, primaryBtn, secondaryBtn } from "@/components/area-do-pai/AreaShell";
import { cn } from "@/lib/utils";

// /area-do-pai/plano (doc 07 §7.3): Pai de Família (gratuito, ativo) e Pai de Valor
// (plans.active=false → "em breve"; nenhum checkout). Gating no app: usePlan().

const price = (p: PlanView) =>
  p.price_cents === 0
    ? "Grátis"
    : `${(p.price_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/${p.interval === "year" ? "ano" : "mês"}`;

export default function PlanoPage() {
  const { user } = useAuth();
  const { slug: current, name: currentName } = usePlan();
  const [plans, setPlans] = useState<PlanView[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  const interest = async () => {
    setBusy(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken || !user) throw new Error("Faça login para continuar.");
      const r = await registerPlanInterest({ data: { accessToken } });
      setRegistered(true);
      toast.success(r.ok ? "Anotado. Avisamos você quando o Pai de Valor abrir." : "Anotado.");
    } catch (e) {
      toast.error(ptError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AreaShell title="Seu plano" description={`Você está no plano ${currentName}.`}>
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando…
        </p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {plans.map((p) => {
            const isCurrent = p.slug === current;
            const paid = p.slug !== "gratuito";
            return (
              <section
                key={p.slug}
                className={cn(
                  "rounded-2xl border bg-card p-6 shadow-soft",
                  paid ? "border-accent/50" : "border-border",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
                    {paid && <Crown className="h-5 w-5 text-accent" aria-hidden />}
                    {p.name}
                  </h2>
                  {isCurrent ? (
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      Seu plano
                    </span>
                  ) : paid && !p.active ? (
                    <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent">
                      Em breve
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                <p className="mt-4 font-display text-3xl font-bold">
                  {price(p)}
                  {paid && (
                    <span className="ml-2 text-sm font-semibold text-muted-foreground">
                      ou R$ 179/ano
                    </span>
                  )}
                </p>
                <ul className="mt-4 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {paid ? (
                    p.active ? (
                      <button type="button" disabled className={primaryBtn}>
                        Assinar (checkout em preparação)
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={interest}
                        disabled={busy || registered}
                        className={cn(
                          primaryBtn,
                          "bg-accent text-accent-foreground hover:bg-accent/90",
                        )}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Crown className="h-4 w-4" />
                        )}
                        {registered ? "Você será avisado" : "Em breve — me avise"}
                      </button>
                    )
                  ) : (
                    <span className={cn(secondaryBtn, "pointer-events-none")}>
                      <Check className="h-4 w-4" /> Ativo
                    </span>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        O plano Pai de Valor ainda não está aberto: sem cobrança e sem checkout por enquanto. O
        gratuito continua completo para tudo o que o site oferece hoje.
      </p>
    </AreaShell>
  );
}
