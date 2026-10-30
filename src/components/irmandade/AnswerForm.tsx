import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { createAnswerFn } from "@/lib/community.functions";
import type { AnswerRow } from "@/lib/irmandade/types";
import { AVISO_PROFISSIONAL } from "@/content/irmandade/codigo-de-conduta";
import { ConductCheckbox } from "./ConductCheckbox";

/** Formulário de resposta (pós-moderação: entra approved). Honeypot `website`. */
export function AnswerForm({
  questionId,
  onCreated,
}: {
  questionId: string;
  onCreated: (a: AnswerRow) => void;
}) {
  const [body, setBody] = useState("");
  const [conduct, setConduct] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return;
    if (!conduct) return toast.error("Aceite o código de conduta para responder.");
    setBusy(true);
    try {
      const a = await createAnswerFn({ data: { questionId, body, acceptedConduct: true } });
      onCreated(a);
      setBody("");
      toast.success("Resposta publicada. Obrigado, irmão.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível responder.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <h3 className="font-display text-lg font-bold">Sua resposta</h3>
      <p className="text-xs text-muted-foreground">{AVISO_PROFISSIONAL}</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        minLength={10}
        maxLength={6000}
        required
        placeholder="Diga o que você fez e o que aprendeu. Se for questão médica, jurídica ou financeira, indique um profissional."
        className="w-full rounded-xl border border-border bg-background p-3 text-sm"
      />
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <ConductCheckbox checked={conduct} onChange={setConduct} />
      <button
        type="submit"
        disabled={busy || body.trim().length < 10}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{" "}
        Responder
      </button>
    </form>
  );
}
