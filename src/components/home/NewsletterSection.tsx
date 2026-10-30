import { NewsletterSignup } from "@/components/blog/NewsletterSignup";

// Seção 7 da home: captura de newsletter (grava em newsletter_subscribers).
export function NewsletterSection() {
  return (
    <section
      aria-labelledby="newsletter-title"
      className="rounded-3xl bg-gradient-primary p-8 text-center text-primary-foreground shadow-elegant md:p-12"
    >
      <h2 id="newsletter-title" className="font-display text-2xl font-bold md:text-3xl">
        Receba o Vocação de Pai por e-mail
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm opacity-90">
        Guias novos, reviews do Pai Indica e ferramentas, direto na sua caixa de entrada. Sem spam,
        cancela quando quiser.
      </p>
      <div className="mx-auto mt-6 max-w-md">
        <NewsletterSignup source="home" />
      </div>
    </section>
  );
}
