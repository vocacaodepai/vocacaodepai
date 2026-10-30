import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Baby,
  Beef,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Flame,
  Footprints,
  HeartPulse,
  LineChart,
  PiggyBank,
  Ruler,
  Scale,
  Shield,
  Syringe,
  TrendingUp,
  Wrench,
} from "lucide-react";
import type { ToolCategorySlug } from "./categories";

export interface ToolFaqItem {
  question: string;
  answer: string;
}
export interface ToolHowToStep {
  name: string;
  text: string;
}

export interface ToolDefinition {
  /** slug da URL: /ferramentas/<slug> */
  slug: string;
  title: string;
  /** <title> sem o sufixo " | Vocação de Pai" (≤ 60) */
  seoTitle: string;
  /** meta description (120–158) */
  description: string;
  /** 1 linha para o card */
  short: string;
  icon: LucideIcon;
  category: ToolCategorySlug;
  alsoIn?: ToolCategorySlug[];
  appCategory:
    "FinanceApplication" | "UtilitiesApplication" | "HealthApplication" | "LifestyleApplication";
  howTo: ToolHowToStep[];
  faq: ToolFaqItem[];
  relatedCategories: string[];
  relatedTerms: string[];
  disclaimer?: string;
  usesMarketData?: boolean;
  gated?: boolean;
  featured?: boolean;
  ogImage?: string;
  /** pré-carga no loader (só ferramentas de mercado) */
  preload?: () => Promise<unknown>;
  component: LazyExoticComponent<ComponentType>;
}

const L = (loader: () => Promise<{ default: ComponentType }>) => lazy(loader);

// Registro fechado (doc 06 §0.2): os 17 slugs.
export const TOOLS: ToolDefinition[] = [
  {
    slug: "conversor-de-moedas",
    title: "Conversor de moedas",
    seoTitle: "Conversor de moedas: dólar, euro e 30+ moedas em reais hoje",
    description:
      "Converta dólar, euro, libra, peso e mais de 30 moedas para o real com cotação comercial atualizada, PTAX do Banco Central e gráfico de 30 dias.",
    short: "Dólar, euro e 30+ moedas em reais, com PTAX e gráfico de 30 dias.",
    icon: ArrowLeftRight,
    category: "dinheiro",
    appCategory: "FinanceApplication",
    featured: true,
    usesMarketData: true,
    howTo: [
      {
        name: "Escolha as moedas",
        text: "Selecione a moeda de origem e a de destino. O real (BRL) vem pré-selecionado.",
      },
      {
        name: "Digite o valor",
        text: "Informe o valor a converter. O resultado aparece na hora, com a cotação comercial.",
      },
      {
        name: "Confira a PTAX",
        text: "Veja a cotação oficial do Banco Central (PTAX) do dia e a variação dos últimos 30 dias.",
      },
      {
        name: "Compartilhe",
        text: "Use o botão Compartilhar para enviar o resultado com o link da conversão.",
      },
    ],
    faq: [
      {
        question: "Qual a diferença entre cotação comercial, turismo e PTAX?",
        answer:
          "A comercial é usada entre bancos e empresas; a de turismo, cobrada em casas de câmbio e cartões, costuma ser 3% a 8% mais alta; a PTAX é a média oficial calculada pelo Banco Central e usada em contratos e na Receita Federal.",
      },
      {
        question: "De onde vêm as cotações?",
        answer:
          "Da AwesomeAPI (cotação comercial em tempo quase real) e do Banco Central do Brasil (PTAX oficial). Atualizamos o cache a cada 30 minutos.",
      },
      {
        question: "Posso usar para calcular compras no cartão internacional?",
        answer:
          "Use como referência. O banco aplica a cotação do dia do fechamento da fatura mais IOF (verifique a alíquota vigente) e spread; o valor final será maior que o da cotação comercial.",
      },
      {
        question: "Por que o valor aqui é diferente do que vi na casa de câmbio?",
        answer:
          "Casas de câmbio e bancos vendem a cotação de turismo, que embute spread, IOF e custo operacional. Nosso conversor mostra a cotação comercial e a PTAX, que são referências de mercado, não preço de balcão.",
      },
    ],
    relatedCategories: ["dinheiro-do-pai", "provedor-e-carreira"],
    relatedTerms: ["dólar", "câmbio", "viagem internacional", "investir no exterior"],
    disclaimer:
      "Cotações informativas, sem garantia de exatidão para operações financeiras. Para contratos e declarações oficiais use a PTAX publicada pelo Banco Central.",
    preload: () => import("@/lib/market/fetchers").then((m) => m.getFxLast()),
    component: L(() => import("@/components/ferramentas/conversor-de-moedas/CurrencyConverter")),
  },
  {
    slug: "mercado-financeiro",
    title: "Mercado financeiro hoje",
    seoTitle: "Mercado financeiro hoje: dólar, bitcoin, Selic e IPCA",
    description:
      "Painel do dia para o pai de família: dólar, euro, bitcoin, Ibovespa, Selic, CDI, IPCA e poupança, com o que cada número muda no orçamento da casa.",
    short: "Dólar, bitcoin, Ibovespa, Selic e IPCA com tradução para a vida real.",
    icon: LineChart,
    category: "dinheiro",
    appCategory: "FinanceApplication",
    featured: true,
    usesMarketData: true,
    howTo: [
      {
        name: "Leia os cards",
        text: "Cada card mostra o valor atual, a variação do dia e a hora da última atualização.",
      },
      {
        name: "Abra 'O que isso muda para o pai'",
        text: "Em cada card há uma explicação direta: o que o número muda no seu orçamento, nas suas dívidas e nos seus investimentos.",
      },
      {
        name: "Use os sinais",
        text: "Sinal verde, atenção e alerta resumem o cenário do dia para quem cuida das contas da casa.",
      },
    ],
    faq: [
      {
        question: "Com que frequência os dados são atualizados?",
        answer:
          "Câmbio e cripto a cada 30 minutos; ações e Ibovespa a cada 30 minutos em horário de pregão; Selic, CDI e IPCA quando o Banco Central publica (verificamos a cada 24 horas).",
      },
      {
        question: "Isso é recomendação de investimento?",
        answer:
          "Não. É um painel educativo. Decisões de investimento devem considerar seu perfil, prazos e, se possível, um profissional certificado.",
      },
      {
        question: "Por que a Selic importa para quem tem filho?",
        answer:
          "Ela baliza juros de financiamento, cartão e empréstimo (quando sobe, dívidas ficam mais caras) e o rendimento de Tesouro Selic, CDB e poupança (quando sobe, a reserva de emergência rende mais).",
      },
      {
        question: "O painel mostra o preço de ações para eu comprar?",
        answer:
          "Mostra a cotação de referência do Ibovespa e de algumas ações muito negociadas, com atraso de até 30 minutos, para você acompanhar o cenário. Para operar, use a plataforma da sua corretora, que tem o preço em tempo real.",
      },
    ],
    relatedCategories: ["dinheiro-do-pai"],
    relatedTerms: ["selic", "inflação", "investimento", "reserva de emergência", "bitcoin"],
    disclaimer:
      "Conteúdo educativo. Não constitui recomendação de investimento. Dados sujeitos a atraso e indisponibilidade das fontes.",
    preload: () => import("@/lib/market/fetchers").then((m) => m.getMarketSnapshot()),
    component: L(() => import("@/components/ferramentas/mercado-financeiro/MarketDashboard")),
  },
  {
    slug: "custo-do-filho",
    title: "Quanto custa um filho",
    seoTitle: "Quanto custa um filho por mês e até os 18 anos",
    description:
      "Calcule a faixa de gasto mensal com um filho por fase e perfil de gasto, veja o que mais pesa e o total estimado até os 18 anos, em valores de hoje.",
    short: "Faixa de gasto mensal por fase do filho e total até os 18 anos.",
    icon: Baby,
    category: "dinheiro",
    alsoIn: ["familia"],
    appCategory: "FinanceApplication",
    featured: true,
    howTo: [
      {
        name: "Escolha a fase e o perfil",
        text: "Diga a idade do filho (ou se ainda vai nascer) e o padrão de gasto da casa.",
      },
      {
        name: "Ajuste escola e saúde",
        text: "Marque escola pública ou particular e se há plano de saúde: são os dois itens que mais mudam a conta.",
      },
      {
        name: "Informe a renda (opcional)",
        text: "Com a renda líquida da casa, o Semáforo do pai diz se a faixa cabe no orçamento.",
      },
      {
        name: "Leia o total até os 18",
        text: "Veja a faixa acumulada e use o Orçamento familiar para encaixar o número.",
      },
    ],
    faq: [
      {
        question: "Por que o resultado é uma faixa e não um valor?",
        answer:
          "Porque preço de fralda, escola e plano muda por cidade, marca e época. A faixa mostra o cenário realista entre o mínimo e o máximo do perfil escolhido; o valor exato é o do seu orçamento.",
      },
      {
        question: "A conta inclui faculdade?",
        answer:
          "Não. A faixa vai até os 17 anos. Faculdade particular é uma decisão à parte; use o simulador de juros compostos para planejar a poupança desde cedo.",
      },
      {
        question: "Dois filhos custam o dobro?",
        answer:
          "Não. Roupas, brinquedos, berço e material são reaproveitados; a calculadora aplica um desconto de 15% nessas categorias a partir do segundo filho.",
      },
      {
        question: "De onde vêm os números?",
        answer:
          "De pesquisa de preço em lojas online e tabelas públicas de mensalidade, revisadas todo janeiro. A data da última revisão aparece na tela.",
      },
    ],
    relatedCategories: ["dinheiro-do-pai", "paternidade-por-fase"],
    relatedTerms: [
      "custo de um filho",
      "orçamento",
      "fralda",
      "escola particular",
      "plano de saúde",
    ],
    disclaimer:
      "Estimativa educativa com faixas de referência; não substitui o seu orçamento real nem a orientação de um planejador financeiro.",
    component: L(() => import("@/components/ferramentas/custo-do-filho/ChildCostCalculator")),
  },
  {
    slug: "licenca-paternidade",
    title: "Licença-paternidade: quantos dias e quando voltar",
    seoTitle: "Licença-paternidade: quantos dias você tem e quando volta",
    description:
      "Descubra quantos dias de licença-paternidade você tem (CLT, Empresa Cidadã, servidor), a data de retorno ao trabalho e o que levar ao RH.",
    short: "Dias de licença, data de retorno e o que pedir ao RH.",
    icon: CalendarCheck,
    category: "familia",
    appCategory: "UtilitiesApplication",
    howTo: [
      {
        name: "Escolha o seu regime",
        text: "CLT comum, Empresa Cidadã, servidor público ou autônomo. Cada um tem uma regra.",
      },
      {
        name: "Informe a data do nascimento",
        text: "Pode ser a data prevista. A contagem começa no primeiro dia útil seguinte.",
      },
      {
        name: "Veja os dias e a data de retorno",
        text: "A ferramenta pula fins de semana e feriados nacionais na data de início.",
      },
      {
        name: "Leve a lista ao RH",
        text: "Certidão de nascimento e, se for Empresa Cidadã, o pedido de prorrogação em até 2 dias úteis.",
      },
    ],
    faq: [
      {
        question: "Os 5 dias são úteis ou corridos?",
        answer:
          "Corridos, contados a partir do primeiro dia útil após o nascimento. Se o filho nasce na sexta, a licença começa na segunda e vai até sexta.",
      },
      {
        question: "Minha empresa é obrigada a dar 20 dias?",
        answer:
          "Só se ela aderiu ao Programa Empresa Cidadã e você pedir a prorrogação em até 2 dias úteis após o parto. Fora do programa, valem os dias da lei geral.",
      },
      {
        question: "Pai adotivo tem licença?",
        answer:
          "Sim, nas mesmas condições do pai biológico, contada da data da adoção ou da guarda para fins de adoção.",
      },
      {
        question: "Posso ser demitido na volta?",
        answer:
          "A lei geral de 2026 não dá estabilidade ao pai; a Lei 15.371/2026 prevê estabilidade do início da licença até 1 mês após o fim do benefício quando entrar em vigor. Converse com o sindicato e, em dúvida, procure um advogado trabalhista.",
      },
    ],
    relatedCategories: ["direitos-do-pai", "paternidade-por-fase"],
    relatedTerms: ["licença-paternidade", "empresa cidadã", "registro do filho", "primeiros dias"],
    disclaimer:
      "Informação educativa sobre a legislação vigente na data indicada; não é parecer jurídico. Convenções coletivas e estatutos locais podem dar mais dias. Em conflito com a empresa, procure o sindicato ou um advogado.",
    component: L(() => import("@/components/ferramentas/licenca-paternidade/PaternityLeave")),
  },
  {
    slug: "calculadora-de-churrasco",
    title: "Calculadora de churrasco",
    seoTitle: "Calculadora de churrasco: carne, carvão e bebida por pessoa",
    description:
      "Quantos quilos de carne, carvão, pão de alho e bebida comprar para o churrasco: informe convidados e duração e receba a lista de compras pronta.",
    short: "Carne, carvão e bebida certos para o número de convidados, com lista de compras.",
    icon: Flame,
    category: "churrasco-cozinha",
    appCategory: "LifestyleApplication",
    featured: true,
    howTo: [
      {
        name: "Conte os convidados",
        text: "Homens, mulheres e crianças de 3 a 12 anos. Diga quantos adultos bebem cerveja.",
      },
      {
        name: "Escolha duração e cortes",
        text: "Churrasco de 2, 4 ou 6 horas e o preset de cortes (clássico, econômico ou premium).",
      },
      {
        name: "Confira a lista",
        text: "As quantidades já vêm arredondadas para embalagem: quilo, saco de carvão, caixa de cerveja.",
      },
      {
        name: "Copie ou imprima",
        text: "Leve a lista ao açougue ou mande no grupo da família. Os utensílios estão na Loja do Pai.",
      },
    ],
    faq: [
      {
        question: "Quantos gramas de carne por pessoa?",
        answer:
          "Cerca de 400 a 450 g de carne crua por homem, 350 g por mulher e 200 g por criança, para um churrasco de 4 horas. Em churrasco longo, a calculadora aumenta 25%.",
      },
      {
        question: "Quanto carvão preciso?",
        answer:
          "Aproximadamente 1 kg de carvão para cada 1,5 kg de carne, com mínimo de 3 kg. Em churrasco de 6 horas ou mais, reserve metade a mais para reacender.",
      },
      {
        question: "A lista considera acompanhamentos?",
        answer:
          "Sim: pão de alho, farofa, vinagrete e arroz por pessoa, além de refrigerante, água, cerveja (só para quem bebe) e gelo.",
      },
      {
        question: "Como evitar que sobre ou falte?",
        answer:
          "Use o preset que combina com os convidados e não some 'margem' por conta: a conta já tem folga de 10%. Se sobrar, congele a carne crua que não foi para a grelha.",
      },
    ],
    relatedCategories: ["churrasco-e-cozinha"],
    relatedTerms: ["churrasco", "picanha", "carvão", "quantidade de carne por pessoa"],
    disclaimer:
      "Quantidades de referência para o pai organizar a compra; ajuste ao apetite da sua turma. Frango, linguiça e carne moída sempre bem passados.",
    component: L(
      () => import("@/components/ferramentas/calculadora-de-churrasco/BarbecueCalculator"),
    ),
  },
  {
    slug: "cortes-de-carne",
    title: "Guia de cortes de carne",
    seoTitle: "Cortes de carne bovina: guia do boi com preparo e ponto",
    description:
      "Clique no desenho do boi e veja cada corte: nome no Brasil e nos EUA, textura, melhor preparo, ponto certo, erro comum e faixa de preço de referência.",
    short: "Diagrama do boi clicável: preparo, ponto e erro comum de cada corte.",
    icon: Beef,
    category: "churrasco-cozinha",
    appCategory: "LifestyleApplication",
    featured: true,
    howTo: [
      {
        name: "Clique no corte",
        text: "Toque na região do boi (ou use Tab e Enter). O painel mostra tudo sobre o corte.",
      },
      {
        name: "Ou parta do preparo",
        text: "Na aba Carne × preparo, diga o que vai cozinhar e veja os cortes certos.",
      },
      {
        name: "Leia o erro comum",
        text: "Cada corte tem o erro que mais estraga a carne, no Semáforo do pai.",
      },
      {
        name: "Vá ao açougue com o nome certo",
        text: "Compartilhe o corte ou leve a tabela impressa.",
      },
    ],
    faq: [
      {
        question: "Qual a diferença entre maminha e fraldinha?",
        answer:
          "A maminha é a ponta da alcatra, macia e em formato de triângulo; a fraldinha é da parte baixa do boi, com fibras longas e mais sabor, que pede ponto e corte contra as fibras.",
      },
      {
        question: "Por que o nome dos cortes muda nos EUA?",
        answer:
          "Porque o boi é desossado de outro jeito lá. A picanha, por exemplo, vem dentro do top sirloin; por isso o guia mostra os dois nomes para você entender receitas e vídeos estrangeiros.",
      },
      {
        question: "Os preços são da minha cidade?",
        answer:
          "São faixas de referência pesquisadas em lojas online na data indicada, não preço de balcão. Use para comparar cortes entre si, não para discutir com o açougueiro.",
      },
      {
        question: "Que corte usar em panela de pressão?",
        answer:
          "Cortes com colágeno: músculo, acém, peito e costela. Eles ficam macios com tempo e umidade; cortes magros como patinho e lagarto ficam secos.",
      },
    ],
    relatedCategories: ["churrasco-e-cozinha"],
    relatedTerms: ["cortes de carne", "picanha", "fraldinha", "costela", "açougue"],
    disclaimer:
      "Faixas de preço são referência de pesquisa na internet, não preço da sua cidade. Carne moída, frango e miúdos sempre bem passados.",
    component: L(() => import("@/components/ferramentas/cortes-de-carne/BeefCutsGuide")),
  },
  {
    slug: "orcamento-familiar",
    title: "Orçamento familiar do pai",
    seoTitle: "Orçamento familiar: planilha simples para o pai de família",
    description:
      "Monte o orçamento da casa em minutos: rendas, gastos por grupo, regra 50-20-20-10 do pai, sobra do mês e o Semáforo que mostra onde apertar.",
    short: "Rendas, gastos por grupo, sobra do mês e onde apertar.",
    icon: PiggyBank,
    category: "dinheiro",
    appCategory: "FinanceApplication",
    featured: true,
    howTo: [
      {
        name: "Informe as rendas líquidas",
        text: "A sua e, se houver, a da esposa. Use o valor que cai na conta.",
      },
      {
        name: "Preencha os gastos por grupo",
        text: "Essenciais, Futuro, Estilo de vida e Dízimo. Vale estimar; depois ajuste com as faturas.",
      },
      {
        name: "Leia as barras e o Semáforo",
        text: "Cada grupo tem uma meta. O Semáforo diz se a casa está no verde, atenção ou alerta.",
      },
      {
        name: "Decida o corte e salve",
        text: "Corte primeiro o Estilo de vida. Exporte em CSV ou imprima; fica salvo neste navegador.",
      },
    ],
    faq: [
      {
        question: "O que é a regra 50-20-20-10 do pai?",
        answer:
          "Até 50% da renda para o essencial, pelo menos 20% para o futuro (reserva, investimento, dívida), até 20% para estilo de vida e cerca de 10% para dízimo e caridade, se for a sua convicção. É um guia, não uma lei.",
      },
      {
        question: "E se o essencial já passa de 50%?",
        answer:
          "É comum em cidade cara ou com escola particular. Nesse caso o Futuro não pode ficar em zero: reduza o Estilo de vida e defina uma reserva mínima, mesmo que pequena.",
      },
      {
        question: "Meus dados ficam salvos onde?",
        answer:
          "Só no seu navegador, neste aparelho. Nada vai para o nosso servidor. Para guardar uma cópia, exporte o CSV.",
      },
      {
        question: "Devo incluir o 13º e as férias?",
        answer:
          "Não na renda mensal. Trate-os como extras e destine-os primeiro à reserva de emergência ou à quitação de dívida cara.",
      },
    ],
    relatedCategories: ["dinheiro-do-pai", "provedor-e-carreira"],
    relatedTerms: ["orçamento familiar", "planilha", "dívidas", "reserva de emergência", "dízimo"],
    disclaimer:
      "Ferramenta educativa de organização; não é consultoria financeira. Dívida fora de controle pede ajuda de um profissional ou dos canais oficiais de renegociação.",
    component: L(() => import("@/components/ferramentas/orcamento-familiar/FamilyBudget")),
  },
  {
    slug: "juros-compostos",
    title: "Simulador de juros compostos",
    seoTitle: "Juros compostos: simule aportes mensais e veja o resultado",
    description:
      "Simule quanto o seu dinheiro rende com aportes mensais, taxa e prazo. Compare poupança, CDI e Tesouro, com valor real descontada a inflação e gráfico.",
    short: "Quanto rende guardar todo mês, com gráfico e inflação.",
    icon: TrendingUp,
    category: "dinheiro",
    appCategory: "FinanceApplication",
    usesMarketData: true,
    howTo: [
      {
        name: "Informe inicial e aporte",
        text: "Quanto você já tem e quanto consegue guardar por mês.",
      },
      {
        name: "Escolha a taxa",
        text: "Digite a taxa anual ou use os presets com as taxas de hoje (poupança, CDI, Tesouro IPCA+).",
      },
      {
        name: "Defina o prazo e a inflação",
        text: "Em anos ou meses. A inflação mostra o valor real do montante no futuro.",
      },
      {
        name: "Leia o gráfico",
        text: "A parte dos juros cresce com o tempo: é o efeito dos juros compostos.",
      },
    ],
    faq: [
      {
        question: "Juros compostos é juro sobre juro?",
        answer:
          "Sim: cada mês o rendimento entra no saldo e passa a render também. Por isso o tempo pesa mais que a taxa: começar cedo com pouco vence começar tarde com muito.",
      },
      {
        question: "A simulação considera imposto de renda?",
        answer:
          "Não. Tesouro e CDB têm IR regressivo de 22,5% a 15% sobre o rendimento; poupança é isenta. Use a taxa líquida se quiser o valor exato.",
      },
      {
        question: "O que é valor real?",
        answer:
          "É o montante futuro descontada a inflação do período, ou seja, o que aquele dinheiro vai comprar em valores de hoje.",
      },
      {
        question: "Qual taxa é realista?",
        answer:
          "Para renda fixa, algo próximo do CDI do dia. Taxas muito acima disso, 'garantidas', merecem desconfiança e verificação na CVM.",
      },
    ],
    relatedCategories: ["dinheiro-do-pai"],
    relatedTerms: ["juros compostos", "investir", "tesouro direto", "cdb", "aporte mensal"],
    disclaimer:
      "Simulação educativa com taxas hipotéticas; rentabilidade passada não garante a futura. Não é recomendação de investimento.",
    component: L(() => import("@/components/ferramentas/juros-compostos/CompoundInterest")),
  },
  {
    slug: "reserva-de-emergencia",
    title: "Reserva de emergência: quanto guardar",
    seoTitle: "Reserva de emergência: quanto guardar e em quanto tempo",
    description:
      "Calcule a reserva de emergência da família pelo gasto mensal, tipo de renda e filhos; veja quanto falta, em quantos meses chega lá e onde guardar.",
    short: "Meta da reserva da família, quanto falta e em quantos meses chega lá.",
    icon: Shield,
    category: "dinheiro",
    appCategory: "FinanceApplication",
    usesMarketData: true,
    howTo: [
      {
        name: "Informe o gasto essencial do mês",
        text: "Moradia, comida, contas, transporte, saúde e escola. Sem lazer.",
      },
      {
        name: "Diga o tipo de renda e os dependentes",
        text: "CLT, servidor ou autônomo; quantos filhos. Isso define os meses de cobertura.",
      },
      {
        name: "Informe o que já tem e o aporte",
        text: "A ferramenta mostra quanto falta e em quantos meses você chega à meta.",
      },
      {
        name: "Escolha onde guardar",
        text: "Liquidez diária e baixo risco. O bloco 'onde guardar' explica as opções.",
      },
    ],
    faq: [
      {
        question: "Quantos meses de reserva eu preciso?",
        answer:
          "CLT: 3 a 6 meses de gasto essencial. Servidor estável: 3 a 4. Autônomo ou PJ: 6 a 12. Some um mês por filho dependente. A faixa aparece no resultado.",
      },
      {
        question: "Reserva vai na poupança?",
        answer:
          "Pode começar nela, mas Tesouro Selic e CDB com liquidez diária que pagam 100% do CDI rendem mais com a mesma segurança. O que importa é poder sacar no mesmo dia.",
      },
      {
        question: "Devo investir antes de ter reserva?",
        answer:
          "Não. Sem reserva, qualquer imprevisto vira dívida cara e desfaz o investimento. Primeiro a reserva mínima, depois o resto.",
      },
      {
        question: "Tenho dívida no cartão e zero reserva. O que vem primeiro?",
        answer:
          "A dívida cara. Juro de cartão supera qualquer rendimento. Quite ou renegocie e, em paralelo, guarde um valor pequeno por mês para criar o hábito.",
      },
    ],
    relatedCategories: ["dinheiro-do-pai"],
    relatedTerms: ["reserva de emergência", "tesouro selic", "cdb", "desemprego", "dívida"],
    disclaimer:
      "Conteúdo educativo; não é recomendação de produto financeiro nem de instituição. Em caso de dívida fora de controle, procure um profissional ou os canais oficiais de renegociação.",
    component: L(() => import("@/components/ferramentas/reserva-de-emergencia/EmergencyFund")),
  },
  {
    slug: "pensao-alimenticia",
    title: "Pensão alimentícia: quanto costuma ser",
    seoTitle: "Pensão alimentícia: faixa estimada por renda e filhos",
    description:
      "Veja a faixa de pensão alimentícia que costuma ser fixada por renda, número de filhos e tipo de guarda, o que entra na base e quando procurar a Defensoria.",
    short: "Faixa estimada por renda e número de filhos, com o que entra na base.",
    icon: Scale,
    category: "dinheiro",
    alsoIn: ["familia"],
    appCategory: "UtilitiesApplication",
    howTo: [
      { name: "Informe a renda líquida", text: "O que cai na conta depois dos descontos legais." },
      {
        name: "Diga filhos e guarda",
        text: "Quantos filhos e se a guarda é compartilhada ou unilateral.",
      },
      {
        name: "Compare com o custo real do filho",
        text: "Escola, plano e outros fixos mostram a 'necessidade' do binômio.",
      },
      {
        name: "Formalize",
        text: "Acordo só vale com homologação. A Defensoria Pública atende de graça quem tem direito.",
      },
    ],
    faq: [
      {
        question: "Existe um percentual fixo em lei?",
        answer:
          "Não. A lei usa o binômio necessidade de quem recebe e possibilidade de quem paga. Os percentuais que circulam são faixas observadas nas decisões, por isso a ferramenta mostra uma estimativa, não um valor.",
      },
      {
        question: "Guarda compartilhada dispensa pensão?",
        answer:
          "Não necessariamente. Se um dos pais tem renda maior ou o filho mora mais tempo com um deles, a pensão continua. O valor pode ser menor quando as despesas são divididas diretamente.",
      },
      {
        question: "Posso pagar 'por fora', comprando as coisas?",
        answer:
          "Só o que a decisão permitir. Sem recibo e sem previsão judicial, a compra não abate a pensão e você pode ser cobrado em dobro. Pague pelo meio fixado e guarde comprovantes.",
      },
      {
        question: "O que acontece se eu atrasar?",
        answer:
          "A execução de alimentos permite protesto, penhora e até prisão civil de 1 a 3 meses pelas três últimas parcelas. Se a renda caiu, peça revisão na Justiça antes de parar de pagar.",
      },
    ],
    relatedCategories: ["direitos-do-pai", "casamento-e-familia"],
    relatedTerms: ["pensão alimentícia", "guarda compartilhada", "defensoria pública", "divórcio"],
    disclaimer:
      "Esta ferramenta é educativa e mostra faixas observadas na prática, não um cálculo legal. Cada caso é decidido pelo juiz. Procure a Defensoria Pública ou um advogado de família antes de qualquer acordo ou decisão.",
    component: L(() => import("@/components/ferramentas/pensao-alimenticia/ChildSupportEstimate")),
  },
  {
    slug: "conversor-de-unidades",
    title: "Conversor de unidades",
    seoTitle: "Conversor de unidades: polegada, libra, psi, xícara e mais",
    description:
      "Converta medidas da casa, da oficina e da cozinha: polegada e milímetro, libra e quilo, psi e bar, xícara e mililitro, km/l e mpg, cv e kW, broca e bucha.",
    short: "Polegada, libra, psi, xícara, km/l, cv: tudo em uma tela.",
    icon: Ruler,
    category: "casa-oficina",
    alsoIn: ["churrasco-cozinha"],
    appCategory: "UtilitiesApplication",
    howTo: [
      {
        name: "Escolha a categoria",
        text: "Comprimento, peso, volume, temperatura, área, velocidade, consumo, pressão, potência ou brocas.",
      },
      { name: "Selecione as unidades", text: "De e para. O botão do meio inverte." },
      {
        name: "Digite o valor",
        text: "Aceita vírgula ou ponto. O resultado aparece na hora, com tabela rápida ao lado.",
      },
    ],
    faq: [
      {
        question: "Qual broca usar para bucha 8?",
        answer:
          "Broca de 8 mm, do mesmo número da bucha. Para parede oca, use bucha específica; a tabela de brocas mostra as equivalências em polegada.",
      },
      {
        question: "Quanto é uma xícara em mililitros?",
        answer:
          "A xícara de receita brasileira tem 240 ml; a colher de sopa, 15 ml; a de chá, 5 ml. Para farinha e açúcar, o peso muda: prefira balança.",
      },
      {
        question: "Como converter km/l em litros por 100 km?",
        answer:
          "Divida 100 pelo consumo: 10 km/l equivalem a 10 l/100 km; 14 km/l, a 7,1 l/100 km. A ferramenta também converte para mpg dos EUA.",
      },
      {
        question: "Qual a pressão certa do pneu?",
        answer:
          "A que está na etiqueta da porta do motorista, em psi, com o pneu frio. A ferramenta converte para bar e kPa se o calibrador usar outra unidade.",
      },
    ],
    relatedCategories: ["caixa-de-ferramentas-e-reparos", "carro-e-moto", "churrasco-e-cozinha"],
    relatedTerms: ["polegada", "broca", "pressão do pneu", "xícara", "consumo de combustível"],
    component: L(() => import("@/components/ferramentas/conversor-de-unidades/UnitConverter")),
  },
  {
    slug: "kit-de-ferramentas",
    title: "Monte o seu kit de ferramentas",
    seoTitle: "Kit de ferramentas: o que todo pai precisa ter em casa",
    description:
      "Monte a caixa de ferramentas certa para a sua casa: diga o que vai fazer e receba a lista por prioridade, com EPI, faixa de preço e links da Loja do Pai.",
    short: "A lista de ferramentas certa para a sua casa, por prioridade.",
    icon: Wrench,
    category: "casa-oficina",
    appCategory: "UtilitiesApplication",
    howTo: [
      {
        name: "Diga onde mora",
        text: "Apartamento, casa ou sítio mudam o que faz sentido comprar.",
      },
      {
        name: "Marque o que pretende fazer",
        text: "Montar móveis, furar parede, elétrica básica, hidráulica, pintura, marcenaria, carro e bike, jardim.",
      },
      {
        name: "Escolha o nível",
        text: "Básico para resolver o dia a dia; intermediário para reformas pequenas; oficina para quem gosta.",
      },
      {
        name: "Marque o que já tem",
        text: "A lista mostra o que falta, por prioridade, e onde comprar na Loja do Pai.",
      },
    ],
    faq: [
      {
        question: "Qual a primeira ferramenta elétrica para comprar?",
        answer:
          "Uma parafusadeira/furadeira a bateria de 12 V com duas baterias. Ela monta móvel, fura drywall e tijolo furado e instala prateleira; para concreto, vem depois a furadeira de impacto.",
      },
      {
        question: "Vale comprar kit com 100 peças?",
        answer:
          "Para começar, sim: resolve 80% das tarefas por um preço baixo. Com o uso você descobre quais peças merecem versão profissional.",
      },
      {
        question: "O que não devo fazer sozinho?",
        answer:
          "Quadro de luz, padrão de entrada, chuveiro 220 V, gás e qualquer coisa em altura sem proteção. Isso é serviço de profissional registrado.",
      },
      {
        question: "Os preços são da Amazon?",
        answer:
          "A faixa mostrada é pesquisada na internet, em várias lojas, e não é o preço da Amazon. O botão leva à página do produto na Loja do Pai, com a faixa e a review.",
      },
    ],
    relatedCategories: ["caixa-de-ferramentas-e-reparos"],
    relatedTerms: [
      "kit de ferramentas",
      "parafusadeira",
      "furadeira",
      "caixa de ferramentas",
      "reparos em casa",
    ],
    disclaimer:
      "Lista educativa; use EPI e siga o manual de cada ferramenta. Serviços elétricos, de gás e em altura exigem profissional habilitado.",
    component: L(() => import("@/components/ferramentas/kit-de-ferramentas/ToolkitBuilder")),
  },
  {
    slug: "nomes-de-filhos",
    title: "Nomes de filhos com significado",
    seoTitle: "Nomes de filhos: significado, origem e nomes de santos",
    description:
      "Escolha o nome do seu filho com significado e origem, filtre por letra, nomes de santos e bíblicos, teste com o sobrenome e monte a lista com a esposa.",
    short: "Mais de 900 nomes com significado, origem e nomes de santos.",
    icon: BookOpen,
    category: "familia",
    appCategory: "LifestyleApplication",
    howTo: [
      {
        name: "Filtre",
        text: "Menino ou menina, letra inicial, origem, só santos ou só bíblicos.",
      },
      {
        name: "Teste com o sobrenome",
        text: "Digite o sobrenome da família para ver como o nome completo soa.",
      },
      {
        name: "Favorite e compartilhe",
        text: "Guarde até 10 nomes e mande a lista para a esposa decidir junto.",
      },
    ],
    faq: [
      {
        question: "Por que escolher nome de santo?",
        answer:
          "Na tradição católica, o nome dá ao filho um padroeiro e um exemplo de vida. Não é obrigação, mas é um presente que acompanha a criança para sempre.",
      },
      {
        question: "Posso registrar qualquer nome?",
        answer:
          "O cartório pode recusar nomes que exponham a criança ao ridículo. Nomes compostos e estrangeiros são aceitos; grafias muito incomuns podem gerar dúvida. Em caso de recusa, há recurso ao juiz.",
      },
      {
        question: "Os significados são confiáveis?",
        answer:
          "Vêm da etimologia tradicional de cada língua (hebraico, grego, latim, germânico, tupi). Nomes modernos sem etimologia clara trazem a origem mais aceita.",
      },
      {
        question: "E se o pai e a mãe não concordam?",
        answer:
          "Cada um monta a lista de favoritos e troca com o outro. O nome do filho é decisão do casal; a ferramenta só organiza a conversa.",
      },
    ],
    relatedCategories: ["paternidade-por-fase", "fe-e-virtude"],
    relatedTerms: ["nomes de bebê", "nome de santo", "significado do nome", "registro"],
    component: L(() => import("@/components/ferramentas/nomes-de-filhos/ChildNames")),
  },
  {
    slug: "calendario-de-vacinacao",
    title: "Calendário de vacinação do seu filho",
    seoTitle: "Calendário de vacinação infantil: próximas doses por idade",
    description:
      "Digite a data de nascimento e veja as vacinas do SUS por idade, o que já venceu, as próximas doses com lembrete na agenda e o que observar depois de vacinar.",
    short: "Próximas doses por idade, atrasadas e lembrete na agenda.",
    icon: Syringe,
    category: "familia",
    appCategory: "HealthApplication",
    howTo: [
      {
        name: "Informe a data de nascimento",
        text: "A linha do tempo mostra todas as doses do calendário do SUS por idade.",
      },
      {
        name: "Marque as doses feitas",
        text: "Confira na caderneta e marque. Fica salvo neste navegador.",
      },
      {
        name: "Agende as próximas",
        text: "Adicione as 3 próximas doses à sua agenda com lembrete 3 dias antes.",
      },
      {
        name: "Observe depois da vacina",
        text: "Febre baixa é comum; o Semáforo do pai diz quando procurar atendimento.",
      },
    ],
    faq: [
      {
        question: "O calendário é o do SUS?",
        answer:
          "Sim, o Calendário Nacional de Vacinação do Ministério da Saúde, gratuito em qualquer UBS. A data da última conferência aparece na tela; vacinas da rede privada não estão incluídas.",
      },
      {
        question: "Perdi a data de uma dose. E agora?",
        answer:
          "Vá à UBS: o esquema é retomado de onde parou, sem recomeçar. Só o rotavírus tem janela que não pode passar; o restante se recupera.",
      },
      {
        question: "Pode dar várias vacinas no mesmo dia?",
        answer:
          "Pode. O calendário é feito assim para proteger cedo. Vacinar junto não sobrecarrega o organismo da criança.",
      },
      {
        question: "E se meu filho estiver gripado?",
        answer:
          "Resfriado leve sem febre não impede a vacina. Com febre, espere melhorar. Na dúvida, a equipe da UBS decide na hora.",
      },
    ],
    relatedCategories: ["paternidade-por-fase", "corpo-e-saude-do-homem"],
    relatedTerms: ["vacina", "calendário de vacinação", "UBS", "caderneta", "recém-nascido"],
    disclaimer:
      "Informação educativa baseada no calendário público vigente na data indicada; a caderneta e a equipe de saúde prevalecem. Reação grave após vacina: procure atendimento ou ligue 192.",
    component: L(
      () => import("@/components/ferramentas/calendario-de-vacinacao/VaccinationCalendar"),
    ),
  },
  {
    slug: "marcos-do-desenvolvimento",
    title: "Marcos do desenvolvimento: o que o pai faz em cada fase",
    seoTitle: "Marcos do desenvolvimento do filho: o que esperar por idade",
    description:
      "Veja o que o seu filho costuma fazer em cada idade, do 1º mês aos 5 anos, o que o pai pode fazer para estimular e quais sinais pedem conversa com o pediatra.",
    short: "O que esperar por idade, o que o pai faz e quando falar com o pediatra.",
    icon: Footprints,
    category: "familia",
    appCategory: "HealthApplication",
    howTo: [
      {
        name: "Informe a idade do filho",
        text: "Data de nascimento ou meses. A fase atual abre em destaque.",
      },
      {
        name: "Confira os marcos",
        text: "Motor, linguagem, social e cognitivo. Marque o que você já viu ele fazer.",
      },
      {
        name: "Faça a sua parte",
        text: "Cada fase tem 3 a 4 ações simples do pai, para o dia a dia.",
      },
      {
        name: "Olhe o Semáforo",
        text: "Atenção é observar e comentar; alerta é procurar o pediatra agora.",
      },
    ],
    faq: [
      {
        question: "Meu filho não faz um marco da idade. Ele está atrasado?",
        answer:
          "Cada criança tem seu ritmo e os marcos são faixas, não datas. Um marco ausente pede observação e conversa na próxima consulta; vários ausentes ou uma habilidade perdida pedem avaliação logo.",
      },
      {
        question: "De onde vêm os marcos?",
        answer:
          "Da Caderneta da Criança do Ministério da Saúde, a mesma que o pediatra usa nas consultas, reescritos em linguagem de pai.",
      },
      {
        question: "O que o pai faz de diferente da mãe?",
        answer:
          "Brincadeira física, voz grave, desafio controlado e o exemplo de homem. Estudos mostram que o envolvimento do pai melhora linguagem e autocontrole. Não é substituir a mãe; é somar.",
      },
      {
        question: "Tela atrapalha?",
        answer:
          "Antes dos 2 anos, a recomendação é zero tela. Depois, pouco e com você junto. Nenhuma tela substitui conversa, chão e quintal.",
      },
    ],
    relatedCategories: ["paternidade-por-fase", "esporte-e-lazer-com-os-filhos"],
    relatedTerms: [
      "desenvolvimento infantil",
      "marcos",
      "primeiro ano",
      "estimular o bebê",
      "pediatra",
    ],
    disclaimer:
      "Conteúdo educativo baseado na Caderneta da Criança; não substitui a avaliação do pediatra. Habilidade perdida ou vários marcos ausentes: procure o pediatra.",
    component: L(
      () => import("@/components/ferramentas/marcos-do-desenvolvimento/DevelopmentMilestones"),
    ),
  },
  {
    slug: "imc-e-gasto-calorico",
    title: "IMC e gasto calórico do homem",
    seoTitle: "Calculadora de IMC e gasto calórico para homens",
    description:
      "Calcule o seu IMC, a taxa metabólica basal e o gasto calórico diário pelo nível de atividade, com a meta de calorias para o seu objetivo e a água por dia.",
    short: "IMC, metabolismo basal, gasto diário e meta de calorias.",
    icon: HeartPulse,
    category: "saude",
    appCategory: "HealthApplication",
    howTo: [
      {
        name: "Informe idade, altura e peso",
        text: "Peso de manhã, em jejum, dá o número mais estável.",
      },
      {
        name: "Meça a cintura (opcional)",
        text: "Na altura do umbigo, sem apertar. É o melhor indicador de risco para o homem.",
      },
      {
        name: "Escolha atividade e objetivo",
        text: "Sedentário a atleta; manter, perder ou ganhar peso.",
      },
      {
        name: "Leia o resultado e o Semáforo",
        text: "Meta de calorias, água por dia e quando procurar um médico.",
      },
    ],
    faq: [
      {
        question: "IMC serve para quem treina pesado?",
        answer:
          "Pouco: músculo pesa e o IMC não distingue gordura de massa magra. Para quem treina, a cintura e o percentual de gordura dizem mais.",
      },
      {
        question: "Quantas calorias cortar para perder peso?",
        answer:
          "Cerca de 500 por dia abaixo do gasto total dá perda de meio quilo por semana, sustentável. Cortar mais que isso sem acompanhamento costuma dar efeito rebote.",
      },
      {
        question: "O que é taxa metabólica basal?",
        answer:
          "A energia que o corpo gasta em repouso só para funcionar. Multiplicada pelo fator de atividade vira o gasto diário total.",
      },
      {
        question: "Preciso de médico para começar a treinar?",
        answer:
          "Acima de 40 anos, com sobrepeso, pressão alta ou histórico na família, sim: um check-up antes evita susto. Abaixo disso, comece leve e progrida.",
      },
    ],
    relatedCategories: ["corpo-e-saude-do-homem"],
    relatedTerms: ["IMC", "calorias", "emagrecer", "check-up", "treino"],
    disclaimer:
      "Cálculo educativo com fórmulas populacionais; não substitui avaliação médica ou nutricional. IMC alto, cintura acima de 102 cm ou sintomas: procure um médico.",
    component: L(() => import("@/components/ferramentas/imc-e-gasto-calorico/BmiAndCalories")),
  },
  {
    slug: "checklist-da-maternidade",
    title: "Mala da maternidade: checklist do pai",
    seoTitle: "Mala da maternidade: o checklist do pai para o dia do parto",
    description:
      "Documentos, a sua mala, o carro, o hospital e os primeiros 30 dias: o checklist do pai para o dia do parto, com progresso, prazos e links de cada tarefa.",
    short: "Documentos, mala, carro e as tarefas do pai do parto aos 30 dias.",
    icon: ClipboardList,
    category: "familia",
    appCategory: "LifestyleApplication",
    howTo: [
      {
        name: "Informe a data prevista",
        text: "A contagem regressiva mostra quanto falta para a 36ª semana, quando tudo deve estar pronto.",
      },
      {
        name: "Marque o que já está feito",
        text: "Fica salvo neste navegador. O progresso aparece no topo.",
      },
      {
        name: "Filtre por momento",
        text: "36 semanas, dia do parto, no hospital, 7 dias e 30 dias.",
      },
      {
        name: "Imprima e cole na geladeira",
        text: "Ou compartilhe com a esposa para ela ver que o pai está no controle.",
      },
    ],
    faq: [
      {
        question: "O que o pai leva que a mãe não leva?",
        answer:
          "Os documentos de vocês dois, o cartão do pré-natal, dinheiro trocado, carregador e a própria muda de roupa. A mala do bebê e da mãe é outra lista; esta é a sua.",
      },
      {
        question: "Posso ficar no parto?",
        answer:
          "Sim. A Lei 11.108/2005 garante um acompanhante de livre escolha da gestante no parto, inclusive em cesárea, no SUS e na rede privada. Confirme com a maternidade como funciona lá.",
      },
      {
        question: "Quanto tempo tenho para registrar?",
        answer:
          "15 dias após o nascimento, no cartório, de graça; até 3 meses se você morar a mais de 30 km do cartório. Leve a DNV do hospital e os documentos.",
      },
      {
        question: "Quando incluir o bebê no plano de saúde?",
        answer:
          "Em até 30 dias do nascimento, para entrar sem carência como dependente. Passou o prazo, as regras de carência valem.",
      },
    ],
    relatedCategories: ["paternidade-por-fase", "direitos-do-pai"],
    relatedTerms: [
      "mala da maternidade",
      "dia do parto",
      "registro do bebê",
      "acompanhante",
      "licença-paternidade",
    ],
    disclaimer:
      "Lista educativa de organização; prazos legais citados valem na data da última revisão. Sintomas de urgência na gestante: maternidade ou 192.",
    component: L(
      () => import("@/components/ferramentas/checklist-da-maternidade/HospitalBagChecklist"),
    ),
  },
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const toolsByCategory = (cat: ToolCategorySlug) =>
  TOOLS.filter((t) => t.category === cat || t.alsoIn?.includes(cat));
export const featuredTools = () => TOOLS.filter((t) => t.featured);
export const toolPath = (slug: string) => `/ferramentas/${slug}`;
