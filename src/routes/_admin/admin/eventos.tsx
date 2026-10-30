import { createFileRoute } from "@tanstack/react-router";
import AdminIrmandade from "@/admin/AdminIrmandade";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/eventos")({
  head: () =>
    buildAdminHead("Eventos da Irmandade", "CRUD de encontros, RSVPs e marcação de realizado."),
  component: () => <AdminIrmandade initialTab="eventos" />,
});
