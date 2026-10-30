import { createFileRoute } from "@tanstack/react-router";
import { AdminMidiaList } from "@/admin/AdminMidia";
import { buildAdminHead } from "@/lib/admin-meta";

// Fase 9 — Pai Indica Mídia (doc 14 §6): lista de fichas.
export const Route = createFileRoute("/_admin/admin/midia/")({
  head: () =>
    buildAdminHead("Pai Indica Mídia", "Fichas de filmes, séries, jogos, apps e livros por idade."),
  component: AdminMidiaList,
});
