import { btn, fotos, h2, ol, p, table, ul } from "../tiptap.mjs";

const S = "philips-oneblade-qp2724";
const review = {
  product_slug: S,
  score: 7.9,
  criteria: [
    {
      name: "Resultado",
      weight: 30,
      score: 8.0,
      comment:
        "Apara e dá acabamento em barba de até 5 mm sem repuxar; não substitui lâmina para pele lisa.",
    },
    {
      name: "Conforto na pele",
      weight: 20,
      score: 8.5,
      comment: "A lâmina não toca a pele diretamente; menos irritação que barbeador de lâmina.",
    },
    {
      name: "Bateria e manutenção",
      weight: 15,
      score: 7.0,
      comment: "Cerca de 45 minutos por carga e carga lenta; a lâmina dura em torno de 4 meses.",
    },
    {
      name: "Acabamento e durabilidade",
      weight: 15,
      score: 7.5,
      comment: "Plástico leve; corpo lavável, mas não é à prova de queda.",
    },
    {
      name: "Custo-benefício",
      weight: 20,
      score: 8.0,
      comment: "Entrada da linha OneBlade; o refil é o custo recorrente a considerar.",
    },
  ],
  pros: [
    "Apara, modela e faz acabamento com uma só lâmina",
    "Corpo lavável em água corrente",
    "Pentes de 1, 3 e 5 mm incluídos",
    "Leve e fácil de manobrar no pescoço",
  ],
  cons: [
    "Bateria de carga lenta",
    "Não deixa a pele totalmente lisa como lâmina tradicional",
    "Refil da lâmina é despesa recorrente",
    "Sem indicador de bateria em porcentagem",
  ],
  ideal_for:
    "Pai que mantém barba curta ou cavanhaque e quer um aparelho só para aparar e dar acabamento, rápido, no banho.",
  not_ideal_for:
    "Quem quer a pele totalmente lisa todo dia ou precisa de aparelho profissional para corte de cabelo.",
  verdict:
    "O OneBlade QP2724 é a porta de entrada mais sensata da linha: faz o básico muito bem, aguenta o banho e cabe no bolso. A bateria lenta é o preço de ser o modelo simples.",
  how_we_evaluated:
    "Análise baseada na ficha técnica e no manual da Philips, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, YouTube). Não fizemos teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Estilo e Barba).",
  sources: [
    "philips.com.br (ficha e manual)",
    "Amazon Brasil (anúncio)",
    "Reclame Aqui",
    "Mercado Livre",
    "Magalu",
  ],
  other_buyers: {
    intro: "Procuramos padrões que se repetem em avaliações fora da Amazon.",
    praises: ["Praticidade para aparar no banho", "Não irrita a pele", "Leve"],
    complaints: ["Bateria demora para carregar", "Refil considerado caro"],
    sources: ["Reclame Aqui", "Mercado Livre", "Magalu"],
    none_found: false,
  },
};

export default {
  slug: "philips-oneblade-qp2724-vale-a-pena",
  kind: "review",
  title: "Philips OneBlade QP2724: vale a pena para aparar a barba no banho?",
  subtitle:
    "O modelo de entrada da linha OneBlade analisado critério por critério: resultado, conforto na pele, bateria, durabilidade e custo do refil.",
  excerpt:
    "O OneBlade QP2724 apara, modela e faz acabamento com uma lâmina só e aguenta o banho. Nota 7,9: bom, compensa o preço, com bateria lenta.",
  seo_title: "Philips OneBlade QP2724 vale a pena? Review do Pai Indica",
  seo_description:
    "Review do Philips OneBlade QP2724: o que a lâmina híbrida faz bem, onde a bateria decepciona, quanto custa o refil e para qual pai ele serve.",
  product_category: "estilo-e-barba",
  product_subcategory: "barbeadores-e-aparadores",
  cover_alt: "Foto oficial do Philips OneBlade QP2724",
  review,
  faq: [
    {
      question: "O OneBlade substitui o barbeador de lâmina?",
      answer:
        "Não totalmente. Ele apara e dá acabamento muito bem, mas a lâmina híbrida não toca a pele e por isso não deixa o rosto tão liso quanto uma lâmina tradicional. Para barba curta e cavanhaque, resolve; para pele lisa diária, não.",
    },
    {
      question: "Dá para usar no banho?",
      answer:
        "Sim. O QP2724 tem corpo lavável e pode ser usado com a pele molhada e espuma; é um dos motivos de a lâmina irritar menos. Só não deixe o aparelho de molho nem carregue com ele úmido.",
    },
    {
      question: "Quanto dura a lâmina e quanto custa trocar?",
      answer:
        "A Philips indica cerca de quatro meses de uso, dois a três cortes por semana. O refil é vendido separado em pacotes de uma ou mais lâminas e é o custo recorrente do aparelho; coloque-o na conta antes de comprar.",
    },
    {
      question: "Quanto tempo a bateria aguenta?",
      answer:
        "A ficha fala em cerca de 45 minutos por carga completa, o suficiente para várias sessões de aparar. O ponto fraco é o tempo de carga, longo neste modelo de entrada; os modelos superiores da linha carregam mais rápido.",
    },
    {
      question: "Serve para cortar o cabelo das crianças?",
      answer:
        "Não é um aparelho de cabelo. Os pentes de 1, 3 e 5 mm são para barba; para cortar cabelo dos filhos, procure uma máquina de cabelo com pentes maiores.",
    },
  ],
  quiz: [
    {
      question: "Qual é a principal limitação do OneBlade QP2724?",
      options: [
        "Não pode molhar",
        "A bateria demora para carregar",
        "Não apara barba longa",
        "Não tem pentes",
      ],
      correct: 1,
      explanation:
        "O corpo é lavável e vem com três pentes; o ponto fraco é o tempo de carga da bateria.",
    },
    {
      question: "Os pentes que vêm na caixa são de:",
      options: ["1, 3 e 5 mm", "2, 4 e 6 mm", "3, 6 e 9 mm", "Só um pente ajustável"],
      correct: 0,
      explanation: "O QP2724 traz pentes de 1, 3 e 5 mm para aparar barba curta.",
    },
    {
      question: "Com que frequência a Philips indica trocar a lâmina?",
      options: ["Toda semana", "Todo mês", "A cada 4 meses", "Nunca"],
      correct: 2,
      explanation: "Cerca de quatro meses, com dois a três cortes por semana.",
    },
  ],
  body: [
    p(
      "Barba de três dias, cinco minutos antes de sair para o trabalho, a esposa já de pé com o bebê no colo: o pai precisa de um aparelho que resolva no banho, sem ritual de espuma e lâmina e sem deixar o pescoço ardendo. O OneBlade é o nome que todo mundo cita, e o QP2724 é o modelo mais barato da linha. A dúvida é se o mais barato é o suficiente.",
    ),
    p(
      `Analisamos a ficha técnica e o manual da Philips, o anúncio da Amazon Brasil e o que os compradores dizem fora da Amazon para responder a isso. O veredito: o [OneBlade QP2724](/loja/${S}) é a porta de entrada mais sensata da linha, faz o básico muito bem e aguenta o banho; a bateria lenta é o preço de ser o modelo simples. Nota 7,9, na faixa "bom, compensa o preço" da nossa régua. Quem quer cuidar da aparência sem perder tempo pode combinar com o [treino de 20 minutos em casa](/post/treino-de-20-minutos-em-casa-para-pais-sem-tempo).`,
    ),
    h2("Em 3 pontos"),
    ol([
      "Uma lâmina só apara, modela e faz acabamento; o corpo é lavável e os pentes de 1, 3 e 5 mm vêm na caixa.",
      "A lâmina não toca a pele diretamente, por isso irrita menos que o barbeador de lâmina, mas não deixa o rosto totalmente liso.",
      "A bateria rende cerca de 45 minutos por carga e carrega devagar; o refil da lâmina é o custo recorrente.",
    ]),
    fotos([{ slug: S, name: "Philips OneBlade QP2724" }]),
    h2("O que o OneBlade entrega de verdade"),
    btn(S),
    p(
      "A tecnologia da linha é uma lâmina dupla que oscila 200 vezes por segundo, protegida por um sistema que mantém a borda afastada da pele. Na prática, você passa o aparelho em qualquer direção, com a pele seca ou molhada, e ele apara a barba de até 5 mm, modela o contorno (a ponta é fina para a linha do pescoço e da bochecha) e faz o acabamento rente sem o ardor da lâmina tradicional. É isso que o manual promete e é isso que se repete nas opiniões dos compradores.",
    ),
    p(
      "O que ele não faz: deixar a pele lisa como gilete. A lâmina fica a uma fração de milímetro da pele; a sensação é de barba rente, não de rosto liso. Para o pai de barba curta ou cavanhaque, é exatamente o resultado desejado. Para quem precisa do rosto liso todo dia por exigência do trabalho, o OneBlade vira complemento, não substituto.",
    ),
    h2("Conforto no banho e na correria"),
    p(
      "O QP2724 é lavável em água corrente e pode ser usado com espuma ou gel. Isso resolve o problema de tempo: a sessão de aparar entra no banho, dura três ou quatro minutos e não espalha pelo na pia. Com cerca de 95 gramas e um cabo fino, o aparelho é fácil de manobrar na linha do pescoço, onde a maioria dos aparadores comuns pede duas tentativas.",
    ),
    p(
      "A pele agradece. Como a lâmina não raspa a superfície, a vermelhidão e os pelos encravados típicos da gilete aparecem bem menos. É o critério em que o OneBlade mais se destaca entre os aparelhos da mesma faixa e o motivo de a nota de conforto ser a mais alta da avaliação.",
    ),
    btn(S),
    h2("Bateria, carga e o custo do refil"),
    p(
      "Aqui mora o ponto fraco. A ficha técnica indica cerca de 45 minutos de uso por carga, o que rende várias sessões de aparar, mas a carga completa neste modelo de entrada é lenta: deixe no carregador à noite, não dez minutos antes de sair. Não há indicador em porcentagem, só a luz de bateria baixa. Os modelos superiores da linha (QP2730 e acima) carregam mais rápido e trazem pente ajustável; é o que se paga a mais.",
    ),
    p(
      "A lâmina dura em torno de quatro meses, com dois a três cortes por semana, segundo a Philips. O refil é vendido separado e precisa entrar na conta: ao longo de um ano, dois ou três refis podem somar mais do que a diferença de preço para um modelo superior. Compre o refil original; os genéricos aparecem nas reclamações por perder o fio rápido.",
    ),
    h2("Ficha técnica"),
    table(
      ["Campo", "Valor informado pelo fabricante"],
      [
        ["Modelo", "Philips OneBlade QP2724/10"],
        ["Tipo", "Aparador híbrido (apara, modela e faz acabamento)"],
        ["Pentes", "1, 3 e 5 mm"],
        ["Uso", "Seco ou molhado; corpo lavável"],
        ["Bateria", "Recarregável; cerca de 45 min por carga"],
        ["Troca da lâmina", "Cerca de 4 meses (2 a 3 usos por semana)"],
        ["Peso aproximado", "95 g"],
      ],
    ),
    h2("O que dizem outros compradores"),
    p(
      "Procuramos padrões que se repetem em avaliações fora da Amazon (Reclame Aqui, Mercado Livre, Magalu e vídeos de uso no YouTube). Os elogios mais frequentes: a praticidade de aparar no banho, a ausência de irritação na pele e o peso baixo. As reclamações reais: o tempo de carga da bateria, considerado longo, e o preço do refil, visto como alto para um aparelho de entrada. Não encontramos padrão de defeito de fábrica recorrente; os relatos de quebra envolvem queda no chão do banheiro, o que o corpo de plástico não perdoa.",
    ),
    btn(S),
    h2("Variação de preço"),
    p(
      `O OneBlade QP2724 costuma ficar na faixa de {FAIXA:${S}}. O preço sobe nos kits com refil extra e cai em datas sazonais; os modelos superiores da linha custam mais pelo pente ajustável e pela carga rápida.`,
    ),
    p(
      "Observação: a faixa é o preço consultado na internet como um todo (lojas, comparadores e site do fabricante), não apenas na Amazon. O valor do dia aparece ao clicar no botão de compra.",
    ),
    h2("Para quem vale a pena (e para quem não)"),
    p(
      `Vale para o pai de barba curta, cavanhaque ou barba de poucos dias que quer um aparelho só, rápido, no banho, sem irritar a pele. Vale também para quem está começando na linha e quer saber se gosta do sistema antes de pagar pelos modelos maiores. Veja a ficha completa e a review da loja em [Philips OneBlade QP2724](/loja/${S}).`,
    ),
    p(
      `Não vale para quem precisa do rosto totalmente liso todo dia, para quem quer cortar o cabelo dos filhos com o mesmo aparelho ou para quem não tem paciência com carga lenta. Nesses casos, um barbeador elétrico rotativo ou uma máquina de cabelo com pentes grandes resolvem melhor. E, se a barba faz parte de cuidar da própria imagem como marido, leia [como ser um marido presente depois que o bebê chega](/post/como-ser-um-marido-presente-depois-que-o-bebe-chega): aparência é só uma parte da presença.`,
    ),
    btn(S),
    h2("Como avaliamos"),
    p(
      "Análise baseada na ficha técnica e no manual da Philips, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, YouTube). Não fizemos teste físico. A nota é a média ponderada de cinco critérios com os pesos da categoria Estilo e Barba: resultado (30), conforto na pele (20), bateria e manutenção (15), acabamento e durabilidade (15) e custo-benefício (20). A nota é editorial e não é a estrela da Amazon; a faixa de preço vem de pesquisa em várias lojas, nunca de preço exato.",
    ),
    h2("Outros reviews e comparativos"),
    p(
      "Continue no Pai Indica: o comparativo de [parafusadeiras de 12 V](/pai-indica/bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v) para a casa, o review da [Xiaomi Mi Body Composition Scale 2](/pai-indica/xiaomi-mi-body-composition-scale-2-a-balanca-que-mostra-se-a-dieta-esta-funcionando) para quem está cuidando do corpo, e, no blog, os [exames que todo homem deve fazer a partir dos 30 anos](/post/exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos) o [guia do primeiro trimestre para quem vai ser pai](/post/vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem) e a [rotina do pai nos primeiros 30 dias do bebê](/post/rotina-do-pai-nos-primeiros-30-dias-do-bebe), quando cinco minutos no banho valem ouro.",
    ),
  ],
};
