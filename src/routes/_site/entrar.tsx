import { createFileRoute } from "@tanstack/react-router";
import EntrarPage from "@/pages/area-do-pai/EntrarPage";
import { publicAuthHead } from "@/lib/area-do-pai/head";

// /entrar (doc 07 §4.7): login de membro da Área do Pai (e-mail/senha, link por e-mail, Google).
export const Route = createFileRoute("/_site/entrar")({
  head: () =>
    publicAuthHead(
      "Entrar na Área do Pai",
      "Entre na Área do Pai: seu painel com filhos, conteúdo por fase, salvos, trilhas e insígnias.",
      "/entrar",
    ),
  component: EntrarPage,
});
