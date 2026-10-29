# 01 — Referências e benchmarks do Vocação de Pai

> Documento do plano de criação do **Vocação de Pai** (vocacaodepai.com.br). Leitor-alvo: sessões do Claude Code (Sonnet 5.5, esforço médio)
> que executarão as fases 1 a 8 dentro do repositório `/home/user/vocacaodepai`. Tudo em PT-BR. Data de consolidação: 24/10/2026.
>
> Fontes primárias desta consolidação (scratchpad da sessão de planejamento): `res-sites.md` (16 buscas + 16 páginas abertas),
> `res-tecnico.md` (chamadas reais a APIs + docs oficiais), `inv-reviewprodutos-grupovdp.md` (padrão editorial, regras Google/AdSense/Amazon
> já documentadas em `/home/user/reviewprodutos/docs/PESQUISA-REFERENCIAS.md`) e `res-ecossistema.md` (legislação do pai, §C — base da seção 5.1).
> As seções 5, 6 e 7 foram consolidadas em 29/10/2026 a partir de `docs/plano/anexos/res-ecossistema.md`, de
> `res-tecnico.md`, do doc 06 e do `PESQUISA-REFERENCIAS.md` do reviewprodutos, com etiqueta de verificação por item.
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
| 6 | **Monetização em camadas, nunca em uma só.** AoM: afiliados + anúncios + loja + assinatura; AmazingRibs: anúncios + Pitmaster Club (sem anúncios, ebooks, sorteios); Churrasqueadas: cursos Hotmart + loja + mídia kit; Dad.info: patrocínio corporativo. | Art of Manliness, AmazingRibs, Churrasqueadas, Dad.info | Ordem no plano: **AdSense + Amazon Associados** (fases 1–3) → **plano pago `pai-de-valor`** ("Pai de Valor"; nome de exibição a decidir pelo dono — doc 07 §7.3; slug fixo) com trial de 14 dias, "Promessa do Pai" (reembolso + bolsa) e sem anúncios (fase 5) → **produtos próprios** (Caderno do Pai, curso "Churrasco do Pai") e **página /anuncie** com patrocínio de seção (fases 7–8). |
| 7 | **Churrasco e carne são a porta de entrada masculina de maior volume no Brasil.** Churrasqueadas tem ~1.294 vídeos filtráveis por carne × corte × técnica e cursos de R$ 47 a R$ 657; Netão Bom Beef é o 8º influenciador de churrasco do mundo; AmazingRibs tem 2.000+ páginas grátis só de carne. | Churrasqueadas, Netão Bom Beef, AmazingRibs, Serious Eats | Ferramentas **Guia Interativo de Cortes do Boi** (`/ferramentas/cortes-de-carne`), **Calculadora de Churrasco** e tabela **Carne × Preparo**; categoria editorial "Churrasco & Mesa"; subcategoria de reviews "Churrasqueiras, facas e acessórios". |
| 8 | **Dados de mercado: o servidor é a fonte de verdade, nunca o navegador.** Em 24/10/2026 a AwesomeAPI sem chave devolveu `429 QuotaExceeded`; a Brapi exige token para `^BVSP`; o JSON antigo do Tesouro Direto respondeu "gone". | Testes reais (`res-tecnico.md`) | Tabela `market_cache` + rota `POST /api/market/refresh` (`src/lib/market/refresh.ts`, header `Authorization: Bearer CRON_SECRET`) + `.github/workflows/market-refresh.yml` a cada 30 min (doc 02 §1.2 e §7; doc 06 §2.6); **stale-while-revalidate** (sempre renderiza o último payload com "Atualizado às HH:MM"); cadeia de fallback de câmbio em 4 níveis (seção 6.3). |
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
| Exodus 90 | EUA (global) | https://exodus90.com/ ; https://exodus90.com/blog/renewal-of-the-church-through-100000-men/ | App de formação diária (oração, ascese, fraternidade) no calendário litúrgico; 100 mil+ homens desde 2015; **fraternidades de 4–6 com "âncora"** para check-in diário; programas de 90 dias + St. Michael's Lent + Advento; "Community tab"; trial 14 dias; **"Apostolate Promise"** (reembolso); ajuda financeira sob pedido; loja e gift cards | **Desafio "90 dias do Pai"**; **âncora** (par de responsabilidade) via `mentorships`; grupos fechados de 4–6; plano pago `pai-de-valor` com trial de 14 dias + "Promessa do Pai" (reembolso + bolsa) | Assinatura US$ 90/ano (relatos de US$ 10/mês), loja | [VERIFICADO] home aberta; versão PT não confirmada (ver exodus90.com/pt) |
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

> **Regra de leitura desta seção:** a coluna "Implementação concreta" é inspiração; nomes de tabelas, colunas, rotas, componentes e
> variáveis de ambiente são os do doc 02 (`02-arquitetura-e-stack.md` §1.3 rotas, §3 árvore de arquivos, §4 schema SQL, §8 env vars)
> e do `CLAUDE.md`; onde este documento divergir, o doc 02 prevalece. As células já alinhadas em 29/10/2026 citam "(doc 02)" ou
> "(doc NN)"; colunas que só existem no SQL de um doc de fase (ex.: `tracks.is_premium`, doc 09 §2) estão marcadas como
> "coluna adicional".

Cada linha indica: funcionalidade | referência de origem | módulo | fase de execução | tabelas/rotas envolvidas (nomes fixos do BRIEF).

### 3.1 Blog (`/blog`, `/post/$slug`, `/categoria/$slug`, `/busca`) — Fase 1

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Categorias por pilar de vida: Pai, Marido, Provedor, Corpo, Fé, Habilidades, Estilo, Churrasco & Mesa, Dinheiro | Fatherly, AoM, Primer | 1 | `categories` (seed em `0002_blog.sql`, `sort_order` 1–9, `color` por categoria) |
| Filtros-verbo secundários: Viver / Ganhar / Gastar / Aprender / Investir / Treinar / Amar | Primer | 1 | `tags` com prefixo `verbo-` + `post_tags`; chips no topo de `/blog` |
| Hub por idade do filho (0-1, 1-3, 3-6, 6-10, 10-14, 14-18, filho adulto) | Fatherly, NFI | 1 (hub) / 5 (personalização) | `tags` com prefixo `idade-`; rota `/blog/por-idade`; na fase 5 cruza com `children.birth_date` |
| Franquias editoriais com slug fixo e template próprio ("Fim de semana de 940", "Piadas de Pai", "Meu pai me ensinou") | Fatherly, The Dad, Primer | 1 (estrutura) / 8 (rotina) | `tags` do tipo `serie-*`; template de card por série; rotina diária gera 1 post por série/semana |
| Newsletter diária curta "Jogada do Dia" (1 ação + 1 link) com opção diária/semanal | All Pro Dad, AoM, Gear Patrol | 1 (cadastro) / 8 (envio) | `newsletter_subscribers.segments` = `["diaria"]` ou `["semanal"]`; Resend; envio diário `POST /api/newsletter/daily` + `.github/workflows/newsletter-daily.yml` (doc 10 §8.4); semanal = edge function `weekly-digest` + pg_cron (doc 07 §6.6) |
| Semáforo do pai + callout "Virtude/versículo da semana" | Vocação de Mãe, Fraternus, Those Catholic Men | 1 | Extensões Tiptap `callout` (verde/atenção/alerta) + bloco `virtude-da-semana` lido de `_tmp_post_staging` ou `tracks` |
| Seção "Novidades" (notícias curtas com `kind='noticia'`) | Portal da AI, The Dad "News" | 1 | `posts.kind='noticia'`; listagem `/blog?kind=noticia` |
| Lista viva "Filmes para ver com o filho antes dos 10" com checkbox por membro | Fatherly | 1 (lista) / 5 (checkbox) | `posts.kind='lista'`; `saved_items.item_type='post'` + `item_id` = `slug#item-N` |
| Busca full-text em português | Vocação de Mãe, Supabase docs | 1 | `posts.search_content tsvector` gerado (`to_tsvector('portuguese', …)`), índice GIN, `websearch_to_tsquery` |

### 3.2 Pai Indica (`/pai-indica`, `/pai-indica/$slug`) — Fase 2

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Três formatos: review individual, comparativo, lista — com veredito em 30 segundos no topo | reviewprodutos (Wirecutter, RTINGS) | 2 | `posts.kind in ('review','comparativo','lista')`; `posts.review jsonb` (score 0–10, critérios com pesos somando 100) ; `posts.comparison jsonb` |
| Picks nomeados: Nossa escolha / Econômico / Upgrade | Wirecutter | 2 | Selos em `comparison.products[].role` (doc 02 §5.4 / doc 04 §2.4): em `comparativo`, `vencedor` / `custo-beneficio` / `premium` / `alternativa` / `nao-indicamos`; em `lista`, `escolha-do-editor` / `melhor-custo-beneficio` / `melhor-premium` / `melhor-barato`… (no máximo 1 produto por selo) |
| **"1 produto, 3 orçamentos"** (Econômico / Equilibrado / Premium) com 3 botões "Comprar agora na Amazon" | Primer "1 Look, 3 Budgets" | 2 | É um `kind='comparativo'` comum (doc 02 §5.4): 3 `products[]` com `role` `custo-beneficio` (Econômico), `vencedor` (Equilibrado) e `premium`, cada um com `product_slug` existente em `products`; o rótulo "1 produto, 3 orçamentos" vai no título e em `verdict_by_profile[]`. Sem campo `layout` nem componente próprio: usa os componentes de comparativo da Fase 2 (doc 04) |
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
| Botão único "Comprar agora na Amazon" com `rel="sponsored nofollow noopener"` e `target="_blank"` | Regras do grupo (CLAUDE.md §5.1) | 3 | Componente `AffiliateButton` (doc 02 §3 e §6.3; o doc 11 o cita como `<AmazonButton>` — é o mesmo componente): classe `btn-comprar`, anexa `?tag=PUBLIC_AMAZON_TAG` a `products.affiliate_url` (`https://www.amazon.com.br/dp/<ASIN>/?tag=…`), evento GA4 `affiliate_click` |
| Links alternativos (Mercado Livre, Shopee, Magalu) na mesma camada de disclosure | reviewprodutos §6.16 | 3 (campo) / 8 (cadastro) | `products.marketplace_urls jsonb` (≤3, nunca Amazon) |
| Loja própria do grupo (Caderno do Pai, camiseta, calendário "Jogada do Dia") | The Dad, Churrasqueadas | 7 | `products.affiliate_network='outro'` (o `check` do doc 02 §4.3 só aceita `amazon`, `mercadolivre`, `shopee`, `magalu`, `outro`; não existe `'proprio'`) com `affiliate_url` = link do Mercado Pago Checkout Pro |
| Produto: foto oficial da Amazon do ASIN (`m.media-amazon.com`), nunca foto de terceiros; capa composta dos comparativos gerada por `cover_cmp.py` | CLAUDE.md §5.3; Vocação de Mãe (`amz.py`, `cover_cmp.py`) | 3 | `products.image_url` + `images jsonb` (até 8 fotos oficiais obtidas por `python3 scripts/rotina/amz.py <ASIN>`, doc 04 §9); capa composta `scripts/rotina/cover_cmp.py` → `public/images/covers/<slug>.jpg` (doc 04 §6) |

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
| Plano pago **`pai-de-valor`** ("Pai de Valor"; nome de exibição a decidir pelo dono — doc 07 §7.3 sugere "Pai Provedor" como alternativa; slug fixo) com "Promessa do Pai" (trial 14 dias, reembolso, bolsa sob pedido) e sem anúncios | Exodus 90, Pitmaster Club | 5 (tabelas) / 7 (gateway) | `plans` (seed `gratuito` ativo + `pai-de-valor` com `active=false`, CLAUDE.md §11), `subscriptions (provider='mercadopago')`; `AdSlot` não renderiza para assinante ativo (`is_premium()`, doc 07 §7.4) |
| Itens salvos (post, produto, ferramenta, vaga, trilha) | Vocação de Mãe | 5 | `saved_items (item_type, item_id)` |
| Login: e-mail/senha + Google OAuth (CLAUDE.md §11); magic link só como complemento (doc 07 §0) | Supabase docs, doc 07 | 5 | `signInWithPassword` + `signInWithOAuth({provider:'google', options:{redirectTo: origin + '/auth/callback'}})`; rota `/auth/callback` (doc 07 §4.7); SMTP do Resend configurado no Supabase Auth (doc 07 §1) |
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
| Expiração automática de vagas (45 dias) | Google for Jobs | 6 (coluna + pg_cron) | `jobs.expires_at` (default `now() + interval '45 days'`, doc 02 §4.5); função `expire_jobs()` agendada pelo pg_cron `vdp-expire-jobs` em `0008_cron.sql` (doc 02 §4.8); rota `POST /api/cron/expire-jobs` (`Authorization: Bearer CRON_SECRET`) só para disparo manual |

### 3.7 Irmandade (`/irmandade`, `/historias`, `/perguntas`, `/eventos`) — Fase 7

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Fórum Perguntas & Respostas moderado por voluntários com selo "irmão moderador" | Dad.info | 7 | `questions.accepted_answer_id` (função `accept_answer`), `answers.like_count` + tabela `answer_votes` (função `vote_answer`) — doc 02 §4.6 e doc 09 §2; `profiles.role='editor'` modera; `moderation_log` |
| Histórias enviadas ("Meu pai me ensinou"), chamada temática mensal | The Dad "Father Figures", Focus on the Family | 7 | `stories (status, like_count)` + `story_likes` (doc 02 §4.6, doc 09 §2); `stories.category` para a chamada do mês; e-mail especial no Dia dos Pais |
| Eventos presenciais/online com **Kit de Encontro Pai & Filho** (PDF de 35 min) | All Pro Dad chapters, Fraternus | 7 | `events`/`event_rsvps`; PDF gerado por server function; `events.mode in ('online','presencial')` + `city`/`uf`/`address` (doc 02 §4.6) |
| Fraternidade pequena de 4–6 homens com check-in semanal | Exodus 90 | 7 | Grupos = membros com `challenge_enrollments.started_at` na mesma semana para o mesmo `challenge_id` (doc 09 §2); check-in diário em `challenge_progress (user_id, challenge_id, day, completed_at)` (doc 02 §4.6); `mentorships` como "âncora" |
| Sorteios patrocinados para membros | Gear Patrol, AmazingRibs | 7 | Post `kind='noticia'` + formulário; regras em `/termos-de-uso` |
| Mapa/lista de pais por cidade (para encontros) | All Pro Dad chapters | 7 | `profiles.city`, `profiles.uf` (opt-in em `/minha-conta`) |

### 3.8 Formação (`/formacao`, `/formacao/$slug`, `/desafios`, `/desafios/$slug`) — Fase 7

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Trilhas em 4 pilares com versículo fixo (Casa, Trabalho, Corpo, Alma) | Those Catholic Men | 7 | `tracks.level` + tag de pilar em `tracks.description` (front) ; seed em `0006_irmandade_formacao.sql` |
| **Trilha "33 dias com São José"** (leitura + oração + ação por dia; badge final; turmas 4x/ano) | Consagração a São José | 7 | `tracks` (slug `fe-do-pai-33-dias-com-sao-jose`, trilha T4 do doc 09; `estimated_minutes` é a coluna do doc 02 — `estimated_days=33` é coluna adicional do doc 09 §2) + 33 `track_steps` (`position` 1–33, `body` Tiptap com Leitura/Oração/Ação do dia; `type='leitura'` é coluna adicional do doc 09 §2); `badges.slug='filho-de-sao-jose'` (seed do doc 09) |
| **Desafio "90 dias do Pai"** (oração, disciplina, fraternidade; check-in diário; turma na 1ª segunda de janeiro e na Quaresma) | Exodus 90 | 7 | `challenges (days=90`, teto do `check` do doc 02 §4.6`)` + `challenge_days (day, title, task, body)`; check-in em `challenge_progress (user_id, challenge_id, day, completed_at)` (doc 02); início/fim da turma em `challenge_enrollments (started_at, finished_at)` (doc 09 §2) |
| Badges por habilidade ("Afiou a faca", "Montou a fogueira", "Fez o orçamento", "Leu 1 livro com o filho") | The Strenuous Life | 7 | `badges.rule jsonb` (`{"track":"slug"}` ou `{"challenge":"slug","days":90}`); `user_badges` |
| Turmas (coortes) com data de início/fim | The Strenuous Life | 7 | `challenges.status in ('draft','published','archived')` (doc 02 §4.6); a turma é a data de abertura divulgada no post + `challenge_enrollments.started_at` de cada membro (dia N = `started_at` + N−1, doc 09 §2); sem coluna nova em `challenge_days` |
| **Caderno do Pai** (PDF personalizado ao concluir trilha; versão impressa na Loja) | NFI 24/7 Dad | 7 | Server function `gerarCadernoDoPai(track_id)` com `@react-pdf/renderer`; `products` com `affiliate_network='outro'` (doc 02 §4.3) |
| Virtude da Semana (widget + arquivo) | Fraternus | 7 (dados) / 8 (cron) | Tabela reaproveitada: `track_steps` de uma `track` `slug='virtudes'` com `position` = semana do ano |
| Curso pago em vídeo "Churrasco do Pai" (8 aulas) | Churrasqueadas | 7 | `tracks.is_premium=true` e `track_steps.type='video'` + `video_url` (Vimeo/YouTube não listado; `is_premium` e `type` são colunas adicionais do doc 09 §2 — no doc 02 só existe `video_url`); gating por `is_premium()` / `PremiumGate` (doc 07 §7.4); `plans` |
| Trilha gratuita "Pai presente mesmo longe" (pais separados) | Dad.info | 7 | `tracks.is_premium=false` (coluna adicional do doc 09 §2; no lançamento todas as trilhas são gratuitas); conteúdo da seção 5.1 (guarda, pensão) |

### 3.9 Automação, rotinas e painel — Fase 8

| Funcionalidade | Origem | Fase | Implementação concreta |
|---|---|---|---|
| Rotina diária de artigos (Padrão A artigo + Padrão B review/comparativo), PR `claude/*` com auto-merge | Vocação de Mãe, reviewprodutos | 8 | `docs/rotinas/lote.md`; `_tmp_post_staging` para rascunhos; validador de conteúdo (sem `R$`, sem preço Amazon, sem "testamos") |
| Rotina "Jogada do Dia" (30 jogadas/mês) + envio diário | All Pro Dad | 8 | `jogada_gen.py` (lote mensal, doc 10 §4.7) + `POST /api/newsletter/daily` via `.github/workflows/newsletter-daily.yml` às 07:07 BRT (doc 10 §8.4) |
| Cron de mercado a cada 30 min (criado na Fase 4; a Fase 8 só monitora) | res-tecnico, doc 06 §2.6 | 4 (criado) / 8 (monitorado) | `.github/workflows/market-refresh.yml` (`schedule: "*/30 * * * *"`) → `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://vocacaodepai.com.br/api/market/refresh` (doc 02 §1.2 e §7) |
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
| 22 | Plano pago `pai-de-valor` com "Promessa do Pai" | Plano (slug fixo `pai-de-valor`; nome de exibição a decidir pelo dono — doc 07 §7.3) com trial de 14 dias, reembolso se não ajudar e bolsa sob pedido (Exodus 90 "Apostolate Promise"). Benefícios: sem anúncios, biblioteca, grupos fechados, PDFs. | Área do Pai | 5 (tabelas) · 7 (gateway) | média |
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

## 5. Fatos verificados — legislação do pai, Amazon Associados BR, AdSense, Google Reviews System

> Etiquetas desta seção (mesma legenda do cabeçalho): **[VERIFICADO]** = fonte oficial aberta pela pesquisa (`res-ecossistema.md` §C em
> 24/10/2026, ou documento oficial lido no `PESQUISA-REFERENCIAS.md` do reviewprodutos); **[FONTE TERCEIRA]** = só fonte secundária
> (notícia, blog jurídico, comparador); **[VERIFICAR FONTE]** = texto oficial não aberto (503/login) ou divergência entre fontes —
> confirmar no Planalto/DOU antes de publicar. Nada aqui é aconselhamento jurídico, médico ou financeiro: todo artigo derivado termina
> com "Sinal de alerta: … procure um advogado/contador" (CLAUDE.md §3 e §6).

### 5.1 Legislação do pai

Base: `docs/plano/anexos/res-ecossistema.md` §C (linhas 90–160). Alimenta o hub "Direitos do Pai" (ideia 40, §4.2 ordem 1),
a trilha "Pai presente mesmo longe" (§3.8) e as ferramentas `licenca-paternidade` e `pensao-alimenticia` da lista fechada do doc 06 §0.2.

#### 5.1.1 Licença-paternidade — linha do tempo

| Quando | Fato | Fonte oficial | Etiqueta |
|---|---|---|---|
| 1943 | CLT art. 473, III: 1 dia de falta justificada na primeira semana do nascimento (superado pelo ADCT). | https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm | [VERIFICAR FONTE] (Planalto devolveu 503 na pesquisa) |
| 1988 | ADCT art. 10, §1º, CF/88: **5 dias** enquanto não houver lei regulamentando o art. 7º, XIX — regra vigente em 2026. | https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522497&ori=1 | [VERIFICADO] |
| 2008 / 2016 | Empresa Cidadã (Lei 11.770/2008, alterada pela Lei 13.257/2016): +15 dias (total 20) só para empregado de empresa aderente; pedido em até 2 dias úteis após o parto e comprovação de participação em programa de paternidade responsável; vale para adoção; empresa no lucro real deduz do IR. **Não é automático**: o TRT-3 negou a quem não provou a adesão da empresa. | https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11770.htm ; https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13257.htm ; https://portal.trt3.jus.br/internet/conheca-o-trt/comunicacao/noticias-juridicas/importadas-2015-2016/jurisprudencia-do-trt-mg-sobre-direitos-do-pai-trabalhador-26-08-2016-05-57-acs | [VERIFICADO] (lei e TRT-3) + [FONTE TERCEIRA] (resumo: https://blog.grupogen.com.br/juridico/areas-de-interesse/trabalho/prorrogacao-da-licenca-paternidade-lei-13-2572016/) |
| 13–14/12/2023 | STF, ADO 20 (CNTS): omissão inconstitucional do Congresso; prazo de 18 meses para legislar; 5 dias considerados "manifestamente insuficientes"; único voto divergente, Marco Aurélio. | https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522497&ori=1 ; https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522407&ori=1 ; acórdão: https://portal.trt3.jus.br/internet/jurisprudencia/repercussao-geral-e-controle-concentrado-adi-adc-e-adpf-stf/downloads/acordao-de-merito-ado-20.pdf | [VERIFICADO] |
| 08/07/2025 | Prazo do STF venceu sem lei; a regra seguiu em 5 dias. | https://ibdfam.org.br/noticias/13058/Prazo+do+STF+termina+sem+avan%C3%A7o+no+Congresso+sobre+licen%C3%A7a-paternidade ; https://www.migalhas.com.br/quentes/434697/congresso-perde-prazo-do-stf-para-regulamentar-licenca-paternidade | [FONTE TERCEIRA] |
| 31/03–01/04/2026 | **Lei 15.371/2026** sancionada em 31/03/2026 e publicada no DOU em 01/04/2026 (origem PL 3935/2008 do Senado). | https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade ; https://www12.senado.leg.br/noticias/materias/2026/04/01/sancionado-o-aumento-gradual-da-licenca-paternidade ; https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2026-03/lula-sanciona-lei-que-amplia-licenca-paternidade | [VERIFICADO] |
| 2026 → 2029 | Cronograma: **5 dias em 2026**; 10 dias a partir de 01/01/2027; 15 dias em 2028; 20 dias em 2029 (última etapa condicionada a meta fiscal, segundo a ConJur). | https://www12.senado.leg.br/noticias/materias/2026/04/01/sancionado-o-aumento-gradual-da-licenca-paternidade ; https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2026-03/saiba-o-que-muda-com-nova-licenca-paternidade-no-brasil ; https://www.conjur.com.br/2026-abr-10/a-lei-no-15-371-2026-e-a-licenca-paternidade-no-brasil/ | [VERIFICADO] (Senado, Agência Brasil) + [FONTE TERCEIRA] (condição fiscal) |
| Lei 15.371/2026 | Cria o **salário-paternidade** no RGPS (pago pelo INSS ou pela empresa com compensação, como o salário-maternidade): integral para empregados; pela contribuição para autônomos/MEI; 1 salário mínimo para segurado especial; alcança MEI, domésticos, avulsos e segurados especiais. | https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade ; https://www.gov.br/previdencia/pt-br/noticias/2026/marco/governo-sanciona-lei-que-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade | [VERIFICADO] (Câmara) + [VERIFICAR FONTE] (página do Min. Previdência exigiu login) |
| Lei 15.371/2026 | Estabilidade no emprego do início da licença até 1 mês após o fim do benefício; +1/3 do período para filho com deficiência; prorrogação se a mãe ou o bebê ficarem internados; ampliação quando o pai assume integralmente os cuidados; vale para adoção/guarda para adoção, adoção unilateral, ausência materna no registro ou falecimento de um dos genitores. | https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade ; https://www12.senado.leg.br/radio/1/noticia/2026/03/31/lei-garante-ampliacao-gradual-da-licenca-paternidade-para-20-dias | [VERIFICADO] |
| Texto da lei | URL esperada no Planalto: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15371.htm | — | [VERIFICAR FONTE] (503 na pesquisa; confirmar antes de linkar em artigo) |
| Em tramitação | Há projeto separado para elevar de 20 para 30 dias a licença na Empresa Cidadã — **não é lei**; nunca citar como direito. | https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade | [VERIFICADO] |

#### 5.1.2 Outros direitos do pai

| Direito | Fato | Fonte oficial | Etiqueta |
|---|---|---|---|
| Acompanhar consultas na gravidez e do filho | CLT art. 473, X: até 2 dias para consultas e exames da esposa/companheira na gravidez; XI: 1 dia por ano para consulta de filho de até 6 anos (ambos pela Lei 13.257/2016, DOU 09/03/2016). Fonte secundária cita alteração pela Lei 15.156/2025 (até 6 consultas) — **divergência**. | https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm ; https://blog.grupogen.com.br/juridico/areas-de-interesse/trabalho/dica-037-novas-hipoteses-de-interrupcao-do-contrato-de-trabalho/ ; https://www.peticoesonline.com.br/art-473-clt | [VERIFICAR FONTE] (conferir o texto atual do art. 473 no Planalto) |
| Acompanhante no parto | Lei 11.108/2005 (altera a Lei 8.080/90): o SUS, rede própria ou conveniada, deve permitir 1 acompanhante indicado pela parturiente durante trabalho de parto, parto e pós-parto imediato — o pai pode ser o escolhido. | https://www2.camara.leg.br/legin/fed/lei/2005/lei-11108-7-abril-2005-536370-publicacaooriginal-26874-pl.html ; https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11108.htm | [VERIFICADO] |
| Pré-natal do parceiro | Estratégia do Ministério da Saúde (PNAISH/2009; guia de 2016 e edição 2023): consultas ao parceiro com enfoque preventivo/educativo/clínico; Portaria 1.474/2017 incluiu a consulta do parceiro e testes rápidos de sífilis/HIV do pai nos procedimentos do SUS. | https://portaldeboaspraticas.iff.fiocruz.br/biblioteca/guia-do-pre-natal-do-parceiro-para-profissionais-de-saude/ ; https://portaldeboaspraticas.iff.fiocruz.br/wp-content/uploads/2023/09/guia_pre_natal_profissionais_saude_1ed.pdf ; https://portal.afya.com.br/medicina-de-familia/como-o-pre-natal-do-parceiro-pode-ajudar-a-cuidar-da-saude-do-homem | [VERIFICADO] (guia Fiocruz) + [FONTE TERCEIRA] (portaria, via Afya) |
| Salário-família 2026 | Cota de R$ 67,54 por filho (até 14 anos ou inválido de qualquer idade) para remuneração até R$ 1.980,38 (Portaria Interministerial MPS/MF nº 13, de 09/01/2026, efeitos 01/01/2026; em 2025 era R$ 65,00 / R$ 1.906,04); quem ultrapassa o teto no mês perde a cota inteira; pago pelo empregador e compensado no INSS; soma-se a remuneração de vários vínculos. **Muda todo ano**: a ferramenta guarda o valor com a data da portaria, nunca fixa no texto do artigo. | https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm (arts. 65–70) ; https://coad.com.br/home/noticias-detalhe/135505/fixados-os-novos-valores-da-tabela-do-inss-e-do-salario-familia ; https://previdenciarista.com/blog/portaria-do-inss-altera-calculo-do-salario-familia/ | [FONTE TERCEIRA] (texto oficial da portaria em in.gov.br não acessado) |
| Pensão alimentícia | **Não existe percentual fixo em lei**: Código Civil art. 1.694 §1º — "na proporção das necessidades do reclamante e dos recursos da pessoa obrigada" (binômio necessidade × possibilidade); 30% dos rendimentos líquidos é o padrão usual citado pelo TJRJ; o STJ reafirma a proporcionalidade à renda. Lei 5.478/1968 regula a ação de alimentos (rito especial, alimentos provisórios). A ferramenta `pensao-alimenticia` é **só educativa** (ideia 41): explica o binômio e cenários, nunca "calcula" valor legal. | https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm ; https://www.planalto.gov.br/ccivil_03/leis/l5478.htm ; https://www.migalhas.com.br/depeso/452934/pensao-alimenticia-proporcionalidade-e-o-stj ; https://www.conjur.com.br/2024-fev-18/e-possivel-aumentar-pensao-mesmo-sem-a-melhora-das-financas-do-pai/ | [VERIFICADO] (CC) + [VERIFICAR FONTE] (Lei 5.478 não lida) + [FONTE TERCEIRA] (jurisprudência) |
| Guarda compartilhada | Lei 13.058/2014: tempo de convívio dividido de forma equilibrada entre mãe e pai, considerando as condições fáticas e o interesse dos filhos; a lei nada diz sobre divisão da pensão. | https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13058.htm ; https://ambitojuridico.com.br/?p=9023008 | [VERIFICADO] (lei) + [FONTE TERCEIRA] (comentário) |
| Registro de nascimento | Pai ou mãe têm **15 dias** (Lei 6.015/73 art. 50, com a Lei 13.112/2015); se um não registrar, o outro tem mais 45 dias; a mais de 30 km do cartório, até 3 meses; registro e 1ª certidão gratuitos; registro tardio sem multa. Pai não casado registra com a via amarela da DNV + identidade; o nome do pai na DNV não prova paternidade (art. 54); reconhecimento espontâneo ou averiguação oficiosa pela Lei 8.560/92 art. 2º. | https://www.planalto.gov.br/ccivil_03/leis/l6015compilada.htm ; https://www.planalto.gov.br/ccivil_03/leis/l8560.htm ; https://www12.senado.leg.br/noticias/materias/2015/03/31/agora-e-lei-mae-pode-registrar-filho-no-cartorio-sem-a-presenca-do-pai ; https://www.tjdft.jus.br/informacoes/extrajudicial/manuais/cartilhas/registro-civil-de-pessoas-naturais ; https://arpensp.org.br/noticia/existe-um-prazo-legal-para-registrar-o-bebe | [VERIFICADO] (Senado, TJDFT) + [FONTE TERCEIRA] (Arpen-SP) |
| Salário-maternidade ao pai viúvo | Lei 8.213/91 art. 71-B (incluído pela Lei 12.873/2013): se a segurada falece, o benefício é pago pelo período restante ao cônjuge/companheiro sobrevivente segurado; decisão de jan/2026 (26ª Vara Federal de Porto Alegre) afastou o prazo do §1º e aplicou o Tema 1182 do STF (licença-maternidade ao pai monoparental); TNU, Tema 236. | https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm ; https://www.migalhas.com.br/quentes/448199/inss-concedera-salario-maternidade-a-pai-apos-morte-da-mae-em-parto ; https://previdenciarista.com/blog/tnu-julga-o-tema-236-salario-maternidade-ao-pai-nos-casos-de-obito-da-mae/ | [VERIFICADO] (lei) + [FONTE TERCEIRA] (decisões) |

#### 5.1.3 Como isso entra no site

- Hub "Direitos do Pai" (ideia 40, Fase 1): um artigo Padrão A do Pai por linha das tabelas acima, com o link oficial no corpo e o
  semáforo terminando em "Sinal de alerta: … procure um advogado" (CLAUDE.md §6). Antes de publicar, abrir cada link marcado
  **[VERIFICAR FONTE]** e corrigir o texto se o Planalto divergir.
- Ferramenta `licenca-paternidade` (doc 06 §0.2): calcula pelo ano do nascimento (5 → 10 → 15 → 20 dias) e mostra a Empresa Cidadã
  como opção condicionada à adesão da empresa. Ferramenta `pensao-alimenticia`: só o binômio necessidade × possibilidade e cenários de
  guarda, com "Sinal de alerta: não substitui advogado".
- Valores anuais (salário-família, teto) nunca ficam fixos no texto: entram como constante datada no código da ferramenta (doc 06) e o
  artigo diz "valor de <ano>, conferir a portaria vigente".

### 5.2 Amazon Associados BR

Fonte: `/home/user/reviewprodutos/docs/PESQUISA-REFERENCIAS.md` §6 ("PR §x.y" abaixo), que leu os documentos oficiais em PT-BR:
Contrato Operacional (atualizado em 15/10/2025) e Políticas do Programa (vigência 14/04/2026). Tudo **[VERIFICADO]** nesse documento,
salvo marcação contrária.

| Regra | O que diz | Como o Vocação de Pai cumpre | Fonte |
|---|---|---|---|
| Divulgação obrigatória (PR §6.2, cláusula 5) | Frase exata: *"Como participante do Programa de Associados da Amazon, sou remunerado pelas compras qualificadas efetuadas"*, exibida "de forma clara e destacada". Proibido sugerir endosso ("recomendado pela Amazon", "parceiro oficial"). | Frase no rodapé de todas as páginas e em `/politica-de-afiliados`; aviso curto acima do 1º botão em cada Pai Indica/Loja com link para a política (CLAUDE.md §5.1). | https://associados.amazon.com.br/help/operating/agreement |
| Formato do link (PR §6.3, requisitos 6(v)/6(w)) | `https://www.amazon.com.br/dp/ASIN?tag=SEUID-20`; sem encurtador (só o `amzn.to` do SiteStripe), sem redirect interno, sem cloaking; sem links em e-mail não solicitado, PDF/e-book, impresso, pop-up ou extensão; desde 14/04/2026 compras vindas de anúncio pago não qualificam. | `AffiliateButton` (doc 02 §6.3) com `?tag=PUBLIC_AMAZON_TAG`, `rel="sponsored nofollow noopener"`, `target="_blank"`; `scripts/validate-content.mjs` rejeita `amazon.com.br` sem `?tag=`; newsletter só com double opt-in; PDFs da Caixa de Ferramentas sem link de afiliado. | https://associados.amazon.com.br/help/operating/policies ; https://associados.amazon.com.br/help/operating/compare |
| Preço e disponibilidade (PR §6.4) | Preço só com link/widget da Amazon ou dados da API (com carimbo de data/hora); sem API, nenhum preço, "desconto de X%", "promoção", "menor preço" ou "frete grátis" em texto. | Faixa de mercado `price_min`–`price_max` pesquisada em 2 lojas e registrada em `product_price_checks` (CLAUDE.md §5.2), rotulada como pesquisa na internet, nunca "preço da Amazon"; `products.price` nunca exibido; validador rejeita `R$` em `review`/`comparison`. | https://associados.amazon.com.br/help/operating/policies |
| Imagens (PR §6.5) | Proibido armazenar/cachear imagens do programa; o SiteStripe deixou de gerar links de imagem em 12/2023; sem a Creators API **não há caminho oficial** para exibir imagem da Amazon. | **Ponto de atenção — conflito com regra fixa do grupo:** CLAUDE.md §5.3 manda usar a foto oficial da Amazon do ASIN (`m.media-amazon.com`, via `amz.py`), prática já em uso no Vocação de Mãe. A regra do grupo prevalece até decisão do dono; registrar em `PROGRESSO.md` → "Pendências do dono": pedir acesso à Creators API (PR §6.10) ou autorizar press kit do fabricante como alternativa. | https://associados.amazon.com.br/help/operating/policies ; https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction |
| Avaliações e estrelas (PR §6.6) | Não exibir nem parafrasear avaliações, nota ou quantidade de avaliações de clientes da Amazon sem a Creators API. | **Mesmo ponto de atenção:** CLAUDE.md §7 prevê a "nota de compradores" na tabela do comparativo (via `amz.py`). Manter a regra do grupo até o dono decidir; nunca copiar/parafrasear texto de avaliação; "O que dizem outros compradores" usa só fontes fora da Amazon (Reclame Aqui, lojas, fóruns). | https://associados.amazon.com.br/help/operating/policies |
| Aprovação e dormência (PR §6.12) | Conta precisa de **3 vendas qualificadas em 180 dias**; inscrição só com site no ar e conteúdo original. | Doc 11 §1: links no ar desde o dia 1, inscrição formal com ≥ 20 artigos publicados; meta de 3 vendas nos primeiros 180 dias. | https://associados.amazon.com.br/help/node/topic/G7MJTPEP9NC3YKMG |
| Comissões (PR §6.14) | Tabela oficial: 13% Bebê, Beleza, Saúde, Alimentos e Bebidas; 11% Roupas, Pet; 10% Livros; 9,5% dispositivos Amazon; 8% Esportes, Brinquedos, Móveis, Casa, Construção e Reforma, Ferramentas, Cozinha, Jardim, Eletrodomésticos, Eletrônicos, Informática, TV e Áudio; 7% Relógios, Calçados, Automotivo, Outros. Tabelas de blogs divergem — usar só o node oficial. | Prioridade editorial do Pai Indica: churrasco e cozinha, ferramentas e casa (8%), bebê (13%), livros (10%) — base da taxonomia em `src/lib/pai-indica/taxonomia.ts` (doc 02 §10). | https://associados.amazon.com.br/help/node/topic/GRXPHT8U84RAYDXZ |
| Publicidade é publicidade (PR §6.15) | A divulgação de link de afiliado é exigência legal no Brasil (CONAR/CDC), não só contratual. | Complemento na `/politica-de-afiliados`: "Este conteúdo contém publicidade na forma de links de afiliado". | [FONTE TERCEIRA] (confiança média no doc de origem) |

### 5.3 Google AdSense

Fonte: PR §5 (páginas oficiais do AdSense). Aplicação no plano: doc 11 §1 e §3 — pedir revisão só com 40–60 artigos indexados e todas as
páginas institucionais no ar (Fase 8).

- **Elegibilidade (PR §5.1):** 18+, site próprio com acesso ao HTML, conteúdo original; **não há** regra oficial de idade de domínio,
  tráfego mínimo ou número de artigos (a regra de "6 meses" vale só para China e Índia). Português é idioma suportado.
  → https://support.google.com/adsense/answer/9724 ; https://support.google.com/adsense/answer/9727 **[VERIFICADO]**
- **Motivos de reprovação (PR §5.2):** conteúdo insuficiente/"em construção"; *"your site shouldn't participate in affiliate programs
  without adding sufficient value to users"*; navegação ruim (links quebrados, pop-ups, páginas inacabadas); o Google "pode revisar
  todas as páginas". Nova revisão sem prazo mínimo entre pedidos; resposta em dias, podendo chegar a 2–4 semanas.
  → https://support.google.com/adsense/answer/81904 ; https://support.google.com/adsense/answer/9061852 ;
  https://support.google.com/adsense/answer/10015918 **[VERIFICADO]**
- **Publisher Policies (PR §5.3):** sem anúncio em página sem conteúdo (404, obrigado, login, busca); só rótulos "Anúncios"/"Links
  patrocinados"; nada de anúncio perto de botões, menus ou players; proporção conteúdo > anúncios (header, rodapé e links internos não
  contam como conteúdo). → https://support.google.com/adsense/answer/10502938 ;
  https://support.google.com/publisherpolicies/answer/11169917 ; https://support.google.com/adsense/answer/1346295 **[VERIFICADO]**
- **Privacidade (PR §5.5, §5.11):** política com seção de cookies de publicidade e opt-out; CMP do Google para EEE/UK/CH; banner LGPD
  próprio em português (Aceitar / Rejeitar / Gerenciar; analíticos e publicidade desativados por padrão) integrado ao Consent Mode v2.
- **Checklist antes de pedir revisão (PR §5.11):** 40–60 artigos indexados com mix ~60% Pai Indica / ~40% guias e ≥ 5 por categoria;
  Sobre, Contato, Política de Privacidade (seções AdSense, Amazon e LGPD), Termos de Uso e `/politica-de-afiliados` no menu e no rodapé;
  HTTPS com redirect; `robots.txt` liberando `Mediapartners-Google`; `public/ads.txt` com o pub-ID (constante `ADSENSE_PUB_ID` em
  `src/lib/site.ts`, doc 02 §7); CLS < 0,1 com `min-height` reservado; `AdSlot` em 3–4 posições fixas (após o 1º H2, meio, fim e
  sidebar da listagem — doc 02 §7), nunca em `/admin`, `/area-do-pai`, `/minha-conta`, `/entrar`, `/cadastro` nem para assinante
  `pai-de-valor` ativo.
- **Pós-aprovação:** Policy Center toda semana; manter a proporção ao adicionar blocos; revisar `ads.txt` em qualquer mudança de
  domínio/www; contas sem impressões por 6 meses podem ser desativadas (PR §5.2, confiança média).

### 5.4 Google Reviews System, E-E-A-T e dados estruturados

Fonte: PR §4 (Google Search Central, páginas atualizadas entre dez/2025 e out/2026).

- **Reviews System (PR §4.1):** ativo, embutido nos core updates, avalia reviews individuais, comparativos e listas; português
  suportado. As 14 práticas de "Write high quality reviews": avaliar da perspectiva do usuário, dar evidência própria (fotos,
  medições), dizer o que diferencia dos concorrentes, cobrir alternativas e para quem cada uma serve, prós e contras por pesquisa
  própria, links para mais de um vendedor, "melhor" sempre com o porquê. → https://developers.google.com/search/docs/appearance/reviews-system ;
  https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews?hl=pt-br **[VERIFICADO]**. No plano:
  estrutura do comparativo (CLAUDE.md §7: "Como avaliamos" sem teste físico, "Qual comprar" por perfil), `review.how_we_evaluated`,
  `sources[]` e `other_buyers{}` (doc 02 §5.3) e a ideia 48 (selo "Testado pelo pai" só quando houver evidência própria).
- **E-E-A-T e autor real (PR §4.2):** byline genérica ("Redação") fere o "Quem"; página de autor com foto real, bio e `sameAs`;
  "fabricar perfis de criadores" é engano; uso de automação/IA deve ser autoevidente por disclosure.
  → https://developers.google.com/search/docs/fundamentals/creating-helpful-content ;
  https://developers.google.com/search/docs/fundamentals/using-gen-ai-content **[VERIFICADO]**. No plano: `/autor/$slug`
  (doc 02 §1.3) com `profiles.role='editor'`; autor = Bruno Danello.
- **Políticas de spam (PR §4.4):** "scaled content abuse" mira volume sem valor "não importa como foi criado"; "thin affiliation" =
  descrições copiadas do comerciante; uma página por variação de consulta ("melhor X barato", "melhor X 2026") com conteúdo quase igual
  conta como abuso. → https://developers.google.com/search/docs/essentials/spam-policies?hl=pt-br **[VERIFICADO]**. No plano: 1 slug
  por tema; validador exige ≥ 10 links internos, semáforo, tabela e checklist (CLAUDE.md §4.3).
- **`rel="sponsored"` (PR §4.5):** preferido a `nofollow` para links pagos; a combinação `sponsored nofollow` é aceita.
  → https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links **[VERIFICADO]**. No plano:
  `rel="sponsored nofollow noopener"` (CLAUDE.md §5.1).
- **Dados estruturados em out/2026 (PR §4.6):** `Product` + `Review` com `positiveNotes`/`negativeNotes` (≥ 2 itens cada) rende para
  review editorial; `Review` só sobre item específico, com nome de autor válido; **nunca agregar notas de outros sites** (sem
  `aggregateRating` feito de estrelas da Amazon); `FAQPage` descontinuado (changelog de 08/05/2026 e 15/06/2026); `ItemList`/carrossel
  não suporta `Product` (listas "os N melhores" não ganham carrossel); `Article` com `author.url`, `datePublished`/`dateModified` e
  imagem 16:9, 4:3 e 1:1; `BreadcrumbList` só no desktop; `JobPosting` completo para o Google for Jobs.
  → https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=pt-br ;
  https://developers.google.com/search/docs/appearance/structured-data/review-snippet ;
  https://developers.google.com/search/docs/appearance/structured-data/carousel ;
  https://developers.google.com/search/docs/appearance/structured-data/article ;
  https://developers.google.com/search/docs/appearance/structured-data/breadcrumb ;
  https://developers.google.com/search/docs/appearance/structured-data/job-posting ;
  https://developers.google.com/search/docs/appearance/structured-data/sd-policies ;
  https://developers.google.com/search/updates **[VERIFICADO]**. No plano: doc 02 §7 (`Review` com `bestRating: 10`, `ItemList` só
  semântico, `Product` da Loja com `priceSpecification` min/max, `JobPosting` com `validThrough = expires_at`); o `FAQPage` que o
  doc 02 §7 ainda emite quando há `faq` é inofensivo, mas não rende rich result.

---

## 6. APIs e serviços — tabela, cadeia de fallback de câmbio/mercado, chaves e TTLs

Fonte: `res-tecnico.md` (chamadas reais em 24/10/2026) cruzada com o doc 06 (código das fontes em `src/lib/market/sources/*.ts`,
§2.4; cache em §2.3; chaves em §2.5; cron em §2.6) e com o doc 02 §8 (lista fechada de variáveis de ambiente). **Regra do doc 02 §8 que
prevalece sobre a pesquisa:** `AWESOMEAPI_TOKEN` e `COINGECKO_API_KEY` **não existem** — AwesomeAPI e CoinGecko são usadas sem chave,
protegidas pelo cache de `market_cache` (uma chamada por refresh, nunca a partir do navegador); a única chave de mercado é
`BRAPI_TOKEN` (opcional).

### 6.1 Tabela de APIs e serviços

| Serviço | Chave | Limite relevante (verificado em 24/10/2026) | Endpoint usado | Arquivo (doc 06 §2.4) | Uso | Etiqueta |
|---|---|---|---|---|---|---|
| AwesomeAPI (câmbio comercial) | nenhuma (doc 02 §8) | Sem chave a fonte cacheia 1 min e tem cota por IP: recebemos `429 QuotaExceeded` ao bater sem cache próprio; com refresh a cada 30 min e 1 chamada por rodada a cota não é atingida. Séries: 100 registros; `/json/daily` até 360 dias. | `GET https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL` ; `GET https://economia.awesomeapi.com.br/json/daily/USD-BRL/30` | `awesomeapi.ts` | `/ferramentas/conversor-de-moedas`; cartões de câmbio do Mercado do pai | [VERIFICADO] |
| Banco Central — PTAX (Olinda/OData) | nenhuma | Sem limite documentado; `value` vem vazio em fim de semana/feriado → buscar o dia útil anterior (até 5 tentativas); data no parâmetro em `MM-DD-AAAA`. | `GET https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='MM-DD-AAAA'&$format=json` (e `CotacaoMoedaDia` para EUR) | `bcb-ptax.ts` | PTAX oficial no conversor (o número do contrato/da fatura) | [VERIFICADO] |
| Banco Central — SGS | nenhuma | Sem limite documentado; `valor` vem como string com ponto; séries 11/12 são diárias (anualizar com `((1+v/100)^252 − 1) × 100`). | `GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{n}?formato=json` — códigos 432 (Selic meta), 4389 (CDI anual), 433 (IPCA mensal), 13522 (IPCA 12 m), 189 (IGP-M), 12 (CDI diário, só fallback) | `bcb-sgs.ts` | Selic, CDI, IPCA no Mercado do pai e nas calculadoras | [VERIFICADO] |
| Brapi (B3) | `BRAPI_TOKEN` (opcional) | Grátis: 15.000 req/mês, 1 ticker por requisição, cotação a cada 30 min, histórico de 3 meses; sem token só o sandbox (PETR4/VALE3/MGLU3/ITUB4) e `^BVSP` responde `MISSING_TOKEN`. | `GET https://brapi.dev/api/quote/PETR4?token=<BRAPI_TOKEN>` | `brapi.ts` | Ibovespa e ações populares; sem token, último cache com aviso "dados de <data>" (CLAUDE.md §10) | [VERIFICADO] |
| CoinGecko | nenhuma (doc 02 §8) | Público: 5–15 chamadas/min, instável; 1 chamada por refresh basta. Fallback: `BTC-BRL`/`ETH-BRL` da AwesomeAPI (doc 06 §2.4). | `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl,usd&include_24hr_change=true` | `coingecko.ts` | Bitcoin/Ethereum em BRL (sinergia com o blogdobitcoin) | [VERIFICADO] |
| Tesouro Transparente (CKAN) | nenhuma | O CSV completo devolveu `429` (centenas de MB); ler só as linhas da última "Data Base"; se falhar, card oculto. | `https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show?id=taxas-dos-titulos-ofertados-pelo-tesouro-direto` → CSV `precotaxatesourodireto.csv` | `tesouro.ts` | Taxas do Tesouro Direto (card opcional do Mercado do pai) | [VERIFICADO] (metadados) / [NÃO VERIFICADO] (download do CSV) |
| Frankfurter / open.er-api | nenhuma | Testadas e funcionando (taxas diárias, sem cota); **não entram no código** (o doc 06 só prevê AwesomeAPI + PTAX) — ficam como reserva documentada se a AwesomeAPI mudar as regras. O ER-API exige a atribuição "Rates By Exchange Rate API". | `https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL,EUR` ; `https://open.er-api.com/v6/latest/USD` | — | reserva | [VERIFICADO] |
| Resend | `RESEND_API_KEY` | Free: 3.000 e-mails/mês e **100/dia**; Pro US$ 20/mês = 50.000/mês → migrar quando a Jogada do Dia passar de ~700 assinantes diários. | `POST https://api.resend.com/emails` | edge functions de e-mail (doc 07 §6.6) e `/api/newsletter/daily` (doc 10 §8.4) | Newsletter, e-mails de moderação, SMTP do Supabase Auth | [VERIFICADO] |
| Cloudflare Turnstile | `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Token expira em 300 s, uso único, ≤ 2.048 caracteres; validação server-side obrigatória. | `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` | server functions dos formulários | `/cadastro`, `/contato`, `/pai-indica-pai/vagas/nova`, `/historias/nova`, comentários | [VERIFICADO] |
| GitHub Actions `schedule` | `CRON_SECRET` (secret do repositório) | Mínimo 5 min; UTC; atrasos em horário de pico; repositório público desativa após 60 dias sem atividade; roda só no branch default. | `market-refresh.yml` (`*/30 * * * *`), `newsletter-daily.yml` (07:07 BRT), `newsletter-weekly.yml` (só `workflow_dispatch`) | `.github/workflows/` (doc 02 §3) | Substitui o Vercel Cron (plano Hobby só permite 1×/dia) | [VERIFICADO] |

### 6.2 Chaves de `market_cache` e TTLs (doc 06 §2.3 e §2.5)

`market_cache (key text pk, data jsonb, fetched_at timestamptz, ttl_seconds int)` — leitura pública (RLS `select`), escrita só pelo
`supabaseAdmin` dentro de `POST /api/market/refresh`; `0007_ferramentas.sql` (doc 02 §4.7).

| Chave (`KEYS` do doc 06 §2.5) | Conteúdo | TTL (`TTL` do doc 06 §2.3) | Fonte |
|---|---|---|---|
| `fx:last` | pares USD/EUR/GBP → BRL: bid/ask, variação, timestamp | `FX_LAST` = 15 min | AwesomeAPI `/last` |
| `fx:daily:<PAR>:<DIAS>` (ex.: `fx:daily:USD-BRL:30`) | série diária para o gráfico | `FX_DAILY` = 6 h | AwesomeAPI `/json/daily` |
| `ptax:<MOEDA>` (`ptax:USD`, `ptax:EUR`) | compra/venda PTAX do último dia útil | `PTAX` = 6 h | BCB Olinda |
| `crypto:simple` | BTC/ETH em BRL e USD, variação 24 h | `CRYPTO` = 10 min | CoinGecko (fallback AwesomeAPI) |
| `b3:quotes` | Ibovespa + ações populares | `STOCKS` = 30 min (fora do pregão serve o último) | Brapi |
| `sgs:indicators` | Selic meta, CDI anual, IPCA mensal e 12 m, IGP-M | `SGS` = 12 h | BCB SGS |
| `tesouro:titulos` | taxas do Tesouro Direto do último dia | `TESOURO` = 6 h | Tesouro Transparente |

CLAUDE.md §10 resume os TTLs como "15 min câmbio, 60 min índices, 24 h BCB"; os valores exatos que o código usa são os da constante
`TTL` do doc 06 §2.3 (tabela acima). Toda ferramenta registra uso em `tool_usage` com `user_id` nulo para anônimo (CLAUDE.md §10).

### 6.3 Cadeia de fallback do câmbio (4 níveis) e padrão stale-while-error

Os níveis 1, 3 e 4 são o `cached()` de `src/lib/market/cache.ts` (doc 06 §2.3: cache fresco → fonte ao vivo com timeout de 8 s →
cache vencido marcado `stale` → erro); o nível 2 é a composição feita no conversor (`getFxLast` falhou → usar `getPtax`), regra deste
documento derivada de `res-tecnico.md` §4.3. Nada disso roda no navegador (doc 02 §1.2).

1. **AwesomeAPI ao vivo** (ou cache fresco de `fx:last`, TTL 15 min): cotação comercial com "Atualizado às HH:MM".
2. **PTAX do Banco Central** (`ptax:USD` / `ptax:EUR`, dia útil anterior em fim de semana): se a AwesomeAPI falhar ou devolver `429`, o
   conversor calcula com a PTAX e rotula "cotação oficial PTAX de dd/mm". A PTAX é sempre exibida ao lado da comercial, como referência
   do contrato/da viagem.
3. **Último valor de `market_cache` vencido**: se as duas fontes falharem, serve o último `data` com `stale: true` e o aviso "Sinal de
   atenção: cotação de dd/mm às HH:MM — as fontes estão instáveis agora" (texto da casca de ferramenta, doc 06 §1.4).
4. **Indisponível**: sem nada em cache (primeiro deploy), o card mostra "Cotação indisponível no momento" e o formulário fica
   desabilitado; `tool_usage` registra a visita mesmo assim.

O Mercado do pai (`/ferramentas/mercado-financeiro`) segue o mesmo padrão por chave: `b3:quotes` sem `BRAPI_TOKEN` → nível 3 com aviso
"dados de <data>"; `crypto:simple` → fallback AwesomeAPI antes do nível 3; `tesouro:titulos` → card oculto. Disclaimer fixo em todas as
ferramentas de mercado: "Conteúdo educativo. Não constitui recomendação de investimento. Dados sujeitos a atraso e indisponibilidade das
fontes." (doc 06 §0.2; CLAUDE.md §10). O cron nunca apaga uma linha em erro: só substitui quando a nova resposta valida.

---

## 7. Fontes — todas as URLs

Listagem única (sem repetição dentro de cada bloco), na ordem em que as URLs aparecem no documento. Tudo foi aberto ou visto em resultado
de busca em 24/10/2026 (`res-sites.md`, `res-ecossistema.md`, `res-tecnico.md`) ou lido no `PESQUISA-REFERENCIAS.md` do reviewprodutos;
a etiqueta de cada item está na seção que o cita.

### 7.1 Benchmarks (seção 2)

- https://www.fatherly.com/
- https://www.artofmanliness.com/
- https://www.artofmanliness.com/blog/strenuous-life/the-2022-enrollment-of-the-strenuous-life-is-now-open/
- https://www.dad.info/
- https://spurgeons.org/how-we-help/family-life/parenting-and-family-support/dad-info-support-for-dads/
- https://www.fatherhood.org/
- https://www.fatherhood.org/fatherhood/free-program-resources-abound
- https://www.allprodad.com/
- https://en.wikipedia.org/wiki/All_Pro_Dad
- https://www.thosecatholicmen.com/
- https://exodus90.com/
- https://exodus90.com/blog/renewal-of-the-church-through-100000-men/
- https://www.oursundayvisitor.com/mentorship-program-cultivates-catholic-men/
- https://www.ncregister.com/blog/iron-sharpens-iron-fraternus-strengthens-fraternity?amp
- https://family.org.sg/resource/fatherhood-survival-101-a-guide-to-a-mentally-healthier-you/
- https://divinemercyplus.org/page/33-day-consecration-st-joseph
- https://ncregister.com/blog/how-to-make-a-consecration-to-st-joseph
- https://amazingribs.com/cuts-of-meat/beef-steaks/
- https://amazingribs.com/pitmaster
- https://pitmaster.amazingribs.com/forum/main/929126-your-member-benefits
- https://www.seriouseats.com/cuts-of-beef-5118048
- https://www.nytimes.com/wirecutter/
- https://www.primermagazine.com/
- https://www.gearpatrol.com/
- https://www.gearpatrol.com/about/about-gear-patrol-magazine/
- https://www.thedad.com/
- https://paizinhovirgula.com/
- https://rollingstone.com.br/?p=191135
- https://www.meioemensagem.com.br/womentowatch/pais-influenciadores-ajudam-a-ressignificar-a-paternidade
- https://churrasqueadas.com.br/
- https://www.band.com.br/receitas/noticias/qual-o-melhor-corte-de-carne-netao-diz-a-escolha-perfeita-para-cada-preparo-202409271558
- https://www.band.com.br/receitas/noticias/como-comprar-picanha-boa-aprenda-a-identificar-o-corte-de-carne-202409141454
- https://padrepauloricardo.org/
- https://rephonic.com/podcasts/paternidade-sem-vergonha
- https://www.podengine.ai/podcasts/cafe-com-pais
- homemvirtuoso.com.br (sem esquema: DNS não resolveu — [NÃO VERIFICADO])

### 7.2 Legislação do pai (seção 5.1)

- https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm
- https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522497&ori=1
- https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11770.htm
- https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13257.htm
- https://portal.trt3.jus.br/internet/conheca-o-trt/comunicacao/noticias-juridicas/importadas-2015-2016/jurisprudencia-do-trt-mg-sobre-direitos-do-pai-trabalhador-26-08-2016-05-57-acs
- https://blog.grupogen.com.br/juridico/areas-de-interesse/trabalho/prorrogacao-da-licenca-paternidade-lei-13-2572016/
- https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522407&ori=1
- https://portal.trt3.jus.br/internet/jurisprudencia/repercussao-geral-e-controle-concentrado-adi-adc-e-adpf-stf/downloads/acordao-de-merito-ado-20.pdf
- https://ibdfam.org.br/noticias/13058/Prazo+do+STF+termina+sem+avan%C3%A7o+no+Congresso+sobre+licen%C3%A7a-paternidade
- https://www.migalhas.com.br/quentes/434697/congresso-perde-prazo-do-stf-para-regulamentar-licenca-paternidade
- https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade
- https://www12.senado.leg.br/noticias/materias/2026/04/01/sancionado-o-aumento-gradual-da-licenca-paternidade
- https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2026-03/lula-sanciona-lei-que-amplia-licenca-paternidade
- https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2026-03/saiba-o-que-muda-com-nova-licenca-paternidade-no-brasil
- https://www.conjur.com.br/2026-abr-10/a-lei-no-15-371-2026-e-a-licenca-paternidade-no-brasil/
- https://www.gov.br/previdencia/pt-br/noticias/2026/marco/governo-sanciona-lei-que-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade
- https://www12.senado.leg.br/radio/1/noticia/2026/03/31/lei-garante-ampliacao-gradual-da-licenca-paternidade-para-20-dias
- https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15371.htm
- https://blog.grupogen.com.br/juridico/areas-de-interesse/trabalho/dica-037-novas-hipoteses-de-interrupcao-do-contrato-de-trabalho/
- https://www.peticoesonline.com.br/art-473-clt
- https://www2.camara.leg.br/legin/fed/lei/2005/lei-11108-7-abril-2005-536370-publicacaooriginal-26874-pl.html
- https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11108.htm
- https://portaldeboaspraticas.iff.fiocruz.br/biblioteca/guia-do-pre-natal-do-parceiro-para-profissionais-de-saude/
- https://portaldeboaspraticas.iff.fiocruz.br/wp-content/uploads/2023/09/guia_pre_natal_profissionais_saude_1ed.pdf
- https://portal.afya.com.br/medicina-de-familia/como-o-pre-natal-do-parceiro-pode-ajudar-a-cuidar-da-saude-do-homem
- https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm
- https://coad.com.br/home/noticias-detalhe/135505/fixados-os-novos-valores-da-tabela-do-inss-e-do-salario-familia
- https://previdenciarista.com/blog/portaria-do-inss-altera-calculo-do-salario-familia/
- https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm
- https://www.planalto.gov.br/ccivil_03/leis/l5478.htm
- https://www.migalhas.com.br/depeso/452934/pensao-alimenticia-proporcionalidade-e-o-stj
- https://www.conjur.com.br/2024-fev-18/e-possivel-aumentar-pensao-mesmo-sem-a-melhora-das-financas-do-pai/
- https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13058.htm
- https://ambitojuridico.com.br/?p=9023008
- https://www.planalto.gov.br/ccivil_03/leis/l6015compilada.htm
- https://www.planalto.gov.br/ccivil_03/leis/l8560.htm
- https://www12.senado.leg.br/noticias/materias/2015/03/31/agora-e-lei-mae-pode-registrar-filho-no-cartorio-sem-a-presenca-do-pai
- https://www.tjdft.jus.br/informacoes/extrajudicial/manuais/cartilhas/registro-civil-de-pessoas-naturais
- https://arpensp.org.br/noticia/existe-um-prazo-legal-para-registrar-o-bebe
- https://www.migalhas.com.br/quentes/448199/inss-concedera-salario-maternidade-a-pai-apos-morte-da-mae-em-parto
- https://previdenciarista.com/blog/tnu-julga-o-tema-236-salario-maternidade-ao-pai-nos-casos-de-obito-da-mae/

### 7.3 Amazon Associados BR, AdSense e Google Search Central (seções 5.2–5.4)

- https://associados.amazon.com.br/help/operating/agreement
- https://www.amazon.com.br/dp/ASIN?tag=SEUID-20`
- https://associados.amazon.com.br/help/operating/policies
- https://associados.amazon.com.br/help/operating/compare
- https://affiliate-program.amazon.com/creatorsapi/docs/en-us/introduction
- https://associados.amazon.com.br/help/node/topic/G7MJTPEP9NC3YKMG
- https://associados.amazon.com.br/help/node/topic/GRXPHT8U84RAYDXZ
- https://support.google.com/adsense/answer/9724
- https://support.google.com/adsense/answer/9727
- https://support.google.com/adsense/answer/81904
- https://support.google.com/adsense/answer/9061852
- https://support.google.com/adsense/answer/10015918
- https://support.google.com/adsense/answer/10502938
- https://support.google.com/publisherpolicies/answer/11169917
- https://support.google.com/adsense/answer/1346295
- https://developers.google.com/search/docs/appearance/reviews-system
- https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews?hl=pt-br
- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/essentials/spam-policies?hl=pt-br
- https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet?hl=pt-br
- https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- https://developers.google.com/search/docs/appearance/structured-data/carousel
- https://developers.google.com/search/docs/appearance/structured-data/article
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/appearance/structured-data/job-posting
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/updates

### 7.4 APIs e serviços (seção 6)

- https://docs.awesomeapi.com.br/api-de-moedas
- https://docs.awesomeapi.com.br/aviso-sobre-limites
- https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json
- https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/aplicacao
- https://frankfurter.dev/
- https://www.exchangerate-api.com/docs/free
- https://brapi.dev/docs
- https://brapi.dev/pricing
- https://docs.coingecko.com/
- https://support.coingecko.com/hc/en-us/articles/4538771776153-What-is-the-rate-limit-for-CoinGecko-API-public-plan
- https://www.tesourotransparente.gov.br/ckan/dataset/taxas-dos-titulos-ofertados-pelo-tesouro-direto
- https://resend.com/pricing
- https://developers.cloudflare.com/turnstile/
- https://developers.cloudflare.com/turnstile/get-started/
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://vercel.com/docs/og-image-generation
- https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/database/vault
- https://supabase.com/docs/guides/database/full-text-search
- https://www.mercadopago.com.br/developers/pt/docs/subscriptions/landing
- https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation
- https://pagefind.app/

### 7.5 Documentos internos (caminhos lidos nesta consolidação)

- `/home/user/vocacaodepai/docs/plano/anexos/res-sites.md`, `res-ecossistema.md`, `res-tecnico.md`,
  `inv-reviewprodutos-grupovdp.md`, `inv-vocacaodemae.md`, `inv-portaldaai.md`
- `/home/user/vocacaodepai/docs/plano/02-arquitetura-e-stack.md` (§1.3, §3, §4, §5, §6.3, §7, §8), `04-fase-2-pai-indica-reviews.md`
  (§2.4, §6, §9), `06-fase-4-ferramentas.md` (§0.2, §1.4, §2.3–§2.6), `07-fase-5-area-do-pai-membros.md` (§0, §1, §4.7, §6.6, §7.3, §7.4),
  `08-fase-6-pai-indica-pai.md`, `09-fase-7-irmandade-e-formacao.md` (§2), `10-fase-8-automacao-rotinas-e-painel.md` (§4.7, §8.4),
  `11-monetizacao-seo-e-crescimento.md` (§1), `CLAUDE.md`
- `/home/user/reviewprodutos/docs/PESQUISA-REFERENCIAS.md` (§4, §5, §6) e `docs/PADRAO-EDITORIAL.md`
- `/home/user/vocacaodemae/scripts/rotina/` (`amz.py`, `cover_cmp.py`, `cmp_gen.py`, `rev_art_gen.py`, `review_gen.py`)
