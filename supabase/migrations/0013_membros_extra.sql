-- =====================================================================
-- 0013_membros_extra.sql — Fase 5 (Área do Pai): complemento ADITIVO à
-- 0001_core (profiles, children, newsletter_subscribers) e à 0004_membros
-- (saved_items, badges, user_badges, plans, subscriptions), conforme doc 07 §2.2
-- adaptado ao SQL real (badges.rule jsonb, user_badges.earned_at, plans.price_cents,
-- saved_items.item_id text, newsletter_subscribers.segments jsonb OBJETO,
-- award_badges/grant_badges_for_me já criadas na 0006, get_member_dashboard na 0006).
-- Não cria tabela, não redefine is_admin(), não faz drop (só de policy/trigger).
-- Idempotente. Executar após 0001–0012.
-- =====================================================================

-- ---------- profiles: colunas da Fase 5 (aditivas) ----------
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists consent_terms_at timestamptz;
alter table public.profiles add column if not exists consent_privacy_at timestamptz;
alter table public.profiles add column if not exists last_seen_at timestamptz;

-- Reforço (além de guard_profile_role da 0001): ninguém altera o PRÓPRIO role,
-- e trocar o role de terceiro exige role = 'admin' (editor não basta) ou service_role.
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    if old.id = auth.uid() then
      raise exception 'Você não pode alterar o próprio papel.' using errcode = '42501';
    end if;
    if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Somente administradores alteram papéis.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_profile_role on public.profiles;
create trigger trg_protect_profile_role before update of role on public.profiles
  for each row execute function public.protect_profile_role();

-- perfil do usuário logado (evita SELECT direto na tabela pelo client)
create or replace function public.get_my_profile()
returns public.profiles language sql stable security definer set search_path = public as $$
  select * from public.profiles where id = auth.uid();
$$;
revoke all on function public.get_my_profile() from public, anon;
grant execute on function public.get_my_profile() to authenticated;

-- ---------- fases do filho (children já existe na 0001: sex in ('M','F') obrigatório) ----------
-- fase a partir da data de nascimento (futura = gestação). Espelho exato de src/lib/phases.ts.
create or replace function public.child_phase(p_birth_date date)
returns text language sql immutable as $$
  select case
    when p_birth_date is null then null
    when p_birth_date > current_date then 'gestacao'
    when p_birth_date > current_date - interval '4 months' then 'recem-nascido'
    when p_birth_date > current_date - interval '1 year' then 'bebe'
    when p_birth_date > current_date - interval '4 years' then 'primeira-infancia'
    when p_birth_date > current_date - interval '8 years' then 'infancia'
    when p_birth_date > current_date - interval '13 years' then 'pre-adolescencia'
    when p_birth_date > current_date - interval '18 years' then 'adolescencia'
    else 'adulto'
  end;
$$;
grant execute on function public.child_phase(date) to anon, authenticated;

-- fases de todos os filhos do usuário logado (distintas)
create or replace function public.my_child_phases()
returns setof text language sql stable security definer set search_path = public as $$
  select distinct public.child_phase(birth_date) from public.children where user_id = auth.uid();
$$;
grant execute on function public.my_child_phases() to authenticated;

-- ---------- newsletter_subscribers: leitura do próprio registro + confirmação/saída por token ----------
-- A 0001 já tem user_id, segments (jsonb OBJETO: {"frequencia","fases","interesses","origem",...}), status, confirm_token.
drop policy if exists "newsletter: own read" on public.newsletter_subscribers;
create policy "newsletter: own read" on public.newsletter_subscribers
  for select using ((select auth.uid()) = user_id);

create or replace function public.newsletter_confirm(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.newsletter_subscribers set status = 'confirmed', confirmed_at = coalesce(confirmed_at, now())
  where confirm_token = p_token and status <> 'unsubscribed';
  return found;
end $$;
grant execute on function public.newsletter_confirm(uuid) to anon, authenticated;

create or replace function public.newsletter_unsubscribe(p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.newsletter_subscribers set status = 'unsubscribed' where confirm_token = p_token;
  return found;
end $$;
grant execute on function public.newsletter_unsubscribe(uuid) to anon, authenticated;

-- ---------- plans: my_plan_slug / is_premium (seed dos 2 planos já está na 0004; pai-de-valor nasce active=false) ----------
create or replace function public.my_plan_slug()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.slug from public.subscriptions s join public.plans p on p.id = s.plan_id
      where s.user_id = auth.uid() and s.status in ('active','trialing')
        and (s.current_period_end is null or s.current_period_end > now())
      order by s.current_period_end desc nulls last limit 1),
    'gratuito');
$$;
grant execute on function public.my_plan_slug() to authenticated;

create or replace function public.is_premium()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_plan_slug() = 'pai-de-valor';
$$;
grant execute on function public.is_premium() to authenticated;

-- ---------- conteúdo por fase ----------
-- Convenção: tags.slug = 'fase-<slug_da_fase>' (fase-gestacao, fase-bebe, ...). tags vem da 0002 (doc 02 §4.2).
insert into public.tags (slug, name) values
  ('fase-gestacao','Gestação'),('fase-recem-nascido','Recém-nascido (0-3 meses)'),('fase-bebe','Bebê (4-12 meses)'),
  ('fase-primeira-infancia','1 a 3 anos'),('fase-infancia','4 a 7 anos'),('fase-pre-adolescencia','8 a 12 anos'),
  ('fase-adolescencia','13 a 17 anos'),('fase-adulto','Filho adulto'),('fase-todas','Todas as fases')
on conflict (slug) do nothing;

-- saved_items.item_id é text (0004): compara com p.id::text
create or replace function public.get_content_for_user(p_limit int default 12)
returns table (post_id uuid, slug text, title text, excerpt text, cover_image_url text,
               kind text, publish_at timestamptz, phase text)
language sql stable security definer set search_path = public as $$
  with phases as (select public.my_child_phases() as phase)
  select distinct on (p.id) p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.kind, p.publish_at,
         replace(t.slug, 'fase-', '') as phase
  from public.posts p
  join public.post_tags pt on pt.post_id = p.id
  join public.tags t on t.id = pt.tag_id
  where p.status = 'published' and (p.publish_at is null or p.publish_at <= now())
    and (replace(t.slug,'fase-','') in (select phase from phases) or t.slug = 'fase-todas')
    and p.id::text not in (select item_id from public.saved_items where user_id = auth.uid() and item_type = 'post')
  order by p.id, p.publish_at desc
  limit greatest(1, least(p_limit, 50));
$$;
grant execute on function public.get_content_for_user(int) to authenticated;

-- ---------- LGPD ----------
create or replace function public.export_my_data()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at,
                 'email_confirmed_at', u.email_confirmed_at, 'last_sign_in_at', u.last_sign_in_at)
                from auth.users u where u.id = auth.uid()),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = auth.uid()),
    'children', (select coalesce(jsonb_agg(to_jsonb(c)), '[]') from public.children c where c.user_id = auth.uid()),
    'saved_items', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.saved_items s where s.user_id = auth.uid()),
    'subscriptions', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from public.subscriptions s where s.user_id = auth.uid()),
    'badges', (select coalesce(jsonb_agg(jsonb_build_object('badge', b.slug, 'earned_at', ub.earned_at)), '[]')
               from public.user_badges ub join public.badges b on b.id = ub.badge_id where ub.user_id = auth.uid()),
    'newsletter', (select coalesce(jsonb_agg(to_jsonb(n) - 'confirm_token'), '[]')
                   from public.newsletter_subscribers n where n.user_id = auth.uid())
  );
$$;
revoke all on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_email text;
begin
  if v_uid is null then raise exception 'Não autenticado' using errcode = '42501'; end if;
  if exists (select 1 from public.profiles where id = v_uid and role = 'admin') then
    raise exception 'Administradores devem ser rebaixados antes da exclusão.' using errcode = '42501';
  end if;
  select email into v_email from auth.users where id = v_uid;
  -- descadastra newsletter (não apaga: mantém opt-out para não voltar a enviar)
  update public.newsletter_subscribers set status = 'unsubscribed', user_id = null where email = v_email;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (null, 'profiles', v_uid::text, 'self_delete', 'Exclusão de conta pelo titular (LGPD art. 18)');
  -- cascata: profiles, children, saved_items, subscriptions, user_badges...
  delete from auth.users where id = v_uid;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- admin: lista de membros (somente role = 'admin'; editor não vê) ----------
create or replace function public.admin_list_members(p_search text default null, p_limit int default 50, p_offset int default 0)
returns table (id uuid, email text, display_name text, role text, city text, uf text, onboarding_done boolean,
               newsletter_opt_in boolean, plan_slug text, children_count bigint, created_at timestamptz, last_sign_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, u.email::text, p.display_name, p.role, p.city, p.uf::text, p.onboarding_done, p.newsletter_opt_in,
         coalesce((select pl.slug from public.subscriptions s join public.plans pl on pl.id = s.plan_id
                   where s.user_id = p.id and s.status in ('active','trialing') limit 1), 'gratuito'),
         (select count(*) from public.children c where c.user_id = p.id),
         p.created_at, u.last_sign_in_at
  from public.profiles p join auth.users u on u.id = p.id
  where exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
    and (p_search is null or u.email ilike '%'||p_search||'%' or p.display_name ilike '%'||p_search||'%')
  order by p.created_at desc
  limit least(greatest(p_limit,1),200) offset greatest(p_offset,0);
$$;
revoke all on function public.admin_list_members(text,int,int) from public, anon;
grant execute on function public.admin_list_members(text,int,int) to authenticated;

create or replace function public.admin_member_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin') then
    jsonb_build_object(
      'total', (select count(*) from public.profiles),
      'new_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
      'onboarding_done', (select count(*) from public.profiles where onboarding_done),
      'newsletter_confirmed', (select count(*) from public.newsletter_subscribers where status = 'confirmed'),
      'premium', (select count(distinct s.user_id) from public.subscriptions s join public.plans p on p.id = s.plan_id
                  where s.status in ('active','trialing') and p.slug <> 'gratuito')
    ) else null end;
$$;
revoke all on function public.admin_member_stats() from public, anon;
grant execute on function public.admin_member_stats() to authenticated;

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin') then
    raise exception 'Acesso restrito a administradores' using errcode = '42501';
  end if;
  if p_user = auth.uid() then raise exception 'Não altere o próprio papel' using errcode = '42501'; end if;
  if p_role not in ('member','editor','admin') then raise exception 'Papel inválido'; end if;
  update public.profiles set role = p_role where id = p_user;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'profiles', p_user::text, 'set_role', p_role);
end $$;
revoke all on function public.admin_set_role(uuid,text) from public, anon;
grant execute on function public.admin_set_role(uuid,text) to authenticated;

-- Sem pg_cron aqui: o resumo semanal é POST /api/newsletter/weekly (Authorization: Bearer CRON_SECRET),
-- agendado por .github/workflows/newsletter-weekly.yml (doc 02 §8: CRON_SECRET é o único segredo de cron).
