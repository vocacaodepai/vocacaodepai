import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { subscribeNewsletter } from "@/lib/db";
import { toast } from "sonner";

export function NewsletterSignup({
  compact = false,
  source = "site",
}: {
  compact?: boolean;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("Ops, não foi possível assinar. Tente novamente.");
      return;
    }
    setLoading(true);
    try {
      await subscribeNewsletter(email, source);
      setDone(true);
      setEmail("");
    } catch {
      toast.error("Ops, não foi possível assinar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 px-5 py-4 text-sm font-semibold text-secondary-foreground">
        <Mail className="h-5 w-5 shrink-0" />
        {"Obrigada! Agora você faz parte da nossa comunidade."}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full gap-2">
      <input
        type="email"
        id={`newsletter-email-${source}`}
        name="email"
        aria-label={"Seu melhor e-mail"}
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={"Seu melhor e-mail"}
        className="h-12 w-full min-w-0 flex-1 rounded-xl border border-input bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="submit"
        disabled={loading}
        className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-soft transition-all hover:bg-primary/90 disabled:opacity-60 ${
          compact ? "px-4 text-sm" : "px-6 text-sm"
        }`}
      >
        <Send className="h-4 w-4" />
        {"Assinar"}
      </button>
    </form>
  );
}
