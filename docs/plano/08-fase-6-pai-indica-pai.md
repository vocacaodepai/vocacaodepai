# Fase 6 — Pai Indica Pai: vagas, indicações, profissionais e mentoria

> Documento executável. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code dentro de
> `/home/user/vocacaodepai`. Siga os passos na ordem. Tudo em PT-BR. Decisões já tomadas: não reabrir.
>
> Pré-requisitos: Fase 1 (fundação: `supabase/migrations/0001_core.sql` com `profiles`, `public.is_admin()`,
> layout `_site`, `_admin`, Resend configurado), Fase 5 (`0004_membros.sql`: login/cadastro, `/minha-conta`,
> `useAuth()` com `user`/`profile`/`openLogin`). Se `docs/plano/02-arquitetura-e-stack.md` existir, ele prevalece
> sobre qualquer detalhe de coluna ou pasta descrito aqui.
>
> Repositório de referência (somente leitura): `/home/user/vocacaodemae`. Padrões herdados:
> - rota fina em `src/routes/_site/**.tsx` (`createFileRoute` + `head()` + `component`), página gorda em `src/pages/**`;
> - formulário com `react-hook-form` + `zod` (`@hookform/resolvers`), feedback com `sonner` (`toast`);
> - escrita no Supabase pelo client autenticado (RLS) ou por RPC `security definer` (ex.: `moderate_story`);
> - admin em `src/admin/*.tsx` com abas e badge de pendências (`AdminDashboard.tsx`);
> - server functions em `src/lib/*.functions.ts` com `createServerFn` (ver `hub.functions.ts`, `seo.functions.ts`).

---

## 0. Visão geral da fase

"Pai Indica Pai" é a frente de **rede de apoio profissional** do Vocação de Pai: um pai ajuda outro pai a
sustentar a família. Quatro frentes, todas sem taxa:

| Frente | Rota | Tabela | O que é |
|---|---|---|---|
| Vagas | `/pai-indica-pai/vagas` | `jobs` | Pai publica vaga da própria empresa ou que conhece; outro pai se candidata |
| Indicações | `/pai-indica-pai/indicacoes` | `job_referrals` | Pai indica profissional, serviço ou empresa de confiança |
| Pai Profissional | `/pai-indica-pai/profissionais` | `professionals` | Diretório: o pai oferece o próprio trabalho (eletricista, contador, dev...) |
| Mentoria | `/pai-indica-pai/mentoria` | `mentorships` + `professionals.is_mentor` | Pai experiente orienta pai iniciante numa área |

Entregáveis desta fase (ordem de execução):

1. Migration `supabase/migrations/0005_pai_indica_pai.sql` (seção 2).
2. Tipos e schemas zod em `src/lib/pip/` (seção 4).
3. Server functions `src/lib/pip/pip.functions.ts` (seção 4.4).
4. Rotas + páginas públicas (seção 3) e componentes de card/formulário (seção 4).
5. Admin: fila de moderação e bloqueio (seção 6).
6. Antifraude: Turnstile, rate limit, blacklist, duplicidade (seção 7).
7. Cron: expiração + digest de vagas por e-mail (seções 2.6 e 5).
8. SEO: JSON-LD JobPosting, sitemap de vagas, RSS (seção 8).
9. Métricas (seção 9), aceite (10), checklist (12).

Estimativa: 4 a 6 sessões de Claude Code. Faça commits pequenos em branch `claude/fase-6-pai-indica-pai`.

---

## 1. Conceito e regras (fixas)

### 1.1 Quem pode publicar
- Só **membro logado com e-mail verificado** (`auth.users.email_confirmed_at IS NOT NULL`). Visitante anônimo
  só lê. A verificação é checada no banco (função `public.email_verified()`, seção 2.3) e na UI (aviso + botão
  "Reenviar e-mail de confirmação" chamando `supabase.auth.resend({ type: 'signup', email })`).
- Usuário bloqueado (`profiles.blocked_at IS NOT NULL`) não insere nada (função `public.is_blocked()`).

### 1.2 Moderação antes de ir ao ar
- Todo registro nasce `status = 'pending'`. Só `approved` aparece ao público.
- Admin aprova/rejeita em `/admin/pai-indica-pai`. Rejeição exige motivo (mín. 10 caracteres), que vai por
  e-mail ao autor e fica em `moderation_log`.
- Autor pode editar o próprio registro **enquanto `pending`**. Após aprovado, editar volta para `pending`
  (trigger `pip_reset_status_on_edit`, seção 2.5), exceto a renovação de prazo.

### 1.3 Expiração e renovação
- **Vagas**: 30 dias a partir da aprovação (`expires_at = moderated_at + interval '30 days'`). Renovável pelo autor
  via RPC `renew_job()`, até 3 vezes sem nova moderação (7 dias antes ou até 30 dias depois de expirar); na 4ª
  renovação volta para `pending`. Vaga expirada sai da lista, do sitemap, do RSS e **perde o JSON-LD** (a página
  continua com aviso "Vaga encerrada" e link para vagas semelhantes — exigência do Google for Jobs).
- **Indicações**: 90 dias a partir da aprovação. Renováveis 1 vez pelo autor; depois voltam para `pending`.
- **Pai Profissional** e **Mentoria**: não expiram; o próprio autor desativa (`status = 'archived'`).
- Função `public.expire_jobs()` roda diariamente (pg_cron às 03:15 UTC) e também pode ser disparada por
  `GET /api/cron/expire-jobs` com header `Authorization: Bearer $CRON_SECRET` (Vercel Cron, redundância).

### 1.4 Denúncia
- Qualquer visitante (logado ou não) denuncia pelo botão "Denunciar" com motivo em enum:
  `golpe`, `vaga_falsa`, `conteudo_impróprio`, `discriminacao`, `spam`, `outro` + texto opcional.
- A denúncia é gravada em `moderation_log` (`action = 'report'`, `actor_id` nulo para anônimo) e incrementa
  `report_count` da entidade. **3 denúncias** tiram o item do ar automaticamente (`status = 'pending'`,
  flag `auto_hidden = true`) até o admin revisar. Admin vê o contador na fila.

### 1.5 Sem taxa, sem intermediação
- O site não cobra nada, não recebe currículos e não intermedia pagamentos. "Como se candidatar" sempre
  aponta para fora (e-mail, link, WhatsApp da empresa). Texto fixo no rodapé de cada vaga:
  > "O Vocação de Pai não cobra taxa, não pede dados bancários e não intermedia contratações. Desconfie de
  > quem pedir pagamento para 'garantir a vaga'. Denuncie."

### 1.6 LGPD
- Dados de contato (`contact_email`, `contact_phone`, `contact_url`) só são exibidos quando o autor marcou
  `consent_contact = true` no formulário (checkbox obrigatório para publicar com contato visível). Sem consentimento,
  o contato fica oculto e o botão "Como se candidatar" exibe "Entre em contato pelo site da empresa" ou fica ausente.
- Nunca exibir e-mail/telefone do autor (`posted_by`) — só o nome de exibição e a cidade.
- Remoção a pedido: em `/minha-conta` → aba "Pai Indica Pai" → botão "Excluir" (hard delete, RLS `delete` do
  autor). Também pelo e-mail `privacidade@vocacaodepai.com.br` (texto em `/politica-de-privacidade`, Fase 1).
- Base legal: consentimento (art. 7º, I) para contato; legítimo interesse para moderação e antifraude
  (`moderation_log` guarda `actor_id` e `note`, retenção 2 anos).

### 1.7 Código de conduta (texto fixo exibido no hub e aceito no formulário)
1. Vaga ou indicação verdadeira, com empresa e cidade reais.
2. Sem discriminação por idade, origem, religião, deficiência ou estado civil. Vagas são abertas a qualquer
   trabalhador; "Pai Indica Pai" é o espírito da rede, não um filtro de candidatos.
3. Sem pirâmide, "renda extra garantida", apostas, conteúdo adulto, agiotagem ou qualquer esquema.
4. Sem cobrar nada do candidato ou do indicado.
5. Respeito na linguagem — somos pais ensinando pelo exemplo.
6. Quem quebra a regra é removido e pode ser bloqueado.

Arquivo do texto: `src/content/pip/codigo-de-conduta.ts` (export `CODIGO_DE_CONDUTA: string[]`).

### 1.8 Taxonomias fixas (`src/lib/pip/taxonomies.ts`)
```ts
export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;
export const JOB_TYPES = { clt: "CLT", pj: "PJ", freela: "Freelancer", estagio: "Estágio", temporario: "Temporário" } as const;
export const JOB_AREAS = {
  administrativo: "Administrativo", comercial: "Comercial e vendas", construcao: "Construção civil",
  educacao: "Educação", financeiro: "Financeiro e contábil", industria: "Indústria e produção",
  logistica: "Logística e transporte", marketing: "Marketing e comunicação", saude: "Saúde",
  servicos: "Serviços gerais", ti: "Tecnologia", juridico: "Jurídico", agro: "Agro", outros: "Outros",
} as const;
export const REFERRAL_KINDS = { profissional: "Profissional", servico: "Serviço", empresa: "Empresa" } as const;
export const MENTORSHIP_AREAS = {
  carreira: "Carreira e emprego", empreender: "Empreendedorismo", financas: "Finanças da família",
  paternidade: "Paternidade", fe: "Fé e vida espiritual", casamento: "Casamento", saude: "Saúde do homem",
  estudos: "Estudos e concursos", oficio: "Ofício e trabalho manual",
} as const;
export const REPORT_REASONS = { golpe: "Golpe ou pedido de dinheiro", vaga_falsa: "Vaga/indicação falsa",
  conteudo_improprio: "Conteúdo impróprio", discriminacao: "Discriminação", spam: "Spam", outro: "Outro" } as const;
```

---

## 2. Migration `supabase/migrations/0005_pai_indica_pai.sql`

Regras: idempotente (`if not exists`), seguir COLUNAS-CHAVE do briefing; colunas marcadas `-- adicional` são
extensões permitidas. Aplicar com `supabase db push` (local) ou MCP `apply_migration` (nome `0005_pai_indica_pai`).
Antes de aplicar, confirme que `0001_core.sql` já criou `public.is_admin()`, `public.set_updated_at()` e `profiles`.

```sql
-- 0005_pai_indica_pai.sql — Vocação de Pai — Fase 6
-- Tabelas: jobs, job_referrals, professionals, mentorships, moderation_log (se ainda não existir)
-- Funções: email_verified, is_blocked, expire_jobs, moderate_job, moderate_referral, moderate_professional,
--          renew_job, renew_referral, report_entity, increment_job_views, track_job_apply_click, block_user
-- Agendamento: pg_cron (expire_jobs) — opcional, protegido por verificação da extensão.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- 2.1 Colunas adicionais em profiles (bloqueio de usuário)
-- ---------------------------------------------------------------
alter table public.profiles
  add column if not exists blocked_at timestamptz,            -- adicional
  add column if not exists blocked_reason text;               -- adicional

-- ---------------------------------------------------------------
-- 2.2 moderation_log (cria só se a Fase 1 não criou)
-- ---------------------------------------------------------------
create table if not exists public.moderation_log (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id) on delete set null,
  entity      text not null,          -- 'job' | 'job_referral' | 'professional' | 'mentorship' | 'profile' | 'story' | ...
  entity_id   uuid not null,
  action      text not null,          -- 'approve' | 'reject' | 'report' | 'auto_hide' | 'renew' | 'block' | 'unblock' | 'expire'
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists moderation_log_entity_idx on public.moderation_log (entity, entity_id, created_at desc);
alter table public.moderation_log enable row level security;
drop policy if exists "moderation_log admin read" on public.moderation_log;
create policy "moderation_log admin read" on public.moderation_log for select using (public.is_admin());
-- inserts só por funções security definer (abaixo); nenhuma policy de insert para clientes.

-- ---------------------------------------------------------------
-- 2.3 Funções auxiliares de autorização
-- ---------------------------------------------------------------
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

-- ---------------------------------------------------------------
-- 2.4 Tabelas
-- ---------------------------------------------------------------
create table if not exists public.jobs (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null check (char_length(title) between 5 and 120),
  company          text not null check (char_length(company) between 2 and 120),
  city             text,
  uf               char(2),
  remote           boolean not null default false,
  type             text not null check (type in ('clt','pj','freela','estagio','temporario')),
  area             text,                                              -- adicional (chave de JOB_AREAS)
  salary_min       numeric(12,2),
  salary_max       numeric(12,2),
  description      text not null check (char_length(description) between 100 and 8000),
  how_to_apply     text not null check (char_length(how_to_apply) between 10 and 2000),
  contact_email    text,
  contact_url      text,
  contact_phone    text,                                              -- adicional
  consent_contact  boolean not null default false,                    -- adicional (LGPD)
  status           text not null default 'pending' check (status in ('pending','approved','rejected','expired')),
  rejection_reason text,                                              -- adicional
  auto_hidden      boolean not null default false,                    -- adicional (3 denúncias)
  report_count     int not null default 0,                            -- adicional
  renewed_count    int not null default 0,                            -- adicional
  expires_at       timestamptz,
  posted_by        uuid not null references public.profiles(id) on delete cascade,
  moderated_by     uuid references public.profiles(id) on delete set null,
  moderated_at     timestamptz,
  views            int not null default 0,
  apply_clicks     int not null default 0,                            -- adicional (métrica)
  search_content   tsvector generated always as (
                     to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' ||
                                 coalesce(city,'') || ' ' || coalesce(description,''))
                   ) stored,                                          -- adicional
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint jobs_salary_order check (salary_min is null or salary_max is null or salary_min <= salary_max),
  constraint jobs_location check (remote or (city is not null and uf is not null)),
  constraint jobs_contact check (contact_email is not null or contact_url is not null or contact_phone is not null)
);
create index if not exists jobs_public_idx on public.jobs (status, expires_at desc) where status = 'approved';
create index if not exists jobs_uf_area_idx on public.jobs (uf, area) where status = 'approved';
create index if not exists jobs_posted_by_idx on public.jobs (posted_by, created_at desc);
create index if not exists jobs_search_idx on public.jobs using gin (search_content);
-- duplicidade título+empresa entre ativos
create unique index if not exists jobs_title_company_active_uniq
  on public.jobs (lower(title), lower(company)) where status in ('pending','approved');

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
  referred_by      uuid not null references public.profiles(id) on delete cascade,
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

-- updated_at (set_updated_at vem da 0001; se não existir, cria)
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists jobs_updated_at on public.jobs;
create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
drop trigger if exists job_referrals_updated_at on public.job_referrals;
create trigger job_referrals_updated_at before update on public.job_referrals for each row execute function public.set_updated_at();
drop trigger if exists professionals_updated_at on public.professionals;
create trigger professionals_updated_at before update on public.professionals for each row execute function public.set_updated_at();
drop trigger if exists mentorships_updated_at on public.mentorships;
create trigger mentorships_updated_at before update on public.mentorships for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- 2.5 Triggers de regra de negócio
-- ---------------------------------------------------------------
-- Rate limit: 3 publicações/dia por usuário somando jobs + job_referrals + professionals
create or replace function public.pip_enforce_daily_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_count int;
begin
  if v_uid is null or public.is_admin() then return new; end if;
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

-- Edição pelo autor: campos de moderação não podem ser alterados; editar aprovado volta para pending
create or replace function public.pip_reset_status_on_edit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
  -- autor não mexe em campos de moderação/métrica
  new.status := old.status; new.moderated_by := old.moderated_by; new.moderated_at := old.moderated_at;
  new.rejection_reason := old.rejection_reason; new.auto_hidden := old.auto_hidden;
  new.report_count := old.report_count; new.renewed_count := old.renewed_count; new.expires_at := old.expires_at;
  new.views := old.views;
  if tg_table_name = 'jobs' then new.apply_clicks := old.apply_clicks; end if;
  -- conteúdo mudou em item aprovado → volta para a fila
  if old.status = 'approved' and row(new.title, new.description, new.contact_email, new.contact_url, new.contact_phone)
     is distinct from row(old.title, old.description, old.contact_email, old.contact_url, old.contact_phone) then
    new.status := 'pending';
  end if;
  return new;
end $$;
drop trigger if exists jobs_reset_on_edit on public.jobs;
create trigger jobs_reset_on_edit before update on public.jobs for each row execute function public.pip_reset_status_on_edit();
drop trigger if exists job_referrals_reset_on_edit on public.job_referrals;
create trigger job_referrals_reset_on_edit before update on public.job_referrals for each row execute function public.pip_reset_status_on_edit();

-- professionals: mesmo princípio, mas sem title/contact iguais; versão própria
create or replace function public.pip_reset_professional_on_edit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then return new; end if;
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

-- ---------------------------------------------------------------
-- 2.6 Expiração (pg_cron) e RPCs
-- ---------------------------------------------------------------
create or replace function public.expire_jobs() returns table (expired_jobs int, expired_referrals int)
language plpgsql security definer set search_path = public as $$
declare a int; b int;
begin
  with u as (update public.jobs set status = 'expired' where status = 'approved' and expires_at < now() returning id)
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  select null, 'job', id, 'expire', 'expirada automaticamente' from u;
  get diagnostics a = row_count;
  with u as (update public.job_referrals set status = 'expired' where status = 'approved' and expires_at < now() returning id)
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  select null, 'job_referral', id, 'expire', 'expirada automaticamente' from u;
  get diagnostics b = row_count;
  return query select a, b;
end $$;
revoke all on function public.expire_jobs() from public, anon, authenticated;

-- Agenda no pg_cron se a extensão estiver disponível (Supabase: Database → Extensions → pg_cron)
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('vdp-expire-jobs') from cron.job where jobname = 'vdp-expire-jobs';
    perform cron.schedule('vdp-expire-jobs', '15 3 * * *', $cron$ select public.expire_jobs(); $cron$);
  end if;
exception when others then
  raise notice 'pg_cron indisponível: use o Vercel Cron /api/cron/expire-jobs (%).', sqlerrm;
end $$;

-- Moderação (admin)
create or replace function public.moderate_job(p_job_id uuid, p_status text, p_reason text default null)
returns public.jobs language plpgsql security definer set search_path = public as $$
declare v public.jobs;
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  if p_status not in ('approved','rejected') then raise exception 'STATUS_INVALIDO'; end if;
  if p_status = 'rejected' and (p_reason is null or char_length(p_reason) < 10) then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  update public.jobs set
    status = p_status, moderated_by = auth.uid(), moderated_at = now(), auto_hidden = false,
    rejection_reason = case when p_status = 'rejected' then p_reason else null end,
    expires_at = case when p_status = 'approved' then now() + interval '30 days' else expires_at end
  where id = p_job_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'job', p_job_id, case when p_status = 'approved' then 'approve' else 'reject' end, p_reason);
  return v;
end $$;

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
  values (auth.uid(), 'job_referral', p_id, case when p_status = 'approved' then 'approve' else 'reject' end, p_reason);
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
  values (auth.uid(), 'professional', p_id, case when p_status = 'approved' then 'approve' else 'reject' end, p_reason);
  return v;
end $$;

-- Renovação pelo autor
create or replace function public.renew_job(p_job_id uuid) returns public.jobs
language plpgsql security definer set search_path = public as $$
declare v public.jobs;
begin
  select * into v from public.jobs where id = p_job_id and posted_by = auth.uid();
  if v.id is null then raise exception 'NAO_ENCONTRADA'; end if;
  if v.status not in ('approved','expired') then raise exception 'SO_APROVADA_OU_EXPIRADA'; end if;
  if v.expires_at > now() + interval '7 days' then raise exception 'AINDA_NAO_RENOVAVEL'; end if;
  if v.expires_at < now() - interval '30 days' then raise exception 'EXPIRADA_HA_MUITO_TEMPO'; end if;
  update public.jobs set
    renewed_count = renewed_count + 1,
    status = case when renewed_count >= 3 then 'pending' else 'approved' end,
    expires_at = greatest(now(), expires_at) + interval '30 days'
  where id = p_job_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'job', p_job_id, 'renew', 'renovação nº ' || v.renewed_count);
  return v;
end $$;

create or replace function public.renew_referral(p_id uuid) returns public.job_referrals
language plpgsql security definer set search_path = public as $$
declare v public.job_referrals;
begin
  select * into v from public.job_referrals where id = p_id and referred_by = auth.uid();
  if v.id is null then raise exception 'NAO_ENCONTRADA'; end if;
  if v.status not in ('approved','expired') then raise exception 'SO_APROVADA_OU_EXPIRADA'; end if;
  if v.expires_at > now() + interval '14 days' then raise exception 'AINDA_NAO_RENOVAVEL'; end if;
  update public.job_referrals set
    renewed_count = renewed_count + 1,
    status = case when renewed_count >= 1 then 'pending' else 'approved' end,
    expires_at = greatest(now(), expires_at) + interval '90 days'
  where id = p_id returning * into v;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'job_referral', p_id, 'renew', 'renovação nº ' || v.renewed_count);
  return v;
end $$;

-- Denúncia (anon ou logado). 3 denúncias → esconde até revisão.
create or replace function public.report_entity(p_entity text, p_entity_id uuid, p_reason text, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  if p_entity not in ('job','job_referral','professional') then raise exception 'ENTIDADE_INVALIDA'; end if;
  if p_reason not in ('golpe','vaga_falsa','conteudo_improprio','discriminacao','spam','outro') then raise exception 'MOTIVO_INVALIDO'; end if;
  -- anti-flood: mesmo usuário logado não denuncia o mesmo item 2x
  if auth.uid() is not null and exists (
    select 1 from public.moderation_log where entity = p_entity and entity_id = p_entity_id and action = 'report' and actor_id = auth.uid()
  ) then return; end if;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), p_entity, p_entity_id, 'report', p_reason || coalesce(': ' || left(p_note, 500), ''));
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
    insert into public.moderation_log (actor_id, entity, entity_id, action, note) values (null, p_entity, p_entity_id, 'auto_hide', '3 denúncias');
  end if;
end $$;
grant execute on function public.report_entity(text, uuid, text, text) to anon, authenticated;

-- Métricas (anon pode chamar; dedupe no cliente por sessionStorage)
create or replace function public.increment_job_views(p_job_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.jobs set views = views + 1 where id = p_job_id and status = 'approved';
$$;
create or replace function public.track_job_apply_click(p_job_id uuid) returns void
language sql security definer set search_path = public as $$
  update public.jobs set apply_clicks = apply_clicks + 1 where id = p_job_id and status = 'approved';
$$;
grant execute on function public.increment_job_views(uuid) to anon, authenticated;
grant execute on function public.track_job_apply_click(uuid) to anon, authenticated;

-- Bloqueio de usuário (admin). Bloquear também tira do ar tudo que ele publicou.
create or replace function public.block_user(p_user_id uuid, p_reason text, p_block boolean default true) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'SEM_PERMISSAO'; end if;
  update public.profiles set blocked_at = case when p_block then now() else null end,
                             blocked_reason = case when p_block then p_reason else null end
  where id = p_user_id;
  if p_block then
    update public.jobs set status = 'rejected', rejection_reason = 'Usuário bloqueado: ' || p_reason where posted_by = p_user_id and status in ('pending','approved');
    update public.job_referrals set status = 'rejected', rejection_reason = 'Usuário bloqueado: ' || p_reason where referred_by = p_user_id and status in ('pending','approved');
    update public.professionals set status = 'rejected', rejection_reason = 'Usuário bloqueado: ' || p_reason where user_id = p_user_id and status in ('pending','approved');
  end if;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'profile', p_user_id, case when p_block then 'block' else 'unblock' end, p_reason);
end $$;

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

-- ---------------------------------------------------------------
-- 2.7 RLS
-- ---------------------------------------------------------------
alter table public.jobs enable row level security;
alter table public.job_referrals enable row level security;
alter table public.professionals enable row level security;
alter table public.mentorships enable row level security;

-- jobs
drop policy if exists "jobs public read" on public.jobs;
create policy "jobs public read" on public.jobs for select
  using (status = 'approved' and expires_at > now());
drop policy if exists "jobs owner read" on public.jobs;
create policy "jobs owner read" on public.jobs for select using (posted_by = auth.uid());
drop policy if exists "jobs admin all" on public.jobs;
create policy "jobs admin all" on public.jobs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "jobs owner insert" on public.jobs;
create policy "jobs owner insert" on public.jobs for insert
  with check (posted_by = auth.uid() and public.can_publish() and status = 'pending');
drop policy if exists "jobs owner update pending" on public.jobs;
create policy "jobs owner update pending" on public.jobs for update
  using (posted_by = auth.uid() and status in ('pending','approved','expired'))
  with check (posted_by = auth.uid());
drop policy if exists "jobs owner delete" on public.jobs;
create policy "jobs owner delete" on public.jobs for delete using (posted_by = auth.uid());

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

-- View pública enxuta (sem posted_by, sem contato quando não consentido) — usada em listas e RSS
create or replace view public.jobs_public as
  select j.id, j.slug, j.title, j.company, j.city, j.uf, j.remote, j.type, j.area, j.salary_min, j.salary_max,
         left(j.description, 240) as summary, j.expires_at, j.moderated_at as published_at, j.views, j.created_at, j.updated_at
  from public.jobs j where j.status = 'approved' and j.expires_at > now();
grant select on public.jobs_public to anon, authenticated;
```

Verificação após aplicar (rodar no SQL editor ou MCP `execute_sql`):
```sql
select table_name from information_schema.tables where table_schema='public'
  and table_name in ('jobs','job_referrals','professionals','mentorships','moderation_log');          -- 5 linhas
select proname from pg_proc where proname in ('expire_jobs','moderate_job','renew_job','report_entity','can_publish'); -- 5 linhas
select jobname, schedule from cron.job where jobname = 'vdp-expire-jobs';                               -- 1 linha (se pg_cron)
```

Depois: `npx supabase gen types typescript --project-id <SUPABASE_PROJECT_REF> > src/integrations/supabase/types.ts`.

---

## 3. Rotas e páginas

Arquivos de rota (finos) em `src/routes/_site/pai-indica-pai/` e páginas em `src/pages/pai-indica-pai/`.
Toda rota pública tem `head()` com title, description, og:*, canonical `https://vocacaodepai.com.br/...`.
Formulários (`nova`) são `noindex`.

| Rota | Arquivo de rota | Página | Loader (server) |
|---|---|---|---|
| `/pai-indica-pai` | `index.tsx` | `PipHubPage.tsx` | `getPipHubData` (contagens + 6 vagas recentes + 6 profissionais) |
| `/pai-indica-pai/vagas` | `vagas/index.tsx` | `JobsListPage.tsx` | `listJobs` com `validateSearch` (zod) |
| `/pai-indica-pai/vagas/$slug` | `vagas/$slug.tsx` | `JobPage.tsx` | `getJobBySlug` (inclui expiradas para a página de "encerrada") |
| `/pai-indica-pai/vagas/nova` | `vagas/nova.tsx` | `NewJobPage.tsx` | — (client, exige login) |
| `/pai-indica-pai/vagas/feed.xml` | `vagas/feed[.]xml.ts` | — | handler GET (seção 8.3) |
| `/pai-indica-pai/profissionais` | `profissionais/index.tsx` | `ProfessionalsPage.tsx` | `listProfessionals` |
| `/pai-indica-pai/profissionais/$slug` | `profissionais/$slug.tsx` | `ProfessionalPage.tsx` | `getProfessionalBySlug` |
| `/pai-indica-pai/profissionais/novo` | `profissionais/novo.tsx` | `NewProfessionalPage.tsx` | — |
| `/pai-indica-pai/indicacoes` | `indicacoes/index.tsx` | `ReferralsPage.tsx` | `listReferrals` |
| `/pai-indica-pai/indicacoes/nova` | `indicacoes/nova.tsx` | `NewReferralPage.tsx` | — |
| `/pai-indica-pai/mentoria` | `mentoria/index.tsx` | `MentorshipPage.tsx` | `listMentors` |
| `/sitemap-vagas.xml` | `src/routes/sitemap-vagas[.]xml.ts` | — | handler GET (seção 8.2) |
| `/api/cron/expire-jobs` | `src/routes/api/cron/expire-jobs.ts` | — | handler GET (seção 2.6) |
| `/api/cron/vagas-digest` | `src/routes/api/cron/vagas-digest.ts` | — | handler GET (seção 5) |
| `/admin/pai-indica-pai` | `src/routes/_admin/admin/pai-indica-pai.tsx` | `src/admin/PipModeration.tsx` | — (client, admin) |

Exemplo de rota fina (padrão idêntico a `historias/nova.tsx` do VDM):
```tsx
// src/routes/_site/pai-indica-pai/vagas/nova.tsx
import { createFileRoute } from "@tanstack/react-router";
import NewJobPage from "@/pages/pai-indica-pai/NewJobPage";
import { buildSiteHead } from "@/lib/seo";

export const Route = createFileRoute("/_site/pai-indica-pai/vagas/nova")({
  head: () => buildSiteHead({
    title: "Publicar vaga | Pai Indica Pai",
    description: "Publique uma vaga de trabalho para outros pais. Gratuito, com moderação.",
    path: "/pai-indica-pai/vagas/nova", noindex: true,
  }),
  component: NewJobPage,
});
```
(`buildSiteHead` vem da Fase 1; se tiver outro nome no repo, use o existente.)

### 3.1 Hub `/pai-indica-pai`
- Hero: "Pai Indica Pai — um pai ajuda outro pai a sustentar a família." Subtítulo: "Vagas, indicações, profissionais
  e mentoria. Gratuito, moderado, sem intermediação."
- 4 cards grandes (uma por frente) com ícone `lucide` (`Briefcase`, `Handshake`, `Wrench`, `Compass`), contador
  ("37 vagas abertas", "12 profissionais em SP") e CTA.
- Bloco "Como funciona" (3 passos: Publique → Moderamos em até 48h → Vai ao ar por 30/90 dias).
- Bloco "Código de conduta" (lista de `CODIGO_DE_CONDUTA`).
- Bloco "Últimas vagas" (6 `JobCard`) e "Pais profissionais em destaque" (6 `ProfessionalCard`).
- Bloco "Receba vagas da sua região por e-mail" → `AlertsPreferencesForm` (seção 5).
- Callout "Sinal de alerta: nunca pague para 'garantir' uma vaga." (semáforo do pai).

### 3.2 Lista `/pai-indica-pai/vagas`
- Search params validados com zod (`validateSearch`):
  `{ q?: string; uf?: UF; cidade?: string; remoto?: boolean; tipo?: JobType; area?: JobArea; ordem?: 'recentes'|'expiram'|'vistas'; pagina?: number }`.
- Filtros em barra lateral (desktop) / drawer (mobile): UF (select), cidade (input com datalist das cidades
  existentes em vagas aprovadas), Remoto (switch), Tipo (chips), Área (select), Ordenação.
- Busca: `textSearch('search_content', q, { type: 'websearch', config: 'portuguese' })`.
- Paginação 12 por página; URL preserva filtros. Cabeçalho "N vagas encontradas".
- Vazio: "Nenhuma vaga com esses filtros. Publique a primeira!" + CTA.
- CTA fixo no topo: "Publicar vaga" (abre login se anônimo).

### 3.3 Detalhe `/pai-indica-pai/vagas/$slug`
- Título, empresa, local (ou "Remoto — Brasil"), tipo, área, faixa salarial ("R$ 3.000 a R$ 4.500/mês" ou
  "A combinar"), publicada em, expira em, views.
- Corpo: `description` renderizado com quebras de linha (`whitespace-pre-line`), sem HTML.
- Caixa "Como se candidatar": `how_to_apply` + botões conforme contato consentido: "Enviar e-mail"
  (`mailto:`), "Acessar link" (`contact_url`, `rel="nofollow noopener"`), "WhatsApp" (`https://wa.me/55DDDNUMERO`).
  Cada clique chama `track_job_apply_click` + evento GA4 `job_apply_click`.
- Botão "Compartilhar no WhatsApp": `https://wa.me/?text=` + `encodeURIComponent("Vaga: {title} na {company} — {url} (via Vocação de Pai)")`.
- Botão "Salvar" (saved_items, `item_type='job'`) para logados.
- Botão "Denunciar" → `ReportDialog` (seção 4.3).
- Rodapé fixo antifraude (seção 1.5) e "Vagas semelhantes" (mesma área ou UF, 3 itens).
- Se `status <> 'approved'` ou expirada: banner "Esta vaga foi encerrada", **sem JSON-LD**, `<meta name="robots" content="noindex">`,
  lista de vagas semelhantes. Se não existir: 404.
- JSON-LD `JobPosting` (seção 8.1) injetado via `head()` → `scripts: [{ type: 'application/ld+json', children: JSON.stringify(...) }]`.
- Ao montar: `increment_job_views` uma vez por sessão (`sessionStorage['job_view_'+id]`).

### 3.4 Formulário `/pai-indica-pai/vagas/nova`
- Anônimo: card "Entre para publicar" (como em `NewStoryPage`). Logado sem e-mail verificado: aviso + reenviar.
- Campos (todos do schema `jobSchema`, seção 4.1): título, empresa, tipo (radio), área (select), remoto (switch),
  cidade + UF (desabilitados se remoto), salário mín/máx (opcional, `R$`), descrição (textarea 100–8000, contador),
  como se candidatar (textarea), e-mail de contato, link, WhatsApp (ao menos um), checkbox LGPD
  `consent_contact` ("Autorizo exibir o contato acima publicamente"), checkbox `accept_conduct` (código de conduta),
  Turnstile.
- Botão "Pré-visualizar" alterna para `JobPreview` (usa o mesmo `JobDetail` da página pública com dados do form).
- Envio → `createJob` (server fn). Sucesso: tela "Recebemos sua vaga" + status + link para `/minha-conta` + lista
  "Minhas vagas" (status, expira em, botões Editar/Renovar/Excluir).
- Erros do banco traduzidos: `LIMITE_DIARIO`, `jobs_title_company_active_uniq` → "Já existe uma vaga ativa com este
  título nesta empresa", `jobs_location`, `jobs_contact`.

### 3.5 Diretório `/pai-indica-pai/profissionais` e perfil `$slug`
- Filtros: profissão/área (select `JOB_AREAS` + busca livre), UF, cidade, atende remoto, "é mentor".
- `ProfessionalCard`: avatar (`profiles.avatar_url`), nome de exibição, profissão, cidade/UF, badges "Remoto",
  "Mentor", 2 linhas de descrição.
- Perfil: descrição completa, contatos (se consentidos), botão "Pedir mentoria" (se `is_mentor`), Denunciar.
- `/pai-indica-pai/profissionais/novo`: um perfil por usuário (`user_id unique`); se já existe, redireciona para edição.

### 3.6 Indicações `/pai-indica-pai/indicacoes`
- Tabs por `kind` (Profissional / Serviço / Empresa), filtros UF/cidade/categoria.
- `ReferralCard`: título, kind, categoria, cidade/UF, "indicado por {display_name}", trecho, contatos consentidos.
- `/pai-indica-pai/indicacoes/nova`: formulário `referralSchema` (seção 4.1) com mesmo fluxo de vaga (preview, Turnstile, pending).

### 3.7 Mentoria `/pai-indica-pai/mentoria`
- Explicação (o que é/não é: não é terapia, não é consultoria paga; 1 conversa por semana por 4–8 semanas, sugestão).
- Lista de mentores (professionals `is_mentor` aprovados) com filtro por `MENTORSHIP_AREAS` e vagas disponíveis
  (`mentor_capacity - accepted`).
- `MentorCard` → botão "Pedir mentoria" abre `MentorshipRequestDialog` (área + mensagem 30–1500) → insert em
  `mentorships` (RLS valida capacidade). E-mail para o mentor (Resend) com link para `/minha-conta?tab=mentoria`.
- Em `/minha-conta` (Fase 5) adicionar aba "Mentoria": pedidos recebidos (mentor: Aceitar/Recusar com resposta via
  `respond_mentorship`) e pedidos feitos (mentorado: status, Cancelar). Ao aceitar, ambos recebem e-mail com o
  contato um do outro (**só** se `consent_contact` do mentor; o mentorado consente no envio do pedido — checkbox).
- "Quero ser mentor": leva a `/pai-indica-pai/profissionais/novo` com `is_mentor` pré-marcado.

---

## 4. Esqueletos: schemas, tipos, componentes e server functions

Estrutura:
```
src/lib/pip/
  taxonomies.ts        (seção 1.8)
  schemas.ts           (zod — abaixo)
  types.ts             (tipos derivados de Database + schemas)
  blacklist.ts         (seção 7.3)
  slug.ts              (slug único: slugify(title-company) + sufixo base36 de 4 chars)
  pip-db.ts            (client: listas, renovar, salvar, denunciar, métricas)
  pip.functions.ts     (server: createJob, createReferral, createProfessional, moderateJob, reportJob, getJobBySlug, listJobs...)
  jsonld.ts            (seção 8.1)
  emails.ts            (templates Resend: confirmação, aprovação, rejeição, digest, mentoria)
src/components/pip/
  JobCard.tsx  JobDetail.tsx  JobFilters.tsx  JobForm.tsx  JobPreview.tsx
  ProfessionalCard.tsx  ProfessionalForm.tsx  ReferralCard.tsx  ReferralForm.tsx
  MentorCard.tsx  MentorshipRequestDialog.tsx  ReportDialog.tsx  ShareWhatsAppButton.tsx
  AlertsPreferencesForm.tsx  ConductNotice.tsx  TurnstileField.tsx
src/content/pip/codigo-de-conduta.ts
```

### 4.1 Schemas zod (`src/lib/pip/schemas.ts`) — zod 4
```ts
import { z } from "zod";
import { UFS, JOB_TYPES, JOB_AREAS, REFERRAL_KINDS, MENTORSHIP_AREAS, REPORT_REASONS } from "./taxonomies";

const key = <T extends Record<string, string>>(o: T) => z.enum(Object.keys(o) as [keyof T & string, ...(keyof T & string)[]]);
const phoneBR = z.string().trim().regex(/^\+?55?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido (DDD + número)");
const urlHttp = z.url({ protocol: /^https?$/, hostname: z.regexes.domain }).max(500);
const money = z.coerce.number().min(0).max(1_000_000).optional();

export const jobSchema = z.object({
  title: z.string().trim().min(5, "Mínimo 5 caracteres").max(120),
  company: z.string().trim().min(2).max(120),
  type: key(JOB_TYPES),
  area: key(JOB_AREAS),
  remote: z.boolean().default(false),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  uf: z.enum(UFS).optional().or(z.literal("")),
  salary_min: money,
  salary_max: money,
  description: z.string().trim().min(100, "Descreva a vaga com pelo menos 100 caracteres").max(8000),
  how_to_apply: z.string().trim().min(10).max(2000),
  contact_email: z.email("E-mail inválido").optional().or(z.literal("")),
  contact_url: urlHttp.optional().or(z.literal("")),
  contact_phone: phoneBR.optional().or(z.literal("")),
  consent_contact: z.boolean(),
  accept_conduct: z.literal(true, { error: "Você precisa aceitar o código de conduta" }),
  turnstile_token: z.string().min(10, "Confirme que você não é um robô"),
}).superRefine((v, ctx) => {
  if (!v.remote && (!v.city || !v.uf)) ctx.addIssue({ code: "custom", path: ["city"], message: "Informe cidade e UF ou marque Remoto" });
  if (!v.contact_email && !v.contact_url && !v.contact_phone) ctx.addIssue({ code: "custom", path: ["contact_email"], message: "Informe ao menos um contato" });
  if (v.salary_min && v.salary_max && v.salary_min > v.salary_max) ctx.addIssue({ code: "custom", path: ["salary_max"], message: "Máximo menor que o mínimo" });
  if ((v.contact_email || v.contact_phone) && !v.consent_contact) ctx.addIssue({ code: "custom", path: ["consent_contact"], message: "Para exibir e-mail/telefone, autorize a publicação do contato" });
});
export type JobInput = z.infer<typeof jobSchema>;

export const referralSchema = z.object({
  kind: key(REFERRAL_KINDS),
  title: z.string().trim().min(3).max(120),
  category: z.string().trim().min(2).max(60),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  uf: z.enum(UFS).optional().or(z.literal("")),
  description: z.string().trim().min(50).max(4000),
  contact_phone: phoneBR.optional().or(z.literal("")),
  contact_email: z.email().optional().or(z.literal("")),
  contact_url: urlHttp.optional().or(z.literal("")),
  consent_contact: z.boolean(),
  accept_conduct: z.literal(true),
  turnstile_token: z.string().min(10),
}).superRefine((v, ctx) => {
  if (!v.contact_email && !v.contact_url && !v.contact_phone) ctx.addIssue({ code: "custom", path: ["contact_email"], message: "Informe ao menos um contato" });
});
export type ReferralInput = z.infer<typeof referralSchema>;

export const professionalSchema = z.object({
  profession: z.string().trim().min(3).max(80),
  area: key(JOB_AREAS),
  description: z.string().trim().min(50).max(3000),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  uf: z.enum(UFS).optional().or(z.literal("")),
  remote: z.boolean().default(false),
  contact_phone: phoneBR.optional().or(z.literal("")),
  contact_email: z.email().optional().or(z.literal("")),
  contact_url: urlHttp.optional().or(z.literal("")),
  consent_contact: z.boolean(),
  is_mentor: z.boolean().default(false),
  mentor_areas: z.array(key(MENTORSHIP_AREAS)).max(4).default([]),
  mentor_capacity: z.coerce.number().int().min(0).max(10).default(2),
  accept_conduct: z.literal(true),
  turnstile_token: z.string().min(10),
}).superRefine((v, ctx) => {
  if (v.is_mentor && v.mentor_areas.length === 0) ctx.addIssue({ code: "custom", path: ["mentor_areas"], message: "Escolha ao menos uma área de mentoria" });
});
export type ProfessionalInput = z.infer<typeof professionalSchema>;

export const mentorshipRequestSchema = z.object({
  mentor_id: z.uuid(),
  area: key(MENTORSHIP_AREAS),
  message: z.string().trim().min(30, "Conte um pouco do seu momento (mín. 30 caracteres)").max(1500),
  share_contact: z.literal(true, { error: "Precisamos compartilhar seu e-mail com o mentor se ele aceitar" }),
});

export const reportSchema = z.object({
  entity: z.enum(["job", "job_referral", "professional"]),
  entity_id: z.uuid(),
  reason: key(REPORT_REASONS),
  note: z.string().trim().max(500).optional(),
  turnstile_token: z.string().min(10),
});

export const moderateSchema = z.object({
  entity: z.enum(["job", "job_referral", "professional"]),
  id: z.uuid(),
  status: z.enum(["approved", "rejected"]),
  reason: z.string().trim().min(10).max(1000).optional(),
}).refine((v) => v.status === "approved" || !!v.reason, { path: ["reason"], message: "Informe o motivo da rejeição" });

export const jobsSearchSchema = z.object({
  q: z.string().trim().max(80).optional(),
  uf: z.enum(UFS).optional(),
  cidade: z.string().trim().max(80).optional(),
  remoto: z.coerce.boolean().optional(),
  tipo: key(JOB_TYPES).optional(),
  area: key(JOB_AREAS).optional(),
  ordem: z.enum(["recentes", "expiram", "vistas"]).default("recentes"),
  pagina: z.coerce.number().int().min(1).default(1),
});
export type JobsSearch = z.infer<typeof jobsSearchSchema>;
```

### 4.2 `JobForm.tsx` (react-hook-form + zod + preview + Turnstile)
```tsx
// src/components/pip/JobForm.tsx
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Eye, Send } from "lucide-react";
import { jobSchema, type JobInput } from "@/lib/pip/schemas";
import { UFS, JOB_TYPES, JOB_AREAS } from "@/lib/pip/taxonomies";
import { createJob } from "@/lib/pip/pip.functions";
import { supabase } from "@/integrations/supabase/client";
import { TurnstileField } from "./TurnstileField";
import { JobPreview } from "./JobPreview";
import { ConductNotice } from "./ConductNotice";
import { translatePipError } from "@/lib/pip/pip-db";

const inputCls = "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

export function JobForm({ onCreated }: { onCreated: (slug: string) => void }) {
  const [preview, setPreview] = useState(false);
  const form = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: { remote: false, consent_contact: false, type: "clt", area: "outros" },
    mode: "onBlur",
  });
  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting }, setValue } = form;
  const remote = watch("remote");
  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    const { data: s } = await supabase.auth.getSession();
    const token = s.session?.access_token;
    if (!token) { toast.error("Faça login para publicar."); return; }
    try {
      const res = await createJob({ data: { ...data, access_token: token } });
      toast.success("Vaga enviada para moderação. Avisaremos por e-mail.");
      onCreated(res.slug);
    } catch (e) {
      toast.error(translatePipError(e));
      setValue("turnstile_token", ""); // token Turnstile é de uso único
    }
  });

  if (preview) return (
    <div className="space-y-4">
      <JobPreview values={values} />
      <div className="flex gap-3">
        <button type="button" onClick={() => setPreview(false)} className="rounded-full border px-5 py-2 text-sm font-bold">Voltar e editar</button>
        <button type="button" onClick={onSubmit} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar para moderação
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Field label="Título da vaga *" error={errors.title?.message}>
        <input className={inputCls} placeholder="Ex.: Eletricista industrial" {...register("title")} />
      </Field>
      <Field label="Empresa *" error={errors.company?.message}>
        <input className={inputCls} {...register("company")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tipo de contratação *" error={errors.type?.message}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(JOB_TYPES).map(([k, label]) => (
              <label key={k} className="cursor-pointer rounded-full border px-4 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10">
                <input type="radio" value={k} className="sr-only" {...register("type")} />{label}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Área *" error={errors.area?.message}>
          <select className={inputCls} {...register("area")}>
            {Object.entries(JOB_AREAS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" className="h-5 w-5 accent-primary" {...register("remote")} /> Vaga 100% remota
      </label>
      <div className="grid gap-4 md:grid-cols-[1fr_120px]">
        <Field label="Cidade" error={errors.city?.message}>
          <input className={inputCls} disabled={remote} {...register("city")} />
        </Field>
        <Field label="UF" error={errors.uf?.message}>
          <select className={inputCls} disabled={remote} {...register("uf")}>
            <option value="">—</option>{UFS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Salário mínimo (R$/mês)" error={errors.salary_min?.message}>
          <input type="number" inputMode="decimal" className={inputCls} {...register("salary_min")} />
        </Field>
        <Field label="Salário máximo (R$/mês)" error={errors.salary_max?.message}>
          <input type="number" inputMode="decimal" className={inputCls} {...register("salary_max")} />
        </Field>
      </div>
      <Field label="Descrição da vaga *" hint={`${values.description?.length ?? 0}/8000`} error={errors.description?.message}>
        <textarea rows={10} className={inputCls} placeholder="Atividades, requisitos, horário, benefícios..." {...register("description")} />
      </Field>
      <Field label="Como se candidatar *" error={errors.how_to_apply?.message}>
        <textarea rows={3} className={inputCls} placeholder="Ex.: Envie currículo para o e-mail abaixo com o assunto 'Vaga eletricista'." {...register("how_to_apply")} />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="E-mail para candidatura" error={errors.contact_email?.message}><input type="email" className={inputCls} {...register("contact_email")} /></Field>
        <Field label="Link (site/LinkedIn/Gupy)" error={errors.contact_url?.message}><input type="url" className={inputCls} {...register("contact_url")} /></Field>
        <Field label="WhatsApp" error={errors.contact_phone?.message}><input type="tel" className={inputCls} placeholder="(11) 99999-9999" {...register("contact_phone")} /></Field>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-primary" {...register("consent_contact")} />
        <span>Autorizo a exibição pública do e-mail/telefone acima nesta vaga (LGPD). Você pode pedir a remoção a qualquer momento.</span>
      </label>
      {errors.consent_contact && <p className="text-sm text-destructive">{errors.consent_contact.message}</p>}
      <ConductNotice />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-5 w-5 accent-primary" {...register("accept_conduct")} />
        <span>Li e aceito o código de conduta do Pai Indica Pai. *</span>
      </label>
      {errors.accept_conduct && <p className="text-sm text-destructive">{errors.accept_conduct.message}</p>}
      <Controller control={control} name="turnstile_token" render={({ field }) => <TurnstileField onToken={field.onChange} error={errors.turnstile_token?.message} />} />
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={async () => { if (await form.trigger()) setPreview(true); }} className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-bold">
          <Eye className="h-4 w-4" /> Pré-visualizar
        </button>
        <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground">
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Enviar para moderação
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between"><label className="text-sm font-bold">{label}</label>{hint && <span className="text-xs text-muted-foreground">{hint}</span>}</div>
      {children}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
```
`ReferralForm.tsx` e `ProfessionalForm.tsx` seguem a mesma estrutura com seus schemas. `TurnstileField.tsx` usa
`@marsidev/react-turnstile` (`pnpm add @marsidev/react-turnstile`) com `siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}`.

### 4.3 Cards e diálogos
```tsx
// src/components/pip/JobCard.tsx
import { Link } from "@tanstack/react-router";
import { MapPin, Wifi, Clock, Building2 } from "lucide-react";
import { JOB_TYPES, JOB_AREAS } from "@/lib/pip/taxonomies";
import type { JobPublic } from "@/lib/pip/types";
import { formatSalaryRange, daysUntil } from "@/lib/pip/pip-db";

export function JobCard({ job }: { job: JobPublic }) {
  const left = daysUntil(job.expires_at);
  return (
    <Link to="/pai-indica-pai/vagas/$slug" params={{ slug: job.slug }}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold leading-tight group-hover:text-primary">{job.title}</h3>
        <span className="shrink-0 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">{JOB_TYPES[job.type]}</span>
      </div>
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" />{job.company}</p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {job.remote ? <><Wifi className="h-4 w-4" />Remoto — Brasil</> : <><MapPin className="h-4 w-4" />{job.city}/{job.uf}</>}
      </p>
      <p className="line-clamp-2 text-sm">{job.summary}</p>
      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span>{job.area ? JOB_AREAS[job.area] : ""} · {formatSalaryRange(job.salary_min, job.salary_max)}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{left <= 0 ? "encerra hoje" : `${left} dias`}</span>
      </div>
    </Link>
  );
}
```
- `ProfessionalCard`, `ReferralCard`, `MentorCard`: mesma casca (`rounded-2xl border bg-card p-5`), avatar 48px,
  badges com `bg-primary/10 text-primary`.
- `ReportDialog.tsx`: `Dialog` (Radix) com select de `REPORT_REASONS`, textarea, Turnstile, chama `reportEntity`
  (server fn `reportJob`, seção 4.4). Sucesso: "Obrigado. Nossa equipe vai revisar."
- `ShareWhatsAppButton.tsx`: `<a href={waUrl} target="_blank" rel="noopener" onClick={() => gaEvent('job_share_whatsapp', {job_id})}>`.
- `MentorshipRequestDialog.tsx`: form `mentorshipRequestSchema` → `supabase.from('mentorships').insert(...)`; erro de
  RLS (`new row violates row-level security`) → "Este mentor está com a agenda cheia no momento."

### 4.4 Server functions (`src/lib/pip/pip.functions.ts`)
Padrão: `createServerFn` do TanStack Start. Em versões recentes o validador é `.inputValidator()`; nas antigas `.validator()`.
**Use o mesmo método que `src/lib/seo.functions.ts` deste repo já usa.** Para agir como o usuário sob RLS, o cliente envia
`access_token` e o servidor cria um client Supabase com esse bearer (RLS continua valendo; nada roda com service role
exceto o digest de e-mails e os crons).

```ts
// src/lib/pip/pip.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { Resend } from "resend";
import type { Database } from "@/integrations/supabase/types";
import { jobSchema, referralSchema, professionalSchema, reportSchema, moderateSchema, jobsSearchSchema } from "./schemas";
import { containsBlacklisted } from "./blacklist";
import { makeUniqueSlug } from "./slug";
import { emailJobReceived, emailJobModerated } from "./emails";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;   // só em funções de servidor; nunca no cliente

const asUser = (token: string) =>
  createClient<Database>(SUPABASE_URL, SUPABASE_ANON, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
const asService = () => createClient<Database>(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
const anon = () => createClient<Database>(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: false } });

async function verifyTurnstile(token: string, ip?: string) {
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
  }).then((x) => x.json() as Promise<{ success: boolean }>);
  if (!r.success) throw new Error("TURNSTILE_FALHOU: confirme que você não é um robô e tente de novo.");
}

const withToken = <T extends z.ZodTypeAny>(s: T) => z.object({ access_token: z.string().min(20) }).and(s);

export const createJob = createServerFn({ method: "POST" })
  .inputValidator(withToken(jobSchema))
  .handler(async ({ data }) => {
    const { access_token, turnstile_token, accept_conduct: _a, ...job } = data;
    await verifyTurnstile(turnstile_token);
    const bad = containsBlacklisted([job.title, job.company, job.description, job.how_to_apply, job.contact_url ?? ""]);
    if (bad) throw new Error(`CONTEUDO_BLOQUEADO: o texto contém termo não permitido (${bad}).`);
    const sb = asUser(access_token);
    const { data: u } = await sb.auth.getUser();
    if (!u.user) throw new Error("NAO_AUTENTICADO");
    const slug = await makeUniqueSlug(sb, "jobs", `${job.title} ${job.company}`);
    const { data: row, error } = await sb.from("jobs").insert({
      ...job, slug, posted_by: u.user.id,
      city: job.remote ? null : job.city || null, uf: job.remote ? null : job.uf || null,
      contact_email: job.contact_email || null, contact_url: job.contact_url || null, contact_phone: job.contact_phone || null,
      salary_min: job.salary_min ?? null, salary_max: job.salary_max ?? null,
    }).select("id, slug, title").single();
    if (error) throw new Error(error.message);
    await new Resend(process.env.RESEND_API_KEY).emails.send(emailJobReceived({ to: u.user.email!, title: row.title, slug: row.slug }));
    return { id: row.id, slug: row.slug };
  });

export const createReferral = createServerFn({ method: "POST" })
  .inputValidator(withToken(referralSchema))
  .handler(async ({ data }) => { /* mesmo fluxo: turnstile → blacklist → asUser → insert job_referrals (referred_by) → e-mail */ });

export const createProfessional = createServerFn({ method: "POST" })
  .inputValidator(withToken(professionalSchema))
  .handler(async ({ data }) => { /* idem; slug = slugify(display_name + profession); upsert por user_id */ });

export const reportJob = createServerFn({ method: "POST" })
  .inputValidator(z.object({ access_token: z.string().optional() }).and(reportSchema))
  .handler(async ({ data }) => {
    await verifyTurnstile(data.turnstile_token);
    const sb = data.access_token ? asUser(data.access_token) : anon();
    const { error } = await sb.rpc("report_entity", { p_entity: data.entity, p_entity_id: data.entity_id, p_reason: data.reason, p_note: data.note ?? null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const moderateJob = createServerFn({ method: "POST" })
  .inputValidator(withToken(moderateSchema))
  .handler(async ({ data }) => {
    const sb = asUser(data.access_token);  // is_admin() é checado dentro da RPC
    const fn = data.entity === "job" ? "moderate_job" : data.entity === "job_referral" ? "moderate_referral" : "moderate_professional";
    const idArg = data.entity === "job" ? { p_job_id: data.id } : { p_id: data.id };
    const { data: row, error } = await sb.rpc(fn, { ...idArg, p_status: data.status, p_reason: data.reason ?? null } as never);
    if (error) throw new Error(error.message);
    // e-mail ao autor (service role para ler o e-mail em auth.users)
    const svc = asService();
    const authorId = (row as { posted_by?: string; referred_by?: string; user_id?: string }).posted_by
      ?? (row as { referred_by?: string }).referred_by ?? (row as { user_id?: string }).user_id;
    if (authorId) {
      const { data: au } = await svc.auth.admin.getUserById(authorId);
      if (au.user?.email) await new Resend(process.env.RESEND_API_KEY).emails.send(emailJobModerated({ to: au.user.email, entity: data.entity, row, status: data.status, reason: data.reason }));
    }
    return row;
  });

export const listJobs = createServerFn({ method: "GET" })
  .inputValidator(jobsSearchSchema)
  .handler(async ({ data: s }) => {
    const sb = anon(); const PER = 12; const from = (s.pagina - 1) * PER;
    let q = sb.from("jobs_public").select("*", { count: "exact" });
    if (s.uf) q = q.eq("uf", s.uf);
    if (s.cidade) q = q.ilike("city", `%${s.cidade}%`);
    if (s.remoto) q = q.eq("remote", true);
    if (s.tipo) q = q.eq("type", s.tipo);
    if (s.area) q = q.eq("area", s.area);
    if (s.q) q = sb.from("jobs").select("id, slug, title, company, city, uf, remote, type, area, salary_min, salary_max, description, expires_at, moderated_at, views, created_at, updated_at", { count: "exact" })
                .eq("status", "approved").gt("expires_at", new Date().toISOString()).textSearch("search_content", s.q, { type: "websearch", config: "portuguese" }) as never;
    q = s.ordem === "expiram" ? q.order("expires_at", { ascending: true }) : s.ordem === "vistas" ? q.order("views", { ascending: false }) : q.order("published_at", { ascending: false });
    const { data, count, error } = await q.range(from, from + PER - 1);
    if (error) throw new Error(error.message);
    return { items: data ?? [], total: count ?? 0, page: s.pagina, perPage: PER };
  });

export const getJobBySlug = createServerFn({ method: "GET" })
  .inputValidator(z.object({ slug: z.string().min(3).max(200) }))
  .handler(async ({ data }) => {
    // service role para também achar expiradas/rejeitadas e montar a página "encerrada" (sem contato, sem JSON-LD)
    const { data: job } = await asService().from("jobs")
      .select("*, poster:profiles!jobs_posted_by_fkey(display_name, avatar_url, city, uf)").eq("slug", data.slug).maybeSingle();
    if (!job) return null;
    const live = job.status === "approved" && new Date(job.expires_at!) > new Date();
    const safe = { ...job, posted_by: undefined, moderated_by: undefined, rejection_reason: undefined,
      contact_email: live && job.consent_contact ? job.contact_email : null,
      contact_phone: live && job.consent_contact ? job.contact_phone : null,
      contact_url: live ? job.contact_url : null, description: live ? job.description : "", how_to_apply: live ? job.how_to_apply : "" };
    const { data: similar } = await anon().from("jobs_public").select("*").neq("id", job.id)
      .or(`area.eq.${job.area},uf.eq.${job.uf ?? "XX"}`).order("published_at", { ascending: false }).limit(3);
    return { job: safe, live, similar: similar ?? [] };
  });
```
Funções análogas: `listReferrals`, `listProfessionals`, `getProfessionalBySlug`, `listMentors`, `getPipHubData`.
`translatePipError(e)` em `pip-db.ts` mapeia `LIMITE_DIARIO`, `CONTEUDO_BLOQUEADO`, `TURNSTILE_FALHOU`,
`jobs_title_company_active_uniq`, `jobs_location`, `jobs_contact`, `row-level security` → mensagens em PT-BR.

### 4.5 Client helpers (`src/lib/pip/pip-db.ts`)
```ts
export async function fetchMyJobs(userId: string) { return supabase.from("jobs").select("*").eq("posted_by", userId).order("created_at", { ascending: false }); }
export async function renewJob(id: string) { const { data, error } = await supabase.rpc("renew_job", { p_job_id: id }); if (error) throw error; return data; }
export async function deleteJob(id: string) { const { error } = await supabase.from("jobs").delete().eq("id", id); if (error) throw error; }
export async function trackView(id: string) { const k = `job_view_${id}`; if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, "1"); await supabase.rpc("increment_job_views", { p_job_id: id }); }
export async function trackApply(id: string) { await supabase.rpc("track_job_apply_click", { p_job_id: id }); }
export const formatSalaryRange = (min?: number | null, max?: number | null) => {
  const f = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  if (!min && !max) return "A combinar"; if (min && max) return `${f(min)} a ${f(max)}/mês`; return `${min ? "a partir de " + f(min) : "até " + f(max!)}/mês`;
};
export const daysUntil = (iso: string | null) => iso ? Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000) : 0;
```

---

## 5. Alertas por e-mail (vagas novas na minha UF/área)

### 5.1 Preferências
- Guardadas em `newsletter_subscribers.segments` (jsonb), chave `vagas`:
  `{"vagas": {"ufs": ["SP","MG"], "areas": ["ti","comercial"], "remoto": true, "freq": "diario"}}`.
- `AlertsPreferencesForm.tsx` (no hub, na lista de vagas e em `/minha-conta?tab=alertas`): e-mail (pré-preenchido se
  logado), multi-select UF, multi-select área, switch "incluir remotas", botão "Quero receber". Upsert em
  `newsletter_subscribers` (`onConflict: 'email'`) mesclando `segments` (ler → mesclar → gravar). Se o e-mail não
  está confirmado (`confirmed_at` nulo), envia e-mail de confirmação (double opt-in, mesmo fluxo da newsletter da Fase 1).
- Link "Cancelar alertas de vagas" em todo e-mail → `/newsletter/preferencias?token=` (Fase 1) remove a chave `vagas`.

### 5.2 Cron diário `GET /api/cron/vagas-digest`
```ts
// src/routes/api/cron/vagas-digest.ts (padrão de server route do TanStack Start usado no sitemap da Fase 1)
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { emailJobsDigest } from "@/lib/pip/emails";

export const Route = createFileRoute("/api/cron/vagas-digest")({
  server: { handlers: { GET: async ({ request }) => {
    if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("unauthorized", { status: 401 });
    const sb = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { data: jobs } = await sb.from("jobs_public").select("*").gte("published_at", since);
    if (!jobs?.length) return Response.json({ sent: 0, reason: "sem vagas novas" });
    const { data: subs } = await sb.from("newsletter_subscribers").select("email, segments").eq("status", "active").not("confirmed_at", "is", null).not("segments->vagas", "is", null);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const batch: Parameters<typeof resend.batch.send>[0] = [];
    for (const s of subs ?? []) {
      const p = (s.segments as { vagas?: { ufs?: string[]; areas?: string[]; remoto?: boolean } }).vagas ?? {};
      const mine = jobs.filter((j) => (p.ufs?.length ? p.ufs.includes(j.uf ?? "") : true) && (p.areas?.length ? p.areas.includes(j.area ?? "") : true) || (p.remoto && j.remote));
      if (mine.length) batch.push(emailJobsDigest({ to: s.email, jobs: mine.slice(0, 10) }));
    }
    for (let i = 0; i < batch.length; i += 100) await resend.batch.send(batch.slice(i, i + 100));  // Resend: 100 por batch
    return Response.json({ sent: batch.length, jobs: jobs.length });
  } } },
});
```
- `vercel.json`: `{"crons":[{"path":"/api/cron/vagas-digest","schedule":"0 11 * * *"},{"path":"/api/cron/expire-jobs","schedule":"30 6 * * *"}]}`
  (horários UTC = 08:00 e 03:30 Brasília). Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente quando a env
  `CRON_SECRET` existe no projeto.
- Template `emailJobsDigest`: assunto "N novas vagas para você — Pai Indica Pai", lista com título/empresa/local/link,
  rodapé antifraude e link de cancelamento. Remetente `Vocação de Pai <vagas@vocacaodepai.com.br>` (domínio verificado no Resend, Fase 1).
- Também enviar, na aprovação (`moderateJob`), e-mail ao autor "Sua vaga está no ar até DD/MM" com link e botão
  "Compartilhar no WhatsApp".

---

## 6. Admin: fila de moderação e bloqueio

Arquivos: `src/routes/_admin/admin/pai-indica-pai.tsx` (rota) e `src/admin/PipModeration.tsx` (página).
Em `src/admin/AdminDashboard.tsx` adicionar aba "Pai Indica Pai" com badge = pendentes (jobs + referrals + professionals
com `status='pending'`), seguindo o padrão das abas `stories`/`comments`.

`PipModeration.tsx`:
- Guard: `profile.role === 'admin'` (ou `editor`); senão, redireciona para `/admin`.
- Sub-abas: Vagas | Indicações | Profissionais | Denúncias | Bloqueados. Filtro de status (pendentes por padrão,
  ordenados por `auto_hidden desc, created_at asc`).
- Linha: título, autor (`display_name`, link para ver tudo do autor), cidade/UF, criado há X, `report_count` (badge
  vermelha se ≥1, "AUTO-OCULTA" se `auto_hidden`), botão "Ver" (abre `JobDetail` em `Sheet` lateral com todos os campos,
  inclusive contato e link clicável para checar).
- Ações: **Aprovar** (1 clique) · **Rejeitar** (abre `Dialog` com textarea "Motivo (vai para o autor)", mín. 10) ·
  **Bloquear autor** (`Dialog` com motivo → `block_user`; aviso "isso remove tudo que ele publicou"). Tudo via
  `moderateJob` (server fn) ou RPC direta pelo client admin (`supabase.rpc('block_user', ...)`).
- Aba Denúncias: `moderation_log` com `action in ('report','auto_hide')`, agrupado por entidade com contagem, link para
  o item, botão "Marcar como revisado" (insere `moderation_log action='review'`) e atalhos Aprovar/Rejeitar.
- Aba Bloqueados: `profiles` com `blocked_at not null`, botão "Desbloquear" (`block_user(p_block=false)`).
- Histórico por item: lista de `moderation_log` daquela `entity_id` (quem fez o quê e quando).
- Métricas no topo (seção 9): pendentes, aprovadas 7d, rejeitadas 7d, tempo médio de moderação, vagas ativas, views 7d, cliques 7d.

Motivos de rejeição pré-prontos (select que preenche o textarea): "Empresa/vaga não identificável", "Pede pagamento ou
dados bancários", "Conteúdo fora da linha editorial", "Duplicada", "Contato inválido", "Discriminação", "Outro".

---

## 7. Antifraude

| Camada | Onde | Regra |
|---|---|---|
| 7.1 Rate limit | trigger `pip_enforce_daily_limit` (banco) | 3 publicações/24h por usuário (jobs + referrals + professionals). Admin isento. Mensagem `LIMITE_DIARIO`. |
| 7.2 Turnstile | server fns `createJob/createReferral/createProfessional/reportJob` | Cloudflare Turnstile obrigatório; token verificado em `siteverify`. Envs: `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`. |
| 7.3 Blacklist | `src/lib/pip/blacklist.ts` | Domínios (`bit.ly`, `t.me`, `wa.link`, encurtadores, `*.xyz` suspeitos) e palavras ("renda extra garantida", "ganhe sem sair de casa", "depósito", "taxa de inscrição", "pix para", "aposta", "cassino", "adulto", "massagem", "sugar", "marketing multinível", "mmn", "hinode", "herbalife"). Também palavrões (lista `PALAVROES_BR`). Case-insensitive, sem acento. Mensagem `CONTEUDO_BLOQUEADO`. Admin pode estender via env `PIP_BLACKLIST_EXTRA` (CSV). |
| 7.4 E-mail verificado | `public.can_publish()` nas policies de insert | Sem `email_confirmed_at` → RLS nega. UI mostra aviso antes. |
| 7.5 Duplicidade | índice `jobs_title_company_active_uniq` | `lower(title)+lower(company)` único entre `pending/approved`. UI traduz o erro. Admin também vê "possível duplicata" (busca `ilike` por título na fila). |
| 7.6 Denúncias | `report_entity` | 3 denúncias → `pending` + `auto_hidden`. Logado só denuncia 1x/item; anônimo precisa de Turnstile. |
| 7.7 Bloqueio | `block_user` | Remove tudo do usuário do ar; `is_blocked()` impede novos inserts. |
| 7.8 Links | render | `contact_url` sempre `rel="nofollow noopener noreferrer"`, `target="_blank"`; só `http(s)`. |
| 7.9 Honeypot | formulários | campo oculto `website` (CSS `hidden`); se preenchido, descarta silenciosamente. |

Observação de segurança: Turnstile protege os formulários; quem chamar a API do Supabase direto ainda esbarra em
RLS (e-mail verificado, não bloqueado, `status='pending'` forçado), no rate limit do banco e na moderação humana.
Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no cliente (só `process.env` em server fns / server routes).

---

## 8. SEO: Google for Jobs, sitemap e RSS

### 8.1 JSON-LD `JobPosting` (`src/lib/pip/jsonld.ts`)
Campos obrigatórios do Google: `title`, `description` (HTML permitido; aqui texto com `<p>`/`<br>`), `datePosted`,
`hiringOrganization`, `jobLocation` **ou** `jobLocationType: "TELECOMMUTE"` (+ `applicantLocationRequirements`),
`validThrough` (recomendado forte; obrigatório para expirar). `employmentType` e `baseSalary` recomendados.
```ts
import type { JobRow } from "./types";
const EMPLOYMENT: Record<JobRow["type"], string> = { clt: "FULL_TIME", pj: "CONTRACTOR", freela: "CONTRACTOR", estagio: "INTERN", temporario: "TEMPORARY" };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const toHtml = (s: string) => s.split(/\n{2,}/).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");

export function jobPostingJsonLd(job: JobRow, url: string) {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/", "@type": "JobPosting",
    title: job.title, description: toHtml(job.description + "\n\nComo se candidatar:\n" + job.how_to_apply),
    datePosted: (job.moderated_at ?? job.created_at).slice(0, 10),
    validThrough: job.expires_at,
    employmentType: EMPLOYMENT[job.type],
    hiringOrganization: { "@type": "Organization", name: job.company },
    identifier: { "@type": "PropertyValue", name: job.company, value: job.id },
    directApply: false, url,
  };
  if (job.remote) {
    ld.jobLocationType = "TELECOMMUTE";
    ld.applicantLocationRequirements = { "@type": "Country", name: "Brasil" };
  } else {
    ld.jobLocation = { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.city, addressRegion: job.uf, addressCountry: "BR" } };
  }
  if (job.salary_min || job.salary_max) {
    ld.baseSalary = { "@type": "MonetaryAmount", currency: "BRL",
      value: { "@type": "QuantitativeValue", unitText: "MONTH", ...(job.salary_min ? { minValue: job.salary_min } : {}), ...(job.salary_max ? { maxValue: job.salary_max } : {}),
               ...(job.salary_min && job.salary_max ? {} : { value: job.salary_min ?? job.salary_max }) } };
  }
  return ld;
}
```
Regras: só emitir em vaga `live`; ao expirar, a página fica `noindex` e sem o bloco (Google penaliza JobPosting com
`validThrough` passado ainda indexado). Testar no Rich Results Test. Também emitir `BreadcrumbList`
(Início › Pai Indica Pai › Vagas › {title}).

### 8.2 Sitemap `GET /sitemap-vagas.xml`
- Lista `jobs_public` (`/pai-indica-pai/vagas/{slug}`, `lastmod = updated_at`, `changefreq daily`, `priority 0.7`) +
  `professionals` aprovados (`/pai-indica-pai/profissionais/{slug}`) + páginas estáticas da seção.
- Registrar no sitemap index da Fase 1 (`/sitemap.xml` → `<sitemap><loc>https://vocacaodepai.com.br/sitemap-vagas.xml</loc>`).
- `Cache-Control: public, max-age=900, s-maxage=3600`.
- Para indexação rápida: após `moderate_job(approved)`, chamar Google Indexing API **só se** a conta de serviço estiver
  configurada (env `GOOGLE_INDEXING_SA_JSON`); senão, pular silenciosamente (a Indexing API é oficialmente permitida para
  `JobPosting`). Implementar em `src/lib/pip/indexing.ts` com `googleapis` apenas se a Fase 8 já tiver a credencial;
  caso contrário deixar TODO explícito e seguir.

### 8.3 RSS `GET /pai-indica-pai/vagas/feed.xml`
- RSS 2.0, 50 vagas mais recentes de `jobs_public`: `<title>{title} — {company} ({city/UF ou Remoto})</title>`,
  `<link>`, `<guid isPermaLink="true">`, `<pubDate>` (published_at), `<description>` (summary escapado),
  `<category>` (área e tipo). `<atom:link rel="self">`. Header `Content-Type: application/rss+xml; charset=utf-8`.
- Link `<link rel="alternate" type="application/rss+xml" title="Vagas — Pai Indica Pai">` no `head()` da lista de vagas.
- Feeds filtrados por query string: `?uf=SP`, `?area=ti`, `?remoto=1` (mesmo validador `jobsSearchSchema`).

---

## 9. Métricas

- `jobs.views` (RPC `increment_job_views`, dedupe por sessão) e `jobs.apply_clicks` (RPC `track_job_apply_click` em
  cada botão de candidatura). `job_referrals.views` e `professionals.views` idem (criar RPCs análogas se sobrar tempo;
  senão, apenas vagas nesta fase).
- GA4 (helper `gaEvent` da Fase 1): `job_view {job_id, area, uf, remote}`, `job_apply_click {job_id, channel: email|url|whatsapp}`,
  `job_share_whatsapp {job_id}`, `job_report {entity}`, `job_submit {status: ok|error}`, `mentorship_request`.
- Painel admin (seção 6) e Painel Lisieux (Fase 8) consomem a view:
```sql
create or replace view public.pip_metrics_daily as
select date_trunc('day', created_at)::date as day,
       count(*) filter (where status = 'pending') as pending,
       count(*) filter (where status = 'approved') as approved,
       count(*) filter (where status = 'rejected') as rejected,
       sum(views) as views, sum(apply_clicks) as apply_clicks
from public.jobs group by 1 order by 1 desc;
grant select on public.pip_metrics_daily to authenticated;  -- admin lê; RLS da tabela base não se aplica a views security invoker? → marcar: alter view public.pip_metrics_daily set (security_invoker = on);
```
  (adicionar ao final da migration 0005 ou em `0005b_pip_metrics.sql`.)
- Taxa de conversão exibida ao autor em "Minhas vagas": `apply_clicks / views`.

---

## 10. Critérios de aceite

1. `supabase db push` aplica `0005_pai_indica_pai.sql` sem erro; as 3 queries de verificação da seção 2 retornam o esperado.
2. Anônimo em `/pai-indica-pai/vagas` vê só vagas `approved` não expiradas (testar inserindo uma `pending` e uma com
   `expires_at` passado via SQL: nenhuma aparece).
3. Usuário sem e-mail confirmado não consegue inserir (erro RLS) e vê o aviso com "Reenviar e-mail".
4. Usuário verificado publica vaga em `/pai-indica-pai/vagas/nova`: zod bloqueia campos inválidos; preview funciona;
   envio cria linha `pending`; e-mail "Recebemos sua vaga" chega (Resend logs).
5. 4ª publicação no mesmo dia falha com mensagem "você já publicou 3 itens...".
6. Mesma vaga (título+empresa) duas vezes → mensagem de duplicidade.
7. Texto com "renda extra garantida" ou link `bit.ly` → `CONTEUDO_BLOQUEADO`.
8. Sem token Turnstile válido → erro; com token → sucesso.
9. Admin em `/admin/pai-indica-pai` vê a pendente, aprova → `status=approved`, `expires_at = agora+30d`,
   `moderation_log` com `approve`, autor recebe e-mail. Rejeitar sem motivo é impedido; com motivo → e-mail com motivo.
10. Vaga aprovada aparece na lista, nos filtros (UF, remoto, tipo, área, busca por palavra do título), no
    `/sitemap-vagas.xml` e no `/pai-indica-pai/vagas/feed.xml`.
11. Página da vaga tem JSON-LD válido no Rich Results Test (tipo JobPosting, sem erros), botões de candidatura
    incrementam `apply_clicks`, "Compartilhar no WhatsApp" abre `wa.me` com título+link, views incrementam 1x por sessão.
12. 3 denúncias (3 navegadores/anônimos) escondem a vaga (`pending`, `auto_hidden=true`) e ela aparece no topo da fila.
13. `select public.expire_jobs()` marca vaga com `expires_at` passado como `expired`; página dela mostra "Vaga encerrada",
    `noindex`, sem JSON-LD, com 3 semelhantes; `GET /api/cron/expire-jobs` com `CRON_SECRET` responde 200 e sem ele 401.
14. Autor renova vaga a 7 dias do fim (`renew_job`) e `expires_at` avança 30 dias; na 4ª renovação volta a `pending`.
15. Autor edita vaga aprovada → volta a `pending` e sai do ar; admin não precisa de nada além de aprovar de novo.
16. Pai Profissional: cria perfil (1 por usuário), aprovado aparece no diretório com filtros; perfil com contato só se
    `consent_contact`.
17. Indicações: fluxo completo (nova → pending → aprovada → lista por kind) e expiração em 90 dias.
18. Mentoria: mentor aprovado com `is_mentor` aparece; mentorado pede; mentor aceita em `/minha-conta?tab=mentoria`;
    ambos recebem e-mail; capacidade cheia → pedido negado com mensagem amigável.
19. Alertas: assinante com `segments.vagas.ufs=["SP"]` recebe o digest quando `GET /api/cron/vagas-digest` roda após uma
    vaga SP aprovada nas últimas 24h; sem vagas novas responde `sent: 0`.
20. Bloqueio: `block_user` tira todas as publicações do usuário do ar e novos inserts falham; desbloqueio reverte o bloqueio
    (publicações antigas continuam `rejected`).
21. `/minha-conta` → aba "Pai Indica Pai": lista minhas vagas/indicações/perfil com status, Editar, Renovar, Excluir
    (hard delete funciona — LGPD).
22. `pnpm typecheck`, `pnpm lint` e `pnpm build` passam; Lighthouse mobile da lista de vagas ≥ 90 em Performance/SEO/Acessibilidade.
23. Nada em inglês na UI; nenhum texto, imagem ou exemplo fora da linha editorial do grupo.

---

## 11. Prompt para iniciar esta fase no Sonnet

```text
Você está em /home/user/vocacaodepai (TanStack Start + React 19 + Tailwind 4 + Supabase + Vercel + Resend).
Leia primeiro, nesta ordem: CLAUDE.md, docs/plano/02-arquitetura-e-stack.md, docs/plano/08-fase-6-pai-indica-pai.md
e docs/plano/PROGRESSO.md. Execute a FASE 6 (Pai Indica Pai) exatamente como o documento 08 descreve, na ordem da
seção 0: (1) migration supabase/migrations/0005_pai_indica_pai.sql copiada da seção 2 e aplicada; regenerar
src/integrations/supabase/types.ts; (2) src/lib/pip/{taxonomies,schemas,types,blacklist,slug,pip-db,pip.functions,jsonld,emails}.ts;
(3) rotas em src/routes/_site/pai-indica-pai/** e páginas em src/pages/pai-indica-pai/** conforme a tabela da seção 3;
(4) componentes em src/components/pip/** (seção 4); (5) admin em src/admin/PipModeration.tsx + rota
src/routes/_admin/admin/pai-indica-pai.tsx + aba no AdminDashboard (seção 6); (6) antifraude (Turnstile, blacklist,
honeypot — seção 7); (7) server routes /api/cron/expire-jobs, /api/cron/vagas-digest, /sitemap-vagas.xml,
/pai-indica-pai/vagas/feed.xml e vercel.json com os crons (seções 5 e 8); (8) aba "Pai Indica Pai" e "Mentoria" em
/minha-conta. Use os mesmos padrões já existentes no repo (createFileRoute + head(), react-hook-form + zod,
createServerFn como em src/lib/seo.functions.ts, toast do sonner, is_admin()). Não invente nomes de tabela/coluna:
use os da seção 2. Textos só em PT-BR, linha editorial do CLAUDE.md. Variáveis de ambiente novas:
VITE_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY, CRON_SECRET, SUPABASE_SERVICE_ROLE_KEY (server only) — adicione em
.env.example e liste no final para eu cadastrar na Vercel. Trabalhe na branch claude/fase-6-pai-indica-pai com commits
pequenos por etapa. Ao final de cada etapa rode pnpm typecheck && pnpm lint && pnpm build. Ao terminar, percorra os 23
critérios de aceite da seção 10, marque o checklist da seção 12 no próprio arquivo 08 e atualize docs/plano/PROGRESSO.md
com o que ficou pronto, o que ficou pendente e os comandos para eu testar. Se algo do documento conflitar com o código
real do repo (nome de helper, versão de API do TanStack), siga o repo e anote a diferença em PROGRESSO.md.
```

---

## 12. Checklist de pronto

### Banco
- [ ] `0005_pai_indica_pai.sql` aplicada (tabelas `jobs`, `job_referrals`, `professionals`, `mentorships`, `moderation_log`)
- [ ] Funções: `email_verified`, `is_blocked`, `can_publish`, `expire_jobs`, `moderate_job`, `moderate_referral`,
      `moderate_professional`, `renew_job`, `renew_referral`, `report_entity`, `increment_job_views`, `track_job_apply_click`,
      `block_user`, `respond_mentorship`
- [ ] Triggers: rate limit diário, reset de status na edição, `updated_at`
- [ ] RLS testada com anon, autor e admin; view `jobs_public`; `pip_metrics_daily`
- [ ] pg_cron `vdp-expire-jobs` agendado (ou Vercel Cron confirmado)
- [ ] `types.ts` regenerado

### Código
- [ ] `src/lib/pip/*` (taxonomias, schemas zod, blacklist, slug, server fns, jsonld, e-mails)
- [ ] Rotas + páginas: hub, vagas (lista/detalhe/nova), profissionais (lista/perfil/novo), indicações (lista/nova), mentoria
- [ ] Componentes: JobCard, JobDetail, JobFilters, JobForm, JobPreview, ProfessionalCard/Form, ReferralCard/Form,
      MentorCard, MentorshipRequestDialog, ReportDialog, ShareWhatsAppButton, AlertsPreferencesForm, ConductNotice, TurnstileField
- [ ] `/minha-conta`: abas "Pai Indica Pai" (minhas publicações: editar/renovar/excluir) e "Mentoria"
- [ ] Admin: `PipModeration.tsx`, rota `/admin/pai-indica-pai`, badge no dashboard, bloqueio/desbloqueio, aba denúncias
- [ ] Server routes: `/api/cron/expire-jobs`, `/api/cron/vagas-digest`, `/sitemap-vagas.xml`, `/pai-indica-pai/vagas/feed.xml`
- [ ] `vercel.json` com os 2 crons; sitemap index referencia `sitemap-vagas.xml`
- [ ] JSON-LD JobPosting válido (Rich Results Test) + BreadcrumbList; expirada = noindex sem JSON-LD
- [ ] GA4 events: job_view, job_apply_click, job_share_whatsapp, job_report, job_submit, mentorship_request

### Antifraude e LGPD
- [ ] Turnstile nos 4 formulários (vaga, indicação, profissional, denúncia) + honeypot
- [ ] Blacklist de domínios/palavras ativa e testada
- [ ] Duplicidade título+empresa bloqueada com mensagem em PT-BR
- [ ] Contato só exibido com `consent_contact`; e-mail do autor nunca exposto; hard delete funciona
- [ ] Texto antifraude no rodapé de cada vaga; código de conduta no hub e aceito no formulário

### Operação
- [ ] Envs cadastradas na Vercel: `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
- [ ] Remetente `vagas@vocacaodepai.com.br` verificado no Resend; templates (recebida, aprovada, rejeitada, digest, mentoria) testados
- [ ] 23 critérios de aceite da seção 10 verificados manualmente
- [ ] `pnpm typecheck && pnpm lint && pnpm build` verdes; Lighthouse ≥ 90
- [ ] `docs/plano/PROGRESSO.md` atualizado; PR `claude/fase-6-pai-indica-pai` aberto
