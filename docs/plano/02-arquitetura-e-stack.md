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
│  TanStack    │ ───────────────► │   functions.ts) │ ──────────────► │ notify-contact  │
│  Router/Query│                  │  Resend, OG,    │                 │ seo-search-cons.│
│  Tiptap (adm)│                  │  sitemap, RSS   │                 │ stock-photos    │
└──────┬───────┘                  └────────┬────────┘                 │                 │
       │ anon key + JWT (RLS)              │                          └────────┬────────┘
       │                                   │                                   │
       └───────────────┬───────────────────┘                                   │
                       │                                                       │
              ┌────────▼────────────────────────────────────────────────────────▼─────┐
              │  Supabase (projeto NOVO, região sa-east-1, ref <SUPABASE_PROJECT_REF>) │
              │  Postgres 15 + RLS + RPC (search_posts, get_home_data, ...)            │
              │  Auth (e-mail/senha + Google) · Storage (covers, products, avatars)    │
              │  Vault (RESEND_API_KEY, CRON_SECRET) · pg_cron (expire_jobs)           │
              │  0001_core … 0007_ferramentas + 0008_cron (vdp-expire-jobs)            │
              └──────────────────────────────────────────────────────────────────────┘
                       ▲                                   ▲
                       │ Supabase MCP (apply_migration)    │ GitHub Actions (schedule)
              ┌────────┴────────┐                 ┌────────┴────────────────────────┐
              │ Claude Code     │                 │ .github/workflows               │
              │ + Routine diária│                 │  auto-merge.yml (claude/*)      │
              │ branch claude/* │ ──── PR ──────► │  validate.yml (build+validador) │
              └─────────────────┘                 │  market-refresh.yml (*/30 min)  │
                                                  │  newsletter-weekly.yml (sexta)  │
                       │                          └─────────────────────────────────┘
              ┌────────▼────────┐    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
              │ Painel Lisieux  │    │ GA4          │   │ Search Cons. │   │ AdSense /    │
              │ (grupovdp)      │◄───│ + Vercel     │   │ (edge fn)    │   │ Amazon Assoc.│
              └─────────────────┘    │   Analytics  │   └──────────────┘   └──────────────┘
                                     └──────────────┘
   Fontes externas de mercado (sem chamadas a partir do navegador):
   BCB SGS/PTAX (sem chave: Selic, IPCA, CDI, dólar PTAX) · AwesomeAPI (sem chave: USD/EUR/GBP/ARS/BTC; se falhar, PTAX) ·
   Brapi (BRAPI_TOKEN opcional: Ibovespa, ações) · CoinGecko (BTC/ETH em BRL) · Tesouro Direto — tudo via src/lib/market/* (doc 06)
```

### 1.2 Princípios de arquitetura (decididos)

1. **Um só repositório** (`vocacaodepai/vocacaodepai`), um só app TanStack Start, SSR na Vercel. Sem monorepo.
2. **Supabase é a única fonte de dados** (conteúdo, loja, membros, comunidade, cache de mercado). Nenhum conteúdo em arquivos TS como no Portal da AI: tudo vai para `posts`/`products` via migrations ou admin.
3. **RLS em todas as tabelas**, sem exceção. Leitura pública só de linhas publicadas/aprovadas/ativas. Escrita de staff via `is_admin()` (baseada em `profiles.role`). Tabelas internas (`seo_search_stats`, `tool_usage`, `moderation_log`, `_tmp_post_staging`, `post_view_events`) só pela `service_role` ou RPC `security definer`.
4. **Conteúdo editorial em JSON Tiptap** (`posts.body jsonb`), mesmo formato do Vocação de Mãe (inclusive os nodes customizados `callout`, `fotosModelos`, `buyCard`, `galeriaProduto`, `decisorRapido`, `toolEmbed`), para reaproveitar editor, renderizador (`tiptap-html.ts`) e a rotina automática de artigos.
5. **Reviews são posts** com `kind` (`review`, `comparativo`, `lista`) e campos estruturados `review jsonb` / `comparison jsonb`, exatamente como o "AI Indica" do Portal da AI, mas no banco.
6. **Loja = produtos com afiliado Amazon** (botão sempre "Comprar agora na Amazon"; faixa de preço, nunca preço exato).
7. **Ferramentas de mercado** (conversor de moedas, mercado financeiro) leem de `market_cache` abastecida pela server route `POST /api/market/refresh` (`src/lib/market/refresh.ts`, doc 06 §2.6), acionada por `.github/workflows/market-refresh.yml` **a cada 30 min** com `Authorization: Bearer CRON_SECRET` (Vercel Cron no plano Hobby só permite 1x/dia; sem edge function e sem pg_cron para mercado). O padrão stale-while-error de `src/lib/market/cache.ts` cobre atrasos. Nunca chamam API externa a partir do navegador.
8. **Automação diária** = **Routine do Claude Code** (doc 10 §2; volumes diários fixos no doc 10 §2.2), não GitHub Actions: gera artigos, Pai Indica, produtos e notícia em branch `claude/rotina-*` com PR auto-mesclável, igual ao Vocação de Mãe. Em `.github/workflows` ficam só `auto-merge.yml`, `validate.yml`, `market-refresh.yml` e `newsletter-weekly.yml`.
9. **Assinatura paga futura via Mercado Pago** (Pix, boleto, cartão nacional, sem exigir CNPJ internacional); `plans`/`subscriptions` já modelados com `provider = 'mercadopago'`.

### 1.3 Seções oficiais e rotas (copiadas das DECISÕES FIXAS)

| Seção | Rotas | O que é |
|---|---|---|
| **Blog** | `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca` | Artigos sobre paternidade, casamento, finanças da família, saúde do homem, churrasco e cortes de carne, carro, casa, fé. É o coração de SEO/AdSense. Lista paginada, filtros por categoria, busca full-text (`search_posts`). Posts têm FAQ e quiz opcionais, semáforo do pai nos callouts e autor com byline. |
| **Pai Indica** | `/pai-indica`, `/pai-indica/$slug` | Reviews de produtos para o pai e a família: **individual** (`kind='review'`, nota 0-10 com 5 critérios), **comparativo** (`kind='comparativo'`, tabela de produtos e vencedor por perfil) e **lista** (`kind='lista'`, "os 7 melhores…"). Mesma tabela `posts`; a listagem filtra por `kind` e por `product_category`/`product_subcategory`. Badge de nota, nota de escala e disclosure de afiliado em toda página. |
| **Loja do Pai** | `/loja`, `/loja/categoria/$slug`, `/loja/$slug` | Slogan **"O pai também quer desconto"**. Catálogo de `products` com afiliado Amazon Associados BR, faixa de preço pesquisada (2 lojas, max ≤ 3×min), review longa por produto, prós/contras, categorias próprias (`product_categories`). Página de produto linka para os posts de Pai Indica que citam o produto. |
| **Caixa de Ferramentas** | `/ferramentas`, `/ferramentas/$slug`; destaques `/ferramentas/conversor-de-moedas` e `/ferramentas/mercado-financeiro` | Calculadoras e utilitários: conversor de moedas (BRL/USD/EUR/GBP/ARS/BTC), painel do mercado financeiro (dólar PTAX, euro, Ibovespa, Selic, IPCA, CDI, bitcoin), calculadora de churrasco, custo de um filho, simulador de reserva de emergência, orçamento familiar, juros compostos, checklist do enxoval do pai. Cada ferramenta registra uso em `tool_usage`. |
| **Área do Pai** | `/area-do-pai` (painel), `/minha-conta`, `/entrar`, `/cadastro` | Membros. Painel com progresso nas trilhas, desafios ativos, itens salvos, badges, filhos cadastrados (`children`) e vagas que o pai indicou. Plano gratuito no lançamento; `plans`/`subscriptions` prontos para plano pago (Mercado Pago). |
| **Pai Indica Pai** | `/pai-indica-pai`, `/pai-indica-pai/vagas`, `/pai-indica-pai/vagas/$slug`, `/pai-indica-pai/vagas/nova`, `/pai-indica-pai/profissionais`, `/pai-indica-pai/mentoria` | Rede de indicação entre pais: vagas de trabalho (`jobs`, com moderação e expiração em 45 dias), indicações de profissional, serviço ou empresa (`job_referrals`, `kind in ('profissional','servico','empresa')`, rota `/pai-indica-pai/indicacoes`), diretório de profissionais pais (`professionals`: "o pai eletricista", "o pai contador"; quem marca `is_mentor` vira mentor) e mentoria (`mentorships`: pedido do mentorado a um `professionals.is_mentor`, aceite via `respond_mentorship`). Tudo passa por `status` e moderação no admin. Modelo de dados = doc 08 §2.2. |
| **Irmandade** | `/irmandade`, `/historias`, `/historias/$id`, `/historias/nova`, `/perguntas`, `/perguntas/$slug`, `/eventos` | Comunidade: histórias de pais (`stories`, herdado do VDM), perguntas e respostas (`questions`/`answers`, estilo fórum moderado), eventos presenciais/online (`events`/`event_rsvps`: encontro de pais, retiro, live). `/irmandade` é o hub que resume as três. |
| **Formação** | `/formacao`, `/formacao/$slug`, `/desafios`, `/desafios/$slug` | Trilhas de formação do homem e do pai (`tracks`/`track_steps`, progresso em `track_progress`) e desafios de N dias (`challenges`/`challenge_days`, progresso em `challenge_progress`, ex.: "30 dias de presença", "21 dias de oração em família"). Concluir rende `badges`. |
| **Institucional** | `/sobre`, `/contato`, `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-afiliados` | Páginas obrigatórias para AdSense e Amazon Associados. Contato grava em `contact_messages` e dispara e-mail via Resend. |
| **Admin** | `/admin` (+ `/admin/editor`, `/admin/editor/$id`, `/admin/produtos`, `/admin/produtos/novo`, `/admin/produtos/fila-fotos`, `/admin/produtos/fila-precos`, `/admin/moderacao`, `/admin/pai-indica-pai`, `/admin/membros`, `/admin/formacao`, `/admin/eventos`, `/admin/login`) | Editor Tiptap, produtos, moderação de vagas/indicações/profissionais/histórias/perguntas/comentários, membros, logs de moderação (`moderation_log`). Acesso só para `profiles.role in ('admin','editor')`. |

**Rotas secundárias (criadas no doc da fase; valem como oficiais, mesma regra 11 do §9):**

| Seção | Rotas secundárias | Doc de origem |
|---|---|---|
| Blog | `/rss.xml`, `/blog/por-idade` (hub por fase do filho), `/autor/$slug` | doc 03 §6.5, doc 00 §3.6, doc 11 §8.3 |
| Pai Indica | `/politica-editorial` ("Como avaliamos") | doc 11 §8.3 |
| Loja do Pai | `/loja/ofertas`, `/loja/presentes` (hub de presentes = rota/tag, **não** categoria de produto), `/loja/digital/$slug` (página de vendas de produto digital próprio, checkout Hotmart, sem AdSense) | doc 00 §6, doc 11 §7 e §12, doc 09 §12b |
| Caixa de Ferramentas | os 17 slugs fixos do doc 06 §0.2: `/ferramentas/{conversor-de-moedas, mercado-financeiro, custo-do-filho, licenca-paternidade, calculadora-de-churrasco, cortes-de-carne, orcamento-familiar, juros-compostos, reserva-de-emergencia, pensao-alimenticia, conversor-de-unidades, kit-de-ferramentas, nomes-de-filhos, calendario-de-vacinacao, marcos-do-desenvolvimento, imc-e-gasto-calorico, checklist-da-maternidade}`; `POST /api/market/refresh` | doc 06 §0.2, §2.6 |
| Área do Pai | `/recuperar-senha`, `/auth/callback`, `/area-do-pai/onboarding`, `/area-do-pai/filhos`, `/area-do-pai/salvos`, `/area-do-pai/planos`, `/area-do-pai/biblioteca` (Biblioteca do Pai: e-books/planilhas por compra ou plano `pai-de-valor`), `/newsletter/confirmar`, `/newsletter/sair`, `/newsletter/preferencias`, `/newsletter/obrigado`, `/admin/membros`, `POST /api/webhooks/mercadopago` (responde 503 até a cobrança ser ligada), `/api/newsletter/weekly`, `/api/newsletter/unsubscribe` | doc 07 §0, §4.7, §7.3; doc 11 §5.2; doc 10 §8.2; doc 09 §12b |
| Pai Indica Pai | `/pai-indica-pai/indicacoes`, `/pai-indica-pai/indicacoes/nova`, `/pai-indica-pai/profissionais/$slug`, `/pai-indica-pai/profissionais/novo`, `/pai-indica-pai/vagas/feed.xml`, `/sitemap-vagas.xml`, `/api/cron/expire-jobs` (disparo manual), `/api/cron/vagas-digest`, `/admin/pai-indica-pai` | doc 08 §3, §5, §8 |
| Irmandade | `/perguntas/nova`, `/eventos/$slug` | doc 09 §0 |
| Institucional | `/politica-editorial`, `/anuncie` (mídia kit, Fase 8), `/autor/$slug` | doc 11 §1, §8.3 |
| Admin | `/admin/produtos/novo`, `/admin/produtos/fila-fotos`, `/admin/produtos/fila-precos`, `/admin/pai-indica-pai`, `/admin/membros` | doc 05 §7, doc 08 §6, doc 07 §10 |
| Integração | `GET /api/hub/metrics` (Painel Lisieux, `Authorization: Bearer CRON_SECRET`) | §7 deste doc, doc 10 §11 |
| Futuro (não implementar sem decisão do dono) | `/podcast` (checklist 8.10) | doc 13 |

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
| Credenciais hardcoded | `src/integrations/supabase/client.ts` (URL/anon key do VDM) | Ler só de `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (§8). Em `vite.config.ts`, passar `vite: { envPrefix: ["VITE_", "PUBLIC_", "TURNSTILE_SITE_KEY"] }` ao `defineConfig` para que `PUBLIC_*` e a site key do Turnstile cheguem ao cliente |
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
| `jose` | `^5.9.6` | Validar JWT nas rotas `api/*` quando necessário; as rotas de cron/refresh/hub comparam `Authorization: Bearer CRON_SECRET` (comparação em tempo constante) |
| dev: `tsx` `^4.19.2` | | Rodar `scripts/rotina/backlog.mjs`, `scripts/validate-content.mjs` e scripts `.ts` auxiliares. Os geradores da rotina são **Python 3** (`scripts/rotina/*.py`, doc 10 §4.1) — sem dependência npm |

Não adicionar agora: Next.js, Prisma, tRPC, Stripe (assinatura paga virá com **Mercado Pago** em fase futura), i18n, CMS externo. `recharts` já existe — não instalar outra lib de gráficos. `slugify` já existe em `src/lib/slugify.ts`.

---

## 3. Árvore completa do novo repositório

Legenda: `[COPIAR de vocacaodemae:<path>]` = copiar e só trocar textos/imports; `[ADAPTAR]` = copiar e mudar lógica/campos; `[NOVO]` = criar do zero.

```
vocacaodepai/
├── .github/
│   └── workflows/
│       ├── auto-merge.yml                      [COPIAR de vocacaodemae:.github/workflows/auto-merge.yml]
│       ├── validate.yml                        [NOVO] (doc 10 §10.2: build + lint + typecheck + validate-content em todo PR)
│       ├── market-refresh.yml                  [NOVO] (doc 06 §2.6: schedule "*/30 * * * *"; curl em /api/market/refresh com Authorization: Bearer CRON_SECRET)
│       └── newsletter-weekly.yml               [NOVO] (doc 10 §8.3: sexta; curl em /api/newsletter/weekly com Authorization: Bearer CRON_SECRET)
│   (a rotina diária de conteúdo NÃO é workflow: é Routine do Claude Code — doc 10 §2 e §13)
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
├── vercel.json                                 [NOVO] (headers de cache para /api/img, redirects www→apex; SEM crons — agendamentos em GitHub Actions e 0008_cron.sql)
├── public/
│   ├── ads.txt                                 [NOVO] (google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0)
│   ├── robots.txt                              [NOVO]
│   ├── favicon.svg, favicon.ico, apple-touch-icon.png, logo.svg, logo-dark.svg, og-default.png  [NOVO]
│   └── manifest.webmanifest                    [NOVO]
├── scripts/
│   ├── validate-content.mjs                    [NOVO] (valida posts/products: slug único, kind válido, review/comparison no formato do doc 04 §2.3/§2.4, faixa de preço, botão de afiliado, semáforo, sem termos proibidos, sem preço exato; doc 10 §5)
│   └── rotina/                                 (doc 10 §4.1 e §14 — copiados de vocacaodemae:scripts/rotina/ e adaptados)
│       ├── README.md                           [ADAPTAR de vocacaodemae:scripts/rotina/README.md]
│       ├── art_gen.py                          [ADAPTAR] (Padrão A do Pai: novo e --reforma; une artigo/gen.py + rgen.py + helpers.py do VDM)
│       ├── cmp_gen.py                          [ADAPTAR] (comparativo; grava kind/comparison/product_category/product_score)
│       ├── rev_art_gen.py                      [ADAPTAR] (review única; grava kind/review/product_score)
│       ├── review_gen.py                       [ADAPTAR] (review longa de products.review; produto novo ou staging + UPDATE)
│       ├── cover_cmp.py                        [ADAPTAR] (capa composta com as cores do Vocação de Pai, doc 10 §4.5)
│       ├── amz.py                              [COPIAR de vocacaodemae] (ficha e fotos oficiais da Amazon por ASIN)
│       ├── photo_upgrade.py                    [ADAPTAR] (fila de fotos oficiais, 20/dia)
│       ├── price_range.py                      [NOVO] (faixa de preço em 2 lojas; grava product_price_checks)
│       ├── news_gen.py                         [NOVO] (notícia kind='noticia', categoria `noticias`)
│       ├── slugs.sh                            [ADAPTAR] (slugs publicados para links internos)
│       ├── backlog.mjs                         [NOVO] (doc 12 §1.2: fila de pautas em supabase/seed/backlog.json)
│       ├── proibidos.json                      [NOVO] (termos proibidos, lidos pelos geradores e pelo validador)
│       └── BRIEF_ARTIGO_PAI.md, BRIEF_COMPARATIVO.md, BRIEF_REVIEW_UNICA.md, BRIEF_REVIEW.md, BRIEF_NOTICIA.md  [ADAPTAR/NOVO] (doc 10 §4.2–4.4, doc 04 §9)
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
│   │   ├── 0008_cron.sql                       [NOVO] (seção 4.8; aplicada só com o domínio no ar)
│   │   └── 00NN_<descricao>.sql                [NOVO, rotina] (conteúdo: posts/products; nunca schema — CLAUDE.md §4.2)
│   └── functions/
│       ├── notify-contact-message/index.ts     [COPIAR de vocacaodemae:supabase/functions/notify-contact-message]
│       ├── seo-search-console/index.ts         [COPIAR de vocacaodemae:supabase/functions/seo-search-console]
│       ├── stock-photos/index.ts               [ADAPTAR de vocacaodemae:supabase/functions/stock-photos]
│       └── newsletter-send/index.ts            [NOVO] (resumo semanal via Resend)
│   (sem edge function de mercado nem de expiração de vagas: mercado = src/lib/market/* + /api/market/refresh; vagas = pg_cron vdp-expire-jobs em 0008_cron.sql)
└── src/
    ├── server.ts                               [ADAPTAR de vocacaodemae:src/server.ts] (remover lovable-error-reporting)
    ├── router.tsx                              [COPIAR de vocacaodemae:src/router.tsx]
    ├── routeTree.gen.ts                        (gerado)
    ├── styles.css                              [ADAPTAR] (tokens da seção 6)
    ├── pages/                                  [ADAPTAR de vocacaodemae:src/pages/*] (páginas "gordas"; os arquivos em src/routes são finos e só montam head() + componente, como no VDM)
    ├── integrations/supabase/
    │   ├── client.ts                           [ADAPTAR] (lê VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY; export `supabase`)
    │   ├── client.server.ts                    [COPIAR de vocacaodemae:src/integrations/supabase/client.server.ts] (export `supabaseAdmin`, service_role, só servidor)
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
    │   ├── pai-indica/{taxonomia,criterios,types,score}.ts  [NOVO] (doc 04 §3, §3.2, §2.5, §2.6 — taxonomia.ts é a ÚNICA fonte de categorias/subcategorias de produto, usada por posts.product_category/product_subcategory, product_categories.slug e products.subcategory)
│   ├── phases.ts                           [NOVO] (doc 07 §3.1: 8 fases do filho; espelho de public.child_phase)
│   ├── db/{pai-indica-pai,irmandade,formacao}.ts  [NOVO] (queries por domínio: doc 08 §4, doc 09 §4.2/§5)
    │   ├── price-range.ts                      [COPIAR de vocacaodemae:src/lib/price-range.ts]
    │   ├── cover.ts, image.ts, media.functions.ts  [COPIAR de vocacaodemae]
    │   ├── slugify.ts, utils.ts, rank.ts, anon-id.ts  [COPIAR de vocacaodemae]
    │   ├── auth.ts, auth-context.ts, auth-ui.tsx   [ADAPTAR] (rotas /entrar, /cadastro, onboarding; `useAuth()` MANTÉM `{ user, ready, openLogin }` do VDM e ACRESCENTA `profile, logout, refreshProfile` — doc 07 §4.2)
    │   ├── adsense.ts, ga4.ts                  [COPIAR de vocacaodemae] (trocar IDs por env)
    │   ├── admin-meta.ts                       [COPIAR de vocacaodemae:src/lib/admin-meta.ts]
    │   ├── error-capture.ts, error-page.ts, router-compat.tsx  [COPIAR de vocacaodemae]
    │   ├── stories-read.ts                     [ADAPTAR de vocacaodemae:src/lib/stories-read.ts]
    │   ├── ecosystem.ts                        [ADAPTAR] (links do grupo VDP: vocacaodemae, portaldaai, reviewprodutos)
    │   ├── hub.functions.ts                    [COPIAR de vocacaodemae:src/lib/hub.functions.ts] (métricas para o Painel Lisieux)
    │   ├── email.functions.ts                  [NOVO] (Resend: contato, newsletter, moderação)
    │   ├── og.functions.ts                     [NOVO]
    │   ├── market/{types,cache,fetchers,refresh}.ts  [NOVO] (doc 06 §2.2–2.5; `KEYS` em fetchers.ts; `cached()` stale-while-error em cache.ts)
│   ├── market/sources/{awesomeapi,bcb-ptax,bcb-sgs,coingecko,brapi,tesouro}.ts  [NOVO] (doc 06 §2.4)
    │   ├── jobs.functions.ts                   [NOVO] (criar vaga, indicar, moderar)
    │   ├── community.functions.ts              [NOVO] (perguntas, respostas, eventos, RSVP)
    │   ├── tracks.functions.ts                 [NOVO] (progresso em trilhas e desafios, badges)
    │   ├── members.functions.ts                [NOVO] (perfil, filhos, saved_items, onboarding)
    │   └── tools/                              (doc 06 §0.5 e §1)
    │       ├── registry.ts, categories.ts      [NOVO] (registro das 17 ferramentas: slug, título, categoria, componente, JSON-LD)
    │       ├── jsonld.ts, format.ts, usage.ts, saved.ts, share.ts, currencies.ts  [NOVO]
    │       └── dados por ferramenta (custo-filho-data.ts, licenca-regras.json, churrasco-regras.ts, cortes.json, financas.ts, unidades.ts, saude.ts, nomes-data.ts, vacinas-data.ts, marcos-data.ts…)  [NOVO/ADAPTAR]
    ├── components/
    │   ├── ui/*                                [COPIAR de vocacaodemae:src/components/ui/*] (shadcn completo, sem alterar)
    │   ├── layout/                             (no VDM só existem SiteLayout.tsx, ThemeToggle.tsx e CookieConsent.tsx — não há Header.tsx nem SiteHeader.tsx)
    │   │   ├── SiteLayout.tsx                  [ADAPTAR de vocacaodemae:src/components/layout/SiteLayout.tsx] (header + nav `NAV_MAIN` + menu mobile + rodapé no MESMO arquivo; menu: Blog · Pai Indica · Loja do Pai · Ferramentas · Pai Indica Pai · Irmandade · Formação · Área do Pai)
    │   │   ├── CookieConsent.tsx               [ADAPTAR de vocacaodemae:src/components/layout/CookieConsent.tsx] (LGPD + Consent Mode v2, doc 03 §4.6)
    │   │   ├── ThemeToggle.tsx                 [COPIAR de vocacaodemae:src/components/layout/ThemeToggle.tsx]
    │   │   └── SectionHeader.tsx               [NOVO]
    │   ├── blog/Breadcrumbs.tsx, blog/AdSlot.tsx   [COPIAR de vocacaodemae:src/components/blog/{Breadcrumbs,AdSlot}.tsx]
    │   ├── blog/
    │   │   ├── PostCard.tsx, PostGrid.tsx, PostBody.tsx, PostHeader.tsx, PostFaq.tsx, PostQuiz.tsx, PostComments.tsx, PostReactions.tsx, RelatedPosts.tsx, CategoryPills.tsx, SearchBox.tsx  [ADAPTAR de vocacaodemae:src/components/blog/*]
    │   │   ├── SemaforoCallout.tsx             [ADAPTAR] (callout tone ok/warn/bad → "Sinal verde / Sinal de atenção / Sinal de alerta")
    │   │   └── AuthorByline.tsx                [ADAPTAR]
    │   ├── home/
    │   │   ├── Hero.tsx, LatestPosts.tsx, FeaturedReviews.tsx, StoreHighlights.tsx, ToolsStrip.tsx, JobsStrip.tsx, CommunityStrip.tsx, NewsletterCta.tsx, MarketTicker.tsx  [ADAPTAR/NOVO]
    │   ├── loja/                               (pastas de componentes fixas: blog, pai-indica, loja, ferramentas, area-do-pai, pai-indica-pai, irmandade, formacao)
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
    │   ├── ferramentas/                        (doc 06 §0.5 e §1.4)
    │   │   ├── ToolShell.tsx, ToolGate.tsx     [COPIAR de vocacaodemae:src/components/tools/{ToolShell,ToolGate}.tsx] (sem i18n)
    │   │   ├── ToolLayout.tsx, ToolCard.tsx, ToolHowTo.tsx, ToolFaq.tsx, ToolDisclaimer.tsx, ToolSaveButton.tsx, ToolShareButton.tsx, ToolRelatedArticles.tsx, ToolResultCard.tsx, PaiSemaforo.tsx, MarketStale.tsx  [NOVO]
    │   │   └── <slug>/<NomeDaFerramenta>.tsx   [NOVO] (um por ferramenta; ex.: conversor-de-moedas/CurrencyConverter.tsx, mercado-financeiro/MarketDashboard.tsx com recharts)
    │   ├── area-do-pai/
    │   │   ├── DashboardCards.tsx, ProfileForm.tsx, ChildrenForm.tsx, SavedItems.tsx, BadgesWall.tsx, OnboardingWizard.tsx, AuthForm.tsx, SaveButton.tsx, RequireAuth.tsx  [NOVO/ADAPTAR de vocacaodemae:src/lib/auth-ui.tsx]
    │   ├── pai-indica-pai/
    │   │   ├── JobCard.tsx, JobList.tsx, JobFilters.tsx, JobForm.tsx, ReferralCard.tsx, ReferralForm.tsx, ProfessionalCard.tsx, MentorCard.tsx, MentorshipRequestDialog.tsx, ReportDialog.tsx  [NOVO] (doc 08 §4)
    │   ├── irmandade/
    │   │   ├── StoryCard.tsx, StoryForm.tsx    [ADAPTAR de vocacaodemae:src/components/stories/*]
    │   │   ├── QuestionCard.tsx, QuestionForm.tsx, AnswerList.tsx, AnswerForm.tsx, EventCard.tsx, RsvpButton.tsx  [NOVO]
    │   └── formacao/
    │       ├── TrackCard.tsx, TrackSteps.tsx, StepContent.tsx, ChallengeCard.tsx, ChallengeDayList.tsx, ProgressRing.tsx, BadgeGrid.tsx  [NOVO]
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
        ├── sitemap-vagas[.]xml.ts              [NOVO] (doc 08 §8.2)
        ├── rss[.]xml.ts                        [NOVO] (doc 03 §6.5)
        ├── api/
        │   ├── img/$.ts                        [COPIAR de vocacaodemae:src/routes/api/img/$.ts] (proxy/resize de imagens)
        │   ├── og.ts                           [NOVO] (?title=&kind=&score= → PNG 1200x630)
        │   ├── newsletter.ts                   [NOVO] (POST → newsletter_subscribers + Resend)
        │   ├── contact.ts                      [NOVO]
        │   ├── market/refresh.ts               [NOVO] (doc 06 §2.6; GET/POST; Authorization: Bearer CRON_SECRET; chamada por market-refresh.yml)
        │   ├── newsletter/weekly.ts, newsletter/unsubscribe.ts  [NOVO] (doc 10 §8.2; Authorization: Bearer CRON_SECRET)
        │   ├── webhooks/mercadopago.ts         [NOVO] (doc 07 §7.3; responde 503 até a cobrança ser ligada)
        │   ├── hub/metrics.ts                  [NOVO] (Painel Lisieux; Authorization: Bearer CRON_SECRET)
        │   └── cron/
        │       ├── expire-jobs.ts              [NOVO] (disparo MANUAL de public.expire_jobs(); o agendamento é o pg_cron vdp-expire-jobs de 0008_cron.sql; Authorization: Bearer CRON_SECRET)
        │       └── vagas-digest.ts             [NOVO] (doc 08 §5.2; Authorization: Bearer CRON_SECRET)
        ├── admin/login.tsx                     [COPIAR de vocacaodemae:src/routes/admin/login.tsx]
        ├── _admin/admin/
        │   ├── index.tsx                       [ADAPTAR]
        │   ├── editor/index.tsx, editor/$id.tsx  [ADAPTAR]
        │   ├── produtos/index.tsx, produtos/$id.tsx, produtos/novo.tsx, produtos/fila-fotos.tsx, produtos/fila-precos.tsx  [ADAPTAR/NOVO] (doc 05 §7)
        │   ├── moderacao.tsx                   [NOVO]
        │   ├── pai-indica-pai.tsx              [NOVO] (doc 08 §6)
        │   ├── membros.tsx                     [NOVO] (doc 07 §10)
        │   ├── formacao.tsx                    [NOVO]
        │   └── eventos.tsx                     [NOVO]
        └── _site/
            ├── index.tsx                       [ADAPTAR] (home: get_home_data)
            ├── blog.tsx                        [ADAPTAR de vocacaodemae:src/routes/_site/blog.tsx]
            ├── post/$slug.tsx                  [ADAPTAR de vocacaodemae:src/routes/_site/post/$slug.tsx] (render por kind)
            ├── categoria/$slug.tsx             [ADAPTAR]
            ├── blog/por-idade.tsx              [NOVO] (hub por fase do filho, doc 00 §3.6)
            ├── autor/$slug.tsx                 [NOVO] (doc 11 §8.3)
            ├── busca.tsx                       [ADAPTAR] (RPC search_posts)
            ├── pai-indica/index.tsx            [NOVO]
            ├── pai-indica/$slug.tsx            [NOVO] (mesmo loader de post/$slug; layout de review)
            ├── loja/index.tsx                  [ADAPTAR de vocacaodemae:src/routes/_site/loja/index.tsx]
            ├── loja/categoria/$slug.tsx        [NOVO]
            ├── loja/$slug.tsx                  [ADAPTAR de vocacaodemae:src/routes/_site/loja/$slug.tsx]
            ├── loja/ofertas.tsx, loja/presentes.tsx  [NOVO] (doc 11 §12; sem AdSense)
            ├── ferramentas/index.tsx           [ADAPTAR]
            ├── ferramentas/$slug.tsx           [NOVO] (resolve pelo registro src/lib/tools/index.ts; inclui conversor-de-moedas e mercado-financeiro)
            ├── area-do-pai.index.tsx           [NOVO] (painel; guard RequireAuth)
            ├── area-do-pai.{onboarding,filhos,salvos,planos}.tsx  [NOVO] (doc 07 §4.7)
            ├── minha-conta.tsx                 [ADAPTAR de vocacaodemae:src/routes/_site/minha-conta.tsx]
            ├── entrar.tsx, cadastro.tsx, recuperar-senha.tsx, auth.callback.tsx  [NOVO] (doc 07 §4.7)
            ├── newsletter.{confirmar,sair,preferencias,obrigado}.tsx  [NOVO] (doc 07 §4.7, doc 11 §5.2)
            ├── pai-indica-pai/index.tsx        [NOVO]
            ├── pai-indica-pai/vagas/index.tsx  [NOVO]
            ├── pai-indica-pai/vagas/$slug.tsx  [NOVO]
            ├── pai-indica-pai/vagas/nova.tsx   [NOVO] (guard autenticado)
            ├── pai-indica-pai/vagas/feed[.]xml.ts  [NOVO] (doc 08 §8.3)
            ├── pai-indica-pai/profissionais/{index,$slug,novo}.tsx  [NOVO]
            ├── pai-indica-pai/indicacoes/{index,nova}.tsx  [NOVO] (doc 08 §3.6)
            ├── pai-indica-pai/mentoria/index.tsx  [NOVO]
            ├── irmandade.tsx                   [NOVO]
            ├── historias/index.tsx, historias/$id.tsx, historias/nova.tsx  [ADAPTAR de vocacaodemae:src/routes/_site/historias/*]
            ├── perguntas/index.tsx             [NOVO]
            ├── perguntas/$slug.tsx             [NOVO]
            ├── perguntas/nova.tsx              [NOVO] (doc 09 §4)
            ├── eventos/index.tsx, eventos/$slug.tsx  [NOVO] (doc 09 §8)
            ├── formacao/index.tsx              [NOVO]
            ├── formacao/$slug.tsx              [NOVO]
            ├── desafios/index.tsx              [NOVO]
            ├── desafios/$slug.tsx              [NOVO]
            ├── sobre.tsx                       [ADAPTAR]
            ├── contato.tsx                     [ADAPTAR]
            ├── politica-de-privacidade.tsx     [ADAPTAR]
            ├── termos-de-uso.tsx               [ADAPTAR]
            ├── politica-de-afiliados.tsx       [NOVO]
            ├── politica-editorial.tsx          [NOVO] ("Como avaliamos", doc 11 §8.3)
            └── anuncie.tsx                     [NOVO] (mídia kit, Fase 8, doc 11 §1)
```

Observação sobre rotas TanStack: `$slug` é parâmetro; pastas com `index.tsx` viram a rota raiz da pasta; `_site.tsx` e `_admin.tsx` são layouts sem segmento de URL; `[.]` escapa o ponto no nome de arquivo (`sitemap[.]xml.ts` → `/sitemap.xml`).

---

## 4. Schema SQL completo (7 migrations de schema + `0008_cron.sql`)

> Este bloco é a referência de nomes. O SQL executável de 0001/0002 está no doc 03 §3 e o de 0003–0007 no doc de cada fase (05 §2, 06 §2.1, 07 §2, 08 §2, 09 §2).

Regras gerais (valem para os 7 arquivos):

- Aplicar na ordem 0001 → 0007 com `mcp__Supabase__apply_migration` no projeto `<SUPABASE_PROJECT_REF>`, `name` igual ao nome do arquivo sem extensão. `0008_cron.sql` (§4.8) só com o domínio no ar.
- Todo `id` é `uuid primary key default gen_random_uuid()`; todo `slug` é `text unique not null`; status é `text` com `check`.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` + trigger `set_updated_at`.
- RLS ligada em todas as tabelas. Padrão: anon lê publicado/aprovado/ativo; usuário edita o próprio; staff via `is_admin()`.
- Funções chamadas em policies sempre como `(select public.is_admin())` para o planner avaliar uma vez por query.
- Nunca `DROP TABLE`/`DELETE` em migrations de rotina; mudanças de schema só em migrations `0009+` novas (`0008_cron.sql` é a de agendamentos).
- **Idempotência obrigatória** (CLAUDE.md §4.2): `create table if not exists`, `add column if not exists`, toda `create policy` precedida de `drop policy if exists` (única forma de `drop` permitida), `create or replace trigger`/`function`, `insert … on conflict`. Reaplicar qualquer arquivo não pode dar "already exists".
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
  role text not null default 'member' check (role in ('member','editor','admin')),
  bio text,
  city text,
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  onboarding_done boolean not null default false,
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role);
create or replace trigger trg_profiles_updated before update on public.profiles
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
create or replace trigger trg_guard_profile_role before update on public.profiles
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
create or replace trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
drop policy if exists "profiles: read own or staff or authors" on public.profiles;
create policy "profiles: read own or staff or authors" on public.profiles
  for select using (
    (select auth.uid()) = id
    or (select public.is_admin())
    or role in ('editor','admin')
  );
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check ((select auth.uid()) = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists "profiles: staff update" on public.profiles;
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
  birth_date date not null,             -- se o pai preferir só mês/ano (doc 00 risco 11), gravar dia 01 e marcar birth_precision='month'
  birth_precision text not null default 'day' check (birth_precision in ('day','month')),
  sex text not null check (sex in ('M','F')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_children_user on public.children(user_id);
create or replace trigger trg_children_updated before update on public.children
  for each row execute function public.set_updated_at();
alter table public.children enable row level security;
drop policy if exists "children: own all" on public.children;
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
drop policy if exists "contact: public insert" on public.contact_messages;
create policy "contact: public insert" on public.contact_messages for insert with check (true);
drop policy if exists "contact: staff read" on public.contact_messages;
create policy "contact: staff read" on public.contact_messages for select using ((select public.is_admin()));
drop policy if exists "contact: staff update" on public.contact_messages;
create policy "contact: staff update" on public.contact_messages for update using ((select public.is_admin()));
drop policy if exists "contact: staff delete" on public.contact_messages;
create policy "contact: staff delete" on public.contact_messages for delete using ((select public.is_admin()));

-- ---------- newsletter_subscribers ----------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  name text,
  source text,
  user_id uuid references public.profiles(id) on delete set null,
  segments jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed','bounced')),
  confirm_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_newsletter_user on public.newsletter_subscribers(user_id);
-- segments (formato ÚNICO, doc 11 §5.1 — vale para docs 07, 08, 10 e 11):
--   { "frequencia": "diaria"|"semanal",
--     "fases": [slugs do doc 07 §3.1: "gestacao","recem-nascido","bebe","primeira-infancia","infancia","pre-adolescencia","adolescencia","adulto"],
--     "interesses": ["churrasco","ferramentas","carro","dinheiro","fe","saude","carreira","esporte"],
--     "origem": "home|post|ferramenta|cadastro|loja", "vagas": {"ufs": []},
--     "welcome_step": 0, "welcome_next_at": null, "last_sent_at": null }
-- Para membros (user_id preenchido), "fases" é recalculada a partir de children.birth_date com public.child_phase() (doc 07 §3.1).
alter table public.newsletter_subscribers enable row level security;
drop policy if exists "newsletter: public insert" on public.newsletter_subscribers;
create policy "newsletter: public insert" on public.newsletter_subscribers for insert with check (true);
drop policy if exists "newsletter: staff read" on public.newsletter_subscribers;
create policy "newsletter: staff read" on public.newsletter_subscribers for select using ((select public.is_admin()));
drop policy if exists "newsletter: staff update" on public.newsletter_subscribers;
create policy "newsletter: staff update" on public.newsletter_subscribers for update using ((select public.is_admin()));

-- ---------- moderation_log (interno) ----------
create table if not exists public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity text not null,
  entity_id text not null,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists idx_moderation_entity on public.moderation_log(entity, entity_id);
alter table public.moderation_log enable row level security;
drop policy if exists "moderation: staff read" on public.moderation_log;
create policy "moderation: staff read" on public.moderation_log for select using ((select public.is_admin()));
drop policy if exists "moderation: staff insert" on public.moderation_log;
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

drop policy if exists "covers: public read" on storage.objects;
create policy "covers: public read" on storage.objects for select using (bucket_id = 'covers');
drop policy if exists "covers: staff write" on storage.objects;
create policy "covers: staff write" on storage.objects for insert with check (bucket_id = 'covers' and public.is_admin());
drop policy if exists "covers: staff update" on storage.objects;
create policy "covers: staff update" on storage.objects for update using (bucket_id = 'covers' and public.is_admin());
drop policy if exists "covers: staff delete" on storage.objects;
create policy "covers: staff delete" on storage.objects for delete using (bucket_id = 'covers' and public.is_admin());

drop policy if exists "products: public read" on storage.objects;
create policy "products: public read" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "products: staff write" on storage.objects;
create policy "products: staff write" on storage.objects for insert with check (bucket_id = 'products' and public.is_admin());
drop policy if exists "products: staff update" on storage.objects;
create policy "products: staff update" on storage.objects for update using (bucket_id = 'products' and public.is_admin());
drop policy if exists "products: staff delete" on storage.objects;
create policy "products: staff delete" on storage.objects for delete using (bucket_id = 'products' and public.is_admin());

-- avatars/<uid>/arquivo.jpg : o dono escreve na própria pasta
drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars: own write" on storage.objects;
create policy "avatars: own write" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: own update" on storage.objects;
create policy "avatars: own update" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars: own delete" on storage.objects;
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
  color text,                                                        -- hex da categoria-mãe (doc 00 §3.4)
  parent_id uuid null references public.categories(id) on delete set null,   -- null = categoria-mãe; preenchido = subcategoria
  pillar text null check (pillar in ('casa','trabalho','corpo','alma')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists categories_parent_id_idx on public.categories(parent_id);
alter table public.categories enable row level security;
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories for select using (true);
drop policy if exists "categories: staff insert" on public.categories;
create policy "categories: staff insert" on public.categories for insert with check ((select public.is_admin()));
drop policy if exists "categories: staff update" on public.categories;
create policy "categories: staff update" on public.categories for update using ((select public.is_admin()));
drop policy if exists "categories: staff delete" on public.categories;
create policy "categories: staff delete" on public.categories for delete using ((select public.is_admin()));

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.tags enable row level security;
drop policy if exists "tags: public read" on public.tags;
create policy "tags: public read" on public.tags for select using (true);
drop policy if exists "tags: staff write" on public.tags;
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
create or replace trigger trg_posts_updated before update on public.posts
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
create or replace trigger trg_posts_search before insert or update of title, subtitle, excerpt, body on public.posts
  for each row execute function public.posts_search_content();

alter table public.posts enable row level security;
drop policy if exists "posts: public read published" on public.posts;
create policy "posts: public read published" on public.posts
  for select using (status = 'published' and (publish_at is null or publish_at <= now()));
drop policy if exists "posts: staff read all" on public.posts;
create policy "posts: staff read all" on public.posts for select using ((select public.is_admin()));
drop policy if exists "posts: staff insert" on public.posts;
create policy "posts: staff insert" on public.posts for insert with check ((select public.is_admin()));
drop policy if exists "posts: author or staff update" on public.posts;
create policy "posts: author or staff update" on public.posts
  for update using ((select auth.uid()) = author_id or (select public.is_admin()))
  with check ((select auth.uid()) = author_id or (select public.is_admin()));
drop policy if exists "posts: staff delete" on public.posts;
create policy "posts: staff delete" on public.posts for delete using ((select public.is_admin()));

-- ---------- post_tags ----------
create table if not exists public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists idx_post_tags_tag on public.post_tags(tag_id);
alter table public.post_tags enable row level security;
drop policy if exists "post_tags: public read" on public.post_tags;
create policy "post_tags: public read" on public.post_tags for select using (true);
drop policy if exists "post_tags: staff write" on public.post_tags;
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
create or replace trigger trg_comments_updated before update on public.comments
  for each row execute function public.set_updated_at();
alter table public.comments enable row level security;
drop policy if exists "comments: public read approved" on public.comments;
create policy "comments: public read approved" on public.comments for select using (status = 'approved');
drop policy if exists "comments: own read" on public.comments;
create policy "comments: own read" on public.comments for select using ((select auth.uid()) = user_id);
drop policy if exists "comments: staff read" on public.comments;
create policy "comments: staff read" on public.comments for select using ((select public.is_admin()));
drop policy if exists "comments: auth insert pending" on public.comments;
create policy "comments: auth insert pending" on public.comments
  for insert with check ((select auth.uid()) = user_id and status = 'pending');
drop policy if exists "comments: own update" on public.comments;
create policy "comments: own update" on public.comments
  for update using ((select auth.uid()) = user_id and status = 'pending');
drop policy if exists "comments: staff moderate" on public.comments;
create policy "comments: staff moderate" on public.comments
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "comments: own or staff delete" on public.comments;
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
drop policy if exists "reactions: own read" on public.reactions;
create policy "reactions: own read" on public.reactions
  for select using ((select auth.uid())::text = user_key or (select public.is_admin()));
drop policy if exists "reactions: own delete" on public.reactions;
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
-- Taxonomia normativa = doc 00 §3.2–3.5 (14 categorias-mãe + 103 subcategorias com parent_id/color/pillar).
-- O bloco abaixo é o SQL do doc 00 §3.4, copiado literalmente (idempotente: on conflict (slug) do update).
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

-- Categorias TÉCNICAS (fora do filtro de /blog e do menu; sort_order >= 900). Ids fixos para a rotina e o validador,
-- mas quem confere é SEMPRE o slug: `select id from categories where slug = 'pai-indica'` (doc 04 §2.2).
insert into public.categories (id, slug, name, description, icon, sort_order) values
('10000000-0000-0000-0000-000000000010','pai-indica','Pai Indica','Reviews, comparativos e listas de produtos indicados pelo pai.','badge-check',900),
('10000000-0000-0000-0000-000000000011','noticias','Notícias','Novidades e acontecimentos que interessam ao pai e à família. A série "Mercado do pai" usa esta categoria + tag serie:mercado-do-pai.','newspaper',910)
on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, sort_order = excluded.sort_order;

-- Aceite: 14 linhas com parent_id is null e sort_order < 900; 103 com parent_id preenchido; 2 técnicas (sort_order >= 900).
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
drop policy if exists "product_categories: public read" on public.product_categories;
create policy "product_categories: public read" on public.product_categories for select using (true);
drop policy if exists "product_categories: staff write" on public.product_categories;
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
create or replace trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
alter table public.products enable row level security;
drop policy if exists "products: public read active" on public.products;
create policy "products: public read active" on public.products for select using (active = true);
drop policy if exists "products: staff read all" on public.products;
create policy "products: staff read all" on public.products for select using ((select public.is_admin()));
drop policy if exists "products: staff insert" on public.products;
create policy "products: staff insert" on public.products for insert with check ((select public.is_admin()));
drop policy if exists "products: staff update" on public.products;
create policy "products: staff update" on public.products for update using ((select public.is_admin()));
drop policy if exists "products: staff delete" on public.products;
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
drop policy if exists "price_checks: staff read" on public.product_price_checks;
create policy "price_checks: staff read" on public.product_price_checks for select using ((select public.is_admin()));
drop policy if exists "price_checks: staff insert" on public.product_price_checks;
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
        select id, slug, name, icon, color, sort_order from public.categories
        where parent_id is null and sort_order < 900          -- só as 14 categorias-mãe; pai-indica/noticias ficam fora do filtro
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

-- Taxonomia de produto: ÚNICA fonte = src/lib/pai-indica/taxonomia.ts (doc 04 §3). Os 10 slugs abaixo são
-- `productCategories` desse arquivo; `products.subcategory` e `posts.product_subcategory` usam os slugs de
-- `productSubcategories` do mesmo arquivo. "Presentes para o pai" NÃO é categoria: é a rota/tag `/loja/presentes`.
insert into public.product_categories (slug, name, icon, sort_order) values
('churrasco-e-cozinha','Churrasco e Cozinha','flame',1),
('ferramentas','Ferramentas','wrench',2),
('carro-e-moto','Carro e Moto','car',3),
('tecnologia','Tecnologia','smartphone',4),
('esporte-e-outdoor','Esporte e Outdoor','tent',5),
('bebe-e-crianca','Bebê e Criança','baby',6),
('casa-e-jardim','Casa e Jardim','home',7),
('saude-do-homem','Saúde do Homem','heart-pulse',8),
('estilo-e-barba','Estilo e Barba','shirt',9),
('livros-e-formacao','Livros e Formação','book-open',10)
on conflict (slug) do update set name = excluded.name, icon = excluded.icon, sort_order = excluded.sort_order;
```

### 4.4 `supabase/migrations/0004_membros.sql`

```sql
-- 0004_membros.sql — Área do Pai: itens salvos, badges, planos, assinaturas

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('post','product','tool','job','track')),
  item_id text not null,              -- uuid em texto OU slug (ferramentas salvam o slug — doc 06 §1.3)
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists idx_saved_items_user on public.saved_items(user_id, item_type);
alter table public.saved_items enable row level security;
drop policy if exists "saved_items: own all" on public.saved_items;
create policy "saved_items: own all" on public.saved_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  rule jsonb not null default '{}'::jsonb,   -- {"type": "...", "min": N, "slug": "..."} — motor award_badges() (doc 09 §2.2 bloco 8)
  created_at timestamptz not null default now()
);
alter table public.badges enable row level security;
drop policy if exists "badges: public read" on public.badges;
create policy "badges: public read" on public.badges for select using (true);
drop policy if exists "badges: staff write" on public.badges;
create policy "badges: staff write" on public.badges for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.user_badges enable row level security;
drop policy if exists "user_badges: public read" on public.user_badges;
create policy "user_badges: public read" on public.user_badges for select using (true);
-- Escrita só por funções security definer (award_badge / award_badges) ou service_role.

-- award_badge(uuid, text): concessão DIRETA por slug (usada por complete_onboarding, moderate_job, moderate_story).
-- award_badges(p_user_id uuid) returns setof text: MOTOR DE REGRAS que lê badges.rule e devolve só as insígnias novas;
-- grant_badges_for_me(): atalho do client (= award_badges(auth.uid())). As duas últimas dependem de tracks/challenges/
-- stories/answers/events e por isso são criadas na 0006 (§4.6), com o SQL do doc 09 §2.2 bloco 8.
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
  price_cents integer not null default 0,
  interval text not null default 'month' check (interval in ('month','year')),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;
drop policy if exists "plans: public read active" on public.plans;
create policy "plans: public read active" on public.plans for select using (active = true);
drop policy if exists "plans: staff write" on public.plans;
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
create or replace trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: own read" on public.subscriptions;
create policy "subscriptions: own read" on public.subscriptions for select using ((select auth.uid()) = user_id);
drop policy if exists "subscriptions: staff all" on public.subscriptions;
create policy "subscriptions: staff all" on public.subscriptions for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- Planos (nomes ÚNICOS em todo o plano: doc 07 §7, doc 11 §6, checklist 5.9 usam estes slugs):
insert into public.plans (slug, name, description, price_cents, interval, features, active) values
('gratuito','Pai de Família','Acesso gratuito à Área do Pai, trilhas básicas, desafios, comunidade e Pai Indica Pai.',0,'month',
 '["Trilhas de formação","Desafios","Itens salvos","Histórias e perguntas","Indicar e ver vagas"]'::jsonb, true),
('pai-de-valor','Pai de Valor','Plano pago (fica inativo até o dono ligar a cobrança via Mercado Pago).',1990,'month',
 '["sem_anuncios","trilhas_premium","grupos_fechados","ebooks","descontos_parceiros","mentoria_em_grupo"]'::jsonb, false)
on conflict (slug) do update set name = excluded.name, description = excluded.description, price_cents = excluded.price_cents,
  interval = excluded.interval, features = excluded.features, active = excluded.active;

-- Seed das 20 insígnias = doc 09 §2.2 bloco 10 (fonte única; pai-presente = concluir "30 dias de presença com os filhos").
-- rule é jsonb lido por award_badges(); ícones = nomes do lucide-react em kebab-case.
insert into public.badges (slug, name, description, icon, rule) values
('primeiro-passo',       'Primeiro passo',        'Completou o onboarding da Área do Pai.',                             'footprints',     '{"type":"onboarding_done"}'),
('primeiro-filho',       'Primeiro filho',        'Cadastrou o primeiro filho na Área do Pai.',                          'baby',           '{"type":"children_count","min":1}'),
('colecionador',         'Colecionador',          'Salvou 10 conteúdos para ler depois.',                                'bookmark',       '{"type":"saved_count","min":10}'),
('leitor-fiel',          'Leitor fiel',           'Confirmou o resumo semanal por e-mail.',                              'mail-check',     '{"type":"newsletter_confirmed"}'),
('pai-de-valor',         'Pai de Valor',          'Assinante do plano Pai de Valor.',                                    'shield-check',   '{"type":"premium"}'),
('pai-presente',         'Pai presente',          'Concluiu o desafio "30 dias de presença com os filhos".',            'medal',          '{"type":"challenge_completed","slug":"30-dias-de-presenca-com-os-filhos"}'),
('provedor',             'Provedor',              'Concluiu o desafio "30 dias do provedor".',                           'wallet',         '{"type":"challenge_completed","slug":"30-dias-do-provedor"}'),
('disciplina-de-ferro',  'Disciplina de ferro',   'Concluiu o desafio "30 dias de disciplina do homem".',               'dumbbell',       '{"type":"challenge_completed","slug":"30-dias-de-disciplina-do-homem"}'),
('formador',             'Formador',              'Concluiu a primeira trilha de Formação.',                             'graduation-cap', '{"type":"track_completed","min":1}'),
('filho-de-sao-jose',    'Filho de São José',     'Concluiu a trilha "Fé do pai: 33 dias com São José".',               'church',         '{"type":"track_completed","slug":"fe-do-pai-33-dias-com-sao-jose"}'),
('mestre-do-churrasco',  'Mestre do churrasco',   'Concluiu a trilha "Mestre do churrasco".',                            'flame',          '{"type":"track_completed","slug":"mestre-do-churrasco"}'),
('mao-na-massa',         'Mão na massa',          'Concluiu a trilha "Faça-você-mesmo: consertos de casa".',            'wrench',         '{"type":"track_completed","slug":"faca-voce-mesmo-consertos-de-casa"}'),
('sete-dias-seguidos',   'Sete dias seguidos',    'Sete dias seguidos de Formação (passo ou dia de desafio).',           'calendar-check', '{"type":"streak","min":7}'),
('trinta-dias-seguidos', 'Trinta dias seguidos',  'Trinta dias seguidos de Formação sem falhar.',                        'calendar-range', '{"type":"streak","min":30}'),
('voz-da-irmandade',     'Voz da Irmandade',      'Teve a primeira história aprovada.',                                  'megaphone',      '{"type":"story_approved","min":1}'),
('irmao',                'Irmão',                 'Três histórias aprovadas na Irmandade.',                              'users',          '{"type":"story_approved","min":3}'),
('conselheiro',          'Conselheiro',           'Teve uma resposta escolhida como a melhor pelo autor da pergunta.',   'lightbulb',      '{"type":"answer_accepted","min":1}'),
('mao-amiga',            'Mão amiga',             'Dez respostas aprovadas na Irmandade.',                               'hand-helping',   '{"type":"answers_count","min":10}'),
('presente-no-encontro', 'Presente no encontro',  'Confirmou presença e participou de um encontro da Irmandade.',        'map-pin',        '{"type":"event_attended","min":1}'),
('pai-que-indica',       'Pai que indica',        'Publicou a primeira vaga aprovada no Pai Indica Pai.',                'handshake',      '{"type":"job_approved","min":1}')
on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, rule = excluded.rule;

-- get_member_dashboard: depende de jobs (0005), tracks e challenges (0006) → definida no FIM de 0006.
```

### 4.5 `supabase/migrations/0005_pai_indica_pai.sql`

```sql
-- 0005_pai_indica_pai.sql — vagas, indicações (profissional/serviço/empresa), profissionais e mentoria
-- Modelo de dados = doc 08 §2.2 (fonte do SQL completo: triggers antifraude, renew_*, report_entity, block_user, jobs_public).
-- moderation_log.entity_id é TEXT (0001): toda inserção converte o uuid com ::text.

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
create or replace trigger trg_jobs_updated before update on public.jobs
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
create or replace trigger trg_guard_job_status before insert or update on public.jobs
  for each row execute function public.guard_job_status();

alter table public.jobs enable row level security;
drop policy if exists "jobs: public read approved" on public.jobs;
create policy "jobs: public read approved" on public.jobs
  for select using (status = 'approved' and expires_at > now());
drop policy if exists "jobs: own read" on public.jobs;
create policy "jobs: own read" on public.jobs for select using ((select auth.uid()) = posted_by);
drop policy if exists "jobs: staff read" on public.jobs;
create policy "jobs: staff read" on public.jobs for select using ((select public.is_admin()));
drop policy if exists "jobs: auth insert own" on public.jobs;
create policy "jobs: auth insert own" on public.jobs for insert with check ((select auth.uid()) = posted_by);
drop policy if exists "jobs: own update pending" on public.jobs;
create policy "jobs: own update pending" on public.jobs
  for update using ((select auth.uid()) = posted_by and status in ('pending','rejected'));
drop policy if exists "jobs: staff update" on public.jobs;
create policy "jobs: staff update" on public.jobs for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "jobs: staff delete" on public.jobs;
create policy "jobs: staff delete" on public.jobs for delete using ((select public.is_admin()));

create or replace function public.moderate_job(p_job_id uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  update public.jobs set
    status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'expire' then 'expired' else status end,
    moderated_by = auth.uid(), moderated_at = now()
  where id = p_job_id;
  insert into public.moderation_log (entity, entity_id, action, actor_id, note)
  values ('job', p_job_id::text, p_action, auth.uid(), p_reason);
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

-- Expiração (doc 08 §2.6): vagas (45 dias) e indicações (90 dias). Agendada UMA vez, pelo pg_cron vdp-expire-jobs em 0008_cron.sql;
-- disparo manual pela rota /api/cron/expire-jobs (Authorization: Bearer CRON_SECRET). Sem edge function, sem Vercel Cron, sem workflow.
create or replace function public.expire_jobs() returns table (expired_jobs int, expired_referrals int)
language plpgsql security definer set search_path = public as $$
declare a int; b int;
begin
  with u as (update public.jobs set status = 'expired' where status = 'approved' and expires_at < now() returning id)
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  select null, 'job', id::text, 'expire', 'expirada automaticamente' from u;
  get diagnostics a = row_count;
  with u as (update public.job_referrals set status = 'expired' where status = 'approved' and expires_at < now() returning id)
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  select null, 'job_referral', id::text, 'expire', 'expirada automaticamente' from u;
  get diagnostics b = row_count;
  return query select a, b;
end $$;
revoke all on function public.expire_jobs() from public, anon, authenticated;

-- ---------- helpers de autorização (doc 08 §2.1 e §2.3) ----------
alter table public.profiles
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text;

create or replace function public.email_verified() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce((select u.email_confirmed_at is not null from auth.users u where u.id = auth.uid()), false);
$$;

create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.blocked_at is not null from public.profiles p where p.id = auth.uid()), false);
$$;

-- Pode publicar? logado + e-mail verificado + não bloqueado
create or replace function public.can_publish() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.email_verified() and not public.is_blocked();
$$;
grant execute on function public.email_verified() to anon, authenticated;
grant execute on function public.is_blocked() to anon, authenticated;
grant execute on function public.can_publish() to anon, authenticated;

-- ---------- job_referrals = indicações de PROFISSIONAL, SERVIÇO ou EMPRESA (rota /pai-indica-pai/indicacoes) ----------
-- (não é "indicação de candidato a uma vaga"; colunas = briefing COLUNAS-CHAVE + adicionais do doc 08 §2.2)
create table if not exists public.job_referrals (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,                              -- adicional
  kind             text not null check (kind in ('profissional','servico','empresa')),
  title            text not null check (char_length(title) between 3 and 120),
  category         text not null,                                     -- chave de JOB_AREAS ou texto livre curto
  city             text,
  uf               char(2),
  description      text not null check (char_length(description) between 50 and 4000),
  contact_phone    text,
  contact_email    text,
  contact_url      text,
  consent_contact  boolean not null default false,                    -- adicional
  referred_by      uuid references public.profiles(id) on delete set null,     -- LGPD: apagar a conta não apaga a indicação aprovada
  status           text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  rejection_reason text,                                              -- adicional
  auto_hidden      boolean not null default false,                    -- adicional
  report_count     int not null default 0,                            -- adicional
  renewed_count    int not null default 0,                            -- adicional
  expires_at       timestamptz,                                       -- adicional (90 dias)
  moderated_by     uuid references public.profiles(id) on delete set null,  -- adicional
  moderated_at     timestamptz,                                       -- adicional
  views            int not null default 0,                            -- adicional
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()                 -- adicional
);
create index if not exists job_referrals_public_idx on public.job_referrals (status, kind, uf) where status = 'approved';
create index if not exists job_referrals_by_idx on public.job_referrals (referred_by, created_at desc);
create or replace trigger trg_job_referrals_updated before update on public.job_referrals
  for each row execute function public.set_updated_at();

-- ---------- professionals = diretório "Pai Profissional"; is_mentor liga a frente Mentoria ----------
create table if not exists public.professionals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references public.profiles(id) on delete cascade,
  slug             text not null unique,                              -- adicional
  profession       text not null check (char_length(profession) between 3 and 80),
  area             text,                                              -- adicional (JOB_AREAS)
  description      text not null check (char_length(description) between 50 and 3000),
  city             text,
  uf               char(2),
  remote           boolean not null default false,
  contact_phone    text,
  contact_email    text,
  contact_url      text,
  consent_contact  boolean not null default false,                    -- adicional
  is_mentor        boolean not null default false,                    -- adicional (frente Mentoria)
  mentor_areas     text[] not null default '{}',                      -- adicional (chaves de MENTORSHIP_AREAS)
  mentor_capacity  int not null default 2 check (mentor_capacity between 0 and 10), -- adicional
  status           text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  rejection_reason text,                                              -- adicional
  auto_hidden      boolean not null default false,                    -- adicional
  report_count     int not null default 0,                            -- adicional
  moderated_by     uuid references public.profiles(id) on delete set null,  -- adicional
  moderated_at     timestamptz,                                       -- adicional
  views            int not null default 0,                            -- adicional
  created_at       timestamptz not null default now(),                -- adicional
  updated_at       timestamptz not null default now()                 -- adicional
);
create index if not exists professionals_public_idx on public.professionals (status, area, uf) where status = 'approved';
create index if not exists professionals_mentor_idx on public.professionals (is_mentor) where status = 'approved' and is_mentor;
create or replace trigger trg_professionals_updated before update on public.professionals
  for each row execute function public.set_updated_at();

-- ---------- mentorships = pedido do MENTORADO a um professionals.is_mentor aprovado ----------
create table if not exists public.mentorships (
  id          uuid primary key default gen_random_uuid(),
  mentor_id   uuid not null references public.profiles(id) on delete cascade,
  mentee_id   uuid not null references public.profiles(id) on delete cascade,
  area        text not null,
  status      text not null default 'requested' check (status in ('requested','accepted','declined','completed','cancelled')),
  message     text not null check (char_length(message) between 30 and 1500),
  reply       text,                                                   -- adicional (resposta do mentor)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),                     -- adicional
  constraint mentorships_not_self check (mentor_id <> mentee_id)
);
-- um pedido ativo por par mentor/mentorado
create unique index if not exists mentorships_active_pair_uniq
  on public.mentorships (mentor_id, mentee_id) where status in ('requested','accepted');
create index if not exists mentorships_mentor_idx on public.mentorships (mentor_id, status);
create index if not exists mentorships_mentee_idx on public.mentorships (mentee_id, status);
create or replace trigger trg_mentorships_updated before update on public.mentorships
  for each row execute function public.set_updated_at();

-- ---------- RLS (doc 08 §2.7) ----------
alter table public.job_referrals enable row level security;
alter table public.professionals enable row level security;
alter table public.mentorships enable row level security;

-- job_referrals
drop policy if exists "referrals public read" on public.job_referrals;
create policy "referrals public read" on public.job_referrals for select
  using (status = 'approved' and (expires_at is null or expires_at > now()));
drop policy if exists "referrals owner read" on public.job_referrals;
create policy "referrals owner read" on public.job_referrals for select using (referred_by = auth.uid());
drop policy if exists "referrals admin all" on public.job_referrals;
create policy "referrals admin all" on public.job_referrals for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "referrals owner insert" on public.job_referrals;
create policy "referrals owner insert" on public.job_referrals for insert
  with check (referred_by = auth.uid() and public.can_publish() and status = 'pending');
drop policy if exists "referrals owner update" on public.job_referrals;
create policy "referrals owner update" on public.job_referrals for update
  using (referred_by = auth.uid()) with check (referred_by = auth.uid());
drop policy if exists "referrals owner delete" on public.job_referrals;
create policy "referrals owner delete" on public.job_referrals for delete using (referred_by = auth.uid());

-- professionals
drop policy if exists "professionals public read" on public.professionals;
create policy "professionals public read" on public.professionals for select using (status = 'approved');
drop policy if exists "professionals owner read" on public.professionals;
create policy "professionals owner read" on public.professionals for select using (user_id = auth.uid());
drop policy if exists "professionals admin all" on public.professionals;
create policy "professionals admin all" on public.professionals for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "professionals owner insert" on public.professionals;
create policy "professionals owner insert" on public.professionals for insert
  with check (user_id = auth.uid() and public.can_publish() and status = 'pending');
drop policy if exists "professionals owner update" on public.professionals;
create policy "professionals owner update" on public.professionals for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "professionals owner delete" on public.professionals;
create policy "professionals owner delete" on public.professionals for delete using (user_id = auth.uid());

-- mentorships: só as partes e o admin enxergam
drop policy if exists "mentorships parties read" on public.mentorships;
create policy "mentorships parties read" on public.mentorships for select
  using (mentor_id = auth.uid() or mentee_id = auth.uid() or public.is_admin());
drop policy if exists "mentorships mentee insert" on public.mentorships;
create policy "mentorships mentee insert" on public.mentorships for insert
  with check (
    mentee_id = auth.uid() and public.can_publish() and status = 'requested'
    and exists (select 1 from public.professionals p where p.user_id = mentor_id and p.status = 'approved' and p.is_mentor)
    and (select count(*) from public.mentorships m where m.mentor_id = mentorships.mentor_id and m.status = 'accepted')
        < (select p.mentor_capacity from public.professionals p where p.user_id = mentorships.mentor_id)
  );
drop policy if exists "mentorships mentee cancel" on public.mentorships;
create policy "mentorships mentee cancel" on public.mentorships for update
  using (mentee_id = auth.uid() and status = 'requested') with check (mentee_id = auth.uid() and status = 'cancelled');
drop policy if exists "mentorships admin all" on public.mentorships;
create policy "mentorships admin all" on public.mentorships for all using (public.is_admin()) with check (public.is_admin());
-- aceite/recusa do mentor só via respond_mentorship()

-- ---------- moderação e resposta de mentoria (doc 08 §2.6; entity_id convertido para text) ----------
create or replace function public.moderate_referral(p_id uuid, p_status text, p_reason text default null)
returns public.job_referrals language plpgsql security definer set search_path = public as $$
declare v public.job_referrals;
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  if p_status not in ('approved','rejected') then raise exception 'STATUS_INVALIDO'; end if;
  if p_status = 'rejected' and (p_reason is null or char_length(p_reason) < 10) then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  update public.job_referrals set
    status = p_status, moderated_by = auth.uid(), moderated_at = now(), auto_hidden = false,
    rejection_reason = case when p_status = 'rejected' then p_reason else null end,
    expires_at = case when p_status = 'approved' then now() + interval '90 days' else expires_at end
  where id = p_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'job_referral', p_id::text, case when p_status = 'approved' then 'approve' else 'reject' end, p_reason);
  return v;
end $$;

create or replace function public.moderate_professional(p_id uuid, p_status text, p_reason text default null)
returns public.professionals language plpgsql security definer set search_path = public as $$
declare v public.professionals;
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  if p_status not in ('approved','rejected') then raise exception 'STATUS_INVALIDO'; end if;
  if p_status = 'rejected' and (p_reason is null or char_length(p_reason) < 10) then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  update public.professionals set
    status = p_status, moderated_by = auth.uid(), moderated_at = now(), auto_hidden = false,
    rejection_reason = case when p_status = 'rejected' then p_reason else null end
  where id = p_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'professional', p_id::text, case when p_status = 'approved' then 'approve' else 'reject' end, p_reason);
  return v;
end $$;

grant execute on function public.moderate_referral(uuid, text, text) to authenticated;
grant execute on function public.moderate_professional(uuid, text, text) to authenticated;

-- Aceite/recusa de mentoria pelo mentor
create or replace function public.respond_mentorship(p_id uuid, p_status text, p_reply text default null) returns public.mentorships
language plpgsql security definer set search_path = public as $$
declare v public.mentorships;
begin
  if p_status not in ('accepted','declined','completed') then raise exception 'STATUS_INVALIDO'; end if;
  update public.mentorships set status = p_status, reply = coalesce(p_reply, reply)
  where id = p_id and mentor_id = auth.uid() and status in ('requested','accepted') returning * into v;
  if v.id is null then raise exception 'NAO_ENCONTRADA'; end if;
  return v;
end $$;
grant execute on function public.respond_mentorship(uuid, text, text) to authenticated;

-- Demais funções desta fase (renew_job, renew_referral, report_entity, block_user, pip_enforce_daily_limit,
-- pip_reset_status_on_edit, view jobs_public): SQL completo no doc 08 §2.2, sempre com `entity_id = p_entity_id::text`.
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
create or replace trigger trg_stories_updated before update on public.stories
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
create or replace trigger trg_guard_story_status before insert or update on public.stories
  for each row execute function public.guard_member_status();

alter table public.stories enable row level security;
drop policy if exists "stories: public read approved" on public.stories;
create policy "stories: public read approved" on public.stories for select using (status = 'approved');
drop policy if exists "stories: own read" on public.stories;
create policy "stories: own read" on public.stories for select using ((select auth.uid()) = user_id);
drop policy if exists "stories: staff read" on public.stories;
create policy "stories: staff read" on public.stories for select using ((select public.is_admin()));
drop policy if exists "stories: own insert" on public.stories;
create policy "stories: own insert" on public.stories for insert with check ((select auth.uid()) = user_id);
drop policy if exists "stories: own update" on public.stories;
create policy "stories: own update" on public.stories for update using ((select auth.uid()) = user_id);
drop policy if exists "stories: staff update" on public.stories;
create policy "stories: staff update" on public.stories for update using ((select public.is_admin()));
drop policy if exists "stories: own or staff delete" on public.stories;
create policy "stories: own or staff delete" on public.stories
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

create or replace function public.moderate_story(p_story_id uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  update public.stories set status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else status end
  where id = p_story_id;
  insert into public.moderation_log (entity, entity_id, action, actor_id, note)
  values ('story', p_story_id::text, p_action, auth.uid(), p_reason);
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
create or replace trigger trg_questions_updated before update on public.questions
  for each row execute function public.set_updated_at();
create or replace trigger trg_guard_question_status before insert or update on public.questions
  for each row execute function public.guard_member_status();
alter table public.questions enable row level security;
drop policy if exists "questions: public read approved" on public.questions;
create policy "questions: public read approved" on public.questions for select using (status in ('approved','closed'));
drop policy if exists "questions: own read" on public.questions;
create policy "questions: own read" on public.questions for select using ((select auth.uid()) = user_id);
drop policy if exists "questions: staff read" on public.questions;
create policy "questions: staff read" on public.questions for select using ((select public.is_admin()));
drop policy if exists "questions: own insert" on public.questions;
create policy "questions: own insert" on public.questions for insert with check ((select auth.uid()) = user_id);
drop policy if exists "questions: own update" on public.questions;
create policy "questions: own update" on public.questions for update using ((select auth.uid()) = user_id);
drop policy if exists "questions: staff update" on public.questions;
create policy "questions: staff update" on public.questions for update using ((select public.is_admin()));
drop policy if exists "questions: own or staff delete" on public.questions;
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
create or replace trigger trg_answers_updated before update on public.answers
  for each row execute function public.set_updated_at();
alter table public.answers enable row level security;
drop policy if exists "answers: public read approved" on public.answers;
create policy "answers: public read approved" on public.answers for select using (status = 'approved');
drop policy if exists "answers: own read" on public.answers;
create policy "answers: own read" on public.answers for select using ((select auth.uid()) = user_id);
drop policy if exists "answers: staff read" on public.answers;
create policy "answers: staff read" on public.answers for select using ((select public.is_admin()));
drop policy if exists "answers: own insert" on public.answers;
create policy "answers: own insert" on public.answers for insert with check ((select auth.uid()) = user_id);
drop policy if exists "answers: own update" on public.answers;
create policy "answers: own update" on public.answers for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "answers: staff update" on public.answers;
create policy "answers: staff update" on public.answers for update using ((select public.is_admin()));
drop policy if exists "answers: own or staff delete" on public.answers;
create policy "answers: own or staff delete" on public.answers
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'questions_accepted_fk') then
    alter table public.questions
      add constraint questions_accepted_fk foreign key (accepted_answer_id) references public.answers(id) on delete set null;
  end if;
end $$;

create or replace function public.answers_count_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.questions q set answers_count = (select count(*) from public.answers a where a.question_id = q.id and a.status = 'approved')
  where q.id = coalesce(new.question_id, old.question_id);
  return null;
end; $$;
create or replace trigger trg_answers_count after insert or update or delete on public.answers
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
create or replace trigger trg_events_updated before update on public.events
  for each row execute function public.set_updated_at();
alter table public.events enable row level security;
drop policy if exists "events: public read published" on public.events;
create policy "events: public read published" on public.events for select using (status in ('published','done'));
drop policy if exists "events: staff all" on public.events;
create policy "events: staff all" on public.events for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'going' check (status in ('going','maybe','canceled')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
alter table public.event_rsvps enable row level security;
drop policy if exists "event_rsvps: own all" on public.event_rsvps;
create policy "event_rsvps: own all" on public.event_rsvps
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "event_rsvps: staff read" on public.event_rsvps;
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
create or replace trigger trg_tracks_updated before update on public.tracks
  for each row execute function public.set_updated_at();
alter table public.tracks enable row level security;
drop policy if exists "tracks: public read published" on public.tracks;
create policy "tracks: public read published" on public.tracks for select using (status = 'published');
drop policy if exists "tracks: staff all" on public.tracks;
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
drop policy if exists "track_steps: public read of published track" on public.track_steps;
create policy "track_steps: public read of published track" on public.track_steps
  for select using (exists (select 1 from public.tracks t where t.id = track_id and t.status = 'published') or (select public.is_admin()));
drop policy if exists "track_steps: staff all" on public.track_steps;
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
drop policy if exists "track_progress: own all" on public.track_progress;
create policy "track_progress: own all" on public.track_progress
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- award_badges(p_user_id uuid) returns setof text  (MOTOR DE REGRAS de badges.rule jsonb) e grant_badges_for_me():
-- criar AQUI, antes de complete_track_step, com o SQL literal do doc 09 §2.2 bloco 8 (depende de tracks, challenges,
-- stories, answers, events e, se existir, jobs). revoke de award_badges para anon/authenticated; grant de grant_badges_for_me a authenticated.

create or replace function public.complete_track_step(p_step_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_track uuid; v_total integer; v_done integer;
begin
  select track_id into v_track from public.track_steps where id = p_step_id;
  insert into public.track_progress (user_id, track_id, step_id) values (auth.uid(), v_track, p_step_id) on conflict do nothing;
  select count(*) into v_total from public.track_steps where track_id = v_track;
  select count(*) into v_done from public.track_progress where user_id = auth.uid() and track_id = v_track;
  if v_done >= v_total then perform public.award_badges(auth.uid()); end if;   -- motor de regras (formador, filho-de-sao-jose…); o client também chama grant_badges_for_me()
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
create or replace trigger trg_challenges_updated before update on public.challenges
  for each row execute function public.set_updated_at();
alter table public.challenges enable row level security;
drop policy if exists "challenges: public read published" on public.challenges;
create policy "challenges: public read published" on public.challenges for select using (status = 'published');
drop policy if exists "challenges: staff all" on public.challenges;
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
drop policy if exists "challenge_days: public read of published" on public.challenge_days;
create policy "challenge_days: public read of published" on public.challenge_days
  for select using (exists (select 1 from public.challenges c where c.id = challenge_id and c.status = 'published') or (select public.is_admin()));
drop policy if exists "challenge_days: staff all" on public.challenge_days;
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
drop policy if exists "challenge_progress: own all" on public.challenge_progress;
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
  if v_done >= v_days then perform public.award_badges(auth.uid()); end if;    -- motor de regras (pai-presente, provedor, disciplina-de-ferro)
end; $$;
grant execute on function public.complete_challenge_day(uuid, integer, text) to authenticated;

-- ---------- get_member_dashboard (aqui porque depende de jobs/tracks/challenges) ----------
create or replace function public.get_member_dashboard()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', (select coalesce(jsonb_agg(to_jsonb(c) order by c.birth_date), '[]') from public.children c where c.user_id = auth.uid()),
    'badges', (select coalesce(jsonb_agg(jsonb_build_object('slug',b.slug,'name',b.name,'icon',b.icon,'earned_at',ub.earned_at)), '[]')
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
-- 0007_ferramentas.sql — cache de mercado e uso de ferramentas (sem pg_cron: agendamentos só em 0008_cron.sql)

create table if not exists public.market_cache (
  key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now(),
  ttl_seconds integer not null default 1800
);
alter table public.market_cache enable row level security;
-- Leitura pública (dados de mercado não são sensíveis); escrita só service_role (supabaseAdmin em src/lib/market/cache.ts, via POST /api/market/refresh)
drop policy if exists "market_cache: public read" on public.market_cache;
create policy "market_cache: public read" on public.market_cache for select using (true);

-- Chaves de market_cache = `KEYS` de src/lib/market/fetchers.ts (doc 06 §2.5); TTLs em src/lib/market/cache.ts (doc 06 §2.3):
--   'fx:last'                 → AwesomeAPI /last (USD, EUR, GBP, ARS, BTC… em BRL), TTL 15 min; se falhar, PTAX do BCB marca source 'bcb'
--   'fx:daily:<PAR>:<dias>'   → AwesomeAPI /json/daily (ex.: fx:daily:USD-BRL:30), TTL 6 h
--   'ptax:<codigo>'           → BCB PTAX (ex.: ptax:USD), TTL 6 h
--   'crypto:simple'           → CoinGecko (BTC/ETH em BRL), TTL 10 min
--   'b3:quotes'               → Brapi (Ibovespa e ações; BRAPI_TOKEN opcional), TTL 30 min
--   'sgs:indicators'          → BCB SGS (Selic 432, CDI 4389, IPCA 13522…), TTL 12 h
--   'tesouro:titulos'         → Tesouro Direto, TTL 6 h
-- Quem grava é POST /api/market/refresh (src/lib/market/refresh.ts), chamado a cada 30 min por .github/workflows/market-refresh.yml.

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

-- tool_usage: uso das ferramentas, anônimo (user_id null) ou identificado. Insert direto pelo client (doc 06 §1.3 usage.ts);
-- leitura só staff. Colunas fixas do CLAUDE.md §8: id, tool_slug, user_id (nullable), created_at.
create table if not exists public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null check (length(tool_slug) <= 64),
  user_id uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_tool_usage_slug_created on public.tool_usage(tool_slug, created_at desc);
create index if not exists idx_tool_usage_user on public.tool_usage(user_id) where user_id is not null;
alter table public.tool_usage enable row level security;
drop policy if exists "tool_usage: anon insert" on public.tool_usage;
create policy "tool_usage: anon insert" on public.tool_usage for insert to anon with check (user_id is null);
drop policy if exists "tool_usage: auth insert" on public.tool_usage;
create policy "tool_usage: auth insert" on public.tool_usage for insert to authenticated
  with check (user_id is null or user_id = (select auth.uid()));
drop policy if exists "tool_usage: staff read" on public.tool_usage;
create policy "tool_usage: staff read" on public.tool_usage for select using ((select public.is_admin()));

-- Estatísticas para o admin e para o Painel Lisieux
create or replace function public.tool_usage_stats(p_days integer default 30)
returns table (tool_slug text, uses bigint, unique_users bigint)
language sql stable security definer set search_path = public as $$
  select tool_slug, count(*), count(distinct user_id)
  from public.tool_usage where created_at >= now() - make_interval(days => p_days)
  group by tool_slug order by 2 desc;
$$;
revoke all on function public.tool_usage_stats(integer) from public, anon;
grant execute on function public.tool_usage_stats(integer) to authenticated;
```

### 4.8 `supabase/migrations/0008_cron.sql` (agendamentos no banco)

> Aplicar **só depois** de o domínio estar no ar. Qualquer cron futuro que use `net.http_post` (ex.: `weekly-digest` do doc 07 §6.6)
> entra aqui e só depois de `select vault.create_secret('<valor>', 'CRON_SECRET');` — nunca nas migrations 0001–0007, que precisam
> rodar num projeto recém-criado. Até lá: refresh de mercado = GitHub Actions `market-refresh.yml`; expiração de vagas = `/api/cron/expire-jobs` manual.

```sql
-- 0008_cron.sql — único agendamento no banco: expiração diária de vagas (45 dias) e indicações (90 dias)
create extension if not exists pg_cron;
do $$
begin
  perform cron.unschedule('vdp-expire-jobs') from cron.job where jobname = 'vdp-expire-jobs';
  perform cron.schedule('vdp-expire-jobs', '15 3 * * *', $cron$ select public.expire_jobs(); $cron$);
end $$;
-- Mercado financeiro NÃO usa pg_cron (ver §1.2 item 7 e §7).
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

### 5.3 `posts.review` (kind = `review`) — formato ÚNICO = doc 04 §2.3

Vale para o editor, a rotina (`rev_art_gen.py`), o validador (`scripts/validate-content.mjs`, doc 04 §11) e os tipos TS
(`src/lib/pai-indica/types.ts`, doc 04 §2.5). Chaves em inglês (`score`, `criteria[].name`, `ideal_for`, `products`,
`winner_slug`); nenhuma outra grafia (`nota`, `criterios`, `ideal_para`, `produtos`, `vencedor`) é aceita. Exemplo copiado do doc 04 §2.3:

```json
{
  "product_slug": "philips-oneblade-qp2724",
  "score": 7.9,
  "criteria": [
    { "name": "Resultado",                 "weight": 30, "score": 8.0, "comment": "Apara e dá acabamento em barba de até 5 mm sem repuxar; não substitui lâmina para pele lisa." },
    { "name": "Conforto na pele",          "weight": 20, "score": 8.5, "comment": "Lâmina não toca a pele diretamente; menos irritação que barbeador de lâmina." },
    { "name": "Bateria e manutenção",      "weight": 15, "score": 7.0, "comment": "Cerca de 45 min por carga (NiMH), carga de 8 h; lâmina dura ~4 meses." },
    { "name": "Acabamento e durabilidade", "weight": 15, "score": 7.5, "comment": "Plástico leve; corpo lavável, mas não é à prova de queda." },
    { "name": "Custo-benefício",           "weight": 20, "score": 8.0, "comment": "Entrada da linha OneBlade; refil é o custo recorrente a considerar." }
  ],
  "pros": [
    "Apara, modela e faz acabamento com uma só lâmina",
    "Corpo lavável em água corrente",
    "Pentes de 1, 3 e 5 mm incluídos",
    "Leve (aprox. 95 g) e fácil de manobrar no pescoço"
  ],
  "cons": [
    "Bateria NiMH com carga lenta (8 h)",
    "Não deixa a pele 100% lisa como lâmina tradicional",
    "Refil da lâmina é despesa recorrente",
    "Sem indicador de bateria em porcentagem"
  ],
  "ideal_for": "Pai que mantém barba curta ou cavanhaque e quer um aparelho só para aparar e dar acabamento, rápido, no banho.",
  "not_ideal_for": "Quem quer a pele totalmente lisa todo dia ou precisa de aparelho profissional para corte de cabelo.",
  "verdict": "O OneBlade QP2724 é a porta de entrada mais sensata da linha: faz o básico muito bem, aguenta o banho e cabe no bolso. A bateria lenta é o preço de ser o modelo simples.",
  "how_we_evaluated": "Análise baseada na ficha técnica e no manual da Philips, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, YouTube). Não fizemos teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Estilo e Barba).",
  "sources": ["philips.com.br (ficha e manual)", "Amazon Brasil (anúncio)", "Reclame Aqui", "Mercado Livre", "Magalu"],
  "other_buyers": {
    "intro": "Procuramos padrões que se repetem em avaliações fora da Amazon.",
    "praises": ["Praticidade para aparar no banho", "Não irrita a pele", "Leve"],
    "complaints": ["Bateria demora para carregar", "Refil considerado caro"],
    "sources": ["Reclame Aqui", "Mercado Livre", "Magalu"],
    "none_found": false
  }
}
```

Regras: `criteria` tem **exatamente 5** itens; `weight` soma 100; `score` = média ponderada arredondada a 1 casa
(aqui: 8,0·0,30 + 8,5·0,20 + 7,0·0,15 + 7,5·0,15 + 8,0·0,20 = 7,875 → 7,9); `product_slug` existe em `products`;
`pros`/`cons` com 3 a 6 itens cada; nunca "R$" em nenhum campo.

Invariantes (`validateCriteria` em `src/lib/pai-indica/score.ts`, doc 04 §2.6, e `validate-content.mjs`): exatamente **5**
critérios, com os **nomes e pesos da categoria** em `src/lib/pai-indica/criterios.ts` (doc 04 §1.2 e §3.2; o nome pode virar
sinônimo específico ao produto, o peso não); soma dos `weight` = 100; `score` = média ponderada arredondada a 1 casa (tolerância
±0,15); `posts.product_score = review.score`; `product_slug` existe em `products` (ativo, com faixa de preço e review longa);
`posts.product_category`/`product_subcategory` são um par válido de `src/lib/pai-indica/taxonomia.ts`; nunca "R$" em campo
algum (a faixa vem de `products.price_min/max`); **sem alegação de teste físico** (`how_we_evaluated` segue o texto-base do doc 04 §1.3).

### 5.4 `posts.comparison` (kind = `comparativo` e `lista`) — formato ÚNICO = doc 04 §2.4

```json
{
  "criteria": [
    { "name": "Desempenho", "weight": 30 }, { "name": "Ergonomia e peso", "weight": 15 },
    { "name": "Durabilidade", "weight": 20 }, { "name": "Acessórios e garantia", "weight": 15 },
    { "name": "Custo-benefício", "weight": 20 }
  ],
  "products": [
    { "product_slug": "bosch-gsr-120-li-12v", "name": "Bosch GSR 120-LI", "role": "vencedor", "score": 8.4,
      "criteria_scores": [8.5, 8.5, 8.5, 8.0, 8.0],
      "one_liner": "A mais equilibrada: 2 baterias, maleta e torque de 30 Nm." },
    { "product_slug": "black-decker-ld12sp-b2", "name": "Black+Decker LD12SP", "role": "custo-beneficio", "score": 7.4,
      "criteria_scores": [7.0, 7.5, 7.0, 8.0, 8.0],
      "one_liner": "Para montar móvel e furar drywall de vez em quando." },
    { "product_slug": "makita-hp333dwye-12v", "name": "Makita HP333DWYE", "role": "premium", "score": 8.1,
      "criteria_scores": [8.5, 8.0, 8.5, 7.5, 7.5],
      "one_liner": "Tem impacto para alvenaria leve; paga-se pela marca e pela função extra." }
  ],
  "table": {
    "columns": ["Modelo", "Faixa de preço", "Torque máx.", "Baterias", "Impacto", "Garantia"],
    "rows": [
      ["Bosch GSR 120-LI", "{FAIXA:bosch-gsr-120-li-12v}", "30 Nm", "2 × 1,5 Ah", "Não", "12 meses + 6 com registro"],
      ["Black+Decker LD12SP", "{FAIXA:black-decker-ld12sp-b2}", "20 Nm", "1 × 1,5 Ah", "Não", "24 meses"],
      ["Makita HP333DWYE", "{FAIXA:makita-hp333dwye-12v}", "30 Nm", "2 × 1,5 Ah", "Sim", "12 meses"]
    ]
  },
  "winner_slug": "bosch-gsr-120-li-12v",
  "verdict_by_profile": [
    { "profile": "Se você monta móvel, pendura quadro e troca fechadura de vez em quando", "pick_slug": "black-decker-ld12sp-b2", "reason": "Resolve o uso doméstico leve por menos." },
    { "profile": "Se você quer uma ferramenta para a vida toda e já tem outras Bosch 12 V", "pick_slug": "bosch-gsr-120-li-12v", "reason": "Melhor equilíbrio entre torque, bateria dupla e assistência." },
    { "profile": "Se você fura parede de tijolo com frequência", "pick_slug": "makita-hp333dwye-12v", "reason": "É a única das três com impacto." }
  ],
  "how_we_evaluated": "Comparação baseada em ficha técnica dos fabricantes, manuais, anúncios da Amazon Brasil e opiniões fora da Amazon. Sem teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Ferramentas)."
}
```

Regras: `comparativo` tem 2 a 3 `products`; `lista` tem 3 a 7. `role` ∈ {`vencedor`, `custo-beneficio`, `premium`,
`alternativa`, `nao-indicamos`} em comparativo; em `lista`, `role` é o selo ∈ {`escolha-do-editor`,
`melhor-custo-beneficio`, `melhor-premium`, `melhor-barato`, `melhor-para-iniciantes`, `melhor-compacto`,
`melhor-para-familias`, `melhor-silencioso`, `melhor-desempenho`, `sem-selo`} e no máximo 1 produto por selo (exceto
`sem-selo`). `winner_slug` ∈ `products[].product_slug`; `product_score` do post = `score` do vencedor. `table` é
obrigatória em comparativo e opcional em lista; `{FAIXA:slug}` só nas células da tabela (o gerador troca). A ordem de
`products` = ordem das linhas da tabela = ordem das seções do corpo. `criteria_scores` segue a ordem de `criteria`.

`posts.product_score` em comparativo/lista = `score` do produto `winner_slug`. `products_for_post()` e `posts_for_product()`
(§4.3) leem `comparison->'products'->>'product_slug'` e `review->>'product_slug'` — por isso a chave é sempre `product_slug`.

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

Fonte dos valores: **os hex do CLAUDE.md §9** (primária `#14505C`, secundária `#1F2429`, destaque `#D9822B`, fundo `#F4EFE6`,
texto `#1B1F23`, sucesso `#2F7D4F`, atenção `#D9A21B`, alerta `#B23A3A`; escuro: fundo `#14181C`, cartões `#1F2429`). Não inventar
cor nova; derivar com opacidade. O arquivo real é **`src/styles.css`** (não existe `src/index.css` nem `src/styles/tokens.css`;
`--vp-*` do doc 00 §7.5 é só nomenclatura de marca). `components/ui/*` do VDM usam `hsl(var(--x))`, por isso os tokens shadcn
continuam como triplets HSL em `:root`/`.dark` — cada um é a conversão exata do hex ao lado. `--radius: 0.5rem` (doc 03 §4.1).
Sem caixa alta automática em títulos.

```css
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";
@custom-variant dark (&:is(.dark *));

@theme {
  --font-display: "Barlow Condensed", "Arial Narrow", sans-serif;
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;

  /* Marca — hex do CLAUDE.md §9 (classes bg-brand-primary, text-brand-accent…) */
  --color-brand-primary: #14505C;
  --color-brand-secondary: #1F2429;
  --color-brand-accent: #D9822B;
  --color-brand-sand: #F4EFE6;
  --color-brand-ink: #1B1F23;
  --color-brand-dark: #14181C;
  --color-brand-card-dark: #1F2429;

  /* Semáforo do Pai */
  --color-success: #2F7D4F;
  --color-warning: #D9A21B;
  --color-danger: #B23A3A;

  /* Mapeamento shadcn (components/ui/* copiados do VDM) */
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
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);

  --shadow-soft: 0 10px 30px -12px color-mix(in oklab, #14505C 18%, transparent);
  --shadow-elegant: 0 18px 50px -20px color-mix(in oklab, #14505C 35%, transparent);
}

@layer base {
  :root {
    /* tema claro — triplets HSL = conversão exata dos hex do CLAUDE.md §9 */
    --background: 40 39% 93%;          /* #F4EFE6 areia */
    --foreground: 210 13% 12%;         /* #1B1F23 texto */
    --card: 40 50% 97%;                /* #FAF7F1 (areia + 4% de branco) */
    --card-foreground: 210 13% 12%;
    --popover: 40 50% 97%;
    --popover-foreground: 210 13% 12%;
    --primary: 190 64% 22%;            /* #14505C azul-petróleo */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 14% 14%;          /* #1F2429 grafite */
    --secondary-foreground: 40 39% 93%;
    --accent: 28 69% 51%;              /* #D9822B âmbar/couro */
    --accent-foreground: 0 0% 100%;
    --muted: 40 20% 86%;               /* areia escurecida */
    --muted-foreground: 210 8% 38%;
    --destructive: 0 51% 46%;          /* #B23A3A alerta */
    --destructive-foreground: 0 0% 100%;
    --border: 40 18% 80%;
    --input: 40 18% 80%;
    --ring: 190 64% 22%;
    --radius: 0.5rem;
    --gradient-hero: linear-gradient(135deg, #14505C 0%, #1C6B7A 60%, #D9822B 140%);
  }
  .dark {
    --background: 210 17% 9%;          /* #14181C fundo escuro */
    --foreground: 40 30% 92%;
    --card: 210 14% 14%;               /* #1F2429 cartões */
    --card-foreground: 40 30% 92%;
    --popover: 210 14% 14%;
    --popover-foreground: 40 30% 92%;
    --primary: 190 50% 42%;            /* petróleo clareado para contraste (derivado de #14505C) */
    --primary-foreground: 210 17% 9%;
    --secondary: 210 12% 22%;
    --secondary-foreground: 40 30% 92%;
    --accent: 28 75% 58%;              /* âmbar clareado (derivado de #D9822B) */
    --accent-foreground: 210 17% 9%;
    --muted: 210 12% 18%;
    --muted-foreground: 40 10% 65%;
    --destructive: 0 55% 55%;
    --destructive-foreground: 0 0% 100%;
    --border: 210 12% 22%;
    --input: 210 12% 22%;
    --ring: 190 50% 42%;
  }
  * { @apply border-border; }
  body { @apply bg-background text-foreground font-sans antialiased; }
  h1, h2, h3, h4 { @apply font-display font-semibold tracking-tight; }   /* sem uppercase automático */
  h1 { @apply text-4xl md:text-5xl; }
  h2 { @apply text-3xl md:text-4xl; }
  h3 { @apply text-2xl; }
}
```

### 6.2 Tipografia e espaçamento

- Títulos: **Barlow Condensed** 600/700, sem caixa alta automática (caixa alta só em eyebrows e rótulos curtos, via classe `uppercase`; identidade "placa de oficina" vem da fonte condensada, não do CSS global). Corpo: **Inter** 400/500/600, 17px no artigo (`prose-lg`), line-height 1.7.
- Carregar via Google Fonts no `__root.tsx`: `https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap` com `<link rel="preconnect">`.
- Escala de espaçamento: Tailwind padrão; seções da home com `py-12 md:py-20`; container `max-w-7xl px-6`; artigo `max-w-3xl`.
- Raio: `--radius: 0.5rem` (cantos bem menos arredondados que o VDM, 1rem; mesmo valor do doc 03 §4.1). Sombras discretas; sem gradientes pastel.

### 6.3 Componentes-chave (contratos)

| Componente | Props | Comportamento |
|---|---|---|
| `ReviewBadge` | `{ score: number; size?: 'sm'|'md'|'lg'; label?: string }` | Círculo com a nota (1 casa, vírgula, `formatScore`). Cores e rótulos vêm de `SCORE_BANDS`/`bandOf()` em `src/lib/pai-indica/score.ts` (doc 04 §2.6): 9,0–10 excepcional · 8,0–8,9 muito bom · 7,0–7,9 bom para um perfil · 6,0–6,9 regular · abaixo de 6 não recomendado (régua do CLAUDE.md §7). `aria-label="Nota 8,7 de 10"`. |
| `ScoreScaleNote` | `{ compact?: boolean }` | Retrátil (`<details>`, fechado por padrão). Lista as faixas de `SCORE_BANDS` (doc 04 §2.6): "Notas de 0 a 10, com uma casa decimal. 9,0 a 10: excepcional; 8,0 a 8,9: muito bom; 7,0 a 7,9: bom para um perfil; 6,0 a 6,9: regular; abaixo de 6: não recomendado. A nota é a média ponderada de 5 critérios da categoria; avaliação independente, links de afiliado não mudam a nota." |
| `PriceRange` | `{ min: number|null; max: number|null; checkedAt: string|null }` | "Faixa de preço: R$ 520 a R$ 690 (pesquisado em 20/10/2026)". Nunca exibe preço único; se nulos mostra "Consulte o preço na Amazon". |
| `AffiliateButton` | `{ href: string; productSlug: string; productName?: string }` | Texto **sempre** "Comprar agora na Amazon" (em comparativos: "Comprar <produto> agora na Amazon"), classe `btn-comprar`. `rel="sponsored nofollow noopener"`, `target="_blank"`, anexa `?tag=PUBLIC_AMAZON_TAG` se ausente, dispara GA4 `affiliate_click {product_slug}`; fundo `accent`, ícone `ShoppingCart`. |
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
| Vercel | Projeto `vocacaodepai` no time **"Portal da AI"**, framework preset "Other", build `npm run build`, output `.vercel/output` (Nitro preset `vercel`), Node 22. Env vars na seção 8. **Sem Vercel Cron.** Agendamentos: `.github/workflows/market-refresh.yml` (a cada 30 min, `curl` em `/api/market/refresh` com `Authorization: Bearer CRON_SECRET`), `.github/workflows/newsletter-weekly.yml` (sexta, `/api/newsletter/weekly`) e pg_cron `vdp-expire-jobs` (`0008_cron.sql`, §4.8). A rota `/api/cron/expire-jobs` (`Authorization: Bearer CRON_SECRET`) existe só para disparo manual. |
| Sitemap | `src/routes/sitemap[.]xml.ts` gera dinamicamente: estáticas (home, seções, institucionais), `/post/$slug` e `/pai-indica/$slug` (posts publicados; `lastmod = updated_at`), `/categoria/$slug`, `/loja/$slug` (ativos), `/loja/categoria/$slug`, `/loja/digital/$slug` (produtos digitais `published`), `/ferramentas/$slug`, `/pai-indica-pai/vagas/$slug` (aprovadas e não expiradas), `/formacao/$slug`, `/desafios/$slug`, `/perguntas/$slug` (aprovadas), `/historias/$id` (aprovadas). Cache `s-maxage=3600`. Referenciado em `public/robots.txt`. |
| RSS | `src/routes/rss[.]xml.ts` (pacote `feed`): últimos 30 posts publicados, `<content:encoded>` com HTML do `tiptap-html.ts`, categorias, autor. Link `<link rel="alternate" type="application/rss+xml">` no `__root.tsx`. |
| OG image | `src/routes/api/og.ts` (`@vercel/og`): 1200×630, fundo `primary`, faixa `accent`, título (Barlow Condensed), `KindBadge` e `ReviewBadge` quando `kind=review`, logo. Query: `?title=&kind=&score=&category=`. Cache `s-maxage=86400`. Fallback estático `public/og-default.png`. |
| JSON-LD (em `src/lib/seo.ts`) | Home: `WebSite` + `SearchAction` + `Organization`. Post `artigo`/`noticia`: `Article`/`NewsArticle` + `BreadcrumbList` + `FAQPage` (se `faq`). `review`: `Review` com `itemReviewed` (`Product`, `brand`) e `reviewRating {ratingValue, bestRating:10}` + `Article`. `comparativo`/`lista`: `ItemList` com `ListItem` → `Product`. Loja `/loja/$slug`: `Product` com `offers` **sem** `price` fixo (usar `priceSpecification` com `minPrice`/`maxPrice`, `priceCurrency: BRL`) + `AggregateRating` se `rating_count>0`. Produto digital `/loja/digital/$slug`: `Product` + `Offer` (preço próprio, `priceCurrency: BRL`, `availability: OnlineOnly`) + `BreadcrumbList` (doc 09 §12b.5). Vaga: `JobPosting` (`title`, `hiringOrganization`, `jobLocation`, `employmentType` mapeado de `type`, `validThrough = expires_at`, `baseSalary` se informado). Evento: `Event`. Trilha: `Course`. Ferramenta: `SoftwareApplication` (`applicationCategory: FinanceApplication`). Pergunta: `QAPage`. |
| Analytics | `@vercel/analytics` (`<Analytics />`) + GA4 via `src/lib/ga4.ts` (ID em `PUBLIC_GA4_ID`), eventos: `affiliate_click`, `tool_use`, `newsletter_subscribe`, `job_view`, `job_post`, `challenge_day_done`. Consentimento: banner simples (LGPD) antes de GA4/AdSense. |
| Search Console | Verificação por DNS TXT; propriedade de domínio. Edge function `seo-search-console` (copiada do VDM) grava em `seo_search_stats` 1x/dia; o admin e o Painel Lisieux leem via `hub.functions.ts`. |
| AdSense | `public/ads.txt` com `google.com, pub-<id>, DIRECT, f08c47fec0942fa0`; o id do publisher é a constante `ADSENSE_PUB_ID` em `src/lib/site.ts` (não é variável de ambiente; preenchida quando o AdSense aprovar); script carregado em `__root.tsx` só após consentimento; `AdSlot` nas posições: após o 1º H2, meio do artigo, fim do artigo, sidebar da listagem. Nunca em `/admin`, `/area-do-pai`, `/minha-conta`, `/entrar`, `/cadastro`. |
| Páginas obrigatórias (AdSense + Amazon Associados) | `/sobre` (quem somos, equipe, linha editorial), `/contato` (formulário funcional), `/politica-de-privacidade` (LGPD, cookies, GA4, AdSense), `/termos-de-uso`, `/politica-de-afiliados` com a frase exigida pela Amazon: "Como associado da Amazon, o Vocação de Pai recebe comissões por compras qualificadas." Rodapé linka as cinco. |
| Imagens | Capas via `stock-photos` (Pexels/Wikimedia) com crédito em `cover_image_alt`/legenda; proxy `/api/img/*` com resize e cache 1 ano; `loading="lazy"` fora da dobra; `width/height` sempre definidos. |
| Performance | SSR + cache `s-maxage=300, stale-while-revalidate=3600` nas páginas públicas; `react-query` com `staleTime` 5 min; fontes com `display=swap`; LCP alvo < 2,5 s. |
| Painel Lisieux | `hub.functions.ts` expõe `GET /api/hub/metrics` (`Authorization: Bearer CRON_SECRET` — mesmo segredo dos crons; o grupovdp guarda o valor no secret dele) com views 7/30d, posts publicados, produtos ativos, cliques de afiliado (GA4), `tool_usage_stats`, vagas aprovadas, membros ativos. O grupovdp consome e exibe o VDP ao lado dos outros sites (registro do agente `rt-vocacaodepai`: doc 10 §11). |
| Backup e incidentes | PITR do Supabase (ativar no plano Pro) **ou** `supabase db dump` semanal via `.github/workflows/backup.yml` (secret `SUPABASE_DB_PASSWORD`, só CI) para o bucket privado `backups` do Storage, retenção 30 dias; `storage` (`covers`, `products`, `avatars`, `digital-products`) replicado pelo mesmo workflow; **teste de restore trimestral** num branch do Supabase (`mcp__Supabase__create_branch`). Plano de incidente: isolar a chave vazada (rotacionar `service_role` no painel e nas envs), registrar em `moderation_log (entity='incident')`, comunicar titulares e a ANPD no prazo da Resolução CD/ANPD 15/2024. Responsável (encarregado LGPD): Bruno Danello. Dados de menores (`children`) só com `birth_precision` mínimo necessário (§4.1). |

---

## 8. Variáveis de ambiente e secrets

**Lista fechada** (= CLAUDE.md §13 + `CRON_SECRET` + Turnstile). `.env.example` (commitado) lista exatamente estas, com valor vazio e
comentário; `.env` está no `.gitignore`. **Nenhum outro nome de variável de ambiente pode aparecer nos docs de fase.** Chave ausente →
registrar em `PROGRESSO.md` → "Pendências do dono" e usar fallback. Prefixos: `VITE_*` e `PUBLIC_*` chegam ao cliente
(`vite.config.ts`: `vite: { envPrefix: ["VITE_", "PUBLIC_", "TURNSTILE_SITE_KEY"] }`); o resto é só servidor.

| Nome | Onde | Para quê |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel (todas as envs) · `.env` · Routine | `https://<SUPABASE_PROJECT_REF>.supabase.co` (cliente e SSR) |
| `VITE_SUPABASE_ANON_KEY` | Vercel · `.env` · Routine · validador | Chave anon/publishable (pública, protegida por RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (só server) · Routine | `supabaseAdmin` (`client.server.ts`): rotina, refresh de mercado, newsletter, expiração, admin stats. Nunca no cliente |
| `PUBLIC_SITE_URL` | Vercel · `.env` | `https://vocacaodepai.com.br` (canonical, OG, sitemap, RSS, e-mails) |
| `PUBLIC_AMAZON_TAG` | Vercel · `.env` · Routine | Tag de Associado anexada a toda `affiliate_url` (`?tag=`) |
| `RESEND_API_KEY` | Vercel (server) · Supabase Vault (edge functions de e-mail) | Envio de e-mails. Remetente fixo `Vocação de Pai <contato@vocacaodepai.com.br>` e destino do contato são constantes em `src/lib/site.ts` |
| `PEXELS_API_KEY` | Supabase Vault/Edge secrets (`stock-photos`) · Routine | Capas e imagens de corpo (1ª fonte) |
| `PIXABAY_API_KEY` | Supabase Vault/Edge secrets (`stock-photos`) · Routine | Capas e imagens de corpo (2ª fonte) |
| `BRAPI_TOKEN` (opcional) | Vercel (server) | Cotações B3 em `src/lib/market/sources/brapi.ts`; sem token, o Mercado do pai mostra o último dado em cache com aviso |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Painel do Supabase Auth (provider Google) · `.env.example` só como documentação | Login com Google (doc 07 §1.2) |
| `PUBLIC_GA4_ID` | Vercel · `.env` | `G-XXXXXXXXXX` (`src/lib/ga4.ts`) |
| `CRON_SECRET` | Vercel (server) · GitHub Actions (secret) · Supabase Vault · grupovdp | **Todos** os crons/refresh/integrações: `/api/market/refresh`, `/api/cron/expire-jobs`, `/api/cron/vagas-digest`, `/api/newsletter/weekly`, `/api/hub/metrics`, crons `net.http_post` de `0008_cron.sql` |
| `TURNSTILE_SITE_KEY` | Vercel · `.env` (exposta ao cliente via `envPrefix`) | Widget Cloudflare Turnstile no cadastro e nos formulários de membros |
| `TURNSTILE_SECRET_KEY` | Vercel (server) | Validação server-side do Turnstile |

Equivalências obrigatórias (nome que apareça em versão antiga de qualquer doc → nome oficial): `VITE_SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY` → `VITE_SUPABASE_ANON_KEY`; `SUPABASE_URL` → `VITE_SUPABASE_URL`; `SITE_URL`,
`VITE_SITE_URL` → `PUBLIC_SITE_URL`; `VITE_AMAZON_TAG`, `AMAZON_ASSOCIATE_TAG` → `PUBLIC_AMAZON_TAG`; `VITE_GA4_ID` → `PUBLIC_GA4_ID`;
`MARKET_REFRESH_TOKEN`, `MARKET_REFRESH_SECRET`, `NEWSLETTER_CRON_SECRET`, `JOBS_CRON_SECRET`, `INTERNAL_FN_SECRET`, `HUB_API_KEY`,
`SEO_SYNC_INTERNAL_SECRET` → `CRON_SECRET`; `VITE_TURNSTILE_SITE_KEY` → `TURNSTILE_SITE_KEY`; `AWESOMEAPI_TOKEN`, `COINGECKO_API_KEY`
→ não existem (AwesomeAPI e CoinGecko são usadas sem chave); `VITE_ADSENSE_PUB_ID`, `VITE_ADSENSE_CLIENT`, `VITE_ADSENSE_SLOT_*`,
`RESEND_FROM`, `CONTACT_TO_EMAIL` → constantes em `src/lib/site.ts` / `src/lib/adsense.ts`; `BILLING_ENABLED`, `VITE_BILLING_ENABLED`
→ `plans.active` do plano pago (false até o dono ligar a cobrança).

Segredos que **não** são variáveis do app (não entram no `.env.example`; ficam só onde indicado):

| Nome | Onde | Para quê |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | GitHub Actions (`backup.yml`) · CLI local | `supabase db dump`, deploy de edge functions por CLI (o normal é o MCP) |
| `GH_PAT_AUTOMERGE` | GitHub Actions | Token com permissão de merge para `auto-merge.yml` |
| `GSC_SERVICE_ACCOUNT_JSON` | Supabase Edge Function secrets (`seo-search-console`) | Conta de serviço do Search Console |
| `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` | Vercel (server) — **fase futura**, só quando o dono ligar a cobrança | Assinatura paga do plano `pai-de-valor` (doc 07 §7.3) |
| `HOTMART_HOTTOK` | Supabase Edge Function secrets (`hotmart-webhook`) | Token (hottok) que autentica o webhook de compras da Hotmart dos produtos digitais (doc 09 §12b.6) |

A Routine do Claude Code roda com a assinatura do Claude (sem `ANTHROPIC_API_KEY`), igual ao Vocação de Mãe.

---

## 9. Convenções de execução para o Sonnet

1. **Branch**: toda sessão trabalha em `claude/<fase>-<assunto>` (ex.: `claude/fase-1-fundacao`, `claude/rotina-2026-10-25`). Nunca commitar direto em `main`.
2. **PR**: título em PT-BR no imperativo ("Cria migrations 0001–0007 e layout base"); corpo com o checklist de aceite da fase e o link do doc; label `claude`. `auto-merge.yml` mescla PRs `claude/*` com checks verdes.
3. **Validações obrigatórias antes do push**: `npm run build && npm run lint && node scripts/validate-content.mjs` (CLAUDE.md §4.1; `npm run typecheck` também, se existir). Build quebrado = não faz push.
4. **Migrations de schema** (0001–0007 e futuras `0008+`): aplicar com `mcp__Supabase__apply_migration` no projeto `<SUPABASE_PROJECT_REF>` com `name` igual ao arquivo (sem `.sql`) e, no mesmo commit, salvar o arquivo em `supabase/migrations/`. Depois rodar `mcp__Supabase__get_advisors` (security + performance) e corrigir avisos antes do PR. Revisar o SQL antes de aplicar (ex.: nomes de funções referenciadas já existem na ordem).
5. **Migrations de conteúdo** (rotina): nome `00NN_<descricao>.sql` (CLAUDE.md §4.2); só `insert ... on conflict (slug) do update` em `posts`/`products`/`product_price_checks`; **nunca** `DROP`, `DELETE`, `TRUNCATE`, `ALTER TABLE` em rotina.
6. **Staging table**: a rotina grava o JSON do body em `_tmp_post_staging (k, data)` via `apply_migration`, valida (`validate-content.mjs` lê a staging), promove para `posts` com `insert … select data::jsonb …` e limpa a chave (`delete from _tmp_post_staging where k = …` é a única exceção permitida ao "nunca DELETE", restrita a essa tabela).
7. **Tipos**: após qualquer migration de schema, `npm run types:supabase` e commitar `src/integrations/supabase/types.ts`.
8. **Commits em PT-BR**, imperativo, ≤ 72 caracteres no título, corpo explicando o porquê. Terminar com as linhas de atribuição `Co-Authored-By` e `Claude-Session` fornecidas pelo ambiente.
9. **Sem segredos no repositório**: nunca colar chaves em código, migrations ou docs; usar `get_secret()`/env.
10. **Linha editorial**: respeitar `docs/plano/00-visao-posicionamento-e-marca.md` (família tradicional, tom direto e respeitoso); o `validate-content.mjs` bloqueia termos proibidos e preços exatos.
11. **Rotas**: as rotas oficiais são as da tabela principal do §1.3 **mais** as "Rotas secundárias" listadas logo abaixo dela (que vêm dos docs de fase: 03 §6.5, 05 §7, 06 §0.2, 07 §0/§4.7, 08 §3, 09 §0, 10 §8–§10, 11 §12). Rota fora dessas listas exige, **no mesmo PR**, acrescentá-la ao §1.3 deste doc, ao `sitemap[.]xml.ts` (se pública) e ao JSON-LD do §7.
12. **Progresso**: ao fim de cada sessão, atualizar `docs/plano/PROGRESSO.md` (data, fase, o que foi feito, o que falta, links de PR).
13. **Esforço**: não refatorar o que não foi pedido; copiar do VDM quando marcado `[COPIAR]`; perguntar só se um critério de pronto for impossível.

---

## 10. Fases

| Id | Título | Objetivo | Doc | Dependências | Critério de pronto |
|---|---|---|---|---|---|
| F1 | Fundação | Clonar VDM, remover Lovable/MCP/i18n/maternidade, aplicar 0001–0007, tokens de design, layout, home, blog, busca, institucionais, auth básica, deploy na Vercel com domínio | `03-fase-1-fundacao.md` | — | `npm run build && lint && typecheck` verdes; 7 migrations aplicadas sem avisos críticos no advisor; home, `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca`, `/sobre`, `/contato`, `/politica-*`, `/termos-de-uso`, `/entrar`, `/cadastro` renderizam em produção; sitemap e RSS respondem 200; 10 posts seed publicados |
| F2 | Pai Indica (reviews) | Kinds `review`/`comparativo`/`lista`, componentes ReviewBadge/ScoreScaleNote/ComparisonTable, listagem com filtros, JSON-LD Review/ItemList, editor admin com ReviewFields, validador de review | `04-fase-2-pai-indica-reviews.md` | F1 | `/pai-indica` lista e filtra por kind/categoria; 3 reviews, 2 comparativos e 1 lista publicados; `validate-content.mjs` valida `review`/`comparison`; OG image com nota |
| F3 | Loja do Pai | Produtos, categorias (10 slugs de `src/lib/pai-indica/taxonomia.ts`), faixa de preço, AffiliateButton, review longa, páginas `/loja*` (+ `/loja/ofertas`, `/loja/presentes`), admin de produtos e filas, JSON-LD Product com faixa | `05-fase-3-loja.md` | F1 | **60 produtos** ativos (6 por categoria, doc 05 §10), ≥ 20 com review longa real e ≥ 15 com faixa de mercado pesquisada; todos com `affiliate_url` com tag e ≥ 3 fotos oficiais; `/loja/categoria/$slug` filtra; produto exibe reviews relacionados (`posts_for_product`) |
| F4 | Caixa de Ferramentas | Registro de ferramentas (17 slugs do doc 06 §0.2), conversor de moedas, mercado financeiro (recharts), calculadoras, `src/lib/market/*` + `POST /api/market/refresh` + `market-refresh.yml`, `tool_usage` | `06-fase-4-ferramentas.md` | F1 | `/ferramentas/conversor-de-moedas` converte 6 moedas com dados < 30 min; `/ferramentas/mercado-financeiro` mostra 4 indicadores + gráfico 30 dias; `market_cache` atualizada pelo workflow; `tool_usage` registra uso anônimo e identificado |
| F5 | Área do Pai (membros) | Onboarding, painel `/area-do-pai`, `/minha-conta`, filhos, itens salvos, badges, plano gratuito, cookies de sessão SSR | `07-fase-5-area-do-pai-membros.md` | F1 | Cadastro → onboarding → painel em < 3 cliques; `get_member_dashboard` alimenta o painel; salvar post/produto funciona; badge `primeiro-passo` concedida; AdSense ausente nas páginas de membro |
| F6 | Pai Indica Pai | Vagas (criar, listar, filtrar, moderar, expirar em 45 dias), indicações de profissional/serviço/empresa, diretório de profissionais, mentoria (`is_mentor`), JSON-LD JobPosting, e-mails de moderação | `08-fase-6-pai-indica-pai.md` | F5 | Membro publica vaga → fica `pending` → admin aprova em `/admin/pai-indica-pai` → aparece em `/pai-indica-pai/vagas` e no sitemap; `expire_jobs` roda (pg_cron `vdp-expire-jobs`); indicação aprovada aparece em `/pai-indica-pai/indicacoes`; `/profissionais` e `/mentoria` listam aprovados e o pedido de mentoria chega ao mentor |
| F7 | Irmandade e Formação | Histórias, perguntas/respostas, eventos com RSVP, trilhas com progresso, desafios diários, badges, editor admin de trilhas/desafios/eventos | `09-fase-7-irmandade-e-formacao.md` | F5 | 2 trilhas (≥ 5 passos) e 2 desafios (21 e 30 dias) publicados; concluir trilha concede `formador`; perguntas moderadas; evento com contagem de RSVP; `/irmandade` resume as três áreas |
| F8 | Automação, rotinas e painel | **Routine do Claude Code** diária com os **volumes diários = doc 10 §2.2** (scripts Python de `scripts/rotina/`, doc 10 §4.1), staging table, `validate.yml`, `seo-search-console`, newsletter semanal, integração com Painel Lisieux (`/api/hub/metrics`), GA4/AdSense/Search Console ativos | `10-fase-8-automacao-rotinas-e-painel.md` | F2, F3, F4 | Rotina abre PR `claude/rotina-*` com conteúdo validado e auto-merge; 7 dias seguidos sem falha; Painel Lisieux exibe views, SEO e uso de ferramentas do VDP; newsletter semanal enviada para confirmados |

Ordem recomendada de execução: F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 (F2–F4 podem rodar em paralelo após F1; F6 e F7 em paralelo após F5).
