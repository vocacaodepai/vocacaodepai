import { createFileRoute } from "@tanstack/react-router";
import { AdminProductForm } from "@/admin/AdminProducts";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/produtos/$id")({
  head: () => buildAdminHead("Editar produto", "Edite um produto da Loja do Pai."),
  component: AdminProductForm,
});
