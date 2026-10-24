# 01 — Referências e benchmarks do Vocação de Pai

> Documento do plano de criação do **Vocação de Pai** (vocacaodepai.com.br). Leitor-alvo: sessões do Claude Code (Sonnet 5.5, esforço médio)
> que executarão as fases 1 a 8 dentro do repositório `/home/user/vocacaodepai`. Tudo em PT-BR. Data de consolidação: 24/10/2026.
>
> Fontes primárias desta consolidação (scratchpad da sessão de planejamento): `res-sites.md` (16 buscas + 16 páginas abertas),
> `res-tecnico.md` (chamadas reais a APIs + docs oficiais), `inv-reviewprodutos-grupovdp.md` (padrão editorial, regras Google/AdSense/Amazon
> já documentadas em `/home/user/reviewprodutos/docs/PESQUISA-REFERENCIAS.md`). O arquivo `res-ecossistema.md` (legislação) **não existia** no
> momento da redação; a seção 5.1 foi escrita a partir do conhecimento do redator e está integralmente marcada **VERIFICAR FONTE**.
>
> Legenda usada em todo o documento: **[VERIFICADO]** = página aberta ou endpoint chamado em 24/10/2026; **[FONTE TERCEIRA]** = só fontes não
> oficiais; **[NÃO VERIFICADO]** = domínio indisponível/busca sem retorno; **VERIFICAR FONTE** = escrito de memória, confirmar antes de publicar.
>
> Decisões fixas que este documento respeita (ver `BRIEF` e `00-visao-posicionamento-e-marca.md`): módulos **Blog, Pai Indica, Loja do Pai,
> Caixa de Ferramentas, Área do Pai, Pai Indica Pai, Irmandade, Formação**; fases **1 (Fundação), 2 (Pai Indica/reviews), 3 (Loja),
> 4 (Ferramentas), 5 (Área do Pai/membros), 6 (Pai Indica Pai), 7 (Irmandade e Formação), 8 (Automação, rotinas e painel)**; botão de afiliado
> sempre **"Comprar agora na Amazon"**; preço sempre **faixa pesquisada** (2 lojas, máx ≤ 3× mín), nunca exato; semáforo do pai
> ("Sinal verde: ", "Sinal de atenção: ", "Sinal de alerta: "); tabelas e migrations com os nomes fixos do BRIEF.

---

## Sumário

1. Resumo executivo — as 10 lições mais importantes
2. Tabela de benchmarks (internacionais e nacionais)
3. O que vamos trazer de fora — funcionalidades por módulo e fase
4. Ideias e surpresas — lista deduplicada e numerada (48 ideias; 15 de maior impacto)
5. Fatos verificados — legislação do pai, Amazon Associados BR, AdSense, Google Reviews System
6. APIs e serviços — tabela, cadeia de fallback de câmbio/mercado, chaves e TTLs
7. Fontes — todas as URLs

---

## 1. Resumo executivo — as 10 lições mais importantes das referências

| # | Lição | De onde vem | O que muda no Vocação de Pai |
|---|---|---|---|
| 1 | **Navegar pela vida do homem, não só pela idade do filho.** Os maiores portais masculinos organizam o conteúdo por pilares (Fatherly: Life/Health/Play/Style; Art of Manliness: Character/Skills/Strength/Social/Style/Culture; Primer: verbos Live/Earn/Spend/Learn/Invest/Train/Love). | Fatherly, Art of Manliness, Primer | Categorias fixas do Blog = **Pai, Marido, Provedor, Corpo, Fé, Habilidades, Estilo, Churrasco & Mesa, Dinheiro**; hub secundário `/blog/por-idade` com 7 faixas etárias; filtros-verbo "Viver / Ganhar / Gastar / Aprender / Investir / Treinar / Amar". |
| 2 | **Um e-mail curto por dia com UMA ação prática retém mais do que qualquer feed.** O "Play of the Day" do All Pro Dad tem 200 mil+ assinantes; AoM e Gear Patrol também têm newsletter diária. | All Pro Dad, Art of Manliness, Gear Patrol | Produto **"Jogada do Dia"** (newsletter diária de 5 linhas, opção diária/semanal) gerado por rotina a partir do Blog; `newsletter_subscribers.segments` guarda a frequência. Resend Free = 100 e-mails/dia → Pro quando passar de ~700 assinantes diários. |
| 3 | **Formação funciona quando tem data de início, ritmo diário e grupo pequeno.** Exodus 90 (100 mil+ homens, fraternidades de 4–6 com "âncora"), The Strenuous Life (matrícula por turma, ~10 mil membros, badges), Consagração a São José (33 dias). | Exodus 90, Art of Manliness, Pe. Donald Calloway | `tracks`/`track_steps` + `challenges`/`challenge_days` com **turmas (coortes)** datadas, check-in diário, "âncora" via `mentorships`, `badges`/`user_badges`. Trilhas âncora: "33 dias com São José" e "90 dias do Pai". |
| 4 | **Comunidade só funciona moderada — e a moderação pode ser voluntária com papel e selo.** Dad.info (maior site de apoio a pais da Europa) usa voluntários da ONG Spurgeons no fórum. | Dad.info, Fraternus | `questions`/`answers` com papel `editor` em `profiles.role` usado como "irmão moderador"; fila de moderação em `/admin`; `moderation_log` registra cada ação. |
| 5 | **Review bom = veredito em 30 segundos, picks nomeados, evidência própria e alternativas.** Wirecutter ("Our pick / Budget / Upgrade"), Gear Patrol (guias evergreen "Atualizado"), Primer ("1 Look, 3 Budgets") — e é exatamente o que o Google Reviews System pede. | Wirecutter, Gear Patrol, Primer, Google | **Pai Indica** herda o padrão `reviewprodutos` (escala 0–10, 4–6 critérios com pesos, selos) e ganha o formato **"1 produto, 3 orçamentos"** (Econômico / Equilibrado / Premium), cada um com botão "Comprar agora na Amazon". |
| 6 | **Monetização em camadas, nunca em uma só.** AoM: afiliados + anúncios + loja + assinatura; AmazingRibs: anúncios + Pitmaster Club (sem anúncios, ebooks, sorteios); Churrasqueadas: cursos Hotmart + loja + mídia kit; Dad.info: patrocínio corporativo. | Art of Manliness, AmazingRibs, Churrasqueadas, Dad.info | Ordem no plano: **AdSense + Amazon Associados** (fases 1–3) → **plano pago "Promessa do Pai"** com trial de 14 dias e sem anúncios (fase 5) → **produtos próprios** (Caderno do Pai, curso "Churrasco do Pai") e **página /anuncie** com patrocínio de seção (fases 7–8). |
| 7 | **Churrasco e carne são a porta de entrada masculina de maior volume no Brasil.** Churrasqueadas tem ~1.294 vídeos filtráveis por carne × corte × técnica e cursos de R$ 47 a R$ 657; Netão Bom Beef é o 8º influenciador de churrasco do mundo; AmazingRibs tem 2.000+ páginas grátis só de carne. | Churrasqueadas, Netão Bom Beef, AmazingRibs, Serious Eats | Ferramentas **Guia Interativo de Cortes do Boi** (`/ferramentas/cortes-de-carne`), **Calculadora de Churrasco** e tabela **Carne × Preparo**; categoria editorial "Churrasco & Mesa"; subcategoria de reviews "Churrasqueiras, facas e acessórios". |
| 8 | **Dados de mercado: o servidor é a fonte de verdade, nunca o navegador.** Em 24/10/2026 a AwesomeAPI sem chave devolveu `429 QuotaExceeded`; a Brapi exige token para `^BVSP`; o JSON antigo do Tesouro Direto respondeu "gone". | Testes reais (`res-tecnico.md`) | Tabela `market_cache` + rota `POST /api/cron/market` (header `Authorization: Bearer CRON_SECRET`) + GitHub Actions a cada 2 h; **stale-while-revalidate** (sempre renderiza o último payload com "Atualizado às HH:MM"); cadeia de fallback de câmbio em 4 níveis (seção 6.3). |
| 9 | **Conformidade é pré-requisito, não polimento.** Amazon exige aviso literal e proíbe preço sem API; AdSense reprova "thin affiliate" e exige páginas institucionais; Google for Jobs exige JobPosting completo; FAQPage não rende mais rich result desde 07/05/2026. | Amazon Associados BR, Google AdSense, Google Search Central | Rodapé com o aviso literal + `/politica-de-afiliados`; faixa de preço em `product_price_checks`; `JobPosting` em `/pai-indica-pai/vagas/$slug`; `Product`+`Review` (bestRating 10) no Pai Indica; sem esforço em FAQPage; pedir AdSense só com 40–60 artigos indexados. |
| 10 | **O site tem que "conhecer" o pai.** NFI usa o "Father Friendly Check-Up" e o "Program Selection Tool" para recomendar programa; Fatherly e NFI segmentam por idade do filho; Padre Paulo Ricardo tem área de membro com biblioteca e "meus cursos". | NFI, Fatherly, Padre Paulo Ricardo | `profiles` + `children` (data de nascimento) personalizam a home da **Área do Pai**; quiz **"Check-up do Pai"** (radar Presença/Provisão/Proteção/Fé/Corpo) recomenda uma trilha; `saved_items` e `track_progress` alimentam o painel `/area-do-pai`. |

**Resumo em uma frase:** o Vocação de Pai é um portal masculino por pilares de vida (lição 1) com um e-mail diário (2), formação em turmas (3), comunidade moderada (4), reviews com veredito e 3 orçamentos (5), monetização em camadas (6), churrasco como isca (7), dados de mercado servidos com cache (8), conformidade desde o dia 1 (9) e personalização por filho e check-up (10).

---

## 2. Tabela de benchmarks internacionais e nacionais

Consolidação integral de `res-sites.md` (nenhuma linha removida), acrescida das colunas "O que trazer para o Vocação de Pai" e "Verificado?".
Só constam URLs abertas ou vistas em resultados de busca em 24/10/2026.

### 2.1 Portais de paternidade e lifestyle masculino (exterior)

| Nome | País | URL | O que faz bem | O que trazer para o Vocação de Pai | Monetização | Verificado? |
|---|---|---|---|---|---|---|
| Fatherly | EUA | https://www.fatherly.com/ | Portal lifestyle para pais navegado por "pilares de vida" (Life: Self, Food, Sex & Relationships, Cars · Health & Science: Fitness, Parenting, Wellness, Baby Names · Play: Kids' Entertainment, Cool Dads, Dad Jokes, Movies & TV · Style: Grooming, Clothes, Sneakers); metade da audiência é feminina; newsletter 2x/semana; franquias "940 Weekends", "My Father, The…", "100 melhores filmes infantis antes dos 10" | Categorias por pilar; série **"Fim de semana de 940"** com contador no painel do membro; lista viva de filmes com checkbox "já vimos"; seção "Nomes de bebê" como ferramenta de busca | Publicidade (BDG Media), conteúdo de produto/"essentials" | [VERIFICADO] página aberta |
| The Art of Manliness | EUA | https://www.artofmanliness.com/ ; https://www.artofmanliness.com/blog/strenuous-life/the-2022-enrollment-of-the-strenuous-life-is-now-open/ | Maior biblioteca de "habilidades masculinas"; podcast 1.100+ episódios; nav Character / Skills / Strength / Social / Style / Culture; newsletter diária ou semanal; loja store.artofmanliness.com; **The Strenuous Life** = programa com badges por habilidade e matrícula por turmas (~10 mil membros) | Categoria "Habilidades" com subcategorias (Carro, Marcenaria, Casa, Mato, Sobrevivência); **badges por habilidade**; **turmas (coortes)** de Formação com matrícula periódica; disclosure explícito de afiliado | Afiliados (disclosure explícito), anúncios, loja própria, assinatura The Strenuous Life | [VERIFICADO] home aberta; enrollment via busca |
| Dad.info | Reino Unido | https://www.dad.info/ ; https://spurgeons.org/how-we-help/family-life/parenting-and-family-support/dad-info-support-for-dads/ | "Maior site de apoio a pais da Europa", mantido pela ONG Spurgeons; seções Being Dad, Health, Divorce/Separation, Fatherhood, Opinion; **fórum moderado por voluntários**; curso gratuito "Parenting After Separation"; newsletter; conta/perfil | Fórum `questions`/`answers` com moderador voluntário e selo; categoria `/categoria/pai-separado` + trilha gratuita "Pai presente mesmo longe"; página de patrocínio corporativo | Patrocínio corporativo ("Company Sponsorship Opportunities"), cross-promoção da ONG; sem ads visíveis | [VERIFICADO] home aberta |
| National Fatherhood Initiative (NFI) | EUA | https://www.fatherhood.org/ ; https://www.fatherhood.org/fatherhood/free-program-resources-abound | Programas estruturados (24:7 Dad, InsideOut Dad, Understanding Dad, ProFathering15) com manual do facilitador + caderno do pai; **"Program Selection Tool"** (quiz que recomenda programa); **"Father Friendly Check-Up"** (autoavaliação); biblioteca gratuita (ebooks, infográficos, "Father Facts"); blog "Championing Fatherhood"; loja FatherSource; treinamento de facilitadores com certificado | **Check-up do Pai** (quiz → radar → trilha recomendada); **Caderno do Pai** em PDF por trilha; biblioteca gratuita de ebooks como isca; certificado ao concluir trilha | Venda de kits/currículos (kit 24/7 Dad ~US$ 779), treinamentos, consultoria, doações/governo | [VERIFICADO] home aberta |
| All Pro Dad (Family First) | EUA | https://www.allprodad.com/ (403) ; https://en.wikipedia.org/wiki/All_Pro_Dad | E-mail diário **"Play of the Day"** (200 mil+ assinantes); 1.400+ "chapters" mensais em escolas (reunião pai+filho antes da aula, 35 min); Top 10 lists; ferramentas imprimíveis; podcast; vídeos; eBooks | **Jogada do Dia** (e-mail diário com 1 ação); **Kit de Encontro Pai & Filho** (PDF mensal de 35 min); listas "Top 10"; PDFs imprimíveis na Caixa de Ferramentas | ONG (doações), patrocínios, livros | [FONTE TERCEIRA] site devolveu 403; dados da Wikipedia |
| Those Catholic Men / Sword & Spade | EUA | https://www.thosecatholicmen.com/ | Formação católica masculina em **4 pilares com versículo** (Household, Intellect, Society, Maturity); "Letters from the editor" (newsletter quase semanal, tom pessoal); revista impressa trimestral; página "Contribute" | Formação organizada em 4 pilares com versículo fixo (Casa, Trabalho, Corpo, Alma); carta do editor como newsletter semanal; chamada "Escreva para nós" | Doações, assinatura da revista, patrocinador de conteúdo | [VERIFICADO] home aberta |
| Exodus 90 | EUA (global) | https://exodus90.com/ ; https://exodus90.com/blog/renewal-of-the-church-through-100000-men/ | App de formação diária (oração, ascese, fraternidade) no calendário litúrgico; 100 mil+ homens desde 2015; **fraternidades de 4–6 com "âncora"** para check-in diário; programas de 90 dias + St. Michael's Lent + Advento; "Community tab"; trial 14 dias; **"Apostolate Promise"** (reembolso); ajuda financeira sob pedido; loja e gift cards | **Desafio "90 dias do Pai"**; **âncora** (par de responsabilidade) via `mentorships`; grupos fechados de 4–6; plano pago com trial de 14 dias + "Promessa do Pai" (reembolso + bolsa) | Assinatura US$ 90/ano (relatos de US$ 10/mês), loja | [VERIFICADO] home aberta; versão PT não confirmada (ver exodus90.com/pt) |
| Fraternus | EUA | https://www.oursundayvisitor.com/mentorship-program-cultivates-catholic-men/ ; https://www.ncregister.com/blog/iron-sharpens-iron-fraternus-strengthens-fraternity?amp | Mentoria de meninos (a partir do 5º ano) por homens adultos em capítulos paroquiais; hierarquia "commander/captains"; encontro semanal = refeição + jogos + **virtude da semana** + oração; acampamento "The Ranch" | **Virtude da Semana** (widget + arquivo `/formacao/virtudes`); roteiro fixo de encontro; irmandade intergeracional (pai e filho juntos em `/eventos`) | Capítulos pagos pela paróquia, acampamento, doações | [FONTE TERCEIRA] site oficial não aberto |
| Focus on the Family (Singapura) | Singapura/EUA | https://family.org.sg/resource/fatherhood-survival-101-a-guide-to-a-mentally-healthier-you/ | Campanhas de Dia dos Pais com e-guides gratuitos ("The Busy Dad's Playbook": ideias de vínculo por **tempo disponível**), guia de saúde mental paterna (depressão pós-parto paterna); podcast | Ferramenta/trilha **"15 minutos com seu filho"** (5/15/60 min); campanhas sazonais de Dia dos Pais com e-guide; artigo sobre saúde mental do pai no pós-parto | Doações, cursos | [VERIFICADO] via busca (página de recurso) |
| Consecration to St. Joseph (Pe. Donald Calloway) | EUA | https://divinemercyplus.org/page/33-day-consecration-st-joseph ; https://ncregister.com/blog/how-to-make-a-consecration-to-st-joseph | Trilha de **33 dias** (leitura + oração por dia) terminando em ato de consagração; vídeos diários (Day 1…Day 33) | **Trilha "33 dias com São José"** em `tracks`/`track_steps` com badge final; turmas 4x/ano; formato "vídeo ou leitura curta do dia" | Livro, vídeos (Divine Mercy Plus) | [VERIFICADO] via busca |
| AmazingRibs.com | EUA | https://amazingribs.com/cuts-of-meat/beef-steaks/ ; https://amazingribs.com/pitmaster ; https://pitmaster.amazingribs.com/forum/main/929126-your-member-benefits | Enciclopédia de churrasco (2.000+ páginas grátis) com seção **cuts-of-meat**; clube pago **Pitmaster Club** (sem anúncios, ebooks "Deep Dive", webinars, sorteio mensal); trial 30 dias sem cartão; reviews de equipamentos (ratings_reviews); fórum de membros | Guia de cortes com "fatos rápidos + FAQ"; benefício "sem anúncios" no plano pago; subcategoria de reviews "Churrasqueiras, facas e acessórios"; ebooks exclusivos na Biblioteca do Pai | Pitmaster Club (~US$ 34,95/ano), anúncios, afiliados | [VERIFICADO] via busca (páginas vistas) |
| Serious Eats (cortes de carne) | EUA | https://www.seriouseats.com/cuts-of-beef-5118048 | Guia visual de cortes por região do boi e método de cozimento ("corte → método") | Diagrama SVG clicável do boi na ferramenta de cortes; coluna "melhor preparo" por corte | Anúncios, afiliados (Dotdash Meredith) | [NÃO VERIFICADO] fetch bloqueado; URL vista |
| Wirecutter (NYT) | EUA | https://www.nytimes.com/wirecutter/ | Padrão "Our pick / Budget pick / Upgrade pick", testes documentados, seção Deals | Picks nomeados (Nossa escolha / Econômico / Upgrade) — já no padrão `reviewprodutos`; seção de ofertas curada | Afiliados + assinatura NYT | [NÃO VERIFICADO] nesta rodada; já documentado em `/home/user/reviewprodutos/docs/PESQUISA-REFERENCIAS.md` |
| Primer Magazine | EUA | https://www.primermagazine.com/ | Lifestyle masculino "para quem está começando a vida adulta"; nav por verbos **Live, Earn, Spend, Learn, Invest, Train, Love**; franquias "The Getup", **"1 Look, 3 Budgets"**, "The Intentional Apartment", "Primer Approved Products", "Gift Guides", "It's Friday… Have a Drink", "100 Days of Fitness"; newsletter ~30 mil "spam free" | Filtros-verbo secundários; formato **"1 produto, 3 orçamentos"**; guias de presente; desafio "100 dias de treino" como `challenge` | Afiliados (disclaimer), deal picks (Prime Day etc.) | [VERIFICADO] home aberta |
| Gear Patrol | EUA | https://www.gearpatrol.com/ ; https://www.gearpatrol.com/about/about-gear-patrol-magazine/ | Guias de compra evergreen por categoria (Motoring, Watches, Outdoors, Tech, Food & Drink, Style, Home, Fitness, Deals); submenus "Guides"; seções Buying Guides / How-Tos / Reviews / Shop Smarter; **"Deals of Note"**; newsletter diária "Today in Gear"; **"Pitch a Product"**; sorteios patrocinados | Guias evergreen "Os melhores X" com selo "(Atualizado AAAA)"; página `/loja/ofertas` diária; formulário "Indique um produto para teste"; sorteios patrocinados na Irmandade | Afiliados (Skimlinks), media kit, Gear Patrol Studios, revista impressa | [VERIFICADO] home aberta |
| The Dad | EUA | https://www.thedad.com/ | Humor de pai como marca: Dad Jokes, Dadisms, "The Dad Law", memes, "Dad Grades", **"Father Figures"** (histórias enviadas por leitores), vídeos "The Dad Break"; nav News, Entertainment, Dad Jokes, Lifestyle (DIY, Lawn Care, Grilling, Beer, Cars), Best Of, Community, Gaming; newsletter semanal; loja shop.thedad.com (calendário, livro) | Seção **"Piadas de Pai"** + "Lei do Pai" (cards para redes); chamada mensal de histórias "Meu pai me ensinou"; loja própria com calendário/livro | Branded content ("In partnership with"), merch, publicidade (BDG) | [VERIFICADO] home aberta |

### 2.2 Referências brasileiras

| Nome | País | URL | O que faz bem | O que trazer para o Vocação de Pai | Monetização | Verificado? |
|---|---|---|---|---|---|---|
| Paizinho, Vírgula! (Thiago Queiroz) | Brasil | https://paizinhovirgula.com/ ; https://rollingstone.com.br/?p=191135 | Maior referência BR de paternidade afetiva: podcast 520+ episódios semanais (Abrace Podcasts), textos, vídeos, livros, jogos, palestras; seções Podcasts, Textos, Vídeos, Livros, Jogos, Eventos e Palestras, Newsletter ("dicas e ferramentas por e-mail"), Publicidade, Apoie | Página "Publicidade" como mídia kit; "Apoie" como variante do plano pago; newsletter com "ferramentas por e-mail" | Financiamento coletivo (Apoia.se), publicidade, palestras, livros/jogos | [VERIFICADO] home aberta |
| PapodeHomem | Brasil | https://www.meioemensagem.com.br/womentowatch/pais-influenciadores-ajudam-a-ressignificar-a-paternidade | Portal masculino com 10+ anos e comunidade sobre paternidade | Comunidade/fórum masculino (referência de tom para a Irmandade) | — | [NÃO VERIFICADO] site não aberto; citado em matéria |
| Churrasqueadas | Brasil | https://churrasqueadas.com.br/ | Biblioteca de ~1.294 vídeos **filtrável por tipo de carne, corte e técnica**; 4 cursos online + "Academia do Espetinho" (Hotmart, R$ 47 a R$ 657; Academia R$ 197); canal Telegram; workshop presencial; loja própria + Mercado Livre; **página de mídia kit com faixas de verba** | Filtro "carne × corte × técnica" (tabela Carne × Preparo); curso pago "Churrasco do Pai"; canal Telegram/WhatsApp da Irmandade; página `/anuncie` com faixas | Cursos (Hotmart), produtos próprios, workshop pago, serviços (eventos, "Visita Premium"), publicidade | [VERIFICADO] home aberta |
| Netão Bom Beef | Brasil | https://www.band.com.br/receitas/noticias/qual-o-melhor-corte-de-carne-netao-diz-a-escolha-perfeita-para-cada-preparo-202409271558 ; https://www.band.com.br/receitas/noticias/como-comprar-picanha-boa-aprenda-a-identificar-o-corte-de-carne-202409141454 | Açougueiro-influencer (8º mais influente do churrasco no mundo); rede Bom Beef com 30+ lojas; conteúdo "como identificar o corte", "qual corte para cada preparo", "gordura para cima ou para baixo" | Conteúdo didático curto por corte (campo "como identificar no açougue" na ferramenta de cortes); "qual corte para cada preparo" | Franquia de açougues/restaurante, mídia | [VERIFICADO] via busca (matérias da Band) |
| Padre Paulo Ricardo | Brasil | https://padrepauloricardo.org/ | Plataforma católica completa: cursos por categoria (inclui "Família"), 370 episódios "Conversas de Família", **área de membros** (Meus cursos, Minha assinatura, Biblioteca Digital), app iOS/Android, loja de livros/ebooks; e-book gratuito como isca ("O Matrimônio"); liturgia diária | Modelo de membro: assinatura + **Biblioteca do Pai** + "Minhas trilhas"; e-book gratuito como isca de cadastro; liturgia/oração do dia no painel | Assinatura mensal, cursos, livros/ebooks, doações | [VERIFICADO] home aberta |
| Homem Virtuoso | Brasil | homemvirtuoso.com.br | — | — | — | [NÃO VERIFICADO] DNS não resolveu; busca sem retorno |
| Exodus 90 Brasil / Fraternus Brasil / Canção Nova (homens) | Brasil | — | — | Confirmar se Exodus 90 tem app em português (sugestão: exodus90.com/pt) antes de citar como referência nacional | — | [NÃO VERIFICADO] sem resultado nas buscas |
| Papo de Pai, 4Daddy, Lado Pai, Pais&Filhos (site), Crescer (pais), Men's Health (pais) | Brasil/EUA | — | — | Possíveis concorrentes diretos em SEO de paternidade; mapear palavras-chave na fase 8 | — | [NÃO VERIFICADO] buscas não retornaram os sites oficiais |
| Nerd Pai (Jorge Freire), Marcos Piangers, podcast "O Pai Tá Onde?", "Paternidade Sem Vergonha", "Café com Pais" (Universidade de Pais) | Brasil | https://rephonic.com/podcasts/paternidade-sem-vergonha ; https://www.podengine.ai/podcasts/cafe-com-pais | Ecossistema de podcasts BR de paternidade; podcast + comunidade | Parcerias de divulgação (entrevistas cruzadas) e seção "Novidades" do Blog | Patrocínio/palestras | [VERIFICADO] via busca (diretórios de podcast) |

### 2.3 Referências de review de produtos (já documentadas no grupo)

Já pesquisadas em profundidade em `/home/user/reviewprodutos/docs/PESQUISA-REFERENCIAS.md` (227 KB). Não repetir a pesquisa; reaproveitar o padrão.

| Nome | País | O que faz bem | O que o Pai Indica herda | Verificado? |
|---|---|---|---|---|
| Wirecutter (NYT) | EUA | Picks nomeados, método documentado, "Deals" | Picks "Nossa escolha / Econômico / Upgrade"; seção "Como avaliamos" com critérios e pesos | [VERIFICADO] no doc do reviewprodutos |
| RTINGS | Canadá | Medições quantitativas, notas por uso | "Um dado próprio por artigo" (tabela, medição, matriz "melhor para") | [VERIFICADO] no doc do reviewprodutos |
| OutdoorGearLab, Tom's Guide, PCMag, Which? | EUA/RU | Testes comparativos, prós/contras explícitos | `pros`/`cons` ≥2 itens → `positiveNotes`/`negativeNotes` no JSON-LD | [VERIFICADO] no doc do reviewprodutos |
| Buscapé / Zoom | Brasil | Comparador de preços (sem contras explícitos) | Fonte de **faixa de preço** em `product_price_checks` (nunca preço Amazon) | [VERIFICADO] no doc do reviewprodutos |
| TechTudo, Canaltech, Tecnoblog | Brasil | Notícia de tecnologia | Posicionamento: "o guia honesto de qualquer categoria, organizado pelo problema do leitor" | [VERIFICADO] no doc do reviewprodutos |

---

## 3. O que vamos trazer de fora — funcionalidades concretas por módulo e fase

Cada linha indica: funcionalidade | referência de origem | módulo | fase de execução | tabelas/rotas envolvidas (nomes fixos do BRIEF).

### 3.1 Blog (`/blog`, `/post/$slug`, `/categoria/$slug`, `/busca`) — Fase 1

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Categorias por pilar de vida: Pai, Marido, Provedor, Corpo, Fé, Habilidades, Estilo, Churrasco & Mesa, Dinheiro | Fatherly, AoM, Primer | 1 | `categories` (seed em `0002_blog.sql`, `sort_order` 1–9, `color` por categoria) |
| Filtros-verbo secundários: Viver / Ganhar / Gastar / Aprender / Investir / Treinar / Amar | Primer | 1 | `tags` com prefixo `verbo-` + `post_tags`; chips no topo de `/blog` |
| Hub por idade do filho (0-1, 1-3, 3-6, 6-10, 10-14, 14-18, filho adulto) | Fatherly, NFI | 1 (hub) / 5 (personalização) | `tags` com prefixo `idade-`; rota `/blog/por-idade`; na fase 5 cruza com `children.birth_date` |
| Franquias editoriais com slug fixo e template próprio ("Fim de semana de 940", "Piadas de Pai", "Meu pai me ensinou") | Fatherly, The Dad, Primer | 1 (estrutura) / 8 (rotina) | `tags` do tipo `serie-*`; template de card por série; rotina diária gera 1 post por série/semana |
| Newsletter diária curta "Jogada do Dia" (1 ação + 1 link) com opção diária/semanal | All Pro Dad, AoM, Gear Patrol | 1 (cadastro) / 8 (envio) | `newsletter_subscribers.segments` = `["diaria"]` ou `["semanal"]`; Resend; cron `POST /api/cron/newsletter` |
| Semáforo do pai + callout "Virtude/versículo da semana" | Vocação de Mãe, Fraternus, Those Catholic Men | 1 | Extensões Tiptap `callout` (verde/atenção/alerta) + bloco `virtude-da-semana` lido de `_tmp_post_staging` ou `tracks` |
| Seção "Novidades" (notícias curtas com `kind='noticia'`) | Portal da AI, The Dad "News" | 1 | `posts.kind='noticia'`; listagem `/blog?kind=noticia` |
| Lista viva "Filmes para ver com o filho antes dos 10" com checkbox por membro | Fatherly | 1 (lista) / 5 (checkbox) | `posts.kind='lista'`; `saved_items.item_type='post'` + `item_id` = `slug#item-N` |
| Busca full-text em português | Vocação de Mãe, Supabase docs | 1 | `posts.search_content tsvector` gerado (`to_tsvector('portuguese', …)`), índice GIN, `websearch_to_tsquery` |

### 3.2 Pai Indica (`/pai-indica`, `/pai-indica/$slug`) — Fase 2

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Três formatos: review individual, comparativo, lista — com veredito em 30 segundos no topo | reviewprodutos (Wirecutter, RTINGS) | 2 | `posts.kind in ('review','comparativo','lista')`; `posts.review jsonb` (score 0–10, critérios com pesos somando 100) ; `posts.comparison jsonb` |
| Picks nomeados: Nossa escolha / Econômico / Upgrade | Wirecutter | 2 | Selos no `comparison.items[].badge` (`escolha-do-editor`, `melhor-custo-beneficio`, `melhor-premium`) |
| **"1 produto, 3 orçamentos"** (Econômico / Equilibrado / Premium) com 3 botões "Comprar agora na Amazon" | Primer "1 Look, 3 Budgets" | 2 | `comparison.layout='tres-orcamentos'`; componente `TresOrcamentos.tsx`; cada item aponta para um `products.id` |
| Guias evergreen "Os melhores X" com selo "(Atualizado AAAA)" visível | Gear Patrol | 2 | `posts.updated_at` exibido; selo quando `updated_at - created_at > 60 dias` |
| Subcategoria "Churrasqueiras, facas e acessórios" com ratings de equipamento | AmazingRibs | 2 | `posts.product_category='churrasco'`, `product_subcategory in ('churrasqueiras','facas','acessorios')` |
| Formulário "Indique um produto para teste" (fila votada) | Gear Patrol "Pitch a Product" | 2 (form) / 5 (voto) | Reaproveita `job_referrals` com `kind='produto'`? **Não** — manter `job_referrals` só para Pai Indica Pai; usar `_tmp_post_staging` com `k='sugestao:<uuid>'` na fase 2 e tabela própria só se houver volume (decisão registrada em `02-arquitetura-e-stack.md`) |
| JSON-LD `Product` + `Review` com `bestRating: 10, worstRating: 0`, `positiveNotes`/`negativeNotes` ≥2 | Google Review Snippet | 2 | Componente `JsonLdReview.tsx`; nunca `aggregateRating` sem avaliações próprias; nunca `offers.price` |
| Página de autor real (foto, bio, `sameAs`) — nunca "Redação" | Google E-E-A-T | 2 | `profiles` com `role='editor'`; rota `/autor/$slug` (institucional, fase 2) |

### 3.3 Loja do Pai (`/loja`, `/loja/categoria/$slug`, `/loja/$slug`) — Fase 3

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Página "Ofertas que valem" (até 10 itens/dia, faixa de preço, "por que vale") | Gear Patrol "Deals of Note", Primer "Deal Picks" | 3 (página) / 8 (rotina) | Rota `/loja/ofertas`; `products.featured=true` + `product_price_checks` recentes (≤ 7 dias) |
| Guias de presente por ocasião (Dia dos Pais, Natal, aniversário do filho, para a esposa, para o padrinho) | AoM Gift Guides, Primer | 3 | `product_categories` com `slug` `presentes-*`; rota `/loja/categoria/presentes-dia-dos-pais` etc.; renovação anual com selo |
| Faixa de preço "R$ X – R$ Y (pesquisa em 2 lojas, dd/mm/aaaa)" — nunca preço exato | Regras Amazon Associados BR | 3 | `products.price_min`, `price_max`, `price_range_checked_at`; `product_price_checks (store, price, url, checked_at)`; validação `price_max <= 3 * price_min` |
| Botão único "Comprar agora na Amazon" com `rel="sponsored noopener"` e `target=_blank` | Regras do grupo | 3 | Componente `BotaoAmazon.tsx` gera `https://www.amazon.com.br/dp/{asin}?tag={TAG}` a partir de `products.asin` |
| Links alternativos (Mercado Livre, Shopee, Magalu) na mesma camada de disclosure | reviewprodutos §6.16 | 3 (campo) / 8 (cadastro) | `products.marketplace_urls jsonb` (≤3, nunca Amazon) |
| Loja própria do grupo (Caderno do Pai, camiseta, calendário "Jogada do Dia") | The Dad, Churrasqueadas | 7 | `products.affiliate_network='proprio'`; checkout via Mercado Pago Checkout Pro (link) |
| Imagens: nunca da Amazon; ordem fabricante → própria → Wikimedia/Pexels | Portal da AI, Amazon | 3 | `products.image_url` + `images jsonb` com `source` |

### 3.4 Caixa de Ferramentas (`/ferramentas`, `/ferramentas/$slug`) — Fase 4

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| **Conversor de moedas** com PTAX oficial + câmbio comercial e rótulo "Atualizado às HH:MM" | BCB, AwesomeAPI, Frankfurter, ER-API | 4 | `/ferramentas/conversor-de-moedas`; server function `getMarketData(keys)` lê `market_cache` |
| **Mercado financeiro** (Dólar, PTAX, Euro, Ibovespa, 4 blue-chips, BTC/ETH, SELIC, CDI, IPCA) | BCB SGS, Brapi, CoinGecko | 4 | `/ferramentas/mercado-financeiro`; chaves fixas em `market_cache` (seção 6.2) ; disclaimer "Dados com atraso de até 30 minutos; não é recomendação de investimento." |
| **Guia Interativo de Cortes do Boi** (SVG clicável → nome BR/gringo, textura, faixa de preço, melhor preparo, erro comum com semáforo) | AmazingRibs, Serious Eats, Netão | 4 | `/ferramentas/cortes-de-carne`; dados em `src/data/cortes.ts`; `tool_usage` registra uso |
| **Calculadora de Churrasco** (g por adulto/criança, pão, carvão, bebida → lista de compras com faixa e botão Amazon para carvão/acessórios) | Churrasqueadas, AmazingRibs | 4 | `/ferramentas/calculadora-de-churrasco`; cruza com `products` da subcategoria `churrasco` |
| Tabela **Carne × Preparo** filtrável ("quero fazer ensopado" → cortes com colágeno) | Churrasqueadas, Netão | 4 | `/ferramentas/carne-x-preparo`; mesmo `src/data/cortes.ts` |
| Ferramenta **"15 minutos com seu filho"** (5/15/60 min → ideia de vínculo por idade) | Focus on the Family | 4 | `/ferramentas/15-minutos`; dados em `src/data/ideias-vinculo.ts`; na fase 5 filtra por `children` |
| Calculadoras herdadas do Vocação de Mãe (adaptadas: idade do filho, data provável do parto, orçamento familiar) | Vocação de Mãe | 4 | Copiar `src/routes/ferramentas/*` e trocar textos/categorias |
| PDFs imprimíveis (checklist de rotina, carta ao filho, tabela de tarefas) | All Pro Dad | 4 | `@react-pdf/renderer` em server function; download direto |

### 3.5 Área do Pai (`/area-do-pai`, `/minha-conta`, `/entrar`, `/cadastro`) — Fase 5

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Perfil com filhos e idades → home personalizada | NFI, Fatherly | 5 | `profiles` + `children (birth_date, sex)`; componente `FeedPorIdade.tsx` |
| **Check-up do Pai** (20 perguntas → radar Presença/Provisão/Proteção/Fé/Corpo → trilha recomendada) | NFI "Father Friendly Check-Up" + "Program Selection Tool" | 5 | Rota `/area-do-pai/check-up`; resultado em `track_progress` (step especial `checkup`) e `profiles.onboarding_done=true` |
| Biblioteca do Pai (ebooks exclusivos; gratuito = 2, pago = todos) | Padre Paulo Ricardo, AmazingRibs | 5 | `plans.features jsonb` (`{"ebooks":"todos"}`); arquivos em Supabase Storage bucket `biblioteca` com RLS por plano |
| Plano pago **"Promessa do Pai"** (trial 14 dias, reembolso, bolsa sob pedido, sem anúncios) | Exodus 90, Pitmaster Club | 5 (tabelas) / 7 (gateway) | `plans`, `subscriptions (provider='mercadopago')`; componente `AdSlot.tsx` não renderiza para assinante ativo |
| Itens salvos (post, produto, ferramenta, vaga, trilha) | Vocação de Mãe | 5 | `saved_items (item_type, item_id)` |
| Login: magic link (Resend SMTP) + Google OAuth | Supabase docs | 5 | `signInWithOtp` + `signInWithOAuth({provider:'google'})`; rota `/auth/confirm` com `verifyOtp({token_hash,type:'email'})` |
| Contador "Faltam X fins de semana até seu filho fazer 18" | Fatherly "940 Weekends" | 5 | Cálculo client-side a partir de `children.birth_date` |
| Canal Telegram/WhatsApp da Irmandade (link no painel) | Churrasqueadas | 5 | Link estático em `/area-do-pai`; conteúdo "Jogada do Dia" replicado manualmente até a fase 8 |

### 3.6 Pai Indica Pai (`/pai-indica-pai/*`) — Fase 6

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Vagas com "pai padrinho" (quem indica acompanha o candidato) | Exodus 90 (âncora), Fraternus (captains) | 6 | `jobs` + `job_referrals (referred_by)`; ranking "pais que mais indicaram" |
| JSON-LD **JobPosting** completo (title, description HTML, datePosted, hiringOrganization, jobLocation/addressCountry, validThrough, baseSalary, employmentType, TELECOMMUTE + applicantLocationRequirements) | Google for Jobs | 6 | Componente `JsonLdJob.tsx` em `/pai-indica-pai/vagas/$slug`; vaga expirada → `validThrough` no passado + 410 |
| Diretório **"Pai Profissional"** com selo "Indicado por N pais" | Gear Patrol invertido, Churrasqueadas | 6 | `professionals` + contador em `job_referrals (kind='profissional')` |
| Mentoria "Pai Indica Pai" (30 min, fila, áreas) | Exodus 90, Fraternus, NFI | 6 | `mentorships (mentor_id, mentee_id, area, status)`; e-mail de check-in semanal via Resend |
| Formulários com Turnstile e moderação em `/admin` | Cloudflare, Dad.info | 6 | `jobs.status='pending'` → `/admin/vagas`; `moderation_log` |
| Expiração automática de vagas (60 dias) | Google for Jobs | 6 (coluna) / 8 (cron) | `jobs.expires_at`; cron diário `POST /api/cron/jobs-expire` |

### 3.7 Irmandade (`/irmandade`, `/historias`, `/perguntas`, `/eventos`) — Fase 7

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Fórum Perguntas & Respostas moderado por voluntários com selo "irmão moderador" | Dad.info | 7 | `questions`/`answers` (`votes`, `is_best`, `best_answer_id`); `profiles.role='editor'` modera; `moderation_log` |
| Histórias enviadas ("Meu pai me ensinou"), chamada temática mensal | The Dad "Father Figures", Focus on the Family | 7 | `stories (status, likes)`; tag mensal em `title`; e-mail especial no Dia dos Pais |
| Eventos presenciais/online com **Kit de Encontro Pai & Filho** (PDF de 35 min) | All Pro Dad chapters, Fraternus | 7 | `events`/`event_rsvps`; PDF gerado por server function; `events.online` |
| Fraternidade pequena de 4–6 homens com check-in semanal | Exodus 90 | 7 | Grupos = `challenge_progress` agrupados por `challenge_id` + turma; `mentorships` como "âncora" |
| Sorteios patrocinados para membros | Gear Patrol, AmazingRibs | 7 | Post `kind='noticia'` + formulário; regras em `/termos-de-uso` |
| Mapa/lista de pais por cidade (para encontros) | All Pro Dad chapters | 7 | `profiles.city`, `profiles.uf` (opt-in em `/minha-conta`) |

### 3.8 Formação (`/formacao`, `/formacao/$slug`, `/desafios`, `/desafios/$slug`) — Fase 7

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Trilhas em 4 pilares com versículo fixo (Casa, Trabalho, Corpo, Alma) | Those Catholic Men | 7 | `tracks.level` + tag de pilar em `tracks.description` (front) ; seed em `0006_irmandade_formacao.sql` |
| **Trilha "33 dias com São José"** (leitura + oração + ação por dia; badge final; turmas 4x/ano) | Consagração a São José | 7 | `tracks (estimated_days=33)` + 33 `track_steps (type='leitura')`; `badges.slug='consagrado-a-sao-jose'` |
| **Desafio "90 dias do Pai"** (oração, disciplina, fraternidade; check-in diário; turma na 1ª segunda de janeiro e na Quaresma) | Exodus 90 | 7 | `challenges (days=90)` + `challenge_days`; `challenge_progress (started_at, done_at)` |
| Badges por habilidade ("Afiou a faca", "Montou a fogueira", "Fez o orçamento", "Leu 1 livro com o filho") | The Strenuous Life | 7 | `badges.rule jsonb` (`{"track":"slug"}` ou `{"challenge":"slug","days":90}`); `user_badges` |
| Turmas (coortes) com data de início/fim | The Strenuous Life | 7 | `challenges.status in ('draft','open','running','closed')` + campo de data em `challenge_days` (dia 1 = data da turma) |
| **Caderno do Pai** (PDF personalizado ao concluir trilha; versão impressa na Loja) | NFI 24/7 Dad | 7 | Server function `gerarCadernoDoPai(track_id)` com `@react-pdf/renderer`; `products` com `affiliate_network='proprio'` |
| Virtude da Semana (widget + arquivo) | Fraternus | 7 (dados) / 8 (cron) | Tabela reaproveitada: `track_steps` de uma `track` `slug='virtudes'` com `position` = semana do ano |
| Curso pago em vídeo "Churrasco do Pai" (8 aulas) | Churrasqueadas | 7 | `tracks.is_premium=true`, `track_steps.type='video'` (Vimeo/YouTube não listado); `plans` |
| Trilha gratuita "Pai presente mesmo longe" (pais separados) | Dad.info | 7 | `tracks.is_premium=false`; conteúdo da seção 5.1 (guarda, pensão) |

### 3.9 Automação, rotinas e painel — Fase 8

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Rotina diária de artigos (Padrão A artigo + Padrão B review/comparativo), PR `claude/*` com auto-merge | Vocação de Mãe, reviewprodutos | 8 | `docs/rotinas/lote.md`; `_tmp_post_staging` para rascunhos; validador de conteúdo (sem `R$`, sem preço Amazon, sem "testamos") |
| Rotina "Jogada do Dia" (30 jogadas/mês) + envio diário | All Pro Dad | 8 | Cron `POST /api/cron/newsletter` (GitHub Actions 07:07 BRT) |
| Cron de mercado a cada 2 h em dias úteis | res-tecnico | 8 | `.github/workflows/market.yml` → `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://vocacaodepai.com.br/api/cron/market` |
| Painel Lisieux: entrada `vocacaodepai` em `SITES`, secret `GA4_PROPERTY_VOCACAODEPAI`, rotinas `rt-vocacaodepai-*` com `company:"f1"` | grupovdp | 8 | Checklist 2.9 de `inv-reviewprodutos-grupovdp.md`; `node scripts/agente.mjs inicio rt-vocacaodepai "<tarefa>" f1` |
| Ofertas do dia (rotina pesquisa 2 lojas e grava `product_price_checks`) | Gear Patrol | 8 | Rotina semanal; nunca lê preço da Amazon |
| Página `/anuncie` (mídia kit com faixas) | Churrasqueadas, Dad.info | 8 | Página estática + formulário com Turnstile |

---

## 4. Ideias e surpresas — lista deduplicada e numerada

Regras de leitura: **Prioridade** alta/média/baixa; **Fase** = quando entra no plano; **Módulo** = nomes fixos. As 15 de maior impacto estão marcadas com ★ e repetidas na seção 4.2.
Ideias 1–34 vêm de `res-sites.md`; 35–48 foram acrescentadas pelo redator a partir de `res-tecnico.md`, das regras do grupo e das lacunas percebidas.

### 4.1 Lista completa (48 ideias)

| # | Ideia | Descrição | Módulo | Fase | Prioridade |
|---|---|---|---|---|---|
| 1 ★ | **Jogada do Dia (e-mail diário)** | E-mail de 5 linhas com uma ação prática para fazer com o filho hoje (modelo "Play of the Day", 200 mil assinantes). Opção diária ou semanal no cadastro. Rotina gera 30 jogadas por mês a partir do Blog. | Blog / newsletter | 1 (cadastro) · 8 (rotina) | alta |
| 2 ★ | **Hub "Por idade do filho"** | `/blog/por-idade` com 7 faixas (0-1 até filho adulto). Membro com filhos em `children` vê a home filtrada pela idade atual dos filhos (Fatherly, NFI). | Blog + Área do Pai | 1 · 5 | alta |
| 3 ★ | **Série "Fim de semana de 940"** | Franquia fixa (940 = fins de semana até os 18 anos): a cada semana uma atividade pai-filho com custo, tempo e idade. Contador no painel: "Faltam X fins de semana até seu filho fazer 18". | Blog + Área do Pai | 1 · 5 | alta |
| 4 ★ | **Guia Interativo de Cortes do Boi** | `/ferramentas/cortes-de-carne`: diagrama SVG clicável → nome BR + nome gringo, textura, faixa de preço, melhor preparo, tempo, "Sinal verde/atenção/alerta" do erro comum. Base: AmazingRibs cuts-of-meat, Serious Eats, Netão. | Caixa de Ferramentas | 4 | alta |
| 5 ★ | **Calculadora de Churrasco** | Gramas de carne, pão, carvão e bebida por adulto/criança; gera lista de compras com faixa de preço e botão "Comprar agora na Amazon" para carvão/acessórios. | Caixa de Ferramentas + Loja do Pai | 4 | alta |
| 6 ★ | **"1 produto, 3 orçamentos"** | Formato de comparativo (Primer "1 Look, 3 Budgets"): Econômico / Equilibrado / Premium para o mesmo item (faca, furadeira, relógio). Três botões "Comprar agora na Amazon". | Pai Indica | 2 | alta |
| 7 ★ | **Check-up do Pai** | Quiz de 20 perguntas (NFI) que devolve radar (Presença, Provisão, Proteção, Fé, Corpo) e recomenda uma trilha de Formação. Resultado salvo em `track_progress`. | Área do Pai + Formação | 5 | alta |
| 8 ★ | **Trilha "33 dias com São José"** | Consagração em 33 passos (leitura curta + oração + ação), dia final de consagração e badge. Base: Pe. Donald Calloway. Turmas 4x/ano. | Formação | 7 | alta |
| 9 ★ | **Desafio "90 dias do Pai"** | Versão própria do modelo Exodus 90: oração, disciplina (sem álcool/telas à noite), fraternidade. `challenge_days` com check-in diário e grupo fechado de 4-6 homens. Turmas na 1ª segunda de janeiro e na Quaresma. | Formação + Irmandade | 7 | alta |
| 10 | Âncora (par de responsabilidade) | Cada membro de um desafio recebe um "âncora" com check-in semanal por e-mail automático: "Como foi a semana do seu irmão?". `mentorships` reaproveitada. | Irmandade | 7 | média |
| 11 | Kit de Encontro Pai & Filho | PDF mensal com roteiro de 35 minutos (All Pro Dad): pergunta de abertura, jogo, virtude do mês, oração. Para escolas, paróquias e grupos de amigos. Registro em `/eventos`. | Irmandade | 7 | média |
| 12 | Caderno do Pai (PDF por trilha) | Ao concluir cada trilha, gera PDF com nome do pai, nomes dos filhos e respostas dadas (NFI "fathering handbook"). Versão impressa na Loja. | Formação + Loja do Pai | 7 | média |
| 13 | Virtude da Semana | Widget na home e no painel: uma virtude (Fraternus) com versículo, frase de santo e tarefa prática. Cron semanal; arquivo em `/formacao/virtudes`. | Blog + Formação | 7 · 8 | média |
| 14 | Pilares com versículo | Formação em 4 pilares com versículo fixo (Those Catholic Men), adaptados: Casa, Trabalho, Corpo, Alma. | Formação | 7 | média |
| 15 ★ | **Fórum moderado por voluntários** | `questions`/`answers` com papel "irmão moderador" voluntário e selo (Dad.info/Spurgeons). Fila de moderação em `/admin`. | Irmandade | 7 | alta |
| 16 | Pais separados: trilha e seção | Categoria `/categoria/pai-separado` + trilha gratuita "Pai presente mesmo longe" (guarda, pensão, rotina). Tom católico: não incentiva separação, mas acolhe (Dad.info "Parenting After Separation"). | Blog + Formação | 1 · 7 | média |
| 17 | Histórias "Meu pai me ensinou" | Chamada mensal de histórias enviadas (The Dad "Father Figures"). Melhores viram post da semana e e-mail especial no Dia dos Pais. | Irmandade | 7 | média |
| 18 ★ | **Ofertas que valem (diário)** | `/loja/ofertas` atualizada por rotina com até 10 itens, faixa de preço, "por que vale" (Gear Patrol "Deals of Note", Primer "Deal Picks"). | Loja do Pai | 3 · 8 | alta |
| 19 ★ | **Guias de presente por ocasião** | `/loja/categoria/presentes-*`: Dia dos Pais, Natal, aniversário do filho, para a esposa, para o padrinho. 10 itens com faixa de preço, renovados anualmente com selo "(Atualizado 2026)". | Loja do Pai + Pai Indica | 3 | alta |
| 20 | Indique um produto para teste | Formulário "Quer que a gente avalie?" (Gear Patrol "Pitch a Product"); os mais votados entram na fila do Pai Indica. | Pai Indica + Área do Pai | 2 · 5 | baixa |
| 21 | Biblioteca do Pai (ebooks) | Ebooks curtos exclusivos (Padre Paulo Ricardo, AmazingRibs "Deep Dive"): "Guia do churrasco perfeito", "Primeiro ano do bebê para pais", "Orçamento familiar em 5 passos". Gratuito = 2 ebooks; pago = todos. | Área do Pai | 5 | média |
| 22 | Plano pago com "Promessa do Pai" | Plano anual com trial de 14 dias, reembolso se não ajudar e bolsa sob pedido (Exodus 90 "Apostolate Promise"). Benefícios: sem anúncios, biblioteca, grupos fechados, PDFs. | Área do Pai | 5 (tabelas) · 7 (gateway) | média |
| 23 | Turmas (coortes) de Formação | Trilhas abertas por "turma" com data de início e encerramento (The Strenuous Life abre matrícula 1x/ano). Gera urgência e grupo coeso. | Formação | 7 | média |
| 24 | Badges de habilidade | Insígnias por habilidade concluída (The Strenuous Life): "Afiou a faca", "Montou a fogueira", "Fez o orçamento", "Leu 1 livro com o filho". No perfil público da Irmandade. | Formação + Área do Pai | 7 | média |
| 25 ★ | **"15 minutos com seu filho"** | O pai escolhe quanto tempo tem (5/15/60 min) e recebe uma ideia de vínculo (Focus on the Family "Busy Dad's Playbook"). Vira tool `/ferramentas/15-minutos` e trilha. | Caixa de Ferramentas + Formação | 4 · 7 | alta |
| 26 | Piadas de Pai (seção de humor) | Seção leve "Piadas de Pai" + "Lei do Pai" (The Dad) para redes; gera cards OG para Instagram. | Blog | 1 | baixa |
| 27 | Filmes para ver com o filho antes dos 10 | Lista viva (Fatherly) com checkbox por membro ("já vimos") e filtro por idade. | Blog + Área do Pai | 1 · 5 | baixa |
| 28 ★ | **Mentoria "Pai Indica Pai" com fila** | Pais experientes (contador, mecânico, pediatra, padre) oferecem 30 min; outro pai agenda. `mentorships` + `professionals`. Selo "Indicado por N pais". | Pai Indica Pai | 6 | alta |
| 29 ★ | **Vagas com padrinho** | Cada vaga em `jobs` pode ter "pai padrinho" (`job_referrals`) que indica e acompanha o candidato; ranking de "pais que mais indicaram". | Pai Indica Pai | 6 | alta |
| 30 | Mídia kit e patrocínio de seção | Página `/anuncie` com faixas (Churrasqueadas; Dad.info "Company Sponsorship"): patrocínio de newsletter, de trilha, de seção Churrasco. | Institucional / monetização | 8 | média |
| 31 | Loja própria do grupo | Além do afiliado Amazon, vender itens próprios (The Dad; Churrasqueadas): "Caderno do Pai", camiseta "Vocação de Pai", calendário "Jogada do Dia". | Loja do Pai | 7 | baixa |
| 32 | Ranking "Carne × preparo" | Tabela filtrável (Churrasqueadas; Netão): "quero fazer ensopado" → cortes com colágeno; "grelha rápida" → picanha, maminha, baby beef. | Caixa de Ferramentas | 4 | média |
| 33 | Telegram/WhatsApp da Irmandade | Canal de transmissão (Churrasqueadas usa Telegram) com a Jogada do Dia e avisos de turma. Link na Área do Pai. | Irmandade | 5 | baixa |
| 34 | Curso pago em vídeo "Churrasco do Pai" | Primeiro produto digital pago (Churrasqueadas cobra R$ 47–657): 8 aulas, do fogo ao corte. Hospedado na Formação com `plans`. | Formação + Loja do Pai | 7 | média |
| 35 ★ | **Conversor de moedas com PTAX + "modo viagem"** | Além do câmbio comercial: o PTAX do dia (número do contrato/da fatura) e um modo "quanto levar em espécie" com IOF estimado e tabela de bolso imprimível. Cadeia de fallback da seção 6.3. | Caixa de Ferramentas | 4 | alta |
| 36 ★ | **"Mercado do Pai" (boletim semanal)** | Resumo de sexta-feira gerado a partir de `market_cache`: dólar, SELIC, IPCA, Ibovespa, BTC, "o que isso muda no orçamento da família". Enviado como newsletter semanal e publicado como `kind='noticia'`. | Caixa de Ferramentas + Blog | 4 · 8 | alta |
| 37 | Alerta de câmbio por e-mail | Membro cadastra "avise quando o dólar ficar abaixo de R$ X" (viagem, compra importada). Cron compara com `market_cache` e envia via Resend. | Caixa de Ferramentas + Área do Pai | 5 · 8 | média |
| 38 | Calculadora de orçamento familiar "Provedor" | Renda, despesas fixas, filhos → reserva de emergência, % por categoria, meta de poupança; exporta PDF. Usa CDI/SELIC de `market_cache` para projeções. | Caixa de Ferramentas | 4 | média |
| 39 | Simulador de juros compostos "Pé-de-meia do filho" | Aporte mensal desde o nascimento até os 18 → valor futuro com CDI/IPCA reais (SGS 12/433). Integra com `children.birth_date`. | Caixa de Ferramentas + Área do Pai | 4 · 5 | média |
| 40 ★ | **Guia "Direitos do Pai" (hub legal)** | Página pilar + artigos: licença-paternidade, Lei do Acompanhante, salário-família, pensão, guarda compartilhada, registro do filho, 2 dias para pré-natal (CLT art. 473 X). Cada artigo com "Sinal de atenção: consulte um advogado" e link para a fonte oficial (seção 5.1). | Blog | 1 | alta |
| 41 | Simulador de pensão e guarda (educativo) | Ferramenta que explica o binômio necessidade/possibilidade e mostra cenários de guarda compartilhada (dias por casa). Nunca "calcula" valor legal; sempre "Sinal de alerta: não substitui advogado". | Caixa de Ferramentas | 4 | média |
| 42 | Checklist "Primeiros 30 dias do pai" | Checklist marcável (membro) do nascimento até 30 dias: registro em cartório, salário-família, licença, vacinas, pediatra, sono. Gera PDF. | Caixa de Ferramentas + Área do Pai | 4 · 5 | média |
| 43 | Diário do filho (marcos) | Na Área do Pai: registrar marcos (primeiro sorriso, primeiro passo) por filho com foto opcional; alimenta o contador de 940 fins de semana e lembretes de aniversário. | Área do Pai | 5 | baixa |
| 44 | Carta ao filho (gerador de PDF) | Ferramenta guiada por perguntas → carta formatada em PDF para guardar/entregar aos 18. Versão "Carta ao pai" para o Dia dos Pais. | Caixa de Ferramentas | 4 | baixa |
| 45 | Oração/liturgia do dia no painel | Widget "Oração do pai de hoje" (Padre Paulo Ricardo tem liturgia diária): oração curta + santo do dia + intenção pela família. Dados em `src/data/oracoes.ts`. | Área do Pai + Formação | 5 | média |
| 46 | Cards sociais automáticos (OG) | `@vercel/og` gera imagem 1200×630 para cada post, piada, jogada do dia e review (nota em destaque) — reaproveitada nas redes e no Telegram. | Blog + automação | 1 (base) · 8 | média |
| 47 | Nomes de bebê (ferramenta) | Fatherly tem "Baby Names" como pilar: ferramenta de busca por origem/significado/santo do dia, com lista salva em `saved_items`. | Caixa de Ferramentas | 4 | baixa |
| 48 | Selo "Testado pelo pai" com evidência própria | Reviews com fotos próprias, medição (tempo, peso, consumo) e "o que o fabricante não conta" — exigência do Google Reviews System e diferencial contra "thin affiliate". Campo `review.evidence` no JSON. | Pai Indica | 2 | média |

### 4.2 As 15 ideias de maior impacto (ordem sugerida de entrega)

| Ordem | # | Ideia | Por que é de maior impacto | Fase |
|---|---|---|---|---|
| 1 | 40 | Guia "Direitos do Pai" | Busca de alto volume e baixa concorrência de qualidade; constrói autoridade e E-E-A-T desde a fase 1 | 1 |
| 2 | 1 | Jogada do Dia | Maior motor de retenção comprovado (200 mil assinantes no modelo) ; custo quase zero com Resend | 1 · 8 |
| 3 | 2 | Hub por idade do filho | Organiza o Blog para o pai real, não para o algoritmo; base da personalização | 1 · 5 |
| 4 | 3 | Fim de semana de 940 | Franquia emocional e compartilhável; gera 52 posts/ano com template fixo | 1 · 5 |
| 5 | 6 | 1 produto, 3 orçamentos | Dobra o número de botões "Comprar agora na Amazon" por artigo sem ferir o padrão de honestidade | 2 |
| 6 | 19 | Guias de presente por ocasião | Picos sazonais (Dia dos Pais, Natal) com comissão de 8–13% nas categorias certas | 3 |
| 7 | 18 | Ofertas que valem | Página de retorno diário; alimenta a rotina da fase 8 | 3 · 8 |
| 8 | 4 | Guia Interativo de Cortes do Boi | Ferramenta única no Brasil em formato interativo; isca masculina de maior volume | 4 |
| 9 | 5 | Calculadora de Churrasco | Converte ferramenta em venda (carvão, acessórios) e em compartilhamento em grupos de WhatsApp | 4 |
| 10 | 35 | Conversor com PTAX + modo viagem | Pedido explícito do dono; diferencial "número oficial" frente a conversores genéricos | 4 |
| 11 | 36 | Mercado do Pai (boletim) | Transforma o pedido "mercado financeiro" em conteúdo recorrente e newsletter | 4 · 8 |
| 12 | 25 | 15 minutos com seu filho | Ferramenta + trilha de menor esforço e maior uso diário | 4 · 7 |
| 13 | 7 | Check-up do Pai | Onboarding que "conhece" o pai e encaminha para a Formação; aumenta retenção da Área do Pai | 5 |
| 14 | 28 + 29 | Mentoria e vagas com padrinho | É o "Pai Indica Pai" que o dono pediu; JobPosting traz tráfego do Google for Jobs | 6 |
| 15 | 8 + 9 + 15 | 33 dias com São José, 90 dias do Pai e fórum moderado | O ecossistema de formação e irmandade — o núcleo católico que diferencia o site de qualquer concorrente | 7 |

---
