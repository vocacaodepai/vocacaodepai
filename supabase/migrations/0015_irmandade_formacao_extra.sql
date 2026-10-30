-- 0015_irmandade_formacao_extra.sql — complemento da 0006 com o SQL integral do doc 09 §2.2
-- (Fase 7). Idempotente: tudo é `create or replace` / `if not exists` / `drop policy if exists`.
-- Acrescenta o que a 0006 real não tinha: email_verified(), can_post_irmandade(), log_moderation(),
-- vdp_internal(), view irmandade_members, story_likes + like_story(), answer_votes + vote_answer(),
-- colunas extras (approved_at, rejection_reason, report_count, tags, last_answer_at, events.kind,
-- organizer, price_text, rsvp_count, tracks.is_premium/estimated_days/audience/pillar/outcomes,
-- track_steps.module/type/summary/completion_rule/related_post_slug, track_progress.note,
-- challenges.pillar/is_premium/badge_slug, challenge_days.reflection, challenge_enrollments),
-- moderate_question/answer, report_irmandade, rsvp_event, track_is_completed, challenge_current_day,
-- member_streak/points/title, save_step_note, start_challenge, member_formacao_summary e a versão
-- final de guard_member_status, moderate_story, accept_answer, complete_track_step,
-- complete_challenge_day e get_member_dashboard. Bucket e cron entram guardados por `do $$`
-- (rodam só onde storage/pg_cron/get_secret existem; <SUPABASE_PROJECT_REF> é substituído pelo executor).
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

-- ---------- 12. Bucket de fotos das histórias (só onde o schema storage existe) ----------
do $$
begin
  if to_regclass('storage.buckets') is null then return; end if;
  insert into storage.buckets (id, name, public) values ('stories', 'stories', true) on conflict do nothing;
  drop policy if exists "stories: leitura pública" on storage.objects;
  create policy "stories: leitura pública" on storage.objects for select using (bucket_id = 'stories');
  drop policy if exists "stories: membro envia na própria pasta" on storage.objects;
  create policy "stories: membro envia na própria pasta" on storage.objects for insert
    with check (bucket_id = 'stories' and auth.role() = 'authenticated' and (storage.foldername(name))[1] = auth.uid()::text);
end $$;

-- ---------- 13. Cron: lembrete de evento 24 h antes (rota /api/cron/event-reminder com CRON_SECRET) ----------
-- Requer pg_cron, pg_net e public.get_secret (0004/doc 07 §2.3). <SUPABASE_PROJECT_REF> é substituído pelo executor.
do $$
begin
  if to_regclass('cron.job') is null or to_regprocedure('public.get_secret(text)') is null then return; end if;
  if exists (select 1 from cron.job where jobname = 'event-reminder') then perform cron.unschedule('event-reminder'); end if;
  perform cron.schedule('event-reminder', '15 * * * *', $job$
    select net.http_post(
      url := 'https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/event-reminder',
      headers := jsonb_build_object('Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public.get_secret('SUPABASE_SERVICE_ROLE_KEY'),
        'x-internal-secret', public.get_secret('CRON_SECRET')),
      body := '{}'::jsonb, timeout_milliseconds := 55000);
  $job$);
end $$;
