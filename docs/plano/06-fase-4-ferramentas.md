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
| 12 | `nomes-de-filhos` | Família | não (herda `nomes-data.ts` do VDM) |
| 13a | `calendario-de-vacinacao` | Família | não (herda `vacinas-data.ts`) |
| 13b | `marcos-do-desenvolvimento` | Família | não (herda `marcos-data.ts`) |
| 14 | `imc-e-gasto-calorico` | Saúde | não |
| 15 | `checklist-da-maternidade` | Família | não |

Categorias fixas (ordem de exibição): **Dinheiro**, **Família**, **Churrasco & Cozinha**,
**Casa & Oficina**, **Saúde**.

### 0.3 Pré-requisitos (verificar antes de começar — Passo 0)

A Fase 1 (`docs/plano/03-fase-1-fundacao.md`) deve ter deixado no repositório os módulos abaixo. Se o
nome real for diferente, **adapte o import, não crie duplicata**:

| Módulo esperado | Caminho | O que esta fase usa |
|---|---|---|
| Config do site | `src/lib/site.ts` | `SITE_URL = "https://vocacaodepai.com.br"`, `SITE_NAME = "Vocação de Pai"`, `SITE_OG_IMAGE`, `formatDate` |
| SEO | `src/lib/seo.ts` | `useSeo`, `breadcrumbJsonLd`, `faqJsonLd` |
| Layout do site | `src/routes/_site.tsx` | rota pai com Header/Footer |
| Blocos de página | `src/components/blog/Breadcrumbs.tsx`, `AdSlot.tsx`, `ArticlesStrip.tsx` | migalhas, anúncio, faixa de artigos |
| Loja | `src/components/store/StorePromo.tsx` | chamada para a Loja do Pai no rodapé da ferramenta |
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
for f in src/lib/site.ts src/lib/seo.ts src/routes/_site.tsx src/components/blog/Breadcrumbs.tsx \
  src/components/blog/AdSlot.tsx src/components/blog/ArticlesStrip.tsx src/components/store/StorePromo.tsx \
  src/lib/auth-context.ts src/integrations/supabase/client.ts src/integrations/supabase/client.server.ts \
  src/lib/seo.functions.ts "src/routes/sitemap[.]xml.ts" supabase/migrations/0004_membros.sql; do
  [ -e "$f" ] && echo "OK  $f" || echo "FALTA $f"; done
grep -n "SITE_URL" src/lib/site.ts
grep -n "export function useSeo\|export function breadcrumbJsonLd\|export function faqJsonLd" src/lib/seo.ts
grep -n "saved_items" supabase/migrations/*.sql | head -3
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
   `AdSlot leaderboard` → conteúdo → `ArticlesStrip` → `StorePromo`. Vira `ToolLayout` aqui, com os blocos novos.
3. **`ToolGate`**: trava suave de login com constante `TOOLS_GATED = false`. Manter o mecanismo (ferramentas
   livres por padrão; o campo `gated` do registro permite travar uma ferramenta específica no futuro).
4. **Dados em `src/lib/tools/*-data.ts`**: `nomes-data.ts` (884 nomes, `BabyName {name, sex, meaning, origin}`),
   `vacinas-data.ts` (PNI 2026, `VaccineStage {age, months, items[]}`), `marcos-data.ts`
   (`Milestone {month, motor[], language[], social[], alert}`). Copiar esses três arquivos e adaptar o texto
   para a visão do pai (ver ferramentas 12 e 13).
5. **Server functions** com `createServerFn({ method: "GET" }).inputValidator(...).handler(...)` (ver
   `src/lib/seo.functions.ts` e `src/lib/hub.functions.ts` no VDM) e **rotas de API** com
   `createFileRoute("/api/...")({ server: { handlers: { GET: async ({ request }) => new Response(...) } } })`
   (ver `src/routes/api/img/$.ts` no VDM) — incluindo o padrão de rate-limit em memória.
6. **RLS**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS ...; CREATE POLICY ...`
   (ver `20260901173837_enable_rls_security.sql` no VDM). Aqui usamos `public.is_admin()` (Fase 1) em vez
   de `auth.role() = 'authenticated'` para escrita administrativa.

### 0.5 Mapa de arquivos criados/alterados nesta fase

```
supabase/migrations/0007_ferramentas.sql                 (novo)
.github/workflows/market-refresh.yml                     (novo)
vercel.json                                              (alterar: cron opcional — ver 2.6)
src/lib/tools/registry.ts                                (novo)  registro das ferramentas
src/lib/tools/categories.ts                              (novo)  categorias + ícones
src/lib/tools/jsonld.ts                                  (novo)  SoftwareApplication/HowTo/FAQ
src/lib/tools/format.ts                                  (novo)  formatBRL, formatPct, formatNumber
src/lib/tools/usage.ts                                   (novo)  logToolUsage (cliente)
src/lib/tools/saved.ts                                   (novo)  saveTool/unsaveTool/isToolSaved
src/lib/tools/share.ts                                   (novo)  shareOrCopy(url, text)
src/lib/tools/currencies.ts                              (novo)  lista de moedas (código, nome, bandeira)
src/lib/tools/custo-filho-data.ts                        (novo)
src/lib/tools/licenca-regras.json                        (novo)
src/lib/tools/churrasco-regras.ts                        (novo)
src/lib/tools/cortes.json                                (novo)
src/lib/tools/orcamento-data.ts                          (novo)
src/lib/tools/financas.ts                                (novo)  jurosCompostos, reservaEmergencia, pensão
src/lib/tools/unidades.ts                                (novo)
src/lib/tools/kit-ferramentas-data.ts                    (novo)
src/lib/tools/nomes-data.ts                              (copiado do VDM e adaptado)
src/lib/tools/vacinas-data.ts                            (copiado do VDM e adaptado)
src/lib/tools/marcos-data.ts                             (copiado do VDM e adaptado)
src/lib/tools/saude.ts                                   (novo)  imc, tmb, gasto calórico
src/lib/tools/checklist-maternidade-data.ts              (novo)
src/lib/market/types.ts                                  (novo)
src/lib/market/cache.ts                                  (novo)  readCache/writeCache/cached (servidor)
src/lib/market/sources/awesomeapi.ts                     (novo)
src/lib/market/sources/bcb-ptax.ts                       (novo)
src/lib/market/sources/bcb-sgs.ts                        (novo)
src/lib/market/sources/coingecko.ts                      (novo)
src/lib/market/sources/brapi.ts                          (novo)
src/lib/market/sources/tesouro.ts                        (novo)
src/lib/market/fetchers.ts                               (novo)  server functions (createServerFn)
src/lib/market/refresh.ts                                (novo)  refreshAll() usado pelo cron
src/routes/api/market/refresh.ts                         (novo)  endpoint do cron
src/routes/_site/ferramentas/index.tsx                   (novo)  índice
src/routes/_site/ferramentas/$slug.tsx                   (novo)  rota dinâmica
src/components/tools/ToolLayout.tsx                      (novo)
src/components/tools/ToolGate.tsx                        (copiado do VDM, sem i18n)
src/components/tools/ToolCard.tsx                        (novo)
src/components/tools/ToolHowTo.tsx                       (novo)
src/components/tools/ToolFaq.tsx                         (novo)
src/components/tools/ToolDisclaimer.tsx                  (novo)
src/components/tools/ToolSaveButton.tsx                  (novo)
src/components/tools/ToolShareButton.tsx                 (novo)
src/components/tools/ToolRelatedArticles.tsx             (novo)
src/components/tools/ToolResultCard.tsx                  (novo)  cartão de resultado padrão
src/components/tools/PaiSemaforo.tsx                     (novo)  callouts Sinal verde/atenção/alerta
src/components/tools/MarketStale.tsx                     (novo)  aviso "dados de HH:MM (cache)"
src/components/tools/<slug>/<NomeDaFerramenta>.tsx       (novo, um por ferramenta — ver seção 3)
src/routes/sitemap[.]xml.ts                              (alterar: incluir ferramentas)
src/components/layout/Header.tsx                         (alterar: item "Ferramentas" no menu, se ainda não houver)
tests/tools/*.test.ts                                    (novo)  vitest para funções puras
```

### 0.6 Ordem de execução e divisão em sessões

| Sessão | Conteúdo | Estimativa |
|---|---|---|
| 4A | Passos 1–9: migration, camada de mercado, cron, registry, ToolLayout, índice, `$slug`, Conversor de moedas, Mercado financeiro | 1 sessão longa |
| 4B | Ferramentas de Dinheiro: custo-do-filho, orcamento-familiar, juros-compostos, reserva-de-emergencia, pensao-alimenticia | 1 sessão |
| 4C | Família e Saúde: licenca-paternidade, nomes-de-filhos, calendario-de-vacinacao, marcos-do-desenvolvimento, checklist-da-maternidade, imc-e-gasto-calorico | 1 sessão |
| 4D | Churrasco/Cozinha/Oficina: calculadora-de-churrasco, cortes-de-carne (SVG), conversor-de-unidades, kit-de-ferramentas; sitemap; testes; aceite final | 1 sessão |

Cada sessão termina com `npm run typecheck && npm run build` verdes, commit em branch `claude/fase-4-<sessao>`
e atualização de `docs/plano/PROGRESSO.md`.

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
  BadgeDollarSign,
  Beef,
  CalendarCheck,
  CalendarDays,
  Flame,
  LineChart,
  PiggyBank,
  Ruler,
  Scale,
  Shield,
  Sprout,
  Syringe,
  Wrench,
  Briefcase,
  ClipboardList,
} from "lucide-react";
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
  component: LazyExoticComponent<ComponentType>;
}

const L = (loader: () => Promise<{ default: ComponentType }>) => lazy(loader);

export const TOOLS: ToolDefinition[] = [
  {
    slug: "conversor-de-moedas",
    title: "Conversor de moedas",
    seoTitle: "Conversor de moedas: dólar, euro e 30+ moedas em reais hoje",
    description:
      "Converta dólar, euro, libra, peso e mais de 30 moedas para o real com cotação comercial atualizada, PTAX oficial do Banco Central e gráfico dos últimos 30 dias.",
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
    ],
    relatedCategories: ["dinheiro", "carreira"],
    relatedTerms: ["dólar", "câmbio", "viagem internacional", "investir no exterior"],
    disclaimer:
      "Cotações informativas, sem garantia de exatidão para operações financeiras. Para contratos e declarações oficiais use a PTAX publicada pelo Banco Central.",
    component: L(() => import("@/components/tools/conversor-de-moedas/ConversorDeMoedas")),
  },
  {
    slug: "mercado-financeiro",
    title: "Mercado financeiro hoje",
    seoTitle: "Mercado financeiro hoje: dólar, euro, bitcoin, Ibovespa, Selic e IPCA",
    description:
      "Painel do dia para o pai de família: dólar, euro, bitcoin, Ibovespa e ações populares, Selic, CDI, IPCA e Tesouro Direto — com explicação prática do que cada número muda na sua casa.",
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
    ],
    relatedCategories: ["dinheiro"],
    relatedTerms: ["selic", "inflação", "investimento", "reserva de emergência", "bitcoin"],
    disclaimer:
      "Conteúdo educativo. Não constitui recomendação de investimento. Dados sujeitos a atraso e indisponibilidade das fontes.",
    component: L(() => import("@/components/tools/mercado-financeiro/MercadoFinanceiro")),
  },
  // ... (uma entrada por ferramenta — as demais 15 estão especificadas na seção 3; copie os campos
  //      seoTitle/description/howTo/faq/disclaimer literalmente de lá)
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
export const toolsByCategory = (cat: ToolCategorySlug) =>
  TOOLS.filter((t) => t.category === cat || t.alsoIn?.includes(cat));
export const featuredTools = () => TOOLS.filter((t) => t.featured);
export const toolPath = (slug: string) => `/ferramentas/${slug}`;
```

Regras do registro:

- **Um slug = uma entrada = um componente** em `src/components/tools/<slug>/<PascalCase>.tsx` com `export default`.
- Nunca importar o componente de forma estática no registry (manter `lazy`) — o bundle do índice não pode
  carregar as 17 ferramentas.
- `seoTitle` ≤ 60 caracteres antes do sufixo; `description` entre 120 e 158 caracteres. Há um teste para isso
  (`tests/tools/registry.test.ts`, seção 6).
- `howTo` tem de 3 a 6 passos; `faq` de 3 a 6 perguntas (tudo vira JSON-LD).

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

**`src/components/tools/PaiSemaforo.tsx`** (callouts herdados do semáforo do VDM, com os textos fixos do brief):

```tsx
import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "verde" | "atencao" | "alerta";
const META: Record<Kind, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  verde: { label: "Sinal verde: ", icon: CheckCircle2, cls: "border-success/40 bg-success/10 text-foreground" },
  atencao: { label: "Sinal de atenção: ", icon: AlertTriangle, cls: "border-warning/50 bg-warning/10 text-foreground" },
  alerta: { label: "Sinal de alerta: ", icon: OctagonAlert, cls: "border-destructive/50 bg-destructive/10 text-foreground" },
};

export function PaiSemaforo({ kind, children, className }: { kind: Kind; children: React.ReactNode; className?: string }) {
  const m = META[kind];
  return (
    <div role="note" className={cn("flex gap-3 rounded-xl border p-4 text-sm leading-relaxed", m.cls, className)}>
      <m.icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <p><strong>{m.label}</strong>{children}</p>
    </div>
  );
}
```

Tokens `success`, `warning`, `destructive`, `accent` devem existir no tema da Fase 1
(`#2F7D4F`, `#D9A21B`, `#B23A3A`, `#D9822B`). Se faltar `warning`, adicione em `src/index.css` seguindo o
padrão dos demais.

**`src/components/tools/ToolHowTo.tsx`**

```tsx
import type { ToolHowToStep } from "@/lib/tools/registry";

export function ToolHowTo({ steps }: { steps: ToolHowToStep[] }) {
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
    </section>
  );
}
```

**`src/components/tools/ToolFaq.tsx`** — usa `Accordion` do shadcn (`src/components/ui/accordion.tsx`), um
`AccordionItem` por pergunta, `<h2>Perguntas frequentes</h2>`, `<h3>` para cada pergunta.

**`src/components/tools/ToolDisclaimer.tsx`** — caixa discreta com ícone `Info`, título "Aviso" e o texto
do registro; prop opcional `strong` (fundo `destructive/10`, usado pela pensão alimentícia).

**`src/components/tools/ToolSaveButton.tsx`**

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

**`src/components/tools/ToolShareButton.tsx`** — botão com ícone `Share2`, recebe `{ title, text, url? }`
(se `url` ausente usa `window.location.href`) e chama `shareOrCopy`.

**`src/components/tools/ToolRelatedArticles.tsx`** — recebe `posts` (já carregados pelo loader da rota, ver 1.5)
e renderiza até 4 cards (capa, categoria, título, tempo de leitura) com `<h2>Leia também</h2>`. Se vazio, não renderiza.

**`src/components/tools/MarketStale.tsx`** — recebe `{ fetchedAt: string; stale: boolean; sources: string[] }`
e mostra: "Atualizado às HH:MM (cache)" ou, se `stale`, "Sinal de atenção: usando dados de DD/MM HH:MM; as fontes
estão instáveis agora." + "Fontes: AwesomeAPI, Banco Central do Brasil…".

**`src/components/tools/ToolResultCard.tsx`** — cartão padrão de resultado: `label` (uppercase, pequeno),
`value` (font-display 2xl/3xl), `hint` opcional, `tone` (`primary | neutral | success | warning | danger`).

**`src/components/tools/ToolGate.tsx`** — copiar do VDM removendo `useTranslation` e trocando os textos por:
título "Entre para usar a ferramenta completa", texto "Crie sua conta grátis na Área do Pai e salve seus resultados.",
botão "Entrar ou criar conta", nota "Leva 30 segundos. Sem spam.". Manter `TOOLS_GATED = false`.

**`src/components/tools/ToolLayout.tsx`** — casca única:

```tsx
import { Suspense, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { StorePromo } from "@/components/store/StorePromo";
import { useAuth } from "@/lib/auth-context";
import { logToolUsage } from "@/lib/tools/usage";
import { categoryBySlug } from "@/lib/tools/categories";
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

      <AdSlot format="leaderboard" className="mt-6" />

      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" aria-busy />}>
          {tool.gated ? <ToolGate>{children}</ToolGate> : children}
        </Suspense>
      </div>

      {tool.disclaimer && <ToolDisclaimer text={tool.disclaimer} strong={tool.slug === "pensao-alimenticia"} />}

      <ToolHowTo steps={tool.howTo} />
      <ToolFaq items={tool.faq} />
      <ToolRelatedArticles posts={related} />
      <AdSlot format="rectangle" className="mt-10" />
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

Se o blog ainda não tiver as categorias `dinheiro`, `familia`, `churrasco`, `casa`, `saude`, `carreira`
(Fase 1/2 define as categorias oficiais), use os slugs que existirem; a função só retorna vazio, nunca quebra.

### 1.6 Passo 6 — Rota dinâmica `src/routes/_site/ferramentas/$slug.tsx`

```tsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";
import { toolBySlug } from "@/lib/tools/registry";
import { toolJsonLd } from "@/lib/tools/jsonld";
import { getRelatedPostsForTool } from "@/lib/tools/related.functions";
import { ToolLayout } from "@/components/tools/ToolLayout";
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
  `tool.preload?.()` — adicione ao `ToolDefinition` o campo opcional `preload?: () => Promise<unknown>` e, no
  loader, `const preloaded = tool.preload ? await tool.preload().catch(() => null) : null;` devolvendo
  `{ slug, related, preloaded }`. O componente lê com `Route.useLoaderData()` e usa como `initialData` do `useQuery`.

### 1.7 Passo 7 — Menu e sitemap

1. **Header** (`src/components/layout/Header.tsx`): garantir item "Ferramentas" → `/ferramentas` entre "Pai Indica"
   e "Loja do Pai" (a ordem do menu é definida no `00-visao`/Fase 1; se já houver, não duplicar).
2. **Sitemap** (`src/routes/sitemap[.]xml.ts`): importar `TOOLS` e emitir `<url>` para `/ferramentas` (priority 0.8,
   changefreq weekly) e para cada `/ferramentas/<slug>` (priority 0.7; `conversor-de-moedas` e `mercado-financeiro`
   com changefreq `hourly` e priority 0.9).

---

## 2. Banco, cache de mercado e cron

### 2.1 Passo 8 — Migration `supabase/migrations/0007_ferramentas.sql`

Colunas são as **fixas do brief** (`market_cache: key text pk, data jsonb, fetched_at timestamptz, ttl_seconds int`;
`tool_usage: id, tool_slug, user_id (nullable), created_at`). Nada além disso nas tabelas; o que é derivado vira
view/função.

```sql
-- 0007_ferramentas.sql — Caixa de Ferramentas: cache de mercado + uso das ferramentas
-- Pré-requisitos: 0001_core.sql (profiles, public.is_admin()), 0004_membros.sql (saved_items)

-- ---------------------------------------------------------------
-- market_cache: cache servidor→servidor dos dados de mercado
-- ---------------------------------------------------------------
create table if not exists public.market_cache (
  key         text primary key,
  data        jsonb not null,
  fetched_at  timestamptz not null default now(),
  ttl_seconds int  not null default 1800 check (ttl_seconds between 60 and 604800)
);
comment on table public.market_cache is
  'Cache de respostas de APIs de mercado (AwesomeAPI, BCB, CoinGecko, Brapi, Tesouro). Escrita só pelo servidor (service role).';

create index if not exists market_cache_fetched_at_idx on public.market_cache (fetched_at);

alter table public.market_cache enable row level security;

-- Leitura pública: são dados públicos de mercado; sem política de escrita → só service role escreve.
drop policy if exists "market_cache_select_public" on public.market_cache;
create policy "market_cache_select_public" on public.market_cache
  for select using (true);

-- Helper: diz se a chave está fresca (usado por consultas de diagnóstico no admin)
create or replace function public.market_cache_is_fresh(p_key text)
returns boolean
language sql stable
set search_path = public
as $$
  select coalesce(
    (select fetched_at + make_interval(secs => ttl_seconds) > now() from public.market_cache where key = p_key),
    false);
$$;

-- ---------------------------------------------------------------
-- tool_usage: registro anônimo/identificado de uso das ferramentas
-- ---------------------------------------------------------------
create table if not exists public.tool_usage (
  id         uuid primary key default gen_random_uuid(),
  tool_slug  text not null check (tool_slug ~ '^[a-z0-9-]{3,64}$'),
  user_id    uuid null references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.tool_usage is
  'Um registro por abertura de ferramenta (dedup por aba no cliente). user_id nulo = visitante.';

create index if not exists tool_usage_slug_created_idx on public.tool_usage (tool_slug, created_at desc);
create index if not exists tool_usage_user_idx on public.tool_usage (user_id) where user_id is not null;

alter table public.tool_usage enable row level security;

-- INSERT: visitante (anon) só com user_id nulo; logado só com o próprio id
drop policy if exists "tool_usage_insert_anon" on public.tool_usage;
create policy "tool_usage_insert_anon" on public.tool_usage
  for insert to anon with check (user_id is null);

drop policy if exists "tool_usage_insert_auth" on public.tool_usage;
create policy "tool_usage_insert_auth" on public.tool_usage
  for insert to authenticated with check (user_id is null or user_id = auth.uid());

-- SELECT: o próprio usuário vê o seu histórico; admin vê tudo
drop policy if exists "tool_usage_select_own" on public.tool_usage;
create policy "tool_usage_select_own" on public.tool_usage
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Sem UPDATE/DELETE para ninguém além do service role.

-- Agregado diário para o /admin e para o Painel Lisieux (Fase 8)
create or replace view public.tool_usage_daily
with (security_invoker = true) as
select
  tool_slug,
  (created_at at time zone 'America/Sao_Paulo')::date as dia,
  count(*)                       as aberturas,
  count(distinct user_id)        as usuarios_logados
from public.tool_usage
group by 1, 2;

comment on view public.tool_usage_daily is 'Aberturas por ferramenta e dia (fuso de Brasília). Só admin enxerga tudo via RLS da tabela.';

-- Limpeza: tool_usage cresce rápido; manter 400 dias (chamada pelo cron de manutenção da Fase 8)
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

Aplicação (decisão: via Supabase CLI já configurada na Fase 1; se a CLI não estiver linkada, usar o MCP do Supabase
`apply_migration` com o mesmo conteúdo):

```bash
cd /home/user/vocacaodepai
supabase db push                       # aplica 0007 no projeto <SUPABASE_PROJECT_REF>
supabase gen types typescript --linked > src/integrations/supabase/types.ts
npm run typecheck
```

Verificação:

```sql
select table_name from information_schema.tables where table_schema='public' and table_name in ('market_cache','tool_usage');
select policyname, cmd from pg_policies where tablename in ('market_cache','tool_usage') order by 1;
-- esperado: market_cache_select_public (SELECT); tool_usage_insert_anon (INSERT); tool_usage_insert_auth (INSERT); tool_usage_select_own (SELECT)
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

**`coingecko.ts`** — CoinGecko (plano Demo gratuito: ~30 req/min e 10.000 req/mês com chave em
`x-cg-demo-api-key`; sem chave funciona com limite menor e instável). Fallback: `BTC-BRL` e `ETH-BRL` da AwesomeAPI.

- `GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl,usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`
  → `{ bitcoin: { brl, usd, brl_24h_change, brl_market_cap, last_updated_at } }`.

```ts
import { fetchJsonWithTimeout } from "../cache";
import type { CryptoQuote } from "../types";
import { fetchFxLast } from "./awesomeapi";

const IDS = [{ id: "bitcoin", symbol: "BTC", name: "Bitcoin" }, { id: "ethereum", symbol: "ETH", name: "Ethereum" }];

export async function fetchCrypto(): Promise<CryptoQuote[]> {
  const key = process.env["COINGECKO_API_KEY"];
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${IDS.map((c) => c.id).join(",")}&vs_currencies=brl,usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`;
  try {
    const raw = await fetchJsonWithTimeout<Record<string, Record<string, number>>>(url, { headers: key ? { "x-cg-demo-api-key": key } : {} });
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

```ts
import { createFileRoute } from "@tanstack/react-router";

const SECURITY_HEADERS = { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" };

async function handle(request: Request) {
  const expected = process.env["MARKET_REFRESH_TOKEN"];
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? new URL(request.url).searchParams.get("token");
  if (!expected || got !== expected) return new Response("unauthorized", { status: 401, headers: SECURITY_HEADERS });
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
          SITE_URL: ${{ vars.SITE_URL || 'https://vocacaodepai.com.br' }}
          TOKEN: ${{ secrets.MARKET_REFRESH_TOKEN }}
        run: |
          set -euo pipefail
          code=$(curl -sS -o /tmp/out.json -w '%{http_code}' --max-time 60 \
            -H "Authorization: Bearer ${TOKEN}" "${SITE_URL}/api/market/refresh")
          echo "HTTP ${code}"; cat /tmp/out.json; echo
          if [ "$code" != "200" ] && [ "$code" != "207" ]; then exit 1; fi
```

Complemento opcional (se o time "Portal da AI" estiver em plano Pro): adicionar em `vercel.json`
`{"crons":[{"path":"/api/market/refresh?token=…","schedule":"*/30 * * * *"}]}` — **não** fazer isso com o token
em texto puro no repositório; a Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente quando a env
`CRON_SECRET` existe, então, se usar, aceite também `CRON_SECRET` no endpoint (`got === expected || got === process.env.CRON_SECRET`).

Teste local do endpoint:

```bash
cd /home/user/vocacaodepai && MARKET_REFRESH_TOKEN=dev-token npm run dev &
sleep 8
curl -s -H "Authorization: Bearer dev-token" http://localhost:5173/api/market/refresh | jq .
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5173/api/market/refresh   # esperado: 401
```

---
