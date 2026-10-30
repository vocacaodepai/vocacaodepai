# Instruções do projeto — Vocação de Pai

> Lido por **toda** sessão de Claude Code neste repositório. Regras aqui são obrigatórias.
> Dono: Bruno Danello (grupo VDP). Executor previsto: Claude Sonnet 5.5, esforço médio.

## 0. Antes de qualquer tarefa

1. Ler, nesta ordem: `PLANO-MESTRE.md` → o documento da fase atual em `docs/plano/` →
   `docs/plano/PROGRESSO.md`. Só depois tocar em código.
2. Toda decisão de arquitetura já está tomada no plano. Não reabrir, não "melhorar" nomes.
3. Ao terminar **cada etapa**: validar, atualizar `docs/plano/PROGRESSO.md` e marcar a caixa em
   `docs/plano/13-checklist-de-execucao.md`, commitar. Fase pela metade sem registro é fase perdida.
4. Dúvida não coberta pelo plano: escolher a opção mais simples e coerente com o Vocação de Mãe,
   registrar em `PROGRESSO.md` → "Decisões tomadas durante a execução" e seguir.

## 1. O que é o site

**Vocação de Pai** (vocacaodepai.com.br) é o portal do **pai e do homem católico de família
tradicional**: formação do homem como pai, marido, provedor e líder servidor. É o irmão do Vocação
de Mãe (vocacaodemae.com.br, da esposa do dono) e herda sua infraestrutura.

Seções oficiais (nomes fixos — usar exatamente assim em UI, código e texto):

| Seção | Rotas | Fase |
|---|---|---|
| **Blog** | `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca` | 1 |
| **Pai Indica** | `/pai-indica`, `/pai-indica/$slug` | 2 |
| **Loja do Pai** ("O pai também quer desconto") | `/loja`, `/loja/categoria/$slug`, `/loja/$slug` | 3 |
| **Caixa de Ferramentas** | `/ferramentas`, `/ferramentas/$slug`; destaques `/ferramentas/conversor-de-moedas`, `/ferramentas/mercado-financeiro` | 4 |
| **Área do Pai** | `/area-do-pai`, `/minha-conta`, `/entrar`, `/cadastro` | 5 |
| **Pai Indica Pai** | `/pai-indica-pai`, `/pai-indica-pai/vagas`, `/pai-indica-pai/vagas/$slug`, `/pai-indica-pai/vagas/nova`, `/pai-indica-pai/profissionais`, `/pai-indica-pai/mentoria` | 6 |
| **Irmandade** | `/irmandade`, `/historias`, `/historias/$id`, `/historias/nova`, `/perguntas`, `/perguntas/$slug`, `/eventos` | 7 |
| **Formação** | `/formacao`, `/formacao/$slug`, `/desafios`, `/desafios/$slug` | 7 |
| Institucional | `/sobre`, `/contato`, `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-afiliados` | 1 |
| Admin | `/admin` (editor Tiptap, produtos, moderação de vagas/indicações/histórias/perguntas) | 1+ |

## 2. Stack (fixa)

- **TanStack Start** (React 19 + Vite + TypeScript), SSR na Vercel.
- **Tailwind 4** + **shadcn/ui** (Radix). Sem outra biblioteca de UI.
- **Supabase** — projeto novo, região `sa-east-1`, ref **`<SUPABASE_PROJECT_REF>`**
  (placeholder: a Fase 1 substitui pelo ref real aqui, no `.env.example` e no doc 02).
- **Vercel**, time "Portal da AI". Deploy automático a cada push no `main`.
- **Resend** para e-mail. **Tiptap** para o body dos posts (JSON).
- Base de código: clone do `vocacaodemae`, **sem** `@lovable.dev/mcp-js`, sem rotas `.lovable`/MCP,
  sem i18n (só PT-BR), sem conteúdo de maternidade.
- Node 22. Scripts: `npm run dev`, `npm run build`, `npm run lint`, `node scripts/validate-content.mjs`.

### Estrutura de pastas

```
src/
  routes/            # TanStack Start (file-based): __root.tsx, _site/, _admin/, api/, sitemap[.]xml.ts
  components/        # ui/ (shadcn), site/, blog/, pai-indica/, loja/, ferramentas/, area-do-pai/, irmandade/, formacao/
  lib/               # supabase.ts (client), db/ (queries por domínio), seo.ts, format.ts, tokens.ts
  hooks/
  styles.css         # tokens CSS + @theme do Tailwind 4
supabase/
  migrations/        # 0001_core.sql … 0007_ferramentas.sql (+ 00NN_<dados>.sql para seeds e artigos)
  seed/              # JSON de categorias, produtos, trilhas, desafios
scripts/
  validate-content.mjs   # valida posts/produtos (estrutura, links, termos proibidos, preço)
  rotina/                # geradores da rotina diária (Fase 8)
docs/plano/          # o plano (00…13 + PROGRESSO.md)
```

## 3. Linha editorial (obrigatória — herdada do grupo VDP)

- **Visão católica de família tradicional**: homem e mulher, pai e mãe, casamento, filhos.
- **Proibido**, em texto e imagem: conteúdo ou representação LGBTQI, casais do mesmo sexo,
  ideologia de gênero, pornografia ou sensualidade, vulgaridade, palavrão, apologia a drogas,
  machismo tóxico, desprezo pela mulher ou pela mãe, política partidária, promessa financeira
  ("fique rico"), aconselhamento médico/jurídico/financeiro como se fosse profissional (sempre
  "procure um profissional" no "Sinal de alerta").
- **Tom**: direto, masculino, respeitoso, prático, firme e acolhedor. Fala de homem para homem.
  Sem ironia barata, sem "coach", sem vitimismo.
- **Formação**: o homem como pai, marido, provedor, líder servidor, filho de Deus. Fé aparece com
  naturalidade (santos, oração, sacramentos), sem proselitismo agressivo.
- Imagens: pai com filhos, casal homem-mulher, família, homem trabalhando, churrasco, oficina,
  natureza, igreja. Nunca imagem que contradiga o parágrafo acima.
- Português do Brasil, segunda pessoa ("você"), títulos em forma de frase ou pergunta.

## 4. Convenções de trabalho

### 4.1 Git e PR

- Uma branch `claude/fase-N-<etapa-curta>` por sessão, criada de `main` atualizado.
- Commits em PT-BR, imperativo: `feat(loja): página de produto com faixa de preço`.
  Prefixos: `feat`, `fix`, `chore`, `db`, `content`, `docs`.
- **Antes do push, sempre:** `npm run build && npm run lint && node scripts/validate-content.mjs`.
  Os três verdes. Não abrir PR vermelho.
- Abrir PR contra `main` com título `Fase N — <etapas>` e corpo curto (feito / como validar /
  pendências). Até a Fase 8 o dono mescla; a partir da Fase 8 o workflow `auto-merge.yml` mescla
  PRs `claude/*` quando o deploy de teste da Vercel passa.
- Depois do merge, conferir o deploy na Vercel (`mcp__Vercel__list_deployments`).

### 4.2 Banco de dados

- Migrations em `supabase/migrations/`, numeradas: `0001_core.sql` … `0007_ferramentas.sql` são
  as de schema (ordem fixa, SQL no doc 02). Dados (seeds, artigos, produtos) entram em
  `00NN_<descricao>.sql` seguintes.
- **Todo `.sql` é commitado E aplicado** via `mcp__Supabase__apply_migration` (DDL) ou
  `mcp__Supabase__execute_sql` (DML) no projeto `<SUPABASE_PROJECT_REF>`. Só commitar não muda o site.
- Migrations idempotentes: `create table if not exists`, `add column if not exists`,
  `create policy` precedido de `drop policy if exists` (única exceção de `drop` permitida, e só
  para policies).
- **Nunca `DROP TABLE`, `DELETE`, `TRUNCATE` em rotina ou migration de dados.**
- **Reforma de artigo existente**: nunca `UPDATE` com body inteiro. Duas etapas:
  1. `insert into public._tmp_post_staging (k, data) values ('<slug>', $stg$<json>$stg$) on conflict (k) do update set data = excluded.data;`
  2. `update posts p set body = s.data::jsonb, excerpt = '...', search_content = to_tsvector('portuguese', (select string_agg(t #>> '{}', ' ') from jsonb_path_query(s.data::jsonb, 'strict $.**.text') t)), updated_at = now() from public._tmp_post_staging s where s.k = '<slug>' and p.slug = '<slug>';`
- **Artigo pedido pelo dono entra publicado**: `status = 'published'`, `publish_at = now()`.
  `draft` só se ele pedir explicitamente.
- Se uma escrita der timeout, conferir com `SELECT` antes de repetir. Se falhar 2 vezes, pular e
  registrar.
- RLS em toda tabela antes de receber dado: anônimo lê só `status='published'`/`'approved'`/
  `active=true`; usuário edita o próprio (`auth.uid()`); admin via `public.is_admin()`.

### 4.3 Validação de conteúdo (`scripts/validate-content.mjs`)

Roda no `npm run build` do CI (Fase 8) e manualmente. Falha se: post publicado sem semáforo
(quando `kind='artigo'`), menos de 10 links internos válidos, link para slug inexistente, capa
repetida no corpo, termo proibido, post Pai Indica sem `product_score`/`product_category`/
`product_subcategory`, produto sem `price_min`/`price_max` ou com `price_max > 3*price_min`,
botão com texto diferente de "Comprar agora na Amazon".

## 5. Afiliados, preço e imagens

### 5.1 Botão e links

- Texto do botão **sempre** "Comprar agora na Amazon" (em comparativos: "Comprar <produto> agora na
  Amazon"). Classe `btn-comprar`. `rel="sponsored nofollow noopener"`, `target="_blank"`.
- URL: `https://www.amazon.com.br/dp/<ASIN>/?tag=<PUBLIC_AMAZON_TAG>` (variável `PUBLIC_AMAZON_TAG`).
- Toda página com link de afiliado mostra o aviso curto de afiliado e linka `/politica-de-afiliados`.

### 5.2 Faixa de preço

- **Nunca preço exato.** Sempre faixa `price_min`–`price_max`, pesquisada em **2 lojas** (Amazon +
  uma de: Mercado Livre, Magalu, Casas Bahia, Americanas, Kabum, Leroy Merlin, Centauro).
- Regra: `price_max ≤ 3 × price_min`. Se a pesquisa der mais que isso, descartar o outlier.
- Registrar cada pesquisa em `product_price_checks` (store, price, url, checked_at) e
  `products.price_range_checked_at`. Texto no site: "Faixa de preço pesquisada em <data>: R$ X a R$ Y".
- Campo `products.price` existe para uso interno; **nunca é exibido**.

### 5.3 Imagens (cascata e licenças)

1. **Produto**: sempre a **foto oficial da Amazon** do ASIN (URL `m.media-amazon.com`), nunca foto
   de terceiros. Em comparativos, fotos lado a lado.
2. **Capa e corpo de artigo**, nesta ordem de preferência: Pexels (API, `PEXELS_API_KEY`) →
   Pixabay (`PIXABAY_API_KEY`) → Unsplash (MCP) → Wikimedia Commons (só CC0/CC-BY, com crédito).
   Gravar em `cover_image_url` a URL da CDN da própria fonte (não baixar para o repositório).
   Crédito só é obrigatório para Wikimedia CC-BY: último parágrafo do `body`, "Foto: <autor>/<fonte>".
3. **Nunca repetir a capa no corpo** (comparar URL sem query string). Foto de corpo é nova e
   única no site.
4. Toda imagem segue a linha editorial: família tradicional, pai e filhos, casal homem-mulher.
5. Nunca URL inventada ou imagem quebrada; conferir com `HEAD` antes de gravar.
6. Alt text descritivo em PT-BR em toda imagem.

## 6. Padrão A do Pai (artigo informativo, `kind='artigo'`)

Estrutura obrigatória do `body` (Tiptap JSON):

1. **Abertura**: 1-2 parágrafos (a dor/dúvida do pai + o que o artigo resolve).
2. **Seções** com `heading` nível 2 em forma de frase ou pergunta; 1-2 parágrafos ou lista + parágrafo.
3. **Semáforo do Pai** (obrigatório quando houver risco, sintoma, decisão ou "quando procurar
   ajuda"; recomendado sempre): heading nível 2 "Semáforo do pai: <tema>" e, logo abaixo,
   **exatamente 3** blocos `callout`, nesta ordem:
   - `tone: "ok"` → texto começa com **"Sinal verde: "**
   - `tone: "warn"` → texto começa com **"Sinal de atenção: "**
   - `tone: "bad"` → texto começa com **"Sinal de alerta: "** e termina com a orientação de procurar
     ajuda profissional (médico, padre, advogado, contador…).
   Sem link dentro dos callouts; sem 4º callout.
4. **Links internos contextuais — mínimo de 10 por artigo**, tecidos nas frases, apontando para
   `/post/<slug>` (ou `/pai-indica/<slug>`, `/loja/<slug>`, `/ferramentas/<slug>`) que **existem no
   banco** (checar com `SELECT slug FROM posts WHERE status='published'` antes; nunca inventar).
   Formato: `marks: [{type:"link", attrs:{href:"/post/<slug>", class:null, rel:null, target:null}}]`.
5. **Tabela** (`table`/`tableRow`/`tableHeader`/`tableCell`) com colunas próprias do tema, sob
   heading nível 2.
6. **Checklist** (`taskList`/`taskItem`, `checked:false`) sob heading "Checklist do pai: <tema>",
   5-6 itens curtos sem ponto final; o último é "Ficar atento aos sinais do semáforo acima".
7. **Imagem inline opcional** (0, 1 ou mais): `image` com `attrs:{src, alt, title:null}`, nunca a
   capa, sempre coerente com a seção.
8. **Fechamento**: 1 parágrafo firme e encorajador sem links; depois 1 parágrafo
   "Continue lendo: " com 4-10 links (texto = título do post, separados por ", ", último com " e ",
   terminando em ".").
9. **FAQ** (`posts.faq`: array de `{question, answer}`, 3-6 itens) e/ou **quiz** (`posts.quiz`:
   array de `{question, options[], correct, explanation}`, 3-5 itens). Pelo menos um dos dois.
10. Metadados: `excerpt` (até 160 caracteres), `seo_title` (≤ 60), `seo_description` (≤ 155),
    `reading_time` (palavras/200), `category_id` válido, `cover_image_url`, `search_content`.

Tamanho: 1.200-2.200 palavras. Notícia (`kind='noticia'`) dispensa semáforo, tabela e checklist,
mas mantém ≥5 links internos e fechamento.

## 7. Pai Indica (reviews)

- `posts.kind` ∈ `review` (produto único), `comparativo` (2-4 produtos), `lista` ("Os N melhores").
- Todo post Pai Indica tem `product_category`, `product_subcategory` (slugs do catálogo em
  `src/lib/product-taxonomy.ts`) e `product_score` (0-10, uma casa decimal). Sem os três, some do
  filtro de `/pai-indica`.
- **Review individual**: `posts.review` segue o doc 02 §5.3 (formato único): `product_slug` existente
  em `products` (ativo, com faixa de preço e review longa), `score`, `criteria` (exatamente 5 itens
  `{name, weight, score, comment}` com os nomes e pesos da categoria em
  `src/lib/pai-indica/criterios.ts`; soma dos `weight` = 100; `score` = média ponderada com 1 casa),
  `pros[]`, `cons[]` (3-6 cada), `ideal_for`, `not_ideal_for`, `verdict`, `how_we_evaluated` (sem
  teste físico), `sources[]`, `other_buyers{}`. ASIN, foto, `affiliate_url` e faixa de preço vêm de
  `products`; nunca "R$" em campo algum. `product_score = review.score`. Chaves só em inglês (`nota`,
  `criterios`, `ideal_para` não são aceitas).
- **Comparativo / lista**: `posts.comparison` segue o doc 02 §5.4 (formato único):
  `criteria[]{name, weight}`, `products[]{product_slug, name, role, score, criteria_scores[], one_liner}`,
  `table{columns, rows}` (obrigatória em comparativo; `{FAIXA:slug}` só nas células), `winner_slug` ∈
  `products[].product_slug`, `verdict_by_profile[]{profile, pick_slug, reason}`, `how_we_evaluated`.
  `product_score` = `score` do vencedor. Chaves só em inglês (`produtos`, `vencedor` não são aceitas).
- Estrutura do body do comparativo: abertura (2 parágrafos) → "Em 3 pontos" → fotos oficiais lado a
  lado (nó `fotosModelos`) → "Os N modelos que comparamos" + tabela de especificações (com faixa de
  preço e nota de compradores) → uma seção por produto (foto oficial, botão "Comprar <produto> agora
  na Amazon", análise, Pontos fortes, Pontos de atenção) → "Por que isso importa antes de comprar"
  (links para o Blog) → "Variação de preço" → "Qual comprar" (por perfil) → "Como avaliamos"
  (fontes; sem teste físico) → "Outros comparativos e reviews".
- **Régua de nota**: 9,0-10 excepcional; 8,0-8,9 muito bom; 7,0-7,9 bom para um perfil; 6,0-6,9
  regular; <6 não recomendado (explicar e indicar alternativa). Nota quebrada é proposital.
  Componente `ScoreScaleNote` explica a régua no topo de `/pai-indica`; `ReviewBadge` mostra a nota
  no card.
- Nota de compradores da Amazon é outra coisa: aparece na tabela como "nota de compradores", nunca
  substitui a nota editorial.
- Todo Pai Indica emite JSON-LD `Product` + `Review` (ou `ItemList` para lista).

## 8. Tabelas e colunas-chave (resumo; SQL completo no doc 02)

Nomes fixos: `posts, categories, tags, post_tags, profiles, children, comments, reactions,
saved_items, products, product_categories, product_price_checks, newsletter_subscribers, tracks,
track_steps, track_progress, badges, user_badges, challenges, challenge_days, challenge_progress,
jobs, job_referrals, professionals, mentorships, stories, questions, answers, events, event_rsvps,
plans, subscriptions, market_cache, tool_usage, seo_search_stats, post_view_events,
_tmp_post_staging, moderation_log`.

Tabelas e views auxiliares definidas no SQL do doc da fase também são oficiais: `contact_messages`
(doc 02 §4.1), `story_likes`, `answer_votes`, `challenge_enrollments` e a view `irmandade_members`
(doc 09 §2). Tabela nova fora disso exige registrar em `PROGRESSO.md` → "Decisões tomadas durante a
execução".

- `posts`: `id uuid pk, slug unique, title, subtitle text, excerpt, body jsonb, cover_image_url,
  category_id, author_id, kind check in ('artigo','noticia','review','comparativo','lista'),
  review jsonb, comparison jsonb, product_category, product_subcategory, product_score numeric(3,1),
  faq jsonb, quiz jsonb, status check in ('draft','scheduled','published','archived'), publish_at,
  reading_time, search_content tsvector, seo_title, seo_description, created_at, updated_at`
  (colunas conforme doc 02 §4.2).
- `profiles`: `id = auth.users.id, display_name, avatar_url, role check in ('member','editor','admin')
  default 'member', bio, city, uf, onboarding_done, newsletter_opt_in`. `children`: `user_id, name,
  birth_date, sex`.
- `saved_items`: `user_id, item_type check in ('post','product','tool','job','track'), item_id text`
  (unique nos três).
- `products`: `slug, name, brand, asin, affiliate_network default 'amazon', affiliate_url,
  marketplace_urls jsonb, image_url, images jsonb, short_description, description, pros, cons,
  review jsonb, category_id → product_categories, subcategory, price, price_min, price_max,
  price_range_checked_at, rating numeric(2,1), rating_count, featured, sort_order, active`.
- `jobs`: `slug, title, company, city, uf, remote, type check in ('clt','pj','freela','estagio',
  'temporario'), salary_min, salary_max, description, how_to_apply, contact_email, contact_url,
  status check in ('pending','approved','rejected','expired'), expires_at, posted_by, moderated_by,
  moderated_at, views`.
- `tracks`/`track_steps`/`track_progress`, `challenges`/`challenge_days`/`challenge_progress`,
  `badges`/`user_badges`, `stories`, `questions`/`answers`, `events`/`event_rsvps`,
  `plans`/`subscriptions`, `market_cache (key pk, data, fetched_at, ttl_seconds)`, `tool_usage`,
  `moderation_log (actor_id, entity, entity_id, action, note)`: colunas no doc 02.

## 9. Design tokens

`src/styles.css` → `@theme`: primária `#14505C`, secundária `#1F2429`, destaque `#D9822B`, fundo
`#F4EFE6`, texto `#1B1F23`, sucesso `#2F7D4F`, atenção `#D9A21B`, alerta `#B23A3A`; escuro: fundo
`#14181C`, cartões `#1F2429`. Fontes Google: títulos "Barlow Condensed", texto "Inter". Semáforo usa
sucesso/atenção/alerta. Não inventar cor nova; derivar com opacidade.

## 10. Ferramentas e dados externos

- Conversor de moedas e Mercado do pai usam APIs públicas (AwesomeAPI para câmbio; BRAPI com
  `BRAPI_TOKEN` opcional para ações/índices; Banco Central SGS para Selic/IPCA/poupança) com
  cache em `market_cache` (TTL 15 min câmbio, 60 min índices, 24 h BCB). Sem chave → fallback
  para o último dado em cache com aviso "dados de <data>".
- Toda ferramenta registra uso em `tool_usage` (user_id nulo para anônimo).
- Nenhuma ferramenta dá conselho de investimento; texto padrão "informação educativa".

## 11. Área do Pai, moderação e e-mail

- Auth Supabase: e-mail/senha + Google OAuth. `profiles` criada por trigger em `auth.users`.
- Conteúdo enviado por membros (vagas, indicações, histórias, perguntas) nasce `pending`; aparece
  publicamente só `approved`; toda ação de moderação grava em `moderation_log`.
- E-mails (Resend, `RESEND_API_KEY`): confirmação de newsletter, aviso de aprovação/reprovação,
  lembrete de evento. Remetente `Vocação de Pai <contato@vocacaodepai.com.br>`.
- Plano gratuito ativo desde a Fase 5; plano pago fica `active=false` até o dono decidir.

## 12. Nomes oficiais (glossário curto)

Vocação de Pai · Blog · Pai Indica · Loja do Pai ("O pai também quer desconto") · Caixa de
Ferramentas · Mercado do pai · Área do Pai · Pai Indica Pai · Pai Profissional · Irmandade ·
Formação · Semáforo do Pai ("Sinal verde / Sinal de atenção / Sinal de alerta") · Padrão A do Pai ·
Régua de nota · Badge de pai presente · Rotina · Painel Lisieux. Glossário completo no
`PLANO-MESTRE.md` §7.

## 13. Variáveis de ambiente

`.env.example` (commitado) segue **exatamente** a tabela do doc 02 §8 (lista fechada; nenhum outro
nome de variável pode aparecer em código, workflows ou docs): `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (só servidor), `PUBLIC_SITE_URL`,
`PUBLIC_AMAZON_TAG`, `RESEND_API_KEY`, `PEXELS_API_KEY`, `PIXABAY_API_KEY`, `BRAPI_TOKEN` (opcional),
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_GA4_ID`, `CRON_SECRET` (único segredo de
cron/refresh/integrações: `/api/market/refresh`, `/api/cron/expire-jobs`, `/api/cron/vagas-digest`,
`/api/newsletter/weekly`, `/api/hub/metrics`, crons de `0008_cron.sql`), `TURNSTILE_SITE_KEY`,
`TURNSTILE_SECRET_KEY`. Nomes antigos **não existem** e devem ser trocados pela equivalência do doc 02 §8:
`VITE_SUPABASE_PUBLISHABLE_KEY` → `VITE_SUPABASE_ANON_KEY`; `VITE_SITE_URL` → `PUBLIC_SITE_URL`;
`VITE_AMAZON_TAG`/`AMAZON_ASSOCIATE_TAG` → `PUBLIC_AMAZON_TAG`; `VITE_GA4_ID` → `PUBLIC_GA4_ID`;
`MARKET_REFRESH_SECRET`/`MARKET_REFRESH_TOKEN`/`NEWSLETTER_CRON_SECRET`/`JOBS_CRON_SECRET`/
`INTERNAL_FN_SECRET`/`HUB_API_KEY` → `CRON_SECRET`; `AWESOMEAPI_TOKEN` → não existe (AwesomeAPI sem
chave); `VITE_ADSENSE_PUB_ID`, `RESEND_FROM`, `CONTACT_TO_EMAIL` → constantes em `src/lib/site.ts` /
`src/lib/adsense.ts`; `BILLING_ENABLED` → `plans.active`. Segredos que não são variáveis do app
(`GSC_SERVICE_ACCOUNT_JSON`, `MERCADOPAGO_ACCESS_TOKEN`/`MERCADOPAGO_WEBHOOK_SECRET`,
`SUPABASE_ACCESS_TOKEN`, `GH_PAT_AUTOMERGE`) ficam só onde o doc 02 §8 indica, fora do `.env.example`.
Nunca commitar `.env`. Chave ausente → registrar em `PROGRESSO.md` → "Pendências do dono" e usar
fallback.

## 14. Como reportar ao dono

Sempre em **PT-BR**, resumo curto (5-10 linhas): o que foi feito, o que foi validado, número/branch
do PR, o que falta na fase e pendências que só ele resolve. Sem jargão desnecessário, sem listar
cada arquivo. Modelo no `PLANO-MESTRE.md` §12. Se algo não deu certo, dizer claramente o que e por quê.

## 15. O que nunca fazer

Nomes fora do plano · reintroduzir i18n/Lovable/MCP/maternidade · preço exato · botão diferente de
"Comprar agora na Amazon" · artigo sem semáforo/links/checklist · capa repetida no corpo · imagem
fora da linha editorial · `DROP`/`DELETE`/`TRUNCATE` em rotina · tabela sem RLS · commit direto no
`main` · PR com build/lint/validate vermelho · auto-merge antes da Fase 8 · encerrar sessão sem
atualizar `PROGRESSO.md` · perguntar ao dono o que o plano já decidiu.
