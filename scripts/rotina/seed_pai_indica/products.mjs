// Produtos citados pelos 6 primeiros Pai Indica. ASIN só com certeza (nenhum confirmado: Amazon bloqueou a consulta);
// affiliate_url = busca na Amazon (PENDENTE), image_url null (PENDENTE), review longa null (PENDENTE, BRIEF_REVIEW_LOJA_PAI.md).
// Faixas: plausíveis para o mercado brasileiro, price_max ≤ 3×price_min, sem price_range_checked_at (= estimativa).
const busca = (termo) =>
  `https://www.amazon.com.br/s?k=${encodeURIComponent(termo)}&tag=vocacaodepai-20`;
const prod = (o) => ({
  asin: null,
  image_url: null,
  images: [],
  review: null,
  affiliate_url: busca(o.name),
  featured: false,
  ...o,
});

export const products = [
  prod({
    slug: "bosch-gsr-120-li-12v",
    name: "Bosch GSR 120-LI",
    brand: "Bosch",
    category: "ferramentas",
    subcategory: "furadeiras-e-parafusadeiras",
    price_min: 350,
    price_max: 520,
    featured: true,
    sort_order: 1,
    short_description: "Furadeira e parafusadeira 12 V com 2 baterias, maleta e torque de 30 Nm.",
    description:
      "Parafusadeira e furadeira a bateria de 12 V da linha Bosch Professional (azul), com duas baterias de 1,5 Ah, carregador, maleta e 20 posições de torque. Resolve montagem de móveis, furos em madeira e metal e serviços da casa.",
    pros: [
      "Duas baterias: uma trabalha enquanto a outra carrega",
      "Torque máximo de 30 Nm com 20 ajustes",
      "Maleta e carregador incluídos",
      "Rede de assistência Bosch no Brasil",
    ],
    cons: [
      "Sem função impacto para alvenaria",
      "Mandril de 10 mm limita brocas maiores",
      "Peso um pouco acima dos concorrentes de 12 V",
    ],
  }),
  prod({
    slug: "black-decker-ld12sp-b2",
    name: "Black+Decker LD12SP",
    brand: "Black+Decker",
    category: "ferramentas",
    subcategory: "furadeiras-e-parafusadeiras",
    price_min: 230,
    price_max: 380,
    sort_order: 2,
    short_description: "Furadeira e parafusadeira 12 V de entrada, com 1 bateria e luz de LED.",
    description:
      "Parafusadeira e furadeira a bateria de 12 V para uso doméstico: montar móvel, furar drywall e madeira, pendurar quadro. Vem com uma bateria de lítio, carregador e, conforme a versão, maleta com bits.",
    pros: [
      "Leve e fácil de manobrar",
      "Luz de LED na frente",
      "Preço de entrada",
      "Garantia de 24 meses do fabricante",
    ],
    cons: [
      "Uma bateria só: parou para carregar, parou o serviço",
      "Torque de 20 Nm limita parafuso grande em madeira dura",
      "Carregador lento",
    ],
  }),
  prod({
    slug: "makita-hp333dwye-12v",
    name: "Makita HP333DWYE",
    brand: "Makita",
    category: "ferramentas",
    subcategory: "furadeiras-e-parafusadeiras",
    price_min: 520,
    price_max: 820,
    sort_order: 3,
    short_description: "Furadeira de impacto e parafusadeira 12 V Max CXT com 2 baterias e maleta.",
    description:
      "Furadeira de impacto e parafusadeira a bateria de 12 V Max (linha CXT) com duas baterias de 1,5 Ah, carregador e maleta. A função impacto permite furar tijolo e alvenaria leve, além de madeira e metal.",
    pros: [
      "Função impacto para alvenaria leve",
      "Duas baterias e maleta",
      "Torque máximo de 30 Nm",
      "Construção robusta da linha profissional",
    ],
    cons: [
      "Preço acima dos concorrentes de 12 V",
      "Garantia padrão de 12 meses",
      "Pesa mais com a bateria",
    ],
  }),
  prod({
    slug: "philips-oneblade-qp2724",
    name: "Philips OneBlade QP2724",
    brand: "Philips",
    category: "estilo-e-barba",
    subcategory: "barbeadores-e-aparadores",
    price_min: 130,
    price_max: 220,
    featured: true,
    sort_order: 10,
    short_description:
      "Aparador híbrido que apara, modela e faz acabamento, lavável e com 3 pentes.",
    description:
      "Modelo de entrada da linha OneBlade: lâmina híbrida que apara, modela e faz acabamento da barba sem tocar a pele, corpo lavável em água corrente e pentes de 1, 3 e 5 mm. Bateria recarregável.",
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
    ],
  }),
  prod({
    slug: "xiaomi-mi-body-composition-scale-2",
    name: "Xiaomi Mi Body Composition Scale 2",
    brand: "Xiaomi",
    category: "saude-do-homem",
    subcategory: "monitoramento",
    price_min: 110,
    price_max: 190,
    featured: true,
    sort_order: 20,
    short_description: "Balança de bioimpedância com Bluetooth e 13 medidas no aplicativo.",
    description:
      "Balança inteligente de bioimpedância: peso, percentual de gordura, massa muscular, água, gordura visceral e outras medidas no aplicativo do celular, com histórico por pessoa. Vidro temperado, pilhas AAA.",
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
    ],
  }),
  prod({
    slug: "schulz-air-plus-12v",
    name: "Schulz Air Plus 12 V",
    brand: "Schulz",
    category: "carro-e-moto",
    subcategory: "emergencia-e-manutencao",
    price_min: 150,
    price_max: 260,
    sort_order: 30,
    short_description:
      "Compressor portátil 12 V para calibrar pneu de carro, moto e bicicleta no acendedor de cigarros.",
    description:
      "Compressor de ar portátil ligado no acendedor de cigarros (12 V), com manômetro, mangueira e bicos para pneu de carro, moto, bicicleta e bola. Para calibrar e socorrer pneu murcho na garagem ou na estrada.",
    pros: [
      "Liga direto no acendedor de 12 V",
      "Manômetro para conferir a pressão",
      "Bicos para bicicleta, bola e colchão",
      "Marca com assistência no Brasil",
    ],
    cons: [
      "Ciclo de uso contínuo limitado (precisa esfriar)",
      "Manômetro analógico pede conferência com calibrador",
      "Barulhento",
    ],
  }),
  prod({
    slug: "amazfit-bip-5",
    name: "Amazfit Bip 5",
    brand: "Amazfit",
    category: "esporte-e-outdoor",
    subcategory: "relogios-e-monitores",
    price_min: 380,
    price_max: 560,
    featured: true,
    sort_order: 40,
    short_description:
      "Smartwatch com GPS, tela grande, chamadas Bluetooth e bateria de vários dias.",
    description:
      "Relógio inteligente com GPS integrado, tela de 1,91 polegadas, chamadas por Bluetooth, monitor de frequência cardíaca, oxigênio no sangue, sono e mais de 120 modos de esporte. Bateria para cerca de 10 dias de uso típico.",
    pros: [
      "GPS integrado: corre sem o celular",
      "Tela grande e legível ao sol",
      "Bateria de vários dias",
      "Chamadas pelo relógio",
    ],
    cons: ["Corpo de plástico", "Sem pagamento por aproximação no Brasil", "Tela não é AMOLED"],
  }),
  prod({
    slug: "xiaomi-smart-band-9",
    name: "Xiaomi Smart Band 9",
    brand: "Xiaomi",
    category: "esporte-e-outdoor",
    subcategory: "relogios-e-monitores",
    price_min: 230,
    price_max: 360,
    sort_order: 41,
    short_description:
      "Pulseira inteligente com tela AMOLED, 150 modos de esporte e bateria longa.",
    description:
      "Pulseira inteligente com tela AMOLED de 1,62 polegada, mais de 150 modos de esporte, monitor de frequência cardíaca, oxigênio no sangue, sono e estresse. Bateria para cerca de 3 semanas. Usa o GPS do celular.",
    pros: [
      "Leve e discreta",
      "Bateria de cerca de 3 semanas",
      "Tela AMOLED com brilho alto",
      "Ótimo custo-benefício",
    ],
    cons: [
      "Sem GPS próprio: depende do celular na corrida",
      "Tela pequena para ler notificações",
      "Sem chamadas",
    ],
  }),
  prod({
    slug: "samsung-galaxy-fit3",
    name: "Samsung Galaxy Fit3",
    brand: "Samsung",
    category: "esporte-e-outdoor",
    subcategory: "relogios-e-monitores",
    price_min: 300,
    price_max: 450,
    sort_order: 42,
    short_description:
      "Pulseira inteligente com tela AMOLED de 1,6 polegada, corpo de alumínio e bateria de até 13 dias.",
    description:
      "Pulseira inteligente com tela AMOLED de 1,6 polegada, corpo de alumínio, mais de 100 modos de esporte, monitor de frequência cardíaca, sono e oxigênio no sangue. Bateria para até 13 dias. Integração com o aplicativo Samsung Health.",
    pros: [
      "Corpo de alumínio e tela grande",
      "Boa integração com celular Samsung",
      "Bateria de até 13 dias",
      "Detecção de queda",
    ],
    cons: [
      "Sem GPS próprio",
      "Melhor experiência só com celular Samsung",
      "Aplicativo não funciona em iPhone",
    ],
  }),
  prod({
    slug: "pai-rico-pai-pobre",
    name: "Pai Rico, Pai Pobre (Robert Kiyosaki)",
    brand: "Alta Books",
    category: "livros-e-formacao",
    subcategory: "financas-pessoais",
    price_min: 40,
    price_max: 75,
    featured: true,
    sort_order: 50,
    short_description:
      "O clássico sobre a diferença entre ativo e passivo, contado a partir de dois pais.",
    description:
      "Robert Kiyosaki contrasta as lições do pai biológico (funcionário instruído) e do pai do amigo (empreendedor) para explicar ativo, passivo e por que a casa própria não é investimento. Edição em português da Alta Books.",
    pros: [
      "Explica ativo e passivo de forma simples",
      "Leitura rápida e envolvente",
      "Muda a forma de ver salário e dívida",
    ],
    cons: [
      "Simplifica demais alguns pontos",
      "Exemplos americanos",
      "Pouca orientação prática de execução",
    ],
  }),
  prod({
    slug: "o-homem-mais-rico-da-babilonia",
    name: "O Homem Mais Rico da Babilônia (George S. Clason)",
    brand: "HarperCollins Brasil",
    category: "livros-e-formacao",
    subcategory: "financas-pessoais",
    price_min: 25,
    price_max: 50,
    sort_order: 51,
    short_description:
      "Parábolas curtas sobre guardar um décimo, pagar dívidas e fazer o dinheiro trabalhar.",
    description:
      "Coletânea de parábolas ambientadas na antiga Babilônia com as regras básicas do dinheiro: pague-se primeiro, controle os gastos, faça o dinheiro render, proteja-se das perdas. Edição em português.",
    pros: ["Curto e direto", "Regras que cabem num cartão", "Barato"],
    cons: [
      "Linguagem de parábola cansa alguns leitores",
      "Nada sobre investimentos brasileiros",
      "Repetitivo em alguns capítulos",
    ],
  }),
  prod({
    slug: "os-segredos-da-mente-milionaria",
    name: "Os Segredos da Mente Milionária (T. Harv Eker)",
    brand: "Sextante",
    category: "livros-e-formacao",
    subcategory: "financas-pessoais",
    price_min: 35,
    price_max: 60,
    sort_order: 52,
    short_description:
      "Como a sua relação com o dinheiro foi formada na infância e como mudar os hábitos.",
    description:
      "T. Harv Eker trata do que ele chama de modelo de dinheiro: crenças sobre riqueza aprendidas na infância e o método dos seis potes para dividir a renda. Edição em português da Sextante.",
    pros: [
      "Método dos potes é prático",
      "Trata do comportamento, não só de planilha",
      "Leitura fácil",
    ],
    cons: [
      "Tom de autoajuda",
      "Promessas exageradas em alguns capítulos",
      "Precisa de filtro crítico",
    ],
  }),
  prod({
    slug: "me-poupe-nathalia-arcuri",
    name: "Me Poupe! (Nathalia Arcuri)",
    brand: "Sextante",
    category: "livros-e-formacao",
    subcategory: "financas-pessoais",
    price_min: 35,
    price_max: 60,
    sort_order: 53,
    short_description:
      "Dez passos para sair do vermelho e começar a investir, com exemplos do Brasil.",
    description:
      "Nathalia Arcuri organiza em dez passos o caminho do endividado ao investidor iniciante, com linguagem simples e exemplos do dia a dia brasileiro: cartão, cheque especial, reserva e primeiros investimentos.",
    pros: ["Contexto brasileiro", "Passo a passo claro", "Bom para quem nunca leu sobre dinheiro"],
    cons: ["Humor pode cansar", "Raso para quem já investe", "Parte de investimentos envelhece"],
  }),
  prod({
    slug: "do-mil-ao-milhao-thiago-nigro",
    name: "Do Mil ao Milhão (Thiago Nigro)",
    brand: "HarperCollins Brasil",
    category: "livros-e-formacao",
    subcategory: "financas-pessoais",
    price_min: 35,
    price_max: 65,
    sort_order: 54,
    short_description:
      "Gastar bem, ganhar mais e investir melhor: os três pilares do autor do Primo Rico.",
    description:
      "Thiago Nigro organiza a vida financeira em três pilares: gastar bem, ganhar mais e investir melhor, com foco em renda extra e investimentos de longo prazo no Brasil. Edição da HarperCollins Brasil.",
    pros: ["Contexto brasileiro e atual", "Capítulos sobre aumentar a renda", "Linguagem direta"],
    cons: [
      "Tom motivacional",
      "Investimentos tratados de forma geral",
      "Pouco sobre família numerosa",
    ],
  }),
];
