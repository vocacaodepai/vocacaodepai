# Progresso — Fase 6 (Pai Indica Pai: vagas, indicações, Pai Profissional e mentoria)

> Registro da sessão `claude/fase-6-pai-indica-pai` (2026-10-30). Para fundir em `docs/plano/PROGRESSO.md`
> ("Decisões tomadas durante a execução" e "Pendências do dono") na consolidação da fase.
> Banco ainda não existe (placeholder `<SUPABASE_PROJECT_REF>`): nada foi aplicado; tudo renderiza com
> estados vazios. Validação local: `npx tsc --noEmit`, `npm run lint` e `npm run build` verdes;
> `node scripts/validate-content.mjs` sem banco (nada a validar).

## Entregue

| Item (doc 08) | Arquivo | Estado |
|---|---|---|
| SQL complementar à 0005 (idempotente): colunas extras de `jobs` (`area`, `contact_phone`, `consent_contact`, `rejection_reason`, `auto_hidden`, `report_count`, `renewed_count`, `apply_clicks`, `search_content` gerado + GIN), índice único título+empresa entre ativos, policy `jobs: own delete` (LGPD), trigger `pip_enforce_daily_limit` (3/24 h em jobs+referrals+professionals), triggers de reset na edição (indicações/profissionais), `moderate_job` com motivo/prazo da aprovação/`auto_hidden`, `renew_job`, `renew_referral`, `report_entity`, `track_job_apply_click`, `block_user`, views `jobs_public` e `pip_metrics_daily` (`security_invoker`) | `supabase/migrations/0014_pai_indica_pai_extra.sql` | pronto, **não aplicado** (sem projeto) |
| Taxonomias (UFs, tipos, áreas, kinds, áreas de mentoria, motivos de denúncia, motivos de rejeição), código de conduta, aviso antifraude, prazos | `src/lib/pai-indica-pai/taxonomies.ts` | pronto |
| Tipos locais (`JobRow`, `JobPublic`, `JobDetailData`, `ReferralRow`, `ProfessionalRow`, `MentorshipRow`, `ModerationQueue`…) | `src/lib/pai-indica-pai/types.ts` | pronto |
| Schemas zod 4 (`jobSchema`, `referralSchema`, `professionalSchema`, `mentorshipRequestSchema`, `reportSchema`, `moderateSchema`, `blockSchema`, `alertsSchema` + search params de cada lista) com honeypot `website` e `turnstile_token` opcional | `src/lib/pai-indica-pai/schemas.ts` | pronto |
| Blacklist (encurtadores, termos de golpe/MMN/aposta/adulto, palavrões; `PIP_BLACKLIST_EXTRA`) | `src/lib/pai-indica-pai/blacklist.ts` | pronto |
| Consultas (lista com filtros/busca full-text/ordenação/paginação 12, detalhe com contato só se consentido e ao vivo, semelhantes, indicações, profissionais, mentores com vagas livres, hub) | `src/lib/pai-indica-pai/queries.ts`, `format.ts` | pronto |
| Server functions: leitura (`getPipHubData`, `listJobs`, `getJobBySlug`, `listReferrals`, `listProfessionals`, `getProfessionalBySlug`, `listMentors`); escrita como usuário (`createJob`, `createReferral`, `createProfessional`, `requestMentorship`, `respondMentorship`) com Turnstile (se houver chave), honeypot, blacklist, limite 3/dia e e-mail; `reportEntity` (anônimo/logado, rate limit por IP); admin (`getModerationQueue`, `moderateEntity` via `moderate_*`, `blockUser`, `markReportReviewed`); alertas (`saveJobAlerts`, `cancelJobAlerts`) | `src/lib/pai-indica-pai/functions.ts` | pronto |
| Helpers do navegador: minhas publicações, renovar, excluir (hard delete), arquivar perfil, salvar vaga (`saved_items`), views/cliques, reenvio de confirmação, tradução de erros | `src/lib/pai-indica-pai/client.ts` | pronto |
| JSON-LD `JobPosting` completo (title, description HTML, datePosted, validThrough, hiringOrganization, jobLocation ou TELECOMMUTE + applicantLocationRequirements, employmentType, baseSalary opcional) + `BreadcrumbList`; expirada = `noindex`, sem JobPosting | `src/lib/pai-indica-pai/jsonld.ts`, `src/routes/_site/pai-indica-pai/vagas/$slug.tsx` | pronto |
| E-mails (recebida, aprovada com "Compartilhar no WhatsApp", rejeitada com motivo, digest, pedido e aceite de mentoria) via `sendEmail` existente (Resend HTTP, remetente `contato@`) | `src/lib/pai-indica-pai/emails.ts` | pronto |
| Componentes: `PipNav`, `Field`, `ConductNotice`, `AntifraudNotice`, `EmptyState`, `LoginGate` (anônimo → entrar / `/entrar`; sem e-mail confirmado → reenviar), `StatusBadge`, `TurnstileField`, `JobCard`, `JobDetail` (+ `ShareWhatsAppButton`, salvar, candidatura com métrica), `JobFilters`, `JobForm` (preview), `ReferralCard/Form`, `ProfessionalCard/Form`, `MentorCard` + `MentorshipRequestDialog`, `ReportDialog`, `AlertsPreferencesForm`, `MyPublications` | `src/components/pai-indica-pai/*` | pronto |
| Páginas: hub, lista de vagas, vaga, nova vaga, diretório, perfil, novo perfil (`?mentor=1`), indicações, nova indicação, mentoria | `src/pages/pai-indica-pai/*`, `src/routes/_site/pai-indica-pai/**` | pronto |
| RSS `/pai-indica-pai/vagas/rss.xml` (50 itens, filtros `?uf=&area=&remoto=1`, `atom:link`), `/sitemap-vagas.xml` (seção + vagas ao vivo + perfis aprovados) | `src/routes/_site/pai-indica-pai/vagas/rss[.]xml.ts`, `src/routes/sitemap-vagas[.]xml.ts` | pronto |
| Crons: `GET /api/cron/expire-jobs` (service role → `expire_jobs()`) e `GET /api/cron/vagas-digest` (vagas 24 h × `segments.vagas` dos assinantes confirmados), ambos `Authorization: Bearer CRON_SECRET` em tempo constante; workflow diário (08:00 Brasília) chama os dois | `src/routes/api/cron/{expire-jobs,vagas-digest}.ts`, `.github/workflows/vagas-digest.yml` | pronto |
| Admin: `/admin/pai-indica-pai` (abas Vagas/Indicações/Profissionais/Mentorias/Denúncias/Bloqueados, filtro de status, auto-ocultas no topo, "possível duplicata", Ver em Sheet com contato, Aprovar, Rejeitar com motivos prontos, Bloquear/Desbloquear, métricas) + atalho `/admin/moderacao` → redirect; link "Pai Indica Pai" na barra do painel | `src/admin/AdminModeracao.tsx`, `src/routes/_admin/admin/{pai-indica-pai,moderacao}.tsx`, `src/admin/AdminLayout.tsx` (só o link) | pronto |
| Métricas: `increment_job_views` (1×/sessão), `track_job_apply_click`, eventos GA4 `job_view`, `job_apply_click`, `job_share_whatsapp`, `job_report`, `job_submit`, `mentorship_request`; conversão exibida em "Minhas vagas" | `client.ts`, `JobDetail.tsx`, `MyPublications.tsx` | pronto |

## Decisões tomadas durante a execução

- 2026-10-30 · F6 · **Pastas**: `src/lib/pai-indica-pai/*` e `src/components/pai-indica-pai/*` (CLAUDE.md §2 e instrução da sessão) em vez de `src/lib/pip/*` / `src/components/pip/*` do doc 08 §4; server fns em `functions.ts` (doc 02 §4 chamava de `jobs.functions.ts`). Páginas em `src/pages/pai-indica-pai/*`.
- 2026-10-30 · F6 · **Prazo da vaga = 45 dias** (0005 e checklist 6.3), não 30 (doc 08 §1.3). `moderate_job` (0014) passa a contar a partir da aprovação, mantendo a assinatura `(p_job_id, p_action, p_reason)` da 0005 e o `award_badge('pai-que-indica')`. `renew_job` soma 45 dias.
- 2026-10-30 · F6 · **Rota do admin = `/admin/pai-indica-pai`** (doc 02 §1.3 e doc 08 §6); `/admin/moderacao` (checklist 6.8) existe só como redirect. Página `src/admin/AdminModeracao.tsx` (nome pedido pela sessão). `AdminDashboard.tsx` não foi tocado; o acesso é pelo link na barra do `AdminLayout`.
- 2026-10-30 · F6 · **Turnstile sem dependência nova**: `TurnstileField` reaproveita o carregador do `NewsletterSignup` (`window.turnstile`, chave `TURNSTILE_SITE_KEY`); sem chave, o widget não aparece e o servidor (`verifyTurnstile` de `newsletter.server.ts`) degrada para honeypot + rate limit, como na newsletter. Não instalado `@marsidev/react-turnstile` nem `resend` (e-mail por HTTP com `sendEmail` existente; remetente `contato@`, CLAUDE.md §11, não `vagas@`).
- 2026-10-30 · F6 · **Autenticação nas server fns** pelo middleware já gerado `requireSupabaseAuth` (bearer do client → RLS do usuário), em vez de mandar `access_token` no corpo (doc 08 §4.4). Service role só para e-mails (`auth.admin.getUserById`), perfis públicos em listas (`profiles` não é legível por anônimo), página de vaga encerrada, alertas e crons; sem a chave, tudo degrada (nome "Pai", sem e-mail).
- 2026-10-30 · F6 · **`jobs` real (0005) difere do doc 08**: `guard_job_status` impede o autor de mexer em status, e o autor só edita `pending`/`rejected`; por isso o trigger "editar aprovado volta para pending" ficou só em `job_referrals`/`professionals`. `expires_at` é `not null` com default 45 dias (preview usa o mesmo). `moderation_log.entity_id` é `text` → todo insert usa `::text`.
- 2026-10-30 · F6 · **Sitemap**: `/sitemap-vagas.xml` separado; `src/routes/sitemap[.]xml.ts` e `public/robots.txt` **não foram editados** (outras fases em paralelo). Pendência: referenciar `sitemap-vagas.xml` no `robots.txt`/índice na consolidação.
- 2026-10-30 · F6 · **Alertas de vagas**: gravados em `newsletter_subscribers.segments.vagas` (`{ufs, areas, remoto, freq:'diario'}`) reaproveitando `upsertPendingSubscriber` (double opt-in); cancelamento pelo link do e-mail `/pai-indica-pai?alertas=cancelar&email=` (remove só a chave `vagas`). Digest considera `status='confirmed'` (valor da 0001; o doc 08 dizia `active`).
- 2026-10-30 · F6 · **`/minha-conta` (Fase 5, paralela) não foi criada aqui**: as abas "Pai Indica Pai" e "Mentoria" ficam a cargo da Fase 5, que pode montar `MyPublications` e `fetchMyMentorships`/`respondMentorship` já prontos. Enquanto isso, "Minhas publicações" aparece em `/pai-indica-pai/vagas/nova` e `/indicacoes/nova`; links para `/minha-conta` usam o `Link` sem tipagem de `router-compat`.
- 2026-10-30 · F6 · Perfil do Pai Profissional usa `$id` = slug (rota `/pai-indica-pai/profissionais/$id`, conforme a sessão), e não `$slug` do doc 08.
- 2026-10-30 · F6 · Google Indexing API (doc 08 §8.2) não implementada: sem credencial; fica para a Fase 8.

## Pendências do dono

- Aplicar `0005_pai_indica_pai.sql` e `0014_pai_indica_pai_extra.sql` no projeto Supabase (MCP `apply_migration`) e regenerar `src/integrations/supabase/types.ts`.
- Cadastrar na Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (já no `.env.example`); e o segredo `CRON_SECRET` no GitHub (workflow `vagas-digest.yml`).
- Ativar pg_cron `vdp-expire-jobs` (0008_cron.sql, Fase 8) — até lá a expiração roda pelo workflow diário.
- Referenciar `https://vocacaodepai.com.br/sitemap-vagas.xml` no `robots.txt` (não editado nesta sessão).
- Testar os 23 critérios de aceite do doc 08 §10 com banco real (RLS, Turnstile, e-mails, Rich Results Test do JobPosting).

## Como validar

```bash
npx tsc --noEmit && npm run lint && npm run build
curl -H "Authorization: Bearer $CRON_SECRET" https://<preview>/api/cron/expire-jobs   # 200; sem header → 401
curl -H "Authorization: Bearer $CRON_SECRET" https://<preview>/api/cron/vagas-digest  # {"sent":0,...}
curl https://<preview>/pai-indica-pai/vagas/rss.xml && curl https://<preview>/sitemap-vagas.xml
```
