import { createFileRoute } from "@tanstack/react-router";
import AdminIrmandade from "@/admin/AdminIrmandade";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/irmandade/")({
  head: () =>
    buildAdminHead(
      "Irmandade e Formação",
      "Moderação de histórias, perguntas e respostas; eventos; trilhas e desafios.",
    ),
  component: () => <AdminIrmandade initialTab="historias" />,
});
