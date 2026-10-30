import { createFileRoute } from "@tanstack/react-router";
import MinhaContaPage from "@/pages/area-do-pai/MinhaContaPage";
import { RequireAuth } from "@/components/area-do-pai/RequireAuth";
import { privateHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/minha-conta")({
  head: () => privateHead("Minha conta"),
  component: () => (
    <RequireAuth>
      <MinhaContaPage />
    </RequireAuth>
  ),
});
