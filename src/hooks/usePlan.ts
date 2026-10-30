import { useEffect, useState } from "react";
import { db } from "@/lib/area-do-pai/client";
import { useAuth } from "@/lib/auth-context";

// Gating de plano no front (doc 07 §7.4). É UX, nunca a única barreira: o gating
// real é RLS/funções que chamam public.is_premium() no banco.

export type PlanSlug = "gratuito" | "pai-de-valor";

export type PremiumFeature =
  | "trilha-avancada"
  | "grupos"
  | "ebooks"
  | "descontos"
  | "mentoria"
  | "sem-anuncios"
  | "trilha-basica"
  | "desafios"
  | "salvos";

const FREE_FEATURES = new Set<PremiumFeature>(["trilha-basica", "desafios", "salvos"]);

export function usePlan() {
  const { user, ready } = useAuth();
  const [slug, setSlug] = useState<PlanSlug>("gratuito");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setSlug("gratuito");
      setLoading(false);
      return;
    }
    let mounted = true;
    db.rpc("my_plan_slug").then(
      ({ data }) => {
        if (!mounted) return;
        setSlug(data === "pai-de-valor" ? "pai-de-valor" : "gratuito");
        setLoading(false);
      },
      () => {
        if (!mounted) return;
        setSlug("gratuito");
        setLoading(false);
      },
    );
    return () => {
      mounted = false;
    };
  }, [user, ready]);

  const premium = slug === "pai-de-valor";
  return {
    slug,
    premium,
    loading,
    name: premium ? "Pai de Valor" : "Pai de Família",
    can: (feature: PremiumFeature) => premium || FREE_FEATURES.has(feature),
  };
}
