import { createFileRoute } from "@tanstack/react-router";
import PlanoPage from "@/pages/area-do-pai/PlanoPage";
import { privateHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/area-do-pai/plano")({
  head: () => privateHead("Seu plano — Área do Pai"),
  component: PlanoPage,
});
