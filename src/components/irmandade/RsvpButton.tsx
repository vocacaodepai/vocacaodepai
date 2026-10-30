import { useEffect, useState } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "@/lib/router-compat";
import { myRsvpFn, rsvpFn } from "@/lib/community.functions";
import type { RsvpStatus } from "@/lib/irmandade/types";
import { cn } from "@/lib/utils";

/** RSVP "Vou · Talvez · Cancelar" (doc 09 §8); lotado → "Lista cheia"; deslogado → /entrar?next=. */
export function RsvpButton({
  eventId,
  slug,
  capacityLeft,
  onChange,
}: {
  eventId: string;
  slug: string;
  capacityLeft: number | null;
  onChange?: (s: RsvpStatus) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RsvpStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState(capacityLeft !== null && capacityLeft <= 0);

  useEffect(() => {
    if (!user) return;
    myRsvpFn({ data: { eventId } })
      .then((r) => setStatus(r.status))
      .catch(() => undefined);
  }, [user, eventId]);

  const set = async (s: RsvpStatus) => {
    if (!user) return navigate(`/entrar?next=/eventos/${slug}`);
    setBusy(true);
    try {
      await rsvpFn({ data: { eventId, status: s } });
      setStatus(s);
      onChange?.(s);
      toast.success(
        s === "going"
          ? "Presença confirmada. Até lá, irmão."
          : s === "maybe"
            ? "Anotado como talvez."
            : "Presença cancelada.",
      );
    } catch (e) {
      if (e instanceof Error && e.message === "LOTADO") setFull(true);
      toast.error(
        e instanceof Error && e.message === "LOTADO"
          ? "Lista cheia."
          : e instanceof Error
            ? e.message
            : "Falha ao confirmar.",
      );
    } finally {
      setBusy(false);
    }
  };
  const btn = (s: RsvpStatus, label: string, Icon: typeof Check, disabled = false) => (
    <button
      type="button"
      disabled={busy || disabled}
      onClick={() => set(s)}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-bold transition-colors disabled:opacity-50",
        status === s
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary hover:text-primary",
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
  return (
    <div className="flex flex-wrap gap-2">
      {btn(
        "going",
        full && status !== "going" ? "Lista cheia" : "Vou",
        Check,
        full && status !== "going",
      )}
      {btn("maybe", "Talvez", HelpCircle)}
      {status && status !== "canceled" && btn("canceled", "Cancelar", X)}
    </div>
  );
}
