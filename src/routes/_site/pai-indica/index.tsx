import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/home/ComingSoon";
import { SITE_NAME } from "@/lib/site";

// Placeholder da Fase 1 (doc 03 §5.3): noindex e fora do sitemap até a seção abrir.
export const Route = createFileRoute("/_site/pai-indica/")({
  head: () => ({
    meta: [
      { title: `Pai Indica | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Reviews honestos de produto para a casa, o carro, a churrasqueira e o filho, com nota de 0 a 10.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Pai Indica"
      description="Reviews honestos de produto para a casa, o carro, a churrasqueira e o filho: nota de 0 a 10, prós, contras e para quem é."
      eta="Próxima seção a abrir no site."
      source="em-breve-pai-indica"
      highlights={[
        "Review individual com cinco critérios e nota de 0 a 10",
        "Comparativos de 2 a 4 modelos lado a lado",
        "Listas dos melhores por faixa de preço pesquisada",
        "Defeito no mesmo tamanho do elogio, sem preço exato",
      ]}
    />
  );
}
