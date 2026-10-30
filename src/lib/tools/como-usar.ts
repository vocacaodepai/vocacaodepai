// Texto longo "Como usar" de cada ferramenta (doc 11 §12: ≥ 300 palavras). Parágrafos separados por linha em
// branco; linha iniciada por "## " vira <h3>. Fica fora do registry para não inchar o bundle do índice.
export const COMO_USAR: Record<string, string> = {
  "conversor-de-moedas": `O conversor de moedas do Vocação de Pai foi feito para a conta que o pai de família faz de verdade: quanto vai custar aquele produto importado, quanto vale o que um parente mandou do exterior, quanto dinheiro levar numa viagem ou quanto rende um investimento feito em dólar. Você digita o valor, escolhe a moeda de origem e a de destino e o resultado aparece na hora, com a cotação comercial do momento e, quando existir, a PTAX oficial do Banco Central.

## O que cada número quer dizer

A cotação comercial é a referência usada entre bancos, empresas e investidores. É a que aparece no noticiário e a que usamos para converter. A PTAX é a média oficial calculada pelo Banco Central ao fim de cada dia útil; ela serve para contratos, declaração de imposto de renda e para conferir se a cotação que alguém lhe passou está razoável. A cotação de turismo, que você paga na casa de câmbio ou no cartão internacional, não aparece aqui porque varia de loja para loja e costuma ficar entre três e oito por cento acima da comercial, fora o IOF.

## Como fazer a conta do cartão internacional

Converta o valor da compra para reais com a cotação comercial e some uma margem de segurança de cerca de dez por cento. Essa margem cobre o spread do banco e o IOF da operação. Se o resultado ainda couber no seu orçamento do mês, a compra é viável; se só couber com a margem zerada, espere. O pai que provê não compra no limite.

## Como usar o gráfico de 30 dias

O gráfico mostra o caminho da moeda no último mês. Uma linha subindo forte indica que o real perdeu valor; uma linha descendo indica que o real ganhou. Não use isso para tentar adivinhar o dia certo de comprar, porque ninguém acerta isso com consistência. Use para entender se o valor de hoje está acima ou abaixo da média recente e para decidir, com calma, se a compra pode esperar.

## Compartilhar e salvar

O botão Compartilhar envia o resultado com o link exato da conversão, útil para combinar com a esposa ou com um amigo quanto vai custar uma viagem ou um presente. Se você tiver conta na Área do Pai, pode salvar a ferramenta para abrir direto do seu painel. As cotações vêm da AwesomeAPI e do Banco Central e são atualizadas a cada trinta minutos; se alguma fonte falhar, mostramos o último valor com a hora em que ele foi obtido, para você nunca ficar sem referência.`,

  "mercado-financeiro": `O Mercado do pai é um painel de um minuto. Ele não existe para você virar investidor profissional; existe para que o homem que sustenta uma casa entenda, todo dia, o que está acontecendo com o dinheiro dele. Cada card mostra o número do momento, a variação do dia e a hora em que o dado foi obtido. Abaixo de cada número há a frase que importa: o que aquilo muda no seu orçamento, nas suas dívidas e na sua reserva.

## Leia o Semáforo do dia primeiro

Os três sinais resumem o cenário. Sinal verde quer dizer que câmbio e inflação estão dentro da normalidade e nada pede ação. Sinal de atenção aparece quando o dólar se mexe mais de um por cento, quando a Selic está alta a ponto de encarecer qualquer dívida ou quando a inflação de doze meses passa do centro da meta. Sinal de alerta é para dia de solavanco forte: não é hora de decidir nada por impulso. Em qualquer dos três casos, decisão grande de dinheiro se toma com calma, em casa, junto com a esposa, e, quando envolve dívida ou investimento relevante, com um profissional certificado.

## O que cada grupo significa na prática

Câmbio: o dólar mexe no preço do combustível, do trigo, da eletrônica e das viagens. Quando sobe, o supermercado sente em algumas semanas. Juros: a Selic é a taxa que puxa todas as outras. Selic alta deixa cartão, cheque especial e financiamento mais caros, mas faz Tesouro Selic, CDB e poupança renderem mais; é o momento de quitar dívida cara e deixar a reserva render. Inflação: o IPCA diz quanto o dinheiro perdeu de valor; se o seu salário não subiu pelo menos o IPCA de doze meses, você ficou mais pobre, mesmo ganhando o mesmo. Bolsa e cripto: são os números que mais oscilam e os que menos devem guiar uma família; acompanhe para entender o humor do mercado, não para apostar.

## Como usar o gráfico

As abas mostram o dólar, o euro e o bitcoin nos últimos trinta dias. Olhe a tendência, não o dia. Uma moeda que subiu dez por cento no mês pede cautela com compra parcelada em dólar; uma que caiu pode ser hora de fechar a viagem que já estava planejada.

## Atualização e fontes

Câmbio e cripto atualizam a cada meia hora; bolsa só em dia de pregão; Selic, CDI e IPCA quando o Banco Central e o IBGE publicam. Se uma fonte falhar, o card mostra o último dado com a hora dele e um aviso de atenção. Nada aqui é recomendação de compra ou venda; é informação para o pai decidir com a cabeça fria.`,

  "custo-do-filho": `Pergunta que todo homem faz antes do primeiro filho e que poucos respondem com número: quanto custa, por mês, criar uma criança? Esta calculadora não dá um valor único, porque ele não existe. Dá uma faixa honesta, montada por fase da vida do filho e pelo padrão de gasto da sua casa, para você sair do achismo e entrar no planejamento.

## Como preencher

Comece pela fase: recém-nascido, primeira infância, pré-escola, ensino fundamental ou adolescência. Depois escolha o perfil de gasto. Enxuto é a casa que usa o SUS, escola pública, fralda de marca simples e roupa herdada. Médio é a casa com plano de saúde básico, escola particular de bairro e algum lazer pago. Amplo é a casa com escola de maior mensalidade, plano completo, cursos e viagens. Os dois ajustes que mais mexem na conta são escola e saúde; por isso eles ficam em botões separados. Se quiser, informe a renda líquida da família: com ela o Semáforo do pai diz se a faixa cabe no orçamento ou se é hora de rever despesas antes de o bebê chegar.

## Como ler o resultado

O cartão principal mostra a faixa mensal, de mínimo a máximo. Abaixo, as barras mostram em que categoria o dinheiro vai: no primeiro ano, fralda e fórmula; dos quatro aos onze, escola e material; na adolescência, alimentação, transporte e tecnologia. O total até os dezoito anos é calculado em valores de hoje, sem inflação, para você comparar com salário e patrimônio de hoje. Um segundo filho custa menos que o dobro: berço, roupa e brinquedo são reaproveitados, e a calculadora aplica esse desconto sozinha.

## O que fazer com o número

Se a faixa máxima consome até um quarto da renda, você está bem. Entre um quarto e quarenta por cento, é sinal de atenção: cabe, mas não sobra para reserva, e um imprevisto vira dívida. Acima disso, a conta não fecha e o caminho é cortar despesa, aumentar renda ou mudar de perfil, de preferência antes do nascimento. Leve a faixa para o Orçamento familiar e abra uma linha para o filho desde já. Pai que provê não é o que ganha mais; é o que sabe quanto precisa e se organiza para chegar lá.

Os valores vêm de pesquisa de preço em lojas online e tabelas públicas de mensalidade, revisadas no começo de cada ano. A data da última revisão aparece ao lado do resultado. Isso é estimativa educativa, não substitui o seu orçamento real.`,

  "licenca-paternidade": `Poucos dias depois do nascimento, o pai precisa estar em casa: para cuidar da esposa, registrar o filho, resolver plano de saúde e, principalmente, estar presente. Esta ferramenta responde às três perguntas práticas desse momento: quantos dias de licença você tem, em que dia volta ao trabalho e o que precisa entregar ao RH para não perder nenhum direito.

## Escolha o regime certo

A regra muda conforme o vínculo. Na CLT comum valem os dias da lei geral, contados de forma corrida a partir do primeiro dia útil depois do nascimento. Se a sua empresa aderiu ao Programa Empresa Cidadã, você pode somar quinze dias, mas precisa pedir por escrito em até dois dias úteis após o parto, e a empresa só concede se já estiver no programa. Servidor público federal tem prazo próprio com prorrogação a pedido; servidores estaduais e municipais seguem o estatuto do ente, que varia bastante, por isso a ferramenta pede que você informe os dias do seu caso. Autônomo, MEI e PJ não têm licença remunerada: a pausa sai da reserva de emergência, e vale planejar com meses de antecedência.

## O que a data de retorno considera

Informe a data real ou prevista do nascimento. A contagem começa no primeiro dia útil seguinte, pulando fins de semana e feriados nacionais; se o seu município tiver feriado próprio, some um dia por conta. A tela mostra o primeiro e o último dia de licença e a data de volta. Pai adotivo usa as mesmas regras, contadas da data da guarda ou da adoção.

## Marcos legais que mudam a conta

A legislação da licença-paternidade está em transição, com prazos maiores entrando em vigor em datas definidas. A ferramenta mostra o marco que vale na data do nascimento informada, para você saber exatamente quantos dias terá. Sempre confirme com o RH, porque convenção coletiva pode dar mais dias do que a lei.

## Use bem os dias que tem

Registre o filho no cartório ainda na primeira semana, inclua o bebê no plano de saúde dentro do prazo de carência zero, confira as vacinas de nascimento e deixe a esposa descansar: esses dias existem para isso. Se a empresa negar os dias previstos em lei, não discuta sozinho: procure o sindicato, a Superintendência Regional do Trabalho ou um advogado trabalhista. Esta página é informação educativa, não parecer jurídico.`,

  "calculadora-de-churrasco": `Churrasco bom é o que não falta carne e não sobra carvão apagado. A conta parece simples, mas quem já recebeu quinze pessoas em casa sabe que errar para menos é vexame e errar para mais é dinheiro no lixo. Esta calculadora faz a conta do açougue, do carvão, dos acompanhamentos e da bebida a partir de quatro informações e devolve uma lista de compras pronta para imprimir ou mandar no grupo da família.

## Preencha com honestidade

Conte homens, mulheres e crianças entre três e doze anos; menores de três não entram na conta. Diga quantos adultos bebem cerveja, porque é o item que mais pesa no carrinho e no bolso. Escolha a duração: churrasco de duas horas depois da missa é diferente do que começa ao meio-dia e termina no jogo da noite. Por fim, escolha o preset de cortes. O clássico equilibra picanha, contrafilé, fraldinha, linguiça e frango. O econômico troca a picanha por alcatra e aumenta frango e linguiça sem perder sabor. O premium é para data especial, com picanha, ancho e costela.

## Como a conta é feita

A base é a carne crua por pessoa: cerca de quatrocentos e cinquenta gramas por homem, trezentos e cinquenta por mulher e duzentos por criança, para quatro horas de fogo. A calculadora aplica o fator da duração, distribui pelos cortes e arredonda para cima em medidas que o açougue entende. O carvão sai na proporção de um quilo para cada quilo e meio de carne, com mínimo de três quilos e meia dose extra em churrasco longo. Pão de alho, farofa, vinagrete, arroz, refrigerante, água e gelo são calculados por pessoa; cerveja só por adulto que bebe. Tudo já vem com dez por cento de folga.

## No dia

Leve a lista impressa ao açougue e peça os cortes já limpos. Acenda o carvão com uma hora de antecedência. Frango, linguiça e qualquer carne moída vão à mesa bem passados: setenta e quatro graus no termômetro de espeto, o investimento mais barato que melhora um churrasco. Carne bovina inteira pode ir ao ponto. Nunca use churrasqueira a carvão em área fechada: o monóxido de carbono não tem cheiro e derruba adulto forte. Os utensílios que fazem diferença, faca afiada, tábua com canaleta e termômetro, estão na Loja do Pai, com faixa de preço pesquisada.`,

  "cortes-de-carne": `Todo homem deveria saber ler um boi. Não para virar açougueiro, mas para comprar certo, não pagar picanha por coxão duro e não estragar uma peça boa com o preparo errado. Este guia é o mapa do boi: clique numa região e veja o nome do corte no Brasil e nos Estados Unidos, a textura, o preparo ideal, o ponto recomendado, o erro mais comum e uma faixa de preço de referência.

## Três caminhos para a mesma resposta

Se você já sabe o corte, clique nele no desenho, ou navegue com Tab e Enter no teclado. Se sabe só o que quer cozinhar, use a aba Carne e preparo: escolha grelha, espeto, chapa, panela, forno ou moída e veja a lista de cortes que funcionam para aquilo. Se quer comparar tudo de uma vez, a aba Tabela completa mostra os dezesseis cortes lado a lado, com ordenação por nome, região, textura e faixa de preço.

## Como ler cada corte

Textura diz se a carne é macia por natureza, caso da picanha e do filé, ou se precisa de tempo e umidade para amaciar, caso do músculo, do acém e da costela. Preparo diz onde cada uma brilha: cortes macios vão para o fogo forte e rápido; cortes com colágeno vão para a panela, o forno baixo ou o bafo da churrasqueira. Ponto é a temperatura interna em que o corte fica melhor; com termômetro de espeto você acerta sempre. O erro comum é o Semáforo do pai daquele corte: a mancada que mais estraga a carne, como tirar a capa de gordura da picanha antes de assar ou cortar a fraldinha a favor das fibras.

## Sobre os preços

A faixa de preço é de referência, pesquisada em lojas online numa data que aparece na tela, com valor mínimo e máximo por quilo. Ela serve para comparar cortes entre si e planejar o churrasco, não para discutir com o açougueiro da sua cidade. Onde ainda não houve pesquisa, a tela avisa.

## No açougue

Peça o corte pelo nome e diga o preparo; um bom açougueiro limpa e porciona do jeito certo. Peça peças inteiras e corte em casa quando puder. Carne moída, frango e miúdos vão sempre bem passados. Com o nome certo, o ponto certo e o preparo certo, o churrasco de domingo vira a melhor hora da semana da sua família. Os artigos ligados a cada corte aprofundam receitas, tempo de cozimento e técnica.`,

  "orcamento-familiar": `Quem provê precisa saber para onde o dinheiro vai. Não é controle por controle: é a diferença entre decidir e ser decidido pelas contas. Esta ferramenta monta o orçamento da casa em poucos minutos, sem planilha complicada, e mostra em cores onde a família está bem e onde está apertando.

## Preencha com o que cai na conta

Comece pelas rendas líquidas, a sua e a da esposa se ela trabalha fora. Use o valor real depositado, não o salário bruto. Depois abra cada grupo e preencha os gastos. Essenciais são moradia, alimentação, contas, transporte, saúde, educação dos filhos e seguros. Futuro é o dinheiro que trabalha por você: reserva de emergência, investimentos, aposentadoria e quitação de dívidas. Estilo de vida é lazer, churrasco, roupa, assinaturas e presentes. Dízimo e caridade é opcional, mas quem vive a fé sabe que o primeiro décimo pertence a Deus e ao próximo. Vale estimar na primeira vez e corrigir depois com as faturas na mão.

## A regra do pai

A ferramenta compara cada grupo com uma meta simples: até metade da renda para o essencial, pelo menos um quinto para o futuro, até um quinto para estilo de vida e cerca de um décimo para doações. Não é lei, é bússola. Se o essencial passa da metade, coisa comum em cidade cara ou com escola particular, o futuro não pode ficar zerado: encolha o estilo de vida e garanta uma reserva mínima, mesmo pequena.

## Leia o Semáforo

Verde é quando sobra pelo menos dez por cento do mês e o futuro recebe sua parte. Atenção é quando sobra pouco ou o essencial engole mais de sessenta por cento: um imprevisto vira dívida. Alerta é quando a conta não fecha. Nesse caso corte primeiro o estilo de vida, renegocie as dívidas mais caras e, se o buraco continuar, procure um planejador financeiro ou os canais oficiais de renegociação. Não existe vergonha em pedir ajuda; existe vergonha em deixar a família sem chão.

## Guarde e revise

Os dados ficam salvos apenas neste navegador; exporte o CSV ou imprima para guardar. Revise o orçamento todo mês, de preferência com a esposa, em dez minutos, na mesa da cozinha. Décimo terceiro e férias não entram na renda mensal: são extras que vão primeiro para a reserva ou para quitar dívida cara. Orçamento não é prisão; é o que compra liberdade para a sua casa.`,

  "juros-compostos": `Juros compostos são a força mais silenciosa a favor do pai que guarda um pouco todo mês. O rendimento de hoje entra no saldo e passa a render amanhã, e esse efeito, pequeno no primeiro ano, vira a maior parte do patrimônio depois de dez ou quinze. Este simulador mostra isso com números seus, não com exemplo de livro.

## O que informar

Comece com o valor que já tem guardado, mesmo que seja zero, e o aporte que consegue fazer todo mês. Escolha a taxa anual: digite a sua ou use os presets, que trazem a poupança, o CDI e o Tesouro IPCA+ com as taxas do dia lidas do nosso painel de mercado. Defina o prazo em anos ou meses e, se quiser enxergar o poder de compra do dinheiro no futuro, informe a inflação; o campo já vem com o IPCA de doze meses quando o dado está disponível.

## Como ler o resultado

O cartão principal mostra o montante final, quanto desse total saiu do seu bolso e quanto foi juros. O valor real é o montante descontada a inflação, ou seja, o que aquele dinheiro compra em valores de hoje; é esse número que importa para planejar faculdade, carro ou entrada de imóvel. O gráfico empilha aportes e juros ao longo do tempo: repare como a parte dos juros começa fina e engorda nos últimos anos. A tabela ano a ano serve para conferir metas intermediárias.

## O que a simulação não faz

Não desconta imposto de renda: Tesouro e CDB têm alíquota regressiva sobre o rendimento, poupança é isenta. Não garante taxa futura: o CDI de hoje pode ser outro daqui a dois anos. Não considera resgates no meio do caminho. Para uma conta mais fina, use a taxa líquida e refaça a simulação a cada ano.

## O Semáforo do pai nesta ferramenta

Taxa perto do CDI é cenário normal de renda fixa. Taxa bem acima do CDI pede garantia e liquidez claras no papel. Taxa muito alta com a palavra garantido é o sinal clássico de golpe: consulte o cadastro da CVM e fale com um profissional certificado antes de colocar um real. Juros compostos funcionam contra você também: o cartão de crédito rotativo usa a mesma matemática. Quite dívida cara antes de investir, e depois deixe o tempo trabalhar.`,

  "reserva-de-emergencia": `Reserva de emergência é o colchão que separa um imprevisto de uma crise. Carro quebrado, demissão, cirurgia do filho: tudo isso acontece, e a diferença entre a família que atravessa com tranquilidade e a que se endivida é ter alguns meses de gasto guardados em lugar seguro e de saque rápido. Esta ferramenta diz quanto é esse valor para a sua casa e em quanto tempo você chega lá.

## Informe só o essencial

Digite o gasto mensal essencial: moradia, alimentação, contas, transporte, saúde e escola. Lazer e supérfluo ficam de fora, porque em emergência eles param. Se não sabe o número, monte antes o Orçamento familiar e volte com o total dos Essenciais. Depois escolha o tipo de renda. Quem tem carteira assinada tem seguro-desemprego e multa do FGTS, por isso precisa de menos meses; servidor estável, menos ainda; autônomo e PJ, sem rede de proteção, precisam de mais. Some os dependentes: cada filho acrescenta um mês de cobertura, até o limite de três.

## Como ler a meta

O resultado é uma faixa, entre a meta mínima e a máxima. Informe quanto já guardou e quanto consegue guardar por mês: a barra mostra o progresso, e os cartões dizem em quantos meses você alcança a mínima e a máxima, com o rendimento da Selic do dia quando o dado está disponível. Comece pela mínima; depois siga até a máxima com calma.

## Onde guardar

Reserva precisa de três coisas: segurança, liquidez diária e rendimento razoável. Tesouro Selic, CDB de banco sólido com liquidez diária pagando ao menos o CDI e fundos DI simples atendem a isso. Poupança serve para começar, mas rende menos. Não coloque reserva em ação, cripto ou fundo com prazo de resgate: o dia em que você precisar pode ser o dia em que estiver em baixa.

## A ordem certa

Se há dívida de cartão ou cheque especial, ela vem antes: nenhum rendimento vence juro de cartão. Quite ou renegocie e, em paralelo, guarde um valor pequeno todo mês para criar o hábito. Depois da reserva mínima, aí sim, invista para o futuro. O Semáforo do pai acompanha esse caminho: verde com a reserva mínima feita, atenção enquanto estiver abaixo da metade, alerta com dívida cara e reserva zerada. Pai que provê dorme tranquilo porque tem o colchão pronto antes da queda.`,

  "pensao-alimenticia": `Pensão alimentícia é um dos assuntos mais delicados da vida de um pai, e também um dos mais cercados de informação errada. Esta ferramenta não calcula a sua pensão, porque nenhuma calculadora pode: quem fixa o valor é o juiz, caso a caso. O que ela faz é mostrar a faixa que costuma aparecer nas decisões para a sua renda e o seu número de filhos, explicar o que entra na conta e dizer em que momento você precisa de um profissional.

## O que a lei realmente diz

Não existe percentual fixo em lei. O Código Civil manda equilibrar a necessidade de quem recebe e a possibilidade de quem paga. Os famosos trinta por cento são um costume forense, não uma regra. Por isso o resultado aqui é uma faixa, calculada sobre a renda líquida e ajustada pelo número de filhos e pelo tipo de guarda. Informe também os custos fixos do filho, como escola e plano de saúde: a comparação entre esse número e a faixa mostra o lado da necessidade e ajuda você a entender como o juiz pensa.

## O que entra na base

Salário líquido, décimo terceiro e férias costumam compor a base; horas extras, bônus e participação nos lucros dependem da decisão. Descontos legais saem antes. Se você é autônomo ou PJ, a renda é apurada por extratos e declaração de imposto, e esconder renda é o erro que mais custa caro na Justiça.

## Guarda compartilhada

Compartilhar a guarda não extingue a pensão. Se um dos pais ganha mais ou o filho passa mais tempo com um deles, a obrigação continua, às vezes em valor menor quando as despesas são divididas diretamente e isso consta na decisão. A ferramenta mostra as duas faixas para você conversar com clareza.

## O que nunca fazer

Nunca pare de pagar por conta própria: se a renda caiu, peça revisão judicial. Nunca pague por fora sem recibo: a compra não abate a pensão. Nunca condicione o pagamento às visitas: são direitos independentes, e o filho não é moeda. Atraso de três parcelas abre caminho para protesto, penhora e prisão civil.

## Quando procurar ajuda

Acordo só vale homologado. A Defensoria Pública atende de graça quem se enquadra na renda; fora disso, um advogado de família. Se já existe atraso ou execução, procure hoje. Esta página é informação educativa e nunca substitui orientação jurídica. Pai de verdade sustenta o filho mesmo quando o casamento acabou, e faz isso do jeito certo.`,

  "conversor-de-unidades": `Metade dos erros na oficina, na garagem e na cozinha vem de unidade trocada: a broca em polegada que não bate com a bucha, o manual do carro em psi quando o calibrador marca bar, a receita gringa em xícaras e onças. Este conversor junta numa tela só as unidades que o pai de família usa de verdade, do parafuso à panela.

## Escolha a categoria certa

Comprimento cobre milímetro, centímetro, metro, polegada, pé, jarda e milha, para medir, cortar e entender ferramentas importadas. Peso tem grama, quilo, libra, onça e a arroba brasileira, útil para quem compra carne em quantidade ou lida com gado. Volume inclui mililitro, litro, xícara, colheres, galão, onça fluida, lata e garrafa, pensando na receita e no churrasco. Temperatura converte Celsius, Fahrenheit e Kelvin e traz a tabela de forno e de ponto da carne. Área tem metro quadrado, hectare, alqueire paulista e mineiro e acre, para quem olha terreno ou sítio. Velocidade, consumo, pressão, potência e torque resolvem o carro, a moto, o compressor e a furadeira. Brocas e parafusos traz a tabela de polegada fracionária em milímetro e a broca certa para cada bucha.

## Como usar

Escolha a categoria na aba, a unidade de origem e a de destino, e digite o valor com vírgula ou ponto. O resultado aparece na hora, e a tabela ao lado mostra o mesmo valor nas unidades mais comuns da categoria, para você não precisar converter uma por uma. O botão do meio inverte o sentido. Para arredondar, use o bom senso da tarefa: medida de marcenaria pede décimo de milímetro; pressão de pneu, número inteiro.

## Dicas práticas

Bucha e broca têm o mesmo número: bucha 8, broca 8. Pressão de pneu é a da etiqueta na porta do motorista, medida com o pneu frio. Xícara de receita brasileira tem duzentos e quarenta mililitros, mas farinha e açúcar variam de peso; balança resolve. Em consumo de combustível, dividir cem pelo valor em quilômetros por litro dá litros por cem quilômetros, a unidade que os europeus usam. Cavalo-vapor e horsepower não são iguais: a diferença é pequena, mas aparece em comparação de motores.

Nada aqui depende de internet; a ferramenta funciona sem conexão depois de carregada. Se faltar alguma unidade que você usa, mande pelo Contato: a lista cresce com o uso dos leitores.`,

  "kit-de-ferramentas": `Todo homem de família precisa de uma caixa de ferramentas, e a maioria compra errado: ou um kit enorme que fica no armário, ou nada, e paga alguém para pendurar uma prateleira. Esta ferramenta monta a sua caixa a partir do que você vai fazer de verdade, em ordem de prioridade, e mostra onde cada item entra.

## Três perguntas

Primeiro, onde você mora. Apartamento pede ferramentas de parede e de móvel, pouco espaço e nada de barulho exagerado. Casa acrescenta hidráulica, pintura e portão. Sítio soma jardim, cerca e manutenção pesada. Segundo, o que pretende fazer: marque entre montar móveis, furar parede, elétrica básica, hidráulica, pintura, marcenaria, carro e bicicleta e jardim. Terceiro, o nível. Básico resolve o dia a dia com meia dúzia de itens. Intermediário encara pequenas reformas e inclui a primeira ferramenta elétrica. Oficina é para quem gosta e quer fazer projetos com os filhos.

## Como ler a lista

A lista vem dividida em duas partes. Comece por estes são os itens essenciais para as tarefas que você marcou; compre primeiro. Quando precisar são os que fazem diferença, mas podem esperar a necessidade. Marque o que já tem e a lista passa a mostrar só o que falta. Cada item traz para que serve, a categoria na Loja do Pai e, quando o produto já foi avaliado pelo Pai Indica, o botão para a página dele, com faixa de preço pesquisada na internet e a review completa. A faixa de investimento total aparece só quando todos os itens vinculados têm pesquisa de preço; ela é referência, não orçamento.

## Segurança primeiro

Óculos, luvas, protetor auricular e máscara entram em toda lista, porque ferramenta boa na mão sem proteção é acidente esperando dia. Antes de furar parede, use o detector de cano e fio: cano estourado e fio cortado são os dois reparos mais caros que um furo pode causar. Elétrica só com o disjuntor geral desligado e teste de ausência de tensão; quadro de luz, padrão de entrada, chuveiro e qualquer serviço de gás são trabalho de profissional habilitado. Trabalho em altura pede escada firme e alguém segurando.

## Compre certo

Prefira marca conhecida nas ferramentas que você vai usar sempre e kit simples nas que usa pouco. Guarde tudo na mesma caixa, no mesmo lugar, e ensine o filho a devolver cada peça ao lugar dela. Caixa de ferramentas organizada é lição de ordem que a criança leva para a vida.`,

  "nomes-de-filhos": `Escolher o nome do filho é a primeira decisão que o pai e a mãe tomam juntos para uma pessoa que ainda não conhecem, e ela vai acompanhá-la a vida inteira. Esta ferramenta reúne mais de novecentos nomes com significado e origem, organizados para o casal filtrar, comparar, testar com o sobrenome e chegar a uma lista curta sem briga.

## Como filtrar

Comece pelo sexo, se já souber. Depois use a letra inicial, a origem, que vai do hebraico e do grego ao latim, ao germânico e ao tupi, e os dois filtros que fazem desta lista algo diferente: só nomes de santos e só nomes bíblicos. Na tradição católica, dar ao filho o nome de um santo é dar a ele um padroeiro, uma data para celebrar e uma história de vida para imitar. Não é obrigação, mas é um presente que o pai pode dar no primeiro dia.

## Teste com o sobrenome

Digite o sobrenome da família e cada card passa a mostrar o nome completo. Preste atenção ao som: nome que termina com a mesma letra com que o sobrenome começa costuma emendar mal, e a ferramenta avisa quando isso acontece. Leia em voz alta, imagine a chamada na escola e a assinatura no documento. Nome bonito na lista pode ficar estranho no dia a dia.

## Monte a lista e decida juntos

Favorite até dez nomes; eles ficam guardados neste navegador. O botão de compartilhar manda a lista para a esposa, que pode fazer a dela e trocar. O botão de sortear mostra cinco nomes aleatórios dentro dos filtros, bom para destravar quando nada agrada. Decisão de nome é do casal: a ferramenta só organiza a conversa.

## Sobre o registro

O cartório pode recusar nome que exponha a criança ao ridículo; nomes compostos e estrangeiros são aceitos, e grafias muito incomuns podem gerar dúvida na hora de registrar. Quem registra, na maioria das famílias, é o pai, nos primeiros dias de vida, levando a declaração de nascido vivo do hospital. Os significados desta lista vêm da etimologia tradicional de cada língua; nomes modernos sem etimologia clara trazem a origem mais aceita. Escolha com calma, reze pelo filho enquanto escolhe, e lembre que o melhor nome é o que o casal vai gostar de chamar todos os dias.`,

  "calendario-de-vacinacao": `Vacina de filho não é assunto só da mãe. O pai que acompanha o calendário, marca a data e leva a criança à UBS está protegendo a família de doenças que ainda matam no Brasil e dividindo de verdade a carga da casa. Esta ferramenta transforma o calendário público do SUS numa linha do tempo do seu filho, com as doses feitas, as próximas e as atrasadas.

## Comece pela data de nascimento

Digite a data e a tela monta a linha do tempo por idade: ao nascer, dois meses, três, quatro, cinco, seis, nove, doze, quinze meses, quatro anos e a adolescência. Cada dose mostra a vacina, de que doença protege e observações importantes, como a janela estreita do rotavírus, que não pode passar. Pegue a caderneta e marque o que já foi feito; a marcação fica salva neste navegador e, se você tiver conta na Área do Pai, a data do filho vem preenchida sozinha.

## Leia os estados

Feita é a dose marcada por você. No prazo é a que está na idade certa agora. Próxima mostra quantos dias faltam. Atrasada é a dose cuja idade já passou há mais de um mês sem marcação: não se preocupe, o esquema é retomado de onde parou, sem recomeçar; vá à UBS esta semana. Fora da janela aparece só nas vacinas com limite de idade, e nesse caso a equipe de saúde orienta o que fazer.

## Agende como quem agenda reunião

O bloco das próximas três doses tem o botão de adicionar à agenda: ele cria o compromisso no seu celular com lembrete três dias antes. Trate como compromisso de trabalho. Leve a caderneta na sua carteira; quem leva é você.

## Depois da vacina

Febre baixa, dor no local e irritação nas primeiras quarenta e oito horas são comuns e passam com colo, líquido e, se o pediatra orientou, antitérmico. O Semáforo do pai aponta o que não é normal: febre alta que não cede, choro inconsolável por horas, convulsão ou inchaço importante pedem atendimento imediato na UPA ou ligação para o 192. Resfriado leve sem febre não impede vacinar; com febre, espere melhorar.

O calendário é o Nacional de Vacinação do Ministério da Saúde, gratuito em qualquer UBS, conferido na data indicada na tela. Vacinas da rede privada não estão aqui. A caderneta e a equipe de saúde sempre prevalecem sobre qualquer ferramenta.`,

  "marcos-do-desenvolvimento": `Pai presente conhece o filho. Sabe o que esperar em cada idade, percebe quando algo não vai bem e, principalmente, sabe o que fazer para ajudar. Esta ferramenta traduz os marcos do desenvolvimento da Caderneta da Criança, a mesma que o pediatra usa, para a linguagem de quem chega do trabalho e quer aproveitar a hora que tem com o filho.

## Informe a idade

Digite a data de nascimento ou a idade em meses. A fase atual abre em destaque, com os marcos divididos em quatro áreas: motor, linguagem, social e cognitivo. Marque o que você já viu o seu filho fazer; a marcação fica salva neste navegador. Navegue para a fase anterior, se quiser conferir o que ficou para trás, e para a seguinte, para saber o que vem aí.

## Faça a sua parte

Em cada fase há três ou quatro ações do pai, pensadas para o dia a dia real: conversar olhando nos olhos, colocar de bruços por um minuto, esconder o rosto, ler em voz alta, brincar no chão, dar tarefas pequenas, levar para o quintal, incluir nas tarefas de homem da casa. Nada custa dinheiro e tudo cabe em quinze minutos. A ciência é clara: o envolvimento do pai melhora linguagem, autocontrole e segurança da criança. Não é substituir a mãe; é somar o que só o pai dá.

## Leia o Semáforo com calma

Marcos são faixas, não datas. Um filho que ainda não anda aos doze meses está dentro da normalidade; a maioria anda entre doze e quinze. O sinal verde diz que a fase está indo bem. O sinal de atenção aponta um marco que costuma estar presente e ainda não apareceu: observe por algumas semanas e comente na próxima consulta. O sinal de alerta é diferente: habilidade que o filho já tinha e perdeu, ausência de contato visual, não reagir a sons ou ao nome, ou vários marcos ausentes ao mesmo tempo pedem o pediatra agora, não a próxima consulta de rotina. Quanto mais cedo se avalia, melhor o resultado.

## Telas, sono e exemplo

Antes dos dois anos a recomendação é nenhuma tela. Depois, pouco e com você ao lado. Sono regular e rotina previsível fazem mais pelo desenvolvimento do que qualquer brinquedo educativo. E o maior estímulo que um menino ou uma menina recebe é ver o pai tratando a mãe com respeito, rezando com a família e cumprindo a palavra. Esta ferramenta é educativa e não substitui a avaliação do pediatra; a Caderneta da Criança continua sendo o documento oficial.`,

  "imc-e-gasto-calorico": `Homem que cuida da família precisa estar vivo e forte para ela. Não é vaidade; é responsabilidade. Esta calculadora dá os quatro números básicos da saúde do homem adulto: o índice de massa corporal, a taxa metabólica basal, o gasto calórico diário e a meta de calorias para o seu objetivo, além da água que você deveria beber por dia.

## O que informar

Idade, altura e peso, de preferência medido de manhã e em jejum. A circunferência da cintura é opcional, mas é o número que mais importa para o homem: meça na altura do umbigo, sem apertar a fita. Escolha o nível de atividade com honestidade: sedentário é quem trabalha sentado e não treina; leve é quem caminha e faz tarefas de casa; moderado treina três a cinco vezes por semana; intenso, seis ou sete; atleta é trabalho físico pesado mais treino. Por fim, o objetivo: manter, perder ou ganhar peso.

## Como ler cada número

O IMC compara peso e altura e classifica em faixas da Organização Mundial da Saúde. Ele é útil para a maioria, mas falha em quem tem muita massa muscular; nesse caso a cintura diz mais. A taxa metabólica basal é a energia que o corpo gasta em repouso. O gasto diário é essa taxa multiplicada pelo fator de atividade: é quanto você consome num dia normal. A meta calórica ajusta esse gasto ao objetivo: cerca de quinhentas calorias a menos para perder meio quilo por semana, trezentas a mais para ganhar massa com treino. A água recomendada é proporcional ao peso.

## O Semáforo do pai

Verde é IMC na faixa adequada com cintura abaixo de noventa e quatro centímetros. Atenção é sobrepeso, peso abaixo do normal ou cintura entre noventa e quatro e cento e dois: ajuste o prato, mexa o corpo e faça o check-up anual. Alerta é obesidade ou cintura acima de cento e dois centímetros: antes de qualquer dieta ou treino intenso, procure um médico para avaliar pressão, glicose e colesterol. Não é exagero; é o que evita o infarto aos quarenta e cinco.

## Como usar o resultado

Escolha um objetivo de cada vez. Para perder peso, corte o que não alimenta: refrigerante, álcool em excesso e lanche de madrugada. Para ganhar massa, coma proteína em todas as refeições e durma. Caminhe trinta minutos por dia; leve o filho junto. Refaça a conta a cada mês e anote. Esta ferramenta usa fórmulas populacionais e é educativa: não substitui médico nem nutricionista, e quem tem doença crônica deve seguir a orientação profissional.`,

  "checklist-da-maternidade": `No dia do parto a mãe tem um trabalho: dar à luz. Todo o resto é do pai. Documento, carro, estacionamento, telefonema, registro, plano de saúde, pediatra. Esta lista é a sua, não a da mala do bebê: é o que o homem precisa ter pronto, no bolso e na cabeça, para a esposa chegar à maternidade sem precisar pensar em nada além do filho.

## Comece na 36ª semana

Informe a data prevista e a contagem regressiva mostra quanto falta para a trigésima sexta semana, o prazo para estar tudo pronto, porque o parto pode vir antes. A partir daí, tanque cheio, mala no carro, rota testada e documentos juntos. Marque os itens conforme avança; o progresso fica no topo e salvo neste navegador. O filtro por momento separa o que é para a semana trinta e seis, para o dia, para o hospital, para a primeira semana e para o primeiro mês.

## Documentos: quem leva é você

RG ou CNH de vocês dois, cartão do plano ou do SUS, cartão do pré-natal com os exames, certidão de casamento, que facilita o registro em nome dos dois, e a lista de telefones. Guarde tudo numa pasta só, que fica na sua mala, não na dela. No hospital, pegue a Declaração de Nascido Vivo antes da alta: sem ela não há registro. Pergunte sobre o teste do pezinho, da orelhinha, do olhinho e do coraçãozinho, e confira a BCG e a hepatite B na caderneta.

## O seu direito de estar lá

A lei garante à gestante um acompanhante de livre escolha no parto, inclusive na cesárea, no SUS e na rede privada. Confirme com a maternidade as regras da casa, leve roupa confortável, chinelo, carregador com cabo longo, lanche e água. Parto demora; pai desmaiado de fome não ajuda ninguém.

## Primeira semana e primeiro mês

Registre o filho no cartório nos primeiros dias; é gratuito, o prazo é de quinze dias e o CPF sai junto. Avise o RH e peça a licença-paternidade com a certidão na mão. Marque a primeira consulta do pediatra. Inclua o bebê no plano de saúde dentro de trinta dias para entrar sem carência. Abra a linha do filho no orçamento. E assuma a casa: visitas, comida, louça e os outros filhos são seus até a esposa se recuperar.

## O Semáforo do pai

Verde é tudo pronto antes da trigésima sexta semana. Atenção é prazo passado com documento ou carro pendente. Alerta é sinal de urgência na gestante: bolsa rota, sangramento, dor de cabeça forte com visão turva, pressão alta ou contrações regulares antes das trinta e sete semanas. Nesse caso não se consulta lista: leve a esposa à maternidade agora ou ligue 192.`,
};
