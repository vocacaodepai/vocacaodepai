# Progresso — Fase 9 (Pai Indica Mídia)

> Registro da sessão `claude/fase-9-pai-indica-midia` (2026-10-30). Para fundir em `docs/plano/PROGRESSO.md`
> ("Decisões tomadas durante a execução" e "Pendências do dono") na consolidação da fase.
> Banco ainda não existe (placeholder `<SUPABASE_PROJECT_REF>`): **nada foi aplicado no Supabase**; o site renderiza
> `/pai-indica/midia` com estado vazio até a 0017/0018 serem aplicadas. Documento da fase: `14-fase-9-pai-indica-midia.md`.

## Entregue

| Item (doc 14) | Arquivo | Estado |
|---|---|---|
| Tabela `media_reviews` (tipo filme/serie/jogo/app/livro, selo ClassInd + descritores, nota tripla, `content_scores` com check das 10 chaves, pôster só Wikimedia, afiliado só livro/jogo), índices, trigger `updated_at`, trigger `search_content` (+ `publish_at` ao publicar), RLS (anônimo lê published; `is_admin()` tudo), `search_media()` | `supabase/migrations/0017_pai_indica_midia.sql` | pronta, validada num PG 16 local (stub + 0001 + 0002 + 0017 + 0018, duas passagens = idempotente; anon vê 12 → 11 após um draft; insert anônimo negado; `search_media('minecraft')` = 1), **não aplicada** |
| Seed: 12 títulos reais (O Rei Leão 1994, Procurando Nemo, Toy Story, Divertida Mente · Bluey, Peppa Pig, Round 6 · Minecraft, Fortnite · YouTube Kids · O Pequeno Príncipe, O Leão, a Feiticeira e o Guarda-Roupa), 570-662 palavras cada, todos `published` | `supabase/migrations/0018_seed_midia.sql` | pronta, `validate-content.mjs --files` 12/12, **não aplicada** |
| Lib: tipos (`MediaReview`, `CONTENT_KEYS`, `CLASSIND_VALUES`), taxonomia (tipos, `ageTiers`, 10 categorias, `moralScale`, `classindLabels`, `CLASSIND_CONSULTA`, `PLATFORMS`), consultas, JSON-LD por tipo | `src/lib/pai-indica-midia/{types,taxonomia,queries,jsonld}.ts` | prontos |
| Server functions `getMediaList`, `getMediaBySlug` (ficha viaja como `PostWire`, como `getPostFull`), `getRelatedMedia` | `src/lib/pai-indica-midia.functions.ts` | prontas |
| Componentes `PosterFrame` (pôster licenciado ou cartão tipográfico 2:3), `MediaBadge` (+ `ClassIndSeal`, `MoralChip`), `ContentDots`, `MediaCard` (data-attributes), `MediaFilter` (tipo → idade do pai → plataforma), `TalkWithKids` | `src/components/pai-indica-midia/*` | prontos |
| `/pai-indica/midia` (régua tripla retrátil, filtro, grade, estado vazio, "Como avaliamos", JSON-LD Breadcrumb + ItemList) e `/pai-indica/midia/$slug` (selos, "O que o pai precisa saber", bolinhas, análise, "Para conversar", botão "Comprar agora na Amazon" só livro/jogo com link + aviso, fonte oficial, "Veja também", JSON-LD Movie/TVSeries/VideoGame/MobileApplication/Book + Review) | `src/pages/pai-indica-midia/{MidiaListPage,MidiaPage}.tsx`, `src/routes/_site/pai-indica/midia/{index,$slug}.tsx` | prontos |
| Menu: `NavItem.children`; Pai Indica → "Reviews de produtos" / "Mídia" (dropdown no desktop, chips no móvel); card de atalho no topo de `/pai-indica`; sitemap com `/pai-indica/midia` e os slugs publicados | `src/components/layout/{nav.ts,SiteLayout.tsx,MobileMenu.tsx}`, `src/pages/PaiIndicaListPage.tsx`, `src/routes/sitemap[.]xml.ts` | prontos |
| Admin `/admin/midia` (lista com status/tipo/busca, publicar/arquivar), `/admin/midia/novo`, `/admin/midia/$id` (selo clicável, nota tripla, bolinhas em sliders, pôster/afiliado, body texto → Tiptap ou JSON), validação igual à do validador; link "Mídia" no `AdminLayout` | `src/admin/{AdminMidia.tsx,admin-midia-db.ts}`, `src/routes/_admin/admin/midia/*` | prontos |
| Validador: `insert into public.media_reviews` em `--files` e `--media` no banco; regras do doc 14 §9 (campos, ClassInd, intervalos, 10 categorias, 500 palavras, links, botão, "R$", termos proibidos, pôster Wikimedia, afiliado, SEO) + avisos de spoiler e "verificar no portal" | `scripts/validate-content.mjs` | pronto |
| Docs: doc 14, PLANO-MESTRE §3 (linha F9) e §6, checklist 13 (itens 9.1-9.10), `supabase/migrations/README.md`, linha F9 em `PROGRESSO.md` | — | prontos |

Validação local: `npm run build`, `npm run lint` (0 erros; 16 avisos pré-existentes de `react-refresh`/`exhaustive-deps`)
e `npx tsc --noEmit` verdes; `node scripts/validate-content.mjs --files supabase/migrations/0018_seed_midia.sql` → 12/12;
`src/routeTree.gen.ts` regenerado pelo build com as 5 rotas novas.

## Decisões tomadas durante a execução

- 2026-10-30 · F9 · **Tabela nova `media_reviews`** (CLAUDE.md §8 exige registro). Esquema conforme a tarefa da fase, mais
  simples que o anexo `res-parental-advisor.md` §3: sem `desenho` (entra como `serie`), sem `semaforo`/`pai_age_tier`/
  `discernment`/`other_rating`/`alternatives`/`faq` (faixa e semáforo derivam de `pai_age_min` e `score_moral`; alternativas
  = "Veja também"), `platforms` text[] em vez de jsonb, `classind_checked_at`/`classind_url` substituídos pelo link fixo da
  consulta pública (`CLASSIND_CONSULTA`) e pela frase "verificar no portal ClassInd" em `pai_age_note`. Colunas podem ser
  acrescentadas depois com `add column if not exists`.
- 2026-10-30 · F9 · `classind` é **nullable** (o ClassInd não classifica livros); o validador e o admin exigem o selo para
  filme/série/jogo/app e proíbem para livro.
- 2026-10-30 · F9 · As 10 categorias de conteúdo têm chaves curtas em português (`violencia`, `sexo`, `linguagem`,
  `drogas`, `consumismo`, `medo`, `valores_positivos`, `modelos_positivos`, `fe`, `mensagem`), check `?&` no banco.
- 2026-10-30 · F9 · Pôster: todas as 12 fichas com `poster_url = null` (cartão tipográfico do `PosterFrame`). Pôster de
  filme/série/jogo é obra protegida e não existe cópia CC/PD confiável no Wikimedia Commons para esses títulos; nunca
  imagem gerada por IA. A coluna aceita só `https://upload.wikimedia.org/…`.
- 2026-10-30 · F9 · `affiliate_url = null` nos dois livros e nos dois jogos: CLAUDE.md §5.1 exige `/dp/<ASIN>` real e os ASIN
  não foram confirmados nesta sessão; o botão só aparece quando o dono gravar o link pelo `/admin/midia`.
- 2026-10-30 · F9 · Selos ClassInd anotados a partir das fichas de exibição/plataforma que conhecemos com confiança
  (L para os 4 filmes, Bluey, Peppa Pig, Minecraft, YouTube Kids; 12 para Fortnite; 18 para Round 6); como não houve
  conferência manual no portal nesta sessão, todas as fichas não-livro dizem "verificar no portal ClassInd" na nota de
  idade e o validador avisa. Nunca inventamos certeza.
- 2026-10-30 · F9 · `NavItem` ganhou `children?` para o subitem "Mídia" (dropdown genérico no `SiteLayout`, chips no
  `MobileMenu`); nome oficial da seção continua "Pai Indica".
- 2026-10-30 · F9 · Admin sem editor Tiptap próprio: o body entra como texto (parágrafos; `## ` abre seção) convertido por
  `paragraphsToDoc`, ou como JSON Tiptap colado. Reaproveitar o `AdminEditor` do Blog fica para a consolidação.
- 2026-10-30 · F9 · `SaveButton` não entrou na ficha: `saved_items.item_type` é fechado em `post/product/tool/job/track`
  (CLAUDE.md §8); acrescentar `media` é decisão de plano.

## Pendências do dono

- Aplicar `0017_pai_indica_midia.sql` (`mcp__Supabase__apply_migration`) e `0018_seed_midia.sql` (`execute_sql`) no projeto
  `<SUPABASE_PROJECT_REF>` quando ele existir (depois de 0001-0008).
- Conferir os 10 selos ClassInd (fichas não-livro) em `https://classindportal.mj.gov.br/consulta-filmes` e
  `…/consulta-jogos`, corrigir pelo `/admin/midia` e apagar a frase "verificar no portal ClassInd" da nota de idade.
- Informar ASIN (edição) de O Pequeno Príncipe, O Leão, a Feiticeira e o Guarda-Roupa, Minecraft e Fortnite para o
  botão "Comprar agora na Amazon" (`affiliate_url` com `PUBLIC_AMAZON_TAG`).
- Decidir sobre pôsteres: manter o cartão tipográfico (padrão) ou avaliar a API do TMDB (exige atribuição) como o anexo sugere.
- Confirmar o nome "Pai Indica Mídia" e as rotas `/pai-indica/midia` e `/pai-indica/midia/$slug` (anexo §3 pedia confirmação).

## O que falta na fase

- 9.10 (dono): aplicar SQL, conferir ClassInd, ASIN, pôsteres.
- Consolidação: editor Tiptap no admin de mídia; `search` do site (`/busca`) incluir `search_media`; widget "Esta semana"
  alimentado pela rotina (Fase 8+); `SaveButton` em fichas (exige `item_type='media'`).
