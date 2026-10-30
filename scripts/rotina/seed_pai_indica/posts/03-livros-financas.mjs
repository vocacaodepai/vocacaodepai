import { btn, fotos, h2, ol, p } from "../tiptap.mjs";

const K = "pai-rico-pai-pobre",
  C = "o-homem-mais-rico-da-babilonia",
  E = "os-segredos-da-mente-milionaria",
  N = "me-poupe-nathalia-arcuri",
  T = "do-mil-ao-milhao-thiago-nigro";
const comparison = {
  criteria: [
    { name: "Profundidade do conteúdo", weight: 30 },
    { name: "Aplicação prática", weight: 25 },
    { name: "Clareza e escrita", weight: 20 },
    { name: "Alinhamento com a formação do pai", weight: 15 },
    { name: "Custo-benefício", weight: 10 },
  ],
  products: [
    {
      product_slug: C,
      name: "O Homem Mais Rico da Babilônia",
      role: "escolha-do-editor",
      score: 8.3,
      criteria_scores: [7.5, 9.0, 8.0, 9.0, 9.0],
      one_liner:
        "As regras que não envelhecem, em parábolas curtas; o primeiro livro para ler e dar de presente.",
    },
    {
      product_slug: N,
      name: "Me Poupe!",
      role: "melhor-para-iniciantes",
      score: 7.9,
      criteria_scores: [7.0, 9.0, 8.0, 7.0, 8.5],
      one_liner: "Dez passos com exemplos brasileiros para sair do vermelho.",
    },
    {
      product_slug: K,
      name: "Pai Rico, Pai Pobre",
      role: "melhor-desempenho",
      score: 7.6,
      criteria_scores: [8.0, 7.0, 8.5, 7.0, 7.5],
      one_liner: "Muda a forma de ver salário, dívida e casa própria; precisa de filtro.",
    },
    {
      product_slug: T,
      name: "Do Mil ao Milhão",
      role: "melhor-custo-beneficio",
      score: 7.4,
      criteria_scores: [7.0, 8.0, 7.5, 7.0, 7.5],
      one_liner: "Gastar bem, ganhar mais e investir melhor, com cabeça brasileira.",
    },
    {
      product_slug: E,
      name: "Os Segredos da Mente Milionária",
      role: "sem-selo",
      score: 6.8,
      criteria_scores: [6.5, 7.5, 7.0, 6.0, 7.0],
      one_liner: "Útil pelo método dos potes; o tom de promessa pede leitura crítica.",
    },
  ],
  winner_slug: C,
  verdict_by_profile: [
    {
      profile: "Se você nunca leu nada sobre dinheiro e está no vermelho",
      pick_slug: N,
      reason: "Linguagem simples, passo a passo e exemplos de cartão e cheque especial do Brasil.",
    },
    {
      profile:
        "Se você quer as regras de base para a vida toda, em uma leitura de um fim de semana",
      pick_slug: C,
      reason:
        "Pague-se primeiro, controle o gasto, proteja-se da perda: cabe num cartão e vale para o filho.",
    },
    {
      profile: "Se você já controla o orçamento e quer pensar em renda e patrimônio",
      pick_slug: K,
      reason:
        "Ativo e passivo bem explicados; leia com filtro e passe depois para Do Mil ao Milhão.",
    },
  ],
  how_we_evaluated:
    "Leitura das edições em português, sumário e capítulos de amostra, resenhas de leitores fora da Amazon (Skoob, Goodreads, Estante Virtual) e a nossa linha editorial de família. Não é teste físico nem recomendação de investimento. Nota editorial: média ponderada de 5 critérios (pesos da categoria Livros e Formação).",
};

export default {
  slug: "5-livros-de-financas-pessoais-que-todo-pai-de-familia-deveria-ler",
  kind: "lista",
  title: "5 livros de finanças pessoais que todo pai de família deveria ler",
  subtitle:
    "Ranqueamos cinco clássicos de dinheiro com os critérios do pai provedor: profundidade, aplicação prática, clareza e alinhamento com a formação da família.",
  excerpt:
    "Cinco livros de finanças pessoais ranqueados para o pai de família: qual ler primeiro, qual dar de presente e qual pede filtro crítico.",
  seo_title: "5 livros de finanças pessoais para o pai de família",
  seo_description:
    "Pai Rico Pai Pobre, O Homem Mais Rico da Babilônia, Me Poupe!, Do Mil ao Milhão e Mente Milionária ranqueados com nota para o pai provedor.",
  product_category: "livros-e-formacao",
  product_subcategory: "financas-pessoais",
  cover_alt: "Lista: cinco livros de finanças pessoais para o pai de família (capas oficiais)",
  comparison,
  faq: [
    {
      question: "Por qual livro começar?",
      answer:
        "Se você está no vermelho, Me Poupe!: é o mais prático para sair da dívida. Se já paga as contas em dia, O Homem Mais Rico da Babilônia: as regras de base, em duas horas de leitura. Os outros três vêm depois.",
    },
    {
      question: "Esses livros ensinam a investir?",
      answer:
        "Não de verdade. Eles ensinam a controlar o gasto, pagar dívida e guardar. Investimento é um passo seguinte, com estudo próprio ou um profissional de confiança. Este site não dá recomendação de investimento; dá informação educativa.",
    },
    {
      question: "Vale ler em e-book ou só em papel?",
      answer:
        "Para livro de hábito, papel costuma funcionar melhor: fica à vista na mesa de cabeceira e vai para a mão do filho adolescente. O e-book é mais barato e cabe no celular na fila do pediatra. Os dois cumprem o papel.",
    },
    {
      question: "Posso ler junto com a minha esposa?",
      answer:
        "Deve. Orçamento de casa é decisão do casal, e os dois lendo o mesmo livro cortam metade das discussões sobre dinheiro. Leiam um capítulo por semana e conversem quinze minutos sobre ele.",
    },
    {
      question: "Pai Rico, Pai Pobre não é polêmico?",
      answer:
        "O autor exagera e alguns exemplos não se aplicam ao Brasil. Por isso ele não é o primeiro da lista: lido com filtro, continua sendo a melhor explicação de ativo e passivo que você vai encontrar em linguagem simples.",
    },
  ],
  quiz: [
    {
      question: "Qual é a regra central de O Homem Mais Rico da Babilônia?",
      options: [
        "Gaste tudo o que ganha",
        "Guarde pelo menos um décimo do que ganha",
        "Compre a casa própria primeiro",
        "Invista em ouro",
      ],
      correct: 1,
      explanation:
        "Pague-se primeiro: um décimo de tudo o que entra vai para você antes de qualquer conta.",
    },
    {
      question: "Qual livro traz exemplos de cartão e cheque especial do Brasil?",
      options: [
        "Pai Rico, Pai Pobre",
        "Me Poupe!",
        "Os Segredos da Mente Milionária",
        "O Homem Mais Rico da Babilônia",
      ],
      correct: 1,
      explanation:
        "Me Poupe!, de Nathalia Arcuri, é o único escrito a partir da realidade brasileira do endividado.",
    },
    {
      question: "Na lógica de Pai Rico, Pai Pobre, a casa própria financiada é:",
      options: [
        "Um ativo",
        "Um passivo enquanto tira dinheiro do bolso",
        "Um investimento sem risco",
        "Irrelevante",
      ],
      correct: 1,
      explanation:
        "Kiyosaki chama de passivo tudo o que tira dinheiro do bolso todo mês, inclusive a casa financiada.",
    },
  ],
  body: [
    p(
      "Pai que sustenta uma casa aprende sobre dinheiro na marra: a fralda que acaba, o boleto que atrasa, o salário que não estica até o dia 30. A maioria nunca leu um livro sobre o assunto, e os poucos que começam param no segundo capítulo porque o livro fala de investimento antes de ensinar a pagar a conta de luz.",
    ),
    p(
      `Por isso esta lista é curta e ranqueada. Lemos as edições em português dos cinco livros mais citados de finanças pessoais, olhamos o que cada um ensina de verdade e colocamos na balança do pai de família: profundidade, aplicação prática, clareza e alinhamento com a formação de quem sustenta uma casa. Nenhum deles substitui o [orçamento familiar feito a dois](/post/orcamento-familiar-para-quem-vai-ser-pai), mas todos ajudam a fazê-lo melhor.`,
    ),
    h2("Em 3 pontos"),
    ol([
      "O Homem Mais Rico da Babilônia é a escolha do editor: as regras de base, em duas horas de leitura, para ler e dar de presente.",
      "Me Poupe! é o melhor para quem está no vermelho e nunca leu nada sobre dinheiro: passo a passo com exemplos brasileiros.",
      "Pai Rico, Pai Pobre e Do Mil ao Milhão vêm depois, quando o orçamento já fecha; Os Segredos da Mente Milionária pede filtro crítico.",
    ]),
    fotos([
      { slug: C, name: "O Homem Mais Rico da Babilônia" },
      { slug: N, name: "Me Poupe!" },
      { slug: K, name: "Pai Rico, Pai Pobre" },
      { slug: T, name: "Do Mil ao Milhão" },
      { slug: E, name: "Os Segredos da Mente Milionária" },
    ]),
    h2("Como escolhemos"),
    p(
      "Entraram na lista livros de finanças pessoais vendidos na Amazon Brasil em edição em português, com pelo menos dez anos de prateleira ou de presença constante entre os mais vendidos, e que tratam da base: gastar menos do que ganha, pagar dívida, guardar e só então investir. Ficaram de fora os livros de investimento em bolsa, os de criptomoeda e os que prometem enriquecer rápido, porque promessa financeira não tem lugar na formação de um pai.",
    ),
    p(
      "Cada livro recebeu nota de 0 a 10 pela média ponderada de cinco critérios da categoria Livros e Formação: profundidade do conteúdo (30), aplicação prática (25), clareza e escrita (20), alinhamento com a formação do pai (15) e custo-benefício (10). A ordem da lista é a ordem das notas; o selo diz para quem cada livro serve melhor.",
    ),
    h2("1. O Homem Mais Rico da Babilônia: a escolha do editor"),
    btn(C, "O Homem Mais Rico da Babilônia"),
    p(
      "George S. Clason escreveu estas parábolas nos anos 1920 para bancos distribuírem aos clientes, e elas continuam funcionando porque não dependem de produto financeiro nenhum. As regras cabem num cartão: pague-se primeiro (um décimo de tudo o que entra é seu antes de qualquer conta), controle os gastos, faça o dinheiro render, proteja-se da perda, tenha a sua casa, garanta a velhice e aumente a capacidade de ganhar.",
    ),
    p(
      "Para o pai de família, é o livro que vai para a mão do filho adolescente sem edição e sem ressalva. A linguagem de parábola cansa alguns leitores e há capítulos repetitivos, por isso a profundidade não leva nota máxima. Mas, em aplicação prática e alinhamento com a formação do pai, nenhum outro da lista chega perto: é moral e matemática na mesma página. Leia num fim de semana, com um caderno ao lado, e comece pelo décimo no próximo salário.",
    ),
    h2("2. Me Poupe!: o melhor para iniciantes"),
    btn(N, "Me Poupe!"),
    p(
      "Nathalia Arcuri organiza em dez passos o caminho do endividado ao investidor iniciante, e faz isso com a realidade brasileira na frente: cartão de crédito no rotativo, cheque especial, parcela do carro, a conta que atrasa todo mês. É o único livro da lista que descreve o problema exatamente como ele aparece na mesa da cozinha de uma família daqui.",
    ),
    p(
      "O humor pode cansar o leitor mais sério, e a parte de investimentos envelhece depressa, porque produto financeiro muda. Mas, para o pai que nunca leu nada sobre dinheiro e precisa sair do vermelho antes de pensar em qualquer outra coisa, a clareza do passo a passo vale a leitura. Combine com o nosso guia de [orçamento familiar para quem vai ser pai](/post/orcamento-familiar-para-quem-vai-ser-pai) e com uma conversa franca com a esposa sobre as dívidas da casa, sem esconder nada.",
    ),
    h2("3. Pai Rico, Pai Pobre: o que muda a cabeça"),
    btn(K, "Pai Rico, Pai Pobre"),
    p(
      "Robert Kiyosaki contrasta as lições do pai biológico, funcionário instruído que vivia apertado, com as do pai do amigo, empreendedor que ficou rico, para explicar a diferença entre ativo (o que põe dinheiro no seu bolso) e passivo (o que tira). A casa própria financiada, nessa lógica, é passivo enquanto você paga por ela. É a ideia que mais muda a forma de um homem olhar para o próprio salário e para a dívida.",
    ),
    p(
      "O livro exagera, simplifica e usa exemplos americanos de imóvel que não se aplicam ao Brasil; o próprio autor é figura controversa. Por isso ele não é o primeiro da lista e pede filtro crítico. Lido depois de Babilônia, com a cabeça já firme no básico, continua sendo a explicação mais clara de ativo e passivo em linguagem simples. Leia o primeiro terço com atenção; o resto é repetição.",
    ),
    h2("4. Do Mil ao Milhão: o melhor custo-benefício"),
    btn(T, "Do Mil ao Milhão"),
    p(
      "Thiago Nigro, do canal Primo Rico, organiza a vida financeira em três pilares: gastar bem, ganhar mais e investir melhor. A novidade em relação aos outros da lista é o pilar do meio: os capítulos sobre aumentar a renda, com renda extra e carreira, falam com o pai que já cortou o que podia e descobriu que o problema não é só gasto, é entrada.",
    ),
    p(
      "O tom é motivacional e a parte de investimento é tratada de forma geral, sem aprofundar; e há pouco sobre família numerosa, que é o leitor deste site. Mesmo assim, pelo contexto brasileiro atual e pela linguagem direta, é o livro que mais entrega por página para quem já passou pelos dois primeiros. Não trate nenhuma sugestão de investimento do livro como recomendação: estude, ou procure um profissional de confiança.",
    ),
    h2("5. Os Segredos da Mente Milionária: útil, com ressalva"),
    btn(E, "Os Segredos da Mente Milionária"),
    p(
      "T. Harv Eker trata do que chama de modelo de dinheiro: as crenças sobre riqueza que você aprendeu em casa, na infância, e que repete sem perceber. O método dos seis potes (dividir toda entrada em percentuais fixos para necessidades, educação, lazer, longo prazo, doação e liberdade financeira) é prático e funciona bem para quem gosta de regra clara.",
    ),
    p(
      'O problema é o tom: há capítulos com promessas exageradas e um estilo de palestra motivacional que não combina com a formação sóbria de um pai. Por isso fica em último, sem selo, com nota na faixa "vale com ressalva". Leia pelo método dos potes e pelo capítulo sobre a origem das crenças; pule o resto. Se o dinheiro é motivo de briga em casa, o problema costuma ser de comunicação, não de técnica, e vale mais [uma conversa de marido presente](/post/como-ser-um-marido-presente-depois-que-o-bebe-chega) do que um livro.',
    ),
    h2("O que não recomendamos (e por quê)"),
    p(
      'Ficaram fora da lista, de propósito, os livros que prometem riqueza rápida, os de trader e os de criptomoeda. Não porque investir seja errado, mas porque o pai de família precisa primeiro de reserva, orçamento e dívida zerada, e esses livros pulam essa etapa. Também deixamos de fora os de autores que vendem curso no fim de cada capítulo: o livro vira propaganda. Promessa financeira ("fique rico") não é formação; é armadilha.',
    ),
    h2("Variação de preço"),
    p(
      `Livro varia pouco de preço entre lojas, e os cinco são baratos para o que entregam: O Homem Mais Rico da Babilônia costuma ficar em {FAIXA:${C}}; Me Poupe! em {FAIXA:${N}}; Pai Rico, Pai Pobre em {FAIXA:${K}}; Do Mil ao Milhão em {FAIXA:${T}}; e Os Segredos da Mente Milionária em {FAIXA:${E}}. Edição de bolso e e-book saem mais baratos; capa dura e edição comemorativa, mais caros.`,
    ),
    p(
      "Observação: a faixa é o preço consultado na internet como um todo (lojas, comparadores e site da editora), não apenas na Amazon. O valor do dia aparece ao clicar no botão de compra.",
    ),
    h2("Qual comprar"),
    p(
      `Se você nunca leu nada sobre dinheiro e está no vermelho, comece por [Me Poupe!](/loja/${N}). Se já paga as contas em dia e quer as regras de base para a vida toda, [O Homem Mais Rico da Babilônia](/loja/${C}) é a escolha do editor e o presente certo para um amigo que vai ser pai. Quando o orçamento fechar, passe para [Pai Rico, Pai Pobre](/loja/${K}) com filtro e depois para [Do Mil ao Milhão](/loja/${T}); [Os Segredos da Mente Milionária](/loja/${E}) é leitura opcional pelo método dos potes.`,
    ),
    h2("Como avaliamos"),
    p(
      "Lemos as edições em português, o sumário e os capítulos de amostra de cada livro, e cruzamos com resenhas de leitores fora da Amazon (Skoob, Goodreads, Estante Virtual) e com a nossa linha editorial de família. Não fizemos teste físico de produto, porque livro não se testa: se lê. A nota é editorial, média ponderada de cinco critérios da categoria Livros e Formação, e não é a estrela da Amazon. Nada aqui é recomendação de investimento; é informação educativa, e decisões de dinheiro da família merecem um profissional de confiança quando envolvem patrimônio.",
    ),
    h2("Outros comparativos e reviews"),
    p(
      "No Pai Indica, veja o comparativo de [parafusadeiras de 12 V](/pai-indica/bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v) e o review do [Philips OneBlade QP2724](/pai-indica/philips-oneblade-qp2724-vale-a-pena). No blog, o [guia do primeiro trimestre para quem vai ser pai](/post/vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem) e os [exames que todo homem deve fazer a partir dos 30 anos](/post/exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos), porque patrimônio sem saúde não serve para a família.",
    ),
  ],
};
