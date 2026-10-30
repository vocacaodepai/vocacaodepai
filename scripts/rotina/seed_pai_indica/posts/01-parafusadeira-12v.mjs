import { btn, fotos, h2, h3, ol, p, semaforo, table, ul } from "../tiptap.mjs";

const B = "bosch-gsr-120-li-12v",
  D = "black-decker-ld12sp-b2",
  M = "makita-hp333dwye-12v";
const comparison = {
  criteria: [
    { name: "Desempenho", weight: 30 },
    { name: "Ergonomia e peso", weight: 15 },
    { name: "Durabilidade", weight: 20 },
    { name: "Acessórios e garantia", weight: 15 },
    { name: "Custo-benefício", weight: 20 },
  ],
  products: [
    {
      product_slug: B,
      name: "Bosch GSR 120-LI",
      role: "vencedor",
      score: 8.4,
      criteria_scores: [8.5, 8.5, 8.5, 8.0, 8.0],
      one_liner: "A mais equilibrada: 2 baterias, maleta e torque de 30 Nm.",
    },
    {
      product_slug: D,
      name: "Black+Decker LD12SP",
      role: "custo-beneficio",
      score: 7.4,
      criteria_scores: [7.0, 7.5, 7.0, 8.0, 8.0],
      one_liner: "Para montar móvel e furar drywall de vez em quando.",
    },
    {
      product_slug: M,
      name: "Makita HP333DWYE",
      role: "premium",
      score: 8.1,
      criteria_scores: [8.5, 8.0, 8.5, 7.5, 7.5],
      one_liner: "Tem impacto para alvenaria leve; paga-se pela marca e pela função extra.",
    },
  ],
  table: {
    columns: ["Modelo", "Faixa de preço", "Torque máx.", "Baterias", "Impacto", "Garantia"],
    rows: [
      [
        "Bosch GSR 120-LI",
        `{FAIXA:${B}}`,
        "30 Nm",
        "2 × 1,5 Ah",
        "Não",
        "12 meses (+ extensão com registro)",
      ],
      ["Black+Decker LD12SP", `{FAIXA:${D}}`, "20 Nm", "1 × 1,5 Ah", "Não", "24 meses"],
      ["Makita HP333DWYE", `{FAIXA:${M}}`, "30 Nm", "2 × 1,5 Ah", "Sim", "12 meses"],
    ],
  },
  winner_slug: B,
  verdict_by_profile: [
    {
      profile: "Se você monta móvel, pendura quadro e troca fechadura de vez em quando",
      pick_slug: D,
      reason: "Resolve o uso doméstico leve por menos, com garantia de 24 meses.",
    },
    {
      profile: "Se você quer uma ferramenta para a vida toda e um serviço atrás do outro",
      pick_slug: B,
      reason: "Melhor equilíbrio entre torque, bateria dupla, maleta e assistência.",
    },
    {
      profile: "Se você fura parede de tijolo com frequência",
      pick_slug: M,
      reason: "É a única das três com impacto; paga-se pela função extra.",
    },
  ],
  how_we_evaluated:
    "Comparação baseada em ficha técnica dos fabricantes, manuais, anúncios da Amazon Brasil e opiniões fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, Leroy Merlin, fóruns). Não fizemos teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Ferramentas).",
};

export default {
  slug: "bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v",
  kind: "comparativo",
  title: "Bosch GSR 120-LI, Black+Decker LD12SP ou Makita HP333D: qual parafusadeira 12 V comprar?",
  subtitle:
    "Comparamos as três parafusadeiras de 12 V mais procuradas pelo pai de família: torque, baterias, maleta, garantia e para qual serviço de casa cada uma serve.",
  excerpt:
    "Três parafusadeiras 12 V lado a lado: a Bosch leva a nota geral, a Black+Decker é a de entrada e a Makita é a única com impacto.",
  seo_title: "Parafusadeira 12 V: Bosch GSR 120, Black+Decker ou Makita?",
  seo_description:
    "Bosch GSR 120-LI, Black+Decker LD12SP e Makita HP333D comparadas: torque, baterias, garantia, faixa de preço e qual compensa para cada tipo de pai.",
  product_category: "ferramentas",
  product_subcategory: "furadeiras-e-parafusadeiras",
  cover_alt:
    "Comparativo: Bosch GSR 120-LI, Black+Decker LD12SP e Makita HP333DWYE (fotos oficiais)",
  comparison,
  faq: [
    {
      question: "Parafusadeira de 12 V dá conta de furar parede?",
      answer:
        "Parede de drywall e madeira, sim, qualquer uma das três. Tijolo furado e concreto pedem impacto: das três, só a Makita HP333DWYE tem a função. Para alvenaria pesada, o certo é uma furadeira de impacto de 18 V ou com fio.",
    },
    {
      question: "Uma bateria basta ou preciso de duas?",
      answer:
        "Para montar um móvel por mês, uma basta. Para quem encara um serviço atrás do outro, a segunda bateria é o que separa terminar hoje de terminar amanhã: enquanto uma trabalha, a outra carrega. Bosch e Makita vêm com duas; a Black+Decker, com uma.",
    },
    {
      question: "O que significa torque de 20 ou 30 Nm na prática?",
      answer:
        "É a força de giro. Com 20 Nm você aperta parafusos de móvel e de drywall sem esforço; com 30 Nm você aperta parafuso de 6 mm em madeira dura e fura metal fino com mais folga. Acima disso, é trabalho para 18 V.",
    },
    {
      question: "Vale a pena pagar a diferença pela Bosch?",
      answer:
        "Se a ferramenta vai durar anos e trabalhar com frequência, vale: duas baterias, maleta, 30 Nm e assistência em todo o país. Se o uso é esporádico, a Black+Decker entrega o básico com garantia de 24 meses e sobra dinheiro para brocas e bits.",
    },
    {
      question: "Posso usar as brocas da furadeira antiga nessas parafusadeiras?",
      answer:
        "Sim, desde que o encaixe seja cilíndrico de até 10 mm, que é o mandril das três. Brocas SDS (de martelete) não encaixam.",
    },
  ],
  quiz: [
    {
      question: "Qual das três tem função impacto para alvenaria leve?",
      options: ["Bosch GSR 120-LI", "Black+Decker LD12SP", "Makita HP333DWYE", "Nenhuma"],
      correct: 2,
      explanation:
        "Só a Makita HP333DWYE tem impacto; as outras duas são furadeira e parafusadeira sem percussão.",
    },
    {
      question: "Para que serve a segunda bateria?",
      options: [
        "Dobrar o torque",
        "Continuar o serviço enquanto a outra carrega",
        "Furar concreto",
        "Aumentar a garantia",
      ],
      correct: 1,
      explanation:
        "A segunda bateria evita a parada forçada no meio do serviço; não muda torque nem garantia.",
    },
    {
      question: "Qual tem a garantia mais longa de fábrica?",
      options: ["Bosch", "Black+Decker", "Makita", "Todas iguais"],
      correct: 1,
      explanation:
        "A Black+Decker informa 24 meses; Bosch e Makita, 12 meses (a Bosch oferece extensão com registro).",
    },
  ],
  body: [
    p(
      "Todo pai chega no dia em que o móvel novo vem desmontado, a prateleira do quarto do filho precisa subir antes do fim de semana e a chave de fenda não dá mais conta. A pergunta é sempre a mesma: comprar uma parafusadeira de 12 V boa de verdade ou a mais barata da loja? E vale pagar pela marca?",
    ),
    p(
      `Comparamos as três mais procuradas pelo pai de família no Brasil: a [Bosch GSR 120-LI](/loja/${B}), a [Black+Decker LD12SP](/loja/${D}) e a [Makita HP333DWYE](/loja/${M}). Olhamos torque, baterias, acessórios, garantia e assistência, com a cabeça de quem vai usar a ferramenta no [kit básico de ferramentas da casa](/post/kit-basico-de-ferramentas-para-a-casa), não na obra. A Bosch levou a melhor no geral; a Makita é a única com impacto; a Black+Decker é a porta de entrada honesta.`,
    ),
    h2("Em 3 pontos"),
    ol([
      "A Bosch GSR 120-LI é a mais equilibrada: 30 Nm, duas baterias, maleta e assistência em todo o país. Nota 8,4.",
      "A Black+Decker LD12SP resolve o uso doméstico leve com garantia de 24 meses, mas tem uma bateria só e 20 Nm. Nota 7,4.",
      "A Makita HP333DWYE é a única com impacto para tijolo e alvenaria leve; paga-se pela função extra. Nota 8,1.",
    ]),
    fotos([
      { slug: B, name: "Bosch GSR 120-LI" },
      { slug: D, name: "Black+Decker LD12SP" },
      { slug: M, name: "Makita HP333DWYE" },
    ]),
    h2("Os 3 modelos que comparamos"),
    p(
      "As três são ferramentas a bateria de 12 V com mandril de 10 mm, duas velocidades e embreagem de torque. A diferença está no que vem na caixa, na força de giro e em uma função que só uma delas tem: o impacto. A tabela resume o que o anúncio e a ficha técnica informam.",
    ),
    table(comparison.table.columns, comparison.table.rows),
    h2("Bosch GSR 120-LI: a que resolve a casa toda"),
    btn(B, "Bosch GSR 120-LI"),
    p(
      "A GSR 120-LI é o modelo de 12 V da linha azul da Bosch, a linha profissional, e isso aparece nos detalhes: embreagem com 20 posições de torque mais a posição de furar, duas velocidades (até 400 e 1.300 rpm, segundo a ficha), luz de LED e, principalmente, duas baterias de lítio de 1,5 Ah com carregador e maleta. Para quem monta um guarda-roupa num sábado e no domingo instala a prateleira do quarto do filho, a segunda bateria é o que separa terminar o serviço de deixar pela metade.",
    ),
    p(
      "O torque de 30 Nm aperta parafuso de 6 mm em madeira dura sem forçar o punho e fura metal fino e madeira com folga. Não tem impacto, então parede de tijolo furado e concreto ficam fora: para isso, vale uma furadeira de impacto com fio, que você pode manter como segunda ferramenta. Em opiniões fora da Amazon, o padrão que se repete é o elogio à bateria e à rede de assistência da Bosch, presente em praticamente todas as capitais e em muitas cidades médias.",
    ),
    h3("Pontos fortes"),
    ul([
      "Duas baterias: uma trabalha enquanto a outra carrega",
      "30 Nm com 20 ajustes de torque",
      "Maleta rígida e carregador incluídos",
      "Assistência técnica Bosch espalhada pelo Brasil",
    ]),
    h3("Pontos de atenção"),
    ul([
      "Sem função impacto",
      "Mandril de 10 mm limita brocas maiores",
      "Pesa um pouco mais que a Black+Decker",
    ]),
    h2("Black+Decker LD12SP: a porta de entrada honesta"),
    btn(D, "Black+Decker LD12SP"),
    p(
      "A LD12SP é a parafusadeira de 12 V que aparece em toda loja de material de construção e em toda lista de presente de Dia dos Pais. É leve, tem luz de LED, embreagem com ajuste de torque e vem com uma bateria de lítio e carregador; algumas versões trazem maleta com bits. O torque de 20 Nm resolve montagem de móvel, drywall e parafuso em madeira comum sem problema.",
    ),
    p(
      "O limite aparece em dois lugares: uma bateria só, que significa parar para carregar no meio do serviço, e o torque, que faz a ferramenta sofrer em parafuso grande de madeira dura. Em compensação, a garantia de 24 meses do fabricante é a mais longa das três, e a assistência da Black+Decker (mesmo grupo da DeWalt e da Stanley) é fácil de achar. Para o pai que monta um móvel por mês e troca a fechadura uma vez por ano, ela entrega o básico sem dor.",
    ),
    h3("Pontos fortes"),
    ul([
      "Mais leve das três",
      "Luz de LED na frente",
      "Garantia de 24 meses",
      "Preço de entrada, sobra para brocas e bits",
    ]),
    h3("Pontos de atenção"),
    ul(["Uma bateria só", "20 Nm limita parafuso grande em madeira dura", "Carregador lento"]),
    h2("Makita HP333DWYE: a única com impacto"),
    btn(M, "Makita HP333DWYE"),
    p(
      "A HP333DWYE pertence à linha CXT de 12 V Max da Makita e é a única das três com função impacto: além de furar madeira e metal e parafusar, ela fura tijolo e alvenaria leve com broca de vídea. Vem com duas baterias de 1,5 Ah, carregador e maleta, embreagem com 20 posições e torque máximo de 30 Nm, igual ao da Bosch.",
    ),
    p(
      "O preço é o maior do trio e a garantia padrão é de 12 meses, o que explica a nota um pouco abaixo da Bosch nos critérios de acessórios e custo-benefício. Mas, se a sua casa tem parede de tijolo e você pendura quadro, suporte de TV e armário de cozinha com frequência, o impacto economiza a compra de uma segunda ferramenta. Fora da Amazon, os compradores repetem o elogio à robustez e à bateria; a reclamação recorrente é o preço das baterias de reposição.",
    ),
    h3("Pontos fortes"),
    ul([
      "Função impacto para alvenaria leve",
      "Duas baterias e maleta",
      "30 Nm, igual à Bosch",
      "Construção robusta da linha profissional",
    ]),
    h3("Pontos de atenção"),
    ul(["Preço mais alto do trio", "Garantia padrão de 12 meses", "Mais pesada com a bateria"]),
    h2("Por que isso importa antes de comprar"),
    p(
      "Uma parafusadeira de 12 V não é brinquedo e também não é marreta: ela existe para o serviço de casa, e a maioria dos pais compra uma só na vida. Por isso o critério que mais pesa aqui é o desempenho no uso real (torque, velocidade, embreagem), seguido da durabilidade e dos acessórios que vêm na caixa. Antes de decidir, vale ler o nosso guia do [kit básico de ferramentas para a casa](/post/kit-basico-de-ferramentas-para-a-casa), que mostra o que mais precisa estar na maleta além da parafusadeira.",
    ),
    p(
      "Ferramenta elétrica em casa com criança pequena pede regra: guardar a parafusadeira com a bateria fora, em lugar alto, e nunca deixar o filho pequeno na mesa de trabalho. Isso vale tanto quanto a escolha do modelo, e combina com o que explicamos em [como dar limites sem gritar](/post/como-dar-limites-sem-gritar-autoridade-com-calma): a regra é firme e dita uma vez. O pai que organiza o tempo para resolver as pendências da casa também encontra o jeito de fazer isso sem atropelar a [rotina da família](/post/rotina-do-pai-nos-primeiros-30-dias-do-bebe).",
    ),
    ...semaforo(
      "parafusadeira em casa com filhos",
      "a ferramenta fica guardada na maleta, com a bateria fora, em prateleira alta, e você usa óculos de proteção ao furar metal ou alvenaria.",
      "broca que trava e dá tranco no punho, bateria que esquenta demais ou mandril que solta a broca no meio do serviço pedem parar, conferir o aperto e deixar a ferramenta esfriar.",
      "furar parede sem saber por onde passa a fiação ou o encanamento, ou qualquer choque, corte profundo e pancada forte: desligue o disjuntor, pare o serviço e procure um eletricista ou um pedreiro antes de continuar; ferimento sério é caso de pronto-socorro.",
    ),
    h2("Variação de preço"),
    p(
      `A Black+Decker LD12SP costuma ficar na faixa de {FAIXA:${D}}; a Bosch GSR 120-LI, em {FAIXA:${B}}; e a Makita HP333DWYE, em {FAIXA:${M}}. O preço varia com o kit (com ou sem maleta, uma ou duas baterias), com a loja e com a época; a diferença entre a Bosch e a Makita costuma ser o preço de um bom jogo de brocas.`,
    ),
    p(
      "Observação: a faixa é o preço consultado na internet como um todo (lojas, comparadores e site do fabricante), não apenas na Amazon. O valor do dia aparece ao clicar no botão de compra.",
    ),
    btn(B, "Bosch GSR 120-LI"),
    h2("Qual comprar"),
    p(
      `Se você monta móvel, pendura quadro e troca fechadura de vez em quando, a [Black+Decker LD12SP](/loja/${D}) resolve por menos e com garantia de 24 meses. Se quer uma ferramenta para a vida toda, que encare um serviço atrás do outro sem parar para carregar, a [Bosch GSR 120-LI](/loja/${B}) é a escolha geral deste comparativo. Se a sua casa é de tijolo e você fura parede com frequência, a [Makita HP333DWYE](/loja/${M}) é a única das três que faz isso sem uma segunda ferramenta.`,
    ),
    btn(D, "Black+Decker LD12SP"),
    h2("Como avaliamos"),
    p(
      "Comparação baseada na ficha técnica e no manual de cada fabricante (Bosch, Black+Decker e Makita), no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon: Reclame Aqui, Mercado Livre, Magalu, Leroy Merlin e fóruns de marcenaria. Não fizemos teste físico. A nota de cada modelo é a média ponderada de cinco critérios com os pesos da categoria Ferramentas: desempenho (30), ergonomia e peso (15), durabilidade (20), acessórios e garantia (15) e custo-benefício (20). A nota é editorial e não é a estrela da Amazon; a faixa de preço vem de pesquisa em várias lojas, nunca de preço exato.",
    ),
    h2("Outros comparativos e reviews"),
    p(
      `Veja também os três produtos na Loja do Pai ([Bosch GSR 120-LI](/loja/${B}), [Black+Decker LD12SP](/loja/${D}) e [Makita HP333DWYE](/loja/${M})), o review do [Schulz Air Plus 12 V](/pai-indica/schulz-air-plus-12v-compressor-portatil-para-calibrar-o-pneu-na-garagem) para a garagem, o guia de [exames que todo homem deve fazer a partir dos 30](/post/exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos) e o [treino de 20 minutos em casa](/post/treino-de-20-minutos-em-casa-para-pais-sem-tempo) para quem passa o sábado na oficina.`,
    ),
  ],
};
