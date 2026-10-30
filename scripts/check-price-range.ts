// scripts/check-price-range.ts — conferência de src/lib/loja/price-range.ts (doc 05 §5).
// Rodar: node scripts/check-price-range.ts   (Node 22 roda .ts direto; `tsx` não está instalado)
import { priceRangeSentence, productPriceRange } from "../src/lib/loja/price-range.ts";

const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const casos: [string, boolean][] = [
  [
    "mercado",
    eq(
      productPriceRange({
        price_min: 100,
        price_max: 150,
        price_range_checked_at: "2026-10-24T10:00:00Z",
      }),
      { text: "R$ 100 a R$ 150", kind: "market", checkedOn: "24/10" },
    ),
  ],
  [
    "estimativa",
    eq(productPriceRange({ price: 100 }), {
      text: "R$ 85 a R$ 120",
      kind: "estimate",
      checkedOn: null,
    }),
  ],
  ["sem preço", productPriceRange({}) === null],
  [
    "frase de mercado",
    priceRangeSentence(
      productPriceRange({
        price_min: 100,
        price_max: 150,
        price_range_checked_at: "2026-10-24T10:00:00Z",
      }),
    ) === "Faixa de preço pesquisada em 24/10: R$ 100 a R$ 150. Não é o preço da Amazon.",
  ],
  [
    "frase de estimativa",
    priceRangeSentence(productPriceRange({ price: 100 })) ===
      "Faixa estimada: R$ 85 a R$ 120. É só uma estimativa, não o preço da Amazon.",
  ],
];
let falhou = false;
for (const [nome, ok] of casos) {
  console.log(`${ok ? "ok" : "FALHOU"} ${nome}`);
  if (!ok) falhou = true;
}
process.exit(falhou ? 1 : 0);
