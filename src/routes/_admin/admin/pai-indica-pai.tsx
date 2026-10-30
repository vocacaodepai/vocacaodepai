import { createFileRoute } from "@tanstack/react-router";
import AdminModeracao from "@/admin/AdminModeracao";
import { buildAdminHead } from "@/lib/admin-meta";

// Fila de moderação do Pai Indica Pai (doc 08 §6; rota do doc 02 §1.3).
export const Route = createFileRoute("/_admin/admin/pai-indica-pai")({
  head: () =>
    buildAdminHead(
      "Moderação — Pai Indica Pai",
      "Vagas, indicações, profissionais, mentorias, denúncias e bloqueios.",
    ),
  component: AdminModeracao,
});
