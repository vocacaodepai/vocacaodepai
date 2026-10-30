import { createFileRoute } from "@tanstack/react-router";
import AdminIrmandade from "@/admin/AdminIrmandade";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/moderacao")({
  head: () =>
    buildAdminHead(
      "Moderação da Irmandade",
      "Filas de histórias, perguntas, respostas e denúncias.",
    ),
  component: () => <AdminIrmandade initialTab="historias" />,
});
