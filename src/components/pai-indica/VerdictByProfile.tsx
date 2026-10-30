import type { ComparisonData } from "@/lib/pai-indica/types";
import { AffiliateButton } from "./AffiliateButton";

/** "Qual comprar": um cartão por perfil de uso, com o produto escolhido e o botão. */
export function VerdictByProfile({
  data,
  hrefs,
}: {
  data: ComparisonData;
  hrefs: Record<string, string>;
}) {
  const byslug = new Map(data.products.map((p) => [p.product_slug, p]));
  return (
    <section aria-labelledby="qual-comprar" className="space-y-4">
      <h2 id="qual-comprar" className="font-display text-2xl font-bold">
        Qual comprar
      </h2>
      {data.verdict_by_profile.map((v) => {
        const p = byslug.get(v.pick_slug);
        return (
          <div key={v.profile} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="font-semibold">{v.profile}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha <strong className="text-foreground">{p?.name ?? v.pick_slug}</strong>:{" "}
              {v.reason}
            </p>
            {hrefs[v.pick_slug] && (
              <AffiliateButton
                href={hrefs[v.pick_slug]!}
                productSlug={v.pick_slug}
                productName={p?.name}
                className="mt-3"
              />
            )}
          </div>
        );
      })}
    </section>
  );
}
