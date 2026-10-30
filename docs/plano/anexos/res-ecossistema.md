# Pesquisa — Ecossistema de formação do homem/pai, "Pai Indica Pai", comunidade, formação e legislação
Data da pesquisa: 24/10/2026. Idioma: PT-BR. Buscas realizadas: 26 (WebSearch) + 6 fetches (Google Developers, STF, Câmara; Planalto retornou 503 em 4 tentativas — URLs do Planalto abaixo são as canônicas e conhecidas, mas o texto NÃO foi lido nesta sessão; conferir antes de publicar).

Legenda de confiabilidade: [OFICIAL] = fonte oficial (gov.br, planalto, stf, senado, camara, developers.google.com); [SEC] = fonte secundária confiável (IBDFAM, Migalhas, ConJur, imprensa); [CONH] = conhecimento geral, sem fonte lida nesta sessão → marcar "verificar" no texto do site.

---

## A) JOB BOARDS DE NICHO / INDICAÇÃO DE VAGAS (modelo para /pai-indica-pai/vagas)

### Referências
- Google — JobPosting structured data (doc oficial): https://developers.google.com/search/docs/appearance/structured-data/job-posting
- schema.org JobPosting (guia Unhead, com exemplo JSON-LD): https://unhead.unjs.io/docs/schema-org/api/schema/job-posting
- Remotar (formulário oficial de publicação de vaga — regras de aceite): https://tally.so/r/nGQez3
- Remotar (formulário p/ empresa com ATS/link próprio): https://tally.so/r/mZjaJV
- Trampos.co (perfil/avaliações, preço por anúncio): https://www.b2bstack.com.br/product/trampos/avaliacoes
- Trampos.co (blog oficial "Tutano"): https://tutano.trampos.co/?p=19154
- Programathor (fluxo de aprovação, G2): https://www.g2.com/products/programathor/discuss
- Programathor (preços sob cotação, Betterteam): https://www.betterteam.com/br/programathor
- 99jobs (perfil, foco trainee→intermediário): https://startups.com.br/noticias/com-foco-em-volume-e-diversidade-99jobs-mira-rodada-para-crescer
- Hub de vagas ABES (modelo "catálogo que redireciona p/ parceiro, sem participar da seleção"): https://abes.org.br/hub-de-vagas
- Gupy — como identificar vagas falsas: https://www.gupy.io/blog-do-emprego/vagas-falsas
- Olhar Digital — golpe de vaga online (set/2025): https://olhardigital.com.br/2025/09/01/seguranca/como-nao-cair-em-golpe-de-vaga-de-emprego-online/
- Contábeis — criminosos usam vagas falsas para roubar dados: https://www.contabeis.com.br/noticias/47568/criminosos-usam-vagas-falsas-de-emprego-para-roubar-dados-veja-como-identificar/
- Gazeta SP — golpe "vimos seu currículo": https://www.gazetasp.com.br/gazeta-mais/dicas-da-gazeta/vimos-seu-curriculo-frase-inocente-esconde-novo-golpe-contra-desempregados-saiba-como-se-proteger/
- LGPD em R&S (ConJur, 2021): https://www.conjur.com.br/2021-abr-03/opiniao-lgpd-processos-recrutamento-selecao/
- LGPD em RH/recrutamento (Confidata): https://confidata.com.br/blog/lgpd-rh-dados-colaboradores-recrutamento
- Gupy — Glossário LGPD 2026 (PDF): https://www.gupy.io/hubfs/LGPD/%5BGUPY%5D%20Gloss%C3%A1rio%20LGPD%20_Atualizado%202026.pptx.pdf

### Fatos verificados
- Google exige em JobPosting as propriedades: datePosted, description, hiringOrganization, jobLocation, title; jobLocation dispensável quando há applicantLocationRequirements — https://developers.google.com/search/docs/appearance/structured-data/job-posting [OFICIAL]
- Recomendadas pelo Google: applicantLocationRequirements, baseSalary, directApply, employmentType, identifier, jobLocationType, validThrough; beta: educationRequirements, experienceRequirements, experienceInPlaceOfEducation — https://developers.google.com/search/docs/appearance/structured-data/job-posting [OFICIAL]
- Vagas expiradas não são permitidas: remover a página (404/410), tirar o markup ou manter validThrough com data passada; omitir validThrough se a vaga não expira; descumprir pode gerar ação manual — https://developers.google.com/search/docs/appearance/structured-data/job-posting [OFICIAL]
- jobLocationType "TELECOMMUTE" só para vaga 100% remota, com isso dito na descrição; applicantLocationRequirements com ao menos um país é obrigatório para remota que pode ser preenchida de locais específicos — https://developers.google.com/search/docs/appearance/structured-data/job-posting [OFICIAL]
- directApply (boolean) = candidatura curta sem login/clique duplo; para URLs de vaga o Google recomenda Indexing API em vez de só sitemap, mantendo sitemap do site com lastmod correto — https://developers.google.com/search/docs/appearance/structured-data/job-posting [OFICIAL]
- datePosted deve ser ISO 8601 — https://www.w3.org/community/talent-signal/wiki/Examples:_Junior_software_developer [SEC]
- Remotar: publicação gratuita e ilimitada para empresas; vaga fica ativa 1 semana, 15 ou 30 dias (empresa escolhe); não aceita vaga presencial, sem salário-base ou 100% comissionada; exige remuneração e requisitos "dentro do padrão de mercado" — https://tally.so/r/nGQez3 [SEC/oficial da plataforma]
- Programathor: toda vaga passa por aprovação da equipe de consultoria antes de ir ao ar e aos sites parceiros; preços sob cotação, créditos válidos por 1 ano — https://www.g2.com/products/programathor/discuss ; https://www.betterteam.com/br/programathor [SEC]
- Trampos.co: anúncio avulso R$ 399 (valor de terceiro, pode estar desatualizado); distribui para Google for Jobs, LinkedIn, Indeed, Talent.com; foco em comunicação/marketing/criativos/tech — https://www.b2bstack.com.br/product/trampos/avaliacoes [SEC]
- Hub de vagas da ABES redireciona candidaturas aos parceiros e declara não participar de nenhum processo seletivo (modelo de isenção útil p/ termos do VDP) — https://abes.org.br/hub-de-vagas [SEC]
- Antifraude — sinais de vaga falsa: cobrança de qualquer taxa do candidato; e-mail de provedor gratuito (gmail etc.) em nome de grande empresa; salário alto com pouco esforço/descrição genérica; contato imediato após cadastro; mensagens "vimos seu currículo" por SMS/WhatsApp — https://www.gupy.io/blog-do-emprego/vagas-falsas ; https://olhardigital.com.br/2025/09/01/seguranca/como-nao-cair-em-golpe-de-vaga-de-emprego-online/ ; https://www.gazetasp.com.br/gazeta-mais/dicas-da-gazeta/vimos-seu-curriculo-frase-inocente-esconde-novo-golpe-contra-desempregados-saiba-como-se-proteger/ [SEC]
- Sites de recrutamento (Gupy, Vagas, Infojobs, Indeed) são pagos pela empresa, nunca pelo candidato — https://olhardigital.com.br/2025/09/01/seguranca/como-nao-cair-em-golpe-de-vaga-de-emprego-online/ [SEC]
- LGPD em R&S: coletar só o mínimo necessário (finalidade/necessidade); currículo enviado para vaga específica vale só para aquele processo; banco de talentos exige consentimento específico com prazo de retenção informado; não há base para reter dados de não selecionados por tempo prolongado; titular pode pedir exclusão a qualquer momento — https://confidata.com.br/blog/lgpd-rh-dados-colaboradores-recrutamento ; https://www.conjur.com.br/2021-abr-03/opiniao-lgpd-processos-recrutamento-selecao/ [SEC]

---

## B) FRATERNIDADES E MENTORIA MASCULINA (modelo para /irmandade, /formacao, /desafios)

### Referências
- Exodus 90 (site oficial): https://exodus90.com/
- Exodus 90 — press release oficial (PDF, 2021): https://exodus90.com/wp-content/uploads/2021/11/Exodus-90-Press-Release.pdf
- Exodus 90 em paróquia (disciplinas listadas): https://stpatrickparish.org/ministries/exodus90
- Exodus 90 — Diocese de Kalamazoo: https://diokzoo.org/exodus90
- Exodus 90 — reportagem OSV: https://www.oursundayvisitor.com/indiana-men-take-up-90-day-challenge-of-prayer-asceticism-fraternity/
- Exodus 90 — Aleteia: https://aleteia.org/2020/01/10/exodus-90-is-changing-mens-lives/
- Fraternus — formato de encontro semanal (paróquia): https://shcathedral.org/fraternus-and-fidelis/
- Fraternus — "virtude da semana", excursões: https://todayscatholic.org/virtue-building-through-mentorship-flourishes-at-st-elizabeth-ann-seton/
- Fraternus — jantar, jogos, ensino, desafio, oração: https://maryourqueen.com/ministry/fraternus-at-moq/
- Men's Shed (Wikipedia, histórico/motto): https://en.wikipedia.org/wiki/Men%27s_shed
- Men's Sheds — exemplo de shed (AMSA): https://mensshed.org/sheds/kew-neighbourhood-learning-centre-mens-shed/
- Men's Sheds — brochura de rede municipal (PDF): https://yarraranges.vic.gov.au/files/assets/public/v/1/webdocuments/community/health-wellbeing/yr-mens-shed-network-brochure.pdf
- Dads Group (Austrália) — história interna: https://www.the-father-hood.com/article/no-sleep-no-money-no-sex-the-inside-story-of-dads-group/
- Dads Group — Movember: https://au.movember.com/story/view/id/12307/how-dads-group-is-helping-aussie-dads-connect-during-isolation
- Dads Group — Healthy Male podcast (Tom Docking): https://healthymale.org.au/podcast/tom-docking-on-the-support-new-dads-are-missing-and-why-he-started-dads-group
- Equipes de Nossa Senhora — Guia 2018 (PDF, pontos concretos de esforço): https://equipes-notre-dame.com/wp-content/uploads/2019/11/GUIA-DAS-EQUIPAS-NOSSA-SENHORA-2018.pdf
- ENS Brasil — Estatutos (PDF): https://ens.org.br/upl/files/normas-administrativas/ENSstatuts_mars_2014_pt.pdf
- ENS Brasil — sessão de formação "Reunião de Equipe" (PDF): https://ens.org.br/upl/files/acervo-formacao/sessoes-de-formacao/aparecida-2015/II%20SF%20NACIONAL%20REUNIAO%20DE%20EQUIPE.pdf
- ECC — o que é: https://vidaefamilia.org.br/o-que-e-ecc-encontro-de-casais-com-cristo/
- ECC — 54 anos (histórico 1970, Pompéia-SP): https://vidaefamilia.org.br/ecc-celebra-54-anos-de-evangelizacao-das-familias
- ECC — relatório ao Dicastério (Vaticano, PT, PDF): https://www.laityfamilylife.va/content/dam/laityfamilylife/amoris-laetitia/ForumAmorisLaetitia/MeterialeForum/RelazioniOriginale/PT_ENCONTRO_DE_CASAIS.pdf
- "Papai Tá Aqui" (Urban95 + Prefeitura de Jundiaí, paternidade ativa): https://jundiai.sp.gov.br/noticias/?p=386172
- 75 Hard — regras (Garage Gym Reviews): https://www.garagegymreviews.com/what-is-the-75-hard-challenge
- 75 Hard — regras e dieta (Sunny Health): https://sunnyhealthfitness.com/blogs/fitness-programs/75-hard-challenge-rules-and-diet

### Fatos verificados
- Exodus 90: programa católico de 90 dias para homens, 3 pilares: oração, ascese, fraternidade; nasceu como formação de seminaristas (Fr. Brian Doerr, Mount St. Mary's Seminary, Emmitsburg-MD) — https://exodus90.com/wp-content/uploads/2021/11/Exodus-90-Press-Release.pdf [SEC/oficial]
- Exodus 90 — oração: hora santa diária + leitura/reflexão diária do Êxodo; fraternidade: grupo de 4-6 homens, reunião semanal e check-in DIÁRIO com um "anchor" (parceiro de responsabilidade) — https://stpatrickparish.org/ministries/exodus90 ; https://www.oursundayvisitor.com/indiana-men-take-up-90-day-challenge-of-prayer-asceticism-fraternity/ [SEC]
- Exodus 90 — ascese: banho frio e curto, exercício regular intenso, jejum qua/sex (1 refeição completa + 2 menores, sem carne), sem álcool/doces/TV/jogos, computador só para trabalho, celular só para comunicação essencial, só música que eleve a alma — https://stpatrickparish.org/ministries/exodus90 ; https://aleteia.org/2020/01/10/exodus-90-is-changing-mens-lives/ [SEC]
- Exodus 90 — >50 mil participantes (2021) / >60 mil (site) — https://exodus90.com/wp-content/uploads/2021/11/Exodus-90-Press-Release.pdf [SEC]
- Fraternus — encontro semanal à noite (ex.: terça 18h30): jantar em grupo, jogos competitivos, ensino, discussão em pequenos grupos, desafio pessoal da semana e oração; cada semana uma virtude; várias excursões por ano; meninos do 5º/6º ano ao ensino médio, mentores adultos — https://shcathedral.org/fraternus-and-fidelis/ ; https://maryourqueen.com/ministry/fraternus-at-moq/ ; https://todayscatholic.org/virtue-building-through-mentorship-flourishes-at-st-elizabeth-ann-seton/ [SEC]
- Men's Sheds — motto "Shoulder to Shoulder" (ombro a ombro): homens conversam melhor enquanto trabalham lado a lado (marcenaria, metal, projetos comunitários); AMSA criada em 2007 com 200 sheds, hoje >1.000 — https://en.wikipedia.org/wiki/Men%27s_shed ; https://mensshed.org/sheds/kew-neighbourhood-learning-centre-mens-shed/ [SEC]
- Dads Group (Austrália, fundador Tom Docking): grupos presenciais e digitais liderados por pares; pais se encontram para um café e conversam sobre medos, estresses e vitórias; eventos "Man with a Pram" no Dia dos Pais; podcast; recursos para hospitais e empresas — https://www.the-father-hood.com/article/no-sleep-no-money-no-sex-the-inside-story-of-dads-group/ ; https://au.movember.com/story/view/id/12307/how-dads-group-is-helping-aussie-dads-connect-during-isolation [SEC]
- Equipes de Nossa Senhora — reunião mensal de equipe (com casal responsável e conselheiro espiritual) + "pontos concretos de esforço": escuta da Palavra, meditação/oração, oração conjugal e familiar, "dever de se sentar" (diálogo conjugal periódico), regra de vida, retiro anual; 1ª reunião em Paris, 25/02/1939 — https://equipes-notre-dame.com/wp-content/uploads/2019/11/GUIA-DAS-EQUIPAS-NOSSA-SENHORA-2018.pdf ; https://ens.org.br/upl/files/normas-administrativas/ENSstatuts_mars_2014_pt.pdf [SEC/oficial do movimento]
- ECC — serviço da Igreja para evangelização das famílias; 1º encontro em 10-12/07/1970, paróquia N. Sra. do Rosário, Pompéia-SP; 1ª etapa = o Encontro (fim de semana), depois pós-encontro e grupos de casais/pequenas comunidades antes da 2ª etapa; presente em >800 paróquias — https://vidaefamilia.org.br/ecc-celebra-54-anos-de-evangelizacao-das-familias ; https://www.laityfamilylife.va/content/dam/laityfamilylife/amoris-laetitia/ForumAmorisLaetitia/MeterialeForum/RelazioniOriginale/PT_ENCONTRO_DE_CASAIS.pdf [SEC]
- MFC — não foi encontrada fonte brasileira sobre periodicidade das equipes-base nesta pesquisa; fonte hispânica cita grupos pequenos reunidos 2x/mês em casa de membro ou paróquia — https://iglesiacatolica.org.gt/laicos/imagenes/Movimiento%20Familiar%20Cristiano.pdf [SEC, não-BR; verificar em mfc.org.br]
- 75 Hard (Andy Frisella), 75 dias, 5 tarefas diárias: 2 treinos de 45 min (1 ao ar livre), dieta sem álcool nem "cheat meal", 1 galão (3,8 L) de água, 10 páginas de não-ficção (sem audiobook), foto de progresso; falhar em 1 item = volta ao dia 1 — https://www.garagegymreviews.com/what-is-the-75-hard-challenge ; https://sunnyhealthfitness.com/blogs/fitness-programs/75-hard-challenge-rules-and-diet [SEC]
- "Papai Tá Aqui" (Jundiaí/Urban95): programa municipal de paternidade ativa da gestação aos primeiros anos, com conteúdos digitais, sensibilização e rodas de conversa; servidores de Jundiaí têm 30 dias de licença-paternidade desde nov/2025 — https://jundiai.sp.gov.br/noticias/?p=386172 ; https://tribunadejundiai.com.br/cidades/jundiai/licenca-paternidade-jundiai/ [OFICIAL municipal / SEC]

---

## C) LEGISLAÇÃO BRASILEIRA DO PAI (base para /ferramentas/direitos-do-pai e artigos do Blog)

### Referências oficiais
- STF — notícia ADO 20 (14/12/2023): https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522497&ori=1
- STF — julgamento ADO 20 (13/12/2023): https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522407&ori=1
- Acórdão ADO 20 (PDF via TRT-3): https://portal.trt3.jus.br/internet/jurisprudencia/repercussao-geral-e-controle-concentrado-adi-adc-e-adpf-stf/downloads/acordao-de-merito-ado-20.pdf
- Agência Brasil — STF determina regulamentação (2023): https://agenciabrasil.ebc.com.br/justica/noticia/2023-12/stf-determina-ao-congresso-regulamentacao-da-licenca-paternidade
- Senado — Lei 15.371/2026 sancionada (01/04/2026): https://www12.senado.leg.br/noticias/materias/2026/04/01/sancionado-o-aumento-gradual-da-licenca-paternidade
- Rádio Senado — ampliação gradual para 20 dias: https://www12.senado.leg.br/radio/1/noticia/2026/03/31/lei-garante-ampliacao-gradual-da-licenca-paternidade-para-20-dias
- Câmara — Lei amplia licença-paternidade e cria salário-paternidade: https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade
- Agência Brasil — Lula sanciona (03/2026): https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2026-03/lula-sanciona-lei-que-amplia-licenca-paternidade
- Agência Brasil — o que muda: https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2026-03/saiba-o-que-muda-com-nova-licenca-paternidade-no-brasil
- Min. Previdência — sanção (página exigiu login no fetch; URL retornada pela busca): https://www.gov.br/previdencia/pt-br/noticias/2026/marco/governo-sanciona-lei-que-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade
- ConJur — análise da Lei 15.371/2026: https://www.conjur.com.br/2026-abr-10/a-lei-no-15-371-2026-e-a-licenca-paternidade-no-brasil/
- IBDFAM — sancionada lei: https://ibdfam.org.br/noticias/13759/Sancionada+lei+que+amplia+licen%C3%A7a-paternidade+e+cria+sal%C3%A1rio-paternidade
- IBDFAM — prazo do STF termina sem avanço (jul/2025): https://ibdfam.org.br/noticias/13058/Prazo+do+STF+termina+sem+avan%C3%A7o+no+Congresso+sobre+licen%C3%A7a-paternidade
- Migalhas — Congresso perde prazo: https://www.migalhas.com.br/quentes/434697/congresso-perde-prazo-do-stf-para-regulamentar-licenca-paternidade
- CLT (Decreto-Lei 5.452/1943), art. 473 — Planalto: https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm
- Lei 11.770/2008 (Empresa Cidadã) — Planalto: https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11770.htm
- Lei 13.257/2016 (Marco Legal da Primeira Infância) — Planalto: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/lei/l13257.htm
- Comentários à Lei 13.257/2016 (Dizer o Direito): https://www.dizerodireito.com.br/2016/03/comentarios-lei-132572016-estatuto-da.html
- TRT-3 — jurisprudência direitos do pai trabalhador: https://portal.trt3.jus.br/internet/conheca-o-trt/comunicacao/noticias-juridicas/importadas-2015-2016/jurisprudencia-do-trt-mg-sobre-direitos-do-pai-trabalhador-26-08-2016-05-57-acs
- Lei 11.108/2005 (acompanhante no parto) — Câmara (publicação original): https://www2.camara.leg.br/legin/fed/lei/2005/lei-11108-7-abril-2005-536370-publicacaooriginal-26874-pl.html
- Lei 11.108/2005 — Planalto: https://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11108.htm
- Lei 13.058/2014 (guarda compartilhada) — Planalto: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13058.htm
- Lei 5.478/1968 (ação de alimentos) — Planalto: https://www.planalto.gov.br/ccivil_03/leis/l5478.htm
- Código Civil art. 1.694 (binômio necessidade/possibilidade) — Planalto: https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm
- Migalhas — pensão, proporcionalidade e STJ: https://www.migalhas.com.br/depeso/452934/pensao-alimenticia-proporcionalidade-e-o-stj
- ConJur — aumento de pensão sem melhora financeira do pai (STJ): https://www.conjur.com.br/2024-fev-18/e-possivel-aumentar-pensao-mesmo-sem-a-melhora-das-financas-do-pai/
- Lei 6.015/1973 (registros públicos, art. 50) — Planalto: https://www.planalto.gov.br/ccivil_03/leis/l6015compilada.htm
- Lei 8.560/1992 (investigação de paternidade) — Planalto: https://www.planalto.gov.br/ccivil_03/leis/l8560.htm
- Senado — Lei 13.112/2015 (mãe pode registrar sem o pai; prazos): https://www12.senado.leg.br/noticias/materias/2015/03/31/agora-e-lei-mae-pode-registrar-filho-no-cartorio-sem-a-presenca-do-pai
- TJDFT — cartilha Registro Civil: https://www.tjdft.jus.br/informacoes/extrajudicial/manuais/cartilhas/registro-civil-de-pessoas-naturais
- Arpen-SP — prazo para registrar o bebê: https://arpensp.org.br/noticia/existe-um-prazo-legal-para-registrar-o-bebe
- Lei 8.213/1991 (art. 65-70 salário-família; art. 71-B salário-maternidade ao pai viúvo) — Planalto: https://www.planalto.gov.br/ccivil_03/leis/l8213cons.htm
- Salário-família 2026 (Coad, Portaria Interministerial MPS/MF 13/2026): https://coad.com.br/home/noticias-detalhe/135505/fixados-os-novos-valores-da-tabela-do-inss-e-do-salario-familia
- Salário-família — regra de cálculo (Previdenciarista): https://previdenciarista.com/blog/portaria-do-inss-altera-calculo-do-salario-familia/
- Salário-maternidade ao pai após morte da mãe (Migalhas, jan/2026): https://www.migalhas.com.br/quentes/448199/inss-concedera-salario-maternidade-a-pai-apos-morte-da-mae-em-parto
- TNU Tema 236 (Previdenciarista): https://previdenciarista.com/blog/tnu-julga-o-tema-236-salario-maternidade-ao-pai-nos-casos-de-obito-da-mae/
- Guia do Pré-Natal do Parceiro (Min. Saúde, via Fiocruz): https://portaldeboaspraticas.iff.fiocruz.br/biblioteca/guia-do-pre-natal-do-parceiro-para-profissionais-de-saude/
- Guia Pré-Natal do Parceiro (PDF 1ª ed.): https://portaldeboaspraticas.iff.fiocruz.br/wp-content/uploads/2023/09/guia_pre_natal_profissionais_saude_1ed.pdf
- Pré-natal do Parceiro — Afya (resumo da metodologia e Portaria 1.474/2017): https://portal.afya.com.br/medicina-de-familia/como-o-pre-natal-do-parceiro-pode-ajudar-a-cuidar-da-saude-do-homem

### Fatos verificados — licença-paternidade (linha do tempo)
- Regra vigente em 2026: 5 dias (ADCT art. 10, §1º, CF/88), enquanto não há lei regulamentando o art. 7º, XIX — https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522497&ori=1 [OFICIAL]
- CLT art. 473, III previa originalmente 1 dia na primeira semana do nascimento; prevalece o prazo de 5 dias do ADCT — https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm [OFICIAL; texto não lido nesta sessão, 503]
- Empresa Cidadã (Lei 11.770/2008 alterada pela Lei 13.257/2016): prorroga a licença-paternidade por 15 dias (total 20) para empregados de empresas aderentes ao programa; exige pedido em até 2 dias úteis após o parto e comprovação de participação em programa/atividade de orientação sobre paternidade responsável; vale também para adoção; empresa no lucro real deduz do IR o valor pago — https://blog.grupogen.com.br/juridico/areas-de-interesse/trabalho/prorrogacao-da-licenca-paternidade-lei-13-2572016/ ; https://portal.trt3.jus.br/internet/conheca-o-trt/comunicacao/noticias-juridicas/importadas-2015-2016/jurisprudencia-do-trt-mg-sobre-direitos-do-pai-trabalhador-26-08-2016-05-57-acs ; lei em https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11770.htm [SEC + OFICIAL]
- Prorrogação da Empresa Cidadã NÃO é automática: TRT-3 negou a quem não comprovou adesão da empresa ao programa — https://portal.trt3.jus.br/internet/conheca-o-trt/comunicacao/noticias-juridicas/importadas-2015-2016/jurisprudencia-do-trt-mg-sobre-direitos-do-pai-trabalhador-26-08-2016-05-57-acs [OFICIAL]
- STF, ADO 20 (CNTS), julgada em 13-14/12/2023: reconheceu omissão inconstitucional do Congresso; prazo de 18 meses para legislar; se persistisse a omissão, o próprio STF fixaria o prazo da licença; 5 dias considerados "manifestamente insuficientes"; único voto divergente: Marco Aurélio — https://portal.stf.jus.br/noticias/verNoticiaDetalhe.asp?idConteudo=522497&ori=1 [OFICIAL]
- Prazo do STF venceu em 08/07/2025 sem lei; regra seguiu em 5 dias — https://ibdfam.org.br/noticias/13058/Prazo+do+STF+termina+sem+avan%C3%A7o+no+Congresso+sobre+licen%C3%A7a-paternidade ; https://www.migalhas.com.br/quentes/434697/congresso-perde-prazo-do-stf-para-regulamentar-licenca-paternidade [SEC]
- Lei 15.371/2026 sancionada em 31/03/2026, publicada no DOU em 01/04/2026 (origem PL 3935/2008 do Senado / PLS 666/2007, relator na Câmara dep. Pedro Campos; relatora no Senado sen. Ana Paula Lobato) — https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade ; https://www12.senado.leg.br/noticias/materias/2026/04/01/sancionado-o-aumento-gradual-da-licenca-paternidade [OFICIAL]
- Cronograma da Lei 15.371/2026: 10 dias a partir de 01/01/2027; 15 dias em 2028; 20 dias em 2029 (última etapa condicionada a meta fiscal, segundo ConJur); em 2026 permanece 5 dias — https://www12.senado.leg.br/noticias/materias/2026/04/01/sancionado-o-aumento-gradual-da-licenca-paternidade ; https://agenciabrasil.ebc.com.br/direitos-humanos/noticia/2026-03/saiba-o-que-muda-com-nova-licenca-paternidade-no-brasil ; https://www.conjur.com.br/2026-abr-10/a-lei-no-15-371-2026-e-a-licenca-paternidade-no-brasil/ [OFICIAL/SEC]
- Lei 15.371/2026 cria o salário-paternidade no RGPS (pago pelo INSS ou pela empresa com compensação, como o salário-maternidade): integral para empregados; baseado na contribuição para autônomos/MEI; 1 salário mínimo para segurado especial; alcança MEI, domésticos, avulsos e segurados especiais — https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade [OFICIAL]
- Lei 15.371/2026: estabilidade no emprego do início da licença até 1 mês após o fim do benefício; +1/3 do período para filho com deficiência; prorrogação em caso de internação da mãe ou do bebê; ampliação quando o pai assume integralmente os cuidados; vale para adoção/guarda para adoção, adoção unilateral, ausência materna no registro ou falecimento de um dos genitores — https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade ; https://www12.senado.leg.br/radio/1/noticia/2026/03/31/lei-garante-ampliacao-gradual-da-licenca-paternidade-para-20-dias [OFICIAL]
- Há projeto separado para elevar de 20 para 30 dias a licença no Programa Empresa Cidadã (não é lei) — https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade [OFICIAL]
- Texto da Lei 15.371/2026 no Planalto: URL padrão esperada https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15371.htm — NÃO verificada (503); confirmar antes de linkar.

### Fatos verificados — outros direitos do pai
- CLT art. 473, X: até 2 dias para acompanhar consultas médicas e exames complementares durante a gravidez da esposa/companheira; XI: 1 dia por ano para acompanhar filho de até 6 anos em consulta médica (incluídos pela Lei 13.257/2016, DOU 09/03/2016); fonte secundária cita alteração pela Lei 15.156/2025 (até 6 consultas) — DIVERGÊNCIA, conferir no Planalto — https://blog.grupogen.com.br/juridico/areas-de-interesse/trabalho/dica-037-novas-hipoteses-de-interrupcao-do-contrato-de-trabalho/ ; https://www.peticoesonline.com.br/art-473-clt ; https://www.planalto.gov.br/ccivil_03/decreto-lei/del5452.htm [SEC/OFICIAL]
- Lei 11.108/2005 (altera Lei 8.080/90): SUS, rede própria ou conveniada, deve permitir 1 acompanhante indicado pela parturiente durante trabalho de parto, parto e pós-parto imediato — o pai pode ser o acompanhante escolhido — https://www2.camara.leg.br/legin/fed/lei/2005/lei-11108-7-abril-2005-536370-publicacaooriginal-26874-pl.html [OFICIAL]
- Pré-Natal do Parceiro (Min. Saúde, estratégia da PNAISH/2009; Guia 2016 e ed. 2023): consultas individuais ao parceiro com enfoque preventivo/educativo/clínico; Portaria 1.474/2017 incluiu consulta pré-natal do parceiro e testes rápidos de sífilis/HIV do pai nos procedimentos do SUS — https://portaldeboaspraticas.iff.fiocruz.br/biblioteca/guia-do-pre-natal-do-parceiro-para-profissionais-de-saude/ ; https://portal.afya.com.br/medicina-de-familia/como-o-pre-natal-do-parceiro-pode-ajudar-a-cuidar-da-saude-do-homem [OFICIAL/SEC]
- Salário-família 2026: cota R$ 67,54 por filho (até 14 anos ou inválido de qualquer idade) para remuneração até R$ 1.980,38 (Portaria Interministerial MPS/MF nº 13, de 09/01/2026, DOU 12/01/2026, efeitos 01/01/2026); em 2025 era R$ 65,00 / R$ 1.906,04; quem ultrapassa o teto no mês perde a cota inteira; pago pelo empregador e compensado no INSS; soma-se remuneração de vários vínculos — https://coad.com.br/home/noticias-detalhe/135505/fixados-os-novos-valores-da-tabela-do-inss-e-do-salario-familia ; https://previdenciarista.com/blog/portaria-do-inss-altera-calculo-do-salario-familia/ [SEC; texto oficial em in.gov.br não acessado]
- Pensão alimentícia: NÃO existe percentual fixo em lei; CC art. 1.694 §1º — "na proporção das necessidades do reclamante e dos recursos da pessoa obrigada" (binômio necessidade × possibilidade); 30% dos rendimentos líquidos é o padrão usual citado pelo TJRJ ("em consonância com o padrão usualmente adotado por este Tribunal"); STJ reafirma estrita proporcionalidade à renda — https://www.migalhas.com.br/depeso/452934/pensao-alimenticia-proporcionalidade-e-o-stj ; https://www.conjur.com.br/2024-fev-18/e-possivel-aumentar-pensao-mesmo-sem-a-melhora-das-financas-do-pai/ [SEC]
- Lei 5.478/1968 regula a ação de alimentos (rito especial, alimentos provisórios) — https://www.planalto.gov.br/ccivil_03/leis/l5478.htm [OFICIAL; texto não lido nesta sessão]
- Guarda compartilhada (Lei 13.058/2014): tempo de convívio dividido de forma equilibrada entre mãe e pai, sempre considerando as condições fáticas e os interesses dos filhos; a lei nada diz sobre divisão da pensão — https://ambitojuridico.com.br/?p=9023008 ; lei em https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13058.htm [SEC/OFICIAL]
- Registro de nascimento: pai ou mãe, juntos ou separados, têm 15 dias (Lei 6.015/73 art. 50, com Lei 13.112/2015); se um não registrar, o outro tem mais 45 dias; a mais de 30 km do cartório, até 3 meses; registro e 1ª certidão gratuitos; registro tardio sem multa — https://www12.senado.leg.br/noticias/materias/2015/03/31/agora-e-lei-mae-pode-registrar-filho-no-cartorio-sem-a-presenca-do-pai ; https://arpensp.org.br/noticia/existe-um-prazo-legal-para-registrar-o-bebe [OFICIAL/SEC]
- Pai não casado registra levando a via amarela da DNV + documento de identidade; nome do pai na DNV não prova paternidade (Lei 6.015 art. 54); reconhecimento espontâneo ou averiguação oficiosa pela Lei 8.560/92 art. 2º — https://www.tjdft.jus.br/informacoes/extrajudicial/manuais/cartilhas/registro-civil-de-pessoas-naturais ; https://www12.senado.leg.br/noticias/materias/2015/03/31/agora-e-lei-mae-pode-registrar-filho-no-cartorio-sem-a-presenca-do-pai [OFICIAL]
- Salário-maternidade ao pai viúvo: Lei 8.213/91 art. 71-B (incluído pela Lei 12.873/2013) — se a segurada falece, o benefício é pago pelo período restante ao cônjuge/companheiro sobrevivente segurado; Justiça Federal (26ª Vara/POA, jan/2026) afastou o prazo do §1º e aplicou Tema 1182 do STF (licença-maternidade ao pai monoparental) — https://www.migalhas.com.br/quentes/448199/inss-concedera-salario-maternidade-a-pai-apos-morte-da-mae-em-parto ; https://previdenciarista.com/blog/tnu-julga-o-tema-236-salario-maternidade-ao-pai-nos-casos-de-obito-da-mae/ [SEC]

---

## D) TRILHAS, DESAFIOS DE 30 DIAS E GAMIFICAÇÃO LEVE

### Fatos/estruturas verificadas (ver seção B para URLs)
- Exodus 90: 90 dias; 3 pilares; leitura diária + hora santa; jejum 2x/semana; reunião semanal; check-in diário com "anchor"; grupo de 4-6 — https://stpatrickparish.org/ministries/exodus90 [SEC]
- 75 Hard: 75 dias; 5 tarefas diárias fixas; regra "zerou, recomeça" — https://www.garagegymreviews.com/what-is-the-75-hard-challenge [SEC]
- Fraternus: ciclo semanal (jantar → jogo → ensino → discussão → desafio da semana → oração) com uma virtude por semana — https://maryourqueen.com/ministry/fraternus-at-moq/ [SEC]
- ENS: reunião mensal + 6 pontos concretos de esforço (hábitos permanentes, não desafio com prazo) + retiro anual — https://equipes-notre-dame.com/wp-content/uploads/2019/11/GUIA-DAS-EQUIPAS-NOSSA-SENHORA-2018.pdf [SEC]
- Não foi encontrado (nesta pesquisa) um "desafio de 30 dias para pais" brasileiro consolidado com tarefas diárias — oportunidade de ser o primeiro no nicho em PT-BR. [CONH]

### Síntese de design (derivada das referências acima) [CONH]
- Duração: 30 dias (porta de entrada), 90 dias (trilha profunda, estilo Exodus). Dia = 1 tarefa principal (10-20 min) + 1 micro-hábito + leitura curta.
- Fraternidade: grupo de 4-6, "âncora" (duo de responsabilidade), reunião semanal (online ou paroquial), check-in diário em 1 toque.
- Regra de recomeço suave (ao contrário do 75 Hard): perder 1 dia não zera; perder 3 seguidos "pausa" o desafio.
- Gamificação leve: streak (dias seguidos), badges por marco (7/14/30/90), selo de "Pai Âncora" para quem acompanha outro pai, ranking apenas de grupo (nunca individual público), certificado ao concluir.

---

## E) CONTEÚDO DE NICHO

### E.1 Cortes de carne — Brasil × EUA
Referências:
- Tasting Table — picanha = top sirloin cap: https://www.tastingtable.com/2142911/most-flavorful-brazilian-steakhouse-beef-cut-order-picanha
- Tasting Table — que corte é picanha: https://tastingtable.com/1078823/what-type-of-steak-cut-is-picanha
- Texas Monthly — picanha (Brazilian beef cut): https://www.texasmonthly.com/recipe/grill-picanha-brazilian-beef-cut/
- Comprerural — de que parte do boi vem as carnes: https://comprerural.com/de-que-parte-do-boi-vem-as-carnes-que-comemos/
- Gazeta SP — melhores cortes bovinos: https://www.gazetasp.com.br/gazeta-mais/curiosidades/alem-da-picanha-conheca-os-melhores-cortes-de-carne-bovina/1144557
- Boratto BBQ — cortes "prime" do contrafilé (ancho etc.): https://blogs.correiobraziliense.com.br/andreboratto/2020/11/29/churrasqueada-prime-cortes-contrafile/
- ESALQ/USP — indústria e comércio da carne (Catálogo ABIEC com glossário em 7 idiomas; ~23 cortes básicos): https://www.esalq.usp.br/visaoagricola/sites/default/files/va03-industria-e-comercio03.pdf
- Bem Paraná — churrasco suíno, 5 melhores cortes: https://www.bemparana.com.br/noticia/churrasco-suino-conheca-os-cinco-melhores-cortes
- UnB — cortes suínos (anexo acadêmico): https://bdm.unb.br/bitstream/10483/21292/2/2018_JakelineSantosDeSousa_anexo.pdf

Fatos verificados:
- Picanha = top sirloin cap (também rump cap, sirloin cap, coulotte); nos EUA é difícil achar porque o corte americano é mais mecanizado e a picanha costuma ser dividida — https://tastingtable.com/1078823/what-type-of-steak-cut-is-picanha ; https://www.gazetasp.com.br/gazeta-mais/curiosidades/alem-da-picanha-conheca-os-melhores-cortes-de-carne-bovina/1144557 [SEC]
- Fraldinha é parecida mas NÃO é o flank steak — https://www.tastingtable.com/2142911/most-flavorful-brazilian-steakhouse-beef-cut-order-picanha [SEC]
- Ancho é retirado da parte dianteira do contrafilé; cortes "prime" (ancho, chorizo, etc.) vieram da escola argentina/americana — https://blogs.correiobraziliense.com.br/andreboratto/2020/11/29/churrasqueada-prime-cortes-contrafile/ [SEC]
- A ABIEC publicou catálogo brasileiro de cortes bovinos com glossário internacional em 7 idiomas; Brasil tem ~23 cortes básicos — https://www.esalq.usp.br/visaoagricola/sites/default/files/va03-industria-e-comercio03.pdf [SEC]
- Suíno: grandes cortes = dianteiro (paleta, copa-lombo), central (carré/lombo, barriga com costela), pernil; filé mignon suíno deriva do lombo; costela é o corte mais popular e mais gorduroso do churrasco suíno — https://bdm.unb.br/bitstream/10483/21292/2/2018_JakelineSantosDeSousa_anexo.pdf ; https://www.bemparana.com.br/noticia/churrasco-suino-conheca-os-cinco-melhores-cortes [SEC]

TABELA 1 — Cortes bovinos: nome BR × nome EUA (equivalências usuais; [CONH] exceto onde indicado — publicar com nota "equivalências aproximadas; confirmar no Catálogo ABIEC")

| Nome no Brasil | Nome nos EUA (aprox.) | Região do boi | Uso típico |
|---|---|---|---|
| Picanha | Top sirloin cap / Rump cap / Coulotte [SEC Tasting Table] | Traseiro (alcatra) | Churrasco em tiras com capa de gordura |
| Alcatra (miolo) | Top sirloin (butt) [SEC Tasting Table, parcial] | Traseiro | Bife, churrasco |
| Maminha | Tri-tip (bottom sirloin) | Traseiro (ponta da alcatra) | Churrasco inteira |
| Fraldinha | Flap meat / Bavette (bottom sirloin flap) — NÃO é flank [SEC] | Vazio/dianteiro inferior | Churrasco, tiras |
| Vazio | Flank steak | Abdome | Grelha rápida |
| Contrafilé | Striploin / New York strip | Lombo | Bife, churrasco |
| Bife ancho | Ribeye (parte anterior do contrafilé) [SEC Boratto] | Lombo dianteiro | Grelha |
| Bife de chorizo | Strip steak alto (contrafilé) | Lombo | Grelha |
| Filé mignon | Tenderloin / Filet mignon | Lombo interno | Medalhões |
| T-bone | T-bone / Porterhouse | Lombo com osso | Grelha |
| Costela (ripa/janela) | Short ribs / Plate ribs | Costelas | Churrasco longo, fogo de chão |
| Prime rib / Costela premium | Bone-in ribeye / Prime rib | Costela dianteira | Grelha |
| Cupim | Hump (zebu hump) — sem equivalente comum nos EUA | Dorso (bovinos zebuínos) | Churrasco lento/papel alumínio |
| Coxão mole | Inside round / Top round | Traseiro | Bife, assado |
| Coxão duro | Outside round / Bottom round | Traseiro | Cozidos, carne de panela |
| Patinho | Knuckle / Sirloin tip | Traseiro | Moída, bife |
| Lagarto | Eye of round | Traseiro | Rosbife, carne louca |
| Acém | Chuck | Dianteiro | Panela, moída |
| Peito | Brisket | Dianteiro | Defumado, cozido |
| Músculo | Shank | Pernas | Ossobuco, caldos |
| Paleta | Shoulder clod / Chuck shoulder | Dianteiro | Panela |
| Capa de filé | Chuck eye roll (parte) | Dianteiro | Panela/moída |
| Ponta de agulha | Short plate / Navel | Costela baixa | Panela |

TABELA 2 — Suíno (BR × EUA) [CONH]

| Brasil | EUA (aprox.) | Uso |
|---|---|---|
| Pernil | Ham (fresh) / Leg | Assado |
| Lombo | Loin | Assado, bisteca sem osso |
| Bisteca | Pork chop (bone-in loin) | Grelha |
| Carré | Rack / Rib roast | Assado |
| Costelinha | Spare ribs / Baby back ribs | Churrasco |
| Copa-lombo | Pork collar / Coppa / Boston butt (parte) | Churrasco, pulled pork |
| Paleta | Shoulder / Picnic | Pulled pork |
| Panceta / Barriga | Pork belly | Torresmo, bacon |
| Filé mignon suíno | Pork tenderloin | Medalhão |
| Joelho | Pork knuckle / Hock | Eisbein |

TABELA 3 — Frango (nomes BR) [CONH]: peito (breast), filé de peito, sassami (tenderloin/inner fillet), coxa (drumstick), sobrecoxa (thigh), coxa com sobrecoxa (leg quarter), asa inteira (wing), coxinha da asa (drumette), meio da asa/tulipa (wingette/flat), dorso (back), moela/coração/fígado (giblets).

### E.2 Carne por pessoa no churrasco
Referências:
- O Povo — conta muda conforme perfil de quem vai comer: https://opovo.com.br/trends/churrasco-sem-carne-sobrando-nem-convidado-com-fome-a-conta-que-muda-conforme-o-perfil-de-quem-vai-comer/
- O Antagonista — como calcular: https://oantagonista.com.br/brasil/como-calcular-a-quantidade-certa-de-carne-por-pessoa-no-churrasco/
- Itatiaia — quantidade ideal sem desperdício: https://www.itatiaia.com.br/trends/a-quantidade-ideal-de-carne-para-churrasco-como-calcular-por-pessoa-sem-desperdicio/
- Diário do Pará — conta por pessoa: https://diariodopara.com.br/cotidiano/vai-fazer-churrasco-essa-conta-revela-quantos-quilos-de-carne-comprar-por-pessoa/
- Omni Calculator — calculadora de churrasco (fórmula): https://www.omnicalculator.com/pt/alimentacao/calculadora-churrasco
- Casamentos.com.br — churrasco para festa (700-800 g em buffet): https://www.casamentos.com.br/artigos/como-calcular-a-quantidade-de-churrasco-para-uma-festa--c5428

Fatos verificados:
- Base usual: 400-500 g de carne por adulto em churrasco tradicional com acompanhamentos; até 600 g se a carne é prato único ou o evento é longo — https://oantagonista.com.br/brasil/como-calcular-a-quantidade-certa-de-carne-por-pessoa-no-churrasco/ ; https://www.itatiaia.com.br/trends/a-quantidade-ideal-de-carne-para-churrasco-como-calcular-por-pessoa-sem-desperdicio/ [SEC]
- Por duração: 300 g (<3 h), 450 g (3-5 h), 600 g (>5 h); fórmula: Total = (adultos + crianças × 0,5) × g/pessoa — https://www.omnicalculator.com/pt/alimentacao/calculadora-churrasco [SEC]
- Crianças até 10 anos: 150-200 g (outra fonte: 125-200 g de 5 a 10 anos); adolescentes: 300-400 g — https://diariodopara.com.br/cotidiano/vai-fazer-churrasco-essa-conta-revela-quantos-quilos-de-carne-comprar-por-pessoa/ ; https://opovo.com.br/trends/churrasco-sem-carne-sobrando-nem-convidado-com-fome-a-conta-que-muda-conforme-o-perfil-de-quem-vai-comer/ [SEC]
- Margem de segurança: +10% a 20%; exemplo: 15 adultos + 3 crianças + 2 adolescentes, 5 h ≈ 8,5 kg com margem — https://oantagonista.com.br/brasil/como-calcular-a-quantidade-certa-de-carne-por-pessoa-no-churrasco/ [SEC]
- Cortes gordurosos/com osso (costela, cupim) pedem quantidade bruta maior para render o mesmo líquido; buffet de casamento usa 700-800 g/adulto — https://www.casamentos.com.br/artigos/como-calcular-a-quantidade-de-churrasco-para-uma-festa--c5428 [SEC]

TABELA 4 — Carne por pessoa (gramas, carne crua) — parâmetros para a calculadora /ferramentas/calculadora-de-churrasco

| Perfil | Churrasco curto (<3 h) | Padrão (3-5 h, c/ acompanhamentos) | Longo / carne como prato único (>5 h) |
|---|---|---|---|
| Adulto homem | 350 g | 450-500 g | 600 g |
| Adulto mulher | 300 g | 350-400 g | 500 g |
| Adolescente (11-17) | 250 g | 300-400 g | 450 g |
| Criança (5-10) | 125 g | 150-200 g | 250 g |
| Criança (<5) | 80 g | 100 g | 120 g |
| Margem de segurança | +10% | +10-15% | +20% |
| Ajuste por corte com osso (costela) | ×1,3 | ×1,3 | ×1,3 |
| Linguiça/pão de alho/queijo coalho (entradas) | reduz carne em ~15% | idem | idem |
| Bebida (cerveja) | — | 1,5-2 L/adulto | 2-3 L/adulto [CONH] |
| Carvão | — | ~1 kg por 1 kg de carne [CONH] | — |

### E.3 Ferramentas essenciais de casa
Referências:
- Loja do Mecânico — kit essencial de casa: https://www.lojadomecanico.com.br/blog/ferramentas-essenciais-para-ter-em-casa/
- TudoGostoso — primeira maleta de ferramentas: https://www.tudogostoso.com.br/noticias/monte-sua-primeira-maleta-de-ferramentas-itens-basicos-e-baratos-que-todo-mundo-deveria-ter-em-casa-a23292.htm
- Revista Oeste — quanto custa montar caixa básica (abr/2026, kits ~R$ 110-140): https://revistaoeste.com/oestegeral/2026/04/13/quanto-custa-montar-uma-caixa-de-ferramentas-basica-para-usar-no-dia-a-dia/
- Promobit — kit de ferramentas, o que não pode faltar: https://www.promobit.com.br/blog/kit-de-ferramentas-o-que-nao-pode-faltar-na-sua-casa/

Fatos verificados:
- Lista básica consensual: martelo, chaves de fenda (Phillips e reta), alicate (universal), fita métrica/trena, nível de bolha, chave inglesa, jogo de chaves Allen (móveis), estilete, lanterna — https://www.lojadomecanico.com.br/blog/ferramentas-essenciais-para-ter-em-casa/ ; https://www.tudogostoso.com.br/noticias/monte-sua-primeira-maleta-de-ferramentas-itens-basicos-e-baratos-que-todo-mundo-deveria-ter-em-casa-a23292.htm [SEC]
- Kits prontos básicos anunciados em 2026 por ~R$ 109,90 a ~R$ 140 — https://revistaoeste.com/oestegeral/2026/04/13/quanto-custa-montar-uma-caixa-de-ferramentas-basica-para-usar-no-dia-a-dia/ [SEC]
- Complementos recomendados (nível 2) [CONH]: parafusadeira/furadeira de impacto + brocas (concreto/madeira/metal), detector de tensão (busca-polo), fita isolante, fita veda-rosca, escada 5 degraus, serrote/arco de serra, chave de grifo, pistola de silicone, kit de buchas e parafusos, óculos e luvas de proteção, lubrificante (WD-40), cola instantânea e epóxi, trena laser (opcional).

### E.4 Manutenção básica do carro
Referências:
- BlaBlaCar — manutenção preventiva: https://blog.blablacar.com.br/dicas/manutencao-preventiva
- Autopapo — 10 coisas que você mesmo pode fazer: https://autopapo.com.br/noticia/manutencao-10-dicas/
- O Mecânico — manutenção preventiva (centro automotivo): https://omecanico.com.br/centro-automotivo-destaca-a-importancia-dos-servicos-de-manutencao-preventiva/
- Vrum — 10 cuidados: https://www.vrum.com.br/noticias/manutencao-carro-10-cuidados/
- Monitor do Mercado — tabela de frequências: https://monitordomercado.com.br/noticias/322106-negligenciar-isso-no-carro-e-o-erro-mais-caro-que-os-motoristas-cometem-sem-perceber/

Fatos verificados:
- Semanal (ou antes de viagem): nível de óleo do motor; água/aditivo do radiador com motor frio; calibragem dos pneus frios na pressão do manual, incluindo estepe; faróis/lanternas; palhetas (trocar se ressecadas/barulhentas); fluido do limpador — https://blog.blablacar.com.br/dicas/manutencao-preventiva ; https://autopapo.com.br/noticia/manutencao-10-dicas/ [SEC]
- Troca de óleo conforme manual, em geral entre 5.000 e 10.000 km; rodízio, alinhamento e balanceamento a cada 10.000 km; revisão de freios a cada 5.000 km; fluido de freio baixando com frequência indica vazamento — https://monitordomercado.com.br/noticias/322106-negligenciar-isso-no-carro-e-o-erro-mais-caro-que-os-motoristas-cometem-sem-perceber/ ; https://omecanico.com.br/centro-automotivo-destaca-a-importancia-dos-servicos-de-manutencao-preventiva/ [SEC]
- Uso severo (estrada ruim, poeira, trânsito intenso) encurta intervalos; o manual do proprietário prevalece — https://blog.blablacar.com.br/dicas/manutencao-preventiva [SEC]
- Checklist complementar [CONH]: bateria (3-5 anos; terminais limpos), correia dentada (60-100 mil km, conforme manual), filtro de ar/cabine (10-20 mil km), fluido de freio (2 anos), velas, pastilhas, kit de emergência (triângulo, macaco, chave de roda, cabo de bateria, lanterna, extintor opcional), documentação/CRLV digital.

---

## IDEIAS PARA O VOCAÇÃO DE PAI (módulo · prioridade P0 = fundação/MVP, P1 = fase seguinte, P2 = depois)

1. **Pai Indica Pai / Vagas** — formulário de vaga com os 5 campos obrigatórios do Google (title, description, datePosted, hiringOrganization, jobLocation) + validThrough, employmentType, baseSalary (faixa), jobLocationType, applicantLocationRequirements (BR) e directApply; JSON-LD JobPosting gerado automaticamente em /pai-indica-pai/vagas/$slug. **P0**
2. **Pai Indica Pai / Vagas** — expiração automática: campo `valid_through` (7/15/30/60 dias, padrão 30, como a Remotar); cron marca `status='expirada'`, página passa a responder 410 ou mantém validThrough passado; nunca deixar vaga vencida indexada (regra do Google). **P0**
3. **Pai Indica Pai / Vagas** — moderação prévia obrigatória (como Programathor): status `pendente → aprovada/recusada`, fila no /admin com checklist antifraude: sem cobrança do candidato, e-mail corporativo (bloquear gmail/hotmail para empresas), salário/requisitos dentro do mercado, sem "100% comissionada", link de candidatura https; log em `moderation_log`. **P0**
4. **Pai Indica Pai / Vagas** — selo "Indicada por um pai da Irmandade": vaga só entra se um membro logado (`profiles`) a indicar; `job_referrals` guarda quem indicou e quantos candidatos vieram; badge "Pai que abre portas" após 3 indicações aprovadas. **P0**
5. **Pai Indica Pai / Vagas** — LGPD: não hospedar currículos no MVP; candidatura redireciona para o link externo (modelo ABES: "não participamos do processo seletivo"); se depois houver "banco de talentos", exigir consentimento específico, prazo de retenção (ex.: 12 meses) e botão "excluir meus dados". **P0**
6. **Pai Indica Pai / Vagas** — integração com Google Indexing API para publicar/remover vagas na hora, além do sitemap; filtros: remoto/híbrido/presencial, cidade/UF, faixa salarial, tipo (CLT/PJ/estágio/freelancer). **P1**
7. **Pai Indica Pai / Vagas** — página /pai-indica-pai/vagas/golpes com guia "como reconhecer vaga falsa" (sinais verificados: taxa, e-mail gratuito, salário irreal, 'vimos seu currículo') e botão "denunciar vaga" que cria registro em `moderation_log`. **P1**
8. **Pai Indica Pai / Profissionais** — diretório de pais prestadores (eletricista, contador, advogado de família, mecânico) com verificação manual, cidade, WhatsApp mascarado e avaliação apenas de membros logados; schema LocalBusiness/Person. **P1**
9. **Pai Indica Pai / Mentoria** — "Pai Âncora": pareamento 1:1 inspirado no anchor do Exodus 90 (pai experiente × pai de primeira viagem), check-in semanal por formulário curto; tabela `mentorships` com status e metas. **P1**
10. **Formação / Trilhas** — Trilha "Os 7 Pilares do Pai" (fé, casamento, filhos, provisão/finanças, corpo, casa/ofício, comunidade): cada pilar = 4-6 passos (`track_steps`) com texto curto + vídeo + tarefa prática; progresso em `track_progress`. **P0**
11. **Desafios** — "Desafio 30 Dias de Pai Presente": 1 tarefa/dia de 10-20 min (ex.: dia 1 jantar sem celular; dia 7 escrever carta ao filho; dia 14 'dever de se sentar' com a esposa; dia 21 consertar algo em casa com o filho; dia 30 churrasco de encerramento). Regra de recomeço suave (3 dias seguidos perdidos = pausa, não zera). **P0**
12. **Desafios** — "Êxodo do Pai 90" (versão católica longa, inspirada no Exodus 90): oração diária, jejum qua/sex, sem álcool/telas supérfluas, exercício, grupo de 4-6 com reunião semanal e âncora diário; abrir sempre no 1º domingo do Advento e na Quaresma. **P1**
13. **Desafios / Gamificação leve** — streak de dias, badges por marco (7/14/30/90), badge "Âncora" (acompanhou outro pai), "Primeiro Churrasco", "Pai Registrador" (registrou filho em 15 dias); ranking somente do grupo, nunca público individual; certificado em PDF ao concluir. **P1**
14. **Irmandade** — "Galpão do Pai" (inspirado nos Men's Sheds, 'ombro a ombro'): seção de projetos práticos (marcenaria, reparos, horta) com fotos de antes/depois postadas pelos membros; encontro mensal presencial por cidade registrado em `events`/`event_rsvps`. **P1**
15. **Irmandade** — "Café dos Pais" (inspirado no Dads Group): evento recorrente simples, liderado por pares, para pais de bebês de 0-2 anos; kit PDF "como abrir um Café dos Pais na sua paróquia" (roteiro de 90 min: café, roda de vitórias e medos, tema curto, oração). **P1**
16. **Irmandade / Perguntas** — Q&A moderado estilo "pergunte a um pai experiente", com tags (pensão, guarda, licença, bebê, carro, casa); respostas aceitas pelo autor; schema QAPage. **P1**
17. **Ferramentas** — /ferramentas/direitos-do-pai: guia interativo com linha do tempo da licença-paternidade (5 dias hoje → 10 em 2027 → 15 em 2028 → 20 em 2029; +15 na Empresa Cidadã; +1/3 PcD), com fonte oficial em cada item e aviso "atualizado em". **P0**
18. **Ferramentas** — Calculadora de licença-paternidade: entrada = data do nascimento, empresa aderente à Empresa Cidadã (sim/não), filho PcD (sim/não), MEI/CLT/doméstico; saída = dias, data de retorno, prazo de 2 dias úteis para pedir a prorrogação, documentos. **P0**
19. **Ferramentas** — Calculadora de salário-família 2026 (R$ 67,54/filho até 14 anos, teto R$ 1.980,38) com alerta de perda total ao ultrapassar o teto; parâmetros em tabela editável no admin para atualizar a cada portaria anual. **P1**
20. **Ferramentas** — Simulador de pensão alimentícia (educativo, não jurídico): aplica binômio necessidade × possibilidade, mostra faixa usual (20-30% dos rendimentos líquidos, prática do TJRJ) e deixa claro que não existe tabela legal; CTA para "Profissionais" (advogado de família da Irmandade). **P1**
21. **Ferramentas** — Checklist "Nasceu! Os 10 primeiros passos do pai": DNV via amarela, registro em até 15 dias (gratuito), CPF na certidão, inclusão no plano de saúde, salário-família, licença, pré-natal do parceiro antes do parto (testes rápidos), acompanhante no parto (Lei 11.108). Exportável em PDF e salvo em `saved_items`. **P0**
22. **Ferramentas** — Calculadora de churrasco (g por pessoa por perfil e duração, Tabela 4), com lista de compras por corte, carvão, bebidas e botão "Comprar na Amazon" para acessórios (faixa de preço). **P0**
23. **Ferramentas** — Guia visual "Mapa do Boi BR × EUA" (Tabela 1) com SVG clicável; cada corte linka para artigo do Blog (como preparar) e produto da Loja (faca, tábua, termômetro). **P1**
24. **Ferramentas** — Checklist de manutenção do carro com lembretes (semanal: óleo, água, pneus, luzes; 5 mil km: freios; 10 mil km: rodízio/alinhamento; anual: bateria/palhetas) e registro de quilometragem na Área do Pai (`tool_usage`). **P1**
25. **Loja do Pai** — categoria "Caixa de ferramentas em 3 níveis" (Básico ~R$ 110-140 / Intermediário / Pro) com review comparativo no Pai Indica e lista de compras exportável. **P0**
26. **Blog / Backlog** — série legislativa evergreen: "Licença-paternidade 2026/2027: o que muda" (atualizar a cada janeiro), "Empresa Cidadã: como pedir os 20 dias", "Guarda compartilhada na prática", "Pai pode registrar o filho sozinho?", "Salário-maternidade para o pai viúvo", "Pré-natal do parceiro: seus exames". **P0**
27. **Área do Pai** — "Linha do tempo do filho": a partir de `children` (data de nascimento) gera lembretes automáticos (registro até 15 dias, consultas, 1 dia/ano CLT XI para consulta, aniversário) e sugere trilhas por fase (gestação, 0-1, 1-3, 3-6, 6-12, adolescência). **P1**
28. **Formação / Casal** — módulo "Dever de se sentar" (ENS): lembrete mensal de conversa estruturada do casal com roteiro de 6 perguntas; integra com Vocação de Mãe (link cruzado para a esposa). **P2**
29. **Irmandade / Paróquias** — mapa de grupos parceiros (ECC, ENS, MFC, Fraternus-like, Exodus 90 BR) por cidade, com formulário para cadastrar o grupo; dados em `events` com recorrência. **P2**
30. **Automação** — rotina mensal que verifica mudanças legislativas (feeds do Senado/Câmara/STF sobre "licença-paternidade", "salário-família") e abre PR com rascunho de atualização do guia de direitos. **P2**
31. **Admin / Antifraude** — rate limit de 1 vaga/dia por conta nova, exigência de e-mail verificado + 7 dias de conta para indicar vaga; reputação do indicador (`profiles.trust_score`) acelera aprovação. **P1**
