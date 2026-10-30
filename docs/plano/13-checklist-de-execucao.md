# 13 — Checklist de execução (todas as fases, na ordem exata)

> Checklist único do projeto. Marque `- [x]` ao concluir cada etapa **e** atualize a linha
> correspondente em `PROGRESSO.md` no mesmo commit. A numeração `N.M` é a mesma usada nos
> documentos de fase (`03` a `10`). Não pular etapas; dependências entre fases no `PLANO-MESTRE.md` §4.

## Fase 1 — Fundação (`03-fase-1-fundacao.md`)

- [x] 1.1 Clonar `vocacaodemae` para este repositório (copiar `src/`, `supabase/`, `public/`, configs); commit inicial "chore: base clonada do Vocação de Mãe"
- [x] 1.2 Remover `@lovable.dev/mcp-js`, rotas `.lovable`/`.mcp`/`mcp.ts`, `.well-known` do Lovable e `src/i18n/`; site só em PT-BR
- [x] 1.3 Remover todo conteúdo, componentes, rotas e seeds de maternidade (histórias de mãe, loja da mãe, calculadoras de gestação); manter só a estrutura
- [x] 1.4 Renomear pacote, título, metadados, favicon e manifest para "Vocação de Pai"; `PUBLIC_SITE_URL=https://vocacaodepai.com.br`
- [x] 1.5 Aplicar design tokens em `src/styles.css` (`@theme`: primária `#14505C`, secundária `#1F2429`, destaque `#D9822B`, fundo `#F4EFE6`, texto `#1B1F23`, sucesso `#2F7D4F`, atenção `#D9A21B`, alerta `#B23A3A`; escuro `#14181C`/`#1F2429`) e fontes "Barlow Condensed" + "Inter"
- [x] 1.6 Criar `.env.example` com todas as variáveis do `CLAUDE.md` §13 e atualizar `.gitignore`
- [ ] 1.7 Dono cria o projeto Supabase (`sa-east-1`); substituir `<SUPABASE_PROJECT_REF>` no `CLAUDE.md`, `.env.example` e doc 02; configurar `VITE_SUPABASE_URL`/`ANON_KEY` na Vercel
- [ ] 1.8 Escrever e aplicar `supabase/migrations/0001_core.sql` com o SQL do doc 03 §3.1 (nomes do doc 02 §4.1: profiles, children, contact_messages, newsletter_subscribers, moderation_log, _tmp_post_staging, seo_search_stats, `is_admin()`, `get_secret()`, buckets, trigger `updated_at`, trigger de criação de profile, RLS; se o SQL do doc 03 divergir do doc 02, vale o doc 03 e registrar em `PROGRESSO.md`) *(arquivo pronto e validado localmente; aplicar quando o projeto Supabase existir)*
- [ ] 1.9 Escrever e aplicar `0002_blog.sql` com o SQL do doc 03 §3.2 (nomes do doc 02 §4.2: categories, tags, post_tags, posts com todas as colunas-chave, comments, reactions, post_view_events, função `search_posts`, índice GIN em `search_content`, RLS) *(idem)*
- [x] 1.10 Criar `supabase/migrations/README.md` listando 0003–0007 como "aplicadas na fase N com o SQL do doc da fase" (nada a aplicar aqui): `0003_loja.sql` = product_categories, products, product_price_checks (F3, doc 05 §2) · `0004_membros.sql` = saved_items, plans, subscriptions, badges, user_badges (F5, doc 07 §2) · `0005_pai_indica_pai.sql` = jobs, job_referrals, professionals, mentorships (F6, doc 08 §2) · `0006_irmandade_formacao.sql` = stories, questions, answers, events, event_rsvps, tracks, track_steps, track_progress, challenges, challenge_days, challenge_progress (F7, doc 09 §2) · `0007_ferramentas.sql` = market_cache, tool_usage (F4, doc 06 §2.1)
- [x] 1.11 Seed de categorias do Blog (`00NN_seed_categories.sql`): paternidade, casamento, filhos, trabalho-e-carreira, dinheiro-do-pai, fe-e-formacao, saude-do-homem, churrasco-e-cozinha, casa-e-oficina, pai-indica
- [x] 1.12 Layout do site: header com as 8 seções, footer com institucionais e aviso de afiliado, modo escuro, menu mobile
- [x] 1.13 Home: hero, últimos artigos, bloco Pai Indica (placeholder), bloco Loja do Pai (placeholder), bloco Caixa de Ferramentas (placeholder), newsletter
- [x] 1.14 Rotas do Blog: `/blog` (lista + filtro por categoria), `/post/$slug` (render Tiptap com callouts do Semáforo do Pai, tabela, taskList, FAQ, quiz, JSON-LD Article), `/categoria/$slug`, `/busca` (tsvector português)
- [x] 1.15 Componentes `SemaforoDoPai` (callouts ok/warn/alerta), `ContinueLendo`, `FaqBlock`, `QuizBlock`, `ParaAMae` (link cruzado com Vocação de Mãe)
- [x] 1.16 Institucionais: `/sobre`, `/contato` (form → Resend ou mailto fallback), `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-afiliados`
- [x] 1.17 `/admin`: login de admin (`is_admin()`), lista de posts, editor Tiptap com nós callout/table/taskList/image, campos kind/faq/quiz/seo, publicar/despublicar
- [x] 1.18 `scripts/validate-content.mjs`: regras do `CLAUDE.md` §4.3 (semáforo, ≥10 links válidos, capa não repetida, termos proibidos, Pai Indica com nota/categoria, faixa de preço, botão)
- [x] 1.19 `sitemap[.]xml.ts`, `robots.txt`, RSS `/rss.xml`, meta tags OG/Twitter padrão
- [ ] 1.20 Publicar 10 artigos seed Padrão A do Pai (2 por categoria principal) via migration de dados, `status='published'` *(0009/0010 prontos e validados; aplicar com o projeto)*
- [ ] 1.21 Dono cria projeto `vocacaodepai` na Vercel (time "Portal da AI") e aponta o domínio; deploy de produção verde
- [ ] 1.22 Validar `npm run build && npm run lint && node scripts/validate-content.mjs`; abrir PR "Fase 1 — Fundação"; atualizar `PROGRESSO.md` *(validações verdes; PR #2 aberto em 30/10/2026)*

## Fase 2 — Pai Indica (`04-fase-2-pai-indica-reviews.md`)

- [x] 2.1 (feito em `src/lib/pai-indica/taxonomia.ts`, nome do doc 04 §3) `src/lib/product-taxonomy.ts`: categorias e subcategorias de produto (churrasco, ferramentas, cozinha, eletrônicos, casa, carro, esporte, vestuário, livros, bebê-e-criança) com slugs fixos
- [x] 2.2 (feito em `src/lib/pai-indica/types.ts` + `score.ts`; validação no `validate-content.mjs`, sem Zod) Tipos TypeScript `ReviewJson` e `ComparisonJson` (`src/lib/types/pai-indica.ts`) espelhando o `CLAUDE.md` §7; validação com Zod
- [x] 2.3 (`CriteriaScores` e `AffiliateButton`, nomes do doc 04 §4) Componentes `ReviewBadge` (nota no card), `ScoreScaleNote` (régua de nota), `CriteriaTable` (5 critérios), `ProsCons`, `BotaoComprar` (texto fixo "Comprar agora na Amazon", `rel="sponsored nofollow noopener"`)
- [x] 2.4 (faixa resolvida em `src/lib/pai-indica/body.ts`; `PriceRange.tsx`) Nó Tiptap `fotosModelos` (fotos oficiais lado a lado com faixa de preço e botão por produto) + `PriceRange` ("Faixa de preço pesquisada em <data>")
- [x] 2.5 (sem ordenação por nota: doc 04 §5.1 não prevê) Rota `/pai-indica`: lista de posts `kind in (review, comparativo, lista)`, `ScoreScaleNote` no topo, filtro de duas camadas (`ProductCategoryFilter`), ordenação por data/nota
- [x] 2.6 Rota `/pai-indica/$slug`: layout de review (header com nota, critérios, prós/contras, veredito, botão) e de comparativo/lista (tabela de specs, seção por produto, "Qual comprar")
- [x] 2.7 (sem `aggregateRating`, doc 04 §7) JSON-LD `Product` + `Review` (review) e `ItemList` (comparativo/lista); `aggregateRating` só com dados reais
- [ ] 2.8 `/admin`: formulário de review (campos do JSON, cálculo automático de `product_score`) e de comparativo (N produtos, vencedor)
- [x] 2.9 (home: `PaiIndicaTeaser` com selo; fim de artigos do Blog fica para a Fase 3/8) Bloco "Pai Indica" na home e no fim de artigos do Blog da mesma categoria de produto
- [x] 2.10 `validate-content.mjs`: regras de Pai Indica (JSON válido, 5 critérios, `product_score` coerente, faixa de preço, botão)
- [ ] 2.11 (6 prontos na `0011_seed_pai_indica.sql`, não aplicados; ASIN/fotos/review longa PENDENTES — ver `progresso-fase-2.md`) Publicar os 20 Pai Indica do doc 04 §10 em 4 rodadas de 5 (mínimo R1+R2 = 10; R3/R4 registradas como pendência em `PROGRESSO.md`), cada um com capa composta, fotos oficiais Amazon, produtos na loja com review longa e faixa pesquisada em 2 lojas
- [ ] 2.12 Validar, abrir PR "Fase 2 — Pai Indica", atualizar `PROGRESSO.md`

## Fase 3 — Loja do Pai (`05-fase-3-loja.md`)

- [ ] 3.1 Seed `product_categories` (10, doc 05 §3): churrasco-e-cozinha, ferramentas, carro-e-moto, tecnologia, esporte-e-outdoor, paternidade-pratica, livros-e-formacao, estilo-e-barba, casa-e-jardim, presentes-para-o-pai
- [ ] 3.2 Queries em `src/lib/db/products.ts` (lista por categoria, destaque, por slug, relacionados) com cache de 5 min no servidor
- [ ] 3.3 Rota `/loja`: hero com slogan "O pai também quer desconto", categorias, destaques (`featured`), grade de produtos com `ProductCard` (foto oficial, faixa de preço, rating, botão)
- [ ] 3.4 Rota `/loja/categoria/$slug`: grade filtrada, subcategorias, ordenação (relevância, menor faixa, maior nota)
- [ ] 3.5 Rota `/loja/$slug`: galeria (`images`), faixa de preço com data, botão "Comprar agora na Amazon", prós/contras, review longa (`products.review`), produtos relacionados, Pai Indica relacionados, JSON-LD `Product`
- [ ] 3.6 `/admin/produtos`: CRUD completo (ASIN → preencher `affiliate_url`; upload/URL de imagem oficial; categoria/subcategoria; destaque; ativo)
- [ ] 3.7 Ferramenta de admin "Checar faixa de preço": grava em `product_price_checks` 2 lojas, calcula `price_min`/`price_max` (regra `max ≤ 3×min`), atualiza `price_range_checked_at`
- [ ] 3.8 Botão "Salvar na Área do Pai" (desabilitado até a Fase 5, com tooltip)
- [ ] 3.9 Bloco "Loja do Pai" na home e em artigos do Blog (produtos da mesma categoria)
- [ ] 3.10 Seed de 60 produtos (6 por categoria, doc 05 §10), cada um com ≥3 fotos oficiais; ≥20 com review longa real; ≥15 com faixa de mercado pesquisada
- [ ] 3.11 `validate-content.mjs`: regras de produto (faixa, botão, imagem oficial `m.media-amazon.com`, categoria válida)
- [ ] 3.12 Validar, abrir PR "Fase 3 — Loja do Pai", atualizar `PROGRESSO.md`

## Fase 4 — Caixa de Ferramentas (`06-fase-4-ferramentas.md`)

- [ ] 4.1 Registro de ferramentas em `src/lib/tools.ts` (slug, nome, descrição, ícone, categoria, componente) e rota `/ferramentas` (grade por categoria)
- [ ] 4.2 Rota `/ferramentas/$slug` genérica (layout, SEO, "Como usar", artigos relacionados, `tool_usage` via `/api/tool-usage`)
- [ ] 4.3 Camada `src/lib/market/` com cache em `market_cache` (get/set com TTL) e fallback "dados de <data>"
- [ ] 4.4 `/ferramentas/conversor-de-moedas`: AwesomeAPI (USD, EUR, GBP, ARS, BTC → BRL e inverso), histórico 30 dias, TTL 15 min
- [ ] 4.5 `/ferramentas/mercado-financeiro` ("Mercado do pai"): dólar, euro, Bitcoin, Ibovespa (BRAPI, token opcional), Selic, IPCA, poupança (BCB SGS); leitura "o que isso muda no seu bolso"; aviso "informação educativa"
- [ ] 4.6 Sessão 4B — Dinheiro (doc 06 §0.6, §3.3 e §3.7–§3.10): `custo-do-filho`, `orcamento-familiar`, `juros-compostos`, `reserva-de-emergencia`, `pensao-alimenticia`
- [ ] 4.7 Sessão 4C — Família e Saúde (doc 06 §0.6, §3.4 e §3.12–§3.17): `licenca-paternidade`, `nomes-de-filhos`, `calendario-de-vacinacao`, `marcos-do-desenvolvimento`, `imc-e-gasto-calorico`, `checklist-da-maternidade` (slug fixo do doc 02 §1.3; conteúdo = mala, documentos e tarefas **do pai** no dia do parto, doc 06 §0.2 item 15 — nada de conteúdo de maternidade do VDM)
- [ ] 4.8 Sessão 4D — Churrasco/Cozinha/Oficina (doc 06 §0.6, §3.5, §3.6, §3.11 e §3.15): `calculadora-de-churrasco` (adultos/crianças/duração → carne por corte, carvão, bebidas; lista de compras; links para a Loja do Pai), `cortes-de-carne` (SVG do boi clicável; por corte: preparo, ponto, faixa de preço, artigos relacionados), `conversor-de-unidades`, `kit-de-ferramentas`. Os 17 slugs são os do doc 06 §0.2 / doc 02 §1.3; `decimo-terceiro`, `ferias`, `horas-extras`, `consumo-de-combustivel` **não existem nesta fase** (doc 06 §3.18, backlog pós-F8)
- [ ] 4.9 Bloco "Mercado do pai hoje" na home (3 indicadores + link)
- [ ] 4.10 PWA: `manifest.webmanifest`, ícones, service worker com cache das calculadoras offline
- [ ] 4.11 Botão "Salvar ferramenta" (desabilitado até a Fase 5)
- [ ] 4.12 Validar, abrir PR "Fase 4 — Caixa de Ferramentas", atualizar `PROGRESSO.md`

## Fase 5 — Área do Pai (`07-fase-5-area-do-pai-membros.md`)

- [ ] 5.1 Supabase Auth: e-mail/senha + Google OAuth (dono cadastra `GOOGLE_CLIENT_ID/SECRET`); URLs de redirect da Vercel
- [ ] 5.2 Rotas `/entrar` e `/cadastro` (formulários, validação, erros em PT-BR, link "esqueci a senha")
- [ ] 5.3 Trigger `handle_new_user` cria `profiles` com `role='member'`; onboarding em 3 passos (nome, cidade/UF, filhos)
- [ ] 5.4 Rota `/minha-conta`: editar perfil, avatar (Storage bucket `avatars`), filhos (`children` CRUD), newsletter opt-in e segmentos por fase do filho, excluir conta (soft)
- [ ] 5.5 Rota `/area-do-pai`: painel com widgets — continue lendo, itens salvos, trilhas em andamento, desafio do dia, Mercado do pai, badges (placeholder até F7)
- [ ] 5.6 `saved_items`: salvar/dessalvar post, produto, ferramenta (ativar botões das fases 3 e 4); aba "Salvos" com filtro por tipo
- [ ] 5.7 Newsletter: `/api/newsletter` (inscrição + confirmação dupla via Resend), `newsletter_subscribers.segments`, página de confirmação
- [ ] 5.8 Iscas gratuitas de cadastro (3 arquivos do doc 11 §7: capítulo "5 cortes", checklist "72 horas", planilha enxuta — especificação no doc 09 §12b.3) em `public/downloads/`, entregues após confirmação da newsletter (`/newsletter/obrigado?ok=1`)
- [ ] 5.9 `plans` seed: `gratuito` (active=true) e `pai-de-familia` (active=false); página `/area-do-pai/planos` só lista o gratuito
- [ ] 5.10 Guard de rotas autenticadas (`_auth` layout), redirect para `/entrar` com retorno
- [ ] 5.11 Testar RLS com anônimo e dois usuários diferentes (profiles, children, saved_items)
- [ ] 5.12 Validar, abrir PR "Fase 5 — Área do Pai", atualizar `PROGRESSO.md`

## Fase 6 — Pai Indica Pai (`08-fase-6-pai-indica-pai.md`)

- [ ] 6.1 Rota `/pai-indica-pai` (hub: vagas recentes, profissionais em destaque, mentoria, botão "Indicar")
- [ ] 6.2 Rota `/pai-indica-pai/vagas`: lista de `jobs` aprovadas, filtros (UF, cidade, remoto, tipo, área), busca, paginação
- [ ] 6.3 Rota `/pai-indica-pai/vagas/nova` (autenticado): formulário com validação, `status='pending'`, `expires_at` padrão 45 dias, e-mail de recebimento
- [ ] 6.4 Rota `/pai-indica-pai/vagas/$slug`: detalhe, "Como se candidatar", contador `views`, JSON-LD `JobPosting` completo (Google for Jobs), botão "Salvar vaga"
- [ ] 6.5 Indicações (`job_referrals`): formulário "Indicar profissional/serviço/empresa", lista pública por categoria e cidade
- [ ] 6.6 Rota `/pai-indica-pai/profissionais` (Pai Profissional): membro cria/edita perfil profissional (`professionals`), busca por profissão/cidade/UF, cartão com badge
- [ ] 6.7 Rota `/pai-indica-pai/mentoria`: mentores por área, pedido de mentoria (`mentorships` pending → mentor aceita/recusa), e-mails via Resend
- [ ] 6.8 `/admin/moderacao`: filas de vagas, indicações, profissionais; aprovar/reprovar com nota; gravar `moderation_log`; e-mail ao autor
- [ ] 6.9 Rotina de expiração: função SQL `expire_jobs()` + cron (pg_cron ou rota `/api/cron/expire-jobs` chamada pela Vercel Cron)
- [ ] 6.10 Sitemap de vagas (`/sitemap-vagas.xml`) e bloco "Vagas indicadas por pais" na home
- [ ] 6.11 Testar RLS (anônimo vê só approved; autor edita a própria pending; admin tudo)
- [ ] 6.12 Validar, abrir PR "Fase 6 — Pai Indica Pai", atualizar `PROGRESSO.md`

## Fase 7 — Irmandade e Formação (`09-fase-7-irmandade-e-formacao.md`)

- [ ] 7.1 Rota `/irmandade` (hub: últimas histórias, perguntas sem resposta, próximos eventos, regras da casa)
- [ ] 7.2 Histórias: `/historias` (lista approved), `/historias/nova` (editor Tiptap simplificado, capa, `pending`), `/historias/$id` (leitura, curtir)
- [ ] 7.3 Perguntas e respostas: `/perguntas` (lista, filtro por categoria), `/perguntas/$slug` (respostas, votos, melhor resposta pelo autor), nova pergunta (autenticado)
- [ ] 7.4 Eventos: `/eventos` (lista futuros/passados, online/presencial), detalhe, RSVP (`event_rsvps`), lembrete por e-mail 24 h antes
- [ ] 7.5 `/admin/moderacao`: filas de histórias e perguntas/respostas; `moderation_log`
- [ ] 7.6 Formação: `/formacao` (trilhas por nível), `/formacao/$slug` (passos, progresso, próximo passo), marcar passo concluído (`track_progress`)
- [ ] 7.7 Desafios: `/desafios` (lista), `/desafios/$slug` (dia a dia, tarefa + reflexão, iniciar, marcar dia; `challenge_progress`)
- [ ] 7.8 Badges: motor de regras (`badges.rule` JSON avaliado em função SQL `award_badges(user_id)` chamada ao concluir passo/dia); seeds "Pai presente", "Leitor", "Irmão", "Provedor", "Filho de São José"
- [ ] 7.9 Seeds (doc 09 §5.2, §6.2 e §7): 8 trilhas (107 passos; T1 `pai-de-primeira-viagem-em-30-dias` e T6 `mestre-do-churrasco` completas, demais com `summary`), 3 desafios de 30 dias (`30-dias-de-presenca-com-os-filhos`, `30-dias-do-provedor`, `30-dias-de-disciplina-do-homem`), 20 insígnias; `scripts/seed-formacao.mjs` gera e aplica `0008_seed_formacao.sql`
- [ ] 7.9b Biblioteca do Pai + `/loja/digital/$slug` (doc 09 §12b): migration `0010_biblioteca_do_pai.sql` (`digital_products`, `digital_purchases`, bucket privado `digital-products`), `/area-do-pai/biblioteca`, página de vendas, edge function `hotmart-webhook` + e-mail de entrega, `/admin/biblioteca`; 3 produtos cadastrados em `draft` até o dono publicar
- [ ] 7.10 Widgets reais no `/area-do-pai`: trilhas em andamento, desafio do dia, badges conquistadas
- [ ] 7.11 Testar RLS e fluxo completo de moderação
- [ ] 7.12 Validar, abrir PR "Fase 7 — Irmandade e Formação", atualizar `PROGRESSO.md`

## Fase 8 — Automação, rotinas e painel (`10-fase-8-automacao-rotinas-e-painel.md`)

- [ ] 8.1 `scripts/rotina/`: Python herdado do VDM conforme doc 10 §4.1 (`art_gen.py`, `cmp_gen.py`, `rev_art_gen.py`, `review_gen.py`, `cover_cmp.py`, `amz.py`, `photo_upgrade.py`, `price_range.py`, `news_gen.py`, `slugs.sh`, `proibidos.json`) + `backlog.mjs` (doc 12 §9.3) e briefs `BRIEF_ARTIGO_PAI.md`, `BRIEF_COMPARATIVO.md`, `BRIEF_REVIEW_UNICA.md`, `BRIEF_REVIEW.md`, `BRIEF_NOTICIA.md` (nomes fixados no doc 02 §3 e doc 10 §4.1)
- [ ] 8.2 Rotina diária (Claude Code Routine): escolher tema do `12-backlog-de-conteudo.md`, gerar artigo, validar, inserir publicado, abrir PR `claude/rotina-<data>`
- [ ] 8.3 Rotina semanal de Pai Indica (1 review ou comparativo) e rotina semanal de checagem de faixa de preço (`product_price_checks`)
- [ ] 8.4 Workflow `.github/workflows/ci.yml`: build + lint + validate-content em todo PR
- [ ] 8.5 Workflow `.github/workflows/auto-merge.yml`: mescla PRs `claude/*` quando CI e deploy da Vercel passam (ligar só após 8.4 verde)
- [ ] 8.6 Links cruzados automáticos com o Vocação de Mãe (`ParaAMae`/`ParaOPai` por mapeamento de slugs) e newsletter conjunta
- [ ] 8.7 Newsletter semanal automática por segmento (Resend Broadcast ou rota `/api/cron/newsletter`), bloco "Mercado do pai" diário na home via cache
- [ ] 8.8 GA4 (`PUBLIC_GA4_ID`), Search Console, AdSense (slots nas páginas de artigo, Pai Indica e Loja; nunca em `/admin` nem na Área do Pai)
- [ ] 8.9 Integração no Painel Lisieux (`grupovdp`): registrar o site, métricas GA4/Search Console/AdSense, status da rotina
- [ ] 8.10 Página `/podcast` (episódios + transcrição) e push de novo artigo no PWA
- [ ] 8.11 Checklist de SEO/AdSense/Amazon Associados do doc 11 cumprido (política de afiliados, aviso, robots, Core Web Vitals verdes)
- [ ] 8.12 Validar, abrir PR "Fase 8 — Automação, rotinas e painel", atualizar `PROGRESSO.md`; marcar o projeto como "em operação"
