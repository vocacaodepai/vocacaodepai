# FASE 5 — Área do Pai (membros, autenticação, fases do filho, salvos, e-mails, planos, LGPD)

> Documento executável. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code em `/home/user/vocacaodepai`.
> Siga os passos na ordem. Cada passo tem caminho exato, esqueleto e critério de aceite.
> Pré-requisitos: Fases 1–4 concluídas (projeto TanStack Start rodando, Supabase `<SUPABASE_PROJECT_REF>` com
> `0001_core.sql`, `0002_blog.sql`, `0003_loja.sql` aplicadas; `/blog`, `/loja`, `/ferramentas` funcionando).
> Se `docs/plano/02-arquitetura-e-stack.md` existir e divergir deste documento em NOMES de tabelas/colunas, ele prevalece.

---

## 0. Resumo executivo da fase

| Item | Decisão fixa |
|---|---|
| Autenticação | Supabase Auth: e-mail+senha, magic link (OTP por e-mail) e Google OAuth. Sem Facebook/Apple nesta fase. |
| Perfil | `profiles` criado automaticamente pelo trigger `on_auth_user_created` → `public.handle_new_user()`. |
| Migration | `supabase/migrations/0004_membros.sql` (profiles, children, saved_items, newsletter_subscribers, plans, subscriptions, badges, user_badges + funções). |
| Fases do filho | 8 fases calculadas por `public.child_phase(birth_date)`; conteúdo direcionado por **tags** `fase-<slug>`. |
| Rotas novas | `/entrar`, `/cadastro`, `/recuperar-senha`, `/auth/callback`, `/area-do-pai`, `/area-do-pai/onboarding`, `/area-do-pai/filhos`, `/area-do-pai/salvos`, `/minha-conta`. |
| Salvar | Componente `SaveButton` + server function `toggleSavedItemFn` (RLS garante o dono). |
| E-mails | Resend via Edge Functions `send-welcome-email`, `newsletter-confirm`, `weekly-digest` (pg_cron domingo 08:00 BRT). |
| Planos | `gratuito` ("Pai de Família") e `pai-de-valor` ("Pai de Valor", R$ 19,90/mês ou R$ 179,00/ano). Provedor: **Mercado Pago** (Pix + assinatura). `BILLING_ENABLED=false` por enquanto; gating via `usePlan()`. |
| Segurança | RLS em tudo, rate limit em server functions, Cloudflare Turnstile no cadastro, e-mail verificado para publicar. |
| LGPD | Consentimento registrado, `export_my_data()` (JSON) e `delete_my_account()`. |
| Admin | `/admin/membros`: lista, busca, troca de role (somente admin), log em `moderation_log`. |

O que esta fase NÃO faz: cobrança real (webhooks ficam prontos mas desligados), trilhas/desafios (Fase 7 — aqui só exibimos
"em andamento" se as tabelas existirem), vagas/indicações (Fase 6 — aqui só o bloco "Minhas vagas" lendo `jobs` se existir).

---

## 1. Supabase Auth — configuração

### 1.1 Painel Supabase (projeto `<SUPABASE_PROJECT_REF>`, região sa-east-1)

1. **Authentication → Providers → Email**
   - Enable Email provider: ON
   - Confirm email: **ON** (obrigatório — publicar vaga/história exige e-mail confirmado)
   - Secure email change: ON
   - Minimum password length: **8**
   - Password requirements: "Letters and digits"
2. **Authentication → Providers → Google**: Enable: ON. Preencher Client ID e Client Secret obtidos no passo 1.2.
   Copiar a "Callback URL (for OAuth)": `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`.
3. **Authentication → URL Configuration**
   - Site URL: `https://vocacaodepai.com.br`
   - Additional Redirect URLs (uma por linha):
     ```
     https://vocacaodepai.com.br/auth/callback
     https://www.vocacaodepai.com.br/auth/callback
     https://*-portal-da-ai.vercel.app/auth/callback
     http://localhost:3000/auth/callback
     http://127.0.0.1:3000/auth/callback
     ```
4. **Authentication → Email Templates** (PT-BR; `{{ .ConfirmationURL }}` é obrigatório em cada um):
   - Confirm signup — Assunto: `Confirme seu e-mail — Vocação de Pai`
     Corpo: `<h2>Bem-vindo, pai.</h2><p>Confirme seu e-mail para ativar sua conta na Área do Pai.</p><p><a href="{{ .ConfirmationURL }}">Confirmar e-mail</a></p><p>Se não foi você, ignore esta mensagem.</p>`
   - Magic Link — Assunto: `Seu link de acesso — Vocação de Pai`
     Corpo: `<p>Clique para entrar: <a href="{{ .ConfirmationURL }}">Entrar na Área do Pai</a>. O link vale por 1 hora.</p>`
   - Reset Password — Assunto: `Redefinir senha — Vocação de Pai`
     Corpo: `<p>Recebemos um pedido para redefinir sua senha.</p><p><a href="{{ .ConfirmationURL }}">Criar nova senha</a></p>`
   - Change Email — Assunto: `Confirme a troca de e-mail — Vocação de Pai`
5. **Authentication → SMTP Settings** (Custom SMTP, para não cair no limite de 3 e-mails/hora do Supabase):
   - Host `smtp.resend.com`, Port `465`, User `resend`, Password `<RESEND_API_KEY>`,
     Sender email `nao-responda@vocacaodepai.com.br`, Sender name `Vocação de Pai`.
   - Pré-requisito: domínio `vocacaodepai.com.br` verificado no Resend (DKIM + SPF + MX de retorno).
6. **Authentication → Rate Limits**: Email sent 10/h, Token verifications 30/5min, Sign-ups 30/h por IP, Token refresh 150/5min.
7. **Database → Extensions**: habilitar `pg_cron`, `pg_net`, `supabase_vault` (já vêm no projeto; só confirmar).
8. **Project Settings → Vault**: criar segredos `RESEND_API_KEY`, `INTERNAL_FN_SECRET` (gerar com `openssl rand -hex 32`),
   `TURNSTILE_SECRET_KEY`. A função `public.get_secret(name)` (criada em `0001_core.sql`; se não existir, a seção 2.3 cria) lê do Vault.

### 1.2 Google Cloud Console (OAuth)

1. Projeto Google Cloud: usar o projeto do grupo ("Portal da AI") ou criar `vocacaodepai`.
2. **APIs e serviços → Tela de consentimento OAuth**: tipo Externo; nome do app `Vocação de Pai`; e-mail de suporte
   `contato@vocacaodepai.com.br`; domínio autorizado `vocacaodepai.com.br` e `supabase.co`; links de Política de
   Privacidade `https://vocacaodepai.com.br/politica-de-privacidade` e Termos `https://vocacaodepai.com.br/termos-de-uso`.
   Escopos: `openid`, `email`, `profile`. **Publicar o app** (status "Em produção"), senão só contas de teste logam.
3. **Credenciais → Criar credenciais → ID do cliente OAuth → Aplicativo da Web**
   - Nome: `vocacaodepai-web`
   - Origens JavaScript autorizadas: `https://vocacaodepai.com.br`, `https://www.vocacaodepai.com.br`, `http://localhost:3000`
   - URIs de redirecionamento autorizados: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
4. Copiar Client ID / Client Secret → colar no Supabase (passo 1.1.2).
5. Teste: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin + '/auth/callback' } })`.
   Erro `redirect_uri_mismatch` = URI do passo 3 errada; erro `access_denied`/`forbidden` = app não publicado.

### 1.3 `supabase/config.toml` (desenvolvimento local com `supabase start`)

Substituir/adicionar no arquivo (manter `project_id = "<SUPABASE_PROJECT_REF>"` no topo):

```toml
project_id = "<SUPABASE_PROJECT_REF>"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback", "http://127.0.0.1:3000/auth/callback"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
refresh_token_reuse_interval = 10
enable_signup = true
enable_anonymous_sign_ins = false
minimum_password_length = 8
password_requirements = "letters_digits"

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
secure_password_change = true
max_frequency = "1m0s"
otp_length = 6
otp_expiry = 3600

[auth.email.template.confirmation]
subject = "Confirme seu e-mail — Vocação de Pai"
content_path = "./supabase/templates/confirmation.html"

[auth.email.template.magic_link]
subject = "Seu link de acesso — Vocação de Pai"
content_path = "./supabase/templates/magic_link.html"

[auth.email.template.recovery]
subject = "Redefinir senha — Vocação de Pai"
content_path = "./supabase/templates/recovery.html"

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_OAUTH_CLIENT_ID)"
secret = "env(GOOGLE_OAUTH_CLIENT_SECRET)"
redirect_uri = ""
skip_nonce_check = true

[auth.rate_limit]
email_sent = 10
sign_in_sign_ups = 30
token_verifications = 30
token_refresh = 150

[edge_runtime]
enabled = true
policy = "oneshot"
```

Criar os três HTMLs em `supabase/templates/` com o mesmo conteúdo da seção 1.1.4 (use `{{ .ConfirmationURL }}`).

### 1.4 Variáveis de ambiente (Vercel + `.env.local`)

Adicionar ao `.env.example` e configurar na Vercel (Production + Preview):

```
VITE_SUPABASE_URL=https://<SUPABASE_PROJECT_REF>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://<SUPABASE_PROJECT_REF>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=...            # só server; nunca com prefixo VITE_
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
RESEND_API_KEY=re_...
BILLING_ENABLED=false
VITE_BILLING_ENABLED=false
MERCADOPAGO_ACCESS_TOKEN=                # vazio até ligar cobrança
MERCADOPAGO_WEBHOOK_SECRET=
INTERNAL_FN_SECRET=                      # igual ao Vault
```

Critério de aceite 1: no painel, "Providers" mostra Email (confirm ON) e Google ON; `supabase start` sobe sem erro de
config; `.env.example` atualizado e commitado (sem valores reais).

---

## 2. Migration `supabase/migrations/0004_membros.sql`

Regras: idempotente (`if not exists` / `drop policy if exists`), tudo em `public`, funções com `set search_path = public`,
nomes de colunas exatamente como COLUNAS-CHAVE. `profiles` pode já existir desde `0001_core.sql` — por isso usamos
`create table if not exists` + `alter table ... add column if not exists`.

### 2.1 Conteúdo completo

```sql
-- =====================================================================
-- 0004_membros.sql — Área do Pai: perfis, filhos, salvos, newsletter,
-- planos/assinaturas, badges, funções de autorização e LGPD.
-- Idempotente. Executar após 0001_core, 0002_blog, 0003_loja.
-- =====================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- ---------- utilitário: updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('member','editor','admin')),
  bio text,
  city text,
  uf char(2),
  onboarding_done boolean not null default false,
  newsletter_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- colunas adicionais da Fase 5 (aditivas; não alteram COLUNAS-CHAVE)
alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists consent_terms_at timestamptz;
alter table public.profiles add column if not exists consent_privacy_at timestamptz;
alter table public.profiles add column if not exists last_seen_at timestamptz;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- autorização ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','editor'));
$$;
grant execute on function public.is_staff() to anon, authenticated;

-- e-mail confirmado? (usado nas RLS de publicação das Fases 6 e 7)
create or replace function public.email_verified()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select email_confirmed_at is not null from auth.users where id = auth.uid()), false);
$$;
grant execute on function public.email_verified() to authenticated;

-- ---------- criação automática do perfil ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );
  v_avatar := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
  insert into public.profiles (id, display_name, avatar_url, role, newsletter_opt_in)
  values (
    new.id,
    left(v_name, 80),
    v_avatar,
    'member',
    coalesce((new.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- impede escalada de privilégio: só admin muda role, e nunca o próprio
create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    if not public.is_admin() then
      raise exception 'Somente administradores alteram papéis.' using errcode = '42501';
    end if;
    if old.id = auth.uid() then
      raise exception 'Você não pode alterar o próprio papel.' using errcode = '42501';
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

-- ---------- children ----------
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  birth_date date not null,
  sex text check (sex in ('m','f') or sex is null),
  created_at timestamptz not null default now()
);
create index if not exists children_user_idx on public.children(user_id);

-- fase do filho a partir da data de nascimento (futura = gestação)
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

-- ---------- saved_items ----------
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('post','product','tool','job','track')),
  item_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);
create index if not exists saved_items_user_idx on public.saved_items(user_id, created_at desc);

-- ---------- newsletter_subscribers ----------
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  segments jsonb not null default '[]'::jsonb,   -- ex.: ["fase:bebe","tema:financas"]
  confirm_token uuid not null default gen_random_uuid(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_newsletter_updated_at on public.newsletter_subscribers;
create trigger trg_newsletter_updated_at before update on public.newsletter_subscribers
  for each row execute function public.touch_updated_at();

-- ---------- plans / subscriptions ----------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  price_cents int not null default 0,
  interval text not null default 'month' check (interval in ('month','year','lifetime')),
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  provider text not null default 'manual' check (provider in ('manual','mercadopago','stripe')),
  provider_id text,                       -- preapproval_id (MP) ou subscription id (Stripe)
  status text not null default 'active' check (status in ('trialing','active','past_due','canceled','expired')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id, status);
create unique index if not exists subscriptions_provider_uidx on public.subscriptions(provider, provider_id)
  where provider_id is not null;
drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.touch_updated_at();

insert into public.plans (slug, name, price_cents, interval, features) values
  ('gratuito', 'Pai de Família', 0, 'lifetime',
   '["Blog, Pai Indica, Loja e Ferramentas","Salvar conteúdos","Perfil dos filhos e conteúdo por fase","Trilhas básicas e desafios","Pai Indica Pai: vagas e indicações","Newsletter semanal"]'::jsonb),
  ('pai-de-valor-mensal', 'Pai de Valor (mensal)', 1990, 'month',
   '["Tudo do plano gratuito","Trilhas avançadas e certificados","Grupos fechados da Irmandade","E-books e guias em PDF","Descontos de parceiros","Mentorias em grupo mensais","Sem anúncios"]'::jsonb),
  ('pai-de-valor-anual', 'Pai de Valor (anual)', 17900, 'year',
   '["Tudo do plano gratuito","Trilhas avançadas e certificados","Grupos fechados da Irmandade","E-books e guias em PDF","Descontos de parceiros","Mentorias em grupo mensais","Sem anúncios","2 meses grátis"]'::jsonb)
on conflict (slug) do update set name = excluded.name, price_cents = excluded.price_cents, features = excluded.features;

-- plano efetivo do usuário logado
create or replace function public.my_plan_slug()
returns text language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.slug from public.subscriptions s join public.plans p on p.id = s.plan_id
      where s.user_id = auth.uid() and s.status in ('trialing','active')
        and (s.current_period_end is null or s.current_period_end > now())
      order by s.current_period_end desc nulls last limit 1),
    'gratuito');
$$;
grant execute on function public.my_plan_slug() to authenticated;

create or replace function public.is_premium()
returns boolean language sql stable security definer set search_path = public as $$
  select public.my_plan_slug() like 'pai-de-valor%';
$$;
grant execute on function public.is_premium() to authenticated;

-- ---------- badges ----------
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  rule jsonb not null default '{}'::jsonb,   -- {"type":"saved_count","min":10}
  created_at timestamptz not null default now()
);
create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

insert into public.badges (slug, name, description, icon, rule) values
  ('primeiro-passo', 'Primeiro passo', 'Completou o onboarding da Área do Pai.', 'footprints', '{"type":"onboarding_done"}'),
  ('pai-presente', 'Pai presente', 'Cadastrou o primeiro filho.', 'baby', '{"type":"children_count","min":1}'),
  ('colecionador', 'Colecionador', 'Salvou 10 conteúdos.', 'bookmark', '{"type":"saved_count","min":10}'),
  ('leitor-fiel', 'Leitor fiel', 'Confirmou a newsletter semanal.', 'mail-check', '{"type":"newsletter_confirmed"}'),
  ('pai-de-valor', 'Pai de Valor', 'Assinante do plano Pai de Valor.', 'shield-check', '{"type":"premium"}')
on conflict (slug) do nothing;

-- concessão de badges (chamada pelo client após ações; idempotente)
create or replace function public.grant_badges_for_me()
returns setof text language plpgsql security definer set search_path = public as $$
declare
  b record; ok boolean; v_saved int; v_children int; v_news boolean;
begin
  if auth.uid() is null then return; end if;
  select count(*) into v_saved from public.saved_items where user_id = auth.uid();
  select count(*) into v_children from public.children where user_id = auth.uid();
  select exists(select 1 from public.newsletter_subscribers n join auth.users u on u.email = n.email
                where u.id = auth.uid() and n.status = 'confirmed') into v_news;
  for b in select * from public.badges loop
    ok := case b.rule->>'type'
      when 'onboarding_done' then (select onboarding_done from public.profiles where id = auth.uid())
      when 'children_count' then v_children >= coalesce((b.rule->>'min')::int, 1)
      when 'saved_count' then v_saved >= coalesce((b.rule->>'min')::int, 1)
      when 'newsletter_confirmed' then v_news
      when 'premium' then public.is_premium()
      else false end;
    if ok then
      insert into public.user_badges (user_id, badge_id) values (auth.uid(), b.id)
      on conflict do nothing;
      if found then return next b.slug; end if;
    end if;
  end loop;
end $$;
grant execute on function public.grant_badges_for_me() to authenticated;

-- ---------- conteúdo por fase ----------
-- Convenção: tags.slug = 'fase-<slug_da_fase>' (fase-gestacao, fase-bebe, ...). Criadas aqui se não existirem.
insert into public.tags (slug, name) values
  ('fase-gestacao','Gestação'),('fase-recem-nascido','Recém-nascido (0-3 meses)'),('fase-bebe','Bebê (4-12 meses)'),
  ('fase-primeira-infancia','1 a 3 anos'),('fase-infancia','4 a 7 anos'),('fase-pre-adolescencia','8 a 12 anos'),
  ('fase-adolescencia','13 a 17 anos'),('fase-adulto','Filho adulto'),('fase-todas','Todas as fases')
on conflict (slug) do nothing;

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
    and p.id not in (select item_id::uuid from public.saved_items
                     where user_id = auth.uid() and item_type = 'post' and item_id ~ '^[0-9a-f-]{36}$')
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

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.saved_items enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

-- profiles: anon nada; usuário lê/edita o próprio; admin tudo; perfis de autores (editor/admin) são lidos via view
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles for update to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()))
  with check ((select auth.uid()) = id or (select public.is_admin()));
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles for delete to authenticated
  using ((select public.is_admin()));

-- view pública de autores (para bylines do blog) — só campos públicos
create or replace view public.public_authors
  with (security_invoker = off) as
  select id, display_name, avatar_url, bio, role from public.profiles where role in ('admin','editor');
grant select on public.public_authors to anon, authenticated;

-- children
drop policy if exists "children_all_own" on public.children;
create policy "children_all_own" on public.children for all to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()))
  with check ((select auth.uid()) = user_id);

-- saved_items
drop policy if exists "saved_items_all_own" on public.saved_items;
create policy "saved_items_all_own" on public.saved_items for all to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()))
  with check ((select auth.uid()) = user_id);

-- newsletter_subscribers: anon pode INSERIR (formulário público); leitura só do próprio (por user_id) ou admin;
-- confirmação/descadastro passam por funções (token), nunca por UPDATE direto.
drop policy if exists "newsletter_insert_public" on public.newsletter_subscribers;
create policy "newsletter_insert_public" on public.newsletter_subscribers for insert to anon, authenticated
  with check (status = 'pending' and confirmed_at is null);
drop policy if exists "newsletter_select_own_or_admin" on public.newsletter_subscribers;
create policy "newsletter_select_own_or_admin" on public.newsletter_subscribers for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
drop policy if exists "newsletter_update_admin" on public.newsletter_subscribers;
create policy "newsletter_update_admin" on public.newsletter_subscribers for update to authenticated
  using ((select public.is_admin()));
drop policy if exists "newsletter_delete_admin" on public.newsletter_subscribers;
create policy "newsletter_delete_admin" on public.newsletter_subscribers for delete to authenticated
  using ((select public.is_admin()));

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

-- plans: leitura pública dos ativos; escrita admin
drop policy if exists "plans_select_active" on public.plans;
create policy "plans_select_active" on public.plans for select to anon, authenticated
  using (active = true or (select public.is_admin()));
drop policy if exists "plans_write_admin" on public.plans;
create policy "plans_write_admin" on public.plans for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- subscriptions: usuário lê a própria; escrita só admin/service_role (webhooks usam service_role e ignoram RLS)
drop policy if exists "subscriptions_select_own_or_admin" on public.subscriptions;
create policy "subscriptions_select_own_or_admin" on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
drop policy if exists "subscriptions_write_admin" on public.subscriptions;
create policy "subscriptions_write_admin" on public.subscriptions for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- badges: leitura pública; escrita admin
drop policy if exists "badges_select_public" on public.badges;
create policy "badges_select_public" on public.badges for select to anon, authenticated using (true);
drop policy if exists "badges_write_admin" on public.badges;
create policy "badges_write_admin" on public.badges for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- user_badges: leitura do próprio ou admin; escrita só via grant_badges_for_me()/admin
drop policy if exists "user_badges_select_own_or_admin" on public.user_badges;
create policy "user_badges_select_own_or_admin" on public.user_badges for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));
drop policy if exists "user_badges_write_admin" on public.user_badges;
create policy "user_badges_write_admin" on public.user_badges for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------- admin: lista de membros ----------
create or replace function public.admin_list_members(p_search text default null, p_limit int default 50, p_offset int default 0)
returns table (id uuid, email text, display_name text, role text, city text, uf text, onboarding_done boolean,
               newsletter_opt_in boolean, plan_slug text, children_count bigint, created_at timestamptz, last_sign_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, u.email, p.display_name, p.role, p.city, p.uf::text, p.onboarding_done, p.newsletter_opt_in,
         coalesce((select pl.slug from public.subscriptions s join public.plans pl on pl.id = s.plan_id
                   where s.user_id = p.id and s.status in ('active','trialing') limit 1), 'gratuito'),
         (select count(*) from public.children c where c.user_id = p.id),
         p.created_at, u.last_sign_in_at
  from public.profiles p join auth.users u on u.id = p.id
  where public.is_admin()
    and (p_search is null or u.email ilike '%'||p_search||'%' or p.display_name ilike '%'||p_search||'%')
  order by p.created_at desc
  limit least(greatest(p_limit,1),200) offset greatest(p_offset,0);
$$;
revoke all on function public.admin_list_members(text,int,int) from public, anon;
grant execute on function public.admin_list_members(text,int,int) to authenticated;

create or replace function public.admin_set_role(p_user uuid, p_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Acesso restrito' using errcode = '42501'; end if;
  if p_user = auth.uid() then raise exception 'Não altere o próprio papel' using errcode = '42501'; end if;
  if p_role not in ('member','editor','admin') then raise exception 'Papel inválido'; end if;
  update public.profiles set role = p_role where id = p_user;
  insert into public.moderation_log (actor_id, entity, entity_id, action, note)
  values (auth.uid(), 'profiles', p_user::text, 'set_role', p_role);
end $$;
revoke all on function public.admin_set_role(uuid,text) from public, anon;
grant execute on function public.admin_set_role(uuid,text) to authenticated;
```

Observação: `protect_profile_role` roda como `security definer` e chama `is_admin()`; `admin_set_role` também é definer e
faz o UPDATE — o trigger vê `auth.uid()` do admin, então passa. O service_role (webhooks/edge) não dispara erro porque
`is_admin()` retorna false com `auth.uid()` nulo — por isso webhooks **não** alteram `role`, só `subscriptions`.

### 2.2 Aplicar

```bash
cd /home/user/vocacaodepai
supabase db push            # produção (linkado em <SUPABASE_PROJECT_REF>)
# ou local: supabase db reset
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### 2.3 Se `get_secret` não existir (verificar com `grep -l get_secret supabase/migrations/*.sql`)

Acrescentar ao final de `0004_membros.sql`:

```sql
create or replace function public.get_secret(secret_name text)
returns text language sql security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = secret_name limit 1;
$$;
revoke all on function public.get_secret(text) from public, anon, authenticated;
grant execute on function public.get_secret(text) to service_role;
```

Critério de aceite 2: `supabase db push` sem erro; no SQL Editor, `select public.child_phase(current_date - 200)` →
`bebe`; criar usuário de teste no painel Auth → linha aparece em `profiles` com `role='member'`;
com JWT de membro, `select * from profiles` retorna só a própria linha; com anon, retorna 0 linhas.

---

## 3. Fases do filho e direcionamento de conteúdo

### 3.1 Tabela de fases (fonte única: `src/lib/phases.ts`)

| slug | Nome exibido | Regra (`child_phase`) | Temas-chave para pauta |
|---|---|---|---|
| `gestacao` | Gestação | nascimento no futuro | enxoval do pai, finanças do bebê, apoio à esposa, licença-paternidade |
| `recem-nascido` | Recém-nascido (0-3 meses) | 0 a <4 meses | sono, troca de fralda, puerpério da mãe, rotina, segurança no carro |
| `bebe` | Bebê (4-12 meses) | 4 a <12 meses | introdução alimentar, vacinas, brincar, primeiros passos |
| `primeira-infancia` | 1 a 3 anos | 1 a <4 anos | limites, birras, linguagem, desfralde, brincadeiras ao ar livre |
| `infancia` | 4 a 7 anos | 4 a <8 anos | escola, fé em família, esportes, mesada, leitura |
| `pre-adolescencia` | 8 a 12 anos | 8 a <13 anos | telas, amizades, responsabilidades, educação financeira, puberdade |
| `adolescencia` | 13 a 17 anos | 13 a <18 anos | identidade, vocação, namoro, drogas, autonomia, carreira |
| `adulto` | Filho adulto | 18+ | relação adulto-adulto, netos, herança, conselhos de carreira |

```ts
// src/lib/phases.ts
export type PhaseSlug =
  | "gestacao" | "recem-nascido" | "bebe" | "primeira-infancia"
  | "infancia" | "pre-adolescencia" | "adolescencia" | "adulto";

export interface Phase { slug: PhaseSlug; name: string; short: string; tagSlug: `fase-${PhaseSlug}`; icon: string }

export const PHASES: Phase[] = [
  { slug: "gestacao", name: "Gestação", short: "Gestação", tagSlug: "fase-gestacao", icon: "heart-pulse" },
  { slug: "recem-nascido", name: "Recém-nascido (0-3 meses)", short: "0-3 m", tagSlug: "fase-recem-nascido", icon: "baby" },
  { slug: "bebe", name: "Bebê (4-12 meses)", short: "4-12 m", tagSlug: "fase-bebe", icon: "baby" },
  { slug: "primeira-infancia", name: "1 a 3 anos", short: "1-3 a", tagSlug: "fase-primeira-infancia", icon: "blocks" },
  { slug: "infancia", name: "4 a 7 anos", short: "4-7 a", tagSlug: "fase-infancia", icon: "backpack" },
  { slug: "pre-adolescencia", name: "8 a 12 anos", short: "8-12 a", tagSlug: "fase-pre-adolescencia", icon: "bike" },
  { slug: "adolescencia", name: "13 a 17 anos", short: "13-17 a", tagSlug: "fase-adolescencia", icon: "graduation-cap" },
  { slug: "adulto", name: "Filho adulto", short: "18+", tagSlug: "fase-adulto", icon: "users" },
];

/** Espelho exato de public.child_phase(date). Mantenha os dois em sincronia. */
export function childPhase(birthDate: string | Date, today = new Date()): PhaseSlug {
  const b = new Date(birthDate);
  if (b > today) return "gestacao";
  const months = (today.getFullYear() - b.getFullYear()) * 12 + (today.getMonth() - b.getMonth())
    - (today.getDate() < b.getDate() ? 1 : 0);
  if (months < 4) return "recem-nascido";
  if (months < 12) return "bebe";
  const years = months / 12;
  if (years < 4) return "primeira-infancia";
  if (years < 8) return "infancia";
  if (years < 13) return "pre-adolescencia";
  if (years < 18) return "adolescencia";
  return "adulto";
}

export const phaseBySlug = (s: string) => PHASES.find((p) => p.slug === s);
```

### 3.2 Como a fase direciona conteúdo

1. **Editor (admin)**: ao publicar um post, o editor marca uma ou mais tags `fase-*` (ou `fase-todas`). Adicionar no
   editor Tiptap (`src/admin/PostEditor.tsx` ou equivalente da Fase 1) um grupo de checkboxes "Fases do filho" que grava em
   `post_tags`. A rotina automática (Fase 8) deve sempre atribuir ao menos uma tag `fase-*`.
2. **Painel do pai**: `get_content_for_user(12)` devolve posts publicados cujas tags batem com as fases dos filhos,
   excluindo os já salvos. Agrupar no front por `phase` e exibir um bloco por filho ("Para o João — 1 a 3 anos").
3. **Categorias**: não dependem da fase. A fase é ortogonal (tag), a categoria é o tema (Paternidade, Finanças, Carreira,
   Fé, Saúde, Churrasco & Cozinha, etc.). Isso evita duplicar categorias por idade.
4. **Loja**: produtos ganham `subcategory` por fase quando fizer sentido (Fase 3 já prevê `subcategory text`); o painel
   mostra "Produtos para esta fase" filtrando `products.subcategory = phase.slug` (opcional, até 4 itens).
5. **Resumo semanal**: a edge function `weekly-digest` usa a mesma lógica (SQL direto com service_role) por assinante.

Critério de aceite 3: `select public.child_phase(d)` para `d` = hoje+30 dias → `gestacao`; hoje−100 dias → `recem-nascido`;
hoje−2 anos → `primeira-infancia`; hoje−20 anos → `adulto`. `childPhase()` em TS devolve o mesmo para os 4 casos
(adicionar `src/lib/__tests__/phases.test.ts` com Vitest).

---

## 4. Código do app — autenticação e rotas

### 4.1 Cliente Supabase (já existe desde a Fase 1; confirmar)

`src/integrations/supabase/client.ts` deve ler `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`,
com `auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }`.
Remover qualquer `brokeredPreviewStorage` (código Lovable) herdado do vocacaodemae.

### 4.2 Contexto de auth (`src/lib/auth-context.ts` + `src/lib/auth-provider.tsx`)

Adaptar do vocacaodemae (`src/lib/auth-context.ts` e `auth-ui.tsx`): remover i18n, trocar `full_name` → `display_name`,
trocar o modal de login por navegação para `/entrar` (retorno via `?next=`).

```ts
// src/lib/auth-context.ts
import { createContext, useContext } from "react";
import type { Database } from "@/integrations/supabase/types";
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export interface AuthState {
  user: { id: string; email?: string; emailConfirmed: boolean } | null;
  profile: Profile | null;
  ready: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
export const AuthContext = createContext<AuthState>({
  user: null, profile: null, ready: false, logout: async () => {}, refreshProfile: async () => {},
});
export const useAuth = () => useContext(AuthContext);
```

```tsx
// src/lib/auth-provider.tsx
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthContext, type Profile } from "@/lib/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthStateUser>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(async () => {
    const { data } = await supabase.rpc("get_my_profile");
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;
    const apply = (u: { id: string; email?: string; email_confirmed_at?: string | null } | null) => {
      if (!mounted) return;
      setUser(u ? { id: u.id, email: u.email, emailConfirmed: !!u.email_confirmed_at } : null);
      if (u) setTimeout(() => void loadProfile(), 0); else setProfile(null);
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => apply(session?.user ?? null));
    supabase.auth.getUser().then(({ data }) => apply(data.user)).finally(() => mounted && setReady(true));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const logout = useCallback(async () => { await supabase.auth.signOut(); }, []);
  return (
    <AuthContext.Provider value={{ user, profile, ready, logout, refreshProfile: loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
type AuthStateUser = { id: string; email?: string; emailConfirmed: boolean } | null;
```

Envolver o app no `AuthProvider` em `src/routes/__root.tsx`.

### 4.3 Funções de auth (`src/lib/auth.ts`)

```ts
import { supabase } from "@/integrations/supabase/client";

const origin = () => (typeof window !== "undefined" ? window.location.origin : "https://vocacaodepai.com.br");
export const callbackUrl = (next = "/area-do-pai") => `${origin()}/auth/callback?next=${encodeURIComponent(next)}`;

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error; return data;
}
export async function signInWithMagicLink(email: string, next?: string) {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true } });
  if (error) throw error;
}
export async function signInWithGoogle(next?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl(next), queryParams: { access_type: "offline", prompt: "select_account" } },
  });
  if (error) throw error;
}
export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl("/recuperar-senha?step=nova") });
  if (error) throw error;
}
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password }); if (error) throw error;
}
export async function resendConfirmation(email: string) {
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: callbackUrl() } });
  if (error) throw error;
}
export const AUTH_ERRORS_PTBR: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail antes de entrar. Reenviamos o link.",
  "User already registered": "Este e-mail já tem conta. Entre ou recupere a senha.",
  "Password should be at least 8 characters": "A senha precisa de pelo menos 8 caracteres.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
};
export const ptError = (e: unknown) => AUTH_ERRORS_PTBR[(e as Error)?.message] ?? "Não foi possível concluir. Tente novamente.";
```

### 4.4 Cadastro com Turnstile — server function (`src/lib/auth.functions.ts`)

O cadastro por e-mail+senha passa por server function para validar o Turnstile e aplicar rate limit; Google e magic link
não precisam (o provedor já protege).

```ts
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

const SignUpInput = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128).regex(/[a-zA-Z]/).regex(/\d/),
  displayName: z.string().min(2).max(80),
  newsletterOptIn: z.boolean().default(false),
  acceptTerms: z.literal(true),
  turnstileToken: z.string().min(10),
});

async function verifyTurnstile(token: string, ip: string | undefined) {
  const secret = process.env["TURNSTILE_SECRET_KEY"];
  if (!secret) return process.env["NODE_ENV"] !== "production"; // dev sem chave: passa
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: ip }),
  });
  const json = (await res.json()) as { success: boolean };
  return json.success === true;
}

export const signUpFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SignUpInput.parse(d))
  .handler(async ({ data }) => {
    const ip = getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);           // 5 cadastros/hora/IP
    if (!(await verifyTurnstile(data.turnstileToken, ip))) throw new Error("Verificação anti-robô falhou. Recarregue a página.");
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, { auth: { persistSession: false } });
    const { data: res, error } = await sb.auth.signUp({
      email: data.email, password: data.password,
      options: {
        data: { display_name: data.displayName, newsletter_opt_in: data.newsletterOptIn },
        emailRedirectTo: "https://vocacaodepai.com.br/auth/callback?next=/area-do-pai/onboarding",
      },
    });
    if (error) throw new Error(error.message);
    return { userId: res.user?.id ?? null, needsConfirmation: !res.session };
  });
```

Instalar `zod` se ainda não estiver: `npm i zod`. Para o Turnstile no client, usar o script oficial
`https://challenges.cloudflare.com/turnstile/v0/api.js` carregado em `src/components/auth/TurnstileWidget.tsx` (render
explícito com `window.turnstile.render(el, { sitekey, callback })`). Criar o site no painel Cloudflare → Turnstile →
domínios `vocacaodepai.com.br`, `*.vercel.app`, `localhost`; modo "Managed".

### 4.5 Rate limit (`src/lib/rate-limit.ts`)

Decisão: limitador em memória por instância (suficiente para Vercel Functions; o limite real por IP fica também no
Supabase Auth Rate Limits e no Cloudflare). Não criar tabela nova nesta fase.

```ts
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return; }
  if (++b.count > max) { const err = new Error("Muitas tentativas. Tente de novo em alguns minutos."); (err as any).status = 429; throw err; }
  if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
}
```

### 4.6 Cliente Supabase autenticado no servidor (`src/lib/supabase-server.ts`)

Server functions que escrevem em nome do usuário recebem o `accessToken` e criam um client que respeita RLS:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export function createUserClient(accessToken: string) {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
export async function requireUser(accessToken: string) {
  const sb = createUserClient(accessToken);
  const { data, error } = await sb.auth.getUser(accessToken);
  if (error || !data.user) { const e = new Error("Faça login para continuar."); (e as any).status = 401; throw e; }
  return { sb, user: data.user };
}
export function createServiceClient() {
  return createClient<Database>(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SERVICE_ROLE_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
```

No client, obter o token com `const { data: { session } } = await supabase.auth.getSession(); session?.access_token`.

### 4.7 Rotas (arquivos em `src/routes/_site/`)

Todas com `head()` em PT-BR, `noindex` nas páginas privadas, canonical `https://vocacaodepai.com.br/...`.

| Arquivo | Rota | Componente |
|---|---|---|
| `entrar.tsx` | `/entrar` | `src/pages/auth/EntrarPage.tsx` |
| `cadastro.tsx` | `/cadastro` | `src/pages/auth/CadastroPage.tsx` |
| `recuperar-senha.tsx` | `/recuperar-senha` | `src/pages/auth/RecuperarSenhaPage.tsx` |
| `auth.callback.tsx` | `/auth/callback` | `src/pages/auth/AuthCallbackPage.tsx` |
| `area-do-pai.index.tsx` | `/area-do-pai` | `src/pages/area/PainelPage.tsx` |
| `area-do-pai.onboarding.tsx` | `/area-do-pai/onboarding` | `src/pages/area/OnboardingPage.tsx` |
| `area-do-pai.filhos.tsx` | `/area-do-pai/filhos` | `src/pages/area/FilhosPage.tsx` |
| `area-do-pai.salvos.tsx` | `/area-do-pai/salvos` | `src/pages/area/SalvosPage.tsx` |
| `minha-conta.tsx` | `/minha-conta` | `src/pages/area/MinhaContaPage.tsx` |
| `newsletter.confirmar.tsx` | `/newsletter/confirmar?token=` | `src/pages/NewsletterConfirmPage.tsx` |
| `newsletter.sair.tsx` | `/newsletter/sair?token=` | `src/pages/NewsletterUnsubPage.tsx` |

Esqueleto de rota:

```tsx
// src/routes/_site/area-do-pai.index.tsx
import { createFileRoute } from "@tanstack/react-router";
import PainelPage from "@/pages/area/PainelPage";
import { privateHead } from "@/lib/seo";   // helper: title + robots noindex,nofollow

export const Route = createFileRoute("/_site/area-do-pai/")({
  head: () => privateHead("Área do Pai"),
  component: PainelPage,
});
```

Proteção de rota: componente `RequireAuth` (`src/components/auth/RequireAuth.tsx`) que, com `ready && !user`, redireciona
para `/entrar?next=<pathname>`; com `profile && !profile.onboarding_done` e rota ≠ onboarding, redireciona para
`/area-do-pai/onboarding`. Usar em todas as páginas de `area/`.

#### `/entrar` (EntrarPage)
- Abas: "E-mail e senha" | "Link por e-mail". Botão largo "Entrar com Google" acima das abas.
- Campos: e-mail, senha (mostrar/ocultar), link "Esqueci minha senha" → `/recuperar-senha`.
- Sucesso → `navigate(next ?? '/area-do-pai')`. Erros via `ptError()` + `toast.error`.
- Rodapé: "Ainda não tem conta? **Criar conta grátis**" → `/cadastro`.

#### `/cadastro` (CadastroPage)
- Campos: nome (display_name), e-mail, senha (medidor de força simples), checkbox "Quero receber o resumo semanal",
  checkbox obrigatório "Li e aceito os Termos de Uso e a Política de Privacidade" (links), widget Turnstile.
- Submit → `signUpFn`. Se `needsConfirmation` → tela "Confira seu e-mail" com botão "Reenviar" (`resendConfirmation`).
- Botão "Cadastrar com Google" (mesmo `signInWithGoogle('/area-do-pai/onboarding')`).

#### `/recuperar-senha` (RecuperarSenhaPage)
- `step=pedir` (padrão): e-mail → `requestPasswordReset` → "Se existir conta, enviamos o link".
- `step=nova` (vindo do callback com sessão de recovery): nova senha + confirmação → `updatePassword` → `/area-do-pai`.

#### `/auth/callback` (AuthCallbackPage)
```tsx
useEffect(() => {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/area-do-pai";
  (async () => {
    if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) { toast.error(ptError(error)); navigate({ to: "/entrar" }); return; } }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate({ to: "/entrar" }); return; }
    const { data: p } = await supabase.rpc("get_my_profile");
    if (!p?.onboarding_done && !next.startsWith("/recuperar-senha")) { navigate({ to: "/area-do-pai/onboarding" }); return; }
    window.location.replace(next.startsWith("/") ? next : "/area-do-pai");   // evita open redirect
  })();
}, []);
```

### 4.8 Onboarding em 3 passos (`/area-do-pai/onboarding`)

1. **Passo 1 — Quem é você**: nome de exibição (pré-preenchido), cidade, UF (select 27), avatar opcional (upload para
   bucket `avatars`, público, caminho `avatars/<uid>.webp`, reutilizar `compressToWebP` do vocacaodemae).
2. **Passo 2 — Seus filhos**: lista dinâmica (nome opcional, data de nascimento obrigatória, sexo opcional m/f), botão
   "Adicionar filho", opção "Estamos esperando um bebê" (define `birth_date` = data prevista do parto). Mostra a fase
   calculada ao lado de cada filho (`childPhase`). Pode pular ("Ainda não tenho filhos").
3. **Passo 3 — Interesses**: chips multi-seleção gravados em `profiles.interests[]`:
   `paternidade`, `casamento`, `financas`, `carreira`, `fe`, `saude`, `esportes`, `churrasco-e-cozinha`,
   `ferramentas-e-reparos`, `carros`, `tecnologia`, `leitura`. Checkbox newsletter (pré-marcado se já opt-in).
   Botão "Entrar na Área do Pai" → grava `onboarding_done = true`, `consent_terms_at = now()`, `consent_privacy_at = now()`,
   insere/atualiza `newsletter_subscribers` (status pending + dispara e-mail de confirmação, seção 6), chama
   `grant_badges_for_me()`, dispara `send-welcome-email` (seção 6) e navega para `/area-do-pai`.

Persistência entre passos: estado local + `localStorage['vdp_onboarding_draft']` (try/catch).

### 4.9 Painel `/area-do-pai` (PainelPage) — blocos em ordem

Server function `getPainelDataFn({ accessToken })` em `src/lib/area.functions.ts` que retorna tudo em uma chamada
(usa `requireUser` e executa as consultas em `Promise.all`; tabelas de fases futuras são consultadas com `try/catch`
e devolvem `[]` se não existirem):

```ts
export interface PainelData {
  profile: Profile;
  children: Array<{ id: string; name: string | null; birth_date: string; sex: string | null; phase: PhaseSlug }>;
  recommended: Array<{ post_id: string; slug: string; title: string; excerpt: string | null; cover_image_url: string | null; kind: string; phase: string }>;
  savedCount: number;
  savedRecent: Array<{ item_type: string; item_id: string; created_at: string }>;
  tracksInProgress: Array<{ slug: string; title: string; done: number; total: number }>;   // Fase 7 (vazio até lá)
  activeChallenges: Array<{ slug: string; title: string; day: number; days: number }>;     // Fase 7
  badges: Array<{ slug: string; name: string; icon: string | null; earned_at: string }>;
  myJobs: Array<{ slug: string; title: string; status: string }>;                          // Fase 6
  myReferrals: Array<{ id: string; title: string; status: string }>;                       // Fase 6
  myStories: Array<{ id: string; title: string; status: string }>;                         // Fase 7
  newsletter: { status: "none" | "pending" | "confirmed" | "unsubscribed" };
  plan: { slug: string; name: string; premium: boolean };
  market: { usdBrl: number | null; eurBrl: number | null; btcBrl: number | null; ibov: number | null; selic: number | null; fetchedAt: string | null };
}
```

Blocos (componentes em `src/components/area/`):
1. `WelcomeHeader` — "Bom dia, {display_name}." (bom dia/tarde/noite), avatar, plano atual (chip "Pai de Família" ou
   "Pai de Valor"), botão "Editar perfil" → `/minha-conta`.
2. `ChildrenPhases` — um cartão por filho: nome (ou "Seu filho"), idade humanizada ("1 ano e 3 meses"), fase, e até 4
   posts recomendados dessa fase (de `recommended`). Link "Gerenciar filhos" → `/area-do-pai/filhos`. Sem filhos → CTA.
3. `SavedShelf` — últimos 6 salvos com link "Ver todos" → `/area-do-pai/salvos`.
4. `TracksInProgress` — barra de progresso por trilha (vazio: "As trilhas de formação chegam em breve" com link `/formacao`).
5. `ActiveChallenges` — "Dia X de Y" (vazio: CTA `/desafios`).
6. `BadgesRow` — badges conquistados (coloridos) e bloqueados (cinza, com dica da regra).
7. `MyContributions` — abas "Minhas vagas", "Minhas indicações", "Minhas histórias" com status (pendente/aprovado/rejeitado).
8. `NewsletterCard` — estado + botão (assinar / reenviar confirmação / sair).
9. `MarketToday` — "Mercado hoje": USD, EUR, BTC, Ibovespa, Selic, lidos de `market_cache` (Fase 4) via service client
   (chaves `fx:usd-brl`, `fx:eur-brl`, `crypto:btc-brl`, `b3:ibov`, `bcb:selic`); link "Ver mercado completo" →
   `/ferramentas/mercado-financeiro`. Se cache vazio → "Atualizando cotações…".
10. `PremiumUpsell` — só para `plan.premium === false`: cartão "Pai de Valor" com benefícios e botão
    "Quero ser Pai de Valor" → `/area-do-pai/planos` (página estática "em breve" enquanto `BILLING_ENABLED=false`).

### 4.10 `/area-do-pai/filhos` (FilhosPage)
CRUD direto via `supabase.from('children')` (RLS). Validações: `birth_date` entre hoje−60 anos e hoje+10 meses;
máximo 12 filhos. Exibe fase e "próxima fase em N meses". Após salvar: `grant_badges_for_me()`.

### 4.11 `/area-do-pai/salvos` (SalvosPage)
Filtros por `item_type` (Artigos, Produtos, Ferramentas, Vagas, Trilhas). Hidrata cada tipo com uma consulta
(`posts` por ids, `products` por ids, ferramentas por slug de `src/lib/tools/registry.ts`, `jobs`/`tracks` se existirem).
Botão "Remover" chama `toggleSavedItemFn`.

### 4.12 `/minha-conta` (MinhaContaPage) — abas
- **Dados**: display_name, bio (280), cidade, UF, avatar, interesses (chips). Salva com `supabase.from('profiles').update()`.
- **Acesso**: e-mail atual (troca via `supabase.auth.updateUser({ email })` → exige confirmação dupla), nova senha,
  provedores vinculados (`user.identities`), "Sair de todos os dispositivos" (`signOut({ scope: 'global' })`).
- **Notificações**: newsletter on/off, segmentos (fases + interesses).
- **Privacidade (LGPD)**: "Baixar meus dados (JSON)" → `supabase.rpc('export_my_data')` → download
  `vocacaodepai-meus-dados-<data>.json`; "Excluir minha conta" → modal com digitação de `EXCLUIR` →
  `supabase.rpc('delete_my_account')` → `signOut()` → `/` com toast "Conta excluída. Sentiremos sua falta, pai."
  Texto legal fixo: "Seus dados são tratados conforme a LGPD (Lei 13.709/2018). Exclusão é definitiva e imediata; conteúdos
  públicos aprovados (histórias, respostas) podem permanecer anonimizados."

### 4.13 Header/menu
Em `src/components/layout/Header.tsx`: quando `user` → avatar com dropdown (Área do Pai, Salvos, Minha conta, Admin se
`is_staff`, Sair); quando não → botão "Entrar" (`/entrar`) e "Criar conta" (`/cadastro`). Mobile: itens no drawer.

Critério de aceite 4: fluxo completo manual — cadastro com Turnstile → e-mail de confirmação chega → callback → onboarding
3 passos → painel com filho e conteúdo por fase → salvar um post → aparece em Salvos → trocar senha → exportar JSON →
excluir conta → login falha com "E-mail ou senha incorretos". Login Google funciona em produção e localhost.
`npm run build` e `npm run typecheck` sem erros.

---

## 5. Botão "Salvar" — `SaveButton` + `toggleSavedItemFn`

### 5.1 Server function (`src/lib/saved.functions.ts`)

```ts
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";

const Input = z.object({
  accessToken: z.string().min(20),
  itemType: z.enum(["post", "product", "tool", "job", "track"]),
  itemId: z.string().min(1).max(120),
});

export const toggleSavedItemFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { sb, user } = await requireUser(data.accessToken);
    rateLimit(`save:${user.id}`, 60, 60_000);
    const { data: existing } = await sb.from("saved_items").select("id")
      .eq("user_id", user.id).eq("item_type", data.itemType).eq("item_id", data.itemId).maybeSingle();
    if (existing) {
      const { error } = await sb.from("saved_items").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { saved: false };
    }
    const { error } = await sb.from("saved_items").insert({ user_id: user.id, item_type: data.itemType, item_id: data.itemId });
    if (error) throw new Error(error.message);
    void sb.rpc("grant_badges_for_me");
    return { saved: true };
  });

export const listMySavedIdsFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ accessToken: z.string(), itemType: Input.shape.itemType }).parse(d))
  .handler(async ({ data }) => {
    const { sb, user } = await requireUser(data.accessToken);
    const { data: rows } = await sb.from("saved_items").select("item_id").eq("user_id", user.id).eq("item_type", data.itemType);
    return (rows ?? []).map((r) => r.item_id);
  });
```

### 5.2 Componente (`src/components/SaveButton.tsx`)

```tsx
import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toggleSavedItemFn } from "@/lib/saved.functions";
import { cn } from "@/lib/utils";

type ItemType = "post" | "product" | "tool" | "job" | "track";
interface Props { itemType: ItemType; itemId: string; initialSaved?: boolean; size?: "sm" | "md"; className?: string; label?: boolean }

export function SaveButton({ itemType, itemId, initialSaved = false, size = "md", className, label = true }: Props) {
  const { user, ready } = useAuth();
  const navigate = useNavigate(); const location = useLocation();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  useEffect(() => setSaved(initialSaved), [initialSaved]);

  const onClick = async () => {
    if (!ready) return;
    if (!user) { navigate({ to: "/entrar", search: { next: location.pathname } as any }); return; }
    setBusy(true); const prev = saved; setSaved(!prev);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Entre novamente.");
      const r = await toggleSavedItemFn({ data: { accessToken: session.access_token, itemType, itemId } });
      setSaved(r.saved); toast.success(r.saved ? "Salvo na sua Área do Pai." : "Removido dos salvos.");
    } catch (e) { setSaved(prev); toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const Icon = busy ? Loader2 : saved ? BookmarkCheck : Bookmark;
  return (
    <button type="button" onClick={onClick} aria-pressed={saved} aria-label={saved ? "Remover dos salvos" : "Salvar"}
      className={cn("inline-flex items-center gap-2 rounded-full border border-border bg-card font-semibold transition-colors hover:bg-primary/10",
        size === "sm" ? "h-9 px-3 text-xs" : "h-11 px-4 text-sm", saved && "border-primary text-primary", className)}>
      <Icon className={cn("h-4 w-4", busy && "animate-spin")} />
      {label && (saved ? "Salvo" : "Salvar")}
    </button>
  );
}
```

### 5.3 Onde inserir
- Post (`/post/$slug`): ao lado do compartilhar, `itemType="post" itemId={post.id}`.
- Produto (`/loja/$slug`): abaixo do botão "Comprar agora na Amazon", `itemType="product" itemId={product.id}`.
- Ferramenta (`/ferramentas/$slug`): no cabeçalho, `itemType="tool" itemId={tool.slug}`.
- Vaga e Trilha: Fases 6 e 7 reutilizam o componente (`job.id`, `track.id`).
Listas (cards) usam `size="sm" label={false}`. Para marcar `initialSaved` em listas, a página chama `listMySavedIdsFn` uma vez.

Critério de aceite 5: deslogado → clique leva a `/entrar?next=`; logado → toggle persiste após reload; dois cliques rápidos
não duplicam (unique constraint); 61 cliques em 1 min → erro 429 amigável.

---

## 6. E-mails transacionais com Resend

### 6.1 Decisão
Edge Functions do Supabase (Deno) em `supabase/functions/`, autenticadas por `x-internal-secret` (Vault
`INTERNAL_FN_SECRET`), nunca chamadas direto do browser. O app chama via server function (`src/lib/email.functions.ts`)
que injeta o segredo. O cron semanal usa `pg_cron` + `pg_net`. Remetente: `Vocação de Pai <nao-responda@vocacaodepai.com.br>`,
`reply_to: contato@vocacaodepai.com.br`. Templates em `supabase/functions/_shared/email-templates.ts` (HTML inline,
largura 600px, cores da marca: fundo `#F4EFE6`, títulos `#14505C`, botão `#D9822B`, fonte sistema; links absolutos).

### 6.2 `_shared/resend.ts`

```ts
export async function sendEmail(apiKey: string, msg: { to: string; subject: string; html: string; text?: string; tags?: {name:string;value:string}[] }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "Vocação de Pai <nao-responda@vocacaodepai.com.br>", reply_to: "contato@vocacaodepai.com.br", ...msg }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}
export function requireInternalSecret(req: Request, expected: string | null) {
  const got = req.headers.get("x-internal-secret") ?? "";
  if (!expected || got.length !== expected.length) return false;
  let d = 0; for (let i = 0; i < got.length; i++) d |= got.charCodeAt(i) ^ expected.charCodeAt(i); return d === 0;
}
```

### 6.3 Templates (`_shared/email-templates.ts`) — resumo do conteúdo em PT-BR

- **welcome(name)** — Assunto: `Bem-vindo à Área do Pai, {name}`. Título "Você entrou para a Irmandade."
  Parágrafos: o que fazer agora (cadastrar filhos, salvar conteúdos, explorar a Caixa de Ferramentas), assinatura
  "Bruno Danello — Vocação de Pai". Botão "Abrir minha Área do Pai" → `https://vocacaodepai.com.br/area-do-pai`.
- **newsletterConfirm(token)** — Assunto: `Confirme sua inscrição no resumo semanal`. Botão "Confirmar inscrição" →
  `https://vocacaodepai.com.br/newsletter/confirmar?token={token}`. Rodapé: "Se não foi você, ignore."
- **weeklyDigest({ name, sections })** — Assunto: `Seu resumo da semana — Vocação de Pai`. Para cada filho: "Para {nome}
  ({fase})" com 3 posts (capa, título, excerpt, link). Depois: "Pai Indica da semana" (1 review), "Mercado em 1 minuto"
  (USD/BTC/Selic do `market_cache`), "Desafio da semana" (quando Fase 7 existir). Rodapé obrigatório: endereço do
  grupo, "Você recebe porque confirmou a inscrição", link "Sair da lista" → `/newsletter/sair?token={token}`.

### 6.4 Função `send-welcome-email` (`supabase/functions/send-welcome-email/index.ts`)

```ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { sendEmail, requireInternalSecret } from "../_shared/resend.ts";
import { welcome } from "../_shared/email-templates.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Use POST", { status: 405 });
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: secret } = await sb.rpc("get_secret", { secret_name: "INTERNAL_FN_SECRET" });
  if (!requireInternalSecret(req, secret)) return new Response("Forbidden", { status: 403 });
  const { userId } = await req.json().catch(() => ({}));
  if (!userId) return new Response("userId obrigatório", { status: 400 });
  const { data: u } = await sb.auth.admin.getUserById(userId);
  const { data: p } = await sb.from("profiles").select("display_name").eq("id", userId).maybeSingle();
  if (!u?.user?.email) return new Response("sem e-mail", { status: 404 });
  const { data: key } = await sb.rpc("get_secret", { secret_name: "RESEND_API_KEY" });
  const tpl = welcome(p?.display_name ?? "pai");
  await sendEmail(key, { to: u.user.email, subject: tpl.subject, html: tpl.html, text: tpl.text, tags: [{ name: "type", value: "welcome" }] });
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
});
```

`newsletter-confirm` é idêntica na estrutura: recebe `{ email }`, lê `confirm_token` em `newsletter_subscribers`
(service_role), envia `newsletterConfirm(token)`.

### 6.5 Server function ponte (`src/lib/email.functions.ts`)

```ts
export const triggerEmailFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ accessToken: z.string(), kind: z.enum(["welcome", "newsletter-confirm"]), email: z.string().email().optional() }).parse(d))
  .handler(async ({ data }) => {
    const { user } = await requireUser(data.accessToken);
    rateLimit(`email:${user.id}:${data.kind}`, 3, 60 * 60 * 1000);
    const fn = data.kind === "welcome" ? "send-welcome-email" : "newsletter-confirm";
    const res = await fetch(`${process.env["SUPABASE_URL"]}/functions/v1/${fn}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": process.env["INTERNAL_FN_SECRET"]!, Authorization: `Bearer ${process.env["SUPABASE_SERVICE_ROLE_KEY"]}` },
      body: JSON.stringify(data.kind === "welcome" ? { userId: user.id } : { email: data.email ?? user.email }),
    });
    if (!res.ok) throw new Error("Não foi possível enviar o e-mail agora.");
    return { ok: true };
  });
```

Inscrição anônima na newsletter (rodapé do site): server function `subscribeNewsletterFn({ email, turnstileToken, segments })`
→ insere `newsletter_subscribers` (anon pode inserir pending) e chama `newsletter-confirm` com o segredo interno.
Rate limit `news:${ip}` 5/h.

### 6.6 Resumo semanal — `weekly-digest` + cron

`supabase/functions/weekly-digest/index.ts`: autentica pelo segredo; pagina `newsletter_subscribers` com
`status='confirmed'` em lotes de 100; para cada um com `user_id`, calcula fases dos filhos (SQL com service_role:
`select distinct public.child_phase(birth_date) from children where user_id = $1`) e busca 3 posts por fase publicados nos
últimos 14 dias (fallback: mais recentes); sem `user_id` → usa `segments` (`fase:*`) ou posts gerais. Envia via Resend
Batch (`POST https://api.resend.com/emails/batch`, até 100 por chamada). Registra em `moderation_log`
(`entity='newsletter'`, `action='weekly_digest'`, `note='enviados=N falhas=M'`). Idempotência: grava `last_digest_at`
em `segments` (`{"last_digest_at": ...}`) e pula quem recebeu há < 6 dias.

Cron (adicionar ao final de `0004_membros.sql`; `<SUPABASE_PROJECT_REF>` é substituído pelo executor):

```sql
select cron.unschedule('weekly-digest') where exists (select 1 from cron.job where jobname = 'weekly-digest');
select cron.schedule(
  'weekly-digest',
  '0 11 * * 0',   -- domingo 11:00 UTC = 08:00 America/Sao_Paulo
  $$
  select net.http_post(
    url := 'https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || public.get_secret('SUPABASE_SERVICE_ROLE_KEY'),
      'x-internal-secret', public.get_secret('INTERNAL_FN_SECRET')),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);
```

Guardar `SUPABASE_SERVICE_ROLE_KEY` também no Vault para o cron. Deploy:
`supabase functions deploy send-welcome-email newsletter-confirm weekly-digest --no-verify-jwt=false`.

Critério de aceite 6: `supabase functions serve` + `curl -X POST ... -H "x-internal-secret: ..."` envia e-mail de teste
para o próprio endereço; sem segredo → 403; `select * from cron.job` mostra `weekly-digest`; disparo manual
`select cron.run_job(jobid)`... ou `curl` da função envia ao menos 1 digest e grava em `moderation_log`.

---

## 7. Planos: gratuito vs. "Pai de Valor"

### 7.1 Oferta

| | Pai de Família (gratuito) | Pai de Valor (pago) |
|---|---|---|
| Blog, Pai Indica, Loja, Ferramentas | ✔ | ✔ |
| Salvos, filhos e conteúdo por fase | ✔ | ✔ |
| Trilhas básicas (nível 1) e desafios públicos | ✔ | ✔ |
| Pai Indica Pai (publicar vaga/indicação) | ✔ (e-mail verificado) | ✔ |
| Newsletter semanal | ✔ | ✔ |
| Trilhas avançadas + certificado PDF | — | ✔ |
| Grupos fechados da Irmandade (por fase/cidade) | — | ✔ |
| E-books e guias em PDF (ex.: "Manual do Pai de Primeira Viagem", "Churrasco do Pai") | — | ✔ |
| Descontos de parceiros (cupons) | — | ✔ |
| Mentoria em grupo mensal (ao vivo) | — | ✔ |
| Sem anúncios AdSense dentro da Área do Pai e nos posts | — | ✔ |
| **Preço** | R$ 0 | **R$ 19,90/mês** ou **R$ 179,00/ano** (≈ R$ 14,92/mês, "2 meses grátis") |

Nome alternativo se "Pai de Valor" não agradar: "Pai Provedor". Manter slug `pai-de-valor-*` no banco.

### 7.2 Provedor: Mercado Pago (recomendado) vs. Stripe

| Critério | Mercado Pago | Stripe BR |
|---|---|---|
| Pix | Nativo, inclusive **assinatura com Pix** (Assinaturas/preapproval com cobrança recorrente por Pix em evolução) e pagamento avulso anual via Pix | Pix só avulso; assinatura recorrente só cartão |
| Cartão recorrente | Sim (preapproval) | Sim (Billing) |
| Boleto | Sim | Sim (avulso) |
| Taxas (ref. 2026, conferir no site) | Pix ~0,99%; cartão à vista ~4,98% (recebimento imediato) a ~3,79% (30 dias) | Cartão 3,99% + R$ 0,39; Pix 1,19% |
| Público brasileiro | Conta MP já existe para a maioria; checkout conhecido | Checkout excelente, menos familiar |
| Nota fiscal / split | Integra com ERPs BR | Idem, menos opções nacionais |
| Developer experience | Boa, SDK Node `mercadopago` | Excelente |

**Decisão**: **Mercado Pago** para lançar — Pix é o meio de pagamento dominante no Brasil e o plano anual via Pix
(R$ 179) converte melhor que cartão recorrente para esse público. A tabela `subscriptions` é agnóstica (`provider`
em `'mercadopago'|'stripe'|'manual'`), então migrar para Stripe depois é só outro webhook.

### 7.3 O que fica pronto agora (sem cobrar)

1. `plans` e `subscriptions` criadas e populadas (seção 2).
2. `src/lib/billing/provider.ts` com interface:
   ```ts
   export interface BillingProvider {
     createCheckout(input: { userId: string; email: string; planSlug: string; successUrl: string; cancelUrl: string }): Promise<{ url: string }>;
     handleWebhook(req: Request): Promise<{ ok: boolean; event?: string }>;
     cancel(providerId: string): Promise<void>;
   }
   ```
   `src/lib/billing/mercadopago.ts` implementa: `createCheckout` → `POST https://api.mercadopago.com/preapproval`
   (mensal) ou `POST /checkout/preferences` (anual avulso) com `external_reference = userId`;
   `handleWebhook` → valida assinatura `x-signature` (HMAC-SHA256 com `MERCADOPAGO_WEBHOOK_SECRET`, template
   `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`), busca o recurso na API e faz upsert em `subscriptions`
   (`status` mapeado: `authorized→active`, `paused→past_due`, `cancelled→canceled`; `current_period_end` =
   `next_payment_date`), via `createServiceClient()`. Loga em `moderation_log` (`entity='subscriptions'`).
3. Rota de webhook: `src/routes/api/webhooks/mercadopago.ts` (server route `POST`) que retorna 200 rápido.
   Enquanto `BILLING_ENABLED !== 'true'` responde `503 { disabled: true }`.
4. Rota `/area-do-pai/planos`: comparação dos planos; botão "Assinar" exibe "Em breve — deixe seu e-mail" se desligado
   (insere em `newsletter_subscribers.segments` `"interesse:pai-de-valor"`), ou chama `createCheckoutFn` se ligado.
5. Flag: `BILLING_ENABLED=false` (server) e `VITE_BILLING_ENABLED=false` (client). Helper `src/lib/billing/flags.ts`:
   `export const billingEnabled = () => import.meta.env.VITE_BILLING_ENABLED === "true";`

### 7.4 Gating no código — `usePlan()` (`src/hooks/usePlan.ts`)

```ts
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type PlanSlug = "gratuito" | "pai-de-valor-mensal" | "pai-de-valor-anual";
export function usePlan() {
  const { user, ready } = useAuth();
  const [slug, setSlug] = useState<PlanSlug>("gratuito");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!ready) return;
    if (!user) { setSlug("gratuito"); setLoading(false); return; }
    supabase.rpc("my_plan_slug").then(({ data }) => { setSlug(((data as PlanSlug) ?? "gratuito")); setLoading(false); });
  }, [user, ready]);
  const premium = slug.startsWith("pai-de-valor");
  return { slug, premium, loading, can: (feature: PremiumFeature) => premium || FREE_FEATURES.has(feature) };
}
export type PremiumFeature = "trilha-avancada" | "grupos" | "ebooks" | "descontos" | "mentoria" | "sem-anuncios" | "trilha-basica" | "desafios" | "salvos";
const FREE_FEATURES = new Set<PremiumFeature>(["trilha-basica", "desafios", "salvos"]);
```

Componente `PremiumGate` (`src/components/area/PremiumGate.tsx`): `<PremiumGate feature="ebooks" fallback={<UpsellCard/>}>…</PremiumGate>`.
Server side, o gating real é RLS/funções que chamam `public.is_premium()` (ex.: Fase 7 — `tracks.is_premium = true`
só legível por premium ou staff). O `usePlan()` é UX; nunca a única barreira.

Critério de aceite 7: `select public.my_plan_slug()` como membro → `gratuito`; inserir manualmente uma subscription
ativa → `pai-de-valor-mensal` e `is_premium() = true`; `/area-do-pai/planos` renderiza; webhook responde 503 com flag
desligada; testes unitários do mapeamento de status do Mercado Pago.

---

## 8. Segurança — checklist desta fase

1. **RLS** em todas as 8 tabelas (seção 2). Anon só enxerga `plans` ativos, `badges`, `public_authors` e pode inserir
   `newsletter_subscribers` pending. Nunca `using (true)` em tabela com dado pessoal.
2. **Funções**: todas `security definer` têm `set search_path = public` e `revoke … from public, anon` quando sensíveis.
   Rodar o Supabase Advisor (Database → Advisors) e zerar avisos "RLS disabled", "function search_path mutable",
   "security definer view".
3. **Rate limit**: server functions `signUpFn` (5/h/IP), `toggleSavedItemFn` (60/min/usuário), `triggerEmailFn`
   (3/h/usuário/tipo), `subscribeNewsletterFn` (5/h/IP). Supabase Auth Rate Limits configurados (1.1.6).
4. **Turnstile** no cadastro e na newsletter anônima; verificação **sempre no servidor**.
5. **E-mail verificado para publicar**: `public.email_verified()` entra nas policies de INSERT de `jobs`,
   `job_referrals`, `stories`, `questions`, `answers`, `comments` (Fases 6 e 7 devem usar
   `with check (auth.uid() = user_id and public.email_verified())`). No front, `RequireVerifiedEmail` mostra aviso
   "Confirme seu e-mail para publicar" com botão reenviar.
6. **Open redirect**: `next` só é aceito se começar com `/` e não com `//`.
7. **Segredos**: nada com prefixo `VITE_` além de URL, publishable key, Turnstile site key e flags. `SERVICE_ROLE_KEY`
   só em server functions/edge. Vault para edge functions.
8. **Sessão**: PKCE, refresh token rotation ON, `signOut({ scope: 'global' })` disponível em Minha conta.
9. **Headers**: em `vercel.json`, `Content-Security-Policy` permitindo `challenges.cloudflare.com`,
   `*.supabase.co`, `accounts.google.com`, `pagead2.googlesyndication.com`; `X-Frame-Options: DENY` nas rotas privadas.
10. **Escalada de role** bloqueada pelo trigger `protect_profile_role` + `admin_set_role` com log.
11. **Exclusão**: admin não consegue se excluir sem antes ser rebaixado (evita perder o último admin).

---

## 9. LGPD — o que implementar

1. **Base legal**: execução de contrato (conta) + consentimento (newsletter). Registrar `consent_terms_at`,
   `consent_privacy_at` (onboarding) e `newsletter_subscribers.confirmed_at` (double opt-in).
2. **Política de Privacidade** (`/politica-de-privacidade`, conteúdo da Fase 1): acrescentar seção "Área do Pai":
   dados coletados (nome, e-mail, cidade/UF, dados de filhos — nome opcional e data de nascimento — interesses,
   conteúdos salvos), finalidade (personalizar conteúdo por fase), compartilhamento (Supabase/AWS sa-east-1, Resend,
   Vercel, Google — login), retenção (até exclusão da conta; logs 6 meses), direitos (acesso, correção, portabilidade,
   exclusão, revogação) e canal `privacidade@vocacaodepai.com.br`. Encarregado (DPO): Bruno Danello.
3. **Dados de menores**: só o pai informa nome opcional + data de nascimento; nunca foto do filho; texto no formulário
   "Informe apenas o necessário. Não pedimos documentos nem fotos dos seus filhos."
4. **Portabilidade**: `export_my_data()` → JSON (seção 4.12).
5. **Exclusão**: `delete_my_account()` apaga `auth.users` com cascata; newsletter vira `unsubscribed` (supressão);
   `moderation_log` guarda só o uuid e a data (sem dados pessoais). Conteúdos públicos aprovados ficam com
   `user_id` nulo (`on delete set null` nas tabelas das Fases 6/7 — garantir lá).
6. **Minimização nos e-mails**: digest não inclui nome do filho no assunto; tag Resend sem PII.
7. **Cookies**: banner já existente (AdSense) deve listar "autenticação (essencial)".

Critério de aceite 9: baixar JSON contém `account`, `profile`, `children`, `saved_items`; após excluir, `select count(*)
from profiles where id = <uid>` = 0 e `newsletter_subscribers.status = 'unsubscribed'` para o e-mail.

---

## 10. Admin — membros

Rota `src/routes/admin/membros.tsx` → `src/admin/MembersPage.tsx` (protegida pelo guard admin existente da Fase 1;
somente `role='admin'`, editor não vê).

- Tabela: e-mail, nome, papel (select member/editor/admin), plano, filhos, onboarding, newsletter, cadastro, último login.
- Busca por e-mail/nome (`admin_list_members(p_search, 50, offset)`), paginação.
- Trocar papel → `admin_set_role(uuid, role)` com confirmação; o próprio admin aparece com select desabilitado.
- Ações: "Ver como" (abre `/area-do-pai`? não — só leitura dos dados via painel), "Copiar e-mail".
- Métricas no topo: total de membros, novos em 7 dias, % onboarding concluído, assinantes confirmados da newsletter,
  premium ativos (consultas simples com `is_admin()`).
- Link no menu do admin: "Membros".

Critério de aceite 10: como admin, lista carrega; mudar role de um membro de teste para `editor` reflete em
`moderation_log`; como editor, `/admin/membros` redireciona para `/admin` com toast "Acesso restrito a administradores".

---

## 11. Ordem de execução (passos numerados)

1. `git checkout -b claude/fase-5-area-do-pai` a partir de `main` atualizada.
2. Painel Supabase + Google Cloud (seções 1.1, 1.2). Anotar Client ID. Criar segredos no Vault.
3. `supabase/config.toml` + `supabase/templates/*.html` (1.3). `.env.example` (1.4). Vercel envs.
4. Criar `supabase/migrations/0004_membros.sql` (2.1 + cron 6.6 + 2.3 se preciso). `supabase db push`. Gerar types.
5. `src/lib/phases.ts` + teste Vitest (3.1).
6. Auth: `client.ts` (4.1), `auth-context.ts`, `auth-provider.tsx` (4.2), `auth.ts` (4.3), `auth.functions.ts` (4.4),
   `rate-limit.ts` (4.5), `supabase-server.ts` (4.6). `npm i zod`.
7. Rotas e páginas de auth (`/entrar`, `/cadastro`, `/recuperar-senha`, `/auth/callback`) + `TurnstileWidget` + `RequireAuth`.
8. Onboarding (4.8). Header com estado logado (4.13).
9. `area.functions.ts` + Painel (4.9) com os 10 blocos; Filhos (4.10); Salvos (4.11); Minha conta (4.12).
10. `saved.functions.ts` + `SaveButton` (5) inserido em post, produto e ferramenta.
11. Edge functions `_shared`, `send-welcome-email`, `newsletter-confirm`, `weekly-digest` (6). Deploy. Testar com curl.
12. `email.functions.ts` + inscrição anônima na newsletter + páginas `/newsletter/confirmar` e `/newsletter/sair`.
13. Billing desligado: `plans` UI (`/area-do-pai/planos`), `usePlan`, `PremiumGate`, `provider.ts`, `mercadopago.ts`,
    rota webhook retornando 503 (7).
14. Admin membros (10). Segurança (8): CSP, Advisor zerado. LGPD (9): textos na política.
15. `npm run typecheck && npm run lint && npm run test && npm run build`. Testar fluxo completo (critério 4) em preview da Vercel.
16. Atualizar `docs/plano/PROGRESSO.md` (Fase 5 → concluída, data, pendências) e `CLAUDE.md` (seção "Área do Pai":
    regras de RLS, fases, SaveButton, flags). Abrir PR `claude/fase-5-area-do-pai` → `main` com o checklist da seção 13 no corpo.

---

## 12. Critérios de aceite consolidados

- [ ] CA-1 Auth configurado (Email confirm ON, Google ON, redirect URLs, SMTP Resend, templates PT-BR); `supabase start` OK.
- [ ] CA-2 `0004_membros.sql` aplicada; trigger cria `profiles`; RLS: anon 0 linhas em profiles/children/saved_items/subscriptions;
      membro vê só o próprio; admin vê tudo; `child_phase` correto nos 8 casos.
- [ ] CA-3 `phases.ts` espelha o SQL (teste Vitest verde); editor marca tags `fase-*`; `get_content_for_user` devolve posts por fase.
- [ ] CA-4 Fluxo completo: cadastro (Turnstile) → confirmação → callback → onboarding 3 passos → painel → salvar → salvos →
      minha conta (senha, exportar JSON, excluir). Google login em prod e local. Magic link funciona.
- [ ] CA-5 SaveButton em post/produto/ferramenta; deslogado redireciona para `/entrar?next=`; sem duplicatas; 429 após limite.
- [ ] CA-6 E-mails: boas-vindas e confirmação chegam (Resend dashboard mostra `delivered`); cron `weekly-digest` agendado;
      disparo manual envia e loga em `moderation_log`; `/newsletter/sair` funciona.
- [ ] CA-7 Planos listados; `my_plan_slug()`/`is_premium()` corretos; `usePlan()` + `PremiumGate`; webhook 503 com flag off.
- [ ] CA-8 Supabase Advisor sem erros de segurança; CSP aplicada; `protect_profile_role` impede auto-promoção
      (`update profiles set role='admin' where id = auth.uid()` falha com 42501).
- [ ] CA-9 LGPD: consentimentos gravados; export JSON completo; exclusão em cascata; política atualizada.
- [ ] CA-10 `/admin/membros` só para admin; troca de role logada.
- [ ] CA-11 `npm run typecheck`, `lint`, `test`, `build` verdes; Lighthouse das páginas públicas de auth ≥ 90 em acessibilidade;
      `noindex` nas rotas privadas; `PROGRESSO.md` e `CLAUDE.md` atualizados; PR aberto.

---

## 13. Prompt para iniciar esta fase no Sonnet

```text
Você está em /home/user/vocacaodepai (TanStack Start + React 19 + Tailwind 4 + Supabase + Vercel). Leia primeiro, nesta ordem:
CLAUDE.md, docs/plano/02-arquitetura-e-stack.md, docs/plano/PROGRESSO.md e docs/plano/07-fase-5-area-do-pai-membros.md.
Execute a FASE 5 (Área do Pai) seguindo EXATAMENTE a seção 11 "Ordem de execução" do documento 07, sem pular passos
e sem mudar nomes de tabelas, colunas, rotas ou arquivos definidos lá. Regras:
1. Crie a branch claude/fase-5-area-do-pai a partir de main.
2. Escreva supabase/migrations/0004_membros.sql copiando o SQL da seção 2.1 (mais o cron da 6.6 e o get_secret da 2.3
   se ele ainda não existir nas migrations). Aplique com `supabase db push` e regenere src/integrations/supabase/types.ts.
   Se o push falhar, corrija a migration (não crie outra) e reaplique.
3. Implemente auth (seção 4.1–4.7), onboarding (4.8), painel (4.9), filhos (4.10), salvos (4.11), minha-conta (4.12),
   header (4.13), SaveButton (5), edge functions e e-mails (6), planos com BILLING_ENABLED=false e usePlan() (7),
   segurança (8), LGPD (9) e admin de membros (10). Tudo em PT-BR, tom direto e masculino, sem i18n.
4. Para o que depende de painéis externos (Supabase Auth providers, Google Cloud OAuth, Cloudflare Turnstile, Resend
   SMTP, Vault), NÃO invente valores: escreva as instruções exatas em docs/plano/PROGRESSO.md na seção
   "Pendências manuais da Fase 5" e use placeholders em .env.example.
5. Ao final de cada bloco rode `npm run typecheck && npm run lint && npm run build`. Não deixe erro de tipo.
6. Marque cada critério de aceite da seção 12 como feito/pendente em docs/plano/PROGRESSO.md, atualize CLAUDE.md com a
   seção "Área do Pai (Fase 5)" (regras de RLS, fases do filho, SaveButton, flags de billing) e abra o PR
   claude/fase-5-area-do-pai → main com o "Checklist de pronto" da seção 14 no corpo.
7. Faça commits pequenos por passo da seção 11 (ex.: "fase5: migration 0004_membros", "fase5: rotas de auth").
Se algo do documento conflitar com o que já existe no repositório (ex.: nome de helper, estrutura de pastas), adapte ao
que existe e registre a diferença em PROGRESSO.md. Não faça perguntas: tome a decisão mais simples compatível com o doc.
```

---

## 14. Checklist de pronto (colar no PR)

```markdown
## Fase 5 — Área do Pai — Checklist de pronto
### Banco
- [ ] `supabase/migrations/0004_membros.sql` aplicada em <SUPABASE_PROJECT_REF> (profiles, children, saved_items, newsletter_subscribers, plans, subscriptions, badges, user_badges)
- [ ] Funções: is_admin, is_staff, email_verified, handle_new_user (+ trigger on_auth_user_created), protect_profile_role, get_my_profile, child_phase, my_child_phases, get_content_for_user, my_plan_slug, is_premium, grant_badges_for_me, newsletter_confirm, newsletter_unsubscribe, export_my_data, delete_my_account, admin_list_members, admin_set_role
- [ ] RLS ativa nas 8 tabelas; Supabase Advisor sem erros
- [ ] Seeds: 3 planos, 5 badges, 9 tags fase-*
- [ ] Cron `weekly-digest` agendado (domingo 11:00 UTC)
- [ ] `src/integrations/supabase/types.ts` regenerado
### Auth
- [ ] Email+senha (confirm ON), magic link, Google OAuth funcionando em prod e localhost
- [ ] Templates de e-mail do Auth em PT-BR; SMTP Resend configurado
- [ ] `/entrar`, `/cadastro` (Turnstile), `/recuperar-senha`, `/auth/callback`
- [ ] `RequireAuth` + redirecionamento para onboarding
### Área do Pai
- [ ] Onboarding 3 passos (perfil, filhos, interesses) grava consentimentos
- [ ] Painel com 10 blocos (boas-vindas, filhos/fases, salvos, trilhas, desafios, badges, contribuições, newsletter, mercado hoje, upsell)
- [ ] `/area-do-pai/filhos`, `/area-do-pai/salvos`, `/minha-conta` (dados, acesso, notificações, LGPD)
- [ ] `SaveButton` + `toggleSavedItemFn` em post, produto e ferramenta
- [ ] Header com menu do usuário
### E-mails
- [ ] Edge functions `send-welcome-email`, `newsletter-confirm`, `weekly-digest` deployadas e testadas com curl
- [ ] `/newsletter/confirmar` e `/newsletter/sair`
### Planos
- [ ] `usePlan()`, `PremiumGate`, `/area-do-pai/planos`
- [ ] `BILLING_ENABLED=false`; webhook Mercado Pago responde 503; provider pronto
### Segurança / LGPD / Admin
- [ ] Rate limit nas server functions; Turnstile verificado no servidor; open redirect bloqueado
- [ ] CSP em vercel.json; nenhum segredo com VITE_
- [ ] Exportar JSON e excluir conta funcionando
- [ ] Política de privacidade atualizada (seção Área do Pai)
- [ ] `/admin/membros` (somente admin) com troca de role logada
### Qualidade
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` verdes
- [ ] Teste manual do fluxo completo em preview Vercel
- [ ] `docs/plano/PROGRESSO.md` e `CLAUDE.md` atualizados; pendências manuais listadas
```

---

## 15. Anexos rápidos

### 15.1 Diferenças em relação ao vocacaodemae (para o executor não se perder)
| vocacaodemae | vocacaodepai (Fase 5) |
|---|---|
| `profiles.full_name`, `mother_signature` | `profiles.display_name`, sem assinatura; `interests[]`, `city`, `uf`, `onboarding_done` |
| `is_staff()` apenas | `is_admin()` (admin) + `is_staff()` (admin/editor) + `email_verified()` |
| Login em modal (`openLogin`) com i18n | Páginas `/entrar`, `/cadastro`; sem i18n |
| `article_activity` (save/like) + `favorites` | Tabela única `saved_items` (post/product/tool/job/track) |
| `subscribers` | `newsletter_subscribers` com double opt-in e `segments` |
| Sem filhos/fases | `children` + `child_phase()` + tags `fase-*` |
| `brokeredPreviewStorage` (Lovable) | Removido; `flowType: 'pkce'` |
| `get_secret` via Vault, `notify-contact-message` | Mesmo padrão (`get_secret`, segredo interno, Resend) |

### 15.2 Consultas de verificação (SQL Editor)
```sql
-- RLS como anon (deve retornar 0)
set role anon; select count(*) from public.profiles; reset role;
-- fases
select d, public.child_phase(d) from (values (current_date + 30), (current_date - 100), (current_date - 300),
  (current_date - interval '2 years')::date, (current_date - interval '6 years')::date,
  (current_date - interval '10 years')::date, (current_date - interval '15 years')::date,
  (current_date - interval '20 years')::date) v(d);
-- cron
select jobid, jobname, schedule, active from cron.job;
-- advisors: Database → Advisors → Security (zero erros)
```

### 15.3 Textos de UI (PT-BR, tom da marca)
- Título `/entrar`: "Entre na Área do Pai" — subtítulo: "Seu lugar para crescer como pai, marido e homem."
- Título `/cadastro`: "Crie sua conta grátis" — subtítulo: "Leva um minuto. Sem cartão."
- Onboarding passo 2: "Quem são seus filhos?" — ajuda: "Usamos a idade para mostrar o conteúdo certo na hora certa."
- Painel vazio de filhos: "Cadastre seu filho e receba conteúdo para a fase dele."
- Upsell: "Pai de Valor: trilhas avançadas, grupos fechados, e-books e descontos. R$ 19,90/mês ou R$ 179/ano."
- Exclusão: "Tem certeza? Isso apaga sua conta, filhos cadastrados e salvos. Não dá para desfazer."
