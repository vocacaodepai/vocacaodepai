import { btn, fotos, h2, ol, p, semaforo, table } from "../tiptap.mjs";

const S = "xiaomi-mi-body-composition-scale-2";
const review = {
  product_slug: S,
  score: 7.7,
  criteria: [
    {
      name: "Eficácia percebida",
      weight: 30,
      score: 8.0,
      comment:
        "O histórico de peso e composição no aplicativo é o que faz o pai enxergar a tendência, semana a semana.",
    },
    {
      name: "Precisão e confiabilidade",
      weight: 20,
      score: 6.5,
      comment:
        "O peso é consistente; a bioimpedância é estimativa e varia com hidratação e horário.",
    },
    {
      name: "Conforto e praticidade",
      weight: 15,
      score: 8.5,
      comment: "Sobe, pesa, sincroniza; reconhece até 16 pessoas pelo perfil.",
    },
    {
      name: "Segurança e materiais",
      weight: 15,
      score: 8.0,
      comment: "Vidro temperado, pés antiderrapantes; não indicada para quem usa marca-passo.",
    },
    {
      name: "Custo-benefício",
      weight: 20,
      score: 8.0,
      comment: "Uma das balanças com aplicativo mais baratas e com mais usuários no Brasil.",
    },
  ],
  pros: [
    "Histórico de peso e composição no aplicativo",
    "Reconhece até 16 usuários",
    "Vidro temperado e acabamento limpo",
    "Pilhas AAA duram meses",
  ],
  cons: [
    "Bioimpedância é estimativa, não exame",
    "Precisa do celular por perto para sincronizar",
    "Sem Wi-Fi",
    "Não serve para quem usa marca-passo",
  ],
  ideal_for:
    "Pai que começou a cuidar do corpo e quer ver a tendência do peso e da gordura no celular, sem planilha, pesando a família inteira na mesma balança.",
  not_ideal_for:
    "Quem precisa de medida clínica de composição corporal, quem usa marca-passo ou quem não vai usar o aplicativo.",
  verdict:
    "A Mi Body Composition Scale 2 é a balança que faz o pai olhar a tendência em vez do número do dia. O peso é confiável; a gordura e o músculo são estimativas úteis para acompanhar, não para diagnosticar. Pelo preço, é difícil fazer melhor.",
  how_we_evaluated:
    "Análise baseada na ficha técnica e no manual da Xiaomi, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, fóruns de corrida). Não fizemos teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Saúde do Homem).",
  sources: [
    "mi.com (ficha e manual)",
    "Amazon Brasil (anúncio)",
    "Reclame Aqui",
    "Mercado Livre",
    "Magalu",
  ],
  other_buyers: {
    intro: "Procuramos padrões que se repetem em avaliações fora da Amazon.",
    praises: [
      "Aplicativo com histórico claro",
      "Reconhece cada pessoa da casa",
      "Pilhas que duram",
    ],
    complaints: [
      "Percentual de gordura oscila entre pesagens",
      "Sincronização às vezes exige abrir o aplicativo",
    ],
    sources: ["Reclame Aqui", "Mercado Livre", "Magalu"],
    none_found: false,
  },
};

export default {
  slug: "xiaomi-mi-body-composition-scale-2-a-balanca-que-mostra-se-a-dieta-esta-funcionando",
  kind: "review",
  title: "Xiaomi Mi Body Composition Scale 2: a balança que mostra se a dieta está funcionando",
  subtitle:
    "Review da balança de bioimpedância mais popular do Brasil pelos olhos do pai que voltou a cuidar do corpo: o que ela mede bem, o que é só estimativa e para quem serve.",
  excerpt:
    "A balança da Xiaomi mostra peso, gordura e músculo no celular com histórico por pessoa. Nota 7,7: o peso é confiável, a composição é estimativa.",
  seo_title: "Xiaomi Mi Body Composition Scale 2: review do Pai Indica",
  seo_description:
    "Review da Xiaomi Mi Body Composition Scale 2: precisão do peso, o que a bioimpedância realmente mede, aplicativo, pilhas, faixa de preço e para quem vale.",
  product_category: "saude-do-homem",
  product_subcategory: "monitoramento",
  cover_alt: "Foto oficial da Xiaomi Mi Body Composition Scale 2",
  review,
  faq: [
    {
      question: "O percentual de gordura da balança é confiável?",
      answer:
        "É uma estimativa por bioimpedância: a balança passa uma corrente fraca pelos pés e calcula a composição a partir da resistência. Varia com hidratação, horário e pés molhados. Serve para acompanhar a tendência ao longo de semanas, não para comparar com exame clínico.",
    },
    {
      question: "Preciso do celular toda vez que subo na balança?",
      answer:
        "Não para pesar: a balança mostra o peso no visor. Para gravar a composição no histórico, o celular precisa estar por perto com Bluetooth ligado; o aplicativo sincroniza as pesagens guardadas quando abre.",
    },
    {
      question: "Serve para pesar as crianças?",
      answer:
        "Sim, para o peso. A composição corporal por bioimpedância não é indicada para crianças pequenas, e o aplicativo mostra só o peso em perfis infantis. Quem acompanha o crescimento do filho é a pediatra, com a curva de crescimento.",
    },
    {
      question: "Quem usa marca-passo pode usar?",
      answer:
        "Não. O manual da Xiaomi e os fabricantes de balanças de bioimpedância em geral contraindicam o uso por pessoas com marca-passo ou outro implante eletrônico, por causa da corrente elétrica. Nesse caso, use uma balança comum e converse com o cardiologista.",
    },
    {
      question: "Qual a diferença para a versão S400 e outras mais caras?",
      answer:
        "As versões mais novas trazem mais medidas, leitura de frequência cardíaca pelos pés e, em algumas, Wi-Fi. Para o pai que quer peso e tendência de gordura no celular, a Scale 2 entrega o essencial por menos.",
    },
  ],
  quiz: [
    {
      question: "O que a balança mede com mais confiabilidade?",
      options: ["Percentual de gordura", "Peso", "Massa óssea", "Idade corporal"],
      correct: 1,
      explanation:
        "O peso é medido por célula de carga; as demais medidas são estimativas por bioimpedância.",
    },
    {
      question: "Qual o melhor horário para pesar e comparar?",
      options: [
        "Depois do almoço",
        "Sempre no mesmo horário, de manhã, antes do café",
        "Depois do treino",
        "Tanto faz",
      ],
      correct: 1,
      explanation:
        "Hidratação e refeições mudam a leitura; pesar sempre na mesma condição é o que torna a tendência útil.",
    },
    {
      question: "Quantas pessoas a balança reconhece?",
      options: ["1", "4", "16", "Ilimitado"],
      correct: 2,
      explanation: "O aplicativo distingue até 16 perfis pelo peso e pela composição.",
    },
  ],
  body: [
    p(
      "Depois dos 30, com filho pequeno e trabalho cheio, o pai descobre que o corpo mudou sem avisar: a calça apertou, o fôlego encurtou, o check-up acusou. A reação comum é começar uma dieta e um treino e, três semanas depois, não saber se está funcionando, porque a balança do banheiro só mostra um número que sobe e desce com a água do dia.",
    ),
    p(
      `A Xiaomi Mi Body Composition Scale 2 promete resolver isso com um histórico no celular: peso, percentual de gordura, massa muscular e mais dez medidas, por pessoa. Analisamos ficha técnica, manual e o que os compradores dizem fora da Amazon. Veredito: a [balança da Xiaomi](/loja/${S}) faz o pai olhar a tendência em vez do número do dia; o peso é confiável e a composição é estimativa útil. Nota 7,7. Ela combina com o nosso [treino de 20 minutos em casa](/post/treino-de-20-minutos-em-casa-para-pais-sem-tempo) e com a lista de [exames que todo homem deve fazer a partir dos 30 anos](/post/exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos).`,
    ),
    h2("Em 3 pontos"),
    ol([
      "O peso é medido com consistência e vai para o histórico do aplicativo; é aí que você enxerga se a dieta está funcionando.",
      "Gordura, músculo, água e as outras medidas são estimativas por bioimpedância: servem para tendência, não para diagnóstico.",
      "Reconhece até 16 pessoas, funciona com pilhas AAA comuns e custa menos que a maioria das concorrentes com aplicativo.",
    ]),
    fotos([{ slug: S, name: "Xiaomi Mi Body Composition Scale 2" }]),
    h2("O que ela mede e o que é só estimativa"),
    btn(S),
    p(
      "A balança tem quatro células de carga de alta precisão para o peso, com resolução de 50 gramas na faixa mais usada segundo a ficha técnica, e quatro eletrodos de aço no vidro para a bioimpedância: uma corrente elétrica fraca passa de um pé ao outro e, pela resistência do corpo, o aplicativo estima gordura, músculo, água, massa óssea, gordura visceral, metabolismo basal, proteína e uma pontuação geral. Treze medidas, diz o anúncio.",
    ),
    p(
      "O peso, você pode confiar. As demais medidas dependem de uma fórmula e das condições do momento: pés secos ou molhados, horário, quanto você bebeu, se treinou. Por isso o percentual de gordura oscila entre uma pesagem e outra, e esse é o padrão de reclamação mais frequente fora da Amazon. A balança não está errada; ela está estimando. Use sempre nas mesmas condições (de manhã, antes do café, depois do banheiro) e olhe a média de duas semanas, nunca o dia.",
    ),
    h2("O aplicativo é o produto"),
    p(
      "A Scale 2 sem o aplicativo é uma balança de vidro bonita com visor de LED. Com o aplicativo da Xiaomi no celular, ela vira um diário de corpo: gráfico de peso por semana e por mês, as treze medidas por pesagem, metas e perfis separados para cada pessoa da casa. O reconhecimento por perfil funciona pelo peso e pela composição; se dois adultos da casa pesam parecido, o aplicativo pergunta quem é.",
    ),
    p(
      "O celular precisa estar por perto com Bluetooth ligado para a composição entrar no histórico; sem ele, a balança guarda as pesagens e sincroniza na próxima vez que o aplicativo abre. Não há Wi-Fi, e isso é o que separa a Scale 2 das versões mais caras. Para o pai que pesa de manhã com o celular no bolso do roupão, não faz diferença.",
    ),
    btn(S),
    h2("Montagem, pilhas e a família inteira"),
    p(
      "Não há montagem: tire da caixa, coloque quatro pilhas AAA (vêm na caixa), suba. O vidro temperado aguenta o uso diário e os pés de borracha seguram no piso frio do banheiro; o anúncio informa capacidade de até 150 kg. As pilhas duram meses, porque a balança desliga sozinha.",
    ),
    p(
      "O ponto que mais agrada a quem tem família: até 16 perfis, cada um com seu histórico. A esposa acompanha o peso depois do parto, o pai acompanha a dieta, e os filhos ganham perfil só de peso, porque a bioimpedância não é indicada para criança pequena. A curva de crescimento continua sendo trabalho da pediatra, não da balança.",
    ),
    h2("Ficha técnica"),
    table(
      ["Campo", "Valor informado pelo fabricante"],
      [
        ["Modelo", "Xiaomi Mi Body Composition Scale 2 (XMTZC05HM)"],
        ["Medidas", "Peso + 12 índices por bioimpedância"],
        ["Capacidade", "Até 150 kg"],
        ["Conexão", "Bluetooth 5.0 (sem Wi-Fi)"],
        ["Usuários", "Até 16 perfis no aplicativo"],
        ["Alimentação", "4 pilhas AAA"],
        ["Material", "Vidro temperado, base de plástico"],
      ],
    ),
    h2("O que dizem outros compradores"),
    p(
      "Procuramos padrões que se repetem em avaliações fora da Amazon (Reclame Aqui, Mercado Livre, Magalu e fóruns de corrida). Os elogios mais frequentes: o aplicativo com histórico claro, o reconhecimento automático de cada pessoa da casa e as pilhas que duram. As reclamações reais: o percentual de gordura que oscila entre pesagens (o que explicamos acima) e a sincronização que, às vezes, exige abrir o aplicativo manualmente. Não encontramos padrão de defeito de fábrica; os relatos de vidro trincado envolvem queda do produto no transporte.",
    ),
    ...semaforo(
      "peso e dieta do pai",
      "o peso cai devagar e constante (meio quilo a um quilo por semana), com fome normal, energia para brincar com os filhos e a esposa notando a diferença.",
      "peso que não muda em um mês apesar do esforço, percentual de gordura subindo com o peso caindo (sinal de perda de músculo) ou tontura ao levantar: revise a alimentação e o sono antes de cortar mais.",
      "queda de peso rápida sem dieta, sede e vontade de urinar fora do normal, falta de ar ou dor no peito: isso não é a balança, é o corpo avisando; marque consulta com um médico, e dor no peito é pronto-socorro.",
    ),
    btn(S),
    h2("Variação de preço"),
    p(
      `A Scale 2 costuma ficar na faixa de {FAIXA:${S}}. O preço varia com a versão (global ou chinesa, que muda o manual e a garantia), com a loja e com as promoções da própria Xiaomi; as versões mais novas, com Wi-Fi e mais medidas, custam mais.`,
    ),
    p(
      "Observação: a faixa é o preço consultado na internet como um todo (lojas, comparadores e site do fabricante), não apenas na Amazon. O valor do dia aparece ao clicar no botão de compra.",
    ),
    h2("Para quem vale a pena (e para quem não)"),
    p(
      `Vale para o pai que começou a cuidar do corpo e quer ver a tendência do peso e da gordura no celular, sem planilha, com a família inteira na mesma balança. Vale também para quem acompanha a esposa depois do parto e quer um só aparelho na casa. Veja a ficha completa e a review da loja em [Xiaomi Mi Body Composition Scale 2](/loja/${S}).`,
    ),
    p(
      "Não vale para quem precisa de medida clínica de composição corporal (isso é exame, com nutricionista ou médico), para quem usa marca-passo ou outro implante eletrônico (o manual contraindica), nem para quem não vai usar o aplicativo: aí uma balança comum resolve por menos. Cuidar do corpo é parte de ser um [marido presente](/post/como-ser-um-marido-presente-depois-que-o-bebe-chega), mas a balança é só o termômetro; o remédio é prato, sono e movimento.",
    ),
    btn(S),
    h2("Como avaliamos"),
    p(
      "Análise baseada na ficha técnica e no manual da Xiaomi, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, fóruns de corrida). Não fizemos teste físico. A nota é a média ponderada de cinco critérios com os pesos da categoria Saúde do Homem: eficácia percebida (30), precisão e confiabilidade (20), conforto e praticidade (15), segurança e materiais (15) e custo-benefício (20). A nota é editorial e não é a estrela da Amazon; a faixa de preço vem de pesquisa em várias lojas, nunca de preço exato. Nada aqui substitui consulta médica.",
    ),
    h2("Outros reviews e comparativos"),
    p(
      "Continue no Pai Indica: o comparativo [Amazfit Bip 5, Xiaomi Smart Band 9 ou Galaxy Fit3](/pai-indica/amazfit-bip-5-xiaomi-smart-band-9-ou-galaxy-fit3-qual-acompanha-o-treino-e-o-sono-do-pai) para acompanhar o treino, e o review do [Philips OneBlade QP2724](/pai-indica/philips-oneblade-qp2724-vale-a-pena). No blog, a [rotina do pai nos primeiros 30 dias do bebê](/post/rotina-do-pai-nos-primeiros-30-dias-do-bebe), quando a balança costuma ser esquecida, e a lista de [5 livros de finanças pessoais para o pai de família](/pai-indica/5-livros-de-financas-pessoais-que-todo-pai-de-familia-deveria-ler), porque corpo e orçamento se cuidam com o mesmo hábito: constância.",
    ),
  ],
};
