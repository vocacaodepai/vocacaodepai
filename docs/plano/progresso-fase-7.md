# Progresso — Fase 7 (Irmandade e Formação)

> Registro da sessão `claude/fase-7-irmandade-formacao` (2026-10-30). Para fundir em `docs/plano/PROGRESSO.md`
> ("Decisões tomadas durante a execução" e "Pendências do dono") na consolidação da fase.
> Banco ainda não existe (placeholder `<SUPABASE_PROJECT_REF>`): **nada foi aplicado no Supabase**; tudo renderiza
> com estados vazios e as migrations/seeds foram validadas num Postgres 16 local (stub + 0001–0007 + 0015 + 0016).

## Entregue

| Item (doc 09) | Arquivo | Estado |
|---|---|---|
| Complemento da 0006 com o SQL integral do doc 09 §2.2 (email_verified, can_post_irmandade, log_moderation, vdp_internal, view `irmandade_members`, `story_likes` + `like_story`, `answer_votes` + `vote_answer`, colunas extras de stories/questions/answers/events/tracks/track_steps/track_progress/challenges/challenge_days, `challenge_enrollments`, `moderate_question/answer`, `report_irmandade`, `rsvp_event`, `track_is_completed`, `challenge_current_day`, `member_streak/points/title`, `save_step_note`, `start_challenge`, `member_formacao_summary`, versões finais de `guard_member_status`, `moderate_story`, `accept_answer`, `complete_track_step`, `complete_challenge_day`, `get_member_dashboard`; bucket `stories` e cron guardados por `do $$`) | `supabase/migrations/0015_irmandade_formacao_extra.sql` | pronta, validada local (22 funções, 20 insígnias), **não aplicada** |
| Seeds: 8 trilhas (107 passos, 5 tipos, módulos, `related_post_slug`), 3 desafios × 30 dias (literal do §6.2), 2 eventos de exemplo em `draft` | `supabase/seed/tracks.json`, `supabase/seed/challenges.json`, `scripts/seed-formacao.mjs` → `supabase/migrations/0016_seed_formacao.sql` | prontos, validados local (8/107/3/90/2), **não aplicados** |
| Textos fixos (código de conduta, aviso profissional, posicionamento) | `src/content/irmandade/codigo-de-conduta.ts` | pronto |
| Libs: tipos, categorias de história, blacklist, JSON-LD (`QAPage`, `Event`, `Course`), gate "1 história grátis", rate limit | `src/lib/irmandade/*`, `src/lib/formacao/types.ts`, `src/lib/rate-limit.ts` | prontos |
| Queries anônimas (histórias, perguntas + respostas, eventos, categorias nível 1, trilhas + passos + post relacionado, desafios + dias) | `src/lib/db/irmandade.ts`, `src/lib/db/formacao.ts` | prontos |
| Server functions: hub, histórias (criar, curtir), perguntas (criar com slug único/duplicidade/≤2 links/blacklist, responder, votar, melhor resposta, denunciar), eventos (RSVP), Formação (progresso de trilha, concluir passo + nota + insígnias novas, desafios, começar, marcar dia, painel) — escrita via `requireSupabaseAuth` + RLS/RPC + `rateLimit` | `src/lib/community.functions.ts`, `src/lib/tracks.functions.ts` | prontos |
| Lembrete de evento 24 h antes (Resend, `reminded_at`, idempotente) + rota `GET /api/cron/event-reminder` protegida por `CRON_SECRET` | `src/lib/event-reminder.server.ts`, `src/routes/api/cron.event-reminder.ts` | pronto (sem teste real: sem Resend/banco) |
| `/irmandade` (hub: 3 áreas, últimas histórias, perguntas sem resposta, próximos encontros, código de conduta, CTA grupo/Formação) | `src/routes/_site/irmandade.tsx`, `src/pages/irmandade/IrmandadePage.tsx` | pronto |
| `/historias`, `/historias/$id` (gate 1 grátis, "Esse relato me ajudou", denúncia, outras histórias, JSON-LD Article + Breadcrumb), `/historias/nova` (textarea, categoria, foto via `uploadImageFn` pasta `stories`, conduta, honeypot; noindex) | `src/routes/_site/historias/*`, `src/pages/irmandade/{HistoriasPage,HistoriaPage,NovaHistoriaPage}.tsx`, `src/components/irmandade/{StoryCard,LikeStoryButton,ConductCheckbox,ReportButton}.tsx` | prontos |
| `/perguntas` (chips de categoria, Sem resposta, Resolvidas, ordenação), `/perguntas/$slug` (votos, melhor resposta via `accept_answer`, form de resposta, JSON-LD QAPage), `/perguntas/nova` (noindex) | `src/routes/_site/perguntas/*`, `src/pages/irmandade/{PerguntasPage,PerguntaPage,NovaPerguntaPage}.tsx`, `src/components/irmandade/{QuestionCard,AnswerList,AnswerForm}.tsx` | prontos |
| `/eventos` (Próximos/Passados, modo, UF), `/eventos/$slug` (RSVP com lotação, Maps, `.ics`, WhatsApp, "Como foi", JSON-LD Event) | `src/routes/_site/eventos/*`, `src/pages/irmandade/{EventosPage,EventoPage}.tsx`, `src/components/irmandade/{EventCard,RsvpButton}.tsx` | prontos |
| `/formacao` (trilhas por pilar, desafios, streak/pontos/título e BadgeGrid para o membro), `/formacao/$slug` (player: módulos, passos bloqueados em sequência, 5 tipos, regras de conclusão, nota/checklist em `track_progress.note`, `?passo=N`, tela de trilha concluída, JSON-LD Course) | `src/routes/_site/formacao/*`, `src/pages/formacao/{FormacaoPage,TrilhaPage}.tsx`, `src/components/formacao/{TrackCard,TrackPlayer,ProgressRing,StreakChip,BadgeGrid}.tsx` | prontos |
| `/desafios`, `/desafios/$slug` (calendário 6×5 com estados, começar, marcar dia com nota, `DIA_FUTURO`, "Pausa? Retome do dia X", anônimo vê dia 1 + títulos) | `src/routes/_site/desafios/*`, `src/pages/formacao/{DesafiosPage,DesafioPage}.tsx`, `src/components/formacao/{ChallengeCard,ChallengeCalendar,ChallengeDayCard}.tsx` | prontos |
| Admin: `/admin/irmandade` (+ atalhos `/admin/moderacao`, `/admin/eventos`, `/admin/formacao`): filas Histórias/Perguntas/Respostas (pendentes, aprovar, rejeitar com motivo ≥ 10 e motivos prontos), Denúncias (`moderation_log` flag), Eventos (CRUD, publicar, realizado, cancelar, RSVPs + CSV), Trilhas/Desafios (listagem, publicar/despublicar); links no `AdminLayout` e `AdminDashboard` | `src/admin/{AdminIrmandade,admin-irmandade-db}.ts*`, `src/routes/_admin/admin/{irmandade/index,moderacao,eventos,formacao}.tsx` | prontos |
| Sitemap: `/irmandade`, `/historias(+/$id approved)`, `/perguntas(+/$slug)`, `/eventos(+/$slug published)`, `/formacao(+/$slug)`, `/desafios(+/$slug)` | `src/routes/sitemap[.]xml.ts` | pronto |

Validação local: `npm run build`, `npx tsc --noEmit` e `npm run lint` verdes (12 avisos pré-existentes de estilo
`react-refresh`/`exhaustive-deps`, 0 erros); `node scripts/validate-content.mjs --files` não cobre trilhas (JSON validado
com `python3`); migrations 0015 e 0016 aplicadas num PG 16 local sobre 0001–0007 com smoke test das RPCs
(`start_challenge`, `complete_challenge_day` → `DIA_FUTURO`, `complete_track_step`, `save_step_note`, `member_streak` = 1,
`member_points` = 15, `grant_badges_for_me`, `like_story`, história nasce `pending`).

## Decisões tomadas durante a execução

- 2026-10-30 · F7 · **0006 não foi reescrita**; o que faltava do doc 09 §2.2 entrou em `0015_irmandade_formacao_extra.sql`
  (idempotente, `create or replace`). Motivo: a 0006 real já estava commitada nas fases anteriores; o doc 09 §2.1 prevê
  aplicar o SQL como "v2" sem renomear nada. Bucket `storage` e cron `event-reminder` ficam em `do $$` guardados por
  `to_regclass` para rodar também em PG local; o cron chama `CRON_SECRET` (CLAUDE.md §13), não `INTERNAL_FN_SECRET`.
- 2026-10-30 · F7 · Componentes em `src/components/irmandade/*` e `src/components/formacao/*` (estrutura do CLAUDE.md §2),
  não em `community/`/`tracks/`/`members/` do doc 09 §10.1. Páginas em `src/pages/irmandade/*` e `src/pages/formacao/*`.
  `BadgesWall` = `BadgeGrid` (`src/components/formacao/BadgeGrid.tsx`).
- 2026-10-30 · F7 · Server functions autenticadas usam o middleware existente `requireSupabaseAuth` (bearer anexado por
  `attachSupabaseAuth` em `src/start.ts`) em vez de `requireUser(accessToken)`/`src/lib/supabase-server` do doc 09 (não
  existem no repo — Fase 5 pendente). `rateLimit` é em memória (`src/lib/rate-limit.ts`). Turnstile **não** foi ligado
  (sem `TURNSTILE_*`; componente da Fase 6 não existe): antispam = honeypot + rate limit + blacklist + ≤ 2 links + duplicidade.
- 2026-10-30 · F7 · Duplicidade de pergunta por `ilike` dos 60 primeiros caracteres do título nos últimos 30 dias (o
  `similarity()` do pg_trgm exigiria RPC própria); registrar RPC `find_similar_question` como melhoria da Fase 8.
- 2026-10-30 · F7 · Seeds: `tracks.json` usa formato compacto `steps = [position, module, type, title, summary, rule, post, minutes?]`
  e o `body` Tiptap é **gerado** pelo `seed-formacao.mjs` a partir do tipo + resumo (parágrafos reais, semáforo quando o
  resumo traz verde/atenção/alerta, `taskList` para checklist, "Escreva abaixo" para exercício, blocos Leitura/Oração/Ação
  na T4). T1 e T6 **não** receberam os corpos longos de 300–700 palavras do doc 09 §5.3: fica para a rotina da Fase 8
  engordar (`body` é sobrescrito pelo upsert quando o JSON trouxer `body` explícito). Seed gerada = `0016_seed_formacao.sql`
  (nome livre da numeração: `0008` já é `seed_autor`).
- 2026-10-30 · F7 · `challenge_days.title` = primeira oração da tarefa (até 64 caracteres), derivada no gerador, porque o
  doc 09 §6.2 só define tarefa e reflexão.
- 2026-10-30 · F7 · `post_id` dos passos resolve pelo slug publicado no momento do upsert; no banco vazio fica nulo e o
  passo `artigo`/`video` vira leitura com o resumo (comportamento previsto no doc 09 §5.1). Reaplicar a 0016 depois das
  seeds de posts preenche os `post_id`.
- 2026-10-30 · F7 · Capas das trilhas e desafios ficaram `null` (sem busca de imagem nesta sessão); cards mostram o ícone
  do pilar. Pendência para a Fase 8 / rotina (cascata de imagens do CLAUDE.md §5.3).
- 2026-10-30 · F7 · E-mails `storyApproved`/`storyRejected`/`questionApproved`/`answerReceived`/`eventCanceled` **não**
  foram implementados (sem `email.functions.ts` da Fase 5 nem edge functions); o admin avisa que o e-mail depende do Resend.
  Só o lembrete de evento (`event-reminder.server.ts`) envia e-mail.
- 2026-10-30 · F7 · Doc 02 §1.3 já lista `/perguntas/nova` e `/eventos/$slug` na tabela de rotas secundárias (linha
  "Irmandade | `/perguntas/nova`, `/eventos/$slug` | doc 09 §0"); nada a alterar.
- 2026-10-30 · F7 · Admin de Formação é só listagem + publicar/despublicar (`TracksEditor`/`ChallengesEditor` com editor
  de passos ficam para a Fase 8); o conteúdo é mantido pelos JSON + `seed-formacao.mjs`.

## Não feito nesta sessão (fica para a próxima)

- 7.9b Biblioteca do Pai e produtos digitais (doc 09 §12b) — fora do escopo pedido.
- 7.10 Widgets reais no `/area-do-pai` (`FormacaoWidget`, abas "Minhas histórias/perguntas/encontros") — a Área do Pai
  (Fase 5) ainda é placeholder; `getMyFormacaoFn` e `BadgeGrid` já estão prontos para o painel consumir.
- 7.11 Testes de RLS e fluxo no projeto real (só local); newsletter com bloco "Sua formação" (§12); certificado PDF (§5.4).
- Aplicar `0015` e `0016` com `mcp__Supabase__apply_migration` quando o projeto existir; regenerar `types.ts`.

## Pendências do dono

- Criar o projeto Supabase (bloqueia aplicar 0015/0016 e testar RLS/moderação).
- `RESEND_API_KEY` e `CRON_SECRET` na Vercel para o lembrete de evento; agendar o cron (Supabase `0015` bloco 13 com
  `<SUPABASE_PROJECT_REF>` real ou Vercel Cron em `/api/cron/event-reminder`, de hora em hora).
- Publicar os 2 eventos de exemplo (`draft`) em `/admin/eventos` com data/link reais, ou apagá-los pelo Dashboard.
