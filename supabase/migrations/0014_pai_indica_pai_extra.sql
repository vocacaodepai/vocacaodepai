-- 0014_pai_indica_pai_extra.sql — Fase 6 (doc 08): o que a 0005 deixou para "o SQL completo do doc 08 §2.2".
-- Idempotente. Tudo que mexe em moderation_log usa entity_id::text (0001).
-- Conteúdo: colunas extras de jobs (área, WhatsApp, LGPD, denúncias, renovação, métricas, busca),
-- rate limit diário (3 publicações/24h), reset de status na edição (indicações/profissionais),
-- renew_job, renew_referral, report_entity, block_user, track_job_apply_click, moderate_job com motivo
-- e prazo contado da aprovação, exclusão pelo autor (LGPD), views jobs_public e pip_metrics_daily.

-- ---------- 1. jobs: colunas adicionais do doc 08 §2.4 ----------
alter table public.jobs
  add column if not exists area text,
  add column if not exists contact_phone text,
  add column if not exists consent_contact boolean not null default false,
  add column if not exists rejection_reason text,
  add column if not exists auto_hidden boolean not null default false,
  add column if not exists report_count int not null default 0,
  add column if not exists renewed_count int not null default 0,
  add column if not exists apply_clicks int not null default 0;

alter table public.jobs
  add column if not exists search_content tsvector generated always as (
    to_tsvector('portuguese',
      coalesce(title, '') || ' ' || coalesce(company, '') || ' ' || coalesce(city, '') || ' ' || coalesce(description, ''))
  ) stored;

create index if not exists jobs_search_idx on public.jobs using gin (search_content);
create index if not exists jobs_uf_area_idx on public.jobs (uf, area) where status = 'approved';
-- duplicidade título+empresa entre ativos (doc 08 §7.5)
create unique index if not exists jobs_title_company_active_uniq
  on public.jobs (lower(title), lower(company)) where status in ('pending', 'approved');

-- Remoção a pedido (LGPD, doc 08 §1.6): o autor apaga a própria vaga.
drop policy if exists "jobs: own delete" on public.jobs;
create policy "jobs: own delete" on public.jobs for delete using ((select auth.uid()) = posted_by);

-- ---------- 2. Rate limit: 3 publicações/24h por usuário (jobs + job_referrals + professionals) ----------
create or replace function public.pip_enforce_daily_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
begin
  if v_uid is null or public.is_admin() or auth.role() = 'service_role' then return new; end if;
  select (select count(*) from public.jobs where posted_by = v_uid and created_at > now() - interval '24 hours')
       + (select count(*) from public.job_referrals where referred_by = v_uid and created_at > now() - interval '24 hours')
       + (select count(*) from public.professionals where user_id = v_uid and created_at > now() - interval '24 hours')
    into v_count;
  if v_count >= 3 then
    raise exception 'LIMITE_DIARIO: você já publicou 3 itens nas últimas 24 horas. Tente novamente amanhã.'
      using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists jobs_daily_limit on public.jobs;
create trigger jobs_daily_limit before insert on public.jobs for each row execute function public.pip_enforce_daily_limit();
drop trigger if exists job_referrals_daily_limit on public.job_referrals;
create trigger job_referrals_daily_limit before insert on public.job_referrals for each row execute function public.pip_enforce_daily_limit();
drop trigger if exists professionals_daily_limit on public.professionals;
create trigger professionals_daily_limit before insert on public.professionals for each row execute function public.pip_enforce_daily_limit();

-- ---------- 3. Edição pelo autor: campos de moderação intocáveis; editar aprovado volta para a fila ----------
-- (jobs já tem guard_job_status na 0005 e o autor só edita pending/rejected.)
create or replace function public.pip_reset_status_on_edit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or auth.role() = 'service_role' then return new; end if;
  new.status := old.status; new.moderated_by := old.moderated_by; new.moderated_at := old.moderated_at;
  new.rejection_reason := old.rejection_reason; new.auto_hidden := old.auto_hidden;
  new.report_count := old.report_count; new.renewed_count := old.renewed_count; new.expires_at := old.expires_at;
  new.views := old.views;
  if old.status = 'approved' and row(new.title, new.description, new.contact_email, new.contact_url, new.contact_phone)
     is distinct from row(old.title, old.description, old.contact_email, old.contact_url, old.contact_phone) then
    new.status := 'pending';
  end if;
  return new;
end $$;
drop trigger if exists job_referrals_reset_on_edit on public.job_referrals;
create trigger job_referrals_reset_on_edit before update on public.job_referrals for each row execute function public.pip_reset_status_on_edit();

create or replace function public.pip_reset_professional_on_edit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() or auth.role() = 'service_role' then return new; end if;
  new.moderated_by := old.moderated_by; new.moderated_at := old.moderated_at; new.rejection_reason := old.rejection_reason;
  new.auto_hidden := old.auto_hidden; new.report_count := old.report_count; new.views := old.views;
  if new.status = 'archived' then return new; end if;        -- autor pode arquivar
  new.status := old.status;
  if old.status = 'approved' and row(new.profession, new.description, new.contact_email, new.contact_url, new.contact_phone)
     is distinct from row(old.profession, old.description, old.contact_email, old.contact_url, old.contact_phone) then
    new.status := 'pending';
  end if;
  return new;
end $$;
drop trigger if exists professionals_reset_on_edit on public.professionals;
create trigger professionals_reset_on_edit before update on public.professionals for each row execute function public.pip_reset_professional_on_edit();

-- ---------- 4. moderate_job: mesma assinatura da 0005, agora com motivo, prazo a partir da aprovação e auto_hidden ----------
create or replace function public.moderate_job(p_job_id uuid, p_action text, p_reason text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  if p_action not in ('approve', 'reject', 'expire') then raise exception 'STATUS_INVALIDO'; end if;
  if p_action = 'reject' and (p_reason is null or char_length(p_reason) < 10) then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  update public.jobs set
    status = case p_action when 'approve' then 'approved' when 'reject' then 'rejected' else 'expired' end,
    moderated_by = auth.uid(), moderated_at = now(), auto_hidden = false,
    rejection_reason = case when p_action = 'reject' then p_reason else null end,
    expires_at = case when p_action = 'approve' then now() + interval '45 days' else expires_at end
  where id = p_job_id;
  insert into public.moderation_log (entity, entity_id, action, actor_id, note)
  values ('job', p_job_id::text, p_action, auth.uid(), p_reason);
  if p_action = 'approve' then
    perform public.award_badge((select posted_by from public.jobs where id = p_job_id), 'pai-que-indica');
  end if;
end; $$;
grant execute on function public.moderate_job(uuid, text, text) to authenticated;

-- ---------- 5. Renovação pelo autor ----------
create or replace function public.renew_job(p_job_id uuid) returns public.jobs
language plpgsql security definer set search_path = public as $$
declare v public.jobs;
begin
  select * into v from public.jobs where id = p_job_id and posted_by = auth.uid();
  if v.id is null then raise exception 'NAO_ENCONTRADA'; end if;
  if v.status not in ('approved', 'expired') then raise exception 'SO_APROVADA_OU_EXPIRADA'; end if;
  if v.expires_at > now() + interval '7 days' then raise exception 'AINDA_NAO_RENOVAVEL'; end if;
  if v.expires_at < now() - interval '30 days' then raise exception 'EXPIRADA_HA_MUITO_TEMPO'; end if;
  update public.jobs set
    renewed_count = renewed_count + 1,
    status = case when renewed_count >= 3 then 'pending' else 'approved' end,
    expires_at = greatest(now(), expires_at) + interval '45 days'
  where id = p_job_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'job', p_job_id::text, 'renew', 'renovação nº ' || v.renewed_count);
  return v;
end $$;
grant execute on function public.renew_job(uuid) to authenticated;

create or replace function public.renew_referral(p_id uuid) returns public.job_referrals
language plpgsql security definer set search_path = public as $$
declare v public.job_referrals;
begin
  select * into v from public.job_referrals where id = p_id and referred_by = auth.uid();
  if v.id is null then raise exception 'NAO_ENCONTRADA'; end if;
  if v.status not in ('approved', 'expired') then raise exception 'SO_APROVADA_OU_EXPIRADA'; end if;
  if v.expires_at > now() + interval '14 days' then raise exception 'AINDA_NAO_RENOVAVEL'; end if;
  update public.job_referrals set
    renewed_count = renewed_count + 1,
    status = case when renewed_count >= 1 then 'pending' else 'approved' end,
    expires_at = greatest(now(), coalesce(expires_at, now())) + interval '90 days'
  where id = p_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'job_referral', p_id::text, 'renew', 'renovação nº ' || v.renewed_count);
  return v;
end $$;
grant execute on function public.renew_referral(uuid) to authenticated;

-- ---------- 6. Denúncia (anônimo ou logado); 3 denúncias escondem até revisão ----------
create or replace function public.report_entity(p_entity text, p_entity_id uuid, p_reason text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if p_entity not in ('job', 'job_referral', 'professional') then raise exception 'ENTIDADE_INVALIDA'; end if;
  if p_reason not in ('golpe', 'vaga_falsa', 'conteudo_improprio', 'discriminacao', 'spam', 'outro') then raise exception 'MOTIVO_INVALIDO'; end if;
  if auth.uid() is not null and exists (
    select 1 from public.moderation_log
    where entity = p_entity and entity_id = p_entity_id::text and action = 'report' and actor_id = auth.uid()
  ) then return; end if;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), p_entity, p_entity_id::text, 'report', p_reason || coalesce(': ' || left(p_note, 500), ''));
  if p_entity = 'job' then
    update public.jobs set report_count = report_count + 1 where id = p_entity_id returning report_count into v_count;
    if v_count >= 3 then update public.jobs set status = 'pending', auto_hidden = true where id = p_entity_id and status = 'approved'; end if;
  elsif p_entity = 'job_referral' then
    update public.job_referrals set report_count = report_count + 1 where id = p_entity_id returning report_count into v_count;
    if v_count >= 3 then update public.job_referrals set status = 'pending', auto_hidden = true where id = p_entity_id and status = 'approved'; end if;
  else
    update public.professionals set report_count = report_count + 1 where id = p_entity_id returning report_count into v_count;
    if v_count >= 3 then update public.professionals set status = 'pending', auto_hidden = true where id = p_entity_id and status = 'approved'; end if;
  end if;
  if v_count = 3 then
    insert into public.moderation_log (actor_id, entity, entity_id, action, note)
    values (null, p_entity, p_entity_id::text, 'auto_hide', '3 denúncias');
  end if;
end $$;
grant execute on function public.report_entity(text, uuid, text, text) to anon, authenticated;

-- ---------- 7. Métrica de candidatura ----------
create or replace function public.track_job_apply_click(p_job_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.jobs set apply_clicks = apply_clicks + 1 where id = p_job_id and status = 'approved';
$$;
grant execute on function public.track_job_apply_click(uuid) to anon, authenticated;

-- ---------- 8. Bloqueio de usuário (admin): tira do ar tudo que ele publicou ----------
create or replace function public.block_user(p_user_id uuid, p_reason text, p_block boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  update public.profiles set blocked_at = case when p_block then now() else null end,
                             blocked_reason = case when p_block then p_reason else null end
  where id = p_user_id;
  if p_block then
    update public.jobs set status = 'rejected', rejection_reason = 'Usuário bloqueado: ' || p_reason
      where posted_by = p_user_id and status in ('pending', 'approved');
    update public.job_referrals set status = 'rejected', rejection_reason = 'Usuário bloqueado: ' || p_reason
      where referred_by = p_user_id and status in ('pending', 'approved');
    update public.professionals set status = 'rejected', rejection_reason = 'Usuário bloqueado: ' || p_reason
      where user_id = p_user_id and status in ('pending', 'approved');
  end if;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'profile', p_user_id::text, case when p_block then 'block' else 'unblock' end, p_reason);
end $$;
grant execute on function public.block_user(uuid, text, boolean) to authenticated;

-- ---------- 9. Views ----------
-- Lista pública enxuta (sem posted_by, sem contato) — listas, RSS, sitemap e digest.
create or replace view public.jobs_public with (security_invoker = on) as
  select j.id, j.slug, j.title, j.company, j.city, j.uf, j.remote, j.type, j.area, j.salary_min, j.salary_max,
         left(j.description, 240) as summary, j.expires_at, j.moderated_at as published_at, j.views,
         j.created_at, j.updated_at
  from public.jobs j
  where j.status = 'approved' and j.expires_at > now();
grant select on public.jobs_public to anon, authenticated;

-- Métricas diárias para o admin e o Painel Lisieux (doc 08 §9).
create or replace view public.pip_metrics_daily with (security_invoker = on) as
  select date_trunc('day', created_at)::date as day,
         count(*) filter (where status = 'pending') as pending,
         count(*) filter (where status = 'approved') as approved,
         count(*) filter (where status = 'rejected') as rejected,
         sum(views) as views, sum(apply_clicks) as apply_clicks
  from public.jobs group by 1 order by 1 desc;
grant select on public.pip_metrics_daily to authenticated;
