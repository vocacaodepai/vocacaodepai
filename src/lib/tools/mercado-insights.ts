// "O que isso muda para o pai" (doc 06 §3.2): 2–3 frases por indicador, sem recomendação de compra ou venda.
export const INSIGHTS = {
  dolar:
    "O dólar mexe no preço do combustível, do trigo, da eletrônica e das viagens. Quando sobe, o supermercado sente em algumas semanas; quando cai, compra parcelada em dólar e viagem ficam mais leves. Não é sinal para comprar nem vender nada: é para planejar.",
  cambio:
    "Moeda estrangeira importa para quem viaja, recebe de fora ou compra importado. Compare com a média dos últimos 30 dias antes de decidir qualquer compra grande; o dia certo ninguém acerta.",
  bitcoin:
    "O bitcoin é o número que mais oscila do painel. Serve para acompanhar o humor do mercado, não para guiar o dinheiro da família. Reserva de emergência nunca fica em cripto.",
  ibovespa:
    "O Ibovespa resume as maiores empresas da bolsa. Dia bom ou ruim diz pouco; o que importa para a família é o longo prazo e só com dinheiro que não vai fazer falta.",
  acoes:
    "Cotação de referência com atraso de até 30 minutos, para entender o cenário. Para operar, use a sua corretora; para a família, pense em décadas, não em dias.",
  selic:
    "A Selic puxa todas as outras taxas. Alta, encarece cartão, cheque especial e financiamento, mas faz Tesouro Selic, CDB e poupança renderem mais: hora de quitar dívida cara e deixar a reserva render.",
  cdi: "O CDI é a referência da renda fixa: CDB, fundo DI e Tesouro Selic rendem perto dele. Promessa muito acima do CDI com 'rendimento garantido' pede desconfiança e verificação na CVM.",
  ipca: "O IPCA do mês mostra quanto o custo de vida subiu. Compare com o seu orçamento: se o mercado subiu mais que a sua renda, é hora de rever o estilo de vida antes que vire dívida.",
  ipca12:
    "Se o seu salário não subiu pelo menos o IPCA de 12 meses, você ficou mais pobre ganhando o mesmo. Use o número na conversa de reajuste e na revisão anual do orçamento.",
  poupanca:
    "A poupança rende pela regra da Selic: 0,5% ao mês mais TR quando a Selic passa de 8,5% ao ano, ou 70% da Selic abaixo disso. Serve para começar a reserva; depois compare com Tesouro Selic e CDB.",
} as const;

export type InsightKey = keyof typeof INSIGHTS;
