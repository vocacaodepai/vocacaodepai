// As 10 categorias da Loja do Pai (ícone lucide e textos de UI/SEO). O banco
// (supabase/migrations/0003_loja.sql) guarda só slug/nome/ícone/ordem.
//
// Slugs = taxonomia de produto do doc 04 §3 / doc 02 (`bebe-e-crianca`,
// `saude-do-homem`…), que a migration 0003 já insere. O doc 05 §3 listava
// `paternidade-pratica` e `presentes-para-o-pai`; "presentes" é rota/tag
// (`/loja/presentes`), não categoria (decisão registrada em progresso-fase-3.md).
// Quando a Fase 2 criar `src/lib/pai-indica/taxonomia.ts`, ele passa a ser a
// fonte única dos slugs; este arquivo só adiciona ícone e textos da loja.
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

export interface StoreCategoryMeta {
  slug: string;
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

/** Nomes das subcategorias (doc 04 §3). Slug desconhecido vira texto legível. */
const SUBCATEGORY_NAMES: Record<string, string> = {
  "facas-e-cutelaria": "Facas e cutelaria",
  churrasqueiras: "Churrasqueiras",
  "acessorios-de-churrasco": "Acessórios de churrasco",
  "chapas-e-grelhas": "Chapas e grelhas",
  "defumacao-e-temperos": "Defumação e temperos",
  "cervejeiras-e-bebidas": "Cervejeiras e bebidas",
  "panelas-e-ferro-fundido": "Panelas e ferro fundido",
  eletroportateis: "Eletroportáteis",
  cafe: "Café",
  "furadeiras-e-parafusadeiras": "Furadeiras e parafusadeiras",
  "jogos-de-ferramentas": "Jogos de ferramentas",
  "ferramentas-manuais": "Ferramentas manuais",
  "medicao-e-nivel": "Medição e nível",
  eletrica: "Elétrica",
  "serras-e-esmerilhadeiras": "Serras e esmerilhadeiras",
  "organizacao-e-maletas": "Organização e maletas",
  "epi-e-seguranca": "EPI e segurança",
  "eletronicos-automotivos": "Eletrônicos automotivos",
  "emergencia-e-manutencao": "Emergência e manutenção",
  "limpeza-e-estetica": "Limpeza e estética",
  "conforto-e-organizacao": "Conforto e organização",
  "cadeirinhas-e-transporte-infantil": "Cadeirinhas e transporte infantil",
  "moto-e-capacetes": "Moto e capacetes",
  "som-e-multimidia": "Som e multimídia",
  "celulares-e-acessorios": "Celulares e acessórios",
  "fones-e-audio": "Fones e áudio",
  "notebooks-e-perifericos": "Notebooks e periféricos",
  smartwatches: "Smartwatches",
  "casa-inteligente": "Casa inteligente",
  "tv-e-video": "TV e vídeo",
  games: "Games",
  "mochilas-e-cases": "Mochilas e cases",
  "energia-e-carregadores": "Energia e carregadores",
  "corrida-e-tenis": "Corrida e tênis",
  "musculacao-em-casa": "Musculação em casa",
  ciclismo: "Ciclismo",
  "camping-e-trilha": "Camping e trilha",
  pesca: "Pesca",
  "futebol-e-esportes-com-filhos": "Futebol e esportes com os filhos",
  "garrafas-e-coolers": "Garrafas e coolers",
  "relogios-e-monitores": "Relógios e monitores",
  "cadeirinhas-de-carro": "Cadeirinhas de carro",
  "carrinhos-e-cangurus": "Carrinhos e cangurus",
  "quarto-e-sono": "Quarto e sono",
  "banho-e-higiene": "Banho e higiene",
  alimentacao: "Alimentação",
  "brinquedos-e-jogos": "Brinquedos e jogos",
  "seguranca-e-monitoramento": "Segurança e monitoramento",
  "passeio-e-viagem": "Passeio e viagem",
  "limpeza-externa": "Limpeza externa",
  "jardim-e-quintal": "Jardim e quintal",
  piscina: "Piscina",
  "seguranca-residencial": "Segurança residencial",
  climatizacao: "Climatização",
  iluminacao: "Iluminação",
  "organizacao-e-garagem": "Organização e garagem",
  "lavanderia-e-utilidades": "Lavanderia e utilidades",
  monitoramento: "Monitoramento",
  suplementos: "Suplementos",
  "sono-e-descanso": "Sono e descanso",
  "postura-e-dor": "Postura e dor",
  "higiene-bucal": "Higiene bucal",
  "primeiros-socorros": "Primeiros socorros",
  "massagem-e-recuperacao": "Massagem e recuperação",
  "barbeadores-e-aparadores": "Barbeadores e aparadores",
  "cuidados-com-a-barba": "Cuidados com a barba",
  "perfumes-e-desodorantes": "Perfumes e desodorantes",
  "cabelo-e-maquinas": "Cabelo e máquinas",
  "pele-e-protetor-solar": "Pele e protetor solar",
  "relogios-e-carteiras": "Relógios e carteiras",
  "calcados-e-roupas": "Calçados e roupas",
  paternidade: "Paternidade",
  "casamento-e-familia": "Casamento e família",
  "financas-pessoais": "Finanças pessoais",
  "carreira-e-lideranca": "Carreira e liderança",
  "fe-e-virtudes": "Fé e virtudes",
  biografias: "Biografias",
  "habitos-e-disciplina": "Hábitos e disciplina",
  "infantis-para-ler-com-os-filhos": "Infantis para ler com os filhos",
};

export function subcategoryName(slug: string | null | undefined): string {
  if (!slug) return "";
  if (SUBCATEGORY_NAMES[slug]) return SUBCATEGORY_NAMES[slug]!;
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
