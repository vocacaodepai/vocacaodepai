import { Beef, HeartPulse, House, type LucideIcon, Users, Wallet } from "lucide-react";

export type ToolCategorySlug =
  "dinheiro" | "familia" | "churrasco-cozinha" | "casa-oficina" | "saude";

export interface ToolCategory {
  slug: ToolCategorySlug;
  name: string;
  short: string;
  description: string;
  icon: LucideIcon;
  /** classe Tailwind do selo (tokens do tema da Fase 1) */
  badgeClass: string;
}

// Ordem fixa de exibição (doc 06 §0.2).
export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    slug: "dinheiro",
    name: "Dinheiro",
    short: "Dinheiro",
    description: "Câmbio, mercado, orçamento e planejamento para quem provê.",
    icon: Wallet,
    badgeClass: "bg-primary/15 text-primary",
  },
  {
    slug: "familia",
    name: "Família",
    short: "Família",
    description: "Licença, nomes, vacinas, marcos e a maternidade pelo olhar do pai.",
    icon: Users,
    badgeClass: "bg-accent/20 text-accent-foreground",
  },
  {
    slug: "churrasco-cozinha",
    name: "Churrasco & Cozinha",
    short: "Churrasco",
    description: "Cálculo do churrasco, cortes de carne e medidas de cozinha.",
    icon: Beef,
    badgeClass: "bg-destructive/15 text-destructive",
  },
  {
    slug: "casa-oficina",
    name: "Casa & Oficina",
    short: "Oficina",
    description: "Unidades, kit de ferramentas e o básico para cuidar da casa.",
    icon: House,
    badgeClass: "bg-secondary/70 text-secondary-foreground",
  },
  {
    slug: "saude",
    name: "Saúde",
    short: "Saúde",
    description: "IMC, gasto calórico e cuidado com o corpo do homem.",
    icon: HeartPulse,
    badgeClass: "bg-success/15 text-success",
  },
];

export const categoryBySlug = (slug: ToolCategorySlug) =>
  TOOL_CATEGORIES.find((c) => c.slug === slug)!;
