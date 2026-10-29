# FASE 1 — Fundação: do repositório vazio ao site no ar com Home e Blog

> Projeto: **Vocação de Pai** — vocacaodepai.com.br
> Repositório alvo: `/home/user/vocacaodepai` (GitHub `vocacaodepai/vocacaodepai`)
> Base a clonar (somente leitura): `/home/user/vocacaodemae`
> Executor: Claude Code (Sonnet 5.5, esforço médio), em sessões dentro de `/home/user/vocacaodepai`
> Documentos que prevalecem sobre este em caso de conflito: `docs/plano/02-arquitetura-e-stack.md` e `CLAUDE.md` da raiz.

## 0. Como ler e executar este documento

- Cada etapa (1 a 10) tem **passos numerados**, **comandos literais** e **critério de aceite**. Não pule etapas; não avance com aceite vermelho.
- Caminhos são sempre absolutos. `VDM` = `/home/user/vocacaodemae` (referência). `VDP` = `/home/user/vocacaodepai` (alvo).
- Tudo que é segredo (service role, tokens) **nunca** vai para o repositório nem para variável `VITE_*`. Só Supabase Vault ou GitHub Secret.
- Faça commits pequenos por etapa, em branch `claude/fase-1-<etapa>`; abra PR contra `main` com título `Fase 1 — <etapas>`; até a Fase 8 **o dono mescla** (auto-merge só é ligado em 8.5, doc 10 §10 — não copiar nem ligar o `auto-merge.yml` nesta fase). Nunca `git push --force`.
- Antes de **todo** push: `npm run build && npm run lint && node scripts/validate-content.mjs` verdes (`CLAUDE.md` §4.1). O validador é criado na etapa 9.5; até lá, `npm run build && npm run lint`.
- Ao concluir uma etapa, registre em `docs/plano/PROGRESSO.md` (uma linha: data, etapa, status, PR).
- Placeholders a substituir no fim da Etapa 1: `<SUPABASE_PROJECT_REF>`, `<SUPABASE_URL>`, `<SUPABASE_PUBLISHABLE_KEY>`.

### Decisões já tomadas nesta fase (não rediscutir)

| Tema | Decisão |
|---|---|
| Base de código | Copiar o conteúdo de `VDM` inteiro (sem `.git`) e **apagar** o que não serve. Mais rápido e seguro do que copiar arquivo a arquivo, porque os imports internos continuam válidos. |
| Lovable | Remover `@lovable.dev/mcp-js`, rotas MCP/`.lovable`, telemetria de erro Lovable, `previewAuthStorage`. **Manter** `@lovable.dev/vite-tanstack-config` na Fase 1 (é só um wrapper de config do Vite que já roda na Vercel; trocar por config manual é risco sem ganho agora — fica para a Fase 8). |
| i18n | Remover totalmente (`i18next`, `react-i18next`, `src/i18n`, `public/locales`, `i18n.config.json`). Textos ficam **literais em PT-BR** nos componentes. |
| Conteúdo de maternidade | **Apagar na Fase 1** rotas/páginas/dados de ferramentas de gestação, enxoval, vacinas etc., histórias, loja e minha-conta. A referência continua em `VDM` para as fases 3, 4, 5 e 7 copiarem o que precisarem. Manter apenas `ToolShell.tsx` e `ToolGate.tsx` (genéricos). |
| Seções sem conteúdo ainda | Criar **páginas placeholder** ("Em construção" + captura de newsletter) para `/pai-indica`, `/loja`, `/ferramentas`, `/area-do-pai`, `/pai-indica-pai`, `/irmandade`, `/formacao`, para o menu já ficar completo. Placeholders **não entram** no sitemap. |
| Admin | Reaproveitar `src/admin/*` (Tiptap) e as rotas `src/routes/_admin/admin/*` + `src/routes/admin/login.tsx`. Autorização por `profiles.role in ('editor','admin')` via função `public.is_admin()`. |
| Fontes | Google Fonts: títulos **Barlow Condensed**, texto **Inter**. |
| Cores | Primária `#14505C`, secundária `#1F2429`, destaque `#D9822B`, fundo `#F4EFE6`, texto `#1B1F23`, sucesso `#2F7D4F`, atenção `#D9A21B`, alerta `#B23A3A`. Escuro: fundo `#14181C`, cartões `#1F2429`. |
| Semáforo | Callouts com prefixo exato: `"Sinal verde: "` (tone `ok`), `"Sinal de atenção: "` (tone `warn`), `"Sinal de alerta: "` (tone `bad`). |

---

## 1. Preparação (contas e projetos externos)

### 1.1 Clonar a referência ao lado

```bash
[ -d /home/user/vocacaodemae ] || git clone --depth 1 https://github.com/vocacaodepai/vocacaodemae /home/user/vocacaodemae
ls /home/user/vocacaodemae/src   # deve listar: admin assets components hooks i18n integrations lib pages routeTree.gen.ts router.tsx routes server.ts start.ts styles.css
```

### 1.2 Projeto Supabase novo

1. Via MCP: `mcp__Supabase__list_organizations` → anotar o `id` da organização do grupo (a mesma do `<REF_SUPABASE_DO_VOCACAODEMAE>` do Vocação de Mãe).
2. `mcp__Supabase__create_project` com `name: "vocacaodepai"`, `region: "sa-east-1"`, `organization_id: <id>`. Guarde o `id` retornado = **project ref**.
   - Se o MCP não permitir criar, o dono cria em https://supabase.com/dashboard/new → nome `vocacaodepai`, região `South America (São Paulo)`; depois `mcp__Supabase__list_projects` para pegar o ref.
3. Obter URL e chave pública:
   - `mcp__Supabase__get_project_url` → `<SUPABASE_URL>` (formato `https://<ref>.supabase.co`).
   - `mcp__Supabase__get_publishable_keys` → `<SUPABASE_PUBLISHABLE_KEY>` (anon/publishable; **é pública**, pode ir no bundle).
   - Dashboard equivalente: Project Settings → API → Project URL / anon public.
4. **Service role**: Project Settings → API → `service_role`. **Não copiar para arquivo nenhum.** Usos permitidos:
   - GitHub Secret `SUPABASE_SERVICE_ROLE_KEY` no repo `vocacaodepai/vocacaodepai` (para a rotina automática da Fase 8);
   - Supabase Vault (`vault.create_secret`) quando uma função SQL/edge precisar.
5. Habilitar Auth → Providers → Email (confirmar e-mail ligado) e, se o dono quiser, Google (mesmo client OAuth do grupo).
6. Auth → URL Configuration: Site URL `https://vocacaodepai.com.br`; Redirect URLs: `https://vocacaodepai.com.br/**`, `https://*.vercel.app/**`, `http://localhost:8080/**`.

### 1.3 Registrar o ref no repositório

Depois de obter o ref, substituir o placeholder em todos os arquivos do repo:

```bash
cd /home/user/vocacaodepai
grep -rl "<SUPABASE_PROJECT_REF>" . --exclude-dir=node_modules --exclude-dir=.git | xargs sed -i 's/<SUPABASE_PROJECT_REF>/REF_REAL_AQUI/g'
```

Arquivos onde o ref aparece: `CLAUDE.md`, `.mcp.json`, `supabase/config.toml`, `src/integrations/supabase/client.ts`, `src/routes/sitemap[.]xml.ts`, `.claude/settings.json`.

### 1.4 Vercel

1. `mcp__Vercel__list_teams` → anotar o `id` do time **"Portal da AI"**.
2. `mcp__Vercel__create_git_project` (ou dashboard: Add New → Project → Import `vocacaodepai/vocacaodepai`) no time "Portal da AI". Framework preset: **Other** (o build é `vite build` com `nitro.preset: "vercel"`, igual ao VDM). Build command `npm run build`; Output: deixar vazio (o Nitro gera `.vercel/output`). Node 22.
3. Variáveis de ambiente (Production + Preview), via `mcp__Vercel__create_project_env`:
   - `SUPABASE_URL` = `<SUPABASE_URL>`
   - `SUPABASE_PUBLISHABLE_KEY` = `<SUPABASE_PUBLISHABLE_KEY>`
   - `SITE_URL` = `https://vocacaodepai.com.br`
   - `RESEND_API_KEY` = (chave do grupo; só server). Fase 1 usa apenas no formulário de contato.
   - **Nunca** `SUPABASE_SERVICE_ROLE_KEY` na Vercel.
4. Domínio: `mcp__Vercel__add_project_domain` com `vocacaodepai.com.br` e `www.vocacaodepai.com.br` (www redireciona para apex). DNS no registrador: `A @ 76.76.21.21` e `CNAME www cname.vercel-dns.com`. Verificar com `mcp__Vercel__verify_project_domain`.

### 1.5 GitHub

- Repo `vocacaodepai/vocacaodepai` já existe (vazio). Branch padrão `main`. Settings → Actions → Workflow permissions: **Read and write** (será necessário na Fase 8 para o `auto-merge.yml`, doc 10 §10.1; pode ser configurado agora, mas o workflow **não** entra nesta fase).
- Secrets do repo (Settings → Secrets → Actions): `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, `SUPABASE_PROJECT_REF` (usados só pela rotina da Fase 8; criar agora para não esquecer).

**Aceite da Etapa 1:** `mcp__Supabase__get_project` retorna status `ACTIVE_HEALTHY` para o ref novo; projeto Vercel existe no time "Portal da AI" com as 4 env vars; domínio adicionado (pode ainda estar "pending" de DNS); `grep -r "<SUPABASE_PROJECT_REF>" /home/user/vocacaodepai --exclude-dir=node_modules` retorna vazio.

---

## 2. Copiar a estrutura do Vocação de Mãe

### 2.1 Cópia bruta

```bash
cd /home/user/vocacaodepai
# copia tudo (inclusive dotfiles), exceto .git e node_modules
rsync -a --exclude .git --exclude node_modules --exclude docs /home/user/vocacaodemae/ /home/user/vocacaodepai/
rm -f .github/workflows/auto-merge.yml   # não copiar auto-merge.yml: entra só na Fase 8 (doc 10 §10.1); até lá o dono mescla os PRs
git status --short | head
```

Arquivos/pastas que **devem** existir após a cópia (conferir com `ls`):

```
package.json  vite.config.ts  tsconfig.json  components.json  eslint.config.js  .prettierrc  .prettierignore  .gitignore  bunfig.toml
src/routes/__root.tsx  src/routes/_site.tsx  src/routes/_admin.tsx  src/routes/sitemap[.]xml.ts  src/routes/api/img/$.ts
src/routes/_site/{index,blog,busca,contato,sobre,politica-de-privacidade,termos-de-uso}.tsx  src/routes/_site/post/$slug.tsx  src/routes/_site/categoria/$slug.tsx
src/routes/_admin/admin/index.tsx  src/routes/_admin/admin/editor/{index,$id}.tsx  src/routes/admin/login.tsx
src/pages/{Home,BlogPage,PostPage,CategoryPage,SearchPage,About,Contact,PrivacyPolicy,TermsOfUse,NotFound}.tsx
src/components/ui/*  src/components/layout/{SiteLayout,CookieConsent,ThemeToggle}.tsx  src/components/blog/*  src/components/home/ToolsTeaser.tsx
src/components/tools/{ToolShell,ToolGate}.tsx
src/lib/*  src/integrations/supabase/*  src/admin/*  src/hooks/*  src/styles.css  src/router.tsx  src/server.ts  src/start.ts
supabase/config.toml  supabase/functions/{stock-photos,seo-search-console,notify-contact-message}/index.ts
.claude/settings.json  public/{ads.txt,robots.txt,manifest.webmanifest,placeholder.svg}
(.github/workflows/auto-merge.yml NÃO deve existir — removido acima)
```

### 2.2 Apagar — Lovable e MCP

```bash
cd /home/user/vocacaodepai
rm -rf .lovable 'src/routes/[.mcp]' 'src/routes/[.well-known]' 'src/routes/[.]lovable.oauth.consent.tsx' src/routes/mcp.ts src/lib/mcp src/lib/lovable-error-reporting.ts src/integrations/supabase/previewAuthStorage.ts roadmap.md AGENTS.md
npm uninstall @lovable.dev/mcp-js
```

Depois editar:
- `vite.config.ts`: remover `import mcpPlugin ...` e o bloco `plugins: [mcpPlugin({...})]`; manter `defineConfig` de `@lovable.dev/vite-tanstack-config`, `tanstackStart.server.entry: "server"` e `nitro.preset: "vercel"`. Remover os comentários sobre Lovable.
- `src/routes/__root.tsx`: remover `import { reportLovableError }` e as chamadas `reportLovableError(...)` (deixar só `console.error`).
- `src/integrations/supabase/client.ts`: remover `brokeredPreviewStorage` (import e `storage:`), deixar `auth: { persistSession: true, autoRefreshToken: true }`; trocar URL e chave pelos do projeto novo.
- `src/lib/error-capture.ts`: se referenciar Lovable, trocar por `console.error`.
- `.mcp.json`: trocar `project_ref=<REF_SUPABASE_DO_VOCACAODEMAE>` por `project_ref=<SUPABASE_PROJECT_REF>`.
- `supabase/config.toml`: `project_id = "<SUPABASE_PROJECT_REF>"`.
- `.claude/settings.json`: trocar a URL do curl de `seo-search-console` para o ref novo.

### 2.3 Apagar — i18n

```bash
cd /home/user/vocacaodepai
rm -rf src/i18n public/locales i18n.config.json
npm uninstall i18next i18next-browser-languagedetector i18next-http-backend react-i18next
grep -rln "react-i18next\|useTranslation\|I18nextProvider\|i18n/config" src
```

Para **cada arquivo** listado pelo grep: remover `import { useTranslation }`, remover `const { t } = useTranslation()` e trocar `t("chave")` pelo texto literal em PT-BR (consultar o valor antigo em `/home/user/vocacaodemae/src/i18n/locales/pt-BR.json` quando precisar). Em `__root.tsx`, remover `I18nextProvider`. Rodar `npx tsc --noEmit` até zero erros de `t`/i18n.

### 2.4 Apagar — conteúdo de maternidade

```bash
cd /home/user/vocacaodepai
rm -rf src/routes/_site/ferramentas src/pages/tools src/lib/tools src/components/tools/embeds src/components/tools/{EngasgoAnimator,VaccinationTracker,VacinasUnificado}.tsx src/components/tools/engasgo-anim-data.ts
rm -rf src/routes/_site/historias src/routes/_site/loja src/routes/_site/minha-conta.tsx
rm -rf src/pages/{StoriesPage,StoryPage,NewStoryPage,StorePage,ProductPage,AccountPage,ToolsPage}.tsx
rm -rf src/components/stories src/components/store src/lib/stories-read.ts src/lib/story-categories.ts src/lib/price-range.ts
rm -rf scripts/rotina src/assets/*   # assets: logos/ilustrações da mãe; a rotina volta na Fase 8
rm -f public/logo*.png public/logo-avatar-512.jpg public/images/*
```

Depois: `npx tsc --noEmit` e remover imports quebrados em `src/lib/db.ts`, `src/lib/queries.ts`, `src/lib/types.ts`, `src/lib/hub.functions.ts`, `src/pages/Home.tsx`, `src/components/layout/SiteLayout.tsx` (menus de histórias/loja), `src/components/blog/ToolEmbed*.tsx` (deixar o host genérico, remover embeds específicos), `src/routes/sitemap[.]xml.ts` (remover ferramentas/historias/loja da lista). Tipos `MotherStory`, `MotherChild`, `Product`, `Poll` saem de `types.ts` (os de loja/membros voltam nas fases 3 e 5 com os nomes das COLUNAS-CHAVE).

### 2.5 Renomear textos e identidade

```bash
cd /home/user/vocacaodepai
grep -rln "Vocação de Mãe\|vocacaodemae\|Andressa Danello\|maternidade\|mãe" src public index.html 2>/dev/null
```

- `src/lib/site.ts` (reescrever):

```ts
export const SITE_NAME = "Vocação de Pai";
export const SITE_URL = "https://vocacaodepai.com.br";
export const SITE_DESCRIPTION =
  "Paternidade, família e formação do homem: guias práticos para ser um pai presente, um marido firme e um provedor consciente.";
export const SITE_OG_IMAGE = `${SITE_URL}/og-default.jpg`; // gerar na etapa 6.6
export const DEFAULT_AUTHOR = "Bruno Danello";
export const SITE_TAGLINE = "Para o homem que quer ser um pai melhor";
// formatDate / formatDateShort: manter como no VDM
```

- `package.json`: `"name": "vocacaodepai"`.
- `public/manifest.webmanifest`: name/short_name "Vocação de Pai", `theme_color` `#14505C`, `background_color` `#F4EFE6`.
- `public/robots.txt`: `Sitemap: https://vocacaodepai.com.br/sitemap.xml`.
- `src/routes/__root.tsx`: `SITE_OG_IMAGE` importado de `site.ts`; `<html lang="pt-BR">`; link Google Fonts (etapa 4).
- `src/components/blog/Callout.tsx`: trocar o texto-padrão/ícones do semáforo (ver etapa 4.4).
- `CLAUDE.md` da raiz: já escrito pelo plano mestre; conferir que cita o ref novo.
- `README.md`: 15 linhas: nome, stack, `npm run dev`, link para `docs/plano/`.

### 2.6 Instalar e compilar

```bash
cd /home/user/vocacaodepai
rm -f bun.lock && npm install
npx tsc --noEmit && npm run lint && npm run build
```

**Aceite da Etapa 2:** `npm run build` termina sem erro; `grep -rn "lovable\|i18next\|vocacaodemae\|<REF_SUPABASE_DO_VOCACAODEMAE>" src vite.config.ts package.json` retorna vazio (exceto `@lovable.dev/vite-tanstack-config` no `package.json` e no `vite.config.ts`); `npm run dev` abre a home (mesmo que ainda com visual da mãe).

---

## 3. Migrations `0001_core.sql` a `0007_ferramentas.sql`

Criar os 7 arquivos em `supabase/migrations/`. Antes, **apagar** as migrations copiadas do VDM:

```bash
cd /home/user/vocacaodepai && rm -f supabase/migrations/2026*.sql
```

O SQL **não é escrito neste documento**: a fonte de verdade de nomes de tabelas, colunas, policies e assinaturas de função é `docs/plano/02-arquitetura-e-stack.md` §4 (regras gerais em §4, blocos em §4.1 a §4.7). Copiar literalmente; não "melhorar" nada.

### 3.1 `supabase/migrations/0001_core.sql`

Copiar **literalmente** o bloco SQL de `docs/plano/02-arquitetura-e-stack.md` §4.1 para `supabase/migrations/0001_core.sql`. Não alterar nomes de tabelas, colunas, policies nem assinaturas de função. O que esse arquivo cria (conferir depois com `list_tables`): `profiles` (`role in ('member','author','editor','admin')`), `children`, `contact_messages`, `newsletter_subscribers` (com `status`, `confirm_token`, `confirmed_at` — **usada já na Fase 1** pela newsletter com double opt-in, ver §4.6), `moderation_log` (`entity_type, entity_id, action, moderator_id, reason`), `_tmp_post_staging`, `seo_search_stats`; funções `set_updated_at`, `is_admin`, `guard_profile_role`, `handle_new_user`, `get_public_profile`, `get_secret`; configuração de busca `pt_unaccent`; buckets `covers`, `products`, `avatars` com policies. Tudo com `create table if not exists` e RLS ligada.

### 3.2 `supabase/migrations/0002_blog.sql`

Copiar **literalmente** o bloco SQL do doc 02 §4.2 para `supabase/migrations/0002_blog.sql`. Não alterar nomes de colunas nem assinaturas de função. O que esse arquivo cria: `categories` (`id, slug, name, description, icon, sort_order` — **não existe coluna `color`**; o chip usa o ícone `lucide-react` de `icon` e cores derivadas da paleta), `tags`, `posts` (todas as COLUNAS-CHAVE + `subtitle`, `cover_image_alt`, `view_count`, `like_count`), `post_tags`, `comments`, `reactions`, `post_view_events`; funções `tiptap_text`, `posts_search_content` (trigger que preenche `search_content` e `reading_time`), `toggle_reaction(p_post_id, p_type, p_user_key)`, `increment_post_views(p_post_id, p_user_key)` e `search_posts(p_query, p_limit, p_offset)`; e o seed inicial de categorias (`on conflict (slug) do nothing`). O front (etapas 5 e 6) chama **exatamente** esses nomes: `supabase.rpc("increment_post_views", { p_post_id, p_user_key })` e `supabase.rpc("search_posts", { p_query, p_limit, p_offset })`.

### 3.3 `0003_loja.sql` a `0007_ferramentas.sql`

Copiar literalmente os blocos do doc 02 §4.3 a §4.7 para `0003_loja.sql`, `0004_membros.sql`, `0005_pai_indica_pai.sql`, `0006_irmandade_formacao.sql` e `0007_ferramentas.sql`. A Fase 1 aplica o **schema inteiro** (tabelas vazias, RLS ativa): é o que a checklist 1.10 do doc 13 pede e o que os docs 04 e 05 assumem ao começar (`products`/`product_categories` já existentes). As fases seguintes só acrescentam dados, funções de fase e código.

### 3.4 Aplicar e gerar tipos

1. Aplicar **0001 a 0007, nesta ordem**, via `mcp__Supabase__apply_migration` com `project_id: <ref>`, `name` igual ao nome do arquivo sem extensão (`0001_core`, `0002_blog`, `0003_loja`, `0004_membros`, `0005_pai_indica_pai`, `0006_irmandade_formacao`, `0007_ferramentas`) e `query: <conteúdo do arquivo>`. Se uma falhar, corrigir o arquivo e reaplicar — todas são idempotentes (`if not exists`; policies com `drop policy if exists` antes).
2. `mcp__Supabase__list_migrations` → as 7 listadas. `mcp__Supabase__list_tables` (`schemas: ["public"]`) → **39 tabelas**: as 38 do `CLAUDE.md` §8 + `contact_messages` (doc 02 §4.1).
3. `mcp__Supabase__get_advisors` (`type: "security"` e `"performance"`) → zero erros (avisos de "function search_path" aceitáveis se já houver `set search_path`).
4. Tipos: `mcp__Supabase__generate_typescript_types` → salvar a saída inteira em `src/integrations/supabase/types.ts` (substitui o arquivo do VDM). Alternativa CLI: `npx supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts`.
5. Promover o dono a admin após o primeiro login (`mcp__Supabase__execute_sql`; roda como service_role, então passa pelo `guard_profile_role`):

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'EMAIL_DO_DONO');
```

**Aceite da Etapa 3:** 7 migrations listadas e 39 tabelas em `public` (item 2) + 3 buckets (`covers`, `products`, `avatars`); RLS ativa em todas (`select tablename from pg_tables where schemaname = 'public' and not rowsecurity` retorna vazio); `select public.is_admin()` roda sem erro; `select * from public.search_posts('pai')` retorna vazio sem erro; `types.ts` compila.

---

## 4. Design tokens, Header, Footer e menu mobile

### 4.1 Tokens — arquivo `src/styles.css`

Editar o bloco `@theme` (linhas ~7-9) e o `@layer base { :root ... .dark ... }` (linhas ~121-220 no VDM). Valores em HSL sem `hsl()` (padrão shadcn já usado):

```css
@theme {
  --font-display: "Barlow Condensed", "Arial Narrow", sans-serif;
  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;
  /* ...manter o restante do @theme do VDM (color-*, radius, shadows, keyframes) */
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-danger: hsl(var(--danger));
}

@layer base {
  :root {
    /* Vocação de Pai — areia + petróleo + couro */
    --background: 39 39% 93%;        /* #F4EFE6 */
    --foreground: 210 13% 12%;       /* #1B1F23 */
    --card: 40 40% 97%;
    --card-foreground: 210 13% 12%;
    --popover: 40 40% 97%;
    --popover-foreground: 210 13% 12%;
    --primary: 190 64% 22%;          /* #14505C */
    --primary-foreground: 0 0% 100%;
    --primary-glow: 190 50% 36%;
    --secondary: 210 14% 14%;        /* #1F2429 */
    --secondary-foreground: 39 39% 93%;
    --muted: 39 25% 88%;
    --muted-foreground: 210 10% 38%;
    --accent: 30 70% 51%;            /* #D9822B */
    --accent-foreground: 0 0% 100%;
    --destructive: 0 51% 46%;        /* #B23A3A */
    --destructive-foreground: 0 0% 100%;
    --success: 145 45% 34%;          /* #2F7D4F */
    --warning: 43 78% 48%;           /* #D9A21B */
    --danger: 0 51% 46%;             /* #B23A3A */
    --border: 39 20% 82%;
    --input: 39 20% 80%;
    --ring: 190 64% 22%;
    --radius: 0.5rem;                /* mais reto, masculino */
    --sidebar-background: 40 40% 96%;
    --sidebar-foreground: 210 13% 18%;
    --sidebar-primary: 190 64% 22%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 39 25% 90%;
    --sidebar-accent-foreground: 210 13% 12%;
    --sidebar-border: 39 20% 82%;
    --sidebar-ring: 190 64% 22%;
    --gradient-primary: linear-gradient(135deg, hsl(190 64% 22%), hsl(190 50% 32%));
    --gradient-soft: linear-gradient(160deg, hsl(40 40% 97%) 0%, hsl(39 30% 90%) 100%);
    --gradient-hero: linear-gradient(135deg, hsl(190 30% 90%) 0%, hsl(39 39% 93%) 55%, hsl(30 60% 90%) 100%);
  }
  .dark {
    --background: 210 17% 9%;        /* #14181C */
    --foreground: 39 30% 92%;
    --card: 210 14% 14%;             /* #1F2429 */
    --card-foreground: 39 30% 92%;
    --popover: 210 14% 14%;
    --popover-foreground: 39 30% 92%;
    --primary: 190 45% 40%;
    --primary-foreground: 0 0% 100%;
    --primary-glow: 190 50% 50%;
    --secondary: 210 12% 20%;
    --secondary-foreground: 39 30% 92%;
    --muted: 210 12% 18%;
    --muted-foreground: 39 12% 68%;
    --accent: 30 70% 55%;
    --accent-foreground: 210 17% 9%;
    --destructive: 0 51% 52%;
    --destructive-foreground: 0 0% 100%;
    --success: 145 40% 42%;
    --warning: 43 70% 55%;
    --danger: 0 51% 52%;
    --border: 210 12% 22%;
    --input: 210 12% 24%;
    --ring: 190 45% 40%;
    --sidebar-background: 210 15% 11%;
    --sidebar-foreground: 39 30% 88%;
    --sidebar-primary: 190 45% 40%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 210 12% 18%;
    --sidebar-accent-foreground: 39 30% 92%;
    --sidebar-border: 210 12% 22%;
    --sidebar-ring: 190 45% 40%;
    --gradient-primary: linear-gradient(135deg, hsl(190 45% 34%), hsl(190 45% 44%));
    --gradient-soft: linear-gradient(160deg, hsl(210 17% 10%) 0%, hsl(210 14% 14%) 100%);
    --gradient-hero: linear-gradient(135deg, hsl(190 30% 14%) 0%, hsl(210 17% 10%) 55%, hsl(30 30% 14%) 100%);
  }
}
```

Regras: títulos (`h1-h3`, `.font-display`) em Barlow Condensed, peso 600/700, `tracking-tight`, caixa normal (não usar uppercase em títulos de artigo; uppercase só em rótulos pequenos de seção). Texto em Inter 16-18px, `leading-relaxed`.

### 4.2 Fontes — `src/routes/__root.tsx`

No array `links` do `head()`, trocar as fontes do VDM por:

```ts
{ rel: "preconnect", href: "https://fonts.googleapis.com" },
{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
{ rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
```

### 4.3 Header — `src/components/layout/SiteLayout.tsx`

Substituir `NAV_MAIN`/`NAV_END` (que usam `labelKey`) por rótulos literais:

```ts
const NAV_MAIN = [
  { to: "/blog", label: "Blog", end: false },
  { to: "/pai-indica", label: "Pai Indica", end: false },
  { to: "/loja", label: "Loja do Pai", end: false, store: true },
  { to: "/ferramentas", label: "Ferramentas", end: false },
  { to: "/pai-indica-pai", label: "Pai Indica Pai", end: false },
  { to: "/irmandade", label: "Irmandade", end: false },
  { to: "/formacao", label: "Formação", end: false },
];
const NAV_END = [
  { to: "/sobre", label: "Sobre", end: false },
  { to: "/contato", label: "Contato", end: false },
];
```

- Manter: skip-link `#conteudo`, busca (`/busca?q=`), `ThemeToggle`, dropdown de categorias do Blog (vem de `fetchCategories`), menu de conta (mostrar "Área do Pai" → `/area-do-pai`, "Minha conta" → `/minha-conta`, "Admin" → `/admin` se `is_admin`, "Sair"). Botão "Entrar" → `/entrar` (Fase 5 implementa; na Fase 1 `/entrar` redireciona para `/admin/login`).
- Logo: `public/logo.svg` (wordmark "VOCAÇÃO DE PAI" em Barlow Condensed 700, petróleo; ícone: escudo com "VP"). Gerar SVG simples no código; o dono troca depois.
- Mobile (`xl:hidden`): já existe o `<nav aria-label="Menu móvel">` em `SiteLayout.tsx`; manter padrão de abrir/fechar, listar `NAV_MAIN` + `NAV_END` + "Entrar". Fechar ao navegar.
- Faixa fina acima do header (opcional, `bg-secondary text-secondary-foreground text-xs`): "O pai também quer desconto → Loja do Pai".

### 4.4 Footer

No mesmo `SiteLayout.tsx`, 4 colunas: (1) logo + `SITE_TAGLINE` + redes + bloco fixo **"Para a sua esposa: Vocação de Mãe"** com logo e link `https://vocacaodemae.com.br` (`rel="noopener"`, **sem** `nofollow` — casal de sites, doc 00 §9.1 item 1); (2) "Seções": as 7 de `NAV_MAIN`; (3) "Institucional": Sobre, Contato, Política de Privacidade, Termos de Uso, Política de Afiliados e o link permanente "Gerenciar cookies" (reabre o `CookieConsent`, §4.6); (4) Newsletter (`NewsletterSignup`, com double opt-in e a caixa opcional "Minha esposa também quer receber o Vocação de Mãe" — §4.6). Linha final: "© {ano} Vocação de Pai · Um site do Grupo VDP · Participante do Programa de Associados da Amazon". `CookieConsent` é o da §4.6 (Consent Mode v2), não o herdado sem alteração.

### 4.5 Callout do semáforo — `src/components/blog/Callout.tsx`

Manter os 3 `tone` (`ok|warn|bad`), mas: cores `ok` → `--success`, `warn` → `--warning`, `bad` → `--danger`; ícones `lucide-react`: `ShieldCheck`, `AlertTriangle`, `OctagonAlert`; rótulos padrão do componente: "Sinal verde", "Sinal de atenção", "Sinal de alerta". No `tiptap-html.ts`, conferir que o nó `callout` renderiza `data-tone`.

### 4.6 Conformidade da base (LGPD, avisos, newsletter e antispam)

Itens que o doc 11 §12 atribui à Fase 1 e que o doc 00 §4.4 exige. Entram nesta etapa para o site nascer em conformidade (AdSense, LGPD, Amazon Associados), não como melhoria futura.

1. **`src/components/layout/CookieConsent.tsx`** (adaptar do VDM; padrão ANPD, doc 11 §2.7): 1º nível com três botões de mesmo destaque, "Aceitar", **"Rejeitar não necessários"** e "Gerenciar"; 2º nível com Necessários (sempre ativos) / Analíticos / Publicidade desmarcados por padrão. No `__root.tsx`, **antes** de qualquer script do GA4 (`src/lib/ga4.ts`):

```js
gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
```

   e `gtag('consent', 'update', { ... })` com o que o visitante escolher. Escolha gravada em `localStorage` (`vdp-consent`, com versão do banner e timestamp); o link "Gerenciar cookies" do rodapé reabre o banner. GA4 só carrega após `analytics_storage: 'granted'`.

2. **`src/components/blog/ContentNotice.tsx`**: componente com a tabela do doc 00 §4.4 (5 avisos fixos: saúde/192, direitos/advogado, dinheiro/"não é recomendação", afiliado/Amazon, CVV 188). Recebe `category` (slug), `kind`, `tags` e `hasAffiliate` e renderiza o(s) aviso(s) que casarem, no topo do corpo, em `/post/$slug` (Fase 1), `/pai-indica/$slug` e `/loja/$slug` (Fases 2 e 3) e nas ferramentas de dinheiro (Fase 4). Sem aviso casando, não renderiza nada.

3. **Newsletter com double opt-in** (doc 11 §5.2, obrigatório):
   - `NewsletterSignup` → `POST /api/newsletter` (`src/routes/api/newsletter.ts`, doc 02 §3): valida o e-mail, `upsert` em `newsletter_subscribers` com `status='pending'` (o `confirm_token` vem do default da tabela, doc 02 §4.1), envia o e-mail de confirmação via Resend (`RESEND_API_KEY`; remetente `Vocação de Pai <contato@vocacaodepai.com.br>`) e responde sempre "Verifique seu e-mail" (não revela se já existia).
   - `GET /newsletter/confirmar?token=` (`src/routes/_site/newsletter/confirmar.tsx`; `noindex`, sem anúncio): marca `status='confirmed'`, `confirmed_at = now()` e mostra "Inscrição confirmada". Rota nova em relação ao doc 02 §1.3: registrar no doc 02 e em `PROGRESSO.md`.
   - Caixa opcional no formulário: **"Minha esposa também quer receber o Vocação de Mãe"** (campo e-mail dela; `POST` na API da newsletter do VDM com segmento `indicado-pelo-marido` — doc 00 §9.1 item 8). Se a API do VDM ainda não aceitar esse POST, registrar em `PROGRESSO.md` → "Pendências do dono" e deixar a caixa escondida.
   - A Fase 5 liga `profiles.newsletter_opt_in` a esta mesma tabela; a Fase 8 faz o envio semanal.

4. **Antispam em `/api/newsletter` e no formulário de `/contato`** (`src/routes/api/contact.ts`): Cloudflare Turnstile (`TURNSTILE_SITE_KEY` no cliente, `TURNSTILE_SECRET_KEY` só no servidor — acrescentar as duas ao `.env.example`) + rate limit por IP (10 requisições/hora por rota, em memória no servidor) + honeypot. Chave ausente → registrar em `PROGRESSO.md` → "Pendências do dono" e cair para honeypot + rate limit, sem bloquear o build.

5. **`src/lib/ads/no-ads-routes.ts`**: constante com a lista do doc 11 §2.5 (`/busca`, `/404`, `/entrar`, `/cadastro`, `/minha-conta`, `/area-do-pai/*`, `/admin/*`, `/newsletter/confirmar`, `/newsletter/obrigado`, `/sobre`, `/contato`, `/politica-*`, `/termos-de-uso`, `/anuncie`, `/pai-indica-pai/vagas/nova`, `/historias/nova`, `/loja/ofertas`) e função `isNoAdsRoute(pathname)`; `AdSlot` renderiza `null` nessas rotas.

**Aceite da §4.6:** o banner aparece na 1ª visita com "Rejeitar não necessários" visível; sem aceite, nenhuma requisição a `googletagmanager.com`; inscrever um e-mail cria linha `pending` e o link do e-mail a torna `confirmed`; o 11º POST seguido em `/api/newsletter` do mesmo IP responde 429; `/post/<slug>` da categoria de saúde mostra o aviso do 192.

**Aceite da Etapa 4:** home em `npm run dev` já aparece com fundo areia, títulos Barlow Condensed, header com as 7 seções + Sobre/Contato, menu mobile abre e fecha, dark mode troca para `#14181C`; rodapé com o bloco "Para a sua esposa: Vocação de Mãe" e "Gerenciar cookies"; aceite da §4.6 verde; `npm run build` ok.

---

## 5. Home (`src/pages/Home.tsx` + `src/routes/_site/index.tsx`)

### 5.1 Dados — `src/lib/hub.functions.ts`

Herdar `getHomeData` e `mixByCategory` (já existem no VDM). Ajustar `HomeData`:

```ts
export interface HomeData {
  latest: PostWire[];      // 7 posts, 1 por categoria primeiro (mixByCategory)
  popular: PostWire[];     // 4 por view_count
  paiIndica: PostWire[];   // 3 posts com kind in ('review','comparativo','lista') — Fase 1 pode vir vazio
  categories: Category[];
}
export const getHomeData = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const db = await createReadOnlySupabaseClient();
  const [latest, popular, paiIndica, categories] = await Promise.all([
    safe(queryPublishedPosts(db, { limit: 40 }), EMPTY_PAGE),
    safe(queryPublishedPosts(db, { limit: 4, orderBy: "view_count" }), EMPTY_PAGE),
    safe(queryPublishedPosts(db, { limit: 3, kinds: ["review", "comparativo", "lista"] }), EMPTY_PAGE),
    safe(queryCategories(db), [] as Category[]),
  ]);
  return { latest: wire(mixByCategory(latest.posts, 7)), popular: wire(popular.posts), paiIndica: wire(paiIndica.posts), categories };
});
```

Em `src/lib/queries.ts`, adicionar `kinds?: string[]` em `PublishedPostsOpts` (`.in("kind", kinds)`), e trocar `POST_SELECT` para `*, category:categories(*), author:profiles(id, display_name, bio, avatar_url, role)` (coluna `display_name`, não `full_name`). Remover `queryStories`, `queryStoreProducts`, `queryProductBySlug`, `queryProductReviews`.

### 5.2 Seções da Home (ordem fixa)

1. **Hero** (`<section>` com `bg-gradient-hero`): H1 "Ser pai é vocação. Ser homem é construção." Subtítulo: "Guias práticos sobre paternidade, casamento, dinheiro, saúde e tudo que forma um homem de família." Botões: "Ler o blog" (`/blog`, primário) e "Entrar na Área do Pai" (`/area-do-pai`, outline). À direita, cartão com o post mais recente (`latest[0]`).
2. **Últimos artigos** — grid 1/2/3 colunas com `PostCard` para `latest` (7: o primeiro em destaque largo). Link "Ver todos" → `/blog`.
3. **Pai Indica em destaque** — `paiIndica` com `ReviewBadge` (nota `product_score`) quando houver; se vazio, cartão: "O Pai Indica está chegando: reviews honestas, comparativos e listas do que vale o seu dinheiro." → `/pai-indica`.
4. **Caixa de Ferramentas** — reaproveitar `src/components/home/ToolsTeaser.tsx` com 4 cartões estáticos: Conversor de Moedas (`/ferramentas/conversor-de-moedas`), Mercado Financeiro (`/ferramentas/mercado-financeiro`), Orçamento da Família, Calculadora de Churrasco — os 2 últimos com selo "Em breve". Links apontam para `/ferramentas` até a Fase 4.
5. **Categorias** — `CategoryCard` para as 14 categorias (ícone `lucide-react` de `categories.icon`; cor do chip derivada da primária/destaque com opacidade — **não existe `categories.color`** no doc 02 §4.2).
6. **CTA Área do Pai** — faixa `bg-secondary`: "Trilhas de formação, desafios de 30 dias, conteúdos salvos e a Irmandade. Grátis." Botão "Criar minha conta" → `/cadastro` (Fase 5; na Fase 1 leva a `/area-do-pai` placeholder).
7. **Newsletter** — `NewsletterSignup` (grava em `newsletter_subscribers`, criada em `0001_core.sql` pelo doc 02 §4.1, com double opt-in e a caixa da esposa — §4.6).
8. **Loja do Pai** — faixa com slogan **"O pai também quer desconto"** e 4 cartões estáticos de categorias futuras (Churrasco, Ferramentas, Esporte, Pai e Bebê) → `/loja` placeholder.
9. **Mais lidos** — lista compacta de `popular`.

### 5.3 Placeholders de seção

Criar `src/components/layout/ComingSoon.tsx` (`title`, `description`, `eta`, com `NewsletterSignup`) e as rotas:

```
src/routes/_site/pai-indica/index.tsx     → ComingSoon title="Pai Indica"
src/routes/_site/loja/index.tsx           → ComingSoon title="Loja do Pai" description="O pai também quer desconto."
src/routes/_site/ferramentas/index.tsx    → ComingSoon title="Caixa de Ferramentas"
src/routes/_site/area-do-pai.tsx          → ComingSoon title="Área do Pai"
src/routes/_site/pai-indica-pai/index.tsx → ComingSoon title="Pai Indica Pai"
src/routes/_site/irmandade.tsx            → ComingSoon title="Irmandade"
src/routes/_site/formacao/index.tsx       → ComingSoon title="Formação"
src/routes/_site/entrar.tsx               → redirect para /admin/login (Fase 5 substitui)
```

Cada placeholder define `head()` com `<meta name="robots" content="noindex">`.

**Aceite da Etapa 5:** `/` renderiza as 9 seções sem erro com banco vazio (estados vazios amigáveis) e com os 10 posts do seed; Lighthouse mobile ≥ 85 performance e 100 acessibilidade/SEO; nenhum link do menu dá 404.

---

## 6. Blog

Arquivos já herdados: `src/routes/_site/blog.tsx` + `src/pages/BlogPage.tsx`; `src/routes/_site/post/$slug.tsx` + `src/pages/PostPage.tsx`; `src/routes/_site/categoria/$slug.tsx` + `src/pages/CategoryPage.tsx`; `src/routes/_site/busca.tsx` + `src/pages/SearchPage.tsx`; `src/routes/sitemap[.]xml.ts`; `src/lib/seo.ts`, `src/lib/seo.functions.ts`, `src/lib/tiptap-html.ts`, `src/lib/cover.ts`, `src/routes/api/img/$.ts` (proxy/resize de imagem).

### 6.1 `/blog`
- Filtro por categoria (`?categoria=slug`), ordenação (`?ordem=recent|views|likes`), paginação (`PER_PAGE = 12`). `getBlogData` já existe em `hub.functions.ts` — só ajustar textos.
- Título: "Blog do Vocação de Pai" + descrição por categoria.

### 6.2 `/post/$slug`
- `PostPage.tsx`: capa, categoria (chip com ícone `categories.icon`), título, autor (`display_name`), data, tempo de leitura, `ContentNotice` (§4.6) no topo do corpo, `ReadingProgress`, `TableOfContents`, corpo via `tiptap-html.ts`, `Callout` do semáforo, tabela, `taskList` (checklist), `QuizWidget`, FAQ (accordion), `ShareButtons`, `Comments`, reações, `AdSlot` (2: após o 2º H2 e no fim), "Continue lendo" (3 posts da mesma categoria), `Breadcrumbs`.
- Registrar visita: `supabase.rpc("increment_post_views", { p_post_id, p_user_key: getAnonId() })` em `useEffect` (assinatura do doc 02 §4.2; 1 contagem por `user_key` por dia).
- Componente `ParaAEsposa` (`src/components/blog/ParaAEsposa.tsx`): callout "Para a sua esposa: no Vocação de Mãe, <título>" renderizado antes do "Continue lendo" quando `posts.body` tiver o nó `paraAEsposa {slug, title}` (preenchido pela rotina na Fase 8 via API pública do VDM — doc 00 §9.1 item 2); sem o nó, não renderiza. Registrar o nó em `tiptap-html.ts` já nesta fase para o render não quebrar.
- `head()`: `title` = `seo_title ?? title` + " | Vocação de Pai"; `description` = `seo_description ?? excerpt`; canonical; OG/Twitter com `cover_image_url`.
- Se `kind` ≠ `artigo`/`noticia`, renderizar também `ReviewBadge` (Fase 2 detalha).

### 6.3 `/categoria/$slug`
- Reutiliza `queryPostsByCategorySlug`. Cabeçalho com `name`, `description` e ícone (`icon`). 404 se slug inexistente.

### 6.4 `/busca`
- `SearchPage.tsx` passa a chamar `supabase.rpc("search_posts", { p_query: q, p_limit: 20, p_offset: off })` (assinatura do doc 02 §4.2; a função devolve também `category_slug`, `category_name` e `product_score`; substitui o `.ilike`/`textSearch` do VDM se houver). Estado vazio: "Nada encontrado para '…'. Tente outra palavra." + 6 sugestões de categorias.

### 6.5 RSS — novo `src/routes/rss[.]xml.ts`

```ts
import { createFileRoute } from "@tanstack/react-router";
import { createReadOnlySupabaseClient } from "@/lib/seo.functions";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/site";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const Route = createFileRoute("/rss.xml")({
  server: { handlers: { GET: async () => {
    const db = await createReadOnlySupabaseClient();
    const { data } = await db.from("posts").select("slug,title,excerpt,publish_at,cover_image_url")
      .eq("status", "published").lte("publish_at", new Date().toISOString())
      .order("publish_at", { ascending: false }).limit(30);
    const items = (data ?? []).map(p => `<item><title>${esc(p.title)}</title><link>${SITE_URL}/post/${p.slug}</link><guid>${SITE_URL}/post/${p.slug}</guid><pubDate>${new Date(p.publish_at!).toUTCString()}</pubDate><description>${esc(p.excerpt ?? "")}</description>${p.cover_image_url ? `<enclosure url="${esc(p.cover_image_url)}" type="image/jpeg"/>` : ""}</item>`).join("");
    const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(SITE_NAME)}</title><link>${SITE_URL}</link><description>${esc(SITE_DESCRIPTION)}</description><language>pt-BR</language>${items}</channel></rss>`;
    return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=1800" } });
  } } },
});
```

Adicionar `<link rel="alternate" type="application/rss+xml" href="/rss.xml">` no `__root.tsx`. Conferir a assinatura exata do handler server em `src/routes/sitemap[.]xml.ts` do VDM e copiar o mesmo padrão (a API do TanStack Start muda entre versões — o arquivo do VDM é a fonte da verdade).

### 6.6 Sitemap, JSON-LD, OG image
- `src/routes/sitemap[.]xml.ts`: `SITE_URL` do `site.ts`; `STATIC_PAGES` = `/`, `/blog`, `/sobre`, `/contato`, `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-afiliados` + categorias + posts publicados. **Sem** placeholders.
- JSON-LD em `PostPage`: `Article` (`headline`, `image`, `datePublished`, `dateModified`, `author{name}`, `publisher{name, logo}`, `mainEntityOfPage`) + `BreadcrumbList` (Início → Blog → Categoria → Post). Se houver `faq`, acrescentar `FAQPage`. Usar o helper já existente em `src/lib/seo.ts` (`articleJsonLd`/equivalente — confira o nome com `grep -n "export" src/lib/seo.ts`).
- OG padrão: criar `public/og-default.jpg` 1200×630 (fundo `#14505C`, wordmark branco, tagline em âmbar). Gerar com um script Node usando `sharp` (devDependency temporária) ou pedir ao dono. Por post, OG = `cover_image_url`.

**Aceite da Etapa 6:** `/blog` lista e pagina; `/post/<slug>` renderiza com semáforo, tabela, checklist, FAQ; `/categoria/<slug>` filtra; `/busca?q=churrasco` acha o post 7; `curl -s https://<preview>/rss.xml | head -3` é XML válido; `/sitemap.xml` lista home, 7 estáticas, 14 categorias e 10 posts; validador do Google (Rich Results Test) aceita `Article` e `BreadcrumbList`.

---

## 7. Páginas obrigatórias

| Rota | Arquivo | Conteúdo |
|---|---|---|
| `/sobre` | `src/pages/About.tsx` | **Manifesto do Vocação de Pai** (texto abaixo) + quem faz (Bruno Danello) + o grupo VDP (links para vocacaodemae.com.br, portaldaai.com.br, reviewprodutos.com.br). |
| `/contato` | `src/pages/Contact.tsx` | Formulário (nome, e-mail, assunto, mensagem) → edge function `notify-contact-message` (Resend → e-mail do dono). Trocar remetente/destinatário na função. |
| `/politica-de-privacidade` | `src/pages/PrivacyPolicy.tsx` | Adaptar do VDM: LGPD, cookies, GA4, AdSense, Supabase (dados em São Paulo), newsletter, direitos do titular, contato do DPO (e-mail do dono). |
| `/termos-de-uso` | `src/pages/TermsOfUse.tsx` | Adaptar do VDM: conteúdo informativo, não substitui médico/advogado/contador; comunidade (regras de convivência: respeito, sem vulgaridade, sem ataques); propriedade intelectual. |
| `/politica-de-afiliados` | novo `src/pages/AffiliatePolicy.tsx` + `src/routes/_site/politica-de-afiliados.tsx` | "Participamos do Programa de Associados da Amazon… Comissões não alteram o preço. Preços exibidos são faixas pesquisadas, não valores exatos. Recomendamos o que indicaríamos a um amigo." |

**Manifesto (texto base para `/sobre`; o dono ajusta):**

> Acreditamos que o homem foi feito para dar a vida pelos seus. Ser pai não é um papel que se desempenha: é uma vocação que se responde todos os dias, no trabalho, na mesa, no silêncio de quem segura a casa. O Vocação de Pai existe para formar esse homem: o marido que fica, o pai que educa, o provedor que planeja, o líder que serve. Falamos de fraldas e de churrasco, de orçamento e de oração, de treino e de carreira, porque tudo isso é a vida de um pai. Com informação direta, sem modismo e sem vergonha de dizer o que é certo. Somos a casa do pai e do homem de família no Brasil.

**Aceite da Etapa 7:** as 5 páginas renderizam, estão no footer e no sitemap; envio do contato chega no e-mail do dono (testar com assunto "teste fase 1").

---

## 8. Admin e editor Tiptap

Herdado: `src/admin/{AdminLayout,AdminDashboard,AdminEditor,AdminLogin,ImageSearchDialog}.tsx`, `src/routes/_admin/admin/index.tsx`, `src/routes/_admin/admin/editor/{index,$id}.tsx`, `src/routes/admin/login.tsx`, `src/lib/admin-meta.ts`, `src/lib/auth.ts`, `src/lib/auth-ui.tsx`, `src/lib/auth-context.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/lib/media.functions.ts` (upload para bucket `covers`), edge function `stock-photos`.

Passos:
1. `AdminLayout.tsx`: a guarda deve checar `profile.role in ('editor','admin')` (coluna `role` de `profiles`). Se não, redirecionar para `/admin/login` com mensagem "Acesso restrito à equipe".
2. `AdminEditor.tsx`: campos = title, slug (auto via `slugify.ts`, editável), excerpt, category (select das 14), kind (select: artigo/noticia/review/comparativo/lista — Fase 2 habilita os campos de review), cover (upload → `covers/` ou busca `ImageSearchDialog` Wikimedia/Pexels), body (Tiptap com StarterKit, Link, Image, Table, TaskList, Callout, FAQ/Quiz como no VDM), faq (lista título/resposta), quiz (opcional), seo_title, seo_description, status, publish_at. Botões: "Salvar rascunho", "Publicar", "Pré-visualizar" (abre `/post/<slug>?preview=1` — admin vê `draft` pela policy "admin lê tudo").
3. Inserir o botão de semáforo na toolbar: insere 3 callouts já com os prefixos "Sinal verde: ", "Sinal de atenção: ", "Sinal de alerta: ".
4. `AdminDashboard.tsx`: lista de posts (status, categoria, visualizações `view_count`), filtros, botão "Novo artigo"; cartão "Search Console" lendo `seo_search_stats` (vazio até a Fase 8 agendar a função).
5. Edge functions: ajustar `supabase/functions/stock-photos/index.ts` (segredos `PEXELS_API_KEY`, `PIXABAY_API_KEY` no Vault via `mcp__Supabase__create_edge_function_secret`) e `notify-contact-message` (`RESEND_API_KEY`, destinatário). Deploy com `mcp__Supabase__deploy_edge_function`. `seo-search-console` só deploy (agendamento na Fase 8).
6. Login: `/admin/login` com e-mail/senha (e Google se habilitado). Após login, o trigger cria `profiles`; promover o dono a `admin` (SQL da etapa 3.3).

**Aceite da Etapa 8:** dono entra em `/admin/login`, cria um post de teste com capa, semáforo, tabela e FAQ, publica, vê em `/post/<slug>`; usuário sem role `editor/admin` é barrado; `get_advisors security` sem erros.

---

## 9. Seed: 14 categorias e 10 posts iniciais

### 9.1 Categorias — `supabase/seed/0001_categories.sql` (aplicar via `mcp__Supabase__execute_sql`)

```sql
insert into public.categories (slug, name, description, icon, sort_order) values
('paternidade',               'Paternidade',                'Ser pai no dia a dia: presença, rotina, vínculo e exemplo.',                        'baby',            10),
('gravidez-e-recem-nascido',  'Gravidez e Recém-nascido',   'O pai na gestação, no parto e nos primeiros meses do bebê.',                        'heart',           20),
('educacao-dos-filhos',       'Educação dos Filhos',        'Limites, virtudes, escola, telas e disciplina com firmeza e amor.',                'graduation-cap',  30),
('casamento-e-familia',       'Casamento e Família',        'Marido presente, comunicação, liderança servidora e vida a dois com filhos.',       'heart-handshake', 40),
('fe-e-virtudes',             'Fé e Virtudes',              'Formação espiritual do homem, oração em família, santos pais, caráter.',           'church',          50),
('dinheiro-e-provisao',       'Dinheiro e Provisão',        'Orçamento, dívidas, reserva, investimentos e a missão de prover.',                 'wallet',          60),
('carreira-e-trabalho',       'Carreira e Trabalho',        'Crescer na profissão sem perder a família; vagas, negociação, propósito.',         'briefcase',       70),
('saude-do-homem',            'Saúde do Homem',             'Exames, prevenção, sono, saúde mental e longevidade para cuidar de quem depende.',  'heart-pulse',     80),
('forca-e-esporte',           'Força e Esporte',            'Treino, disposição, esporte com os filhos e corpo a serviço da família.',          'dumbbell',        90),
('churrasco-e-cozinha',       'Churrasco e Cozinha',        'Cortes de carne, fogo, receitas de pai e a mesa como lugar de encontro.',          'flame',           100),
('casa-carro-e-ferramentas',  'Casa, Carro e Ferramentas',  'Consertos, manutenção, segurança da casa e do carro, faça-você-mesmo.',            'wrench',          110),
('estilo-e-cuidados',         'Estilo e Cuidados',          'Vestir bem, barba, higiene e postura: a aparência que respeita quem está ao lado.', 'shirt',           120),
('lazer-e-aventura',          'Lazer e Aventura',           'Acampar, pescar, viajar, brincar: tempo de qualidade com os filhos.',              'tent',            130),
('pai-indica',                'Pai Indica',                 'Reviews, comparativos e listas do que vale o dinheiro do pai.',                    'badge-check',     140)
on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, sort_order = excluded.sort_order;
```

A coluna é `icon` (nome de ícone `lucide-react`), **não** `color` — `categories` do doc 02 §4.2 não tem cor; o chip deriva a cor da paleta. Observação: o `0002_blog.sql` do doc 02 já insere 10 categorias com `on conflict (slug) do nothing`; este seed atualiza as que coincidem e acrescenta as demais. As que só existem no 0002 (`financas-da-familia`, `noticias`) permanecem (`noticias` recebe os posts `kind='noticia'`); o seed nunca apaga nada (`CLAUDE.md` §4.2).

### 9.2 Os 10 posts iniciais

Antes de inserir, criar o autor **"Equipe Vocação de Pai"** (o mesmo que a rotina da Fase 8 usa — doc 10 §3 item 8 e doc 12 §0.1 dizem "criado na Fase 1"): no Supabase Auth (Dashboard › Authentication › Users › Add user) criar o usuário `contato@vocacaodepai.com.br` com senha forte guardada pelo dono e "Auto Confirm User" marcado; o trigger `handle_new_user` cria a linha em `profiles`. Depois, via `mcp__Supabase__execute_sql`:

```sql
update public.profiles set display_name = 'Equipe Vocação de Pai', role = 'editor'
where id = (select id from auth.users where email = 'contato@vocacaodepai.com.br');
select id as author_uuid from auth.users where email = 'contato@vocacaodepai.com.br';  -- <AUTHOR_UUID>
```

Registrar o `<AUTHOR_UUID>` em `docs/plano/PROGRESSO.md` → "Decisões tomadas durante a execução" (a Fase 8 lê de lá). Todos os 10 posts: `kind = 'artigo'`, `status = 'published'`, `publish_at` escalonado (1 por dia a partir da data do deploy, para o feed não nascer "tudo no mesmo dia"), **`author_id = <AUTHOR_UUID>`** (o dono pode assinar artigos próprios com o id dele, mas o seed usa a equipe). Capas: Pexels/Pixabay via `stock-photos` (homem/pai/família tradicional; nunca casal do mesmo sexo), 1200×630, salvas em `covers/`.

| # | Título | Slug | Categoria | Resumo (excerpt) |
|---|---|---|---|---|
| 1 | Vai ser pai: o guia do primeiro trimestre para o homem | `vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem` | gravidez-e-recem-nascido | Ela está grávida e você não sabe por onde começar. O que muda, o que fazer nas consultas e como apoiar sua esposa nas primeiras 13 semanas. |
| 2 | Como segurar um recém-nascido com segurança (e sem medo) | `como-segurar-um-recem-nascido-com-seguranca` | gravidez-e-recem-nascido | As 4 pegadas que todo pai precisa dominar, os erros mais comuns e o que fazer quando o bebê chora no seu colo. Passo a passo com checklist. |
| 3 | Rotina do pai nos primeiros 30 dias do bebê | `rotina-do-pai-nos-primeiros-30-dias-do-bebe` | paternidade | Divisão de tarefas, noites, visitas e o seu papel enquanto a mãe se recupera. Um plano semana a semana para o pai não virar espectador. |
| 4 | Como dar limites sem gritar: autoridade com calma | `como-dar-limites-sem-gritar-autoridade-com-calma` | educacao-dos-filhos | Limite firme não é grito. Veja o método de 3 passos para corrigir, as frases que funcionam por idade e o que fazer quando você perde a paciência. |
| 5 | Orçamento familiar para quem vai ser pai: passo a passo | `orcamento-familiar-para-quem-vai-ser-pai` | dinheiro-e-provisao | Quanto custa o primeiro ano de um filho no Brasil, como montar o orçamento da casa em 5 categorias e onde cortar sem sofrer. Com tabela e checklist. |
| 6 | Exames que todo homem deve fazer a partir dos 30 anos | `exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos` | saude-do-homem | Pressão, glicemia, colesterol, próstata, saúde mental: a lista por faixa etária e por que quem tem filho não pode adiar o check-up. |
| 7 | Cortes de carne para churrasco: guia do pai iniciante | `cortes-de-carne-para-churrasco-guia-do-pai-iniciante` | churrasco-e-cozinha | Picanha, fraldinha, costela, maminha: o que escolher, quanto comprar por pessoa, como preparar o fogo e os erros que arruínam a carne. |
| 8 | Treino de 20 minutos em casa para pais sem tempo | `treino-de-20-minutos-em-casa-para-pais-sem-tempo` | forca-e-esporte | Sem academia, sem equipamento, antes das crianças acordarem. Um plano de 4 semanas com progressão e tabela de exercícios. |
| 9 | Como ser um marido presente depois que o bebê chega | `como-ser-um-marido-presente-depois-que-o-bebe-chega` | casamento-e-familia | O casamento muda quando o filho nasce. Como cuidar da esposa, manter a intimidade, dividir a carga e liderar a casa com serviço. |
| 10 | Kit básico de ferramentas para a casa: o que todo pai precisa ter | `kit-basico-de-ferramentas-para-a-casa` | casa-carro-e-ferramentas | As 15 ferramentas essenciais, o que comprar primeiro, faixa de preço de cada uma e os 10 consertos que você passa a resolver sozinho. |

### 9.3 "Padrão A do Pai" — estrutura obrigatória do `body` (Tiptap JSON)

A estrutura é a do **`CLAUDE.md` §6, item por item** — é a regra obrigatória do projeto, e o `scripts/validate-content.mjs` (§9.5) reprova o que fugir dela. Resumo operacional, na ordem dos blocos:

1. **Abertura** — 1-2 parágrafos sem heading: a dor/dúvida do pai ("Você acabou de saber que…") + o que o artigo resolve; o 2º já traz 1 link interno.
2. **Seções `heading` nível 2** em frase ou pergunta ("O que muda no corpo dela e na sua rotina", "Quanto custa, de verdade?"); cada uma com 1-2 parágrafos curtos ou `bulletList` + 1 parágrafo com link. Tom direto, segunda pessoa ("você"), sem rodeio.
3. **Semáforo do pai** (obrigatório quando há risco, sintoma, decisão ou "quando procurar ajuda"; recomendado sempre): `heading` nível 2 "Semáforo do pai: <tema>" + **exatamente 3** nós `callout`, nesta ordem e com os prefixos literais: `tone: "ok"` → `"Sinal verde: "`; `tone: "warn"` → `"Sinal de atenção: "`; `tone: "bad"` → `"Sinal de alerta: "`, terminando com a orientação de procurar ajuda profissional (médico, padre, advogado, contador…). Sem link dentro dos callouts; sem 4º callout.
4. **Links internos contextuais — mínimo 10 por artigo**, tecidos nas frases: `marks: [{type:"link", attrs:{href:"/post/<slug>", class:null, rel:null, target:null}}]`, apontando para `/post/<slug>` (ou `/pai-indica/<slug>`, `/loja/<slug>`, `/ferramentas/<slug>`) que **existem no banco** — na Fase 1, só os 10 slugs da tabela §9.2 (conferir com `select slug from posts where status='published'`); nunca inventar. Os links do "Continue lendo" contam, mas sozinhos não bastam.
5. **Tabela** (`table`/`tableRow`/`tableHeader`/`tableCell`, 3-6 linhas) com colunas próprias do tema (comparação, custo, cronograma), sob heading nível 2. Obrigatória.
6. **Checklist** (`taskList`/`taskItem`, `checked: false`) sob heading "Checklist do pai: <tema>", **5-6 itens** curtos sem ponto final; o último é "Ficar atento aos sinais do semáforo acima". Obrigatória.
7. **Imagem inline opcional** (0, 1 ou mais): `image` com `attrs: {src, alt, title: null}`, nunca a capa (comparar a URL sem query string), sempre coerente com a seção, com `alt` descritivo em PT-BR.
8. **Fechamento** — 1 parágrafo firme e encorajador **sem links**; depois **1 parágrafo** que começa com `"Continue lendo: "` e traz **4-10 links** (texto de cada link = título do post, separados por `", "`, o último com `" e "`, terminando em `"."`). **Não** é heading nem `bulletList`.
9. **`faq`** (coluna, não no body): **3-6** itens `{question, answer}` na linguagem do pai ("Posso…?", "E se…?"); **e/ou `quiz`** (coluna): 3-5 itens `{question, options[], correct, explanation}`. Pelo menos um dos dois; nos 10 posts seed, os dois.
10. **Metadados**: `excerpt` ≤ 160 caracteres; `seo_title` ≤ 60; `seo_description` 120-155; `reading_time` = palavras/200 (o trigger `posts_search_content` calcula se vier nulo); `category_id` válido; `cover_image_url`; `search_content` (preenchido pelo trigger).
11. **Tamanho: 1.200-2.200 palavras** (6-11 min de leitura).
12. Linha editorial (`CLAUDE.md` §3): família tradicional (pai e mãe), fé com naturalidade, nada de vulgaridade nem de machismo tóxico; o homem como pai, marido, provedor e líder que serve. Sem conselho médico/jurídico/financeiro prescritivo: o "Sinal de alerta" manda procurar o profissional.

Esqueleto mínimo de `body`:

```json
{"type":"doc","content":[
 {"type":"paragraph","content":[{"type":"text","text":"…abertura 1…"}]},
 {"type":"paragraph","content":[{"type":"text","text":"Neste guia você vai ver "},{"type":"text","marks":[{"type":"link","attrs":{"href":"/post/rotina-do-pai-nos-primeiros-30-dias-do-bebe","class":null,"rel":null,"target":null}}],"text":"como organizar os primeiros 30 dias"},{"type":"text","text":"…"}]},
 {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"O que muda nas primeiras semanas"}]},
 {"type":"paragraph","content":[{"type":"text","text":"…"}]},
 {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Semáforo do pai: quando agir"}]},
 {"type":"callout","attrs":{"tone":"ok"},"content":[{"type":"paragraph","content":[{"type":"text","text":"Sinal verde: …"}]}]},
 {"type":"callout","attrs":{"tone":"warn"},"content":[{"type":"paragraph","content":[{"type":"text","text":"Sinal de atenção: …"}]}]},
 {"type":"callout","attrs":{"tone":"bad"},"content":[{"type":"paragraph","content":[{"type":"text","text":"Sinal de alerta: … Procure o pediatra / o médico / um advogado."}]}]},
 {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Quanto custa, de verdade?"}]},
 {"type":"table","content":[{"type":"tableRow","content":[{"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Item"}]}]},{"type":"tableHeader","content":[{"type":"paragraph","content":[{"type":"text","text":"Faixa de preço"}]}]}]}]},
 {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"Checklist do pai: primeiras semanas"}]},
 {"type":"taskList","content":[
   {"type":"taskItem","attrs":{"checked":false},"content":[{"type":"paragraph","content":[{"type":"text","text":"…"}]}]},
   {"type":"taskItem","attrs":{"checked":false},"content":[{"type":"paragraph","content":[{"type":"text","text":"Ficar atento aos sinais do semáforo acima"}]}]}
 ]},
 {"type":"paragraph","content":[{"type":"text","text":"…fechamento firme e encorajador, sem links…"}]},
 {"type":"paragraph","content":[
   {"type":"text","text":"Continue lendo: "},
   {"type":"text","marks":[{"type":"link","attrs":{"href":"/post/<slug-a>","class":null,"rel":null,"target":null}}],"text":"Título do post A"},
   {"type":"text","text":", "},
   {"type":"text","marks":[{"type":"link","attrs":{"href":"/post/<slug-b>","class":null,"rel":null,"target":null}}],"text":"Título do post B"},
   {"type":"text","text":" e "},
   {"type":"text","marks":[{"type":"link","attrs":{"href":"/post/<slug-c>","class":null,"rel":null,"target":null}}],"text":"Título do post C"},
   {"type":"text","text":"."}
 ]}
]}
```

Confirmar os nomes exatos dos nós (`callout`, `taskList`, `faq`, `quiz`) em `/home/user/vocacaodemae/src/lib/tiptap-html.ts` e `src/components/blog/dataNodes.ts` antes de gerar; o render do site é a fonte da verdade.

### 9.4 Como inserir os 10 posts

Escrever cada post como `supabase/seed/posts/<slug>.json` (campos: title, slug, excerpt, category_slug, cover_image_url, body, faq, quiz, seo_title, seo_description, publish_at). Script `scripts/seed-posts.mjs` (Node 22, usa `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` **do ambiente local, nunca commitados**) faz `upsert` por `slug` resolvendo `category_id` e `author_id`. Alternativa sem script: `mcp__Supabase__execute_sql` com `insert ... select` por post. Após inserir, rodar o validador:

```sql
-- validação Padrão A do Pai
select slug,
  (select count(*) from jsonb_path_query(body, '$.**.marks[*] ? (@.type == "link")')) as links,
  (select count(*) from jsonb_path_query(body, '$.content[*] ? (@.type == "callout")')) as callouts,
  (select count(*) from jsonb_path_query(body, '$.content[*] ? (@.type == "table")')) as tabelas,
  (select count(*) from jsonb_path_query(body, '$.content[*] ? (@.type == "taskList")')) as checklists,
  jsonb_array_length(coalesce(faq,'[]'::jsonb)) as faq,
  jsonb_array_length(coalesce(quiz,'[]'::jsonb)) as quiz,
  reading_time, author_id
from public.posts order by publish_at;
-- aceite (CLAUDE.md §6): links >= 10, callouts = 3 (quando houver semáforo), tabelas >= 1, checklists >= 1,
-- faq entre 3 e 6 (ou quiz entre 3 e 5), reading_time entre 6 e 11 (1.200-2.200 palavras), author_id = <AUTHOR_UUID>
```

Depois do SQL, rodar `node scripts/validate-content.mjs --all` (§9.5): deve sair com código 0.

### 9.5 `scripts/validate-content.mjs` (checklist 1.18 do doc 13)

O `CLAUDE.md` §4.1 exige `node scripts/validate-content.mjs` verde antes de **todo** push desde a Fase 1; por isso o arquivo nasce aqui. A Fase 2 (doc 04 §11) e a Fase 8 (doc 10 §5) **estendem este mesmo arquivo** com as regras de Pai Indica e de produtos — não criam outro.

- Node 22, sem dependências (só `fetch` e `node:fs`). Lê os posts publicados pela REST anon do Supabase: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (nomes do `CLAUDE.md` §13; aceitar também `VITE_SUPABASE_PUBLISHABLE_KEY`, nome usado no doc 02 §8), com fallback para a URL e a chave lidas de `src/integrations/supabase/client.ts`.
- Uso: `node scripts/validate-content.mjs [--all | --since 7d | --slug a,b]` (default `--since 7d`). Sai com código 1 se qualquer regra falhar, imprimindo `slug: regra` por falha; 0 se tudo passar.
- Regras da Fase 1 (`CLAUDE.md` §4.3 e §6), para `kind='artigo'` e `kind='noticia'`:
  1. `artigo`: se houver `callout`, exatamente 3, na ordem `ok`/`warn`/`bad`, com os prefixos "Sinal verde: ", "Sinal de atenção: ", "Sinal de alerta: " e sem `link` dentro; `noticia`: callout proibido.
  2. Links internos distintos (`href` começando com `/`): ≥ 10 em `artigo`, ≥ 5 em `noticia`; todo `/post/<slug>` existe como post publicado; `/pai-indica/`, `/loja/`, `/ferramentas/`, `/formacao/` são aceitos na Fase 1 só pelo prefixo (as Fases 2-4 trocam por checagem real quando as tabelas tiverem dados).
  3. `cover_image_url` obrigatória, única entre os posts publicados e diferente de toda `image` inline (comparar sem query string).
  4. Termos proibidos ausentes em `title`, `excerpt`, texto do `body` e `faq`: lista única em `scripts/rotina/proibidos.json` (criar a pasta e o arquivo agora com a lista do doc 10 §5.3; a Fase 8 reaproveita).
  5. `artigo`: ≥ 1 `table`; ≥ 1 `taskList` com 5-6 itens cujo último é "Ficar atento aos sinais do semáforo acima"; último parágrafo começa com "Continue lendo: " e tem 4-10 links; 1.200-2.200 palavras. `noticia`: dispensa tabela, checklist e semáforo.
  6. `faq` com 3-6 `{question, answer}` não vazios **ou** `quiz` com 3-5 itens; `excerpt` ≤ 160; `seo_title` ≤ 60; `seo_description` 120-155; `reading_time > 0`; `status='published'` com `publish_at ≤ now()`.
  7. Nenhum "R$" seguido de dígito em `body`, `excerpt` e `faq` (preço exato é proibido; faixas são escritas pelos componentes a partir de `price_min`/`price_max`).
- Esqueleto: partir do doc 10 §5.2 (funções `walk`, `textOf`, `linksOf`, `base`, `exists`), deixando as regras de `review`/`comparativo`/`lista` e `--products` para as Fases 2 e 8.
- `package.json`: `"validate:content": "node scripts/validate-content.mjs"`. O `README.md` cita o comando.

**Aceite da §9.5:** `node scripts/validate-content.mjs --all` sai com 0 nos 10 posts seed; publicar de propósito um post de teste com 2 callouts ou com `/post/slug-inexistente` faz o script sair com 1 apontando o slug e a regra (depois marcar o post de teste como `archived` pelo admin — nunca `DELETE`).

**Aceite da Etapa 9:** 14 categorias; autor "Equipe Vocação de Pai" criado e `<AUTHOR_UUID>` registrado em `PROGRESSO.md`; 10 posts publicados com esse `author_id`, passando no SQL de validação e em `node scripts/validate-content.mjs --all` (código 0); todos os `href` internos resolvem (sem 404) — checar com `grep -o '"/post/[^"]*"' supabase/seed/posts/*.json | sort -u` contra os slugs.

---

## 10. Deploy e medição

1. **Deploy**: o dono mescla o PR `Fase 1 — Fundação` em `main` (item 7) → Vercel faz build. Conferir `mcp__Vercel__list_deployments` (estado `READY`) e abrir `https://vocacaodepai.com.br`. Em erro, `mcp__Vercel__get_deployment` + `list_deployment_events`.
2. **Vercel Analytics**: dashboard → Analytics → Enable. Adicionar `@vercel/analytics` (`npm i @vercel/analytics`) e `<Analytics />` no `__root.tsx`.
3. **GA4**: criar propriedade "Vocação de Pai" (fluxo web `vocacaodepai.com.br`); colocar o `G-XXXX` em `src/lib/ga4.ts` (`GA_MEASUREMENT_ID`). Consentimento via `CookieConsent` com Consent Mode v2 (§4.6): GA4 só carrega após aceite analítico.
4. **Search Console**: adicionar propriedade de domínio `vocacaodepai.com.br` (registro TXT no DNS); enviar `https://vocacaodepai.com.br/sitemap.xml`. Dar permissão de leitura à conta de serviço do Painel Lisieux (mesma usada em `GOOGLE_SA_JSON` do grupovdp) e à usada pela edge `seo-search-console`.
5. **AdSense**: `public/ads.txt` com `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` (publisher do grupo; se o site ainda não foi aprovado, deixar o arquivo com o pub id do grupo mesmo assim — é o placeholder). `src/lib/adsense.ts`: `ADSENSE_PUBLISHER_ID` = pub do grupo; `AdSlot` renderiza só quando houver `data-ad-slot` configurado. Pedir revisão do AdSense só depois dos 10 posts + páginas institucionais no ar.
6. **Painel Lisieux** (`/home/user/grupovdp/scripts/refresh-sites.mjs`): adicionar ao array `SITES`:

```js
{ key: "vocacaodepai", label: "Vocação de Pai", domain: "vocacaodepai.com.br", ga4Env: "GA4_PROPERTY_VOCACAODEPAI" },
```

   e criar o secret `GA4_PROPERTY_VOCACAODEPAI` (id numérico da propriedade GA4) no repositório do grupovdp. Abrir PR no grupovdp (branch `claude/add-vocacaodepai`).
7. **PR da fase**: rodar `npm run build && npm run lint && node scripts/validate-content.mjs` (os três verdes), abrir o PR `Fase 1 — Fundação` contra `main` (corpo curto: feito / como validar / pendências) e **avisar o dono, que mescla**. Até a Fase 8 não existe auto-merge (`auto-merge.yml` entra no doc 10 §10.1); conferir que o arquivo **não** está em `.github/workflows/`.

**Aceite da Etapa 10:** site responde em `https://vocacaodepai.com.br` com HTTPS; Search Console mostra sitemap "Sucesso"; GA4 em tempo real registra uma visita; `curl -s https://vocacaodepai.com.br/ads.txt` retorna a linha do pub; PR no grupovdp aberto com o site na lista.

---

## 11. Critérios de aceite da Fase 1 (consolidado)

- [ ] `npm run build` e `npm run lint` sem erros; `npx tsc --noEmit` limpo; `node scripts/validate-content.mjs --all` com código 0.
- [ ] Nenhum vestígio: `grep -rn "lovable\|i18next\|vocacaodemae\|<REF_SUPABASE_DO_VOCACAODEMAE>\|Vocação de Mãe" src public` vazio (exceto o wrapper `@lovable.dev/vite-tanstack-config`).
- [ ] Supabase `vocacaodepai` (sa-east-1) com as 7 migrations `0001_core` a `0007_ferramentas` copiadas do doc 02 §4 (39 tabelas); `get_advisors security` sem erro; RLS ativa em todas as tabelas.
- [ ] Tokens aplicados (areia/petróleo/âmbar; Barlow Condensed + Inter; dark `#14181C`/`#1F2429`).
- [ ] Header com Blog, Pai Indica, Loja do Pai, Ferramentas, Pai Indica Pai, Irmandade, Formação, Sobre, Contato; busca; conta; menu mobile.
- [ ] Home com as 9 seções; placeholders `noindex` para seções futuras.
- [ ] Blog completo: `/blog`, `/post/$slug`, `/categoria/$slug`, `/busca`, `/rss.xml`, `/sitemap.xml`, JSON-LD Article + BreadcrumbList (+ FAQPage), OG por post e `og-default.jpg`.
- [ ] 5 páginas institucionais, contato enviando e-mail.
- [ ] Admin com login, guarda `is_admin()`, editor Tiptap com semáforo/tabela/checklist/FAQ/quiz, upload de capa.
- [ ] 14 categorias + 10 posts "Padrão A do Pai" validados (≥10 links, 3 callouts, tabela, checklist 5-6 itens, "Continue lendo: " em parágrafo com 4-10 links, FAQ 3-6, 1.200-2.200 palavras), autor "Equipe Vocação de Pai" (`<AUTHOR_UUID>` em `PROGRESSO.md`).
- [ ] Conformidade da base (§4.6): `CookieConsent` com Consent Mode v2 e "Rejeitar não necessários", `ContentNotice`, newsletter com double opt-in, Turnstile + rate limit em `/api/newsletter` e `/contato`, `src/lib/ads/no-ads-routes.ts`.
- [ ] Casal de sites: bloco "Para a sua esposa: Vocação de Mãe" no rodapé, componente `ParaAEsposa` em `/post/$slug`, caixa da esposa no `NewsletterSignup`.
- [ ] PR `Fase 1 — Fundação` aberto contra `main` e mesclado **pelo dono** (sem `auto-merge.yml`).
- [ ] Deploy na Vercel (time "Portal da AI") em `vocacaodepai.com.br`; GA4, Vercel Analytics, Search Console, `ads.txt`; site no `SITES` do Painel Lisieux.
- [ ] `CLAUDE.md` com o ref real; `docs/plano/PROGRESSO.md` atualizado.
- [ ] Lighthouse mobile na home e num post: Performance ≥ 85, A11y 100, SEO 100.

---

## 12. Prompt para iniciar esta fase no Sonnet

Colar literalmente no Claude Code, dentro de `/home/user/vocacaodepai`:

```text
Você vai executar a FASE 1 (Fundação) do projeto Vocação de Pai. Leia, nesta ordem e por inteiro, antes de qualquer ação:
1. /home/user/vocacaodepai/CLAUDE.md
2. /home/user/vocacaodepai/docs/plano/02-arquitetura-e-stack.md (se existir, ele prevalece em conflitos)
3. /home/user/vocacaodepai/docs/plano/03-fase-1-fundacao.md
4. /home/user/vocacaodemae/CLAUDE.md (apenas como referência da base que vamos adaptar)

Regras desta sessão:
- Siga o documento 03 etapa por etapa (1 → 10). Não pule etapas, não "melhore" o escopo, não rediscuta decisões marcadas como fixas.
- Antes de citar ou copiar um arquivo do /home/user/vocacaodemae, confira que ele existe com ls. Se um caminho do plano não existir, procure o equivalente com grep e registre a diferença em docs/plano/PROGRESSO.md.
- Trabalhe em branches claude/fase-1-<etapa>, commits pequenos, PR por etapa com título "Fase 1 — <etapas>". Até a Fase 8 o dono mescla: não copie nem ligue o auto-merge.yml. Antes de todo push: npm run build && npm run lint && node scripts/validate-content.mjs (o validador nasce na etapa 9.5). Nunca git push --force, nunca commitar segredos (.env, service role).
- Migrations: copie o SQL literalmente do doc 02 §4.1 a §4.7 (0001 a 0007) e aplique as sete nesta fase; não escreva SQL próprio. O front chama increment_post_views(p_post_id, p_user_key) e search_posts(p_query, p_limit, p_offset), e categories tem icon, não color.
- Segredos: service role só em GitHub Secret ou Supabase Vault. No código cliente só a URL e a publishable key do projeto novo.
- Use as ferramentas MCP do Supabase (apply_migration, execute_sql, generate_typescript_types, get_advisors, deploy_edge_function) e da Vercel quando o plano indicar. Se precisar de uma ação que só o dono pode fazer (criar conta, DNS, OAuth), pare, descreva exatamente o que ele deve fazer e continue pelo que não depende disso.
- Ao terminar cada etapa, rode o critério de aceite da etapa e escreva uma linha em docs/plano/PROGRESSO.md: data, etapa, status (ok/pendente/bloqueado), PR.
- Linha editorial obrigatória em qualquer texto, imagem ou seed: família tradicional (pai e mãe), tom direto e respeitoso, PT-BR, sem vulgaridade, sem machismo tóxico; nunca conteúdo ou imagens LGBTQI.
- Textos literais fixos: semáforo "Sinal verde: ", "Sinal de atenção: ", "Sinal de alerta: "; botão "Comprar agora na Amazon"; slogan da loja "O pai também quer desconto".

Comece agora pela Etapa 1 (Preparação). Antes de começar a Etapa 2, me mostre: o ref do projeto Supabase criado, a URL do projeto Vercel e o diff do CLAUDE.md com o ref preenchido. Depois siga sem parar até a Etapa 10, parando apenas em bloqueios reais. Ao final, responda com o checklist da seção 13 preenchido.
```

---

## 13. Checklist de pronto (marcar ao final)

```text
[ ] 1. Supabase vocacaodepai (sa-east-1) ativo; ref registrado no CLAUDE.md, .mcp.json, config.toml, client.ts
[ ] 1. Vercel no time "Portal da AI" com SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SITE_URL, RESEND_API_KEY; domínio vocacaodepai.com.br
[ ] 1. GitHub: Actions read/write; secrets SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL, SUPABASE_PROJECT_REF
[ ] 2. Código copiado do VDM; Lovable/MCP, i18n e maternidade removidos; build verde
[ ] 3. 0001_core.sql a 0007_ferramentas.sql (cópia literal do doc 02 §4) aplicadas, 39 tabelas em public; types.ts gerado; dono promovido a admin
[ ] 4. Tokens (cores/fontes), Header 7 seções + Sobre/Contato, Footer 4 colunas (com "Para a sua esposa: Vocação de Mãe" e "Gerenciar cookies"), menu mobile, dark mode
[ ] 4. §4.6: CookieConsent + Consent Mode v2 ("Rejeitar não necessários"), ContentNotice, newsletter double opt-in (+ caixa da esposa), Turnstile + rate limit em /api/newsletter e /contato, src/lib/ads/no-ads-routes.ts
[ ] 5. Home: hero, últimos (mix de categorias), Pai Indica, Caixa de Ferramentas, categorias, CTA Área do Pai, newsletter, Loja do Pai, mais lidos
[ ] 5. Placeholders noindex: /pai-indica /loja /ferramentas /area-do-pai /pai-indica-pai /irmandade /formacao; /entrar → /admin/login
[ ] 6. /blog /post/$slug (increment_post_views, ContentNotice, ParaAEsposa) /categoria/$slug /busca (search_posts p_query/p_limit/p_offset) /rss.xml /sitemap.xml; JSON-LD Article+BreadcrumbList(+FAQPage); og-default.jpg
[ ] 7. /sobre (manifesto) /contato (Resend) /politica-de-privacidade /termos-de-uso /politica-de-afiliados
[ ] 8. /admin/login; guarda is_admin(); editor Tiptap com semáforo, tabela, checklist, FAQ, quiz, capa; edge functions deployadas
[ ] 9. 14 categorias (coluna icon); autor "Equipe Vocação de Pai" (<AUTHOR_UUID> em PROGRESSO.md); 10 posts Padrão A do Pai (CLAUDE.md §6) validados pelo SQL de aceite e por scripts/validate-content.mjs --all; capas sem repetição no texto
[ ] 10. PR "Fase 1 — Fundação" aberto e mesclado pelo dono (sem auto-merge.yml); deploy READY em vocacaodepai.com.br; GA4; Vercel Analytics; Search Console com sitemap; ads.txt; PR no grupovdp (SITES)
[ ] 11. Lighthouse mobile home e post: Perf ≥ 85, A11y 100, SEO 100
[ ] 11. docs/plano/PROGRESSO.md atualizado; próxima fase: docs/plano/04-fase-2-pai-indica-reviews.md
```

---

## Apêndice A — Mapa rápido VDM → VDP (para consulta durante a execução)

| No Vocação de Mãe | No Vocação de Pai |
|---|---|
| `SITE_NAME "Vocação de Mãe"`, autora Andressa Danello | "Vocação de Pai", autor Bruno Danello |
| Fraunces / Nunito Sans | Barlow Condensed / Inter |
| Rosa `348 58% 62%` / lilás | Petróleo `190 64% 22%` / âmbar `30 70% 51%` |
| "Sinal tranquilizador: " | "Sinal verde: " |
| Categoria "Review de Mãe" (`review-de-mae`) | Categoria "Pai Indica" (`pai-indica`) + `posts.kind` |
| Loja "A mãe quer desconto!" | Loja do Pai — "O pai também quer desconto" (Fase 3) |
| `profiles.full_name` | `profiles.display_name` |
| Histórias (`/historias`) | Irmandade (`/irmandade`, `/historias`) — Fase 7 |
| Ferramentas de gestação/enxoval/vacinas | Caixa de Ferramentas: conversor de moedas, mercado financeiro — Fase 4 |
| `minha-conta` | Área do Pai (`/area-do-pai`, `/minha-conta`, `/entrar`, `/cadastro`) — Fase 5 |
| `scripts/rotina/*` (Padrão A/B automáticos) | Rotina do Pai — Fase 8 |

## Apêndice B — Comandos de verificação rápida

```bash
cd /home/user/vocacaodepai
npx tsc --noEmit && npm run lint && npm run build && node scripts/validate-content.mjs --all
ls .github/workflows   # NÃO deve listar auto-merge.yml antes da Fase 8
grep -rn "lovable\|i18next\|vocacaodemae\|<REF_SUPABASE_DO_VOCACAODEMAE>\|Vocação de Mãe\|Sinal tranquilizador" src public | grep -v vite-tanstack-config
ls src/routes/_site   # deve conter: index blog busca contato sobre politica-de-privacidade termos-de-uso politica-de-afiliados post categoria pai-indica loja ferramentas area-do-pai pai-indica-pai irmandade formacao entrar
curl -s -o /dev/null -w "%{http_code}\n" https://vocacaodepai.com.br/sitemap.xml
curl -s https://vocacaodepai.com.br/rss.xml | head -c 200
```
