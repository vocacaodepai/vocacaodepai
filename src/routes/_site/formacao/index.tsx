import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/home/ComingSoon";
import { SITE_NAME } from "@/lib/site";

// Placeholder da Fase 1 (doc 03 §5.3): noindex e fora do sitemap até a seção abrir.
export const Route = createFileRoute("/_site/formacao/")({
  head: () => ({
    meta: [
      { title: `Formação | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Trilhas e desafios para crescer como pai, marido e homem de fé, com turmas, insígnias e o Caderno do Pai.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Formação"
      description="Trilhas e desafios para crescer como pai, marido e homem de fé, com turmas, insígnias e o Caderno do Pai."
      eta="Abre junto com a Irmandade."
      source="em-breve-formacao"
      highlights={[
        "Trilhas de formação passo a passo, no seu ritmo",
        "Desafios do Pai, como os 33 dias com São José",
        "Insígnias por etapa concluída e Badge de pai presente",
        "Caderno do Pai para anotar o que mudou em casa",
      ]}
    />
  );
}
