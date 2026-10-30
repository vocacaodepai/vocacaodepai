import { useEffect, useId, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Cookie, Settings2 } from "lucide-react";
import { loadGa4 } from "@/lib/ga4";

// Banner de consentimento de cookies (LGPD, padrão do Guia ANPD — doc 03 §4.6
// item 1 / doc 11 §2.7), com Google Consent Mode v2:
// - O head() da rota raiz (src/routes/__root.tsx) já executa
//   gtag('consent','default', {... 'denied'}) antes de qualquer script do Google.
// - 1º nível: "Aceitar", "Rejeitar não necessários" e "Gerenciar", com o mesmo destaque.
// - 2º nível: Necessários (sempre ativos) / Analíticos / Publicidade, desmarcados por padrão.
// - A escolha fica em localStorage (`vdp-consent`, com versão e timestamp).
// - GA4 (loadGa4) só é carregado depois de analytics_storage = granted.
// - O link "Gerenciar cookies" do rodapé chama reopenCookieConsent().

export const CONSENT_STORAGE_KEY = "vdp-consent";
export const CONSENT_VERSION = 1;
const CHANGE_EVENT = "vdp-consent-reopen";

export interface ConsentChoice {
  v: number;
  ts: string;
  analytics: boolean;
  ads: boolean;
}

type ConsentState = "granted" | "denied";
const toState = (ok: boolean): ConsentState => (ok ? "granted" : "denied");

function applyConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", {
    ad_storage: toState(choice.ads),
    ad_user_data: toState(choice.ads),
    ad_personalization: toState(choice.ads),
    analytics_storage: toState(choice.analytics),
  });
  if (choice.analytics) loadGa4();
}

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>;
    if (parsed.v !== CONSENT_VERSION) return null; // versão nova do banner → perguntar de novo
    return {
      v: CONSENT_VERSION,
      ts: typeof parsed.ts === "string" ? parsed.ts : new Date().toISOString(),
      analytics: parsed.analytics === true,
      ads: parsed.ads === true,
    };
  } catch {
    return null;
  }
}

function storeConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(choice));
  } catch {
    /* modo privado / storage bloqueado: a escolha vale só nesta página */
  }
}

/** Reabre o banner no 2º nível (preferências), sem apagar a escolha atual até a pessoa salvar. */
export function reopenCookieConsent() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);
  const titleId = useId();

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      applyConsent(stored);
      setAnalytics(stored.analytics);
      setAds(stored.ads);
      setVisible(false);
    } else {
      setVisible(true);
    }
    const reopen = () => {
      const current = getStoredConsent();
      setAnalytics(current?.analytics ?? false);
      setAds(current?.ads ?? false);
      setManage(true);
      setVisible(true);
    };
    window.addEventListener(CHANGE_EVENT, reopen);
    return () => window.removeEventListener(CHANGE_EVENT, reopen);
  }, []);

  const choose = (next: { analytics: boolean; ads: boolean }) => {
    const choice: ConsentChoice = { v: CONSENT_VERSION, ts: new Date().toISOString(), ...next };
    storeConsent(choice);
    applyConsent(choice);
    setVisible(false);
    setManage(false);
  };

  if (!visible) return null;

  const btnBase =
    "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const btnSolid = `${btnBase} bg-primary text-primary-foreground hover:bg-primary/90`;
  const btnOutline = `${btnBase} border border-primary text-primary hover:bg-primary/10`;

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 shadow-elegant backdrop-blur sm:px-6"
    >
      <div className="container">
        {!manage ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <p id={titleId} className="text-sm leading-relaxed text-foreground/85">
                Usamos cookies necessários para o site funcionar e, só com a sua permissão, cookies
                de análise de tráfego e de publicidade. Você pode rejeitar os não necessários sem
                perder nada. Detalhes na{" "}
                <Link
                  to="/politica-de-privacidade"
                  className="font-bold text-primary underline underline-offset-2"
                >
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => choose({ analytics: true, ads: true })}
                className={btnSolid}
              >
                Aceitar
              </button>
              <button
                type="button"
                onClick={() => choose({ analytics: false, ads: false })}
                className={btnSolid}
              >
                Rejeitar não necessários
              </button>
              <button type="button" onClick={() => setManage(true)} className={btnOutline}>
                <Settings2 className="mr-1.5 h-4 w-4" aria-hidden />
                Gerenciar
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              choose({ analytics, ads });
            }}
            className="flex flex-col gap-4"
          >
            <p id={titleId} className="font-display text-xl font-semibold text-foreground">
              Gerenciar cookies
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                <input type="checkbox" checked disabled className="mt-1 h-4 w-4 accent-primary" />
                <span>
                  <span className="block font-bold">Necessários</span>
                  <span className="text-muted-foreground">
                    Sempre ativos: login, preferências de tema e segurança do site.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-bold">Analíticos</span>
                  <span className="text-muted-foreground">
                    Google Analytics, para saber quais conteúdos ajudam mais os pais.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-sm">
                <input
                  type="checkbox"
                  checked={ads}
                  onChange={(e) => setAds(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-bold">Publicidade</span>
                  <span className="text-muted-foreground">
                    Anúncios personalizados. Sem isso, os anúncios aparecem sem personalização.
                  </span>
                </span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={btnSolid}>
                Salvar preferências
              </button>
              <button
                type="button"
                onClick={() => choose({ analytics: true, ads: true })}
                className={btnOutline}
              >
                Aceitar tudo
              </button>
              <button
                type="button"
                onClick={() => choose({ analytics: false, ads: false })}
                className={btnOutline}
              >
                Rejeitar não necessários
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
