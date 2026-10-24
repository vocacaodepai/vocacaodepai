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
- [ ] **Google OAuth** — `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` no Google Cloud Console, com redirect da Supabase Auth e da Vercel (Fase 5)
- [ ] **GA4** — propriedade do Google Analytics 4 e `PUBLIC_GA4_ID`; adicionar o site no Search Console e no AdSense (Fase 8)
- [ ] Textos finais de `/sobre` (história do casal fundador) e foto do dono para a página — o Sonnet publica um rascunho na Fase 1 e marca aqui para revisão
- [ ] Decidir preço e nome do plano pago da Área do Pai (fica `active=false` até então)

## Histórico de sessões

> Uma linha por sessão de Claude Code: data · fase/etapas tocadas · PR · resumo em 1 linha.

| Data | Fase/etapas | PR | Resumo |
|---|---|---|---|
| 2026-10-24 | Planejamento | — | Plano escrito: `PLANO-MESTRE.md`, `CLAUDE.md`, `README.md`, `docs/plano/00…13`, `PROGRESSO.md` |
