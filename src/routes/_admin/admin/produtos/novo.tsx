import { createFileRoute } from "@tanstack/react-router";
import { AdminProductForm } from "@/admin/AdminProducts";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/produtos/novo")({
  head: () => buildAdminHead("Novo produto", "Cadastre um produto na Loja do Pai."),
  component: AdminProductForm,
});
