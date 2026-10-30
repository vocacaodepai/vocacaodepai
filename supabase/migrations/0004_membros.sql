-- 0004_membros.sql — Área do Pai: itens salvos, badges, planos, assinaturas

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('post','product','tool','job','track')),
  item_id text not null,              -- uuid em texto OU slug (ferramentas salvam o slug — doc 06 §1.3)
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists idx_saved_items_user on public.saved_items(user_id, item_type);
alter table public.saved_items enable row level security;
drop policy if exists "saved_items: own all" on public.saved_items;
create policy "saved_items: own all" on public.saved_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  rule jsonb not null default '{}'::jsonb,   -- {"type": "...", "min": N, "slug": "..."} — motor award_badges() (doc 09 §2.2 bloco 8)
  created_at timestamptz not null default now()
);
alter table public.badges enable row level security;
drop policy if exists "badges: public read" on public.badges;
create policy "badges: public read" on public.badges for select using (true);
drop policy if exists "badges: staff write" on public.badges;
create policy "badges: staff write" on public.badges for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);
alter table public.user_badges enable row level security;
drop policy if exists "user_badges: public read" on public.user_badges;
create policy "user_badges: public read" on public.user_badges for select using (true);
-- Escrita só por funções security definer (award_badge / award_badges) ou service_role.

-- award_badge(uuid, text): concessão DIRETA por slug (usada por complete_onboarding, moderate_job, moderate_story).
-- award_badges(p_user_id uuid) returns setof text: MOTOR DE REGRAS que lê badges.rule e devolve só as insígnias novas;
-- grant_badges_for_me(): atalho do client (= award_badges(auth.uid())). As duas últimas dependem de tracks/challenges/
-- stories/answers/events e por isso são criadas na 0006 (§4.6), com o SQL do doc 09 §2.2 bloco 8.
create or replace function public.award_badge(p_user_id uuid, p_badge_slug text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_user_id is null then return; end if;
  insert into public.user_badges (user_id, badge_id)
  select p_user_id, b.id from public.badges b where b.slug = p_badge_slug
  on conflict do nothing;
end; $$;
revoke all on function public.award_badge(uuid, text) from public, anon, authenticated;

-- Onboarding: marca concluído e dá a primeira badge
create or replace function public.complete_onboarding()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set onboarding_done = true where id = auth.uid();
  perform public.award_badge(auth.uid(), 'primeiro-passo');
end; $$;
grant execute on function public.complete_onboarding() to authenticated;

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  price_cents integer not null default 0,
  interval text not null default 'month' check (interval in ('month','year')),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.plans enable row level security;
drop policy if exists "plans: public read active" on public.plans;
create policy "plans: public read active" on public.plans for select using (active = true);
drop policy if exists "plans: staff write" on public.plans;
create policy "plans: staff write" on public.plans for all using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active' check (status in ('active','past_due','canceled','trialing')),
  provider text check (provider in ('mercadopago','manual')),
  provider_ref text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id, status);
create or replace trigger trg_subscriptions_updated before update on public.subscriptions
  for each row execute function public.set_updated_at();
alter table public.subscriptions enable row level security;
drop policy if exists "subscriptions: own read" on public.subscriptions;
create policy "subscriptions: own read" on public.subscriptions for select using ((select auth.uid()) = user_id);
drop policy if exists "subscriptions: staff all" on public.subscriptions;
create policy "subscriptions: staff all" on public.subscriptions for all using ((select public.is_admin())) with check ((select public.is_admin()));

-- Planos (nomes ÚNICOS em todo o plano: doc 07 §7, doc 11 §6, checklist 5.9 usam estes slugs):
insert into public.plans (slug, name, description, price_cents, interval, features, active) values
('gratuito','Pai de Família','Acesso gratuito à Área do Pai, trilhas básicas, desafios, comunidade e Pai Indica Pai.',0,'month',
 '["Trilhas de formação","Desafios","Itens salvos","Histórias e perguntas","Indicar e ver vagas"]'::jsonb, true),
('pai-de-valor','Pai de Valor','Plano pago (fica inativo até o dono ligar a cobrança via Mercado Pago).',1990,'month',
 '["sem_anuncios","trilhas_premium","grupos_fechados","ebooks","descontos_parceiros","mentoria_em_grupo"]'::jsonb, false)
on conflict (slug) do update set name = excluded.name, description = excluded.description, price_cents = excluded.price_cents,
  interval = excluded.interval, features = excluded.features, active = excluded.active;

-- Seed das 20 insígnias = doc 09 §2.2 bloco 10 (fonte única; pai-presente = concluir "30 dias de presença com os filhos").
-- rule é jsonb lido por award_badges(); ícones = nomes do lucide-react em kebab-case.
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

-- get_member_dashboard: depende de jobs (0005), tracks e challenges (0006) → definida no FIM de 0006.
