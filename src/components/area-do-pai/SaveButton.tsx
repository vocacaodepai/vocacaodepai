import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken } from "@/lib/auth";
import { toggleSavedItem } from "@/lib/area-do-pai/area.functions";
import type { SavedItemType } from "@/lib/area-do-pai/types";
import { cn } from "@/lib/utils";

// Botão "Salvar" genérico da Área do Pai (doc 07 §5.2). Usado por post, produto,
// ferramenta (item_id = slug), vaga e trilha. Anônimo → /entrar?next=<rota atual>.
// `initialSaved` vem de listMySavedIds() quando a página quer marcar o estado.

export interface SaveButtonProps {
  itemType: SavedItemType;
  /** uuid (post/produto/vaga/trilha) ou slug (ferramenta). */
  itemId: string;
  initialSaved?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Mostra o texto "Salvar"/"Salvo" ao lado do ícone. */
  label?: boolean;
  onChange?: (saved: boolean) => void;
}

export function SaveButton({
  itemType,
  itemId,
  initialSaved = false,
  size = "md",
  className,
  label = true,
  onChange,
}: SaveButtonProps) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  useEffect(() => setSaved(initialSaved), [initialSaved]);

  const onClick = async () => {
    if (!ready || busy) return;
    if (!user) {
      navigate(`/entrar?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    const prev = saved;
    setBusy(true);
    setSaved(!prev);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Sessão expirada. Entre novamente.");
      const r = await toggleSavedItem({ data: { accessToken, itemType, itemId } });
      setSaved(r.saved);
      onChange?.(r.saved);
      toast.success(r.saved ? "Salvo na sua Área do Pai." : "Removido dos salvos.");
    } catch (e) {
      setSaved(prev);
      toast.error((e as Error).message || "Não foi possível salvar agora.");
    } finally {
      setBusy(false);
    }
  };

  const Icon = busy ? Loader2 : saved ? BookmarkCheck : Bookmark;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? "Remover dos salvos" : "Salvar na Área do Pai"}
      title={saved ? "Remover dos salvos" : "Salvar na Área do Pai"}
      disabled={!ready}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-60",
        size === "sm" && "h-9 px-3 text-xs",
        size === "md" && "h-11 px-4 text-sm",
        size === "lg" && "h-14 rounded-2xl px-5 text-sm",
        saved && "border-primary bg-primary/10 text-primary",
        className,
      )}
    >
      <Icon className={cn("h-4 w-4", busy && "animate-spin", saved && !busy && "fill-current")} />
      {label && (saved ? "Salvo" : "Salvar")}
    </button>
  );
}
