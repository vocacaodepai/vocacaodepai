import { createFileRoute } from "@tanstack/react-router";
import PainelPage from "@/pages/area-do-pai/PainelPage";
import { privateHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/area-do-pai/")({
  head: () =>
    privateHead(
      "Área do Pai",
      "Seu painel de pai: filhos cadastrados, conteúdo pela idade deles, trilhas, itens salvos e insígnias.",
    ),
  component: PainelPage,
});
