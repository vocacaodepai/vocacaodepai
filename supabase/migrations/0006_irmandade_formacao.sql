-- 0006_irmandade_formacao.sql — histórias, perguntas, respostas, eventos, trilhas, desafios, painel do membro

-- ---------- stories ----------
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
create index if not exists idx_stories_status on public.stories(status, created_at desc);
create index if not exists idx_stories_user on public.stories(user_id);
create or replace trigger trg_stories_updated before update on public.stories
  for each row execute function public.set_updated_at();

-- Guard genérico de status para conteúdo de membros (stories, questions)
create or replace function public.guard_member_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then new.status := 'pending';
    elsif new.status is distinct from old.status then raise exception 'Somente a moderação altera o status'; end if;
  end if;
  return new;
end; $$;
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
create policy "stories: own insert" on public.stories for insert with check ((select auth.uid()) = user_id);
drop policy if exists "stories: own update" on public.stories;
create policy "stories: own update" on public.stories for update using ((select auth.uid()) = user_id);
drop policy if exists "stories: staff update" on public.stories;
create policy "stories: staff update" on public.stories for update using ((select public.is_admin()));
drop policy if exists "stories: own or staff delete" on public.stories;
create policy "stories: own or staff delete" on public.stories
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

create or replace function public.moderate_story(p_story_id uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  update public.stories set status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else status end
  where id = p_story_id;
  insert into public.moderation_log (entity, entity_id, action, actor_id, note)
  values ('story', p_story_id::text, p_action, auth.uid(), p_reason);
  if p_action = 'approve' then
    perform public.award_badge((select user_id from public.stories where id = p_story_id), 'voz-da-irmandade');
  end if;
end; $$;
grant execute on function public.moderate_story(uuid, text, text) to authenticated;

-- ---------- questions / answers ----------
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
create index if not exists idx_questions_status on public.questions(status, created_at desc);
create index if not exists idx_questions_category on public.questions(category_id);
create index if not exists idx_questions_title_trgm on public.questions using gin(title gin_trgm_ops);
create or replace trigger trg_questions_updated before update on public.questions
  for each row execute function public.set_updated_at();
create or replace trigger trg_guard_question_status before insert or update on public.questions
  for each row execute function public.guard_member_status();
alter table public.questions enable row level security;
drop policy if exists "questions: public read approved" on public.questions;
create policy "questions: public read approved" on public.questions for select using (status in ('approved','closed'));
drop policy if exists "questions: own read" on public.questions;
create policy "questions: own read" on public.questions for select using ((select auth.uid()) = user_id);
drop policy if exists "questions: staff read" on public.questions;
create policy "questions: staff read" on public.questions for select using ((select public.is_admin()));
drop policy if exists "questions: own insert" on public.questions;
create policy "questions: own insert" on public.questions for insert with check ((select auth.uid()) = user_id);
drop policy if exists "questions: own update" on public.questions;
create policy "questions: own update" on public.questions for update using ((select auth.uid()) = user_id);
drop policy if exists "questions: staff update" on public.questions;
create policy "questions: staff update" on public.questions for update using ((select public.is_admin()));
drop policy if exists "questions: own or staff delete" on public.questions;
create policy "questions: own or staff delete" on public.questions
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

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
create index if not exists idx_answers_question on public.answers(question_id, status, created_at);
create or replace trigger trg_answers_updated before update on public.answers
  for each row execute function public.set_updated_at();
alter table public.answers enable row level security;
drop policy if exists "answers: public read approved" on public.answers;
create policy "answers: public read approved" on public.answers for select using (status = 'approved');
drop policy if exists "answers: own read" on public.answers;
create policy "answers: own read" on public.answers for select using ((select auth.uid()) = user_id);
drop policy if exists "answers: staff read" on public.answers;
create policy "answers: staff read" on public.answers for select using ((select public.is_admin()));
drop policy if exists "answers: own insert" on public.answers;
create policy "answers: own insert" on public.answers for insert with check ((select auth.uid()) = user_id);
drop policy if exists "answers: own update" on public.answers;
create policy "answers: own update" on public.answers for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "answers: staff update" on public.answers;
create policy "answers: staff update" on public.answers for update using ((select public.is_admin()));
drop policy if exists "answers: own or staff delete" on public.answers;
create policy "answers: own or staff delete" on public.answers
  for delete using ((select auth.uid()) = user_id or (select public.is_admin()));

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'questions_accepted_fk') then
    alter table public.questions
      add constraint questions_accepted_fk foreign key (accepted_answer_id) references public.answers(id) on delete set null;
  end if;
end $$;

create or replace function public.answers_count_sync()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.questions q set answers_count = (select count(*) from public.answers a where a.question_id = q.id and a.status = 'approved')
  where q.id = coalesce(new.question_id, old.question_id);
  return null;
end; $$;
create or replace trigger trg_answers_count after insert or update or delete on public.answers
  for each row execute function public.answers_count_sync();

create or replace function public.accept_answer(p_question_id uuid, p_answer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.questions where id = p_question_id and (user_id = auth.uid() or public.is_admin())) then
    raise exception 'Acesso negado';
  end if;
  update public.questions set accepted_answer_id = p_answer_id where id = p_question_id;
end; $$;
grant execute on function public.accept_answer(uuid, uuid) to authenticated;

-- ---------- events / event_rsvps ----------
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
alter table public.event_rsvps enable row level security;
drop policy if exists "event_rsvps: own all" on public.event_rsvps;
create policy "event_rsvps: own all" on public.event_rsvps
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "event_rsvps: staff read" on public.event_rsvps;
create policy "event_rsvps: staff read" on public.event_rsvps for select using ((select public.is_admin()));

create or replace function public.event_rsvp_count(p_event_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from public.event_rsvps where event_id = p_event_id and status = 'going';
$$;
grant execute on function public.event_rsvp_count(uuid) to anon, authenticated;

-- ---------- tracks / track_steps / track_progress ----------
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
alter table public.track_steps enable row level security;
drop policy if exists "track_steps: public read of published track" on public.track_steps;
create policy "track_steps: public read of published track" on public.track_steps
  for select using (exists (select 1 from public.tracks t where t.id = track_id and t.status = 'published') or (select public.is_admin()));
drop policy if exists "track_steps: staff all" on public.track_steps;
create policy "track_steps: staff all" on public.track_steps for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.track_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  step_id uuid not null references public.track_steps(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, step_id)
);
create index if not exists idx_track_progress_user_track on public.track_progress(user_id, track_id);
alter table public.track_progress enable row level security;
drop policy if exists "track_progress: own all" on public.track_progress;
create policy "track_progress: own all" on public.track_progress
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- award_badges(p_user_id uuid) returns setof text  (MOTOR DE REGRAS de badges.rule jsonb) e grant_badges_for_me():
-- criar AQUI, antes de complete_track_step, com o SQL literal do doc 09 §2.2 bloco 8 (depende de tracks, challenges,
-- stories, answers, events e, se existir, jobs). revoke de award_badges para anon/authenticated; grant de grant_badges_for_me a authenticated.

-- Motor de regras de insígnias (SQL literal do doc 09 §2.2 bloco 8)
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

create or replace function public.complete_track_step(p_step_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_track uuid; v_total integer; v_done integer;
begin
  select track_id into v_track from public.track_steps where id = p_step_id;
  insert into public.track_progress (user_id, track_id, step_id) values (auth.uid(), v_track, p_step_id) on conflict do nothing;
  select count(*) into v_total from public.track_steps where track_id = v_track;
  select count(*) into v_done from public.track_progress where user_id = auth.uid() and track_id = v_track;
  if v_done >= v_total then perform public.award_badges(auth.uid()); end if;   -- motor de regras (formador, filho-de-sao-jose…); o client também chama grant_badges_for_me()
end; $$;
grant execute on function public.complete_track_step(uuid) to authenticated;

-- ---------- challenges / challenge_days / challenge_progress ----------
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
alter table public.challenge_days enable row level security;
drop policy if exists "challenge_days: public read of published" on public.challenge_days;
create policy "challenge_days: public read of published" on public.challenge_days
  for select using (exists (select 1 from public.challenges c where c.id = challenge_id and c.status = 'published') or (select public.is_admin()));
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
create policy "challenge_progress: own all" on public.challenge_progress
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create or replace function public.complete_challenge_day(p_challenge_id uuid, p_day integer, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_days integer; v_done integer;
begin
  insert into public.challenge_progress (user_id, challenge_id, day, note) values (auth.uid(), p_challenge_id, p_day, p_note)
  on conflict (user_id, challenge_id, day) do update set note = excluded.note;
  select days into v_days from public.challenges where id = p_challenge_id;
  select count(*) into v_done from public.challenge_progress where user_id = auth.uid() and challenge_id = p_challenge_id;
  if v_done >= v_days then perform public.award_badges(auth.uid()); end if;    -- motor de regras (pai-presente, provedor, disciplina-de-ferro)
end; $$;
grant execute on function public.complete_challenge_day(uuid, integer, text) to authenticated;

-- ---------- get_member_dashboard (aqui porque depende de jobs/tracks/challenges) ----------
create or replace function public.get_member_dashboard()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', (select coalesce(jsonb_agg(to_jsonb(c) order by c.birth_date), '[]') from public.children c where c.user_id = auth.uid()),
    'badges', (select coalesce(jsonb_agg(jsonb_build_object('slug',b.slug,'name',b.name,'icon',b.icon,'earned_at',ub.earned_at)), '[]')
               from public.user_badges ub join public.badges b on b.id = ub.badge_id where ub.user_id = auth.uid()),
    'saved_count', (select count(*) from public.saved_items where user_id = auth.uid()),
    'tracks', (select coalesce(jsonb_agg(jsonb_build_object('track_id',t.id,'slug',t.slug,'title',t.title,
                 'done', (select count(*) from public.track_progress tp where tp.user_id = auth.uid() and tp.track_id = t.id),
                 'total', (select count(*) from public.track_steps ts where ts.track_id = t.id))), '[]')
               from public.tracks t where t.status = 'published'
                 and exists (select 1 from public.track_progress tp where tp.user_id = auth.uid() and tp.track_id = t.id)),
    'challenges', (select coalesce(jsonb_agg(jsonb_build_object('challenge_id',ch.id,'slug',ch.slug,'title',ch.title,'days',ch.days,
                 'done', (select count(*) from public.challenge_progress cp where cp.user_id = auth.uid() and cp.challenge_id = ch.id))), '[]')
               from public.challenges ch where ch.status = 'published'
                 and exists (select 1 from public.challenge_progress cp where cp.user_id = auth.uid() and cp.challenge_id = ch.id)),
    'jobs', (select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'slug',j.slug,'title',j.title,'status',j.status)), '[]')
             from public.jobs j where j.posted_by = auth.uid())
  );
$$;
grant execute on function public.get_member_dashboard() to authenticated;
