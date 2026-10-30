# PLANO-MESTRE — Vocação de Pai (vocacaodepai.com.br)

> Documento-raiz do projeto. Toda sessão de Claude Code começa lendo **este arquivo**, o
> `CLAUDE.md`, o documento da fase atual em `docs/plano/` e o `docs/plano/PROGRESSO.md`.
> Escrito em 24/10/2026 para execução pelo **Claude Sonnet 5.5 (esforço médio)** no repositório
> `/home/user/vocacaodepai` (GitHub `vocacaodepai/vocacaodepai`).

---

## 1. Visão em uma página

**O que é.** O Vocação de Pai é o irmão do Vocação de Mãe (vocacaodemae.com.br): um portal
completo para o **pai e o homem católico de família tradicional** — formação do homem como pai,
marido, provedor e líder servidor. Reúne, num único ecossistema:

| Pilar | O que entrega | Seção oficial |
|---|---|---|
| Conteúdo | Artigos, notícias e guias práticos sobre paternidade, casamento, filhos, trabalho, dinheiro, fé, saúde do homem, churrasco e vida prática | **Blog** |
| Indicação | Reviews individuais, comparativos e listas de produtos com nota 0-10 e botão "Comprar agora na Amazon" | **Pai Indica** |
| Loja | Vitrine de produtos afiliados por categoria, com faixa de preço (slogan: "O pai também quer desconto") | **Loja do Pai** |
| Utilidades | Conversor de moedas, mercado financeiro, calculadoras (churrasco, orçamento familiar, 13º, férias, horas extras, consumo de combustível etc.) | **Caixa de Ferramentas** |
| Membros | Painel pessoal, filhos cadastrados, itens salvos, progresso em trilhas e desafios, badges | **Área do Pai** |
| Trabalho | Vagas de emprego indicadas por pais, diretório "Pai Profissional", indicações de serviços e mentoria | **Pai Indica Pai** |
| Comunidade | Histórias de pais, perguntas e respostas, eventos e encontros | **Irmandade** |
| Formação | Trilhas de formação (pai, marido, provedor, fé) e desafios de N dias | **Formação** |

**Para quem.** Homens de 25 a 55 anos, pais ou futuros pais, católicos ou simpatizantes da
família tradicional, no Brasil. Entram por busca orgânica (Google) e ficam pela utilidade
(ferramentas), pela comunidade (Irmandade) e pela formação (trilhas).

**Por que vai funcionar.** Reaproveita, pronta e testada, a infraestrutura do Vocação de Mãe
(TanStack Start + Supabase + Vercel + rotina automática de artigos) e o modelo editorial "AI Indica"
do Portal da AI (reviews com nota por critério). O custo de arrancar é baixo e as decisões de
arquitetura já estão tomadas neste plano.

**Como monetiza.** Google AdSense, Amazon Associados BR (botão sempre "Comprar agora na Amazon",
faixa de preço pesquisada, nunca preço exato), newsletter (Resend) e, no futuro, plano pago da Área do
Pai (tabelas `plans`/`subscriptions` criadas em `0004_membros.sql`, na Fase 5).

**Linha editorial (inegociável).** Visão católica de família tradicional: homem e mulher, pai e mãe.
Nunca conteúdo ou imagem LGBTQI ou de casais do mesmo sexo. Tom direto, masculino, respeitoso,
prático, sem vulgaridade e sem machismo tóxico. Português do Brasil.

---

## 2. Arquitetura resumida

Detalhes completos em `docs/plano/02-arquitetura-e-stack.md`. O que está aqui é a decisão fixa.

### 2.1 Stack

| Camada | Decisão |
|---|---|
| Framework | **TanStack Start** (React 19 + Vite + TypeScript), SSR na Vercel |
| Estilo | **Tailwind 4** + **shadcn/ui** sobre Radix |
| Banco / Auth / Storage | **Supabase** — projeto NOVO, região `sa-east-1`, ref placeholder `<SUPABASE_PROJECT_REF>` (preenchido na Fase 1) |
| Hospedagem | **Vercel**, time "Portal da AI", deploy automático a cada push no `main` |
| E-mail | **Resend** (newsletter, confirmação, avisos de moderação) |
| Editor de conteúdo | **Tiptap** (body dos posts em JSON, mesmo formato do Vocação de Mãe) |
| Base de código | **Clonar o repositório `vocacaodemae` e adaptar.** Remover `@lovable.dev/mcp-js`, rotas `.lovable`/MCP, i18n (site só em PT-BR) e todo conteúdo de maternidade |
| Automação | Claude Code Routine diária (artigos Padrão A do Pai + Pai Indica), auto-merge de PRs `claude/*` |
| Painel do grupo | Site entra no Painel Lisieux (`grupovdp`) na Fase 8 |

### 2.2 Seções oficiais e rotas (nomes fixos)

| Seção | Rotas |
|---|---|
| Blog | `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca` |
| Pai Indica | `/pai-indica`, `/pai-indica/$slug` (posts com `kind` review/comparativo/lista) |
| Loja do Pai | `/loja`, `/loja/categoria/$slug`, `/loja/$slug` |
| Caixa de Ferramentas | `/ferramentas`, `/ferramentas/$slug`; destaques `/ferramentas/conversor-de-moedas` e `/ferramentas/mercado-financeiro` |
| Área do Pai | `/area-do-pai` (painel), `/minha-conta`, `/entrar`, `/cadastro` |
| Pai Indica Pai | `/pai-indica-pai`, `/pai-indica-pai/vagas`, `/pai-indica-pai/vagas/$slug`, `/pai-indica-pai/vagas/nova`, `/pai-indica-pai/profissionais`, `/pai-indica-pai/mentoria` |
| Irmandade | `/irmandade`, `/historias`, `/historias/$id`, `/historias/nova`, `/perguntas`, `/perguntas/$slug`, `/eventos` |
| Formação | `/formacao`, `/formacao/$slug`, `/desafios`, `/desafios/$slug` |
| Institucional | `/sobre`, `/contato`, `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-afiliados` |
| Admin | `/admin` (editor Tiptap, produtos, moderação de vagas/indicações/histórias/perguntas) |

### 2.3 As 7 migrations (ordem fixa)

**Fase 1 aplica só `0001_core.sql` e `0002_blog.sql` (SQL do doc 03 §3.1–3.2). `0003`…`0007` são
escritas e aplicadas na fase correspondente com o SQL do doc da fase (0003 → doc 05 §2; 0004 → doc 07
§2; 0005 → doc 08 §2; 0006 → doc 09 §2; 0007 → doc 06 §2.1). O doc 02 §4 é referência de NOMES de
tabelas/colunas; quando o SQL do doc da fase e o do doc 02 divergirem, vale o doc da fase e o executor
registra em PROGRESSO.md.**

| Arquivo | Tabelas criadas (conteúdo = doc 02 §4.1–4.7) | Aplicada na |
|---|---|---|
| `supabase/migrations/0001_core.sql` | `profiles`, `children`, `contact_messages`, `newsletter_subscribers`, `moderation_log`, `_tmp_post_staging`, `seo_search_stats`, funções `is_admin()` e `get_secret()`, buckets de storage, trigger de `updated_at`, RLS base | F1 (SQL: doc 03 §3.1) |
| `0002_blog.sql` | `categories`, `tags`, `post_tags`, `posts` (com `kind`, `review`, `comparison`, `faq`, `quiz`, `search_content`), `comments`, `reactions`, `post_view_events`, função `search_posts` | F1 (SQL: doc 03 §3.2) |
| `0003_loja.sql` | `product_categories`, `products`, `product_price_checks` | F3 (SQL: doc 05 §2) |
| `0004_membros.sql` | `saved_items`, `plans`, `subscriptions`, `badges`, `user_badges` | F5 (SQL: doc 07 §2) |
| `0005_pai_indica_pai.sql` | `jobs`, `job_referrals`, `professionals`, `mentorships` | F6 (SQL: doc 08 §2) |
| `0006_irmandade_formacao.sql` | `stories`, `questions`, `answers`, `events`, `event_rsvps`, `tracks`, `track_steps`, `track_progress`, `challenges`, `challenge_days`, `challenge_progress` | F7 (SQL: doc 09 §2) |
| `0007_ferramentas.sql` | `market_cache`, `tool_usage` | F4 (SQL: doc 06 §2.1) |

Regra de RLS em todas: anônimo lê só `status='published'`/`'approved'`/`active=true`; usuário
edita o próprio registro (`auth.uid()`); admin via `public.is_admin()` (`profiles.role in ('editor','admin')`).
As colunas-chave de cada tabela estão em `docs/plano/02-arquitetura-e-stack.md` e no `CLAUDE.md`.

### 2.4 Design tokens

| Token | Valor |
|---|---|
| Primária (azul-petróleo) | `#14505C` |
| Secundária (grafite) | `#1F2429` |
| Destaque (âmbar/couro) | `#D9822B` |
| Fundo (areia) | `#F4EFE6` |
| Texto | `#1B1F23` |
| Sucesso | `#2F7D4F` |
| Atenção | `#D9A21B` |
| Alerta | `#B23A3A` |
| Modo escuro: fundo / cartões | `#14181C` / `#1F2429` |
| Fonte de títulos | "Barlow Condensed" (Google Fonts) |
| Fonte de texto | "Inter" (Google Fonts) |

Os tokens vivem em `src/styles.css` como variáveis CSS (`--color-primary`, …) consumidas pelo
Tailwind 4 via `@theme`. Semáforo do Pai usa sucesso/atenção/alerta.

---

## 3. As 8 fases

| Id | Título | Objetivo | Documento | Sessões Sonnet (est.) | Depende de | Critério de pronto |
|---|---|---|---|---|---|---|
| F1 | Fundação | Clonar VDM, limpar, aplicar design tokens, criar projeto Supabase e as migrations `0001_core.sql` e `0002_blog.sql`, blog funcionando com Padrão A do Pai, deploy na Vercel | `docs/plano/03-fase-1-fundacao.md` | 4-6 | — | Site no ar na Vercel com home, `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca`, `/rss.xml`, institucionais e `/admin` com editor; `0001_core.sql` e `0002_blog.sql` aplicadas (doc 03 §3); `npm run build && npm run lint && node scripts/validate-content.mjs` verdes; 10 artigos seed publicados |
| F2 | Pai Indica | Reviews individuais, comparativos e listas com nota 0-10, régua de nota, filtros por categoria de produto, JSON-LD | `docs/plano/04-fase-2-pai-indica-reviews.md` | 3-4 | F1 | `/pai-indica` e `/pai-indica/$slug` no ar; 20 Pai Indica do doc 04 §10 (mínimo rodadas R1+R2 = 10, com R3/R4 registradas em `PROGRESSO.md`) com capa composta; `ReviewBadge`, `ScoreScaleNote`, filtro de duas camadas; validador aceita `review`/`comparison` |
| F3 | Loja do Pai | Vitrine de produtos afiliados por categoria, página de produto com review longa, faixa de preço e botão "Comprar agora na Amazon" | `docs/plano/05-fase-3-loja.md` | 3-4 | F1 | `/loja`, `/loja/categoria/$slug`, `/loja/$slug` no ar com 10 categorias e 60 produtos (≥20 com review longa, ≥15 com faixa de mercado); CRUD em `/admin/produtos`; `product_price_checks` preenchida |
| F4 | Caixa de Ferramentas | Conversor de moedas, mercado financeiro ("Mercado do pai"), calculadoras com cache em `market_cache` | `docs/plano/06-fase-4-ferramentas.md` | 3-4 | F1 | `/ferramentas` com as 17 ferramentas do doc 06 §0.2; conversor e Mercado do pai com `market_cache` (`fetched_at` < 35 min) e fallback; `tool_usage` registrando uso |
| F5 | Área do Pai | Auth (e-mail/senha + Google), perfil, filhos, itens salvos, painel `/area-do-pai`, newsletter, planos (gratuito ativo, pago desativado) | `docs/plano/07-fase-5-area-do-pai-membros.md` | 4-5 | F1, F3, F4 | Cadastro, login, `/area-do-pai` com widgets; salvar post/produto/ferramenta funciona; RLS testada com usuário anônimo e logado |
| F6 | Pai Indica Pai | Vagas (cadastro, moderação, listagem, JSON-LD JobPosting), indicações de profissionais/serviços, diretório Pai Profissional, mentoria | `docs/plano/08-fase-6-pai-indica-pai.md` | 4-5 | F5 | Fluxo completo vaga: `nova` → `pending` → aprovação no `/admin` → `approved` publicada com JobPosting; profissionais e mentoria no ar; `moderation_log` preenchido |
| F7 | Irmandade e Formação | Histórias, perguntas/respostas, eventos com RSVP; trilhas de formação, desafios de N dias, badges | `docs/plano/09-fase-7-irmandade-e-formacao.md` | 5-6 | F5 | `/irmandade`, `/historias`, `/perguntas`, `/eventos`, `/formacao`, `/desafios` no ar; 8 trilhas (107 passos), 3 desafios de 30 dias e 20 insígnias (doc 09); `/eventos` com RSVP e lembrete; progresso e insígnias funcionando |
| F9 | Pai Indica Mídia | Classificação de filmes, séries, jogos, apps e livros por idade na visão do pai católico: selo oficial ClassInd + nota tripla (qualidade 0-10, moral -4..+4, idade do pai), 10 categorias em bolinhas 0-5, "Para conversar com seu filho", admin e validador | `docs/plano/14-fase-9-pai-indica-midia.md` | 2-3 | F2 | `/pai-indica/midia` e `/pai-indica/midia/$slug` no ar com filtro em 3 camadas e JSON-LD por tipo; `0017_pai_indica_midia.sql` e `0018_seed_midia.sql` (12 títulos reais) aplicadas; `/admin/midia`; validador aceita `media_reviews`; menu "Mídia" no Pai Indica |
| F8 | Automação, rotinas e painel | Rotina diária de artigos (Padrão A do Pai + Pai Indica), atualização de faixas de preço, auto-merge, sitemap/RSS, GA4, integração no Painel Lisieux | `docs/plano/10-fase-8-automacao-rotinas-e-painel.md` | 3-4 | F1-F7 | Rotina diária com as quantidades do doc 10 §2.2 rodando sem intervenção (1ª execução real abre PR `claude/rotina-*` mesclado sozinho — doc 10 §14 itens 10-11); auto-merge ativo; site aparece no Painel Lisieux; checklist de SEO/AdSense do doc 11 cumprido |

**Total estimado: 29-38 sessões de Sonnet 5.5.** Uma sessão = um bloco de trabalho de 1 a 3 horas,
sempre terminando em PR aberto e `PROGRESSO.md` atualizado.

---

## 4. Ordem de execução e regras de ouro

### 4.1 Ordem

```
F1 Fundação
 ├── F2 Pai Indica        (pode rodar em paralelo com F3 e F4)
 ├── F3 Loja do Pai
 └── F4 Caixa de Ferramentas
        └── F5 Área do Pai   (precisa de F3 e F4 para "salvar produto/ferramenta")
              ├── F6 Pai Indica Pai
              └── F7 Irmandade e Formação
                    └── F8 Automação, rotinas e painel
```

Dentro de cada fase, as etapas são sequenciais e numeradas no documento da fase e no
`docs/plano/13-checklist-de-execucao.md`. Não pular etapas.

### 4.2 As 12 regras de ouro

1. **Ler antes de fazer.** Toda sessão começa por `CLAUDE.md`, `PLANO-MESTRE.md`, o doc da fase e
   `docs/plano/PROGRESSO.md`. Nenhuma decisão de arquitetura é retomada: elas já estão tomadas.
2. **Nomes oficiais, sempre.** Seções, rotas, tabelas, colunas, arquivos de migration e tokens são
   exatamente os deste plano. Nunca "traduzir", "melhorar" ou abreviar.
3. **Uma branch `claude/*` por sessão, um PR contra `main`.** Nunca commitar direto no `main`.
4. **Validar antes de empurrar:** `npm run build && npm run lint && node scripts/validate-content.mjs`.
   PR só abre com os três verdes.
5. **Migration = arquivo + aplicação.** Todo `.sql` em `supabase/migrations/` é commitado **e**
   aplicado via `mcp__Supabase__apply_migration` no projeto `<SUPABASE_PROJECT_REF>`. Só commitar não
   muda nada no site.
6. **Nunca `DROP` nem `DELETE` em rotina.** Reforma de artigo via `_tmp_post_staging` + `UPDATE` curto.
   Artigo pedido pelo dono entra com `status='published'` e `publish_at=now()`.
7. **Botão de afiliado sempre "Comprar agora na Amazon".** Preço sempre em **faixa** (2 lojas,
   `price_max ≤ 3 × price_min`), nunca exato.
8. **Linha editorial católica de família tradicional** em texto e imagem. Em dúvida, não publica.
9. **Padrão A do Pai em todo artigo informativo:** semáforo ("Sinal verde / Sinal de atenção /
   Sinal de alerta"), ≥10 links internos para slugs existentes, tabela, checklist, "Continue lendo",
   FAQ e/ou quiz. Capa nunca repetida no corpo.
10. **Pai Indica tem nota.** Todo post com `kind` review/comparativo/lista precisa de `product_score`
    (ou `review.score`), `product_category` e `product_subcategory`. Sem isso, não aparece no filtro.
11. **Segurança por RLS, não por UI.** Toda tabela nova tem RLS ativa antes de receber dado. Admin é
    sempre `public.is_admin()`.
12. **Terminou uma etapa, atualiza `PROGRESSO.md` e commita.** Fase pela metade sem registro é fase
    perdida para a próxima sessão.

---

## 5. Como usar este plano com o Sonnet 5.5

### 5.1 Passo a passo de uma sessão normal

1. Abrir uma sessão do Claude Code **no repositório** `/home/user/vocacaodepai` (ou pelo GitHub
   `vocacaodepai/vocacaodepai` no Claude Code web).
2. Dizer, literalmente:

   > Execute a Fase N conforme docs/plano/<documento-da-fase>.md

   Exemplo: `Execute a Fase 1 conforme docs/plano/03-fase-1-fundacao.md`.
3. O Sonnet, por regra do `CLAUDE.md`, lê nesta ordem: `CLAUDE.md` → `PLANO-MESTRE.md` → o doc da
   fase → `docs/plano/PROGRESSO.md`. Identifica a primeira etapa com status `pendente` ou
   `em andamento` da fase pedida.
4. Cria a branch `claude/fase-N-<etapa-curta>` a partir de `main` atualizado.
5. Executa as etapas **em ordem**, uma por vez. Cada etapa do doc da fase tem: arquivos a criar ou
   alterar, comandos, SQL completo quando houver, e critério de aceite.
6. Ao fim de cada etapa: roda `npm run build && npm run lint && node scripts/validate-content.mjs`.
   Se houver migration, aplica via `mcp__Supabase__apply_migration`. Marca a caixa correspondente em
   `docs/plano/13-checklist-de-execucao.md` e a linha em `PROGRESSO.md` (status, data, observações).
   Commita.
7. Quando a sessão fechar um bloco coerente (ou a fase inteira), abre o PR contra `main` com título
   `Fase N — <etapas concluídas>` e descrição curta em PT-BR. Após o merge (auto-merge a partir da F8;
   antes, o dono mescla), confere o deploy na Vercel.
8. Reporta ao dono em PT-BR: o que foi feito, o que falta, pendências que só ele pode resolver.

### 5.2 Quando algo falhar

- **Build/lint quebrou:** corrigir na mesma sessão. Não abrir PR vermelho. Se não conseguir em 3
  tentativas, registrar em `PROGRESSO.md` (coluna Observações) o erro exato e o arquivo, commitar o
  que está verde e parar.
- **Migration falhou ao aplicar:** não reaplicar às cegas. Rodar `SELECT` para ver o estado (tabela
  existe? coluna existe?), corrigir o `.sql` de forma idempotente (`create table if not exists`,
  `add column if not exists`) e aplicar de novo.
- **Dado/chave que só o dono tem** (chave de API, ref do Supabase, domínio): registrar em
  `PROGRESSO.md` → "Pendências do dono", usar placeholder/fallback e seguir para a próxima etapa que
  não depende disso.
- **Conflito de merge:** rebase sobre `main`, resolver mantendo os nomes oficiais, revalidar.
- **Dúvida de produto que o plano não cobre:** escolher a opção mais simples e coerente com o
  Vocação de Mãe, registrar em `PROGRESSO.md` → "Decisões tomadas durante a execução", seguir.

### 5.3 Como retomar uma fase pela metade

Dizer: `Retome a Fase N conforme docs/plano/<doc>.md a partir de onde PROGRESSO.md parou`.
O Sonnet lê `PROGRESSO.md` e `13-checklist-de-execucao.md`, encontra a primeira etapa não concluída,
confere no código se ela de fato não foi feita (grep nos arquivos citados no doc da fase), e continua
dali. Se a branch anterior ainda existir sem PR, continua nela; se já tiver PR mesclado, abre branch nova.

### 5.4 Como pedir uma etapa isolada

Dizer: `Execute apenas a etapa N.M da Fase N conforme docs/plano/<doc>.md`.
O Sonnet confere que as dependências da etapa estão concluídas em `PROGRESSO.md`; se não estiverem,
avisa e para (não executa fora de ordem sem autorização explícita do dono).

### 5.5 Prompts úteis

| Objetivo | Prompt |
|---|---|
| Começar fase | `Execute a Fase 2 conforme docs/plano/04-fase-2-pai-indica-reviews.md` |
| Retomar | `Retome a Fase 5 conforme docs/plano/07-fase-5-area-do-pai-membros.md a partir de onde PROGRESSO.md parou` |
| Etapa isolada | `Execute apenas a etapa 3.4 da Fase 3 conforme docs/plano/05-fase-3-loja.md` |
| Artigo avulso | `Publique um artigo Padrão A do Pai sobre "<tema>" na categoria <slug>, seguindo o CLAUDE.md` |
| Review avulsa | `Publique um Pai Indica (review individual) do produto <nome/ASIN> conforme o CLAUDE.md` |
| Auditoria | `Compare docs/plano/13-checklist-de-execucao.md com o código e corrija PROGRESSO.md` |

---

## 6. Mapa dos documentos em `docs/plano/`

| Documento | Uma linha |
|---|---|
| `00-visao-posicionamento-e-marca.md` | Missão, público, tom de voz, nome das seções, identidade visual, slogans e o que o site nunca será |
| `01-referencias-e-benchmarks.md` | Sites de fora e de dentro (Art of Manliness, Fatherly, Wirecutter, RTINGS, Dad's Guide, blogs católicos) e o que copiar/evitar de cada um |
| `02-arquitetura-e-stack.md` | Stack, estrutura de pastas, as 7 migrations com SQL completo, RLS, variáveis de ambiente, padrões de código |
| `03-fase-1-fundacao.md` | Clonar VDM, limpar, tokens, Supabase, migrations, blog Padrão A do Pai, deploy |
| `04-fase-2-pai-indica-reviews.md` | Reviews individuais, comparativos, listas, nota 0-10, filtros, JSON-LD |
| `05-fase-3-loja.md` | Loja do Pai: categorias, produtos, faixa de preço, página de produto, admin |
| `06-fase-4-ferramentas.md` | Caixa de Ferramentas: conversor, mercado financeiro, calculadoras, cache |
| `07-fase-5-area-do-pai-membros.md` | Auth, perfil, filhos, salvos, painel, newsletter, planos |
| `08-fase-6-pai-indica-pai.md` | Vagas, indicações, Pai Profissional, mentoria, moderação, JobPosting |
| `09-fase-7-irmandade-e-formacao.md` | Histórias, perguntas, eventos, trilhas, desafios, badges |
| `10-fase-8-automacao-rotinas-e-painel.md` | Rotina diária, auto-merge, preços, sitemap/RSS, GA4, Painel Lisieux |
| `11-monetizacao-seo-e-crescimento.md` | AdSense, Amazon Associados, newsletter, SEO técnico, plano de crescimento e casal de sites |
| `12-backlog-de-conteudo.md` | 200+ títulos de artigos, reviews e comparativos por categoria, com prioridade |
| `13-checklist-de-execucao.md` | Checklist único de todas as etapas das fases (1-8 e 9), em caixas, na ordem exata |
| `14-fase-9-pai-indica-midia.md` | Pai Indica Mídia: `media_reviews`, selo ClassInd + nota tripla, bolinhas de conteúdo, páginas, admin, JSON-LD, validador e seed de 12 títulos |
| `PROGRESSO.md` | Tabela viva de status por fase/etapa, decisões tomadas e pendências do dono |
| `anexos/` | Pesquisas web da sessão de planejamento (`res-sites.md`, `res-ecossistema.md`, `res-tecnico.md`), só para consulta. Os inventários técnicos dos outros repositórios do grupo ficaram fora do repositório público e estão com o dono |

Na raiz: `PLANO-MESTRE.md` (este), `CLAUDE.md` (regras lidas por toda sessão), `README.md`
(apresentação pública).

---

## 7. Glossário de nomes oficiais

| Nome | Significado |
|---|---|
| **Vocação de Pai** | O site. Nunca "VDP site", "Vocação do Pai" ou "Vocação Pai" |
| **Blog** | Seção de artigos informativos e notícias (`/blog`) |
| **Padrão A do Pai** | Estrutura obrigatória do artigo informativo (semáforo, ≥10 links, tabela, checklist, Continue lendo, FAQ/quiz) |
| **Semáforo do Pai** | Três callouts: "Sinal verde: ", "Sinal de atenção: ", "Sinal de alerta: " |
| **Pai Indica** | Seção de reviews (individual, comparativo, lista) com nota 0-10 (`/pai-indica`) |
| **Review individual** | Post `kind='review'` com `review` JSON (5 critérios, `score`) |
| **Comparativo** | Post `kind='comparativo'` com `comparison` JSON e `product_score` do vencedor |
| **Lista** | Post `kind='lista'` ("Os 7 melhores…") com `product_score` do primeiro colocado |
| **Régua de nota** | Componente `ScoreScaleNote`: o que significam 6, 7, 8, 9, 10 |
| **Loja do Pai** | Vitrine de produtos afiliados (`/loja`). Slogan: "O pai também quer desconto" |
| **Faixa de preço** | `price_min`–`price_max` pesquisada em 2 lojas; `price_max ≤ 3×price_min`; nunca exato |
| **Caixa de Ferramentas** | Seção de utilidades (`/ferramentas`) |
| **Mercado do pai** | Painel diário de mercado financeiro (`/ferramentas/mercado-financeiro`) |
| **Área do Pai** | Área de membros (`/area-do-pai`, `/minha-conta`, `/entrar`, `/cadastro`) |
| **Pai Indica Pai** | Vagas, indicações, Pai Profissional e mentoria (`/pai-indica-pai`) |
| **Pai Profissional** | Diretório de profissionais membros (`professionals`) |
| **Irmandade** | Comunidade: histórias, perguntas, eventos (`/irmandade`) |
| **Formação** | Trilhas (`tracks`) e desafios (`challenges`) (`/formacao`, `/desafios`) |
| **Badge de pai presente** | Primeiro badge: concluir um desafio de 30 dias |
| **Rotina** | Claude Code Routine diária que publica artigos (Fase 8) |
| **Painel Lisieux** | Painel do grupo VDP (`grupovdp`) onde o site entra na Fase 8 |
| **Dono** | Bruno Danello, responsável pelo grupo VDP |

---

## 8. Sugestões extras e surpresas (21 ideias de alto impacto)

Coluna "Status": **especificada** = tem seção no doc da fase; **backlog pós-F8** = só executar quando
ganhar seção no doc da fase (não improvisar). O dono pode antecipar (escrevendo a seção no doc da fase)
ou cortar.

| # | Ideia | O que é | Entra na | Status |
|---|---|---|---|---|
| 1 | **"Mercado do pai" diário** | Painel em `/ferramentas/mercado-financeiro` com dólar, euro, Bitcoin, Ibovespa, Selic, IPCA e poupança, com leitura em 3 linhas "o que isso muda no seu bolso", cache em `market_cache` (TTL 15 min) e bloco "Mercado do pai hoje" na home | F4 (painel), F8 (bloco diário automático) | **especificada** (doc 06 §0.2, doc 10 §7) |
| 2 | **Pai Indica Pai com Google for Jobs** | Vagas aprovadas emitem JSON-LD `JobPosting` completo (título, empresa, local, remoto, salário, validade) para aparecer no Google Vagas; sitemap próprio de vagas | F6 | **especificada** (doc 08 §8) |
| 3 | **Trilha de consagração a São José** | Trilha de 33 dias em `tracks` (is_premium=false) com leitura diária, oração e exercício prático; badge "Filho de São José" ao concluir | F7 | **especificada** (doc 09 §5.2, trilha T4 `fe-do-pai-33-dias-com-sao-jose`) |
| 4 | **Calculadora de churrasco com lista de compras** | `/ferramentas/calculadora-de-churrasco`: adultos, crianças, duração → carne por corte, carvão, bebidas, acompanhamentos; gera lista de compras imprimível e botões de produtos da Loja do Pai | F4 (calculadora), F3 (links de produto) | **especificada** (doc 06 §0.2, slug `calculadora-de-churrasco`) |
| 5 | **Guia interativo de cortes de carne** | `/ferramentas/cortes-de-carne`: diagrama do boi clicável (SVG), por corte: preparo ideal, ponto, preço médio, artigos relacionados | F4 | **especificada** (doc 06 §0.2, slug `cortes-de-carne`) |
| 6 | **Newsletter por fase do filho** | `newsletter_subscribers.segments` por idade do filho mais novo (gestação, 0-1, 1-3, 3-6, 6-12, adolescente, adulto); e-mail semanal via Resend com artigos da fase | F5 (segmentos), F8 (envio automático) | **especificada** (doc 07 §3 e §6.6, doc 10 §8) |
| 7 | **Badge de pai presente** | Sistema de badges (`badges`/`user_badges`) com regras em JSON; primeiros badges: "Pai presente" (30 dias de desafio), "Leitor" (20 artigos salvos), "Irmão" (3 histórias aprovadas), "Provedor" (perfil Pai Profissional) | F7 | **especificada** (doc 09 §7, 20 insígnias) |
| 8 | **Pai Profissional** | Diretório público de profissionais membros com busca por profissão/cidade/UF e contato direto; cartão com badge do membro | F6 | **especificada** (doc 08 §3.5) |
| 9 | **Mentoria entre pais** | `/pai-indica-pai/mentoria`: pais experientes se oferecem por área (carreira, finanças, fé, filhos adolescentes); pedido de mentoria vira `mentorships` com aprovação do mentor | F6 | **especificada** (doc 08 §3.7) |
| 10 | **Eventos e retiros** | `/eventos` com encontros presenciais e online, RSVP, lembrete por e-mail; integração futura com paróquias e grupos de homens | F7 | **especificada** (doc 09 §8) |
| 11 | **Casal de sites com Vocação de Mãe** | Bloco "Para a mãe" nos artigos (link cruzado para o post irmão no Vocação de Mãe) e vice-versa; newsletter conjunta "Casal" | F8 (links cruzados automáticos) + F1 (componente) | componente: doc 03 §4.4/§6.2 (ver correção própria); links cruzados automáticos e newsletter conjunta: **backlog pós-F8** |
| 12 | **E-book do churrasco** | "O churrasco do pai" em PDF gerado a partir de 10 artigos + calculadora; isca de cadastro na Área do Pai | F5 (entrega ao cadastrar), conteúdo no doc 12 | **backlog pós-F8** |
| 13 | **Planner do pai** | PDF mensal imprimível (agenda da família, orçamento, metas de formação) baixável na Área do Pai; versão premium com personalização | F5 | **backlog pós-F8** |
| 14 | **Podcast "Vocação de Pai"** | Página `/podcast` com episódios (áudio hospedado fora) e transcrição; cada episódio vira artigo Padrão A | F8 (após rotina estável) | **backlog pós-F8** |
| 15 | **App PWA** | Manifest + service worker: ícone na tela inicial, ferramentas funcionando offline (calculadoras), push de novo artigo | F4 (manifest/calculadoras offline), F8 (push) | **backlog pós-F8** |
| 16 | **Check-up do Pai** | Questionário de onboarding nos eixos Presença, Provisão, Proteção, Fé e Corpo que "conhece" o pai e o encaminha para a trilha certa da Formação (doc 01 §4.2 #13; eixos no doc 00 §7) | F5 | **backlog pós-F8** |
| 17 | **15 minutos com seu filho** | Ferramenta com atividades de 15 minutos por idade do filho + trilha curta de uso diário (doc 01 §4.2 #12) | F4 (ferramenta), F7 (trilha) | **backlog pós-F8** |
| 18 | **1 produto, 3 orçamentos** | Série semanal de Pai Indica (`kind='comparativo'`) com o mesmo tipo de produto em três faixas de preço (doc 00 §3.7 `serie:1-produto-3-orcamentos`; doc 01 §4.2 #5) | F2 | **backlog pós-F8** |
| 19 | **Contador "Fim de semana de 940"** | Contador na Área do Pai dos fins de semana que restam até os 18 anos de cada filho cadastrado em `children`, ligado à série semanal (doc 00 §3.7 `serie:fim-de-semana-de-940`; doc 01 §4.2 #4) | F5 | **backlog pós-F8** |
| 20 | **Desafio "90 dias do Pai"** | Desafio longo de 90 dias em `challenges`/`challenge_days` (doc 00 §6; doc 01 §4.2 #15) — o doc 09 só especifica 3 desafios de 30 dias | F7 | **backlog pós-F8** |
| 21 | **Caderno do Pai e turmas (coortes)** | PDF pessoal do pai (doc 00 §6/§7) e turmas com data de início para as trilhas (doc 01 §4.1 #23) — doc 09 §5.1 diz "não há tabela nesta fase" | F7 | **backlog pós-F8** |

Outras ideias menores já incorporadas ao plano: busca com `tsvector` em português (F1), modo
escuro (F1), "Pergunte ao pai" (Q&A) com melhor resposta votada (F7), política de afiliados
pública (F1), tabela de comparação lado a lado com fotos oficiais (F2), checagem de faixa de preço
automática semanal (F8), página `/sobre` com a história do casal fundador (F1).

---

## 9. Riscos e como o plano os trata

| Risco | Mitigação |
|---|---|
| Sonnet "inventar" arquitetura | Todas as decisões fixas aqui e no `CLAUDE.md`; regra de ouro 1 e 2 |
| Fase pela metade e esquecida | `PROGRESSO.md` + `13-checklist-de-execucao.md` atualizados a cada etapa |
| Conteúdo fora da linha editorial | Seção de linha editorial no `CLAUDE.md`; `validate-content.mjs` checa termos proibidos e estrutura |
| Preço exato publicado (viola Amazon Associados) | Campo `price` nunca exibido; UI só mostra `price_min`–`price_max` |
| RLS esquecida | Toda migration já traz as policies; checklist exige teste com usuário anônimo |
| Dependência de chave externa | Fallbacks em todas as ferramentas (`market_cache` serve dado antigo com aviso) |
| Auto-merge mesclando PR quebrado | Auto-merge só é ligado na F8, depois que `validate-content.mjs` roda no CI |

---

## 10. Primeiros passos do dono (antes da Fase 1)

1. Criar o projeto Supabase (região `sa-east-1`) e anotar o `project_ref` → substituir
   `<SUPABASE_PROJECT_REF>` no `CLAUDE.md` e no `.env.example`.
2. Criar o projeto `vocacaodepai` na Vercel (time "Portal da AI") ligado ao repositório GitHub.
3. Apontar o domínio `vocacaodepai.com.br` para a Vercel.
4. Gerar as chaves listadas em `docs/plano/PROGRESSO.md` → "Pendências do dono".
5. Abrir a primeira sessão: `Execute a Fase 1 conforme docs/plano/03-fase-1-fundacao.md`.

Tudo o que não estiver pronto na hora, o Sonnet registra como pendência e segue com placeholder.

---

## 11. Formato dos dados que o Sonnet vai produzir (resumo)

Detalhe completo no `CLAUDE.md` e no doc da Fase 2. Aqui, o essencial para não errar o formato.

### 11.1 `posts.body` (Tiptap JSON)

```json
{ "type": "doc", "content": [
  { "type": "paragraph", "content": [ { "type": "text", "text": "..." } ] },
  { "type": "heading", "attrs": { "level": 2 }, "content": [ { "type": "text", "text": "..." } ] },
  { "type": "callout", "attrs": { "tone": "ok" }, "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "Sinal verde: ..." } ] } ] },
  { "type": "callout", "attrs": { "tone": "warn" }, "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "Sinal de atenção: ..." } ] } ] },
  { "type": "callout", "attrs": { "tone": "bad" }, "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "Sinal de alerta: ..." } ] } ] },
  { "type": "table", "content": [ { "type": "tableRow", "content": [ { "type": "tableHeader", "content": [] } ] } ] },
  { "type": "taskList", "content": [ { "type": "taskItem", "attrs": { "checked": false }, "content": [] } ] }
] }
```

### 11.2 `posts.review` (kind = review)

```json
{ "product_name": "...", "asin": "B0...", "affiliate_url": "https://www.amazon.com.br/dp/B0.../?tag=<PUBLIC_AMAZON_TAG>",
  "price_min": 189, "price_max": 249, "price_checked_at": "2026-10-24",
  "score": 8.4,
  "criteria": [ { "name": "Qualidade de construção", "score": 9 }, { "name": "Custo-benefício", "score": 8 },
                { "name": "Facilidade de uso", "score": 8.5 }, { "name": "Durabilidade", "score": 8 }, { "name": "Pós-venda", "score": 8.5 } ],
  "pros": ["..."], "cons": ["..."], "verdict": "...", "best_for": "..." }
```

### 11.3 `posts.comparison` (kind = comparativo ou lista)

```json
{ "winner_slug": "produto-a", "products": [
    { "slug": "produto-a", "name": "...", "asin": "...", "affiliate_url": "...", "image_url": "...",
      "price_min": 0, "price_max": 0, "score": 8.7, "specs": { "Potência": "1200 W" }, "pros": [], "cons": [], "best_for": "..." }
  ], "spec_columns": ["Potência", "Peso", "Garantia"], "method": "Fontes consultadas; sem teste físico." }
```

`product_score` da linha do post = `review.score` (review) ou nota do `winner_slug` (comparativo/lista).

### 11.4 Régua de nota (0-10, uma casa decimal)

| Faixa | Leitura |
|---|---|
| 9,0-10 | Excepcional: compra sem ressalva |
| 8,0-8,9 | Muito bom: melhor escolha na maioria dos casos |
| 7,0-7,9 | Bom: vale para um perfil específico |
| 6,0-6,9 | Regular: só se o preço compensar muito |
| < 6,0 | Não recomendado: o texto explica e indica alternativa |

Nota quebrada (ex.: 7,8) é proposital — diferencia dois produtos que em nota inteira pareceriam iguais.

---

## 12. Convenções de branch, commit, PR e relatório

| Item | Padrão |
|---|---|
| Branch | `claude/fase-N-<etapa-curta>` (ex.: `claude/fase-3-loja-admin-produtos`) |
| Commit | Imperativo, PT-BR, curto: `feat(loja): página de produto com faixa de preço` |
| Prefixos | `feat`, `fix`, `chore`, `db` (migration), `content` (artigo/produto), `docs` |
| PR | Título `Fase N — <etapas>`; corpo: o que foi feito, como validar, pendências |
| Relatório ao dono | 5 a 10 linhas em PT-BR: feito / validado / PR / falta / pendências do dono |

### Modelo de relatório de fim de sessão

```
Fase 3 — Loja do Pai: etapas 3.1 a 3.4 concluídas.
Feito: migration 0003 aplicada; /loja, /loja/categoria/$slug e /loja/$slug no ar; 10 categorias e 30 produtos seed.
Validado: build, lint e validate-content verdes; RLS testada com anônimo.
PR: #12 (claude/fase-3-loja-vitrine) aberto contra main.
Falta: 3.5 (admin de produtos) e 3.6 (checagem de faixa de preço).
Pendências do dono: PUBLIC_AMAZON_TAG ainda é placeholder no .env da Vercel.
```

---

## 13. O que o Sonnet NÃO deve fazer

- Não criar tabelas, rotas, seções ou tokens fora dos nomes oficiais.
- Não instalar bibliotecas de UI além de shadcn/Radix e Tailwind 4 sem registrar em "Decisões tomadas".
- Não reintroduzir i18n, Lovable, MCP routes ou conteúdo de maternidade do repositório de origem.
- Não exibir preço exato de produto em lugar nenhum.
- Não publicar artigo sem semáforo, sem ≥10 links internos válidos ou com capa repetida no corpo.
- Não usar imagem fora da cascata de licenças do `CLAUDE.md` nem imagem que contrarie a linha editorial.
- Não rodar `DROP`/`DELETE`/`TRUNCATE` em nenhuma rotina ou migration de dados.
- Não ligar o auto-merge antes da Fase 8.
- Não pedir ao dono decisão que já está tomada neste plano.
- Não encerrar sessão sem atualizar `PROGRESSO.md` e `13-checklist-de-execucao.md`.

---

*Vocação de Pai — "Formar o homem, firmar a família."*
