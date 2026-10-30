import { ArrowRight, Construction } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";

// Placeholder "Em construção" das seções futuras (doc 03 §5.3). As rotas que
// usam este componente levam <meta name="robots" content="noindex"> e ficam
// fora do sitemap. O plano o colocava em components/layout/; está aqui porque
// a pasta layout/ é de outra etapa desta mesma fase (ver progresso-etapa-5-7.md).
export function ComingSoon({
  title,
  description,
  eta,
  highlights = [],
  source,
}: {
  title: string;
  description: string;
  /** Quando chega, em linguagem de leitor (ex.: "Próxima etapa do site"). */
  eta?: string;
  /** O que a seção vai ter, em frases curtas. */
  highlights?: string[];
  /** Origem gravada na newsletter (`newsletter_subscribers.source`). */
  source: string;
}) {
  return (
    <div className="container max-w-3xl py-12 md:py-16">
      <span className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-secondary-foreground">
        <Construction className="h-3.5 w-3.5" />
        Em construção
      </span>
      <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/80 md:text-lg">
        {description}
      </p>
      {eta && <p className="mt-2 text-sm font-semibold text-primary">{eta}</p>}

      {highlights.length > 0 && (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {highlights.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-sm shadow-soft"
            >
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      <section
        aria-labelledby="coming-soon-newsletter"
        className="mt-10 rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-elegant md:p-8"
      >
        <h2 id="coming-soon-newsletter" className="font-display text-2xl font-bold">
          Quer ser avisado quando estiver no ar?
        </h2>
        <p className="mt-1 text-sm opacity-90">
          Deixe seu e-mail. Avisamos no dia em que {title} abrir, e você já recebe os guias do blog
          enquanto isso.
        </p>
        <div className="mt-5 max-w-md">
          <NewsletterSignup source={source} />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/blog"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          Enquanto isso, ler o blog
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/sobre"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Conhecer o Vocação de Pai
        </Link>
      </div>
    </div>
  );
}
