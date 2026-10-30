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

- 2026-10-30 · F1 / Etapa 9 (posts 6-10) · Categorias dos posts seed mapeadas para os slugs reais do `0002_blog.sql`, porque os slugs do doc 03 §9.1/§9.2 não existem no banco: `saude-do-homem` → `corpo-e-saude-do-homem` (post 6); `forca-e-esporte` → `corpo-e-saude-do-homem` (post 8, subtema "Treino em casa e na academia"); `casa-carro-e-ferramentas` → `caixa-de-ferramentas-e-reparos` (post 10); `churrasco-e-cozinha` (post 7) e `casamento-e-familia` (post 9) coincidem. `category_id` resolvido por subselect na categoria-mãe (`parent_id is null`).
- 2026-10-30 · F1 / Etapa 9 (posts 6-10) · `author_id` resolvido por subselect em `public.profiles` (`display_name = 'Equipe Vocação de Pai'`), e não pelo UUID literal do `0008_seed_autor.sql`, para valer também se o dono criar o usuário pelo Dashboard com outro id. Links internos: cada post linka os 9 outros posts da seed + `/categoria/<slug>` para fechar os 10 hrefs distintos que o validador exige (na Fase 1 só existem 10 posts).
- 2026-10-30 · F1 / Etapa 9 (posts 6-10) · Capas via Unsplash (CDN `images.unsplash.com`, HEAD 200 conferido, conferência visual feita: nenhuma contraria a linha editorial). **Capas da seed (posts 6-10): slug | URL | fotógrafo** — para o dono revisar:
  - `exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos` | https://images.unsplash.com/photo-1666887360680-9dc27a1d2753?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Nappy (Unsplash)
  - `cortes-de-carne-para-churrasco-guia-do-pai-iniciante` | https://images.unsplash.com/photo-1534177616072-ef7dc120449d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Vincent Keiman (Unsplash)
  - `treino-de-20-minutos-em-casa-para-pais-sem-tempo` | https://images.unsplash.com/photo-1760084081757-6f918c08403b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Rahul Gupta (Unsplash)
  - `como-ser-um-marido-presente-depois-que-o-bebe-chega` | https://images.unsplash.com/photo-1758698856229-6f3dfd08fcc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Marius Muresan (Unsplash)
  - `kit-basico-de-ferramentas-para-a-casa` | https://images.unsplash.com/photo-1567361808960-dec9cb578182?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Louis Hansel (Unsplash)

- 2026-10-30 · F1 / Etapa 9 (validador e posts 1-5) · `<AUTHOR_UUID>` = `e8bb17c5-ce46-4d2c-bda7-4d86d975f6fa` (perfil "Equipe Vocação de Pai", e-mail `contato@vocacaodepai.com.br`, `role='editor'`). `0008_seed_autor.sql` cria o usuário em `auth.users`/`auth.identities` com esse id **só se** ainda não existir usuário com esse e-mail (senha aleatória; o dono define a senha real por "Reset password" no Dashboard, como o doc 03 §9.2 manda) e garante a linha em `profiles`. Se o dono criar o usuário pelo Dashboard antes de aplicar a 0008, o id real é o do Dashboard: conferir com `select id from auth.users where email = 'contato@vocacaodepai.com.br'` e atualizar este registro. Por isso a `0009` resolve `author_id` com `coalesce((select id from auth.users where lower(email) = ...), '<AUTHOR_UUID>'::uuid)`.
- 2026-10-30 · F1 / Etapa 9 (posts 1-5) · Categorias dos posts 1-5 nos slugs reais do `0002_blog.sql`, usando a subcategoria do doc 00 §3.3 quando há encaixe exato: post 1 → `gestacao-e-parto`; posts 2 e 3 → `recem-nascido`; post 4 → `paternidade-por-fase` (categoria-mãe: limites atravessam as idades); post 5 → `orcamento-familiar`. A listagem da categoria-mãe inclui os posts das filhas (doc 00 §3.2).
- 2026-10-30 · F1 / Etapa 9 (posts 1-5) · `publish_at` escalonado para trás (`now() - interval 'N days'`: post 1 = 9 dias, post 5 = 5 dias) em vez de `now()` puro, para cumprir o doc 03 §9.2 ("1 por dia, para o feed não nascer tudo no mesmo dia") sem deixar nada no futuro; `on conflict (slug) do update` preserva o `publish_at` já existente.
- 2026-10-30 · F1 / Etapa 9 (validador) · `scripts/validate-content.mjs` tem dois modos: `--files <.sql|.json>` (valida os INSERTs de seed sem banco; universo de slugs = arquivos passados + `supabase/migrations/00NN_*.sql` + `--known-slugs` + banco, se houver variáveis) e `--all` / `--since 7d` / `--slug a,b` (REST do Supabase; sem variáveis imprime aviso e sai com 0). Links internos: ≥10 **destinos distintos** (doc 03 §9.5); `/categoria/<slug>` conta. O "Sinal de alerta" precisa citar um profissional (médico, padre, advogado, contador…). Termos proibidos em `scripts/rotina/proibidos.json` (doc 10 §5.3), casados por palavra inteira (para "cura" não pegar "procurar").
- 2026-10-30 · F1 / Etapa 9 (posts 1-5) · Capas via Unsplash (`mcp__Unsplash__search_photos`; URL regular do CDN sem o parâmetro `ixid`; HEAD 200 conferido; escolhidas pela descrição, sem conferência visual). **Capas da seed (posts 1-5): slug | URL | fotógrafo** — para o dono revisar:
  - `vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem` | https://images.unsplash.com/photo-1710897538265-93ca0abac2ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Jeferson Santu (Unsplash) — "a man and a woman holding their pregnant belly"
  - `como-segurar-um-recem-nascido-com-seguranca` | https://images.unsplash.com/photo-1650872466823-433d9e461b9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Tim Mossholder (Unsplash) — "Father with newborn son"
  - `rotina-do-pai-nos-primeiros-30-dias-do-bebe` | https://images.unsplash.com/photo-1773243086594-43577199874f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Olivia Anne Snyder (Unsplash) — "Father holding his newborn baby gently"
  - `como-dar-limites-sem-gritar-autoridade-com-calma` | https://images.unsplash.com/photo-1571650452577-755817f40c0a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Kelli McClintock (Unsplash) — "Father and Son on a jetty sitting"
  - `orcamento-familiar-para-quem-vai-ser-pai` | https://images.unsplash.com/photo-1758522487140-f6d76156d7d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080 | Vitaly Gariev (Unsplash) — "Man sitting at table reading papers with breakfast"
- 2026-10-30 · F1/2.1 · Cópia da base feita com `tar` (mesmas exclusões: `.git`, `node_modules`, `docs`, e os arquivos próprios `CLAUDE.md`, `README.md`, `PLANO-MESTRE.md`, `.gitignore`) · `rsync` não existe no container.
- 2026-10-30 · F1/2.2 · `src/integrations/supabase/cron-auth.ts` apagado junto com o Lovable · só lia `LOVABLE_CRON_SECRET` (nome fora da lista do CLAUDE.md §13) e nenhum arquivo o importava.
- 2026-10-30 · F1/2.2 · Código server-side (`client.server.ts`, `auth-middleware.ts`, `seo.functions.ts`, `sitemap[.]xml.ts`) lê `process.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` em vez de `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (doc 03 §1.4) · CLAUDE.md §13 prevalece (lista fechada de variáveis); fallbacks ficam nos placeholders `<SUPABASE_URL>` / `<SUPABASE_PUBLISHABLE_KEY>`.
- 2026-10-30 · F1/2.2 · `bunfig.toml` mantido só com `@lovable.dev/vite-tanstack-config` em `minimumReleaseAgeExcludes` · os demais pacotes Lovable saíram; `bun.lock` removido (npm é o gerenciador).
- 2026-10-30 · F1/2.2 · `src/routeTree.gen.ts` apagado e regenerado pelo `npm run build` · era o da mãe (rotas removidas); o plugin do TanStack Router o gera a cada build/dev.
- 2026-10-30 · F1/2.3 · `__root.tsx` já carrega Google Fonts Barlow Condensed + Inter · adiantado da etapa 4 só o `<link>`; tokens do `styles.css` continuam para a etapa 4.
- 2026-10-30 · F1/2.4 · `ToolsTeaser.tsx`, `PollWidget.tsx` e `lib/ecosystem.ts` apagados; enquete removida do `AdminEditor` · eram 100% maternidade/`polls` (tabela que não existe no doc 02); `Home.tsx` ficou simples (hero + artigos + categorias + newsletter) com `// TODO Fase N`.
- 2026-10-30 · F1/2.4 · `FotosModelos.tsx` e `GaleriaProduto.tsx` passam a renderizar só os dados do nó Tiptap (sem consultar `products`) · `Product`/`price-range` saem na Fase 1; Fases 2/3 religam faixa de preço e galeria com as COLUNAS-CHAVE.
- 2026-10-30 · F1/2.4 · `lib/rank.ts` virou patente do pai (`fatherRank`/`nextFatherRank`: "Pai em Formação" … "Pai Lenda") · textos de mãe; `QuizWidget`/`QuizRanking` atualizados.
- 2026-10-30 · F1/2.4 · `mother_signature` removido de `Author`, `Comment`, `db.ts` e `Comments.tsx` · coluna não existe no schema do doc 02.
- 2026-10-30 · F1/2.4 · `AdminDashboard` sem a aba Histórias (fica `// TODO`) · volta na Fase 7 com `stories` e `moderation_log`.
- 2026-10-30 · F1/2.5 · Logo em texto (`SITE_NAME` em `font-display`) no header e rodapé até a etapa 6.6 · logos PNG da mãe apagadas; rodapé lista as categorias vindas do banco (sem lista fixa).
- 2026-10-30 · F1/2.5 · Menu da Fase 1 = Início · Blog (dropdown de categorias) · Sobre · Contato · as seções oficiais entram nas etapas 4-7 (placeholders) e nas Fases 2-7.
- 2026-10-30 · F1/2.5 · `public/ads.txt` e `src/lib/adsense.ts` continuam com o publisher do grupo (`pub-5212610948635761`) · AdSense do Vocação de Pai é pendência do dono (Fase 8); trocar quando ele informar.
- 2026-10-30 · F1/2.5 · `src/integrations/supabase/types.ts` ainda é o gerado da mãe (cita `enxoval_done`, `stories` etc.) · a etapa 3 o substitui por `generate_typescript_types` do projeto novo.
- 2026-10-30 · F1/2.5 · Edge functions em `supabase/functions/*` e migrations `2026*.sql` copiadas sem alteração · as migrations são apagadas na etapa 3; as edge functions são ajustadas (remetente/segredos) quando forem reimplantadas.
- 2026-10-30 · F1/2.6 · `eslint.config.js` ignora `.vercel`, `.tanstack` e `supabase/functions` · `eslint .` passava Prettier nos 168 bundles de `.vercel/output` (lint levava >25 min) e as edge functions são Deno (fora do tsconfig; 26 erros de Prettier e 6 `any` herdados do VDM) — ajustá-las quando forem reimplantadas.
- 2026-10-30 · F1/2.6 · Lint do escopo da etapa 2 (`src`, `vite.config.ts`, `eslint.config.js`) = 0 erros / 7 avisos `react-refresh/only-export-components` herdados do VDM (`Callout.tsx`, `CookieConsent.tsx`, `router-compat.tsx`) · avisos não falham o lint; `scripts/validate-content.mjs` (etapa 9, outro agente) ainda precisa de `npx prettier --write`.

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
- [ ] Depois de aplicar `0008_seed_autor.sql`: definir a senha do usuário `contato@vocacaodepai.com.br` (autor "Equipe Vocação de Pai") no Supabase Dashboard › Authentication › Users ("Reset password" / "Send password recovery") e guardá-la; a migration cria o usuário com senha aleatória
- [ ] Revisar visualmente as capas da seed (posts 1-5 e 6-10, listadas em "Decisões") e trocar qualquer uma que contrarie a linha editorial (CLAUDE.md §3)

## Histórico de sessões

> Uma linha por sessão de Claude Code: data · fase/etapas tocadas · PR · resumo em 1 linha.

| Data | Fase/etapas | PR | Resumo |
|---|---|---|---|
| 2026-10-24 | Planejamento | — | Plano escrito: `PLANO-MESTRE.md`, `CLAUDE.md`, `README.md`, `docs/plano/00…13`, `PROGRESSO.md` |
| 2026-10-29 | Planejamento | #1 | Docs 09 (Irmandade e Formação) e 12 (backlog) escritos; revisão cruzada de coerência (59 ajustes em 16 arquivos); pesquisas em `docs/plano/anexos/` |
