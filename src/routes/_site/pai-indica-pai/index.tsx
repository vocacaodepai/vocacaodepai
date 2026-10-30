import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/home/ComingSoon";
import { SITE_NAME } from "@/lib/site";

// Placeholder da Fase 1 (doc 03 §5.3): noindex e fora do sitemap até a seção abrir.
export const Route = createFileRoute("/_site/pai-indica-pai/")({
  head: () => ({
    meta: [
      { title: `Pai Indica Pai | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Pai ajuda pai a trabalhar: vagas indicadas, profissionais de confiança e mentoria de quem já passou por isso.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Pai Indica Pai"
      description="Pai ajuda pai a trabalhar: vagas indicadas, profissionais de confiança e mentoria de quem já passou por isso."
      eta="Abre depois da Área do Pai, porque depende de cadastro."
      source="em-breve-pai-indica-pai"
      highlights={[
        "Vagas indicadas por pais, com moderação antes de publicar",
        "Pai Profissional: diretório de quem faz bem o que faz",
        "Mentoria de pai para pai em carreira e negócio",
        "Sem promessa de enriquecer: trabalho honesto, indicação honesta",
      ]}
    />
  );
}
