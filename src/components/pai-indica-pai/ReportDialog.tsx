import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/ga4";
import { translatePipError } from "@/lib/pai-indica-pai/client";
import { reportEntity } from "@/lib/pai-indica-pai/functions";
import { REPORT_REASONS, type ReportReason } from "@/lib/pai-indica-pai/taxonomies";
import type { PipEntity } from "@/lib/pai-indica-pai/types";
import { TurnstileField } from "./TurnstileField";
import { btnOutline, btnPrimary, inputCls } from "./shared";

/** Denúncia (doc 08 §1.4): anônimo ou logado; 3 denúncias tiram o item do ar até revisão. */
export function ReportDialog({
  entity,
  entityId,
  label = "Denunciar",
}: {
  entity: PipEntity;
  entityId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("golpe");
  const [note, setNote] = useState("");
  const [token, setToken] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await reportEntity({
        data: { entity, entity_id: entityId, reason, note, turnstile_token: token, website },
      });
      trackEvent("job_report", { entity });
      toast.success("Obrigado. Nossa equipe vai revisar.");
      setOpen(false);
      setNote("");
    } catch (err) {
      toast.error(translatePipError(err));
      setToken("");
      setResetKey((k) => k + 1);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={btnOutline}>
          <Flag className="h-4 w-4" /> {label}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Denunciar</DialogTitle>
          <DialogDescription>
            Golpe, pedido de dinheiro, vaga falsa ou conteúdo impróprio? Conte para a moderação. Não
            precisa estar logado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-bold">Motivo</label>
            <select
              className={inputCls}
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
            >
              {Object.entries(REPORT_REASONS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold">Detalhes (opcional)</label>
            <textarea
              rows={3}
              maxLength={500}
              className={inputCls}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="hidden"
            aria-hidden
          />
          <TurnstileField onToken={setToken} resetKey={resetKey} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={btnOutline}>
              Cancelar
            </button>
            <button type="submit" disabled={sending} className={btnPrimary}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}{" "}
              Enviar denúncia
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
