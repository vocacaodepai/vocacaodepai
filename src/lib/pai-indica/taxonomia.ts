/**
 * Taxonomia de produto do Pai Indica (doc 04 §3). Diferente de `categories` (categoria editorial do blog):
 * aqui é "o que o pai está procurando para comprar". Usada pelo filtro de /pai-indica, pelos
 * pesos de critérios (criterios.ts), pela Loja do Pai (products.subcategory) e pelo validador
 * (scripts/lib/taxonomia.json, gerado por scripts/export-taxonomia.mjs). Não apagar nem renomear slug publicado.
 */
export const productCategories = [
  { slug: "churrasco-e-cozinha", name: "Churrasco e Cozinha" },
  { slug: "ferramentas", name: "Ferramentas" },
  { slug: "carro-e-moto", name: "Carro e Moto" },
  { slug: "tecnologia", name: "Tecnologia" },
  { slug: "esporte-e-outdoor", name: "Esporte e Outdoor" },
  { slug: "bebe-e-crianca", name: "Bebê e Criança" },
  { slug: "casa-e-jardim", name: "Casa e Jardim" },
  { slug: "saude-do-homem", name: "Saúde do Homem" },
  { slug: "estilo-e-barba", name: "Estilo e Barba" },
  { slug: "livros-e-formacao", name: "Livros e Formação" },
] as const;

export type ProductCategory = (typeof productCategories)[number]["slug"];

export const productSubcategories = [
  // churrasco-e-cozinha
  { slug: "facas-e-cutelaria", name: "Facas e cutelaria", category: "churrasco-e-cozinha" },
  { slug: "churrasqueiras", name: "Churrasqueiras", category: "churrasco-e-cozinha" },
  {
    slug: "acessorios-de-churrasco",
    name: "Acessórios de churrasco",
    category: "churrasco-e-cozinha",
  },
  { slug: "chapas-e-grelhas", name: "Chapas e grelhas", category: "churrasco-e-cozinha" },
  { slug: "defumacao-e-temperos", name: "Defumação e temperos", category: "churrasco-e-cozinha" },
  { slug: "cervejeiras-e-bebidas", name: "Cervejeiras e bebidas", category: "churrasco-e-cozinha" },
  {
    slug: "panelas-e-ferro-fundido",
    name: "Panelas e ferro fundido",
    category: "churrasco-e-cozinha",
  },
  { slug: "eletroportateis", name: "Eletroportáteis", category: "churrasco-e-cozinha" },
  { slug: "cafe", name: "Café", category: "churrasco-e-cozinha" },
  // ferramentas
  {
    slug: "furadeiras-e-parafusadeiras",
    name: "Furadeiras e parafusadeiras",
    category: "ferramentas",
  },
  { slug: "jogos-de-ferramentas", name: "Jogos de ferramentas", category: "ferramentas" },
  { slug: "ferramentas-manuais", name: "Ferramentas manuais", category: "ferramentas" },
  { slug: "medicao-e-nivel", name: "Medição e nível", category: "ferramentas" },
  { slug: "eletrica", name: "Elétrica", category: "ferramentas" },
  { slug: "serras-e-esmerilhadeiras", name: "Serras e esmerilhadeiras", category: "ferramentas" },
  { slug: "organizacao-e-maletas", name: "Organização e maletas", category: "ferramentas" },
  { slug: "epi-e-seguranca", name: "EPI e segurança", category: "ferramentas" },
  // carro-e-moto
  { slug: "eletronicos-automotivos", name: "Eletrônicos automotivos", category: "carro-e-moto" },
  { slug: "emergencia-e-manutencao", name: "Emergência e manutenção", category: "carro-e-moto" },
  { slug: "limpeza-e-estetica", name: "Limpeza e estética", category: "carro-e-moto" },
  { slug: "conforto-e-organizacao", name: "Conforto e organização", category: "carro-e-moto" },
  {
    slug: "cadeirinhas-e-transporte-infantil",
    name: "Cadeirinhas e transporte infantil",
    category: "carro-e-moto",
  },
  { slug: "moto-e-capacetes", name: "Moto e capacetes", category: "carro-e-moto" },
  { slug: "som-e-multimidia", name: "Som e multimídia", category: "carro-e-moto" },
  // tecnologia
  { slug: "celulares-e-acessorios", name: "Celulares e acessórios", category: "tecnologia" },
  { slug: "fones-e-audio", name: "Fones e áudio", category: "tecnologia" },
  { slug: "notebooks-e-perifericos", name: "Notebooks e periféricos", category: "tecnologia" },
  { slug: "smartwatches", name: "Smartwatches", category: "tecnologia" },
  { slug: "casa-inteligente", name: "Casa inteligente", category: "tecnologia" },
  { slug: "tv-e-video", name: "TV e vídeo", category: "tecnologia" },
  { slug: "games", name: "Games", category: "tecnologia" },
  { slug: "mochilas-e-cases", name: "Mochilas e cases", category: "tecnologia" },
  { slug: "energia-e-carregadores", name: "Energia e carregadores", category: "tecnologia" },
  // Fase 3 (0012_seed_loja.sql): leitores digitais (Kindle) da Loja do Pai.
  { slug: "leitura-digital", name: "Leitura digital", category: "tecnologia" },
  // esporte-e-outdoor
  { slug: "corrida-e-tenis", name: "Corrida e tênis", category: "esporte-e-outdoor" },
  { slug: "musculacao-em-casa", name: "Musculação em casa", category: "esporte-e-outdoor" },
  { slug: "ciclismo", name: "Ciclismo", category: "esporte-e-outdoor" },
  { slug: "camping-e-trilha", name: "Camping e trilha", category: "esporte-e-outdoor" },
  { slug: "pesca", name: "Pesca", category: "esporte-e-outdoor" },
  {
    slug: "futebol-e-esportes-com-filhos",
    name: "Futebol e esportes com os filhos",
    category: "esporte-e-outdoor",
  },
  { slug: "garrafas-e-coolers", name: "Garrafas e coolers", category: "esporte-e-outdoor" },
  { slug: "relogios-e-monitores", name: "Relógios e monitores", category: "esporte-e-outdoor" },
  // bebe-e-crianca
  { slug: "cadeirinhas-de-carro", name: "Cadeirinhas de carro", category: "bebe-e-crianca" },
  { slug: "carrinhos-e-cangurus", name: "Carrinhos e cangurus", category: "bebe-e-crianca" },
  { slug: "quarto-e-sono", name: "Quarto e sono", category: "bebe-e-crianca" },
  { slug: "banho-e-higiene", name: "Banho e higiene", category: "bebe-e-crianca" },
  { slug: "alimentacao", name: "Alimentação", category: "bebe-e-crianca" },
  { slug: "brinquedos-e-jogos", name: "Brinquedos e jogos", category: "bebe-e-crianca" },
  {
    slug: "seguranca-e-monitoramento",
    name: "Segurança e monitoramento",
    category: "bebe-e-crianca",
  },
  { slug: "passeio-e-viagem", name: "Passeio e viagem", category: "bebe-e-crianca" },
  // casa-e-jardim
  { slug: "limpeza-externa", name: "Limpeza externa", category: "casa-e-jardim" },
  { slug: "jardim-e-quintal", name: "Jardim e quintal", category: "casa-e-jardim" },
  { slug: "piscina", name: "Piscina", category: "casa-e-jardim" },
  { slug: "seguranca-residencial", name: "Segurança residencial", category: "casa-e-jardim" },
  { slug: "climatizacao", name: "Climatização", category: "casa-e-jardim" },
  { slug: "iluminacao", name: "Iluminação", category: "casa-e-jardim" },
  { slug: "organizacao-e-garagem", name: "Organização e garagem", category: "casa-e-jardim" },
  { slug: "lavanderia-e-utilidades", name: "Lavanderia e utilidades", category: "casa-e-jardim" },
  // saude-do-homem
  {
    slug: "monitoramento",
    name: "Monitoramento (pressão, balança, oxímetro)",
    category: "saude-do-homem",
  },
  { slug: "suplementos", name: "Suplementos", category: "saude-do-homem" },
  { slug: "sono-e-descanso", name: "Sono e descanso", category: "saude-do-homem" },
  { slug: "postura-e-dor", name: "Postura e dor", category: "saude-do-homem" },
  { slug: "higiene-bucal", name: "Higiene bucal", category: "saude-do-homem" },
  { slug: "primeiros-socorros", name: "Primeiros socorros", category: "saude-do-homem" },
  { slug: "massagem-e-recuperacao", name: "Massagem e recuperação", category: "saude-do-homem" },
  // estilo-e-barba
  {
    slug: "barbeadores-e-aparadores",
    name: "Barbeadores e aparadores",
    category: "estilo-e-barba",
  },
  { slug: "cuidados-com-a-barba", name: "Cuidados com a barba", category: "estilo-e-barba" },
  { slug: "perfumes-e-desodorantes", name: "Perfumes e desodorantes", category: "estilo-e-barba" },
  { slug: "cabelo-e-maquinas", name: "Cabelo e máquinas", category: "estilo-e-barba" },
  { slug: "pele-e-protetor-solar", name: "Pele e protetor solar", category: "estilo-e-barba" },
  { slug: "relogios-e-carteiras", name: "Relógios e carteiras", category: "estilo-e-barba" },
  { slug: "calcados-e-roupas", name: "Calçados e roupas", category: "estilo-e-barba" },
  // livros-e-formacao
  { slug: "paternidade", name: "Paternidade", category: "livros-e-formacao" },
  { slug: "casamento-e-familia", name: "Casamento e família", category: "livros-e-formacao" },
  { slug: "financas-pessoais", name: "Finanças pessoais", category: "livros-e-formacao" },
  { slug: "carreira-e-lideranca", name: "Carreira e liderança", category: "livros-e-formacao" },
  { slug: "fe-e-virtudes", name: "Fé e virtudes", category: "livros-e-formacao" },
  { slug: "biografias", name: "Biografias", category: "livros-e-formacao" },
  { slug: "habitos-e-disciplina", name: "Hábitos e disciplina", category: "livros-e-formacao" },
  {
    slug: "infantis-para-ler-com-os-filhos",
    name: "Infantis para ler com os filhos",
    category: "livros-e-formacao",
  },
] as const;

export type ProductSubcategory = (typeof productSubcategories)[number]["slug"];

export function categoryName(slug: string): string {
  return productCategories.find((c) => c.slug === slug)?.name ?? slug;
}
export function subcategoryName(slug: string): string {
  return productSubcategories.find((s) => s.slug === slug)?.name ?? slug;
}
export function subcategoriesOf(category: string) {
  return productSubcategories.filter((s) => s.category === category);
}
export function isValidPair(category: string, sub: string): boolean {
  return productSubcategories.some((s) => s.slug === sub && s.category === category);
}
