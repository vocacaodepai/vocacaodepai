// Monte o seu kit de ferramentas (doc 06 §3.12). `productSlug` só quando o produto existir na Loja do Pai
// (Fase 3 ainda não cadastrou produtos: todos os botões levam a /loja/categoria/ferramentas).
export type Nivel = "basico" | "intermediario" | "oficina";
export type Tarefa =
  | "montar-moveis"
  | "furar-parede"
  | "eletrica-basica"
  | "hidraulica"
  | "pintura"
  | "marcenaria"
  | "carro-bike"
  | "jardim";
export type Moradia = "apartamento" | "casa" | "sitio";
export interface ItemKit {
  id: string;
  nome: string;
  paraQue: string;
  nivel: Nivel;
  tarefas: Tarefa[];
  essencial: boolean;
  categoriaLoja: string;
  productSlug?: string;
  /** só faz sentido nestas moradias (ausente = todas) */
  moradias?: Moradia[];
}

export const TAREFAS: Array<{ id: Tarefa; nome: string }> = [
  { id: "montar-moveis", nome: "Montar móveis" },
  { id: "furar-parede", nome: "Furar parede" },
  { id: "eletrica-basica", nome: "Elétrica básica" },
  { id: "hidraulica", nome: "Hidráulica" },
  { id: "pintura", nome: "Pintura" },
  { id: "marcenaria", nome: "Marcenaria" },
  { id: "carro-bike", nome: "Carro e bike" },
  { id: "jardim", nome: "Jardim" },
];
export const NIVEIS: Array<{ id: Nivel; nome: string }> = [
  { id: "basico", nome: "Básico" },
  { id: "intermediario", nome: "Intermediário" },
  { id: "oficina", nome: "Oficina" },
];
const ORDEM_NIVEL: Record<Nivel, number> = { basico: 0, intermediario: 1, oficina: 2 };

const F = "ferramentas";
export const ITENS: ItemKit[] = [
  {
    id: "martelo",
    nome: "Martelo de unha 25 mm",
    paraQue: "Pregar, retirar prego, bater bucha",
    nivel: "basico",
    tarefas: ["montar-moveis", "furar-parede"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "chaves-fenda-phillips",
    nome: "Jogo de chaves de fenda e Phillips",
    paraQue: "Tomada, móvel, eletrodoméstico",
    nivel: "basico",
    tarefas: ["montar-moveis", "eletrica-basica"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "trena",
    nome: "Trena de 5 m",
    paraQue: "Medir antes de furar e de comprar",
    nivel: "basico",
    tarefas: ["montar-moveis", "furar-parede", "marcenaria"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "alicate-universal",
    nome: 'Alicate universal 8"',
    paraQue: "Segurar, cortar, dobrar arame e fio",
    nivel: "basico",
    tarefas: ["montar-moveis", "eletrica-basica", "carro-bike"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "estilete",
    nome: "Estilete largo com lâminas extras",
    paraQue: "Abrir caixa, cortar fita, raspar",
    nivel: "basico",
    tarefas: ["montar-moveis", "pintura"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "jogo-allen",
    nome: "Jogo de chaves Allen (hexagonais)",
    paraQue: "Móvel de montar, bicicleta, berço",
    nivel: "basico",
    tarefas: ["montar-moveis", "carro-bike"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "nivel",
    nome: "Nível de bolha 30 cm",
    paraQue: "Prateleira e quadro retos",
    nivel: "basico",
    tarefas: ["furar-parede", "montar-moveis"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "fita-isolante",
    nome: "Fita isolante e fita veda-rosca",
    paraQue: "Emenda de fio e rosca sem vazar",
    nivel: "basico",
    tarefas: ["eletrica-basica", "hidraulica"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "lanterna",
    nome: "Lanterna ou lanterna de cabeça",
    paraQue: "Quadro de luz, embaixo da pia, apagão",
    nivel: "basico",
    tarefas: ["eletrica-basica", "hidraulica", "carro-bike"],
    essencial: false,
    categoriaLoja: F,
  },
  {
    id: "caixa",
    nome: 'Caixa de ferramentas 16"',
    paraQue: "Tudo no mesmo lugar; o filho aprende a guardar",
    nivel: "basico",
    tarefas: ["montar-moveis"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "parafusadeira",
    nome: "Parafusadeira/furadeira a bateria 12 V",
    paraQue: "Prateleira, móvel, cortina",
    nivel: "intermediario",
    tarefas: ["montar-moveis", "furar-parede"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "jogo-brocas",
    nome: "Jogo de brocas (concreto, metal e madeira)",
    paraQue: "A broca certa para cada parede",
    nivel: "intermediario",
    tarefas: ["furar-parede", "marcenaria"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "buchas-parafusos",
    nome: "Sortimento de buchas e parafusos",
    paraQue: "Bucha 6, 8 e 10 sempre à mão",
    nivel: "intermediario",
    tarefas: ["furar-parede"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "furadeira-impacto",
    nome: "Furadeira de impacto 650 W",
    paraQue: "Concreto e alvenaria",
    nivel: "intermediario",
    tarefas: ["furar-parede"],
    essencial: false,
    categoriaLoja: F,
  },
  {
    id: "detector",
    nome: "Detector de cano e fio",
    paraQue: "Não furar cano nem fio na parede",
    nivel: "intermediario",
    tarefas: ["furar-parede"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "chave-teste",
    nome: "Chave de teste e alicate isolado",
    paraQue: "Trocar tomada e interruptor com o disjuntor desligado",
    nivel: "intermediario",
    tarefas: ["eletrica-basica"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "multimetro",
    nome: "Multímetro digital",
    paraQue: "Medir tensão e continuidade antes de mexer",
    nivel: "intermediario",
    tarefas: ["eletrica-basica", "carro-bike"],
    essencial: false,
    categoriaLoja: F,
  },
  {
    id: "chave-grifo",
    nome: 'Chave grifo 12"',
    paraQue: "Sifão, flexível, registro",
    nivel: "intermediario",
    tarefas: ["hidraulica"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "chave-inglesa",
    nome: 'Chave inglesa ajustável 10"',
    paraQue: "Porca de torneira e registro",
    nivel: "intermediario",
    tarefas: ["hidraulica", "carro-bike"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "desentupidor",
    nome: "Desentupidor e mola de pia",
    paraQue: "Pia e ralo sem chamar ninguém",
    nivel: "basico",
    tarefas: ["hidraulica"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "serra-copo",
    nome: "Serra copo e serra manual",
    paraQue: "Furo para cano e corte de PVC",
    nivel: "oficina",
    tarefas: ["hidraulica", "marcenaria"],
    essencial: false,
    categoriaLoja: F,
  },
  {
    id: "rolo-pincel",
    nome: "Rolo, pincel, bandeja e fita crepe",
    paraQue: "Parede e porta sem respingo",
    nivel: "basico",
    tarefas: ["pintura"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "espatula-massa",
    nome: "Espátula e massa corrida",
    paraQue: "Furo e trinca antes de pintar",
    nivel: "intermediario",
    tarefas: ["pintura"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "lixa",
    nome: "Lixas de parede e madeira",
    paraQue: "Acabamento antes da tinta",
    nivel: "basico",
    tarefas: ["pintura", "marcenaria"],
    essencial: false,
    categoriaLoja: F,
  },
  {
    id: "escada",
    nome: "Escada de alumínio 5 degraus",
    paraQue: "Teto, cortina, luminária com segurança",
    nivel: "intermediario",
    tarefas: ["pintura", "eletrica-basica"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "serrote",
    nome: "Serrote e esquadro",
    paraQue: "Corte reto em madeira",
    nivel: "intermediario",
    tarefas: ["marcenaria"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "grampos",
    nome: "Grampos (sargentos) e cola de madeira",
    paraQue: "Colagem firme de peça e brinquedo",
    nivel: "intermediario",
    tarefas: ["marcenaria"],
    essencial: false,
    categoriaLoja: F,
  },
  {
    id: "serra-tico-tico",
    nome: "Serra tico-tico",
    paraQue: "Curva e recorte em madeira e MDF",
    nivel: "oficina",
    tarefas: ["marcenaria"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "lixadeira",
    nome: "Lixadeira orbital",
    paraQue: "Acabamento de tampo e móvel",
    nivel: "oficina",
    tarefas: ["marcenaria", "pintura"],
    essencial: false,
    categoriaLoja: F,
  },
  {
    id: "bancada",
    nome: "Bancada dobrável com morsa",
    paraQue: "Projeto com os filhos sem estragar a mesa",
    nivel: "oficina",
    tarefas: ["marcenaria"],
    essencial: false,
    categoriaLoja: F,
    moradias: ["casa", "sitio"],
  },
  {
    id: "jogo-soquetes",
    nome: "Jogo de soquetes com catraca",
    paraQue: "Porca de roda, bike e móvel",
    nivel: "intermediario",
    tarefas: ["carro-bike", "montar-moveis"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "calibrador",
    nome: "Calibrador de pneu e bomba",
    paraQue: "Pneu do carro e da bike na pressão certa",
    nivel: "basico",
    tarefas: ["carro-bike"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "cabo-chupeta",
    nome: "Cabo de chupeta e macaco",
    paraQue: "Bateria arriada e pneu furado",
    nivel: "intermediario",
    tarefas: ["carro-bike"],
    essencial: true,
    categoriaLoja: F,
  },
  {
    id: "tesoura-poda",
    nome: "Tesoura de poda e luva de couro",
    paraQue: "Cerca viva, galho e roseira",
    nivel: "basico",
    tarefas: ["jardim"],
    essencial: true,
    categoriaLoja: F,
    moradias: ["casa", "sitio"],
  },
  {
    id: "enxada-pa",
    nome: "Enxada, pá e ancinho",
    paraQue: "Canteiro e horta com os filhos",
    nivel: "intermediario",
    tarefas: ["jardim"],
    essencial: true,
    categoriaLoja: F,
    moradias: ["casa", "sitio"],
  },
  {
    id: "mangueira",
    nome: "Mangueira com esguicho e carretel",
    paraQue: "Regar e lavar calçada",
    nivel: "basico",
    tarefas: ["jardim"],
    essencial: false,
    categoriaLoja: F,
    moradias: ["casa", "sitio"],
  },
  {
    id: "rocadeira",
    nome: "Roçadeira ou cortador de grama",
    paraQue: "Terreno e quintal grandes",
    nivel: "oficina",
    tarefas: ["jardim"],
    essencial: true,
    categoriaLoja: F,
    moradias: ["sitio"],
  },
  {
    id: "motosserra",
    nome: "Motosserra pequena (com curso de uso)",
    paraQue: "Galho grosso e lenha",
    nivel: "oficina",
    tarefas: ["jardim"],
    essencial: false,
    categoriaLoja: F,
    moradias: ["sitio"],
  },
];
export const EPI = [
  "Óculos de proteção",
  "Luvas",
  "Protetor auricular (ferramenta elétrica)",
  "Máscara (lixa e tinta)",
];

export function montarKit(opts: { moradia: Moradia; tarefas: Tarefa[]; nivel: Nivel }) {
  const itens = ITENS.filter(
    (i) =>
      ORDEM_NIVEL[i.nivel] <= ORDEM_NIVEL[opts.nivel] &&
      (!i.moradias || i.moradias.includes(opts.moradia)) &&
      (opts.tarefas.length === 0 || i.tarefas.some((t) => opts.tarefas.includes(t))),
  );
  return {
    comecePorEstes: itens.filter((i) => i.essencial),
    quandoPrecisar: itens.filter((i) => !i.essencial),
  };
}
