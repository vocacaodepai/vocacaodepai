import { createFileRoute } from "@tanstack/react-router";
import { AdminMidiaForm } from "@/admin/AdminMidia";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/midia/novo")({
  head: () => buildAdminHead("Nova ficha de mídia", "Cadastre uma ficha no Pai Indica Mídia."),
  component: AdminMidiaForm,
});
