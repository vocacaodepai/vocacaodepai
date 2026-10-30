import { createFileRoute } from "@tanstack/react-router";
import { AdminMidiaForm } from "@/admin/AdminMidia";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/midia/$id")({
  head: () => buildAdminHead("Editar ficha de mídia", "Edite uma ficha do Pai Indica Mídia."),
  component: AdminMidiaForm,
});
