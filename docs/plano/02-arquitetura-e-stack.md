# 02 — Arquitetura e Stack — Vocação de Pai

> Documento de arquitetura do projeto **Vocação de Pai** (vocacaodepai.com.br).
> Escrito pelo Arquiteto-Chefe em 24/10/2026 a partir da leitura dos repositórios
> `/home/user/vocacaodemae` (base de código a clonar), `/home/user/portaldaai` (modelo "AI Indica" → "Pai Indica")
> e `/home/user/reviewprodutos` (padrão editorial de reviews), do inventário `inv-vocacaodemae.md` e da pesquisa `res-tecnico.md`.
> Todas as DECISÕES FIXAS do briefing estão incorporadas literalmente: nomes de seções, rotas, tabelas, arquivos de migration e tokens de design.
> Quem executa este documento é o Claude Code (Sonnet 5.5, esforço médio). Nada aqui é "a decidir".
>
> **Aviso importante sobre o VDM**: as tabelas-base do vocacaodemae (`posts`, `categories`, `profiles`, `products`, `stories`, `comments`…)
> **não** têm `CREATE TABLE` nas migrations — foram criadas pelo Lovable Cloud. A fonte confiável de colunas lá é
> `/home/user/vocacaodemae/src/integrations/supabase/types.ts`. Por isso o novo banco nasce **inteiro** nas 7 migrations abaixo.

---

## 1. Visão geral

### 1.1 Diagrama em texto

```
                           ┌────────────────────────────────────────────┐
                           │           vocacaodepai.com.br              │
                           │   Vercel (time "Portal da AI")             │
                           │   TanStack Start (SSR) + Nitro preset      │
                           │   "vercel" → .vercel/output/               │
                           └───────────────┬────────────────────────────┘
                                           │ HTTPS
       ┌───────────────────────────────────┼───────────────────────────────────┐
       │                                   │                                   │
┌──────▼───────┐                  ┌────────▼────────┐                 ┌────────▼────────┐
│  Navegador   │                  │  Server funcs   │                 │ Edge Functions  │
│  React 19    │  createServerFn  │  (src/lib/*.    │   service_role  │ (Deno, Supabase)│
│  TanStack    │ ───────────────► │   functions.ts) │ ──────────────► │ market-sync     │
│  Router/Query│                  │  Resend, OG,    │                 │ notify-contact  │
│  Tiptap (adm)│                  │  sitemap, RSS   │                 │ seo-search-cons.│
└──────┬───────┘                  └────────┬────────┘                 │ jobs-expire     │
       │ anon key + JWT (RLS)              │                          └────────┬────────┘
       │                                   │                                   │
       └───────────────┬───────────────────┘                                   │
                       │                                                       │
              ┌────────▼────────────────────────────────────────────────────────▼─────┐
              │  Supabase (projeto NOVO, região sa-east-1, ref <SUPABASE_PROJECT_REF>) │
              │  Postgres 15 + RLS + RPC (search_posts, get_home_data, ...)            │
              │  Auth (e-mail/senha + Google) · Storage (covers, products, avatars)    │
              │  Vault (RESEND_API_KEY, CRON_SECRET) · pg_cron (expire_jobs)           │
              │  7 migrations: 0001_core … 0007_ferramentas                            │
              └──────────────────────────────────────────────────────────────────────┘
                       ▲                                   ▲
                       │ Supabase MCP (apply_migration)    │ GitHub Actions (schedule)
              ┌────────┴────────┐                 ┌────────┴────────────────────────┐
              │ Claude Code     │                 │ .github/workflows               │
              │ (Sonnet 5.5)    │                 │  rotina.yml (artigos diários)   │
              │ branch claude/* │ ──── PR ──────► │  market-sync.yml (*/30 min)     │
              └─────────────────┘                 │  auto-merge.yml (claude/*)      │
                                                  │  validate-content.yml           │
                       │                          └─────────────────────────────────┘
              ┌────────▼────────┐    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
              │ Painel Lisieux  │    │ GA4          │   │ Search Cons. │   │ AdSense /    │
              │ (grupovdp)      │◄───│ + Vercel     │   │ (edge fn)    │   │ Amazon Assoc.│
              └─────────────────┘    │   Analytics  │   └──────────────┘   └──────────────┘
                                     └──────────────┘
   Fontes externas de mercado (sem chamadas a partir do navegador):
   BCB SGS/PTAX (sem chave: Selic, IPCA, CDI, dólar PTAX) · AwesomeAPI (token grátis: USD/EUR/GBP/ARS/BTC) ·
   Brapi (15k req/mês: Ibovespa, ações) · CoinGecko (BTC/ETH em BRL)
```

### 1.2 Princípios de arquitetura (decididos)

1. **Um só repositório** (`vocacaodepai/vocacaodepai`), um só app TanStack Start, SSR na Vercel. Sem monorepo.
2. **Supabase é a única fonte de dados** (conteúdo, loja, membros, comunidade, cache de mercado). Nenhum conteúdo em arquivos TS como no Portal da AI: tudo vai para `posts`/`products` via migrations ou admin.
3. **RLS em todas as tabelas**, sem exceção. Leitura pública só de linhas publicadas/aprovadas/ativas. Escrita de staff via `is_admin()` (baseada em `profiles.role`). Tabelas internas (`seo_search_stats`, `tool_usage`, `moderation_log`, `_tmp_post_staging`, `post_view_events`) só pela `service_role` ou RPC `security definer`.
4. **Conteúdo editorial em JSON Tiptap** (`posts.body jsonb`), mesmo formato do Vocação de Mãe (inclusive os nodes customizados `callout`, `fotosModelos`, `buyCard`, `galeriaProduto`, `decisorRapido`, `toolEmbed`), para reaproveitar editor, renderizador (`tiptap-html.ts`) e a rotina automática de artigos.
5. **Reviews são posts** com `kind` (`review`, `comparativo`, `lista`) e campos estruturados `review jsonb` / `comparison jsonb`, exatamente como o "AI Indica" do Portal da AI, mas no banco.
6. **Loja = produtos com afiliado Amazon** (botão sempre "Comprar agora na Amazon"; faixa de preço, nunca preço exato).
7. **Ferramentas de mercado** (conversor de moedas, mercado financeiro) leem de `market_cache` abastecida pela edge function `market-sync`, acionada por **GitHub Actions schedule a cada 30 min** (Vercel Cron no plano Hobby só permite 1x/dia), com fallback pg_cron diário. Nunca chamam API externa a partir do navegador.
8. **Automação diária** (GitHub Actions + Claude Code Routine) gera artigos, reviews e produtos novos em branch `claude/*` com PR auto-mesclável, igual ao Vocação de Mãe.
9. **Assinatura paga futura via Mercado Pago** (Pix, boleto, cartão nacional, sem exigir CNPJ internacional); `plans`/`subscriptions` já modelados com `provider = 'mercadopago'`.

### 1.3 Seções oficiais e rotas (copiadas das DECISÕES FIXAS)

| Seção | Rotas | O que é |
|---|---|---|
| **Blog** | `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca` | Artigos sobre paternidade, casamento, finanças da família, saúde do homem, churrasco e cortes de carne, carro, casa, fé. É o coração de SEO/AdSense. Lista paginada, filtros por categoria, busca full-text (`search_posts`). Posts têm FAQ e quiz opcionais, semáforo do pai nos callouts e autor com byline. |
| **Pai Indica** | `/pai-indica`, `/pai-indica/$slug` | Reviews de produtos para o pai e a família: **individual** (`kind='review'`, nota 0-10 com 5 critérios), **comparativo** (`kind='comparativo'`, tabela de produtos e vencedor por perfil) e **lista** (`kind='lista'`, "os 7 melhores…"). Mesma tabela `posts`; a listagem filtra por `kind` e por `product_category`/`product_subcategory`. Badge de nota, nota de escala e disclosure de afiliado em toda página. |
| **Loja do Pai** | `/loja`, `/loja/categoria/$slug`, `/loja/$slug` | Slogan **"O pai também quer desconto"**. Catálogo de `products` com afiliado Amazon Associados BR, faixa de preço pesquisada (2 lojas, max ≤ 3×min), review longa por produto, prós/contras, categorias próprias (`product_categories`). Página de produto linka para os posts de Pai Indica que citam o produto. |
| **Caixa de Ferramentas** | `/ferramentas`, `/ferramentas/$slug`; destaques `/ferramentas/conversor-de-moedas` e `/ferramentas/mercado-financeiro` | Calculadoras e utilitários: conversor de moedas (BRL/USD/EUR/GBP/ARS/BTC), painel do mercado financeiro (dólar PTAX, euro, Ibovespa, Selic, IPCA, CDI, bitcoin), calculadora de churrasco, custo de um filho, simulador de reserva de emergência, orçamento familiar, juros compostos, checklist do enxoval do pai. Cada ferramenta registra uso em `tool_usage`. |
| **Área do Pai** | `/area-do-pai` (painel), `/minha-conta`, `/entrar`, `/cadastro` | Membros. Painel com progresso nas trilhas, desafios ativos, itens salvos, badges, filhos cadastrados (`children`) e vagas que o pai indicou. Plano gratuito no lançamento; `plans`/`subscriptions` prontos para plano pago (Mercado Pago). |
| **Pai Indica Pai** | `/pai-indica-pai`, `/pai-indica-pai/vagas`, `/pai-indica-pai/vagas/$slug`, `/pai-indica-pai/vagas/nova`, `/pai-indica-pai/profissionais`, `/pai-indica-pai/mentoria` | Rede de indicação entre pais: vagas de trabalho (`jobs`, com moderação e expiração), indicações a uma vaga (`job_referrals`), diretório de profissionais pais (`professionals`: "o pai eletricista", "o pai contador") e mentoria entre pais (`mentorships`). Tudo passa por `status` e moderação no admin. |
| **Irmandade** | `/irmandade`, `/historias`, `/historias/$id`, `/historias/nova`, `/perguntas`, `/perguntas/$slug`, `/eventos` | Comunidade: histórias de pais (`stories`, herdado do VDM), perguntas e respostas (`questions`/`answers`, estilo fórum moderado), eventos presenciais/online (`events`/`event_rsvps`: encontro de pais, retiro, live). `/irmandade` é o hub que resume as três. |
| **Formação** | `/formacao`, `/formacao/$slug`, `/desafios`, `/desafios/$slug` | Trilhas de formação do homem e do pai (`tracks`/`track_steps`, progresso em `track_progress`) e desafios de N dias (`challenges`/`challenge_days`, progresso em `challenge_progress`, ex.: "30 dias de presença", "21 dias de oração em família"). Concluir rende `badges`. |
| **Institucional** | `/sobre`, `/contato`, `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-afiliados` | Páginas obrigatórias para AdSense e Amazon Associados. Contato grava em `contact_messages` e dispara e-mail via Resend. |
| **Admin** | `/admin` (+ `/admin/editor`, `/admin/editor/$id`, `/admin/produtos`, `/admin/moderacao`, `/admin/formacao`, `/admin/eventos`, `/admin/login`) | Editor Tiptap, produtos, moderação de vagas/indicações/histórias/perguntas/comentários, logs de moderação (`moderation_log`). Acesso só para `profiles.role in ('admin','editor')`. |

---

## 2. Stack com versões exatas

### 2.1 Versões herdadas do `package.json` do vocacaodemae (manter iguais no clone)

| Pacote | Versão | Função |
|---|---|---|
| `react` / `react-dom` | `^19.2.0` | UI |
| `@tanstack/react-start` | `^1.168.60` | Framework SSR (server functions, rotas file-based) |
| `@tanstack/react-router` | `^1.170.32` | Roteamento |
| `@tanstack/router-plugin` | `^1.168.35` | Geração de `routeTree.gen.ts` |
| `@tanstack/react-query` | `^5.101.1` | Cache de dados no cliente |
| `vite` | `8.1.5` (fixo) | Bundler |
| `nitro` | `3.0.260603-beta` (fixo) | Servidor/adaptador Vercel |
| `rolldown` (override) | `1.2.1` | Override obrigatório (igual ao VDM) |
| `typescript` | `^5.8.3` | Tipos |
| `tailwindcss` / `@tailwindcss/vite` | `^4.2.1` | Tailwind 4 (config no CSS via `@theme`) |
| `@tailwindcss/typography` | `^0.5.20` | Prose dos artigos |
| `tw-animate-css` | `^1.3.4` | Animações utilitárias |
| `@radix-ui/react-*` | accordion 1.2.12, alert-dialog 1.1.15, aspect-ratio 1.1.8, avatar 1.1.11, checkbox 1.3.3, collapsible 1.1.12, context-menu 2.2.16, dialog 1.1.15, dropdown-menu 2.1.16, hover-card 1.1.15, label 2.1.8, menubar 1.1.16, navigation-menu 1.2.14, popover 1.1.15, progress 1.1.8, radio-group 1.3.8, scroll-area 1.2.10, select 2.2.6, separator 1.1.8, slider 1.3.6, slot 1.2.4, switch 1.2.6, tabs 1.1.13, toast 1.2.23, toggle 1.1.10, toggle-group 1.1.11, tooltip 1.2.8 | Primitivos do shadcn |
| `class-variance-authority` `^0.7.1`, `clsx` `^2.1.1`, `tailwind-merge` `^3.5.0` | | shadcn utils |
| `lucide-react` | `^0.575.0` | Ícones |
| `cmdk` `^1.1.1`, `vaul` `^1.1.2`, `sonner` `^2.0.7`, `input-otp` `^1.4.2`, `embla-carousel-react` `^8.6.0`, `react-resizable-panels` `^4.6.5`, `react-day-picker` `^9.14.0` | | Componentes shadcn |
| `next-themes` | `^0.4.6` | Modo escuro (`class="dark"`) |
| `framer-motion` | `^13.1.1` | Animações da home |
| `@supabase/supabase-js` | `^2.112.4` | Cliente Supabase |
| `@tiptap/core`, `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`, `@tiptap/extension-{image,link,placeholder,table,table-cell,table-header,table-row,task-item,task-list}` | `^3.30.2` | Editor e render do body |
| `react-hook-form` `^7.71.2` + `@hookform/resolvers` `^5.2.2` | | Formulários |
| `zod` | `^4.4.3` | Validação (já existe; usar em TODOS os server functions e no `validate-content.mjs`) |
| `recharts` | `^2.15.4` | Gráficos (já existe; usar no mercado financeiro e no admin) |
| `date-fns` | `^4.1.0` | Datas (locale `ptBR`) |
| `vite-tsconfig-paths` | `^6.0.2` | Alias `@/` |
| dev: `eslint` `^9.32.0`, `typescript-eslint` `^8.56.1`, `eslint-plugin-react-hooks` `^5.2.0`, `eslint-plugin-react-refresh` `^0.4.20`, `eslint-config-prettier` `^10.1.1`, `eslint-plugin-prettier` `^5.2.6`, `prettier` `^3.7.3`, `globals` `^15.15.0`, `@vitejs/plugin-react` `^5.2.0`, `@types/node` `^22.16.5`, `@types/react` `^19.2.0`, `@types/react-dom` `^19.2.0` | | Lint/format |
| `@lovable.dev/vite-tanstack-config` | `^2.15.0` | **MANTER** na Fase 1 (o `vite.config.ts` do VDM depende dele e ele já inclui tanstackStart, viteReact, tailwind, tsconfigPaths, nitro). Substituir por config manual na Fase 8 é opcional. |

Scripts do `package.json` (iguais ao VDM, mais os novos):

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit",
    "validate:content": "node scripts/validate-content.mjs",
    "types:supabase": "supabase gen types typescript --project-id $SUPABASE_PROJECT_REF > src/integrations/supabase/types.ts"
  }
}
```

### 2.2 O que REMOVER do clone (Fase 1, primeiro commit)

| Item | Caminho no VDM | Ação |
|---|---|---|
| Pacote MCP da Lovable | `@lovable.dev/mcp-js` em `dependencies` | `npm uninstall @lovable.dev/mcp-js` |
| Plugin MCP no Vite | `vite.config.ts` → `import mcpPlugin …` e `plugins: [mcpPlugin(...)]` | Remover import e o array `plugins` |
| Rotas MCP/Lovable | `src/routes/[.mcp]/**`, `src/routes/mcp.ts`, `src/routes/[.]lovable.oauth.consent.tsx`, `src/routes/[.well-known]/oauth-protected-resource.ts` | `git rm -r` |
| Lib MCP | `src/lib/mcp/**`, `src/lib/lovable-error-reporting.ts` | `git rm -r`; remover referências em `src/server.ts` e `__root.tsx` |
| i18n | `i18next`, `i18next-browser-languagedetector`, `i18next-http-backend`, `react-i18next`; `src/i18n/**`; `public/locales/**`; qualquer `useTranslation` | `npm uninstall …`; substituir `t("…")` por strings PT-BR literais |
| Conteúdo de maternidade | migrations `supabase/migrations/2026*` (todas: são dados do VDM), rotas `src/routes/_site/ferramentas/{calendario-de-vacinacao,ciclo-do-sono,data-probavel-do-parto,engasgo-primeiros-socorros,enxoval-do-bebe,gestacao-semana-a-semana,marcos-do-desenvolvimento,nomes-de-bebes,saltos-de-desenvolvimento,tamanho-do-bebe}.tsx`, `src/lib/tools/**` (lógica das calculadoras de bebê), `src/lib/story-categories.ts`, campos `mother_signature`, `enxoval_done`, textos "mãe/maternidade" em `src/components/home/**`, `src/lib/site.ts`, `public/*.png` (logos) | Apagar e recriar. As migrations NÃO são copiadas: o novo banco nasce com `0001_core.sql … 0007_ferramentas.sql`. |
| Config Supabase antiga | `supabase/config.toml` (`project_id = "<REF_SUPABASE_DO_VOCACAODEMAE>"`) | Trocar para `project_id = "<SUPABASE_PROJECT_REF>"` |
| Credenciais hardcoded | `src/integrations/supabase/client.ts` (URL/anon key do VDM) | Ler só de `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Fontes do VDM | `Fraunces`, `Nunito Sans` em `src/styles.css` e `__root.tsx` | Trocar por `Barlow Condensed` + `Inter` |
| Edge function `stock-photos` | `supabase/functions/stock-photos` | Manter (serve para buscar capas Pexels/Wikimedia) — adaptar queries de busca para temas masculinos/paternidade |

### 2.3 O que ADICIONAR

| Pacote | Versão | Para quê |
|---|---|---|
| `resend` | `^4.0.1` | Newsletter, contato, notificação de moderação (via server function; chave na Vercel e no Vault) |
| `@vercel/analytics` | `^1.4.1` | Web Analytics da Vercel (`<Analytics />` no `__root.tsx`) |
| `@vercel/og` | `^0.6.5` | **OG image dinâmica** em `src/routes/api/og.ts` (usa Satori + resvg internamente; evita instalar `satori`/`@resvg/resvg-js` separados). Fallback: se o preset Nitro Vercel reclamar de wasm, usar `satori@^0.12.1` + `@resvg/resvg-js@^2.6.2` com runtime Node. |
| `feed` | `^4.2.2` | Geração do RSS (`/rss.xml`) |
| `isomorphic-dompurify` | `^2.20.0` | Sanitizar HTML de respostas/perguntas/histórias enviadas por membros |
| `@supabase/ssr` | `^0.6.1` | Cookies de sessão no SSR (substitui `previewAuthStorage.ts` do VDM) |
| `jose` | `^5.9.6` | Validar JWT/secret nas rotas `api/cron/*` e no `hub` do Painel Lisieux |
| dev: `tsx` `^4.19.2` | | Rodar scripts `.mjs/.ts` da rotina |

Não adicionar agora: Next.js, Prisma, tRPC, Stripe (assinatura paga virá com **Mercado Pago** em fase futura), i18n, CMS externo. `recharts` já existe — não instalar outra lib de gráficos. `slugify` já existe em `src/lib/slugify.ts`.

---

## 3. Árvore completa do novo repositório

Legenda: `[COPIAR de vocacaodemae:<path>]` = copiar e só trocar textos/imports; `[ADAPTAR]` = copiar e mudar lógica/campos; `[NOVO]` = criar do zero.

```
vocacaodepai/
├── .github/
│   └── workflows/
│       ├── auto-merge.yml                      [COPIAR de vocacaodemae:.github/workflows/auto-merge.yml]
│       ├── rotina.yml                          [ADAPTAR] (cron diário 09:00 BRT; chama scripts/rotina/*.mjs; abre PR claude/rotina-AAAA-MM-DD)
│       ├── market-sync.yml                     [NOVO] (schedule "*/30 * * * *"; curl POST na edge function market-sync com CRON_SECRET)
│       └── validate-content.yml                [NOVO] (roda npm run validate:content em todo PR que toque supabase/migrations)
├── .env.example                                [NOVO] (ver seção 8)
├── .gitignore                                  [COPIAR de vocacaodemae:.gitignore]
├── CLAUDE.md                                   [ADAPTAR de vocacaodemae:CLAUDE.md] (regras do projeto; ver doc 13)
├── README.md                                   [NOVO]
├── PLANO-MESTRE.md                             [NOVO]
├── docs/plano/*.md                             [NOVO] (00…13 + PROGRESSO.md)
├── eslint.config.js                            [COPIAR de vocacaodemae:eslint.config.js]
├── index.html                                  [ADAPTAR] (lang="pt-BR", título, fontes Google)
├── package.json                                [ADAPTAR] (seção 2)
├── tsconfig.json                               [COPIAR de vocacaodemae:tsconfig.json]
├── vite.config.ts                              [ADAPTAR] (remover mcpPlugin; manter nitro.preset "vercel" e server.entry "server")
├── vercel.json                                 [NOVO] (headers de cache para /api/img, redirects www→apex, 1 cron diário /api/cron/jobs-expire)
├── public/
│   ├── ads.txt                                 [NOVO] (google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0)
│   ├── robots.txt                              [NOVO]
│   ├── favicon.svg, favicon.ico, apple-touch-icon.png, logo.svg, logo-dark.svg, og-default.png  [NOVO]
│   └── manifest.webmanifest                    [NOVO]
├── scripts/
│   ├── validate-content.mjs                    [NOVO] (valida migrations de posts/products: slug único, kind válido, review/comparison com schema zod, faixa de preço, botão de afiliado, semáforo, sem termos proibidos, sem preço exato)
│   └── rotina/
│       ├── README.md                           [ADAPTAR de vocacaodemae:scripts/rotina/README.md]
│       ├── gerar-artigo.mjs                    [ADAPTAR] (Padrão A: artigo do blog)
│       ├── gerar-review.mjs                    [NOVO] (Padrão B: review individual)
│       ├── gerar-comparativo.mjs               [NOVO] (Padrão C: comparativo)
│       ├── gerar-lista.mjs                     [NOVO] (Padrão D: lista "os N melhores")
│       ├── gerar-produtos.mjs                  [ADAPTAR] (5 produtos/dia com faixa de preço)
│       ├── pesquisar-faixa-de-preco.mjs        [ADAPTAR de vocacaodemae: lógica em src/lib/price-range.ts]
│       ├── buscar-capa.mjs                     [ADAPTAR] (Pexels/Wikimedia via edge function stock-photos)
│       └── staging.mjs                         [NOVO] (escreve em _tmp_post_staging antes de promover para posts)
├── supabase/
│   ├── config.toml                             [ADAPTAR] (project_id = "<SUPABASE_PROJECT_REF>")
│   ├── migrations/
│   │   ├── 0001_core.sql                       [NOVO] (seção 4.1)
│   │   ├── 0002_blog.sql                       [NOVO] (seção 4.2)
│   │   ├── 0003_loja.sql                       [NOVO] (seção 4.3)
│   │   ├── 0004_membros.sql                    [NOVO] (seção 4.4)
│   │   ├── 0005_pai_indica_pai.sql             [NOVO] (seção 4.5)
│   │   ├── 0006_irmandade_formacao.sql         [NOVO] (seção 4.6)
│   │   ├── 0007_ferramentas.sql                [NOVO] (seção 4.7)
│   │   └── 2026MMDDHHMMSS_<descricao>.sql      [NOVO, rotina] (conteúdo: posts/products; nunca schema)
│   └── functions/
│       ├── notify-contact-message/index.ts     [COPIAR de vocacaodemae:supabase/functions/notify-contact-message]
│       ├── seo-search-console/index.ts         [COPIAR de vocacaodemae:supabase/functions/seo-search-console]
│       ├── stock-photos/index.ts               [ADAPTAR de vocacaodemae:supabase/functions/stock-photos]
│       ├── market-sync/index.ts                [NOVO] (BCB SGS/PTAX sem chave; AwesomeAPI com token; Brapi; CoinGecko → market_cache)
│       ├── jobs-expire/index.ts                [NOVO] (chama public.expire_jobs())
│       └── newsletter-send/index.ts            [NOVO] (resumo semanal via Resend)
└── src/
    ├── server.ts                               [ADAPTAR de vocacaodemae:src/server.ts] (remover lovable-error-reporting)
    ├── router.tsx                              [COPIAR de vocacaodemae:src/router.tsx]
    ├── routeTree.gen.ts                        (gerado)
    ├── styles.css                              [ADAPTAR] (tokens da seção 6)
    ├── integrations/supabase/
    │   ├── client.ts                           [ADAPTAR] (env vars novas)
    │   ├── client.server.ts                    [COPIAR de vocacaodemae:src/integrations/supabase/client.server.ts]
    │   ├── auth-attacher.ts                    [COPIAR de vocacaodemae:src/integrations/supabase/auth-attacher.ts]
    │   ├── auth-middleware.ts                  [COPIAR de vocacaodemae:src/integrations/supabase/auth-middleware.ts]
    │   ├── cron-auth.ts                        [COPIAR de vocacaodemae:src/integrations/supabase/cron-auth.ts]
    │   ├── previewAuthStorage.ts               [ADAPTAR] → renomear sessionStorage.ts (cookies via @supabase/ssr)
    │   └── types.ts                            [NOVO, gerado] (npm run types:supabase após 0007)
    ├── lib/
    │   ├── site.ts                             [ADAPTAR] (nome, domínio, slogan, redes, autor)
    │   ├── seo.ts / seo.functions.ts           [ADAPTAR] (JSON-LD por tipo, seção 7)
    │   ├── db.ts                               [COPIAR de vocacaodemae:src/lib/db.ts]
    │   ├── queries.ts                          [ADAPTAR] (novas tabelas e RPCs)
    │   ├── content.ts                          [ADAPTAR] (helpers de posts + kind)
    │   ├── tiptap-html.ts                      [ADAPTAR de vocacaodemae:src/lib/tiptap-html.ts] (callout → SemaforoCallout; manter fotosModelos/buyCard/galeriaProduto/decisorRapido/toolEmbed; novos reviewBox/comparisonTable)
    │   ├── review-body.ts                      [ADAPTAR de vocacaodemae:src/lib/review-body.ts]
    │   ├── review-schema.ts                    [NOVO] (zod: ReviewData, ComparisonData, seção 5)
    │   ├── price-range.ts                      [COPIAR de vocacaodemae:src/lib/price-range.ts]
    │   ├── cover.ts, image.ts, media.functions.ts  [COPIAR de vocacaodemae]
    │   ├── slugify.ts, utils.ts, rank.ts, anon-id.ts  [COPIAR de vocacaodemae]
    │   ├── auth.ts, auth-context.ts, auth-ui.tsx   [ADAPTAR] (rotas /entrar, /cadastro, onboarding)
    │   ├── adsense.ts, ga4.ts                  [COPIAR de vocacaodemae] (trocar IDs por env)
    │   ├── admin-meta.ts                       [COPIAR de vocacaodemae:src/lib/admin-meta.ts]
    │   ├── error-capture.ts, error-page.ts, router-compat.tsx  [COPIAR de vocacaodemae]
    │   ├── stories-read.ts                     [ADAPTAR de vocacaodemae:src/lib/stories-read.ts]
    │   ├── ecosystem.ts                        [ADAPTAR] (links do grupo VDP: vocacaodemae, portaldaai, reviewprodutos)
    │   ├── hub.functions.ts                    [COPIAR de vocacaodemae:src/lib/hub.functions.ts] (métricas para o Painel Lisieux)
    │   ├── email.functions.ts                  [NOVO] (Resend: contato, newsletter, moderação)
    │   ├── og.functions.ts                     [NOVO]
    │   ├── market.functions.ts                 [NOVO] (lê market_cache; conversor)
    │   ├── jobs.functions.ts                   [NOVO] (criar vaga, indicar, moderar)
    │   ├── community.functions.ts              [NOVO] (perguntas, respostas, eventos, RSVP)
    │   ├── tracks.functions.ts                 [NOVO] (progresso em trilhas e desafios, badges)
    │   ├── members.functions.ts                [NOVO] (perfil, filhos, saved_items, onboarding)
    │   └── tools/
    │       ├── index.ts                        [NOVO] (registro das ferramentas: slug, título, componente, descrição, JSON-LD)
    │       ├── conversor-de-moedas.ts          [NOVO]
    │       ├── mercado-financeiro.ts           [NOVO]
    │       ├── calculadora-de-churrasco.ts     [NOVO]
    │       ├── custo-de-um-filho.ts            [NOVO]
    │       ├── reserva-de-emergencia.ts        [NOVO]
    │       ├── orcamento-familiar.ts           [NOVO]
    │       ├── juros-compostos.ts              [NOVO]
    │       └── enxoval-do-pai.ts               [NOVO]
    ├── components/
    │   ├── ui/*                                [COPIAR de vocacaodemae:src/components/ui/*] (shadcn completo, sem alterar)
    │   ├── layout/
    │   │   ├── SiteHeader.tsx                  [ADAPTAR] (menu: Blog · Pai Indica · Loja do Pai · Ferramentas · Pai Indica Pai · Irmandade · Formação · Área do Pai)
    │   │   ├── SiteFooter.tsx                  [ADAPTAR] (institucional, afiliados, grupo VDP)
    │   │   ├── MobileNav.tsx                   [ADAPTAR]
    │   │   ├── ThemeToggle.tsx                 [COPIAR de vocacaodemae]
    │   │   ├── SectionHeader.tsx               [NOVO]
    │   │   ├── Breadcrumbs.tsx                 [COPIAR de vocacaodemae]
    │   │   └── AdSlot.tsx                      [COPIAR de vocacaodemae]
    │   ├── blog/
    │   │   ├── PostCard.tsx, PostGrid.tsx, PostBody.tsx, PostHeader.tsx, PostFaq.tsx, PostQuiz.tsx, PostComments.tsx, PostReactions.tsx, RelatedPosts.tsx, CategoryPills.tsx, SearchBox.tsx  [ADAPTAR de vocacaodemae:src/components/blog/*]
    │   │   ├── SemaforoCallout.tsx             [ADAPTAR] (callout tone ok/warn/bad → "Sinal verde / Sinal de atenção / Sinal de alerta")
    │   │   └── AuthorByline.tsx                [ADAPTAR]
    │   ├── home/
    │   │   ├── Hero.tsx, LatestPosts.tsx, FeaturedReviews.tsx, StoreHighlights.tsx, ToolsStrip.tsx, JobsStrip.tsx, CommunityStrip.tsx, NewsletterCta.tsx, MarketTicker.tsx  [ADAPTAR/NOVO]
    │   ├── store/
    │   │   ├── ProductCard.tsx, ProductGrid.tsx, ProductFilters.tsx, ProductReviewLong.tsx, ProsCons.tsx  [ADAPTAR de vocacaodemae:src/components/store/*]
    │   │   ├── PriceRange.tsx                  [ADAPTAR de vocacaodemae]
    │   │   ├── AffiliateButton.tsx             [NOVO] ("Comprar agora na Amazon", rel="sponsored nofollow noopener", target _blank, evento GA4 `affiliate_click`)
    │   │   └── AffiliateDisclosure.tsx         [NOVO]
    │   ├── pai-indica/
    │   │   ├── ReviewBadge.tsx                 [NOVO] (nota 0-10 com cor por faixa)
    │   │   ├── ScoreScaleNote.tsx              [NOVO] (explica a escala)
    │   │   ├── ReviewCriteria.tsx              [NOVO] (5 critérios com barra)
    │   │   ├── ReviewVerdict.tsx               [NOVO]
    │   │   ├── ComparisonTable.tsx             [NOVO]
    │   │   ├── WinnerByProfile.tsx             [NOVO]
    │   │   ├── ListRanking.tsx                 [NOVO]
    │   │   ├── KindBadge.tsx                   [NOVO] (Review / Comparativo / Lista)
    │   │   └── PaiIndicaFilters.tsx            [NOVO] (kind + product_category + product_subcategory)
    │   ├── tools/
    │   │   ├── ToolShell.tsx                   [ADAPTAR de vocacaodemae:src/components/tools/*]
    │   │   ├── CurrencyConverter.tsx           [NOVO]
    │   │   ├── MarketDashboard.tsx             [NOVO] (recharts; dados de market_cache)
    │   │   ├── ChurrascoCalculator.tsx, ChildCostCalculator.tsx, EmergencyFundSimulator.tsx, FamilyBudget.tsx, CompoundInterest.tsx, DadChecklist.tsx  [NOVO]
    │   ├── members/
    │   │   ├── DashboardCards.tsx, ProfileForm.tsx, ChildrenForm.tsx, SavedItems.tsx, BadgesWall.tsx, OnboardingWizard.tsx, AuthForm.tsx  [NOVO/ADAPTAR de vocacaodemae:src/lib/auth-ui.tsx]
    │   ├── jobs/
    │   │   ├── JobCard.tsx, JobList.tsx, JobFilters.tsx, JobForm.tsx, ReferralForm.tsx, ProfessionalCard.tsx, MentorshipCard.tsx  [NOVO]
    │   ├── community/
    │   │   ├── StoryCard.tsx, StoryForm.tsx    [ADAPTAR de vocacaodemae:src/components/stories/*]
    │   │   ├── QuestionCard.tsx, QuestionForm.tsx, AnswerList.tsx, AnswerForm.tsx, EventCard.tsx, RsvpButton.tsx  [NOVO]
    │   └── tracks/
    │       ├── TrackCard.tsx, TrackSteps.tsx, StepContent.tsx, ChallengeCard.tsx, ChallengeDayList.tsx, ProgressRing.tsx  [NOVO]
    ├── admin/
    │   ├── AdminLayout.tsx                     [ADAPTAR de vocacaodemae:src/routes/_admin.tsx]
    │   ├── PostEditor.tsx (Tiptap)             [ADAPTAR de vocacaodemae:src/routes/_admin/admin/editor/$id.tsx]
    │   ├── ReviewFields.tsx                    [NOVO] (form de review/comparison jsonb)
    │   ├── ProductsTable.tsx, ProductForm.tsx  [ADAPTAR]
    │   ├── ModerationQueue.tsx                 [NOVO] (jobs, job_referrals, professionals, mentorships, stories, questions, answers, comments)
    │   ├── TracksEditor.tsx, ChallengesEditor.tsx, EventsEditor.tsx  [NOVO]
    │   └── StatsPanel.tsx                      [ADAPTAR] (views, seo_search_stats, tool_usage)
    └── routes/
        ├── __root.tsx                          [ADAPTAR] (fontes, Analytics, GA4, AdSense, theme)
        ├── _site.tsx                           [ADAPTAR] (layout público)
        ├── _admin.tsx                          [ADAPTAR] (guard is_admin)
        ├── sitemap[.]xml.ts                    [ADAPTAR de vocacaodemae:src/routes/sitemap[.]xml.ts] (incluir posts, categorias, pai-indica, loja, ferramentas, vagas aprovadas, trilhas, desafios, eventos)
        ├── rss[.]xml.ts                        [NOVO]
        ├── api/
        │   ├── img/$.ts                        [COPIAR de vocacaodemae:src/routes/api/img/$.ts] (proxy/resize de imagens)
        │   ├── og.ts                           [NOVO] (?title=&kind=&score= → PNG 1200x630)
        │   ├── newsletter.ts                   [NOVO] (POST → newsletter_subscribers + Resend)
        │   ├── contact.ts                      [NOVO]
        │   └── cron/
        │       └── jobs-expire.ts              [NOVO] (único Vercel Cron, diário — plano Hobby; protegido por CRON_SECRET)
        ├── admin/login.tsx                     [COPIAR de vocacaodemae:src/routes/admin/login.tsx]
        ├── _admin/admin/
        │   ├── index.tsx                       [ADAPTAR]
        │   ├── editor/index.tsx, editor/$id.tsx  [ADAPTAR]
        │   ├── produtos/index.tsx, produtos/$id.tsx  [ADAPTAR]
        │   ├── moderacao.tsx                   [NOVO]
        │   ├── formacao.tsx                    [NOVO]
        │   └── eventos.tsx                     [NOVO]
        └── _site/
            ├── index.tsx                       [ADAPTAR] (home: get_home_data)
            ├── blog.tsx                        [ADAPTAR de vocacaodemae:src/routes/_site/blog.tsx]
            ├── post/$slug.tsx                  [ADAPTAR de vocacaodemae:src/routes/_site/post/$slug.tsx] (render por kind)
            ├── categoria/$slug.tsx             [ADAPTAR]
            ├── busca.tsx                       [ADAPTAR] (RPC search_posts)
            ├── pai-indica/index.tsx            [NOVO]
            ├── pai-indica/$slug.tsx            [NOVO] (mesmo loader de post/$slug; layout de review)
            ├── loja/index.tsx                  [ADAPTAR de vocacaodemae:src/routes/_site/loja/index.tsx]
            ├── loja/categoria/$slug.tsx        [NOVO]
            ├── loja/$slug.tsx                  [ADAPTAR de vocacaodemae:src/routes/_site/loja/$slug.tsx]
            ├── ferramentas/index.tsx           [ADAPTAR]
            ├── ferramentas/$slug.tsx           [NOVO] (resolve pelo registro src/lib/tools/index.ts; inclui conversor-de-moedas e mercado-financeiro)
            ├── area-do-pai.tsx                 [NOVO] (painel; guard autenticado)
            ├── minha-conta.tsx                 [ADAPTAR de vocacaodemae:src/routes/_site/minha-conta.tsx]
            ├── entrar.tsx                      [NOVO]
            ├── cadastro.tsx                    [NOVO]
            ├── pai-indica-pai/index.tsx        [NOVO]
            ├── pai-indica-pai/vagas/index.tsx  [NOVO]
            ├── pai-indica-pai/vagas/$slug.tsx  [NOVO]
            ├── pai-indica-pai/vagas/nova.tsx   [NOVO] (guard autenticado)
            ├── pai-indica-pai/profissionais.tsx [NOVO]
            ├── pai-indica-pai/mentoria.tsx     [NOVO]
            ├── irmandade.tsx                   [NOVO]
            ├── historias/index.tsx, historias/$id.tsx, historias/nova.tsx  [ADAPTAR de vocacaodemae:src/routes/_site/historias/*]
            ├── perguntas/index.tsx             [NOVO]
            ├── perguntas/$slug.tsx             [NOVO]
            ├── eventos.tsx                     [NOVO]
            ├── formacao/index.tsx              [NOVO]
            ├── formacao/$slug.tsx              [NOVO]
            ├── desafios/index.tsx              [NOVO]
            ├── desafios/$slug.tsx              [NOVO]
            ├── sobre.tsx                       [ADAPTAR]
            ├── contato.tsx                     [ADAPTAR]
            ├── politica-de-privacidade.tsx     [ADAPTAR]
            ├── termos-de-uso.tsx               [ADAPTAR]
            └── politica-de-afiliados.tsx       [NOVO]
```

Observação sobre rotas TanStack: `$slug` é parâmetro; pastas com `index.tsx` viram a rota raiz da pasta; `_site.tsx` e `_admin.tsx` são layouts sem segmento de URL; `[.]` escapa o ponto no nome de arquivo (`sitemap[.]xml.ts` → `/sitemap.xml`).

---

## 4. Schema SQL completo (7 migrations)

Regras gerais (valem para os 7 arquivos):

- Aplicar na ordem 0001 → 0007 com `mcp__Supabase__apply_migration` no projeto `<SUPABASE_PROJECT_REF>`, `name` igual ao nome do arquivo sem extensão.
- Todo `id` é `uuid primary key default gen_random_uuid()`; todo `slug` é `text unique not null`; status é `text` com `check`.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` + trigger `set_updated_at`.
- RLS ligada em todas as tabelas. Padrão: anon lê publicado/aprovado/ativo; usuário edita o próprio; staff via `is_admin()`.
- Funções chamadas em policies sempre como `(select public.is_admin())` para o planner avaliar uma vez por query.
- Nunca `DROP TABLE`/`DELETE` em migrations de rotina; mudanças de schema só em migrations `0008+` novas.
- Depois de aplicar cada bloco, rodar `mcp__Supabase__get_advisors` (security e performance) e corrigir avisos.

### 4.1 `supabase/migrations/0001_core.sql`

```sql
-- 0001_core.sql — extensões, utilitários, perfis, filhos, contato, newsletter, storage e tabelas internas
-- Projeto: Vocação de Pai · Supabase <SUPABASE_PROJECT_REF> (sa-east-1)

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ---------- utilitários ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- Configuração de busca em português sem acentos
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'pt_unaccent') then
    create text search configuration public.pt_unaccent (copy = portuguese);
    alter text search configuration public.pt_unaccent
      alter mapping for hword, hword_part, word with unaccent, portuguese_stem;
  end if;
end $$;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Pai',
  avatar_url text,
  role text not null default 'member' check (role in ('member','author','editor','admin')),
  bio text,
  city text,
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  onboarding_done boolean not null default false,
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- is_admin(): admin ou editor (staff). Security definer para não recursar nas policies de profiles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','editor')
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Impede que o próprio usuário troque o role (só service_role/admin)
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() and auth.role() <> 'service_role' then
    raise exception 'Não é permitido alterar o papel do perfil';
  end if;
  return new;
end; $$;
create trigger trg_guard_profile_role before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Cria o perfil automaticamente ao registrar no Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
create policy "profiles: read own or staff or authors" on public.profiles
  for select using (
    (select auth.uid()) = id
    or (select public.is_admin())
    or role in ('author','editor','admin')
  );
create policy "profiles: insert own" on public.profiles
  for insert with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles: staff update" on public.profiles
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

-- Perfil público reduzido (sem e-mail; usado em bylines e comunidade)
create or replace function public.get_public_profile(p_id uuid)
returns table (id uuid, display_name text, avatar_url text, role text, bio text, city text, uf char(2))
language sql stable security definer set search_path = public as $$
  select id, display_name, avatar_url, role, bio, city, uf from public.profiles where id = p_id;
$$;
grant execute on function public.get_public_profile(uuid) to anon, authenticated;

-- ---------- children ----------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  birth_date date not null,
  sex text not null check (sex in ('M','F')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_children_user on public.children(user_id);
create trigger trg_children_updated before update on public.children
  for each row execute function public.set_updated_at();
alter table public.children enable row level security;
create policy "children: own all" on public.children
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------- contact_messages ----------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null check (length(message) between 10 and 5000),
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.contact_messages enable row level security;
create policy "contact: public insert" on public.contact_messages for insert with check (true);
create policy "contact: staff read" on public.contact_messages for select using ((select public.is_admin()));
create policy "contact: staff update" on public.contact_messages for update using ((select public.is_admin()));
create policy "contact: staff delete" on public.contact_messages for delete using ((select public.is_admin()));

-- ---------- newsletter_subscribers ----------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name text,
  source text,
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  confirm_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.newsletter_subscribers enable row level security;
create policy "newsletter: public insert" on public.newsletter_subscribers for insert with check (true);
create policy "newsletter: staff read" on public.newsletter_subscribers for select using ((select public.is_admin()));
create policy "newsletter: staff update" on public.newsletter_subscribers for update using ((select public.is_admin()));

-- ---------- moderation_log (interno) ----------
create table if not exists public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null check (action in ('approve','reject','expire','edit','delete','flag')),
  moderator_id uuid references public.profiles(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_moderation_entity on public.moderation_log(entity_type, entity_id);
alter table public.moderation_log enable row level security;
create policy "moderation: staff read" on public.moderation_log for select using ((select public.is_admin()));
create policy "moderation: staff insert" on public.moderation_log for insert with check ((select public.is_admin()));

-- ---------- _tmp_post_staging (interno; rotina) ----------
create table if not exists public._tmp_post_staging (
  k text primary key,
  data text,
  created_at timestamptz not null default now()
);
alter table public._tmp_post_staging enable row level security;
revoke all on public._tmp_post_staging from anon, authenticated;

-- ---------- seo_search_stats (interno; edge function seo-search-console) ----------
create table if not exists public.seo_search_stats (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  period_days integer not null,
  query text,
  page text,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr numeric not null default 0,
  position numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (snapshot_date, period_days, query, page)
);
create index if not exists idx_seo_search_stats_snapshot_date on public.seo_search_stats(snapshot_date desc);
create index if not exists idx_seo_search_stats_page on public.seo_search_stats(page);
alter table public.seo_search_stats enable row level security;
revoke all on public.seo_search_stats from anon, authenticated;

-- ---------- Vault helper (segredos só para service_role) ----------
create or replace function public.get_secret(secret_name text)
returns text language sql stable security definer set search_path = public, vault as $$
  select decrypted_secret from vault.decrypted_secrets where name = secret_name limit 1;
$$;
revoke all on function public.get_secret(text) from public, anon, authenticated;

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public) values
  ('covers','covers', true),
  ('products','products', true),
  ('avatars','avatars', true)
on conflict (id) do nothing;

create policy "covers: public read" on storage.objects for select using (bucket_id = 'covers');
create policy "covers: staff write" on storage.objects for insert with check (bucket_id = 'covers' and public.is_admin());
create policy "covers: staff update" on storage.objects for update using (bucket_id = 'covers' and public.is_admin());
create policy "covers: staff delete" on storage.objects for delete using (bucket_id = 'covers' and public.is_admin());

create policy "products: public read" on storage.objects for select using (bucket_id = 'products');
create policy "products: staff write" on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
create policy "products: staff update" on storage.objects for update using (bucket_id = 'products' and public.is_admin());
create policy "products: staff delete" on storage.objects for delete using (bucket_id = 'products' and public.is_admin());

-- avatars/<uid>/arquivo.jpg : o dono escreve na própria pasta
create policy "avatars: public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars: own write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own delete" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```

### 4.2 `supabase/migrations/0002_blog.sql`

```sql
-- 0002_blog.sql — categorias, tags, posts (blog + Pai Indica), comentários, reações, views, busca

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create policy "categories: public read" on public.categories for select using (true);
create policy "categories: staff insert" on public.categories for insert with check ((select public.is_admin()));
create policy "categories: staff update" on public.categories for update using ((select public.is_admin()));
create policy "categories: staff delete" on public.categories for delete using ((select public.is_admin()));

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
create policy "tags: public read" on public.tags for select using (true);
create policy "tags: staff write" on public.tags for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- posts ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  excerpt text,
  body jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  cover_image_url text,
  cover_image_alt text,
  category_id uuid references public.categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  kind text not null default 'artigo' check (kind in ('artigo','noticia','review','comparativo','lista')),
  review jsonb,
  comparison jsonb,
  product_category text,
  product_subcategory text,
  product_score numeric(3,1) check (product_score is null or (product_score >= 0 and product_score <= 10)),
  faq jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','scheduled','published','archived')),
  publish_at timestamptz,
  reading_time integer,
  view_count integer not null default 0,
  like_count integer not null default 0,
  search_content tsvector,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_review_requires_kind check (kind <> 'review' or review is not null),
  constraint posts_comparison_requires_kind check (kind not in ('comparativo','lista') or comparison is not null)
);
create index if not exists idx_posts_status_publish on public.posts(status, publish_at desc);
create index if not exists idx_posts_category on public.posts(category_id);
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_kind on public.posts(kind);
create index if not exists idx_posts_product_cat on public.posts(product_category, product_subcategory);
create index if not exists idx_posts_search on public.posts using gin(search_content);
create index if not exists idx_posts_title_trgm on public.posts using gin(title gin_trgm_ops);
create trigger trg_posts_updated before update on public.posts
  for each row execute function public.set_updated_at();

-- Extrai texto do body Tiptap (recursivo) para o tsvector
create or replace function public.tiptap_text(doc jsonb)
returns text language sql immutable as $$
  select coalesce(string_agg(n->>'text', ' '), '')
  from jsonb_path_query(doc, 'strict $.** ? (@.type == "text")') as n;
$$;

create or replace function public.posts_search_content()
returns trigger language plpgsql as $$
declare v_text text := public.tiptap_text(new.body);
begin
  new.search_content :=
    setweight(to_tsvector('public.pt_unaccent', coalesce(new.title,'')), 'A') ||
    setweight(to_tsvector('public.pt_unaccent', coalesce(new.subtitle,'') || ' ' || coalesce(new.excerpt,'')), 'B') ||
    setweight(to_tsvector('public.pt_unaccent', v_text), 'C');
  if new.reading_time is null then
    new.reading_time := greatest(1, ceil(coalesce(array_length(regexp_split_to_array(v_text, '\s+'), 1), 0) / 200.0));
  end if;
  return new;
end; $$;
create trigger trg_posts_search before insert or update of title, subtitle, excerpt, body on public.posts
  for each row execute function public.posts_search_content();

alter table public.posts enable row level security;
create policy "posts: public read published" on public.posts
  for select using (status = 'published' and (publish_at is null or publish_at <= now()));
create policy "posts: staff read all" on public.posts for select using ((select public.is_admin()));
create policy "posts: staff insert" on public.posts for insert with check ((select public.is_admin()));
create policy "posts: author or staff update" on public.posts
  for update using ((select auth.uid()) = author_id or (select public.is_admin()))
  with check ((select auth.uid()) = author_id or (select public.is_admin()));
create policy "posts: staff delete" on public.posts for delete using ((select public.is_admin()));

-- ---------- post_tags ----------
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists idx_post_tags_tag on public.post_tags(tag_id);
alter table public.post_tags enable row level security;
create policy "post_tags: public read" on public.post_tags for select using (true);
create policy "post_tags: staff write" on public.post_tags for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- comments ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  author_name text not null,
  content text not null check (length(content) between 2 and 3000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  parent_id uuid references public.comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_comments_post on public.comments(post_id, status);
create index if not exists idx_comments_user on public.comments(user_id);
create trigger trg_comments_updated before update on public.comments
  for each row execute function public.set_updated_at();
alter table public.comments enable row level security;
create policy "comments: public read approved" on public.comments for select using (status = 'approved');
create policy "comments: own read" on public.comments for select using ((select auth.uid()) = user_id);
create policy "comments: staff read" on public.comments for select using ((select public.is_admin()));
create policy "comments: auth insert pending" on public.comments
  for insert with check ((select auth.uid()) = user_id and status = 'pending');
create policy "comments: own update" on public.comments
  for update using ((select auth.uid()) = user_id and status = 'pending');
create policy "comments: staff moderate" on public.comments
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "comments: own or staff delete" on public.comments
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

-- ---------- reactions ----------
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_key text not null,
  type text not null default 'like' check (type in ('like','useful','saved')),
  created_at timestamptz not null default now(),
  unique (post_id, user_key, type)
);
create index if not exists idx_reactions_post on public.reactions(post_id, type);
alter table public.reactions enable row level security;
create policy "reactions: own read" on public.reactions
  for select using ((select auth.uid())::text = user_key or (select public.is_admin()));
create policy "reactions: own delete" on public.reactions
  for delete using ((select auth.uid())::text = user_key or (select public.is_admin()));

create or replace function public.toggle_reaction(p_post_id uuid, p_type text, p_user_key text default null)
returns table (active boolean, count bigint)
language plpgsql security definer set search_path = public as $$
declare
  v_key text := coalesce(auth.uid()::text, nullif(btrim(p_user_key), ''));
  v_exists boolean;
begin
  if v_key is null or length(v_key) > 128 then
    raise exception 'user_key inválido';
  end if;
  select exists(select 1 from public.reactions where post_id = p_post_id and user_key = v_key and type = p_type) into v_exists;
  if v_exists then
    delete from public.reactions where post_id = p_post_id and user_key = v_key and type = p_type;
  else
    insert into public.reactions (post_id, user_key, type) values (p_post_id, v_key, p_type);
  end if;
  if p_type = 'like' then
    update public.posts set like_count = (select count(*) from public.reactions where post_id = p_post_id and type = 'like') where id = p_post_id;
  end if;
  return query select not v_exists, (select count(*) from public.reactions where post_id = p_post_id and type = p_type);
end; $$;
grant execute on function public.toggle_reaction(uuid, text, text) to anon, authenticated;

-- ---------- post_view_events + increment_post_views ----------
create table if not exists public.post_view_events (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_key text not null,
  viewed_on date not null default current_date,
  primary key (post_id, user_key, viewed_on)
);
alter table public.post_view_events enable row level security;
revoke all on public.post_view_events from anon, authenticated;

create or replace function public.increment_post_views(p_post_id uuid, p_user_key text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_key text := coalesce(auth.uid()::text, nullif(btrim(p_user_key), ''));
begin
  if v_key is null or length(v_key) > 128 then return; end if;
  insert into public.post_view_events (post_id, user_key) values (p_post_id, v_key) on conflict do nothing;
  if found then
    update public.posts set view_count = view_count + 1 where id = p_post_id and status = 'published';
  end if;
end; $$;
grant execute on function public.increment_post_views(uuid, text) to anon, authenticated;

-- ---------- search_posts ----------
create or replace function public.search_posts(p_query text, p_limit integer default 20, p_offset integer default 0)
returns table (
  id uuid, slug text, title text, excerpt text, cover_image_url text, kind text,
  product_score numeric, category_slug text, category_name text, publish_at timestamptz, rank real
)
language sql stable security definer set search_path = public as $$
  with q as (
    select websearch_to_tsquery('public.pt_unaccent', coalesce(nullif(btrim(p_query),''), 'x')) as tsq
  )
  select p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.kind, p.product_score,
         c.slug, c.name, p.publish_at,
         (ts_rank_cd(p.search_content, q.tsq) + similarity(p.title, p_query))::real as rank
  from public.posts p
  cross join q
  left join public.categories c on c.id = p.category_id
  where p.status = 'published' and (p.publish_at is null or p.publish_at <= now())
    and (p.search_content @@ q.tsq or p.title % p_query)
  order by rank desc, p.publish_at desc
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0);
$$;
grant execute on function public.search_posts(text, integer, integer) to anon, authenticated;

-- ---------- get_home_data (products existe só após 0003: a função referencia a tabela em runtime,
-- language sql valida na criação → este bloco fica no FIM de 0003_loja.sql; aqui só o comentário) ----------
-- get_home_data: ver 0003_loja.sql

-- ---------- categorias iniciais ----------
insert into public.categories (slug, name, description, icon, sort_order) values
('paternidade','Paternidade','Ser pai no dia a dia: presença, limites, brincadeira e educação dos filhos.','baby',1),
('casamento-e-familia','Casamento e família','O homem como marido: diálogo, liderança servidora, rotina a dois e vida em família.','heart-handshake',2),
('financas-da-familia','Finanças da família','Orçamento, reserva, dívidas, investimentos e o papel de provedor.','wallet',3),
('carreira-e-trabalho','Carreira e trabalho','Crescer no trabalho, mudar de área, empreender e equilibrar com a casa.','briefcase',4),
('saude-do-homem','Saúde do homem','Exames, treino, sono, peso, saúde mental e prevenção.','heart-pulse',5),
('churrasco-e-cozinha','Churrasco e cozinha','Cortes de carne, ponto, fogo, receitas de pai e cozinha de família.','flame',6),
('casa-carro-e-ferramentas','Casa, carro e ferramentas','Consertos, manutenção, segurança da casa e do carro.','wrench',7),
('fe-e-virtudes','Fé e virtudes','Oração em família, virtudes, exemplos de santos pais e formação do caráter.','church',8),
('pai-indica','Pai Indica','Reviews, comparativos e listas de produtos testados e indicados pelo pai.','badge-check',9),
('noticias','Notícias','Novidades e acontecimentos que interessam ao pai e à família.','newspaper',10)
on conflict (slug) do nothing;
```

### 4.3 `supabase/migrations/0003_loja.sql`

```sql
-- 0003_loja.sql — Loja do Pai: categorias de produto, produtos, checagens de faixa de preço, get_home_data

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  parent_id uuid references public.product_categories(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.product_categories enable row level security;
create policy "product_categories: public read" on public.product_categories for select using (true);
create policy "product_categories: staff write" on public.product_categories
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text,
  asin text check (asin is null or asin ~ '^[A-Z0-9]{10}$'),
  affiliate_network text not null default 'amazon' check (affiliate_network in ('amazon','mercadolivre','shopee','magalu','outro')),
  affiliate_url text not null,
  marketplace_urls jsonb not null default '{}'::jsonb,
  image_url text,
  images jsonb not null default '[]'::jsonb,
  short_description text,
  description text,
  pros jsonb not null default '[]'::jsonb,
  cons jsonb not null default '[]'::jsonb,
  review jsonb,
  category_id uuid references public.product_categories(id) on delete set null,
  subcategory text,
  price numeric(10,2),
  price_min numeric(10,2),
  price_max numeric(10,2),
  price_range_checked_at timestamptz,
  rating numeric(2,1) check (rating is null or (rating >= 0 and rating <= 5)),
  rating_count integer not null default 0,
  featured boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_range_sane check (
    price_min is null or price_max is null or (price_max >= price_min and price_max <= price_min * 3)
  )
);
create index if not exists idx_products_active_featured on public.products(active, featured, sort_order);
create index if not exists idx_products_category on public.products(category_id, subcategory);
create index if not exists idx_products_name_trgm on public.products using gin(name gin_trgm_ops);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
alter table public.products enable row level security;
create policy "products: public read active" on public.products for select using (active = true);
create policy "products: staff read all" on public.products for select using ((select public.is_admin()));
create policy "products: staff insert" on public.products for insert with check ((select public.is_admin()));
create policy "products: staff update" on public.products for update using ((select public.is_admin()));
create policy "products: staff delete" on public.products for delete using ((select public.is_admin()));

create table if not exists public.product_price_checks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store text not null,
  price numeric(10,2) not null check (price > 0),
  url text,
  checked_at timestamptz not null default now()
);
create index if not exists idx_price_checks_product on public.product_price_checks(product_id, checked_at desc);
alter table public.product_price_checks enable row level security;
create policy "price_checks: staff read" on public.product_price_checks for select using ((select public.is_admin()));
create policy "price_checks: staff insert" on public.product_price_checks for insert with check ((select public.is_admin()));

-- Recalcula a faixa a partir das 2+ checagens mais recentes (≤ 30 dias)
create or replace function public.refresh_price_range(p_product_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_min numeric; v_max numeric; v_n integer;
begin
  select min(price), max(price), count(*) into v_min, v_max, v_n
  from public.product_price_checks
  where product_id = p_product_id and checked_at > now() - interval '30 days';
  if v_n >= 2 and v_max <= v_min * 3 then
    update public.products set price_min = v_min, price_max = v_max, price_range_checked_at = now() where id = p_product_id;
  end if;
end; $$;
revoke all on function public.refresh_price_range(uuid) from public, anon, authenticated;

-- Produtos citados em um post (para a página de produto listar reviews e vice-versa)
create or replace function public.products_for_post(p_post_id uuid)
returns setof public.products language sql stable security definer set search_path = public as $$
  select pr.* from public.products pr
  where pr.active and pr.slug in (
    select jsonb_array_elements(coalesce(p.comparison->'products','[]'::jsonb))->>'product_slug'
    from public.posts p where p.id = p_post_id
    union
    select p.review->>'product_slug' from public.posts p where p.id = p_post_id
  );
$$;
grant execute on function public.products_for_post(uuid) to anon, authenticated;

create or replace function public.posts_for_product(p_product_slug text)
returns table (id uuid, slug text, title text, kind text, product_score numeric, cover_image_url text, publish_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.slug, p.title, p.kind, p.product_score, p.cover_image_url, p.publish_at
  from public.posts p
  where p.status = 'published' and (p.publish_at is null or p.publish_at <= now())
    and (p.review->>'product_slug' = p_product_slug
         or exists (select 1 from jsonb_array_elements(coalesce(p.comparison->'products','[]'::jsonb)) e where e->>'product_slug' = p_product_slug))
  order by p.publish_at desc;
$$;
grant execute on function public.posts_for_product(text) to anon, authenticated;

-- ---------- get_home_data ----------
create or replace function public.get_home_data()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'latest', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.kind, p.publish_at, p.reading_time,
               c.slug as category_slug, c.name as category_name
        from public.posts p left join public.categories c on c.id = p.category_id
        where p.status = 'published' and (p.publish_at is null or p.publish_at <= now()) and p.kind in ('artigo','noticia')
        order by p.publish_at desc limit 9
      ) x
    ),
    'reviews', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.kind, p.product_score, p.product_category, p.publish_at
        from public.posts p
        where p.status = 'published' and (p.publish_at is null or p.publish_at <= now()) and p.kind in ('review','comparativo','lista')
        order by p.publish_at desc limit 6
      ) x
    ),
    'products', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select id, slug, name, brand, image_url, price_min, price_max, rating, affiliate_url
        from public.products where active and featured order by sort_order, created_at desc limit 8
      ) x
    ),
    'categories', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.sort_order), '[]'::jsonb) from (
        select id, slug, name, icon, sort_order from public.categories
      ) x
    ),
    'popular', (
      select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
        select id, slug, title, view_count from public.posts
        where status = 'published' order by view_count desc limit 5
      ) x
    )
  );
$$;
grant execute on function public.get_home_data() to anon, authenticated;

insert into public.product_categories (slug, name, icon, sort_order) values
('churrasco','Churrasco e cozinha','flame',1),
('ferramentas','Ferramentas e oficina','wrench',2),
('carro','Carro e moto','car',3),
('casa','Casa e segurança','home',4),
('tecnologia','Tecnologia','smartphone',5),
('saude-e-treino','Saúde e treino','dumbbell',6),
('bebe-e-crianca','Bebê e criança','baby',7),
('livros','Livros e formação','book-open',8),
('estilo','Estilo e cuidados do homem','shirt',9),
('lazer','Lazer e família','tent',10)
on conflict (slug) do nothing;
```

### 4.4 `supabase/migrations/0004_membros.sql`

```sql
-- 0004_membros.sql — Área do Pai: itens salvos, badges, planos, assinaturas

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('post','product','job','tool','track','challenge','event','question')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists idx_saved_items_user on public.saved_items(user_id, item_type);
alter table public.saved_items enable row level security;
create policy "saved_items: own all" on public.saved_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  rule text,
  created_at timestamptz not null default now()
);
alter table public.badges enable row level security;
create policy "badges: public read" on public.badges for select using (true);
create policy "badges: staff write" on public.badges for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "user_badges: public read" on public.user_badges for select using (true);
-- Escrita só por funções security definer (award_badge) ou service_role.

create or replace function public.award_badge(p_user_id uuid, p_badge_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then return; end if;
  insert into public.user_badges (user_id, badge_id)
  select p_user_id, b.id from public.badges b where b.slug = p_badge_slug
  on conflict do nothing;
end; $$;
revoke all on function public.award_badge(uuid, text) from public, anon, authenticated;

-- Onboarding: marca concluído e dá a primeira badge
create or replace function public.complete_onboarding()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set onboarding_done = true where id = auth.uid();
  perform public.award_badge(auth.uid(), 'primeiro-passo');
end; $$;
grant execute on function public.complete_onboarding() to authenticated;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_monthly numeric(10,2) not null default 0,
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;
create policy "plans: public read active" on public.plans for select using (active = true);
create policy "plans: staff write" on public.plans for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active' check (status in ('active','past_due','canceled','trialing')),
  provider text check (provider in ('mercadopago','manual')),
  provider_ref text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id, status);
create trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
alter table public.subscriptions enable row level security;
create policy "subscriptions: own read" on public.subscriptions for select using ((select auth.uid()) = user_id);
create policy "subscriptions: staff all" on public.subscriptions for all using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.plans (slug, name, description, price_monthly, features) values
('gratuito','Pai Membro','Acesso gratuito à Área do Pai, trilhas, desafios, comunidade e Pai Indica Pai.',0,
 '["Trilhas de formação","Desafios","Itens salvos","Histórias e perguntas","Indicar e ver vagas"]'::jsonb)
on conflict (slug) do nothing;

insert into public.badges (slug, name, description, icon, rule) values
('primeiro-passo','Primeiro passo','Completou o onboarding da Área do Pai.','footprints','onboarding_done'),
('pai-presente','Pai presente','Concluiu o primeiro desafio.','medal','challenge_completed:1'),
('formador','Formador','Concluiu a primeira trilha.','graduation-cap','track_completed:1'),
('pai-que-indica','Pai que indica','Publicou a primeira vaga aprovada.','handshake','job_approved:1'),
('voz-da-irmandade','Voz da Irmandade','Teve uma história aprovada.','megaphone','story_approved:1')
on conflict (slug) do nothing;

-- get_member_dashboard: depende de jobs (0005), tracks e challenges (0006) → definida no FIM de 0006.
```

### 4.5 `supabase/migrations/0005_pai_indica_pai.sql`

```sql
-- 0005_pai_indica_pai.sql — vagas, indicações, profissionais, mentoria

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (length(title) between 5 and 120),
  company text not null,
  city text,
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  remote boolean not null default false,
  type text not null check (type in ('clt','pj','freela','estagio','temporario')),
  salary_min numeric(10,2),
  salary_max numeric(10,2),
  description text not null check (length(description) between 50 and 8000),
  how_to_apply text,
  contact_email text,
  contact_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  expires_at timestamptz not null default (now() + interval '45 days'),
  posted_by uuid references public.profiles(id) on delete set null,
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_contact check (contact_email is not null or contact_url is not null or how_to_apply is not null),
  constraint jobs_salary_sane check (salary_min is null or salary_max is null or salary_max >= salary_min)
);
create index if not exists idx_jobs_status_expires on public.jobs(status, expires_at desc);
create index if not exists idx_jobs_uf_city on public.jobs(uf, city);
create index if not exists idx_jobs_posted_by on public.jobs(posted_by);
create index if not exists idx_jobs_title_trgm on public.jobs using gin(title gin_trgm_ops);
create trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();

-- Membro não pode se auto-aprovar nem mexer em campos de moderação
create or replace function public.guard_job_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.moderated_by := null; new.moderated_at := null; new.views := 0;
    elsif new.status is distinct from old.status or new.moderated_by is distinct from old.moderated_by then
      raise exception 'Somente a moderação altera o status da vaga';
    end if;
  end if;
  return new;
end; $$;
create trigger trg_guard_job_status before insert or update on public.jobs
  for each row execute function public.guard_job_status();

alter table public.jobs enable row level security;
create policy "jobs: public read approved" on public.jobs
  for select using (status = 'approved' and expires_at > now());
create policy "jobs: own read" on public.jobs for select using ((select auth.uid()) = posted_by);
create policy "jobs: staff read" on public.jobs for select using ((select public.is_admin()));
create policy "jobs: auth insert own" on public.jobs for insert with check ((select auth.uid()) = posted_by);
create policy "jobs: own update pending" on public.jobs
  for update using ((select auth.uid()) = posted_by and status in ('pending','rejected'));
create policy "jobs: staff update" on public.jobs for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "jobs: staff delete" on public.jobs for delete using ((select public.is_admin()));

create or replace function public.moderate_job(p_job_id uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  update public.jobs set
    status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'expire' then 'expired' else status end,
    moderated_by = auth.uid(), moderated_at = now()
  where id = p_job_id;
  insert into public.moderation_log (entity_type, entity_id, action, moderator_id, reason)
  values ('job', p_job_id, p_action, auth.uid(), p_reason);
  if p_action = 'approve' then
    perform public.award_badge((select posted_by from public.jobs where id = p_job_id), 'pai-que-indica');
  end if;
end; $$;
grant execute on function public.moderate_job(uuid, text, text) to authenticated;

create or replace function public.increment_job_views(p_job_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.jobs set views = views + 1 where id = p_job_id and status = 'approved';
$$;
grant execute on function public.increment_job_views(uuid) to anon, authenticated;

create or replace function public.expire_jobs()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  with u as (update public.jobs set status = 'expired' where status = 'approved' and expires_at <= now() returning id)
  select count(*) into n from u;
  return n;
end; $$;
revoke all on function public.expire_jobs() from public, anon, authenticated;

-- ---------- job_referrals (indicações a uma vaga) ----------
create table if not exists public.job_referrals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  candidate_name text not null,
  candidate_contact text not null,
  note text check (note is null or length(note) <= 1000),
  status text not null default 'pending' check (status in ('pending','sent','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique (job_id, referrer_id, candidate_contact)
);
create index if not exists idx_job_referrals_job on public.job_referrals(job_id);
alter table public.job_referrals enable row level security;
create policy "job_referrals: referrer read" on public.job_referrals for select using ((select auth.uid()) = referrer_id);
create policy "job_referrals: job owner read" on public.job_referrals
  for select using ((select auth.uid()) = (select posted_by from public.jobs j where j.id = job_id));
create policy "job_referrals: staff read" on public.job_referrals for select using ((select public.is_admin()));
create policy "job_referrals: auth insert own" on public.job_referrals for insert with check ((select auth.uid()) = referrer_id);
create policy "job_referrals: job owner or staff update" on public.job_referrals
  for update using ((select auth.uid()) = (select posted_by from public.jobs j where j.id = job_id) or (select public.is_admin()));

-- ---------- professionals ----------
create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null unique,
  headline text not null check (length(headline) between 5 and 120),
  profession text not null,
  description text check (description is null or length(description) <= 3000),
  city text,
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  remote boolean not null default false,
  whatsapp text,
  website text,
  instagram text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index if not exists idx_professionals_status on public.professionals(status, profession);
create trigger trg_professionals_updated before update on public.professionals
  for each row execute function public.set_updated_at();
alter table public.professionals enable row level security;
create policy "professionals: public read approved" on public.professionals for select using (status = 'approved');
create policy "professionals: own read" on public.professionals for select using ((select auth.uid()) = user_id);
create policy "professionals: staff read" on public.professionals for select using ((select public.is_admin()));
create policy "professionals: own insert" on public.professionals
  for insert with check ((select auth.uid()) = user_id and status = 'pending');
create policy "professionals: own update" on public.professionals
  for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id and status = 'pending');
create policy "professionals: staff update" on public.professionals for update using ((select public.is_admin()));
create policy "professionals: own or staff delete" on public.professionals
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

-- ---------- mentorships ----------
create table if not exists public.mentorships (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  mentee_id uuid references public.profiles(id) on delete set null,
  topic text not null check (topic in ('carreira','financas','paternidade','casamento','fe','negocios','saude')),
  title text not null check (length(title) between 5 and 120),
  description text check (description is null or length(description) <= 3000),
  mode text not null default 'online' check (mode in ('online','presencial','ambos')),
  status text not null default 'pending' check (status in ('pending','open','matched','closed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_mentorships_status_topic on public.mentorships(status, topic);
create trigger trg_mentorships_updated before update on public.mentorships
  for each row execute function public.set_updated_at();
alter table public.mentorships enable row level security;
create policy "mentorships: public read open" on public.mentorships for select using (status = 'open');
create policy "mentorships: parties or staff read" on public.mentorships
  for select using ((select auth.uid()) in (mentor_id, mentee_id) or (select public.is_admin()));
create policy "mentorships: mentor insert" on public.mentorships
  for insert with check ((select auth.uid()) = mentor_id and status = 'pending');
create policy "mentorships: mentor update" on public.mentorships for update using ((select auth.uid()) = mentor_id);
create policy "mentorships: staff update" on public.mentorships for update using ((select public.is_admin()));
create policy "mentorships: mentor or staff delete" on public.mentorships
  for delete using ((select auth.uid()) = mentor_id or (select public.is_admin()));
```

### 4.6 `supabase/migrations/0006_irmandade_formacao.sql`

```sql
-- 0006_irmandade_formacao.sql — histórias, perguntas, respostas, eventos, trilhas, desafios, painel do membro

-- ---------- stories ----------
create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  title text not null check (length(title) between 5 and 140),
  category text not null default 'paternidade' check (category in ('paternidade','casamento','trabalho','fe','superacao','humor')),
  content text not null check (length(content) between 100 and 10000),
  photo_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_stories_status on public.stories(status, created_at desc);
create index if not exists idx_stories_user on public.stories(user_id);
create trigger trg_stories_updated before update on public.stories
  for each row execute function public.set_updated_at();

-- Guard genérico de status para conteúdo de membros (stories, questions)
create or replace function public.guard_member_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then new.status := 'pending';
    elsif new.status is distinct from old.status then raise exception 'Somente a moderação altera o status'; end if;
  end if;
  return new;
end; $$;
create trigger trg_guard_story_status before insert or update on public.stories
  for each row execute function public.guard_member_status();

alter table public.stories enable row level security;
create policy "stories: public read approved" on public.stories for select using (status = 'approved');
create policy "stories: own read" on public.stories for select using ((select auth.uid()) = user_id);
create policy "stories: staff read" on public.stories for select using ((select public.is_admin()));
create policy "stories: own insert" on public.stories for insert with check ((select auth.uid()) = user_id);
create policy "stories: own update" on public.stories for update using ((select auth.uid()) = user_id);
create policy "stories: staff update" on public.stories for update using ((select public.is_admin()));
create policy "stories: own or staff delete" on public.stories
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

create or replace function public.moderate_story(p_story_id uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  update public.stories set status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else status end
  where id = p_story_id;
  insert into public.moderation_log (entity_type, entity_id, action, moderator_id, reason)
  values ('story', p_story_id, p_action, auth.uid(), p_reason);
  if p_action = 'approve' then
    perform public.award_badge((select user_id from public.stories where id = p_story_id), 'voz-da-irmandade');
  end if;
end; $$;
grant execute on function public.moderate_story(uuid, text, text) to authenticated;

-- ---------- questions / answers ----------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (length(title) between 10 and 160),
  body text not null check (length(body) between 20 and 6000),
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','closed')),
  answers_count integer not null default 0,
  accepted_answer_id uuid,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_questions_status on public.questions(status, created_at desc);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_questions_title_trgm on public.questions using gin(title gin_trgm_ops);
create trigger trg_questions_updated before update on public.questions
  for each row execute function public.set_updated_at();
create trigger trg_guard_question_status before insert or update on public.questions
  for each row execute function public.guard_member_status();
alter table public.questions enable row level security;
create policy "questions: public read approved" on public.questions for select using (status in ('approved','closed'));
create policy "questions: own read" on public.questions for select using ((select auth.uid()) = user_id);
create policy "questions: staff read" on public.questions for select using ((select public.is_admin()));
create policy "questions: own insert" on public.questions for insert with check ((select auth.uid()) = user_id);
create policy "questions: own update" on public.questions for update using ((select auth.uid()) = user_id);
create policy "questions: staff update" on public.questions for update using ((select public.is_admin()));
create policy "questions: own or staff delete" on public.questions
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 10 and 6000),
  status text not null default 'approved' check (status in ('pending','approved','rejected')),
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_answers_question on public.answers(question_id, status, created_at);
create trigger trg_answers_updated before update on public.answers
  for each row execute function public.set_updated_at();
alter table public.answers enable row level security;
create policy "answers: public read approved" on public.answers for select using (status = 'approved');
create policy "answers: own read" on public.answers for select using ((select auth.uid()) = user_id);
create policy "answers: staff read" on public.answers for select using ((select public.is_admin()));
create policy "answers: own insert" on public.answers for insert with check ((select auth.uid()) = user_id);
create policy "answers: own update" on public.answers for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "answers: staff update" on public.answers for update using ((select public.is_admin()));
create policy "answers: own or staff delete" on public.answers
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

alter table public.questions
  add constraint questions_accepted_fk foreign key (accepted_answer_id) references public.answers(id) on delete set null;

create or replace function public.answers_count_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.questions q set answers_count = (select count(*) from public.answers a where a.question_id = q.id and a.status = 'approved')
  where q.id = coalesce(new.question_id, old.question_id);
  return null;
end; $$;
create trigger trg_answers_count after insert or update or delete on public.answers
  for each row execute function public.answers_count_sync();

create or replace function public.accept_answer(p_question_id uuid, p_answer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.questions where id = p_question_id and (user_id = auth.uid() or public.is_admin())) then
    raise exception 'Acesso negado';
  end if;
  update public.questions set accepted_answer_id = p_answer_id where id = p_question_id;
end; $$;
grant execute on function public.accept_answer(uuid, uuid) to authenticated;

-- ---------- events / event_rsvps ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  mode text not null default 'online' check (mode in ('online','presencial')),
  city text,
  uf char(2),
  address text,
  url text,
  cover_image_url text,
  capacity integer,
  status text not null default 'draft' check (status in ('draft','published','canceled','done')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_events_status_starts on public.events(status, starts_at);
create trigger trg_events_updated before update on public.events
  for each row execute function public.set_updated_at();
alter table public.events enable row level security;
create policy "events: public read published" on public.events for select using (status in ('published','done'));
create policy "events: staff all" on public.events for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going' check (status in ('going','maybe','canceled')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_rsvps enable row level security;
create policy "event_rsvps: own all" on public.event_rsvps
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "event_rsvps: staff read" on public.event_rsvps for select using ((select public.is_admin()));

create or replace function public.event_rsvp_count(p_event_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.event_rsvps where event_id = p_event_id and status = 'going';
$$;
grant execute on function public.event_rsvp_count(uuid) to anon, authenticated;

-- ---------- tracks / track_steps / track_progress ----------
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image_url text,
  level text not null default 'iniciante' check (level in ('iniciante','intermediario','avancado')),
  estimated_minutes integer,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_tracks_updated before update on public.tracks
  for each row execute function public.set_updated_at();
alter table public.tracks enable row level security;
create policy "tracks: public read published" on public.tracks for select using (status = 'published');
create policy "tracks: staff all" on public.tracks for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.track_steps (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  position integer not null,
  title text not null,
  body jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  post_id uuid references public.posts(id) on delete set null,
  video_url text,
  estimated_minutes integer,
  created_at timestamptz not null default now(),
  unique (track_id, position)
);
alter table public.track_steps enable row level security;
create policy "track_steps: public read of published track" on public.track_steps
  for select using (exists (select 1 from public.tracks t where t.id = track_id and t.status = 'published') or (select public.is_admin()));
create policy "track_steps: staff all" on public.track_steps for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.track_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  step_id uuid not null references public.track_steps(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, step_id)
);
create index if not exists idx_track_progress_user_track on public.track_progress(user_id, track_id);
alter table public.track_progress enable row level security;
create policy "track_progress: own all" on public.track_progress
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.complete_track_step(p_step_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_track uuid; v_total integer; v_done integer;
begin
  select track_id into v_track from public.track_steps where id = p_step_id;
  insert into public.track_progress (user_id, track_id, step_id) values (auth.uid(), v_track, p_step_id) on conflict do nothing;
  select count(*) into v_total from public.track_steps where track_id = v_track;
  select count(*) into v_done from public.track_progress where user_id = auth.uid() and track_id = v_track;
  if v_done >= v_total then perform public.award_badge(auth.uid(), 'formador'); end if;
end; $$;
grant execute on function public.complete_track_step(uuid) to authenticated;

-- ---------- challenges / challenge_days / challenge_progress ----------
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_image_url text,
  days integer not null check (days between 3 and 90),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_challenges_updated before update on public.challenges
  for each row execute function public.set_updated_at();
alter table public.challenges enable row level security;
create policy "challenges: public read published" on public.challenges for select using (status = 'published');
create policy "challenges: staff all" on public.challenges for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.challenge_days (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  day integer not null check (day >= 1),
  title text not null,
  task text not null,
  body jsonb,
  unique (challenge_id, day)
);
alter table public.challenge_days enable row level security;
create policy "challenge_days: public read of published" on public.challenge_days
  for select using (exists (select 1 from public.challenges c where c.id = challenge_id and c.status = 'published') or (select public.is_admin()));
create policy "challenge_days: staff all" on public.challenge_days for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.challenge_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  day integer not null,
  completed_at timestamptz not null default now(),
  note text check (note is null or length(note) <= 500),
  primary key (user_id, challenge_id, day)
);
alter table public.challenge_progress enable row level security;
create policy "challenge_progress: own all" on public.challenge_progress
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.complete_challenge_day(p_challenge_id uuid, p_day integer, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_days integer; v_done integer;
begin
  insert into public.challenge_progress (user_id, challenge_id, day, note) values (auth.uid(), p_challenge_id, p_day, p_note)
  on conflict (user_id, challenge_id, day) do update set note = excluded.note;
  select days into v_days from public.challenges where id = p_challenge_id;
  select count(*) into v_done from public.challenge_progress where user_id = auth.uid() and challenge_id = p_challenge_id;
  if v_done >= v_days then perform public.award_badge(auth.uid(), 'pai-presente'); end if;
end; $$;
grant execute on function public.complete_challenge_day(uuid, integer, text) to authenticated;

-- ---------- get_member_dashboard (aqui porque depende de jobs/tracks/challenges) ----------
create or replace function public.get_member_dashboard()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', (select coalesce(jsonb_agg(to_jsonb(c) order by c.birth_date), '[]') from public.children c where c.user_id = auth.uid()),
    'badges', (select coalesce(jsonb_agg(jsonb_build_object('slug',b.slug,'name',b.name,'icon',b.icon,'awarded_at',ub.awarded_at)), '[]')
               from public.user_badges ub join public.badges b on b.id = ub.badge_id where ub.user_id = auth.uid()),
    'saved_count', (select count(*) from public.saved_items where user_id = auth.uid()),
    'tracks', (select coalesce(jsonb_agg(jsonb_build_object('track_id',t.id,'slug',t.slug,'title',t.title,
                 'done', (select count(*) from public.track_progress tp where tp.user_id = auth.uid() and tp.track_id = t.id),
                 'total', (select count(*) from public.track_steps ts where ts.track_id = t.id))), '[]')
               from public.tracks t where t.status = 'published'
                 and exists (select 1 from public.track_progress tp where tp.user_id = auth.uid() and tp.track_id = t.id)),
    'challenges', (select coalesce(jsonb_agg(jsonb_build_object('challenge_id',ch.id,'slug',ch.slug,'title',ch.title,'days',ch.days,
                 'done', (select count(*) from public.challenge_progress cp where cp.user_id = auth.uid() and cp.challenge_id = ch.id))), '[]')
               from public.challenges ch where ch.status = 'published'
                 and exists (select 1 from public.challenge_progress cp where cp.user_id = auth.uid() and cp.challenge_id = ch.id)),
    'jobs', (select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'slug',j.slug,'title',j.title,'status',j.status)), '[]')
             from public.jobs j where j.posted_by = auth.uid())
  );
$$;
grant execute on function public.get_member_dashboard() to authenticated;
```

### 4.7 `supabase/migrations/0007_ferramentas.sql`

```sql
-- 0007_ferramentas.sql — cache de mercado, uso de ferramentas, pg_cron (fallback)

create table if not exists public.market_cache (
  key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now(),
  ttl_seconds integer not null default 1800
);
alter table public.market_cache enable row level security;
-- Leitura pública (dados de mercado não são sensíveis); escrita só service_role (edge function market-sync)
create policy "market_cache: public read" on public.market_cache for select using (true);

-- Chaves fixas usadas pelo app (escritas pela edge function market-sync):
--   'fx:BRL'              → { "USD": 5.12, "EUR": 5.55, "GBP": 6.40, "ARS": 0.0052, "BTC": 350000.00, "base": "BRL",
--                              "source": "awesomeapi", "ptax_usd": 5.11 }           (AwesomeAPI com token; PTAX do BCB sem chave)
--   'indices:BR'          → { "ibovespa": {"points": 132000, "change_pct": 0.4}, "selic": 10.5, "ipca_12m": 4.2, "cdi": 10.4 }
--                              (Ibovespa: Brapi 15k req/mês; Selic/IPCA/CDI: BCB SGS séries 432, 13522, 4389 — sem chave)
--   'crypto:top'          → [{ "symbol":"BTC","brl": 350000, "change_24h": -1.2 }, { "symbol":"ETH", ... }]   (CoinGecko)
--   'history:USD-BRL:30d' → [{ "date":"2026-10-01","close":5.10 }, ...]              (BCB PTAX série 1)
--   'history:IBOV:30d'    → [{ "date":"2026-10-01","close":131500 }, ...]            (Brapi)

create or replace function public.get_market(p_keys text[])
returns setof public.market_cache language sql stable security definer set search_path = public as $$
  select * from public.market_cache where key = any(p_keys);
$$;
grant execute on function public.get_market(text[]) to anon, authenticated;

create or replace function public.market_is_stale(p_key text)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select fetched_at + (ttl_seconds || ' seconds')::interval < now() from public.market_cache where key = p_key), true);
$$;
grant execute on function public.market_is_stale(text) to anon, authenticated;

create table if not exists public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  user_key text not null,
  input jsonb,
  used_on date not null default current_date,
  created_at timestamptz not null default now()
);
create index if not exists idx_tool_usage_slug_date on public.tool_usage(tool_slug, used_on desc);
alter table public.tool_usage enable row level security;
revoke all on public.tool_usage from anon, authenticated;
create policy "tool_usage: staff read" on public.tool_usage for select using ((select public.is_admin()));

create or replace function public.track_tool_usage(p_tool_slug text, p_user_key text default null, p_input jsonb default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_key text := coalesce(auth.uid()::text, nullif(btrim(p_user_key), ''));
begin
  if v_key is null or length(v_key) > 128 or length(p_tool_slug) > 64 then return; end if;
  insert into public.tool_usage (tool_slug, user_key, input) values (p_tool_slug, v_key, p_input);
end; $$;
grant execute on function public.track_tool_usage(text, text, jsonb) to anon, authenticated;

-- Estatísticas para o admin e para o Painel Lisieux
create or replace function public.tool_usage_stats(p_days integer default 30)
returns table (tool_slug text, uses bigint, unique_users bigint)
language sql stable security definer set search_path = public as $$
  select tool_slug, count(*), count(distinct user_key)
  from public.tool_usage where used_on >= current_date - p_days
  group by tool_slug order by 2 desc;
$$;
revoke all on function public.tool_usage_stats(integer) from public, anon;
grant execute on function public.tool_usage_stats(integer) to authenticated;

-- pg_cron: fallback diário. O agendamento principal (a cada 30 min) é o GitHub Actions
-- .github/workflows/market-sync.yml, porque o Vercel Cron no plano Hobby só permite 1 execução/dia.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule('market-sync-daily-fallback', '5 6 * * *', $$
  select net.http_post(
    url := 'https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/market-sync',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || public.get_secret('CRON_SECRET')),
    body := '{}'::jsonb
  );
$$);

select cron.schedule('jobs-expire-daily', '15 3 * * *', $$ select public.expire_jobs(); $$);
```

---

## 5. Modelo de conteúdo

### 5.1 Body Tiptap (`posts.body`, `track_steps.body`, `challenge_days.body`)

Nodes do StarterKit/extensões usados pelas migrations reais do VDM (contados em `20261012083000_add_3_posts_movimentos_soluco_tosse.sql`): `doc`, `paragraph`, `text` (marks `bold`, `italic`, `link`), `heading` (attrs `level` 2 ou 3), `bulletList`, `orderedList`, `listItem`, `taskList`, `taskItem` (attrs `checked`), `table`, `tableRow`, `tableHeader`, `tableCell`, `image` (attrs `src`, `alt`, `title`), `horizontalRule`, `blockquote`.

Nodes customizados herdados do VDM (ver `inv-vocacaodemae.md`; manter em `src/lib/tiptap-html.ts` e no editor): `callout` (attrs `tone`), `fotosModelos` (galeria de fotos de modelos/produtos), `buyCard` (cartão de compra com afiliado), `galeriaProduto` (galeria de imagens do produto), `decisorRapido` (bloco "decida em 30 segundos"), `toolEmbed` (attrs `tool`: embute uma ferramenta, ex. `conversor-de-moedas`).

Novos nodes do Vocação de Pai: `reviewBox` (renderiza `posts.review`), `comparisonTable` (renderiza `posts.comparison`).

Exemplo mínimo (copiado do padrão real do VDM, com texto adaptado):

```json
{
  "type": "doc",
  "content": [
    { "type": "paragraph", "content": [
      { "type": "text", "text": "Poucas coisas marcam tanto um homem quanto ouvir o choro do filho pela primeira vez. " },
      { "type": "text", "marks": [{ "type": "bold" }], "text": "Ser pai começa antes do parto" },
      { "type": "text", "text": " e este guia mostra, passo a passo, o que fazer nos primeiros 30 dias." }
    ]},
    { "type": "heading", "attrs": { "level": 2 }, "content": [{ "type": "text", "text": "O que muda na primeira semana" }] },
    { "type": "bulletList", "content": [
      { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Sono picado: durma quando o bebê dormir." }] }] },
      { "type": "listItem", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Assuma a casa: louça, mercado, visitas." }] }] }
    ]},
    { "type": "callout", "attrs": { "tone": "ok" }, "content": [
      { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Sinal verde: " }, { "type": "text", "text": "o bebê mama, faz xixi 6+ vezes ao dia e ganha peso. Siga em frente." }] }
    ]},
    { "type": "callout", "attrs": { "tone": "warn" }, "content": [
      { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Sinal de atenção: " }, { "type": "text", "text": "sua esposa chora todo dia e não quer sair da cama. Converse e procure o obstetra." }] }
    ]},
    { "type": "callout", "attrs": { "tone": "bad" }, "content": [
      { "type": "paragraph", "content": [{ "type": "text", "marks": [{ "type": "bold" }], "text": "Sinal de alerta: " }, { "type": "text", "text": "febre acima de 38 °C no bebê com menos de 3 meses. Pronto-socorro agora." }] }
    ]},
    { "type": "table", "content": [
      { "type": "tableRow", "content": [
        { "type": "tableHeader", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Semana" }] }] },
        { "type": "tableHeader", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Tarefa do pai" }] }] }
      ]},
      { "type": "tableRow", "content": [
        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "1" }] }] },
        { "type": "tableCell", "content": [{ "type": "paragraph", "content": [{ "type": "text", "text": "Registro civil, plano de saúde, CPF do bebê" }] }] }
      ]}
    ]},
    { "type": "buyCard", "attrs": { "slug": "cadeirinha-para-carro-chicco" } },
    { "type": "toolEmbed", "attrs": { "tool": "custo-de-um-filho" } },
    { "type": "paragraph", "content": [
      { "type": "text", "text": "Leia também: " },
      { "type": "text", "marks": [{ "type": "link", "attrs": { "href": "/post/licenca-paternidade-como-funciona", "target": null } }], "text": "Licença-paternidade: como funciona" }
    ]},
    { "type": "image", "attrs": { "src": "https://<SUPABASE_PROJECT_REF>.supabase.co/storage/v1/object/public/covers/pai-recem-nascido.jpg", "alt": "Pai segurando o filho recém-nascido no colo", "title": null } }
  ]
}
```

### 5.2 Semáforo do pai (callouts)

| `attrs.tone` | Prefixo obrigatório (em `bold`) | Cor (token) | Uso |
|---|---|---|---|
| `ok` | `Sinal verde: ` | `--success` #2F7D4F | Situação normal, pode seguir |
| `warn` | `Sinal de atenção: ` | `--warning` #D9A21B | Observar, ajustar, conversar |
| `bad` | `Sinal de alerta: ` | `--danger` #B23A3A | Agir agora / procurar ajuda profissional |

Regras: todo artigo de saúde, finanças ou relacionamento tem ao menos 1 callout de cada tom; o `validate-content.mjs` confere o prefixo exato (com dois-pontos e espaço). O VDM usa "Sinal tranquilizador"; aqui é **"Sinal verde"**.

### 5.3 `posts.review` (kind = `review`)

```json
{
  "product_slug": "churrasqueira-weber-smokey-joe",
  "product_name": "Churrasqueira Weber Smokey Joe",
  "score": 8.7,
  "criteria": [
    { "name": "Custo-benefício", "weight": 0.25, "score": 8.5, "comment": "Faixa de R$ 500–700; durabilidade compensa." },
    { "name": "Qualidade e durabilidade", "weight": 0.25, "score": 9.2, "comment": "Esmalte porcelanizado, 10 anos de garantia." },
    { "name": "Facilidade de uso", "weight": 0.20, "score": 8.8, "comment": "Monta em 10 minutos; controle de ar simples." },
    { "name": "Segurança para a família", "weight": 0.15, "score": 8.0, "comment": "Tampa esquenta; manter longe das crianças." },
    { "name": "Praticidade no dia a dia", "weight": 0.15, "score": 8.5, "comment": "Cabe no porta-malas; limpa rápido." }
  ],
  "pros": ["Portátil de verdade", "Brasa constante", "Peças de reposição fáceis"],
  "cons": ["Grelha pequena para mais de 4 pessoas", "Sem termômetro na tampa"],
  "ideal_for": ["Pai de apartamento com varanda", "Quem leva churrasco para a praia/sítio"],
  "not_ideal_for": ["Família grande (6+)", "Quem quer defumar peças grandes"],
  "verdict": "A melhor churrasqueira portátil para o pai que quer brasa de verdade sem ocupar espaço.",
  "how_we_evaluated": "Testada em 6 churrascos ao longo de 45 dias, comparada com Tramontina TCP-460 e Mor Apolo. Pesos: custo-benefício 25%, qualidade 25%, uso 20%, segurança 15%, praticidade 15%. Faixa de preço pesquisada em Amazon e Magazine Luiza em 20/10/2026.",
  "tested_days": 45,
  "affiliate": true,
  "price_range": { "min": 520, "max": 690, "checked_at": "2026-10-20" }
}
```

Invariantes (zod em `src/lib/review-schema.ts`): exatamente **5** critérios; soma dos `weight` = 1.0 (±0.01); `score` final = Σ(weight×score) arredondado a 1 casa (o validador recalcula e compara com tolerância 0.15); `posts.product_score` deve ser igual a `review.score`; `price_range.max ≤ 3 × min`; `product_slug` existe em `products`. Campos equivalentes ao `ReviewData` do Portal da AI (`tool`→`product_name`, `criteria[{label,score}]`→`criteria[{name,weight,score,comment}]`, `bestFor`→`ideal_for[]`, `url`→`products.affiliate_url`, `testedDays`→`tested_days`).

### 5.4 `posts.comparison` (kind = `comparativo` e `lista`)

```json
{
  "products": [
    { "product_slug": "churrasqueira-weber-smokey-joe", "role": "vencedor", "score": 8.7 },
    { "product_slug": "churrasqueira-tramontina-tcp-460", "role": "custo-beneficio", "score": 8.1 },
    { "product_slug": "churrasqueira-mor-apolo", "role": "economica", "score": 7.2 }
  ],
  "table": {
    "columns": ["Critério", "Weber Smokey Joe", "Tramontina TCP-460", "Mor Apolo"],
    "rows": [
      ["Faixa de preço", "R$ 520–690", "R$ 380–520", "R$ 150–220"],
      ["Área da grelha", "37 cm", "46 cm", "40 cm"],
      ["Tampa", "Sim", "Não", "Não"],
      ["Garantia", "10 anos", "1 ano", "3 meses"],
      ["Nota", "8,7", "8,1", "7,2"]
    ]
  },
  "winner_slug": "churrasqueira-weber-smokey-joe",
  "verdict_by_profile": [
    { "profile": "Pai de apartamento", "product_slug": "churrasqueira-weber-smokey-joe", "why": "Tampa e portabilidade." },
    { "profile": "Família grande", "product_slug": "churrasqueira-tramontina-tcp-460", "why": "Maior grelha pelo preço." },
    { "profile": "Orçamento apertado", "product_slug": "churrasqueira-mor-apolo", "why": "Faz o básico por menos de R$ 250." }
  ],
  "how_we_evaluated": "Mesmos 5 critérios do review individual, mesmos pesos."
}
```

`role` ∈ `vencedor | custo-beneficio | premium | economica | alternativa`. Todo `product_slug` deve existir em `products`. `kind='lista'` usa o mesmo objeto sem `table` e com `products[]` ordenado (posição = ranking); `winner_slug` = primeiro da lista. `posts.product_score` em comparativo/lista = nota do vencedor.

### 5.5 FAQ e quiz (`posts.faq`, `posts.quiz`) — formato herdado do VDM/Portal da AI

```json
[
  { "question": "Churrasqueira portátil serve para apartamento?", "answer": "Sim, desde que a varanda seja aberta e o condomínio permita carvão. Prefira modelos com tampa." }
]
```

```json
[
  { "question": "Qual a temperatura ideal da brasa para picanha?", "options": ["150 °C", "250 °C", "400 °C", "600 °C"], "answer": 1, "explanation": "Entre 230 e 280 °C a gordura derrete sem queimar." }
]
```

FAQ: 3–6 itens, vira JSON-LD `FAQPage`. Quiz: 3–5 perguntas, 4 opções, `answer` é índice 0-based.

---

## 6. Design system

### 6.1 Tokens CSS (`src/styles.css`, substitui o bloco `@layer base` do VDM)

Tailwind 4: cores em `@theme` mapeadas para variáveis em `:root`/`.dark`. Mantemos o formato HSL "h s% l%" do shadcn para compatibilidade com `components/ui/*`.

```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";
@custom-variant dark (&:is(.dark *));

@theme {
  --font-display: "Barlow Condensed", "Arial Narrow", sans-serif;
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;

  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-danger: hsl(var(--danger));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);

  --shadow-soft: 0 10px 30px -12px hsl(var(--primary) / 0.18);
  --shadow-elegant: 0 18px 50px -20px hsl(var(--primary) / 0.35);
}

@layer base {
  :root {
    /* Areia + azul-petróleo + âmbar/couro — tema claro */
    --background: 40 39% 93%;          /* #F4EFE6 areia */
    --foreground: 210 13% 12%;         /* #1B1F23 texto */
    --card: 40 50% 97%;                /* #FAF7F1 */
    --card-foreground: 210 13% 12%;
    --popover: 40 50% 97%;
    --popover-foreground: 210 13% 12%;
    --primary: 190 64% 22%;            /* #14505C azul-petróleo */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 14% 14%;          /* #1F2429 grafite */
    --secondary-foreground: 40 39% 93%;
    --accent: 28 69% 51%;              /* #D9822B âmbar/couro */
    --accent-foreground: 0 0% 100%;
    --muted: 40 20% 86%;
    --muted-foreground: 210 8% 38%;
    --destructive: 0 51% 46%;          /* #B23A3A */
    --destructive-foreground: 0 0% 100%;
    --success: 143 45% 34%;            /* #2F7D4F */
    --warning: 43 76% 48%;             /* #D9A21B */
    --danger: 0 51% 46%;               /* #B23A3A */
    --border: 40 18% 80%;
    --input: 40 18% 80%;
    --ring: 190 64% 22%;
    --radius: 0.75rem;
    --gradient-hero: linear-gradient(135deg, hsl(190 64% 22%) 0%, hsl(190 55% 30%) 60%, hsl(28 69% 51%) 140%);
  }
  .dark {
    --background: 210 17% 9%;          /* #14181C fundo escuro */
    --foreground: 40 30% 92%;
    --card: 210 14% 14%;               /* #1F2429 cartões */
    --card-foreground: 40 30% 92%;
    --popover: 210 14% 14%;
    --popover-foreground: 40 30% 92%;
    --primary: 190 50% 42%;            /* petróleo clareado p/ contraste */
    --primary-foreground: 210 17% 9%;
    --secondary: 210 12% 22%;
    --secondary-foreground: 40 30% 92%;
    --accent: 28 75% 58%;
    --accent-foreground: 210 17% 9%;
    --muted: 210 12% 18%;
    --muted-foreground: 40 10% 65%;
    --destructive: 0 55% 55%;
    --destructive-foreground: 0 0% 100%;
    --success: 143 40% 45%;
    --warning: 43 80% 58%;
    --danger: 0 55% 55%;
    --border: 210 12% 22%;
    --input: 210 12% 22%;
    --ring: 190 50% 42%;
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  h1, h2, h3, h4 { @apply font-display font-semibold tracking-tight uppercase; letter-spacing: 0.01em; }
  h1 { @apply text-4xl md:text-5xl; }
  h2 { @apply text-3xl md:text-4xl; }
  h3 { @apply text-2xl; }
}
```

### 6.2 Tipografia e espaçamento

- Títulos: **Barlow Condensed** 600/700, caixa alta em H1/H2 (identidade masculina, "placa de oficina"). Corpo: **Inter** 400/500/600, 17px no artigo (`prose-lg`), line-height 1.7.
- Carregar via Google Fonts no `__root.tsx`: `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap` com `<link rel="preconnect">`.
- Escala de espaçamento: Tailwind padrão; seções da home com `py-12 md:py-20`; container `max-w-7xl px-6`; artigo `max-w-3xl`.
- Raio: `--radius: 0.75rem` (cantos menos arredondados que o VDM, 1rem). Sombras discretas; sem gradientes pastel.

### 6.3 Componentes-chave (contratos)

| Componente | Props | Comportamento |
|---|---|---|
| `ReviewBadge` | `{ score: number; size?: 'sm'|'md'|'lg'; label?: string }` | Círculo com a nota (1 casa, vírgula). Cor: ≥8.5 `success`, 7–8.4 `primary`, 5–6.9 `warning`, <5 `danger`. `aria-label="Nota 8,7 de 10"`. |
| `ScoreScaleNote` | `{ compact?: boolean }` | Texto fixo: "Notas de 0 a 10. Acima de 8,5: excelente; 7 a 8,4: bom; 5 a 6,9: regular; abaixo de 5: evite. Avaliação independente; links de afiliado não mudam a nota." |
| `PriceRange` | `{ min: number|null; max: number|null; checkedAt: string|null }` | "Faixa de preço: R$ 520 a R$ 690 (pesquisado em 20/10/2026)". Nunca exibe preço único; se nulos mostra "Consulte o preço na Amazon". |
| `AffiliateButton` | `{ href: string; productSlug: string }` | Texto **sempre** "Comprar agora na Amazon". `rel="sponsored nofollow noopener"`, `target="_blank"`, anexa `?tag=VITE_AMAZON_TAG` se ausente, dispara GA4 `affiliate_click {product_slug}`; fundo `accent`, ícone `ShoppingCart`. |
| `SemaforoCallout` | `{ tone: 'ok'|'warn'|'bad'; children }` | Borda esquerda 4px na cor do tom, ícone (`CheckCircle2`/`AlertTriangle`/`OctagonAlert`), prefixo em negrito inserido automaticamente se ausente. |
| `SectionHeader` | `{ eyebrow?: string; title: string; description?: string; href?: string; hrefLabel?: string }` | Eyebrow em `accent` caixa alta, título `font-display`, link "Ver tudo →" à direita. |
| `KindBadge` | `{ kind: 'review'|'comparativo'|'lista'|'artigo'|'noticia' }` | Pílula: Review / Comparativo / Lista / Artigo / Notícia. |
| `AffiliateDisclosure` | — | Caixa `muted`: "Este conteúdo tem links de afiliado da Amazon. Se você comprar por eles, o Vocação de Pai recebe uma comissão, sem custo extra para você." |
| `MarketTicker` | `{ items: {label, value, changePct}[] }` | Faixa horizontal na home (dólar, euro, bitcoin, Ibovespa) lendo `market_cache`. |

### 6.4 Logo e modo escuro

- Logo: wordmark "VOCAÇÃO DE PAI" em Barlow Condensed 700, caixa alta, cor `primary`; símbolo: escudo simples com duas silhuetas (pai e filho) em traço único, cor `accent`. Arquivos `public/logo.svg` (claro), `public/logo-dark.svg` (escuro, wordmark em areia), `favicon.svg` (só o escudo). Altura no header: 36px desktop, 28px mobile.
- Modo escuro via `next-themes` (`attribute="class"`, `defaultTheme="system"`), toggle no header. Imagens de capa recebem `brightness-95` no dark. Callouts do semáforo mantêm cores acessíveis (contraste ≥ 4.5:1). Gráficos do mercado financeiro usam `--primary`, `--accent`, `--success`, `--danger`.

---

## 7. SEO e infraestrutura

| Item | Decisão |
|---|---|
| Domínio | `vocacaodepai.com.br` (apex) com redirect 308 de `www.` para apex. DNS na Vercel. |
| Vercel | Projeto `vocacaodepai` no time **"Portal da AI"**, framework preset "Other", build `npm run build`, output `.vercel/output` (Nitro preset `vercel`), Node 22. Env vars na seção 8. **Um único** Vercel Cron em `vercel.json` (`/api/cron/jobs-expire`, `15 3 * * *`) porque o plano Hobby limita a 1 execução/dia; o `market-sync` a cada 30 min roda por **GitHub Actions schedule** (`.github/workflows/market-sync.yml`) com fallback pg_cron diário. |
| Sitemap | `src/routes/sitemap[.]xml.ts` gera dinamicamente: estáticas (home, seções, institucionais), `/post/$slug` e `/pai-indica/$slug` (posts publicados; `lastmod = updated_at`), `/categoria/$slug`, `/loja/$slug` (ativos), `/loja/categoria/$slug`, `/ferramentas/$slug`, `/pai-indica-pai/vagas/$slug` (aprovadas e não expiradas), `/formacao/$slug`, `/desafios/$slug`, `/perguntas/$slug` (aprovadas), `/historias/$id` (aprovadas). Cache `s-maxage=3600`. Referenciado em `public/robots.txt`. |
| RSS | `src/routes/rss[.]xml.ts` (pacote `feed`): últimos 30 posts publicados, `<content:encoded>` com HTML do `tiptap-html.ts`, categorias, autor. Link `<link rel="alternate" type="application/rss+xml">` no `__root.tsx`. |
| OG image | `src/routes/api/og.ts` (`@vercel/og`): 1200×630, fundo `primary`, faixa `accent`, título (Barlow Condensed), `KindBadge` e `ReviewBadge` quando `kind=review`, logo. Query: `?title=&kind=&score=&category=`. Cache `s-maxage=86400`. Fallback estático `public/og-default.png`. |
| JSON-LD (em `src/lib/seo.ts`) | Home: `WebSite` + `SearchAction` + `Organization`. Post `artigo`/`noticia`: `Article`/`NewsArticle` + `BreadcrumbList` + `FAQPage` (se `faq`). `review`: `Review` com `itemReviewed` (`Product`, `brand`) e `reviewRating {ratingValue, bestRating:10}` + `Article`. `comparativo`/`lista`: `ItemList` com `ListItem` → `Product`. Loja `/loja/$slug`: `Product` com `offers` **sem** `price` fixo (usar `priceSpecification` com `minPrice`/`maxPrice`, `priceCurrency: BRL`) + `AggregateRating` se `rating_count>0`. Vaga: `JobPosting` (`title`, `hiringOrganization`, `jobLocation`, `employmentType` mapeado de `type`, `validThrough = expires_at`, `baseSalary` se informado). Evento: `Event`. Trilha: `Course`. Ferramenta: `SoftwareApplication` (`applicationCategory: FinanceApplication`). Pergunta: `QAPage`. |
| Analytics | `@vercel/analytics` (`<Analytics />`) + GA4 via `src/lib/ga4.ts` (ID em `VITE_GA4_ID`), eventos: `affiliate_click`, `tool_use`, `newsletter_subscribe`, `job_view`, `job_post`, `challenge_day_done`. Consentimento: banner simples (LGPD) antes de GA4/AdSense. |
| Search Console | Verificação por DNS TXT; propriedade de domínio. Edge function `seo-search-console` (copiada do VDM) grava em `seo_search_stats` 1x/dia; o admin e o Painel Lisieux leem via `hub.functions.ts`. |
| AdSense | `public/ads.txt` com `google.com, pub-<ADSENSE_PUB_ID>, DIRECT, f08c47fec0942fa0`; script carregado em `__root.tsx` só após consentimento; `AdSlot` nas posições: após o 1º H2, meio do artigo, fim do artigo, sidebar da listagem. Nunca em `/admin`, `/area-do-pai`, `/minha-conta`, `/entrar`, `/cadastro`. |
| Páginas obrigatórias (AdSense + Amazon Associados) | `/sobre` (quem somos, equipe, linha editorial), `/contato` (formulário funcional), `/politica-de-privacidade` (LGPD, cookies, GA4, AdSense), `/termos-de-uso`, `/politica-de-afiliados` com a frase exigida pela Amazon: "Como associado da Amazon, o Vocação de Pai recebe comissões por compras qualificadas." Rodapé linka as cinco. |
| Imagens | Capas via `stock-photos` (Pexels/Wikimedia) com crédito em `cover_image_alt`/legenda; proxy `/api/img/*` com resize e cache 1 ano; `loading="lazy"` fora da dobra; `width/height` sempre definidos. |
| Performance | SSR + cache `s-maxage=300, stale-while-revalidate=3600` nas páginas públicas; `react-query` com `staleTime` 5 min; fontes com `display=swap`; LCP alvo < 2,5 s. |
| Painel Lisieux | `hub.functions.ts` expõe `GET /api/hub/metrics` (autenticado por `HUB_API_KEY`) com views 7/30d, posts publicados, produtos ativos, cliques de afiliado (GA4), `tool_usage_stats`, vagas aprovadas, membros ativos. O grupovdp consome e exibe o VDP ao lado dos outros sites. |

---

## 8. Variáveis de ambiente e secrets

| Nome | Onde | Para quê |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel (todas as envs) · `.env` local | URL `https://<SUPABASE_PROJECT_REF>.supabase.co` usada pelo cliente e SSR |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vercel · `.env` local | Chave anon/publishable (pública, protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (só server) · GitHub Actions (secret) | Server functions administrativas (rotina, cron, admin stats). Nunca no cliente. |
| `SUPABASE_PROJECT_REF` | GitHub Actions · `.env` local | `supabase gen types`, scripts da rotina, URL da edge function no `market-sync.yml` |
| `SUPABASE_ACCESS_TOKEN` | GitHub Actions | CLI Supabase (deploy de edge functions) |
| `SUPABASE_DB_PASSWORD` | GitHub Actions | `supabase db push` (fallback quando não usar MCP) |
| `CRON_SECRET` | Vercel · GitHub Actions · Supabase Vault · Supabase Edge Function secrets | Autoriza `/api/cron/*`, o `market-sync.yml` e as edge functions `market-sync`/`jobs-expire` |
| `RESEND_API_KEY` | Vercel (server) · Supabase Vault (edge `notify-contact-message`, `newsletter-send`) | Envio de e-mails |
| `RESEND_FROM` | Vercel | Ex.: `Vocação de Pai <contato@vocacaodepai.com.br>` |
| `CONTACT_TO_EMAIL` | Vercel · Vault | Destino do formulário de contato (Bruno) |
| `VITE_GA4_ID` | Vercel · `.env` local | `G-XXXXXXXXXX` |
| `VITE_ADSENSE_PUB_ID` | Vercel · `.env` local | `pub-XXXXXXXXXXXXXXXX` (também em `public/ads.txt`) |
| `VITE_AMAZON_TAG` | Vercel · `.env` local · GitHub Actions | Tag de Associado (`vocacaodepai-20`) anexada a toda `affiliate_url` |
| `VITE_SITE_URL` | Vercel · `.env` local | `https://vocacaodepai.com.br` (canonical, OG, sitemap) |
| `AWESOMEAPI_TOKEN` | Supabase Edge Function secrets (`market-sync`) | Token gratuito da AwesomeAPI (câmbio USD/EUR/GBP/ARS/BTC). BCB SGS/PTAX não exige chave. |
| `BRAPI_TOKEN` | Supabase Edge Function secrets | Cotações B3 (brapi.dev, 15k req/mês) |
| `PEXELS_API_KEY` | Supabase Edge Function secrets (`stock-photos`) · GitHub Actions | Busca de capas |
| `GSC_SERVICE_ACCOUNT_JSON` | Supabase Edge Function secrets (`seo-search-console`) | Conta de serviço do Search Console |
| `ANTHROPIC_API_KEY` | GitHub Actions | Rotina diária (Claude Code Routine) |
| `CLAUDE_CODE_OAUTH_TOKEN` | GitHub Actions | Alternativa ao API key para a rotina |
| `GH_PAT_AUTOMERGE` | GitHub Actions | Token com permissão de merge para `auto-merge.yml` |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | GitHub Actions (opcional) | Deploy manual/preview por CLI |
| `HUB_API_KEY` | Vercel (server) · grupovdp | Autoriza o Painel Lisieux a ler `/api/hub/metrics` |
| `MERCADOPAGO_ACCESS_TOKEN` | Vercel (server) — fase futura | Assinatura paga (plano pago da Área do Pai) |

`.env.example` lista todas com valor vazio e comentário. `.env` está no `.gitignore`.

---

## 9. Convenções de execução para o Sonnet

1. **Branch**: toda sessão trabalha em `claude/<fase>-<assunto>` (ex.: `claude/fase-1-fundacao`, `claude/rotina-2026-10-25`). Nunca commitar direto em `main`.
2. **PR**: título em PT-BR no imperativo ("Cria migrations 0001–0007 e layout base"); corpo com o checklist de aceite da fase e o link do doc; label `claude`. `auto-merge.yml` mescla PRs `claude/*` com checks verdes.
3. **Validações obrigatórias antes do push**: `npm run build && npm run lint && npm run typecheck`; se tocou `supabase/migrations/2026*`, também `npm run validate:content`. Build quebrado = não faz push.
4. **Migrations de schema** (0001–0007 e futuras `0008+`): aplicar com `mcp__Supabase__apply_migration` no projeto `<SUPABASE_PROJECT_REF>` com `name` igual ao arquivo (sem `.sql`) e, no mesmo commit, salvar o arquivo em `supabase/migrations/`. Depois rodar `mcp__Supabase__get_advisors` (security + performance) e corrigir avisos antes do PR. Revisar o SQL antes de aplicar (ex.: nomes de funções referenciadas já existem na ordem).
5. **Migrations de conteúdo** (rotina): nome `AAAAMMDDHHMMSS_<descricao>.sql`; só `insert ... on conflict (slug) do update` em `posts`/`products`/`product_price_checks`; **nunca** `DROP`, `DELETE`, `TRUNCATE`, `ALTER TABLE` em rotina.
6. **Staging table**: a rotina grava o JSON do body em `_tmp_post_staging (k, data)` via `apply_migration`, valida (`validate-content.mjs` lê a staging), promove para `posts` com `insert … select data::jsonb …` e limpa a chave (`delete from _tmp_post_staging where k = …` é a única exceção permitida ao "nunca DELETE", restrita a essa tabela).
7. **Tipos**: após qualquer migration de schema, `npm run types:supabase` e commitar `src/integrations/supabase/types.ts`.
8. **Commits em PT-BR**, imperativo, ≤ 72 caracteres no título, corpo explicando o porquê. Terminar com as linhas de atribuição `Co-Authored-By` e `Claude-Session` fornecidas pelo ambiente.
9. **Sem segredos no repositório**: nunca colar chaves em código, migrations ou docs; usar `get_secret()`/env.
10. **Linha editorial**: respeitar `docs/plano/00-visao-posicionamento-e-marca.md` (família tradicional, tom direto e respeitoso); o `validate-content.mjs` bloqueia termos proibidos e preços exatos.
11. **Rotas**: só criar rotas listadas na seção 1.3; rota nova exige atualizar este doc, o sitemap e o JSON-LD.
12. **Progresso**: ao fim de cada sessão, atualizar `docs/plano/PROGRESSO.md` (data, fase, o que foi feito, o que falta, links de PR).
13. **Esforço**: não refatorar o que não foi pedido; copiar do VDM quando marcado `[COPIAR]`; perguntar só se um critério de pronto for impossível.

---

## 10. Fases

| Id | Título | Objetivo | Doc | Dependências | Critério de pronto |
|---|---|---|---|---|---|
| F1 | Fundação | Clonar VDM, remover Lovable/MCP/i18n/maternidade, aplicar 0001–0007, tokens de design, layout, home, blog, busca, institucionais, auth básica, deploy na Vercel com domínio | `03-fase-1-fundacao.md` | — | `npm run build && lint && typecheck` verdes; 7 migrations aplicadas sem avisos críticos no advisor; home, `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca`, `/sobre`, `/contato`, `/politica-*`, `/termos-de-uso`, `/entrar`, `/cadastro` renderizam em produção; sitemap e RSS respondem 200; 10 posts seed publicados |
| F2 | Pai Indica (reviews) | Kinds `review`/`comparativo`/`lista`, componentes ReviewBadge/ScoreScaleNote/ComparisonTable, listagem com filtros, JSON-LD Review/ItemList, editor admin com ReviewFields, validador de review | `04-fase-2-pai-indica-reviews.md` | F1 | `/pai-indica` lista e filtra por kind/categoria; 3 reviews, 2 comparativos e 1 lista publicados; `validate-content.mjs` valida `review`/`comparison`; OG image com nota |
| F3 | Loja do Pai | Produtos, categorias, faixa de preço, AffiliateButton, review longa, páginas `/loja*`, admin de produtos, JSON-LD Product com faixa | `05-fase-3-loja.md` | F1 | 30 produtos ativos em ≥ 6 categorias, todos com `price_min/max` válidos e `affiliate_url` com tag; `/loja/categoria/$slug` filtra; produto exibe reviews relacionados (`posts_for_product`) |
| F4 | Caixa de Ferramentas | Registro de ferramentas, conversor de moedas, mercado financeiro (recharts), 6 calculadoras, edge function `market-sync` + `market-sync.yml`, `tool_usage` | `06-fase-4-ferramentas.md` | F1 | `/ferramentas/conversor-de-moedas` converte 6 moedas com dados < 30 min; `/ferramentas/mercado-financeiro` mostra 4 indicadores + gráfico 30 dias; `market_cache` atualizada pelo workflow; `track_tool_usage` registra |
| F5 | Área do Pai (membros) | Onboarding, painel `/area-do-pai`, `/minha-conta`, filhos, itens salvos, badges, plano gratuito, cookies de sessão SSR | `07-fase-5-area-do-pai-membros.md` | F1 | Cadastro → onboarding → painel em < 3 cliques; `get_member_dashboard` alimenta o painel; salvar post/produto funciona; badge `primeiro-passo` concedida; AdSense ausente nas páginas de membro |
| F6 | Pai Indica Pai | Vagas (criar, listar, filtrar, moderar, expirar), indicações, profissionais, mentoria, JSON-LD JobPosting, e-mails de moderação | `08-fase-6-pai-indica-pai.md` | F5 | Membro publica vaga → fica `pending` → admin aprova em `/admin/moderacao` → aparece em `/pai-indica-pai/vagas` e no sitemap; `expire_jobs` roda; indicação chega ao dono da vaga; `/profissionais` e `/mentoria` listam aprovados |
| F7 | Irmandade e Formação | Histórias, perguntas/respostas, eventos com RSVP, trilhas com progresso, desafios diários, badges, editor admin de trilhas/desafios/eventos | `09-fase-7-irmandade-e-formacao.md` | F5 | 2 trilhas (≥ 5 passos) e 2 desafios (21 e 30 dias) publicados; concluir trilha concede `formador`; perguntas moderadas; evento com contagem de RSVP; `/irmandade` resume as três áreas |
| F8 | Automação, rotinas e painel | `rotina.yml` diária (artigo + review/comparativo/lista alternados + 5 produtos), staging table, `validate-content.yml`, `seo-search-console`, `newsletter-send`, integração com Painel Lisieux (`/api/hub/metrics`), GA4/AdSense/Search Console ativos | `10-fase-8-automacao-rotinas-e-painel.md` | F2, F3, F4 | Rotina abre PR `claude/rotina-*` com conteúdo validado e auto-merge; 7 dias seguidos sem falha; Painel Lisieux exibe views, SEO e uso de ferramentas do VDP; newsletter semanal enviada para confirmados |

Ordem recomendada de execução: F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 (F2–F4 podem rodar em paralelo após F1; F6 e F7 em paralelo após F5).
