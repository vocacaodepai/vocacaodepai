import { createFileRoute } from "@tanstack/react-router";
import AdminLogin from "@/admin/AdminLogin";
import { buildAdminHead } from "@/lib/admin-meta";

export const Route = createFileRoute("/admin/login")({
  head: () =>
    buildAdminHead("Login administrativo", "Acesso restrito à equipe editorial do Vocação de Pai."),
  component: AdminLogin,
});
