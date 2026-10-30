import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/home/ComingSoon";
import { SITE_NAME } from "@/lib/site";

// Placeholder da Fase 1 (doc 03 §5.3): noindex e fora do sitemap até a seção abrir.
export const Route = createFileRoute("/_site/area-do-pai")({
  head: () => ({
    meta: [
      { title: `Área do Pai | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Seu painel de pai: filhos cadastrados, conteúdo pela idade deles, trilhas, itens salvos e insígnias.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Área do Pai"
      description="Seu painel: filhos cadastrados, conteúdo pela idade deles, trilhas em andamento, itens salvos e suas insígnias. Grátis."
      eta="Chega com o cadastro de membros."
      source="em-breve-area-do-pai"
      highlights={[
        "Cadastre seus filhos e receba o conteúdo certo para a idade deles",
        "Salve artigos, produtos e ferramentas para voltar depois",
        "Trilhas de formação e desafios de 30 dias com insígnias",
        "Porta de entrada da Irmandade e do Pai Indica Pai",
      ]}
    />
  );
}
