# Fase 1 — Etapa 6 (Blog): registro da execução

> Branch `claude/fase-1-etapa-6-blog` (worktree `wt-6-blog`). Doc de referência: `03-fase-1-fundacao.md` §6.
> Este arquivo é só desta etapa; o agente integrador transfere o essencial para `PROGRESSO.md` e marca a caixa no doc 13.

## Feito

- **/blog** (`src/routes/_site/blog.tsx` + `src/pages/BlogPage.tsx`): título "Blog do Vocação de Pai", chips só com as **categorias-mãe** (`parent_id is null` e `sort_order < 900`, fora as técnicas `pai-indica`/`noticias`), subcategorias como chips menores quando a mãe (ou uma filha) está ativa, ordenação (`?ordem=recent|views|likes`), paginação com `PER_PAGE = 12`, canonical para `/categoria/<slug>` quando filtrado, OG com `og-default.jpg`.
- **/post/$slug** (`src/routes/_site/post/$slug.tsx` + `src/pages/PostPage.tsx`): loader SSR com `getPostSeo` + `getPostFull` + `getRelatedPosts` (3 da mesma categoria); chip de categoria com ícone; autor (`profiles.display_name`); `reading_time` do banco (fallback palavras/200); `ContentNotice` no topo do corpo; corpo via `tiptap-html.ts` com todos os nós do Padrão A (callout do Semáforo com rótulos "Sinal verde / Sinal de atenção / Sinal de alerta", `table`, `taskList` clicável, `image`); `AdSlot` após o 2º H2 e no fim; quiz, reações, FAQ (accordion), `ParaAEsposa` antes do "Continue lendo", comentários, autor, TOC, newsletter; `head()` com `seo_title ?? title | Vocação de Pai`, `seo_description ?? excerpt`, canonical, OG/Twitter (`cover_image_url`, fallback `og-default.jpg`), `article:*`; JSON-LD `Article` (helper `articleJsonLd`) + `BreadcrumbList` (Início → Blog → Categoria → Post) + `FAQPage` quando houver `faq`. Visita registrada com `increment_post_views(p_post_id, p_user_key)` (1 por leitor por dia). Nota do Pai Indica aparece como selo simples quando `kind ≠ artigo/noticia` (o `ReviewBadge` completo é da Fase 2).
- **/categoria/$slug**: cabeçalho com nome, descrição e ícone; link para a mãe quando é subcategoria; chips das subcategorias quando houver; posts da mãe **incluem os das subcategorias** (`category_id in (mãe, filhas)`); 404 no loader se o slug não existir; JSON-LD `BreadcrumbList`.
- **/busca**: `search_posts(p_query, p_limit, p_offset)` via RPC (`querySearchPosts`), paginação "Carregar mais", estado vazio "Nada encontrado para '…'. Tente outra palavra." + 6 categorias-mãe sugeridas (loader `getSearchCategories`), `noindex`.
- **/rss.xml** (`src/routes/rss[.]xml.ts`, novo): 30 posts publicados, `enclosure` da capa, mesmo padrão de handler do sitemap. **/sitemap.xml**: home, 7 institucionais (inclui `/politica-de-afiliados`), categorias-mãe e subcategorias (sem as técnicas) e posts publicados; **sem** placeholders das seções futuras.
- **Componentes novos**: `src/components/blog/ContentNotice.tsx` (5 avisos do doc 00 §4.4: saúde/192, direitos, dinheiro, afiliado Amazon com link para `/politica-de-afiliados`, CVV 188; sem aviso casando não renderiza) e `src/components/blog/ParaAEsposa.tsx` (link para `https://vocacaodemae.com.br/post/<slug>`; só renderiza com o nó `paraAEsposa {slug, title}` no body, já registrado em `tiptap-html.ts`).
- **Libs ajustadas à 0002_blog.sql**: `queries.ts` (tipos locais `BlogCategory`/`BlogPost`/`SearchResult`, `POST_SELECT` com `profiles.display_name`, filtro por várias categorias, `motherCategories`/`childCategories`), `hub.functions.ts`, `seo.functions.ts` (`seo_title`, `seo_description`, `cover_image_alt`, `kind`, `product_score`, `faq`; client read-only sem o genérico `Database`), `db.ts` (`increment_post_views`, `search_posts`, `toggle_reaction` com tipo `saved`, reações lidas de `posts.like_count` + `reactions` próprias, comentário com `user_id` e `status='pending'`), `tiptap-html.ts` (rótulos do semáforo, prefixo "Sinal …: " retirado do texto para não duplicar o rótulo, nó `paraAEsposa`), `cover.ts` (foto de produto por `kind`/`m.media-amazon.com`), `seo.ts` (`breadcrumbJsonLd` sempre começa em Início).
- `category-icon.tsx`: ícones por `categories.icon` e, como as 14 mães nascem sem ícone, mapa por slug. `PostCard`: sem "1 min" falso em listas sem corpo; selo de nota quando `product_score` existe. `NotFound.tsx` com links para o blog e a busca.
- **`public/og-default.jpg`** (1200×630): gerado com Python/Pillow (`/tmp/.../make_og.py`, fonte Barlow Condensed Bold baixada do repositório google/fonts + Inter do sistema): fundo areia `#F4EFE6`, wordmark "Vocação de Pai" em `#14505C`, slogan "Para o homem que segura a casa." em `#D9822B`. Sem dependência nova no projeto.

## Validação

- `npx tsc --noEmit` ✅ · `npm run lint` ✅ (0 erros; 8 avisos `react-refresh/only-export-components` herdados do VDM) · `npm run build` ✅ (gera `src/routeTree.gen.ts` com `/rss.xml`).
- Sem banco configurado neste ambiente (`<SUPABASE_URL>` placeholder): o aceite funcional (`/busca?q=churrasco` acha o post 7, contagem do sitemap, Rich Results Test) fica para o deploy de teste.

## Decisões tomadas durante a execução

- `src/integrations/supabase/types.ts` ainda é o do VDM (será regenerado por outro agente): as consultas do blog usam o client **sem** o genérico `Database` (`DbClient = SupabaseClient`) e tipos locais em `src/lib/queries.ts`. Quando os tipos forem regenerados, nada precisa mudar; opcionalmente trocar `DbClient` por `SupabaseClient<Database>`.
- `profiles.display_name` → o `toPostWithRelations` preenche também `author.full_name` para os componentes herdados (`Author` em `types.ts`, arquivo de outro agente) continuarem funcionando.
- Posts moram nas subcategorias; a página da categoria-mãe e o filtro de `/blog` somam mãe + filhas.
- Na 0002 não existe RPC de estado de reação: curtidas totais vêm de `posts.like_count`; "curti/salvei" só para logado (RLS `reactions: own read`); contagem de "salvos" não é exibida.
- `reactions.type` usa `saved`; a UI continua falando "save" (mapa em `db.ts`).
- Comentário exige login (RLS `auth.uid() = user_id`); `author_email` deixou de ser enviado (coluna não existe na 0002).
- Tags (`post_tags`) ainda não são carregadas no post; `ContentNotice` casa por categoria/mãe/`kind` (as tags entram quando a consulta de tags existir).
- O `AdSlot` após o 2º H2 é feito dividindo o body em dois trechos de HTML (sem tocar no CSS).

## Pendências (para o integrador / dono)

- `__root.tsx` (arquivo de outro agente): adicionar `{ rel: "alternate", type: "application/rss+xml", href: "/rss.xml", title: "Vocação de Pai" }` em `links` (doc 03 §6.5).
- `.gitignore` tem `node_modules/` (com barra), que **não** ignora o link simbólico `node_modules` dos worktrees; por isso o commit desta etapa adicionou arquivos explicitamente. Trocar para `node_modules` (sem barra) no repositório.
- `src/lib/types.ts` (outro agente): quando for atualizado, `Author.full_name` → `display_name`, `Post.seo_meta_*` → `seo_title`/`seo_description`, `Post.tags` some, `Post.kind`/`product_score`/`reading_time` entram (os tipos locais de `queries.ts` podem então ser removidos).
- `QuizWidget` lê `answer` (índice); o CLAUDE.md §6 fala em `correct`. Os posts da seed devem usar `answer`, ou o widget precisa aceitar os dois (não alterado nesta etapa para não divergir da seed).
- Conferir no deploy de teste: `/rss.xml` válido, `/sitemap.xml` com home + 7 estáticas + categorias + posts, Rich Results Test (`Article`, `BreadcrumbList`, `FAQPage`).
