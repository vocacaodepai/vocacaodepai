// As 10 categorias da Loja do Pai (ícone lucide e textos de UI/SEO). O banco
// (supabase/migrations/0003_loja.sql) guarda só slug/nome/ícone/ordem.
//
// Slugs = taxonomia de produto do doc 04 §3 / doc 02 (`bebe-e-crianca`,
// `saude-do-homem`…), que a migration 0003 já insere. O doc 05 §3 listava
// `paternidade-pratica` e `presentes-para-o-pai`; "presentes" é rota/tag
// (`/loja/presentes`), não categoria (decisão registrada em progresso-fase-3.md).
// `src/lib/pai-indica/taxonomia.ts` (Fase 2) é a fonte única dos slugs de categoria
// e subcategoria; este arquivo só adiciona ícone e textos da loja. O tipo `ProductCategory`
// garante em compilação que cada slug daqui existe na taxonomia (= 0003_loja.sql).
import {
  Baby,
  BookOpen,
  Car,
  Flame,
  Gift,
  HeartPulse,
  Home,
  Shirt,
  Smartphone,
  Tent,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { productSubcategories, type ProductCategory } from "@/lib/pai-indica/taxonomia";

export interface StoreCategoryMeta {
  slug: ProductCategory;
  name: string;
  icon: LucideIcon;
  /** Descrição curta do card em /loja. */
  description: string;
  seoTitle: string;
  seoDescription: string;
}

export const STORE_CATEGORIES: StoreCategoryMeta[] = [
  {
    slug: "churrasco-e-cozinha",
    name: "Churrasco e Cozinha",
    icon: Flame,
    description: "Facas, tábuas, chapas, termômetros e o que faz diferença no fogo.",
    seoTitle: "Churrasco e Cozinha",
    seoDescription:
      "Facas, tábuas, chapas e termômetros com review honesta e faixa de preço pesquisada.",
  },
  {
    slug: "ferramentas",
    name: "Ferramentas",
    icon: Wrench,
    description: "Furadeiras, parafusadeiras, kits e medição para consertar a casa.",
    seoTitle: "Ferramentas",
    seoDescription:
      "Furadeiras, parafusadeiras e kits para consertar a casa, analisados pelo Vocação de Pai.",
  },
  {
    slug: "carro-e-moto",
    name: "Carro e Moto",
    icon: Car,
    description: "Manutenção, limpeza, segurança e acessórios do veículo.",
    seoTitle: "Carro e Moto",
    seoDescription: "Manutenção, limpeza e segurança do veículo com review e faixa de preço.",
  },
  {
    slug: "tecnologia",
    name: "Tecnologia",
    icon: Smartphone,
    description: "Eletrônicos úteis: leitura, som, energia, casa conectada e rede.",
    seoTitle: "Tecnologia",
    seoDescription: "Eletrônicos úteis de verdade, com prós, contras e veredito.",
  },
  {
    slug: "esporte-e-outdoor",
    name: "Esporte e Outdoor",
    icon: Tent,
    description: "Acampamento, trilha, bola no quintal e equipamento para sair com os filhos.",
    seoTitle: "Esporte e Outdoor",
    seoDescription: "Acampamento, trilha e esporte com os filhos: equipamento analisado.",
  },
  {
    slug: "bebe-e-crianca",
    name: "Bebê e Criança",
    icon: Baby,
    description: "Canguru, cadeirinha, babá eletrônica: o que o pai usa com o filho no colo.",
    seoTitle: "Bebê e Criança",
    seoDescription: "Canguru, cadeirinha e babá eletrônica: o que o pai usa no dia a dia.",
  },
  {
    slug: "casa-e-jardim",
    name: "Casa e Jardim",
    icon: Home,
    description: "Lavadora de pressão, grama, mangueira, escada e segurança da casa.",
    seoTitle: "Casa e Jardim",
    seoDescription: "Lavadora de pressão, grama e segurança da casa, analisados.",
  },
  {
    slug: "saude-do-homem",
    name: "Saúde do Homem",
    icon: HeartPulse,
    description: "Pressão, balança, sono, postura: o que ajuda o pai a estar inteiro.",
    seoTitle: "Saúde do Homem",
    seoDescription: "Monitoramento, sono e recuperação do homem adulto, com review honesta.",
  },
  {
    slug: "estilo-e-barba",
    name: "Estilo e Barba",
    icon: Shirt,
    description: "Barba, cabelo, perfume, relógio e carteira.",
    seoTitle: "Estilo e Barba",
    seoDescription: "Barba, cabelo, perfume e relógio com review honesta.",
  },
  {
    slug: "livros-e-formacao",
    name: "Livros e Formação",
    icon: BookOpen,
    description: "Leitura para ser homem, marido e pai melhor.",
    seoTitle: "Livros e Formação",
    seoDescription: "Leitura para ser homem, marido e pai melhor.",
  },
];

export const STORE_CATEGORY_META: Record<string, StoreCategoryMeta> = Object.fromEntries(
  STORE_CATEGORIES.map((c) => [c.slug, c]),
);

export const DEFAULT_CATEGORY_ICON: LucideIcon = Gift;

export function storeCategoryIcon(slug: string | null | undefined): LucideIcon {
  return (slug && STORE_CATEGORY_META[slug]?.icon) || DEFAULT_CATEGORY_ICON;
}

/** Nomes das subcategorias: taxonomia do Pai Indica (doc 04 §3). Slug desconhecido vira texto legível. */
const SUBCATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  productSubcategories.map((s) => [s.slug, s.name]),
);

export function subcategoryName(slug: string | null | undefined): string {
  if (!slug) return "";
  if (SUBCATEGORY_NAMES[slug]) return SUBCATEGORY_NAMES[slug]!;
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
