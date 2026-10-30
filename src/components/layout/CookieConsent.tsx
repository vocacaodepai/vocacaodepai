import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";

// Banner de consentimento de cookies (LGPD/GDPR). Os scripts de anúncios
// (AdSense) e analytics (GA4) em src/routes/__root.tsx já sobem com o
// Google Consent Mode v2 em "denied" por padrão — nenhum cookie de
// publicidade/analytics é setado até a pessoa aceitar aqui. Ao aceitar,
// chamamos gtag('consent','update', ...) para liberar; ao rejeitar, a
// escolha fica salva e os cookies continuam bloqueados.

const STORAGE_KEY = "cookie-consent";
const CHANGE_EVENT = "cookie-consent-changed";

type Consent = "granted" | "denied";

function applyConsent(consent: Consent) {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", {
    ad_storage: consent,
    ad_user_data: consent,
    ad_personalization: consent,
    analytics_storage: consent,
  });
}

function getStoredConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

/** Limpa a escolha salva e reabre o banner — usado pelo link "Preferências de cookies" no footer. */
export function reopenCookieConsent() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      const stored = getStoredConsent();
      if (stored) applyConsent(stored);
      setVisible(stored === null);
    };
    sync();
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const choose = (consent: Consent) => {
    window.localStorage.setItem(STORAGE_KEY, consent);
    applyConsent(consent);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-elegant backdrop-blur sm:px-6"
    >
      <div className="container flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm leading-relaxed text-foreground/80">
          Usamos cookies essenciais e, com seu consentimento, cookies de anúncios e análise de
          tráfego. Veja detalhes na nossa{" "}
          <Link
            to="/politica-de-privacidade"
            className="font-bold text-primary underline underline-offset-2"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="h-10 rounded-xl border border-border px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            Rejeitar
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
