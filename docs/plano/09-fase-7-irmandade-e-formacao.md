# Fase 7 — Irmandade e Formação: histórias, perguntas e respostas, encontros, trilhas, desafios e insígnias

> Documento executável. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code dentro de
> `/home/user/vocacaodepai`. Siga os passos na ordem. Tudo em PT-BR. Decisões já tomadas: não reabrir.
>
> Pré-requisitos: Fase 1 (`0001_core.sql`: `profiles`, `is_admin()`, `set_updated_at()`, `moderation_log`,
> `_tmp_post_staging`, layouts `_site`/`_admin`, editor Tiptap, `src/lib/tiptap-html.ts`), Fase 5 (`0004_membros.sql`:
> `/entrar`, `/cadastro`, `useAuth()`, `RequireAuth`, `SaveButton`, `requireUser()`, `rateLimit()`, Resend, `badges`,
> `user_badges`, painel `/area-do-pai`). A Fase 6 é opcional: a insígnia `pai-que-indica` só é avaliada se a tabela
> `jobs` existir (`to_regclass`).
>
> Se `docs/plano/02-arquitetura-e-stack.md` divergir deste documento em NOMES de tabelas, colunas, rotas ou arquivos,
> **o doc 02 prevalece**. Tudo o que este documento acrescenta é aditivo (`add column if not exists`, funções novas);
> nada renomeia o que o doc 02 define. As divergências conhecidas e como foram resolvidas estão na seção 2.1.
>
> Repositório de referência (somente leitura): `/home/user/vocacaodemae`. As histórias já existem lá e são a base
> desta fase: `src/routes/_site/historias/{index,$id,nova}.tsx`, `src/pages/{StoriesPage,StoryPage,NewStoryPage}.tsx`,
> `src/components/stories/StoryCard.tsx`, `src/lib/stories-read.ts`, `src/lib/story-categories.ts`,
> `src/lib/queries.ts` (`queryStories`, `queryStoryById`, `STORY_SELECT`), `src/lib/db.ts` (`createStory`,
> `fetchMyStories`, `fetchAllStories`, `moderateStory`, `deleteStory`, `uploadImage`), `src/lib/hub.functions.ts`
> (`getStoriesData`, `getStoryData`) e `src/admin/AdminDashboard.tsx` (aba `stories`). Lá a tabela `stories` tem
> `author_name, category, content (text), photo_url, status, title, user_id` — mesmo desenho que o doc 02 adotou.

---

## 0. Visão geral da fase

A **Irmandade** é a comunidade do Vocação de Pai (histórias, perguntas e respostas, encontros). A **Formação** é a
escola do pai (trilhas com passos e desafios de 30 dias). As duas se ligam pelas **insígnias** (`badges`), pelo
painel da Área do Pai e pelo resumo semanal por e-mail.

| Frente | Rotas | Tabelas | O que é |
|---|---|---|---|
| Hub | `/irmandade` | — | Resume as três áreas da comunidade + código de conduta + próximos encontros |
| Histórias de pai | `/historias`, `/historias/$id`, `/historias/nova` | `stories`, `story_likes` | Relato real de um pai, moderado antes de ir ao ar, com "Esse relato me ajudou" |
| Perguntas da Irmandade | `/perguntas`, `/perguntas/$slug`, `/perguntas/nova` | `questions`, `answers`, `answer_votes` | Pergunta moderada; respostas com voto; autor marca a melhor resposta; JSON-LD `QAPage` |
| Encontros | `/eventos`, `/eventos/$slug` | `events`, `event_rsvps` | Encontros presenciais, lives e retiros; RSVP; lembrete 24 h antes por e-mail; JSON-LD `Event` |
| Trilhas | `/formacao`, `/formacao/$slug` | `tracks`, `track_steps`, `track_progress` | 8 trilhas com player, passos de 5 tipos e progresso |
| Desafios do Pai | `/desafios`, `/desafios/$slug` | `challenges`, `challenge_days`, `challenge_progress`, `challenge_enrollments` | 3 desafios de 30 dias, dia a dia, com recomeço suave e streak |
| Insígnias | `/area-do-pai` (bloco `BadgesRow`) | `badges`, `user_badges` (já criadas na 0004) | 20 insígnias, motor de regras `award_badges()` |
| Biblioteca do Pai | `/area-do-pai/biblioteca`, `/loja/digital/$slug`, `/admin/biblioteca` | `digital_products`, `digital_purchases`, bucket privado `digital-products` | E-book, planilha e checklist do doc 11 §7: 3 iscas grátis em `public/downloads/`, venda via Hotmart, leitura por compra ou plano `pai-de-valor` (seção 12b) |
| Admin | `/admin/moderacao`, `/admin/formacao`, `/admin/eventos` | `moderation_log` | Filas de histórias/perguntas/respostas/denúncias; editores de trilhas, desafios e eventos |

Rotas novas em relação à lista fixa do doc 02 §1.3: `/perguntas/nova` e `/eventos/$slug`. Pela regra 11 do doc 02 §9,
o executor **adiciona as duas** à tabela do §1.3 do doc 02, ao `sitemap[.]xml.ts` e à lista de JSON-LD do §7, e
registra em `PROGRESSO.md` → "Decisões tomadas durante a execução". As rotas `/area-do-pai/biblioteca` e
`/loja/digital/$slug` (seção 12b) já constam nas rotas secundárias do doc 02 §1.3.

Entregáveis, na ordem de execução (detalhada na seção 14):

1. Migration `supabase/migrations/0006_irmandade_formacao.sql` (seção 2) aplicada; `types.ts` regenerado.
2. Textos fixos (`src/content/irmandade/*.ts`), schemas zod e queries (`src/lib/db/irmandade.ts`, `src/lib/db/formacao.ts`).
3. Server functions `src/lib/community.functions.ts` e `src/lib/tracks.functions.ts` (nomes do doc 02).
4. Histórias (seção 3), Perguntas (seção 4), Eventos (seção 8) — rotas, páginas e componentes.
5. Formação: seeds (`supabase/seed/tracks.json`, `supabase/seed/challenges.json`, `scripts/seed-formacao.mjs` →
   `0008_seed_formacao.sql`), player de trilha, calendário de desafio (seções 5 e 6).
6. Insígnias e gamificação leve no painel (seções 7 e 11). Newsletter (seção 12). Biblioteca do Pai e produtos
   digitais (seção 12b). Admin (seção 13).
7. Critérios de aceite (15), PR com o checklist (17), `PROGRESSO.md`.

Estimativa: 6 a 7 sessões (1 delas para a seção 12b). Branch única `claude/fase-7-irmandade-e-formacao`, commits pequenos por etapa
(`feat(irmandade): …`, `feat(formacao): …`, `db: migration 0006`).

---

## 1. A Irmandade — conceito (fixo)

### 1.1 Nome, propósito e frase de posicionamento

- Nome oficial: **Irmandade** (nunca "comunidade VDP", "fórum" ou "grupo"). Membro da Irmandade = **irmão**.
- Propósito: **nenhum pai caminha sozinho**. Um homem conta o que viveu, outro pergunta o que não sabe, um terceiro
  responde com o que aprendeu, e de vez em quando eles se encontram ombro a ombro. Inspirações verificadas em
  `docs/plano/anexos/res-ecossistema.md` §B: a fraternidade de 4 a 6 homens com "âncora" (Exodus 90),
  o encontro semanal com virtude da semana (Fraternus), o "ombro a ombro" dos Men's Sheds e o café de pais do Dads Group.
- Frase de posicionamento (doc 00 §6, vai no `<h1>` de `/irmandade`): "Comunidade de homens que querem ser pais
  melhores: histórias, perguntas e respostas, encontros e grupos pequenos."

### 1.2 O que a Irmandade é e o que não é

| É | Não é |
|---|---|
| Lugar de pai contar o que deu certo e o que deu errado | Rede social com feed infinito, curtida pública e ranking de pessoas |
| Pergunta prática respondida por quem já passou por aquilo | Consultório médico, jurídico ou financeiro (toda resposta termina em "procure um profissional" quando for o caso) |
| Encontro de homens católicos de família tradicional, aberto a quem respeita isso | Espaço de debate de ideologia de gênero, política partidária ou ataque à esposa/mãe |
| Moderada antes de publicar (histórias e perguntas) e vigiada depois (respostas) | Terra sem lei nem chat em tempo real |
| Gratuita no lançamento | Clube pago (o plano "Pai de Valor" vem depois e nunca fecha o que já era gratuito) |

### 1.3 Código de conduta da Irmandade (10 pontos; arquivo `src/content/irmandade/codigo-de-conduta.ts`)

Exibido em `/irmandade`, aceito por checkbox em `/historias/nova`, `/perguntas/nova` e no formulário de resposta
(primeira vez por conta: `profiles.consent_terms_at` já cobre; aqui é o aceite específico, guardado em
`localStorage` + reconfirmado no servidor pela policy `can_post_irmandade()`).

```ts
// src/content/irmandade/codigo-de-conduta.ts
export const CODIGO_DE_CONDUTA_IRMANDADE: string[] = [
  "1. Fale como homem adulto: direto, respeitoso, sem palavrão, sem vulgaridade.",
  "2. Honre a esposa e a mãe dos seus filhos, mesmo quando contar uma dificuldade. Aqui ninguém fala mal da mulher.",
  "3. Família é pai, mãe e filhos. Não publicamos conteúdo que contradiga a visão católica de família.",
  "4. Conte o que você viveu, não o que você ouviu dizer. História é testemunho, não boato.",
  "5. Resposta é ajuda, não sentença: quem responde diz o que fez e o que aprendeu, e indica profissional quando a questão é médica, jurídica ou financeira.",
  "6. Sem política partidária, sem venda, sem link de afiliado, sem pirâmide, sem 'renda extra'.",
  "7. Sem foto de criança com rosto visível sem ser a sua, e nunca com dado que identifique a escola ou a casa.",
  "8. Sem ironia barata, sem 'coach', sem vitimismo. Firmeza e acolhimento andam juntos.",
  "9. Denuncie o que fere estas regras pelo botão 'Denunciar'. Três denúncias tiram o conteúdo do ar até a moderação olhar.",
  "10. Quem quebra a regra é avisado; quem insiste é bloqueado. A Irmandade é de todos, por isso tem porta.",
];
export const AVISO_PROFISSIONAL =
  "A Irmandade é troca entre pais. Nada aqui substitui médico, advogado, contador ou padre. Em caso de risco, procure ajuda profissional.";
```

### 1.4 Papéis e moderação

| Papel | Quem | Pode |
|---|---|---|
| Visitante | anônimo | Ler histórias aprovadas (1 grátis por navegador, depois pede cadastro, como no VDM), perguntas aprovadas, eventos publicados, trilhas e desafios (sem progresso) |
| Irmão | `profiles.role='member'` com e-mail confirmado (`email_verified()`) | Publicar história/pergunta (nascem `pending`), responder (nasce `approved`, pós-moderada), votar, marcar melhor resposta na própria pergunta, RSVP, progresso em trilhas/desafios, denunciar |
| Editor | `role='editor'` | Tudo acima + moderar histórias/perguntas/respostas (`is_admin()` da 0001 inclui editor) + editar trilhas/desafios/eventos |
| Admin | `role='admin'` | Tudo + bloquear membro (`block_user` da 0005, se existir) |

Regras de moderação (fixas): história e pergunta = **pré-moderação** (`pending` → `approved`/`rejected`, rejeição exige
motivo ≥ 10 caracteres, que vai por e-mail ao autor). Resposta = **pós-moderação** (entra `approved`; 3 denúncias →
`pending` automático; admin aprova/rejeita). Toda ação grava `moderation_log` via `log_moderation()`. Autor edita o
próprio conteúdo **só enquanto `pending` ou `rejected`** (editar o rejeitado reenvia para a fila). Conteúdo aprovado é
imutável pelo autor; ele pode excluir (hard delete, LGPD).

---

## 2. Migration `supabase/migrations/0006_irmandade_formacao.sql`

### 2.1 Decisões de compatibilidade (ler antes de aplicar)

| Tema | O que os docs dizem | Decisão nesta migration |
|---|---|---|
| `badges`/`user_badges` | Estão na **0004** nos dois docs (doc 02 §4.4 e doc 07 §2.1). | A 0006 **não cria** as tabelas; só referencia. Bloco `do $$` compatibiliza as diferenças abaixo. |
| `badges.rule` | doc 02: `text` (`'challenge_completed:1'`); doc 07 e briefing: `jsonb`. | Se for `text`, converte para `jsonb` (`'tipo:min'` → `{"type":"tipo","min":N}`). O motor lê só `jsonb`. |
| data da insígnia | doc 02: `user_badges.awarded_at`; doc 07/briefing: `earned_at`. | Garante os **dois nomes** (o ausente vira coluna gerada). Código TS usa `earned_at` (é o nome do `PainelData` do doc 07). |
| função de concessão | doc 02: `award_badge(uuid,text)`; doc 07: `grant_badges_for_me()`; doc 13 (7.8): `award_badges(user_id)`. | As três existem: `award_badge` = concessão direta por slug; `award_badges(p_user_id)` = **motor de regras**; `grant_badges_for_me()` = atalho do client (`select award_badges(auth.uid())`). |
| `moderation_log` | doc 03 (0001 real): `actor_id, entity, entity_id text, action, note`; doc 02 §4.1: `moderator_id, entity_type, entity_id uuid, action (check), reason`. | Helper `log_moderation()` detecta as colunas e insere no formato existente. Ações usadas: `approve`, `reject`, `flag`, `edit`, `delete` (cabem no `check` do doc 02). |
| `complete_step()` / `set_best_answer()` (briefing) | doc 02 chama `complete_track_step(p_step_id)` e `accept_answer(p_question_id, p_answer_id)`, ambas `returns void`. | **Nomes e retornos do doc 02** (mudar o retorno quebraria o `create or replace`). `vote_answer()` é nova (não existe no doc 02). |
| `stories.body jsonb` (briefing) | doc 02 e VDM: `content text`. | `content text` (texto puro com parágrafos separados por linha em branco; sem HTML = sem XSS). O editor em `/historias/nova` é um `textarea`, não Tiptap. |
| `tracks.estimated_days`, `is_premium`; `track_steps.type`, `completion_rule` (briefing) | doc 02 tem `estimated_minutes` e `body`, sem esses campos. | Adicionados com `add column if not exists`. |
| `challenge_progress.started_at` (briefing) | doc 02 não tem. | Tabela auxiliar `challenge_enrollments (user_id, challenge_id, started_at, finished_at)`. |
| bylines de membro | doc 07 cria `public_authors` só com `role in ('admin','editor')`; anon não lê `profiles`. | View `irmandade_members (id, display_name, avatar_url)` em 0006, embutida nos selects como `author:irmandade_members(...)`. |
| 0006 já aplicada na Fase 1? | Checklist 1.10 fala em aplicar as 7 migrations; doc 03 só aplica 0001 e 0002. | Conferir com `mcp__Supabase__list_migrations`. Se `0006_irmandade_formacao` já existir, aplicar **este** SQL com `name: "0006_irmandade_formacao_v2"` (todo o arquivo é idempotente e sobrepõe sem erro) e sobrescrever o arquivo no repo. Registrar em `PROGRESSO.md`. |
| Guardas × contadores | Membro não pode mexer em `status`, `like_count`, `views`, `answers_count`, `accepted_answer_id`, `report_count`; mas as funções internas precisam. | Triggers `guard_member_status`/`protect_answer_fields` liberam quando `vdp_internal()` é verdadeiro — flag transacional ligada por `like_story`, `vote_answer`, `accept_answer`, `answers_count_sync`, `report_irmandade`, `increment_question_views` (`set_config('vdp.internal','on',true)`). Testado localmente em PG 16. |
| `DROP` | CLAUDE.md §4.2 só permite `drop policy if exists`. | Triggers usam `create or replace trigger` (PG 14+); constraints e colunas geradas são guardadas por `do $$`. Único "drop" extra: `alter column rule drop default` antes da conversão de tipo (não é `DROP` de objeto). |

### 2.2 Conteúdo completo

```sql
-- =====================================================================
-- 0006_irmandade_formacao.sql — Irmandade (histórias, perguntas, respostas, eventos)
-- e Formação (trilhas, desafios), motor de insígnias, painel do membro.
-- Idempotente. Executar após 0001_core, 0002_blog, 0004_membros (0005 opcional).
-- =====================================================================
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------- 0. Funções-base (existem desde 0001/0004; recriadas por segurança, mesma assinatura) ----------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.email_verified() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce((select u.email_confirmed_at is not null from auth.users u where u.id = auth.uid()), false);
$$;
grant execute on function public.email_verified() to authenticated;

-- pode publicar na Irmandade? logado + e-mail verificado + não bloqueado (profiles.blocked_at existe se a 0005 rodou)
create or replace function public.can_post_irmandade() returns boolean
language plpgsql stable security definer set search_path = public as $$
declare v_blocked boolean := false;
begin
  if auth.uid() is null or not public.email_verified() then return false; end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'blocked_at') then
    execute 'select coalesce((select blocked_at is not null from public.profiles where id = $1), false)' into v_blocked using auth.uid();
  end if;
  return not v_blocked;
end $$;
grant execute on function public.can_post_irmandade() to authenticated;

-- log de moderação tolerante aos dois desenhos de moderation_log (doc 03/0001 real × doc 02 §4.1)
create or replace function public.log_moderation(p_entity text, p_entity_id uuid, p_action text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'moderation_log' and column_name = 'entity') then
    execute 'insert into public.moderation_log (actor_id, entity, entity_id, action, note) values ($1, $2, $3, $4, $5)'
      using auth.uid(), p_entity, p_entity_id::text, p_action, p_note;
  else
    execute 'insert into public.moderation_log (moderator_id, entity_type, entity_id, action, reason) values ($1, $2, $3, $4, $5)'
      using auth.uid(), p_entity, p_entity_id, p_action, p_note;
  end if;
end $$;
revoke all on function public.log_moderation(text, uuid, text, text) from public, anon, authenticated;

-- flag transacional: funções internas (contadores, votos, sync) ligam 'vdp.internal' para passar pelas guardas de membro
create or replace function public.vdp_internal() returns boolean
language sql stable as $$ select coalesce(current_setting('vdp.internal', true), '') = 'on' $$;

-- ---------- 1. badges / user_badges: criadas na 0004. Só compatibilização + award_badge ----------
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'badges'
             and column_name = 'rule' and data_type = 'text') then
    alter table public.badges alter column rule drop default;
    alter table public.badges alter column rule type jsonb using (
      case
        when rule is null or btrim(rule) = '' then '{}'::jsonb
        when rule ~ '^\s*[\[{]' then rule::jsonb
        when position(':' in rule) > 0 then jsonb_build_object('type', split_part(rule, ':', 1), 'min', nullif(split_part(rule, ':', 2), '')::int)
        else jsonb_build_object('type', rule)
      end);
    alter table public.badges alter column rule set default '{}'::jsonb;
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_badges' and column_name = 'awarded_at')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_badges' and column_name = 'earned_at') then
    alter table public.user_badges add column earned_at timestamptz generated always as (awarded_at) stored;
  elsif exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_badges' and column_name = 'earned_at')
     and not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'user_badges' and column_name = 'awarded_at') then
    alter table public.user_badges add column awarded_at timestamptz generated always as (earned_at) stored;
  end if;
end $$;

create or replace function public.award_badge(p_user_id uuid, p_badge_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then return; end if;
  insert into public.user_badges (user_id, badge_id)
  select p_user_id, b.id from public.badges b where b.slug = p_badge_slug
  on conflict do nothing;
end $$;
revoke all on function public.award_badge(uuid, text) from public, anon, authenticated;

-- nomes públicos dos membros para bylines da Irmandade (a view public_authors da 0004 só expõe staff; anon não lê profiles)
create or replace view public.irmandade_members with (security_invoker = off) as
  select id, display_name, avatar_url from public.profiles;
grant select on public.irmandade_members to anon, authenticated;

-- ---------- 2. stories ----------
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
alter table public.stories add column if not exists approved_at timestamptz;
alter table public.stories add column if not exists rejection_reason text;
alter table public.stories add column if not exists report_count integer not null default 0;
create index if not exists idx_stories_status on public.stories(status, created_at desc);
create index if not exists idx_stories_user on public.stories(user_id);
create or replace trigger trg_stories_updated before update on public.stories
  for each row execute function public.set_updated_at();

-- Guarda genérica de conteúdo de membro (stories, questions): membro não mexe em status nem em contadores.
create or replace function public.guard_member_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare j_new jsonb := to_jsonb(new); j_old jsonb; k text;
begin
  if public.is_admin() or auth.role() = 'service_role' or public.vdp_internal() then return new; end if;
  if tg_op = 'INSERT' then
    j_new := j_new || jsonb_build_object('status', 'pending');
  else
    j_old := to_jsonb(old);
    if j_new->>'status' is distinct from j_old->>'status' then
      raise exception 'Somente a moderação altera o status' using errcode = '42501';
    end if;
    foreach k in array array['like_count','report_count','approved_at','rejection_reason','answers_count','views','accepted_answer_id','last_answer_at'] loop
      if j_old ? k then j_new := j_new || jsonb_build_object(k, j_old->k); end if;
    end loop;
    if j_old->>'status' = 'rejected' then j_new := j_new || jsonb_build_object('status', 'pending'); end if;  -- corrigiu → volta à fila
  end if;
  new := jsonb_populate_record(new, j_new);
  return new;
end $$;
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
create policy "stories: own insert" on public.stories for insert
  with check ((select auth.uid()) = user_id and (select public.can_post_irmandade()));
drop policy if exists "stories: own update" on public.stories;
create policy "stories: own update" on public.stories for update
  using ((select auth.uid()) = user_id and status in ('pending','rejected')) with check ((select auth.uid()) = user_id);
drop policy if exists "stories: staff update" on public.stories;
create policy "stories: staff update" on public.stories for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "stories: own or staff delete" on public.stories;
create policy "stories: own or staff delete" on public.stories for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

create table if not exists public.story_likes (
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);
alter table public.story_likes enable row level security;
drop policy if exists "story_likes: own all" on public.story_likes;
create policy "story_likes: own all" on public.story_likes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- "Esse relato me ajudou": alterna a curtida e devolve o total
create or replace function public.like_story(p_story_id uuid) returns integer
language plpgsql security definer set search_path = public as $$
declare v_total integer;
begin
  if auth.uid() is null then raise exception 'Faça login' using errcode = '42501'; end if;
  perform set_config('vdp.internal', 'on', true);
  if exists (select 1 from public.story_likes where story_id = p_story_id and user_id = auth.uid()) then
    delete from public.story_likes where story_id = p_story_id and user_id = auth.uid();
  else
    insert into public.story_likes (story_id, user_id) values (p_story_id, auth.uid());
  end if;
  select count(*) into v_total from public.story_likes where story_id = p_story_id;
  update public.stories set like_count = v_total where id = p_story_id;
  perform set_config('vdp.internal', 'off', true);
  return v_total;
end $$;
grant execute on function public.like_story(uuid) to authenticated;

-- ---------- 3. questions / answers / answer_votes ----------
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
alter table public.questions add column if not exists tags text[] not null default '{}';
alter table public.questions add column if not exists last_answer_at timestamptz;
alter table public.questions add column if not exists rejection_reason text;
alter table public.questions add column if not exists report_count integer not null default 0;
create index if not exists idx_questions_status on public.questions(status, created_at desc);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_questions_title_trgm on public.questions using gin (title gin_trgm_ops);
create or replace trigger trg_questions_updated before update on public.questions
  for each row execute function public.set_updated_at();
create or replace trigger trg_guard_question_status before insert or update on public.questions
  for each row execute function public.guard_member_status();

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
alter table public.answers add column if not exists rejection_reason text;
alter table public.answers add column if not exists report_count integer not null default 0;
create index if not exists idx_answers_question on public.answers(question_id, status, created_at);
create index if not exists idx_answers_user on public.answers(user_id);
create or replace trigger trg_answers_updated before update on public.answers
  for each row execute function public.set_updated_at();

-- resposta nasce approved (pós-moderação); membro não mexe em status/contadores
create or replace function public.protect_answer_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or auth.role() = 'service_role' or public.vdp_internal() then return new; end if;
  if tg_op = 'INSERT' then
    new.status := 'approved'; new.like_count := 0; new.report_count := 0; new.rejection_reason := null;
  else
    new.status := old.status; new.like_count := old.like_count; new.report_count := old.report_count; new.rejection_reason := old.rejection_reason;
  end if;
  return new;
end $$;
create or replace trigger trg_protect_answer before insert or update on public.answers
  for each row execute function public.protect_answer_fields();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'questions_accepted_fk') then
    alter table public.questions add constraint questions_accepted_fk
      foreign key (accepted_answer_id) references public.answers(id) on delete set null;
  end if;
end $$;

alter table public.questions enable row level security;
drop policy if exists "questions: public read approved" on public.questions;
create policy "questions: public read approved" on public.questions for select using (status in ('approved','closed'));
drop policy if exists "questions: own read" on public.questions;
create policy "questions: own read" on public.questions for select using ((select auth.uid()) = user_id);
drop policy if exists "questions: staff read" on public.questions;
create policy "questions: staff read" on public.questions for select using ((select public.is_admin()));
drop policy if exists "questions: own insert" on public.questions;
create policy "questions: own insert" on public.questions for insert
  with check ((select auth.uid()) = user_id and (select public.can_post_irmandade()));
drop policy if exists "questions: own update" on public.questions;
create policy "questions: own update" on public.questions for update
  using ((select auth.uid()) = user_id and status in ('pending','rejected')) with check ((select auth.uid()) = user_id);
drop policy if exists "questions: staff update" on public.questions;
create policy "questions: staff update" on public.questions for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "questions: own or staff delete" on public.questions;
create policy "questions: own or staff delete" on public.questions for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

alter table public.answers enable row level security;
drop policy if exists "answers: public read approved" on public.answers;
create policy "answers: public read approved" on public.answers for select
  using (status = 'approved' and exists (select 1 from public.questions q where q.id = question_id and q.status in ('approved','closed')));
drop policy if exists "answers: own read" on public.answers;
create policy "answers: own read" on public.answers for select using ((select auth.uid()) = user_id);
drop policy if exists "answers: staff read" on public.answers;
create policy "answers: staff read" on public.answers for select using ((select public.is_admin()));
drop policy if exists "answers: own insert" on public.answers;
create policy "answers: own insert" on public.answers for insert
  with check ((select auth.uid()) = user_id and (select public.can_post_irmandade())
              and exists (select 1 from public.questions q where q.id = question_id and q.status = 'approved'));
drop policy if exists "answers: own update" on public.answers;
create policy "answers: own update" on public.answers for update
  using ((select auth.uid()) = user_id and created_at > now() - interval '24 hours') with check ((select auth.uid()) = user_id);
drop policy if exists "answers: staff update" on public.answers;
create policy "answers: staff update" on public.answers for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "answers: own or staff delete" on public.answers;
create policy "answers: own or staff delete" on public.answers for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

create table if not exists public.answer_votes (
  answer_id uuid not null references public.answers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (answer_id, user_id)
);
alter table public.answer_votes enable row level security;
drop policy if exists "answer_votes: own all" on public.answer_votes;
create policy "answer_votes: own all" on public.answer_votes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.answers_count_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('vdp.internal', 'on', true);
  update public.questions q
     set answers_count = (select count(*) from public.answers a where a.question_id = q.id and a.status = 'approved'),
         last_answer_at = (select max(a.created_at) from public.answers a where a.question_id = q.id and a.status = 'approved')
   where q.id = coalesce(new.question_id, old.question_id);
  perform set_config('vdp.internal', 'off', true);
  return null;
end $$;
create or replace trigger trg_answers_count after insert or update or delete on public.answers
  for each row execute function public.answers_count_sync();

-- voto: +1, -1 ou 0 (remove). Não vota na própria resposta. Devolve o saldo.
create or replace function public.vote_answer(p_answer_id uuid, p_value integer) returns integer
language plpgsql security definer set search_path = public as $$
declare v_total integer; v_author uuid;
begin
  if auth.uid() is null then raise exception 'Faça login' using errcode = '42501'; end if;
  if p_value not in (-1, 0, 1) then raise exception 'Voto inválido'; end if;
  select user_id into v_author from public.answers where id = p_answer_id and status = 'approved';
  if v_author is null then raise exception 'Resposta não encontrada'; end if;
  if v_author = auth.uid() then raise exception 'Você não vota na própria resposta' using errcode = '42501'; end if;
  perform set_config('vdp.internal', 'on', true);
  if p_value = 0 then
    delete from public.answer_votes where answer_id = p_answer_id and user_id = auth.uid();
  else
    insert into public.answer_votes (answer_id, user_id, value) values (p_answer_id, auth.uid(), p_value)
    on conflict (answer_id, user_id) do update set value = excluded.value;
  end if;
  select coalesce(sum(value), 0) into v_total from public.answer_votes where answer_id = p_answer_id;
  update public.answers set like_count = v_total where id = p_answer_id;
  perform set_config('vdp.internal', 'off', true);
  return v_total;
end $$;
grant execute on function public.vote_answer(uuid, integer) to authenticated;

-- melhor resposta (briefing: "set_best_answer"; nome do doc 02: accept_answer)
create or replace function public.accept_answer(p_question_id uuid, p_answer_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_author uuid;
begin
  if not exists (select 1 from public.questions where id = p_question_id and (user_id = auth.uid() or public.is_admin())) then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;
  if not exists (select 1 from public.answers where id = p_answer_id and question_id = p_question_id and status = 'approved') then
    raise exception 'Resposta inválida';
  end if;
  perform set_config('vdp.internal', 'on', true);
  update public.questions set accepted_answer_id = p_answer_id where id = p_question_id;
  perform set_config('vdp.internal', 'off', true);
  select user_id into v_author from public.answers where id = p_answer_id;
  perform public.award_badges(v_author);
end $$;
grant execute on function public.accept_answer(uuid, uuid) to authenticated;

create or replace function public.increment_question_views(p_question_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('vdp.internal', 'on', true);
  update public.questions set views = views + 1 where id = p_question_id and status in ('approved','closed');
  perform set_config('vdp.internal', 'off', true);
end $$;
grant execute on function public.increment_question_views(uuid) to anon, authenticated;

-- moderação (staff): histórias, perguntas, respostas
create or replace function public.moderate_story(p_story_id uuid, p_action text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_action not in ('approve','reject') then raise exception 'Ação inválida'; end if;
  if p_action = 'reject' and (p_reason is null or length(p_reason) < 10) then raise exception 'Motivo obrigatório (mín. 10 caracteres)'; end if;
  update public.stories
     set status = case p_action when 'approve' then 'approved' else 'rejected' end,
         approved_at = case p_action when 'approve' then now() else null end,
         rejection_reason = case p_action when 'reject' then p_reason else null end,
         report_count = 0
   where id = p_story_id returning user_id into v_user;
  perform public.log_moderation('story', p_story_id, p_action, p_reason);
  if p_action = 'approve' then perform public.award_badges(v_user); end if;
end $$;
grant execute on function public.moderate_story(uuid, text, text) to authenticated;

create or replace function public.moderate_question(p_question_id uuid, p_action text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_admin() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_action not in ('approve','reject','close') then raise exception 'Ação inválida'; end if;
  if p_action = 'reject' and (p_reason is null or length(p_reason) < 10) then raise exception 'Motivo obrigatório (mín. 10 caracteres)'; end if;
  update public.questions
     set status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'closed' end,
         rejection_reason = case p_action when 'reject' then p_reason else null end,
         report_count = 0
   where id = p_question_id returning user_id into v_user;
  perform public.log_moderation('question', p_question_id, case p_action when 'close' then 'edit' else p_action end, p_reason);
  if p_action = 'approve' then perform public.award_badges(v_user); end if;
end $$;
grant execute on function public.moderate_question(uuid, text, text) to authenticated;

create or replace function public.moderate_answer(p_answer_id uuid, p_action text, p_reason text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado' using errcode = '42501'; end if;
  if p_action not in ('approve','reject') then raise exception 'Ação inválida'; end if;
  update public.answers
     set status = case p_action when 'approve' then 'approved' else 'rejected' end,
         rejection_reason = case p_action when 'reject' then p_reason else null end,
         report_count = 0
   where id = p_answer_id;
  perform public.log_moderation('answer', p_answer_id, p_action, p_reason);
end $$;
grant execute on function public.moderate_answer(uuid, text, text) to authenticated;

-- denúncia (logado): 3 denúncias escondem o item (volta para pending) até a moderação olhar
create or replace function public.report_irmandade(p_entity text, p_entity_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare v_count integer;
begin
  if auth.uid() is null then raise exception 'Faça login' using errcode = '42501'; end if;
  if p_entity not in ('story','question','answer') then raise exception 'Entidade inválida'; end if;
  perform set_config('vdp.internal', 'on', true);
  execute format('update public.%I set report_count = report_count + 1 where id = $1 returning report_count',
                 case p_entity when 'story' then 'stories' when 'question' then 'questions' else 'answers' end)
    into v_count using p_entity_id;
  perform public.log_moderation(p_entity, p_entity_id, 'flag', left(p_reason, 500));
  if v_count >= 3 then
    execute format('update public.%I set status = ''pending'' where id = $1 and status = ''approved''',
                   case p_entity when 'story' then 'stories' when 'question' then 'questions' else 'answers' end) using p_entity_id;
  end if;
  perform set_config('vdp.internal', 'off', true);
end $$;
grant execute on function public.report_irmandade(text, uuid, text) to authenticated;

-- ---------- 4. events / event_rsvps ----------
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
alter table public.events add column if not exists kind text not null default 'encontro'
  check (kind in ('encontro','live','retiro','cafe-dos-pais','galpao-do-pai'));
alter table public.events add column if not exists organizer text;
alter table public.events add column if not exists price_text text;   -- "Gratuito" | "R$ 40 (almoço incluso)" — texto livre, nunca numérico
alter table public.events add column if not exists rsvp_count integer not null default 0;
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
alter table public.event_rsvps add column if not exists reminded_at timestamptz;
alter table public.event_rsvps enable row level security;
drop policy if exists "event_rsvps: own all" on public.event_rsvps;
create policy "event_rsvps: own all" on public.event_rsvps for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "event_rsvps: staff read" on public.event_rsvps;
create policy "event_rsvps: staff read" on public.event_rsvps for select using ((select public.is_admin()));

create or replace function public.event_rsvp_count(p_event_id uuid) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.event_rsvps where event_id = p_event_id and status = 'going';
$$;
grant execute on function public.event_rsvp_count(uuid) to anon, authenticated;

create or replace function public.event_rsvp_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.events e set rsvp_count = public.event_rsvp_count(e.id) where e.id = coalesce(new.event_id, old.event_id);
  return null;
end $$;
create or replace trigger trg_event_rsvp_sync after insert or update or delete on public.event_rsvps
  for each row execute function public.event_rsvp_sync();

-- RSVP com lotação: 'going' só se houver vaga
create or replace function public.rsvp_event(p_event_id uuid, p_status text) returns text
language plpgsql security definer set search_path = public as $$
declare v_cap integer; v_going integer; v_status text;
begin
  if auth.uid() is null then raise exception 'Faça login' using errcode = '42501'; end if;
  if p_status not in ('going','maybe','canceled') then raise exception 'Status inválido'; end if;
  select capacity, status into v_cap, v_status from public.events where id = p_event_id;
  if v_status is distinct from 'published' then raise exception 'Evento não está aberto'; end if;
  if p_status = 'going' and v_cap is not null then
    v_going := public.event_rsvp_count(p_event_id);
    if v_going >= v_cap and not exists (select 1 from public.event_rsvps where event_id = p_event_id and user_id = auth.uid() and status = 'going') then
      raise exception 'LOTADO';
    end if;
  end if;
  insert into public.event_rsvps (event_id, user_id, status) values (p_event_id, auth.uid(), p_status)
  on conflict (event_id, user_id) do update set status = excluded.status, reminded_at = null;
  return p_status;
end $$;
grant execute on function public.rsvp_event(uuid, text) to authenticated;

-- ---------- 5. tracks / track_steps / track_progress ----------
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
alter table public.tracks add column if not exists is_premium boolean not null default false;
alter table public.tracks add column if not exists estimated_days integer;
alter table public.tracks add column if not exists audience text;
alter table public.tracks add column if not exists pillar text check (pillar in ('casa','trabalho','corpo','alma'));
alter table public.tracks add column if not exists outcomes jsonb not null default '[]'::jsonb;   -- ["Ao terminar você vai…", …]
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
alter table public.track_steps add column if not exists module text;
alter table public.track_steps add column if not exists type text not null default 'leitura'
  check (type in ('artigo','video','exercicio','checklist','leitura'));
alter table public.track_steps add column if not exists summary text;
alter table public.track_steps add column if not exists completion_rule text not null default 'manual'
  check (completion_rule in ('manual','read_post','video','checklist_all','exercise_text'));
alter table public.track_steps add column if not exists related_post_slug text;   -- dica do seed; post_id é resolvido se o slug existir
create index if not exists idx_track_steps_track on public.track_steps(track_id, position);
alter table public.track_steps enable row level security;
drop policy if exists "track_steps: public read of published track" on public.track_steps;
create policy "track_steps: public read of published track" on public.track_steps for select
  using (exists (select 1 from public.tracks t where t.id = track_id and t.status = 'published') or (select public.is_admin()));
drop policy if exists "track_steps: staff all" on public.track_steps;
create policy "track_steps: staff all" on public.track_steps for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.track_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  step_id uuid not null references public.track_steps(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, step_id)
);
alter table public.track_progress add column if not exists note text check (note is null or length(note) <= 4000);
create index if not exists idx_track_progress_user_track on public.track_progress(user_id, track_id);
alter table public.track_progress enable row level security;
drop policy if exists "track_progress: own all" on public.track_progress;
create policy "track_progress: own all" on public.track_progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.track_is_completed(p_user_id uuid, p_track_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select (select count(*) from public.track_steps s where s.track_id = p_track_id) > 0
     and (select count(*) from public.track_progress p where p.user_id = p_user_id and p.track_id = p_track_id)
         >= (select count(*) from public.track_steps s where s.track_id = p_track_id);
$$;
revoke all on function public.track_is_completed(uuid, uuid) from public, anon, authenticated;

-- ---------- 6. challenges / challenge_days / challenge_progress / challenge_enrollments ----------
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
alter table public.challenges add column if not exists pillar text check (pillar in ('casa','trabalho','corpo','alma'));
alter table public.challenges add column if not exists is_premium boolean not null default false;
alter table public.challenges add column if not exists badge_slug text;   -- informativo na UI; a concessão é pela regra challenge_completed do motor
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
alter table public.challenge_days add column if not exists reflection text;
alter table public.challenge_days enable row level security;
drop policy if exists "challenge_days: public read of published" on public.challenge_days;
create policy "challenge_days: public read of published" on public.challenge_days for select
  using (exists (select 1 from public.challenges c where c.id = challenge_id and c.status = 'published') or (select public.is_admin()));
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
create policy "challenge_progress: own all" on public.challenge_progress for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.challenge_enrollments (
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  primary key (user_id, challenge_id)
);
alter table public.challenge_enrollments enable row level security;
drop policy if exists "challenge_enrollments: own all" on public.challenge_enrollments;
create policy "challenge_enrollments: own all" on public.challenge_enrollments for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- dia "de calendário" do desafio para o usuário: 1 no dia em que começou, limitado a days
create or replace function public.challenge_current_day(p_user_id uuid, p_challenge_id uuid) returns integer
language sql stable security definer set search_path = public as $$
  select least(c.days, greatest(1, ((now() at time zone 'America/Sao_Paulo')::date - (e.started_at at time zone 'America/Sao_Paulo')::date) + 1))
  from public.challenge_enrollments e join public.challenges c on c.id = e.challenge_id
  where e.user_id = p_user_id and e.challenge_id = p_challenge_id;
$$;
grant execute on function public.challenge_current_day(uuid, uuid) to authenticated;

-- ---------- 7. streak e pontos (gamificação leve; nunca ranking público) ----------
create or replace function public.member_streak(p_user_id uuid) returns integer
language plpgsql stable security definer set search_path = public as $$
declare v_days date[]; d date; v_streak integer := 0; v_cursor date;
begin
  select array_agg(dd order by dd desc) into v_days from (
    select distinct (completed_at at time zone 'America/Sao_Paulo')::date as dd from public.challenge_progress where user_id = p_user_id
    union
    select distinct (completed_at at time zone 'America/Sao_Paulo')::date from public.track_progress where user_id = p_user_id
  ) x;
  if v_days is null then return 0; end if;
  v_cursor := (now() at time zone 'America/Sao_Paulo')::date;
  if v_days[1] < v_cursor - 1 then return 0; end if;    -- última atividade antes de ontem → streak zerado
  v_cursor := v_days[1];
  foreach d in array v_days loop
    if d = v_cursor then v_streak := v_streak + 1; v_cursor := v_cursor - 1; else exit; end if;
  end loop;
  return v_streak;
end $$;
revoke all on function public.member_streak(uuid) from public, anon, authenticated;

create or replace function public.member_points(p_user_id uuid) returns integer
language sql stable security definer set search_path = public as $$
  select 10 * (select count(*) from public.track_progress where user_id = p_user_id)
       + 5 * (select count(*) from public.challenge_progress where user_id = p_user_id)
       + 20 * (select count(*) from public.stories where user_id = p_user_id and status = 'approved')
       + 5 * (select count(*) from public.answers where user_id = p_user_id and status = 'approved')
       + 15 * (select count(*) from public.answers a join public.questions q on q.accepted_answer_id = a.id where a.user_id = p_user_id)
       + 10 * (select count(*) from public.event_rsvps r join public.events e on e.id = r.event_id where r.user_id = p_user_id and r.status = 'going' and e.status = 'done')
       + 25 * (select count(*) from public.user_badges where user_id = p_user_id);
$$;
revoke all on function public.member_points(uuid) from public, anon, authenticated;

create or replace function public.member_title(p_points integer) returns text
language sql immutable as $$
  select case when p_points >= 1500 then 'Patriarca' when p_points >= 500 then 'Pai de referência'
              when p_points >= 100 then 'Pai firme' else 'Pai iniciante' end;
$$;

-- ---------- 8. Motor de insígnias ----------
create or replace function public.award_badges(p_user_id uuid) returns setof text
language plpgsql security definer set search_path = public as $$
declare
  b record; ok boolean; v_min integer; v_slug text;
  v_onb boolean; v_children integer; v_saved integer; v_news boolean; v_premium boolean;
  v_steps integer; v_days integer; v_tracks_done integer; v_challenges_done integer; v_streak integer;
  v_stories integer; v_answers integer; v_accepted integer; v_questions integer; v_events integer; v_votes integer; v_jobs integer := 0;
begin
  if p_user_id is null then return; end if;
  select onboarding_done into v_onb from public.profiles where id = p_user_id;
  select count(*) into v_children from public.children where user_id = p_user_id;
  select count(*) into v_saved from public.saved_items where user_id = p_user_id;
  select exists (select 1 from public.newsletter_subscribers n where n.user_id = p_user_id and n.status = 'confirmed') into v_news;
  v_premium := exists (select 1 from public.subscriptions s join public.plans p on p.id = s.plan_id
                       where s.user_id = p_user_id and s.status in ('active','trialing') and p.slug <> 'gratuito');
  select count(*) into v_steps from public.track_progress where user_id = p_user_id;
  select count(*) into v_days from public.challenge_progress where user_id = p_user_id;
  select count(*) into v_tracks_done from public.tracks t where t.status = 'published' and public.track_is_completed(p_user_id, t.id);
  select count(*) into v_challenges_done from public.challenge_enrollments e where e.user_id = p_user_id and e.finished_at is not null;
  v_streak := public.member_streak(p_user_id);
  select count(*) into v_stories from public.stories where user_id = p_user_id and status = 'approved';
  select count(*) into v_answers from public.answers where user_id = p_user_id and status = 'approved';
  select count(*) into v_accepted from public.answers a join public.questions q on q.accepted_answer_id = a.id where a.user_id = p_user_id;
  select count(*) into v_questions from public.questions where user_id = p_user_id and status in ('approved','closed');
  select count(*) into v_events from public.event_rsvps r join public.events e on e.id = r.event_id
    where r.user_id = p_user_id and r.status = 'going' and e.status = 'done';
  select coalesce(sum(like_count), 0) into v_votes from public.answers where user_id = p_user_id and status = 'approved';
  if to_regclass('public.jobs') is not null then
    execute 'select count(*) from public.jobs where posted_by = $1 and status = ''approved''' into v_jobs using p_user_id;
  end if;

  for b in select * from public.badges loop
    v_min := coalesce((b.rule->>'min')::integer, 1);
    v_slug := b.rule->>'slug';
    ok := case b.rule->>'type'
      when 'onboarding_done'     then coalesce(v_onb, false)
      when 'children_count'      then v_children >= v_min
      when 'saved_count'         then v_saved >= v_min
      when 'newsletter_confirmed' then v_news
      when 'premium'             then v_premium
      when 'steps_completed'     then v_steps >= v_min
      when 'days_completed'      then v_days >= v_min
      when 'track_completed'     then case when v_slug is null then v_tracks_done >= v_min
                                      else exists (select 1 from public.tracks t where t.slug = v_slug and public.track_is_completed(p_user_id, t.id)) end
      when 'challenge_completed' then case when v_slug is null then v_challenges_done >= v_min
                                      else exists (select 1 from public.challenge_enrollments e join public.challenges c on c.id = e.challenge_id
                                                   where e.user_id = p_user_id and c.slug = v_slug and e.finished_at is not null) end
      when 'streak'              then v_streak >= v_min
      when 'story_approved'      then v_stories >= v_min
      when 'answers_count'       then v_answers >= v_min
      when 'answer_accepted'     then v_accepted >= v_min
      when 'questions_count'     then v_questions >= v_min
      when 'event_attended'      then v_events >= v_min
      when 'votes_received'      then v_votes >= v_min
      when 'job_approved'        then v_jobs >= v_min
      else false end;
    if ok then
      insert into public.user_badges (user_id, badge_id) values (p_user_id, b.id) on conflict do nothing;
      if found then return next b.slug; end if;
    end if;
  end loop;
end $$;
revoke all on function public.award_badges(uuid) from public, anon, authenticated;

create or replace function public.grant_badges_for_me() returns setof text
language sql security definer set search_path = public as $$ select public.award_badges(auth.uid()); $$;
grant execute on function public.grant_badges_for_me() to authenticated;

-- ---------- 9. Progresso: trilhas e desafios (RPCs do client) ----------
-- assinatura e retorno iguais ao doc 02 (returns void). Insígnias: o client chama grant_badges_for_me() logo depois.
create or replace function public.complete_track_step(p_step_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_track uuid; v_premium boolean;
begin
  if auth.uid() is null then raise exception 'Faça login' using errcode = '42501'; end if;
  select s.track_id, t.is_premium into v_track, v_premium
    from public.track_steps s join public.tracks t on t.id = s.track_id
   where s.id = p_step_id and t.status = 'published';
  if v_track is null then raise exception 'Passo não encontrado'; end if;
  if v_premium and not public.is_admin() and not exists (
       select 1 from public.subscriptions s join public.plans p on p.id = s.plan_id
        where s.user_id = auth.uid() and s.status in ('active','trialing') and p.slug <> 'gratuito') then
    raise exception 'PREMIUM' using errcode = '42501';
  end if;
  insert into public.track_progress (user_id, track_id, step_id) values (auth.uid(), v_track, p_step_id) on conflict do nothing;
end $$;
grant execute on function public.complete_track_step(uuid) to authenticated;

create or replace function public.save_step_note(p_step_id uuid, p_note text) returns void
language sql security definer set search_path = public as $$
  update public.track_progress set note = left(p_note, 4000) where user_id = auth.uid() and step_id = p_step_id;
$$;
grant execute on function public.save_step_note(uuid, text) to authenticated;

create or replace function public.start_challenge(p_challenge_id uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare v_started timestamptz;
begin
  if auth.uid() is null then raise exception 'Faça login' using errcode = '42501'; end if;
  if not exists (select 1 from public.challenges where id = p_challenge_id and status = 'published') then raise exception 'Desafio não encontrado'; end if;
  insert into public.challenge_enrollments (user_id, challenge_id) values (auth.uid(), p_challenge_id)
  on conflict (user_id, challenge_id) do nothing;
  select started_at into v_started from public.challenge_enrollments where user_id = auth.uid() and challenge_id = p_challenge_id;
  return v_started;
end $$;
grant execute on function public.start_challenge(uuid) to authenticated;

-- marca um dia (só dias já "liberados" pelo calendário; dias perdidos podem ser marcados depois = recomeço suave).
-- Retorno void como no doc 02; a insígnia vem do motor (regra challenge_completed com slug) via grant_badges_for_me().
create or replace function public.complete_challenge_day(p_challenge_id uuid, p_day integer, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_days integer; v_done integer; v_today integer;
begin
  if auth.uid() is null then raise exception 'Faça login' using errcode = '42501'; end if;
  select days into v_days from public.challenges where id = p_challenge_id and status = 'published';
  if v_days is null then raise exception 'Desafio não encontrado'; end if;
  perform public.start_challenge(p_challenge_id);
  v_today := public.challenge_current_day(auth.uid(), p_challenge_id);
  if p_day < 1 or p_day > v_days or p_day > v_today then raise exception 'DIA_FUTURO'; end if;
  insert into public.challenge_progress (user_id, challenge_id, day, note) values (auth.uid(), p_challenge_id, p_day, left(p_note, 500))
  on conflict (user_id, challenge_id, day) do update set note = coalesce(excluded.note, public.challenge_progress.note);
  select count(*) into v_done from public.challenge_progress where user_id = auth.uid() and challenge_id = p_challenge_id;
  if v_done >= v_days then
    update public.challenge_enrollments set finished_at = coalesce(finished_at, now()) where user_id = auth.uid() and challenge_id = p_challenge_id;
  end if;
end $$;
grant execute on function public.complete_challenge_day(uuid, integer, text) to authenticated;

-- ---------- 10. Seed das 20 insígnias (ícones = nomes do lucide-react em kebab-case) ----------
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

-- ---------- 11. Painel do membro (o doc 02 §4.6 define get_member_dashboard aqui) e resumo para o e-mail ----------
create or replace function public.member_formacao_summary(p_user_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'streak', public.member_streak(p_user_id),
    'points', public.member_points(p_user_id),
    'title', public.member_title(public.member_points(p_user_id)),
    'tracks', (select coalesce(jsonb_agg(jsonb_build_object('slug', t.slug, 'title', t.title,
                 'done', (select count(*) from public.track_progress tp where tp.user_id = p_user_id and tp.track_id = t.id),
                 'total', (select count(*) from public.track_steps ts where ts.track_id = t.id),
                 'next_step', (select jsonb_build_object('position', s.position, 'title', s.title) from public.track_steps s
                               where s.track_id = t.id and not exists (select 1 from public.track_progress tp where tp.user_id = p_user_id and tp.step_id = s.id)
                               order by s.position limit 1)) order by t.sort_order), '[]')
               from public.tracks t where t.status = 'published'
                 and exists (select 1 from public.track_progress tp where tp.user_id = p_user_id and tp.track_id = t.id)
                 and not public.track_is_completed(p_user_id, t.id)),
    'challenges', (select coalesce(jsonb_agg(jsonb_build_object('slug', c.slug, 'title', c.title, 'days', c.days,
                 'current_day', public.challenge_current_day(p_user_id, c.id),
                 'done', (select count(*) from public.challenge_progress cp where cp.user_id = p_user_id and cp.challenge_id = c.id),
                 'today', (select jsonb_build_object('title', d.title, 'task', d.task) from public.challenge_days d
                           where d.challenge_id = c.id and d.day = public.challenge_current_day(p_user_id, c.id)))), '[]')
               from public.challenge_enrollments e join public.challenges c on c.id = e.challenge_id
               where e.user_id = p_user_id and e.finished_at is null and c.status = 'published'),
    'badges', (select coalesce(jsonb_agg(jsonb_build_object('slug', b.slug, 'name', b.name, 'icon', b.icon, 'earned_at', ub.earned_at) order by ub.earned_at desc), '[]')
               from public.user_badges ub join public.badges b on b.id = ub.badge_id where ub.user_id = p_user_id)
  );
$$;
revoke all on function public.member_formacao_summary(uuid) from public, anon, authenticated;   -- só service_role (newsletter) e get_member_dashboard

create or replace function public.get_member_dashboard() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', (select coalesce(jsonb_agg(to_jsonb(c) order by c.birth_date), '[]') from public.children c where c.user_id = auth.uid()),
    'saved_count', (select count(*) from public.saved_items where user_id = auth.uid()),
    'formacao', public.member_formacao_summary(auth.uid()),
    'badges_all', (select coalesce(jsonb_agg(jsonb_build_object('slug', b.slug, 'name', b.name, 'description', b.description, 'icon', b.icon,
                      'earned_at', (select ub.earned_at from public.user_badges ub where ub.badge_id = b.id and ub.user_id = auth.uid()))), '[]') from public.badges b),
    'stories', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'title', s.title, 'status', s.status) order by s.created_at desc), '[]')
                from public.stories s where s.user_id = auth.uid()),
    'questions', (select coalesce(jsonb_agg(jsonb_build_object('slug', q.slug, 'title', q.title, 'status', q.status, 'answers_count', q.answers_count) order by q.created_at desc), '[]')
                  from public.questions q where q.user_id = auth.uid()),
    'events', (select coalesce(jsonb_agg(jsonb_build_object('slug', e.slug, 'title', e.title, 'starts_at', e.starts_at, 'mode', e.mode) order by e.starts_at), '[]')
               from public.event_rsvps r join public.events e on e.id = r.event_id
               where r.user_id = auth.uid() and r.status = 'going' and e.status = 'published' and e.starts_at > now()),
    'jobs', case when to_regclass('public.jobs') is null then '[]'::jsonb else '[]'::jsonb end
  );
$$;
grant execute on function public.get_member_dashboard() to authenticated;

-- ---------- 12. Bucket de fotos das histórias ----------
insert into storage.buckets (id, name, public) values ('stories', 'stories', true) on conflict do nothing;
drop policy if exists "stories: leitura pública" on storage.objects;
create policy "stories: leitura pública" on storage.objects for select using (bucket_id = 'stories');
drop policy if exists "stories: membro envia na própria pasta" on storage.objects;
create policy "stories: membro envia na própria pasta" on storage.objects for insert
  with check (bucket_id = 'stories' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- 13. Cron: lembrete de evento 24 h antes (edge function event-reminder; padrão do doc 07 §6.6) ----------
-- <SUPABASE_PROJECT_REF> é substituído pelo executor. Requer pg_cron, pg_net e public.get_secret (0004).
select cron.unschedule('event-reminder') where exists (select 1 from cron.job where jobname = 'event-reminder');
select cron.schedule('event-reminder', '15 * * * *', $$
  select net.http_post(
    url := 'https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/event-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public.get_secret('SUPABASE_SERVICE_ROLE_KEY'),
      'x-internal-secret', public.get_secret('INTERNAL_FN_SECRET')),
    body := '{}'::jsonb, timeout_milliseconds := 55000);
$$);
```

Observação sobre `get_member_dashboard`: a chave `jobs` fica vazia aqui porque `jobs` é da 0005 (SQL estável não pode
referenciar tabela que talvez não exista). O painel do doc 07 (`getPainelDataFn`) já consulta `jobs` com `try/catch`;
manter assim. Se a Fase 6 já rodou, o executor pode trocar o `case` por
`(select coalesce(jsonb_agg(jsonb_build_object('slug', j.slug, 'title', j.title, 'status', j.status)), '[]') from public.jobs j where j.posted_by = auth.uid())`.

### 2.3 Aplicar e verificar

1. `mcp__Supabase__list_migrations` no projeto `<SUPABASE_PROJECT_REF>`. Se `0006_irmandade_formacao` **não** existir:
   `mcp__Supabase__apply_migration` com `name: "0006_irmandade_formacao"` e o SQL acima. Se existir: aplicar com
   `name: "0006_irmandade_formacao_v2"` e sobrescrever o arquivo no repositório (ver 2.1).
2. Substituir `<SUPABASE_PROJECT_REF>` no bloco do cron antes de aplicar. Se `public.get_secret` não existir
   (`select proname from pg_proc where proname = 'get_secret'`), seguir o doc 07 §2.3 primeiro.
3. `mcp__Supabase__get_advisors` (security e performance): zero erros. Avisos de "function search_path mutable" não
   devem aparecer (todas as funções têm `set search_path`).
4. `npm run types:supabase` → commitar `src/integrations/supabase/types.ts`.
5. Consultas de verificação (SQL Editor ou `execute_sql`):

```sql
select count(*) from public.badges;                                        -- ≥ 20
select column_name, data_type from information_schema.columns where table_name = 'badges' and column_name = 'rule';   -- jsonb
select column_name from information_schema.columns where table_name = 'user_badges';   -- earned_at E awarded_at
set role anon; select count(*) from public.stories; select count(*) from public.tracks; reset role;   -- 0 e 0 (nada publicado ainda)
select proname from pg_proc where proname in ('award_badges','award_badge','grant_badges_for_me','log_moderation','vdp_internal','can_post_irmandade',
  'like_story','vote_answer','accept_answer','moderate_story','moderate_question','moderate_answer','report_irmandade','rsvp_event',
  'complete_track_step','save_step_note','start_challenge','complete_challenge_day','member_streak','member_points','member_formacao_summary','get_member_dashboard');  -- 22 linhas
select jobname, schedule from cron.job where jobname = 'event-reminder';
```

---

## 3. Histórias de pai (`/historias`, `/historias/$id`, `/historias/nova`)

### 3.1 Arquivo por arquivo: o que copiar do vocacaodemae e o que muda

| Origem (`/home/user/vocacaodemae`) | Destino (`/home/user/vocacaodepai`) | Ação |
|---|---|---|
| `src/routes/_site/historias/index.tsx` | `src/routes/_site/historias/index.tsx` | COPIAR. Trocar textos (`Histórias de pai | Vocação de Pai`, descrição "Relatos reais de pais da Irmandade"), `SITE_URL`, import da página. |
| `src/routes/_site/historias/$id.tsx` | `src/routes/_site/historias/$id.tsx` | COPIAR. Manter o `head()` com `Article` + `BreadcrumbList` (trocar publisher para "Vocação de Pai", breadcrumb "Irmandade › Histórias"). |
| `src/routes/_site/historias/nova.tsx` | `src/routes/_site/historias/nova.tsx` | COPIAR. `head: () => privateHead("Conte sua história")` (noindex, doc 07 §4.7). |
| `src/pages/StoriesPage.tsx` | `src/pages/irmandade/HistoriasPage.tsx` | ADAPTAR: remover `useTranslation` (textos fixos PT-BR), `openLogin()` → `navigate('/entrar?next=/historias')`, categorias novas (3.2), `AdSlot` só o leaderboard (doc 11). Mantém filtros (categoria, período, ordem) e o gate "1 história grátis". |
| `src/pages/StoryPage.tsx` | `src/pages/irmandade/HistoriaPage.tsx` | ADAPTAR: idem; acrescentar `LikeStoryButton` ("Esse relato me ajudou · N"), `ReportDialog` (reutilizar o da Fase 6 se existir em `src/components/pip/ReportDialog.tsx`; senão criar em `src/components/community/`), bloco "Outras histórias" (3 da mesma categoria). |
| `src/pages/NewStoryPage.tsx` | `src/pages/irmandade/NovaHistoriaPage.tsx` | ADAPTAR: `profile.full_name` → `profile.display_name`; checkbox do código de conduta; aviso "Sua história passa pela moderação antes de ir ao ar (até 48 h)"; `createStory` via server function (3.3). `textarea`, não Tiptap (doc 02: `content text`). |
| `src/components/stories/StoryCard.tsx` | `src/components/community/StoryCard.tsx` | ADAPTAR: sem i18n; `alt` da foto = título; chip de categoria com cor da seção. |
| `src/lib/stories-read.ts` | `src/lib/stories-read.ts` | COPIAR (já previsto no doc 02 §3). Trocar a chave do `localStorage` para `vocacao-de-pai-stories-read`. |
| `src/lib/story-categories.ts` | `src/lib/irmandade/story-categories.ts` | REESCREVER com as 6 categorias do `check` da tabela (3.2); sem `labelKey`, label direto. |
| `src/lib/queries.ts` (`STORY_SELECT`, `queryStories`, `queryStoryById`) | `src/lib/db/irmandade.ts` | COPIAR as duas funções; `STORY_SELECT = "id,user_id,author_name,title,category,content,photo_url,status,like_count,created_at,updated_at"`. |
| `src/lib/hub.functions.ts` (`getStoriesData`, `getStoryData`) | `src/lib/community.functions.ts` | COPIAR o padrão (`createServerFn` + `createReadOnlySupabaseClient` de `./seo.functions` + `safe()`), acrescentar as funções de escrita (3.3). |
| `src/lib/db.ts` (`createStory`, `fetchMyStories`, `fetchAllStories`, `moderateStory`, `deleteStory`) | `src/lib/db/irmandade.ts` (leitura) e `src/lib/community.functions.ts` (escrita) | ADAPTAR: `moderateStory` passa a chamar `rpc('moderate_story', { p_story_id, p_action, p_reason })` (3 argumentos). |
| `src/lib/db.ts` (`uploadImage(dataUrl, "stories")`) + `src/lib/media.functions.ts` | `src/lib/media.functions.ts` | Liberar a pasta `stories` no `uploadImageFn` (bucket `stories`, caminho `<user_id>/<uuid>.webp`, máx. 1200 px via `compressToWebP`). |
| `src/admin/AdminDashboard.tsx` (aba `stories`) | `src/admin/ModerationQueue.tsx` | ADAPTAR: a aba vira a sub-aba "Histórias" da fila de moderação (seção 13). |

### 3.2 Regras fixas

- Categorias (`stories.category`): `paternidade` "Paternidade", `casamento` "Casamento", `trabalho` "Trabalho e provisão",
  `fe` "Fé", `superacao` "Superação", `humor` "Humor de pai". Chamada mensal "Meu pai me ensinou" (doc 00 §3.7) usa
  `paternidade` + prefixo no título.
- Leitura: anônimo lê 1 história por navegador (`stories-read.ts`); a 2ª pede `/entrar?next=/historias/<id>`. Membro lê tudo.
- Publicar: membro com e-mail confirmado; 2 histórias por dia (rate limit na server function); título 5–140, texto
  100–10.000 caracteres, foto opcional (própria; sem rosto de criança que não seja o filho dele — aviso no formulário).
- Blacklist: reutilizar `src/lib/pip/blacklist.ts` (doc 08 §7.3) se existir; senão criar `src/lib/irmandade/blacklist.ts`
  com a mesma lista. Texto bloqueado → erro `CONTEUDO_BLOQUEADO` ("Seu texto tem termo ou link que não aceitamos").
- "Esse relato me ajudou": `rpc('like_story')`, 1 por membro, contador `like_count`; sem lista pública de quem curtiu.
- Moderação: `moderate_story(id, 'approve'|'reject', motivo)`; aprovação dispara `award_badges` (insígnias
  `voz-da-irmandade`, `irmao`) e e-mail `storyApproved`; rejeição envia `storyRejected` com o motivo (templates 8.4).
- JSON-LD: `Article` (headline, author Person = `author_name`, datePublished, image se houver, publisher "Vocação de Pai")
  + `BreadcrumbList` (Início › Irmandade › Histórias › título). Copiado do `$id.tsx` do VDM.
- AdSense: 1 `AdSlot` in-article após o corpo em `/historias/$id`; nenhum em `/historias/nova` (doc 11 §3).

### 3.3 Server functions de histórias (`src/lib/community.functions.ts`, trecho)

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { assertCleanText } from "@/lib/irmandade/blacklist";   // lança CONTEUDO_BLOQUEADO

const StoryInput = z.object({
  accessToken: z.string().min(20),
  title: z.string().trim().min(5).max(140),
  category: z.enum(["paternidade","casamento","trabalho","fe","superacao","humor"]),
  authorName: z.string().trim().min(2).max(60),
  content: z.string().trim().min(100).max(10000),
  photoUrl: z.string().url().startsWith("https://").nullable(),
  acceptedConduct: z.literal(true),
});
export const createStoryFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => StoryInput.parse(d))
  .handler(async ({ data }) => {
    const { sb, user } = await requireUser(data.accessToken);
    rateLimit(`story:${user.id}`, 2, 24 * 60 * 60_000);
    assertCleanText(`${data.title}\n${data.content}`);
    const { data: row, error } = await sb.from("stories").insert({
      user_id: user.id, title: data.title, category: data.category, author_name: data.authorName,
      content: data.content, photo_url: data.photoUrl,
    }).select("id,status").single();
    if (error) throw new Error(error.message);   // RLS: e-mail não confirmado cai aqui → UI mostra "Confirme seu e-mail"
    return row;
  });
export const likeStoryFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ accessToken: z.string(), storyId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { sb } = await requireUser(data.accessToken);
    const { data: total, error } = await sb.rpc("like_story", { p_story_id: data.storyId });
    if (error) throw new Error(error.message);
    return { likeCount: total as number };
  });
```

---

## 4. Perguntas da Irmandade (`/perguntas`, `/perguntas/$slug`, `/perguntas/nova`)

### 4.1 Fluxo e regras

- **Pergunta**: título 10–160, corpo 20–6.000, `category_id` obrigatório (select das categorias do Blog, `categories`
  da 0002; usar as de nível 1), até 3 `tags` livres (slugificadas, 2–24 caracteres). Nasce `pending`; aprovada aparece
  em `/perguntas` e no sitemap. `slug` = `slugify(title)` + `-` + 6 caracteres aleatórios (gerado na server function;
  unicidade garantida pelo `unique`).
- **Resposta**: 10–6.000 caracteres, só em pergunta `approved`; nasce `approved` (pós-moderação). O autor edita a
  própria resposta por 24 h. Autor da pergunta não responde a própria pergunta como "resposta" (UI esconde o form; pode
  comentar editando a pergunta enquanto `pending`).
- **Votos**: `rpc('vote_answer', { p_answer_id, p_value: 1 | -1 | 0 })`; um voto por membro; saldo em
  `answers.like_count`; ordem das respostas = melhor resposta primeiro, depois saldo desc, depois data.
- **Melhor resposta**: só o autor da pergunta (ou staff): `rpc('accept_answer', { p_question_id, p_answer_id })`.
  Marca `accepted_answer_id`, concede `conselheiro` ao autor da resposta. Pode trocar depois.
- **Fechar**: staff fecha (`moderate_question(id, 'close')`) perguntas resolvidas há > 90 dias ou duplicadas (fica
  visível, sem novas respostas).
- **Antispam** (mesma linha da Fase 6): `TurnstileField` em `/perguntas/nova` e no form de resposta (`src/components/pip/TurnstileField.tsx`,
  verificado no servidor com `TURNSTILE_SECRET_KEY`); honeypot `website` vazio; `rateLimit` 3 perguntas/dia e
  20 respostas/dia por usuário; blacklist; no máximo 2 links por texto (`/https?:\/\//g`); duplicidade: título com
  `similarity(title, $1) > 0.8` nos últimos 30 dias → mensagem "Já existe uma pergunta parecida: <link>".
  Denúncia: `rpc('report_irmandade', { p_entity, p_entity_id, p_reason })`; 3 denúncias → `pending`.
- **Categorias no filtro de `/perguntas`**: chips das categorias de nível 1 + "Sem resposta" (`answers_count = 0`) +
  "Resolvidas" (`accepted_answer_id is not null`). Ordenação: recentes · mais respondidas · sem resposta.
- **JSON-LD `QAPage`** em `/perguntas/$slug` (`src/lib/irmandade/jsonld.ts`):

```ts
export function qaPageJsonLd(q: QuestionRow, answers: AnswerRow[], url: string) {
  const ans = (a: AnswerRow) => ({ "@type": "Answer", text: a.body, dateCreated: a.created_at, upvoteCount: Math.max(0, a.like_count),
    url: `${url}#resposta-${a.id}`, author: { "@type": "Person", name: a.author_name ?? "Irmão da Irmandade" } });
  const accepted = answers.find((a) => a.id === q.accepted_answer_id);
  return { "@context": "https://schema.org", "@type": "QAPage",
    mainEntity: { "@type": "Question", name: q.title, text: q.body, answerCount: q.answers_count, dateCreated: q.created_at, url,
      author: { "@type": "Person", name: q.author_name ?? "Pai da Irmandade" },
      ...(accepted ? { acceptedAnswer: ans(accepted) } : {}),
      suggestedAnswer: answers.filter((a) => a.id !== q.accepted_answer_id).slice(0, 10).map(ans) } };
}
```

Regras do Google para `QAPage`: só em página de uma pergunta com respostas visíveis; `upvoteCount` nunca negativo;
sem respostas → emitir só `Question` sem `suggestedAnswer`. `author_name` vem de `profiles.display_name` via a view
`irmandade_members` (criada na 0006; a `public_authors` da 0004 só expõe staff) — nunca e-mail.

### 4.2 Esqueleto de leitura (`src/lib/db/irmandade.ts`, trecho)

```ts
export const QUESTION_SELECT = "id,slug,title,body,category_id,status,answers_count,accepted_answer_id,views,tags,last_answer_at,created_at,user_id,categories(name,slug,color),author:irmandade_members(display_name,avatar_url)";
export async function queryQuestions(db: DbClient, o: { category?: string; filter?: "sem-resposta"|"resolvidas"; sort?: "recentes"|"respondidas"; limit?: number; offset?: number } = {}) {
  let q = db.from("questions").select(QUESTION_SELECT).in("status", ["approved","closed"]);
  if (o.category) q = q.eq("categories.slug", o.category);
  if (o.filter === "sem-resposta") q = q.eq("answers_count", 0);
  if (o.filter === "resolvidas") q = q.not("accepted_answer_id", "is", null);
  q = o.sort === "respondidas" ? q.order("answers_count", { ascending: false }) : q.order("created_at", { ascending: false });
  const from = o.offset ?? 0; const { data, error } = await q.range(from, from + (o.limit ?? 20) - 1);
  if (error) throw error; return data ?? [];
}
export async function queryQuestionBySlug(db: DbClient, slug: string) {
  const { data: q, error } = await db.from("questions").select(QUESTION_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error; if (!q) return null;
  const { data: answers } = await db.from("answers").select("id,body,like_count,created_at,user_id,author:irmandade_members(display_name,avatar_url)")
    .eq("question_id", q.id).eq("status", "approved").order("like_count", { ascending: false }).order("created_at");
  return { question: q, answers: answers ?? [] };
}
```

---

## 5. Formação — trilhas (`/formacao`, `/formacao/$slug`)

### 5.1 Modelo

- Trilha = `tracks` (slug, título, descrição, `level`, `estimated_days`, `audience`, `is_premium`, `pillar`, `outcomes`)
  + `track_steps` em ordem (`position`), agrupados por `module` (texto; o player agrupa por igualdade de `module`).
- Tipos de passo (`type`) e regra de conclusão (`completion_rule`):

| `type` | O que o `StepContent` mostra | `completion_rule` | Como conclui |
|---|---|---|---|
| `leitura` | `body` (Tiptap, 300–700 palavras) | `manual` | Botão "Concluir passo" |
| `artigo` | `summary` + cartão do post (`post_id` → capa, título, link `/post/<slug>`) | `read_post` | Botão habilita após abrir o link (estado local) |
| `video` | `video_url` (YouTube/Vimeo embed `nocookie`) + `summary`; sem URL ainda → vira `leitura` | `video` | Botão habilita após 60% do vídeo (evento do player) ou 2 min na página |
| `checklist` | `body` com `taskList`; itens marcáveis (estado em `track_progress.note` como JSON) | `checklist_all` | Todos marcados → `complete_track_step` + `save_step_note` |
| `exercicio` | `body` (enunciado) + `textarea` (até 4.000) | `exercise_text` | ≥ 80 caracteres → `complete_track_step` + `save_step_note` |

- Progresso: `complete_track_step(p_step_id)` (RPC) seguido de `grant_badges_for_me()`; conclusão da trilha = todos os
  passos; concede `formador` (1ª) e a insígnia específica (regra `track_completed` com `slug`). Passos liberados em sequência: o passo N abre quando N-1
  está concluído (UI; o banco não impede, para o pai poder voltar).
- Premium: `is_premium=true` → só os 3 primeiros passos abrem para o plano gratuito (`PremiumGate` do doc 07 §7.4);
  o banco bloqueia o resto (`complete_track_step` → `PREMIUM`). **No lançamento as 8 trilhas são `is_premium=false`**
  (plano pago inativo). Candidatas a premium quando o plano ativar: "Pai de adolescente" e "Provedor".
- Turmas (coortes, ideia 23 do `res-sites.md`): não há tabela nesta fase. A trilha "33 dias com São José" sugere datas
  na descrição (começar 15/02 para terminar em 19/03; 29/03 para 1º/05). Reavaliar na Fase 8.
- Post relacionado: `related_post_slug` é dica do seed. O script resolve `post_id` com
  `select id from posts where slug = $1 and status = 'published'`; se não existir, `post_id` fica nulo, o passo vira
  `leitura` com o `summary` e o slug fica registrado para a rotina da Fase 8 escrever o artigo (`12-backlog-de-conteudo.md`).
  Slugs marcados **(seed F1)** existem desde a Fase 1 (doc 03 §9.2); os demais são **backlog**.
- Pilares (doc 00 §3.1): `casa`, `trabalho`, `corpo`, `alma`. `/formacao` agrupa por pilar, nessa ordem.

### 5.2 As 8 trilhas (conteúdo fixo; `summary` = resumo do passo; `body` é escrito pelo executor a partir dele)

Colunas: `#` = `position` · `Tipo` = `type` · `Regra` = `completion_rule` · `Post` = `related_post_slug`.

#### T1 `pai-de-primeira-viagem-em-30-dias` — "Pai de primeira viagem em 30 dias"
`level=iniciante` · `estimated_days=30` · `audience`="Homem esperando o primeiro filho ou com bebê de até 3 meses" · `pillar=casa` · `is_premium=false` · `sort_order=10`
Descrição: "Do positivo ao primeiro mês: o que fazer, o que não fazer e como ser o pai que a sua esposa e o seu filho precisam, sem virar espectador."

| # | Módulo | Tipo | Título | Resumo | Regra | Post |
|---|---|---|---|---|---|---|
| 1 | Antes do parto | leitura | O que muda em você antes de mudar na casa | O medo é normal e não é sinal de fraqueza. A paternidade começa na gestação: três compromissos do pai antes do parto (presença nas consultas, casa pronta, conversa franca com a esposa). | manual | `vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem` (seed F1) |
| 2 | Antes do parto | artigo | As consultas do pré-natal são suas também | O que perguntar ao obstetra, o que anotar, por que o pré-natal do parceiro (exames do homem) existe e como pedir folga no trabalho para ir. | read_post | `pre-natal-do-parceiro-os-exames-do-pai` (backlog) |
| 3 | Antes do parto | checklist | Mala e documentos do pai | RG, certidão de casamento, cartão do plano, DNV; mala do pai (roupa, carregador, dinheiro, lanche); trajeto até a maternidade testado; quem avisar. | checklist_all | `checklist-nasceu-os-10-primeiros-passos-do-pai` (backlog) |
| 4 | Antes do parto | exercicio | O plano do parto, visto pelo pai | Escreva em 5 linhas: hospital, trajeto, quem fica com a casa, o que você vai dizer a ela na hora mais difícil. Guardar e mostrar à esposa. | exercise_text | — |
| 5 | Primeira semana | video | Como segurar, trocar e dar banho | As quatro pegadas seguras, a troca de fralda em 6 passos e o banho sem pânico. Sem vídeo gravado ainda: usar o artigo como leitura. | video | `como-segurar-um-recem-nascido-com-seguranca` (seed F1) |
| 6 | Primeira semana | artigo | Registro, CPF, plano e licença: a semana da burocracia | Registro em até 15 dias e gratuito, CPF na certidão, inclusão no plano, licença-paternidade (5 dias; +15 na Empresa Cidadã), salário-família. Fonte oficial em cada item. | read_post | `licenca-paternidade-como-funciona` (backlog) |
| 7 | Primeira semana | leitura | Sua esposa no pós-parto: o que ela precisa de você | Descanso, comida pronta, visitas controladas, remédios na hora. Semáforo do pai: tristeza passageira (verde), choro diário (atenção), ela não quer o bebê ou fala em se machucar (alerta: obstetra/psiquiatra agora). | manual | `como-ser-um-marido-presente-depois-que-o-bebe-chega` (seed F1) |
| 8 | Primeira semana | checklist | Divisão de tarefas da semana 1 | Louça, mercado, lavanderia, lixo, turnos da noite, filtro de visitas, telefone da família. Marque o que é seu. | checklist_all | `rotina-do-pai-nos-primeiros-30-dias-do-bebe` (seed F1) |
| 9 | Primeiro mês | artigo | Noites: turnos, sono do casal e o seu trabalho | Turnos de 3 horas, cochilo estratégico, café no limite, quando aceitar ajuda da sogra. O pai que dorme 5 horas picadas dirige pior: cuidado no trânsito. | read_post | `rotina-do-pai-nos-primeiros-30-dias-do-bebe` (seed F1) |
| 10 | Primeiro mês | leitura | Dinheiro do primeiro ano: o que entra na conta | Fralda, consultas, plano, roupa que dura 2 meses. Orçamento em 5 categorias e a reserva mínima. Link para `/ferramentas` (calculadora de orçamento quando existir). Informação educativa. | manual | `orcamento-familiar-para-quem-vai-ser-pai` (seed F1) |
| 11 | Primeiro mês | exercicio | Carta para o seu filho no primeiro mês | Dez linhas: o que você sentiu, o que promete, o que quer que ele saiba sobre a mãe. Guardar para entregar aos 18. | exercise_text | — |
| 12 | Primeiro mês | leitura | Os próximos 30 dias | Vacinas, consulta do 1º mês, volta ao trabalho, intimidade do casal com paciência, e o convite: comece o desafio "30 dias de presença com os filhos". | manual | — |

#### T2 `marido-e-lider-servidor` — "Marido e líder servidor"
`level=intermediario` · `estimated_days=21` · `audience`="Homem casado, com ou sem filhos" · `pillar=casa` · `is_premium=false` · `sort_order=20`
Descrição: "Autoridade que se ganha servindo: 21 dias para ser o marido que a sua esposa pode seguir sem medo."

| # | Módulo | Tipo | Título | Resumo | Regra | Post |
|---|---|---|---|---|---|---|
| 1 | Servir | leitura | Liderar é servir primeiro | Ef 5,25: amar como Cristo amou, entregando-se. Liderança não é mandar nem sumir: é ser o primeiro a carregar. Três sinais de que você lidera servindo e três de que só manda. | manual | `como-ser-um-marido-presente-depois-que-o-bebe-chega` (seed F1) |
| 2 | Servir | exercicio | O inventário honesto | Dez perguntas (horas de tela x horas de conversa; última vez que ela descansou por sua causa; quem acorda com o filho…). Responder sem se defender. | exercise_text | — |
| 3 | Servir | checklist | Sete serviços escondidos | Café pronto, tanque cheio, louça da noite, dormir com o bebê uma noite, buscar na escola, resolver a conta pendente, elogiar na frente dos filhos. Sem anunciar. | checklist_all | — |
| 4 | Conversar | leitura | O dever de se sentar | O "dever de se sentar" das Equipes de Nossa Senhora: conversa mensal estruturada, 40 min, sem celular, seis perguntas fixas (o que foi bom, o que pesou, o que mudar, dinheiro, filhos, Deus). | manual | `dever-de-se-sentar-roteiro-de-conversa-do-casal` (backlog) |
| 5 | Conversar | exercicio | Marque o primeiro "dever de se sentar" | Data, lugar, as seis perguntas. Depois registre em 5 linhas como foi e o que ficou combinado. | exercise_text | — |
| 6 | Conversar | artigo | Briga não é derrota: como discutir sem ferir | Regras: sem "sempre/nunca", pausa de 20 minutos, nunca na frente dos filhos, nunca dormir sem reconciliar, pedir perdão primeiro. | read_post | `como-discutir-com-a-esposa-sem-ferir` (backlog) |
| 7 | Conversar | leitura | Intimidade, cansaço e a fase dos filhos pequenos | Respeito ao corpo e ao cansaço dela, iniciativa de cuidar, paciência. Semáforo: fase difícil (verde), meses sem aproximação (atenção), rejeição e silêncio por longo tempo (alerta: terapeuta de casal, padre). | manual | — |
| 8 | Liderar | leitura | Oração do casal: dois minutos por dia | Pai-Nosso, uma intenção cada um, bênção. Como propor sem forçar; o que fazer se ela não quiser ainda. | manual | `oracao-em-familia-como-comecar` (backlog) |
| 9 | Liderar | video | Finanças a dois: a conversa que evita a maioria das brigas | Conta conjunta + mesada pessoal, metas de 12 meses, nada escondido. Sem vídeo: usar o artigo. | video | `orcamento-familiar-para-quem-vai-ser-pai` (seed F1) |
| 10 | Liderar | exercicio | Regra de vida do marido | Cinco compromissos permanentes (os "pontos concretos de esforço" das ENS adaptados): oração, escuta, serviço, dinheiro, presença. Escrever, imprimir, revisar em 30 dias. | exercise_text | — |

#### T3 `provedor-financas-da-familia-em-8-semanas` — "Provedor: finanças da família em 8 semanas"
`level=intermediario` · `estimated_days=56` · `audience`="Pai que quer colocar o dinheiro da casa em ordem; nenhuma promessa de ganho" · `pillar=trabalho` · `is_premium=false` · `sort_order=30`
Descrição: "Oito semanas, um passo por vez: diagnóstico, orçamento, dívidas, reserva, proteção e a reunião mensal da família. Informação educativa; para o seu caso, procure um profissional."

| # | Módulo | Tipo | Título | Resumo | Regra | Post |
|---|---|---|---|---|---|---|
| 1 | Semana 1 | leitura | Prover é mais que pagar boleto | Provisão como vocação. Os três inimigos do provedor: desorganização, dívida cara e ausência de reserva. Aviso fixo: informação educativa. | manual | `orcamento-familiar-para-quem-vai-ser-pai` (seed F1) |
| 2 | Semana 1 | exercicio | Raio-X: tudo que entra e tudo que sai | Extratos de 30 dias (banco e cartão), cinco categorias, o número da sobra ou do buraco. Escrever o número. | exercise_text | — |
| 3 | Semana 2 | artigo | Orçamento em 5 categorias | Casa, família, transporte, dívidas, futuro; percentuais de referência adaptados ao Brasil; onde cortar sem sofrer; tabela modelo. | read_post | `orcamento-familiar-para-quem-vai-ser-pai` (seed F1) |
| 4 | Semana 2 | checklist | Cortes sem sofrer | Assinaturas, tarifa bancária, plano de celular, delivery, juros do cartão, seguro duplicado, compras por impulso, "parcelinha". | checklist_all | — |
| 5 | Semana 3 | leitura | Dívidas: ordem de ataque | Juros maiores primeiro (cartão, cheque especial), renegociação, portabilidade, Serasa Limpa Nome; nunca empréstimo para investir. Semáforo das dívidas. | manual | `como-sair-das-dividas-plano-do-pai` (backlog) |
| 6 | Semana 3 | exercicio | Plano de quitação | Lista: credor, saldo, taxa, parcela, ordem de ataque, data prevista do fim. | exercise_text | — |
| 7 | Semana 4 | leitura | Reserva de emergência: 3 a 6 meses | Onde deixar (liquidez diária: Tesouro Selic, CDB com liquidez), quanto por mês, quando usar e quando não usar. | manual | `reserva-de-emergencia-do-pai` (backlog) |
| 8 | Semana 5 | artigo | Seguro de vida e o que acontece se você faltar | Seguro, inventário, testamento básico, beneficiários, documentos organizados. Procure corretor e advogado. | read_post | `seguro-de-vida-para-pais-o-que-saber` (backlog) |
| 9 | Semana 6 | leitura | Carreira: ganhar mais sem perder a família | Pedir aumento, trocar de emprego, bico x PJ, concursos. Pai Indica Pai: vagas e mentoria de pai para pai (`/pai-indica-pai`). | manual | — |
| 10 | Semana 7 | leitura | Investir para os filhos sem promessa de riqueza | Tesouro Direto, previdência, poupança como porta de entrada; juros compostos; mesada e educação financeira do filho. Sem recomendação individual. | manual | `juros-compostos-explicados-para-o-pai` (backlog) |
| 11 | Semana 7 | video | Mercado do pai: ler economia em 5 minutos | Selic, IPCA, dólar: o que cada um muda no seu bolso. Usar `/ferramentas/mercado-financeiro`. Sem vídeo: leitura. | video | — |
| 12 | Semana 8 | exercicio | Reunião financeira mensal da família | Roteiro de 30 minutos com a esposa; agendar as próximas três; registrar como foi a primeira. | exercise_text | — |

#### T4 `fe-do-pai-33-dias-com-sao-jose` — "Fé do pai: 33 dias com São José"
`level=iniciante` · `estimated_days=33` · `audience`="Homem católico (ou que quer conhecer a fé) que deseja consagrar-se a São José" · `pillar=alma` · `is_premium=false` · `sort_order=40`
Descrição: "Trinta e três dias de leitura curta, oração e uma ação concreta, terminando na consagração a São José. Comece em 15/02 (termina em 19/03) ou em 29/03 (termina em 1º/05)."
Cada passo: `type=leitura`, `completion_rule=manual`, `estimated_minutes=10`. O `body` tem três blocos fixos: **Leitura** (trecho bíblico ou do Magistério: Mt 1–2, Lc 2, *Redemptoris Custos* 1989, *Patris Corde* 2020, *Quamquam Pluries* 1889 — citar e comentar, nunca copiar livro protegido), **Oração** (Pai-Nosso, "A vós, São José", Ladainha de São José aos domingos) e **Ação do dia**. Sem post relacionado (coluna omitida); backlog: `consagracao-a-sao-jose-o-que-e-e-como-fazer`.

| # | Módulo | Título | Resumo (leitura · ação) |
|---|---|---|---|
| 1 | Quem é José | Por que consagrar-se a São José | O que é consagração: entregar-se à proteção e à escola de José. Como será o caminho. · Contar à esposa que começou. |
| 2 | Quem é José | O homem justo (Mt 1,19) | Justiça como retidão; José decide em silêncio e com misericórdia. · Um ato de justiça pequeno hoje: pagar, devolver, pedir perdão. |
| 3 | Quem é José | O sonho e a obediência (Mt 1,20-24) | "Fez como o anjo lhe ordenara": obedecer a Deus sem entender tudo. · Dez minutos de silêncio antes de dormir. |
| 4 | Quem é José | Esposo de Maria: o casamento como missão | Proteger a esposa é a primeira missão do pai (*Redemptoris Custos* 7). · Perguntar a ela o que mais pesa nesta semana e carregar. |
| 5 | Quem é José | Belém: o pai que não tinha lugar (Lc 2,1-7) | Prover no limite; pobreza digna. · Agradecer em voz alta por três coisas que você tem. |
| 6 | Quem é José | "Tu lhe porás o nome de Jesus" (Mt 1,21) | Dar o nome é assumir a paternidade. · Escrever por que escolheu o nome do seu filho (ou qual escolheria). |
| 7 | Quem é José | Revisão da semana | O que mudou em você. Ladainha de São José. · Confissão ou exame de consciência. |
| 8 | José, esposo | Castidade do esposo | Pureza como força que protege a esposa (*Patris Corde* 7). · Um dia sem conteúdo que fere o olhar. |
| 9 | José, esposo | A escuta | José escuta Deus e Maria; o marido que escuta. · Quinze minutos ouvindo a esposa sem responder. |
| 10 | José, esposo | A fuga para o Egito (Mt 2,13-15) | Proteger a família custa; deixar tudo. · Listar três riscos concretos da sua família e o que fará esta semana. |
| 11 | José, esposo | O carpinteiro (Mt 13,55) | Trabalho como oração; dignidade do ofício. · Fazer hoje o trabalho "como para Deus", sem reclamar. |
| 12 | José, esposo | Fidelidade nos dias comuns | Nazaré: trinta anos escondidos. · Um gesto repetido todos os dias desta semana (café, louça). |
| 13 | José, esposo | O silêncio de José | Nenhuma palavra sua nos Evangelhos; o pai que fala com atos. · Um dia sem reclamar em voz alta. |
| 14 | José, esposo | Revisão da semana | Ladainha. · Convidar a esposa para uma dezena do terço. |
| 15 | José, pai | Pai adotivo, pai verdadeiro | Paternidade é dom e decisão ("pai na acolhida", *Patris Corde* 4). · Dizer ao filho, com palavras, que ele é querido. |
| 16 | José, pai | A apresentação no Templo (Lc 2,22-24) | Levar o filho a Deus: batismo, catequese. · Conferir os sacramentos dos filhos e marcar o que falta. |
| 17 | José, pai | Jesus perdido no Templo (Lc 2,41-50) | A angústia do pai; buscar sem gritar. · Perguntar ao filho "o que você anda pensando?". |
| 18 | José, pai | "E era-lhes submisso" (Lc 2,51) | Autoridade que educa com ternura e firmeza. · Corrigir hoje sem levantar a voz. |
| 19 | José, pai | Ensinar o ofício | "Filho do carpinteiro": o pai transmite o fazer. · Ensinar uma tarefa prática ao filho. |
| 20 | José, pai | O pai que reza | A oração do pai pela família. · Rezar pelo nome de cada filho e da esposa. |
| 21 | José, pai | Revisão: "pai na sombra" | O pai que aponta para o Pai (*Patris Corde* 7). · Exame de consciência sobre presença. |
| 22 | José, trabalhador | São José Operário | 1º de maio (Pio XII, 1955): trabalho santificado. · Organizar o local de trabalho e as ferramentas. |
| 23 | José, trabalhador | Prover sem ansiedade (Mt 6,25-34) | Providência não é preguiça. · Fazer ou revisar o orçamento do mês. |
| 24 | José, trabalhador | Honestidade no dinheiro | Justo no pouco: nota fiscal, imposto, dívida. · Acertar uma pendência financeira. |
| 25 | José, trabalhador | Descanso e domingo | Deus descansou; a família precisa do seu domingo. · Planejar o próximo domingo sem trabalho e sem tela. |
| 26 | José, trabalhador | Generosidade do provedor | Dízimo, esmola, ensinar os filhos a dar. · Doar algo junto com os filhos. |
| 27 | José, trabalhador | Quando falta trabalho | José em terra estrangeira; dignidade no desemprego; Pai Indica Pai. · Ajudar um homem desempregado (indicação, vaga). |
| 28 | José, trabalhador | Revisão da semana | Ladainha. · Conversar com um irmão da Irmandade. |
| 29 | Modelo do homem | Coragem criativa (*Patris Corde* 5) | Resolver com o que se tem. · Consertar algo que vem adiando. |
| 30 | Modelo do homem | A morte de São José | Padroeiro da boa morte; viver preparado. · Conversar sobre seguro/testamento ou pedir perdão a alguém. |
| 31 | Modelo do homem | Patrono da Igreja (*Quamquam Pluries*) | José guarda a Igreja como guardou a família; a paróquia precisa de homens. · Oferecer-se para um serviço na paróquia. |
| 32 | Modelo do homem | Preparação | Jejum ou sacrifício; confissão; escrever a própria entrega. · Preparar a oração de consagração. |
| 33 | Consagração | Consagração a São José | Oração de consagração (texto próprio do site), missa se possível, contar à família, marcar a renovação anual (19/03 ou 1º/05). Insígnia "Filho de São José". |

#### T5 `saude-do-homem-depois-dos-30` — "Saúde do homem depois dos 30"
`level=intermediario` · `estimated_days=14` · `audience`="Homens de 30 a 55 anos" · `pillar=corpo` · `is_premium=false` · `sort_order=50`
Descrição: "Exames, sono, treino, comida, cabeça e vícios: duas semanas para o pai cuidar de quem cuida de todo mundo. Nada aqui substitui o seu médico."

| # | Módulo | Tipo | Título | Resumo | Regra | Post |
|---|---|---|---|---|---|---|
| 1 | Diagnóstico | leitura | Por que o homem adia o médico (e por que você não pode) | Política Nacional de Saúde do Homem (2009): homens vivem menos e procuram menos o serviço de saúde. Medo, cultura e a desculpa do tempo. Semáforo do check-up. | manual | `exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos` (seed F1) |
| 2 | Diagnóstico | artigo | Os exames por idade: 30, 40, 50 | Pressão, glicemia, colesterol, cintura, pele, dentista; próstata conforme orientação médica (a partir dos 50, ou 45 com histórico). Lista por faixa. | read_post | `exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos` (seed F1) |
| 3 | Diagnóstico | exercicio | Marque a consulta | Registrar data da consulta com clínico geral e os três exames pedidos. Sem plano: UBS do bairro. | exercise_text | — |
| 4 | Corpo | leitura | Sono: 7 horas não é luxo | Higiene do sono, turnos com bebê, café depois das 15h. Ronco alto com sonolência de dia = procurar médico (apneia). | manual | `sono-do-pai-como-dormir-melhor` (backlog) |
| 5 | Corpo | artigo | Treino de 20 minutos para quem não tem tempo | Calistenia em casa, 4 semanas com progressão, antes das crianças acordarem. | read_post | `treino-de-20-minutos-em-casa-para-pais-sem-tempo` (seed F1) |
| 6 | Corpo | checklist | Sete dias de movimento | Caminhada 30 min ×3, treino 20 min ×2, alongamento, correr com o filho no parque. | checklist_all | — |
| 7 | Corpo | leitura | Comer como homem adulto | Proteína, fibra, água; álcool com limite; churrasco com salada; sem dieta milagrosa. Quando procurar nutricionista. | manual | `cortes-de-carne-para-churrasco-guia-do-pai-iniciante` (seed F1) |
| 8 | Cabeça | leitura | Estresse, raiva e tristeza que não passa | Sinais de ansiedade e depressão no homem (irritação, isolamento, álcool). Semáforo: fase ruim (verde), semanas sem ânimo (atenção), pensamentos de morte (alerta: CVV 188, psiquiatra agora). Fé e terapia não competem. | manual | `saude-mental-do-pai-quando-procurar-ajuda` (backlog) |
| 9 | Cabeça | leitura | Vícios: pornografia, álcool, apostas | Reconhecer sem vergonha; método: confissão, irmãos, ajuda profissional; bloqueios no celular; grupos de apoio. | manual | `como-vencer-a-pornografia-plano-do-homem` (backlog) |
| 10 | Rotina | exercicio | Seu check-up anual no calendário | Data fixa (aniversário), três metas de saúde de 90 dias, compartilhar com a esposa. | exercise_text | — |

#### T6 `mestre-do-churrasco` — "Mestre do churrasco"
`level=iniciante` · `estimated_days=14` · `audience`="Qualquer pai que quer fazer um churrasco de verdade" · `pillar=corpo` · `is_premium=false` · `sort_order=60`
Descrição: "Do açougue ao ponto da carne: cortes, fogo, quantidade, tempero, segurança com crianças e o seu primeiro churrasco de mestre."

| # | Módulo | Tipo | Título | Resumo | Regra | Post |
|---|---|---|---|---|---|---|
| 1 | Base | leitura | O churrasco como mesa da família | Não é só carne: é encontro. Planejar com antecedência; o pai que serve primeiro. | manual | `cortes-de-carne-para-churrasco-guia-do-pai-iniciante` (seed F1) |
| 2 | Base | artigo | Cortes: o que comprar e como escolher | Picanha (capa de um dedo, branca e firme), fraldinha, maminha, costela, alcatra; cor e gordura; nomes BR × EUA. | read_post | `cortes-de-carne-para-churrasco-guia-do-pai-iniciante` (seed F1) |
| 3 | Fogo | video | Fogo: carvão, acendimento e o ponto da brasa | Acendedor ou chaminé, nunca álcool líquido; brasa cinza; teste da mão (3 segundos). Sem vídeo: leitura. | video | `como-acender-a-churrasqueira-sem-sofrimento` (backlog) |
| 4 | Fogo | leitura | Quanto comprar | 400 g de carne por adulto, 200 g por criança, carvão 1 kg por kg de carne, bebidas, pão de alho. Usar a calculadora de churrasco em `/ferramentas` quando existir. | manual | `quanto-de-carne-por-pessoa-no-churrasco` (backlog) |
| 5 | Fogo | checklist | Kit do churrasqueiro | Faca, tábua, garfo longo, pegador, termômetro, luva, sal grosso, carvão, acendedor; links para a Loja do Pai (`/loja`). | checklist_all | — |
| 6 | Técnica | artigo | Sal, tempero e tempo | Sal grosso na hora, descanso de 5 minutos, não furar a carne, grelha limpa e quente. | read_post | `sal-grosso-ou-sal-fino-tempero-de-churrasco` (backlog) |
| 7 | Técnica | leitura | Picanha e fraldinha passo a passo | Altura da grelha, tempo por lado, ponto, corte contra a fibra. | manual | — |
| 8 | Técnica | leitura | Costela e peças grandes: paciência | Fogo baixo, 4 a 6 horas, papel alumínio, teste do osso. | manual | — |
| 9 | Técnica | leitura | Segurança: crianças, fogo e bebida | Perímetro, nada de álcool no fogo, faca fora de alcance, quem bebe não assa. Semáforo: queimadura leve (água corrente 20 min), bolha grande ou no rosto (alerta: hospital). | manual | — |
| 10 | Prova | exercicio | Seu primeiro churrasco de mestre | Planejar (lista, custo, cortes, horário), fazer, registrar o que aprendeu. Insígnia "Mestre do churrasco". | exercise_text | — |

#### T7 `faca-voce-mesmo-consertos-de-casa` — "Faça-você-mesmo: consertos de casa"
`level=iniciante` · `estimated_days=14` · `audience`="Pai que quer resolver o básico da casa sem chamar ninguém" · `pillar=corpo` · `is_premium=false` · `sort_order=70`
Descrição: "Caixa de ferramentas, parede, torneira, tomada, mofo, carro e segurança com crianças. E a regra de ouro: saber quando não fazer sozinho."

| # | Módulo | Tipo | Título | Resumo | Regra | Post |
|---|---|---|---|---|---|---|
| 1 | Ferramentas | leitura | Caixa básica: 15 itens | Martelo, chaves, alicates, trena, nível, furadeira, buchas e parafusos; três níveis de orçamento (faixa de preço, nunca valor exato). | manual | `kit-basico-de-ferramentas-para-a-casa` (seed F1) |
| 2 | Ferramentas | checklist | Monte (ou complete) sua caixa | Os 15 itens, para marcar o que já tem. | checklist_all | `kit-basico-de-ferramentas-para-a-casa` (seed F1) |
| 3 | Casa | video | Furar parede sem desastre | Tipo de parede, bucha certa, detector de fiação e cano, altura de quadros. Sem vídeo: leitura. | video | `como-furar-parede-e-fixar-prateleira` (backlog) |
| 4 | Casa | leitura | Torneira pingando e descarga vazando | Fechar o registro, trocar reparo e vedante, quando chamar o encanador. | manual | `torneira-pingando-como-consertar` (backlog) |
| 5 | Casa | leitura | Elétrica básica com segurança | Desligar o disjuntor, testar, padrão de tomada NBR 14136. Semáforo: tomada frouxa (verde), aquece (atenção), cheiro de queimado ou choque (alerta: eletricista). | manual | `trocar-tomada-e-interruptor-com-seguranca` (backlog) |
| 6 | Casa | leitura | Mofo, infiltração e retoque de pintura | Causas, limpeza, selador, tinta; quando é estrutural. | manual | — |
| 7 | Carro | leitura | Manutenção preventiva do carro em 15 minutos | Óleo, água, pneus, luzes, palhetas; calendário por quilometragem. | manual | `manutencao-basica-do-carro-checklist-do-pai` (backlog) |
| 8 | Segurança | checklist | Segurança da casa com crianças | Protetor de tomada, trava de armário, rede de janela, produtos trancados, extintor; links `/loja`. | checklist_all | — |
| 9 | Prova | exercicio | Conserte uma coisa com seu filho | Escolher um reparo, fazer junto, registrar o que ele aprendeu. | exercise_text | — |
| 10 | Prova | leitura | Quando NÃO fazer sozinho | Gás, quadro elétrico, estrutura, telhado alto: Pai Profissional (`/pai-indica-pai/profissionais`). Insígnia "Mão na massa". | manual | — |

#### T8 `pai-de-adolescente` — "Pai de adolescente"
`level=intermediario` · `estimated_days=21` · `audience`="Pais de filhos de 12 a 18 anos" · `pillar=casa` · `is_premium=false` (candidata a premium) · `sort_order=80`
Descrição: "Menos grito, mais contrato: 21 dias para o pai continuar presente quando o filho começa a se afastar."

| # | Módulo | Tipo | Título | Resumo | Regra | Post |
|---|---|---|---|---|---|---|
| 1 | Entender | leitura | O que muda aos 12: corpo, cérebro e distância | Puberdade, busca de identidade, o pai que não some quando o filho se fecha. | manual | `pai-de-adolescente-o-que-esperar` (backlog) |
| 2 | Entender | artigo | Autoridade na adolescência: menos grito, mais contrato | Regras claras, consequências combinadas, consistência; nunca humilhar. | read_post | `como-dar-limites-sem-gritar-autoridade-com-calma` (seed F1) |
| 3 | Proteger | leitura | Celular, redes e pornografia | Controles parentais, acordo de uso assinado, conversa direta sobre pornografia. Semáforo: uso alto (verde), esconde a tela (atenção), contato com adulto desconhecido ou conteúdo sexual (alerta: agir hoje). | manual | `celular-do-adolescente-regras-do-pai` (backlog) |
| 4 | Proteger | exercicio | Uma hora só nós dois | Atividade escolhida pelo filho, sem celular; registrar como foi. | exercise_text | — |
| 5 | Formar | leitura | Dinheiro, mesada e primeiro trabalho | Mesada por responsabilidade, conta jovem, Jovem Aprendiz (Lei 10.097/2000). | manual | — |
| 6 | Formar | leitura | Namoro, sexualidade e castidade: a conversa que o pai dá | Sem terceirizar; verdade com afeto; a visão católica apresentada com respeito, sem sermão. | manual | `como-falar-de-sexualidade-com-o-filho-adolescente` (backlog) |
| 7 | Formar | leitura | Fé do adolescente: quando ele não quer mais ir à missa | Testemunho vale mais que imposição; crisma, grupo de jovens, paciência. | manual | `filho-adolescente-nao-quer-ir-a-missa` (backlog) |
| 8 | Formar | leitura | Escola, vestibular e vocação | Ajudar a discernir sem impor; vocação religiosa como possibilidade real. | manual | — |
| 9 | Proteger | leitura | Sinais de alerta: drogas, automutilação, isolamento | Semáforo completo; onde procurar ajuda (CAPS, psicólogo, padre); nunca minimizar. | manual | `sinais-de-alerta-no-adolescente-guia-do-pai` (backlog) |
| 10 | Prova | exercicio | Carta ao filho adolescente | Escrever e entregar; registrar a reação. | exercise_text | — |

### 5.3 Seed: `supabase/seed/tracks.json` + `scripts/seed-formacao.mjs`

Formato (uma entrada por trilha; `steps[]` com todos os campos da tabela; `body` em Tiptap JSON seguindo o doc 02 §5.1):

```json
{ "tracks": [
  { "slug": "pai-de-primeira-viagem-em-30-dias", "title": "Pai de primeira viagem em 30 dias",
    "description": "Do positivo ao primeiro mês: o que fazer, o que não fazer e como ser o pai que a sua esposa e o seu filho precisam, sem virar espectador.",
    "level": "iniciante", "estimated_days": 30, "estimated_minutes": 180, "audience": "Homem esperando o primeiro filho ou com bebê de até 3 meses",
    "pillar": "casa", "is_premium": false, "sort_order": 10, "status": "published", "cover_image_url": null,
    "outcomes": ["Saber o que fazer nas consultas e no parto", "Dividir a casa e as noites sem brigar", "Resolver registro, licença e plano na primeira semana"],
    "steps": [
      { "position": 1, "module": "Antes do parto", "type": "leitura", "title": "O que muda em você antes de mudar na casa",
        "summary": "O medo é normal e não é sinal de fraqueza. A paternidade começa na gestação…", "completion_rule": "manual",
        "related_post_slug": "vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem", "video_url": null, "estimated_minutes": 10,
        "body": { "type": "doc", "content": [ { "type": "paragraph", "content": [ { "type": "text", "text": "…300 a 700 palavras…" } ] } ] } }
    ] },
  { "slug": "mestre-do-churrasco", "...": "…as 2 trilhas completas no arquivo são T1 e T6; as outras 6 seguem o mesmo esquema a partir das tabelas da seção 5.2…" }
] }
```

Regras do seed: T1 e T6 vão **completas** (todos os `body`) na primeira sessão; T2–T5, T7 e T8 entram com `summary` e
`body` curto (2 parágrafos) e `status='published'` — a rotina da Fase 8 engorda os `body` depois. `body` de `checklist`
usa `taskList`; de `exercicio` termina com `paragraph` "Escreva abaixo". Nunca repetir URL de capa entre trilhas; capas
pela cascata de imagens do CLAUDE.md §5.3 (pai com filho, oficina, churrasco, igreja), gravadas em `cover_image_url`.

`scripts/seed-formacao.mjs` (Node 22, sem dependência): lê `supabase/seed/tracks.json` e `supabase/seed/challenges.json`
e gera `supabase/migrations/0008_seed_formacao.sql` com, para cada trilha:
`insert into public.tracks (…) values (…) on conflict (slug) do update set …;` e, para cada passo,
`insert into public.track_steps (track_id, position, module, type, title, summary, completion_rule, related_post_slug, video_url, estimated_minutes, body, post_id) select t.id, …, $seed$<json>$seed$::jsonb, (select p.id from public.posts p where p.slug = '<related_post_slug>' and p.status = 'published') from public.tracks t where t.slug = '<slug>' on conflict (track_id, position) do update set …;`
(mesmo padrão para `challenges`/`challenge_days`, chave `(challenge_id, day)`). O SQL é commitado **e** aplicado com
`mcp__Supabase__apply_migration name: "0008_seed_formacao"`. Rodar de novo é seguro (upsert). Se o executor preferir,
o script aceita `--apply` com `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` do ambiente local (nunca commitados), como o
`seed-posts.mjs` do doc 03 §9.4.

### 5.4 Player de trilha (`/formacao/$slug`)

- `src/routes/_site/formacao/$slug.tsx` → loader `getTrackData({ slug })` (trilha + passos, anônimo) + `head()` com
  JSON-LD `Course` (`name`, `description`, `provider` Organization "Vocação de Pai", `hasCourseInstance` com
  `courseMode: "online"`, `courseWorkload: "PT<estimated_minutes>M"`) e `BreadcrumbList`.
- `src/pages/formacao/TrilhaPage.tsx`: cabeçalho (capa, pilar, nível, dias, público, `ProgressRing` se logado) +
  `TrackPlayer` (seção 10). Deslogado vê os passos com cadeado e CTA "Entre para marcar seu progresso" (`/entrar?next=`).
  Logado: `getMyTrackProgressFn` traz `track_progress` do usuário; passo atual = primeiro não concluído.
- Ao concluir o último passo: tela "Trilha concluída" com as insígnias retornadas por `grant_badges_for_me` (toast por
  slug com o ícone) e botões "Próxima trilha" e "Baixar certificado" (PDF simples via `/api/certificado?track=<slug>`,
  gerado com `@react-pdf/renderer` se já existir no projeto; senão, deixar o botão para a Fase 8 e registrar em PROGRESSO).

---

## 6. Desafios do Pai (`/desafios`, `/desafios/$slug`)

### 6.1 Modelo

- Desafio = `challenges` (30 dias, `badge_slug`, `pillar`) + `challenge_days` (um por dia: `title`, `task`, `reflection`;
  `body` opcional). O pai **começa** (`start_challenge` → `challenge_enrollments.started_at`); o dia 1 é a data de
  início; `challenge_current_day()` diz em que dia do calendário ele está.
- Marcar: `complete_challenge_day(p_challenge_id, p_day, p_note)`. Só dias ≤ dia atual (erro `DIA_FUTURO`). Dia perdido
  pode ser marcado depois (**recomeço suave**, síntese do `res-ecossistema.md` §D: perder 1 dia não zera; 3 seguidos sem
  marcar mostram o aviso "Pausa? Retome do dia X" e a UI oferece "continuar de onde parei"). Concluir os 30 →
  `finished_at`; em seguida `grant_badges_for_me()` concede a insígnia da regra `challenge_completed` (o `badge_slug`
  da tabela só informa na UI qual é) e avalia streak.
- `ChallengeCalendar` (seção 10): grade 6×5 de dias; estados `feito`, `hoje`, `perdido`, `futuro`; clique abre o
  `ChallengeDayCard` (título, tarefa, reflexão, campo "Como foi?" de até 500 caracteres, botão "Feito").
- Anônimo vê o dia 1 inteiro e os títulos dos outros 29 (sem tarefa) + CTA para entrar. Não emitir JSON-LD de desafio.
- Seed: `supabase/seed/challenges.json` (`{ "challenges": [ { "slug", "title", "description", "days": 30, "pillar",
  "badge_slug", "status": "published", "sort_order", "cover_image_url", "days_list": [ { "day", "title", "task",
  "reflection" } ] } ] }`), transcrito **literalmente** das tabelas abaixo; gerado para SQL pelo `seed-formacao.mjs` (5.3).

### 6.2 Os 3 desafios, dia a dia (dia · tarefa · reflexão)

#### D1 `30-dias-de-presenca-com-os-filhos` — "30 dias de presença com os filhos" · `pillar=casa` · `badge_slug=pai-presente` · `sort_order=10`
Descrição: "Uma tarefa por dia, de 10 a 30 minutos, para o pai estar onde o filho precisa. Ao final, churrasco de encerramento e a insígnia Pai presente."

| Dia | Tarefa | Reflexão |
|---|---|---|
| 1 | Jantar sem celular (o seu fica em outro cômodo) | Presença começa com o olho no olho. |
| 2 | Pergunte "como foi seu dia?" e ouça cinco minutos sem interromper | Quem escuta primeiro, educa depois. |
| 3 | Leve ou busque seu filho na escola ou na creche | O caminho é conversa. |
| 4 | Leia uma história ou um capítulo antes de dormir | Sua voz é o lugar seguro dele. |
| 5 | Brinque 20 minutos do jeito que ele escolher | Entrar no mundo dele é descer do pedestal. |
| 6 | Cozinhe algo simples com seu filho (ovo, pão na chapa, suco) | Ensinar é dar tempo, não instruções. |
| 7 | Domingo: missa em família (ou oração juntos) e almoço sem pressa | A semana ganha centro. |
| 8 | Conte uma história da sua infância | Ele precisa saber de onde vem. |
| 9 | Elogie uma atitude (não um resultado) na frente da mãe | Elogio certo forma caráter. |
| 10 | Peça desculpa por algo real (um grito, uma promessa quebrada) | Pai que pede perdão ensina a perdoar. |
| 11 | Caminhada ou pedalada de 30 minutos juntos | Corpo em movimento, boca solta. |
| 12 | Deixe um bilhete na lancheira, na mochila ou no espelho | Palavra escrita dura. |
| 13 | Ensine uma habilidade prática (dar nó, usar chave de fenda, lavar louça) | Competência é amor em forma de autonomia. |
| 14 | Reze o Pai-Nosso com ele e peça que ele faça uma intenção | A fé se transmite rezando, não explicando. |
| 15 | Metade do caminho: pergunte à esposa o que ela viu mudar | Ela enxerga o que você não vê. |
| 16 | Dia sem dizer "depois": responda na hora ou dê um horário | "Depois" é o não que machuca devagar. |
| 17 | Assista a um filme ou desenho escolhido por ele, até o fim | Interesse genuíno não tem idade mínima. |
| 18 | Conserte ou monte algo em casa com a ajuda dele | Ombro a ombro se conversa melhor. |
| 19 | Conte para ele o que você faz no trabalho, com detalhes | Ele precisa ver o pai como provedor, não como ausência. |
| 20 | Visita a um avô, tio ou padrinho | Família é maior que a casa. |
| 21 | "Escritório fechado": nada de trabalho depois das 19h | Limite seu, segurança deles. |
| 22 | Pergunte "do que você tem medo?" e não minimize | Medo nomeado encolhe. |
| 23 | Leve o filho ao mercado e deixe-o escolher o jantar (dentro do orçamento) | Decisão pequena, confiança grande. |
| 24 | Olhem fotos antigas juntos; conte quem é quem | Memória é herança. |
| 25 | Dia de esporte: chute a bola, jogue, perca de propósito uma vez | Jogo é escola de derrota e de alegria. |
| 26 | Ensine a rezar pela mãe: cada um diz algo pelo qual é grato a ela | Honrar a mãe é dever do pai primeiro. |
| 27 | Carta ou áudio para o filho com três coisas que você admira nele | Palavras do pai moram para sempre. |
| 28 | Planeje com ele o "fim de semana de 940" do próximo mês | Faltam menos sábados do que você pensa. |
| 29 | Revise: quais destes 28 dias você vai repetir toda semana? Escolha três | Presença vira rotina ou vira lembrança. |
| 30 | Churrasco (ou almoço) de encerramento com a família; conte o que mudou | Celebrar é marcar o fim e o começo. |

#### D2 `30-dias-do-provedor` — "30 dias do provedor" · `pillar=trabalho` · `badge_slug=provedor` · `sort_order=20`
Descrição: "Trinta ações concretas para o pai assumir o dinheiro da casa: medir, cortar, quitar, guardar e liderar a conversa. Informação educativa; para o seu caso, procure um profissional."

| Dia | Tarefa | Reflexão |
|---|---|---|
| 1 | Anote tudo que gastou hoje, até o café | Quem não mede, não governa. |
| 2 | Baixe os extratos dos últimos 30 dias (banco e cartão) | A verdade está no extrato, não na memória. |
| 3 | Classifique os gastos em cinco categorias: casa, família, transporte, dívidas, futuro | Nomear é o primeiro corte. |
| 4 | Liste todas as dívidas: valor, juros, parcela | Dívida escondida cresce no escuro. |
| 5 | Cancele uma assinatura que você não usa | Trinta reais por mês são 360 por ano. |
| 6 | Ligue para renegociar a dívida mais cara | Juro de cartão não se paga: se negocia. |
| 7 | Domingo: converse 30 minutos com a esposa sobre o dinheiro, sem culpa | Provedor não é o que esconde, é o que lidera a conversa. |
| 8 | Defina o valor da reserva de emergência (três meses de gastos) | A reserva é o seguro contra o desespero. |
| 9 | Abra (ou separe) uma conta só para a reserva | Dinheiro junto some. |
| 10 | Transfira o primeiro valor, por menor que seja | O hábito vale mais que o montante. |
| 11 | Cozinhe em casa hoje em vez de pedir | Delivery é o furo silencioso do orçamento. |
| 12 | Pesquise o preço de três itens que você compra sempre em duas lojas | Faixa de preço: regra do pai. |
| 13 | Revise plano de celular, internet e TV | Serviço que ninguém usa é imposto voluntário. |
| 14 | Faça a lista de compras do mês e vá ao mercado com ela | Lista é disciplina em papel. |
| 15 | Metade: calcule quanto já economizou nos 14 dias | Número no papel é motivação. |
| 16 | Verifique se tem seguro de vida e o que a família receberia se você faltasse | Prover inclui o depois. |
| 17 | Organize os documentos da casa numa pasta (contas, contratos, garantias) | Ordem é provisão invisível. |
| 18 | Ensine ao filho o valor de uma compra: deixe-o pagar e conferir o troco | Educação financeira começa no caixa. |
| 19 | Dia sem gastar nada | Você descobre o que era necessidade. |
| 20 | Estude 20 minutos sobre Tesouro Direto ou CDB em fonte oficial | Informação educativa; nenhuma promessa. |
| 21 | Faça uma simulação de juros compostos com o que você guarda por mês | Tempo é o maior aliado do provedor. |
| 22 | Atualize o currículo ou o perfil profissional | Provedor cuida da ferramenta: ele mesmo. |
| 23 | Converse com um pai que tem o emprego que você quer | Mentoria custa um café. |
| 24 | Veja as vagas do Pai Indica Pai e indique uma para alguém | Prover também é abrir portas. |
| 25 | Faça o orçamento do próximo mês com a esposa | Plano feito a dois se cumpre. |
| 26 | Defina uma meta familiar de 12 meses e o valor mensal para ela | Meta dá sentido ao corte. |
| 27 | Doe ou dê o dízimo, mesmo pouco | Quem dá, governa o dinheiro; quem não dá, é governado por ele. |
| 28 | Revise todas as dívidas: o que mudou em quatro semanas? | Progresso se mede. |
| 29 | Marque a reunião financeira mensal no calendário (próximos três meses) | O que não está na agenda não existe. |
| 30 | Escreva sua "regra do provedor" em cinco linhas e mostre à família | O provedor que você virou em 30 dias é o pai que seus filhos vão lembrar. |

#### D3 `30-dias-de-disciplina-do-homem` — "30 dias de disciplina do homem" · `pillar=alma` · `badge_slug=disciplina-de-ferro` · `sort_order=30`
Descrição: "Oração, corpo, trabalho, família e fraternidade: 30 dias de pequenas renúncias para o homem mandar em si mesmo (inspirado nos três pilares do Exodus 90, em versão de um mês e com recomeço suave)."

| Dia | Tarefa | Reflexão |
|---|---|---|
| 1 | Acorde 30 minutos antes do de costume e reze dez minutos | O dia que começa com Deus não começa correndo. |
| 2 | Banho frio (ou terminar frio) por um minuto | Dizer não ao conforto treina o sim ao dever. |
| 3 | Zero álcool hoje (e até o dia 30) | Clareza é força. |
| 4 | Treine 20 minutos | Corpo a serviço da família. |
| 5 | Zero telas depois das 21h | A noite é da esposa e do sono. |
| 6 | Jejum simples: uma refeição a menos | Fome escolhida educa a vontade. |
| 7 | Confissão (ou exame de consciência) e missa | Semana fechada diante de Deus. |
| 8 | Leia dez páginas de um livro bom (sem áudio) | Mente alimentada não busca lixo. |
| 9 | Nenhuma reclamação em voz alta hoje | Reclamar é fraqueza vestida de opinião. |
| 10 | Arrume a cama, a mesa e as ferramentas | Ordem fora, ordem dentro. |
| 11 | Caminhe 30 minutos sem fone | Silêncio é ginástica da alma. |
| 12 | Dia sem açúcar | Você manda na boca, não o contrário. |
| 13 | Ligue para um amigo homem e pergunte como ele está de verdade | Fraternidade também é disciplina. |
| 14 | Domingo: missa, descanso real, nenhum trabalho | Descansar é obediência. |
| 15 | Metade: escreva o que foi mais difícil e por quê | Conhecer a própria fraqueza é o começo da força. |
| 16 | Acorde no primeiro alarme | Pequena vitória, grande sinal. |
| 17 | Treine 20 minutos e faça dez repetições além do que acha que aguenta | Limite é negociável. |
| 18 | Dia sem pornografia e sem conteúdo que fere o olhar (e até o 30) | Pureza é liberdade, não repressão. |
| 19 | Leia dez páginas e conte à esposa o que leu | Partilhar fixa. |
| 20 | Jejum de redes sociais por 24 horas | Você não está perdendo nada. |
| 21 | Confissão ou exame; agradeça por três coisas | Terceira semana: o hábito começa a nascer. |
| 22 | Faça uma tarefa que vem adiando há mais de um mês | Procrastinação é dívida com juros. |
| 23 | Reze o terço (ou uma dezena) pela família | A arma do homem de fé. |
| 24 | Treino ao ar livre, com qualquer clima | O corpo não escolhe o tempo. |
| 25 | Dia sem comprar nada supérfluo | Domínio sobre o impulso. |
| 26 | Escreva sua regra de vida em cinco pontos: oração, corpo, trabalho, família, fraternidade | Disciplina sem regra é humor. |
| 27 | Dê uma hora de serviço a alguém de fora da família | Força é para servir. |
| 28 | Zero telas depois do trabalho, o dia inteiro | Prove para si mesmo. |
| 29 | Converse com seu âncora (irmão de confiança): o que você mantém depois do dia 30? | Sem irmão, a disciplina murcha. |
| 30 | Missa, refeição em família e a regra de vida assinada | O homem disciplinado é o pai livre. |

---

## 7. Insígnias (badges)

As 20 insígnias e suas regras estão no seed da migration (seção 2.2, bloco 10). O motor `award_badges(p_user_id)` roda:
(a) dentro de `accept_answer`, `moderate_story`, `moderate_question` (beneficiário é outro usuário);
(b) pelo client, via `rpc('grant_badges_for_me')` (devolve só as novas): logo após `complete_track_step` e
`complete_challenge_day` nas server functions (10.2) e nas ações da Fase 5 (salvar, filhos, onboarding);
(c) no `GET` do painel (`getPainelDataFn` chama `grant_badges_for_me` uma vez por sessão, para pegar streak e evento `done`).
Eventos concluídos: o admin marca `events.status='done'` depois do encontro (`presente-no-encontro` depende disso).
`BadgeGrid` (seção 10) mostra as 20: conquistadas coloridas com data, bloqueadas em cinza com a `description` como dica.
Ícones: `icons[kebabToPascal(badge.icon)]` de `lucide-react` (ex.: `hand-helping` → `HandHelping`); ícone desconhecido → `Award`.
Nunca ranking público entre membros; a insígnia aparece só no painel do próprio pai e, opcionalmente, ao lado do
`author_name` em histórias/respostas (`profiles.show_badges` fica para a Fase 8; por ora, só no painel).

---

## 8. Encontros (`/eventos`, `/eventos/$slug`)

- Tipos (`events.kind`): `encontro` (presencial local), `live` (online, `url` do YouTube/Meet), `retiro` (fim de semana),
  `cafe-dos-pais` (encontro recorrente simples para pais de bebês, roteiro de 90 min inspirado no Dads Group),
  `galpao-do-pai` (projeto prático ombro a ombro, inspirado nos Men's Sheds). Criados só por staff em `/admin/eventos`.
- `/eventos`: abas "Próximos" (`status='published' and starts_at > now()`, ordem crescente) e "Passados" (`done`), filtro
  `mode` (online/presencial) e UF. `EventCard`: capa, data em PT-BR (`sábado, 14 de março, 19h`), cidade/UF ou "Online",
  `rsvp_count`/`capacity`, chip do tipo.
- `/eventos/$slug`: descrição (texto puro com parágrafos), endereço (link para o Maps), `RsvpButton` ("Vou" · "Talvez" ·
  "Cancelar"; deslogado → `/entrar?next=`), lotado → "Lista cheia" (erro `LOTADO`), botão "Adicionar ao calendário"
  (arquivo `.ics` gerado no client), "Compartilhar no WhatsApp". Depois do evento: "Como foi" + link para `/historias/nova`.
- JSON-LD `Event` (`src/lib/irmandade/jsonld.ts`): `name`, `startDate`/`endDate` (ISO com `-03:00`), `eventStatus`
  (`EventScheduled`/`EventCancelled`), `eventAttendanceMode` (`OnlineEventAttendanceMode` ou `OfflineEventAttendanceMode`),
  `location` (`Place` com `PostalAddress` ou `VirtualLocation` com `url`), `organizer` (Organization "Vocação de Pai" ou
  `organizer`), `image`, `description`, `offers` só se `price_text` começar com "Gratuito" (`price: 0, priceCurrency: BRL`).
  Sem `offers` numérico para evento pago (texto livre no corpo). Só em `published`/`done`.
- Lembrete por e-mail 24 h antes: edge function `supabase/functions/event-reminder/index.ts` (padrão do doc 07 §6.4,
  `requireInternalSecret`), chamada pelo cron `event-reminder` (seção 2.2 bloco 13) a cada hora: seleciona
  `event_rsvps` com `status='going'`, `reminded_at is null` e evento `published` com `starts_at` entre `now()+23h` e
  `now()+25h`; para cada um, e-mail do `auth.users` (service role) → template `eventReminder({ name, event })` (assunto
  `Amanhã: {title}`; corpo com data, local/link, botão "Ver encontro") via Resend; grava `reminded_at = now()` e um
  `log_moderation('event', id, 'edit', 'lembretes=N')`. Idempotente por `reminded_at`.
- Templates novos em `supabase/functions/_shared/email-templates.ts`: `storyApproved`, `storyRejected(reason)`,
  `questionApproved`, `questionRejected(reason)`, `answerReceived` (autor da pergunta recebe quando chega resposta,
  no máximo 1 e-mail por dia por pergunta), `eventReminder`. Mesmo visual do doc 07 §6.1.

---

## 9. Grupos locais por cidade e paróquia (fase futura: só o desenho)

Ideia (`res-sites.md` ideia 9/10 e `res-ecossistema.md` §B): fraternidades de 4 a 6 homens com um "âncora", reunião
semanal e check-in diário. **Não implementar nesta fase.** Schema proposto para a Fase 8+ (registrar no doc 02 quando chegar):

```sql
-- proposta (não aplicar agora)
create table public.groups (id uuid pk, slug text unique, name text, city text, uf char(2), parish text, mode text check (mode in ('presencial','online')),
  leader_id uuid references profiles(id), max_members int default 6, status text check (status in ('pending','approved','archived')), created_at timestamptz);
create table public.group_members (group_id uuid, user_id uuid, role text check (role in ('lider','ancora','membro')), joined_at timestamptz, primary key (group_id, user_id));
create table public.group_checkins (group_id uuid, user_id uuid, day date, ok boolean, note text, primary key (group_id, user_id, day));
```

Regras futuras: grupo nasce `pending` (staff aprova), líder convida por link, check-in diário de 1 toque ("Mantive a
regra hoje?"), ranking **só dentro do grupo**, e-mail semanal ao âncora ("Como foi a semana do seu irmão?"). Enquanto
isso, `/irmandade` mostra o cartão "Quer abrir um grupo na sua paróquia? Fale com a gente" → `/contato?assunto=grupo`.

---

## 10. Código: arquivos, server functions, queries e componentes

### 10.1 Mapa de arquivos (nomes do doc 02 §3; os marcados `+` são acréscimos desta fase)

| Camada | Arquivos |
|---|---|
| Rotas (`src/routes/_site/`) | `irmandade.tsx` · `historias/{index,$id,nova}.tsx` · `perguntas/{index,$slug}.tsx` + `perguntas/nova.tsx` · `eventos/index.tsx` (substitui `eventos.tsx`) + `eventos/$slug.tsx` · `formacao/{index,$slug}.tsx` · `desafios/{index,$slug}.tsx` |
| Páginas (`src/pages/`) | `irmandade/{IrmandadePage,HistoriasPage,HistoriaPage,NovaHistoriaPage,PerguntasPage,PerguntaPage,NovaPerguntaPage,EventosPage,EventoPage}.tsx` · `formacao/{FormacaoPage,TrilhaPage,DesafiosPage,DesafioPage}.tsx` |
| Conteúdo fixo | `src/content/irmandade/codigo-de-conduta.ts` · `src/lib/irmandade/{story-categories,schemas,blacklist,jsonld,slug}.ts` |
| Queries (anon, SSR) | `src/lib/db/irmandade.ts` (`queryStories`, `queryStoryById`, `queryQuestions`, `queryQuestionBySlug`, `queryEvents`, `queryEventBySlug`) · `src/lib/db/formacao.ts` (`queryTracks`, `queryTrackBySlug`, `queryChallenges`, `queryChallengeBySlug`) |
| Server functions | `src/lib/community.functions.ts` (`getIrmandadeHubData`, `getStoriesData`, `getStoryData`, `createStoryFn`, `likeStoryFn`, `getQuestionsData`, `getQuestionData`, `createQuestionFn`, `createAnswerFn`, `voteAnswerFn`, `acceptAnswerFn`, `reportFn`, `getEventsData`, `getEventData`, `rsvpFn`) · `src/lib/tracks.functions.ts` (`getFormacaoData`, `getTrackData`, `getMyTrackProgressFn`, `completeStepFn`, `saveStepNoteFn`, `getDesafiosData`, `getChallengeData`, `getMyChallengeFn`, `startChallengeFn`, `completeDayFn`, `getMyFormacaoFn`) |
| Componentes `src/components/community/` | `StoryCard`, `StoryForm`, `LikeStoryButton`+, `QuestionCard`, `QuestionForm`, `AnswerList`, `AnswerForm`, `VoteButtons`+, `EventCard`, `RsvpButton`, `ConductCheckbox`+, `ReportDialog` (reuso da Fase 6 ou cópia) |
| Componentes `src/components/tracks/` | `TrackCard`, `TrackPlayer`+, `TrackSteps`, `StepContent` (= "StepCard"), `ProgressRing`, `ChallengeCard`, `ChallengeCalendar`+, `ChallengeDayList`, `ChallengeDayCard`+, `StreakChip`+ |
| Componentes `src/components/members/` | `BadgesWall.tsx` (= "BadgeGrid"; substitui o placeholder `BadgesRow` do doc 07), `FormacaoWidget`+ (trilhas em andamento + desafio do dia) |
| Admin | `src/admin/ModerationQueue.tsx` (rota `src/routes/_admin/admin/moderacao.tsx`) · `src/admin/TracksEditor.tsx` + `ChallengesEditor.tsx` (rota `admin/formacao.tsx`) · `src/admin/EventsEditor.tsx` (rota `admin/eventos.tsx`) |
| Edge functions | `supabase/functions/event-reminder/index.ts` · templates em `_shared/email-templates.ts` |
| Seeds e scripts | `supabase/seed/tracks.json` · `supabase/seed/challenges.json` · `scripts/seed-formacao.mjs` → `supabase/migrations/0008_seed_formacao.sql` |
| Biblioteca do Pai (12b) | Rotas `area-do-pai.biblioteca.tsx`, `loja/digital/$slug.tsx`, `_admin/admin/biblioteca.tsx` · páginas `src/pages/area/BibliotecaPage.tsx`, `src/pages/DigitalProductPage.tsx` · `src/lib/db/biblioteca.ts` (`queryDigitalProducts`, `queryDigitalProductBySlug`) · `src/lib/library.functions.ts` (`getLibraryData`, `getDigitalDownloadFn`) · `src/components/area-do-pai/{LibraryCard,LeadMagnets}.tsx`+ · `src/admin/LibraryEditor.tsx` · `supabase/functions/hotmart-webhook/index.ts` + template `digitalProductDelivery` em `_shared/email-templates.ts` · `supabase/migrations/0010_biblioteca_do_pai.sql` · `supabase/seed/downloads/*.md` → `public/downloads/*` · sitemap: `/loja/digital/$slug` publicados |
| SEO | `src/routes/sitemap[.]xml.ts` (+ histórias `approved`, perguntas `approved/closed`, eventos `published`, trilhas e desafios `published`) · `src/lib/irmandade/jsonld.ts` (`qaPageJsonLd`, `eventJsonLd`, `courseJsonLd`) |

Padrões herdados (doc 08 §0): rota fina com `createFileRoute` + `head()` + `loader`; página gorda em `src/pages/**`;
`react-hook-form` + `zod` 4; `toast` do `sonner`; server functions com `createServerFn` + `requireUser(accessToken)`
(doc 07 §4.6) + `rateLimit` (doc 07 §4.5); leitura anônima com `createReadOnlySupabaseClient` (como `hub.functions.ts`
do VDM); escrita sempre por RLS ou RPC `security definer`. Nada de i18n.

### 10.2 `src/lib/tracks.functions.ts` (trecho)

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";   // mesmo helper do hub.functions.ts do VDM
import { requireUser } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { queryTrackBySlug, queryChallengeBySlug } from "@/lib/db/formacao";

const Tok = z.object({ accessToken: z.string().min(20) });

export const getTrackData = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => ({ slug: String(d.slug ?? "") }))
  .handler(async ({ data }) => {
    const db = await createReadOnlySupabaseClient();
    return queryTrackBySlug(db, data.slug);            // { track, steps[] } | null — anônimo: trilha published
  });

export const getMyTrackProgressFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.extend({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { sb, user } = await requireUser(data.accessToken);
    const { data: rows } = await sb.from("track_progress").select("step_id,completed_at,note").eq("user_id", user.id).eq("track_id", data.trackId);
    return rows ?? [];
  });

export const completeStepFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.extend({ stepId: z.string().uuid(), note: z.string().max(4000).optional() }).parse(d))
  .handler(async ({ data }) => {
    const { sb, user } = await requireUser(data.accessToken);
    rateLimit(`step:${user.id}`, 60, 60_000);
    const { error } = await sb.rpc("complete_track_step", { p_step_id: data.stepId });
    if (error) throw new Error(error.message === "PREMIUM" ? "Esta trilha é do plano Pai de Valor." : error.message);
    if (data.note) await sb.rpc("save_step_note", { p_step_id: data.stepId, p_note: data.note });
    const { data: badges } = await sb.rpc("grant_badges_for_me");   // devolve só as insígnias NOVAS
    return { newBadges: (badges ?? []) as string[] };
  });

export const completeDayFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.extend({ challengeId: z.string().uuid(), day: z.number().int().min(1).max(90), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ data }) => {
    const { sb, user } = await requireUser(data.accessToken);
    rateLimit(`day:${user.id}`, 60, 60_000);
    const { error } = await sb.rpc("complete_challenge_day", { p_challenge_id: data.challengeId, p_day: data.day, p_note: data.note ?? null });
    if (error) throw new Error(error.message === "DIA_FUTURO" ? "Esse dia ainda não chegou." : error.message);
    const { data: badges } = await sb.rpc("grant_badges_for_me");
    return { newBadges: (badges ?? []) as string[] };
  });

export const getMyFormacaoFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Tok.parse(d))
  .handler(async ({ data }) => {
    const { sb } = await requireUser(data.accessToken);
    const { data: dash, error } = await sb.rpc("get_member_dashboard");
    if (error) throw new Error(error.message);
    return (dash as { formacao: FormacaoSummary; badges_all: BadgeView[] });
  });
export interface FormacaoSummary { streak: number; points: number; title: string;
  tracks: Array<{ slug: string; title: string; done: number; total: number; next_step: { position: number; title: string } | null }>;
  challenges: Array<{ slug: string; title: string; days: number; current_day: number; done: number; today: { title: string; task: string } | null }>;
  badges: BadgeView[] }
export interface BadgeView { slug: string; name: string; description?: string; icon: string | null; earned_at: string | null }
```

`community.functions.ts` segue o mesmo molde: `createQuestionFn` (gera `slug` com `slugify(title) + "-" + nanoid(6)`,
checa Turnstile, honeypot, blacklist, ≤ 2 links, duplicidade por `similarity`), `createAnswerFn` (rate limit 20/dia;
e-mail `answerReceived` ao autor via `email.functions.ts`), `voteAnswerFn` → `rpc('vote_answer')`, `acceptAnswerFn` →
`rpc('accept_answer')`, `reportFn` → `rpc('report_irmandade')`, `rsvpFn` → `rpc('rsvp_event')`.

### 10.3 Componentes (contratos e esqueletos)

| Componente | Props | Comportamento |
|---|---|---|
| `StoryCard` | `{ story; locked?; onOpen? }` | Igual ao VDM: capa 4:3 ou inicial do autor, chip de categoria, título, 3 linhas, autor + data; cadeado quando `locked`. |
| `QuestionCard` | `{ question }` | Título (link), categoria (chip com `color`), `answers_count` ("3 respostas"), selo "Resolvida" se `accepted_answer_id`, autor + "há 2 dias", `views`. |
| `AnswerList` | `{ answers; acceptedId; canAccept; onAccept; onVote }` | Melhor resposta primeiro com borda `success` e selo "Melhor resposta"; `VoteButtons` (▲ saldo ▼) desabilitados na própria resposta; botão "Marcar como melhor" só para `canAccept`. |
| `EventCard` | `{ event }` | Data por extenso, chip `kind`, "Online"/"Cidade/UF", `rsvp_count`/`capacity`, botão "Ver encontro". |
| `RsvpButton` | `{ eventId; status: 'going'\|'maybe'\|null; capacityLeft }` | Três estados; deslogado → `/entrar?next=`; `LOTADO` → desabilitado com "Lista cheia". |
| `TrackCard` | `{ track; progress?: {done,total} }` | Capa, pilar (ícone: `Home`/`Briefcase`/`Dumbbell`/`Cross`), nível, "N dias", `ProgressRing` quando houver progresso, cadeado `is_premium`. |
| `TrackPlayer` | `{ track; steps; progress; onComplete(stepId, note?) }` | Layout 2 colunas (≥ md): `TrackSteps` à esquerda (módulos → passos com estado feito/atual/bloqueado), `StepContent` à direita; mobile: accordion. Guarda `currentStep` na URL (`?passo=N`). |
| `StepContent` ("StepCard") | `{ step; done; note; onComplete }` | Render por `type` (tabela 5.1); corpo via `tiptapToHtml` de `src/lib/tiptap-html.ts`; botão "Concluir passo" conforme `completion_rule`; "Próximo passo →". |
| `ChallengeCalendar` | `{ days: ChallengeDay[]; done: Set<number>; currentDay; onPick(day) }` | Grade 6×5; estados `feito` (success), `hoje` (accent, pulsando), `perdido` (warning, clicável), `futuro` (muted, cadeado); legenda abaixo. |
| `ChallengeDayCard` | `{ day; done; note; locked; onDone(note) }` | Título, tarefa (destaque), reflexão em itálico, `textarea` "Como foi?" (500), botão "Feito". |
| `BadgesWall` ("BadgeGrid") | `{ badges: BadgeView[]; compact? }` | Grade 4–5 colunas; conquistada = ícone colorido + nome + data; bloqueada = cinza + `title={description}`; `compact` mostra só as conquistadas + "+N". |
| `StreakChip` | `{ streak; points; title }` | "🔥 7 dias seguidos · Pai firme (320 pts)" — sem emoji no código: ícone `Flame`. |
| `FormacaoWidget` | `{ formacao: FormacaoSummary }` | No painel: trilha em andamento (barra + "Continuar no passo N: título"), desafio ativo ("Dia 12 de 30 — tarefa de hoje" + botão "Feito"), `StreakChip`. Vazio → CTAs `/formacao` e `/desafios`. |

```tsx
// src/components/tracks/ChallengeCalendar.tsx (esqueleto)
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
export function ChallengeCalendar({ days, done, currentDay, onPick }: { days: { day: number; title: string }[]; done: Set<number>; currentDay: number; onPick: (d: number) => void }) {
  return (
    <ol className="grid grid-cols-6 gap-2 sm:grid-cols-10" aria-label="Dias do desafio">
      {days.map(({ day, title }) => {
        const state = done.has(day) ? "feito" : day === currentDay ? "hoje" : day < currentDay ? "perdido" : "futuro";
        return (
          <li key={day}>
            <button type="button" disabled={state === "futuro"} onClick={() => onPick(day)} title={title} aria-label={`Dia ${day}: ${title}`}
              className={cn("flex aspect-square w-full items-center justify-center rounded-xl border text-sm font-bold transition-colors",
                state === "feito" && "border-success bg-success/15 text-success",
                state === "hoje" && "border-accent bg-accent/15 text-accent animate-pulse",
                state === "perdido" && "border-warning bg-warning/10 text-warning",
                state === "futuro" && "border-border bg-muted text-muted-foreground")}>
              {state === "feito" ? <Check className="h-4 w-4" /> : state === "futuro" ? <Lock className="h-3.5 w-3.5" /> : day}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
```

---

## 11. Gamificação leve e a Área do Pai

- **Streak** (`member_streak`): dias seguidos com pelo menos um passo ou dia marcado (fuso `America/Sao_Paulo`); zera se a
  última atividade foi antes de ontem. Insígnias `sete-dias-seguidos` e `trinta-dias-seguidos`.
- **Pontos** (`member_points`): 10 por passo, 5 por dia de desafio, 20 por história aprovada, 5 por resposta aprovada,
  15 por melhor resposta, 10 por encontro concluído, 25 por insígnia. **Título** (`member_title`): Pai iniciante (0–99),
  Pai firme (100–499), Pai de referência (500–1.499), Patriarca (1.500+). Só o próprio pai vê; nunca ranking público
  (síntese do `res-ecossistema.md` §D).
- **Painel `/area-do-pai`** (doc 07 §4.9): os blocos 4 (`TracksInProgress`), 5 (`ActiveChallenges`) e 6 (`BadgesRow`)
  passam a ler `getMyFormacaoFn` → `FormacaoWidget` + `BadgesWall compact`. `MyContributions` ganha as abas "Minhas
  histórias" e "Minhas perguntas" (de `get_member_dashboard().stories/questions`) e "Meus encontros" (`events`).
- Toasts de conquista: toda server function que devolve `newBadges` dispara `toast.success("Nova insígnia: <name>")`
  com o ícone; lista de nomes vem de `badges_all` já carregado.

---

## 12. Newsletter: resumo semanal com a Formação

A edge function `weekly-digest` (doc 07 §6.6) e a rota `/api/newsletter/weekly` (doc 10 §8.2) ganham o bloco
**"Sua formação"** para assinantes com `user_id`: chamam `select public.member_formacao_summary($1)` com o service
client e montam: trilha em andamento ("Você está no passo 7 de 12 de *Pai de primeira viagem*. Continuar →
`/formacao/<slug>?passo=7`"), desafio ativo ("Dia 12 de 30 do *30 dias de presença*: <tarefa de hoje>"), streak e
insígnias da semana (`earned_at` nos últimos 7 dias). Sem `user_id` ou sem progresso: bloco "Desafio da semana" com o
desafio em destaque (`challenges.sort_order` menor, link `/desafios/<slug>`) e o próximo encontro publicado. Assunto
permanece o do doc 07; o template segue o HTML do doc 10 §8.2 (acrescentar a seção antes de "Pai Indica Pai").
`member_formacao_summary` é `security definer` sem grant a `authenticated` — só service role e `get_member_dashboard`.

---

## 12b. Biblioteca do Pai e produtos digitais (doc 11 §7)

Esta seção é o documento de execução da monetização por produtos digitais, que o doc 11 atribui à Fase 7 (§1 ordem 5,
§7 e §12: "Biblioteca do Pai (bucket privado), 3 produtos digitais cadastrados com checkout Hotmart"). Nomes de plano,
função e feature são os do doc 02 §4.4 e do doc 07 §7 (`gratuito`, `pai-de-valor`, `public.is_premium()`,
`usePlan()`, `<PremiumGate feature="ebooks">`, `UpsellCard`). Os slugs `irmao`/`irmandade-premium` do doc 11 §6 **não
existem no banco** (doc 02 prevalece). As ideias 12 (e-book do churrasco) e 13 (Planner do pai) do `PLANO-MESTRE.md`
§8 ficam cobertas aqui: o e-book é o produto 1; o "Planner" vira o Kit de Encontro Pai & Filho (produto 4 do doc 11
§7, mês 6+, fora desta fase).

### 12b.1 O que é (fixo)

| Peça | Rota / local | Quem vê e o que faz | Fonte |
|---|---|---|---|
| **Iscas gratuitas** (3 arquivos) | `public/downloads/` (arquivos públicos, sem RLS) | Link mostrado na página `/newsletter/obrigado` após `newsletter_subscribers.confirmed_at` (doc 11 §5.2 passo 3), no e-mail D0 da sequência de boas-vindas (doc 11 §5.5) e, para membro logado, no topo da Biblioteca | doc 11 §7, coluna "Isca gratuita derivada"; doc 13 item 5.8 |
| **Biblioteca do Pai** | `/area-do-pai/biblioteca` (autenticada, `noindex`, sem AdSense) | Lista os `digital_products` publicados. Liberado (compra aprovada **ou** `is_premium()` com `premium_included`) = botão "Baixar" com URL assinada de 7 dias. Bloqueado = card dentro de `<PremiumGate feature="ebooks" fallback={<UpsellCard/>}>` + botão "Comprar na Hotmart" | doc 11 §6.2 (`biblioteca_completa`), doc 07 §7 |
| **Página de vendas** | `/loja/digital/$slug` (pública, indexável, **sem AdSense**) | Capa, para quem é, o que tem dentro, amostra grátis (a isca), preço próprio, botão "Comprar na Hotmart", "membro Pai de Valor já tem na Biblioteca", FAQ, JSON-LD `Product` + `Offer` | doc 11 §7 ("Página de vendas em `/loja/digital/$slug` (sem AdSense)") |
| **Arquivos pagos** | Bucket **privado** `digital-products` do Storage | Só por URL assinada gerada no servidor para quem passa em `public.can_read_digital_file(name)` (policy do bucket) | doc 11 §7 ("URL assinada 7 dias") |
| **Compra** | Edge function `hotmart-webhook` → `digital_purchases` → e-mail de entrega (Resend) | Hotmart no início (nota fiscal, afiliados e reembolso por conta dela); Mercado Pago só quando o plano pago existir, sem mudar o schema (`provider`) | doc 11 §7 |
| **Admin** | `/admin/biblioteca` (`src/admin/LibraryEditor.tsx`) | CRUD dos produtos, upload do arquivo para o bucket, publicar/despublicar, compras (manual + reenviar entrega) | seção 13 |

Regras fixas:

- **Preço próprio, não afiliado.** O produto digital é do site, então o preço (`digital_products.price_cents`) aparece
  em reais na página de vendas, sem faixa. A regra "nunca preço exato" (CLAUDE.md §5.2) continua valendo para
  `products` (afiliado Amazon) e para qualquer menção a produto da Amazon dentro desta página — que **não tem** link de
  afiliado nenhum.
- **Botão** "Comprar na Hotmart", classe `btn-hotmart` (nunca `btn-comprar`, reservada ao "Comprar agora na Amazon" e
  checada pelo `validate-content.mjs`), `rel="nofollow noopener"`, `target="_blank"`, `href = hotmart_checkout_url`.
- **Nenhum link de afiliado dentro dos PDFs/planilhas** (doc 11 §7, Amazon PR §6.3). Links internos do site podem.
- **Membro `pai-de-valor`**: Biblioteca completa (feature `ebooks` de `plans.features`, doc 02 §4.4) e 30 % de desconto
  nos produtos avulsos (doc 11 §6.2): cupom da Hotmart mostrado na página de vendas só quando `usePlan().premium`.
  Código do cupom = constante `HOTMART_COUPON_PREMIUM: string | null = null` em `src/lib/site.ts` (o dono cria o cupom
  na Hotmart e informa o código; `null` = bloco oculto). Não é variável de ambiente.
- **Iscas são públicas** (qualquer um com a URL baixa); o "gate" é só onde o link aparece. Nunca pôr isca no bucket
  privado nem produto pago em `public/downloads/`.
- **Arquivo final pago exige revisão humana do dono** antes de `status='published'` (doc 11 §7). O executor entrega os
  3 produtos cadastrados em `draft`, com página de vendas e fluxo prontos; publicar é ato do dono (pendência em
  `PROGRESSO.md`). Enquanto `draft`, `/loja/digital/$slug` responde 404.
- Tabelas `digital_products` e `digital_purchases` são tabelas auxiliares desta fase (mesmo estatuto de `story_likes`,
  `answer_votes`, `challenge_enrollments`: CLAUDE.md §8); o executor registra em `PROGRESSO.md` → "Decisões tomadas
  durante a execução".

### 12b.2 Migration `supabase/migrations/0010_biblioteca_do_pai.sql`

Numeração: `0008_*` (doc 02 §4.8, doc 07 §2.2, seção 5.3 desta fase) e `0009_public_authors.sql` (doc 04) já existem;
esta é a `0010`. Aplicar com `mcp__Supabase__apply_migration` (name `0010_biblioteca_do_pai`), rodar
`mcp__Supabase__get_advisors`, regenerar `types.ts`. Depende de `set_updated_at()` e `is_admin()` (0001) e de
`is_premium()` (0008 da Fase 5).

```sql
-- 0010_biblioteca_do_pai.sql — Biblioteca do Pai: produtos digitais, compras e bucket privado (doc 09 §12b, doc 11 §7)

-- ---------- digital_products ----------
create table if not exists public.digital_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  subtitle text,
  description text,                                  -- texto da página de vendas (markdown simples, sem R$ de Amazon)
  kind text not null check (kind in ('ebook','planilha','checklist','kit','curso')),
  cover_image_url text,                              -- capa 3:4 (bucket covers, cascata do CLAUDE.md §5.3)
  file_path text,                                    -- objeto no bucket digital-products, ex.: guia-do-churrasco-do-pai/v1.pdf
  file_format text check (file_format in ('pdf','xlsx')),
  pages int,
  price_cents int not null default 0,                -- preço próprio em centavos
  launch_price_cents int,                            -- preço de lançamento (opcional, doc 11 §7)
  hotmart_product_id text,                           -- id do produto na Hotmart (chave usada pelo webhook)
  hotmart_checkout_url text,                         -- https://pay.hotmart.com/<código>
  lead_magnet_path text,                             -- isca gratuita em public/downloads (ex.: /downloads/checklist-72-horas-do-pai.pdf)
  lead_magnet_title text,
  premium_included boolean not null default true,    -- incluso no plano pai-de-valor
  toc jsonb not null default '[]'::jsonb,            -- sumário: ["Capítulo 1 — …", …]
  faq jsonb not null default '[]'::jsonb,            -- [{"question","answer"}] (mesmo formato de posts.faq)
  related_post_slugs jsonb not null default '[]'::jsonb, -- 3 slugs publicados para links internos da página
  status text not null default 'draft' check (status in ('draft','published','archived')),
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace trigger trg_digital_products_updated before update on public.digital_products
  for each row execute function public.set_updated_at();
alter table public.digital_products enable row level security;
drop policy if exists "digital_products: public read" on public.digital_products;
create policy "digital_products: public read" on public.digital_products
  for select using (status = 'published' or (select public.is_admin()));
drop policy if exists "digital_products: staff all" on public.digital_products;
create policy "digital_products: staff all" on public.digital_products
  for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- digital_purchases ----------
create table if not exists public.digital_purchases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.digital_products(id) on delete restrict,
  user_id uuid references public.profiles(id) on delete set null,   -- preenchido pelo e-mail; null até o pai ter conta
  buyer_email text not null,
  buyer_name text,
  provider text not null default 'hotmart' check (provider in ('hotmart','mercadopago','manual')),
  provider_transaction text not null,                                -- transação da Hotmart ou 'manual-<uuid>'
  status text not null default 'approved' check (status in ('approved','refunded','chargeback','canceled')),
  amount_cents int,
  purchased_at timestamptz not null default now(),
  delivered_at timestamptz,                                          -- e-mail de entrega enviado
  raw jsonb,                                                         -- payload do webhook (auditoria)
  created_at timestamptz not null default now(),
  unique (provider, provider_transaction)
);
create index if not exists idx_digital_purchases_user on public.digital_purchases(user_id, status);
create index if not exists idx_digital_purchases_email on public.digital_purchases(lower(buyer_email));
alter table public.digital_purchases enable row level security;
drop policy if exists "digital_purchases: own read" on public.digital_purchases;
create policy "digital_purchases: own read" on public.digital_purchases for select using ((select auth.uid()) = user_id);
drop policy if exists "digital_purchases: staff all" on public.digital_purchases;
create policy "digital_purchases: staff all" on public.digital_purchases
  for all using ((select public.is_admin())) with check ((select public.is_admin()));
-- insert/update de compras só por service role (edge function hotmart-webhook) ou staff; nunca pelo client do membro.

-- ---------- funções ----------
-- id do usuário pelo e-mail (só service role; mesmo padrão de get_secret)
create or replace function public.user_id_by_email(p_email text)
returns uuid language sql stable security definer set search_path = public as $$
  select u.id from auth.users u where lower(u.email) = lower(p_email) limit 1;
$$;
revoke all on function public.user_id_by_email(text) from public, anon, authenticated;

-- vincula ao pai logado as compras feitas com o e-mail dele (chamada por getLibraryData)
create or replace function public.claim_digital_purchases()
returns int language plpgsql security definer set search_path = public as $$
declare v_n int;
begin
  update public.digital_purchases p set user_id = auth.uid()
  where p.user_id is null and lower(p.buyer_email) = lower(coalesce(auth.email(), ''));
  get diagnostics v_n = row_count;
  return v_n;
end $$;
grant execute on function public.claim_digital_purchases() to authenticated;

-- pode ler o arquivo? staff, premium (pai-de-valor + premium_included) ou compra aprovada do produto dono do arquivo
create or replace function public.can_read_digital_file(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    public.is_admin()
    or exists (select 1 from public.digital_products d
               where d.file_path = p_name and d.status = 'published' and d.premium_included and public.is_premium())
    or exists (select 1 from public.digital_purchases p
               join public.digital_products d on d.id = p.product_id
               where d.file_path = p_name and p.user_id = auth.uid() and p.status = 'approved')
  );
$$;
grant execute on function public.can_read_digital_file(text) to authenticated;

-- lista da Biblioteca para o pai logado (um round-trip)
create or replace function public.my_library()
returns table (product_id uuid, slug text, name text, subtitle text, kind text, cover_image_url text, file_format text,
               pages int, price_cents int, hotmart_checkout_url text, lead_magnet_path text, lead_magnet_title text,
               unlocked boolean, unlock_reason text)
language sql stable security definer set search_path = public as $$
  select d.id, d.slug, d.name, d.subtitle, d.kind, d.cover_image_url, d.file_format, d.pages, d.price_cents,
         d.hotmart_checkout_url, d.lead_magnet_path, d.lead_magnet_title,
         (public.is_premium() and d.premium_included)
           or exists (select 1 from public.digital_purchases p
                      where p.product_id = d.id and p.user_id = auth.uid() and p.status = 'approved') as unlocked,
         case when exists (select 1 from public.digital_purchases p
                           where p.product_id = d.id and p.user_id = auth.uid() and p.status = 'approved') then 'compra'
              when public.is_premium() and d.premium_included then 'premium'
              else null end as unlock_reason
  from public.digital_products d
  where d.status = 'published'
  order by d.sort_order, d.name;
$$;
grant execute on function public.my_library() to authenticated;

-- ---------- bucket privado ----------
insert into storage.buckets (id, name, public) values ('digital-products', 'digital-products', false)
on conflict (id) do nothing;
drop policy if exists "digital-products: leitura por premium ou compra" on storage.objects;
create policy "digital-products: leitura por premium ou compra" on storage.objects for select
  using (bucket_id = 'digital-products' and public.can_read_digital_file(name));
drop policy if exists "digital-products: staff write" on storage.objects;
create policy "digital-products: staff write" on storage.objects for insert
  with check (bucket_id = 'digital-products' and public.is_admin());
drop policy if exists "digital-products: staff update" on storage.objects;
create policy "digital-products: staff update" on storage.objects for update
  using (bucket_id = 'digital-products' and public.is_admin());
drop policy if exists "digital-products: staff delete" on storage.objects;
create policy "digital-products: staff delete" on storage.objects for delete
  using (bucket_id = 'digital-products' and public.is_admin());

-- ---------- seed: os 3 produtos do doc 11 §7 (draft até o dono publicar) ----------
insert into public.digital_products
  (slug, name, subtitle, kind, file_format, price_cents, launch_price_cents, lead_magnet_path, lead_magnet_title, sort_order, status)
values
('guia-do-churrasco-do-pai', 'Guia do churrasco do pai',
 '12 cortes com diagrama, ponto da carne por espessura, fogo, acompanhamentos, 3 molhos e cardápios para 6, 12 e 20 pessoas',
 'ebook', 'pdf', 2990, 1990, '/downloads/5-cortes-que-todo-pai-precisa-dominar.pdf', 'Os 5 cortes que todo pai precisa dominar', 10, 'draft'),
('planilha-de-orcamento-da-familia-do-pai', 'Planilha de orçamento da família do pai',
 'Renda, fixos, variáveis, reserva de emergência, "dinheiro do pai", filhos, metas e painel; versão com investimentos',
 'planilha', 'xlsx', 2490, null, '/downloads/planilha-de-orcamento-do-pai-enxuta.xlsx', 'Planilha de orçamento enxuta (3 abas)', 20, 'draft'),
('checklist-do-pai-de-primeira-viagem', 'Checklist do pai de primeira viagem',
 'Pré-natal, mala do pai, documentos, licença-paternidade, primeiras 72 horas, 30 dias e lista de compras',
 'checklist', 'pdf', 1490, null, '/downloads/checklist-72-horas-do-pai.pdf', 'Checklist das primeiras 72 horas', 30, 'draft')
on conflict (slug) do update set name = excluded.name, subtitle = excluded.subtitle, kind = excluded.kind,
  file_format = excluded.file_format, price_cents = excluded.price_cents, launch_price_cents = excluded.launch_price_cents,
  lead_magnet_path = excluded.lead_magnet_path, lead_magnet_title = excluded.lead_magnet_title, sort_order = excluded.sort_order;
```

Verificação (2.3 desta fase, mesmo estilo): `select slug, status from public.digital_products` → 3 linhas `draft`;
`select id from storage.buckets where id = 'digital-products'` → 1 linha `public = false`; como anon,
`select count(*) from public.digital_purchases` → 0.

### 12b.3 Iscas gratuitas (`public/downloads/`) — especificação única

| Arquivo | Conteúdo (de onde vem) | Formato | Onde o link aparece |
|---|---|---|---|
| `/downloads/5-cortes-que-todo-pai-precisa-dominar.pdf` | Capítulo do Guia do churrasco: picanha, fraldinha, costela, contrafilé e alcatra/maminha; por corte: como escolher no açougue, preparo, ponto por espessura, erro comum ("Semáforo do pai" do corte). Texto reaproveitado dos artigos publicados de churrasco e cortes de carne (doc 12, série de cortes) e da ferramenta `/ferramentas/cortes-de-carne` (doc 06) | PDF, 6–10 páginas | `/newsletter/obrigado`, e-mail D0, Biblioteca, amostra em `/loja/digital/guia-do-churrasco-do-pai` |
| `/downloads/checklist-72-horas-do-pai.pdf` | Antes de sair para a maternidade, no hospital, registro do filho, volta para casa, primeira noite, quando procurar ajuda (semáforo). Fonte: trilha T1 `pai-de-primeira-viagem-em-30-dias` (seção 5.2) e ferramenta `checklist-da-maternidade` (doc 06 §0.2 item 15) | PDF, 4–6 páginas, imprimível | `/newsletter/obrigado`, e-mail D0, Biblioteca, amostra em `/loja/digital/checklist-do-pai-de-primeira-viagem` |
| `/downloads/planilha-de-orcamento-do-pai-enxuta.xlsx` | 3 abas (Renda, Gastos, Resumo) com fórmulas; mesmas categorias da ferramenta `/ferramentas/orcamento-familiar` (doc 06) | XLSX | Os mesmos acima **e** link direto na própria ferramenta `/ferramentas/orcamento-familiar` (doc 11 §7: "versão enxuta gratuita … (download)") |

Produção (responsabilidade do item **5.8** da Fase 5; se a Fase 5 já tiver sido executada sem as iscas, a Fase 7 faz
aqui, no passo 7.9b): o texto-fonte de cada isca fica em `supabase/seed/downloads/<nome-do-arquivo>.md` (commitado,
editável); o PDF/XLSX é gerado pelo executor com o gerador de documentos disponível na sessão (skills `pdf`/`xlsx` do
Claude Code) e commitado em `public/downloads/`. Sem gerador disponível: commitar o `.md`, deixar o link oculto
(`lead_magnet_path = null`) e registrar "gerar PDF das iscas" em `PROGRESSO.md` → "Pendências". Layout: capa com o
wordmark (doc 02 §6.4), cores dos tokens, rodapé "vocacaodepai.com.br — Vocação de Pai", < 2 MB, sem link de
afiliado, linha editorial do CLAUDE.md §3. Conferir na preview da Vercel que cada URL responde 200 com `Content-Type`
correto.

Entrega após confirmação (`newsletter_subscribers.confirmed_at`):

1. `/newsletter/confirmar?token=` chama `newsletter_confirm` (doc 07 §2.2) e redireciona para `/newsletter/obrigado?ok=1`
   (doc 11 §5.2 passo 3). A página `newsletter.obrigado.tsx` (doc 02 §3) ganha o bloco **"Seus 3 presentes"** —
   componente `src/components/area-do-pai/LeadMagnets.tsx` (lista os `lead_magnet_path` não nulos de
   `digital_products`, por `sort_order`; cada item: ícone, título, formato, botão "Baixar") — exibido só quando
   `ok=1` vier do redirect; sem `ok=1` a página mostra "Confirme sua inscrição pelo e-mail para liberar os presentes".
2. O e-mail **D0** da sequência de boas-vindas (doc 11 §5.5, "Bem-vindo à Vocação de Pai. Comece por aqui.") recebe os
   3 links logo após o primeiro parágrafo, onde quer que a Fase 8 implemente a sequência (doc 10 §8). Até lá, a entrega
   garantida é a página do passo 1.
3. Membro logado: bloco "Grátis para todo pai" no topo de `/area-do-pai/biblioteca` (mesmo `LeadMagnets`), sem
   depender da newsletter — ele já deu o e-mail no cadastro.
4. Página de vendas: a isca é a "Amostra grátis" do produto (link direto, sem gate).

### 12b.4 Biblioteca do Pai — `/area-do-pai/biblioteca`

- Rota `src/routes/_site/area-do-pai.biblioteca.tsx` (padrão doc 07 §4.7: `createFileRoute` + `privateHead("Biblioteca
  do Pai")` + `RequireAuth`), página `src/pages/area/BibliotecaPage.tsx`.
- Server functions em `src/lib/library.functions.ts` (`createServerFn` + `requireUser(accessToken)`, doc 07 §4.6):
  - `getLibraryData({ accessToken })` → chama `claim_digital_purchases()` e depois `my_library()` com o client do
    usuário; devolve `{ items, freebies }` (`freebies` = produtos com `lead_magnet_path`).
  - `getDigitalDownloadFn({ accessToken, slug })` → confere `my_library()` do usuário (`unlocked = true`, senão erro
    "Produto não liberado"); gera `supabaseAdmin.storage.from("digital-products").createSignedUrl(file_path, 60*60*24*7)`
    e devolve `{ url, expiresAt }`. Nunca expõe `file_path` ao cliente; `rateLimit` 20/h por usuário (doc 07 §4.5).
- Componentes `src/components/area-do-pai/`: `LibraryCard.tsx` (capa 3:4, nome, `kind` traduzido, páginas/formato,
  estado: **Baixar** · **Incluído no Pai de Valor** · **Comprar na Hotmart** + link "ver página") e `LeadMagnets.tsx`.
  Card bloqueado = `<PremiumGate feature="ebooks" fallback={<UpsellCard/>}>` por card (compra avulsa libera mesmo sem
  plano, por isso o gate é por item, nunca na página inteira).
- Ordem na página: "Grátis para todo pai" → "Seus produtos" (liberados) → "Biblioteca completa" (bloqueados) → rodapé
  "Problema com um arquivo? contato@vocacaodepai.com.br".
- Painel `/area-do-pai` (doc 07 §4.9): `DashboardCards` ganha o card "Biblioteca do Pai" (N liberados de M, link).
- `noindex`, sem AdSense (`/area-do-pai/*` já está em `src/lib/ads/no-ads-routes.ts`, doc 11 §2.5).

### 12b.5 Página de vendas — `/loja/digital/$slug`

- Rota `src/routes/_site/loja/digital/$slug.tsx` + `src/pages/DigitalProductPage.tsx` (padrão doc 05 §4.7). Loader
  anônimo via `src/lib/db/biblioteca.ts` (`queryDigitalProducts`, `queryDigitalProductBySlug`, com
  `createReadOnlySupabaseClient`); `status <> 'published'` → 404 (`notFound()`).
- Blocos, nesta ordem: hero (capa 3:4, nome, subtítulo, `kind` + páginas/formato, preço — se `launch_price_cents`
  preenchido: "Lançamento: R$ X (depois R$ Y)" — e botão `btn-hotmart`) → "Para quem é" → "O que tem dentro" (`toc`)
  → "Amostra grátis" (`lead_magnet_path`) → "Como você recebe" (e-mail na hora + Biblioteca do Pai para baixar de novo;
  7 dias de garantia da Hotmart) → "Membro Pai de Valor? Já está na sua Biblioteca" (link; e cupom se
  `usePlan().premium` e `HOTMART_COUPON_PREMIUM`) → FAQ (`faq`, mesmo `FaqBlock` do Blog) → "Leia antes de comprar"
  (3 links internos de `related_post_slugs`, só slugs publicados) → botão final. Aviso curto no rodapé: "Produto
  digital do Vocação de Pai; pagamento processado pela Hotmart". Sem link de afiliado, sem `AdSlot`.
- SEO: `head()` com `seo_title` = nome, `description` = subtítulo; JSON-LD `Product` + `Offer` (`price` próprio,
  `priceCurrency: "BRL"`, `availability: "https://schema.org/OnlineOnly"`) + `BreadcrumbList`; `/loja/digital/$slug`
  publicados entram no `sitemap[.]xml.ts` (doc 02 §7) e na lista `no-ads-routes.ts` (doc 11 §2.5).
- `/loja` (`StorePage`, doc 05 §4.5) ganha a faixa "Biblioteca do Pai" com os cards dos produtos publicados (só aparece
  se houver ≥ 1 publicado).
- Constante `PLANILHA_URL` da ferramenta `orcamento-familiar` (doc 06 §3) passa a
  `"/loja/digital/planilha-de-orcamento-da-familia-do-pai"` quando esse produto for publicado (até lá continua `null`).
- `scripts/validate-content.mjs` ganha a regra "produto digital": `description`/`faq` de `digital_products` não podem
  conter "Comprar agora na Amazon", `amazon.com.br` nem `tag=`; `hotmart_checkout_url` preenchida deve começar com
  `https://pay.hotmart.com/`; `published` exige `file_path`, `cover_image_url` e `hotmart_checkout_url`.

### 12b.6 Compra: Hotmart → `hotmart-webhook` → `digital_purchases` → e-mail de entrega

**Do dono (pendências que só ele resolve):** criar a conta de produtor na Hotmart; cadastrar os 3 produtos (nome e
preço do doc 11 §7, **sem subir o arquivo na Hotmart** — a entrega é do site, fonte única = bucket); colar
`hotmart_product_id` e `hotmart_checkout_url` em `/admin/biblioteca`; criar o cupom de 30 % para o Pai de Valor e
informar o código (constante `HOTMART_COUPON_PREMIUM`); configurar o Webhook (versão 2.0) apontando para
`https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/hotmart-webhook` com os eventos `PURCHASE_APPROVED`,
`PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK` e `PURCHASE_CANCELED`; copiar o **hottok** para o
secret de Edge Function `HOTMART_HOTTOK` (`mcp__Supabase__create_edge_function_secret`). `HOTMART_HOTTOK` **não é
variável do app**: entra na tabela "segredos que não são variáveis do app" do doc 02 §8, ao lado de
`GSC_SERVICE_ACCOUNT_JSON`, e nunca no `.env.example`.

**Edge function `supabase/functions/hotmart-webhook/index.ts`** (deploy com `--no-verify-jwt`: a Hotmart não manda
JWT; a autenticação é o hottok). Usa `sendEmail`/`requireInternalSecret` de `_shared/resend.ts` (doc 07 §6.2) e o
template novo `digitalProductDelivery` de `_shared/email-templates.ts`. Passos:

1. Header `X-HOTMART-HOTTOK` ≠ `Deno.env.get("HOTMART_HOTTOK")` → `401`. (Nomes de header e campos conforme a
   documentação do Webhook 2.0 da Hotmart; conferir na implementação e anotar divergência em `PROGRESSO.md`.)
2. Ler `event`, `data.product.id`, `data.buyer.email`, `data.buyer.name`, `data.purchase.transaction`,
   `data.purchase.price.value`.
3. Produto = `digital_products where hotmart_product_id = <id>`; não achou → `200 {"ignored":true}` e
   `moderation_log (entity='digital_purchase', action='unknown_product', note=<id>)` — nunca 4xx/5xx por produto
   desconhecido (a Hotmart reenvia em erro).
4. `upsert` em `digital_purchases` por `(provider='hotmart', provider_transaction)`: `status` = `approved`
   (APPROVED/COMPLETE), `refunded`, `chargeback` ou `canceled`; `user_id = public.user_id_by_email(buyer_email)`
   (null se o pai ainda não tem conta; `claim_digital_purchases()` resolve depois); `amount_cents`, `raw`.
5. Se `approved` e `delivered_at is null`: URL assinada de 7 dias (service role) + e-mail `digitalProductDelivery`
   (tag `type=digital-delivery`), depois `delivered_at = now()`. Reembolso/chargeback não manda e-mail: o acesso cai
   sozinho porque a policy e `my_library()` só olham `status = 'approved'`.
6. Responder `200` sempre que o hottok bater. Idempotente: segundo POST da mesma transação não reenvia e-mail.
7. Modo interno (reenviar entrega / compra manual): `POST` com `Authorization: Bearer CRON_SECRET` (validado por
   `requireInternalSecret`, doc 07 §6.2) e body `{ "purchase_id": "<uuid>" }` → executa só o passo 5, ignorando
   `delivered_at`.

**Template `digitalProductDelivery({ name, productName, url, librarySlug })`** — assunto `Seu {productName} chegou`.
Corpo: "Obrigado, {name}." · botão **"Baixar agora"** (`url`; "o link vale 7 dias") · "Depois disso, baixe de novo
quando quiser na sua Biblioteca do Pai: https://vocacaodepai.com.br/area-do-pai/biblioteca — entre com o mesmo e-mail
da compra" · "Ainda não tem conta? Cadastre-se com este e-mail e o produto aparece sozinho" · suporte
`contato@vocacaodepai.com.br` · assinatura "Bruno Danello — Vocação de Pai". Sem link de afiliado. `from`/`reply_to`
iguais aos do doc 07 §6.1.

**Compra manual** (bolsa, brinde, teste): em `/admin/biblioteca` → aba Compras → "Adicionar compra manual" (e-mail,
produto) grava `provider='manual'`, `provider_transaction='manual-<uuid>'`, `status='approved'` e chama o modo interno
do webhook para entregar.

### 12b.7 Admin — `/admin/biblioteca`

`src/admin/LibraryEditor.tsx`, rota `src/routes/_admin/admin/biblioteca.tsx` (guard `is_admin()`, `noindex`, sem
AdSense). Aba **Produtos**: tabela (nome, `kind`, status, preço, compras aprovadas, arquivo presente?), formulário com
todos os campos da tabela, upload do arquivo para o bucket em `<slug>/v<N>.<ext>` (grava `file_path`), capa pela
cascata de imagens (bucket `covers`), botões **Publicar** (exige `file_path`, `cover_image_url` e
`hotmart_checkout_url`; senão, erro listando o que falta) / **Despublicar**, "Ver página" (abre `/loja/digital/$slug`;
em `draft` o admin vê pela prévia do próprio editor, não pela rota pública). Aba **Compras**: lista
(e-mail, produto, provider, status, data, entregue?), "Reenviar e-mail de entrega" (modo interno do webhook), "Adicionar
compra manual", exportar CSV. Badge de produtos `draft` com arquivo pronto na `AdminDashboard`.

### 12b.8 Ordem de execução (= item 7.9b do doc 13; entra depois do 7.9 na seção 14)

1. `0010_biblioteca_do_pai.sql` (12b.2): escrever, aplicar, advisors, `types.ts`. Commit `db: migration 0010 biblioteca do pai`.
2. Iscas (12b.3): `supabase/seed/downloads/*.md` → `public/downloads/*`; `LeadMagnets`; bloco em `/newsletter/obrigado`
   (pular se o 5.8 da Fase 5 já tiver entregue; conferir com `ls public/downloads`).
3. `src/lib/db/biblioteca.ts` e `src/lib/library.functions.ts`.
4. `/area-do-pai/biblioteca` + `LibraryCard` + card no painel (12b.4).
5. `/loja/digital/$slug` + faixa em `/loja` + `no-ads-routes.ts` + sitemap + JSON-LD + regra do validador (12b.5).
6. `hotmart-webhook` + `digitalProductDelivery`; deploy; teste com `curl` (hottok errado → 401; payload de
   `PURCHASE_APPROVED` com hottok de teste → compra + e-mail; repetir → sem e-mail).
7. `/admin/biblioteca` (12b.7).
8. `PROGRESSO.md`: decisões (tabelas auxiliares, cupom) e pendências do dono (conta Hotmart, 3 produtos,
   checkout URLs, `HOTMART_HOTTOK`, cupom, revisão e publicação dos 3 arquivos finais). Commit
   `feat(biblioteca): Biblioteca do Pai e produtos digitais`.

Estimativa: 1 sessão. Os critérios de aceite desta seção são os itens 21 e 22 da seção 15.

---

## 13. Admin

- `/admin/moderacao` (`ModerationQueue.tsx`): sub-abas **Histórias** · **Perguntas** · **Respostas** · **Denúncias**.
  Lista pendentes primeiro (`report_count desc, created_at asc`), autor (`display_name`), prévia, botão "Ver" (Sheet
  com o conteúdo completo), **Aprovar** (1 clique) e **Rejeitar** (Dialog com motivo ≥ 10, motivos prontos: "Fora da
  linha editorial", "Identifica terceiros", "Linguagem imprópria", "Conteúdo comercial", "Duplicado", "Outro"). Chama
  `moderate_story` / `moderate_question` / `moderate_answer` pelo client admin (RLS + `is_admin()`), depois
  `email.functions.ts` (`storyApproved` etc.). Aba Denúncias = `moderation_log` com `action='flag'` agrupado por
  entidade, com atalhos aprovar/rejeitar. Badge de pendentes na `AdminDashboard` (padrão da aba `stories` do VDM).
- `/admin/formacao` (`TracksEditor.tsx` + `ChallengesEditor.tsx`): tabela de trilhas (status, passos, concluintes =
  `count(distinct user_id)` de `track_progress`), formulário da trilha (campos da tabela), lista de passos com reordenar
  (`position`), tipo, regra, `post_id` (busca por título), `video_url`, editor Tiptap do `body` (mesmo `AdminEditor` do
  Blog, modo "passo"); desafios: campos + grade de 30 dias editável. Botões "Publicar"/"Despublicar".
- `/admin/eventos` (`EventsEditor.tsx`): CRUD de eventos, lista de RSVPs (nome + e-mail só para admin, exportar CSV),
  botão "Marcar como realizado" (`status='done'` → libera `presente-no-encontro`), "Cancelar" (`canceled`; e-mail aos
  confirmados com template `eventCanceled`).
- `/admin/biblioteca` (`LibraryEditor.tsx`): produtos digitais (CRUD, upload para o bucket `digital-products`,
  publicar/despublicar) e compras (manual, reenviar entrega, CSV) — seção 12b.7.
- Guard: `is_admin()` (editor e admin). Rotas `noindex`. Sem AdSense.

---

## 14. Ordem de execução (numeração = `13-checklist-de-execucao.md`, Fase 7)

1. `git checkout -b claude/fase-7-irmandade-e-formacao` a partir de `main` atualizada. Ler CLAUDE.md, doc 02, PROGRESSO.
2. **7.1–7.5 (banco)**: escrever `0006_irmandade_formacao.sql` (seção 2.2), aplicar (2.3), `types.ts`, advisors. Commit `db: migration 0006 irmandade e formacao`.
3. `src/content/irmandade/codigo-de-conduta.ts`, `src/lib/irmandade/*`, `src/lib/db/irmandade.ts`, `src/lib/db/formacao.ts`.
4. `community.functions.ts` + `tracks.functions.ts` (10.2). `email.functions.ts`: novos templates (8).
5. **7.1** `/irmandade` (hub: 3 últimas histórias, 3 perguntas sem resposta, 2 próximos encontros, código de conduta, CTA grupo).
6. **7.2** Histórias (3.1–3.3) + liberar pasta `stories` no upload. **7.3** Perguntas (4). **7.4** Eventos (8) + edge function `event-reminder` deployada.
7. **7.5** Admin de moderação (13) com as 4 sub-abas; testar aprovar/rejeitar com e-mail.
8. **7.9** Seeds: `tracks.json` (T1 e T6 completas; demais com `summary`), `challenges.json` (3 desafios × 30 dias, literal da 6.2), `scripts/seed-formacao.mjs`, gerar e aplicar `0008_seed_formacao.sql`; capas pela cascata de imagens. Commit `content: seeds de trilhas e desafios`.
9. **7.6** `/formacao`, `/formacao/$slug` com `TrackPlayer` (5.4, 10.3). **7.7** `/desafios`, `/desafios/$slug` com `ChallengeCalendar`.
10. **7.8** `BadgesWall`, toasts de conquista; conferir `award_badges` em cada gatilho. **7.10** `FormacaoWidget` e abas novas no painel (11). Newsletter (12).
11. **7.9b** Biblioteca do Pai e produtos digitais (12b.8): migration `0010_biblioteca_do_pai.sql`, iscas em `public/downloads/`, `/area-do-pai/biblioteca`, `/loja/digital/$slug`, edge function `hotmart-webhook` + e-mail de entrega, `/admin/biblioteca`. Commit `feat(biblioteca): Biblioteca do Pai e produtos digitais`.
12. Admin de Formação e Eventos (13). Sitemap e JSON-LD (10.1). Atualizar doc 02 §1.3 com `/perguntas/nova` e `/eventos/$slug`.
13. **7.11** Testes de RLS e fluxo (seção 15). **7.12** `npm run build && npm run lint && node scripts/validate-content.mjs`; `PROGRESSO.md`; marcar 7.1–7.12 (inclusive 7.9b) no doc 13; PR `Fase 7 — Irmandade e Formação` com o checklist da seção 17.

---

## 15. Critérios de aceite

1. `0006` aplicada sem erro; 21 funções da consulta 2.3 existem; `badges.rule` é `jsonb`; `user_badges` tem `earned_at` e `awarded_at`; advisors sem erro.
2. Anônimo: `select` em `stories`/`questions`/`answers`/`events`/`tracks`/`challenges` devolve só aprovado/publicado; `track_progress`, `challenge_progress`, `story_likes`, `answer_votes`, `event_rsvps` devolvem 0 linhas.
3. Membro sem e-mail confirmado não insere história nem pergunta (erro RLS) e a UI mostra "Confirme seu e-mail" com botão reenviar.
4. Membro confirmado publica história → `pending` → não aparece em `/historias` → admin aprova → aparece, autor recebe e-mail, ganha `voz-da-irmandade`; rejeitar sem motivo falha; com motivo, e-mail com o motivo.
5. Autor edita história `pending` (ok), tenta editar `approved` (RLS nega), edita `rejected` (volta a `pending`).
6. Anônimo lê 1 história; a 2ª redireciona para `/entrar?next=`. "Esse relato me ajudou" alterna e atualiza `like_count`.
7. Pergunta: Turnstile obrigatório; 4ª pergunta no dia falha; título duplicado avisa; link encurtador bloqueado; aprovada aparece com JSON-LD `QAPage` válido no Rich Results Test.
8. Resposta entra `approved`; voto por outro membro muda `like_count`; votar na própria falha; autor marca melhor resposta → selo, ordem e `conselheiro` para quem respondeu; 3 denúncias escondem a resposta (`pending`) e ela aparece em Denúncias.
9. Evento publicado em `/eventos` com JSON-LD `Event` válido; RSVP "Vou" incrementa `rsvp_count`; `capacity` cheia → "Lista cheia"; `.ics` baixa; evento `done` + RSVP `going` → `presente-no-encontro` no próximo `grant_badges_for_me`.
10. Cron `event-reminder` agendado; chamada manual com evento a 24 h envia e-mail e grava `reminded_at`; segunda chamada não reenvia.
11. `/formacao` lista 8 trilhas publicadas agrupadas por pilar; `/formacao/pai-de-primeira-viagem-em-30-dias` renderiza 12 passos com os 5 tipos; `/formacao/fe-do-pai-33-dias-com-sao-jose` tem 33 passos.
12. Concluir passo grava `track_progress`; `checklist_all` e `exercise_text` gravam `note`; concluir a trilha concede `formador` (1ª) e a insígnia específica (T4, T6, T7); toast de conquista aparece; JSON-LD `Course` válido.
13. `/desafios` lista 3; `/desafios/30-dias-de-presenca-com-os-filhos` mostra 30 dias; "Começar" cria enrollment; marcar dia futuro falha com "Esse dia ainda não chegou"; marcar dia perdido funciona; 30 dias → `finished_at` + `pai-presente`.
14. `member_streak` = 1 após uma marcação hoje, 2 com ontem+hoje, 0 se a última foi anteontem; `member_points` e `member_title` batem com a tabela da seção 11.
15. Painel `/area-do-pai`: `FormacaoWidget` mostra trilha em andamento e desafio do dia; `BadgesWall` mostra 20 insígnias (conquistadas coloridas); abas "Minhas histórias/perguntas/encontros".
16. Newsletter: `member_formacao_summary` retorna JSON; disparo manual do digest para um assinante com progresso inclui "Sua formação".
17. Admin: 4 sub-abas de moderação funcionam; `TracksEditor` cria passo e reordena; `EventsEditor` marca `done` e cancela com e-mail.
18. Sitemap inclui histórias, perguntas, eventos, trilhas e desafios publicados; `/historias/nova`, `/perguntas/nova`, `/admin/*` são `noindex`; sem AdSense em formulários e no player.
19. `npm run build && npm run lint && node scripts/validate-content.mjs` verdes; `types.ts` regenerado; nada em inglês na UI; linha editorial do CLAUDE.md §3 respeitada em textos, seeds e capas.
20. Doc 02 §1.3 atualizado com as 2 rotas novas; `PROGRESSO.md` e doc 13 (7.1–7.12) atualizados; PR aberto.
21. Biblioteca do Pai (12b): `0010` aplicada; anônimo lê só `digital_products` publicados e 0 linhas de `digital_purchases`; `/area-do-pai/biblioteca` para membro gratuito mostra os 3 downloads grátis e os 3 produtos bloqueados com `UpsellCard`; inserir compra manual `approved` para o e-mail dele → `my_library().unlocked = true`, botão "Baixar" devolve URL assinada que responde 200 e expira em 7 dias; membro `pai-de-valor` (subscription manual, doc 07 critério 7) vê tudo liberado; `status='refunded'` → volta a bloqueado; URL do objeto sem assinatura → 400/403; `/downloads/*.pdf|xlsx` respondem 200 e aparecem em `/newsletter/obrigado?ok=1`.
22. Vendas e webhook (12b): `/loja/digital/guia-do-churrasco-do-pai` renderiza quando `published` (404 em `draft`), sem `AdSlot`, com JSON-LD `Product` + `Offer` válido, botão `btn-hotmart` (nunca `btn-comprar`) e amostra grátis; POST em `hotmart-webhook` com hottok errado → 401; com hottok certo e `PURCHASE_APPROVED` → linha em `digital_purchases` + e-mail de entrega; mesmo POST repetido não reenvia; `PURCHASE_REFUNDED` muda o status; `validate-content.mjs` falha se a descrição citar "Comprar agora na Amazon" ou `amazon.com.br`.

---

## 16. Prompt para iniciar esta fase no Sonnet

```text
Você está em /home/user/vocacaodepai (TanStack Start + React 19 + Tailwind 4 + Supabase + Vercel + Resend).
Leia primeiro, nesta ordem: CLAUDE.md, docs/plano/02-arquitetura-e-stack.md, docs/plano/PROGRESSO.md e
docs/plano/09-fase-7-irmandade-e-formacao.md. Execute a FASE 7 (Irmandade e Formação) exatamente como o documento 09
descreve, na ordem da seção 14, sem mudar nomes de tabelas, colunas, rotas ou arquivos. Regras:
1. Crie a branch claude/fase-7-irmandade-e-formacao a partir de main.
2. Escreva supabase/migrations/0006_irmandade_formacao.sql copiando o SQL da seção 2.2 (substitua <SUPABASE_PROJECT_REF>
   no cron). Antes, rode mcp__Supabase__list_migrations: se 0006_irmandade_formacao já existir, aplique este SQL com o
   nome 0006_irmandade_formacao_v2 e sobrescreva o arquivo. Aplique com mcp__Supabase__apply_migration, rode
   mcp__Supabase__get_advisors e corrija avisos, regenere src/integrations/supabase/types.ts. badges/user_badges já
   existem na 0004: não recrie; a 0006 só compatibiliza (seção 2.1).
3. Implemente histórias copiando/adaptando os arquivos do /home/user/vocacaodemae listados na seção 3.1 (somente
   leitura lá), perguntas e respostas (seção 4), encontros com RSVP, lembrete por e-mail e JSON-LD Event (seção 8),
   trilhas com TrackPlayer (seções 5 e 10), desafios com ChallengeCalendar (seção 6), insígnias e BadgesWall (seção 7),
   FormacaoWidget no painel (seção 11), bloco "Sua formação" na newsletter (seção 12), a Biblioteca do Pai e os
   produtos digitais (seção 12b: migration 0010, iscas em public/downloads, /area-do-pai/biblioteca, /loja/digital/$slug,
   edge function hotmart-webhook com e-mail de entrega, /admin/biblioteca; os 3 produtos ficam em draft) e o admin (seção 13).
4. Seeds: supabase/seed/tracks.json (T1 e T6 completas; T2–T5, T7, T8 com summary e body curto; todos os passos das
   tabelas da seção 5.2), supabase/seed/challenges.json (os 3 desafios, 30 dias cada, transcritos literalmente da seção
   6.2) e scripts/seed-formacao.mjs gerando supabase/migrations/0008_seed_formacao.sql; commite e aplique o SQL.
   Resolva post_id só para slugs publicados (select slug from posts where status='published'); nunca invente slug.
   Capas pela cascata do CLAUDE.md §5.3, conferidas com HEAD, dentro da linha editorial.
5. Use os padrões do repositório (createFileRoute + head(), react-hook-form + zod, createServerFn + requireUser +
   rateLimit, toast do sonner, is_admin()). Textos só em PT-BR, tom do CLAUDE.md §3. Sem preço exato em lugar nenhum.
6. Ao final de cada etapa rode npm run build && npm run lint && node scripts/validate-content.mjs. Não deixe erro de tipo.
7. Percorra os 22 critérios de aceite da seção 15, marque 7.1–7.12 (inclusive 7.9b) em docs/plano/13-checklist-de-execucao.md,
   atualize docs/plano/PROGRESSO.md (feito, pendente, pendências do dono: segredo INTERNAL_FN_SECRET no Vault se faltar,
   deploy das edge functions event-reminder e hotmart-webhook, conta e produtos na Hotmart com checkout URLs, hottok no
   secret HOTMART_HOTTOK, cupom do Pai de Valor, revisão e publicação dos 3 arquivos digitais, vídeos das trilhas ainda
   não gravados) e acrescente /perguntas/nova e /eventos/$slug ao doc 02 §1.3. Abra o PR "Fase 7 — Irmandade e Formação" contra main com o checklist da seção 17.
Se algo do documento conflitar com o código real do repositório (nome de helper, assinatura de função da Fase 5 ou 6),
siga o repositório e anote a diferença em PROGRESSO.md. Não faça perguntas: tome a decisão mais simples compatível com
o doc 02 e registre.
```

---

## 17. Checklist de pronto (colar no PR)

```markdown
## Fase 7 — Irmandade e Formação — Checklist de pronto
### Banco
- [ ] `0006_irmandade_formacao.sql` aplicada em <SUPABASE_PROJECT_REF> (stories, story_likes, questions, answers, answer_votes, events, event_rsvps, tracks, track_steps, track_progress, challenges, challenge_days, challenge_progress, challenge_enrollments)
- [ ] badges/user_badges compatibilizadas (rule jsonb; earned_at + awarded_at); 20 insígnias no seed
- [ ] Funções: can_post_irmandade, log_moderation, vdp_internal, award_badge, award_badges, grant_badges_for_me, like_story, vote_answer, accept_answer, increment_question_views, moderate_story, moderate_question, moderate_answer, report_irmandade, rsvp_event, event_rsvp_count, complete_track_step, save_step_note, start_challenge, complete_challenge_day, challenge_current_day, member_streak, member_points, member_title, member_formacao_summary, get_member_dashboard
- [ ] Triggers: updated_at (5 tabelas), guard_member_status (stories, questions), protect_answer_fields, answers_count_sync, event_rsvp_sync
- [ ] RLS testada com anônimo, autor e staff; advisors sem erro; view `irmandade_members`; bucket `stories`; cron `event-reminder`
- [ ] `0008_seed_formacao.sql` gerada pelo `scripts/seed-formacao.mjs` e aplicada: 8 trilhas (107 passos), 3 desafios (90 dias)
- [ ] `0010_biblioteca_do_pai.sql` aplicada: `digital_products`, `digital_purchases`, funções `user_id_by_email`, `claim_digital_purchases`, `can_read_digital_file`, `my_library`; bucket privado `digital-products` com policies; 3 produtos em `draft`
- [ ] `types.ts` regenerado
### Irmandade
- [ ] `/irmandade`, `/historias`, `/historias/$id`, `/historias/nova` (gate de 1 história, curtir, denunciar, JSON-LD Article)
- [ ] `/perguntas`, `/perguntas/$slug`, `/perguntas/nova` (Turnstile, honeypot, blacklist, duplicidade, votos, melhor resposta, JSON-LD QAPage)
- [ ] `/eventos`, `/eventos/$slug` (RSVP com lotação, .ics, WhatsApp, JSON-LD Event); edge function `event-reminder` deployada e testada
- [ ] E-mails: storyApproved/Rejected, questionApproved/Rejected, answerReceived, eventReminder, eventCanceled
### Formação
- [ ] `/formacao`, `/formacao/$slug` com TrackPlayer (5 tipos de passo, 5 regras), ProgressRing, JSON-LD Course
- [ ] `/desafios`, `/desafios/$slug` com ChallengeCalendar, recomeço suave, conclusão com insígnia
- [ ] BadgesWall (20), StreakChip, FormacaoWidget e abas novas em `/area-do-pai`; toasts de conquista
- [ ] Newsletter com bloco "Sua formação" / "Desafio da semana"
### Biblioteca do Pai e produtos digitais (12b)
- [ ] Iscas em `public/downloads/` (5 cortes, checklist 72 horas, planilha enxuta) + `LeadMagnets` em `/newsletter/obrigado?ok=1`
- [ ] `/area-do-pai/biblioteca` (grátis / seus produtos / bloqueados com `PremiumGate feature="ebooks"`; URL assinada 7 dias) e card no painel
- [ ] `/loja/digital/$slug` (sem AdSense, `btn-hotmart`, JSON-LD Product+Offer, sitemap, `no-ads-routes.ts`, regra no `validate-content.mjs`)
- [ ] Edge function `hotmart-webhook` deployada (hottok, idempotência, `digitalProductDelivery`, modo interno com `CRON_SECRET`)
### Admin
- [ ] `/admin/moderacao` (Histórias, Perguntas, Respostas, Denúncias) com `moderation_log`
- [ ] `/admin/formacao` (trilhas, passos, desafios) e `/admin/eventos` (CRUD, RSVPs, realizado/cancelado)
- [ ] `/admin/biblioteca` (produtos, upload, publicar com validação, compras manuais, reenviar entrega)
### Qualidade e documentação
- [ ] Sitemap e `noindex` conforme seção 15.18; sem AdSense em formulários e no player
- [ ] `npm run build && npm run lint && node scripts/validate-content.mjs` verdes
- [ ] 22 critérios de aceite da seção 15 verificados manualmente em preview da Vercel
- [ ] Doc 02 §1.3 com `/perguntas/nova` e `/eventos/$slug`; `PROGRESSO.md` e doc 13 (7.1–7.12) atualizados; pendências do dono listadas
```
