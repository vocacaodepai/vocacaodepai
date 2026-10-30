// Mala da maternidade: checklist do pai (doc 06 §3.17). Conteúdo 100% do pai; "maternidade" = o hospital.
export type Quando = "36-semanas" | "dia-do-parto" | "no-hospital" | "7-dias" | "30-dias";
export interface ItemChecklist {
  id: string;
  texto: string;
  quando: Quando;
  link?: string;
  obs?: string;
}
export interface GrupoChecklist {
  id: string;
  titulo: string;
  itens: ItemChecklist[];
}
export const QUANDO: Array<{ id: Quando; nome: string }> = [
  { id: "36-semanas", nome: "36 semanas" },
  { id: "dia-do-parto", nome: "Dia do parto" },
  { id: "no-hospital", nome: "No hospital" },
  { id: "7-dias", nome: "Primeiros 7 dias" },
  { id: "30-dias", nome: "Até 30 dias" },
];
export const GRUPOS: GrupoChecklist[] = [
  {
    id: "documentos",
    titulo: "Documentos (quem leva é você)",
    itens: [
      { id: "rg", texto: "RG ou CNH de vocês dois", quando: "36-semanas" },
      {
        id: "cartao-plano",
        texto: "Cartão do plano de saúde ou cartão SUS da esposa",
        quando: "36-semanas",
      },
      {
        id: "pre-natal",
        texto: "Cartão do pré-natal e exames (ultrassons, tipagem sanguínea)",
        quando: "36-semanas",
      },
      {
        id: "certidao",
        texto: "Certidão de casamento (facilita o registro em nome dos dois)",
        quando: "36-semanas",
      },
      { id: "plano-parto", texto: "Plano de parto impresso, se houver", quando: "36-semanas" },
      {
        id: "telefones",
        texto:
          "Lista de telefones: maternidade, obstetra, pediatra, avós, quem fica com os outros filhos",
        quando: "36-semanas",
      },
    ],
  },
  {
    id: "mala-do-pai",
    titulo: "A sua mala",
    itens: [
      { id: "roupas", texto: "2 mudas de roupa confortável e chinelo", quando: "36-semanas" },
      {
        id: "carregador",
        texto: "Carregador com cabo longo e bateria portátil",
        quando: "36-semanas",
      },
      {
        id: "dinheiro",
        texto: "Dinheiro trocado e cartão para estacionamento, lanche e farmácia",
        quando: "36-semanas",
      },
      { id: "remedios", texto: "Seus remédios de uso contínuo", quando: "36-semanas" },
      {
        id: "higiene",
        texto: "Escova de dente, desodorante, travesseiro pequeno",
        quando: "36-semanas",
      },
      {
        id: "lanche",
        texto: "Lanche seco e garrafa de água (o parto pode durar horas)",
        quando: "dia-do-parto",
      },
    ],
  },
  {
    id: "carro",
    titulo: "Carro e caminho",
    itens: [
      {
        id: "cadeirinha",
        texto: "Cadeirinha instalada e conferida (bebê conforto, voltado para trás)",
        quando: "36-semanas",
        link: "/categoria/carro-e-moto",
      },
      { id: "tanque", texto: "Tanque cheio a partir da 36ª semana", quando: "36-semanas" },
      {
        id: "rota",
        texto: "Rota principal e alternativa até a maternidade testadas",
        quando: "36-semanas",
      },
      { id: "chaves", texto: "Chaves do carro e de casa num lugar fixo", quando: "dia-do-parto" },
    ],
  },
  {
    id: "no-hospital",
    titulo: "No hospital",
    itens: [
      {
        id: "acompanhante",
        texto:
          "Você tem direito de acompanhar o parto (Lei 11.108/2005); confirme a regra da maternidade",
        quando: "no-hospital",
        link: "/post/lei-do-acompanhante-pai-no-parto",
      },
      {
        id: "dnv",
        texto: "Pegar a Declaração de Nascido Vivo (DNV) antes da alta",
        quando: "no-hospital",
      },
      {
        id: "testes",
        texto: "Perguntar sobre teste do pezinho, da orelhinha, do olhinho e do coraçãozinho",
        quando: "no-hospital",
      },
      { id: "vacinas", texto: "Conferir BCG e hepatite B na caderneta", quando: "no-hospital" },
    ],
  },
  {
    id: "primeira-semana",
    titulo: "Primeiros 7 dias",
    itens: [
      {
        id: "registro",
        texto:
          "Registrar o filho no cartório (gratuito; prazo de 15 dias, até 3 meses se morar a mais de 30 km)",
        quando: "7-dias",
        link: "/post/como-registrar-o-filho-prazo-e-documentos",
      },
      {
        id: "rh",
        texto: "Avisar o RH e pedir a licença-paternidade com a certidão",
        quando: "7-dias",
        link: "/ferramentas/licenca-paternidade",
      },
      {
        id: "pediatra",
        texto: "Marcar a primeira consulta do pediatra na primeira semana",
        quando: "7-dias",
      },
      {
        id: "descanso",
        texto: "Garantir o descanso da esposa: você assume visitas, casa e comida",
        quando: "7-dias",
      },
    ],
  },
  {
    id: "primeiro-mes",
    titulo: "Até 30 dias",
    itens: [
      {
        id: "plano-bebe",
        texto: "Incluir o bebê no plano de saúde em até 30 dias (sem carência)",
        quando: "30-dias",
      },
      {
        id: "cpf",
        texto: "CPF do bebê (sai junto com a certidão) e salário-família/benefícios no RH",
        quando: "30-dias",
        link: "/post/salario-familia-quem-tem-direito",
      },
      {
        id: "orcamento",
        texto: "Abrir a linha do filho no Orçamento familiar",
        quando: "30-dias",
        link: "/ferramentas/orcamento-familiar",
      },
    ],
  },
];
export const TOTAL_ITENS = GRUPOS.reduce((s, g) => s + g.itens.length, 0);
export const ARTIGO_MALA = "/post/mala-da-maternidade-do-pai";
