import { createFileRoute } from "@tanstack/react-router";
import AdminEditor from "@/admin/AdminEditor";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/editor/")({
  head: () => buildAdminHead("Novo artigo", "Crie um novo artigo no painel do Vocação de Pai."),
  component: AdminEditor,
});
