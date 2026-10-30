import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/home/ComingSoon";
import { SITE_NAME } from "@/lib/site";

// Placeholder da Fase 1 (doc 03 §5.3): noindex e fora do sitemap até a seção abrir.
export const Route = createFileRoute("/_site/loja/")({
  head: () => ({
    meta: [
      { title: `Loja do Pai | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "O pai também quer desconto: produtos indicados pelo Vocação de Pai com faixa de preço pesquisada e botão direto para a Amazon.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Loja do Pai"
      description="O pai também quer desconto. Produtos que a gente indicaria para um irmão, com faixa de preço pesquisada e botão direto para a Amazon."
      eta="Abre logo depois do Pai Indica."
      source="em-breve-loja"
      highlights={[
        "Churrasco, ferramentas, esporte, carro e pai e bebê",
        "Faixa de preço pesquisada em pelo menos duas lojas, nunca preço inventado",
        "Review longa em cada produto, com prós, contras e para quem é",
        "Botão único: Comprar agora na Amazon",
      ]}
    />
  );
}
