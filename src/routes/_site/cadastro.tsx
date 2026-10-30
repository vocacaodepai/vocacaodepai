import { createFileRoute } from "@tanstack/react-router";
import CadastroPage from "@/pages/area-do-pai/CadastroPage";
import { publicAuthHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/cadastro")({
  head: () =>
    publicAuthHead(
      "Crie sua conta grátis",
      "Crie sua conta na Área do Pai em um minuto, sem cartão: conteúdo pela fase dos seus filhos, salvos, trilhas e insígnias.",
      "/cadastro",
    ),
  component: CadastroPage,
});
