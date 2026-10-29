# PROGRESSO — Vocação de Pai

> Tabela viva do projeto. Toda sessão de Claude Code lê este arquivo antes de começar e o atualiza
> ao terminar **cada etapa**, no mesmo commit da etapa. É a única fonte de verdade sobre o que já
> foi feito. Checklist detalhado por etapa em `13-checklist-de-execucao.md`.

## Como preencher

- **Fase**: `F1` … `F8` (ver `PLANO-MESTRE.md` §3).
- **Etapa**: número `N.M` do `13-checklist-de-execucao.md`, ou `—` na linha-resumo da fase.
- **Status**: `pendente` · `em andamento` · `concluída`. A linha-resumo da fase vira `em andamento`
  quando a primeira etapa começa e `concluída` quando a última etapa termina e o PR foi mesclado.
- **Data**: `AAAA-MM-DD` da última mudança de status.
- **PR**: número e branch (ex.: `#12 claude/fase-3-loja-vitrine`). Vazio enquanto não houver PR.
- **Observações**: 1 linha. Erros não resolvidos, o que ficou pela metade, placeholders usados.
- Ao começar uma etapa, **adicionar uma linha** abaixo da linha-resumo da fase (não substituir a
  linha-resumo). Manter as linhas ordenadas por fase e etapa.
- Nunca apagar linha; se algo foi desfeito, registrar nova linha com a observação.

## Tabela de progresso

| Fase | Etapa | Status | Data | PR | Observações |
|---|---|---|---|---|---|
| F1 Fundação | — | pendente | 2026-10-24 | | Aguarda projeto Supabase e Vercel (ver Pendências do dono) |
| F2 Pai Indica | — | pendente | 2026-10-24 | | Depende de F1 |
| F3 Loja do Pai | — | pendente | 2026-10-24 | | Depende de F1 |
| F4 Caixa de Ferramentas | — | pendente | 2026-10-24 | | Depende de F1 |
| F5 Área do Pai | — | pendente | 2026-10-24 | | Depende de F1, F3, F4 |
| F6 Pai Indica Pai | — | pendente | 2026-10-24 | | Depende de F5 |
| F7 Irmandade e Formação | — | pendente | 2026-10-24 | | Depende de F5 |
| F8 Automação, rotinas e painel | — | pendente | 2026-10-24 | | Depende de F1 a F7 |

## Decisões tomadas durante a execução

> Registrar aqui toda escolha que o plano não cobria (formato: data · fase/etapa · decisão · motivo).
> O que está aqui passa a valer como regra para as sessões seguintes.

_(vazio)_

## Pendências do dono

> Itens que só o dono resolve. O Sonnet registra aqui, usa placeholder/fallback e segue.
> Marcar `- [x]` quando resolvido e informar onde o valor foi configurado (Vercel, `.env`, doc 02).

- [ ] Criar o projeto **Supabase** (região `sa-east-1`) e informar o `project_ref` → substituir `<SUPABASE_PROJECT_REF>` em `CLAUDE.md`, `.env.example` e `docs/plano/02-arquitetura-e-stack.md`; configurar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` na Vercel
- [ ] Criar o projeto **Vercel** `vocacaodepai` no time "Portal da AI" ligado ao repositório `vocacaodepai/vocacaodepai`
- [ ] Apontar o **domínio** `vocacaodepai.com.br` (e `www`) para a Vercel; confirmar HTTPS
- [ ] `PUBLIC_AMAZON_TAG` — tag do Amazon Associados BR para o Vocação de Pai (ou a tag atual do grupo)
- [ ] `RESEND_API_KEY` — e domínio `vocacaodepai.com.br` verificado no Resend (remetente `contato@vocacaodepai.com.br`)
- [ ] `PEXELS_API_KEY` — busca de imagens para artigos
- [ ] `PIXABAY_API_KEY` — fallback de imagens
- [ ] `BRAPI_TOKEN` (opcional) — cotações de ações/índices no Mercado do pai; sem ele o painel usa só câmbio e BCB
- [ ] **Turnstile** (Cloudflare): `TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` — já na Fase 1 (`/api/newsletter` e `/contato`, doc 03 §4.6) e na Fase 5+ (cadastro, vagas, indicações, perguntas — docs 07 §4.4, 08 §7, 09 §4)
- [ ] `CRON_SECRET` — gerar um valor único e configurar em Vercel (server), GitHub Actions (secret), Supabase Vault e grupovdp (secret `HUB_API_KEY_VOCACAODEPAI`, doc 10 §11.4). É o único segredo de crons/refresh/integrações: o doc 02 §8 unifica nele os nomes antigos `INTERNAL_FN_SECRET`, `SEO_SYNC_INTERNAL_SECRET` e `HUB_API_KEY`
- [ ] Service account do Google (JSON) com leitura na propriedade GA4 e no Search Console do site → `GSC_SERVICE_ACCOUNT_JSON` (secret da edge function `seo-search-console`, doc 02 §8) e, no grupovdp, `GOOGLE_SA_JSON` (já existe) + secret `GA4_PROPERTY_VOCACAODEPAI` (id numérico da propriedade, doc 10 §11) — Fase 1 (Search Console/GA4) e Fase 8 (edge)
- [ ] AdSense: id do publisher (`pub-…`) → constante `ADSENSE_PUB_ID` em `src/lib/site.ts` e linha de `public/ads.txt` (não é variável de ambiente, doc 02 §8); pedir revisão só com 40–60 artigos indexados (doc 11 §1) — Fase 8
- [ ] Routine **"Vocação de Pai: rotina diária"** em claude.ai/code (doc 10 §2) com as variáveis do doc 10 §11.2: `LISIEUX_SUPABASE_URL`, `LISIEUX_SUPABASE_ANON_KEY`, `LISIEUX_STATUS_SECRET` (status no Painel Lisieux) — Fase 8
- [ ] `GH_PAT_AUTOMERGE` — token com permissão de merge para `auto-merge.yml` (secret do GitHub Actions, doc 02 §8) — Fase 8
- [ ] Caixas `contato@vocacaodepai.com.br` e `privacidade@vocacaodepai.com.br` (canal LGPD, docs 07 §9 e 08 §1.6) e domínio de envio `news.vocacaodepai.com.br` (SPF/DKIM/DMARC) verificado no Resend para a newsletter (doc 11 §5.1)
- [ ] Inscrição no Amazon Associados BR só quando houver ≥ 20 artigos publicados (doc 11 §1); a tag recebida vai para `PUBLIC_AMAZON_TAG` (item acima)
- [ ] Conta Mercado Pago (plano pago `pai-de-valor`: `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET`, fase futura — doc 07 §7) e conta Hotmart (produtos digitais, Fase 7 — doc 11 §1 e §4) — sem urgência
- [ ] **Google OAuth** — `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Google Cloud Console, com redirect da Supabase Auth e da Vercel (Fase 5)
- [ ] **GA4** — propriedade do Google Analytics 4 e `PUBLIC_GA4_ID`; adicionar o site no Search Console e no AdSense (Fase 8)
- [ ] Textos finais de `/sobre` (história do casal fundador) e foto do dono para a página — o Sonnet publica um rascunho na Fase 1 e marca aqui para revisão
- [ ] Decidir preço e nome do plano pago da Área do Pai (fica `active=false` até então)

## Histórico de sessões

> Uma linha por sessão de Claude Code: data · fase/etapas tocadas · PR · resumo em 1 linha.

| Data | Fase/etapas | PR | Resumo |
|---|---|---|---|
| 2026-10-24 | Planejamento | — | Plano escrito: `PLANO-MESTRE.md`, `CLAUDE.md`, `README.md`, `docs/plano/00…13`, `PROGRESSO.md` |
| 2026-10-29 | Planejamento | #1 | Docs 09 (Irmandade e Formação) e 12 (backlog) escritos; revisão cruzada de coerência (59 ajustes em 16 arquivos); pesquisas em `docs/plano/anexos/` |
