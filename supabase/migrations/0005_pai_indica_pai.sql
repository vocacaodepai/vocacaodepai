-- 0005_pai_indica_pai.sql — vagas, indicações (profissional/serviço/empresa), profissionais e mentoria
-- Modelo de dados = doc 08 §2.2 (fonte do SQL completo: triggers antifraude, renew_*, report_entity, block_user, jobs_public).
-- moderation_log.entity_id é TEXT (0001): toda inserção converte o uuid com ::text.

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (length(title) between 5 and 120),
  company text not null,
  city text,
  uf char(2) check (uf is null or uf ~ '^[A-Z]{2}$'),
  remote boolean not null default false,
  type text not null check (type in ('clt','pj','freela','estagio','temporario')),
  salary_min numeric(10,2),
  salary_max numeric(10,2),
  description text not null check (length(description) between 50 and 8000),
  how_to_apply text,
  contact_email text,
  contact_url text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  expires_at timestamptz not null default (now() + interval '45 days'),
  posted_by uuid references public.profiles(id) on delete set null,
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_contact check (contact_email is not null or contact_url is not null or how_to_apply is not null),
  constraint jobs_salary_sane check (salary_min is null or salary_max is null or salary_max >= salary_min)
);
create index if not exists idx_jobs_status_expires on public.jobs(status, expires_at desc);
create index if not exists idx_jobs_uf_city on public.jobs(uf, city);
create index if not exists idx_jobs_posted_by on public.jobs(posted_by);
create index if not exists idx_jobs_title_trgm on public.jobs using gin(title gin_trgm_ops);
create or replace trigger trg_jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();

-- Membro não pode se auto-aprovar nem mexer em campos de moderação
create or replace function public.guard_job_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() and auth.role() <> 'service_role' then
    if tg_op = 'INSERT' then
      new.status := 'pending'; new.moderated_by := null; new.moderated_at := null; new.views := 0;
    elsif new.status is distinct from old.status or new.moderated_by is distinct from old.moderated_by then
      raise exception 'Somente a moderação altera o status da vaga';
    end if;
  end if;
  return new;
end; $$;
create or replace trigger trg_guard_job_status before insert or update on public.jobs
  for each row execute function public.guard_job_status();

alter table public.jobs enable row level security;
drop policy if exists "jobs: public read approved" on public.jobs;
create policy "jobs: public read approved" on public.jobs
  for select using (status = 'approved' and expires_at > now());
drop policy if exists "jobs: own read" on public.jobs;
create policy "jobs: own read" on public.jobs for select using ((select auth.uid()) = posted_by);
drop policy if exists "jobs: staff read" on public.jobs;
create policy "jobs: staff read" on public.jobs for select using ((select public.is_admin()));
drop policy if exists "jobs: auth insert own" on public.jobs;
create policy "jobs: auth insert own" on public.jobs for insert with check ((select auth.uid()) = posted_by);
drop policy if exists "jobs: own update pending" on public.jobs;
create policy "jobs: own update pending" on public.jobs
  for update using ((select auth.uid()) = posted_by and status in ('pending','rejected'));
drop policy if exists "jobs: staff update" on public.jobs;
create policy "jobs: staff update" on public.jobs for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "jobs: staff delete" on public.jobs;
create policy "jobs: staff delete" on public.jobs for delete using ((select public.is_admin()));

create or replace function public.moderate_job(p_job_id uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso negado'; end if;
  update public.jobs set
    status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' when 'expire' then 'expired' else status end,
    moderated_by = auth.uid(), moderated_at = now()
  where id = p_job_id;
  insert into public.moderation_log (entity, entity_id, action, actor_id, note)
  values ('job', p_job_id::text, p_action, auth.uid(), p_reason);
  if p_action = 'approve' then
    perform public.award_badge((select posted_by from public.jobs where id = p_job_id), 'pai-que-indica');
  end if;
end; $$;
grant execute on function public.moderate_job(uuid, text, text) to authenticated;

create or replace function public.increment_job_views(p_job_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.jobs set views = views + 1 where id = p_job_id and status = 'approved';
$$;
grant execute on function public.increment_job_views(uuid) to anon, authenticated;

-- Expiração (doc 08 §2.6): vagas (45 dias) e indicações (90 dias). Agendada UMA vez, pelo pg_cron vdp-expire-jobs em 0008_cron.sql;
-- disparo manual pela rota /api/cron/expire-jobs (Authorization: Bearer CRON_SECRET). Sem edge function, sem Vercel Cron, sem workflow.
create or replace function public.expire_jobs() returns table (expired_jobs int, expired_referrals int)
language plpgsql security definer set search_path = public as $$
declare a int; b int;
begin
  with u as (update public.jobs set status = 'expired' where status = 'approved' and expires_at < now() returning id)
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  select null, 'job', id::text, 'expire', 'expirada automaticamente' from u;
  get diagnostics a = row_count;
  with u as (update public.job_referrals set status = 'expired' where status = 'approved' and expires_at < now() returning id)
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  select null, 'job_referral', id::text, 'expire', 'expirada automaticamente' from u;
  get diagnostics b = row_count;
  return query select a, b;
end $$;
revoke all on function public.expire_jobs() from public, anon, authenticated;

-- ---------- helpers de autorização (doc 08 §2.1 e §2.3) ----------
alter table public.profiles
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text;

create or replace function public.email_verified() returns boolean
language sql stable security definer set search_path = public, auth as $$
  select coalesce((select u.email_confirmed_at is not null from auth.users u where u.id = auth.uid()), false);
$$;

create or replace function public.is_blocked() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.blocked_at is not null from public.profiles p where p.id = auth.uid()), false);
$$;

-- Pode publicar? logado + e-mail verificado + não bloqueado
create or replace function public.can_publish() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and public.email_verified() and not public.is_blocked();
$$;
grant execute on function public.email_verified() to anon, authenticated;
grant execute on function public.is_blocked() to anon, authenticated;
grant execute on function public.can_publish() to anon, authenticated;

-- ---------- job_referrals = indicações de PROFISSIONAL, SERVIÇO ou EMPRESA (rota /pai-indica-pai/indicacoes) ----------
-- (não é "indicação de candidato a uma vaga"; colunas = briefing COLUNAS-CHAVE + adicionais do doc 08 §2.2)
create table if not exists public.job_referrals (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,                              -- adicional
  kind             text not null check (kind in ('profissional','servico','empresa')),
  title            text not null check (char_length(title) between 3 and 120),
  category         text not null,                                     -- chave de JOB_AREAS ou texto livre curto
  city             text,
  uf               char(2),
  description      text not null check (char_length(description) between 50 and 4000),
  contact_phone    text,
  contact_email    text,
  contact_url      text,
  consent_contact  boolean not null default false,                    -- adicional
  referred_by      uuid references public.profiles(id) on delete set null,     -- LGPD: apagar a conta não apaga a indicação aprovada
  status           text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  rejection_reason text,                                              -- adicional
  auto_hidden      boolean not null default false,                    -- adicional
  report_count     int not null default 0,                            -- adicional
  renewed_count    int not null default 0,                            -- adicional
  expires_at       timestamptz,                                       -- adicional (90 dias)
  moderated_by     uuid references public.profiles(id) on delete set null,  -- adicional
  moderated_at     timestamptz,                                       -- adicional
  views            int not null default 0,                            -- adicional
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()                 -- adicional
);
create index if not exists job_referrals_public_idx on public.job_referrals (status, kind, uf) where status = 'approved';
create index if not exists job_referrals_by_idx on public.job_referrals (referred_by, created_at desc);
create or replace trigger trg_job_referrals_updated before update on public.job_referrals
  for each row execute function public.set_updated_at();

-- ---------- professionals = diretório "Pai Profissional"; is_mentor liga a frente Mentoria ----------
create table if not exists public.professionals (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null unique references public.profiles(id) on delete cascade,
  slug             text not null unique,                              -- adicional
  profession       text not null check (char_length(profession) between 3 and 80),
  area             text,                                              -- adicional (JOB_AREAS)
  description      text not null check (char_length(description) between 50 and 3000),
  city             text,
  uf               char(2),
  remote           boolean not null default false,
  contact_phone    text,
  contact_email    text,
  contact_url      text,
  consent_contact  boolean not null default false,                    -- adicional
  is_mentor        boolean not null default false,                    -- adicional (frente Mentoria)
  mentor_areas     text[] not null default '{}',                      -- adicional (chaves de MENTORSHIP_AREAS)
  mentor_capacity  int not null default 2 check (mentor_capacity between 0 and 10), -- adicional
  status           text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  rejection_reason text,                                              -- adicional
  auto_hidden      boolean not null default false,                    -- adicional
  report_count     int not null default 0,                            -- adicional
  moderated_by     uuid references public.profiles(id) on delete set null,  -- adicional
  moderated_at     timestamptz,                                       -- adicional
  views            int not null default 0,                            -- adicional
  created_at       timestamptz not null default now(),                -- adicional
  updated_at       timestamptz not null default now()                 -- adicional
);
create index if not exists professionals_public_idx on public.professionals (status, area, uf) where status = 'approved';
create index if not exists professionals_mentor_idx on public.professionals (is_mentor) where status = 'approved' and is_mentor;
create or replace trigger trg_professionals_updated before update on public.professionals
  for each row execute function public.set_updated_at();

-- ---------- mentorships = pedido do MENTORADO a um professionals.is_mentor aprovado ----------
create table if not exists public.mentorships (
  id          uuid primary key default gen_random_uuid(),
  mentor_id   uuid not null references public.profiles(id) on delete cascade,
  mentee_id   uuid not null references public.profiles(id) on delete cascade,
  area        text not null,
  status      text not null default 'requested' check (status in ('requested','accepted','declined','completed','cancelled')),
  message     text not null check (char_length(message) between 30 and 1500),
  reply       text,                                                   -- adicional (resposta do mentor)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),                     -- adicional
  constraint mentorships_not_self check (mentor_id <> mentee_id)
);
-- um pedido ativo por par mentor/mentorado
create unique index if not exists mentorships_active_pair_uniq
  on public.mentorships (mentor_id, mentee_id) where status in ('requested','accepted');
create index if not exists mentorships_mentor_idx on public.mentorships (mentor_id, status);
create index if not exists mentorships_mentee_idx on public.mentorships (mentee_id, status);
create or replace trigger trg_mentorships_updated before update on public.mentorships
  for each row execute function public.set_updated_at();

-- ---------- RLS (doc 08 §2.7) ----------
alter table public.job_referrals enable row level security;
alter table public.professionals enable row level security;
alter table public.mentorships enable row level security;

-- job_referrals
drop policy if exists "referrals public read" on public.job_referrals;
create policy "referrals public read" on public.job_referrals for select
  using (status = 'approved' and (expires_at is null or expires_at > now()));
drop policy if exists "referrals owner read" on public.job_referrals;
create policy "referrals owner read" on public.job_referrals for select using (referred_by = auth.uid());
drop policy if exists "referrals admin all" on public.job_referrals;
create policy "referrals admin all" on public.job_referrals for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "referrals owner insert" on public.job_referrals;
create policy "referrals owner insert" on public.job_referrals for insert
  with check (referred_by = auth.uid() and public.can_publish() and status = 'pending');
drop policy if exists "referrals owner update" on public.job_referrals;
create policy "referrals owner update" on public.job_referrals for update
  using (referred_by = auth.uid()) with check (referred_by = auth.uid());
drop policy if exists "referrals owner delete" on public.job_referrals;
create policy "referrals owner delete" on public.job_referrals for delete using (referred_by = auth.uid());

-- professionals
drop policy if exists "professionals public read" on public.professionals;
create policy "professionals public read" on public.professionals for select using (status = 'approved');
drop policy if exists "professionals owner read" on public.professionals;
create policy "professionals owner read" on public.professionals for select using (user_id = auth.uid());
drop policy if exists "professionals admin all" on public.professionals;
create policy "professionals admin all" on public.professionals for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "professionals owner insert" on public.professionals;
create policy "professionals owner insert" on public.professionals for insert
  with check (user_id = auth.uid() and public.can_publish() and status = 'pending');
drop policy if exists "professionals owner update" on public.professionals;
create policy "professionals owner update" on public.professionals for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "professionals owner delete" on public.professionals;
create policy "professionals owner delete" on public.professionals for delete using (user_id = auth.uid());

-- mentorships: só as partes e o admin enxergam
drop policy if exists "mentorships parties read" on public.mentorships;
create policy "mentorships parties read" on public.mentorships for select
  using (mentor_id = auth.uid() or mentee_id = auth.uid() or public.is_admin());
drop policy if exists "mentorships mentee insert" on public.mentorships;
create policy "mentorships mentee insert" on public.mentorships for insert
  with check (
    mentee_id = auth.uid() and public.can_publish() and status = 'requested'
    and exists (select 1 from public.professionals p where p.user_id = mentor_id and p.status = 'approved' and p.is_mentor)
    and (select count(*) from public.mentorships m where m.mentor_id = mentorships.mentor_id and m.status = 'accepted')
        < (select p.mentor_capacity from public.professionals p where p.user_id = mentorships.mentor_id)
  );
drop policy if exists "mentorships mentee cancel" on public.mentorships;
create policy "mentorships mentee cancel" on public.mentorships for update
  using (mentee_id = auth.uid() and status = 'requested') with check (mentee_id = auth.uid() and status = 'cancelled');
drop policy if exists "mentorships admin all" on public.mentorships;
create policy "mentorships admin all" on public.mentorships for all using (public.is_admin()) with check (public.is_admin());
-- aceite/recusa do mentor só via respond_mentorship()

-- ---------- moderação e resposta de mentoria (doc 08 §2.6; entity_id convertido para text) ----------
create or replace function public.moderate_referral(p_id uuid, p_status text, p_reason text default null)
returns public.job_referrals language plpgsql security definer set search_path = public as $$
declare v public.job_referrals;
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  if p_status not in ('approved','rejected') then raise exception 'STATUS_INVALIDO'; end if;
  if p_status = 'rejected' and (p_reason is null or char_length(p_reason) < 10) then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  update public.job_referrals set
    status = p_status, moderated_by = auth.uid(), moderated_at = now(), auto_hidden = false,
    rejection_reason = case when p_status = 'rejected' then p_reason else null end,
    expires_at = case when p_status = 'approved' then now() + interval '90 days' else expires_at end
  where id = p_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'job_referral', p_id::text, case when p_status = 'approved' then 'approve' else 'reject' end, p_reason);
  return v;
end $$;

create or replace function public.moderate_professional(p_id uuid, p_status text, p_reason text default null)
returns public.professionals language plpgsql security definer set search_path = public as $$
declare v public.professionals;
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  if p_status not in ('approved','rejected') then raise exception 'STATUS_INVALIDO'; end if;
  if p_status = 'rejected' and (p_reason is null or char_length(p_reason) < 10) then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  update public.professionals set
    status = p_status, moderated_by = auth.uid(), moderated_at = now(), auto_hidden = false,
    rejection_reason = case when p_status = 'rejected' then p_reason else null end
  where id = p_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'professional', p_id::text, case when p_status = 'approved' then 'approve' else 'reject' end, p_reason);
  return v;
end $$;

grant execute on function public.moderate_referral(uuid, text, text) to authenticated;
grant execute on function public.moderate_professional(uuid, text, text) to authenticated;

-- Aceite/recusa de mentoria pelo mentor
create or replace function public.respond_mentorship(p_id uuid, p_status text, p_reply text default null) returns public.mentorships
language plpgsql security definer set search_path = public as $$
declare v public.mentorships;
begin
  if p_status not in ('accepted','declined','completed') then raise exception 'STATUS_INVALIDO'; end if;
  update public.mentorships set status = p_status, reply = coalesce(p_reply, reply)
  where id = p_id and mentor_id = auth.uid() and status in ('requested','accepted') returning * into v;
  if v.id is null then raise exception 'NAO_ENCONTRADA'; end if;
  return v;
end $$;
grant execute on function public.respond_mentorship(uuid, text, text) to authenticated;

-- Demais funções desta fase (renew_job, renew_referral, report_entity, block_user, pip_enforce_daily_limit,
-- pip_reset_status_on_edit, view jobs_public): SQL completo no doc 08 §2.2, sempre com `entity_id = p_entity_id::text`.
