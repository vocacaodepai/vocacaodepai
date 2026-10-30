import { createFileRoute } from "@tanstack/react-router";
import NewProfessionalPage from "@/pages/pai-indica-pai/NewProfessionalPage";
import { SITE_NAME } from "@/lib/site";

// Criar/editar perfil Pai Profissional (doc 08 §3.5). `?mentor=1` pré-marca "Quero ser mentor".
export const Route = createFileRoute("/_site/pai-indica-pai/profissionais/novo")({
  validateSearch: (s: Record<string, unknown>): { mentor?: string } =>
    typeof s["mentor"] === "string" ? { mentor: s["mentor"] as string } : {},
  head: () => ({
    meta: [
      { title: `Meu perfil de Pai Profissional | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Cadastre seu trabalho no diretório Pai Profissional e, se quiser, seja mentor de outro pai.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NewProfessionalPage,
});
