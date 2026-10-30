# Progresso — Fase 1, Etapa 8 (Admin e editor Tiptap)

> Registro da sessão `claude/fase-1-etapa-8-admin` (2026-10-30). Para fundir em
> `docs/plano/PROGRESSO.md` ("Decisões tomadas durante a execução" e "Pendências do dono")
> e marcar a caixa 1.17 em `docs/plano/13-checklist-de-execucao.md` na consolidação da fase.

## Entregue

| Item (doc 03 §8) | Arquivo | Estado |
|---|---|---|
| `/admin/login` e-mail/senha (Supabase Auth), mensagens claras, "Esqueci minha senha", recusa conta sem papel ("Acesso restrito à equipe") | `src/admin/AdminLogin.tsx`, `src/routes/admin/login.tsx` | pronto |
| Guarda de rota `/_admin/*`: `rpc('is_admin')` + `profiles.role in ('editor','admin')`; anônimo → `/admin/login`; sem papel → tela "Acesso restrito à equipe" com "Sair" | `src/admin/AdminLayout.tsx`, `src/routes/_admin.tsx` | pronto |
| Dashboard: cartões (publicados, views, Search Console via `seo_search_stats`), lista de posts com status + `kind`, filtros por status/tipo/busca, despublicar/arquivar, abas Comentários (aprovar/rejeitar), Assinantes (`newsletter_subscribers`, CSV) e Mensagens (`contact_messages`) | `src/admin/AdminDashboard.tsx` | pronto |
| Editor Tiptap: título, subtítulo (contador 50-220), slug, categoria-mãe + subcategorias (`optgroup` por `parent_id`), `kind`, excerpt (≤160), `seo_title` (≤60), `seo_description` (120-155), capa (upload → bucket `covers` + `cover_image_alt` + `ImageSearchDialog`), corpo com botões Semáforo do Pai (3 callouts com prefixos), tabela, checklist ("Checklist do pai: …", último item fixo), imagem no corpo (bloqueia a capa), link externo, link interno (busca de slug publicado), "Continue lendo" (4-10 posts no formato do Padrão A), FAQ e quiz com UI própria, status/`publish_at`, Salvar rascunho / Agendar / Publicar / Pré-visualizar (`/post/<slug>?preview=1`); upsert em `posts` | `src/admin/AdminEditor.tsx`, `src/admin/admin-db.ts` | pronto |
| Pai Indica (`review`/`comparativo`/`lista`): `product_category`, `product_subcategory`, `product_score` e textarea JSON de `review`/`comparison` validado (objeto JSON; obrigatório conforme o `kind`) | `src/admin/AdminEditor.tsx` | pronto (formulário guiado na Fase 2, item 2.8) |
| "Validar Padrão A" no cliente: semáforo (ordem, prefixos, sem link, alerta com "procure um profissional", heading antes), ≥10 links internos (slugs publicados), tabela, checklist (5-6 itens, último fixo, sem ponto), fechamento + "Continue lendo" (4-10, ", " / " e ", "."), FAQ/quiz, palavras por `kind`, capa repetida no corpo, "R$", metadados | `src/admin/padrao-a.ts` | pronto |
| Edge functions revisadas para o projeto novo | `supabase/functions/{stock-photos,notify-contact-message,seo-search-console}/index.ts` | prontas, **sem deploy** (ver pendências) |

## Decisões tomadas durante a execução

- `src/admin/admin-db.ts` (novo) concentra o acesso a dados do painel com tipos locais e cliente sem o
  `Database` gerado: `src/integrations/supabase/types.ts` ainda é o herdado do VDM (cita `seo_meta_title`,
  `full_name`, `get_my_profile`…) e será regenerado na consolidação da Fase 1. Quando o `types.ts` real
  existir, trocar os casts por tipos gerados é opcional.
- Guarda de admin = `public.is_admin()` **e** leitura do próprio `profiles` (para nome/papel na barra). Sem
  as RPCs do VDM (`get_my_profile`, `ensure_profile`, `is_staff`, `admin_list_comments`), que não existem no
  doc 02: tudo é `select` direto com RLS.
- **Sem autosave** no editor (o VDM salvava rascunho a cada 4 s): com um artigo publicado aberto, o autosave
  o despublicaria. Substituído por aviso `beforeunload` e por confirmação ao "Salvar rascunho" de um post
  publicado. "Publicar agora" em post já publicado mantém o `publish_at` original ("Republicar").
- Dashboard **não apaga** posts (CLAUDE.md §4.2: nunca `DELETE`): "Despublicar" volta a `draft`; "Arquivar"
  põe `archived`. `comments`/`contact_messages` também sem exclusão.
- Upload de capa e de imagem do corpo vai **direto do navegador** para o bucket público `covers`
  (policy "covers: staff write" com `is_admin()`), caminho `<aaaa-mm-dd>/<slug>-<id>.webp`, gravando a URL
  pública. `src/lib/media.functions.ts` (server fn herdada, usada pelo `ImageSearchDialog`) foi ajustada no
  mínimo: `is_staff` → `is_admin`, bucket `post-images` → `covers`, retorno da URL pública. A rota herdada
  `src/routes/api/img/$.ts` (bucket privado do VDM) ficou intocada — fora do escopo desta etapa; pode ser
  removida na consolidação.
- `src/lib/auth-ui.tsx`: perfil do site lido de `profiles (display_name → full_name)` em vez da RPC
  `get_my_profile`; login com Google desligado (`GOOGLE_LOGIN_ENABLED = false`) até o dono configurar o
  provedor (pendência da Fase 5).
- Link interno sai no formato do Padrão A (`{href, class:null, rel:null, target:null}`): o `Link` do
  StarterKit foi configurado com `HTMLAttributes: { target: null, rel: null, class: null }`; link externo
  recebe `target="_blank"` e `rel` (`sponsored nofollow noopener` para Amazon).
- Edge functions: segredos lidos primeiro de `Deno.env` (secrets da edge function, doc 02 §8) e só depois
  do Vault (`public.get_secret`); nomes antigos trocados pelas equivalências do doc 02 §8:
  `CONTACT_NOTIFY_SECRET` e `SEO_SYNC_INTERNAL_SECRET` → `CRON_SECRET` (header `x-cron-secret`),
  `GOOGLE_SEARCH_CONSOLE_SA_JSON` → `GSC_SERVICE_ACCOUNT_JSON`; remetente/destino
  `Vocação de Pai <contato@vocacaodepai.com.br>`; user-agent e `sc-domain` do Vocação de Pai.
  `GOOGLE_CSE_API_KEY`/`GOOGLE_CSE_CX` continuam só como secrets opcionais da função (fonte "google"
  do `ImageSearchDialog`, bloqueada no VDM — não entram no `.env.example`).
- Quiz gravado como `{question, options[], correct, explanation}` (CLAUDE.md §6.9); o `QuizWidget` herdado
  lê `answer` — ajustar o widget para aceitar `correct` na consolidação da Fase 1 (fora dos arquivos desta
  etapa).

## Como validar (aceite do doc 03 §8)

1. `npx tsc --noEmit && npm run lint && npm run build` verdes (feito nesta sessão).
2. Com o Supabase real: promover o dono a `admin` (`update profiles set role='admin' where id=…`), entrar em
   `/admin/login`, criar um post com capa, Semáforo, tabela, checklist e FAQ, clicar "Validar Padrão A",
   publicar e abrir `/post/<slug>`. Entrar com conta `member` → tela "Acesso restrito à equipe".
3. `mcp__Supabase__get_advisors security` sem erros.

## Pendências (só o dono / próxima sessão com Supabase)

- Deploy das edge functions (não há projeto Supabase nesta sessão), com os secrets:
  `mcp__Supabase__create_edge_function_secret` para `PEXELS_API_KEY`, `PIXABAY_API_KEY`
  (`stock-photos`), `RESEND_API_KEY` + `CRON_SECRET` (`notify-contact-message`),
  `GSC_SERVICE_ACCOUNT_JSON` + `CRON_SECRET` (`seo-search-console`); depois
  `mcp__Supabase__deploy_edge_function` para cada uma (equivalente CLI:
  `supabase functions deploy stock-photos notify-contact-message seo-search-console --project-ref <SUPABASE_PROJECT_REF>`).
  `seo-search-console` só deploy; o agendamento é da Fase 8.
- Regenerar `src/integrations/supabase/types.ts` (`mcp__Supabase__generate_typescript_types`) e revisar
  `src/lib/db.ts`/`types.ts` herdados (ainda usam `seo_meta_title`, `subscribers`, `get_my_profile`) —
  etapa de consolidação da Fase 1, fora deste escopo.
- `QuizWidget` ler `correct` (ver decisões).
