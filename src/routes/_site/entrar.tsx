import { createFileRoute, redirect } from "@tanstack/react-router";

// Fase 1 (doc 03 §5.3): /entrar só redireciona para o login do admin.
// A Fase 5 (Área do Pai) troca por uma página própria de login de membro.
export const Route = createFileRoute("/_site/entrar")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/login" });
  },
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: () => null,
});
