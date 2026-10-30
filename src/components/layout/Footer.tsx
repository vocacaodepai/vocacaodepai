import { Link } from "@/lib/router-compat";
import { ExternalLink, Heart } from "lucide-react";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import {
  SITE_FOOTER_SIGNATURE,
  SITE_GROUP,
  SITE_NAME,
  SITE_TAGLINE,
  SOCIAL_LINKS,
  VDM_NAME,
  VDM_URL,
} from "@/lib/site";
import { reopenCookieConsent } from "./CookieConsent";
import { Logo } from "./Logo";
import { NAV_INSTITUCIONAL, NAV_MAIN } from "./nav";

// Rodapé em 4 colunas (doc 03 §4.4): (1) logo + slogan + redes + bloco fixo
// "Para a sua esposa: Vocação de Mãe" (link natural, sem nofollow — doc 00 §9.1);
// (2) Seções; (3) Institucional + "Gerenciar cookies"; (4) Newsletter.

const colTitle = "mb-3 font-display text-base font-semibold uppercase tracking-wider text-primary";
const linkClass = "text-muted-foreground transition-colors hover:text-primary";

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-border bg-card/60">
      <div className="container grid gap-10 py-12 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1.3fr]">
        {/* 1. Marca + Vocação de Mãe */}
        <div>
          <Link to="/" className="inline-flex text-primary" aria-label={`${SITE_NAME} — início`}>
            <Logo />
          </Link>
          <p className="mt-3 max-w-sm font-display text-lg font-semibold text-foreground/90">
            {SITE_TAGLINE}.
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Formação do homem como pai, marido, provedor e líder servidor. Conteúdo direto, de homem
            para homem, com a fé no lugar dela.
          </p>
          {SOCIAL_LINKS.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-3 text-sm">
              {SOCIAL_LINKS.map((s) => (
                <li key={s.href}>
                  <a href={s.href} target="_blank" rel="noopener" className={linkClass}>
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <a
            href={VDM_URL}
            target="_blank"
            rel="noopener"
            className="group mt-5 flex max-w-sm items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Heart className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Para a sua esposa
              </span>
              <span className="flex items-center gap-1 font-display text-lg font-semibold text-primary group-hover:underline">
                {VDM_NAME}
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="block text-xs text-muted-foreground">vocacaodemae.com.br</span>
            </span>
          </a>
        </div>

        {/* 2. Seções */}
        <div>
          <p className={colTitle}>Seções</p>
          <ul className="space-y-2 text-sm">
            {NAV_MAIN.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
                {item.store && (
                  <span className="ml-1 text-xs text-accent">· O pai também quer desconto</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* 3. Institucional */}
        <div>
          <p className={colTitle}>Institucional</p>
          <ul className="space-y-2 text-sm">
            {NAV_INSTITUCIONAL.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => reopenCookieConsent()} className={linkClass}>
                Gerenciar cookies
              </button>
            </li>
          </ul>
        </div>

        {/* 4. Newsletter */}
        <div>
          <p className={colTitle}>Newsletter</p>
          <p className="mb-3 text-sm text-muted-foreground">
            O essencial da semana para o pai, direto no e-mail. Sem spam.
          </p>
          <NewsletterSignup compact source="rodape" />
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col gap-3 py-5 text-xs text-muted-foreground">
          <p className="max-w-3xl leading-relaxed">
            O conteúdo deste site é informativo e educacional e não substitui médico, psicólogo,
            advogado, contador ou padre. Em caso de dúvida, procure um profissional. Como Associado
            da Amazon, o {SITE_NAME} recebe por compras qualificadas feitas pelos links do site, sem
            custo extra para você (
            <Link to="/politica-de-afiliados" className="underline underline-offset-2">
              Política de Afiliados
            </Link>
            ).
          </p>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {SITE_NAME} · Um site do {SITE_GROUP} · Participante do
              Programa de Associados da Amazon
            </p>
            <p className="sm:text-right">{SITE_FOOTER_SIGNATURE}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
