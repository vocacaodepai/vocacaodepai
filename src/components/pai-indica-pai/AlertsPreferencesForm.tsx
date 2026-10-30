import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { saveJobAlerts } from "@/lib/pai-indica-pai/functions";
import { JOB_AREAS, UFS, type JobArea, type UF } from "@/lib/pai-indica-pai/taxonomies";
import { cn } from "@/lib/utils";
import { TurnstileField } from "./TurnstileField";
import { btnPrimary, inputCls } from "./shared";

/** "Receba vagas da sua região por e-mail" (doc 08 §5.1) → newsletter_subscribers.segments.vagas. */
export function AlertsPreferencesForm({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [ufs, setUfs] = useState<UF[]>([]);
  const [areas, setAreas] = useState<JobArea[]>([]);
  const [remoto, setRemoto] = useState(true);
  const [token, setToken] = useState("");
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const toggle = <T,>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await saveJobAlerts({
        data: {
          email: email || user?.email || "",
          ufs,
          areas,
          remoto,
          turnstile_token: token,
          website,
        },
      });
      if (res.ok) setDone(res.message);
      else toast.error(res.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar agora.");
      setToken("");
      setResetKey((k) => k + 1);
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-sm">
        <strong>Alertas ativados.</strong> {done}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn("space-y-4 rounded-2xl border border-border bg-card p-6", compact && "p-5")}
    >
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-accent" />
        <h3 className="font-display text-xl font-bold">Receba vagas da sua região por e-mail</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Um e-mail por dia, só quando houver vaga nova na sua UF ou área. Cancela quando quiser.
      </p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
        className={inputCls}
        aria-label="E-mail"
      />
      <div>
        <span className="text-sm font-bold">UF</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {UFS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUfs((l) => toggle(l, u))}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-bold",
                ufs.includes(u)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="text-sm font-bold">Áreas</span>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {(Object.entries(JOB_AREAS) as [JobArea, string][]).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setAreas((a) => toggle(a, k))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-bold",
                areas.includes(k)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={remoto}
          onChange={(e) => setRemoto(e.target.checked)}
        />{" "}
        Incluir vagas remotas
      </label>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
      />
      <TurnstileField onToken={setToken} resetKey={resetKey} />
      <button type="submit" disabled={sending} className={btnPrimary}>
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}{" "}
        Quero receber
      </button>
    </form>
  );
}
