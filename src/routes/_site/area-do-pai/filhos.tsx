import { createFileRoute } from "@tanstack/react-router";
import FilhosPage from "@/pages/area-do-pai/FilhosPage";
import { privateHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/area-do-pai/filhos")({
  head: () => privateHead("Seus filhos — Área do Pai"),
  component: FilhosPage,
});
