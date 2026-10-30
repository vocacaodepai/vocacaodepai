import { createFileRoute } from "@tanstack/react-router";
import AdminIrmandade from "@/admin/AdminIrmandade";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/formacao")({
  head: () => buildAdminHead("Formação", "Trilhas e desafios: listagem e publicação."),
  component: () => <AdminIrmandade initialTab="formacao" />,
});
