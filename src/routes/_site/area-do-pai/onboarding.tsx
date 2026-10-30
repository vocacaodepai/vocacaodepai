import { createFileRoute } from "@tanstack/react-router";
import OnboardingPage from "@/pages/area-do-pai/OnboardingPage";
import { privateHead } from "@/lib/area-do-pai/head";

export const Route = createFileRoute("/_site/area-do-pai/onboarding")({
  head: () => privateHead("Bem-vindo à Área do Pai"),
  component: OnboardingPage,
});
