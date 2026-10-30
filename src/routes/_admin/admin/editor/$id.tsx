import { createFileRoute } from "@tanstack/react-router";
import AdminEditor from "@/admin/AdminEditor";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/editor/$id")({
  head: () =>
    buildAdminHead("Editar artigo", "Edite um artigo existente no painel do Vocação de Pai."),
  component: AdminEditor,
});
