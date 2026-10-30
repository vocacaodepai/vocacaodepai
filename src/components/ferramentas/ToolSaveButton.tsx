import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { isToolSaved, saveTool, unsaveTool } from "@/lib/tools/saved";

/** "Salvar na Área do Pai" (saved_items, item_type 'tool'). Deslogado → abre o login. */
export function ToolSaveButton({ slug }: { slug: string }) {
  const { user, ready, openLogin } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user)
      isToolSaved(user.id, slug)
        .then(setSaved)
        .catch(() => setSaved(false));
    else setSaved(false);
  }, [user, slug]);

  async function toggle() {
    if (!ready) return;
    if (!user) return openLogin();
    setBusy(true);
    try {
      if (saved) {
        await unsaveTool(user.id, slug);
        setSaved(false);
        toast("Removido dos salvos.");
      } else {
        await saveTool(user.id, slug);
        setSaved(true);
        toast.success("Salvo na sua Área do Pai.");
      }
    } catch {
      toast.error("Não deu certo agora. Tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={saved}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold hover:border-primary"
    >
      {saved ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {saved ? "Salvo" : "Salvar"}
    </button>
  );
}
