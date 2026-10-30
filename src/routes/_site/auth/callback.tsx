import { createFileRoute } from "@tanstack/react-router";
import AuthCallbackPage from "@/pages/area-do-pai/AuthCallbackPage";
import { privateHead } from "@/lib/area-do-pai/head";

// /auth/callback: destino do PKCE (Google, magic link, confirmação de e-mail, recovery).
export const Route = createFileRoute("/_site/auth/callback")({
  head: () => privateHead("Entrando…"),
  component: AuthCallbackPage,
});
