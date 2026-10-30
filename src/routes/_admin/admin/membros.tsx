import { createFileRoute } from "@tanstack/react-router";
import AdminMembers from "@/admin/AdminMembers";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/membros")({
  head: () => buildAdminHead("Membros", "Membros da Área do Pai: lista, busca e papéis."),
  component: AdminMembers,
});
