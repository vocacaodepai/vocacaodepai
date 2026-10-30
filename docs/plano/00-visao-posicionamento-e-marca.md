# 00 — Visão, posicionamento e marca do Vocação de Pai

> Documento-base do plano. Tudo o que vem depois (arquitetura, fases, backlog de conteúdo, rotinas) obedece ao que está aqui.
> Leitor: a sessão do Claude Code (Sonnet 5.5, esforço médio) que vai executar o plano em `/home/user/vocacaodepai`.
> Versão 1.0 · 24 de outubro de 2026 · Dono: Bruno Danello (grupo VDP).
> Domínio: vocacaodepai.com.br · Site-irmão: vocacaodemae.com.br.

Como usar este documento:

- As seções 3 (taxonomia), 4 (linha editorial e proibições), 5 (tom de voz) e 6 (nomes oficiais) são **normativas**: copiar nomes, slugs, cores e textos exatamente como estão. Não inventar sinônimos.
- A seção 3 traz o SQL de seed da tabela `categories` (vai para `supabase/migrations/0002_blog.sql`) e o mesmo conteúdo em JSON (vai para `src/content/taxonomia.json`, usado pelo front e pelas rotinas).
- A seção 7 (marca) define os arquivos que a Fase 1 deve criar em `public/brand/` e os tokens em `src/styles/tokens.css`.
- A seção 8 (manifesto) é o texto pronto da página `/sobre`.
- As DECISÕES FIXAS do briefing prevalecem sobre qualquer coisa escrita aqui se houver conflito.

---

## 1. Missão, visão e promessa ao leitor

### 1.1 Missão

Formar homens para a vocação de pai: ajudar o brasileiro a ser um pai presente, um marido fiel, um provedor competente e um homem de fé, com conteúdo prático, direto e confiável, do berço do filho ao churrasco de domingo.

### 1.2 Visão (5 anos)

Ser o maior ecossistema de paternidade e formação masculina em língua portuguesa: o lugar onde o pai brasileiro resolve a dúvida de hoje (o que fazer com a febre do filho, como afiar a faca, como negociar o salário), encontra irmãos de caminhada (Irmandade), cresce em virtude (Formação) e ajuda outros pais a trabalhar e prosperar (Pai Indica Pai).

### 1.3 Posicionamento (uma frase)

Entre o portal de paternidade afetiva que fala só de sentimentos e o site de "coisas de homem" que fala só de churrasco e carro, o Vocação de Pai é o único que junta as duas coisas sob uma visão clara de família: o homem inteiro, a serviço da casa que ele lidera.

### 1.4 Promessa ao leitor: os 7 compromissos de todo conteúdo

Todo artigo, review, ferramenta, trilha e e-mail do site cumpre estes sete pontos. O validador de conteúdo (Fase 8) checa os que são verificáveis por máquina (1, 4, 5, 6, 7).

1. **Resposta antes da explicação.** O leitor encontra a resposta prática nos primeiros 30 segundos: veredito, passo a passo ou número. A explicação vem depois.
2. **Para quem é e para quem não é.** Cada conteúdo diz a que fase da vida do pai e a que idade do filho ele serve. Nada de "serve para todos".
3. **Fala com o homem adulto.** Sem infantilizar, sem culpar, sem fazer piada do pai atrapalhado. O pai é tratado como quem é capaz de aprender e liderar.
4. **Família tradicional, sem exceção.** Pai e mãe, homem e mulher, casamento como vocação. Texto e imagem seguem a seção 4 deste documento.
5. **Honesto sobre dinheiro e produto.** Produto ruim recebe nota ruim mesmo com link de afiliado. Preço sempre em faixa pesquisada na internet, nunca exato. Botão sempre "Comprar agora na Amazon". Transparência de afiliado visível.
6. **Cauteloso em saúde, direito e dinheiro.** Conteúdo informativo; "quando procurar um profissional" explícito; aviso automático do layout em saúde, direito e investimentos; nunca diagnóstico, nunca parecer jurídico, nunca recomendação individual de investimento.
7. **Contexto brasileiro e próximo passo.** Exemplos, leis, marcas, cortes de carne e salários do Brasil. Todo conteúdo termina com uma ação concreta e links internos ("Continue lendo") para o leitor seguir no site.

---

## 2. Personas

Sete personas. Cada uma tem dores, as buscas que digita no Google e o que o site entrega. O painel do membro (Área do Pai) pergunta no onboarding "em que momento você está" com exatamente estas sete opções (coluna `profiles.persona`, valores = slug da persona; se a coluna não existir no doc 02, usar `profiles.bio` até a Fase 5 criar).

### 2.1 `primeira-viagem` — Pai de primeira viagem (28 a 36 anos)

- **Quem é:** casado há 1 a 4 anos, esposa grávida ou bebê de até 12 meses. Trabalha fora, chega cansado, sente que "não sabe o que fazer" com o recém-nascido e que a esposa sabe tudo.
- **Dores:** medo de segurar errado, não saber acalmar o choro, ciúme do bebê, vida sexual e conjugal mudando, dinheiro apertando, pressão para ser "o pai que o meu não foi".
- **Buscas no Google:** "como acalmar bebê chorando pai", "o que o pai faz no parto", "licença paternidade quantos dias 2026", "como ajudar a esposa no pós-parto", "bebê de 2 meses não dorme", "enxoval de bebê lista", "cadeirinha de carro qual comprar".
- **O que o site entrega:** categoria Paternidade por fase (Gestação e parto, Recém-nascido), trilha gratuita "Primeiros 100 dias de pai", Jogada do Dia, Pai Indica de cadeirinha/carrinho/babá eletrônica, ferramenta "Conversor de idade e marcos", artigo de direitos (licença, registro em cartório), semáforo do pai em cada artigo de saúde.

### 2.2 `dois-ou-mais` — Pai de 2 ou mais filhos (32 a 45 anos)

- **Quem é:** filhos entre 2 e 12 anos, rotina cheia, casa barulhenta. Já passou pela fase do bebê; agora quer educar, dar limite, pagar escola e manter o casamento vivo.
- **Dores:** falta de tempo, briga entre irmãos, telas, disciplina sem gritar, orçamento familiar, cansaço do casal, culpa por trabalhar demais.
- **Buscas:** "como dar limite sem bater", "briga entre irmãos o que fazer", "quanto custa criar um filho", "orçamento familiar planilha", "atividade pai e filho fim de semana", "como conversar com filho de 8 anos", "tempo de tela por idade".
- **O que o site entrega:** faixas 1-3, 4-7 e 8-12 anos, série "Fim de semana de 940", Calculadora de Churrasco, Dinheiro do Pai (orçamento, reserva, escola), trilha "Pai que educa", hub por idade personalizado pelos filhos cadastrados em `children`.

### 2.3 `pai-de-adolescente` — Pai de adolescente (40 a 55 anos)

- **Quem é:** filhos de 12 a 18 anos. Sente que perdeu o canal de conversa; preocupa-se com namoro, pornografia, drogas, faculdade, celular, fé do filho.
- **Dores:** filho fechado no quarto, conflito com a mãe, notas caindo, não saber falar de sexualidade e pureza, medo de perder a autoridade, primeiro carro, primeiro emprego do filho.
- **Buscas:** "como conversar com filho adolescente", "filho adolescente não fala comigo", "como falar de pornografia com filho", "adolescente e celular regras", "como ensinar filho a dirigir", "primeiro emprego jovem aprendiz", "filho não quer ir à missa".
- **O que o site entrega:** faixa Adolescência, trilha "Pai de adolescente: autoridade e amizade", Fé e virtude (castidade, vocação, crisma), Carro e moto (ensinar a dirigir, primeiro carro), Pai Indica Pai (jovem aprendiz, estágio), Perguntas da Irmandade.

### 2.4 `guarda-compartilhada` — Pai separado com guarda compartilhada (30 a 50 anos)

- **Quem é:** divorciado ou separado, filhos em duas casas. Quer continuar presente, briga com burocracia, pensão, calendário de convivência e a culpa.
- **Dores:** sentir-se "pai de fim de semana", conflito com a ex-esposa, pensão alimentícia, alienação parental, como manter rotina e fé do filho em duas casas, solidão.
- **Buscas:** "guarda compartilhada como funciona", "pensão alimentícia quanto é", "pai tem direito de ver o filho", "alienação parental o que fazer", "como ser presente morando longe", "férias com o pai guarda compartilhada".
- **O que o site entrega:** categoria Direitos do pai (sempre com aviso "procure um advogado"), trilha gratuita "Pai presente mesmo longe", Histórias de pai, mentoria com pais que passaram pelo mesmo, acolhimento sem incentivar separação e sem julgamento (a Igreja acolhe; o site segue a Igreja).

### 2.5 `viuvo` — Pai viúvo (35 a 60 anos)

- **Quem é:** perdeu a esposa; cria os filhos sozinho ou com ajuda da família. Precisa aprender a casa inteira: rotina, cabelo da filha, escola, luto dos filhos e o próprio.
- **Dores:** luto, sobrecarga, não saber as tarefas que eram dela, culpa por "não dar conta", filhos chorando à noite, fé abalada, dinheiro reorganizado (pensão por morte, inventário).
- **Buscas:** "como criar filhos sozinho pai viúvo", "como ajudar filho no luto da mãe", "pensão por morte filhos", "como pentear cabelo de menina", "rotina de casa para pai solo".
- **O que o site entrega:** trilha "Casa inteira", Fé e virtude (luto, esperança, oração com os filhos), Direitos do pai (pensão por morte, inventário com aviso), Irmandade (grupo fechado de viúvos), Estilo e cuidados (cuidar dos filhos no dia a dia), Histórias de pai.

### 2.6 `noivo` — Homem solteiro que se prepara para o casamento (22 a 32 anos)

- **Quem é:** namorando sério ou noivo. Quer chegar ao casamento pronto: emocional, espiritual, financeira e praticamente. Muitas vezes vem de família quebrada e quer fazer diferente.
- **Dores:** medo de repetir o pai, dinheiro para casar, castidade no namoro, curso de noivos, comprar o primeiro apartamento, escolher a esposa certa, ser provedor desde o início.
- **Buscas:** "como se preparar para o casamento homem", "curso de noivos igreja católica", "quanto guardar para casar", "como saber se ela é a pessoa certa", "o que um homem precisa saber antes de casar", "como ser um bom marido".
- **O que o site entrega:** Casamento e família (namoro, noivado, curso de noivos, primeiro ano), Dinheiro do Pai (reserva para casar, financiamento), trilha "Pronto para casar", Fé e virtude (castidade, São José, consagração), Caixa de ferramentas (a casa nova), Formação em turmas.

### 2.7 `avo` — Avô (55 a 75 anos)

- **Quem é:** pai de filhos adultos, avô de 1 a 10 netos. Quer ajudar sem invadir, transmitir fé e história, cuidar da saúde para estar presente, organizar herança e legado.
- **Dores:** como aconselhar o filho que agora é pai, netos com telas e sem fé, saúde (próstata, coração, memória), solidão na aposentadoria, dinheiro na aposentadoria, testamento e sucessão.
- **Buscas:** "como ser um bom avô", "o que fazer com os netos no fim de semana", "exame de próstata idade", "aposentadoria complementar vale a pena", "como fazer testamento", "como ensinar a rezar para o neto".
- **O que o site entrega:** faixa Filho adulto, Corpo e saúde do homem (check-up por idade), Dinheiro do Pai (aposentadoria, sucessão, com aviso), Histórias de pai ("Meu pai me ensinou"), Fé e virtude (transmitir a fé), mentoria no Pai Indica Pai (o avô como mentor), Esporte e lazer com os filhos (netos).

### 2.8 Prioridade de atendimento

No primeiro ano, o conteúdo e as trilhas priorizam, nesta ordem: `primeira-viagem` (maior volume de busca e maior conversão de newsletter), `dois-ou-mais` (maior volume de afiliado e churrasco), `noivo` (maior adesão à Formação), `pai-de-adolescente`, `guarda-compartilhada`, `avo`, `viuvo`. As sete recebem pelo menos 1 trilha e 20 artigos até o fim do ano 1.

---

## 3. Pilares editoriais e taxonomia completa do blog

### 3.1 Os 4 pilares (organização conceitual, aparecem na home e na Formação)

| Pilar | Pergunta que responde | Categorias que agrupa |
|---|---|---|
| **Casa** | Como cuido da minha família? | paternidade-por-fase, casamento-e-familia, direitos-do-pai, historias-de-pai |
| **Trabalho** | Como provejo e prospero? | provedor-e-carreira, dinheiro-do-pai, tecnologia-do-pai |
| **Corpo** | Como cuido de mim e do que é meu? | corpo-e-saude-do-homem, estilo-e-cuidados, esporte-e-lazer-com-os-filhos, churrasco-e-cozinha, caixa-de-ferramentas-e-reparos, carro-e-moto |
| **Alma** | Como me torno o homem que Deus quer? | fe-e-virtude (atravessa todas) |

Os pilares **não** são categorias no banco; são um campo `pillar` fixo no JSON da taxonomia e um filtro visual em `/blog`. Cada categoria pertence a exatamente um pilar.

### 3.2 As 14 categorias

Regras:

- `slug` é imutável. `name` é o que aparece na interface. `description` tem 2 linhas (até 160 caracteres) e serve de meta description da página `/categoria/$slug`.
- `color` é usada no chip da categoria, na borda do card e no cabeçalho da página de categoria. Todas foram escolhidas para contrastar com o fundo areia `#F4EFE6` e com o fundo escuro `#14181C` (texto branco sobre a cor passa em AA).
- Subcategorias vivem na **mesma tabela `categories`** com `parent_id` apontando para a categoria-mãe (coluna `parent_id uuid null references categories(id)`; se o doc 02 não previr, a migration `0002_blog.sql` adiciona). Um post tem uma única `category_id`, que pode ser uma subcategoria; a listagem da categoria-mãe inclui os posts das filhas.
- `sort_order` da categoria-mãe = ordem da tabela abaixo × 10; subcategorias = ordem da mãe × 10 + posição.

| # | slug | name | color | pilar |
|---|---|---|---|---|
| 1 | paternidade-por-fase | Paternidade por fase | #14505C | Casa |
| 2 | casamento-e-familia | Casamento e família | #8C3B4A | Casa |
| 3 | provedor-e-carreira | Provedor e carreira | #2E5E8C | Trabalho |
| 4 | dinheiro-do-pai | Dinheiro do Pai | #2F7D4F | Trabalho |
| 5 | fe-e-virtude | Fé e virtude | #6B4C9A | Alma |
| 6 | corpo-e-saude-do-homem | Corpo e saúde do homem | #1F7A7A | Corpo |
| 7 | churrasco-e-cozinha | Churrasco e cozinha | #B23A3A | Corpo |
| 8 | caixa-de-ferramentas-e-reparos | Caixa de ferramentas e reparos | #D9822B | Corpo |
| 9 | carro-e-moto | Carro e moto | #3D4650 | Corpo |
| 10 | estilo-e-cuidados | Estilo e cuidados | #7A5C3E | Corpo |
| 11 | esporte-e-lazer-com-os-filhos | Esporte e lazer com os filhos | #3F8F5A | Corpo |
| 12 | tecnologia-do-pai | Tecnologia do Pai | #3A6EA5 | Trabalho |
| 13 | direitos-do-pai | Direitos do pai | #5C6B73 | Casa |
| 14 | historias-de-pai | Histórias de pai | #C2703A | Casa |

Observação sobre a cor de `carro-e-moto`: o grafite da paleta (`#1F2429`) é a cor de texto/cartão escuro, então a categoria usa `#3D4650`, um grafite dois tons mais claro, para o chip não sumir no modo escuro.

### 3.3 Descrições e subcategorias

**1. paternidade-por-fase — Paternidade por fase (#14505C)**
Descrição: "O que o pai precisa saber e fazer em cada idade do filho, da gestação ao filho adulto. Marcos, rotina, saúde, limites e vínculo, fase por fase."
Subcategorias (7):
- `gestacao-e-parto` — Gestação e parto
- `recem-nascido` — Recém-nascido (0 a 12 meses)
- `1-a-3-anos` — 1 a 3 anos
- `4-a-7-anos` — 4 a 7 anos
- `8-a-12-anos` — 8 a 12 anos
- `adolescencia` — Adolescência (12 a 18)
- `filho-adulto` — Filho adulto

**2. casamento-e-familia — Casamento e família (#8C3B4A)**
Descrição: "Namoro, noivado, casamento e a vida a dois com filhos. Como ser marido, liderar servindo, cuidar da esposa e construir uma casa que dura."
Subcategorias (7):
- `namoro-e-noivado` — Namoro e noivado
- `preparacao-para-o-casamento` — Preparação para o casamento
- `vida-a-dois` — Vida a dois
- `comunicacao-e-conflitos` — Comunicação e conflitos
- `intimidade-conjugal` — Intimidade conjugal
- `rotina-da-casa` — Rotina da casa
- `familia-grande` — Família grande e irmãos

**3. provedor-e-carreira — Provedor e carreira (#2E5E8C)**
Descrição: "Trabalho, salário, mudança de emprego, empreender e liderar. O pai como provedor que sustenta a casa sem perder a casa de vista."
Subcategorias (7):
- `primeiro-emprego-e-recolocacao` — Primeiro emprego e recolocação
- `salario-e-negociacao` — Salário e negociação
- `lideranca-no-trabalho` — Liderança no trabalho
- `empreender-com-familia` — Empreender com família
- `equilibrio-trabalho-e-casa` — Equilíbrio entre trabalho e casa
- `habilidades-e-cursos` — Habilidades e cursos
- `trabalho-remoto-e-home-office` — Trabalho remoto e home office

**4. dinheiro-do-pai — Dinheiro do Pai (#2F7D4F)**
Descrição: "Orçamento familiar, dívidas, reserva, investimentos, moedas e bitcoin explicados para quem sustenta uma casa. Sem promessa de enriquecer rápido."
Subcategorias (8):
- `orcamento-familiar` — Orçamento familiar
- `dividas-e-credito` — Dívidas e crédito
- `reserva-e-seguros` — Reserva de emergência e seguros
- `investimentos-para-a-familia` — Investimentos para a família
- `bitcoin-e-cripto` — Bitcoin e cripto
- `cambio-e-moedas` — Câmbio e moedas
- `casa-propria-e-financiamento` — Casa própria e financiamento
- `aposentadoria-e-sucessao` — Aposentadoria e sucessão

**5. fe-e-virtude — Fé e virtude (#6B4C9A)**
Descrição: "Oração, sacramentos, virtudes e santos para o homem que quer ser santo no meio da família. São José como modelo do pai."
Subcategorias (8):
- `oracao-do-pai` — Oração do pai
- `sacramentos-e-liturgia` — Sacramentos e liturgia
- `virtudes-masculinas` — Virtudes masculinas
- `sao-jose-e-os-santos` — São José e os santos
- `transmitir-a-fe-aos-filhos` — Transmitir a fé aos filhos
- `castidade-e-pureza` — Castidade e pureza
- `luto-e-esperanca` — Luto e esperança
- `vocacao-e-discernimento` — Vocação e discernimento

**6. corpo-e-saude-do-homem — Corpo e saúde do homem (#1F7A7A)**
Descrição: "Check-up, sono, treino, alimentação, saúde mental e sexual do homem adulto. Informação séria para estar vivo e forte para a família."
Subcategorias (8):
- `check-up-por-idade` — Check-up por idade
- `sono-e-energia` — Sono e energia
- `treino-em-casa-e-academia` — Treino em casa e na academia
- `alimentacao-do-homem` — Alimentação do homem
- `saude-mental-e-estresse` — Saúde mental e estresse
- `saude-sexual-e-prostata` — Saúde sexual e próstata
- `vicios-e-liberdade` — Vícios e liberdade
- `primeiros-socorros-em-casa` — Primeiros socorros em casa

**7. churrasco-e-cozinha — Churrasco e cozinha (#B23A3A)**
Descrição: "Cortes de carne, fogo, facas, receitas e a cozinha do dia a dia. O pai que alimenta a família e reúne os amigos em volta da brasa."
Subcategorias (8):
- `cortes-de-carne` — Cortes de carne
- `tecnicas-de-churrasco` — Técnicas de churrasco
- `churrasqueiras-facas-e-acessorios` — Churrasqueiras, facas e acessórios
- `receitas-de-churrasco` — Receitas de churrasco
- `cozinha-do-dia-a-dia` — Cozinha do dia a dia
- `cafe-da-manha-e-lanche-dos-filhos` — Café da manhã e lanche dos filhos
- `bebidas-e-harmonizacao` — Bebidas e harmonização
- `cozinhar-com-os-filhos` — Cozinhar com os filhos

**8. caixa-de-ferramentas-e-reparos — Caixa de ferramentas e reparos (#D9822B)**
Descrição: "Ferramentas, reparos, elétrica, hidráulica e marcenaria para resolver a casa com as próprias mãos. Passo a passo e o que comprar."
Subcategorias (8):
- `ferramentas-essenciais` — Ferramentas essenciais
- `eletrica-basica` — Elétrica básica
- `hidraulica-e-vazamentos` — Hidráulica e vazamentos
- `pintura-e-acabamento` — Pintura e acabamento
- `marcenaria-e-montagem` — Marcenaria e montagem
- `jardim-e-quintal` — Jardim e quintal
- `seguranca-da-casa` — Segurança da casa
- `projetos-com-os-filhos` — Projetos com os filhos

**9. carro-e-moto — Carro e moto (#3D4650)**
Descrição: "Comprar, manter e dirigir com segurança. Carro de família, cadeirinha, revisão, documentação e ensinar o filho a dirigir."
Subcategorias (7):
- `carro-de-familia` — Carro de família
- `manutencao-e-revisao` — Manutenção e revisão
- `seguranca-e-cadeirinha` — Segurança e cadeirinha
- `documentos-multas-e-seguro` — Documentos, multas e seguro
- `viagem-de-carro-com-filhos` — Viagem de carro com filhos
- `moto-no-dia-a-dia` — Moto no dia a dia
- `ensinar-o-filho-a-dirigir` — Ensinar o filho a dirigir

**10. estilo-e-cuidados — Estilo e cuidados (#7A5C3E)**
Descrição: "Barba, cabelo, roupa, relógio e postura. Apresentar-se bem com simplicidade, para o trabalho, a missa e a vida."
Subcategorias (7):
- `barba-e-cabelo` — Barba e cabelo
- `guarda-roupa-essencial` — Guarda-roupa essencial
- `sapatos-e-relogios` — Sapatos e relógios
- `higiene-e-pele` — Higiene e pele
- `como-se-vestir-por-ocasiao` — Como se vestir por ocasião
- `etiqueta-e-postura` — Etiqueta e postura
- `cuidar-dos-filhos-no-dia-a-dia` — Cuidar dos filhos no dia a dia

**11. esporte-e-lazer-com-os-filhos — Esporte e lazer com os filhos (#3F8F5A)**
Descrição: "Futebol, bicicleta, pesca, acampamento, jogos e filmes. Ideias de vínculo pai e filho por idade, tempo e custo."
Subcategorias (8):
- `atividades-por-idade` — Atividades por idade
- `fim-de-semana-de-940` — Fim de semana de 940
- `futebol-e-esportes-coletivos` — Futebol e esportes coletivos
- `bicicleta-natacao-e-corrida` — Bicicleta, natação e corrida
- `pesca-acampamento-e-natureza` — Pesca, acampamento e natureza
- `jogos-de-mesa-e-brincadeiras` — Jogos de mesa e brincadeiras
- `filmes-livros-e-musica` — Filmes, livros e música
- `viagens-em-familia` — Viagens em família

**12. tecnologia-do-pai — Tecnologia do Pai (#3A6EA5)**
Descrição: "Celular, controle parental, casa conectada, computador e inteligência artificial a serviço da família. Proteger os filhos e trabalhar melhor."
Subcategorias (7):
- `controle-parental-e-telas` — Controle parental e telas
- `celular-e-acessorios` — Celular e acessórios
- `casa-conectada` — Casa conectada
- `computador-e-home-office` — Computador e home office
- `seguranca-digital-da-familia` — Segurança digital da família
- `ia-no-dia-a-dia-do-pai` — IA no dia a dia do pai
- `games-e-filhos` — Games e filhos

**13. direitos-do-pai — Direitos do pai (#5C6B73)**
Descrição: "Licença-paternidade, registro, guarda, pensão, convivência e herança explicados em linguagem simples. Informação, não parecer jurídico."
Subcategorias (7):
- `licenca-paternidade-e-trabalho` — Licença-paternidade e trabalho
- `registro-e-documentos-do-filho` — Registro e documentos do filho
- `guarda-e-convivencia` — Guarda e convivência
- `pensao-alimenticia` — Pensão alimentícia
- `alienacao-parental` — Alienação parental
- `heranca-e-testamento` — Herança e testamento
- `escola-saude-e-direitos-do-filho` — Escola, saúde e direitos do filho

**14. historias-de-pai — Histórias de pai (#C2703A)**
Descrição: "Relatos reais de pais, avós e filhos. Lições, erros, conversões e vitórias contadas por quem viveu, para quem está vivendo."
Subcategorias (6):
- `meu-pai-me-ensinou` — Meu pai me ensinou
- `primeiros-dias` — Primeiros dias
- `conversao-e-fe` — Conversão e fé
- `recomeco` — Recomeço
- `pais-que-inspiram` — Pais que inspiram
- `cartas-ao-filho` — Cartas ao filho

### 3.4 SQL de seed da tabela `categories`

Vai dentro de `supabase/migrations/0002_blog.sql`, depois do `create table categories`. Assume as colunas do briefing (`id, slug, name, description, color, sort_order`) mais `parent_id`. Idempotente (`on conflict (slug) do update`).

```sql
-- 0002_blog.sql — seed da taxonomia (categorias-mãe e subcategorias)
alter table public.categories
  add column if not exists parent_id uuid null references public.categories(id) on delete set null,
  add column if not exists pillar text null check (pillar in ('casa','trabalho','corpo','alma'));

create index if not exists categories_parent_id_idx on public.categories(parent_id);

-- Categorias-mãe
insert into public.categories (slug, name, description, color, sort_order, pillar) values
('paternidade-por-fase', 'Paternidade por fase', 'O que o pai precisa saber e fazer em cada idade do filho, da gestação ao filho adulto. Marcos, rotina, saúde, limites e vínculo, fase por fase.', '#14505C', 10, 'casa'),
('casamento-e-familia', 'Casamento e família', 'Namoro, noivado, casamento e a vida a dois com filhos. Como ser marido, liderar servindo, cuidar da esposa e construir uma casa que dura.', '#8C3B4A', 20, 'casa'),
('provedor-e-carreira', 'Provedor e carreira', 'Trabalho, salário, mudança de emprego, empreender e liderar. O pai como provedor que sustenta a casa sem perder a casa de vista.', '#2E5E8C', 30, 'trabalho'),
('dinheiro-do-pai', 'Dinheiro do Pai', 'Orçamento familiar, dívidas, reserva, investimentos, moedas e bitcoin explicados para quem sustenta uma casa. Sem promessa de enriquecer rápido.', '#2F7D4F', 40, 'trabalho'),
('fe-e-virtude', 'Fé e virtude', 'Oração, sacramentos, virtudes e santos para o homem que quer ser santo no meio da família. São José como modelo do pai.', '#6B4C9A', 50, 'alma'),
('corpo-e-saude-do-homem', 'Corpo e saúde do homem', 'Check-up, sono, treino, alimentação, saúde mental e sexual do homem adulto. Informação séria para estar vivo e forte para a família.', '#1F7A7A', 60, 'corpo'),
('churrasco-e-cozinha', 'Churrasco e cozinha', 'Cortes de carne, fogo, facas, receitas e a cozinha do dia a dia. O pai que alimenta a família e reúne os amigos em volta da brasa.', '#B23A3A', 70, 'corpo'),
('caixa-de-ferramentas-e-reparos', 'Caixa de ferramentas e reparos', 'Ferramentas, reparos, elétrica, hidráulica e marcenaria para resolver a casa com as próprias mãos. Passo a passo e o que comprar.', '#D9822B', 80, 'corpo'),
('carro-e-moto', 'Carro e moto', 'Comprar, manter e dirigir com segurança. Carro de família, cadeirinha, revisão, documentação e ensinar o filho a dirigir.', '#3D4650', 90, 'corpo'),
('estilo-e-cuidados', 'Estilo e cuidados', 'Barba, cabelo, roupa, relógio e postura. Apresentar-se bem com simplicidade, para o trabalho, a missa e a vida.', '#7A5C3E', 100, 'corpo'),
('esporte-e-lazer-com-os-filhos', 'Esporte e lazer com os filhos', 'Futebol, bicicleta, pesca, acampamento, jogos e filmes. Ideias de vínculo pai e filho por idade, tempo e custo.', '#3F8F5A', 110, 'corpo'),
('tecnologia-do-pai', 'Tecnologia do Pai', 'Celular, controle parental, casa conectada, computador e inteligência artificial a serviço da família. Proteger os filhos e trabalhar melhor.', '#3A6EA5', 120, 'trabalho'),
('direitos-do-pai', 'Direitos do pai', 'Licença-paternidade, registro, guarda, pensão, convivência e herança explicados em linguagem simples. Informação, não parecer jurídico.', '#5C6B73', 130, 'casa'),
('historias-de-pai', 'Histórias de pai', 'Relatos reais de pais, avós e filhos. Lições, erros, conversões e vitórias contadas por quem viveu, para quem está vivendo.', '#C2703A', 140, 'casa')
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, color = excluded.color,
  sort_order = excluded.sort_order, pillar = excluded.pillar;

-- Subcategorias: herdam color e pillar da mãe
with sub(parent_slug, slug, name, pos) as (values
  -- 1. paternidade-por-fase
  ('paternidade-por-fase','gestacao-e-parto','Gestação e parto',1),
  ('paternidade-por-fase','recem-nascido','Recém-nascido (0 a 12 meses)',2),
  ('paternidade-por-fase','1-a-3-anos','1 a 3 anos',3),
  ('paternidade-por-fase','4-a-7-anos','4 a 7 anos',4),
  ('paternidade-por-fase','8-a-12-anos','8 a 12 anos',5),
  ('paternidade-por-fase','adolescencia','Adolescência (12 a 18)',6),
  ('paternidade-por-fase','filho-adulto','Filho adulto',7),
  -- 2. casamento-e-familia
  ('casamento-e-familia','namoro-e-noivado','Namoro e noivado',1),
  ('casamento-e-familia','preparacao-para-o-casamento','Preparação para o casamento',2),
  ('casamento-e-familia','vida-a-dois','Vida a dois',3),
  ('casamento-e-familia','comunicacao-e-conflitos','Comunicação e conflitos',4),
  ('casamento-e-familia','intimidade-conjugal','Intimidade conjugal',5),
  ('casamento-e-familia','rotina-da-casa','Rotina da casa',6),
  ('casamento-e-familia','familia-grande','Família grande e irmãos',7),
  -- 3. provedor-e-carreira
  ('provedor-e-carreira','primeiro-emprego-e-recolocacao','Primeiro emprego e recolocação',1),
  ('provedor-e-carreira','salario-e-negociacao','Salário e negociação',2),
  ('provedor-e-carreira','lideranca-no-trabalho','Liderança no trabalho',3),
  ('provedor-e-carreira','empreender-com-familia','Empreender com família',4),
  ('provedor-e-carreira','equilibrio-trabalho-e-casa','Equilíbrio entre trabalho e casa',5),
  ('provedor-e-carreira','habilidades-e-cursos','Habilidades e cursos',6),
  ('provedor-e-carreira','trabalho-remoto-e-home-office','Trabalho remoto e home office',7),
  -- 4. dinheiro-do-pai
  ('dinheiro-do-pai','orcamento-familiar','Orçamento familiar',1),
  ('dinheiro-do-pai','dividas-e-credito','Dívidas e crédito',2),
  ('dinheiro-do-pai','reserva-e-seguros','Reserva de emergência e seguros',3),
  ('dinheiro-do-pai','investimentos-para-a-familia','Investimentos para a família',4),
  ('dinheiro-do-pai','bitcoin-e-cripto','Bitcoin e cripto',5),
  ('dinheiro-do-pai','cambio-e-moedas','Câmbio e moedas',6),
  ('dinheiro-do-pai','casa-propria-e-financiamento','Casa própria e financiamento',7),
  ('dinheiro-do-pai','aposentadoria-e-sucessao','Aposentadoria e sucessão',8),
  -- 5. fe-e-virtude
  ('fe-e-virtude','oracao-do-pai','Oração do pai',1),
  ('fe-e-virtude','sacramentos-e-liturgia','Sacramentos e liturgia',2),
  ('fe-e-virtude','virtudes-masculinas','Virtudes masculinas',3),
  ('fe-e-virtude','sao-jose-e-os-santos','São José e os santos',4),
  ('fe-e-virtude','transmitir-a-fe-aos-filhos','Transmitir a fé aos filhos',5),
  ('fe-e-virtude','castidade-e-pureza','Castidade e pureza',6),
  ('fe-e-virtude','luto-e-esperanca','Luto e esperança',7),
  ('fe-e-virtude','vocacao-e-discernimento','Vocação e discernimento',8),
  -- 6. corpo-e-saude-do-homem
  ('corpo-e-saude-do-homem','check-up-por-idade','Check-up por idade',1),
  ('corpo-e-saude-do-homem','sono-e-energia','Sono e energia',2),
  ('corpo-e-saude-do-homem','treino-em-casa-e-academia','Treino em casa e na academia',3),
  ('corpo-e-saude-do-homem','alimentacao-do-homem','Alimentação do homem',4),
  ('corpo-e-saude-do-homem','saude-mental-e-estresse','Saúde mental e estresse',5),
  ('corpo-e-saude-do-homem','saude-sexual-e-prostata','Saúde sexual e próstata',6),
  ('corpo-e-saude-do-homem','vicios-e-liberdade','Vícios e liberdade',7),
  ('corpo-e-saude-do-homem','primeiros-socorros-em-casa','Primeiros socorros em casa',8),
  -- 7. churrasco-e-cozinha
  ('churrasco-e-cozinha','cortes-de-carne','Cortes de carne',1),
  ('churrasco-e-cozinha','tecnicas-de-churrasco','Técnicas de churrasco',2),
  ('churrasco-e-cozinha','churrasqueiras-facas-e-acessorios','Churrasqueiras, facas e acessórios',3),
  ('churrasco-e-cozinha','receitas-de-churrasco','Receitas de churrasco',4),
  ('churrasco-e-cozinha','cozinha-do-dia-a-dia','Cozinha do dia a dia',5),
  ('churrasco-e-cozinha','cafe-da-manha-e-lanche-dos-filhos','Café da manhã e lanche dos filhos',6),
  ('churrasco-e-cozinha','bebidas-e-harmonizacao','Bebidas e harmonização',7),
  ('churrasco-e-cozinha','cozinhar-com-os-filhos','Cozinhar com os filhos',8),
  -- 8. caixa-de-ferramentas-e-reparos
  ('caixa-de-ferramentas-e-reparos','ferramentas-essenciais','Ferramentas essenciais',1),
  ('caixa-de-ferramentas-e-reparos','eletrica-basica','Elétrica básica',2),
  ('caixa-de-ferramentas-e-reparos','hidraulica-e-vazamentos','Hidráulica e vazamentos',3),
  ('caixa-de-ferramentas-e-reparos','pintura-e-acabamento','Pintura e acabamento',4),
  ('caixa-de-ferramentas-e-reparos','marcenaria-e-montagem','Marcenaria e montagem',5),
  ('caixa-de-ferramentas-e-reparos','jardim-e-quintal','Jardim e quintal',6),
  ('caixa-de-ferramentas-e-reparos','seguranca-da-casa','Segurança da casa',7),
  ('caixa-de-ferramentas-e-reparos','projetos-com-os-filhos','Projetos com os filhos',8),
  -- 9. carro-e-moto
  ('carro-e-moto','carro-de-familia','Carro de família',1),
  ('carro-e-moto','manutencao-e-revisao','Manutenção e revisão',2),
  ('carro-e-moto','seguranca-e-cadeirinha','Segurança e cadeirinha',3),
  ('carro-e-moto','documentos-multas-e-seguro','Documentos, multas e seguro',4),
  ('carro-e-moto','viagem-de-carro-com-filhos','Viagem de carro com filhos',5),
  ('carro-e-moto','moto-no-dia-a-dia','Moto no dia a dia',6),
  ('carro-e-moto','ensinar-o-filho-a-dirigir','Ensinar o filho a dirigir',7),
  -- 10. estilo-e-cuidados
  ('estilo-e-cuidados','barba-e-cabelo','Barba e cabelo',1),
  ('estilo-e-cuidados','guarda-roupa-essencial','Guarda-roupa essencial',2),
  ('estilo-e-cuidados','sapatos-e-relogios','Sapatos e relógios',3),
  ('estilo-e-cuidados','higiene-e-pele','Higiene e pele',4),
  ('estilo-e-cuidados','como-se-vestir-por-ocasiao','Como se vestir por ocasião',5),
  ('estilo-e-cuidados','etiqueta-e-postura','Etiqueta e postura',6),
  ('estilo-e-cuidados','cuidar-dos-filhos-no-dia-a-dia','Cuidar dos filhos no dia a dia',7),
  -- 11. esporte-e-lazer-com-os-filhos
  ('esporte-e-lazer-com-os-filhos','atividades-por-idade','Atividades por idade',1),
  ('esporte-e-lazer-com-os-filhos','fim-de-semana-de-940','Fim de semana de 940',2),
  ('esporte-e-lazer-com-os-filhos','futebol-e-esportes-coletivos','Futebol e esportes coletivos',3),
  ('esporte-e-lazer-com-os-filhos','bicicleta-natacao-e-corrida','Bicicleta, natação e corrida',4),
  ('esporte-e-lazer-com-os-filhos','pesca-acampamento-e-natureza','Pesca, acampamento e natureza',5),
  ('esporte-e-lazer-com-os-filhos','jogos-de-mesa-e-brincadeiras','Jogos de mesa e brincadeiras',6),
  ('esporte-e-lazer-com-os-filhos','filmes-livros-e-musica','Filmes, livros e música',7),
  ('esporte-e-lazer-com-os-filhos','viagens-em-familia','Viagens em família',8),
  -- 12. tecnologia-do-pai
  ('tecnologia-do-pai','controle-parental-e-telas','Controle parental e telas',1),
  ('tecnologia-do-pai','celular-e-acessorios','Celular e acessórios',2),
  ('tecnologia-do-pai','casa-conectada','Casa conectada',3),
  ('tecnologia-do-pai','computador-e-home-office','Computador e home office',4),
  ('tecnologia-do-pai','seguranca-digital-da-familia','Segurança digital da família',5),
  ('tecnologia-do-pai','ia-no-dia-a-dia-do-pai','IA no dia a dia do pai',6),
  ('tecnologia-do-pai','games-e-filhos','Games e filhos',7),
  -- 13. direitos-do-pai
  ('direitos-do-pai','licenca-paternidade-e-trabalho','Licença-paternidade e trabalho',1),
  ('direitos-do-pai','registro-e-documentos-do-filho','Registro e documentos do filho',2),
  ('direitos-do-pai','guarda-e-convivencia','Guarda e convivência',3),
  ('direitos-do-pai','pensao-alimenticia','Pensão alimentícia',4),
  ('direitos-do-pai','alienacao-parental','Alienação parental',5),
  ('direitos-do-pai','heranca-e-testamento','Herança e testamento',6),
  ('direitos-do-pai','escola-saude-e-direitos-do-filho','Escola, saúde e direitos do filho',7),
  -- 14. historias-de-pai
  ('historias-de-pai','meu-pai-me-ensinou','Meu pai me ensinou',1),
  ('historias-de-pai','primeiros-dias','Primeiros dias',2),
  ('historias-de-pai','conversao-e-fe','Conversão e fé',3),
  ('historias-de-pai','recomeco','Recomeço',4),
  ('historias-de-pai','pais-que-inspiram','Pais que inspiram',5),
  ('historias-de-pai','cartas-ao-filho','Cartas ao filho',6)
)
insert into public.categories (slug, name, description, color, sort_order, pillar, parent_id)
select s.slug, s.name, p.name || ' — ' || s.name || '.', p.color, p.sort_order * 10 + s.pos, p.pillar, p.id
from sub s
join public.categories p on p.slug = s.parent_slug
on conflict (slug) do update set
  name = excluded.name, color = excluded.color, sort_order = excluded.sort_order,
  pillar = excluded.pillar, parent_id = excluded.parent_id;
```

Critério de aceite: `select count(*) from categories where parent_id is null` = 14; `select count(*) from categories where parent_id is not null` = 103; nenhuma subcategoria com `color` diferente da mãe.

### 3.5 A mesma taxonomia em JSON

Arquivo: `src/content/taxonomia.json`. É a fonte para o menu, os filtros de `/blog`, o seletor do editor Tiptap no `/admin` e o prompt das rotinas de geração. Deve bater byte a byte com o SQL (teste em `scripts/check-taxonomia.mjs`: compara slugs do JSON com `select slug from categories`).

```json
{
  "version": "1.0",
  "pillars": [
    { "slug": "casa", "name": "Casa", "question": "Como cuido da minha família?" },
    { "slug": "trabalho", "name": "Trabalho", "question": "Como provejo e prospero?" },
    { "slug": "corpo", "name": "Corpo", "question": "Como cuido de mim e do que é meu?" },
    { "slug": "alma", "name": "Alma", "question": "Como me torno o homem que Deus quer?" }
  ],
  "categories": [
    { "slug": "paternidade-por-fase", "name": "Paternidade por fase", "color": "#14505C", "pillar": "casa", "sort_order": 10,
      "description": "O que o pai precisa saber e fazer em cada idade do filho, da gestação ao filho adulto. Marcos, rotina, saúde, limites e vínculo, fase por fase.",
      "subcategories": [
        { "slug": "gestacao-e-parto", "name": "Gestação e parto" },
        { "slug": "recem-nascido", "name": "Recém-nascido (0 a 12 meses)" },
        { "slug": "1-a-3-anos", "name": "1 a 3 anos" },
        { "slug": "4-a-7-anos", "name": "4 a 7 anos" },
        { "slug": "8-a-12-anos", "name": "8 a 12 anos" },
        { "slug": "adolescencia", "name": "Adolescência (12 a 18)" },
        { "slug": "filho-adulto", "name": "Filho adulto" }
      ] },
    { "slug": "casamento-e-familia", "name": "Casamento e família", "color": "#8C3B4A", "pillar": "casa", "sort_order": 20,
      "description": "Namoro, noivado, casamento e a vida a dois com filhos. Como ser marido, liderar servindo, cuidar da esposa e construir uma casa que dura.",
      "subcategories": [
        { "slug": "namoro-e-noivado", "name": "Namoro e noivado" },
        { "slug": "preparacao-para-o-casamento", "name": "Preparação para o casamento" },
        { "slug": "vida-a-dois", "name": "Vida a dois" },
        { "slug": "comunicacao-e-conflitos", "name": "Comunicação e conflitos" },
        { "slug": "intimidade-conjugal", "name": "Intimidade conjugal" },
        { "slug": "rotina-da-casa", "name": "Rotina da casa" },
        { "slug": "familia-grande", "name": "Família grande e irmãos" }
      ] },
    { "slug": "provedor-e-carreira", "name": "Provedor e carreira", "color": "#2E5E8C", "pillar": "trabalho", "sort_order": 30,
      "description": "Trabalho, salário, mudança de emprego, empreender e liderar. O pai como provedor que sustenta a casa sem perder a casa de vista.",
      "subcategories": [
        { "slug": "primeiro-emprego-e-recolocacao", "name": "Primeiro emprego e recolocação" },
        { "slug": "salario-e-negociacao", "name": "Salário e negociação" },
        { "slug": "lideranca-no-trabalho", "name": "Liderança no trabalho" },
        { "slug": "empreender-com-familia", "name": "Empreender com família" },
        { "slug": "equilibrio-trabalho-e-casa", "name": "Equilíbrio entre trabalho e casa" },
        { "slug": "habilidades-e-cursos", "name": "Habilidades e cursos" },
        { "slug": "trabalho-remoto-e-home-office", "name": "Trabalho remoto e home office" }
      ] },
    { "slug": "dinheiro-do-pai", "name": "Dinheiro do Pai", "color": "#2F7D4F", "pillar": "trabalho", "sort_order": 40,
      "description": "Orçamento familiar, dívidas, reserva, investimentos, moedas e bitcoin explicados para quem sustenta uma casa. Sem promessa de enriquecer rápido.",
      "subcategories": [
        { "slug": "orcamento-familiar", "name": "Orçamento familiar" },
        { "slug": "dividas-e-credito", "name": "Dívidas e crédito" },
        { "slug": "reserva-e-seguros", "name": "Reserva de emergência e seguros" },
        { "slug": "investimentos-para-a-familia", "name": "Investimentos para a família" },
        { "slug": "bitcoin-e-cripto", "name": "Bitcoin e cripto" },
        { "slug": "cambio-e-moedas", "name": "Câmbio e moedas" },
        { "slug": "casa-propria-e-financiamento", "name": "Casa própria e financiamento" },
        { "slug": "aposentadoria-e-sucessao", "name": "Aposentadoria e sucessão" }
      ] },
    { "slug": "fe-e-virtude", "name": "Fé e virtude", "color": "#6B4C9A", "pillar": "alma", "sort_order": 50,
      "description": "Oração, sacramentos, virtudes e santos para o homem que quer ser santo no meio da família. São José como modelo do pai.",
      "subcategories": [
        { "slug": "oracao-do-pai", "name": "Oração do pai" },
        { "slug": "sacramentos-e-liturgia", "name": "Sacramentos e liturgia" },
        { "slug": "virtudes-masculinas", "name": "Virtudes masculinas" },
        { "slug": "sao-jose-e-os-santos", "name": "São José e os santos" },
        { "slug": "transmitir-a-fe-aos-filhos", "name": "Transmitir a fé aos filhos" },
        { "slug": "castidade-e-pureza", "name": "Castidade e pureza" },
        { "slug": "luto-e-esperanca", "name": "Luto e esperança" },
        { "slug": "vocacao-e-discernimento", "name": "Vocação e discernimento" }
      ] },
    { "slug": "corpo-e-saude-do-homem", "name": "Corpo e saúde do homem", "color": "#1F7A7A", "pillar": "corpo", "sort_order": 60,
      "description": "Check-up, sono, treino, alimentação, saúde mental e sexual do homem adulto. Informação séria para estar vivo e forte para a família.",
      "subcategories": [
        { "slug": "check-up-por-idade", "name": "Check-up por idade" },
        { "slug": "sono-e-energia", "name": "Sono e energia" },
        { "slug": "treino-em-casa-e-academia", "name": "Treino em casa e na academia" },
        { "slug": "alimentacao-do-homem", "name": "Alimentação do homem" },
        { "slug": "saude-mental-e-estresse", "name": "Saúde mental e estresse" },
        { "slug": "saude-sexual-e-prostata", "name": "Saúde sexual e próstata" },
        { "slug": "vicios-e-liberdade", "name": "Vícios e liberdade" },
        { "slug": "primeiros-socorros-em-casa", "name": "Primeiros socorros em casa" }
      ] },
    { "slug": "churrasco-e-cozinha", "name": "Churrasco e cozinha", "color": "#B23A3A", "pillar": "corpo", "sort_order": 70,
      "description": "Cortes de carne, fogo, facas, receitas e a cozinha do dia a dia. O pai que alimenta a família e reúne os amigos em volta da brasa.",
      "subcategories": [
        { "slug": "cortes-de-carne", "name": "Cortes de carne" },
        { "slug": "tecnicas-de-churrasco", "name": "Técnicas de churrasco" },
        { "slug": "churrasqueiras-facas-e-acessorios", "name": "Churrasqueiras, facas e acessórios" },
        { "slug": "receitas-de-churrasco", "name": "Receitas de churrasco" },
        { "slug": "cozinha-do-dia-a-dia", "name": "Cozinha do dia a dia" },
        { "slug": "cafe-da-manha-e-lanche-dos-filhos", "name": "Café da manhã e lanche dos filhos" },
        { "slug": "bebidas-e-harmonizacao", "name": "Bebidas e harmonização" },
        { "slug": "cozinhar-com-os-filhos", "name": "Cozinhar com os filhos" }
      ] },
    { "slug": "caixa-de-ferramentas-e-reparos", "name": "Caixa de ferramentas e reparos", "color": "#D9822B", "pillar": "corpo", "sort_order": 80,
      "description": "Ferramentas, reparos, elétrica, hidráulica e marcenaria para resolver a casa com as próprias mãos. Passo a passo e o que comprar.",
      "subcategories": [
        { "slug": "ferramentas-essenciais", "name": "Ferramentas essenciais" },
        { "slug": "eletrica-basica", "name": "Elétrica básica" },
        { "slug": "hidraulica-e-vazamentos", "name": "Hidráulica e vazamentos" },
        { "slug": "pintura-e-acabamento", "name": "Pintura e acabamento" },
        { "slug": "marcenaria-e-montagem", "name": "Marcenaria e montagem" },
        { "slug": "jardim-e-quintal", "name": "Jardim e quintal" },
        { "slug": "seguranca-da-casa", "name": "Segurança da casa" },
        { "slug": "projetos-com-os-filhos", "name": "Projetos com os filhos" }
      ] },
    { "slug": "carro-e-moto", "name": "Carro e moto", "color": "#3D4650", "pillar": "corpo", "sort_order": 90,
      "description": "Comprar, manter e dirigir com segurança. Carro de família, cadeirinha, revisão, documentação e ensinar o filho a dirigir.",
      "subcategories": [
        { "slug": "carro-de-familia", "name": "Carro de família" },
        { "slug": "manutencao-e-revisao", "name": "Manutenção e revisão" },
        { "slug": "seguranca-e-cadeirinha", "name": "Segurança e cadeirinha" },
        { "slug": "documentos-multas-e-seguro", "name": "Documentos, multas e seguro" },
        { "slug": "viagem-de-carro-com-filhos", "name": "Viagem de carro com filhos" },
        { "slug": "moto-no-dia-a-dia", "name": "Moto no dia a dia" },
        { "slug": "ensinar-o-filho-a-dirigir", "name": "Ensinar o filho a dirigir" }
      ] },
    { "slug": "estilo-e-cuidados", "name": "Estilo e cuidados", "color": "#7A5C3E", "pillar": "corpo", "sort_order": 100,
      "description": "Barba, cabelo, roupa, relógio e postura. Apresentar-se bem com simplicidade, para o trabalho, a missa e a vida.",
      "subcategories": [
        { "slug": "barba-e-cabelo", "name": "Barba e cabelo" },
        { "slug": "guarda-roupa-essencial", "name": "Guarda-roupa essencial" },
        { "slug": "sapatos-e-relogios", "name": "Sapatos e relógios" },
        { "slug": "higiene-e-pele", "name": "Higiene e pele" },
        { "slug": "como-se-vestir-por-ocasiao", "name": "Como se vestir por ocasião" },
        { "slug": "etiqueta-e-postura", "name": "Etiqueta e postura" },
        { "slug": "cuidar-dos-filhos-no-dia-a-dia", "name": "Cuidar dos filhos no dia a dia" }
      ] },
    { "slug": "esporte-e-lazer-com-os-filhos", "name": "Esporte e lazer com os filhos", "color": "#3F8F5A", "pillar": "corpo", "sort_order": 110,
      "description": "Futebol, bicicleta, pesca, acampamento, jogos e filmes. Ideias de vínculo pai e filho por idade, tempo e custo.",
      "subcategories": [
        { "slug": "atividades-por-idade", "name": "Atividades por idade" },
        { "slug": "fim-de-semana-de-940", "name": "Fim de semana de 940" },
        { "slug": "futebol-e-esportes-coletivos", "name": "Futebol e esportes coletivos" },
        { "slug": "bicicleta-natacao-e-corrida", "name": "Bicicleta, natação e corrida" },
        { "slug": "pesca-acampamento-e-natureza", "name": "Pesca, acampamento e natureza" },
        { "slug": "jogos-de-mesa-e-brincadeiras", "name": "Jogos de mesa e brincadeiras" },
        { "slug": "filmes-livros-e-musica", "name": "Filmes, livros e música" },
        { "slug": "viagens-em-familia", "name": "Viagens em família" }
      ] },
    { "slug": "tecnologia-do-pai", "name": "Tecnologia do Pai", "color": "#3A6EA5", "pillar": "trabalho", "sort_order": 120,
      "description": "Celular, controle parental, casa conectada, computador e inteligência artificial a serviço da família. Proteger os filhos e trabalhar melhor.",
      "subcategories": [
        { "slug": "controle-parental-e-telas", "name": "Controle parental e telas" },
        { "slug": "celular-e-acessorios", "name": "Celular e acessórios" },
        { "slug": "casa-conectada", "name": "Casa conectada" },
        { "slug": "computador-e-home-office", "name": "Computador e home office" },
        { "slug": "seguranca-digital-da-familia", "name": "Segurança digital da família" },
        { "slug": "ia-no-dia-a-dia-do-pai", "name": "IA no dia a dia do pai" },
        { "slug": "games-e-filhos", "name": "Games e filhos" }
      ] },
    { "slug": "direitos-do-pai", "name": "Direitos do pai", "color": "#5C6B73", "pillar": "casa", "sort_order": 130,
      "description": "Licença-paternidade, registro, guarda, pensão, convivência e herança explicados em linguagem simples. Informação, não parecer jurídico.",
      "subcategories": [
        { "slug": "licenca-paternidade-e-trabalho", "name": "Licença-paternidade e trabalho" },
        { "slug": "registro-e-documentos-do-filho", "name": "Registro e documentos do filho" },
        { "slug": "guarda-e-convivencia", "name": "Guarda e convivência" },
        { "slug": "pensao-alimenticia", "name": "Pensão alimentícia" },
        { "slug": "alienacao-parental", "name": "Alienação parental" },
        { "slug": "heranca-e-testamento", "name": "Herança e testamento" },
        { "slug": "escola-saude-e-direitos-do-filho", "name": "Escola, saúde e direitos do filho" }
      ] },
    { "slug": "historias-de-pai", "name": "Histórias de pai", "color": "#C2703A", "pillar": "casa", "sort_order": 140,
      "description": "Relatos reais de pais, avós e filhos. Lições, erros, conversões e vitórias contadas por quem viveu, para quem está vivendo.",
      "subcategories": [
        { "slug": "meu-pai-me-ensinou", "name": "Meu pai me ensinou" },
        { "slug": "primeiros-dias", "name": "Primeiros dias" },
        { "slug": "conversao-e-fe", "name": "Conversão e fé" },
        { "slug": "recomeco", "name": "Recomeço" },
        { "slug": "pais-que-inspiram", "name": "Pais que inspiram" },
        { "slug": "cartas-ao-filho", "name": "Cartas ao filho" }
      ] }
  ]
}
```

### 3.6 Filtros secundários (não são categorias)

Em `/blog`, além do pilar e da categoria, existem dois filtros que leem outros campos:

- **Por idade do filho** (hub `/blog/por-idade`): lê as subcategorias de `paternidade-por-fase` e também a tag `idade:<faixa>` em `post_tags` para artigos de outras categorias (ex.: um artigo de churrasco "cozinhar com filho de 4 anos" leva a tag `idade:4-a-7-anos`).
- **Por verbo** (inspirado no Primer): tags fixas `verbo:viver`, `verbo:ganhar`, `verbo:gastar`, `verbo:aprender`, `verbo:investir`, `verbo:treinar`, `verbo:amar`. Opcionais; a rotina atribui 1 a 2 por artigo.

### 3.7 Franquias editoriais (séries com slug fixo)

Séries recorrentes, com template próprio, identificadas pela tag `serie:<slug>`:

| Tag | Nome | Cadência | Categoria-base |
|---|---|---|---|
| `serie:jogada-do-dia` | Jogada do Dia | diária (e-mail + post curto) | esporte-e-lazer-com-os-filhos / atividades-por-idade |
| `serie:fim-de-semana-de-940` | Fim de semana de 940 | semanal (sexta) | esporte-e-lazer-com-os-filhos / fim-de-semana-de-940 |
| `serie:virtude-da-semana` | Virtude da semana | semanal (segunda) | fe-e-virtude / virtudes-masculinas |
| `serie:corte-da-semana` | Corte da semana | semanal (quinta) | churrasco-e-cozinha / cortes-de-carne |
| `serie:1-produto-3-orcamentos` | 1 produto, 3 orçamentos | semanal | Pai Indica (kind comparativo) |
| `serie:meu-pai-me-ensinou` | Meu pai me ensinou | mensal (chamada à comunidade) | historias-de-pai / meu-pai-me-ensinou |
| `serie:check-up-do-mes` | Check-up do mês | mensal | corpo-e-saude-do-homem / check-up-por-idade |

---

## 4. Linha editorial obrigatória e proibições

### 4.1 A visão de família (herdada do grupo, sem exceção)

O Vocação de Pai é um site católico de família tradicional. Isso significa, na prática:

- Família é pai, mãe e filhos. Casamento é entre um homem e uma mulher, indissolúvel, aberto à vida.
- O pai é chamado a ser **líder servidor** da casa: autoridade que se exerce servindo, protegendo, provendo e dando o exemplo. São José é o modelo.
- A esposa é tratada sempre com honra. Nunca piada, nunca rivalidade "homem contra mulher", nunca a esposa como adversária ou "chefe".
- Os filhos são dom, não fardo. Nunca linguagem que trate filho como custo, atraso de vida ou problema.
- A fé atravessa todas as categorias, mas sem forçar: um artigo de elétrica básica não precisa de versículo; um artigo sobre pornografia precisa de doutrina.
- Pais separados, viúvos e solteiros são acolhidos com caridade e sem julgamento, mas o site nunca apresenta separação, "recomeço com nova família" ou união estável como equivalentes ao casamento.
- Linguagem de gênero: usar "pai e mãe", "homem e mulher", "marido e esposa". Nunca "parceiro(a)", "cuidador(a)", "pessoa gestante", "famílias diversas", "parentalidade" como substituto de paternidade/maternidade.

### 4.2 Imagens

- Nunca imagem que mostre ou sugira casal do mesmo sexo ou qualquer conteúdo LGBTQI. Vale para capa, imagens inline, cards de produto, thumbnails de vídeo, stories de Instagram.
- Descrição/alt-text da API (Pexels, Pixabay, Unsplash) **não é confiável** para garantir isso (caso real no Vocação de Mãe). Por padrão, preferir fotos com **um homem sozinho**, **um homem com uma criança** (claramente pai e filho) ou **só a criança / só o objeto**.
- Quando a cena pedir casal (casamento, gestação, parto), usar imagem que mostre claramente um homem e uma mulher pelo enquadramento, ou pedir confirmação visual do dono antes de publicar.
- Buscas de imagem evitadas: "couple", "parents", "family" sem qualificador, "pride", "partners". Buscas preferidas: "father and son", "father and daughter", "man working", "man grilling", "man praying", "dad baby".
- Sem imagem de mulher em roupa sensual, sem fotos de festa com bebida em excesso, sem armas apontadas, sem cigarro/vape como estilo.
- Fotos de produto: oficiais da marca ou da Amazon em alta. Nunca logos de marcas alteradas.

### 4.3 Lista de PROIBIÇÕES explícitas

O validador (`scripts/validate-content.mjs`, Fase 8) bloqueia publicação quando detecta os itens marcados com [auto]. Os demais são checados por leitura humana/da rotina editora.

1. **Conteúdo ou imagem LGBTQI** [auto por lista de termos + revisão de imagem]: nada de casais do mesmo sexo, ideologia de gênero, "orgulho", transição, pronomes neutros. Nem para "debater".
2. **Vulgaridade e palavrão** [auto]: sem palavrão, sem gíria sexual, sem piada de duplo sentido. Humor existe (seção Piadas de Pai), mas é limpo.
3. **Machismo tóxico**: sem desprezo pela mulher, sem "mulher tem que", sem "alfa/beta", sem "red pill", sem conteúdo de sedução/pickup, sem ridicularizar homens sensíveis nem homens práticos. Firmeza sem brutalidade.
4. **Pornografia e erotismo**: nenhuma imagem ou texto erótico. O tema pornografia aparece só como vício a vencer (categoria Vícios e liberdade, Castidade e pureza).
5. **Apostas e jogos de azar** [auto]: nenhuma menção promocional a bets, cassino, tigrinho, loteria como investimento, "renda extra apostando". Nem anúncio, nem afiliado. Aparece só como alerta de vício.
6. **Violência**: nenhum incentivo a violência doméstica, castigo físico, briga, arma como símbolo de masculinidade. Defesa da casa é tratada com seriedade (segurança da casa), não com fetiche.
7. **Preço exato em reais** [auto]: nunca "R$ 299,90". Sempre faixa pesquisada na internet em 2 lojas (`price_min`/`price_max`, descartar se `max > 3 × min`), com a frase "faixa consultada na internet, não é o preço da Amazon". Botão sempre "Comprar agora na Amazon".
8. **Promessa médica sem aviso** [auto por categoria]: todo artigo de `corpo-e-saude-do-homem` e de saúde do filho traz o aviso automático do layout ("Conteúdo informativo. Não substitui consulta com médico.") e a seção "Quando procurar um profissional". Nunca "cura", "trata", "elimina", "comprovado" sem fonte.
9. **Promessa jurídica sem aviso** [auto por categoria]: todo artigo de `direitos-do-pai` traz o aviso ("Informação geral. Cada caso é um caso: procure um advogado ou a Defensoria Pública.") e cita a lei com número e ano. Nunca "você tem direito garantido a", nunca modelo de petição como se bastasse.
10. **Promessa financeira** [auto por categoria]: todo artigo de `dinheiro-do-pai` traz o aviso ("Conteúdo educativo. Não é recomendação de investimento.") Nunca "renda garantida", "multiplique", "fique rico", "sinal de compra". Bitcoin é explicado, não vendido.
11. **Política partidária**: sem candidato, partido, eleição. Temas morais (vida, família, liberdade religiosa) são tratados pela doutrina, não pelo partido.
12. **Alegação de teste que não houve**: nunca "testamos" sem `review.tested = true`. Padrão: "análise de especificações, fontes especializadas e relatos públicos de consumidores fora da Amazon".
13. **Menção a IA como autora**: o site não diz que o conteúdo é produzido com apoio de inteligência artificial (regra do grupo). Não autoriza mentir: nenhuma experiência pessoal inventada. IA como assunto (categoria Tecnologia do Pai) pode e deve aparecer.
14. **Medicamento, suplemento milagroso, álcool e tabaco como afiliado**: produtos da Loja do Pai nunca incluem remédio, "pré-treino milagroso", cigarro, vape, bebida destilada. Cerveja e vinho aparecem só em contexto de harmonização e moderação, sem link de afiliado.
15. **Dados pessoais de terceiros e exposição de filhos**: histórias e perguntas da comunidade são moderadas; nenhum nome completo de criança, nenhuma foto de rosto de menor sem ser o próprio filho do autor com consentimento marcado.
16. **Clickbait e superlativos vazios** [auto]: proibidos "imperdível", "o melhor do mundo", "você não vai acreditar", "corra", "promoção relâmpago".
17. **Palavra "guia"** [auto]: o site usa "artigo" (regra do grupo). Exceções: nomes próprios e manuais de produto. Fica também "Guia Interativo de Cortes" como nome da ferramenta, por decisão deste plano, única exceção nomeada.

### 4.4 Avisos automáticos do layout (componente `ContentNotice`)

| Categoria/kind | Texto fixo |
|---|---|
| corpo-e-saude-do-homem, qualquer artigo com tag `saude` | "Conteúdo informativo. Não substitui consulta com médico. Em emergência, ligue 192 (SAMU)." |
| direitos-do-pai | "Informação geral sobre a lei brasileira. Cada caso é um caso: procure um advogado ou a Defensoria Pública da sua cidade." |
| dinheiro-do-pai, ferramenta mercado-financeiro, conversor-de-moedas | "Conteúdo educativo. Não é recomendação de investimento. Cotações têm atraso e podem variar." |
| kind review/comparativo/lista, qualquer página com `affiliate_url` | "O Vocação de Pai participa do Programa de Associados da Amazon. Quando você compra pelos nossos links, recebemos uma comissão, sem custo extra para você. Isso não muda a nota." |
| fe-e-virtude (temas de luto, vício, depressão) | "Se você está em sofrimento, fale com alguém hoje: CVV 188 (24h) ou o padre da sua paróquia." |

---

## 5. Tom de voz

### 5.1 Em uma frase

Fala como um irmão mais velho que já passou por aquilo: direto, prático, firme, com humor limpo e sem sermão desnecessário. Segunda pessoa ("você"), frases curtas, verbo no imperativo quando é instrução.

### 5.2 Dez pares "assim sim / assim não"

| # | Assim sim | Assim não | Por quê |
|---|---|---|---|
| 1 | "Segure o bebê com a cabeça apoiada no seu antebraço. Pronto, você já sabe mais do que achava." | "Muitos papais de primeira viagem ficam perdidinhos com o neném, mas calma!" | Trata o homem como adulto capaz; sem diminutivo, sem "papai". |
| 2 | "Picanha boa tem capa de gordura de um dedo, branca e firme. Amarelada e mole: deixe no balcão." | "Escolher a picanha perfeita pode ser um verdadeiro desafio para quem está começando nessa jornada." | Resposta primeiro, sem enrolação, sem "jornada". |
| 3 | "Sua esposa não é sua adversária. Se a conversa virou disputa, pare e recomece amanhã cedo." | "Mulher é assim mesmo, melhor nem discutir." | Honra à esposa; firmeza sem machismo. |
| 4 | "Esse artigo serve para pai de filho de 4 a 7 anos. Se o seu tem 12, leia este outro." | "Dicas valiosas para pais de todas as idades!" | Para quem é e para quem não é. |
| 5 | "A furadeira X faz o serviço em parede de tijolo; em concreto ela apanha. Nota 7,4." | "A furadeira X é simplesmente incrível e vai revolucionar seus projetos!" | Honestidade; defeito com o mesmo peso do elogio. |
| 6 | "Reze um Pai-Nosso com os filhos antes de dormir. Dois minutos. Todo dia. Isso constrói mais do que um sermão por mês." | "Você PRECISA ser o sacerdote do seu lar, senão sua família vai se perder!" | Fé proposta com concretude, não com ameaça. |
| 7 | "Guarda compartilhada não é 'fim de semana sim, fim de semana não'. É decisão conjunta sobre escola, saúde e fé. Veja o que a lei 13.058/2014 diz, e procure um advogado para o seu caso." | "Pai separado perde tudo, a justiça é toda a favor da mãe." | Informação com fonte e aviso; sem vitimismo. |
| 8 | "Faixa de preço consultada na internet: entre R$ 180 e R$ 260. Comprar agora na Amazon." | "Por apenas R$ 199,90! Corra, promoção imperdível!" | Faixa, nunca exato; sem clickbait. |
| 9 | "Faltam 612 fins de semana até seu filho fazer 18. Este sábado: pescaria no lago da cidade, custa quase nada." | "Aproveite cada momento mágico com seu pequeno!" | Número concreto e ação; sem açúcar. |
| 10 | "Se você assiste pornografia, você não é um monstro. É um homem com um vício, e vício se vence com método, confissão e irmãos. Comece aqui." | "Pornografia é pecado grave e ponto final." / "É normal, todo homem vê." | Verdade com caridade; nem condenação seca nem relativismo. |

### 5.3 Vocabulário do site

**Palavras que usamos:**
pai, filho, filha, esposa, marido, casa, família, provedor, líder servidor, vocação, virtude, irmão (membro da Irmandade), formação, trilha, desafio, jogada do dia, semáforo do pai, artigo, review, comparativo, faixa de preço, custo-benefício, vale a pena, para quem é, pontos de atenção, ficha técnica, passo a passo, a partir de, na prática, sinal verde, sinal de atenção, sinal de alerta, próximo passo, continue lendo, Comprar agora na Amazon.

**Palavras que evitamos (e a substituição):**

| Evitar | Usar |
|---|---|
| papai, paizão, paizinho | pai |
| parceiro(a), companheiro(a) | esposa, marido |
| parentalidade, cuidador | paternidade, pai |
| famílias diversas, novos arranjos | família |
| jornada, empoderado, mindset, hacks, insights, top, trend | caminho, firme, cabeça, truques, aprendizados, melhor, tendência |
| guia (como formato) | artigo |
| dicas valiosas, incríveis, imperdível | (apagar; dizer o que é) |
| o melhor do mundo, revolucionário | nota e motivo |
| promoção, oferta relâmpago, corra | faixa de preço, oferta que vale |
| testamos (sem teste) | analisamos |
| alfa, beta, red pill, macho | homem, pai |
| "mulher é assim", "elas sempre" | (apagar) |
| gestante como pessoa, "pessoa que amamenta" | sua esposa, a mãe |
| tóxico (relação), gatilho | difícil, ferida |
| renda passiva garantida, multiplicar | investir, guardar, planejar |
| IA gerou, nosso assistente de IA | (não mencionar) |

### 5.4 Regras de forma

- Títulos em frase ou pergunta, com a entidade principal no início. `seo_title` até 62 caracteres.
- Parágrafos de até 4 linhas. Um H2 a cada 150 a 250 palavras. Nunca H1 no corpo.
- Números por extenso até nove, algarismos de 10 em diante; unidades sempre (g, kg, min, km).
- Listas numeradas para passo a passo; marcadores para opções.
- Semáforo do pai (3 callouts, nesta ordem): `tone: "ok"` começando por "Sinal verde: ", `tone: "warn"` começando por "Sinal de atenção: ", `tone: "bad"` começando por "Sinal de alerta: ". Obrigatório em saúde, direito, dinheiro e segurança.
- Fechamento: 1 parágrafo de reforço + parágrafo "Continue lendo: " com 4 a 10 links internos separados por ", " e " e ", terminando em ".".

---

## 6. Nomes oficiais das seções e posicionamento de cada uma

Nomes, rotas e slogans são fixos (DECISÕES FIXAS). A frase de posicionamento vai no `<h1>`/subtítulo da página índice de cada seção e no menu (atributo `title`).

| Seção | Rota índice | Frase de posicionamento |
|---|---|---|
| **Blog** | `/blog` | "Tudo o que um pai precisa saber, fase por fase e assunto por assunto, escrito para homem adulto." |
| **Pai Indica** | `/pai-indica` | "Reviews honestos de produto para a casa, o carro, a churrasqueira e o filho: nota de 0 a 10, prós, contras e para quem é." |
| **Loja do Pai** — slogan "O pai também quer desconto" | `/loja` | "Produtos que a gente indicaria para um irmão, com faixa de preço pesquisada e botão direto para a Amazon." |
| **Caixa de Ferramentas** | `/ferramentas` | "Calculadoras e ferramentas práticas do pai: conversor de moedas, mercado financeiro, cortes de carne, churrasco, orçamento e idade do filho." |
| **Área do Pai** | `/area-do-pai` | "Seu painel: filhos cadastrados, conteúdo pela idade deles, trilhas em andamento, itens salvos e suas insígnias." |
| **Pai Indica Pai** | `/pai-indica-pai` | "Pai ajuda pai a trabalhar: vagas indicadas, profissionais de confiança e mentoria de quem já passou por isso." |
| **Irmandade** | `/irmandade` | "Comunidade de homens que querem ser pais melhores: histórias, perguntas e respostas, encontros e grupos pequenos." |
| **Formação** | `/formacao` | "Trilhas e desafios para crescer como pai, marido e homem de fé, com turmas, insígnias e o Caderno do Pai." |
| **Sobre** | `/sobre` | Manifesto (seção 8). |

Subseções com nome fixo:

- `/pai-indica-pai/vagas` — "Vagas indicadas por pais"; `/pai-indica-pai/profissionais` — "Pai Profissional" (diretório); `/pai-indica-pai/mentoria` — "Mentoria de pai para pai".
- `/historias` — "Histórias de pai"; `/perguntas` — "Perguntas da Irmandade"; `/eventos` — "Encontros".
- `/desafios` — "Desafios do Pai" (ex.: "90 dias do Pai", "33 dias com São José").
- `/ferramentas/conversor-de-moedas` — "Conversor de moedas do Pai"; `/ferramentas/mercado-financeiro` — "Mercado financeiro em um minuto".
- `/loja/ofertas` — "Ofertas que valem"; `/loja/presentes` — "Presentes por ocasião".

---

## 7. Identidade de marca

### 7.1 Conceito da marca

Vocação de Pai é **sólido, quente e sereno**. Sólido como ferramenta bem feita; quente como brasa e couro; sereno como um homem que sabe o que está fazendo. Nada de "macho agressivo" (preto e vermelho neon, caveira, fonte militar) nem de "paternidade fofa" (pastel, rabisco infantil). A referência visual é a oficina arrumada, a mesa de madeira, a camisa de flanela, o terço no bolso.

### 7.2 Três conceitos de símbolo (e a escolha)

**Conceito A — Escudo com duas figuras (pai e filho).** Escudo de contorno simples (cantos retos em cima, ponta suave embaixo) contendo duas silhuetas geométricas, uma maior e uma menor, lado a lado, formadas por traços grossos. Lê-se "proteção" e "transmissão". Risco: escudo é clichê de seguradora e de clube de futebol; as silhuetas pequenas somem no favicon.

**Conceito B — Âncora.** Âncora estilizada, com a haste virando uma cruz discreta na parte superior. Lê-se "firmeza", "esperança" (símbolo cristão antigo) e "o que segura a casa". Risco: associação forte com náutica/marinha e com marcas de roupa; a cruz pode parecer acessória.

**Conceito C — Bússola-cruz "VP".** Rosa dos ventos de quatro pontas em que a ponta norte é mais longa e termina em forma de cruz latina discreta; o centro é um círculo vazado onde cabem as iniciais "VP" em Barlow Condensed. Lê-se "direção", "vocação" (ser chamado para um rumo), "o pai que orienta a casa" e, para quem conhece, "o norte é Cristo". Funciona em 16 px (vira uma estrela de 4 pontas), em bordado, em carimbo e em laser na madeira. É o par natural da identidade do Vocação de Mãe sem copiá-la.

**Escolha: Conceito C — a Bússola do Pai.** Motivos: (1) é o único que fala de *vocação* (direção, chamado), que é o nome da marca; (2) reduz bem para favicon e ícone de app; (3) carrega a fé sem virar logo de paróquia; (4) dá nome a franquias internas ("Norte da semana", "Bússola do membro" no painel); (5) o escudo (A) fica guardado para o selo "Escolha do Pai Indica" e a âncora (B) para o programa de Âncoras da Irmandade (par de responsabilidade), então nada se perde.

### 7.3 Construção do símbolo (especificação para o SVG)

- Grade de 24 × 24 unidades. Quatro pontas: norte do centro até y = 1, sul até y = 22, leste/oeste até x = 22 / x = 2. Pontas sul, leste e oeste são triângulos isósceles com base 6 unidades no círculo central; a ponta norte tem base 6 e, a 4 unidades do topo, um travessão horizontal de 8 unidades × 1,6 unidade formando a cruz.
- Círculo central: raio 5, traço 1,8, vazado. Dentro, as letras "VP" em Barlow Condensed SemiBold, altura 5 unidades, tracking −10, centradas. Na versão de 16 px o "VP" some e o círculo fica cheio.
- Cantos de todas as pontas com arredondamento de 0,4 unidade (nada afiado).
- Cor padrão do símbolo: petróleo `#14505C`. Travessão da cruz e círculo central podem receber âmbar `#D9822B` na versão colorida.

Arquivos que a Fase 1 cria em `public/brand/`:

```
public/brand/
  simbolo.svg                 # símbolo sozinho, petróleo
  simbolo-ambar.svg           # símbolo com cruz e círculo em âmbar
  simbolo-branco.svg          # para fundo escuro
  logo-horizontal.svg         # símbolo + "Vocação de Pai" à direita
  logo-horizontal-branco.svg
  logo-vertical.svg           # símbolo em cima, nome embaixo (Instagram, carimbo)
  logo-monocromatico.svg      # 100% grafite #1F2429 (impressão)
  favicon.svg                 # símbolo 16px (sem VP)
  og-default.png              # 1200x630, fundo areia, logo horizontal, slogan
  icone-app-512.png           # fundo petróleo, símbolo branco
```

O `src/components/brand/Logo.tsx` recebe `variant: 'horizontal' | 'vertical' | 'simbolo'` e `tone: 'petroleo' | 'branco' | 'grafite'`, e lê os SVGs inline (não `<img>`), para herdar `currentColor` quando `tone` não é informado.

### 7.4 Logotipo (a palavra)

- "Vocação de Pai" em **Barlow Condensed SemiBold**, caixa alta e baixa, tracking −1 %. "Vocação de" em petróleo `#14505C`; "Pai" em âmbar `#D9822B` na versão colorida (na monocromática, tudo da mesma cor).
- Proporção horizontal: altura do símbolo = altura das maiúsculas × 1,6; espaço entre símbolo e texto = metade da altura do símbolo.
- Área de proteção: metade da altura do símbolo em todos os lados.
- Tamanho mínimo: 24 px de altura do símbolo na tela; 8 mm impresso.

### 7.5 Paleta (tokens fixos do briefing) e uso

| Token | Hex | Uso |
|---|---|---|
| `--vp-primaria` | #14505C | Links, botões primários, cabeçalhos de seção, símbolo |
| `--vp-secundaria` | #1F2429 | Rodapé, cartões no modo escuro, texto de título em destaque |
| `--vp-destaque` | #D9822B | CTA de afiliado ("Comprar agora na Amazon"), "Pai" no logotipo, insígnias, hover |
| `--vp-fundo` | #F4EFE6 | Fundo da página (modo claro) |
| `--vp-texto` | #1B1F23 | Texto corrido |
| `--vp-sucesso` | #2F7D4F | Sinal verde, confirmação, Dinheiro do Pai |
| `--vp-atencao` | #D9A21B | Sinal de atenção |
| `--vp-alerta` | #B23A3A | Sinal de alerta, erro, Churrasco |
| `--vp-fundo-escuro` | #14181C | Fundo (modo escuro) |
| `--vp-cartao-escuro` | #1F2429 | Cartões (modo escuro) |

Regras de uso:

- Âmbar é a cor de **ação**: botão de compra, botão de "Entrar na Irmandade", insígnia conquistada. Nunca usar âmbar em fundo grande (cansa) nem em texto corrido.
- Petróleo é a cor de **confiança**: navegação, títulos de seção, links. É a cor que mais aparece depois do areia.
- Cores de categoria (seção 3) aparecem só em chips, bordas de 4 px e cabeçalho da página da categoria. Nunca como fundo de card inteiro.
- Contraste mínimo AA (4,5:1) em todo texto. Texto branco sobre qualquer cor da tabela de categorias passa; texto em `--vp-atencao` sobre areia **não** passa, então "Sinal de atenção" usa fundo âmbar-claro `#FBF1D6` com texto `#6B4A00`.
- Modo escuro: fundo `#14181C`, cartões `#1F2429`, texto `#E9E4DA` (areia clareada), petróleo vira `#3E8A99` em links para manter contraste, âmbar permanece.

`src/styles/tokens.css` (esqueleto):

```css
:root {
  --vp-primaria: #14505C;
  --vp-secundaria: #1F2429;
  --vp-destaque: #D9822B;
  --vp-fundo: #F4EFE6;
  --vp-texto: #1B1F23;
  --vp-sucesso: #2F7D4F;
  --vp-atencao: #D9A21B;
  --vp-atencao-fundo: #FBF1D6;
  --vp-atencao-texto: #6B4A00;
  --vp-alerta: #B23A3A;
  --vp-superficie: #FFFFFF;
  --vp-borda: #DED7CA;
  --fonte-titulo: "Barlow Condensed", "Arial Narrow", sans-serif;
  --fonte-texto: "Inter", system-ui, sans-serif;
}
:root[data-theme="dark"] {
  --vp-fundo: #14181C;
  --vp-superficie: #1F2429;
  --vp-texto: #E9E4DA;
  --vp-primaria: #3E8A99;
  --vp-borda: #2C333A;
}
```

### 7.6 Tipografia

- **Títulos:** Barlow Condensed (Google Fonts), pesos 500 e 600. H1 48/56 px no desktop, 34/40 no celular; H2 30/36; H3 22/28. Caixa alta e baixa; caixa alta só em rótulos curtos (chips, "SINAL VERDE").
- **Texto:** Inter, pesos 400 e 600. Corpo 17/28 px no desktop, 16/26 no celular. Largura máxima de coluna de texto: 68 caracteres (`max-w-[68ch]`).
- **Números e tabelas:** Inter com `font-variant-numeric: tabular-nums`.
- Carregamento: `<link rel="preconnect">` para fonts.googleapis.com e fonts.gstatic.com; `display=swap`; só os pesos listados.

### 7.7 Elementos de interface com cara própria

- **Chip de categoria:** retângulo de cantos 4 px, borda 1,5 px na cor da categoria, texto na cor da categoria, fundo transparente; no hover, fundo da categoria e texto branco.
- **Semáforo do pai:** três cartões com borda esquerda de 6 px (verde, âmbar, vermelho), título em Barlow Condensed caixa alta ("SINAL VERDE"), texto em Inter.
- **Botão de afiliado:** fundo âmbar, texto branco, Barlow Condensed 600, 18 px, ícone de carrinho, texto fixo "Comprar agora na Amazon".
- **Insígnias (badges):** círculo com borda dupla, símbolo da bússola pequeno no topo, nome da insígnia em Barlow Condensed. Cinza quando não conquistada, âmbar quando conquistada.
- **Cartão de review:** nota de 0 a 10 em Barlow Condensed 600 40 px dentro de um quadrado petróleo no canto superior direito da capa; selo ("Escolha do Pai Indica", "Melhor custo-benefício") em faixa âmbar diagonal.
- **Texturas:** permitido um grão sutil (ruído 3 %) no fundo areia do cabeçalho da home e das páginas de seção. Nada de madeira falsa, couro falso ou metal escovado como imagem de fundo.

### 7.8 Exemplos de aplicação

1. **Cabeçalho do site:** fundo areia, logo horizontal à esquerda (símbolo 32 px), menu em Inter 600 15 px com as 8 seções, botão "Entrar" contornado em petróleo, botão "Área do Pai" cheio em petróleo quando logado.
2. **Card de artigo:** capa 16:9, chip da categoria sobre a capa (canto inferior esquerdo), título em Barlow Condensed 600 24 px, resumo em Inter 15 px, linha final com tempo de leitura e faixa de idade do filho quando houver.
3. **E-mail Jogada do Dia:** cabeçalho com símbolo 40 px em petróleo sobre areia, título "Jogada do Dia" em Barlow Condensed, 5 linhas de texto, 1 botão âmbar "Ver no site", rodapé com link para o Vocação de Mãe.
4. **Imagem OG padrão:** 1200 × 630, fundo areia com grão, logo horizontal centralizado, slogan embaixo em Barlow Condensed 500 36 px petróleo.
5. **Perfil Instagram/YouTube:** logo vertical em fundo petróleo com símbolo branco e "Vocação de Pai" em areia.
6. **Caderno do Pai (PDF):** capa petróleo com símbolo âmbar grande, nome do pai e dos filhos em Barlow Condensed; páginas internas em areia com Inter.
7. **Camiseta/boné (loja própria, futuro):** símbolo bordado em âmbar sobre tecido petróleo ou grafite; sem frase.

### 7.9 Slogans

Cinco candidatos:

1. "Ser pai é um chamado. A gente ajuda você a atender."
2. "Para o homem que segura a casa."
3. "O norte do pai brasileiro."
4. "Pai presente, marido firme, homem de fé."
5. "Do berço ao churrasco, tudo o que um pai precisa saber."

**Escolha final: "Para o homem que segura a casa."**

Motivos: curto (6 palavras), cabe no OG e no favicon-tooltip; fala de *homem* (não só de pai, o que inclui o noivo e o avô); "segura a casa" é expressão brasileira que junta provedor, protetor e líder sem soar agressiva; combina com a bússola (quem segura a casa dá o rumo); e não repete a fórmula do Vocação de Mãe. O slogan 1 fica como frase de abertura do manifesto. O slogan 5 fica como meta description padrão da home. O slogan 4 vira os três eixos do Check-up do Pai (Presença, Firmeza, Fé) em versão expandida (Presença, Provisão, Proteção, Fé, Corpo).

Uso fixo:

- `<title>` da home: "Vocação de Pai — Para o homem que segura a casa"
- Meta description da home: "Do berço ao churrasco, tudo o que um pai precisa saber: paternidade por fase, casamento, dinheiro, fé, ferramentas, reviews honestos e uma irmandade de pais."
- Assinatura do rodapé: "Vocação de Pai — Para o homem que segura a casa. Um site do grupo VDP, irmão do Vocação de Mãe."

---

## 8. Manifesto do Vocação de Pai (texto pronto para /sobre)

> Colar sem alterar em `src/routes/sobre.tsx`, dentro de `<article className="prose">`. Títulos em H2. O H1 da página é "Sobre o Vocação de Pai".

**Ser pai é um chamado. A gente ajuda você a atender.**

Ninguém nasce sabendo ser pai. A maioria de nós aprendeu olhando para o próprio pai: alguns para imitar, outros para fazer diferente. Quase todos chegamos à maternidade com a mulher que amamos sabendo mais do berço, da febre e do choro do que nós. E, no primeiro dia em casa com o bebê, descobrimos que o mundo tem muito conteúdo para a mãe e quase nada para o homem que está ali do lado, querendo acertar.

O Vocação de Pai nasceu dessa falta. Nasceu numa casa de verdade, ao lado do Vocação de Mãe, feito por um marido para os outros maridos. É um site para o homem inteiro: o que troca a fralda e o que troca o pneu, o que reza o terço e o que acende a churrasqueira, o que negocia o salário e o que ensina o filho a andar de bicicleta. Porque a casa precisa de tudo isso, e precisa que venha do mesmo homem.

## No que acreditamos

Acreditamos que família é pai, mãe e filhos, e que o casamento entre um homem e uma mulher é a base de uma casa que dura. Acreditamos que o pai é chamado a liderar servindo: a autoridade dele se mede pelo quanto protege, provê, ensina e dá o exemplo, não pelo quanto grita. Acreditamos que os filhos são dom, não fardo, e que cada um deles tem o direito de crescer com um pai presente. E acreditamos que nada disso se sustenta sem Deus: São José, o homem silencioso que segurou a casa de Nazaré, é o nosso modelo.

Somos católicos e não escondemos isso. Mas a porta está aberta para todo homem que quer ser um pai melhor, seja qual for o ponto em que ele está: o noivo que se prepara, o pai de primeira viagem, o pai de cinco, o pai separado que quer continuar presente, o viúvo que agora cuida de tudo, o avô que quer deixar legado.

## O que você encontra aqui

**Artigos** escritos para homem adulto, fase por fase: o que fazer, por que fazer e para quem serve. **Pai Indica**, reviews honestos de produto para a casa, o carro, a churrasqueira e o filho, com nota de 0 a 10 e defeito no mesmo tamanho do elogio. **Loja do Pai**, porque o pai também quer desconto, com faixa de preço pesquisada e sem truque. **Caixa de Ferramentas**: conversor de moedas, mercado financeiro, cortes de carne, calculadora de churrasco, orçamento familiar. **Área do Pai**, o seu painel, com conteúdo pela idade dos seus filhos. **Pai Indica Pai**, onde um pai indica vaga, profissional e mentoria para outro pai. **Irmandade**, para você não caminhar sozinho. **Formação**, trilhas e desafios para crescer como pai, marido e homem de fé.

## O que prometemos

Resposta antes da explicação. Para quem é e para quem não é. Falar com você como homem adulto. Família tradicional, sem exceção. Honestidade com produto e dinheiro: faixa de preço, nunca preço inventado; nota ruim quando o produto é ruim, mesmo com link de afiliado. Cautela em saúde, direito e investimento: informamos, e dizemos quando procurar um médico, um advogado ou um padre. E sempre um próximo passo.

## O que não fazemos

Não fazemos piada do pai atrapalhado. Não falamos mal da sua esposa. Não vendemos aposta, atalho financeiro nem remédio milagroso. Não publicamos vulgaridade, pornografia nem machismo de internet. Não tratamos família como opinião.

## Quem faz

O Vocação de Pai é um site do grupo VDP, o mesmo do Vocação de Mãe, do Portal da AI, do Review Produtos e do Blog do Bitcoin. É feito por uma família que acredita no que escreve. Participamos do Programa de Associados da Amazon: quando você compra pelos nossos links, recebemos uma comissão, sem custo extra para você. Isso paga o site e não muda nenhuma nota.

Se você chegou até aqui, provavelmente é um homem que quer acertar. Então seja bem-vindo. Cadastre-se na Área do Pai, receba a Jogada do Dia e venha para a Irmandade. A casa precisa de você inteiro.

**Vocação de Pai. Para o homem que segura a casa.**

---

## 9. Relação com o Vocação de Mãe e com o grupo

### 9.1 O "casal de sites"

Vocação de Mãe e Vocação de Pai são um casal: mesma família, mesma fé, mesma base técnica, públicos diferentes. Regras:

1. **Links cruzados fixos no rodapé.** Rodapé do Vocação de Pai: bloco "Para a sua esposa: Vocação de Mãe" com logo e link para vocacaodemae.com.br. Rodapé do Vocação de Mãe (tarefa a abrir no repositório dela): bloco "Para o seu marido: Vocação de Pai". Ambos com `rel="noopener"` sem `nofollow` (são do mesmo dono; link natural).
2. **Links cruzados em artigos (componente `ParaAEsposa` / `ParaOMarido`).** Todo artigo de `paternidade-por-fase` e `casamento-e-familia` do Vocação de Pai traz, antes do "Continue lendo", um callout "Para a sua esposa: no Vocação de Mãe, [título do artigo espelho]" quando existir espelho. A rotina de geração consulta a API pública do Vocação de Mãe (`/api/posts?slug=` ou busca por título) para achar o espelho; se não achar, omite o callout.
3. **Temas em espelho.** Para cada tema de fase ("sono aos 2 meses", "introdução alimentar", "birra aos 2 anos", "adolescente e celular"), o Vocação de Mãe tem o artigo do ponto de vista da mãe e o Vocação de Pai tem o do ponto de vista do pai: o que o pai faz, como apoia a esposa, o que é dele. O backlog (doc 12) lista os 60 primeiros espelhos.
4. **Regra de nunca duplicar artigo.** Proibido copiar, traduzir para o masculino ou reescrever levemente um artigo do Vocação de Mãe. O espelho tem título, ângulo, exemplos e links diferentes. Teste: se trocar "mãe" por "pai" no artigo dela produz o nosso, está errado. O validador compara título e primeiros 300 caracteres com a base dela (via API) e bloqueia similaridade acima de 60 %.
5. **Review de Mãe ↔ Pai Indica.** O comparativo do Vocação de Mãe chama-se "Review de Mãe"; aqui chama-se "Pai Indica". Produtos de bebê que servem aos dois (cadeirinha, carrinho, babá eletrônica) são avaliados **uma vez só**: quem publica primeiro fica com o review; o outro site linka com callout "Avaliado pelo Vocação de Mãe / pelo Vocação de Pai". Produtos claramente masculinos (furadeira, faca, churrasqueira, barbeador) ficam só aqui; claramente maternos (bomba de leite, sutiã de amamentação) ficam só lá.
6. **Loja em espelho.** "A mãe quer desconto!" ↔ "O pai também quer desconto". Mesmo padrão de review longa por produto, mesma regra de faixa de preço, mesma frase de transparência. Catálogos distintos; produto compartilhado aparece nas duas lojas apontando para o mesmo ASIN, com review em um só.
7. **Semáforo.** Vocação de Mãe usa "Sinal tranquilizador / Sinal de atenção / Sinal de alerta"; Vocação de Pai usa "Sinal verde / Sinal de atenção / Sinal de alerta". Não misturar.
8. **Newsletter.** Cadastro de newsletter do Pai oferece caixa opcional "Minha esposa também quer receber o Vocação de Mãe" (campo de e-mail dela, opt-in explícito, segmento `indicado-pelo-marido` na base dela). E vice-versa.
9. **Datas em dupla.** Dia das Mães e Dia dos Pais: cada site publica o guia de presente do outro ("Presente para a sua esposa" aqui aponta para a loja dela; "Presente para o seu marido" lá aponta para a nossa).
10. **Histórias.** Uma história enviada por um casal pode aparecer nos dois sites, com a versão dele aqui e a dela lá, linkadas.

### 9.2 Relação com os outros sites do grupo

| Site | O que o Vocação de Pai recebe | O que o Vocação de Pai dá |
|---|---|---|
| **Portal da AI** (portaldaai.com.br) | Modelo "AI Indica" vira "Pai Indica": review individual (`kind: review`, nota 0-10, 5 critérios), comparativo (`kind: comparativo`), lista (`kind: lista`); componentes ReviewBadge, ScoreScaleNote, filtros por `product_category`/`product_subcategory`; regra de imagens (Wikimedia/Pexels); JSON-LD; newsletter via Resend | Artigos da subcategoria `ia-no-dia-a-dia-do-pai` linkam para o Portal da AI como aprofundamento; o Portal linka para cá em "IA para a família" |
| **Review Produtos** (reviewprodutos.com.br) | PADRAO-EDITORIAL.md (7 promessas, escala de notas, selos, pesos por família de produto, regra do duplo funil, SEO por artigo), validador de conteúdo, regras AdSense/Amazon | Reviews de ferramentas, automotivo e churrasco publicados aqui podem ser citados lá como "Avaliado pelo Vocação de Pai" (nunca duplicados) |
| **Blog do Bitcoin** | Base de conhecimento para a subcategoria `bitcoin-e-cripto` e para a ferramenta Mercado financeiro (cotação BTC); artigos de lá linkados como aprofundamento | Dinheiro do Pai é a porta de entrada "família" para o tema: o pai que quer entender bitcoin para a reserva da família começa aqui e aprofunda lá |
| **Painel Lisieux** (grupovdp) | O site entra no painel: `refresh-sites.mjs` ganha `{ key: "vocacaodepai", label: "Vocação de Pai", domain: "vocacaodepai.com.br", ga4Env: "GA4_PROPERTY_VOCACAODEPAI" }`; workflow ganha o secret; a rotina editora do Pai entra em `ROUTINES` com `company: "f1"` | Métricas GA4, Search Console e AdSense do domínio |
| **Canal YouTube Vocação de Pai** (já existe, `UCeQmuftGyoX8XFFcfsh5yHQ`) | Embeds em artigos e trilhas; inscritos já contados no painel | Cada vídeo ganha um artigo-companheiro no blog com transcrição resumida e links |

Regra geral do grupo: **um tema, um dono**. Antes de criar um artigo que outro site do grupo já cobre, linkar em vez de duplicar. A rotina de geração consulta a lista de "temas de outros sites" em `docs/plano/12-backlog-de-conteudo.md` (seção "Não escrever aqui").

### 9.3 Identidade visual em família

- Mesma grade, mesmo componente de semáforo, mesma estrutura de artigo (Padrão A) e de review, para que o leitor que vem do Vocação de Mãe se sinta em casa.
- Paletas diferentes e complementares: o Vocação de Mãe é mais claro e acolhedor; o Vocação de Pai é petróleo, grafite e âmbar. Lado a lado no rodapé, os dois logos têm a mesma altura.
- Os dois símbolos, quando usados juntos (material do grupo, Dia da Família), ficam lado a lado com espaço igual à largura de um símbolo entre eles.

---

## 10. Métricas de sucesso em 12 meses

Horizonte: novembro de 2026 a outubro de 2027. Trimestres: T1 = nov-jan, T2 = fev-abr, T3 = mai-jul (inclui Dia dos Pais em agosto, no T4), T4 = ago-out. Todas as metas vão para o Painel Lisieux (bloco `sites.vocacaodepai`) e para `docs/plano/PROGRESSO.md`, atualizado ao fim de cada sessão.

### 10.1 Tabela de metas

| Métrica | Como medir | T1 (jan/27) | T2 (abr/27) | T3 (jul/27) | T4 (out/27) |
|---|---|---|---|---|---|
| Artigos publicados (todos os kinds) | `count(posts where status='published')` | 180 | 420 | 700 | 1.000 |
| Reviews Pai Indica (review + comparativo + lista) | `count(posts where kind in (...))` | 40 | 110 | 200 | 300 |
| Produtos ativos na Loja do Pai | `count(products where active)` | 60 | 150 | 260 | 400 |
| Páginas indexadas no Google | Search Console | 150 | 400 | 700 | 1.000 |
| Sessões/mês (GA4) | GA4 | 8.000 | 30.000 | 80.000 | 150.000 |
| Cliques orgânicos/mês | Search Console | 5.000 | 20.000 | 60.000 | 110.000 |
| Membros cadastrados (Área do Pai) | `count(profiles)` | 300 | 1.200 | 3.500 | 8.000 |
| Membros com filho cadastrado | `count(distinct children.user_id)` | 150 | 700 | 2.200 | 5.000 |
| Assinantes de newsletter confirmados | `count(newsletter_subscribers where confirmed_at is not null)` | 500 | 2.000 | 6.000 | 12.000 |
| Taxa de abertura Jogada do Dia | Resend | 45 % | 42 % | 40 % | 40 % |
| Trilhas concluídas | `count(track_progress completo)` | 50 | 300 | 1.000 | 2.500 |
| Participantes de desafio (90 dias / 33 dias) | `count(distinct challenge_progress.user_id)` | 100 | 500 | 1.200 | 3.000 |
| Vagas publicadas (aprovadas) | `count(jobs where status='approved')` | 20 | 80 | 200 | 400 |
| Indicações de profissional aprovadas | `count(job_referrals where status='approved')` | 30 | 120 | 300 | 600 |
| Mentorias realizadas | `count(mentorships where status='done')` | 5 | 40 | 120 | 300 |
| Histórias e perguntas aprovadas | `count(stories)+count(questions)` | 40 | 200 | 600 | 1.500 |
| AdSense aprovado | sim/não | pedido em jan | aprovado | — | — |
| Receita AdSense/mês | Painel Lisieux | 0 | R$ 300 | R$ 1.500 | R$ 4.000 |
| Cliques em afiliado/mês | evento GA4 `affiliate_click` | 800 | 4.000 | 12.000 | 25.000 |
| Receita Amazon Associados/mês | relatório Associados | R$ 150 | R$ 900 | R$ 3.000 | R$ 7.000 |
| Assinantes do plano pago (se lançado no T3) | `count(subscriptions where status='active')` | — | — | 50 | 250 |
| Core Web Vitals (móvel) | PageSpeed / CrUX | LCP ≤ 2,5 s · INP < 200 ms · CLS < 0,1 em 100 % das páginas-modelo | idem | idem | idem |

Observações:

- As metas de receita seguem a ordem de grandeza do Vocação de Mãe no primeiro ano, ajustadas para cima pela categoria (ferramentas, churrasco e automotivo têm ticket e RPM maiores que bebê) e para baixo pela sazonalidade (Dia dos Pais só no T4).
- Pré-requisitos do grupo antes de pedir AdSense: 40 a 60 artigos indexados, cada categoria com 5+, 40 % de artigos informacionais, política de privacidade e página de afiliados no ar. Meta: pedido na 2ª semana de janeiro de 2027.
- Pré-requisito do Associados Amazon: 15 a 20 artigos públicos com divulgação de afiliado. Meta: inscrição na 3ª semana de novembro de 2026 (conta do grupo, tag própria `vocacaodepai-20` ou equivalente).

### 10.2 Metas de qualidade (não negociáveis, todo trimestre)

- 100 % dos artigos passam no validador (promessas 1, 4, 5, 6, 7 e lista de proibições).
- 0 imagens fora da linha editorial (auditoria mensal por amostragem de 50 capas).
- 0 preço exato em reais publicado.
- Tempo médio de resposta de moderação (vagas, histórias, perguntas) ≤ 48 h.
- Taxa de rejeição de vaga por fraude ≤ 5 % das aprovadas (medida por denúncias).

### 10.3 Ritmo de produção que sustenta as metas

- Rotina diária (Fase 8, quantidades do doc 10 §2.2 — fonte única do volume; nenhum outro documento fixa número próprio): 3 artigos Padrão A novos + 2 reformas, 3 comparativos + 2 reviews Pai Indica, 1 notícia Mercado do pai, 1 Jogada do Dia, 5 produtos novos e 10 reviews longas, todos os dias (05:37 BRT); as séries semanais da seção 3.7 entram dentro dessas cotas, não somam a elas. Nas 2 primeiras semanas rodar com metade (teto de 5 posts/dia, risco 10 da seção 11) e subir após aprovação do dono.
- Isso dá ≈ 250 posts/mês em regime pleno (10 posts novos por dia, descontadas as rodadas que o validador barra; as 2 reformas não contam como post novo) e ≈ 150 produtos/mês, de modo que as metas da §10.1 têm folga; na rampa das 2 primeiras semanas, metade disso.

---

## 11. Riscos e mitigação

| # | Risco | Probabilidade | Impacto | Mitigação | Dono/fase |
|---|---|---|---|---|---|
| 1 | **Imagem fora da linha editorial** publicada pela rotina (alt-text do Pexels não confiável) | Alta | Alto (reputação, confiança do dono) | Lista branca de buscas (seção 4.2); preferir homem sozinho, pai e filho, objeto; classificador de imagem na rotina (bloquear "two men", "couple" sem "man and woman"); auditoria mensal de 50 capas; botão "denunciar imagem" para membros | Fase 8 |
| 2 | **Reprovação no AdSense** por "conteúdo de afiliado sem valor" | Média | Alto (receita) | Manter proporção 60/40 informacional/comercial; pedir só com 40-60 artigos indexados e todas as categorias com 5+; políticas no ar; não repetir pedido antes de corrigir | Fase 8 / doc 11 |
| 3 | **Penalidade do Google por conteúdo em escala** (spam policies) | Média | Alto | Um dado próprio por artigo (information gain), espelhos realmente diferentes do Vocação de Mãe, links internos reais, refresh trimestral, sem artigos gêmeos; validador de similaridade | Fase 8 |
| 4 | **Vagas falsas ou golpe no Pai Indica Pai** | Média | Alto (dano a leitor, jurídico) | Vaga só de membro com e-mail confirmado; moderação humana/rotina antes de publicar; campos obrigatórios (empresa, cidade, forma de candidatura); proibido pedir pagamento; botão de denúncia; expiração automática em 45 dias; aviso "verifique antes de enviar documentos" | Fase 6 |
| 5 | **Conteúdo médico/jurídico/financeiro tratado como conselho** | Média | Alto (YMYL, responsabilidade) | Avisos automáticos por categoria (4.4); seção "Quando procurar um profissional" obrigatória; semáforo; nunca modelo de petição; nunca sinal de compra; revisão de amostra por humano | Fases 1 e 8 |
| 6 | **Duplicação com o Vocação de Mãe** (canibalização de SEO e desgaste do casal de sites) | Média | Médio | Regra "um tema, um dono"; espelhos com ângulo distinto; validador de similaridade via API; review de produto compartilhado feito uma vez só | Doc 12 / Fase 8 |
| 7 | **Comunidade tóxica ou fora da linha** (Perguntas, Histórias, grupos) | Média | Médio | Moderação prévia de histórias e perguntas; termos de uso com a linha editorial; moderadores voluntários com selo; filtro automático de termos; banimento em 1 clique no /admin; grupos pequenos (4-6) com âncora | Fase 7 |
| 8 | **Ferramentas financeiras quebrarem** (API de câmbio/cotação fora do ar, limite de requisições) | Alta | Baixo | `market_cache` com TTL; duas fontes (primária e reserva); mensagem "cotação de HH:MM, pode estar atrasada"; nunca mostrar zero | Fase 4 |
| 9 | **Dependência de uma única fonte de receita** (Amazon) | Média | Médio | AdSense + Associados + newsletter patrocinada + plano pago (T3) + loja própria (ano 2) + mídia kit `/anuncie` | Doc 11 |
| 10 | **Carga da rotina automática derrubar qualidade** (artigos genéricos, "voz de robô") | Alta | Médio | Pares "assim sim/assim não" no prompt; vocabulário proibido no validador; 1 dado próprio por artigo; amostra semanal lida pelo dono; limite de 5 artigos/dia no início e subir só com aprovação | Fase 8 |
| 11 | **LGPD e dados de menores** (`children` com data de nascimento, histórias com filhos) | Média | Alto | Nome do filho opcional; só mês/ano se o pai preferir; RLS estrita; exclusão de conta apaga filhos; política de privacidade clara; nenhum dado de filho em analytics | Fases 1 e 5 |
| 12 | **Confusão de marca** (leitor achar que é "site de mãe para homens" ou "site de macho") | Baixa | Médio | Slogan e manifesto claros; identidade petróleo/âmbar; home com os 4 pilares visíveis; primeira dobra mostrando churrasco, ferramenta, bebê e terço lado a lado | Fase 1 |
| 13 | **Custo de infraestrutura crescer com membros** (Supabase, Resend, Vercel) | Baixa | Baixo | Plano gratuito Supabase até 50 mil MAU; Resend com segmentação (diária só para quem abre); ISR/caching nas rotas públicas; alerta de custo no painel | Fase 1 / doc 02 |
| 14 | **Escopo grande demais para o primeiro ano** (8 fases, 40 tabelas) | Alta | Médio | Ordem de fases fixa; cada fase com critério de aceite e MVP; o site vai ao ar com Fase 1 + 2 (blog + Pai Indica) em 3 semanas; o resto entra por trás de flag `FEATURES` sem bloquear o ar | Doc 13 |
| 15 | **Dono se afastar e a rotina continuar sozinha** | Baixa | Alto | Relatório diário no Painel Lisieux; pausa automática da rotina se 3 publicações seguidas falharem no validador; e-mail semanal "o que publiquei" para o dono; nenhuma mudança de linha editorial sem commit humano | Fase 8 |

---

## Apêndice A — Checklist de conformidade deste documento para as próximas sessões

Antes de encerrar qualquer sessão que crie conteúdo ou interface:

- [ ] Nomes de seção e rotas iguais à seção 6 (e às DECISÕES FIXAS).
- [ ] Categoria e subcategoria existem na seção 3 (nenhum slug inventado).
- [ ] Cores de categoria copiadas da tabela 3.2.
- [ ] Nenhum item da lista de proibições (4.3).
- [ ] Aviso automático correto por categoria (4.4).
- [ ] Semáforo do pai com "Sinal verde / Sinal de atenção / Sinal de alerta".
- [ ] Botão "Comprar agora na Amazon" e faixa de preço (nunca exato).
- [ ] Vocabulário: nenhuma palavra da coluna "Evitar" (5.3).
- [ ] Link cruzado para o Vocação de Mãe quando houver espelho; nunca artigo duplicado.
- [ ] Slogan e logotipo usados como na seção 7.

## Apêndice B — Frases prontas reutilizáveis

- Transparência de afiliado: "O Vocação de Pai participa do Programa de Associados da Amazon. Quando você compra pelos nossos links, recebemos uma comissão, sem custo extra para você. Isso não muda a nota."
- Faixa de preço: "Faixa de preço consultada na internet em [mês/ano], em pelo menos duas lojas. Não é o preço da Amazon; confira na página do produto."
- Método de review: "Esta análise se baseia em especificações oficiais, fontes especializadas e relatos públicos de consumidores fora da Amazon."
- Chamada da Irmandade: "Você não precisa caminhar sozinho. Entre na Irmandade."
- Chamada da Área do Pai: "Cadastre seus filhos e receba o conteúdo certo para a idade deles."
- Chamada da Jogada do Dia: "Uma ação prática por dia para fazer com seu filho. Cinco linhas, todo dia útil, de graça."
- Rodapé: "Vocação de Pai — Para o homem que segura a casa. Um site do grupo VDP, irmão do Vocação de Mãe."
