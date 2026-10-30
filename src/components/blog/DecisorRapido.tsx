import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Tipos do conteúdo do widget (vêm do atributo `data` do nó TipTap)   */
/* ------------------------------------------------------------------ */

export interface DecisorLink {
  label: string;
  href: string;
}

export interface DecisorOption {
  /** Texto do botão de resposta (ex.: "Escada e elevador"). */
  label: string;
  /** Título da resposta revelada, em negrito (ex.: "Chicco Ohlalà 3."). */
  title: string;
  /** Texto de apoio da resposta revelada. */
  text: string;
  /** Links (Amazon) exibidos junto da resposta. */
  links?: DecisorLink[];
}

export interface DecisorQuestion {
  question: string;
  options: DecisorOption[];
}

export interface DecisorData {
  questions: DecisorQuestion[];
}

/* ------------------------------------------------------------------ */
/* Widget React: perguntas com botões que revelam a resposta + link.   */
/* ------------------------------------------------------------------ */

export function DecisorRapidoWidget({ data }: { data: DecisorData }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const hasAffiliateLinks = data.questions.some((q) =>
    q.options.some((o) => o.links && o.links.length > 0),
  );

  return (
    <div className="decisor-rapido my-6 space-y-5">
      {data.questions.map((q, qi) => {
        const active = selected[qi];
        const shown = active !== undefined && active >= 0 ? q.options[active] : null;
        return (
          <div key={qi} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-display text-lg font-bold leading-snug text-foreground">
              {q.question}
            </h3>

            <div className="mt-4 space-y-2">
              {q.options.map((o, oi) => {
                const isActive = active === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, [qi]: isActive ? -1 : oi }))}
                    aria-pressed={isActive}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary/40 text-foreground hover:bg-secondary",
                    )}
                  >
                    <span>{o.label}</span>
                    {isActive && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {shown && (
              <div className="mt-4 rounded-xl border border-border/70 bg-muted/50 p-4">
                <p className="font-bold leading-snug text-foreground">{shown.title}</p>
                {shown.text && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {shown.text}
                  </p>
                )}
                {shown.links && shown.links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {shown.links.map((l, li) => (
                      <a
                        key={li}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer sponsored nofollow"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-soft"
                        style={{
                          backgroundColor: "hsl(var(--primary))",
                          color: "hsl(var(--primary-foreground))",
                        }}
                      >
                        <ShoppingBag className="h-4 w-4" />
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      {hasAffiliateLinks && (
        <p className="text-xs text-muted-foreground">
          {
            "Aviso de transparência: alguns links desta página são de afiliados. Isso significa que podemos receber uma comissão se você fizer uma compra por eles, sem nenhum custo extra para você."
          }
        </p>
      )}
    </div>
  );
}
