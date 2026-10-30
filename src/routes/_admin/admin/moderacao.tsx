import { createFileRoute, redirect } from "@tanstack/react-router";

// Atalho do checklist 6.8 (`/admin/moderacao`) → fila oficial em /admin/pai-indica-pai (doc 02 §1.3, doc 08 §6).
export const Route = createFileRoute("/_admin/admin/moderacao")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/pai-indica-pai" });
  },
  component: () => null,
});
