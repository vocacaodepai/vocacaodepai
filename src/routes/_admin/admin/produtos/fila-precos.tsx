import { createFileRoute } from "@tanstack/react-router";
import { AdminPriceQueue } from "@/admin/AdminProducts";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/_admin/admin/produtos/fila-precos")({
  head: () => buildAdminHead("Fila de faixa de preço", "Pesquisa de faixa de preço em 2 lojas."),
  component: AdminPriceQueue,
});
