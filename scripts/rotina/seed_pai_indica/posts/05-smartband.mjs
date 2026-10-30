import { btn, fotos, h2, h3, ol, p, table, ul } from "../tiptap.mjs";

const A = "amazfit-bip-5",
  X = "xiaomi-smart-band-9",
  G = "samsung-galaxy-fit3";
const comparison = {
  criteria: [
    { name: "Desempenho no uso", weight: 30 },
    { name: "Conforto", weight: 20 },
    { name: "Resistência e materiais", weight: 20 },
    { name: "Praticidade", weight: 10 },
    { name: "Custo-benefício", weight: 20 },
  ],
  products: [
    {
      product_slug: A,
      name: "Amazfit Bip 5",
      role: "vencedor",
      score: 8.1,
      criteria_scores: [8.5, 7.5, 7.5, 8.5, 8.5],
      one_liner:
        "GPS próprio, tela grande e bateria de dias: corre e dorme sem o celular por perto.",
    },
    {
      product_slug: X,
      name: "Xiaomi Smart Band 9",
      role: "custo-beneficio",
      score: 7.8,
      criteria_scores: [7.0, 9.0, 7.5, 8.0, 8.5],
      one_liner: "A mais leve e barata; usa o GPS do celular.",
    },
    {
      product_slug: G,
      name: "Samsung Galaxy Fit3",
      role: "alternativa",
      score: 7.3,
      criteria_scores: [7.0, 8.5, 8.0, 7.0, 6.0],
      one_liner: "Alumínio e tela grande; faz mais sentido com celular Samsung.",
    },
  ],
  table: {
    columns: ["Modelo", "Faixa de preço", "GPS", "Tela", "Bateria (uso típico)", "Chamadas"],
    rows: [
      [
        "Amazfit Bip 5",
        `{FAIXA:${A}}`,
        "Integrado",
        '1,91" LCD',
        "Cerca de 10 dias",
        "Sim, por Bluetooth",
      ],
      [
        "Xiaomi Smart Band 9",
        `{FAIXA:${X}}`,
        "Do celular",
        '1,62" AMOLED',
        "Cerca de 21 dias",
        "Não",
      ],
      ["Samsung Galaxy Fit3", `{FAIXA:${G}}`, "Do celular", '1,6" AMOLED', "Até 13 dias", "Não"],
    ],
  },
  winner_slug: A,
  verdict_by_profile: [
    {
      profile: "Se você corre ou pedala e quer deixar o celular em casa",
      pick_slug: A,
      reason: "É o único dos três com GPS integrado e chamadas pelo relógio.",
    },
    {
      profile: "Se você quer acompanhar passos, sono e treino na academia gastando o mínimo",
      pick_slug: X,
      reason:
        "Mais leve, mais barata e com a bateria mais longa; o GPS do celular resolve a corrida ocasional.",
    },
    {
      profile: "Se o seu celular é Samsung e você quer acabamento de metal",
      pick_slug: G,
      reason: "Integração com o Samsung Health, corpo de alumínio e detecção de queda.",
    },
  ],
  how_we_evaluated:
    "Comparação baseada em ficha técnica dos fabricantes (Amazfit, Xiaomi, Samsung), manuais, anúncios da Amazon Brasil e opiniões fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, fóruns de corrida). Não fizemos teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Esporte e Outdoor).",
};

export default {
  slug: "amazfit-bip-5-xiaomi-smart-band-9-ou-galaxy-fit3-qual-acompanha-o-treino-e-o-sono-do-pai",
  kind: "comparativo",
  title:
    "Amazfit Bip 5, Xiaomi Smart Band 9 ou Galaxy Fit3: qual acompanha o treino e o sono do pai?",
  subtitle:
    "Três monitores de atividade abaixo da faixa dos smartwatches caros, comparados pelo que o pai precisa: GPS, bateria, conforto no pulso e o que o aplicativo mostra do sono.",
  excerpt:
    "Amazfit Bip 5, Xiaomi Smart Band 9 e Galaxy Fit3 lado a lado: GPS, bateria, tela e sono. O Bip 5 leva pelo GPS; a Band 9 é o custo-benefício.",
  seo_title: "Amazfit Bip 5, Smart Band 9 ou Galaxy Fit3: qual comprar?",
  seo_description:
    "Comparativo Amazfit Bip 5, Xiaomi Smart Band 9 e Samsung Galaxy Fit3: GPS, bateria, tela, sono e faixa de preço, com o veredito por perfil de pai.",
  product_category: "esporte-e-outdoor",
  product_subcategory: "relogios-e-monitores",
  cover_alt:
    "Comparativo: Amazfit Bip 5, Xiaomi Smart Band 9 e Samsung Galaxy Fit3 (fotos oficiais)",
  comparison,
  faq: [
    {
      question: "Preciso de GPS no relógio para correr?",
      answer:
        "Só se você quiser deixar o celular em casa. Os três marcam distância e ritmo; a Band 9 e o Fit3 usam o GPS do celular, que precisa ir no bolso ou na braçadeira. O Bip 5 tem GPS próprio e grava o trajeto sozinho.",
    },
    {
      question: "O monitor de sono é confiável?",
      answer:
        "É uma estimativa a partir do movimento e da frequência cardíaca, boa para ver se você dormiu pouco ou acordou muitas vezes, não para diagnosticar apneia. Se o relógio mostra sono ruim todo dia e você acorda cansado, o caminho é um médico, não um aparelho melhor.",
    },
    {
      question: "Dá para atender ligação pelo relógio?",
      answer:
        "Só no Amazfit Bip 5, que tem alto-falante e microfone e atende chamadas pelo Bluetooth do celular. A Band 9 e o Fit3 mostram quem está ligando e permitem recusar, mas não atendem.",
    },
    {
      question: "Funciona com iPhone?",
      answer:
        "O Bip 5 e a Band 9 funcionam com Android e iPhone, com alguns recursos a menos no iPhone. O Galaxy Fit3 depende do Samsung Health e do aplicativo Galaxy Wearable, que não funcionam no iPhone.",
    },
    {
      question: "Posso tomar banho e nadar com eles?",
      answer:
        "Os três têm resistência à água de 5 ATM, o que cobre banho, chuva e natação em piscina. Nenhum é indicado para mergulho nem para água quente de ducha prolongada ou sauna.",
    },
  ],
  quiz: [
    {
      question: "Qual dos três tem GPS integrado?",
      options: ["Xiaomi Smart Band 9", "Samsung Galaxy Fit3", "Amazfit Bip 5", "Nenhum"],
      correct: 2,
      explanation: "Só o Amazfit Bip 5 tem GPS próprio; os outros usam o do celular.",
    },
    {
      question: "Qual tem a bateria mais longa em uso típico?",
      options: ["Amazfit Bip 5", "Xiaomi Smart Band 9", "Samsung Galaxy Fit3", "Empate"],
      correct: 1,
      explanation:
        "A Band 9 fica em torno de três semanas; o Fit3, até 13 dias; o Bip 5, cerca de 10.",
    },
    {
      question: "Qual deles não funciona com iPhone?",
      options: ["Amazfit Bip 5", "Xiaomi Smart Band 9", "Samsung Galaxy Fit3", "Todos funcionam"],
      correct: 2,
      explanation: "O Galaxy Fit3 depende de aplicativos Samsung que não existem para iPhone.",
    },
  ],
  body: [
    p(
      "O pai que voltou a correr depois dos 35 quer duas coisas de um relógio: saber se o treino está rendendo e saber por que acorda cansado. Não precisa de smartwatch de preço alto para isso. Precisa de um monitor que marque distância e batimento com honestidade, aguente a semana sem carregar e não pese no pulso durante a noite.",
    ),
    p(
      `Comparamos os três mais procurados dessa faixa no Brasil: o [Amazfit Bip 5](/loja/${A}), a [Xiaomi Smart Band 9](/loja/${X}) e o [Samsung Galaxy Fit3](/loja/${G}). Olhamos GPS, bateria, tela, conforto e o que o aplicativo mostra do sono, com a cabeça de quem faz o [treino de 20 minutos em casa](/post/treino-de-20-minutos-em-casa-para-pais-sem-tempo) e corre no fim de semana. O Bip 5 leva pelo GPS próprio e pelas chamadas; a Band 9 é o custo-benefício; o Fit3 faz sentido para quem tem celular Samsung.`,
    ),
    h2("Em 3 pontos"),
    ol([
      "O Amazfit Bip 5 é o único com GPS integrado e chamadas pelo relógio: corre e atende sem o celular por perto. Nota 8,1.",
      "A Xiaomi Smart Band 9 é a mais leve, a mais barata e a de bateria mais longa, usando o GPS do celular. Nota 7,8.",
      "O Samsung Galaxy Fit3 tem corpo de alumínio e tela grande, mas só rende por inteiro com celular Samsung. Nota 7,3.",
    ]),
    fotos([
      { slug: A, name: "Amazfit Bip 5" },
      { slug: X, name: "Xiaomi Smart Band 9" },
      { slug: G, name: "Samsung Galaxy Fit3" },
    ]),
    h2("Os 3 modelos que comparamos"),
    p(
      "Os três monitoram frequência cardíaca, oxigênio no sangue, sono, estresse e mais de cem modos de esporte, com resistência à água de 5 ATM. A diferença está no GPS, na tela, na bateria e no ecossistema do celular. A tabela resume o que a ficha técnica de cada fabricante informa.",
    ),
    table(comparison.table.columns, comparison.table.rows),
    h2("Amazfit Bip 5: o que corre sem o celular"),
    btn(A, "Amazfit Bip 5"),
    p(
      "O Bip 5 é um relógio de verdade, não uma pulseira: tela LCD de 1,91 polegada, GPS integrado com os quatro sistemas de satélite, alto-falante e microfone para atender ligação pelo Bluetooth e mais de 120 modos de esporte. A bateria fica em torno de 10 dias no uso típico segundo a Zepp Health, menos com GPS ligado todo dia. O aplicativo Zepp mostra o trajeto da corrida, o ritmo por quilômetro, as fases do sono e uma pontuação de prontidão de manhã.",
    ),
    p(
      "O corpo é de plástico e a tela não é AMOLED, o que se nota ao lado do Fit3; e não há pagamento por aproximação no Brasil. Em compensação, é o único dos três que deixa o celular em casa: o pai sai para correr com o relógio, grava a distância certa e ainda atende a esposa se o bebê acordar. Fora da Amazon, os compradores repetem o elogio à bateria e ao GPS; a queixa recorrente é a pulseira de silicone que cansa no calor.",
    ),
    h3("Pontos fortes"),
    ul([
      "GPS integrado: corre sem o celular",
      "Tela grande e legível ao sol",
      "Atende chamadas pelo relógio",
      "Bateria para cerca de 10 dias",
    ]),
    h3("Pontos de atenção"),
    ul([
      "Corpo de plástico, tela LCD",
      "Sem pagamento por aproximação no Brasil",
      "Pulseira de silicone cansa no calor",
    ]),
    h2("Xiaomi Smart Band 9: a que você esquece no pulso"),
    btn(X, "Xiaomi Smart Band 9"),
    p(
      "A Band 9 continua a receita que fez a linha ser a pulseira mais vendida do país: tela AMOLED de 1,62 polegada com brilho alto, mais de 150 modos de esporte, monitoramento de batimento, oxigênio, sono e estresse, e bateria que a Xiaomi estima em cerca de 21 dias de uso típico. Pesa pouco mais de 15 gramas sem a pulseira; é a que menos incomoda para dormir, e o sono é o dado que mais interessa ao pai de bebê pequeno.",
    ),
    p(
      "O limite é o GPS: ela não tem o próprio e precisa do celular no bolso para gravar o trajeto da corrida. Não atende chamada, só mostra quem liga. A tela é pequena para ler notificação longa. Mas, para acompanhar passos, academia, sono e batimento gastando o mínimo, é difícil fazer melhor. As opiniões fora da Amazon destacam a bateria e o conforto; as reclamações são a pulseira que solta com o tempo e a dependência do celular.",
    ),
    h3("Pontos fortes"),
    ul([
      "Mais leve e discreta das três",
      "Bateria de cerca de 3 semanas",
      "Tela AMOLED com brilho alto",
      "Melhor preço",
    ]),
    h3("Pontos de atenção"),
    ul(["Sem GPS próprio", "Não atende chamadas", "Tela pequena para notificações"]),
    h2("Samsung Galaxy Fit3: a de metal para quem é Samsung"),
    btn(G, "Samsung Galaxy Fit3"),
    p(
      "O Fit3 é a pulseira mais bem acabada do trio: corpo de alumínio, tela AMOLED de 1,6 polegada, mais de 100 modos de esporte, detecção de queda e bateria que a Samsung estima em até 13 dias. A integração com o Samsung Health é o ponto forte: sono, batimento, oxigênio e treinos aparecem no mesmo lugar dos dados do celular Samsung, e o relógio controla câmera e música.",
    ),
    p(
      "O problema é o ecossistema: o aplicativo não funciona em iPhone e vários recursos pedem celular Samsung. Não tem GPS próprio nem atende chamadas, e o preço fica acima da Band 9 com funções parecidas; por isso a nota de custo-benefício é a mais baixa das três. Para o pai com Galaxy no bolso e vontade de um acabamento que não pareça brinquedo, é a escolha natural. Fora da Amazon, o elogio comum é ao acabamento; a queixa, à exigência do celular Samsung.",
    ),
    h3("Pontos fortes"),
    ul([
      "Corpo de alumínio e tela grande",
      "Integração com o Samsung Health",
      "Bateria de até 13 dias",
      "Detecção de queda",
    ]),
    h3("Pontos de atenção"),
    ul(["Sem GPS próprio", "Não funciona com iPhone", "Custo-benefício abaixo da Band 9"]),
    h2("Por que isso importa antes de comprar"),
    p(
      "Um monitor de atividade não faz ninguém treinar; ele mostra se o esforço está rendendo e, principalmente, se o sono está sendo suficiente. Para o pai com filho pequeno, o dado do sono costuma ser mais revelador do que o do treino: três acordadas por noite explicam o cansaço que nenhuma corrida resolve. Leia a [rotina do pai nos primeiros 30 dias do bebê](/post/rotina-do-pai-nos-primeiros-30-dias-do-bebe) antes de culpar o treino.",
    ),
    p(
      "Nenhum dos três é aparelho médico. Batimento alto em repouso, oxigênio baixo repetido ou sono ruim todo dia são motivo para marcar os [exames que todo homem deve fazer a partir dos 30 anos](/post/exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos) com um médico, não para trocar de relógio. E, se o objetivo é perder peso, a balança conta mais do que o relógio: veja o review da [Xiaomi Mi Body Composition Scale 2](/pai-indica/xiaomi-mi-body-composition-scale-2-a-balanca-que-mostra-se-a-dieta-esta-funcionando).",
    ),
    h2("Variação de preço"),
    p(
      `A Xiaomi Smart Band 9 costuma ficar na faixa de {FAIXA:${X}}; o Samsung Galaxy Fit3, em {FAIXA:${G}}; e o Amazfit Bip 5, em {FAIXA:${A}}. O preço varia com a cor, com a versão (global ou nacional) e com a loja; a Band 9 é a que mais oscila nas datas de promoção da própria Xiaomi.`,
    ),
    p(
      "Observação: a faixa é o preço consultado na internet como um todo (lojas, comparadores e site do fabricante), não apenas na Amazon. O valor do dia aparece ao clicar no botão de compra.",
    ),
    btn(A, "Amazfit Bip 5"),
    h2("Qual comprar"),
    p(
      `Se você corre ou pedala e quer deixar o celular em casa, o [Amazfit Bip 5](/loja/${A}) é o único dos três com GPS integrado e chamadas pelo relógio: é a escolha geral deste comparativo. Se quer acompanhar passos, sono e treino na academia gastando o mínimo, a [Xiaomi Smart Band 9](/loja/${X}) entrega isso com a bateria mais longa e o menor peso. Se o seu celular é Samsung e você quer acabamento de metal, o [Galaxy Fit3](/loja/${G}) é a escolha natural.`,
    ),
    btn(X, "Xiaomi Smart Band 9"),
    h2("Como avaliamos"),
    p(
      "Comparação baseada na ficha técnica e no manual de cada fabricante (Amazfit/Zepp Health, Xiaomi e Samsung), nos anúncios da Amazon Brasil e em opiniões de compradores fora da Amazon: Reclame Aqui, Mercado Livre, Magalu e fóruns de corrida. Não fizemos teste físico. A nota de cada modelo é a média ponderada de cinco critérios com os pesos da categoria Esporte e Outdoor: desempenho no uso (30), conforto (20), resistência e materiais (20), praticidade (10) e custo-benefício (20). A nota é editorial e não é a estrela da Amazon; a faixa de preço vem de pesquisa em várias lojas, nunca de preço exato.",
    ),
    h2("Outros comparativos e reviews"),
    p(
      `Veja os três na Loja do Pai ([Amazfit Bip 5](/loja/${A}), [Xiaomi Smart Band 9](/loja/${X}) e [Galaxy Fit3](/loja/${G})), o comparativo de [parafusadeiras de 12 V](/pai-indica/bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v) e o guia [como ser um marido presente depois que o bebê chega](/post/como-ser-um-marido-presente-depois-que-o-bebe-chega), porque o treino que vale é o que cabe na vida da família.`,
    ),
  ],
};
