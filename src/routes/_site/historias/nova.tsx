import { createFileRoute } from "@tanstack/react-router";
import NovaHistoriaPage from "@/pages/irmandade/NovaHistoriaPage";
import { SITE_NAME } from "@/lib/site";

// Formulário de membro: noindex (doc 07 §4.7).
export const Route = createFileRoute("/_site/historias/nova")({
  head: () => ({
    meta: [
      { title: `Conte sua história | ${SITE_NAME}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NovaHistoriaPage,
});
