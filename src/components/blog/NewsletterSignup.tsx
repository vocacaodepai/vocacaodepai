import { useEffect, useRef, useState } from "react";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { trackEvent } from "@/lib/ga4";
import {
  NEWSLETTER_GENERIC_OK,
  SPOUSE_NEWSLETTER_ENABLED,
  TURNSTILE_SITE_KEY,
  isValidEmail,
  type NewsletterSubscribeInput,
  type NewsletterSubscribeResult,
} from "@/lib/newsletter";

// Formulário de newsletter com double opt-in (doc 03 §4.6 item 3):
// POST /api/newsletter → linha `pending` + e-mail de confirmação. A resposta é
// sempre "Verifique seu e-mail". Antispam: honeypot (`website`), tempo mínimo
// (`startedAt`) e Cloudflare Turnstile quando TURNSTILE_SITE_KEY existir —
// sem a chave o widget simplesmente não aparece.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.turnstile) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.defer = true;
    s.addEventListener("load", () => resolve(), { once: true });
    s.addEventListener("error", () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

export function NewsletterSignup({
  compact = false,
  source = "site",
}: {
  compact?: boolean;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [spouseWanted, setSpouseWanted] = useState(false);
  const [spouseEmail, setSpouseEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const startedAt = useRef<number>(Date.now());
  const turnstileEl = useRef<HTMLDivElement>(null);
  const turnstileId = useRef<string | null>(null);

  // Widget do Turnstile (só com a site key).
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileEl.current) return;
    let cancelled = false;
    void loadTurnstileScript().then(() => {
      if (cancelled || !window.turnstile || !turnstileEl.current || turnstileId.current) return;
      try {
        turnstileId.current = window.turnstile.render(turnstileEl.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          size: "flexible",
          language: "pt-br",
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
        });
      } catch {
        /* sem widget: a API cai para honeypot + rate limit */
      }
    });
    return () => {
      cancelled = true;
      if (turnstileId.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileId.current);
        } catch {
          /* ignore */
        }
        turnstileId.current = null;
      }
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (spouseWanted && spouseEmail && !isValidEmail(spouseEmail)) {
      toast.error("O e-mail da sua esposa parece inválido.");
      return;
    }
    setLoading(true);
    try {
      const payload: NewsletterSubscribeInput = {
        email: email.trim(),
        source,
        website,
        startedAt: startedAt.current,
        turnstileToken: turnstileToken || undefined,
        spouseEmail: SPOUSE_NEWSLETTER_ENABLED && spouseWanted ? spouseEmail.trim() : undefined,
      };
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => null)) as NewsletterSubscribeResult | null;
      if (!res.ok || !data?.ok) {
        toast.error(data?.message ?? "Não foi possível assinar agora. Tente de novo.");
        if (turnstileId.current && window.turnstile) window.turnstile.reset(turnstileId.current);
        return;
      }
      trackEvent("newsletter_subscribe", { source });
      setDone(data.message || NEWSLETTER_GENERIC_OK);
      setEmail("");
      setSpouseEmail("");
    } catch {
      toast.error("Não foi possível assinar agora. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div
        role="status"
        className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm font-semibold text-foreground"
      >
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
        <span>{done}</span>
      </div>
    );
  }

  const inputClass =
    "h-12 w-full min-w-0 flex-1 rounded-lg border border-input bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2" noValidate>
      <div className="flex w-full gap-2">
        <input
          type="email"
          id={`newsletter-email-${source}`}
          name="email"
          aria-label="Seu melhor e-mail"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor e-mail"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={loading}
          className={`inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary font-display text-base font-semibold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60 ${
            compact ? "px-4" : "px-6"
          }`}
        >
          <Send className="h-4 w-4" aria-hidden />
          {loading ? "Enviando…" : "Assinar"}
        </button>
      </div>

      {/* Honeypot: invisível para pessoas; robôs preenchem e são descartados. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
        <label htmlFor={`newsletter-website-${source}`}>Não preencha este campo</label>
        <input
          type="text"
          id={`newsletter-website-${source}`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {SPOUSE_NEWSLETTER_ENABLED && (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-foreground/85">
            <input
              type="checkbox"
              checked={spouseWanted}
              onChange={(e) => setSpouseWanted(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Minha esposa também quer receber o Vocação de Mãe
          </label>
          {spouseWanted && (
            <input
              type="email"
              name="spouseEmail"
              aria-label="E-mail da sua esposa"
              autoComplete="off"
              value={spouseEmail}
              onChange={(e) => setSpouseEmail(e.target.value)}
              placeholder="E-mail da sua esposa"
              className={inputClass}
            />
          )}
        </div>
      )}

      {TURNSTILE_SITE_KEY ? <div ref={turnstileEl} className="min-h-[65px]" /> : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Você recebe um e-mail para confirmar a inscrição (sem confirmação, nada é enviado). Sem
        spam; saída com um clique. Veja a{" "}
        <Link to="/politica-de-privacidade" className="underline underline-offset-2">
          Política de Privacidade
        </Link>
        .
      </p>
    </form>
  );
}
