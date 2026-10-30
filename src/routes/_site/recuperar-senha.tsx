import { createFileRoute } from "@tanstack/react-router";
import RecuperarSenhaPage from "@/pages/area-do-pai/RecuperarSenhaPage";
import { privateHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/recuperar-senha")({
  head: () => privateHead("Recuperar senha"),
  component: RecuperarSenhaPage,
});
