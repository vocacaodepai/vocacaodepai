import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/newsletter";

// Widget Cloudflare Turnstile (render explícito). Só aparece com TURNSTILE_SITE_KEY;
// sem a chave, o servidor degrada para honeypot + rate limit (doc 03 §4.6 item 4).

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
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

export const turnstileEnabled = () => Boolean(TURNSTILE_SITE_KEY);

export function TurnstileWidget({
  onToken,
  resetKey = 0,
}: {
  onToken: (token: string) => void;
  /** Mude o valor para resetar o widget (ex.: depois de um erro no envio). */
  resetKey?: number;
}) {
  const el = useRef<HTMLDivElement>(null);
  const id = useRef<string | null>(null);
  const cb = useRef(onToken);
  cb.current = onToken;

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !el.current) return;
    let cancelled = false;
    void loadScript().then(() => {
      if (cancelled || !window.turnstile || !el.current || id.current) return;
      try {
        id.current = window.turnstile.render(el.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          size: "flexible",
          language: "pt-br",
          callback: (token: string) => cb.current(token),
          "expired-callback": () => cb.current(""),
          "error-callback": () => cb.current(""),
        });
      } catch {
        /* sem widget: a API cai para honeypot + rate limit */
      }
    });
    return () => {
      cancelled = true;
      if (id.current && window.turnstile) {
        try {
          window.turnstile.remove(id.current);
        } catch {
          /* ignore */
        }
        id.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resetKey && id.current && window.turnstile) {
      try {
        window.turnstile.reset(id.current);
      } catch {
        /* ignore */
      }
    }
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={el} className="min-h-[65px]" />;
}
