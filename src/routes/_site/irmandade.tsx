import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/home/ComingSoon";
import { SITE_NAME } from "@/lib/site";

// Placeholder da Fase 1 (doc 03 §5.3): noindex e fora do sitemap até a seção abrir.
export const Route = createFileRoute("/_site/irmandade")({
  head: () => ({
    meta: [
      { title: `Irmandade | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Comunidade de homens que querem ser pais melhores: histórias, perguntas e respostas, encontros e grupos pequenos.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Irmandade"
      description="Comunidade de homens que querem ser pais melhores: histórias, perguntas e respostas, encontros e grupos pequenos. Você não precisa caminhar sozinho."
      eta="Abre depois da Área do Pai."
      source="em-breve-irmandade"
      highlights={[
        "Histórias de pai contadas por quem viveu",
        "Perguntas da Irmandade, respondidas por outros pais",
        "Encontros e grupos pequenos, presenciais e on-line",
        "Regras claras: respeito, sem vulgaridade, sem ataques",
      ]}
    />
  );
}
