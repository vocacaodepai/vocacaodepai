import { Heart } from "lucide-react";

const VDM_URL = "https://vocacaodemae.com.br";

/**
 * Bloco "Para a sua esposa: Vocação de Mãe" (doc 03 §6.2).
 * Renderizado antes do "Continue lendo" quando o body tem o nó
 * `paraAEsposa {slug, title}` (preenchido pela rotina na Fase 8 via API pública
 * do VDM). Sem o nó, a página não chama este componente.
 */
export function ParaAEsposa({ slug, title }: { slug: string; title: string }) {
  const href = `${VDM_URL}/post/${encodeURIComponent(slug)}`;
  return (
    <aside
      aria-label="Para a sua esposa: Vocação de Mãe"
      className="mt-10 flex items-start gap-4 rounded-2xl border border-border bg-gradient-soft p-5 shadow-soft"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Heart className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          Para a sua esposa: Vocação de Mãe
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          No Vocação de Mãe, o portal da mãe de família, ela encontra o outro lado deste assunto:
        </p>
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="mt-2 inline-block font-display text-lg font-bold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {title}
        </a>
        <p className="mt-1 text-xs text-muted-foreground">
          <a href={VDM_URL} target="_blank" rel="noopener" className="hover:text-primary">
            vocacaodemae.com.br
          </a>
        </p>
      </div>
    </aside>
  );
}
