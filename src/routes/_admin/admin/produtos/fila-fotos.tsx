import { createFileRoute } from "@tanstack/react-router";
import { AdminPhotoQueue } from "@/admin/AdminProducts";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/produtos/fila-fotos")({
  head: () => buildAdminHead("Fila de fotos", "Produtos que precisam de fotos oficiais da Amazon."),
  component: AdminPhotoQueue,
});
