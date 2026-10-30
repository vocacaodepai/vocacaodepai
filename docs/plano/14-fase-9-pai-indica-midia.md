# Fase 9 — Pai Indica Mídia: filmes, séries, jogos, apps e livros por idade

> Documento de execução. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code em `/home/user/vocacaodepai`.
> Pré-requisito: Fase 2 (Pai Indica) no código: `ReviewBadge`, `ScoreScaleNote`, `filterVisibility.ts`,
> `AffiliateButton`, `AffiliateDisclosure`, régua de nota em `src/lib/pai-indica/score.ts`. Pesquisa de origem:
> `docs/plano/anexos/res-parental-advisor.md` §3 (Common Sense Media, Decent Films, Plugged In, Movieguide,
> Kids-In-Mind, ESRB/PEGI e **ClassInd**). Se o doc 02 divergir em coluna, vale o doc 02 e registra-se em `PROGRESSO.md`.

## Sumário

1. Objetivo e promessa
2. Modelo de dados (`media_reviews`, `0017_pai_indica_midia.sql`)
3. Taxonomia (`src/lib/pai-indica-midia/taxonomia.ts`)
4. Componentes
5. Rotas e páginas
6. Admin (`/admin/midia`)
7. JSON-LD
8. Regras editoriais obrigatórias
9. Validação (`scripts/validate-content.mjs`)
10. Seed inicial (`0018_seed_midia.sql`)
11. Critérios de aceite
12. Prompt para iniciar esta fase no Sonnet
13. Checklist de pronto

---

## 1. Objetivo e promessa

No Brasil existe só a classificação oficial (ClassInd, do Ministério da Justiça), sem a leitura "o que isso
significa para o meu filho" nem a visão católica de família. O **Pai Indica Mídia** responde, em uma ficha por
título: *esse filme, série, jogo, app ou livro é para o seu filho?* — com o selo oficial sempre citado e
linkado à consulta pública, mais a **nota tripla do pai**:

| Nota | Escala | Pergunta que responde | Modelo |
|---|---|---|---|
| Qualidade | 0-10 (régua do Pai Indica, `SCORE_BANDS`) | É bem feito? | Pai Indica / Movieguide |
| Moral | -4..+4 (`moralScale`) | Faz bem ou mal à família? | Decent Films / Movieguide |
| Idade | 0 (livre) … 18, em 4 faixas do pai (`ageTiers`) | A partir de quando o meu filho dá conta? | Decent Films / Common Sense |

E **10 categorias de conteúdo em bolinhas 0-5** (Common Sense): violência, sexo e sensualidade, linguagem,
álcool/fumo/drogas, consumismo, medo e tensão (o que preocupa) · valores positivos, modelos positivos, fé,
mensagem (o que edifica). Fecha com "O que o pai precisa saber" e "Para conversar com seu filho" (3-5 perguntas).

Separar as três notas evita o erro clássico: obra bem feita não é, só por isso, obra boa para criança.

## 2. Modelo de dados — `public.media_reviews` (0017)

| Coluna | Tipo / regra |
|---|---|
| `id` uuid pk, `slug` unique kebab-case, `title`, `original_title`, `year` (1900-2100) | ficha |
| `type` | `check in ('filme','serie','jogo','app','livro')` |
| `platforms` text[] | onde assistir/jogar/ler (texto livre; `PLATFORMS` só sugere) |
| `classind` | `null` ou `check in ('L','10','12','14','16','18')`; **livro = null** (ClassInd não classifica livros) |
| `classind_descriptors` text[] | copiados do portal (ex.: "violência", "drogas lícitas") |
| `pai_age_min` int 0-18, `pai_age_note` text | idade do pai + explicação da diferença para o ClassInd; dúvida sobre o selo → frase "verificar no portal ClassInd" |
| `score_quality` numeric(3,1) 0-10, `score_moral` int -4..4 | nota tripla |
| `content_scores` jsonb | check `?&` das 10 chaves; valores 0-5 conferidos pelo validador e pelo admin |
| `summary` (40-300), `body` jsonb Tiptap (≥500 palavras), `what_parents_need_to_know` text, `talk_with_your_kids` text[] (3-5) | texto |
| `poster_url` (só `https://upload.wikimedia.org/…` ou null), `poster_credit`, `poster_license` | pôster licenciado ou cartão tipográfico |
| `affiliate_url` | só `type in ('livro','jogo')` e domínio `amazon.com.br` (com `PUBLIC_AMAZON_TAG` garantido pelo `AffiliateButton`) |
| `status` draft/published/archived, `publish_at`, `author_id`, `search_content` tsvector, `seo_title` ≤60, `seo_description` ≤155, `created_at`, `updated_at` | iguais a `posts` |

Índices: status+publish_at, type, pai_age_min, GIN em platforms e search_content, trigram no título.
Triggers: `set_updated_at`; `media_reviews_search_content` (A título, B original+resumo, C "o que o pai precisa
saber"+body; preenche `publish_at` ao publicar). Função `search_media(p_query, p_limit, p_offset)` (security
definer, só published). RLS: anônimo lê published com `publish_at <= now()`; `is_admin()` lê/insere/atualiza/apaga.

Diferenças deliberadas em relação ao anexo §3 (decisão registrada em `progresso-fase-9.md`): sem `desenho`
(entra como `serie`), sem `semaforo`/`pai_age_tier`/`discernment` (derivados de `pai_age_min` e `score_moral`),
`platforms` como text[] em vez de jsonb, 10 chaves de conteúdo em português curto.

## 3. Taxonomia — `src/lib/pai-indica-midia/taxonomia.ts`

`mediaTypeLabels` (label, plural, `schema` para o JSON-LD) · `ageTiers` (Crianças ≤9, Pré-adolescentes 10-13,
Adolescentes 14-17, Só adultos 18+) e `tierOf()` · `contentCategories` (10, com `positive`) · `moralScale`
(-4 Ofensivo … +4 Edificante) e `moralOf()` · `classindLabels` (cores do MJSP) · `CLASSIND_CONSULTA`
(filmes, jogos, sobre) e `classindConsultaUrl(type)` · `PLATFORMS` · `normalizeContentScores()`. Tipos em
`types.ts` (`MediaReview`, `MediaCardRow`, `CONTENT_KEYS`, `CLASSIND_VALUES`). Consultas em `queries.ts`
(`queryMediaList`, `queryMediaBySlug`, `queryRelatedMedia`), server functions em `src/lib/pai-indica-midia.functions.ts`.

## 4. Componentes — `src/components/pai-indica-midia/`

| Componente | Função |
|---|---|
| `PosterFrame` | pôster licenciado (com crédito) **ou** cartão tipográfico 2:3 por tipo; nunca imagem gerada por IA |
| `MediaBadge` (+ `ClassIndSeal`, `MoralChip`) | selo oficial ClassInd + nota tripla; `size="lg"` traz descritores e link da consulta |
| `ContentDots` | 10 categorias em bolinhas 0-5 (`compact` no card: só as > 0) |
| `MediaCard` | card da listagem com `data-kind`, `data-age-tier`, `data-platforms` |
| `MediaFilter` | tipo → faixa etária do pai → plataforma, via `filterVisibility.ts` (no navegador) |
| `TalkWithKids` | "Para conversar com seu filho" |

## 5. Rotas e páginas

- `/pai-indica/midia` (`src/routes/_site/pai-indica/midia/index.tsx` → `MidiaListPage`): cabeçalho, régua tripla
  retrátil (`TripleScaleNote`, explica ClassInd + 3 notas + bolinhas), filtro, grade, estado vazio, "Como avaliamos".
  JSON-LD `BreadcrumbList` + `ItemList`.
- `/pai-indica/midia/$slug` (`MidiaPage`): pôster + selos, resumo, "O que o pai precisa saber" (com a nota moral
  explicada), bolinhas, análise (body), "Para conversar com seu filho", botão **"Comprar agora na Amazon"** (só
  livro/jogo com `affiliate_url`) + `AffiliateDisclosure`, fonte oficial do ClassInd, "Veja também".
- Menu: `NAV_MAIN` ganhou `children` no item Pai Indica (Reviews de produtos / Mídia): dropdown no desktop
  (`SiteLayout`) e chips no menu móvel. Card de atalho no topo de `/pai-indica`. Sitemap: `/pai-indica/midia` + slugs.

## 6. Admin — `/admin/midia`

`src/admin/AdminMidia.tsx` (lista com filtros de status/tipo/busca; formulário com selo ClassInd clicável,
nota tripla, bolinhas em sliders, pôster/afiliado, body como texto → Tiptap ou JSON) + `admin-midia-db.ts`
(`fetchAdminMedia`, `fetchAdminMediaById`, `upsertAdminMedia`, `setAdminMediaStatus`, `validateMediaInput`).
Rotas `/admin/midia`, `/admin/midia/novo`, `/admin/midia/$id`; link "Mídia" no `AdminLayout`. Nunca `delete`:
ficha sai do ar com `archived`.

## 7. JSON-LD (`src/lib/pai-indica-midia/jsonld.ts`)

`Movie` / `TVSeries` / `VideoGame` / `MobileApplication` / `Book` conforme `type`, com `contentRating:
"ClassInd 12"`, `audience: {PeopleAudience, suggestedMinAge}`, `review` aninhada (`reviewRating` 0-10 =
`score_quality`, `reviewBody` = "o que o pai precisa saber", `publisher` Organization "Vocação de Pai") +
`BreadcrumbList`. Listagem: `ItemList`.

## 8. Regras editoriais obrigatórias

1. **Selo oficial sempre citado com fonte**: `classind` copiado do portal (`classindportal.mj.gov.br`) e a ficha
   linka a consulta. Dúvida → marcar e escrever "verificar no portal ClassInd" em `pai_age_note`; nunca inventar
   certeza. Livro não recebe ClassInd.
2. **Pôster**: nunca gerado por IA; só Wikimedia Commons CC/PD (HEAD 200, licença confirmada, crédito) ou o
   cartão tipográfico do `PosterFrame`. Capa de produto da Amazon só quando houver `affiliate_url` (livro/jogo).
3. **Sem spoiler desnecessário**: cenas descritas de forma objetiva (o que aparece, quantas vezes, em que
   contexto), sem contar o fim.
4. **Linguagem de homem para homem** (CLAUDE.md §3): direta, firme, acolhedora; visão católica de família;
   nada da lista de proibidos; "assistir junto vale mais do que proibir".
5. **Nota tripla separada**: qualidade não compensa moral; idade do pai pode ser mais exigente que o ClassInd.
6. **Afiliado**: só livro/jogo, botão "Comprar agora na Amazon", `rel="sponsored nofollow noopener"`, aviso
   de afiliado na página. Nunca "R$".
7. Body ≥ 500 palavras; `what_parents_need_to_know` e 3-5 perguntas obrigatórios para publicar.

## 9. Validação — `scripts/validate-content.mjs`

`--files <0018_seed_midia.sql>` lê `insert into public.media_reviews`; `--media` valida as publicadas do banco.
Falha se: campo obrigatório ausente; `type`/`status` inválidos; `classind` ausente/inválido (ou presente em
livro); `pai_age_min` fora de 0-18; `score_quality` fora de 0-10; `score_moral` fora de -4..4; `content_scores`
sem alguma das 10 chaves, com chave estranha ou valor fora de 0-5; summary fora de 40-300; body < 500 palavras
(publicada); link interno para destino inexistente; botão diferente de "Comprar agora na Amazon"; "R$"; termo
proibido (`scripts/rotina/proibidos.json`); `poster_url` fora de `upload.wikimedia.org`; pôster sem crédito;
`affiliate_url` fora de livro/jogo ou fora de amazon.com.br; `seo_*` longos. Avisa: possível spoiler e selo
marcado "verificar no portal".

## 10. Seed inicial — `0018_seed_midia.sql`

12 títulos reais e conhecidos das famílias brasileiras: 4 filmes (O Rei Leão 1994, Procurando Nemo, Toy Story,
Divertida Mente), 3 séries (Bluey, Peppa Pig, Round 6), 2 jogos (Minecraft, Fortnite), 1 app (YouTube Kids),
2 livros (O Pequeno Príncipe, O Leão, a Feiticeira e o Guarda-Roupa). Todos `published`, `on conflict (slug) do
nothing`, `poster_url null` (cartão tipográfico), `affiliate_url null` até o dono confirmar ASIN. Selos ClassInd
marcados com "verificar no portal ClassInd" onde a conferência manual ainda não foi feita.

## 11. Critérios de aceite

- `0017` e `0018` idempotentes e aplicadas (`apply_migration` / `execute_sql`) quando o projeto Supabase existir.
- `/pai-indica/midia` e `/pai-indica/midia/$slug` no ar com filtro em 3 camadas, régua tripla, bolinhas,
  "Para conversar", JSON-LD por tipo e botão só em livro/jogo com link.
- Menu com "Mídia" no Pai Indica; card em `/pai-indica`; sitemap com as fichas.
- `/admin/midia` cria/edita/publica/arquiva com validação igual à do validador.
- `npx tsc --noEmit && npm run lint && npm run build` verdes; `node scripts/validate-content.mjs --files
  supabase/migrations/0018_seed_midia.sql` → 12/12.

## 12. Prompt para iniciar esta fase no Sonnet

```
Execute a Fase 9 conforme docs/plano/14-fase-9-pai-indica-midia.md. Leia antes CLAUDE.md (§3, §4.2, §7, §9),
docs/plano/anexos/res-parental-advisor.md §3 e o código de src/lib/pai-indica/* e src/components/pai-indica/*.
Entregue, nesta ordem e com um commit por bloco: 0017_pai_indica_midia.sql → lib (types, taxonomia, queries,
jsonld, functions) → componentes → páginas e rotas → menu, card e sitemap → admin → validador → 0018_seed_midia.sql
(12 títulos reais; ClassInd só com confiança, senão "verificar no portal ClassInd"; pôster null ou Wikimedia
CC/PD com HEAD 200) → docs (progresso-fase-9.md, PLANO-MESTRE.md, checklist 13). Rode tsc, lint, build e o
validador antes de cada commit. Nunca pôster gerado por IA, nunca "R$", nunca spoiler do fim.
```

## 13. Checklist de pronto

- [ ] 9.1 `0017_pai_indica_midia.sql` (tabela, índices, triggers, RLS, `search_media`)
- [ ] 9.2 Lib `src/lib/pai-indica-midia/*` + `pai-indica-midia.functions.ts`
- [ ] 9.3 Componentes (`PosterFrame`, `MediaBadge`, `ContentDots`, `MediaCard`, `MediaFilter`, `TalkWithKids`)
- [ ] 9.4 `/pai-indica/midia` e `/pai-indica/midia/$slug` com JSON-LD
- [ ] 9.5 Menu (Mídia no Pai Indica), card em `/pai-indica`, sitemap
- [ ] 9.6 `/admin/midia` (lista, novo, editar) + link no `AdminLayout`
- [ ] 9.7 Validador com regras de `media_reviews`
- [ ] 9.8 `0018_seed_midia.sql` com 12 títulos validados
- [ ] 9.9 tsc + lint + build verdes; `progresso-fase-9.md`; PLANO-MESTRE e checklist 13 atualizados
- [ ] 9.10 Dono: aplicar 0017/0018 no Supabase, conferir os 10 selos ClassInd no portal, informar ASIN dos livros/jogos
