# FASE 4 — Caixa de Ferramentas (`/ferramentas` e `/ferramentas/$slug`)

> Documento de execução. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code dentro de
> `/home/user/vocacaodepai`. Tudo aqui já está decidido: siga os passos na ordem, use os caminhos
> exatos e verifique os critérios de aceite antes de encerrar cada sessão.
>
> Projeto: **Vocação de Pai** (vocacaodepai.com.br). Stack fixa: TanStack Start (React 19 + Vite +
> TypeScript) + Tailwind 4 + shadcn/Radix + Supabase (projeto novo, região sa-east-1, ref
> `<SUPABASE_PROJECT_REF>`) + Vercel (time "Portal da AI") + Resend. Base: código clonado de
> `vocacaodemae` e adaptado na Fase 1 (sem i18n, só PT-BR).

---

## 0. Visão geral da fase

### 0.1 Objetivo

Entregar a seção **Caixa de Ferramentas**: um índice em `/ferramentas` (organizado por categoria) e
17 ferramentas em `/ferramentas/$slug`, todas com a mesma casca (`ToolLayout`): SEO completo, JSON-LD
(`SoftwareApplication` + `HowTo` + `FAQPage` + `BreadcrumbList`), bloco "Como usar", FAQ, links para
artigos relacionados, botão "Salvar na Área do Pai" (tabela `saved_items`), registro anônimo de uso
(tabela `tool_usage`) e, nas ferramentas de mercado, dados vivos com cache em `market_cache`
atualizados por cron.

As duas ferramentas de destaque exigidas pelo dono são **Conversor de moedas**
(`/ferramentas/conversor-de-moedas`) e **Mercado financeiro hoje** (`/ferramentas/mercado-financeiro`).

### 0.2 Lista fechada de ferramentas desta fase (slugs fixos)

| # | Slug | Categoria | Dados externos |
|---|------|-----------|----------------|
| 1 | `conversor-de-moedas` | Dinheiro | AwesomeAPI + PTAX/BCB |
| 2 | `mercado-financeiro` | Dinheiro | AwesomeAPI, CoinGecko, Brapi, BCB SGS, Tesouro |
| 3 | `custo-do-filho` | Dinheiro | não (dados estáticos editáveis) |
| 4 | `licenca-paternidade` | Família | não (regras em JSON) |
| 5 | `calculadora-de-churrasco` | Churrasco & Cozinha | não |
| 6 | `cortes-de-carne` | Churrasco & Cozinha | não (`cortes.json`) |
| 7 | `orcamento-familiar` | Dinheiro | não (salva no perfil se logado) |
| 8a | `juros-compostos` | Dinheiro | não |
| 8b | `reserva-de-emergencia` | Dinheiro | não |
| 9 | `pensao-alimenticia` | Dinheiro | não |
| 10 | `conversor-de-unidades` | Casa & Oficina (também em Churrasco & Cozinha) | não |
| 11 | `kit-de-ferramentas` | Casa & Oficina | não (links para a Loja do Pai) |
| 12 | `nomes-de-filhos` | Família | não (`nomes-data.ts` adaptado do VDM: lista neutra de nomes; textos reescritos para o pai; campo `saint` novo) |
| 13a | `calendario-de-vacinacao` | Família | não (`vacinas-data.ts` **próprio**, escrito do zero a partir do Calendário Nacional de Vacinação do Ministério da Saúde — nada copiado do VDM) |
| 13b | `marcos-do-desenvolvimento` | Família | não (`marcos-data.ts` **próprio**, escrito do zero a partir da Caderneta da Criança do Ministério da Saúde — nada copiado do VDM) |
| 14 | `imc-e-gasto-calorico` | Saúde | não |
| 15 | `checklist-da-maternidade` | Família | não (`checklist-maternidade-data.ts` próprio: a mala, os documentos e as tarefas **do pai** no dia do parto) |

Categorias fixas (ordem de exibição): **Dinheiro**, **Família**, **Churrasco & Cozinha**,
**Casa & Oficina**, **Saúde**.

**Esta tabela é a lista única e fechada das ferramentas do site.** O doc 02 §1.3, o `PLANO-MESTRE.md` (F4), o
`13-checklist-de-execucao.md` (4.1–4.12), o doc 11 e o doc 12 §7.1 apontam para estes 17 slugs e para nenhum
outro. Slugs que aparecem em versões antigas de outros documentos têm a equivalência abaixo (não criar rota para eles):

| Slug antigo (outros docs) | O que fazer |
|---|---|
| `custo-de-um-filho` | é `custo-do-filho` (inclusive no `toolEmbed` de exemplo do doc 02 §5.1) |
| `guia-de-cortes`, `carne-x-preparo` | são a ferramenta `cortes-de-carne`; a tabela "Carne × preparo" é a aba 2 dela (§3.6), não uma rota |
| `calculadora-de-pensao` | é `pensao-alimenticia` |
| `enxoval-do-pai`, `mala-da-maternidade-do-pai` | é `checklist-da-maternidade` (título "Mala da maternidade: checklist do pai"). O artigo #4 do doc 12 usa `mala-da-maternidade-do-pai` em `/post/`, outra rota; a ferramenta linka o artigo e vice-versa |
| `decimo-terceiro`, `ferias`, `horas-extras`, `consumo-de-combustivel`, `check-up-do-pai`, `15-minutos` | **não existem nesta fase**: ideias futuras (§3.18), backlog pós-F8 |

O slug `checklist-da-maternidade` continua (o doc 02 §1.3 fixa a lista de 17): "maternidade" aqui é o hospital, e o
conteúdo é 100% do pai (§3.17). Nada é copiado das ferramentas de maternidade do VDM, apagadas na Fase 1 (doc 03 §2.4).

### 0.3 Pré-requisitos (verificar antes de começar — Passo 0)

A Fase 1 (`docs/plano/03-fase-1-fundacao.md`) deve ter deixado no repositório os módulos abaixo. Se o
nome real for diferente, **adapte o import, não crie duplicata**:

| Módulo esperado | Caminho | O que esta fase usa |
|---|---|---|
| Config do site | `src/lib/site.ts` | `SITE_URL = "https://vocacaodepai.com.br"`, `SITE_NAME = "Vocação de Pai"`, `SITE_OG_IMAGE`, `formatDate` |
| SEO | `src/lib/seo.ts` | `useSeo`, `breadcrumbJsonLd`, `faqJsonLd` |
| Layout do site | `src/routes/_site.tsx` (rota pai) e `src/components/layout/SiteLayout.tsx` (header com `NAV_MAIN`, menu móvel e rodapé — doc 03 §4.3; **não existe** `Header.tsx`, doc 02 §3) | o item "Ferramentas" → `/ferramentas` já está em `NAV_MAIN` desde a Fase 1 |
| Blocos de página | `src/components/blog/Breadcrumbs.tsx`, `AdSlot.tsx`, `ArticlesStrip.tsx` | migalhas, anúncio, faixa de artigos |
| Loja | `src/components/loja/StorePromo.tsx` (pasta oficial `loja/`, CLAUDE.md §2 e doc 02 §3; se a Fase 3 a criou em `src/components/store/`, mova com `git mv` ou adapte o import) | chamada para a Loja do Pai no rodapé da ferramenta |
| Semáforo | `src/components/blog/SemaforoCallout.tsx` (`tone: ok\|warn\|bad`, doc 02 §6.3) | sinais "verde / atenção / alerta" dentro das ferramentas — **não** criar um segundo componente de semáforo |
| Home | `src/components/home/ToolsTeaser.tsx` (doc 03 §5, 4 cartões estáticos) e `src/components/home/MarketTicker.tsx` (doc 02 §6.3, criar aqui se a Fase 1 não criou) | `ToolsTeaser` passa a ler `featuredTools()`; `MarketTicker` é o bloco "Mercado do pai hoje" (§3.2.6) |
| Placeholder | `src/routes/_site/ferramentas/index.tsx` → `ComingSoon` (doc 03 §6) | substituído pelo índice real (Passo 7) |
| Auth | `src/lib/auth-context.ts` (`useAuth()` → `{ user, ready, openLogin }`) | botão salvar + user_id em `tool_usage` |
| Supabase client (navegador) | `src/integrations/supabase/client.ts` (`supabase`) | inserts em `saved_items` e `tool_usage` |
| Supabase admin (servidor) | `src/integrations/supabase/client.server.ts` (`supabaseAdmin`) | leitura/escrita em `market_cache` |
| Supabase read-only (servidor) | `src/lib/seo.functions.ts` (`createReadOnlySupabaseClient`) | leitura de posts relacionados |
| Tipos do banco | `src/integrations/supabase/types.ts` | `Database` (regenerar após a migration 0007) |
| Sitemap | `src/routes/sitemap[.]xml.ts` | adicionar as URLs das ferramentas |
| Tabela `saved_items` | migration `0004_membros.sql` | `item_type = 'tool'`, `item_id = slug` |

Também já devem existir (Fase 1): `recharts`, `lucide-react`, `date-fns`, `sonner`, componentes
shadcn em `src/components/ui/*` (`button`, `input`, `select`, `tabs`, `slider`, `switch`, `dialog`,
`accordion`, `checkbox`, `label`, `tooltip`).

Comando de verificação (Passo 0):

```bash
cd /home/user/vocacaodepai
for f in src/lib/site.ts src/lib/seo.ts src/routes/_site.tsx src/components/layout/SiteLayout.tsx src/components/blog/Breadcrumbs.tsx \
  src/components/blog/AdSlot.tsx src/components/blog/ArticlesStrip.tsx src/components/blog/SemaforoCallout.tsx src/components/home/ToolsTeaser.tsx \
  src/lib/auth-context.ts src/integrations/supabase/client.ts src/integrations/supabase/client.server.ts \
  src/lib/seo.functions.ts "src/routes/sitemap[.]xml.ts" supabase/migrations/0004_membros.sql; do
  [ -e "$f" ] && echo "OK  $f" || echo "FALTA $f"; done
grep -n "SITE_URL" src/lib/site.ts
grep -n "export function useSeo\|export function breadcrumbJsonLd\|export function faqJsonLd" src/lib/seo.ts
grep -n "saved_items" supabase/migrations/*.sql | head -3
[ -e src/components/loja/StorePromo.tsx ] && echo "OK  StorePromo em loja/" || { [ -e src/components/store/StorePromo.tsx ] && echo "MOVER: git mv src/components/store src/components/loja (pasta oficial, CLAUDE.md §2)" || echo "FALTA StorePromo (Fase 3)"; }
[ -d src/components/tools ] && echo "MOVER: git mv src/components/tools src/components/ferramentas (pasta oficial, CLAUDE.md §2)"
grep -n "NAV_MAIN" src/components/layout/SiteLayout.tsx | head -2
```

Se algo estiver em FALTA, pare e resolva primeiro (criando o mínimo descrito em
`03-fase-1-fundacao.md`); não improvise um segundo sistema de SEO/auth.

### 0.4 O que herdar do Vocação de Mãe (leitura, nunca cópia cega)

Repositório de referência: `/home/user/vocacaodemae` (somente leitura). Padrões a herdar:

1. **Rota fina + componente de página.** No VDM cada ferramenta é `src/routes/_site/ferramentas/<slug>.tsx`
   com `head()` (title, description, og:*, canonical, JSON-LD `BreadcrumbList`) e `component` apontando para
   `src/pages/tools/<Nome>Tool.tsx`. Aqui vamos **unificar em uma rota dinâmica** `$slug.tsx` lida de um
   registro (`registry.ts`), para que SEO/JSON-LD/HowTo/FAQ saiam de um único lugar.
2. **`ToolShell`** (`src/components/tools/ToolShell.tsx` no VDM): Breadcrumbs → link voltar → `<h1>` + descrição →
   `AdSlot leaderboard` → conteúdo → `ArticlesStrip` → `StorePromo`. Vira `ToolLayout` aqui, em
   `src/components/ferramentas/ToolLayout.tsx` (pasta oficial `ferramentas/`, CLAUDE.md §2 e doc 02 §3), com os blocos
   novos e **sem anúncio acima da ferramenta** (doc 11 §2.4). Se a Fase 1 deixou `src/components/tools/{ToolShell,ToolGate}.tsx`
   no repositório (doc 03 §2.4 não os apaga), mova com `git mv src/components/tools src/components/ferramentas` no Passo 0.
3. **`ToolGate`**: trava suave de login com constante `TOOLS_GATED = false`. Manter o mecanismo (ferramentas
   livres por padrão; o campo `gated` do registro permite travar uma ferramenta específica no futuro).
4. **Dados em `src/lib/tools/*-data.ts`** — a Fase 1 apagou `src/lib/tools/**` do VDM (doc 03 §2.4) e o CLAUDE.md §15
   proíbe reintroduzir conteúdo de maternidade. Regra desta fase:
   - `nomes-data.ts`: **adaptar** do VDM (`/home/user/vocacaodemae/src/lib/tools/nomes-data.ts`, 884 nomes, `BabyName
     {name, sex, meaning, origin}`): é uma lista neutra de nomes; renomear o tipo para `ChildName`, acrescentar `saint?: boolean`
     e reescrever qualquer texto que fale de "mãe/bebê" (ver §3.13).
   - `vacinas-data.ts` e `marcos-data.ts`: **não copiar nada do VDM.** Escrever do zero, com os tipos e os textos de §3.14 e
     §3.15, a partir das fontes oficiais (Calendário Nacional de Vacinação do Ministério da Saúde; Caderneta da Criança),
     na voz do pai ("quem leva é você"). Apenas a ideia de "calendário por idade" é herdada.
   - `checklist-maternidade-data.ts`: novo, só conteúdo do pai (§3.17). O `enxoval-data.ts` do VDM não é usado.
5. **Server functions** com `createServerFn({ method: "GET" }).inputValidator(...).handler(...)` (ver
   `src/lib/seo.functions.ts` e `src/lib/hub.functions.ts` no VDM) e **rotas de API** com
   `createFileRoute("/api/...")({ server: { handlers: { GET: async ({ request }) => new Response(...) } } })`
   (ver `src/routes/api/img/$.ts` no VDM) — incluindo o padrão de rate-limit em memória.
6. **RLS**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS ...; CREATE POLICY ...`
   (ver `20260901173837_enable_rls_security.sql` no VDM). Aqui usamos `public.is_admin()` (Fase 1) em vez
   de `auth.role() = 'authenticated'` para escrita administrativa.

### 0.5 Mapa de arquivos criados/alterados nesta fase

```
supabase/migrations/0007_ferramentas.sql                 (SQL do §2.1 = doc 02 §4.7 + complementos; se a Fase 1 já aplicou a 0007,
                                                          os complementos vão em 00NN_ferramentas_extras.sql — ver §2.1)
.github/workflows/market-refresh.yml                     (novo; secret CRON_SECRET — doc 02 §8)
public/manifest.webmanifest                              (novo — §4.3; doc 02 §3 e doc 13 item 4.10)
public/sw.js                                             (novo — service worker, §4.3)
public/icons/icon-192.png, icon-512.png, maskable-512.png (novos — gerados por scripts/build-icons.mjs)
scripts/build-icons.mjs                                  (novo — gera os PNG a partir de public/logo.svg)
vitest.config.ts                                         (novo — §4.2)
src/lib/pwa.ts                                           (novo — registerServiceWorker(), §4.3)
src/lib/tools/index.ts                                   (novo)  barrel: export * from "./registry" e "./categories" (doc 02 §3 cita src/lib/tools/index.ts)
src/lib/tools/registry.ts                                (novo)  registro das 17 ferramentas
src/lib/tools/categories.ts                              (novo)  categorias + ícones
src/lib/tools/como-usar.ts                               (novo)  COMO_USAR[slug]: texto "Como usar" ≥ 300 palavras (doc 11 §12)
src/lib/tools/jsonld.ts                                  (novo)  SoftwareApplication/HowTo/FAQ
src/lib/tools/format.ts                                  (novo)  formatBRL, formatPct, formatNumber
src/lib/tools/usage.ts                                   (novo)  logToolUsage (cliente)
src/lib/tools/saved.ts                                   (novo)  saveTool/unsaveTool/isToolSaved
src/lib/tools/share.ts                                   (novo)  shareOrCopy(url, text)
src/lib/tools/related.functions.ts                       (novo)  getRelatedPostsForTool (server function)
src/lib/tools/currencies.ts                              (novo)  lista de moedas (código, nome, bandeira)
src/lib/tools/custo-filho-data.ts                        (novo)
src/lib/tools/licenca-regras.json                        (novo)
src/lib/tools/churrasco-regras.ts                        (novo)
src/lib/tools/cortes.json                                (novo — esquema no §3.6)
src/lib/tools/orcamento-data.ts                          (novo)
src/lib/tools/financas.ts                                (novo)  jurosCompostos, reservaEmergencia, pensão
src/lib/tools/unidades.ts                                (novo)
src/lib/tools/kit-ferramentas-data.ts                    (novo)
src/lib/tools/nomes-data.ts                              (adaptado do VDM — lista neutra; ver §0.4 item 4)
src/lib/tools/vacinas-data.ts                            (novo — dados próprios, fonte Ministério da Saúde; nada do VDM)
src/lib/tools/marcos-data.ts                             (novo — dados próprios, fonte Caderneta da Criança; nada do VDM)
src/lib/tools/saude.ts                                   (novo)  imc, tmb, gasto calórico
src/lib/tools/checklist-maternidade-data.ts              (novo — a mala e as tarefas do pai)
src/lib/market/types.ts                                  (novo)
src/lib/market/cache.ts                                  (novo)  readCache/writeCache/cached (servidor)
src/lib/market/sources/awesomeapi.ts                     (novo)
src/lib/market/sources/bcb-ptax.ts                       (novo)
src/lib/market/sources/bcb-sgs.ts                        (novo)
src/lib/market/sources/coingecko.ts                      (novo — sem chave; fallback AwesomeAPI)
src/lib/market/sources/brapi.ts                          (novo)
src/lib/market/sources/tesouro.ts                        (novo)
src/lib/market/fetchers.ts                               (novo)  server functions (createServerFn)
src/lib/market/refresh.ts                                (novo)  refreshAll() usado pelo cron
src/routes/api/market/refresh.ts                         (novo)  endpoint do cron (Authorization: Bearer CRON_SECRET)
src/routes/_site/ferramentas/index.tsx                   (substitui o ComingSoon da Fase 1)  índice
src/routes/_site/ferramentas/$slug.tsx                   (novo)  rota dinâmica
src/components/ferramentas/ToolLayout.tsx                (novo — substitui o ToolShell do VDM)
src/components/ferramentas/ToolGate.tsx                  (copiado do VDM, sem i18n)
src/components/ferramentas/ToolCard.tsx                  (novo)
src/components/ferramentas/ToolHowTo.tsx                 (novo — passos + texto longo de COMO_USAR)
src/components/ferramentas/ToolFaq.tsx                   (novo)
src/components/ferramentas/ToolDisclaimer.tsx            (novo)
src/components/ferramentas/ToolSaveButton.tsx            (novo)
src/components/ferramentas/ToolShareButton.tsx           (novo)
src/components/ferramentas/ToolRelatedArticles.tsx       (novo)
src/components/ferramentas/ToolResultCard.tsx            (novo)  cartão de resultado padrão
src/components/ferramentas/MarketStale.tsx               (novo)  aviso "dados de HH:MM (cache)"
src/components/ferramentas/<slug>/<Nome>.tsx             (novo, um por ferramenta — nomes fixos no §3: CurrencyConverter,
                                                          MarketDashboard, ChildCostCalculator, PaternityLeave, BarbecueCalculator,
                                                          BeefCutsGuide (+ BeefDiagram.tsx), FamilyBudget, CompoundInterest,
                                                          EmergencyFund, ChildSupportEstimate, UnitConverter, ToolkitBuilder,
                                                          ChildNames, VaccinationCalendar, DevelopmentMilestones, BmiAndCalories,
                                                          HospitalBagChecklist)
src/components/home/MarketTicker.tsx                     (novo ou adaptar — bloco "Mercado do pai hoje" na home, §3.2.6)
src/components/home/ToolsTeaser.tsx                      (alterar: ler featuredTools() do registry; tirar os selos "Em breve")
src/routes/__root.tsx                                    (alterar: <link rel="manifest"> + registerServiceWorker(), §4.3)
src/routes/sitemap[.]xml.ts                              (alterar: incluir ferramentas)
src/components/layout/SiteLayout.tsx                     (conferir: item "Ferramentas" já está em NAV_MAIN desde a Fase 1)
tests/tools/*.test.ts                                    (novo)  vitest para funções puras e para o registry (§4.2)
```

### 0.6 Ordem de execução e divisão em sessões

| Sessão | Conteúdo | Estimativa |
|---|---|---|
| 4A | Passos 0–13 (§1 e §2): Passo 0, migration 0007, camada de mercado, cron, registry, casca (`ToolLayout`), índice, `$slug`, `conversor-de-moedas` (§3.1), `mercado-financeiro` (§3.2) e o bloco "Mercado do pai hoje" na home (§3.2.6) | 1 sessão longa |
| 4B | Dinheiro (§3.3, §3.7–§3.10): `custo-do-filho`, `orcamento-familiar`, `juros-compostos`, `reserva-de-emergencia`, `pensao-alimenticia` | 1 sessão |
| 4C | Família e Saúde (§3.4, §3.13–§3.17): `licenca-paternidade`, `nomes-de-filhos`, `calendario-de-vacinacao`, `marcos-do-desenvolvimento`, `imc-e-gasto-calorico`, `checklist-da-maternidade` | 1 sessão |
| 4D | Churrasco/Cozinha/Oficina (§3.5, §3.6, §3.11, §3.12 → `calculadora-de-churrasco`, `cortes-de-carne` + SVG, `conversor-de-unidades`, `kit-de-ferramentas`); sitemap, testes e PWA (§4); critérios de aceite (§5); checklist de pronto (§7); PR | 1 sessão |

Cada sessão termina com `npm run build && npm run lint && node scripts/validate-content.mjs` (os três verdes, CLAUDE.md
§4.1) mais `npm run typecheck` e `npm run test` (§4.2), commit em branch `claude/fase-4-<sessao>` (ex.:
`claude/fase-4-4a-mercado`), atualização de `docs/plano/PROGRESSO.md` e marcação das caixas 4.x em
`docs/plano/13-checklist-de-execucao.md`. O PR final da fase chama-se "Fase 4 — Caixa de Ferramentas".

---

## 1. Estrutura comum de uma ferramenta

### 1.1 Passo 1 — Registro de ferramentas: `src/lib/tools/categories.ts` e `src/lib/tools/registry.ts`

Crie **`src/lib/tools/categories.ts`**:

```ts
import {
  Beef,
  HeartPulse,
  House,
  type LucideIcon,
  Users,
  Wallet,
} from "lucide-react";

export type ToolCategorySlug = "dinheiro" | "familia" | "churrasco-cozinha" | "casa-oficina" | "saude";

export interface ToolCategory {
  slug: ToolCategorySlug;
  name: string;
  short: string; // rótulo curto para o filtro
  description: string;
  icon: LucideIcon;
  /** classe Tailwind do selo (usa tokens do tema definidos na Fase 1) */
  badgeClass: string;
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    slug: "dinheiro",
    name: "Dinheiro",
    short: "Dinheiro",
    description: "Câmbio, mercado, orçamento e planejamento para quem provê.",
    icon: Wallet,
    badgeClass: "bg-primary/15 text-primary",
  },
  {
    slug: "familia",
    name: "Família",
    short: "Família",
    description: "Licença, nomes, vacinas, marcos e a maternidade pelo olhar do pai.",
    icon: Users,
    badgeClass: "bg-accent/20 text-accent-foreground",
  },
  {
    slug: "churrasco-cozinha",
    name: "Churrasco & Cozinha",
    short: "Churrasco",
    description: "Cálculo do churrasco, cortes de carne e medidas de cozinha.",
    icon: Beef,
    badgeClass: "bg-destructive/15 text-destructive",
  },
  {
    slug: "casa-oficina",
    name: "Casa & Oficina",
    short: "Oficina",
    description: "Unidades, kit de ferramentas e o básico para cuidar da casa.",
    icon: House,
    badgeClass: "bg-secondary/70 text-secondary-foreground",
  },
  {
    slug: "saude",
    name: "Saúde",
    short: "Saúde",
    description: "IMC, gasto calórico e cuidado com o corpo do homem.",
    icon: HeartPulse,
    badgeClass: "bg-success/15 text-success",
  },
];

export const categoryBySlug = (slug: ToolCategorySlug) =>
  TOOL_CATEGORIES.find((c) => c.slug === slug)!;
```

Crie **`src/lib/tools/registry.ts`**:

```ts
import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Baby,
  Beef,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Flame,
  Footprints,
  HeartPulse,
  LineChart,
  PiggyBank,
  Ruler,
  Scale,
  Shield,
  Syringe,
  TrendingUp,
  Wrench,
} from "lucide-react"; // um ícone por ferramenta (§3); sem import não usado (lint)
import type { ToolCategorySlug } from "./categories";

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolHowToStep {
  name: string;
  text: string;
}

export interface ToolDefinition {
  /** slug da URL: /ferramentas/<slug> */
  slug: string;
  /** H1 e título principal */
  title: string;
  /** <title> da página (até ~60 caracteres, sem o nome do site — o layout acrescenta " | Vocação de Pai") */
  seoTitle: string;
  /** meta description (120–158 caracteres) */
  description: string;
  /** 1 linha para o card do índice */
  short: string;
  icon: LucideIcon;
  category: ToolCategorySlug;
  /** aparece também nestes filtros (ex.: conversor de unidades em Churrasco & Cozinha) */
  alsoIn?: ToolCategorySlug[];
  /** schema.org applicationCategory */
  appCategory: "FinanceApplication" | "UtilitiesApplication" | "HealthApplication" | "LifestyleApplication";
  howTo: ToolHowToStep[];
  faq: ToolFaqItem[];
  /** slugs de categorias do blog para puxar artigos relacionados (ordem = prioridade) */
  relatedCategories: string[];
  /** termos para busca full-text de artigos relacionados (posts.search_content) */
  relatedTerms: string[];
  /** texto de aviso legal/educativo; se definido, ToolDisclaimer é renderizado abaixo do resultado */
  disclaimer?: string;
  /** usa dados de mercado (mostra MarketStale e o rodapé de fontes) */
  usesMarketData?: boolean;
  /** trava suave de login (ToolGate). Padrão: false */
  gated?: boolean;
  /** destaque no índice e na home */
  featured?: boolean;
  /** og:image própria (1200×630) em public/og/ferramentas/<slug>.png; se ausente usa SITE_OG_IMAGE */
  ogImage?: string;
  /** pré-carga no loader da rota (só ferramentas de mercado): devolve o que o componente usa como initialData */
  preload?: () => Promise<unknown>;
  component: LazyExoticComponent<ComponentType>;
}

const L = (loader: () => Promise<{ default: ComponentType }>) => lazy(loader);

export const TOOLS: ToolDefinition[] = [
  {
    slug: "conversor-de-moedas",
    title: "Conversor de moedas",
    seoTitle: "Conversor de moedas: dólar, euro e 30+ moedas em reais hoje",
    description:
      "Converta dólar, euro, libra, peso e mais de 30 moedas para o real com cotação comercial atualizada, PTAX do Banco Central e gráfico de 30 dias.",
    short: "Dólar, euro e 30+ moedas em reais, com PTAX e gráfico de 30 dias.",
    icon: ArrowLeftRight,
    category: "dinheiro",
    appCategory: "FinanceApplication",
    featured: true,
    usesMarketData: true,
    howTo: [
      { name: "Escolha as moedas", text: "Selecione a moeda de origem e a de destino. O real (BRL) vem pré-selecionado." },
      { name: "Digite o valor", text: "Informe o valor a converter. O resultado aparece na hora, com a cotação comercial." },
      { name: "Confira a PTAX", text: "Veja a cotação oficial do Banco Central (PTAX) do dia e a variação dos últimos 30 dias." },
      { name: "Compartilhe", text: "Use o botão Compartilhar para enviar o resultado com o link da conversão." },
    ],
    faq: [
      { question: "Qual a diferença entre cotação comercial, turismo e PTAX?", answer: "A comercial é usada entre bancos e empresas; a de turismo, cobrada em casas de câmbio e cartões, costuma ser 3% a 8% mais alta; a PTAX é a média oficial calculada pelo Banco Central e usada em contratos e na Receita Federal." },
      { question: "De onde vêm as cotações?", answer: "Da AwesomeAPI (cotação comercial em tempo quase real) e do Banco Central do Brasil (PTAX oficial). Atualizamos o cache a cada 30 minutos." },
      { question: "Posso usar para calcular compras no cartão internacional?", answer: "Use como referência. O banco aplica a cotação do dia do fechamento da fatura mais IOF (verifique a alíquota vigente) e spread; o valor final será maior que o da cotação comercial." },
      { question: "Por que o valor aqui é diferente do que vi na casa de câmbio?", answer: "Casas de câmbio e bancos vendem a cotação de turismo, que embute spread, IOF e custo operacional. Nosso conversor mostra a cotação comercial e a PTAX, que são referências de mercado, não preço de balcão." },
    ],
    relatedCategories: ["dinheiro-do-pai", "provedor-e-carreira"],
    relatedTerms: ["dólar", "câmbio", "viagem internacional", "investir no exterior"],
    disclaimer:
      "Cotações informativas, sem garantia de exatidão para operações financeiras. Para contratos e declarações oficiais use a PTAX publicada pelo Banco Central.",
    component: L(() => import("@/components/ferramentas/conversor-de-moedas/CurrencyConverter")),
  },
  {
    slug: "mercado-financeiro",
    title: "Mercado financeiro hoje",
    seoTitle: "Mercado financeiro hoje: dólar, bitcoin, Selic e IPCA",
    description:
      "Painel do dia para o pai de família: dólar, euro, bitcoin, Ibovespa, Selic, CDI, IPCA e Tesouro Direto, com o que cada número muda no orçamento da casa.",
    short: "Dólar, bitcoin, Ibovespa, Selic e IPCA com tradução para a vida real.",
    icon: LineChart,
    category: "dinheiro",
    appCategory: "FinanceApplication",
    featured: true,
    usesMarketData: true,
    howTo: [
      { name: "Leia os cards", text: "Cada card mostra o valor atual, a variação do dia e a hora da última atualização." },
      { name: "Abra 'O que isso significa para o pai'", text: "Em cada card há uma explicação direta: o que o número muda no seu orçamento, nas suas dívidas e nos seus investimentos." },
      { name: "Use os sinais", text: "Sinal verde, atenção e alerta resumem o cenário do dia para quem cuida das contas da casa." },
    ],
    faq: [
      { question: "Com que frequência os dados são atualizados?", answer: "Câmbio e cripto a cada 30 minutos; ações e Ibovespa a cada 30 minutos em horário de pregão; Selic, CDI e IPCA quando o Banco Central publica (verificamos a cada 12 horas)." },
      { question: "Isso é recomendação de investimento?", answer: "Não. É um painel educativo. Decisões de investimento devem considerar seu perfil, prazos e, se possível, um profissional certificado." },
      { question: "Por que a Selic importa para quem tem filho?", answer: "Ela baliza juros de financiamento, cartão e empréstimo (quando sobe, dívidas ficam mais caras) e o rendimento de Tesouro Selic, CDB e poupança (quando sobe, a reserva de emergência rende mais)." },
      { question: "O painel mostra o preço de ações para eu comprar?", answer: "Mostra a cotação de referência do Ibovespa e de algumas ações muito negociadas, com atraso de até 30 minutos, para você acompanhar o cenário. Para operar, use a plataforma da sua corretora, que tem o preço em tempo real." },
    ],
    relatedCategories: ["dinheiro-do-pai"],
    relatedTerms: ["selic", "inflação", "investimento", "reserva de emergência", "bitcoin"],
    disclaimer:
      "Conteúdo educativo. Não constitui recomendação de investimento. Dados sujeitos a atraso e indisponibilidade das fontes.",
    component: L(() => import("@/components/ferramentas/mercado-financeiro/MarketDashboard")),
  },
  // ... (uma entrada por ferramenta — as demais 15 estão especificadas na seção 3 (§3.3 a §3.17); copie os
  //      campos seoTitle/description/short/howTo/faq/relatedCategories/relatedTerms/disclaimer literalmente de lá)
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const toolsByCategory = (cat: ToolCategorySlug) =>
  TOOLS.filter((t) => t.category === cat || t.alsoIn?.includes(cat));
export const featuredTools = () => TOOLS.filter((t) => t.featured);
export const toolPath = (slug: string) => `/ferramentas/${slug}`;
```

Crie também o barrel **`src/lib/tools/index.ts`** (o doc 02 §3 cita `src/lib/tools/index.ts` como o registro que a rota
`$slug.tsx` resolve):

```ts
export * from "./registry";
export * from "./categories";
```

Regras do registro:

- **Um slug = uma entrada = um componente** em `src/components/ferramentas/<slug>/<PascalCase>.tsx` com `export default`.
- Nunca importar o componente de forma estática no registry (manter `lazy`) — o bundle do índice não pode
  carregar as 17 ferramentas.
- `seoTitle` ≤ 60 caracteres antes do sufixo; `description` entre 120 e 158 caracteres. Há um teste para isso
  (`tests/tools/registry.test.ts`, seção 6).
- `howTo` tem de 3 a 6 passos; `faq` de **4** a 6 perguntas (tudo vira JSON-LD).
- O texto longo "Como usar" (**≥ 300 palavras por ferramenta**, exigência do doc 11 §12 Fase 4) **não** fica no registry
  (para não inchar o bundle do índice): fica em `src/lib/tools/como-usar.ts`, `export const COMO_USAR: Record<string, string>`,
  uma chave por slug, com os textos literais da seção 3. `ToolLayout` lê `COMO_USAR[tool.slug]` e `ToolHowTo` renderiza
  parágrafos (separados por linha em branco; linha iniciada por `## ` vira `<h3>`). Teste: `tests/tools/registry.test.ts`
  falha se faltar chave ou se tiver menos de 300 palavras.
- `relatedCategories` usa os **slugs reais** das categorias do blog (seed do doc 02 §4.2): `paternidade-por-fase`,
  `casamento-e-familia`, `provedor-e-carreira`, `dinheiro-do-pai`, `fe-e-virtude`, `corpo-e-saude-do-homem`,
  `churrasco-e-cozinha`, `caixa-de-ferramentas-e-reparos`, `carro-e-moto`, `estilo-e-cuidados`,
  `esporte-e-lazer-com-os-filhos`, `tecnologia-do-pai`, `direitos-do-pai`, `historias-de-pai` (e subcategorias, ex.:
  `ferramentas-essenciais`). Nunca inventar slug.

### 1.2 Passo 2 — JSON-LD: `src/lib/tools/jsonld.ts`

```ts
import { SITE_NAME, SITE_URL, SITE_OG_IMAGE } from "@/lib/site";
import type { ToolDefinition } from "./registry";

export function toolSoftwareApplicationJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.title} — ${SITE_NAME}`,
    description: tool.description,
    url: `${SITE_URL}/ferramentas/${tool.slug}`,
    applicationCategory: tool.appCategory,
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    image: tool.ogImage ? `${SITE_URL}${tool.ogImage}` : SITE_OG_IMAGE,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function toolHowToJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Como usar: ${tool.title}`,
    description: tool.description,
    inLanguage: "pt-BR",
    totalTime: "PT2M",
    step: tool.howTo.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${SITE_URL}/ferramentas/${tool.slug}#como-usar-${i + 1}`,
    })),
  };
}

export function toolFaqJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function toolBreadcrumbJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Ferramentas", item: `${SITE_URL}/ferramentas` },
      { "@type": "ListItem", position: 3, name: tool.title, item: `${SITE_URL}/ferramentas/${tool.slug}` },
    ],
  };
}

/** Todos os blocos JSON-LD da página de uma ferramenta, prontos para head().scripts */
export function toolJsonLd(tool: ToolDefinition) {
  return [
    toolBreadcrumbJsonLd(tool),
    toolSoftwareApplicationJsonLd(tool),
    toolHowToJsonLd(tool),
    toolFaqJsonLd(tool),
  ];
}
```

### 1.3 Passo 3 — Utilitários: `format.ts`, `share.ts`, `usage.ts`, `saved.ts`

**`src/lib/tools/format.ts`**

```ts
export const formatBRL = (v: number, digits = 2) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

export const formatMoney = (v: number, currency: string, digits = 2) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

export const formatNumber = (v: number, digits = 2) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);

export const formatPct = (v: number, digits = 2) =>
  `${v > 0 ? "+" : ""}${formatNumber(v, digits)}%`;

/** "24/10/2026 14:30" em America/Sao_Paulo */
export const formatDateTimeBR = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Converte string "1.234,56" ou "1234.56" para número; retorna NaN se inválido */
export function parseBRNumber(input: string): number {
  const s = input.trim().replace(/\s/g, "");
  if (!s) return NaN;
  if (s.includes(",")) return Number(s.replace(/\./g, "").replace(",", "."));
  return Number(s);
}
```

**`src/lib/tools/share.ts`**

```ts
import { toast } from "sonner";

export async function shareOrCopy(opts: { title: string; text: string; url: string }) {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(opts);
      return "shared" as const;
    }
    await navigator.clipboard.writeText(`${opts.text}\n${opts.url}`);
    toast.success("Resultado copiado. Cole onde quiser.");
    return "copied" as const;
  } catch {
    toast.error("Não foi possível compartilhar. Copie o link da barra do navegador.");
    return "failed" as const;
  }
}
```

**`src/lib/tools/usage.ts`** — registro anônimo de uso (uma vez por aba/sessão por ferramenta):

```ts
import { supabase } from "@/integrations/supabase/client";

export async function logToolUsage(toolSlug: string, userId: string | null) {
  if (typeof window === "undefined") return;
  const key = `vdp:tool_usage:${toolSlug}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* sessionStorage indisponível: registra mesmo assim */
  }
  const { error } = await supabase.from("tool_usage").insert({ tool_slug: toolSlug, user_id: userId });
  if (error) console.warn("tool_usage insert failed", error.message);
}
```

**`src/lib/tools/saved.ts`** — favoritos via `saved_items` (item_type `'tool'`):

```ts
import { supabase } from "@/integrations/supabase/client";

export async function isToolSaved(userId: string, slug: string) {
  const { data } = await supabase
    .from("saved_items")
    .select("id")
    .eq("user_id", userId)
    .eq("item_type", "tool")
    .eq("item_id", slug)
    .maybeSingle();
  return Boolean(data);
}

export async function saveTool(userId: string, slug: string) {
  const { error } = await supabase
    .from("saved_items")
    .insert({ user_id: userId, item_type: "tool", item_id: slug });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function unsaveTool(userId: string, slug: string) {
  const { error } = await supabase
    .from("saved_items")
    .delete()
    .eq("user_id", userId)
    .eq("item_type", "tool")
    .eq("item_id", slug);
  if (error) throw error;
}
```

### 1.4 Passo 4 — Componentes da casca

**Semáforo dentro das ferramentas — reutilizar `SemaforoCallout`** (`src/components/blog/SemaforoCallout.tsx`, doc 02 §6.3,
criado na Fase 1): `<SemaforoCallout tone="ok|warn|bad">texto</SemaforoCallout>`. Ele já insere o prefixo em negrito
"Sinal verde: " / "Sinal de atenção: " / "Sinal de alerta: " quando ausente. **Não** criar um `PaiSemaforo` paralelo. Toda
ferramenta que mostra risco, decisão ou "quando procurar ajuda" usa os três tons na ordem ok → warn → bad, nunca um 4º.

Tokens `success`, `warning`, `destructive`, `accent` existem no tema da Fase 1 (`src/styles.css` `@theme`:
`#2F7D4F`, `#D9A21B`, `#B23A3A`, `#D9822B`). Se faltar `warning`, adicione em `src/styles.css` seguindo o padrão dos demais
(CLAUDE.md §9: derivar com opacidade, não inventar cor).

**`src/components/ferramentas/ToolHowTo.tsx`** — passos curtos (JSON-LD `HowTo`) **e** o texto longo obrigatório
(doc 11 §12: ≥ 300 palavras por ferramenta; o anúncio in-article só entra depois dele):

```tsx
import type { ToolHowToStep } from "@/lib/tools/registry";

export function ToolHowTo({ steps, text }: { steps: ToolHowToStep[]; text?: string }) {
  const blocks = (text ?? "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <section aria-labelledby="como-usar" className="mt-12 max-w-3xl">
      <h2 id="como-usar" className="font-display text-2xl font-bold">Como usar</h2>
      <ol className="mt-4 space-y-3">
        {steps.map((s, i) => (
          <li key={s.name} id={`como-usar-${i + 1}`} className="flex gap-4 rounded-xl border border-border bg-card p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{i + 1}</span>
            <div>
              <h3 className="font-bold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          </li>
        ))}
      </ol>
      {blocks.length > 0 && (
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-foreground/90">
          {blocks.map((b, i) =>
            b.startsWith("## ") ? (
              <h3 key={i} className="pt-2 font-display text-xl font-bold">{b.slice(3)}</h3>
            ) : (
              <p key={i}>{b}</p>
            ),
          )}
        </div>
      )}
    </section>
  );
}
```

**`src/components/ferramentas/ToolFaq.tsx`** — usa `Accordion` do shadcn (`src/components/ui/accordion.tsx`), um
`AccordionItem` por pergunta, `<h2>Perguntas frequentes</h2>`, `<h3>` para cada pergunta.

**`src/components/ferramentas/ToolDisclaimer.tsx`** — caixa discreta com ícone `Info`, título "Aviso" e o texto
do registro; prop opcional `strong` (fundo `destructive/10`, usado pela pensão alimentícia).

**`src/components/ferramentas/ToolSaveButton.tsx`**

```tsx
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { isToolSaved, saveTool, unsaveTool } from "@/lib/tools/saved";

export function ToolSaveButton({ slug }: { slug: string }) {
  const { user, ready, openLogin } = useAuth();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) isToolSaved(user.id, slug).then(setSaved);
    else setSaved(false);
  }, [user, slug]);

  async function toggle() {
    if (!ready) return;
    if (!user) return openLogin();
    setBusy(true);
    try {
      if (saved) { await unsaveTool(user.id, slug); setSaved(false); toast("Removido dos salvos."); }
      else { await saveTool(user.id, slug); setSaved(true); toast.success("Salvo na sua Área do Pai."); }
    } catch { toast.error("Não deu certo agora. Tente de novo."); }
    finally { setBusy(false); }
  }

  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={saved}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold hover:border-primary">
      {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
      {saved ? "Salvo" : "Salvar"}
    </button>
  );
}
```

**`src/components/ferramentas/ToolShareButton.tsx`** — botão com ícone `Share2`, recebe `{ title, text, url? }`
(se `url` ausente usa `window.location.href`) e chama `shareOrCopy`.

**`src/components/ferramentas/ToolRelatedArticles.tsx`** — recebe `posts` (já carregados pelo loader da rota, ver 1.5)
e renderiza até 4 cards (capa, categoria, título, tempo de leitura) com `<h2>Leia também</h2>`. Se vazio, não renderiza.

**`src/components/ferramentas/MarketStale.tsx`** — recebe `{ fetchedAt: string; stale: boolean; sources: string[] }`
e mostra: "Atualizado às HH:MM (cache)" ou, se `stale`, "Sinal de atenção: usando dados de DD/MM HH:MM; as fontes
estão instáveis agora." + "Fontes: AwesomeAPI, Banco Central do Brasil…".

**`src/components/ferramentas/ToolResultCard.tsx`** — cartão padrão de resultado: `label` (uppercase, pequeno),
`value` (font-display 2xl/3xl), `hint` opcional, `tone` (`primary | neutral | success | warning | danger`).

**`src/components/ferramentas/ToolGate.tsx`** — copiar do VDM removendo `useTranslation` e trocando os textos por:
título "Entre para usar a ferramenta completa", texto "Crie sua conta grátis na Área do Pai e salve seus resultados.",
botão "Entrar ou criar conta", nota "Leva 30 segundos. Sem spam.". Manter `TOOLS_GATED = false`.

**`src/components/ferramentas/ToolLayout.tsx`** — casca única. Posições de anúncio **fixas pelo doc 11 §2.4** (linha
"Ferramenta"): nenhum anúncio acima da ferramenta nem ao lado de inputs/botões; 1º retângulo **abaixo do bloco de
resultado**, separado por `<hr>` e rótulo; 2º in-article **ao fim do texto "Como usar"**. O `AdSlot` da Fase 1 aceita
`format: "rect" | "leaderboard" | "skyscraper"` (herdado do VDM) — aqui só `rect`; a Fase 8 troca por `AdSlot` por template.

```tsx
import { Suspense, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { StorePromo } from "@/components/loja/StorePromo";
import { useAuth } from "@/lib/auth-context";
import { logToolUsage } from "@/lib/tools/usage";
import { categoryBySlug } from "@/lib/tools/categories";
import { COMO_USAR } from "@/lib/tools/como-usar";
import type { ToolDefinition } from "@/lib/tools/registry";
import type { RelatedPost } from "@/lib/tools/related.functions";
import { ToolGate } from "./ToolGate";
import { ToolHowTo } from "./ToolHowTo";
import { ToolFaq } from "./ToolFaq";
import { ToolDisclaimer } from "./ToolDisclaimer";
import { ToolSaveButton } from "./ToolSaveButton";
import { ToolShareButton } from "./ToolShareButton";
import { ToolRelatedArticles } from "./ToolRelatedArticles";

export function ToolLayout({ tool, related, children }: { tool: ToolDefinition; related: RelatedPost[]; children: ReactNode }) {
  const { user, ready } = useAuth();
  const cat = categoryBySlug(tool.category);

  useEffect(() => {
    if (ready) void logToolUsage(tool.slug, user?.id ?? null);
  }, [ready, user?.id, tool.slug]);

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Ferramentas", path: "/ferramentas" }, { name: tool.title, path: "" }]} />
      <Link to="/ferramentas" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Caixa de Ferramentas
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${cat.badgeClass}`}>
            <cat.icon className="h-3.5 w-3.5" /> {cat.name}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{tool.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{tool.description}</p>
        </div>
        <div className="flex gap-2">
          <ToolSaveButton slug={tool.slug} />
          <ToolShareButton title={tool.title} text={`${tool.title} — Vocação de Pai`} />
        </div>
      </header>

      {/* Sem anúncio aqui: doc 11 §2.4 proíbe anúncio acima da ferramenta ou ao lado de inputs/botões */}
      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" aria-busy />}>
          {tool.gated ? <ToolGate>{children}</ToolGate> : children}
        </Suspense>
      </div>

      {tool.disclaimer && <ToolDisclaimer text={tool.disclaimer} strong={tool.slug === "pensao-alimenticia"} />}

      {/* 1º anúncio: abaixo do bloco de resultado, separado por <hr> e rótulo (doc 11 §2.4) */}
      <hr className="mt-10 border-border" />
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Publicidade</p>
      <AdSlot format="rect" className="mt-2" />

      <ToolHowTo steps={tool.howTo} text={COMO_USAR[tool.slug]} />

      {/* 2º anúncio: in-article ao fim do "Como usar" (doc 11 §2.4) */}
      <AdSlot format="rect" className="mt-8" />

      <ToolFaq items={tool.faq} />
      <ToolRelatedArticles posts={related} />
      <StorePromo />
    </div>
  );
}
```

### 1.5 Passo 5 — Server function de artigos relacionados: `src/lib/tools/related.functions.ts`

```ts
import { createServerFn } from "@tanstack/react-start";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";

export interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  reading_time: number | null;
  category: { slug: string; name: string } | null;
}

export const getRelatedPostsForTool = createServerFn({ method: "GET" })
  .inputValidator((d: { categories: string[]; terms: string[] }) => ({
    categories: (d.categories ?? []).slice(0, 4).map(String),
    terms: (d.terms ?? []).slice(0, 6).map(String),
  }))
  .handler(async ({ data }): Promise<RelatedPost[]> => {
    const sb = await createReadOnlySupabaseClient();
    const select = "slug,title,excerpt,cover_image_url,reading_time,category:categories!inner(slug,name)";
    // 1) por termos (full-text em search_content), 2) completa por categoria
    const out: RelatedPost[] = [];
    if (data.terms.length) {
      const q = data.terms.map((t) => `'${t.replace(/'/g, "")}'`).join(" | ");
      const { data: rows } = await sb.from("posts").select(select).eq("status", "published")
        .textSearch("search_content", q, { config: "portuguese" }).limit(4);
      out.push(...((rows ?? []) as unknown as RelatedPost[]));
    }
    if (out.length < 4 && data.categories.length) {
      const { data: rows } = await sb.from("posts").select(select).eq("status", "published")
        .in("categories.slug", data.categories).order("publish_at", { ascending: false }).limit(8);
      for (const r of (rows ?? []) as unknown as RelatedPost[]) {
        if (out.length >= 4) break;
        if (!out.some((o) => o.slug === r.slug)) out.push(r);
      }
    }
    return out;
  });
```

Os slugs de categoria são os do seed do doc 02 §4.2 (`dinheiro-do-pai`, `paternidade-por-fase`, `direitos-do-pai`,
`churrasco-e-cozinha`, `caixa-de-ferramentas-e-reparos`, `corpo-e-saude-do-homem`, `provedor-e-carreira`,
`casamento-e-familia`…) e suas subcategorias (`parent_id`). Confirme com `select slug from categories order by sort_order`
antes de preencher `relatedCategories`; a função só retorna vazio, nunca quebra.

### 1.6 Passo 6 — Rota dinâmica `src/routes/_site/ferramentas/$slug.tsx`

```tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";
import { toolBySlug } from "@/lib/tools/registry";
import { toolJsonLd } from "@/lib/tools/jsonld";
import { getRelatedPostsForTool } from "@/lib/tools/related.functions";
import { ToolLayout } from "@/components/ferramentas/ToolLayout";
import NotFound from "@/pages/NotFound";

export const Route = createFileRoute("/_site/ferramentas/$slug")({
  loader: async ({ params }) => {
    const tool = toolBySlug(params.slug);
    if (!tool) throw notFound();
    const related = await getRelatedPostsForTool({
      data: { categories: tool.relatedCategories, terms: tool.relatedTerms },
    }).catch(() => []);
    return { slug: tool.slug, related };
  },
  head: ({ params }) => {
    const tool = toolBySlug(params.slug);
    if (!tool) return { meta: [{ title: `Ferramenta não encontrada | ${SITE_NAME}` }] };
    const url = `${SITE_URL}/ferramentas/${tool.slug}`;
    const title = `${tool.seoTitle} | ${SITE_NAME}`;
    const image = tool.ogImage ? `${SITE_URL}${tool.ogImage}` : SITE_OG_IMAGE;
    return {
      meta: [
        { title },
        { name: "description", content: tool.description },
        { property: "og:title", content: title },
        { property: "og:description", content: tool.description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: toolJsonLd(tool).map((j) => ({ type: "application/ld+json", children: JSON.stringify(j) })),
    };
  },
  notFoundComponent: NotFound,
  component: ToolPage,
});

function ToolPage() {
  const { slug, related } = Route.useLoaderData();
  const tool = toolBySlug(slug)!;
  const Component = tool.component;
  return (
    <ToolLayout tool={tool} related={related}>
      <Component />
    </ToolLayout>
  );
}
```

Observações:

- O `head()` roda no servidor com o registro estático, então o HTML já sai com título, description e os 4
  JSON-LD — sem depender de `useSeo` no cliente. **Não** chamar `useSeo` dentro dos componentes de ferramenta
  (evita duplicar JSON-LD).
- Ferramentas com dados de mercado chamam suas server functions dentro do próprio componente com
  `useQuery` (TanStack Query, já na stack) **e** opcionalmente pré-carregam no `loader` (ver 3.1/3.2) para o
  HTML já sair com números. Decisão: as duas ferramentas de mercado pré-carregam no loader via
  `tool.preload?.()` (campo opcional já declarado em `ToolDefinition`, Passo 1): no loader,
  `const preloaded = tool.preload ? await tool.preload().catch(() => null) : null;` devolvendo
  `{ slug, related, preloaded }`. O componente lê com `Route.useLoaderData()` e usa como `initialData` do `useQuery`
  (esqueletos em §3.1 e §3.2).

### 1.7 Passo 7 — Menu e sitemap

1. **Menu** (`src/components/layout/SiteLayout.tsx`, constante `NAV_MAIN` — doc 03 §4.3; não existe `Header.tsx`):
   o item `{ to: "/ferramentas", label: "Ferramentas" }` já está lá desde a Fase 1, entre "Loja do Pai" e
   "Pai Indica Pai". Só conferir; não duplicar nem reordenar.
3. **Home**: `src/components/home/ToolsTeaser.tsx` passa a renderizar `featuredTools()` (4 cartões: conversor,
   mercado, churrasco, orçamento) com `ToolCard`, sem os selos "Em breve" da Fase 1; o bloco "Mercado do pai hoje"
   (`MarketTicker`, §3.2.6) entra logo abaixo dele.
2. **Sitemap** (`src/routes/sitemap[.]xml.ts`): importar `TOOLS` e emitir `<url>` para `/ferramentas` (priority 0.8,
   changefreq weekly) e para cada `/ferramentas/<slug>` (priority 0.7; `conversor-de-moedas` e `mercado-financeiro`
   com changefreq `hourly` e priority 0.9).

---

## 2. Banco, cache de mercado e cron

### 2.1 Passo 8 — Migration `supabase/migrations/0007_ferramentas.sql`

Colunas são as **fixas do brief** (`market_cache: key text pk, data jsonb, fetched_at timestamptz, ttl_seconds int`;
`tool_usage: id, tool_slug, user_id (nullable), created_at`). Nada além disso nas tabelas; o que é derivado vira
view/função.

O bloco abaixo é o **SQL do doc 02 §4.7 copiado literalmente** (nomes de policies e funções `get_market`,
`market_is_stale`, `tool_usage_stats` são os que o doc 02 §7 e o Painel Lisieux (doc 10 §11) consomem), seguido dos
complementos desta fase (índice, view diária e limpeza). A Fase 1 já aplicou `0007_ferramentas.sql` com o bloco do doc 02
(doc 03 §3.3); se `list_migrations` mostrar `0007_ferramentas`, salve só o bloco "Complementos da Fase 4" num arquivo novo
`supabase/migrations/00NN_ferramentas_extras.sql` (NN = próximo número livre, a mesma regra do doc 07 §2 — nunca reescrever a
0007 já aplicada) e aplique com esse nome (`apply_migration`, `name` = nome do arquivo sem extensão; CLAUDE.md §4.2: todo `.sql`
é commitado **e** aplicado). Tudo é idempotente.

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

-- Chaves de market_cache = `KEYS` de src/lib/market/fetchers.ts (§2.5); TTLs em src/lib/market/cache.ts (§2.3):
--   'fx:last'                 → AwesomeAPI /last (USD, EUR, GBP, ARS, BTC… em BRL), TTL 15 min
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

-- tool_usage: uso das ferramentas, anônimo (user_id null) ou identificado. Insert direto pelo client (§1.3 usage.ts);
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

-- ---------------------------------------------------------------
-- Complementos da Fase 4 (idempotentes; não alteram colunas)
-- ---------------------------------------------------------------
create index if not exists market_cache_fetched_at_idx on public.market_cache (fetched_at);

-- Agregado diário para o /admin (fuso de Brasília); respeita a RLS da tabela (só staff enxerga)
create or replace view public.tool_usage_daily
with (security_invoker = true) as
select
  tool_slug,
  (created_at at time zone 'America/Sao_Paulo')::date as dia,
  count(*)                       as aberturas,
  count(distinct user_id)        as usuarios_logados
from public.tool_usage
group by 1, 2;

-- Limpeza: tool_usage cresce rápido; manter 400 dias. Só o service role chama (manutenção da Fase 8).
-- Não é DELETE de rotina de conteúdo (CLAUDE.md §4.2 proíbe DELETE em dados editoriais; isto é telemetria expirada).
create or replace function public.tool_usage_prune(p_days int default 400)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  delete from public.tool_usage where created_at < now() - make_interval(days => p_days);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.tool_usage_prune(int) from public, anon, authenticated;

-- saved_items já aceita item_type = 'tool' (0004_membros.sql). Nada a alterar aqui.
```

Aplicação (CLAUDE.md §4.2: todo `.sql` é commitado **e** aplicado com `mcp__Supabase__apply_migration` no projeto
`<SUPABASE_PROJECT_REF>`, `name` = nome do arquivo sem extensão; depois `mcp__Supabase__get_advisors` security + performance):

```bash
cd /home/user/vocacaodepai
# 1) conferir o que já existe:  mcp__Supabase__list_migrations  → se "0007_ferramentas" já consta (Fase 1), aplicar
#    só o bloco "Complementos da Fase 4" como supabase/migrations/00NN_ferramentas_extras.sql (próximo NN livre);
#    senão aplicar o arquivo 0007 inteiro.
# 2) regenerar os tipos (script do doc 02 §2.1) e checar:
npm run types:supabase
npm run typecheck
```

Verificação:

```sql
select table_name from information_schema.tables where table_schema='public' and table_name in ('market_cache','tool_usage');
select policyname, cmd from pg_policies where tablename in ('market_cache','tool_usage') order by 1;
-- esperado: "market_cache: public read" (SELECT); "tool_usage: anon insert" (INSERT); "tool_usage: auth insert" (INSERT); "tool_usage: staff read" (SELECT)
select proname from pg_proc where pronamespace = 'public'::regnamespace and proname in ('get_market','market_is_stale','tool_usage_stats','tool_usage_prune') order by 1;
-- esperado: as 4 funções
select table_name from information_schema.views where table_schema = 'public' and table_name = 'tool_usage_daily';
```

### 2.2 Passo 9 — Tipos: `src/lib/market/types.ts`

```ts
export type CacheSource = "live" | "cache" | "stale";

export interface Cached<T> {
  data: T;
  fetchedAt: string; // ISO
  stale: boolean;    // true = TTL vencido e fonte falhou; servimos o último valor
  source: CacheSource;
}

export interface FxQuote {
  code: string;      // "USD"
  name: string;      // "Dólar Americano"
  bid: number;       // compra (em BRL)
  ask: number;       // venda (em BRL)
  high: number;
  low: number;
  pctChange: number; // variação % do dia
  timestamp: string; // ISO
}
export type FxLast = Record<string, FxQuote>; // chave = code ("USD")

export interface FxDailyPoint { date: string; bid: number; ask: number; high: number; low: number; pctChange: number }

export interface PtaxQuote { code: string; compra: number; venda: number; dataHora: string; dataCotacao: string }

export interface CryptoQuote { id: string; symbol: string; name: string; brl: number; usd: number; change24h: number; marketCapBrl: number; updatedAt: string }

export interface StockQuote { symbol: string; name: string; price: number; changePct: number; updatedAt: string; logo?: string }

export interface SgsPoint { date: string; value: number } // date "YYYY-MM-DD"
export interface Indicators {
  selicMeta: SgsPoint | null;       // SGS 432 (% a.a.)
  cdiAnual: SgsPoint | null;        // SGS 4389 (% a.a.)
  ipcaMensal: SgsPoint | null;      // SGS 433 (% a.m.)
  ipca12m: SgsPoint | null;         // SGS 13522 (% 12 meses)
  igpmMensal: SgsPoint | null;      // SGS 189 (% a.m.) — opcional
}

export interface TesouroTitulo { nome: string; vencimento: string; taxaCompra: number | null; taxaVenda: number | null; precoUnitario: number | null; tipo: "selic" | "ipca" | "prefixado" | "renda" | "educa" | "outro" }

export interface MarketSnapshot {
  fx: Cached<FxLast> | null;
  ptaxUsd: Cached<PtaxQuote> | null;
  crypto: Cached<CryptoQuote[]> | null;
  stocks: Cached<StockQuote[]> | null;
  indicators: Cached<Indicators> | null;
  tesouro: Cached<TesouroTitulo[]> | null;
  generatedAt: string;
}
```

### 2.3 Passo 10 — Cache: `src/lib/market/cache.ts` (só servidor)

```ts
import type { Cached } from "./types";

const FETCH_TIMEOUT_MS = 8000;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function readCache<T>(key: string): Promise<(Cached<T> & { ttl: number }) | null> {
  const sb = await admin();
  const { data, error } = await sb.from("market_cache").select("data,fetched_at,ttl_seconds").eq("key", key).maybeSingle();
  if (error || !data) return null;
  const fetchedAt = new Date(data.fetched_at);
  const fresh = fetchedAt.getTime() + data.ttl_seconds * 1000 > Date.now();
  return { data: data.data as T, fetchedAt: fetchedAt.toISOString(), stale: !fresh, source: fresh ? "cache" : "stale", ttl: data.ttl_seconds };
}

export async function writeCache<T>(key: string, data: T, ttlSeconds: number) {
  const sb = await admin();
  const { error } = await sb.from("market_cache").upsert(
    { key, data: data as never, fetched_at: new Date().toISOString(), ttl_seconds: ttlSeconds },
    { onConflict: "key" },
  );
  if (error) console.error("market_cache upsert", key, error.message);
}

export async function fetchJsonWithTimeout<T>(url: string, init: RequestInit = {}, ms = FETCH_TIMEOUT_MS): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { accept: "application/json", "user-agent": "VocacaoDePai/1.0 (+https://vocacaodepai.com.br)", ...(init.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText} em ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Padrão stale-while-error:
 * 1) cache fresco → devolve;
 * 2) senão busca na fonte (timeout 8 s) → grava e devolve "live";
 * 3) se a fonte falhar e houver cache vencido → devolve "stale";
 * 4) sem nada → lança (quem chama decide mostrar "indisponível").
 */
export async function cached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>, opts: { force?: boolean } = {}): Promise<Cached<T>> {
  const hit = await readCache<T>(key);
  if (hit && !hit.stale && !opts.force) return hit;
  try {
    const data = await fetcher();
    await writeCache(key, data, ttlSeconds);
    return { data, fetchedAt: new Date().toISOString(), stale: false, source: "live" };
  } catch (err) {
    console.warn(`[market] ${key} falhou:`, (err as Error).message);
    if (hit) return { ...hit, stale: true, source: "stale" };
    throw err;
  }
}

export const TTL = {
  FX_LAST: 15 * 60,       // AwesomeAPI /last
  FX_DAILY: 6 * 3600,     // AwesomeAPI /json/daily
  PTAX: 6 * 3600,         // BCB PTAX (muda 1x por dia útil)
  CRYPTO: 10 * 60,        // CoinGecko
  STOCKS: 30 * 60,        // Brapi (em pregão); fora do pregão serve o último
  SGS: 12 * 3600,         // BCB SGS (Selic/CDI/IPCA)
  TESOURO: 6 * 3600,
} as const;
```

### 2.4 Passo 11 — Fontes: `src/lib/market/sources/*.ts`

Cada arquivo exporta funções puras `fetchX()` que **só** falam com a API e normalizam para os tipos de 2.2.
Nenhuma delas lê/escreve cache (isso é do `fetchers.ts`).

**`awesomeapi.ts`** — AwesomeAPI (gratuita, sem chave; uso justo: não bater mais de 1×/min por par; nós batemos
1×/15 min via cache).

- Último: `GET https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL` → objeto com chave `USDBRL`
  → `{ code, codein, name, high, low, varBid, pctChange, bid, ask, timestamp (unix s), create_date }`.
- Histórico: `GET https://economia.awesomeapi.com.br/json/daily/USD-BRL/30` → array (mais recente primeiro) com
  `bid, ask, high, low, pctChange, timestamp`.
- Lista de pares disponíveis (usar uma vez na implementação para validar `currencies.ts`):
  `GET https://economia.awesomeapi.com.br/json/available/uniq`.

```ts
import { fetchJsonWithTimeout } from "../cache";
import type { FxDailyPoint, FxLast, FxQuote } from "../types";
import { CURRENCIES } from "@/lib/tools/currencies";

const BASE = "https://economia.awesomeapi.com.br";
const CHUNK = 10; // pares por requisição (seguro)

interface Raw { code: string; codein: string; name: string; high: string; low: string; pctChange: string; bid: string; ask: string; timestamp: string }

export async function fetchFxLast(codes = CURRENCIES.filter((c) => c.code !== "BRL").map((c) => c.code)): Promise<FxLast> {
  const out: FxLast = {};
  for (let i = 0; i < codes.length; i += CHUNK) {
    const pairs = codes.slice(i, i + CHUNK).map((c) => `${c}-BRL`).join(",");
    const raw = await fetchJsonWithTimeout<Record<string, Raw>>(`${BASE}/last/${pairs}`);
    for (const r of Object.values(raw)) {
      const q: FxQuote = {
        code: r.code,
        name: r.name.split("/")[0].trim(),
        bid: Number(r.bid), ask: Number(r.ask), high: Number(r.high), low: Number(r.low),
        pctChange: Number(r.pctChange),
        timestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
      };
      if (Number.isFinite(q.bid) && q.bid > 0) out[q.code] = q;
    }
  }
  if (!Object.keys(out).length) throw new Error("AwesomeAPI devolveu vazio");
  return out;
}

export async function fetchFxDaily(pair: string, days = 30): Promise<FxDailyPoint[]> {
  if (!/^[A-Z]{3}-[A-Z]{3}$/.test(pair)) throw new Error("par inválido");
  const raw = await fetchJsonWithTimeout<Raw[]>(`${BASE}/json/daily/${pair}/${Math.min(Math.max(days, 1), 365)}`);
  return raw
    .map((r) => ({ date: new Date(Number(r.timestamp) * 1000).toISOString().slice(0, 10), bid: Number(r.bid), ask: Number(r.ask), high: Number(r.high), low: Number(r.low), pctChange: Number(r.pctChange ?? 0) }))
    .reverse(); // mais antigo → mais recente (ordem do gráfico)
}
```

**`bcb-ptax.ts`** — PTAX oficial (Olinda/OData, gratuita, sem chave). Não há PTAX em fins de semana/feriados: tentar
a data de hoje (fuso Brasília) e recuar até 6 dias.

- Dólar: `GET https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='MM-DD-YYYY'&$format=json`
  → `{ value: [{ cotacaoCompra, cotacaoVenda, dataHoraCotacao }] }` (vazio se não houver PTAX no dia).
- Outras moedas: `GET https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='EUR'&@dataCotacao='MM-DD-YYYY'&$format=json`
  → `value[]` com vários boletins; usar o último com `tipoBoletim = "Fechamento"`.
  Moedas com PTAX: USD, EUR, GBP, JPY, CHF, CAD, AUD, DKK, NOK, SEK (lista do BCB; para as demais mostrar "sem PTAX").

```ts
import { fetchJsonWithTimeout } from "../cache";
import type { PtaxQuote } from "../types";

const BASE = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";
export const PTAX_CODES = ["USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "DKK", "NOK", "SEK"] as const;

function mmddyyyy(d: Date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", month: "2-digit", day: "2-digit", year: "numeric" }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return `${g("month")}-${g("day")}-${g("year")}`;
}

export async function fetchPtax(code: string): Promise<PtaxQuote> {
  for (let back = 0; back <= 6; back++) {
    const d = new Date(Date.now() - back * 86400000);
    const dc = mmddyyyy(d);
    const url = code === "USD"
      ? `${BASE}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dc}'&$format=json`
      : `${BASE}/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${code}'&@dataCotacao='${dc}'&$format=json`;
    const raw = await fetchJsonWithTimeout<{ value: Array<{ cotacaoCompra: number; cotacaoVenda: number; dataHoraCotacao: string; tipoBoletim?: string }> }>(url);
    const rows = code === "USD" ? raw.value : raw.value.filter((r) => r.tipoBoletim === "Fechamento");
    const last = rows.at(-1);
    if (last) return { code, compra: last.cotacaoCompra, venda: last.cotacaoVenda, dataHora: last.dataHoraCotacao, dataCotacao: dc };
  }
  throw new Error(`PTAX ${code}: sem cotação nos últimos 7 dias`);
}
```

**`bcb-sgs.ts`** — Séries temporais do BCB (gratuita, sem chave; respeitar ≤ 10 anos por consulta — usamos `ultimos/N`).

- `GET https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{n}?formato=json`
  → `[{ "data": "dd/mm/yyyy", "valor": "10.50" }]`.
- Códigos fixos: **432** Meta Selic (% a.a.), **4389** CDI anualizado (% a.a.), **433** IPCA mensal (% a.m.),
  **13522** IPCA acumulado 12 meses (%), **189** IGP-M mensal (% a.m.), **12** CDI diário (% a.d.) — só como fallback
  do 4389 convertendo `((1 + d/100) ** 252 - 1) * 100`.

```ts
import { fetchJsonWithTimeout } from "../cache";
import type { Indicators, SgsPoint } from "../types";

const BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
export const SGS = { SELIC_META: 432, CDI_DIARIO: 12, CDI_ANUAL: 4389, IPCA_MENSAL: 433, IPCA_12M: 13522, IGPM_MENSAL: 189 } as const;

export async function fetchSgsLast(code: number, n = 1): Promise<SgsPoint[]> {
  const raw = await fetchJsonWithTimeout<Array<{ data: string; valor: string }>>(`${BASE}.${code}/dados/ultimos/${n}?formato=json`);
  return raw.map((r) => { const [d, m, y] = r.data.split("/"); return { date: `${y}-${m}-${d}`, value: Number(r.valor.replace(",", ".")) }; });
}

export async function fetchIndicators(): Promise<Indicators> {
  const [selic, cdi, ipca, ipca12, igpm] = await Promise.allSettled([
    fetchSgsLast(SGS.SELIC_META), fetchSgsLast(SGS.CDI_ANUAL), fetchSgsLast(SGS.IPCA_MENSAL), fetchSgsLast(SGS.IPCA_12M), fetchSgsLast(SGS.IGPM_MENSAL),
  ]);
  const pick = (r: PromiseSettledResult<SgsPoint[]>) => (r.status === "fulfilled" ? r.value.at(-1) ?? null : null);
  let cdiAnual = pick(cdi);
  if (!cdiAnual) {
    const d = await fetchSgsLast(SGS.CDI_DIARIO).catch(() => []);
    const last = d.at(-1);
    if (last) cdiAnual = { date: last.date, value: ((1 + last.value / 100) ** 252 - 1) * 100 };
  }
  const out = { selicMeta: pick(selic), cdiAnual, ipcaMensal: pick(ipca), ipca12m: pick(ipca12), igpmMensal: pick(igpm) };
  if (!out.selicMeta && !out.ipcaMensal) throw new Error("SGS indisponível");
  return out;
}
```

**`coingecko.ts`** — CoinGecko, endpoint público **sem chave** (a lista de variáveis de ambiente é fechada — CLAUDE.md §13
e doc 02 §8 — e não inclui chave do CoinGecko; o limite público, ~5 a 15 req/min, é mais do que suficiente para 1 chamada a
cada 10 min via cache). Fallback automático: `BTC-BRL` e `ETH-BRL` da AwesomeAPI.

- `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl,usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`
  → `{ bitcoin: { brl, usd, brl_24h_change, brl_market_cap, last_updated_at } }`.

```ts
import { fetchJsonWithTimeout } from "../cache";
import type { CryptoQuote } from "../types";
import { fetchFxLast } from "./awesomeapi";

const IDS = [{ id: "bitcoin", symbol: "BTC", name: "Bitcoin" }, { id: "ethereum", symbol: "ETH", name: "Ethereum" }];

export async function fetchCrypto(): Promise<CryptoQuote[]> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${IDS.map((c) => c.id).join(",")}&vs_currencies=brl,usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`;
  try {
    const raw = await fetchJsonWithTimeout<Record<string, Record<string, number>>>(url);
    return IDS.map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, brl: raw[c.id].brl, usd: raw[c.id].usd, change24h: raw[c.id].brl_24h_change ?? 0, marketCapBrl: raw[c.id].brl_market_cap ?? 0, updatedAt: new Date((raw[c.id].last_updated_at ?? Date.now() / 1000) * 1000).toISOString() }));
  } catch (e) {
    // Fallback: AwesomeAPI (sem market cap)
    const fx = await fetchFxLast(["BTC", "ETH"]);
    const usd = (await fetchFxLast(["USD"])).USD?.bid ?? 0;
    return IDS.filter((c) => fx[c.symbol]).map((c) => ({ id: c.id, symbol: c.symbol, name: c.name, brl: fx[c.symbol].bid, usd: usd ? fx[c.symbol].bid / usd : 0, change24h: fx[c.symbol].pctChange, marketCapBrl: 0, updatedAt: fx[c.symbol].timestamp }));
  }
}
```

**`brapi.ts`** — Brapi (B3). **Requer token** (`BRAPI_TOKEN`, grátis em brapi.dev — plano gratuito: 1 ticker por
requisição e cota mensal limitada; confirmar números em `https://brapi.dev/precos` no dia). Decisão de consumo: atualizar
**só em dia útil, das 10h às 18h de Brasília, a cada 30 min** (≈ 17 execuções/dia × 9 tickers ≈ 3.400 req/mês), uma
requisição por ticker, sequencial, com 150 ms de intervalo. Sem token → `stocks = null` e o card de ações não aparece.

- `GET https://brapi.dev/api/quote/PETR4?token=<BRAPI_TOKEN>` → `{ results: [{ symbol, shortName, longName, regularMarketPrice, regularMarketChangePercent, regularMarketTime, logourl }] }`.
- Tickers fixos: `^BVSP` (Ibovespa), `PETR4`, `VALE3`, `ITUB4`, `BBDC4`, `BBAS3`, `WEGE3`, `ABEV3`, `B3SA3`.

```ts
import { fetchJsonWithTimeout } from "../cache";
import type { StockQuote } from "../types";

export const TICKERS = ["^BVSP", "PETR4", "VALE3", "ITUB4", "BBDC4", "BBAS3", "WEGE3", "ABEV3", "B3SA3"] as const;
const NAMES: Record<string, string> = { "^BVSP": "Ibovespa", PETR4: "Petrobras PN", VALE3: "Vale ON", ITUB4: "Itaú Unibanco PN", BBDC4: "Bradesco PN", BBAS3: "Banco do Brasil ON", WEGE3: "WEG ON", ABEV3: "Ambev ON", B3SA3: "B3 ON" };

export function isB3TradingWindow(now = new Date()) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false, weekday: "short" }).formatToParts(now);
  const hour = Number(p.find((x) => x.type === "hour")!.value);
  const wd = p.find((x) => x.type === "weekday")!.value;
  return !["Sat", "Sun"].includes(wd) && hour >= 10 && hour < 18;
}

export async function fetchStocks(): Promise<StockQuote[]> {
  const token = process.env["BRAPI_TOKEN"];
  if (!token) throw new Error("BRAPI_TOKEN ausente");
  const out: StockQuote[] = [];
  for (const t of TICKERS) {
    try {
      const raw = await fetchJsonWithTimeout<{ results: Array<{ symbol: string; shortName?: string; regularMarketPrice: number; regularMarketChangePercent: number; regularMarketTime: string; logourl?: string }> }>(
        `https://brapi.dev/api/quote/${encodeURIComponent(t)}?token=${token}`);
      const r = raw.results?.[0];
      if (r) out.push({ symbol: r.symbol, name: NAMES[r.symbol] ?? r.shortName ?? r.symbol, price: r.regularMarketPrice, changePct: r.regularMarketChangePercent, updatedAt: r.regularMarketTime, logo: r.logourl });
    } catch (e) { console.warn("brapi", t, (e as Error).message); }
    await new Promise((r) => setTimeout(r, 150));
  }
  if (!out.length) throw new Error("Brapi sem resultados");
  return out;
}
```

**`tesouro.ts`** — Tesouro Direto. Fonte primária: JSON público (não documentado) usado pelo site do Tesouro:
`GET https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json` →
`response.TrsrBdTradgList[]` com `TrsrBd.nm`, `TrsrBd.mtrtyDt`, `TrsrBd.anulInvstmtRate`, `TrsrBd.anulRedRate`,
`TrsrBd.untrInvstmtVal`. Pode bloquear user-agents não navegador → enviar
`user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36` e `referer: https://www.tesourodireto.com.br/`.
Fallback 1: CSV diário do Tesouro Transparente
`https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/precotaxatesourodireto.csv`
(grande, ~MBs; ler só as linhas da última `Data Base`; TTL 24 h). Fallback 2: card oculto. Classificar `tipo` pelo nome
(`Selic`→selic, `IPCA+`→ipca, `Prefixado`→prefixado, `Renda+`→renda, `Educa+`→educa).

### 2.5 Passo 12 — Server functions e refresh: `src/lib/market/fetchers.ts` e `src/lib/market/refresh.ts`

**`fetchers.ts`** (chamadas pelo cliente/loader; cada uma usa `cached()` → nunca bate na fonte se o cron já abasteceu):

```ts
import { createServerFn } from "@tanstack/react-start";
import { cached, TTL } from "./cache";
import { fetchFxDaily, fetchFxLast } from "./sources/awesomeapi";
import { fetchPtax, PTAX_CODES } from "./sources/bcb-ptax";
import { fetchIndicators } from "./sources/bcb-sgs";
import { fetchCrypto } from "./sources/coingecko";
import { fetchStocks } from "./sources/brapi";
import { fetchTesouro } from "./sources/tesouro";
import type { Cached, FxDailyPoint, FxLast, MarketSnapshot, PtaxQuote } from "./types";

export const KEYS = {
  fxLast: "fx:last",
  fxDaily: (pair: string, days: number) => `fx:daily:${pair}:${days}`,
  ptax: (code: string) => `ptax:${code}`,
  crypto: "crypto:simple",
  stocks: "b3:quotes",
  indicators: "sgs:indicators",
  tesouro: "tesouro:titulos",
} as const;

const safe = async <T>(p: Promise<Cached<T>>): Promise<Cached<T> | null> => p.catch(() => null);

export const getFxLast = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cached<FxLast>> => cached(KEYS.fxLast, TTL.FX_LAST, fetchFxLast),
);

export const getFxDaily = createServerFn({ method: "GET" })
  .inputValidator((d: { pair: string; days?: number }) => ({ pair: String(d.pair).toUpperCase(), days: Math.min(Math.max(Number(d.days ?? 30), 7), 365) }))
  .handler(async ({ data }): Promise<Cached<FxDailyPoint[]>> =>
    cached(KEYS.fxDaily(data.pair, data.days), TTL.FX_DAILY, () => fetchFxDaily(data.pair, data.days)));

export const getPtax = createServerFn({ method: "GET" })
  .inputValidator((d: { code: string }) => ({ code: String(d.code).toUpperCase() }))
  .handler(async ({ data }): Promise<Cached<PtaxQuote> | null> => {
    if (!(PTAX_CODES as readonly string[]).includes(data.code)) return null;
    return safe(cached(KEYS.ptax(data.code), TTL.PTAX, () => fetchPtax(data.code)));
  });

export const getMarketSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<MarketSnapshot> => {
  const [fx, ptaxUsd, crypto, stocks, indicators, tesouro] = await Promise.all([
    safe(cached(KEYS.fxLast, TTL.FX_LAST, fetchFxLast)),
    safe(cached(KEYS.ptax("USD"), TTL.PTAX, () => fetchPtax("USD"))),
    safe(cached(KEYS.crypto, TTL.CRYPTO, fetchCrypto)),
    safe(cached(KEYS.stocks, TTL.STOCKS, fetchStocks)),
    safe(cached(KEYS.indicators, TTL.SGS, fetchIndicators)),
    safe(cached(KEYS.tesouro, TTL.TESOURO, fetchTesouro)),
  ]);
  return { fx, ptaxUsd, crypto, stocks, indicators, tesouro, generatedAt: new Date().toISOString() };
});
```

**`refresh.ts`** (usado pelo endpoint do cron; força a atualização respeitando a janela da B3):

```ts
import { cached, TTL } from "./cache";
import { KEYS } from "./fetchers";
import { fetchFxDaily, fetchFxLast } from "./sources/awesomeapi";
import { fetchPtax } from "./sources/bcb-ptax";
import { fetchIndicators } from "./sources/bcb-sgs";
import { fetchCrypto } from "./sources/coingecko";
import { fetchStocks, isB3TradingWindow } from "./sources/brapi";
import { fetchTesouro } from "./sources/tesouro";

const DAILY_PAIRS = ["USD-BRL", "EUR-BRL", "GBP-BRL", "BTC-BRL"];

export async function refreshAll() {
  const started = Date.now();
  const jobs: Record<string, () => Promise<unknown>> = {
    [KEYS.fxLast]: () => cached(KEYS.fxLast, TTL.FX_LAST, fetchFxLast, { force: true }),
    [KEYS.ptax("USD")]: () => cached(KEYS.ptax("USD"), TTL.PTAX, () => fetchPtax("USD")),
    [KEYS.ptax("EUR")]: () => cached(KEYS.ptax("EUR"), TTL.PTAX, () => fetchPtax("EUR")),
    [KEYS.crypto]: () => cached(KEYS.crypto, TTL.CRYPTO, fetchCrypto, { force: true }),
    [KEYS.indicators]: () => cached(KEYS.indicators, TTL.SGS, fetchIndicators),
    [KEYS.tesouro]: () => cached(KEYS.tesouro, TTL.TESOURO, fetchTesouro),
    ...Object.fromEntries(DAILY_PAIRS.map((p) => [KEYS.fxDaily(p, 30), () => cached(KEYS.fxDaily(p, 30), TTL.FX_DAILY, () => fetchFxDaily(p, 30))])),
  };
  if (process.env["BRAPI_TOKEN"] && isB3TradingWindow()) {
    jobs[KEYS.stocks] = () => cached(KEYS.stocks, TTL.STOCKS, fetchStocks, { force: true });
  }
  const results = await Promise.allSettled(Object.entries(jobs).map(async ([k, fn]) => ({ k, r: await fn() })));
  const refreshed: string[] = [], failed: Array<{ key: string; error: string }> = [];
  results.forEach((res, i) => {
    const key = Object.keys(jobs)[i];
    if (res.status === "fulfilled") refreshed.push(key); else failed.push({ key, error: String(res.reason?.message ?? res.reason) });
  });
  return { ok: failed.length === 0, refreshed, failed, durationMs: Date.now() - started };
}
```

### 2.6 Passo 13 — Endpoint `src/routes/api/market/refresh.ts` + cron

Segredo: **`CRON_SECRET`**, o único segredo de cron/refresh/integrações (doc 02 §8, CLAUDE.md §13 — `MARKET_REFRESH_TOKEN`
e `MARKET_REFRESH_SECRET` **não existem**). Header `Authorization: Bearer <CRON_SECRET>`, comparado em tempo constante.

```ts
import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

const SECURITY_HEADERS = { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" };

function sameSecret(got: string | null, expected: string | undefined) {
  if (!got || !expected) return false;
  const a = Buffer.from(got), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: Request) {
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!sameSecret(got, process.env["CRON_SECRET"])) return new Response("unauthorized", { status: 401, headers: SECURITY_HEADERS });
  const { refreshAll } = await import("@/lib/market/refresh");
  const result = await refreshAll();
  return new Response(JSON.stringify(result), { status: result.ok ? 200 : 207, headers: { ...SECURITY_HEADERS, "content-type": "application/json" } });
}

export const Route = createFileRoute("/api/market/refresh")({
  server: { handlers: { GET: ({ request }) => handle(request), POST: ({ request }) => handle(request) } },
});
```

**Cron — decisão fixa: GitHub Actions a cada 30 min** (funciona em qualquer plano da Vercel; o cron da Vercel em
plano Hobby só roda 1×/dia). Arquivo `.github/workflows/market-refresh.yml`:

```yaml
name: Market refresh (Caixa de Ferramentas)
on:
  schedule:
    - cron: "*/30 * * * *"   # UTC; o GitHub pode atrasar alguns minutos — o cache stale-while-error cobre
  workflow_dispatch: {}
concurrency:
  group: market-refresh
  cancel-in-progress: false
jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - name: Chamar /api/market/refresh
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
        run: |
          set -euo pipefail
          code=$(curl -sS -o /tmp/out.json -w '%{http_code}' --max-time 60 -X POST \
            -H "Authorization: Bearer ${CRON_SECRET}" "https://vocacaodepai.com.br/api/market/refresh")
          echo "HTTP ${code}"; cat /tmp/out.json; echo
          if [ "$code" != "200" ] && [ "$code" != "207" ]; then exit 1; fi
```

**Sem Vercel Cron** (doc 02 §7): o agendamento é só o workflow acima. O mesmo `CRON_SECRET` fica na Vercel (env do
servidor), no GitHub (secret do repositório) e, mais tarde, no Supabase Vault (doc 02 §4.8) e no grupovdp (Painel Lisieux).
O `vercel.json` desta fase não ganha `crons`.

Teste local do endpoint:

```bash
cd /home/user/vocacaodepai && CRON_SECRET=dev-token npm run dev &
sleep 8
curl -s -X POST -H "Authorization: Bearer dev-token" http://localhost:5173/api/market/refresh | jq .
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:5173/api/market/refresh   # esperado: 401
```

---

## 3. As 17 ferramentas (uma subseção por slug do §0.2)

### 3.0 Convenções que valem para as 17

1. **Arquivo**: `src/components/ferramentas/<slug>/<Nome>.tsx` com `export default function <Nome>()`. Nome fixo por
   ferramenta (tabela do §0.5). Nada de `useSeo`/JSON-LD dentro do componente (a rota `$slug.tsx` já emite tudo).
2. **Entrada no registry** (`src/lib/tools/registry.ts`, Passo 1): copiar literalmente o bloco `ts` de cada subseção
   (campos `slug, title, seoTitle, description, short, icon, category, alsoIn?, appCategory, featured?, usesMarketData?,
   howTo[3–6], faq[4–6], relatedCategories, relatedTerms, disclaimer?, preload?, component`). `seoTitle` ≤ 60 caracteres,
   `description` 120–158 (há teste).
3. **"Como usar" (≥ 300 palavras)**: o bloco `text` de cada subseção vai literalmente para `src/lib/tools/como-usar.ts`
   como `COMO_USAR["<slug>"]` (template string). Parágrafos separados por linha em branco; `## ` abre um `<h3>`.
4. **Dados e cálculo** em `src/lib/tools/<arquivo>` (§0.5): funções **puras**, sem React, cobertas por
   `tests/tools/<arquivo>.test.ts` (§4.2). O componente só monta formulário e chama a função.
5. **Resultado** em `ToolResultCard`; sinais com `SemaforoCallout` (tons `ok → warn → bad`, nunca um 4º); dinheiro com
   `formatBRL`; percentuais com `formatPct`. Toda ferramenta de dinheiro, saúde ou direito termina com o `disclaimer` do
   registry ("informação educativa", "procure um profissional") — nunca aconselhamento como se fosse profissional
   (CLAUDE.md §3).
6. **Preço nunca exato** (CLAUDE.md §5.2): quando uma ferramenta cita preço de produto ou de corte de carne, é faixa
   (`min`–`max`) com data de pesquisa e 2 fontes; a tela escreve "faixa de referência pesquisada em <data>".
7. **Links para a Loja do Pai**: só `/loja/<slug>` de produto que existe (`select slug from products where active`);
   se ainda não existir, linkar `/loja/categoria/<slug>` (categorias do doc 05 §10: `churrasco-e-cozinha`,
   `ferramentas`, `carro-e-moto`, `tecnologia`, `esporte-e-outdoor`, `paternidade-pratica`, `livros-e-formacao`,
   `estilo-e-barba`, `casa-e-jardim`, `presentes-para-o-pai`; confirmar com `select slug from product_categories`).
8. **Persistência**: estado em `useState`; opcionalmente `localStorage` com chave `vdp:tool:<slug>` dentro de `try/catch`
   (modo privado pode falhar). No banco só `tool_usage` (automático) e `saved_items` (botão Salvar). Nenhuma tabela nova.
9. **Formulário**: componentes shadcn (`Input`, `Select`, `Slider`, `Switch`, `Tabs`, `Checkbox`, `Label`); labels
   visíveis; `inputMode="decimal"` em campos numéricos; `aria-live="polite"` no bloco de resultado; funciona sem mouse.
10. **Compartilhar**: `ToolShareButton` recebe `text` com o resultado em 1 linha (ex.: "US$ 100 = R$ 5xx,xx (comercial)") e
    a URL com os parâmetros relevantes em query string (`?de=USD&para=BRL&valor=100`), lidos no `useState` inicial.
11. **Critério de aceite**: o de cada subseção + os gerais do §5. Marcar a caixa 4.x do `13-checklist-de-execucao.md`.

### 3.1 `conversor-de-moedas` — Conversor de moedas (destaque do dono)

- **Arquivo**: `src/components/ferramentas/conversor-de-moedas/CurrencyConverter.tsx` (nome do doc 02 §3).
- **Dados**: `src/lib/tools/currencies.ts` (lista fechada de 32 moedas: `{ code, name, flag, ptax?: boolean }` — BRL, USD,
  EUR, GBP, ARS, CLP, UYU, PYG, COP, MXN, CAD, AUD, NZD, JPY, CNY, KRW, INR, CHF, SEK, NOK, DKK, PLN, CZK, HUF, TRY, ZAR,
  ILS, AED, SAR, RUB, BTC, ETH; validar cada par com `GET https://economia.awesomeapi.com.br/json/available/uniq` na
  implementação e remover o que a AwesomeAPI não oferecer) + `src/lib/market/fetchers.ts` (`getFxLast`, `getFxDaily`,
  `getPtax`).
- **Entradas → saídas**: valor (texto PT-BR, `parseBRNumber`), moeda de origem, moeda de destino (padrão USD → BRL),
  botão inverter. Saída: valor convertido (cotação comercial `bid`), cotação unitária nos dois sentidos, variação do dia,
  máxima/mínima do dia, PTAX de fechamento (quando a moeda tiver), gráfico de 30 dias (AreaChart), hora da atualização e
  `MarketStale`. Conversão entre duas moedas que não são BRL passa pelo real: `taxa = brl(origem) / brl(destino)`.
- **Entrada do registry**: já está literal no Passo 1 (§1.1); acrescentar
  `preload: () => import("@/lib/market/fetchers").then((m) => m.getFxLast())` (import dinâmico: o registry não importa
  o módulo de servidor estaticamente, o bundle do índice fica leve e o teste do §4.2 roda em Node).
- **Esqueleto do componente** (recharts + `MarketStale`; o restante é formulário):

```tsx
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeftRight } from "lucide-react";
import { getFxDaily, getFxLast, getPtax } from "@/lib/market/fetchers";
import type { Cached, FxLast } from "@/lib/market/types";
import { CURRENCIES } from "@/lib/tools/currencies";
import { formatDateTimeBR, formatMoney, formatNumber, formatPct, parseBRNumber } from "@/lib/tools/format";
import { MarketStale } from "@/components/ferramentas/MarketStale";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const route = getRouteApi("/_site/ferramentas/$slug");

function readQuery() {
  if (typeof window === "undefined") return { de: "USD", para: "BRL", valor: "100" };
  const q = new URLSearchParams(window.location.search);
  return { de: q.get("de") ?? "USD", para: q.get("para") ?? "BRL", valor: q.get("valor") ?? "100" };
}

export default function CurrencyConverter() {
  const { preloaded } = route.useLoaderData() as { preloaded: Cached<FxLast> | null };
  const [{ de, para, valor }, set] = useState(readQuery);
  const amount = parseBRNumber(valor);

  const fx = useQuery({
    queryKey: ["fx:last"],
    queryFn: () => getFxLast(),
    initialData: preloaded ?? undefined,
    staleTime: 15 * 60_000,
    refetchInterval: 15 * 60_000,
  });
  const pairCode = de === "BRL" ? para : de;
  const daily = useQuery({
    queryKey: ["fx:daily", pairCode],
    queryFn: () => getFxDaily({ data: { pair: `${pairCode}-BRL`, days: 30 } }),
    staleTime: 6 * 3_600_000,
    enabled: pairCode !== "BRL",
  });
  const ptax = useQuery({
    queryKey: ["ptax", pairCode],
    queryFn: () => getPtax({ data: { code: pairCode } }),
    staleTime: 6 * 3_600_000,
    enabled: pairCode !== "BRL",
  });

  const brl = (code: string) => (code === "BRL" ? 1 : fx.data?.data[code]?.bid ?? null);
  const rate = useMemo(() => {
    const a = brl(de), b = brl(para);
    return a && b ? a / b : null;
  }, [fx.data, de, para]);
  const result = rate && Number.isFinite(amount) ? amount * rate : null;
  const quote = fx.data?.data[pairCode];

  const swap = () => set((s) => ({ ...s, de: s.para, para: s.de }));
  const shareText = result != null ? `${formatMoney(amount, de)} = ${formatMoney(result, para)} (cotação comercial)` : "";
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/ferramentas/conversor-de-moedas?de=${de}&para=${para}&valor=${encodeURIComponent(valor)}` : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form className="space-y-4 rounded-2xl border border-border bg-card p-5" onSubmit={(e) => e.preventDefault()}>
        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input id="valor" inputMode="decimal" value={valor} onChange={(e) => set((s) => ({ ...s, valor: e.target.value }))} />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <Label>De</Label>
            <Select value={de} onValueChange={(v) => set((s) => ({ ...s, de: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <button type="button" onClick={swap} aria-label="Inverter moedas" className="mb-1 rounded-full border border-border p-2 hover:border-primary"><ArrowLeftRight className="h-4 w-4" /></button>
          <div>
            <Label>Para</Label>
            <Select value={para} onValueChange={(v) => set((s) => ({ ...s, para: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        {fx.data && <MarketStale fetchedAt={fx.data.fetchedAt} stale={fx.data.stale} sources={["AwesomeAPI", "Banco Central do Brasil (PTAX)"]} />}
      </form>

      <section aria-live="polite" className="space-y-4">
        <ToolResultCard label={`${formatMoney(Number.isFinite(amount) ? amount : 0, de)} em ${para}`}
          value={result != null ? formatMoney(result, para) : fx.isLoading ? "Carregando…" : "Indisponível"}
          hint={rate ? `1 ${de} = ${formatNumber(rate, 4)} ${para} · 1 ${para} = ${formatNumber(1 / rate, 4)} ${de}` : undefined}
          tone="primary" />
        {quote && (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <ToolResultCard label="Variação do dia" value={formatPct(quote.pctChange)} tone={quote.pctChange >= 0 ? "success" : "danger"} />
            <ToolResultCard label="Máxima" value={formatNumber(quote.high, 4)} tone="neutral" />
            <ToolResultCard label="Mínima" value={formatNumber(quote.low, 4)} tone="neutral" />
            <ToolResultCard label="PTAX (fechamento)" value={ptax.data?.data ? formatNumber(ptax.data.data.venda, 4) : "sem PTAX"} hint={ptax.data?.data ? `BCB · ${ptax.data.data.dataCotacao}` : "só USD, EUR, GBP, JPY, CHF, CAD, AUD, DKK, NOK, SEK"} tone="neutral" />
          </div>
        )}
        {daily.data?.data?.length ? (
          <figure className="rounded-2xl border border-border bg-card p-4">
            <figcaption className="mb-2 text-sm font-bold">{pairCode} em reais — últimos 30 dias</figcaption>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily.data.data}>
                <XAxis dataKey="date" tickFormatter={(d: string) => d.slice(8, 10) + "/" + d.slice(5, 7)} minTickGap={24} />
                <YAxis domain={["auto", "auto"]} width={56} tickFormatter={(v: number) => formatNumber(v, 2)} />
                <Tooltip formatter={(v: number) => formatNumber(v, 4)} labelFormatter={(d: string) => d.split("-").reverse().join("/")} />
                <Area type="monotone" dataKey="bid" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </figure>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{quote ? `Cotação comercial de ${formatDateTimeBR(quote.timestamp)}` : ""}</span>
          {shareText && <ToolShareButton title="Conversor de moedas — Vocação de Pai" text={shareText} url={shareUrl} />}
        </div>
      </section>
    </div>
  );
}
```

- **Como usar** (`COMO_USAR["conversor-de-moedas"]`):

```text
O conversor de moedas do Vocação de Pai foi feito para a conta que o pai de família faz de verdade: quanto vai custar aquele produto importado, quanto vale o que um parente mandou do exterior, quanto dinheiro levar numa viagem ou quanto rende um investimento feito em dólar. Você digita o valor, escolhe a moeda de origem e a de destino e o resultado aparece na hora, com a cotação comercial do momento e, quando existir, a PTAX oficial do Banco Central.

## O que cada número quer dizer

A cotação comercial é a referência usada entre bancos, empresas e investidores. É a que aparece no noticiário e a que usamos para converter. A PTAX é a média oficial calculada pelo Banco Central ao fim de cada dia útil; ela serve para contratos, declaração de imposto de renda e para conferir se a cotação que alguém lhe passou está razoável. A cotação de turismo, que você paga na casa de câmbio ou no cartão internacional, não aparece aqui porque varia de loja para loja e costuma ficar entre três e oito por cento acima da comercial, fora o IOF.

## Como fazer a conta do cartão internacional

Converta o valor da compra para reais com a cotação comercial e some uma margem de segurança de cerca de dez por cento. Essa margem cobre o spread do banco e o IOF da operação. Se o resultado ainda couber no seu orçamento do mês, a compra é viável; se só couber com a margem zerada, espere. O pai que provê não compra no limite.

## Como usar o gráfico de 30 dias

O gráfico mostra o caminho da moeda no último mês. Uma linha subindo forte indica que o real perdeu valor; uma linha descendo indica que o real ganhou. Não use isso para tentar adivinhar o dia certo de comprar, porque ninguém acerta isso com consistência. Use para entender se o valor de hoje está acima ou abaixo da média recente e para decidir, com calma, se a compra pode esperar.

## Compartilhar e salvar

O botão Compartilhar envia o resultado com o link exato da conversão, útil para combinar com a esposa ou com um amigo quanto vai custar uma viagem ou um presente. Se você tiver conta na Área do Pai, pode salvar a ferramenta para abrir direto do seu painel. As cotações vêm da AwesomeAPI e do Banco Central e são atualizadas a cada trinta minutos; se alguma fonte falhar, mostramos o último valor com a hora em que ele foi obtido, para você nunca ficar sem referência.
```

- **Critério de aceite**: `/ferramentas/conversor-de-moedas` converte **pelo menos 6 moedas** (USD, EUR, GBP, ARS, BTC e mais
  uma) nos dois sentidos com dados de menos de 30 min (`fetched_at` em `market_cache`); PTAX do dólar aparece com a data;
  gráfico de 30 dias renderiza; `?de=EUR&para=BRL&valor=250` abre já convertido; com a AwesomeAPI bloqueada (simular com
  `fetch` falhando) a tela mostra `MarketStale` em vez de quebrar; nenhum `fetch` para domínio externo sai do navegador
  (só server functions).

### 3.2 `mercado-financeiro` — Mercado financeiro hoje ("Mercado do pai", destaque do dono)

- **Arquivo**: `src/components/ferramentas/mercado-financeiro/MarketDashboard.tsx` (nome do doc 02 §3).
- **Dados**: `getMarketSnapshot` (§2.5) + `getFxDaily` para o gráfico; textos "O que isso muda para o pai" em
  `src/lib/tools/mercado-insights.ts` (mapa estático `INSIGHTS[indicador]`, 2–3 frases cada, sem recomendação de compra).
- **Entradas → saídas**: nenhuma entrada obrigatória. Saída: faixa de cards por grupo — **Câmbio** (USD, EUR, GBP, ARS),
  **Cripto** (BTC, ETH), **Bolsa** (Ibovespa + 8 ações; só se `stocks` não for nulo), **Juros e inflação** (Selic, CDI,
  IPCA mês, IPCA 12 m, IGP-M), **Tesouro Direto** (3 títulos: Selic, IPCA+ e Prefixado mais curtos); gráfico de 30 dias
  do dólar (troca para euro/bitcoin por abas); **Semáforo do dia** (3 callouts) calculado por regras fixas; "O que isso
  muda para o pai" retrátil em cada card; `MarketStale` por grupo; rodapé de fontes.
- **Regras do Semáforo do dia** (`src/lib/tools/mercado-semaforo.ts`, função pura testada):
  - `ok`: "Sinal verde: dólar e inflação estáveis…" quando `|USD.pctChange| < 1` **e** `ipca12m < 5`.
  - `warn`: "Sinal de atenção: …" quando `|USD.pctChange| ≥ 1` **ou** `selicMeta ≥ 12` (dívida cara) **ou** `ipca12m` entre 5 e 7.
  - `bad`: "Sinal de alerta: …" quando `|USD.pctChange| ≥ 2,5` **ou** `ipca12m > 7` **ou** `BTC.change24h ≤ −8`; o texto termina com
    "Não tome decisão de investimento com base num dia; se tiver dívida ou dinheiro parado, procure um profissional certificado."
  - Sempre os três callouts, na ordem `ok → warn → bad`; os que não se aplicam ao dia recebem o texto "Hoje este sinal não está aceso." em cinza.
- **Entrada do registry**: já está literal no Passo 1 (§1.1); acrescentar
  `preload: () => import("@/lib/market/fetchers").then((m) => m.getMarketSnapshot())` (mesmo motivo do §3.1).
- **Esqueleto do componente** (recharts + `MarketStale`):

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getFxDaily, getMarketSnapshot } from "@/lib/market/fetchers";
import type { MarketSnapshot } from "@/lib/market/types";
import { formatBRL, formatNumber, formatPct } from "@/lib/tools/format";
import { INSIGHTS } from "@/lib/tools/mercado-insights";
import { semaforoDoDia } from "@/lib/tools/mercado-semaforo";
import { MarketStale } from "@/components/ferramentas/MarketStale";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { SemaforoCallout } from "@/components/blog/SemaforoCallout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const route = getRouteApi("/_site/ferramentas/$slug");
const CHART_PAIRS = [{ pair: "USD-BRL", label: "Dólar" }, { pair: "EUR-BRL", label: "Euro" }, { pair: "BTC-BRL", label: "Bitcoin" }];

function Card({ label, value, pct, insightKey, hint }: { label: string; value: string; pct?: number; insightKey: keyof typeof INSIGHTS; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <ToolResultCard label={label} value={value} hint={hint} tone={pct == null ? "neutral" : pct >= 0 ? "success" : "danger"} />
      {pct != null && <p className={`mt-1 text-sm font-bold ${pct >= 0 ? "text-success" : "text-destructive"}`}>{formatPct(pct)} hoje</p>}
      <details className="mt-3 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-bold text-foreground">O que isso muda para o pai</summary>
        <p className="mt-2 leading-relaxed">{INSIGHTS[insightKey]}</p>
      </details>
    </div>
  );
}

export default function MarketDashboard() {
  const { preloaded } = route.useLoaderData() as { preloaded: MarketSnapshot | null };
  const snap = useQuery({ queryKey: ["market:snapshot"], queryFn: () => getMarketSnapshot(), initialData: preloaded ?? undefined, staleTime: 10 * 60_000, refetchInterval: 15 * 60_000 });
  const [pair, setPair] = useState("USD-BRL");
  const daily = useQuery({ queryKey: ["fx:daily", pair], queryFn: () => getFxDaily({ data: { pair, days: 30 } }), staleTime: 6 * 3_600_000 });
  const d = snap.data;
  if (!d) return <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-busy />;
  const fx = d.fx?.data, ind = d.indicators?.data, cr = d.crypto?.data, st = d.stocks?.data, te = d.tesouro?.data;
  const sem = semaforoDoDia(d);

  return (
    <div className="space-y-8">
      <section aria-labelledby="sem-dia">
        <h2 id="sem-dia" className="font-display text-xl font-bold">Semáforo do dia</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <SemaforoCallout tone="ok">{sem.ok}</SemaforoCallout>
          <SemaforoCallout tone="warn">{sem.warn}</SemaforoCallout>
          <SemaforoCallout tone="bad">{sem.bad}</SemaforoCallout>
        </div>
      </section>

      {fx && (
        <section aria-labelledby="cambio">
          <div className="flex items-center justify-between"><h2 id="cambio" className="font-display text-xl font-bold">Câmbio</h2>{d.fx && <MarketStale fetchedAt={d.fx.fetchedAt} stale={d.fx.stale} sources={["AwesomeAPI"]} />}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["USD", "EUR", "GBP", "ARS"].map((c) => fx[c] && <Card key={c} label={fx[c].name} value={formatBRL(fx[c].bid, c === "ARS" ? 4 : 2)} pct={fx[c].pctChange} insightKey={c === "USD" ? "dolar" : "cambio"} hint={d.ptaxUsd?.data && c === "USD" ? `PTAX ${formatNumber(d.ptaxUsd.data.venda, 4)}` : undefined} />)}
          </div>
        </section>
      )}

      <figure className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <figcaption className="font-bold">Últimos 30 dias</figcaption>
          <Tabs value={pair} onValueChange={setPair}><TabsList>{CHART_PAIRS.map((p) => <TabsTrigger key={p.pair} value={p.pair}>{p.label}</TabsTrigger>)}</TabsList></Tabs>
        </div>
        {daily.data?.data?.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={daily.data.data}>
              <XAxis dataKey="date" tickFormatter={(x: string) => x.slice(8, 10) + "/" + x.slice(5, 7)} minTickGap={24} />
              <YAxis domain={["auto", "auto"]} width={64} tickFormatter={(v: number) => formatNumber(v, pair === "BTC-BRL" ? 0 : 2)} />
              <Tooltip formatter={(v: number) => formatBRL(v, pair === "BTC-BRL" ? 0 : 4)} />
              <Line type="monotone" dataKey="bid" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="mt-4 text-sm text-muted-foreground">Histórico indisponível no momento.</p>}
      </figure>

      {cr && (
        <section aria-labelledby="cripto">
          <div className="flex items-center justify-between"><h2 id="cripto" className="font-display text-xl font-bold">Cripto</h2>{d.crypto && <MarketStale fetchedAt={d.crypto.fetchedAt} stale={d.crypto.stale} sources={["CoinGecko", "AwesomeAPI"]} />}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{cr.map((c) => <Card key={c.id} label={c.name} value={formatBRL(c.brl, 0)} pct={c.change24h} insightKey="bitcoin" />)}</div>
        </section>
      )}

      {st && (
        <section aria-labelledby="bolsa">
          <div className="flex items-center justify-between"><h2 id="bolsa" className="font-display text-xl font-bold">Bolsa (B3)</h2>{d.stocks && <MarketStale fetchedAt={d.stocks.fetchedAt} stale={d.stocks.stale} sources={["Brapi"]} />}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">{st.map((s) => <Card key={s.symbol} label={s.name} value={s.symbol === "^BVSP" ? formatNumber(s.price, 0) + " pts" : formatBRL(s.price)} pct={s.changePct} insightKey={s.symbol === "^BVSP" ? "ibovespa" : "acoes"} />)}</div>
        </section>
      )}

      {ind && (
        <section aria-labelledby="juros">
          <div className="flex items-center justify-between"><h2 id="juros" className="font-display text-xl font-bold">Juros e inflação</h2>{d.indicators && <MarketStale fetchedAt={d.indicators.fetchedAt} stale={d.indicators.stale} sources={["Banco Central do Brasil (SGS)"]} />}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {ind.selicMeta && <Card label="Selic (meta)" value={formatNumber(ind.selicMeta.value) + "% a.a."} insightKey="selic" hint={ind.selicMeta.date} />}
            {ind.cdiAnual && <Card label="CDI" value={formatNumber(ind.cdiAnual.value) + "% a.a."} insightKey="cdi" />}
            {ind.ipcaMensal && <Card label="IPCA do mês" value={formatNumber(ind.ipcaMensal.value) + "%"} insightKey="ipca" hint={ind.ipcaMensal.date.slice(0, 7)} />}
            {ind.ipca12m && <Card label="IPCA 12 meses" value={formatNumber(ind.ipca12m.value) + "%"} insightKey="ipca12" />}
          </div>
        </section>
      )}

      {te && te.length > 0 && (
        <section aria-labelledby="tesouro">
          <div className="flex items-center justify-between"><h2 id="tesouro" className="font-display text-xl font-bold">Tesouro Direto</h2>{d.tesouro && <MarketStale fetchedAt={d.tesouro.fetchedAt} stale={d.tesouro.stale} sources={["Tesouro Direto"]} />}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(["selic", "ipca", "prefixado"] as const).map((tipo) => { const t = te.filter((x) => x.tipo === tipo).sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0]; return t ? <Card key={tipo} label={t.nome} value={t.taxaCompra != null ? formatNumber(t.taxaCompra) + "% a.a." : "—"} insightKey="tesouro" hint={`vence em ${t.vencimento.slice(0, 4)}`} /> : null; })}
          </div>
        </section>
      )}

      <p className="text-xs text-muted-foreground">Fontes: AwesomeAPI, Banco Central do Brasil (PTAX e SGS), CoinGecko, Brapi, Tesouro Direto. Informação educativa; não é recomendação de investimento. Gerado em {new Date(d.generatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.</p>
    </div>
  );
}
```

- **Como usar** (`COMO_USAR["mercado-financeiro"]`):

```text
O Mercado do pai é um painel de um minuto. Ele não existe para você virar investidor profissional; existe para que o homem que sustenta uma casa entenda, todo dia, o que está acontecendo com o dinheiro dele. Cada card mostra o número do momento, a variação do dia e a hora em que o dado foi obtido. Abaixo de cada número há a frase que importa: o que aquilo muda no seu orçamento, nas suas dívidas e na sua reserva.

## Leia o Semáforo do dia primeiro

Os três sinais resumem o cenário. Sinal verde quer dizer que câmbio e inflação estão dentro da normalidade e nada pede ação. Sinal de atenção aparece quando o dólar se mexe mais de um por cento, quando a Selic está alta a ponto de encarecer qualquer dívida ou quando a inflação de doze meses passa do centro da meta. Sinal de alerta é para dia de solavanco forte: não é hora de decidir nada por impulso. Em qualquer dos três casos, decisão grande de dinheiro se toma com calma, em casa, junto com a esposa, e, quando envolve dívida ou investimento relevante, com um profissional certificado.

## O que cada grupo significa na prática

Câmbio: o dólar mexe no preço do combustível, do trigo, da eletrônica e das viagens. Quando sobe, o supermercado sente em algumas semanas. Juros: a Selic é a taxa que puxa todas as outras. Selic alta deixa cartão, cheque especial e financiamento mais caros, mas faz Tesouro Selic, CDB e poupança renderem mais; é o momento de quitar dívida cara e deixar a reserva render. Inflação: o IPCA diz quanto o dinheiro perdeu de valor; se o seu salário não subiu pelo menos o IPCA de doze meses, você ficou mais pobre, mesmo ganhando o mesmo. Bolsa e cripto: são os números que mais oscilam e os que menos devem guiar uma família; acompanhe para entender o humor do mercado, não para apostar.

## Como usar o gráfico

As abas mostram o dólar, o euro e o bitcoin nos últimos trinta dias. Olhe a tendência, não o dia. Uma moeda que subiu dez por cento no mês pede cautela com compra parcelada em dólar; uma que caiu pode ser hora de fechar a viagem que já estava planejada.

## Atualização e fontes

Câmbio e cripto atualizam a cada meia hora; bolsa só em dia de pregão; Selic, CDI e IPCA quando o Banco Central e o IBGE publicam. Se uma fonte falhar, o card mostra o último dado com a hora dele e um aviso de atenção. Nada aqui é recomendação de compra ou venda; é informação para o pai decidir com a cabeça fria.
```

- **Critério de aceite**: `/ferramentas/mercado-financeiro` mostra **pelo menos 4 indicadores** (dólar, bitcoin, Selic,
  IPCA) e o gráfico de 30 dias; Semáforo do dia com 3 callouts na ordem certa; sem `BRAPI_TOKEN` o grupo "Bolsa" some
  sem erro; com fonte indisponível o grupo mostra `MarketStale` ("usando dados de …"); nenhum texto recomenda comprar ou
  vender; o HTML do SSR já traz os números (view-source mostra "Selic").

#### 3.2.6 Bloco "Mercado do pai hoje" na home (`PLANO-MESTRE` F4 e checklist 4.9)

- **Arquivo**: `src/components/home/MarketTicker.tsx` (contrato do doc 02 §6.3: `{ items: {label, value, changePct}[] }`),
  renderizado em `src/pages/Home.tsx` logo abaixo do `ToolsTeaser`, com título "Mercado do pai hoje" e link
  "Ver o painel completo →" para `/ferramentas/mercado-financeiro`.
- **Dados**: server function `getMarketTickerItems` em `src/lib/market/fetchers.ts` que **só lê o cache** (`readCache` de
  `fx:last`, `crypto:simple`, `sgs:indicators`; nunca chama fonte externa, para a home não esperar rede) e devolve até 4
  itens: Dólar, Euro, Bitcoin, Selic (Ibovespa no lugar do euro quando `b3:quotes` existir). Chamada no loader da home
  (`src/routes/_site/index.tsx`) com `.catch(() => [])`; se vier vazio, o bloco não renderiza.
- **Aceite** (checklist 4.9): home mostra 3 ou 4 indicadores com variação colorida e o link; com `market_cache` vazia a
  home renderiza normalmente sem o bloco.

### 3.3 `custo-do-filho` — Quanto custa um filho

- **Arquivo**: `src/components/ferramentas/custo-do-filho/ChildCostCalculator.tsx`.
- **Dados**: `src/lib/tools/custo-filho-data.ts` — faixas mensais **de referência** (nunca valor exato) por fase e categoria,
  em três perfis de gasto. Tipos:

```ts
export type Fase = "0-1" | "1-3" | "4-6" | "7-11" | "12-17";
export type Perfil = "enxuto" | "medio" | "amplo";
export type Categoria = "alimentacao" | "fraldas-higiene" | "roupas-calcados" | "saude" | "educacao" | "lazer-esporte" | "transporte" | "outros";
export interface FaixaCusto { fase: Fase; categoria: Categoria; faixa: Record<Perfil, [number, number]> } // R$/mês
export const FAIXAS: FaixaCusto[] = [
  // Ponto de partida (valores de 2026, arredondados a R$ 10; revisar todo janeiro e registrar a data em ATUALIZADO_EM):
  { fase: "0-1", categoria: "fraldas-higiene", faixa: { enxuto: [150, 250], medio: [250, 400], amplo: [400, 600] } },
  { fase: "0-1", categoria: "alimentacao",     faixa: { enxuto: [0, 150],   medio: [150, 500], amplo: [500, 900] } }, // 0 = amamentação exclusiva
  { fase: "0-1", categoria: "saude",           faixa: { enxuto: [0, 100],   medio: [200, 450], amplo: [450, 900] } }, // 0 = só SUS
  { fase: "0-1", categoria: "educacao",        faixa: { enxuto: [0, 0],     medio: [0, 900],   amplo: [900, 2500] } }, // creche
  // … preencher as 5 fases × 8 categorias (40 linhas). Fonte: pesquisa de preço no varejo online (2 lojas por item,
  // CLAUDE.md §5.2) e tabelas públicas de mensalidade de creche/escola por região; anotar as URLs em FONTES[].
];
export const ATUALIZADO_EM = "2026-01-15";
export const FONTES: Array<{ item: string; url: string }> = [];
export const ECONOMIA_SEGUNDO_FILHO = 0.15; // roupas, brinquedos e material reaproveitados
```

- **Entradas → saídas**: fase atual do filho (ou "ainda vai nascer"), perfil de gasto (enxuto / médio / amplo), escola
  pública ou particular, plano de saúde sim/não, quantos filhos, renda líquida da casa (opcional). Saída: faixa mensal
  total ("entre R$ X e R$ Y por mês"), composição por categoria (barras), faixa acumulada até os 18 anos em valores de
  hoje, "o que mais pesa nesta fase" e o `SemaforoCallout`: `ok` se a faixa máxima ≤ 25 % da renda, `warn` entre 25 e 40 %,
  `bad` acima de 40 % ("Sinal de alerta: … procure um planejador financeiro ou a renegociação das dívidas antes de o bebê
  chegar"). Sem renda informada, o semáforo mostra só a regra.
- **Entrada do registry**:

```ts
{
  slug: "custo-do-filho",
  title: "Quanto custa um filho",
  seoTitle: "Quanto custa um filho por mês e até os 18 anos",
  description:
    "Calcule a faixa de gasto mensal com um filho por fase e perfil de gasto, veja o que mais pesa e o total estimado até os 18 anos, em valores de hoje.",
  short: "Faixa de gasto mensal por fase do filho e total até os 18 anos.",
  icon: Baby,
  category: "dinheiro",
  alsoIn: ["familia"],
  appCategory: "FinanceApplication",
  featured: true,
  howTo: [
    { name: "Escolha a fase e o perfil", text: "Diga a idade do filho (ou se ainda vai nascer) e o padrão de gasto da casa." },
    { name: "Ajuste escola e saúde", text: "Marque escola pública ou particular e se há plano de saúde: são os dois itens que mais mudam a conta." },
    { name: "Informe a renda (opcional)", text: "Com a renda líquida da casa, o Semáforo do pai diz se a faixa cabe no orçamento." },
    { name: "Leia o total até os 18", text: "Veja a faixa acumulada e use o Orçamento familiar para encaixar o número." },
  ],
  faq: [
    { question: "Por que o resultado é uma faixa e não um valor?", answer: "Porque preço de fralda, escola e plano muda por cidade, marca e época. A faixa mostra o cenário realista entre o mínimo e o máximo do perfil escolhido; o valor exato é o do seu orçamento." },
    { question: "A conta inclui faculdade?", answer: "Não. A faixa vai até os 17 anos. Faculdade particular é uma decisão à parte; use o simulador de juros compostos para planejar a poupança desde cedo." },
    { question: "Dois filhos custam o dobro?", answer: "Não. Roupas, brinquedos, berço e material são reaproveitados; a calculadora aplica um desconto de 15% nessas categorias a partir do segundo filho." },
    { question: "De onde vêm os números?", answer: "De pesquisa de preço em lojas online e tabelas públicas de mensalidade, revisadas todo janeiro. A data da última revisão aparece na tela." },
  ],
  relatedCategories: ["dinheiro-do-pai", "paternidade-por-fase"],
  relatedTerms: ["custo de um filho", "orçamento", "fralda", "escola particular", "plano de saúde"],
  disclaimer: "Estimativa educativa com faixas de referência; não substitui o seu orçamento real nem a orientação de um planejador financeiro.",
  component: L(() => import("@/components/ferramentas/custo-do-filho/ChildCostCalculator")),
},
```

- **Como usar** (`COMO_USAR["custo-do-filho"]`):

```text
Pergunta que todo homem faz antes do primeiro filho e que poucos respondem com número: quanto custa, por mês, criar uma criança? Esta calculadora não dá um valor único, porque ele não existe. Dá uma faixa honesta, montada por fase da vida do filho e pelo padrão de gasto da sua casa, para você sair do achismo e entrar no planejamento.

## Como preencher

Comece pela fase: recém-nascido, primeira infância, pré-escola, ensino fundamental ou adolescência. Depois escolha o perfil de gasto. Enxuto é a casa que usa o SUS, escola pública, fralda de marca simples e roupa herdada. Médio é a casa com plano de saúde básico, escola particular de bairro e algum lazer pago. Amplo é a casa com escola de maior mensalidade, plano completo, cursos e viagens. Os dois ajustes que mais mexem na conta são escola e saúde; por isso eles ficam em botões separados. Se quiser, informe a renda líquida da família: com ela o Semáforo do pai diz se a faixa cabe no orçamento ou se é hora de rever despesas antes de o bebê chegar.

## Como ler o resultado

O cartão principal mostra a faixa mensal, de mínimo a máximo. Abaixo, as barras mostram em que categoria o dinheiro vai: no primeiro ano, fralda e fórmula; dos quatro aos onze, escola e material; na adolescência, alimentação, transporte e tecnologia. O total até os dezoito anos é calculado em valores de hoje, sem inflação, para você comparar com salário e patrimônio de hoje. Um segundo filho custa menos que o dobro: berço, roupa e brinquedo são reaproveitados, e a calculadora aplica esse desconto sozinha.

## O que fazer com o número

Se a faixa máxima consome até um quarto da renda, você está bem. Entre um quarto e quarenta por cento, é sinal de atenção: cabe, mas não sobra para reserva, e um imprevisto vira dívida. Acima disso, a conta não fecha e o caminho é cortar despesa, aumentar renda ou mudar de perfil, de preferência antes do nascimento. Leve a faixa para o Orçamento familiar e abra uma linha para o filho desde já. Pai que provê não é o que ganha mais; é o que sabe quanto precisa e se organiza para chegar lá.

Os valores vêm de pesquisa de preço em lojas online e tabelas públicas de mensalidade, revisadas no começo de cada ano. A data da última revisão aparece ao lado do resultado. Isso é estimativa educativa, não substitui o seu orçamento real.
```

- **Critério de aceite**: mudar perfil, escola e plano altera a faixa; com renda informada o semáforo acende o tom certo
  nos três cenários; 2 filhos < 2× o custo; nenhum valor exato é exibido (só "entre R$ X e R$ Y"); `ATUALIZADO_EM` aparece
  na tela; `tests/tools/custo-filho.test.ts` cobre a soma, o desconto do 2º filho e as 3 regras do semáforo.

### 3.4 `licenca-paternidade` — Licença-paternidade: quantos dias e quando voltar

- **Arquivo**: `src/components/ferramentas/licenca-paternidade/PaternityLeave.tsx`.
- **Dados**: `src/lib/tools/licenca-regras.json`:

```json
{
  "atualizado_em": "2026-10-24",
  "regimes": [
    { "id": "clt", "nome": "CLT (empresa comum)", "dias": 5, "contagem": "corridos", "base": "ADCT art. 10, §1º; CLT art. 473, III",
      "inicio": "primeiro dia útil após o nascimento", "aviso": "Comunique o RH com a certidão de nascimento." },
    { "id": "clt-empresa-cidada", "nome": "CLT (empresa no Programa Empresa Cidadã)", "dias": 20, "contagem": "corridos",
      "base": "Lei 11.770/2008, art. 1º, II (alterada pela Lei 13.257/2016)", "inicio": "primeiro dia útil após o nascimento",
      "aviso": "Peça a prorrogação por escrito em até 2 dias úteis após o parto; a empresa precisa ter aderido ao programa." },
    { "id": "servidor-federal", "nome": "Servidor público federal", "dias": 20, "contagem": "corridos",
      "base": "Lei 8.112/1990, art. 208 + Decreto 8.737/2016", "inicio": "data do nascimento", "aviso": "Requerimento no sistema de pessoal; prorrogação de 15 dias a pedido." },
    { "id": "servidor-estadual-municipal", "nome": "Servidor estadual ou municipal", "dias": null, "contagem": "corridos",
      "base": "Estatuto do ente (varia de 5 a 30 dias)", "inicio": "conforme o estatuto", "aviso": "Consulte o estatuto do seu ente; informe os dias manualmente." },
    { "id": "autonomo", "nome": "Autônomo, MEI ou PJ", "dias": 0, "contagem": "corridos", "base": "Sem licença remunerada prevista",
      "inicio": "—", "aviso": "Planeje a pausa com a reserva de emergência; veja a ferramenta Reserva de emergência." }
  ],
  "marcos_legais": [
    { "vigencia": "2027-01-01", "dias_clt": 10, "base": "Lei 15.371/2026 (doc 12, notícia N5) — conferir o texto no Planalto antes de publicar" },
    { "vigencia": "2028-01-01", "dias_clt": 15, "base": "Lei 15.371/2026 — conferir" },
    { "vigencia": "2029-01-01", "dias_clt": 20, "base": "Lei 15.371/2026 — conferir" }
  ],
  "feriados_nacionais": ["01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "11-20", "12-25"]
}
```

  Regra de execução: antes de publicar, **conferir no site do Planalto** a Lei 15.371/2026 citada no doc 12 (N5) e os
  prazos; se o texto real divergir, a lei prevalece e o JSON é corrigido (registrar em `PROGRESSO.md`). O JSON é a única
  fonte da ferramenta: nada de regra em código.
- **Entradas → saídas**: regime, data do nascimento (ou prevista), adoção (sim/não — mesmas regras), UF (só informativa),
  "minha empresa aderiu ao Empresa Cidadã?" (quando CLT). Saída: dias de licença, data do primeiro dia e do retorno
  (`date-fns`: `addDays`; início no 1º dia útil após o nascimento para CLT, pulando fim de semana e `feriados_nacionais`),
  o que levar ao RH, prazo para pedir a prorrogação, aviso do marco legal que valerá na data informada (ex.: nascimento em
  2027 → 10 dias), checklist "os 5 dias do pai" (registro civil, plano de saúde, vacinas, descanso da esposa, primeira
  consulta) e `SemaforoCallout`: `ok` regime claro; `warn` empresa não aderiu ao programa ("peça ao RH a adesão; é
  dedução fiscal para a empresa"); `bad` empresa negou os dias legais ("Sinal de alerta: … procure o sindicato, a
  Superintendência Regional do Trabalho ou um advogado trabalhista").
- **Entrada do registry**:

```ts
{
  slug: "licenca-paternidade",
  title: "Licença-paternidade: quantos dias e quando voltar",
  seoTitle: "Licença-paternidade: quantos dias você tem e quando volta",
  description:
    "Descubra quantos dias de licença-paternidade você tem (CLT, Empresa Cidadã, servidor), a data de retorno ao trabalho e o que levar ao RH.",
  short: "Dias de licença, data de retorno e o que pedir ao RH.",
  icon: CalendarCheck,
  category: "familia",
  appCategory: "UtilitiesApplication",
  howTo: [
    { name: "Escolha o seu regime", text: "CLT comum, Empresa Cidadã, servidor público ou autônomo. Cada um tem uma regra." },
    { name: "Informe a data do nascimento", text: "Pode ser a data prevista. A contagem começa no primeiro dia útil seguinte." },
    { name: "Veja os dias e a data de retorno", text: "A ferramenta pula fins de semana e feriados nacionais na data de início." },
    { name: "Leve a lista ao RH", text: "Certidão de nascimento e, se for Empresa Cidadã, o pedido de prorrogação em até 2 dias úteis." },
  ],
  faq: [
    { question: "Os 5 dias são úteis ou corridos?", answer: "Corridos, contados a partir do primeiro dia útil após o nascimento. Se o filho nasce na sexta, a licença começa na segunda e vai até sexta." },
    { question: "Minha empresa é obrigada a dar 20 dias?", answer: "Só se ela aderiu ao Programa Empresa Cidadã e você pedir a prorrogação em até 2 dias úteis após o parto. Fora do programa, valem os dias da lei geral." },
    { question: "Pai adotivo tem licença?", answer: "Sim, nas mesmas condições do pai biológico, contada da data da adoção ou da guarda para fins de adoção." },
    { question: "Posso ser demitido na volta?", answer: "A lei geral não dá estabilidade ao pai. Converse com o sindicato da categoria: algumas convenções coletivas preveem garantia de emprego. Em caso de dúvida, procure um advogado trabalhista." },
  ],
  relatedCategories: ["direitos-do-pai", "paternidade-por-fase"],
  relatedTerms: ["licença-paternidade", "empresa cidadã", "registro do filho", "primeiros dias"],
  disclaimer: "Informação educativa sobre a legislação vigente na data indicada; não é parecer jurídico. Convenções coletivas e estatutos locais podem dar mais dias. Em conflito com a empresa, procure o sindicato ou um advogado.",
  component: L(() => import("@/components/ferramentas/licenca-paternidade/PaternityLeave")),
},
```

- **Como usar** (`COMO_USAR["licenca-paternidade"]`):

```text
Poucos dias depois do nascimento, o pai precisa estar em casa: para cuidar da esposa, registrar o filho, resolver plano de saúde e, principalmente, estar presente. Esta ferramenta responde às três perguntas práticas desse momento: quantos dias de licença você tem, em que dia volta ao trabalho e o que precisa entregar ao RH para não perder nenhum direito.

## Escolha o regime certo

A regra muda conforme o vínculo. Na CLT comum valem os dias da lei geral, contados de forma corrida a partir do primeiro dia útil depois do nascimento. Se a sua empresa aderiu ao Programa Empresa Cidadã, você pode somar quinze dias, mas precisa pedir por escrito em até dois dias úteis após o parto, e a empresa só concede se já estiver no programa. Servidor público federal tem prazo próprio com prorrogação a pedido; servidores estaduais e municipais seguem o estatuto do ente, que varia bastante, por isso a ferramenta pede que você informe os dias do seu caso. Autônomo, MEI e PJ não têm licença remunerada: a pausa sai da reserva de emergência, e vale planejar com meses de antecedência.

## O que a data de retorno considera

Informe a data real ou prevista do nascimento. A contagem começa no primeiro dia útil seguinte, pulando fins de semana e feriados nacionais; se o seu município tiver feriado próprio, some um dia por conta. A tela mostra o primeiro e o último dia de licença e a data de volta. Pai adotivo usa as mesmas regras, contadas da data da guarda ou da adoção.

## Marcos legais que mudam a conta

A legislação da licença-paternidade está em transição, com prazos maiores entrando em vigor em datas definidas. A ferramenta mostra o marco que vale na data do nascimento informada, para você saber exatamente quantos dias terá. Sempre confirme com o RH, porque convenção coletiva pode dar mais dias do que a lei.

## Use bem os dias que tem

Registre o filho no cartório ainda na primeira semana, inclua o bebê no plano de saúde dentro do prazo de carência zero, confira as vacinas de nascimento e deixe a esposa descansar: esses dias existem para isso. Se a empresa negar os dias previstos em lei, não discuta sozinho: procure o sindicato, a Superintendência Regional do Trabalho ou um advogado trabalhista. Esta página é informação educativa, não parecer jurídico.
```

- **Critério de aceite**: nascimento numa sexta-feira em regime CLT → início na segunda seguinte; Empresa Cidadã → 20
  dias e aviso do prazo de 2 dias úteis; nascimento em 2027 mostra o marco legal com a nota "conferir"; regime
  estadual exige dias manuais; `tests/tools/licenca.test.ts` cobre a contagem com fim de semana e feriado.

### 3.5 `calculadora-de-churrasco` — Calculadora de churrasco com lista de compras

- **Arquivo**: `src/components/ferramentas/calculadora-de-churrasco/BarbecueCalculator.tsx`.
- **Dados**: `src/lib/tools/churrasco-regras.ts` (funções puras + constantes):

```ts
export const GRAMAS = { homem: 450, mulher: 350, crianca: 200 } as const;            // carne crua por pessoa, 4 h
export const FATOR_DURACAO = { "2h": 0.8, "4h": 1, "6h+": 1.25 } as const;
export const PRESETS = {
  classico:  [["picanha", 0.30], ["contrafile", 0.20], ["fraldinha", 0.20], ["linguica", 0.15], ["frango", 0.15]],
  economico: [["alcatra", 0.25], ["fraldinha", 0.25], ["linguica", 0.25], ["frango", 0.25]],
  premium:   [["picanha", 0.40], ["ancho", 0.25], ["costela", 0.20], ["linguica", 0.15]],
} as const;                                                                         // slugs de cortes.json
export const POR_PESSOA = { paoDeAlho: 1.5, farofaG: 60, vinagreteG: 50, arrozCruG: 80, refrigeranteMl: 500, aguaMl: 400 };
export const POR_ADULTO_QUE_BEBE = { cervejaMl: 1000, geloKg: 1 };
export const CARVAO_KG_POR_KG_CARNE = 1 / 1.5;  // mínimo 3 kg; +50 % se 6h+
export const SAL_GROSSO_G_POR_KG = 30;
export interface Entrada { homens: number; mulheres: number; criancas: number; adultosQueBebem: number; duracao: keyof typeof FATOR_DURACAO; preset: keyof typeof PRESETS }
export interface Lista { carneKg: number; porCorte: Array<{ corte: string; kg: number }>; carvaoKg: number; salG: number; paoDeAlho: number; farofaKg: number; vinagreteKg: number; arrozKg: number; cervejaL: number; refrigeranteL: number; aguaL: number; geloKg: number }
export function calcularChurrasco(e: Entrada): Lista { /* multiplica, arredonda para cima em múltiplos úteis (carne 0,1 kg; carvão saco de 3/5 kg; cerveja caixa de 12) */ }
```

- **Entradas → saídas**: homens, mulheres, crianças (3–12 anos; menores não contam), adultos que bebem cerveja,
  duração, preset de cortes (ou pesos manuais que somam 100 %), extras (pão de alho, queijo coalho, abacaxi). Saída:
  tabela por item com quantidade arredondada para embalagem, carne por corte, **lista de compras imprimível**
  (`window.print()` com `@media print` escondendo o resto da página) e compartilhável, botões para a Loja do Pai
  (`/loja/categoria/churrasco-e-cozinha` e os produtos da Fase 3 que existirem: faca Tramontina Polywood 8", kit
  Tramontina 3 peças, tábua com canaleta, termômetro ThermoPro TP-01S — doc 05 §10.1; linkar `/loja/<slug>` só após
  `select slug from products where active`). `SemaforoCallout` de segurança alimentar: `ok` carne bovina inteira ao
  ponto; `warn` frango e linguiça só bem passados (74 °C no termômetro); `bad` "Sinal de alerta: churrasqueira a carvão em
  ambiente fechado gera monóxido de carbono; em caso de tontura, dor de cabeça ou vômito, saia para o ar livre e ligue 192".
- **Entrada do registry**:

```ts
{
  slug: "calculadora-de-churrasco",
  title: "Calculadora de churrasco",
  seoTitle: "Calculadora de churrasco: carne, carvão e bebida por pessoa",
  description:
    "Quantos quilos de carne, carvão, pão de alho e bebida comprar para o churrasco: informe convidados e duração e receba a lista de compras pronta.",
  short: "Carne, carvão e bebida certos para o número de convidados, com lista de compras.",
  icon: Flame,
  category: "churrasco-cozinha",
  appCategory: "LifestyleApplication",
  featured: true,
  howTo: [
    { name: "Conte os convidados", text: "Homens, mulheres e crianças de 3 a 12 anos. Diga quantos adultos bebem cerveja." },
    { name: "Escolha duração e cortes", text: "Churrasco de 2, 4 ou 6 horas e o preset de cortes (clássico, econômico ou premium) — ou monte o seu." },
    { name: "Confira a lista", text: "As quantidades já vêm arredondadas para embalagem: quilo, saco de carvão, caixa de cerveja." },
    { name: "Imprima ou compartilhe", text: "Leve a lista ao açougue ou mande no grupo da família. Os utensílios estão na Loja do Pai." },
  ],
  faq: [
    { question: "Quantos gramas de carne por pessoa?", answer: "Cerca de 400 a 450 g de carne crua por homem, 350 g por mulher e 200 g por criança, para um churrasco de 4 horas. Em churrasco longo, a calculadora aumenta 25%." },
    { question: "Quanto carvão preciso?", answer: "Aproximadamente 1 kg de carvão para cada 1,5 kg de carne, com mínimo de 3 kg. Em churrasco de 6 horas ou mais, reserve metade a mais para reacender." },
    { question: "A lista considera acompanhamentos?", answer: "Sim: pão de alho, farofa, vinagrete e arroz por pessoa, além de refrigerante, água, cerveja (só para quem bebe) e gelo." },
    { question: "Como evitar que sobre ou falte?", answer: "Use o preset que combina com os convidados e não some 'margem' por conta: a conta já tem folga de 10%. Se sobrar, congele a carne crua que não foi para a grelha." },
  ],
  relatedCategories: ["churrasco-e-cozinha"],
  relatedTerms: ["churrasco", "picanha", "carvão", "quantidade de carne por pessoa"],
  disclaimer: "Quantidades de referência para o pai organizar a compra; ajuste ao apetite da sua turma. Frango, linguiça e carne moída sempre bem passados.",
  component: L(() => import("@/components/ferramentas/calculadora-de-churrasco/BarbecueCalculator")),
},
```

- **Como usar** (`COMO_USAR["calculadora-de-churrasco"]`):

```text
Churrasco bom é o que não falta carne e não sobra carvão apagado. A conta parece simples, mas quem já recebeu quinze pessoas em casa sabe que errar para menos é vexame e errar para mais é dinheiro no lixo. Esta calculadora faz a conta do açougue, do carvão, dos acompanhamentos e da bebida a partir de quatro informações e devolve uma lista de compras pronta para imprimir ou mandar no grupo da família.

## Preencha com honestidade

Conte homens, mulheres e crianças entre três e doze anos; menores de três não entram na conta. Diga quantos adultos bebem cerveja, porque é o item que mais pesa no carrinho e no bolso. Escolha a duração: churrasco de duas horas depois da missa é diferente do que começa ao meio-dia e termina no jogo da noite. Por fim, escolha o preset de cortes. O clássico equilibra picanha, contrafilé, fraldinha, linguiça e frango. O econômico troca a picanha por alcatra e aumenta frango e linguiça sem perder sabor. O premium é para data especial, com picanha, ancho e costela. Se quiser montar o seu, ajuste os percentuais até fechar cem por cento.

## Como a conta é feita

A base é a carne crua por pessoa: cerca de quatrocentos e cinquenta gramas por homem, trezentos e cinquenta por mulher e duzentos por criança, para quatro horas de fogo. A calculadora aplica o fator da duração, distribui pelos cortes e arredonda para cima em medidas que o açougue entende. O carvão sai na proporção de um quilo para cada quilo e meio de carne, com mínimo de três quilos e meia dose extra em churrasco longo. Pão de alho, farofa, vinagrete, arroz, refrigerante, água e gelo são calculados por pessoa; cerveja só por adulto que bebe. Tudo já vem com dez por cento de folga.

## No dia

Leve a lista impressa ao açougue e peça os cortes já limpos. Acenda o carvão com uma hora de antecedência. Frango, linguiça e qualquer carne moída vão à mesa bem passados: setenta e quatro graus no termômetro de espeto, o investimento mais barato que melhora um churrasco. Carne bovina inteira pode ir ao ponto. Nunca use churrasqueira a carvão em área fechada: o monóxido de carbono não tem cheiro e derruba adulto forte. Os utensílios que fazem diferença, faca afiada, tábua com canaleta e termômetro, estão na Loja do Pai, com faixa de preço pesquisada.
```

- **Critério de aceite**: 10 homens, 6 mulheres, 4 crianças, 4 h, clássico → carne entre 7,5 e 8,5 kg, carvão ≥ 5 kg,
  cerveja só para os que bebem; alterar duração altera carne e carvão; impressão esconde cabeçalho/rodapé e mostra só a
  lista; links para a Loja do Pai abrem páginas existentes; `tests/tools/churrasco.test.ts` cobre os 3 presets e os
  arredondamentos.

### 3.6 `cortes-de-carne` — Guia interativo de cortes de carne (SVG do boi)

- **Arquivos**: `src/components/ferramentas/cortes-de-carne/BeefCutsGuide.tsx` (abas: **1. Diagrama**, **2. Carne × preparo**,
  **3. Tabela completa**) e `src/components/ferramentas/cortes-de-carne/BeefDiagram.tsx` (SVG inline clicável).
- **Dados**: `src/lib/tools/cortes.json` — esquema (uma entrada por corte, 16 cortes):

```json
{
  "atualizado_em": "2026-10-24",
  "preparos": ["grelha", "espeto", "chapa", "panela", "forno", "moida"],
  "cortes": [
    {
      "slug": "picanha",
      "nome_br": "Picanha",
      "nome_eua": "Top sirloin cap / Rump cap",
      "regiao": "traseiro",
      "textura": "Macia, com capa de gordura que derrete no fogo",
      "preparo": ["grelha", "espeto", "chapa"],
      "ponto": "Ao ponto para mal passado (55–58 °C), capa de gordura para cima primeiro",
      "faixa_preco": { "min": null, "max": null, "unidade": "kg", "pesquisado_em": null, "fontes": [] },
      "erro_comum_semaforo": { "sinal": "atencao", "texto": "Sinal de atenção: tirar a capa de gordura antes de assar seca a carne; corte só na hora de servir." },
      "dica_do_pai": "Peça peça de até 1,2 kg: acima disso costuma vir com coxão duro junto.",
      "svg_id": "picanha",
      "artigos": ["guia-dos-cortes-de-carne-para-churrasco"]
    }
  ]
}
```

  - `faixa_preco`: **nunca inventar**. Preencher por pesquisa em 2 lojas online no dia (ex.: supermercado online + site
    de frigorífico), gravar `pesquisado_em` e `fontes: [{loja, url}]`; regra `max ≤ 3 × min`. Enquanto for `null`, a tela
    mostra "faixa ainda não pesquisada". Na tela: "Faixa de referência por kg pesquisada em <data>: R$ X a R$ Y".
  - `erro_comum_semaforo.sinal` ∈ `atencao | alerta` (renderizado com `SemaforoCallout` `warn`/`bad`); o texto já começa
    com o prefixo. Cortes com risco sanitário (moída, miúdos) usam `alerta` e terminam com "procure um médico se houver
    sintomas de intoxicação".
  - `artigos`: slugs de `/post/` que **existem** (doc 12: #70 `guia-dos-cortes-de-carne-para-churrasco`, #73
    `fraldinha-ou-maminha-diferenca`, #74 `costela-no-bafo-quanto-tempo`…); a tela só linka os publicados (checar com
    `select slug from posts where status='published'` ou filtrar no loader).
  - Os 16 cortes: picanha, contrafile (bife ancho/chorizo como nomes alternativos), alcatra, maminha, fraldinha, costela,
    cupim, acem, peito, musculo, paleta, coxao-mole, coxao-duro, lagarto, patinho, file-mignon.
- **`BeefDiagram.tsx`**: `<svg viewBox="0 0 1000 560" role="group" aria-label="Diagrama do boi com os cortes">`; um
  `<path>` por corte com `id={svg_id}`, `role="button"`, `tabIndex={0}`, `aria-label={nome_br}`, `aria-pressed`,
  `onClick`/`onKeyDown` (Enter/Espaço) → `onSelect(slug)`; preenchimento `fill="var(--muted)"`, hover `var(--accent)`,
  selecionado `var(--primary)`, contorno `var(--foreground)` 1,5 px; `<title>` com o nome para tooltip nativo; rótulos
  `<text>` curtos nas regiões maiores. Esboço de regiões (ajustar visualmente ao desenhar; é um contorno lateral do
  boi, cabeça à esquerda):

```
cupim        M 300 150 L 380 130 L 460 140 L 440 190 L 320 200 Z
acem         M 220 190 L 320 200 L 330 290 L 230 300 Z
peito        M 230 300 L 330 290 L 330 360 L 240 370 Z
paleta       M 120 240 L 220 200 L 230 300 L 160 330 Z
musculo      M 140 330 L 230 370 L 220 450 L 160 450 Z   (dianteiro; repetir para o traseiro)
costela      M 330 200 L 560 200 L 560 330 L 330 330 Z
contrafile   M 460 140 L 640 140 L 640 200 L 440 200 Z
file-mignon  M 640 190 L 720 190 L 720 230 L 640 230 Z
alcatra      M 640 140 L 760 150 L 760 230 L 640 230 Z
picanha      M 760 150 L 850 180 L 840 240 L 760 230 Z
maminha      M 760 230 L 840 240 L 820 300 L 740 290 Z
fraldinha    M 560 330 L 740 290 L 740 360 L 560 380 Z
coxao-mole   M 740 240 L 850 260 L 840 360 L 740 360 Z
coxao-duro   M 840 260 L 900 300 L 880 380 L 840 360 Z
lagarto      M 760 360 L 840 360 L 830 420 L 770 420 Z
patinho      M 740 360 L 770 420 L 760 480 L 700 470 Z
```

- **Comportamento**: clicar/tocar/Enter num corte abre o painel lateral (mobile: abaixo do SVG) com nome BR e nome nos
  EUA, textura, preparos ideais (chips), ponto recomendado, faixa de preço de referência, `SemaforoCallout` do erro
  comum, "dica do pai", links para os artigos e para `/loja/categoria/churrasco-e-cozinha`. Aba 2 "Carne × preparo"
  (doc 01 §3.4): escolha o preparo ("quero fazer ensopado") → lista dos cortes com `preparo` compatível, ordenados por
  preço médio quando houver faixa. Aba 3: tabela ordenável (nome, região, textura, preparo, ponto, faixa).
  `?corte=fraldinha` abre já selecionado; selecionar atualiza a query string (`history.replaceState`).
- **Entrada do registry**:

```ts
{
  slug: "cortes-de-carne",
  title: "Guia de cortes de carne",
  seoTitle: "Cortes de carne bovina: guia do boi com preparo e ponto",
  description:
    "Clique no desenho do boi e veja cada corte: nome no Brasil e nos EUA, textura, melhor preparo, ponto certo, erro comum e faixa de preço de referência.",
  short: "Diagrama do boi clicável: preparo, ponto e erro comum de cada corte.",
  icon: Beef,
  category: "churrasco-cozinha",
  appCategory: "LifestyleApplication",
  featured: true,
  howTo: [
    { name: "Clique no corte", text: "Toque na região do boi (ou use Tab e Enter). O painel mostra tudo sobre o corte." },
    { name: "Ou parta do preparo", text: "Na aba Carne × preparo, diga o que vai cozinhar e veja os cortes certos." },
    { name: "Leia o erro comum", text: "Cada corte tem o erro que mais estraga a carne, no Semáforo do pai." },
    { name: "Vá ao açougue com o nome certo", text: "Compartilhe o corte ou leve a tabela impressa." },
  ],
  faq: [
    { question: "Qual a diferença entre maminha e fraldinha?", answer: "A maminha é a ponta da alcatra, macia e em formato de triângulo; a fraldinha é da parte baixa do boi, com fibras longas e mais sabor, que pede ponto e corte contra as fibras." },
    { question: "Por que o nome dos cortes muda nos EUA?", answer: "Porque o boi é desossado de outro jeito lá. A picanha, por exemplo, vem dentro do top sirloin; por isso o guia mostra os dois nomes para você entender receitas e vídeos estrangeiros." },
    { question: "Os preços são da minha cidade?", answer: "São faixas de referência pesquisadas em lojas online na data indicada, não preço de balcão. Use para comparar cortes entre si, não para discutir com o açougueiro." },
    { question: "Que corte usar em panela de pressão?", answer: "Cortes com colágeno: músculo, acém, peito e costela. Eles ficam macios com tempo e umidade; cortes magros como patinho e lagarto ficam secos." },
  ],
  relatedCategories: ["churrasco-e-cozinha"],
  relatedTerms: ["cortes de carne", "picanha", "fraldinha", "costela", "açougue"],
  disclaimer: "Faixas de preço são referência de pesquisa na internet, não preço da sua cidade. Carne moída, frango e miúdos sempre bem passados.",
  component: L(() => import("@/components/ferramentas/cortes-de-carne/BeefCutsGuide")),
},
```

- **Como usar** (`COMO_USAR["cortes-de-carne"]`):

```text
Todo homem deveria saber ler um boi. Não para virar açougueiro, mas para comprar certo, não pagar picanha por coxão duro e não estragar uma peça boa com o preparo errado. Este guia é o mapa do boi: clique numa região e veja o nome do corte no Brasil e nos Estados Unidos, a textura, o preparo ideal, o ponto recomendado, o erro mais comum e uma faixa de preço de referência.

## Três caminhos para a mesma resposta

Se você já sabe o corte, clique nele no desenho, ou navegue com Tab e Enter no teclado. Se sabe só o que quer cozinhar, use a aba Carne e preparo: escolha grelha, espeto, chapa, panela, forno ou moída e veja a lista de cortes que funcionam para aquilo. Se quer comparar tudo de uma vez, a aba Tabela completa mostra os dezesseis cortes lado a lado, com ordenação por nome, região, textura e faixa de preço.

## Como ler cada corte

Textura diz se a carne é macia por natureza, caso da picanha e do filé, ou se precisa de tempo e umidade para amaciar, caso do músculo, do acém e da costela. Preparo diz onde cada uma brilha: cortes macios vão para o fogo forte e rápido; cortes com colágeno vão para a panela, o forno baixo ou o bafo da churrasqueira. Ponto é a temperatura interna em que o corte fica melhor; com termômetro de espeto você acerta sempre. O erro comum é o Semáforo do pai daquele corte: a mancada que mais estraga a carne, como tirar a capa de gordura da picanha antes de assar ou cortar a fraldinha a favor das fibras.

## Sobre os preços

A faixa de preço é de referência, pesquisada em lojas online numa data que aparece na tela, com valor mínimo e máximo por quilo. Ela serve para comparar cortes entre si e planejar o churrasco, não para discutir com o açougueiro da sua cidade. Onde ainda não houve pesquisa, a tela avisa.

## No açougue

Peça o corte pelo nome e diga o preparo; um bom açougueiro limpa e porciona do jeito certo. Peça peças inteiras e corte em casa quando puder. Carne moída, frango e miúdos vão sempre bem passados. Com o nome certo, o ponto certo e o preparo certo, o churrasco de domingo vira a melhor hora da semana da sua família. Os artigos ligados a cada corte aprofundam receitas, tempo de cozimento e técnica.
```

- **Critério de aceite** (checklist 4.7): os 16 cortes clicáveis no SVG, com foco de teclado e `aria-label`; painel
  mostra os 8 campos; aba "Carne × preparo" filtra corretamente (panela → músculo, acém, peito, costela); nenhuma faixa
  inventada (campo `null` → "ainda não pesquisada"); links só para posts publicados; `?corte=costela` abre a costela;
  `tests/tools/cortes.test.ts` valida o JSON (16 slugs únicos, `svg_id` presente em `BeefDiagram`, `preparo` ⊂ `preparos`,
  `max ≤ 3 × min` quando houver faixa).

### 3.7 `orcamento-familiar` — Orçamento familiar do pai

- **Arquivo**: `src/components/ferramentas/orcamento-familiar/FamilyBudget.tsx`.
- **Dados**: `src/lib/tools/orcamento-data.ts` — grupos e categorias fixas e a "regra do pai" (metas por grupo):

```ts
export const GRUPOS = [
  { id: "essenciais", nome: "Essenciais", meta: { max: 0.5 }, categorias: ["Moradia (aluguel/prestação, condomínio, IPTU)", "Alimentação", "Contas (luz, água, gás, internet, celular)", "Transporte", "Saúde (plano, remédios)", "Educação dos filhos", "Seguros"] },
  { id: "futuro", nome: "Futuro", meta: { min: 0.2 }, categorias: ["Reserva de emergência", "Investimentos e aposentadoria", "Quitação de dívidas"] },
  { id: "estilo", nome: "Estilo de vida", meta: { max: 0.2 }, categorias: ["Lazer e passeios", "Churrasco, hobbies e esporte", "Roupas e cuidados", "Assinaturas e streaming", "Presentes"] },
  { id: "doacoes", nome: "Dízimo e caridade", meta: { sugerido: 0.1 }, categorias: ["Dízimo e ofertas", "Ajuda a familiares e caridade"] },
] as const;
export interface Orcamento { rendas: Array<{ nome: string; valor: number }>; gastos: Record<string, number> } // chave = categoria
export function resumir(o: Orcamento) { /* totais por grupo, % da renda, sobra, semáforo */ }
```

- **Entradas → saídas**: rendas líquidas (1 ou 2: "a sua" e "da esposa"), valor por categoria (campos em acordeão por
  grupo). Saída: total por grupo e % da renda com barras coloridas contra a meta; sobra ou falta do mês; "regra do pai"
  (Essenciais ≤ 50 %, Futuro ≥ 20 %, Estilo ≤ 20 %, Dízimo e caridade sugerido 10 %, opcional); `SemaforoCallout`: `ok`
  sobra ≥ 10 % e Futuro ≥ 15 %; `warn` sobra entre 0 e 10 % ou Essenciais > 60 %; `bad` sobra negativa ("Sinal de
  alerta: a conta não fecha; corte o Estilo de vida primeiro, renegocie dívidas e, se persistir, procure um planejador
  financeiro ou o Serasa/Procon para renegociação"). Botões: exportar CSV, imprimir, limpar.
- **Persistência**: `localStorage` (`vdp:tool:orcamento-familiar`) com aviso "fica salvo só neste navegador". **Não há coluna
  em `profiles` para orçamento** (doc 02 §4.1 é fechado), logo "salvar no perfil" nesta fase = botão "Salvar ferramenta"
  (`saved_items`) + localStorage; registrar em `PROGRESSO.md` → "Decisões" caso o dono queira persistir no banco mais
  tarde. CTA discreto ao fim: "Quer a planilha completa, com abas por filho e metas?" → link para o produto digital do doc
  11 §7 (constante `PLANILHA_URL: string | null = null` até a Fase 7 publicar; `null` = CTA oculto).
- **Entrada do registry**:

```ts
{
  slug: "orcamento-familiar",
  title: "Orçamento familiar do pai",
  seoTitle: "Orçamento familiar: planilha simples para o pai de família",
  description:
    "Monte o orçamento da casa em minutos: rendas, gastos por grupo, regra 50-20-20-10 do pai, sobra do mês e o Semáforo que mostra onde apertar.",
  short: "Rendas, gastos por grupo, sobra do mês e onde apertar.",
  icon: PiggyBank,
  category: "dinheiro",
  appCategory: "FinanceApplication",
  featured: true,
  howTo: [
    { name: "Informe as rendas líquidas", text: "A sua e, se houver, a da esposa. Use o valor que cai na conta." },
    { name: "Preencha os gastos por grupo", text: "Essenciais, Futuro, Estilo de vida e Dízimo. Vale estimar; depois ajuste com as faturas." },
    { name: "Leia as barras e o Semáforo", text: "Cada grupo tem uma meta. O Semáforo diz se a casa está no verde, atenção ou alerta." },
    { name: "Decida o corte e salve", text: "Corte primeiro o Estilo de vida. Exporte em CSV ou imprima; fica salvo neste navegador." },
  ],
  faq: [
    { question: "O que é a regra 50-20-20-10 do pai?", answer: "Até 50% da renda para o essencial, pelo menos 20% para o futuro (reserva, investimento, dívida), até 20% para estilo de vida e cerca de 10% para dízimo e caridade, se for a sua convicção. É um guia, não uma lei." },
    { question: "E se o essencial já passa de 50%?", answer: "É comum em cidade cara ou com escola particular. Nesse caso o Futuro não pode ficar em zero: reduza o Estilo de vida e defina uma reserva mínima, mesmo que pequena." },
    { question: "Meus dados ficam salvos onde?", answer: "Só no seu navegador, neste aparelho. Nada vai para o nosso servidor. Para guardar uma cópia, exporte o CSV." },
    { question: "Devo incluir o 13º e as férias?", answer: "Não na renda mensal. Trate-os como extras e destine-os primeiro à reserva de emergência ou à quitação de dívida cara." },
  ],
  relatedCategories: ["dinheiro-do-pai", "provedor-e-carreira"],
  relatedTerms: ["orçamento familiar", "planilha", "dívidas", "reserva de emergência", "dízimo"],
  disclaimer: "Ferramenta educativa de organização; não é consultoria financeira. Dívida fora de controle pede ajuda de um profissional ou dos canais oficiais de renegociação.",
  component: L(() => import("@/components/ferramentas/orcamento-familiar/FamilyBudget")),
},
```

- **Como usar** (`COMO_USAR["orcamento-familiar"]`):

```text
Quem provê precisa saber para onde o dinheiro vai. Não é controle por controle: é a diferença entre decidir e ser decidido pelas contas. Esta ferramenta monta o orçamento da casa em poucos minutos, sem planilha complicada, e mostra em cores onde a família está bem e onde está apertando.

## Preencha com o que cai na conta

Comece pelas rendas líquidas, a sua e a da esposa se ela trabalha fora. Use o valor real depositado, não o salário bruto. Depois abra cada grupo e preencha os gastos. Essenciais são moradia, alimentação, contas, transporte, saúde, educação dos filhos e seguros. Futuro é o dinheiro que trabalha por você: reserva de emergência, investimentos, aposentadoria e quitação de dívidas. Estilo de vida é lazer, churrasco, roupa, assinaturas e presentes. Dízimo e caridade é opcional, mas quem vive a fé sabe que o primeiro décimo pertence a Deus e ao próximo. Vale estimar na primeira vez e corrigir depois com as faturas na mão.

## A regra do pai

A ferramenta compara cada grupo com uma meta simples: até metade da renda para o essencial, pelo menos um quinto para o futuro, até um quinto para estilo de vida e cerca de um décimo para doações. Não é lei, é bússola. Se o essencial passa da metade, coisa comum em cidade cara ou com escola particular, o futuro não pode ficar zerado: encolha o estilo de vida e garanta uma reserva mínima, mesmo pequena.

## Leia o Semáforo

Verde é quando sobra pelo menos dez por cento do mês e o futuro recebe sua parte. Atenção é quando sobra pouco ou o essencial engole mais de sessenta por cento: um imprevisto vira dívida. Alerta é quando a conta não fecha. Nesse caso corte primeiro o estilo de vida, renegocie as dívidas mais caras e, se o buraco continuar, procure um planejador financeiro ou os canais oficiais de renegociação. Não existe vergonha em pedir ajuda; existe vergonha em deixar a família sem chão.

## Guarde e revise

Os dados ficam salvos apenas neste navegador; exporte o CSV ou imprima para guardar. Revise o orçamento todo mês, de preferência com a esposa, em dez minutos, na mesa da cozinha. Décimo terceiro e férias não entram na renda mensal: são extras que vão primeiro para a reserva ou para quitar dívida cara. Orçamento não é prisão; é o que compra liberdade para a sua casa.
```

- **Critério de aceite**: barras e % batem com a soma; três cenários acendem os três tons; recarregar a página mantém os
  valores (localStorage); CSV exporta com cabeçalho; nenhum dado vai ao Supabase além de `tool_usage`;
  `tests/tools/orcamento.test.ts` cobre `resumir()`.

### 3.8 `juros-compostos` — Simulador de juros compostos

- **Arquivo**: `src/components/ferramentas/juros-compostos/CompoundInterest.tsx`.
- **Dados/lógica**: `src/lib/tools/financas.ts`:

```ts
export interface JurosEntrada { inicial: number; aporteMensal: number; taxaAnual: number; meses: number; inflacaoAnual?: number }
export interface JurosPonto { mes: number; aportado: number; juros: number; saldo: number }
export const taxaMensal = (anual: number) => (1 + anual / 100) ** (1 / 12) - 1;
export function jurosCompostos(e: JurosEntrada): { serie: JurosPonto[]; final: number; aportado: number; juros: number; finalReal: number | null } {
  const i = taxaMensal(e.taxaAnual); const serie: JurosPonto[] = []; let saldo = e.inicial, aportado = e.inicial;
  for (let m = 1; m <= e.meses; m++) { saldo = saldo * (1 + i) + e.aporteMensal; aportado += e.aporteMensal; serie.push({ mes: m, aportado, juros: saldo - aportado, saldo }); }
  const finalReal = e.inflacaoAnual != null ? saldo / (1 + e.inflacaoAnual / 100) ** (e.meses / 12) : null;
  return { serie, final: saldo, aportado, juros: saldo - aportado, finalReal };
}
```

- **Entradas → saídas**: valor inicial, aporte mensal, taxa anual (campo livre + presets: "Poupança ≈ 70 % da Selic",
  "CDI 100 %", "Tesouro IPCA+ (taxa + IPCA 12 m)" — botão "usar taxas de hoje" lê `getMarketSnapshot()` → `indicators`;
  sem cache, os presets usam constantes editáveis com data), prazo (meses/anos), inflação opcional (preenchida com IPCA
  12 m do cache). Saída: valor final, total aportado, juros ganhos, valor real descontada a inflação, gráfico
  `AreaChart` empilhado (aportes × juros) e tabela ano a ano. `SemaforoCallout`: `ok` taxa ≤ CDI + 2 p.p.; `warn` taxa
  acima disso ("promessa alta pede garantia e liquidez claras"); `bad` taxa > 30 % a.a. ou "rendimento garantido" acima
  do CDI ("Sinal de alerta: rendimento garantido muito acima do CDI é sinal clássico de golpe; verifique na CVM e procure
  um profissional certificado antes de aplicar").
- **Entrada do registry**:

```ts
{
  slug: "juros-compostos",
  title: "Simulador de juros compostos",
  seoTitle: "Juros compostos: simule aportes mensais e veja o resultado",
  description:
    "Simule quanto o seu dinheiro rende com aportes mensais, taxa e prazo. Compare poupança, CDI e Tesouro, com valor real descontada a inflação e gráfico.",
  short: "Quanto rende guardar todo mês, com gráfico e inflação.",
  icon: TrendingUp,
  category: "dinheiro",
  appCategory: "FinanceApplication",
  usesMarketData: true,
  howTo: [
    { name: "Informe inicial e aporte", text: "Quanto você já tem e quanto consegue guardar por mês." },
    { name: "Escolha a taxa", text: "Digite a taxa anual ou use os presets com as taxas de hoje (poupança, CDI, Tesouro IPCA+)." },
    { name: "Defina o prazo e a inflação", text: "Em anos ou meses. A inflação mostra o valor real do montante no futuro." },
    { name: "Leia o gráfico", text: "A parte dos juros cresce com o tempo: é o efeito dos juros compostos." },
  ],
  faq: [
    { question: "Juros compostos é juro sobre juro?", answer: "Sim: cada mês o rendimento entra no saldo e passa a render também. Por isso o tempo pesa mais que a taxa: começar cedo com pouco vence começar tarde com muito." },
    { question: "A simulação considera imposto de renda?", answer: "Não. Tesouro e CDB têm IR regressivo de 22,5% a 15% sobre o rendimento; poupança é isenta. Use a taxa líquida se quiser o valor exato." },
    { question: "O que é valor real?", answer: "É o montante futuro descontada a inflação do período, ou seja, o que aquele dinheiro vai comprar em valores de hoje." },
    { question: "Qual taxa é realista?", answer: "Para renda fixa, algo próximo do CDI do dia. Taxas muito acima disso, 'garantidas', merecem desconfiança e verificação na CVM." },
  ],
  relatedCategories: ["dinheiro-do-pai"],
  relatedTerms: ["juros compostos", "investir", "tesouro direto", "cdb", "aporte mensal"],
  disclaimer: "Simulação educativa com taxas hipotéticas; rentabilidade passada não garante a futura. Não é recomendação de investimento.",
  component: L(() => import("@/components/ferramentas/juros-compostos/CompoundInterest")),
},
```

- **Como usar** (`COMO_USAR["juros-compostos"]`):

```text
Juros compostos são a força mais silenciosa a favor do pai que guarda um pouco todo mês. O rendimento de hoje entra no saldo e passa a render amanhã, e esse efeito, pequeno no primeiro ano, vira a maior parte do patrimônio depois de dez ou quinze. Este simulador mostra isso com números seus, não com exemplo de livro.

## O que informar

Comece com o valor que já tem guardado, mesmo que seja zero, e o aporte que consegue fazer todo mês. Escolha a taxa anual: digite a sua ou use os presets, que trazem a poupança, o CDI e o Tesouro IPCA+ com as taxas do dia lidas do nosso painel de mercado. Defina o prazo em anos ou meses e, se quiser enxergar o poder de compra do dinheiro no futuro, informe a inflação; o campo já vem com o IPCA de doze meses quando o dado está disponível.

## Como ler o resultado

O cartão principal mostra o montante final, quanto desse total saiu do seu bolso e quanto foi juros. O valor real é o montante descontada a inflação, ou seja, o que aquele dinheiro compra em valores de hoje; é esse número que importa para planejar faculdade, carro ou entrada de imóvel. O gráfico empilha aportes e juros ao longo do tempo: repare como a parte dos juros começa fina e engorda nos últimos anos. A tabela ano a ano serve para conferir metas intermediárias.

## O que a simulação não faz

Não desconta imposto de renda: Tesouro e CDB têm alíquota regressiva sobre o rendimento, poupança é isenta. Não garante taxa futura: o CDI de hoje pode ser outro daqui a dois anos. Não considera resgates no meio do caminho. Para uma conta mais fina, use a taxa líquida e refaça a simulação a cada ano.

## O Semáforo do pai nesta ferramenta

Taxa perto do CDI é cenário normal de renda fixa. Taxa bem acima do CDI pede garantia e liquidez claras no papel. Taxa muito alta com a palavra garantido é o sinal clássico de golpe: consulte o cadastro da CVM e fale com um profissional certificado antes de colocar um real. Juros compostos funcionam contra você também: o cartão de crédito rotativo usa a mesma matemática. Quite dívida cara antes de investir, e depois deixe o tempo trabalhar.
```

- **Critério de aceite**: R$ 0 inicial, R$ 500/mês, 10 % a.a., 120 meses → final ≈ R$ 101–103 mil; preset "usar taxas de
  hoje" preenche com a Selic/CDI do cache; semáforo `bad` com 40 % a.a.; `tests/tools/financas.test.ts` cobre
  `taxaMensal` e `jurosCompostos` com 3 casos.

### 3.9 `reserva-de-emergencia` — Reserva de emergência: quanto guardar

- **Arquivo**: `src/components/ferramentas/reserva-de-emergencia/EmergencyFund.tsx`.
- **Lógica** (`financas.ts`): `reservaEmergencia({ gastoMensal, tipoRenda: "clt" | "servidor" | "autonomo", dependentes,
  guardado, aporteMensal, taxaAnual? })` → `{ mesesMin, mesesMax, metaMin, metaMax, falta, mesesParaMeta }`. Meses-base:
  CLT 3–6; servidor estável 3–4; autônomo/PJ 6–12; +1 mês por dependente (máximo +3). `mesesParaMeta` com juros
  (`taxaAnual`, padrão = Selic do cache; sem cache, 0 %).
- **Entradas → saídas**: gasto mensal essencial (link "não sabe? use o Orçamento familiar"), tipo de renda, dependentes,
  quanto já guardou, aporte mensal. Saída: meta em faixa ("entre R$ X e R$ Y"), progresso (barra), quanto falta, meses
  para chegar à meta mínima e à máxima, bloco educativo "onde guardar" (Tesouro Selic, CDB com liquidez diária ≥ 100 %
  CDI, fundo DI simples; poupança aceitável para começar — sem nomear instituição). `SemaforoCallout`: `ok` guardado ≥ meta
  mínima; `warn` < 50 % da meta; `bad` zero guardado com dívida de cartão/cheque especial ("Sinal de alerta: … pague a
  dívida cara primeiro e, se não conseguir, procure um profissional ou a renegociação oficial").
- **Entrada do registry**:

```ts
{
  slug: "reserva-de-emergencia",
  title: "Reserva de emergência: quanto guardar",
  seoTitle: "Reserva de emergência: quanto guardar e em quanto tempo",
  description:
    "Calcule a reserva de emergência da família pelo gasto mensal, tipo de renda e filhos; veja quanto falta, em quantos meses chega lá e onde guardar.",
  short: "Meta da reserva da família, quanto falta e em quantos meses chega lá.",
  icon: Shield,
  category: "dinheiro",
  appCategory: "FinanceApplication",
  usesMarketData: true,
  howTo: [
    { name: "Informe o gasto essencial do mês", text: "Moradia, comida, contas, transporte, saúde e escola. Sem lazer." },
    { name: "Diga o tipo de renda e os dependentes", text: "CLT, servidor ou autônomo; quantos filhos. Isso define os meses de cobertura." },
    { name: "Informe o que já tem e o aporte", text: "A ferramenta mostra quanto falta e em quantos meses você chega à meta." },
    { name: "Escolha onde guardar", text: "Liquidez diária e baixo risco. O bloco 'onde guardar' explica as opções." },
  ],
  faq: [
    { question: "Quantos meses de reserva eu preciso?", answer: "CLT: 3 a 6 meses de gasto essencial. Servidor estável: 3 a 4. Autônomo ou PJ: 6 a 12. Some um mês por filho dependente. A faixa aparece no resultado." },
    { question: "Reserva vai na poupança?", answer: "Pode começar nela, mas Tesouro Selic e CDB com liquidez diária que pagam 100% do CDI rendem mais com a mesma segurança. O que importa é poder sacar no mesmo dia." },
    { question: "Devo investir antes de ter reserva?", answer: "Não. Sem reserva, qualquer imprevisto vira dívida cara e desfaz o investimento. Primeiro a reserva mínima, depois o resto." },
    { question: "Tenho dívida no cartão e zero reserva. O que vem primeiro?", answer: "A dívida cara. Juro de cartão supera qualquer rendimento. Quite ou renegocie e, em paralelo, guarde um valor pequeno por mês para criar o hábito." },
  ],
  relatedCategories: ["dinheiro-do-pai"],
  relatedTerms: ["reserva de emergência", "tesouro selic", "cdb", "desemprego", "dívida"],
  disclaimer: "Conteúdo educativo; não é recomendação de produto financeiro nem de instituição. Em caso de dívida fora de controle, procure um profissional ou os canais oficiais de renegociação.",
  component: L(() => import("@/components/ferramentas/reserva-de-emergencia/EmergencyFund")),
},
```

- **Como usar** (`COMO_USAR["reserva-de-emergencia"]`):

```text
Reserva de emergência é o colchão que separa um imprevisto de uma crise. Carro quebrado, demissão, cirurgia do filho: tudo isso acontece, e a diferença entre a família que atravessa com tranquilidade e a que se endivida é ter alguns meses de gasto guardados em lugar seguro e de saque rápido. Esta ferramenta diz quanto é esse valor para a sua casa e em quanto tempo você chega lá.

## Informe só o essencial

Digite o gasto mensal essencial: moradia, alimentação, contas, transporte, saúde e escola. Lazer e supérfluo ficam de fora, porque em emergência eles param. Se não sabe o número, monte antes o Orçamento familiar e volte com o total dos Essenciais. Depois escolha o tipo de renda. Quem tem carteira assinada tem seguro-desemprego e multa do FGTS, por isso precisa de menos meses; servidor estável, menos ainda; autônomo e PJ, sem rede de proteção, precisam de mais. Some os dependentes: cada filho acrescenta um mês de cobertura, até o limite de três.

## Como ler a meta

O resultado é uma faixa, entre a meta mínima e a máxima. Informe quanto já guardou e quanto consegue guardar por mês: a barra mostra o progresso, e os cartões dizem em quantos meses você alcança a mínima e a máxima, com o rendimento da Selic do dia quando o dado está disponível. Comece pela mínima; depois siga até a máxima com calma.

## Onde guardar

Reserva precisa de três coisas: segurança, liquidez diária e rendimento razoável. Tesouro Selic, CDB de banco sólido com liquidez diária pagando ao menos o CDI e fundos DI simples atendem a isso. Poupança serve para começar, mas rende menos. Não coloque reserva em ação, cripto ou fundo com prazo de resgate: o dia em que você precisar pode ser o dia em que estiver em baixa.

## A ordem certa

Se há dívida de cartão ou cheque especial, ela vem antes: nenhum rendimento vence juro de cartão. Quite ou renegocie e, em paralelo, guarde um valor pequeno todo mês para criar o hábito. Depois da reserva mínima, aí sim, invista para o futuro. O Semáforo do pai acompanha esse caminho: verde com a reserva mínima feita, atenção enquanto estiver abaixo da metade, alerta com dívida cara e reserva zerada. Pai que provê dorme tranquilo porque tem o colchão pronto antes da queda.
```

- **Critério de aceite**: gasto R$ 4.000, CLT, 2 filhos → meta entre R$ 20.000 e R$ 32.000; autônomo dobra os meses;
  "meses para a meta" diminui ao informar taxa; semáforo correto nos 3 cenários; `tests/tools/financas.test.ts` cobre
  `reservaEmergencia`.

### 3.10 `pensao-alimenticia` — Pensão alimentícia: estimativa educativa

- **Arquivo**: `src/components/ferramentas/pensao-alimenticia/ChildSupportEstimate.tsx`. `ToolDisclaimer` com `strong`
  (já previsto no `ToolLayout`).
- **Lógica** (`financas.ts`): `pensaoEstimativa({ rendaLiquida, filhos, guarda: "compartilhada" | "unilateral", custosFixosFilho })`
  → faixa de % e de valor. **Não existe percentual legal**: a lei usa o binômio necessidade × possibilidade (CC art. 1.694
  §1º). A ferramenta mostra **faixas observadas na prática forense** (parametrizadas em constante com fonte):
  1 filho 15–25 %; 2 filhos 25–33 %; 3 ou mais 33–40 % da renda líquida (total, dividido entre os filhos); em guarda
  compartilhada com despesas divididas diretamente, mostrar também a faixa reduzida (−5 p.p.) com a explicação. Mostra
  ainda: o que costuma entrar na base (salário, 13º, férias; horas extras e bônus conforme a decisão), o que sai
  (descontos legais), e `custosFixosFilho` comparado ao valor para ilustrar a "necessidade".
- **Entradas → saídas**: renda líquida, número de filhos, tipo de guarda, custos fixos do filho (escola, plano). Saída:
  faixa de % e de R$ (total e por filho), explicação do binômio, lista "o que não fazer" (parar de pagar, pagar por fora sem
  recibo, descontar visita), `SemaforoCallout`: `ok` acordo escrito homologado em juízo; `warn` acordo verbal ("formalize na
  Defensoria Pública ou com advogado; proteja os dois lados"); `bad` atraso ≥ 3 meses ou execução em curso ("Sinal de
  alerta: … procure a Defensoria Pública ou um advogado de família hoje; a prisão civil é possível").
- **Entrada do registry**:

```ts
{
  slug: "pensao-alimenticia",
  title: "Pensão alimentícia: quanto costuma ser",
  seoTitle: "Pensão alimentícia: faixa estimada por renda e filhos",
  description:
    "Veja a faixa de pensão alimentícia que costuma ser fixada por renda, número de filhos e tipo de guarda, o que entra na base e quando procurar a Defensoria.",
  short: "Faixa estimada por renda e número de filhos, com o que entra na base.",
  icon: Scale,
  category: "dinheiro",
  alsoIn: ["familia"],
  appCategory: "UtilitiesApplication",
  howTo: [
    { name: "Informe a renda líquida", text: "O que cai na conta depois dos descontos legais." },
    { name: "Diga filhos e guarda", text: "Quantos filhos e se a guarda é compartilhada ou unilateral." },
    { name: "Compare com o custo real do filho", text: "Escola, plano e outros fixos mostram a 'necessidade' do binômio." },
    { name: "Formalize", text: "Acordo só vale com homologação. A Defensoria Pública atende de graça quem tem direito." },
  ],
  faq: [
    { question: "Existe um percentual fixo em lei?", answer: "Não. A lei usa o binômio necessidade de quem recebe e possibilidade de quem paga. Os percentuais que circulam são faixas observadas nas decisões, por isso a ferramenta mostra uma estimativa, não um valor." },
    { question: "Guarda compartilhada dispensa pensão?", answer: "Não necessariamente. Se um dos pais tem renda maior ou o filho mora mais tempo com um deles, a pensão continua. O valor pode ser menor quando as despesas são divididas diretamente." },
    { question: "Posso pagar 'por fora', comprando as coisas?", answer: "Só o que a decisão permitir. Sem recibo e sem previsão judicial, a compra não abate a pensão e você pode ser cobrado em dobro. Pague pelo meio fixado e guarde comprovantes." },
    { question: "O que acontece se eu atrasar?", answer: "A execução de alimentos permite protesto, penhora e até prisão civil de 1 a 3 meses pelas três últimas parcelas. Se a renda caiu, peça revisão na Justiça antes de parar de pagar." },
  ],
  relatedCategories: ["direitos-do-pai", "casamento-e-familia"],
  relatedTerms: ["pensão alimentícia", "guarda compartilhada", "defensoria pública", "divórcio"],
  disclaimer: "Esta ferramenta é educativa e mostra faixas observadas na prática, não um cálculo legal. Cada caso é decidido pelo juiz. Procure a Defensoria Pública ou um advogado de família antes de qualquer acordo ou decisão.",
  component: L(() => import("@/components/ferramentas/pensao-alimenticia/ChildSupportEstimate")),
},
```

- **Como usar** (`COMO_USAR["pensao-alimenticia"]`):

```text
Pensão alimentícia é um dos assuntos mais delicados da vida de um pai, e também um dos mais cercados de informação errada. Esta ferramenta não calcula a sua pensão, porque nenhuma calculadora pode: quem fixa o valor é o juiz, caso a caso. O que ela faz é mostrar a faixa que costuma aparecer nas decisões para a sua renda e o seu número de filhos, explicar o que entra na conta e dizer em que momento você precisa de um profissional.

## O que a lei realmente diz

Não existe percentual fixo em lei. O Código Civil manda equilibrar a necessidade de quem recebe e a possibilidade de quem paga. Os famosos trinta por cento são um costume forense, não uma regra. Por isso o resultado aqui é uma faixa, calculada sobre a renda líquida e ajustada pelo número de filhos e pelo tipo de guarda. Informe também os custos fixos do filho, como escola e plano de saúde: a comparação entre esse número e a faixa mostra o lado da necessidade e ajuda você a entender como o juiz pensa.

## O que entra na base

Salário líquido, décimo terceiro e férias costumam compor a base; horas extras, bônus e participação nos lucros dependem da decisão. Descontos legais saem antes. Se você é autônomo ou PJ, a renda é apurada por extratos e declaração de imposto, e esconder renda é o erro que mais custa caro na Justiça.

## Guarda compartilhada

Compartilhar a guarda não extingue a pensão. Se um dos pais ganha mais ou o filho passa mais tempo com um deles, a obrigação continua, às vezes em valor menor quando as despesas são divididas diretamente e isso consta na decisão. A ferramenta mostra as duas faixas para você conversar com clareza.

## O que nunca fazer

Nunca pare de pagar por conta própria: se a renda caiu, peça revisão judicial. Nunca pague por fora sem recibo: a compra não abate a pensão. Nunca condicione o pagamento às visitas: são direitos independentes, e o filho não é moeda. Atraso de três parcelas abre caminho para protesto, penhora e prisão civil.

## Quando procurar ajuda

Acordo só vale homologado. A Defensoria Pública atende de graça quem se enquadra na renda; fora disso, um advogado de família. Se já existe atraso ou execução, procure hoje. Esta página é informação educativa e nunca substitui orientação jurídica. Pai de verdade sustenta o filho mesmo quando o casamento acabou, e faz isso do jeito certo.
```

- **Critério de aceite**: renda R$ 5.000 e 1 filho → faixa R$ 750–1.250 (15–25 %); 2 filhos → 25–33 %; guarda
  compartilhada mostra a faixa reduzida com explicação; disclaimer `strong` visível; nenhum texto diz "você deve pagar X";
  `tests/tools/financas.test.ts` cobre `pensaoEstimativa` nos 3 grupos de filhos.

### 3.11 `conversor-de-unidades` — Conversor de unidades (casa, oficina e cozinha)

- **Arquivo**: `src/components/ferramentas/conversor-de-unidades/UnitConverter.tsx`.
- **Lógica**: `src/lib/tools/unidades.ts` — `convert(categoria, de, para, valor)` com tabelas de fator (temperatura é caso
  especial). Categorias e unidades fixas:
  - **Comprimento**: mm, cm, m, km, polegada (25,4 mm), pé (0,3048 m), jarda (0,9144 m), milha (1.609,344 m).
  - **Peso**: g, kg, t, libra (0,45359237 kg), onça (28,349523 g), arroba brasileira (14,688 kg — para gado e churrasco).
  - **Volume**: ml, l, m³, xícara (240 ml), colher de sopa (15 ml), colher de chá (5 ml), galão americano (3,785 l),
    onça fluida (29,5735 ml), lata (350 ml), garrafa (600 ml) — os dois últimos para a calculadora de churrasco.
  - **Temperatura**: °C, °F, K + tabela de forno (baixo 150 °C, médio 180 °C, alto 220 °C) e de ponto da carne.
  - **Área**: m², ha, alqueire paulista (24.200 m²), alqueire mineiro (48.400 m²), acre (4.046,86 m²).
  - **Velocidade**: km/h, m/s, mph, nó.
  - **Consumo**: km/l ↔ l/100 km ↔ mpg (fórmulas inversas; teste com 10 km/l = 10 l/100 km = 23,52 mpg).
  - **Pressão** (pneu, compressor): psi, bar, kPa, kgf/cm².
  - **Potência**: cv (735,49875 W), hp (745,7 W), kW. **Torque**: N·m, kgf·m (9,80665 N·m), lb·ft (1,355818 N·m).
  - **Brocas e parafusos**: tabela polegada fracionária → mm (1/8" = 3,175; 3/16" = 4,7625; 1/4" = 6,35; 5/16" = 7,9375;
    3/8" = 9,525; 1/2" = 12,7; 5/8" = 15,875; 3/4" = 19,05; 1" = 25,4) e bitola de broca para bucha (bucha 6 → broca 6 mm,
    bucha 8 → 8 mm, bucha 10 → 10 mm).
- **Entradas → saídas**: categoria (abas), unidade de origem/destino, valor (`parseBRNumber`); resultado instantâneo,
  tabela rápida com as 5 unidades mais usadas da categoria e botão inverter. `alsoIn: ["churrasco-cozinha"]`.
- **Entrada do registry**:

```ts
{
  slug: "conversor-de-unidades",
  title: "Conversor de unidades",
  seoTitle: "Conversor de unidades: polegada, libra, psi, xícara e mais",
  description:
    "Converta medidas da casa, da oficina e da cozinha: polegada e milímetro, libra e quilo, psi e bar, xícara e mililitro, km/l e mpg, cv e kW, broca e bucha.",
  short: "Polegada, libra, psi, xícara, km/l, cv: tudo em uma tela.",
  icon: Ruler,
  category: "casa-oficina",
  alsoIn: ["churrasco-cozinha"],
  appCategory: "UtilitiesApplication",
  howTo: [
    { name: "Escolha a categoria", text: "Comprimento, peso, volume, temperatura, área, velocidade, consumo, pressão, potência ou brocas." },
    { name: "Selecione as unidades", text: "De e para. O botão do meio inverte." },
    { name: "Digite o valor", text: "Aceita vírgula ou ponto. O resultado aparece na hora, com tabela rápida ao lado." },
  ],
  faq: [
    { question: "Qual broca usar para bucha 8?", answer: "Broca de 8 mm, do mesmo número da bucha. Para parede oca, use bucha específica; a tabela de brocas mostra as equivalências em polegada." },
    { question: "Quanto é uma xícara em mililitros?", answer: "A xícara de receita brasileira tem 240 ml; a colher de sopa, 15 ml; a de chá, 5 ml. Para farinha e açúcar, o peso muda: prefira balança." },
    { question: "Como converter km/l em litros por 100 km?", answer: "Divida 100 pelo consumo: 10 km/l equivalem a 10 l/100 km; 14 km/l, a 7,1 l/100 km. A ferramenta também converte para mpg dos EUA." },
    { question: "Qual a pressão certa do pneu?", answer: "A que está na etiqueta da porta do motorista, em psi, com o pneu frio. A ferramenta converte para bar e kPa se o calibrador usar outra unidade." },
  ],
  relatedCategories: ["caixa-de-ferramentas-e-reparos", "carro-e-moto", "churrasco-e-cozinha"],
  relatedTerms: ["polegada", "broca", "pressão do pneu", "xícara", "consumo de combustível"],
  component: L(() => import("@/components/ferramentas/conversor-de-unidades/UnitConverter")),
},
```

- **Como usar** (`COMO_USAR["conversor-de-unidades"]`):

```text
Metade dos erros na oficina, na garagem e na cozinha vem de unidade trocada: a broca em polegada que não bate com a bucha, o manual do carro em psi quando o calibrador marca bar, a receita gringa em xícaras e onças. Este conversor junta numa tela só as unidades que o pai de família usa de verdade, do parafuso à panela.

## Escolha a categoria certa

Comprimento cobre milímetro, centímetro, metro, polegada, pé, jarda e milha, para medir, cortar e entender ferramentas importadas. Peso tem grama, quilo, libra, onça e a arroba brasileira, útil para quem compra carne em quantidade ou lida com gado. Volume inclui mililitro, litro, xícara, colheres, galão, onça fluida, lata e garrafa, pensando na receita e no churrasco. Temperatura converte Celsius, Fahrenheit e Kelvin e traz a tabela de forno e de ponto da carne. Área tem metro quadrado, hectare, alqueire paulista e mineiro e acre, para quem olha terreno ou sítio. Velocidade, consumo, pressão, potência e torque resolvem o carro, a moto, o compressor e a furadeira. Brocas e parafusos traz a tabela de polegada fracionária em milímetro e a broca certa para cada bucha.

## Como usar

Escolha a categoria na aba, a unidade de origem e a de destino, e digite o valor com vírgula ou ponto. O resultado aparece na hora, e a tabela ao lado mostra o mesmo valor nas unidades mais comuns da categoria, para você não precisar converter uma por uma. O botão do meio inverte o sentido. Para arredondar, use o bom senso da tarefa: medida de marcenaria pede décimo de milímetro; pressão de pneu, número inteiro.

## Dicas práticas

Bucha e broca têm o mesmo número: bucha 8, broca 8. Pressão de pneu é a da etiqueta na porta do motorista, medida com o pneu frio. Xícara de receita brasileira tem duzentos e quarenta mililitros, mas farinha e açúcar variam de peso; balança resolve. Em consumo de combustível, dividir cem pelo valor em quilômetros por litro dá litros por cem quilômetros, a unidade que os europeus usam. Cavalo-vapor e horsepower não são iguais: a diferença é pequena, mas aparece em comparação de motores.

Nada aqui depende de internet; a ferramenta funciona offline depois da primeira visita. Se faltar alguma unidade que você usa, mande pelo Contato: a lista cresce com o uso dos leitores.
```

- **Critério de aceite**: 1" = 25,4 mm; 1 arroba = 14,688 kg; 32 psi ≈ 2,21 bar; 10 km/l = 10 l/100 km ≈ 23,52 mpg;
  100 °F = 37,78 °C; 1 cv = 0,7355 kW; `tests/tools/unidades.test.ts` cobre esses 6 casos e a ida-e-volta
  (`convert(a→b→a) ≈ valor`).

### 3.12 `kit-de-ferramentas` — Monte o seu kit de ferramentas

- **Arquivo**: `src/components/ferramentas/kit-de-ferramentas/ToolkitBuilder.tsx`.
- **Dados**: `src/lib/tools/kit-ferramentas-data.ts`:

```ts
export type Nivel = "basico" | "intermediario" | "oficina";
export type Tarefa = "montar-moveis" | "furar-parede" | "eletrica-basica" | "hidraulica" | "pintura" | "marcenaria" | "carro-bike" | "jardim";
export interface ItemKit { id: string; nome: string; paraQue: string; nivel: Nivel; tarefas: Tarefa[]; essencial: boolean; categoriaLoja: string; productSlug?: string }
export const ITENS: ItemKit[] = [
  { id: "martelo", nome: "Martelo de unha 25 mm", paraQue: "Pregar, retirar prego, bater bucha", nivel: "basico", tarefas: ["montar-moveis", "furar-parede"], essencial: true, categoriaLoja: "ferramentas" },
  { id: "chaves-fenda-phillips", nome: "Jogo de chaves de fenda e Phillips", paraQue: "Tomada, móvel, eletrodoméstico", nivel: "basico", tarefas: ["montar-moveis", "eletrica-basica"], essencial: true, categoriaLoja: "ferramentas" },
  { id: "trena", nome: "Trena de 5 m", paraQue: "Medir antes de furar e de comprar", nivel: "basico", tarefas: ["montar-moveis", "furar-parede", "marcenaria"], essencial: true, categoriaLoja: "ferramentas" },
  { id: "parafusadeira", nome: "Parafusadeira/furadeira a bateria 12 V", paraQue: "Prateleira, móvel, cortina", nivel: "intermediario", tarefas: ["montar-moveis", "furar-parede"], essencial: true, categoriaLoja: "ferramentas", productSlug: "bosch-gsr-120-li-12v" },
  { id: "furadeira-impacto", nome: "Furadeira de impacto 650 W", paraQue: "Concreto e alvenaria", nivel: "intermediario", tarefas: ["furar-parede"], essencial: false, categoriaLoja: "ferramentas" },
  { id: "detector", nome: "Detector de cano e fio", paraQue: "Não furar cano nem fio na parede", nivel: "intermediario", tarefas: ["furar-parede"], essencial: true, categoriaLoja: "ferramentas" },
  { id: "chave-teste", nome: "Chave de teste e alicate universal isolado", paraQue: "Trocar tomada e interruptor com o disjuntor desligado", nivel: "intermediario", tarefas: ["eletrica-basica"], essencial: true, categoriaLoja: "ferramentas" },
  { id: "chave-grifo", nome: "Chave grifo 12\"", paraQue: "Sifão, flexível, registro", nivel: "intermediario", tarefas: ["hidraulica"], essencial: true, categoriaLoja: "ferramentas" },
  // … completar até ~35 itens cobrindo as 8 tarefas e os 3 níveis (nível de referência: doc 12 #85 e #87).
];
export const EPI = ["Óculos de proteção", "Luvas", "Protetor auricular (ferramenta elétrica)", "Máscara (lixa e tinta)"];
```

  `productSlug` só quando o produto existir na loja (`select slug from products where active`; doc 05 §10.2 lista Bosch
  GSR 120-LI, GSB 13 RE, Tramontina Master 110 peças, Bosch GLM 20, Gedore chaves, Bosch GST 650 — confirmar os slugs
  cadastrados na Fase 3 e corrigir no arquivo). Sem slug, o botão leva a `/loja/categoria/ferramentas`.
- **Entradas → saídas**: tipo de moradia (apartamento / casa / sítio), tarefas que pretende fazer (checkboxes), nível
  desejado. Saída: lista personalizada com "já tenho" (checkbox, localStorage), separada em "comece por estes"
  (essenciais) e "quando precisar"; bloco EPI; faixa de investimento total **só se** os produtos vinculados tiverem
  `price_min/price_max` (soma das faixas, texto "faixa pesquisada em <data mais antiga>"); botões "Ver na Loja do Pai"
  (`/loja/<slug>` — link interno, sem botão de afiliado aqui, logo sem aviso de afiliado); links para os artigos #85
  `caixa-de-ferramentas-basica-do-pai` e #87 `furadeira-ou-parafusadeira-qual-comprar` quando publicados.
  `SemaforoCallout`: `ok` EPI na lista; `warn` furar parede sem detector ("cano e fio passam onde você menos espera");
  `bad` "Sinal de alerta: elétrica só com o disjuntor geral desligado e teste de ausência de tensão; quadro, chuveiro e
  padrão de entrada são serviço de eletricista".
- **Entrada do registry**:

```ts
{
  slug: "kit-de-ferramentas",
  title: "Monte o seu kit de ferramentas",
  seoTitle: "Kit de ferramentas: o que todo pai precisa ter em casa",
  description:
    "Monte a caixa de ferramentas certa para a sua casa: diga o que vai fazer e receba a lista por prioridade, com EPI, faixa de preço e links da Loja do Pai.",
  short: "A lista de ferramentas certa para a sua casa, por prioridade.",
  icon: Wrench,
  category: "casa-oficina",
  appCategory: "UtilitiesApplication",
  howTo: [
    { name: "Diga onde mora", text: "Apartamento, casa ou sítio mudam o que faz sentido comprar." },
    { name: "Marque o que pretende fazer", text: "Montar móveis, furar parede, elétrica básica, hidráulica, pintura, marcenaria, carro e bike, jardim." },
    { name: "Escolha o nível", text: "Básico para resolver o dia a dia; intermediário para reformas pequenas; oficina para quem gosta." },
    { name: "Marque o que já tem", text: "A lista mostra o que falta, por prioridade, e onde comprar na Loja do Pai." },
  ],
  faq: [
    { question: "Qual a primeira ferramenta elétrica para comprar?", answer: "Uma parafusadeira/furadeira a bateria de 12 V com duas baterias. Ela monta móvel, fura drywall e tijolo furado e instala prateleira; para concreto, vem depois a furadeira de impacto." },
    { question: "Vale comprar kit com 100 peças?", answer: "Para começar, sim: resolve 80% das tarefas por um preço baixo. Com o uso você descobre quais peças merecem versão profissional." },
    { question: "O que não devo fazer sozinho?", answer: "Quadro de luz, padrão de entrada, chuveiro 220 V, gás e qualquer coisa em altura sem proteção. Isso é serviço de profissional registrado." },
    { question: "Os preços são da Amazon?", answer: "A faixa mostrada é pesquisada na internet, em várias lojas, e não é o preço da Amazon. O botão leva à página do produto na Loja do Pai, com a faixa e a review." },
  ],
  relatedCategories: ["caixa-de-ferramentas-e-reparos"],
  relatedTerms: ["kit de ferramentas", "parafusadeira", "furadeira", "caixa de ferramentas", "reparos em casa"],
  disclaimer: "Lista educativa; use EPI e siga o manual de cada ferramenta. Serviços elétricos, de gás e em altura exigem profissional habilitado.",
  component: L(() => import("@/components/ferramentas/kit-de-ferramentas/ToolkitBuilder")),
},
```

- **Como usar** (`COMO_USAR["kit-de-ferramentas"]`):

```text
Todo homem de família precisa de uma caixa de ferramentas, e a maioria compra errado: ou um kit enorme que fica no armário, ou nada, e paga alguém para pendurar uma prateleira. Esta ferramenta monta a sua caixa a partir do que você vai fazer de verdade, em ordem de prioridade, e mostra onde cada item entra.

## Três perguntas

Primeiro, onde você mora. Apartamento pede ferramentas de parede e de móvel, pouco espaço e nada de barulho exagerado. Casa acrescenta hidráulica, pintura e portão. Sítio soma jardim, cerca e manutenção pesada. Segundo, o que pretende fazer: marque entre montar móveis, furar parede, elétrica básica, hidráulica, pintura, marcenaria, carro e bicicleta e jardim. Terceiro, o nível. Básico resolve o dia a dia com meia dúzia de itens. Intermediário encara pequenas reformas e inclui a primeira ferramenta elétrica. Oficina é para quem gosta e quer fazer projetos com os filhos.

## Como ler a lista

A lista vem dividida em duas partes. Comece por estes são os itens essenciais para as tarefas que você marcou; compre primeiro. Quando precisar são os que fazem diferença, mas podem esperar a necessidade. Marque o que já tem e a lista passa a mostrar só o que falta. Cada item traz para que serve, a categoria na Loja do Pai e, quando o produto já foi avaliado pelo Pai Indica, o botão para a página dele, com faixa de preço pesquisada na internet e a review completa. A faixa de investimento total aparece só quando todos os itens vinculados têm pesquisa de preço; ela é referência, não orçamento.

## Segurança primeiro

Óculos, luvas, protetor auricular e máscara entram em toda lista, porque ferramenta boa na mão sem proteção é acidente esperando dia. Antes de furar parede, use o detector de cano e fio: cano estourado e fio cortado são os dois reparos mais caros que um furo pode causar. Elétrica só com o disjuntor geral desligado e teste de ausência de tensão; quadro de luz, padrão de entrada, chuveiro e qualquer serviço de gás são trabalho de profissional habilitado. Trabalho em altura pede escada firme e alguém segurando.

## Compre certo

Prefira marca conhecida nas ferramentas que você vai usar sempre e kit simples nas que usa pouco. Guarde tudo na mesma caixa, no mesmo lugar, e ensine o filho a devolver cada peça ao lugar dela. Caixa de ferramentas organizada é lição de ordem que a criança leva para a vida.
```

- **Critério de aceite**: marcar "furar parede" inclui detector e furadeira; nível básico oculta itens de oficina; "já
  tenho" persiste ao recarregar; botões só para `/loja/<slug>` existentes (sem 404); faixa total só com todas as faixas
  disponíveis; `tests/tools/kit.test.ts` valida os dados (ids únicos, tarefas válidas, ≥ 1 essencial por tarefa).

### 3.13 `nomes-de-filhos` — Nomes de filhos com significado (e nomes de santos)

- **Arquivo**: `src/components/ferramentas/nomes-de-filhos/ChildNames.tsx`.
- **Dados**: `src/lib/tools/nomes-data.ts` — **adaptado** de `/home/user/vocacaodemae/src/lib/tools/nomes-data.ts`
  (lista neutra de 884 nomes com significado e origem; é a única cópia permitida do VDM nesta fase, §0.4 item 4).
  Mudanças obrigatórias: tipo `ChildName { name; sex: "menino" | "menina" | "unissex"; meaning; origin; saint?: boolean;
  biblical?: boolean }`; constante `SANTOS` com os nomes de santos mais comuns marcados `saint: true` (José, João, Pedro,
  Paulo, Francisco, Antônio, Miguel, Rafael, Gabriel, Tomás, Lucas, Mateus, Marcos, Benedito, Sebastião, Judas Tadeu,
  Maria, Ana, Teresa, Clara, Cecília, Helena, Isabel, Catarina, Luzia, Rita, Joana, Inês, Madalena, Mônica…) e
  `biblical: true` nos bíblicos; revisar `meaning` para remover qualquer frase que fale de "mãe"/"bebê" (ex.: "a amada da
  mamãe" → "a amada"). Nada de UI copiada do VDM.
- **Entradas → saídas**: sexo (menino/menina/todos), letra inicial, origem (lista das origens do arquivo), filtros "só
  nomes de santos" e "só bíblicos", sobrenome da família (opcional: mostra "Nome Sobrenome" no card e avisa quando a
  junção gera som estranho — última letra do nome igual à primeira do sobrenome), busca por texto, botão "sortear 5".
  Saída: cards com nome, significado, origem, selos "Santo" e "Bíblico"; favoritos (até 10, `localStorage`
  `vdp:tool:nomes-de-filhos`) com botão "compartilhar lista" (texto: "Nomes que estamos pensando: A, B, C — Vocação de Pai").
  Sem semáforo (não há risco). Link para `/categoria/paternidade-por-fase` e para o artigo de nomes quando existir.
- **Entrada do registry**:

```ts
{
  slug: "nomes-de-filhos",
  title: "Nomes de filhos com significado",
  seoTitle: "Nomes de filhos: significado, origem e nomes de santos",
  description:
    "Escolha o nome do seu filho com significado e origem, filtre por letra, nomes de santos e bíblicos, teste com o sobrenome e monte a lista com a esposa.",
  short: "Mais de 800 nomes com significado, origem e nomes de santos.",
  icon: BookOpen,
  category: "familia",
  appCategory: "LifestyleApplication",
  howTo: [
    { name: "Filtre", text: "Menino ou menina, letra inicial, origem, só santos ou só bíblicos." },
    { name: "Teste com o sobrenome", text: "Digite o sobrenome da família para ver como o nome completo soa." },
    { name: "Favorite e compartilhe", text: "Guarde até 10 nomes e mande a lista para a esposa decidir junto." },
  ],
  faq: [
    { question: "Por que escolher nome de santo?", answer: "Na tradição católica, o nome dá ao filho um padroeiro e um exemplo de vida. Não é obrigação, mas é um presente que acompanha a criança para sempre." },
    { question: "Posso registrar qualquer nome?", answer: "O cartório pode recusar nomes que exponham a criança ao ridículo. Nomes compostos e estrangeiros são aceitos; grafias muito incomuns podem gerar dúvida. Em caso de recusa, há recurso ao juiz." },
    { question: "Os significados são confiáveis?", answer: "Vêm da etimologia tradicional de cada língua (hebraico, grego, latim, germânico, tupi). Nomes modernos sem etimologia clara trazem a origem mais aceita." },
    { question: "E se o pai e a mãe não concordam?", answer: "Cada um monta a lista de favoritos e troca com o outro. O nome do filho é decisão do casal; a ferramenta só organiza a conversa." },
  ],
  relatedCategories: ["paternidade-por-fase", "fe-e-virtude"],
  relatedTerms: ["nomes de bebê", "nome de santo", "significado do nome", "registro"],
  component: L(() => import("@/components/ferramentas/nomes-de-filhos/ChildNames")),
},
```

- **Como usar** (`COMO_USAR["nomes-de-filhos"]`):

```text
Escolher o nome do filho é a primeira decisão que o pai e a mãe tomam juntos para uma pessoa que ainda não conhecem, e ela vai acompanhá-la a vida inteira. Esta ferramenta reúne mais de oitocentos nomes com significado e origem, organizados para o casal filtrar, comparar, testar com o sobrenome e chegar a uma lista curta sem briga.

## Como filtrar

Comece pelo sexo, se já souber. Depois use a letra inicial, a origem, que vai do hebraico e do grego ao latim, ao germânico e ao tupi, e os dois filtros que fazem desta lista algo diferente: só nomes de santos e só nomes bíblicos. Na tradição católica, dar ao filho o nome de um santo é dar a ele um padroeiro, uma data para celebrar e uma história de vida para imitar. Não é obrigação, mas é um presente que o pai pode dar no primeiro dia.

## Teste com o sobrenome

Digite o sobrenome da família e cada card passa a mostrar o nome completo. Preste atenção ao som: nome que termina com a mesma letra com que o sobrenome começa costuma emendar mal, e a ferramenta avisa quando isso acontece. Leia em voz alta, imagine a chamada na escola e a assinatura no documento. Nome bonito na lista pode ficar estranho no dia a dia.

## Monte a lista e decida juntos

Favorite até dez nomes; eles ficam guardados neste navegador. O botão de compartilhar manda a lista para a esposa, que pode fazer a dela e trocar. O botão de sortear mostra cinco nomes aleatórios dentro dos filtros, bom para destravar quando nada agrada. Decisão de nome é do casal: a ferramenta só organiza a conversa.

## Sobre o registro

O cartório pode recusar nome que exponha a criança ao ridículo; nomes compostos e estrangeiros são aceitos, e grafias muito incomuns podem gerar dúvida na hora de registrar. Quem registra, na maioria das famílias, é o pai, nos primeiros dias de vida, levando a declaração de nascido vivo do hospital. Os significados desta lista vêm da etimologia tradicional de cada língua; nomes modernos sem etimologia clara trazem a origem mais aceita. Escolha com calma, reze pelo filho enquanto escolhe, e lembre que o melhor nome é o que o casal vai gostar de chamar todos os dias.
```

- **Critério de aceite**: filtros combinam (menino + santo + letra J → José, João, Judas Tadeu…); sobrenome aparece nos
  cards; favoritos persistem; nenhum texto menciona "mãe/bebê" no significado (grep no arquivo); `tests/tools/nomes.test.ts`
  valida unicidade dos nomes e que todo `saint: true` está em `SANTOS`.

### 3.14 `calendario-de-vacinacao` — Calendário de vacinação: quem leva é você

- **Arquivo**: `src/components/ferramentas/calendario-de-vacinacao/VaccinationCalendar.tsx`.
- **Dados**: `src/lib/tools/vacinas-data.ts` — **próprio**, escrito do zero (nada do VDM). Fonte única: Calendário
  Nacional de Vacinação do Ministério da Saúde (gov.br/saude). Tipos e ponto de partida (**conferir a versão vigente na
  data da implementação** e gravar `ATUALIZADO_EM`; se divergir, o site oficial prevalece):

```ts
export interface DoseVacina { id: string; vacina: string; dose: string; idadeMeses: number; ateMeses?: number; protege: string; obs?: string }
export const ATUALIZADO_EM = "2026-10-24"; // data da conferência no gov.br/saude
export const DOSES: DoseVacina[] = [
  { id: "bcg", vacina: "BCG", dose: "dose única", idadeMeses: 0, protege: "formas graves de tuberculose", obs: "na maternidade ou UBS, até 4 anos 11 meses" },
  { id: "hepb-0", vacina: "Hepatite B", dose: "1ª dose", idadeMeses: 0, protege: "hepatite B", obs: "nas primeiras 24 h de vida" },
  { id: "penta-1", vacina: "Pentavalente (DTP + Hib + hepatite B)", dose: "1ª dose", idadeMeses: 2, protege: "difteria, tétano, coqueluche, Haemophilus b, hepatite B" },
  { id: "vip-1", vacina: "Poliomielite inativada (VIP)", dose: "1ª dose", idadeMeses: 2, protege: "poliomielite" },
  { id: "pneumo-1", vacina: "Pneumocócica 10-valente", dose: "1ª dose", idadeMeses: 2, protege: "pneumonia, meningite e otite por pneumococo" },
  { id: "rota-1", vacina: "Rotavírus humano", dose: "1ª dose", idadeMeses: 2, ateMeses: 3.5, protege: "diarreia por rotavírus", obs: "janela estreita: até 3 meses e 15 dias" },
  { id: "menc-1", vacina: "Meningocócica C", dose: "1ª dose", idadeMeses: 3, protege: "meningite C" },
  { id: "penta-2", vacina: "Pentavalente", dose: "2ª dose", idadeMeses: 4, protege: "difteria, tétano, coqueluche, Haemophilus b, hepatite B" },
  { id: "vip-2", vacina: "Poliomielite inativada (VIP)", dose: "2ª dose", idadeMeses: 4, protege: "poliomielite" },
  { id: "pneumo-2", vacina: "Pneumocócica 10-valente", dose: "2ª dose", idadeMeses: 4, protege: "doenças por pneumococo" },
  { id: "rota-2", vacina: "Rotavírus humano", dose: "2ª dose", idadeMeses: 4, ateMeses: 7.5, protege: "diarreia por rotavírus", obs: "até 7 meses e 29 dias" },
  { id: "menc-2", vacina: "Meningocócica C", dose: "2ª dose", idadeMeses: 5, protege: "meningite C" },
  { id: "penta-3", vacina: "Pentavalente", dose: "3ª dose", idadeMeses: 6, protege: "difteria, tétano, coqueluche, Haemophilus b, hepatite B" },
  { id: "vip-3", vacina: "Poliomielite inativada (VIP)", dose: "3ª dose", idadeMeses: 6, protege: "poliomielite" },
  { id: "covid-1", vacina: "COVID-19", dose: "1ª dose", idadeMeses: 6, ateMeses: 59, protege: "formas graves de covid-19", obs: "esquema conforme o calendário vigente (crianças de 6 meses a 4 anos)" },
  { id: "gripe", vacina: "Influenza", dose: "anual", idadeMeses: 6, ateMeses: 71, protege: "gripe", obs: "campanha anual; 2 doses na primeira vez" },
  { id: "fa-1", vacina: "Febre amarela", dose: "1ª dose", idadeMeses: 9, protege: "febre amarela" },
  { id: "scr-1", vacina: "Tríplice viral (SCR)", dose: "1ª dose", idadeMeses: 12, protege: "sarampo, caxumba e rubéola" },
  { id: "pneumo-r", vacina: "Pneumocócica 10-valente", dose: "reforço", idadeMeses: 12, protege: "doenças por pneumococo" },
  { id: "menc-r", vacina: "Meningocócica C", dose: "reforço", idadeMeses: 12, protege: "meningite C" },
  { id: "dtp-r1", vacina: "DTP", dose: "1º reforço", idadeMeses: 15, protege: "difteria, tétano e coqueluche" },
  { id: "vip-r", vacina: "Poliomielite inativada (VIP)", dose: "reforço", idadeMeses: 15, protege: "poliomielite", obs: "desde 2024 a VIP substitui a VOP (gotinha) no reforço" },
  { id: "hepa", vacina: "Hepatite A", dose: "dose única", idadeMeses: 15, protege: "hepatite A" },
  { id: "tetra", vacina: "Tetra viral (SCR + varicela)", dose: "dose única", idadeMeses: 15, protege: "sarampo, caxumba, rubéola e catapora" },
  { id: "dtp-r2", vacina: "DTP", dose: "2º reforço", idadeMeses: 48, protege: "difteria, tétano e coqueluche" },
  { id: "fa-r", vacina: "Febre amarela", dose: "reforço", idadeMeses: 48, protege: "febre amarela" },
  { id: "varicela-2", vacina: "Varicela", dose: "2ª dose", idadeMeses: 48, protege: "catapora" },
  { id: "hpv", vacina: "HPV", dose: "dose única", idadeMeses: 108, ateMeses: 179, protege: "câncer de colo do útero, pênis, ânus e verrugas genitais", obs: "meninos e meninas de 9 a 14 anos (dose única desde 2024)" },
  { id: "acwy", vacina: "Meningocócica ACWY", dose: "dose única/reforço", idadeMeses: 132, ateMeses: 179, protege: "meningites A, C, W e Y", obs: "11 a 14 anos" },
  { id: "dt", vacina: "dT (difteria e tétano)", dose: "reforço a cada 10 anos", idadeMeses: 84, protege: "difteria e tétano", obs: "a partir dos 7 anos, quando o esquema básico estiver completo" },
];
```

- **Entradas → saídas**: data de nascimento do filho (na Fase 5, pré-preenchida com `children.birth_date` quando logado —
  doc 07), nome opcional (só para o título). Saída: linha do tempo por idade com estado de cada dose: **feita** (checkbox,
  `localStorage` `vdp:tool:vacinas:<nascimento>`), **no prazo**, **próxima em N dias**, **atrasada** (idade atual >
  `idadeMeses` + 1 mês sem marcar) e **fora da janela** (passou `ateMeses`); bloco "Próximas 3 doses" no topo com botão
  "Adicionar à agenda" (gera `.ics` com `date-fns`, lembrete 3 dias antes); impressão. `SemaforoCallout`: `ok` tudo em
  dia; `warn` dose atrasada ("vá à UBS esta semana; vacina atrasada se recupera, não se pula"); `bad` "Sinal de alerta:
  febre acima de 39 °C que não cede, choro inconsolável por horas, convulsão ou inchaço importante após a vacina —
  procure a UPA ou ligue 192". Texto fixo: "Quem leva é você: a caderneta vai na sua carteira." Link para
  `/ferramentas/marcos-do-desenvolvimento` e `/ferramentas/checklist-da-maternidade`.
- **Entrada do registry**:

```ts
{
  slug: "calendario-de-vacinacao",
  title: "Calendário de vacinação do seu filho",
  seoTitle: "Calendário de vacinação infantil: próximas doses por idade",
  description:
    "Digite a data de nascimento e veja as vacinas do SUS por idade, o que já venceu, as próximas doses com lembrete na agenda e o que observar depois de vacinar.",
  short: "Próximas doses por idade, atrasadas e lembrete na agenda.",
  icon: Syringe,
  category: "familia",
  appCategory: "HealthApplication",
  howTo: [
    { name: "Informe a data de nascimento", text: "A linha do tempo mostra todas as doses do calendário do SUS por idade." },
    { name: "Marque as doses feitas", text: "Confira na caderneta e marque. Fica salvo neste navegador." },
    { name: "Agende as próximas", text: "Adicione as 3 próximas doses à sua agenda com lembrete 3 dias antes." },
    { name: "Observe depois da vacina", text: "Febre baixa é comum; o Semáforo do pai diz quando procurar atendimento." },
  ],
  faq: [
    { question: "O calendário é o do SUS?", answer: "Sim, o Calendário Nacional de Vacinação do Ministério da Saúde, gratuito em qualquer UBS. A data da última conferência aparece na tela; vacinas da rede privada não estão incluídas." },
    { question: "Perdi a data de uma dose. E agora?", answer: "Vá à UBS: o esquema é retomado de onde parou, sem recomeçar. Só o rotavírus tem janela que não pode passar; o restante se recupera." },
    { question: "Pode dar várias vacinas no mesmo dia?", answer: "Pode. O calendário é feito assim para proteger cedo. Vacinar junto não sobrecarrega o organismo da criança." },
    { question: "E se meu filho estiver gripado?", answer: "Resfriado leve sem febre não impede a vacina. Com febre, espere melhorar. Na dúvida, a equipe da UBS decide na hora." },
  ],
  relatedCategories: ["paternidade-por-fase", "corpo-e-saude-do-homem"],
  relatedTerms: ["vacina", "calendário de vacinação", "UBS", "caderneta", "recém-nascido"],
  disclaimer: "Informação educativa baseada no calendário público vigente na data indicada; a caderneta e a equipe de saúde prevalecem. Reação grave após vacina: procure atendimento ou ligue 192.",
  component: L(() => import("@/components/ferramentas/calendario-de-vacinacao/VaccinationCalendar")),
},
```

- **Como usar** (`COMO_USAR["calendario-de-vacinacao"]`):

```text
Vacina de filho não é assunto só da mãe. O pai que acompanha o calendário, marca a data e leva a criança à UBS está protegendo a família de doenças que ainda matam no Brasil e dividindo de verdade a carga da casa. Esta ferramenta transforma o calendário público do SUS numa linha do tempo do seu filho, com as doses feitas, as próximas e as atrasadas.

## Comece pela data de nascimento

Digite a data e a tela monta a linha do tempo por idade: ao nascer, dois meses, três, quatro, cinco, seis, nove, doze, quinze meses, quatro anos e a adolescência. Cada dose mostra a vacina, de que doença protege e observações importantes, como a janela estreita do rotavírus, que não pode passar. Pegue a caderneta e marque o que já foi feito; a marcação fica salva neste navegador e, se você tiver conta na Área do Pai, a data do filho vem preenchida sozinha.

## Leia os estados

Feita é a dose marcada por você. No prazo é a que está na idade certa agora. Próxima mostra quantos dias faltam. Atrasada é a dose cuja idade já passou há mais de um mês sem marcação: não se preocupe, o esquema é retomado de onde parou, sem recomeçar; vá à UBS esta semana. Fora da janela aparece só nas vacinas com limite de idade, e nesse caso a equipe de saúde orienta o que fazer.

## Agende como quem agenda reunião

O bloco das próximas três doses tem o botão de adicionar à agenda: ele cria o compromisso no seu celular com lembrete três dias antes. Trate como compromisso de trabalho. Leve a caderneta na sua carteira; quem leva é você.

## Depois da vacina

Febre baixa, dor no local e irritação nas primeiras quarenta e oito horas são comuns e passam com colo, líquido e, se o pediatra orientou, antitérmico. O Semáforo do pai aponta o que não é normal: febre alta que não cede, choro inconsolável por horas, convulsão ou inchaço importante pedem atendimento imediato na UPA ou ligação para o 192. Resfriado leve sem febre não impede vacinar; com febre, espere melhorar.

O calendário é o Nacional de Vacinação do Ministério da Saúde, gratuito em qualquer UBS, conferido na data indicada na tela. Vacinas da rede privada não estão aqui. A caderneta e a equipe de saúde sempre prevalecem sobre qualquer ferramenta.
```

- **Critério de aceite**: nascimento há 4 meses e 20 dias → BCG, hepatite B, doses de 2 meses "atrasadas" se não marcadas,
  doses de 4 meses "no prazo", meningo C de 5 meses "próxima em ~10 dias"; `.ics` abre no calendário com 3 eventos; marcação
  persiste; `ATUALIZADO_EM` visível; `tests/tools/vacinas.test.ts` valida ids únicos, `idadeMeses` crescente por vacina e
  a função `estadoDaDose()` nos 5 estados.

### 3.15 `marcos-do-desenvolvimento` — Marcos do desenvolvimento: o que o pai faz em cada fase

- **Arquivo**: `src/components/ferramentas/marcos-do-desenvolvimento/DevelopmentMilestones.tsx`.
- **Dados**: `src/lib/tools/marcos-data.ts` — **próprio**, escrito do zero (nada do VDM) a partir da **Caderneta da
  Criança** do Ministério da Saúde (marcos por faixa etária), na voz do pai. Tipos e ponto de partida (9 fases; completar
  as demais no mesmo padrão, 3–5 marcos por domínio, 3–4 ações do pai, 1 sinal de alerta):

```ts
export type Dominio = "motor" | "linguagem" | "social" | "cognitivo";
export interface FaseMarco { meses: number; titulo: string; marcos: Array<{ dominio: Dominio; texto: string }>; oQueOPaiFaz: string[]; sinalDeAtencao: string; sinalDeAlerta: string }
export const ATUALIZADO_EM = "2026-10-24"; // conferência na Caderneta da Criança (gov.br/saude)
export const FASES: FaseMarco[] = [
  { meses: 1, titulo: "1 mês", marcos: [
      { dominio: "motor", texto: "Mexe braços e pernas; de bruços, vira a cabeça para o lado" },
      { dominio: "social", texto: "Fixa o olhar no rosto de quem fala com ele" },
      { dominio: "linguagem", texto: "Reage a som alto; chora para pedir" } ],
    oQueOPaiFaz: ["Converse olhando nos olhos, a 30 cm do rosto", "Faça contato pele a pele depois do banho", "Coloque de bruços por 1 a 2 minutos, acordado e vigiado"],
    sinalDeAtencao: "Sinal de atenção: se não fixa o olhar ou não reage a som, observe e comente na consulta do mês.",
    sinalDeAlerta: "Sinal de alerta: não suga, está muito molinho ou muito rígido, ou não ganha peso — procure o pediatra ou a UBS hoje." },
  { meses: 2, titulo: "2 meses", marcos: [
      { dominio: "social", texto: "Sorri em resposta ao seu sorriso" },
      { dominio: "motor", texto: "Abre as mãos; de bruços, levanta a cabeça por instantes" },
      { dominio: "linguagem", texto: "Emite sons de vogal (\"aaa\", \"ooo\")" } ],
    oQueOPaiFaz: ["Responda cada som com uma frase, como numa conversa", "Cante baixo a mesma música todo dia", "Mostre objetos coloridos a 20–30 cm e mova devagar"],
    sinalDeAtencao: "Sinal de atenção: ainda sem sorriso social no fim do 2º mês — observe e fale com o pediatra.",
    sinalDeAlerta: "Sinal de alerta: não reage a barulho, não acompanha o rosto com os olhos ou perdeu algo que já fazia — pediatra agora." },
  { meses: 4, titulo: "4 meses", marcos: [
      { dominio: "motor", texto: "Sustenta a cabeça firme; leva as mãos à boca; segura o chocalho" },
      { dominio: "social", texto: "Ri alto; gosta de brincar e reclama quando a brincadeira para" },
      { dominio: "cognitivo", texto: "Acompanha objeto com os olhos em todas as direções" } ],
    oQueOPaiFaz: ["Brinque de esconder o rosto", "Ofereça objetos seguros para pegar e levar à boca", "Leia em voz alta: o ritmo da sua voz importa mais que o texto"],
    sinalDeAtencao: "Sinal de atenção: cabeça ainda cai para trás ao ser puxado para sentar — comente na consulta.",
    sinalDeAlerta: "Sinal de alerta: não sustenta a cabeça, não leva as mãos à boca, não sorri — pediatra agora." },
  { meses: 6, titulo: "6 meses", marcos: [
      { dominio: "motor", texto: "Rola nos dois sentidos; senta com apoio; passa objeto de uma mão para a outra" },
      { dominio: "linguagem", texto: "Balbucia consoantes (\"ba\", \"da\"); vira-se para a voz" },
      { dominio: "social", texto: "Reconhece pessoas conhecidas e estranha desconhecidos" } ],
    oQueOPaiFaz: ["Comece a introdução alimentar junto com a esposa: sente-o à mesa com vocês", "Deixe cair e pegar objetos (é brincadeira, não bagunça)", "Brinque no chão, de bruços, com você na mesma altura"],
    sinalDeAtencao: "Sinal de atenção: não rola nem tenta alcançar objetos — observe por 2 semanas e comente.",
    sinalDeAlerta: "Sinal de alerta: não balbucia, não vira para a voz, não sustenta peso nas pernas quando apoiado — pediatra agora." },
  { meses: 9, titulo: "9 meses", marcos: [ { dominio: "motor", texto: "Senta sem apoio; engatinha ou se arrasta; faz pinça com os dedos" }, { dominio: "linguagem", texto: "Diz \"mama\"/\"papa\" sem sentido ainda; entende \"não\"" }, { dominio: "social", texto: "Dá tchau; procura objeto escondido" } ],
    oQueOPaiFaz: ["Esconda um brinquedo sob o pano e deixe-o achar", "Ofereça pedaços de comida para a pinça", "Faça o 'cadê? achou!' todo dia"],
    sinalDeAtencao: "Sinal de atenção: não senta sem apoio — comente na consulta dos 9 meses.", sinalDeAlerta: "Sinal de alerta: não transfere objetos entre as mãos, não balbucia, não responde ao nome — pediatra agora." },
  { meses: 12, titulo: "12 meses", marcos: [ { dominio: "motor", texto: "Fica em pé com apoio; dá passos segurando; anda sozinho entre 12 e 15 meses" }, { dominio: "linguagem", texto: "Fala 1 a 3 palavras com sentido; aponta para pedir" }, { dominio: "social", texto: "Imita gestos; estranha; mostra afeto" } ],
    oQueOPaiFaz: ["Nomeie tudo o que ele aponta", "Brinque de empilhar e derrubar", "Caminhe segurando as duas mãos dele, depois uma"],
    sinalDeAtencao: "Sinal de atenção: não aponta nem imita gestos — observe e comente.", sinalDeAlerta: "Sinal de alerta: não fica em pé com apoio, não fala nenhuma palavra, não procura você quando se machuca — pediatra agora." },
  { meses: 18, titulo: "18 meses", marcos: [ { dominio: "motor", texto: "Anda bem; sobe degrau com apoio; rabisca" }, { dominio: "linguagem", texto: "Fala 10 a 20 palavras; obedece ordem simples" }, { dominio: "social", texto: "Brinca de faz de conta simples; quer fazer sozinho" } ],
    oQueOPaiFaz: ["Dê tarefas pequenas: guardar o brinquedo, levar a fralda ao lixo", "Leia o mesmo livro mil vezes, apontando figuras", "Brinque de bola no quintal"],
    sinalDeAtencao: "Sinal de atenção: menos de 6 palavras ou não aponta para mostrar — comente na consulta.", sinalDeAlerta: "Sinal de alerta: não anda sozinho, não olha quando chamado, perdeu palavras que falava — pediatra agora." },
  { meses: 24, titulo: "2 anos", marcos: [ { dominio: "motor", texto: "Corre; chuta bola; sobe e desce escada com apoio" }, { dominio: "linguagem", texto: "Junta 2 palavras (\"quer água\"); metade do que fala é compreensível" }, { dominio: "social", texto: "Brinca ao lado de outras crianças; birra é esperada" } ],
    oQueOPaiFaz: ["Converse em frases completas e espere a resposta", "Ensine a lavar as mãos e a guardar os brinquedos", "Inclua-o em tarefas de homem da casa: regar planta, levar o lixo com você"],
    sinalDeAtencao: "Sinal de atenção: não junta 2 palavras ou não imita — comente na consulta dos 2 anos.", sinalDeAlerta: "Sinal de alerta: não anda com firmeza, não fala palavras com sentido, não faz contato visual, perdeu habilidades — pediatra agora." },
  { meses: 36, titulo: "3 anos", marcos: [ { dominio: "motor", texto: "Pedala triciclo; pula com os dois pés; desenha círculo" }, { dominio: "linguagem", texto: "Frases de 3 palavras; diz nome e idade; estranhos entendem a maior parte" }, { dominio: "social", texto: "Brinca com outras crianças; começa a dividir; controla o xixi de dia" } ],
    oQueOPaiFaz: ["Leve-o para brincar com outras crianças toda semana", "Conte histórias da sua infância e da fé", "Deixe-o ajudar na oficina, na horta e no churrasco com tarefas seguras"],
    sinalDeAtencao: "Sinal de atenção: fala pouco compreensível ou não brinca com outras crianças — comente na consulta.", sinalDeAlerta: "Sinal de alerta: não forma frases, não se interessa por outras crianças, perdeu habilidades — pediatra agora." },
];
```

- **Entradas → saídas**: data de nascimento ou idade em meses (Fase 5: `children.birth_date`). Saída: a fase atual em
  destaque (marcos por domínio em chips, "O que o pai faz" em lista, 3 callouts `SemaforoCallout` — `ok` "Sinal verde:
  marcos da fase presentes: siga brincando e observando", `warn` = `sinalDeAtencao`, `bad` = `sinalDeAlerta`), navegação
  para a fase anterior/seguinte e "o que vem aí" (próxima fase), checklist "vi meu filho fazer" por marco (`localStorage`),
  link para `/ferramentas/calendario-de-vacinacao` e para os artigos da categoria `paternidade-por-fase`. Nunca fala em
  "atraso" como diagnóstico; só "observar e comentar com o pediatra".
- **Entrada do registry**:

```ts
{
  slug: "marcos-do-desenvolvimento",
  title: "Marcos do desenvolvimento: o que o pai faz em cada fase",
  seoTitle: "Marcos do desenvolvimento do filho: o que esperar por idade",
  description:
    "Veja o que o seu filho costuma fazer em cada idade, do 1º mês aos 3 anos, o que o pai pode fazer para estimular e quais sinais pedem conversa com o pediatra.",
  short: "O que esperar por idade, o que o pai faz e quando falar com o pediatra.",
  icon: Footprints,
  category: "familia",
  appCategory: "HealthApplication",
  howTo: [
    { name: "Informe a idade do filho", text: "Data de nascimento ou meses. A fase atual abre em destaque." },
    { name: "Confira os marcos", text: "Motor, linguagem, social e cognitivo. Marque o que você já viu ele fazer." },
    { name: "Faça a sua parte", text: "Cada fase tem 3 a 4 ações simples do pai, para o dia a dia." },
    { name: "Olhe o Semáforo", text: "Atenção é observar e comentar; alerta é procurar o pediatra agora." },
  ],
  faq: [
    { question: "Meu filho não faz um marco da idade. Ele está atrasado?", answer: "Cada criança tem seu ritmo e os marcos são faixas, não datas. Um marco ausente pede observação e conversa na próxima consulta; vários ausentes ou uma habilidade perdida pedem avaliação logo." },
    { question: "De onde vêm os marcos?", answer: "Da Caderneta da Criança do Ministério da Saúde, a mesma que o pediatra usa nas consultas, reescritos em linguagem de pai." },
    { question: "O que o pai faz de diferente da mãe?", answer: "Brincadeira física, voz grave, desafio controlado e o exemplo de homem. Estudos mostram que o envolvimento do pai melhora linguagem e autocontrole. Não é substituir a mãe; é somar." },
    { question: "Tela atrapalha?", answer: "Antes dos 2 anos, a recomendação é zero tela. Depois, pouco e com você junto. Nenhuma tela substitui conversa, chão e quintal." },
  ],
  relatedCategories: ["paternidade-por-fase", "esporte-e-lazer-com-os-filhos"],
  relatedTerms: ["desenvolvimento infantil", "marcos", "primeiro ano", "estimular o bebê", "pediatra"],
  disclaimer: "Conteúdo educativo baseado na Caderneta da Criança; não substitui a avaliação do pediatra. Habilidade perdida ou vários marcos ausentes: procure o pediatra.",
  component: L(() => import("@/components/ferramentas/marcos-do-desenvolvimento/DevelopmentMilestones")),
},
```

- **Como usar** (`COMO_USAR["marcos-do-desenvolvimento"]`):

```text
Pai presente conhece o filho. Sabe o que esperar em cada idade, percebe quando algo não vai bem e, principalmente, sabe o que fazer para ajudar. Esta ferramenta traduz os marcos do desenvolvimento da Caderneta da Criança, a mesma que o pediatra usa, para a linguagem de quem chega do trabalho e quer aproveitar a hora que tem com o filho.

## Informe a idade

Digite a data de nascimento ou a idade em meses. A fase atual abre em destaque, com os marcos divididos em quatro áreas: motor, linguagem, social e cognitivo. Marque o que você já viu o seu filho fazer; a marcação fica salva neste navegador. Navegue para a fase anterior, se quiser conferir o que ficou para trás, e para a seguinte, para saber o que vem aí.

## Faça a sua parte

Em cada fase há três ou quatro ações do pai, pensadas para o dia a dia real: conversar olhando nos olhos, colocar de bruços por um minuto, esconder o rosto, ler em voz alta, brincar no chão, dar tarefas pequenas, levar para o quintal, incluir nas tarefas de homem da casa. Nada custa dinheiro e tudo cabe em quinze minutos. A ciência é clara: o envolvimento do pai melhora linguagem, autocontrole e segurança da criança. Não é substituir a mãe; é somar o que só o pai dá.

## Leia o Semáforo com calma

Marcos são faixas, não datas. Um filho que ainda não anda aos doze meses está dentro da normalidade; a maioria anda entre doze e quinze. O sinal verde diz que a fase está indo bem. O sinal de atenção aponta um marco que costuma estar presente e ainda não apareceu: observe por algumas semanas e comente na próxima consulta. O sinal de alerta é diferente: habilidade que o filho já tinha e perdeu, ausência de contato visual, não reagir a sons ou ao nome, ou vários marcos ausentes ao mesmo tempo pedem o pediatra agora, não a próxima consulta de rotina. Quanto mais cedo se avalia, melhor o resultado.

## Telas, sono e exemplo

Antes dos dois anos a recomendação é nenhuma tela. Depois, pouco e com você ao lado. Sono regular e rotina previsível fazem mais pelo desenvolvimento do que qualquer brinquedo educativo. E o maior estímulo que um menino ou uma menina recebe é ver o pai tratando a mãe com respeito, rezando com a família e cumprindo a palavra. Esta ferramenta é educativa e não substitui a avaliação do pediatra; a Caderneta da Criança continua sendo o documento oficial.
```

- **Critério de aceite**: 7 meses abre a fase de 6 meses com "o que vem aí" = 9 meses; os 3 callouts na ordem certa;
  marcação persiste; nenhuma frase usa "atrasado" como diagnóstico; `tests/tools/marcos.test.ts` valida `meses` crescente,
  ≥ 3 marcos e ≥ 3 ações por fase, e que `sinalDeAlerta` termina com orientação de procurar o pediatra/UBS.

### 3.16 `imc-e-gasto-calorico` — IMC e gasto calórico do homem

- **Arquivo**: `src/components/ferramentas/imc-e-gasto-calorico/BmiAndCalories.tsx`.
- **Lógica**: `src/lib/tools/saude.ts`:

```ts
export const imc = (kg: number, cm: number) => kg / (cm / 100) ** 2;
export const classeImc = (v: number) => v < 18.5 ? "abaixo do peso" : v < 25 ? "peso adequado" : v < 30 ? "sobrepeso" : v < 35 ? "obesidade grau I" : v < 40 ? "obesidade grau II" : "obesidade grau III"; // OMS
export const tmbMifflin = (kg: number, cm: number, idade: number, sexo: "homem" | "mulher") => 10 * kg + 6.25 * cm - 5 * idade + (sexo === "homem" ? 5 : -161);
export const FATOR_ATIVIDADE = { sedentario: 1.2, leve: 1.375, moderado: 1.55, intenso: 1.725, atleta: 1.9 } as const;
export const gastoDiario = (tmb: number, nivel: keyof typeof FATOR_ATIVIDADE) => tmb * FATOR_ATIVIDADE[nivel];
export const metaCalorica = (get: number, objetivo: "manter" | "perder" | "ganhar") => objetivo === "manter" ? get : objetivo === "perder" ? get - 500 : get + 300; // ±0,5 kg/semana aprox.
export const aguaDiariaMl = (kg: number) => kg * 35;
```

- **Entradas → saídas**: sexo (padrão homem; "para a esposa" troca a fórmula), idade, altura, peso, circunferência da
  cintura (opcional), nível de atividade, objetivo. Saída: IMC com classe OMS e barra colorida, TMB, gasto diário total,
  meta calórica para o objetivo (faixa ± 100 kcal), água por dia, "cintura e risco" (homem > 94 cm atenção, > 102 cm
  risco aumentado — OMS). `SemaforoCallout`: `ok` IMC 18,5–24,9 e cintura < 94; `warn` IMC 25–29,9 ou abaixo de 18,5
  ou cintura 94–102 ("ajuste prato e movimento; check-up anual"); `bad` IMC ≥ 30 ou cintura > 102 ("Sinal de alerta: …
  procure um médico para avaliar pressão, glicose e colesterol antes de qualquer dieta ou treino intenso").
- **Entrada do registry**:

```ts
{
  slug: "imc-e-gasto-calorico",
  title: "IMC e gasto calórico do homem",
  seoTitle: "Calculadora de IMC e gasto calórico para homens",
  description:
    "Calcule o seu IMC, a taxa metabólica basal e o gasto calórico diário pelo nível de atividade, com a meta de calorias para o seu objetivo e a água por dia.",
  short: "IMC, metabolismo basal, gasto diário e meta de calorias.",
  icon: HeartPulse,
  category: "saude",
  appCategory: "HealthApplication",
  howTo: [
    { name: "Informe idade, altura e peso", text: "Peso de manhã, em jejum, dá o número mais estável." },
    { name: "Meça a cintura (opcional)", text: "Na altura do umbigo, sem apertar. É o melhor indicador de risco para o homem." },
    { name: "Escolha atividade e objetivo", text: "Sedentário a atleta; manter, perder ou ganhar peso." },
    { name: "Leia o resultado e o Semáforo", text: "Meta de calorias, água por dia e quando procurar um médico." },
  ],
  faq: [
    { question: "IMC serve para quem treina pesado?", answer: "Pouco: músculo pesa e o IMC não distingue gordura de massa magra. Para quem treina, a cintura e o percentual de gordura dizem mais." },
    { question: "Quantas calorias cortar para perder peso?", answer: "Cerca de 500 por dia abaixo do gasto total dá perda de meio quilo por semana, sustentável. Cortar mais que isso sem acompanhamento costuma dar efeito rebote." },
    { question: "O que é taxa metabólica basal?", answer: "A energia que o corpo gasta em repouso só para funcionar. Multiplicada pelo fator de atividade vira o gasto diário total." },
    { question: "Preciso de médico para começar a treinar?", answer: "Acima de 40 anos, com sobrepeso, pressão alta ou histórico na família, sim: um check-up antes evita susto. Abaixo disso, comece leve e progrida." },
  ],
  relatedCategories: ["corpo-e-saude-do-homem"],
  relatedTerms: ["IMC", "calorias", "emagrecer", "check-up", "treino"],
  disclaimer: "Cálculo educativo com fórmulas populacionais; não substitui avaliação médica ou nutricional. IMC alto, cintura acima de 102 cm ou sintomas: procure um médico.",
  component: L(() => import("@/components/ferramentas/imc-e-gasto-calorico/BmiAndCalories")),
},
```

- **Como usar** (`COMO_USAR["imc-e-gasto-calorico"]`):

```text
Homem que cuida da família precisa estar vivo e forte para ela. Não é vaidade; é responsabilidade. Esta calculadora dá os quatro números básicos da saúde do homem adulto: o índice de massa corporal, a taxa metabólica basal, o gasto calórico diário e a meta de calorias para o seu objetivo, além da água que você deveria beber por dia.

## O que informar

Idade, altura e peso, de preferência medido de manhã e em jejum. A circunferência da cintura é opcional, mas é o número que mais importa para o homem: meça na altura do umbigo, sem apertar a fita. Escolha o nível de atividade com honestidade: sedentário é quem trabalha sentado e não treina; leve é quem caminha e faz tarefas de casa; moderado treina três a cinco vezes por semana; intenso, seis ou sete; atleta é trabalho físico pesado mais treino. Por fim, o objetivo: manter, perder ou ganhar peso.

## Como ler cada número

O IMC compara peso e altura e classifica em faixas da Organização Mundial da Saúde. Ele é útil para a maioria, mas falha em quem tem muita massa muscular; nesse caso a cintura diz mais. A taxa metabólica basal é a energia que o corpo gasta em repouso. O gasto diário é essa taxa multiplicada pelo fator de atividade: é quanto você consome num dia normal. A meta calórica ajusta esse gasto ao objetivo: cerca de quinhentas calorias a menos para perder meio quilo por semana, trezentas a mais para ganhar massa com treino. A água recomendada é proporcional ao peso.

## O Semáforo do pai

Verde é IMC na faixa adequada com cintura abaixo de noventa e quatro centímetros. Atenção é sobrepeso, peso abaixo do normal ou cintura entre noventa e quatro e cento e dois: ajuste o prato, mexa o corpo e faça o check-up anual. Alerta é obesidade ou cintura acima de cento e dois centímetros: antes de qualquer dieta ou treino intenso, procure um médico para avaliar pressão, glicose e colesterol. Não é exagero; é o que evita o infarto aos quarenta e cinco.

## Como usar o resultado

Escolha um objetivo de cada vez. Para perder peso, corte o que não alimenta: refrigerante, álcool em excesso e lanche de madrugada. Para ganhar massa, coma proteína em todas as refeições e durma. Caminhe trinta minutos por dia; leve o filho junto. Refaça a conta a cada mês e anote. Esta ferramenta usa fórmulas populacionais e é educativa: não substitui médico nem nutricionista, e quem tem doença crônica deve seguir a orientação profissional.
```

- **Critério de aceite**: 85 kg, 178 cm, 38 anos, moderado → IMC 26,8 (sobrepeso), TMB ≈ 1.782 kcal, gasto ≈ 2.762 kcal;
  cintura 105 → tom `bad`; "para a esposa" muda a fórmula; `tests/tools/saude.test.ts` cobre os 3 cálculos e as classes.

### 3.17 `checklist-da-maternidade` — Mala da maternidade: checklist do pai

- **Arquivo**: `src/components/ferramentas/checklist-da-maternidade/HospitalBagChecklist.tsx`. Título na tela: **"Mala da
  maternidade: checklist do pai"**. Slug mantido (`checklist-da-maternidade`, doc 02 §1.3); "maternidade" = o hospital.
  Conteúdo 100 % do pai: o `enxoval-data.ts` do VDM **não** é usado nem consultado.
- **Dados**: `src/lib/tools/checklist-maternidade-data.ts`:

```ts
export interface ItemChecklist { id: string; texto: string; quando: "36-semanas" | "dia-do-parto" | "no-hospital" | "7-dias" | "30-dias"; link?: string; obs?: string }
export interface GrupoChecklist { id: string; titulo: string; itens: ItemChecklist[] }
export const GRUPOS: GrupoChecklist[] = [
  { id: "documentos", titulo: "Documentos (quem leva é você)", itens: [
    { id: "rg", texto: "RG ou CNH de vocês dois", quando: "36-semanas" },
    { id: "cartao-plano", texto: "Cartão do plano de saúde ou cartão SUS da esposa", quando: "36-semanas" },
    { id: "pre-natal", texto: "Cartão do pré-natal e exames (ultrassons, tipagem sanguínea)", quando: "36-semanas" },
    { id: "certidao", texto: "Certidão de casamento (facilita o registro em nome dos dois)", quando: "36-semanas" },
    { id: "plano-parto", texto: "Plano de parto impresso, se houver", quando: "36-semanas" },
    { id: "telefones", texto: "Lista de telefones: maternidade, obstetra, pediatra, avós, quem fica com os outros filhos", quando: "36-semanas" } ] },
  { id: "mala-do-pai", titulo: "A sua mala", itens: [
    { id: "roupas", texto: "2 mudas de roupa confortável e chinelo", quando: "36-semanas" },
    { id: "carregador", texto: "Carregador com cabo longo e bateria portátil", quando: "36-semanas" },
    { id: "dinheiro", texto: "Dinheiro trocado e cartão para estacionamento, lanche e farmácia", quando: "36-semanas" },
    { id: "remedios", texto: "Seus remédios de uso contínuo", quando: "36-semanas" },
    { id: "higiene", texto: "Escova de dente, desodorante, travesseiro pequeno", quando: "36-semanas" },
    { id: "lanche", texto: "Lanche seco e garrafa de água (o parto pode durar horas)", quando: "dia-do-parto" } ] },
  { id: "carro", titulo: "Carro e caminho", itens: [
    { id: "cadeirinha", texto: "Cadeirinha instalada e conferida (bebê conforto, voltado para trás)", quando: "36-semanas", link: "/categoria/carro-e-moto" },
    { id: "tanque", texto: "Tanque cheio a partir da 36ª semana", quando: "36-semanas" },
    { id: "rota", texto: "Rota principal e alternativa até a maternidade testadas", quando: "36-semanas" },
    { id: "chaves", texto: "Chaves do carro e de casa num lugar fixo", quando: "dia-do-parto" } ] },
  { id: "no-hospital", titulo: "No hospital", itens: [
    { id: "acompanhante", texto: "Você tem direito de acompanhar o parto (Lei 11.108/2005); confirme a regra da maternidade", quando: "no-hospital", link: "/post/lei-do-acompanhante-pai-no-parto" },
    { id: "dnv", texto: "Pegar a Declaração de Nascido Vivo (DNV) antes da alta", quando: "no-hospital" },
    { id: "testes", texto: "Perguntar sobre teste do pezinho, da orelhinha, do olhinho e do coraçãozinho", quando: "no-hospital" },
    { id: "vacinas", texto: "Conferir BCG e hepatite B na caderneta", quando: "no-hospital", link: "/ferramentas/calendario-de-vacinacao" } ] },
  { id: "primeira-semana", titulo: "Primeiros 7 dias", itens: [
    { id: "registro", texto: "Registrar o filho no cartório (gratuito; prazo de 15 dias, até 3 meses se morar a mais de 30 km)", quando: "7-dias", link: "/post/como-registrar-o-filho-prazo-e-documentos" },
    { id: "rh", texto: "Avisar o RH e pedir a licença-paternidade com a certidão", quando: "7-dias", link: "/ferramentas/licenca-paternidade" },
    { id: "pediatra", texto: "Marcar a primeira consulta do pediatra na primeira semana", quando: "7-dias" },
    { id: "descanso", texto: "Garantir o descanso da esposa: você assume visitas, casa e comida", quando: "7-dias" } ] },
  { id: "primeiro-mes", titulo: "Até 30 dias", itens: [
    { id: "plano-bebe", texto: "Incluir o bebê no plano de saúde em até 30 dias (sem carência)", quando: "30-dias" },
    { id: "cpf", texto: "CPF do bebê (sai junto com a certidão) e salário-família/benefícios no RH", quando: "30-dias", link: "/post/salario-familia-quem-tem-direito" },
    { id: "orcamento", texto: "Abrir a linha do filho no Orçamento familiar", quando: "30-dias", link: "/ferramentas/orcamento-familiar" } ] },
];
```

  Os `link` para `/post/<slug>` são do doc 12 (#136 `lei-do-acompanhante-pai-no-parto`, #137
  `como-registrar-o-filho-prazo-e-documentos`, #138 `salario-familia-quem-tem-direito`, #4 `mala-da-maternidade-do-pai`);
  a tela só renderiza o link se o post estiver publicado (loader checa `posts.status`), senão mostra o texto sem link.
- **Entradas → saídas**: data prevista do parto (opcional). Saída: grupos com checkboxes (persistência `localStorage`
  `vdp:tool:checklist-da-maternidade`), progresso em %, filtro por "quando" (36 semanas / dia do parto / hospital / 7 dias /
  30 dias), contagem regressiva "faltam N dias para a 36ª semana / para a data prevista", botão imprimir e compartilhar
  ("Checklist do pai: 12 de 27 itens prontos"). `SemaforoCallout`: `ok` mala e documentos prontos antes da 36ª semana;
  `warn` 36ª semana passou com itens de documentos/carro em aberto; `bad` "Sinal de alerta: bolsa rota, sangramento, dor
  de cabeça forte com visão turva ou pressão alta, contrações regulares antes de 37 semanas — leve a esposa à maternidade
  agora ou ligue 192". Link de destaque para o artigo `/post/mala-da-maternidade-do-pai`.
- **Entrada do registry**:

```ts
{
  slug: "checklist-da-maternidade",
  title: "Mala da maternidade: checklist do pai",
  seoTitle: "Mala da maternidade: o checklist do pai para o dia do parto",
  description:
    "Documentos, a sua mala, o carro, o hospital e os primeiros 30 dias: o checklist do pai para o dia do parto, com progresso, prazos e links de cada tarefa.",
  short: "Documentos, mala, carro e as tarefas do pai do parto aos 30 dias.",
  icon: ClipboardList,
  category: "familia",
  appCategory: "LifestyleApplication",
  howTo: [
    { name: "Informe a data prevista", text: "A contagem regressiva mostra quanto falta para a 36ª semana, quando tudo deve estar pronto." },
    { name: "Marque o que já está feito", text: "Fica salvo neste navegador. O progresso aparece no topo." },
    { name: "Filtre por momento", text: "36 semanas, dia do parto, no hospital, 7 dias e 30 dias." },
    { name: "Imprima e cole na geladeira", text: "Ou compartilhe com a esposa para ela ver que o pai está no controle." },
  ],
  faq: [
    { question: "O que o pai leva que a mãe não leva?", answer: "Os documentos de vocês dois, o cartão do pré-natal, dinheiro trocado, carregador e a própria muda de roupa. A mala do bebê e da mãe é outra lista; esta é a sua." },
    { question: "Posso ficar no parto?", answer: "Sim. A Lei 11.108/2005 garante um acompanhante de livre escolha da gestante no parto, inclusive em cesárea, no SUS e na rede privada. Confirme com a maternidade como funciona lá." },
    { question: "Quanto tempo tenho para registrar?", answer: "15 dias após o nascimento, no cartório, de graça; até 3 meses se você morar a mais de 30 km do cartório. Leve a DNV do hospital e os documentos." },
    { question: "Quando incluir o bebê no plano de saúde?", answer: "Em até 30 dias do nascimento, para entrar sem carência como dependente. Passou o prazo, as regras de carência valem." },
  ],
  relatedCategories: ["paternidade-por-fase", "direitos-do-pai"],
  relatedTerms: ["mala da maternidade", "dia do parto", "registro do bebê", "acompanhante", "licença-paternidade"],
  disclaimer: "Lista educativa de organização; prazos legais citados valem na data da última revisão. Sintomas de urgência na gestante: maternidade ou 192.",
  component: L(() => import("@/components/ferramentas/checklist-da-maternidade/HospitalBagChecklist")),
},
```

- **Como usar** (`COMO_USAR["checklist-da-maternidade"]`):

```text
No dia do parto a mãe tem um trabalho: dar à luz. Todo o resto é do pai. Documento, carro, estacionamento, telefonema, registro, plano de saúde, pediatra. Esta lista é a sua, não a da mala do bebê: é o que o homem precisa ter pronto, no bolso e na cabeça, para a esposa chegar à maternidade sem precisar pensar em nada além do filho.

## Comece na 36ª semana

Informe a data prevista e a contagem regressiva mostra quanto falta para a trigésima sexta semana, o prazo para estar tudo pronto, porque o parto pode vir antes. A partir daí, tanque cheio, mala no carro, rota testada e documentos juntos. Marque os itens conforme avança; o progresso fica no topo e salvo neste navegador. O filtro por momento separa o que é para a semana trinta e seis, para o dia, para o hospital, para a primeira semana e para o primeiro mês.

## Documentos: quem leva é você

RG ou CNH de vocês dois, cartão do plano ou do SUS, cartão do pré-natal com os exames, certidão de casamento, que facilita o registro em nome dos dois, e a lista de telefones. Guarde tudo numa pasta só, que fica na sua mala, não na dela. No hospital, pegue a Declaração de Nascido Vivo antes da alta: sem ela não há registro. Pergunte sobre o teste do pezinho, da orelhinha, do olhinho e do coraçãozinho, e confira a BCG e a hepatite B na caderneta.

## O seu direito de estar lá

A lei garante à gestante um acompanhante de livre escolha no parto, inclusive na cesárea, no SUS e na rede privada. Confirme com a maternidade as regras da casa, leve roupa confortável, chinelo, carregador com cabo longo, lanche e água. Parto demora; pai desmaiado de fome não ajuda ninguém.

## Primeira semana e primeiro mês

Registre o filho no cartório nos primeiros dias; é gratuito, o prazo é de quinze dias e o CPF sai junto. Avise o RH e peça a licença-paternidade com a certidão na mão. Marque a primeira consulta do pediatra. Inclua o bebê no plano de saúde dentro de trinta dias para entrar sem carência. Abra a linha do filho no orçamento. E assuma a casa: visitas, comida, louça e os outros filhos são seus até a esposa se recuperar.

## O Semáforo do pai

Verde é tudo pronto antes da trigésima sexta semana. Atenção é prazo passado com documento ou carro pendente. Alerta é sinal de urgência na gestante: bolsa rota, sangramento, dor de cabeça forte com visão turva, pressão alta ou contrações regulares antes das trinta e sete semanas. Nesse caso não se consulta lista: leve a esposa à maternidade agora ou ligue 192.
```

- **Critério de aceite**: data prevista daqui a 60 dias → contagem para a 36ª semana (data − 28 dias) correta; marcação
  persiste; filtro por momento funciona; links só para posts publicados; impressão limpa; os 3 callouts na ordem;
  `tests/tools/checklist-maternidade.test.ts` valida ids únicos, `quando` válido e que todo `link` começa com `/`.

### 3.18 Ideias futuras (não fazem parte desta fase)

Slugs citados em versões antigas de outros documentos; **não criar rota nem card**. Entram no backlog pós-F8
(`PLANO-MESTRE.md`, "Surpresas"), quando o dono decidir:

| Ideia | Onde foi citada | Observação |
|---|---|---|
| `decimo-terceiro`, `ferias`, `horas-extras` | checklist 4.8 (versão antiga) | Calculadoras trabalhistas; dependem de tabela de INSS/IR anual (manutenção todo janeiro) |
| `consumo-de-combustivel` | checklist 4.8 (versão antiga) | Coberto parcialmente pela categoria "Consumo" do `conversor-de-unidades` (§3.11) |
| `check-up-do-pai` | doc 11 §5.5 (e-mail) | Vira artigo hub #59 `check-up-do-homem-guia` (doc 12) + `imc-e-gasto-calorico`; o e-mail do doc 11 deve linkar `/ferramentas/imc-e-gasto-calorico` |
| `15-minutos` ("15 minutos com seu filho") | doc 01 §3.4/§4.2, doc 11 §5.5 | Ideia forte (PLANO-MESTRE #17): ferramenta + trilha na Fase 7; até lá, o e-mail linka `/ferramentas/marcos-do-desenvolvimento` (que já traz "o que o pai faz") |
| `carne-x-preparo` | doc 01 §3.4 | É a aba 2 de `cortes-de-carne` (§3.6) |
| `calculadora-de-pensao` | doc 11 | É `pensao-alimenticia` (§3.10) |

---

## 4. Sitemap, testes e PWA

### 4.1 Sitemap (`src/routes/sitemap[.]xml.ts`)

Completa o Passo 7 (§1.7). No gerador herdado do VDM (doc 02 §7: estáticas + posts + categorias + loja + ferramentas…),
acrescentar, depois das rotas estáticas:

```ts
import { TOOLS } from "@/lib/tools/registry";
// …
urls.push({ loc: `${SITE_URL}/ferramentas`, changefreq: "weekly", priority: "0.8" });
for (const t of TOOLS) {
  const live = Boolean(t.usesMarketData);
  urls.push({ loc: `${SITE_URL}/ferramentas/${t.slug}`, changefreq: live ? "hourly" : "monthly", priority: live ? "0.9" : "0.7" });
}
```

Verificação: `curl -s http://localhost:5173/sitemap.xml | grep -c "/ferramentas"` → **18** (índice + 17). Em produção,
`curl -s https://vocacaodepai.com.br/sitemap.xml | grep -o "/ferramentas/[a-z-]*" | sort -u | wc -l` → 17.

### 4.2 Testes (vitest em `tests/tools/`)

O doc 02 §2.1/§2.3 não lista `vitest`; esta fase o adiciona como devDependency (registrar em `PROGRESSO.md` → "Decisões":
"F4 · vitest ^3 adicionado para testar as funções puras das ferramentas; `npm run test` passa a fazer parte da validação").

```bash
cd /home/user/vocacaodepai
npm i -D vitest@^3.2.0
# package.json → "scripts": { ..., "test": "vitest run" }
```

`vitest.config.ts` (raiz):

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["tests/**/*.test.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

`tests/tools/registry.test.ts` (o teste que garante o contrato do registry):

```ts
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { TOOLS } from "@/lib/tools/registry";
import { COMO_USAR } from "@/lib/tools/como-usar";

const ESPERADOS = [
  "conversor-de-moedas", "mercado-financeiro", "custo-do-filho", "licenca-paternidade", "calculadora-de-churrasco",
  "cortes-de-carne", "orcamento-familiar", "juros-compostos", "reserva-de-emergencia", "pensao-alimenticia",
  "conversor-de-unidades", "kit-de-ferramentas", "nomes-de-filhos", "calendario-de-vacinacao", "marcos-do-desenvolvimento",
  "imc-e-gasto-calorico", "checklist-da-maternidade",
];

describe("registry das ferramentas (doc 06 §0.2)", () => {
  it("tem exatamente os 17 slugs, sem repetição", () => {
    expect([...TOOLS.map((t) => t.slug)].sort()).toEqual([...ESPERADOS].sort());
  });
  it.each(TOOLS.map((t) => [t.slug, t] as const))("%s: SEO, howTo, faq e Como usar", (_slug, t) => {
    expect(t.seoTitle.length).toBeLessThanOrEqual(60);
    expect(t.description.length).toBeGreaterThanOrEqual(120);
    expect(t.description.length).toBeLessThanOrEqual(158);
    expect(t.howTo.length).toBeGreaterThanOrEqual(3);
    expect(t.howTo.length).toBeLessThanOrEqual(6);
    expect(t.faq.length).toBeGreaterThanOrEqual(4);
    expect(t.faq.length).toBeLessThanOrEqual(6);
    const palavras = (COMO_USAR[t.slug] ?? "").trim().split(/\s+/).filter(Boolean).length;
    expect(palavras, `COMO_USAR[${t.slug}] precisa de ≥ 300 palavras (doc 11 §12)`).toBeGreaterThanOrEqual(300);
    const dir = path.resolve(__dirname, "../../src/components/ferramentas", t.slug);
    expect(existsSync(dir) && readdirSync(dir).some((f) => f.endsWith(".tsx")), `componente de ${t.slug}`).toBe(true);
  });
});
```

Demais arquivos (um por módulo puro; casos mínimos listados no critério de aceite de cada ferramenta do §3):
`format.test.ts` (`parseBRNumber`, `formatBRL`), `financas.test.ts` (`taxaMensal`, `jurosCompostos`, `reservaEmergencia`,
`pensaoEstimativa`), `unidades.test.ts`, `churrasco.test.ts`, `custo-filho.test.ts`, `licenca.test.ts`, `cortes.test.ts`,
`orcamento.test.ts`, `kit.test.ts`, `nomes.test.ts`, `vacinas.test.ts`, `marcos.test.ts`, `saude.test.ts`,
`checklist-maternidade.test.ts`, `market-cache.test.ts` (o `cached()` do §2.3 com `readCache`/`writeCache` substituídos por
`vi.mock`: fresco → cache; vencido + fonte ok → live; vencido + fonte falha → stale; sem nada → lança) e
`mercado-semaforo.test.ts` (regras do §3.2). `npm run test` precisa passar antes de cada PR da fase.

### 4.3 PWA (manifest + service worker com cache das calculadoras — doc 13 item 4.10; push fica para a Fase 8)

**`public/manifest.webmanifest`** (doc 02 §3 lista o arquivo; tokens do doc 02 §6.1):

```json
{
  "name": "Vocação de Pai",
  "short_name": "Vocação de Pai",
  "description": "Blog, Pai Indica, Loja do Pai, Caixa de Ferramentas e Área do Pai: formação do homem como pai, marido e provedor.",
  "lang": "pt-BR",
  "start_url": "/?utm_source=pwa",
  "scope": "/",
  "display": "standalone",
  "background_color": "#F4EFE6",
  "theme_color": "#14505C",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "shortcuts": [
    { "name": "Conversor de moedas", "url": "/ferramentas/conversor-de-moedas" },
    { "name": "Mercado do pai", "url": "/ferramentas/mercado-financeiro" },
    { "name": "Calculadora de churrasco", "url": "/ferramentas/calculadora-de-churrasco" }
  ]
}
```

**Ícones**: `scripts/build-icons.mjs` gera `public/icons/{icon-192,icon-512,maskable-512}.png` a partir de
`public/favicon.svg` (o escudo do doc 02 §6.4) com `sharp` (devDependency: `npm i -D sharp`; usado só em build local;
registrar em `PROGRESSO.md` → "Decisões"):

```js
import { mkdirSync } from "node:fs";
import sharp from "sharp";
mkdirSync("public/icons", { recursive: true });
for (const size of [192, 512]) await sharp("public/favicon.svg").resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
await sharp("public/favicon.svg").resize(410, 410)
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: "#14505C" }).png().toFile("public/icons/maskable-512.png");
console.log("ícones gerados em public/icons/");
```

**`public/sw.js`** — cache só do que é estático e seguro: o índice `/ferramentas`, as **15 calculadoras sem dados de
mercado** (network-first com fallback ao cache), `/assets/*` e `/icons/*` (cache-first) e `/offline.html`. **Nunca**
cacheia `/api/*`, `/admin*`, `/area-do-pai*`, `/minha-conta*`, `/entrar`, `/cadastro`, nem as duas ferramentas de mercado
(dado vivo). Sem push nesta fase.

```js
const VERSION = "vdp-sw-v1";
const SHELL = ["/ferramentas", "/offline.html"];
const CALCULADORAS = ["custo-do-filho", "licenca-paternidade", "calculadora-de-churrasco", "cortes-de-carne", "orcamento-familiar",
  "juros-compostos", "reserva-de-emergencia", "pensao-alimenticia", "conversor-de-unidades", "kit-de-ferramentas", "nomes-de-filhos",
  "calendario-de-vacinacao", "marcos-do-desenvolvimento", "imc-e-gasto-calorico", "checklist-da-maternidade"];
const NUNCA = ["/api/", "/admin", "/area-do-pai", "/minha-conta", "/entrar", "/cadastro", "/ferramentas/conversor-de-moedas", "/ferramentas/mercado-financeiro"];

self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const req = e.request; const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (NUNCA.some((p) => url.pathname.startsWith(p))) return;
  const isAsset = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/icons/");
  const isCalc = url.pathname === "/ferramentas" || CALCULADORAS.some((s) => url.pathname === `/ferramentas/${s}`);
  if (isAsset) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })));
  } else if (isCalc) {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((hit) => hit || caches.match("/offline.html"))));
  }
});
```

**`public/offline.html`**: página estática mínima com o logo, "Você está sem internet." e "As calculadoras que você já abriu
continuam funcionando; o Mercado do pai e o conversor de moedas precisam de conexão." (cores do tema inline, sem JS).

**`src/lib/pwa.ts`** + registro no `__root.tsx`:

```ts
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || import.meta.env.DEV) return;
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {}); });
}
```

No `src/routes/__root.tsx`: `head()` ganha `{ rel: "manifest", href: "/manifest.webmanifest" }` em `links` e
`{ name: "theme-color", content: "#14505C" }` em `meta`; o componente raiz chama `useEffect(() => registerServiceWorker(), [])`.
`vercel.json`: `public/sw.js` servido com `Cache-Control: no-cache` (header por path) para o navegador pegar a versão nova.

**Aceite (checklist 4.10)**: Lighthouse mobile em `/ferramentas/juros-compostos` marca "Installable"; abrir
`/ferramentas/conversor-de-unidades`, desligar a rede e recarregar → página funciona; `/ferramentas/mercado-financeiro`
offline → `offline.html`; `/api/market/refresh` nunca aparece em `caches` (DevTools → Application → Cache Storage).

---

## 5. Critérios de aceite da Fase 4

1. `0007_ferramentas.sql` (§2.1) aplicada: tabelas `market_cache` e `tool_usage` com RLS; policies e funções
   `get_market`, `market_is_stale`, `tool_usage_stats`, `tool_usage_prune` e a view `tool_usage_daily` existem;
   `mcp__Supabase__get_advisors` (security + performance) sem erro novo; `src/integrations/supabase/types.ts` regenerado.
2. `src/lib/tools/registry.ts` tem **exatamente os 17 slugs do §0.2**, cada um com componente em
   `src/components/ferramentas/<slug>/<Nome>.tsx` (nomes do §0.5) e `COMO_USAR[slug]` ≥ 300 palavras; `npm run test`
   verde (§4.2).
3. `/ferramentas` renderiza no SSR as 5 categorias na ordem do §0.2 com 17 cards (`ToolCard`), filtro por categoria e os
   2 destaques do dono no topo; `view-source` mostra os títulos.
4. `/ferramentas/<slug>` para os 17: `<title>` = `seoTitle | Vocação de Pai`, `canonical`, OG, e **4** JSON-LD
   (`BreadcrumbList`, `SoftwareApplication`, `HowTo`, `FAQPage`) válidos em https://validator.schema.org; `/ferramentas/nao-existe` → 404.
5. **Conversor de moedas** (doc 02 §10 F4): converte ≥ 6 moedas com dados < 30 min; PTAX do dólar; gráfico 30 dias;
   `MarketStale` em falha de fonte (§3.1).
6. **Mercado financeiro** (doc 02 §10 F4): ≥ 4 indicadores + gráfico 30 dias; Semáforo do dia; sem `BRAPI_TOKEN` o
   grupo Bolsa some sem erro; nenhum texto recomenda comprar/vender (§3.2); bloco "Mercado do pai hoje" na home (§3.2.6).
7. `market_cache` atualizada pelo workflow: após 2 execuções de `market-refresh.yml` (`workflow_dispatch`),
   `select key, fetched_at from market_cache order by fetched_at desc` mostra `fx:last`, `crypto:simple`, `sgs:indicators`,
   `ptax:USD` com `fetched_at` < 35 min; `POST /api/market/refresh` sem `Authorization` → 401; com `CRON_SECRET` → 200/207.
8. `tool_usage` registra uso anônimo (`user_id null`) e identificado (`user_id = auth.uid()`), uma linha por aba/sessão;
   anon não consegue `select`; `tool_usage_stats(30)` responde para admin.
9. `ToolSaveButton`: deslogado abre o login; logado grava `saved_items (item_type='tool', item_id=slug)` e alterna para
   "Salvo"; duplicata não gera erro.
10. Anúncios só nas posições do doc 11 §2.4: nenhum `AdSlot` acima da ferramenta; 1º abaixo do resultado com `<hr>` e
    rótulo "Publicidade"; 2º após o "Como usar".
11. Semáforo: toda ferramenta com risco (§3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.12, 3.14, 3.15, 3.16, 3.17) mostra
    **3** `SemaforoCallout` na ordem `ok → warn → bad`, com os prefixos "Sinal verde: / Sinal de atenção: / Sinal de
    alerta: " e o `bad` terminando com orientação de procurar ajuda profissional (CLAUDE.md §6.3). Nenhum `PaiSemaforo`.
12. Preço: `grep -rn "R\$ [0-9]*,[0-9][0-9]" src/lib/tools src/components/ferramentas` → vazio (nenhum preço exato
    hard-coded); `cortes.json` e `kit-ferramentas-data.ts` só com faixas ou `null`.
13. Nada de maternidade: `grep -rni "mamãe\|gestante\|amamenta\|enxoval" src/lib/tools src/components/ferramentas` só
    retorna ocorrências legítimas do §3.17 (urgência da gestante) — nenhuma copiada do VDM; `vacinas-data.ts` e
    `marcos-data.ts` com `ATUALIZADO_EM` e fonte oficial no cabeçalho.
14. Critério de aceite individual de cada ferramenta (§3.1 a §3.17) conferido manualmente e os testes do §4.2 passando.
15. Sitemap com 18 URLs de ferramentas (§4.1); `ToolsTeaser` da home sem selos "Em breve".
16. PWA (§4.3): instalável; calculadora abre offline; `/api/*` nunca cacheado.
17. Lighthouse mobile em `/ferramentas/conversor-de-moedas` ≥ 85 Performance e 100 SEO; sem erro de hidratação no console.
18. `npm run build && npm run lint && node scripts/validate-content.mjs` (CLAUDE.md §4.1), `npm run typecheck` e
    `npm run test` verdes; `grep -rn "MARKET_REFRESH_TOKEN\|COINGECKO_API_KEY" . --include=*.ts --include=*.yml` → vazio
    (só `CRON_SECRET` e `BRAPI_TOKEN`, doc 02 §8).
19. `docs/plano/PROGRESSO.md` com a Fase 4 `concluída`, decisões registradas (vitest, sharp, orçamento sem coluna no
    banco) e as caixas 4.1–4.12 marcadas em `13-checklist-de-execucao.md`.

---

## 6. Prompt para iniciar esta fase no Sonnet

```
Você está em /home/user/vocacaodepai (TanStack Start + React 19 + Tailwind 4 + Supabase + Vercel). Leia primeiro, nesta ordem:
CLAUDE.md, PLANO-MESTRE.md, docs/plano/02-arquitetura-e-stack.md (prevalece em nomes de rotas, tabelas, colunas e variáveis),
docs/plano/06-fase-4-ferramentas.md (este plano, inteiro) e docs/plano/PROGRESSO.md. Referência de código: /home/user/vocacaodemae
(SOMENTE LEITURA): leia com cat cada arquivo citado na seção 0.4 antes de adaptar; nada de maternidade entra (CLAUDE.md §15).

Execute a Fase 4 (Caixa de Ferramentas) exatamente como o documento descreve, em 4 sessões (seção 0.6), nesta ordem:
1) Passo 0 (seção 0.3): rodar o script de verificação; mover src/components/tools para src/components/ferramentas se existir;
   confirmar NAV_MAIN em SiteLayout.tsx. Se algo da Fase 1 estiver faltando, criar o mínimo do doc 03, sem duplicar sistema.
2) Sessão 4A (seções 1 e 2): categories.ts, registry.ts (+ index.ts), como-usar.ts, jsonld.ts, format/share/usage/saved.ts,
   componentes da casca (ToolLayout com os anúncios nas posições do doc 11 §2.4, ToolHowTo com texto longo, ToolFaq, ToolDisclaimer,
   ToolSaveButton, ToolShareButton, ToolRelatedArticles, ToolResultCard, MarketStale, ToolGate sem i18n; semáforo = SemaforoCallout
   do blog, nunca um novo), related.functions.ts, rota $slug.tsx e índice; migration 0007 (seção 2.1: conferir list_migrations,
   aplicar com mcp__Supabase__apply_migration, get_advisors, npm run types:supabase); src/lib/market/* (seções 2.2–2.5);
   endpoint /api/market/refresh com CRON_SECRET e .github/workflows/market-refresh.yml (seção 2.6); CurrencyConverter (3.1),
   MarketDashboard (3.2) e MarketTicker na home (3.2.6).
3) Sessão 4B (3.3, 3.7–3.10): ChildCostCalculator, FamilyBudget, CompoundInterest, EmergencyFund, ChildSupportEstimate.
4) Sessão 4C (3.4, 3.13–3.17): PaternityLeave, ChildNames (nomes-data.ts adaptado, sem textos de mãe/bebê), VaccinationCalendar e
   DevelopmentMilestones (dados PRÓPRIOS das fontes oficiais, nada copiado do VDM), BmiAndCalories, HospitalBagChecklist.
5) Sessão 4D (3.5, 3.6, 3.11, 3.12 e seção 4): BarbecueCalculator, BeefCutsGuide + BeefDiagram (SVG clicável, cortes.json sem
   preço inventado), UnitConverter, ToolkitBuilder; sitemap; vitest + tests/tools; PWA (manifest, ícones, sw.js, offline.html).
6) Para cada ferramenta: copiar literalmente a entrada do registry e o texto "Como usar" da seção 3; relatedCategories só com slugs
   reais de categories; links de loja só para /loja/<slug> existentes; faixa de preço nunca exata; disclaimer educativo.
7) Ao fim de cada sessão: npm run build && npm run lint && node scripts/validate-content.mjs (os três verdes, CLAUDE.md §4.1),
   npm run typecheck e npm run test; commit pequeno por etapa em branch claude/fase-4-<sessao>; atualizar PROGRESSO.md e marcar
   as caixas 4.x em 13-checklist-de-execucao.md; conferir os critérios da seção 5.
8) PR final "Fase 4 — Caixa de Ferramentas" contra main com o "Checklist de pronto" da seção 7 no corpo. Depois do merge, conferir
   o deploy na Vercel e disparar market-refresh.yml por workflow_dispatch.

Regras invioláveis: só os 17 slugs da seção 0.2 (nenhum outro); pasta src/components/ferramentas; CRON_SECRET é o único segredo
(nada de MARKET_REFRESH_TOKEN ou chave do CoinGecko); nenhuma chamada a API externa a partir do navegador; nenhum anúncio acima
da ferramenta; semáforo com 3 callouts "Sinal verde / Sinal de atenção / Sinal de alerta"; nenhum conselho médico, jurídico ou
financeiro como se fosse profissional; nunca DROP/DELETE/TRUNCATE em rotina; nunca inventar preço, especificação, prazo legal ou
calendário de vacina — conferir na fonte oficial e gravar a data. Se algo do plano não bater com o código real das Fases 1–3,
siga o código e anote a diferença em PROGRESSO.md → "Decisões tomadas durante a execução".
```

---

## 7. Checklist de pronto (colar no PR)

```markdown
## Fase 4 — Caixa de Ferramentas — Checklist de pronto
### Banco e cron
- [ ] `0007_ferramentas.sql` (doc 02 §4.7 + complementos do §2.1) presente em `list_migrations`; `get_market`, `market_is_stale`, `tool_usage_stats`, `tool_usage_prune`, view `tool_usage_daily`
- [ ] RLS ativa em `market_cache` e `tool_usage`; Advisor sem erro novo; `types.ts` regenerado
- [ ] `src/lib/market/*` (types, cache, 6 fontes, fetchers, refresh) e `POST /api/market/refresh` com `CRON_SECRET` (401 sem header)
- [ ] `.github/workflows/market-refresh.yml` (30 min) executado 2× por `workflow_dispatch`; `market_cache` com `fetched_at` < 35 min
### Casca e registro
- [ ] `categories.ts`, `registry.ts` (17 slugs), `index.ts`, `como-usar.ts` (17 textos ≥ 300 palavras), `jsonld.ts`, `format/share/usage/saved.ts`, `related.functions.ts`
- [ ] `ToolLayout` (anúncios só abaixo do resultado e após o "Como usar"), `ToolHowTo`, `ToolFaq`, `ToolDisclaimer`, `ToolSaveButton`, `ToolShareButton`, `ToolRelatedArticles`, `ToolResultCard`, `MarketStale`, `ToolGate`
- [ ] `/ferramentas` (5 categorias, 17 cards, destaques) e `/ferramentas/$slug` (SEO + 4 JSON-LD válidos; 404 para slug inexistente)
- [ ] `tool_usage` anônimo e identificado; `ToolSaveButton` grava `saved_items`
### As 17 ferramentas (§3)
- [ ] 3.1 `conversor-de-moedas` (CurrencyConverter) · 3.2 `mercado-financeiro` (MarketDashboard) + 3.2.6 "Mercado do pai hoje" na home
- [ ] 3.3 `custo-do-filho` · 3.7 `orcamento-familiar` · 3.8 `juros-compostos` · 3.9 `reserva-de-emergencia` · 3.10 `pensao-alimenticia`
- [ ] 3.4 `licenca-paternidade` · 3.13 `nomes-de-filhos` · 3.14 `calendario-de-vacinacao` · 3.15 `marcos-do-desenvolvimento` · 3.16 `imc-e-gasto-calorico` · 3.17 `checklist-da-maternidade`
- [ ] 3.5 `calculadora-de-churrasco` · 3.6 `cortes-de-carne` (SVG clicável + Carne × preparo) · 3.11 `conversor-de-unidades` · 3.12 `kit-de-ferramentas`
- [ ] Critério de aceite individual de cada uma conferido; semáforo com 3 callouts onde há risco; nenhum preço exato; nenhum dado de maternidade copiado do VDM
### Sitemap, testes e PWA (§4)
- [ ] Sitemap com `/ferramentas` + 17 slugs
- [ ] `vitest` instalado; `tests/tools/*.test.ts` (registry + módulos puros + market-cache + mercado-semaforo) verdes
- [ ] `manifest.webmanifest`, `public/icons/*`, `public/sw.js`, `public/offline.html`, `src/lib/pwa.ts`; calculadora abre offline; `/api/*` nunca cacheado
### Qualidade
- [ ] `npm run build && npm run lint && node scripts/validate-content.mjs` + `npm run typecheck` + `npm run test` verdes
- [ ] `grep` sem `MARKET_REFRESH_TOKEN`/`COINGECKO_API_KEY`/`PaiSemaforo`/`components/tools`
- [ ] Lighthouse mobile `/ferramentas/conversor-de-moedas` ≥ 85 Performance / 100 SEO
- [ ] `docs/plano/PROGRESSO.md` atualizado (Fase 4 concluída, decisões: vitest, sharp, orçamento sem coluna no banco); caixas 4.1–4.12 marcadas no `13-checklist-de-execucao.md`
```
