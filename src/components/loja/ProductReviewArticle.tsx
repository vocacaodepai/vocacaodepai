import { CheckCircle2, XCircle } from "lucide-react";
import type { Product } from "@/lib/loja/types";
import { productPriceRange } from "@/lib/loja/price-range";
import { BuyButton } from "./BuyButton";

/**
 * Review do Pai (doc 05 §4.7): review longa da página do produto, lida de
 * `products.review` (JSON do `review_gen.py`): veredito 0-10 com 5 critérios, prós e
 * contras, "Ideal para", "Em 3 pontos", seções com botões "Comprar agora na Amazon"
 * espalhados, variação de preço (a faixa é escrita pelo componente), ficha técnica,
 * como avaliamos, "A opinião do Vocação de Pai" e FAQ. Tudo vira texto no React.
 */

const formatScore = (n: number) => n.toFixed(1).replace(".", ",");

export function ProductReviewArticle({ product }: { product: Product }) {
  const review = product.review;
  if (!review || typeof review !== "object") return null;

  const href = product.affiliate_url;
  const network = product.affiliate_network;
  const priceInfo = productPriceRange(product);
  const criteria = Array.isArray(review.criterios) ? review.criterios : [];
  const sections = Array.isArray(review.secoes) ? review.secoes : [];
  const points = Array.isArray(review.em_3_pontos) ? review.em_3_pontos : [];
  const sheet = Array.isArray(review.ficha) ? review.ficha : [];
  const faq = Array.isArray(review.faq) ? review.faq : [];
  const pros = Array.isArray(product.pros) ? product.pros : [];
  const cons = Array.isArray(product.cons) ? product.cons : [];
  const score = typeof review.nota === "number" ? review.nota : null;

  const Cta = () => (
    <div className="my-5">
      <BuyButton href={href} network={network} productName={product.name} />
    </div>
  );

  return (
    <section
      id="review-do-pai"
      className="mt-14 scroll-mt-24"
      aria-labelledby="review-do-pai-title"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-primary">Review do Pai</p>
      <h2
        id="review-do-pai-title"
        className="mt-1 font-display text-2xl font-bold leading-tight md:text-3xl"
      >
        {review.titulo ?? `${product.name}: vale a pena?`}
      </h2>
      {review.resumo && (
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-foreground/80">
          {review.resumo}
        </p>
      )}

      {/* Veredito: nota 0-10 e 5 barras de critério */}
      <div className="mt-6 grid gap-5 rounded-3xl border border-border bg-card p-5 shadow-soft md:grid-cols-[auto,1fr] md:p-7">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-primary/10 px-8 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Veredito
          </p>
          <p
            className="mt-1 font-display text-5xl font-extrabold text-primary"
            aria-label={score != null ? `Nota ${formatScore(score)} de 10` : undefined}
          >
            {score != null ? formatScore(score) : "—"}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">de 10 · nota editorial</p>
        </div>
        <ul className="space-y-2.5" aria-label="Critérios da nota">
          {criteria.map((c, i) => {
            const n = Number(c.nota) || 0;
            return (
              <li key={i}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>{c.nome}</span>
                  <span className="text-primary">{formatScore(n)}</span>
                </div>
                <div
                  className="mt-1 h-2 overflow-hidden rounded-full bg-muted"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-valuenow={n}
                  aria-label={c.nome}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, Math.max(0, n * 10))}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {(pros.length > 0 || cons.length > 0) && (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {pros.length > 0 && (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
              <h3 className="font-display text-lg font-bold">Prós</h3>
              <ul className="mt-3 space-y-2">
                {pros.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {cons.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-display text-lg font-bold">Contras</h3>
              <ul className="mt-3 space-y-2">
                {cons.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {review.ideal_para && (
        <div className="mt-5 rounded-2xl border border-secondary bg-secondary/25 p-5">
          <p className="text-sm font-bold">Ideal para</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/80">{review.ideal_para}</p>
        </div>
      )}

      <Cta />

      {points.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-display text-xl font-bold">Em 3 pontos</h3>
          <ol className="mt-3 space-y-3">
            {points.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span className="text-foreground/85">{p}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <article key={i}>
            <h3 className="font-display text-xl font-bold md:text-2xl">{s.titulo}</h3>
            <div className="mt-3 space-y-3">
              {(s.paragrafos ?? []).map((p, j) => (
                <p key={j} className="text-base leading-relaxed text-foreground/85">
                  {p}
                </p>
              ))}
            </div>
            {s.cta && <Cta />}
          </article>
        ))}

        <article>
          <h3 className="font-display text-xl font-bold md:text-2xl">Variação de preço</h3>
          <p className="mt-3 text-base leading-relaxed text-foreground/85">
            {review.preco_texto ? `${review.preco_texto} ` : ""}
            {priceInfo
              ? priceInfo.kind === "market"
                ? `A faixa de ${priceInfo.text} foi pesquisada na internet, em mais de uma loja${priceInfo.checkedOn ? `, em ${priceInfo.checkedOn}` : ""}: não é o preço da Amazon. `
                : `A faixa estimada é de ${priceInfo.text}; é só uma estimativa, não o preço da Amazon. `
              : "Ainda não registramos a faixa de preço deste produto. "}
            O valor do dia pode ser diferente: confira no botão antes de comprar.
          </p>
          <Cta />
        </article>

        {sheet.length > 0 && (
          <article>
            <h3 className="font-display text-xl font-bold md:text-2xl">Ficha técnica resumida</h3>
            <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
              {sheet.map((row, i) => (
                <li key={i} className="px-4 py-2.5 text-sm leading-relaxed">
                  {row}
                </li>
              ))}
            </ul>
          </article>
        )}

        {review.como_avaliamos && (
          <article>
            <h3 className="font-display text-xl font-bold md:text-2xl">Como avaliamos</h3>
            <p className="mt-3 text-base leading-relaxed text-foreground/85">
              {review.como_avaliamos}
            </p>
          </article>
        )}

        {review.opiniao && (
          <article className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
            <h3 className="font-display text-lg font-bold">A opinião do Vocação de Pai</h3>
            <p className="mt-2 text-base leading-relaxed text-foreground/85">{review.opiniao}</p>
            <Cta />
          </article>
        )}
      </div>

      {faq.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-xl font-bold md:text-2xl">Perguntas frequentes</h3>
          <div className="mt-3 space-y-2">
            {faq.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-border bg-card px-5 py-3 shadow-soft"
              >
                <summary className="cursor-pointer list-none text-sm font-bold">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-foreground/80">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {review.atualizado_em && (
        <p className="mt-6 text-xs text-muted-foreground">
          Review atualizada em{" "}
          {new Date(review.atualizado_em).toLocaleDateString("pt-BR", { timeZone: "UTC" })}.
        </p>
      )}
    </section>
  );
}
