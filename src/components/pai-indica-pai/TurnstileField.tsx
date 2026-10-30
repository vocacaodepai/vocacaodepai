import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/newsletter";

// Cloudflare Turnstile (doc 08 §7.2) sem dependência nova: mesmo carregador do NewsletterSignup.
// Sem TURNSTILE_SITE_KEY o widget não aparece e o servidor degrada para honeypot + rate limit.

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};
const api = () =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { turnstile?: TurnstileApi }).turnstile;

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || api()) return resolve();
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

export const TURNSTILE_ENABLED = Boolean(TURNSTILE_SITE_KEY);

export function TurnstileField({
  onToken,
  error,
  resetKey = 0,
}: {
  onToken: (token: string) => void;
  error?: string;
  /** Incrementar para resetar o widget (token é de uso único). */
  resetKey?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !el.current) return;
    let cancelled = false;
    void loadScript().then(() => {
      const t = api();
      if (cancelled || !t || !el.current || id.current) return;
      try {
        id.current = t.render(el.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          language: "pt-BR",
          callback: (token: string) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        });
      } catch {
        /* widget indisponível: segue sem */
      }
    });
    return () => {
      cancelled = true;
      const t = api();
      if (id.current && t) {
        try {
          t.remove(id.current);
        } catch {
          /* já removido */
        }
        id.current = null;
      }
    };
    // onToken é estável nos formulários (field.onChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetKey > 0 && id.current) api()?.reset(id.current);
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return (
    <div>
      <div ref={el} className="min-h-[65px]" />
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
