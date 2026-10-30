import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@/lib/router-compat";
import { reportFn } from "@/lib/community.functions";

/** "Denunciar" (doc 09 §1.3 regra 9): 3 denúncias tiram o conteúdo do ar até a moderação olhar. */
export function ReportButton({
  entity,
  entityId,
  next,
}: {
  entity: "story" | "question" | "answer";
  entityId: string;
  next: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);

  if (done)
    return <span className="text-xs text-muted-foreground">Denúncia registrada. Obrigado.</span>;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() =>
          user ? setOpen(true) : navigate(`/entrar?next=${encodeURIComponent(next)}`)
        }
        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive"
      >
        <Flag className="h-3.5 w-3.5" /> Denunciar
      </button>
    );
  }
  const send = async () => {
    try {
      await reportFn({ data: { entity, entityId, reason } });
      setDone(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao denunciar.");
    }
  };
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm sm:max-w-md">
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Qual regra foi ferida?
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={500}
        className="rounded-lg border border-border bg-background p-2 text-sm"
        placeholder="Explique em uma linha (mín. 5 caracteres)"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={send}
          disabled={reason.trim().length < 5}
          className="rounded-full bg-destructive px-4 py-1.5 text-xs font-bold text-destructive-foreground disabled:opacity-50"
        >
          Enviar denúncia
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-border px-4 py-1.5 text-xs font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
