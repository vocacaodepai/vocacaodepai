import { btn, fotos, h2, ol, p, semaforo, table } from "../tiptap.mjs";

const S = "schulz-air-plus-12v";
const review = {
  product_slug: S,
  score: 7.6,
  criteria: [
    {
      name: "Funcionalidade",
      weight: 30,
      score: 8.0,
      comment:
        "Calibra pneu de carro, moto e bicicleta e enche bola e colchão; resolve o pneu murcho na garagem e no acostamento.",
    },
    {
      name: "Instalação e praticidade",
      weight: 15,
      score: 8.0,
      comment:
        "Liga no acendedor de 12 V; cabo e mangueira alcançam as quatro rodas de um carro comum.",
    },
    {
      name: "Qualidade de construção",
      weight: 20,
      score: 7.0,
      comment: "Corpo de plástico resistente, mas o manômetro analógico pede conferência.",
    },
    {
      name: "Segurança e certificação",
      weight: 15,
      score: 7.5,
      comment:
        "Fusível no plugue e marca com assistência; o ciclo de uso contínuo é limitado e precisa ser respeitado.",
    },
    {
      name: "Custo-benefício",
      weight: 20,
      score: 7.5,
      comment: "Mais caro que os genéricos, mas com marca, peças e assistência no Brasil.",
    },
  ],
  pros: [
    "Liga direto no acendedor de 12 V",
    "Manômetro para conferir a pressão",
    "Bicos para bicicleta, bola e colchão",
    "Marca com assistência técnica no Brasil",
  ],
  cons: [
    "Ciclo de uso contínuo limitado: precisa esfriar",
    "Manômetro analógico pede conferência com calibrador",
    "Barulhento",
    "Não enche pneu de caminhonete grande com rapidez",
  ],
  ideal_for:
    "Pai que quer calibrar os pneus do carro na garagem toda quinzena e ter socorro para pneu murcho na estrada, sem depender do posto.",
  not_ideal_for:
    "Quem tem caminhonete com pneu grande ou precisa de compressor para pintura e ferramenta pneumática.",
  verdict:
    "O Schulz Air Plus 12 V faz o que promete: calibra os pneus do carro da família na garagem e salva o dia no acostamento. É mais caro que os genéricos, mas tem marca, peças e assistência. Respeite o tempo de descanso do motor e confira o manômetro de vez em quando.",
  how_we_evaluated:
    "Análise baseada na ficha técnica e no manual da Schulz, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, fóruns de automóveis). Não fizemos teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Carro e Moto).",
  sources: [
    "schulz.com.br (ficha e manual)",
    "Amazon Brasil (anúncio)",
    "Reclame Aqui",
    "Mercado Livre",
    "Magalu",
  ],
  other_buyers: {
    intro: "Procuramos padrões que se repetem em avaliações fora da Amazon.",
    praises: [
      "Resolve o pneu murcho sem ir ao posto",
      "Cabo longo alcança as quatro rodas",
      "Marca conhecida",
    ],
    complaints: ["Barulho alto", "Manômetro impreciso em alguns exemplares"],
    sources: ["Reclame Aqui", "Mercado Livre", "Magalu"],
    none_found: false,
  },
};

export default {
  slug: "schulz-air-plus-12v-compressor-portatil-para-calibrar-o-pneu-na-garagem",
  kind: "review",
  title: "Schulz Air Plus 12 V: o compressor portátil para calibrar o pneu na garagem",
  subtitle:
    "Review do compressor de ar que liga no acendedor do carro: o que ele enche, quanto demora, o que o manual manda respeitar e para qual pai ele vale a pena.",
  excerpt:
    "O Schulz Air Plus 12 V calibra pneu de carro, moto e bicicleta na garagem e socorre no acostamento. Nota 7,6: funciona, com limite de uso contínuo.",
  seo_title: "Schulz Air Plus 12 V vale a pena? Review do compressor",
  seo_description:
    "Review do compressor portátil Schulz Air Plus 12 V: o que enche, tempo de uso contínuo, manômetro, segurança, faixa de preço e para quem vale a pena.",
  product_category: "carro-e-moto",
  product_subcategory: "emergencia-e-manutencao",
  cover_alt: "Foto oficial do compressor portátil Schulz Air Plus 12 V",
  review,
  faq: [
    {
      question: "Ele enche um pneu totalmente vazio?",
      answer:
        "Enche, mas devagar e em etapas: o manual limita o uso contínuo a alguns minutos antes de uma pausa para esfriar. Para pneu de carro de passeio, é questão de paciência; para pneu de caminhonete grande, pode levar várias pausas. Para calibrar (completar a pressão), é rápido.",
    },
    {
      question: "O manômetro é confiável?",
      answer:
        "É um manômetro analógico de uso doméstico. Serve para referência; confira a pressão de vez em quando num calibrador de posto ou num calibrador digital de bolso, que custa pouco. A pressão certa do seu carro está na etiqueta da porta do motorista.",
    },
    {
      question: "Posso ligar com o carro desligado?",
      answer:
        "O manual recomenda ligar com o motor em funcionamento, para o compressor puxar a corrente do alternador e não da bateria. Com o carro desligado por muito tempo, a bateria pode não dar partida depois.",
    },
    {
      question: "Serve para moto e bicicleta?",
      answer:
        "Sim. Vem com bicos adaptadores para bicicleta (válvula fina), bola e colchão inflável, além do bico de pneu de carro e moto. Guarde os bicos na própria bolsa do compressor para não perder.",
    },
    {
      question: "Vale mais que um compressor genérico de loja de autopeças?",
      answer:
        "Custa mais, e o que se paga é marca, peças de reposição e assistência técnica no Brasil. Se o compressor vai viver no porta-malas por anos, isso faz diferença; se é para uso raro, um genérico pode resolver.",
    },
  ],
  quiz: [
    {
      question: "Onde o Schulz Air Plus 12 V é ligado?",
      options: [
        "Na tomada de casa",
        "No acendedor de cigarros do carro",
        "Na bateria por garras",
        "Em pilhas",
      ],
      correct: 1,
      explanation:
        "O modelo usa o plugue de 12 V do acendedor de cigarros, com fusível no próprio plugue.",
    },
    {
      question: "Por que o manual limita o tempo de uso contínuo?",
      options: [
        "Para economizar bateria do carro",
        "Porque o motor esquenta e precisa esfriar",
        "Porque o manômetro descalibra",
        "Não há limite",
      ],
      correct: 1,
      explanation: "O motor sem óleo esquenta rápido; o descanso evita queimar o compressor.",
    },
    {
      question: "Onde está a pressão certa dos pneus do seu carro?",
      options: [
        "No próprio pneu",
        "Na etiqueta da porta do motorista ou no manual do carro",
        "No manômetro do compressor",
        "No site da Schulz",
      ],
      correct: 1,
      explanation:
        "A pressão recomendada é do fabricante do carro, na etiqueta da porta ou no manual.",
    },
  ],
  body: [
    p(
      "Pneu murcho na manhã de segunda-feira, com a mulher e as crianças já no carro e o posto mais perto a dez minutos. Ou aquele pneu que perde um pouco de ar toda semana e que você completa só quando lembra. Um compressor portátil no porta-malas resolve os dois casos, e o Schulz Air Plus 12 V é o modelo de marca mais citado para isso no Brasil.",
    ),
    p(
      `Analisamos a ficha técnica e o manual da Schulz, o anúncio da Amazon Brasil e o que os compradores dizem fora da Amazon. Veredito: o [Schulz Air Plus 12 V](/loja/${S}) faz o que promete, calibra os pneus do carro da família na garagem e salva o dia no acostamento; é mais caro que os genéricos, mas tem marca, peças e assistência. Nota 7,6. Ele entra no mesmo cantinho da garagem do [kit básico de ferramentas da casa](/post/kit-basico-de-ferramentas-para-a-casa).`,
    ),
    h2("Em 3 pontos"),
    ol([
      "Liga no acendedor de 12 V, tem manômetro e bicos para pneu de carro, moto, bicicleta, bola e colchão.",
      "Calibrar é rápido; encher pneu vazio é em etapas, porque o manual limita o uso contínuo antes de uma pausa para esfriar.",
      "Marca com assistência técnica e peças no Brasil, o que os genéricos não têm; o preço reflete isso.",
    ]),
    fotos([{ slug: S, name: "Schulz Air Plus 12 V" }]),
    h2("O que ele enche e quanto demora"),
    btn(S),
    p(
      "O Air Plus é um compressor de pistão sem óleo, alimentado pelo acendedor de cigarros do carro, com manômetro na frente, mangueira curta com bico de rosca para a válvula do pneu e um jogo de adaptadores para bicicleta, bola e colchão. O cabo de alimentação, segundo a ficha, alcança as quatro rodas de um carro de passeio comum sem desconectar; em SUV grande, a roda traseira oposta pode ficar no limite.",
    ),
    p(
      "Completar a pressão de um pneu que perdeu dois ou três PSI leva pouco mais de um minuto por roda. Encher um pneu totalmente vazio é outra conversa: o manual limita o uso contínuo a alguns minutos antes de uma pausa obrigatória para o motor esfriar, e um pneu de carro de passeio pode pedir duas ou três etapas. Para caminhonete com pneu grande, o processo fica longo, e aí vale um compressor maior. Para o uso que o pai de família tem na garagem, o tempo é aceitável.",
    ),
    h2("O manômetro e a pressão certa"),
    p(
      "O manômetro é analógico, com escala em PSI e bar, e serve bem como referência. Em opiniões fora da Amazon aparece a queixa de leitura imprecisa em alguns exemplares; a solução barata é conferir de vez em quando num calibrador de posto ou num calibrador digital de bolso. A pressão certa dos pneus do seu carro está na etiqueta da porta do motorista ou no manual do veículo, não no compressor nem no pneu.",
    ),
    p(
      "Uma rotina que funciona: calibrar a cada quinze dias, com o pneu frio, antes de sair de casa, incluindo o estepe (que todo mundo esquece e que costuma estar murcho na hora da necessidade). Pneu na pressão certa gasta menos combustível, dura mais e freia melhor com as crianças no banco de trás.",
    ),
    btn(S),
    h2("Segurança: o que o manual manda respeitar"),
    p(
      "Três regras saem do manual e das reclamações de quem não as leu. Primeira: ligue o compressor com o motor do carro em funcionamento, para puxar a corrente do alternador e não descarregar a bateria. Segunda: respeite o tempo máximo de uso contínuo e a pausa para esfriar; o motor sem óleo esquenta rápido e é assim que a maioria dos compressores portáteis queima. Terceira: não ultrapasse a pressão recomendada do pneu, porque pneu com excesso de ar estoura mais fácil em buraco e lombada.",
    ),
    p(
      "O plugue de 12 V tem fusível, e a Schulz tem rede de assistência no país, o que os compressores genéricos de loja de autopeças não oferecem. O aparelho é barulhento (é um compressor de pistão), então calibre na garagem, não na madrugada com o bebê dormindo no quarto da frente.",
    ),
    h2("Ficha técnica"),
    table(
      ["Campo", "Valor informado pelo fabricante"],
      [
        ["Modelo", "Schulz Air Plus 12 V"],
        ["Alimentação", "12 V, pelo acendedor de cigarros do veículo"],
        ["Tipo", "Compressor de pistão sem óleo"],
        ["Manômetro", "Analógico, PSI e bar"],
        ["Acessórios", "Bicos para bicicleta, bola e colchão; bolsa"],
        ["Uso contínuo", "Limitado; pausa para resfriamento (ver manual)"],
        ["Garantia", "Conforme o fabricante (consulte o anúncio)"],
      ],
    ),
    h2("O que dizem outros compradores"),
    p(
      "Procuramos padrões que se repetem em avaliações fora da Amazon (Reclame Aqui, Mercado Livre, Magalu e fóruns de automóveis). Os elogios mais frequentes: resolver o pneu murcho sem ir ao posto, o cabo que alcança as quatro rodas e a confiança na marca. As reclamações reais: o barulho alto e o manômetro impreciso em alguns exemplares. Nas reclamações de compressor que parou de funcionar, o padrão que aparece é o uso contínuo além do tempo do manual, enchendo pneu vazio de uma vez só.",
    ),
    ...semaforo(
      "pneu e compressor no carro da família",
      "pneus calibrados a cada quinze dias com o pneu frio, estepe incluído, pressão conferida na etiqueta da porta e compressor guardado na bolsa com os bicos.",
      "pneu que perde ar toda semana (provável furo ou válvula), compressor que esquenta demais ou manômetro que marca diferente do posto: conserte o pneu na borracharia e confira o aparelho antes de confiar nele na estrada.",
      "pneu com bolha, corte na lateral ou que murcha em minutos, ou estouro em movimento: não encha, não dirija; troque pelo estepe em local seguro ou chame o guincho, procure um borracheiro ou um mecânico de confiança e, se houve acidente com alguém ferido, o pronto-socorro vem antes do carro.",
    ),
    btn(S),
    h2("Variação de preço"),
    p(
      `O Schulz Air Plus 12 V costuma ficar na faixa de {FAIXA:${S}}. O preço varia com a versão (com ou sem lanterna e bolsa), com a loja e com as promoções de autopeças; os genéricos custam menos e os compressores digitais com desligamento automático, mais.`,
    ),
    p(
      "Observação: a faixa é o preço consultado na internet como um todo (lojas, comparadores e site do fabricante), não apenas na Amazon. O valor do dia aparece ao clicar no botão de compra.",
    ),
    h2("Para quem vale a pena (e para quem não)"),
    p(
      `Vale para o pai que quer calibrar os pneus do carro na garagem toda quinzena e ter socorro para pneu murcho na estrada, sem depender do posto, e que prefere pagar um pouco mais por marca e assistência. Veja a ficha completa e a review da loja em [Schulz Air Plus 12 V](/loja/${S}).`,
    ),
    p(
      "Não vale para quem tem caminhonete com pneu grande (o tempo de enchimento fica longo), para quem precisa de compressor para pintura ou ferramenta pneumática (isso é compressor de tanque, outra categoria) nem para quem não vai respeitar o tempo de descanso do manual. Para o kit de emergência completo do porta-malas, ele entra junto com triângulo, chave de roda e lanterna, e com a disciplina de quem monta o [orçamento familiar](/post/orcamento-familiar-para-quem-vai-ser-pai) sem deixar a manutenção do carro para depois.",
    ),
    btn(S),
    h2("Como avaliamos"),
    p(
      "Análise baseada na ficha técnica e no manual da Schulz, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, fóruns de automóveis). Não fizemos teste físico. A nota é a média ponderada de cinco critérios com os pesos da categoria Carro e Moto: funcionalidade (30), instalação e praticidade (15), qualidade de construção (20), segurança e certificação (15) e custo-benefício (20). A nota é editorial e não é a estrela da Amazon; a faixa de preço vem de pesquisa em várias lojas, nunca de preço exato.",
    ),
    h2("Outros reviews e comparativos"),
    p(
      "Continue no Pai Indica: o comparativo de [parafusadeiras de 12 V](/pai-indica/bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v) para a garagem e a lista de [5 livros de finanças pessoais para o pai de família](/pai-indica/5-livros-de-financas-pessoais-que-todo-pai-de-familia-deveria-ler). No blog, [como dar limites sem gritar](/post/como-dar-limites-sem-gritar-autoridade-com-calma) os [exames que todo homem deve fazer a partir dos 30 anos](/post/exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos) e o [treino de 20 minutos em casa para pais sem tempo](/post/treino-de-20-minutos-em-casa-para-pais-sem-tempo), para a hora em que a garagem vira academia.",
    ),
  ],
};
