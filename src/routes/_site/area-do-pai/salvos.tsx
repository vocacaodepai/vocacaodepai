import { createFileRoute } from "@tanstack/react-router";
import SalvosPage from "@/pages/area-do-pai/SalvosPage";
import { privateHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/area-do-pai/salvos")({
  head: () => privateHead("Salvos — Área do Pai"),
  component: SalvosPage,
});
