# Vocação de Pai

> **vocacaodepai.com.br** — o portal do pai e do homem católico de família tradicional.
> Formação do homem como pai, marido, provedor e líder servidor. Irmão do
> [Vocação de Mãe](https://vocacaodemae.com.br).

**Status:** em construção. O plano completo de criação está em [`PLANO-MESTRE.md`](./PLANO-MESTRE.md)
e em [`docs/plano/`](./docs/plano/). O andamento está em [`docs/plano/PROGRESSO.md`](./docs/plano/PROGRESSO.md).

---

## O que o site oferece

| Seção | O que é | Rota |
|---|---|---|
| **Blog** | Artigos e notícias práticas sobre paternidade, casamento, filhos, trabalho, dinheiro, fé, saúde do homem, churrasco e vida prática | `/blog` |
| **Pai Indica** | Reviews individuais, comparativos e listas de produtos com nota 0-10 e botão "Comprar agora na Amazon" | `/pai-indica` |
| **Loja do Pai** | Vitrine de produtos afiliados por categoria, com faixa de preço. "O pai também quer desconto" | `/loja` |
| **Caixa de Ferramentas** | Conversor de moedas, Mercado do pai (painel financeiro), calculadora de churrasco, guia de cortes, calculadoras de orçamento, 13º, férias e mais | `/ferramentas` |
| **Área do Pai** | Área de membros: painel, filhos, itens salvos, progresso em trilhas e desafios, badges | `/area-do-pai` |
| **Pai Indica Pai** | Vagas de emprego indicadas por pais, diretório Pai Profissional, indicações de serviços e mentoria | `/pai-indica-pai` |
| **Irmandade** | Comunidade: histórias de pais, perguntas e respostas, eventos e encontros | `/irmandade` |
| **Formação** | Trilhas de formação e desafios de N dias | `/formacao`, `/desafios` |

## Linha editorial

Visão católica de família tradicional: homem e mulher, pai e mãe. Tom direto, masculino,
respeitoso e prático, sem vulgaridade e sem machismo tóxico. Português do Brasil. As regras
completas estão em [`CLAUDE.md`](./CLAUDE.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) — React 19, Vite, TypeScript, SSR |
| Estilo | Tailwind 4 + shadcn/ui (Radix) |
| Banco, auth e storage | Supabase (PostgreSQL, RLS, Auth com e-mail e Google) — região `sa-east-1` |
| Hospedagem | Vercel (deploy automático a cada push no `main`) |
| E-mail | Resend |
| Editor de conteúdo | Tiptap (body dos artigos em JSON) |
| Automação | Claude Code Routine diária (artigos e reviews) + auto-merge de PRs `claude/*` |

Identidade visual: azul-petróleo `#14505C`, grafite `#1F2429`, âmbar/couro `#D9822B`, fundo areia
`#F4EFE6`; títulos em "Barlow Condensed", texto em "Inter". Modo escuro nativo.

## Como rodar localmente

Pré-requisitos: Node 22+, npm 10+, um projeto Supabase (ou o de desenvolvimento do grupo).

```bash
git clone https://github.com/vocacaodepai/vocacaodepai.git
cd vocacaodepai
npm install
cp .env.example .env        # preencha as variáveis (ver abaixo)
npm run dev                 # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Para quê | Obrigatória |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | sim |
| `VITE_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase | sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (só no servidor; rotinas e admin) | servidor |
| `PUBLIC_SITE_URL` | URL pública (`https://vocacaodepai.com.br`) | sim |
| `PUBLIC_AMAZON_TAG` | Tag de afiliado Amazon Associados BR | sim |
| `RESEND_API_KEY` | Envio de e-mails (newsletter, moderação) | fase 5+ |
| `PEXELS_API_KEY`, `PIXABAY_API_KEY` | Busca de imagens para artigos | rotina |
| `BRAPI_TOKEN` | Cotações de ações e índices (Mercado do pai) | opcional |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Login com Google | fase 5+ |
| `PUBLIC_GA4_ID` | Google Analytics 4 | fase 8 |

Nunca commite o `.env`. O `.env.example` é a referência e fica versionado.

### Banco de dados

As migrations ficam em `supabase/migrations/`, numeradas em ordem fixa. A Fase 1 aplica só `0001` e
`0002`; as demais são escritas e aplicadas na fase correspondente, com o SQL do documento daquela fase
(ver `PLANO-MESTRE.md` §2.3):

```
0001_core.sql               profiles, children, contact_messages, newsletter_subscribers, moderation_log, _tmp_post_staging, seo_search_stats, is_admin(), get_secret(), buckets   (Fase 1)
0002_blog.sql               categories, tags, post_tags, posts (kind, review, comparison, faq, quiz), comments, reactions, post_view_events, search_posts   (Fase 1)
0003_loja.sql               product_categories, products, product_price_checks   (Fase 3)
0004_membros.sql            saved_items, plans, subscriptions, badges, user_badges   (Fase 5)
0005_pai_indica_pai.sql     jobs, job_referrals, professionals, mentorships   (Fase 6)
0006_irmandade_formacao.sql stories, questions, answers, events, event_rsvps, tracks, track_steps, track_progress, challenges, challenge_days, challenge_progress   (Fase 7)
0007_ferramentas.sql        market_cache, tool_usage   (Fase 4)
```

Com a CLI do Supabase: `supabase db push` (ou `supabase migration up` em ambiente local com
`supabase start`). Em produção, as sessões de Claude Code aplicam via MCP do Supabase.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção (SSR) em `.output/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint em todo o projeto |
| `npm run format` | Prettier |
| `node scripts/validate-content.mjs` | Valida artigos e produtos: estrutura do Padrão A do Pai, links internos, termos proibidos, faixa de preço, botão de afiliado |

Antes de qualquer PR: `npm run build && npm run lint && node scripts/validate-content.mjs`.

## Estrutura de pastas

```
.
├── PLANO-MESTRE.md          # plano de criação (visão, fases, regras)
├── CLAUDE.md                # regras lidas por toda sessão de Claude Code
├── docs/plano/              # 00-visao … 13-checklist + PROGRESSO.md
├── public/                  # favicon, manifest, robots.txt, imagens estáticas
├── scripts/
│   ├── validate-content.mjs # validador de conteúdo
│   └── rotina/              # geradores da rotina diária de artigos
├── src/
│   ├── routes/              # rotas TanStack Start (file-based)
│   │   ├── __root.tsx
│   │   ├── _site/           # blog, pai-indica, loja, ferramentas, area-do-pai, pai-indica-pai, irmandade, formacao, institucional
│   │   ├── _admin/          # /admin
│   │   ├── api/             # endpoints (newsletter, market, rsvp…)
│   │   └── sitemap[.]xml.ts
│   ├── components/          # ui/ (shadcn) + componentes por seção
│   ├── lib/                 # supabase.ts, db/, seo.ts, format.ts, product-taxonomy.ts
│   ├── hooks/
│   └── styles.css           # tokens de design + @theme Tailwind 4
└── supabase/
    ├── migrations/          # 0001 … 0007 + migrations de dados
    └── seed/                # JSON de categorias, produtos, trilhas, desafios
```

## Fluxo de contribuição

1. Crie uma branch `claude/<fase>-<etapa>` (sessões de Claude Code) ou `feat/<tema>` (humanos) a partir de `main`.
2. Rode as validações.
3. Abra um PR contra `main` em português, descrevendo o que mudou e como testar.
4. A Vercel gera um deploy de pré-visualização para cada PR. Após o merge, o site é publicado automaticamente.

## Plano de criação

O projeto é construído em 8 fases, cada uma com um documento próprio em `docs/plano/`:

1. Fundação · 2. Pai Indica · 3. Loja do Pai · 4. Caixa de Ferramentas · 5. Área do Pai ·
6. Pai Indica Pai · 7. Irmandade e Formação · 8. Automação, rotinas e painel.

Leia o [`PLANO-MESTRE.md`](./PLANO-MESTRE.md) para a visão completa, a ordem de execução, as
regras de ouro e as instruções de uso com o Claude Code.

## Monetização e transparência

O site usa Google AdSense, links de afiliado da Amazon Associados BR (sempre com aviso e faixa de
preço pesquisada, nunca preço exato) e newsletter. Veja `/politica-de-afiliados` no site.

## Licença

Código: MIT. Conteúdo editorial (textos, imagens próprias e marca "Vocação de Pai"): todos os
direitos reservados ao grupo VDP.

---

*Vocação de Pai — "Formar o homem, firmar a família."*
