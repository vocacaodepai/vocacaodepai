import { useAuth } from "@/lib/auth-context";

/**
 * Reserved ad slot — placeholder visible ONLY to the team (admin/editor),
 * never to the public. When real ads are configured, replace the inner
 * content with the ad unit and the visibility can be opened up.
 */
export function AdSlot({
  className = "",
  format = "rect",
}: {
  className?: string;
  format?: "rect" | "leaderboard" | "skyscraper";
}) {
  // O perfil já está no contexto de auth; antes cada slot da página disparava
  // a própria consulta ao Supabase só para descobrir se era equipe.
  const { ready, profile } = useAuth();
  const show = ready && (profile?.role === "admin" || profile?.role === "editor");

  if (!show) return null;

  const heights = {
    rect: "min-h-[250px]",
    leaderboard: "min-h-[90px]",
    skyscraper: "min-h-[600px]",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-6 text-center ${heights[format]} ${className}`}
      aria-label={"Publicidade"}
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
        {"Publicidade"}
      </span>
      <span className="text-xs text-muted-foreground">
        Espaço reservado para anúncios — visível apenas para a equipe
      </span>
    </div>
  );
}
