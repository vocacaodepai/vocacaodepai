import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/admin/AdminDashboard";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/")({
  head: () =>
    buildAdminHead("Painel administrativo", "Gerencie artigos e comentários do Vocação de Pai."),
  component: AdminDashboard,
});
