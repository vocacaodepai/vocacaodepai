import { createFileRoute } from "@tanstack/react-router";
import { AdminProductsList } from "@/admin/AdminProducts";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/produtos/")({
  head: () => buildAdminHead("Produtos da Loja do Pai", "Lista, filtros e ações dos produtos."),
  component: AdminProductsList,
});
