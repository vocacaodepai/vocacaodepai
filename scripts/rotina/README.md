# Ferramentas da rotina diária (Vocação de Pai)

Scripts usados pela Routine do Claude Code (doc 10) e pelos subagentes que ela abre. **Nenhum script escreve no
banco**: todos produzem `.sql` (INSERT idempotente por slug, ou staging em `_tmp_post_staging` + UPDATE curto com md5)
que a rotina aplica com `mcp__Supabase__execute_sql` e commita em `supabase/rotina/<AAAA-MM-DD>/`. Nenhum gera
`DROP`, `DELETE` ou `TRUNCATE`. Ambiente (CLAUDE.md §13): `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ou
`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`), do ambiente ou de `.env`; **sem banco, os geradores usam os seeds do
repositório** como universo de links (dry-run offline). Diretório de trabalho da rotina: `/tmp/rotina-pai/`.

| Script | Entrada | Saída | Observações |
| --- | --- | --- | --- |
| `helpers.py` | — (importado por todos) · CLI `helpers.py slugs [arq]` / `helpers.py env` | `slugs.txt` | Nós Tiptap (P/H2/UL/TASKS/TABLE/CALLOUT/BTN/FOTOS/CONTINUE_LENDO), checagens comuns (R$, termos proibidos, semáforo, links, SEO), universo de slugs (banco ou seeds). |
| `art_gen.py` | `arquivo.json` (Padrão A: forma estruturada ou `body` Tiptap; `BRIEF_ARTIGO_PAI.md`) | `<slug>.insert.sql` **ou** (`--reforma`) `<slug>.stg.sql` + `<slug>.upd.sql` | `kind='artigo'`; exige 1200–2200 palavras, ≥10 links reais, Semáforo do pai, tabela, checklist, "Continue lendo", faq/quiz, tags `fase-*`. |
| `cmp_gen.py` | `arquivo.json` (`BRIEF_COMPARATIVO_PAI.md`; `kind` comparativo ou lista) | `<slug>.insert.sql` | Preenche `comparison` (doc 02 §5.4), `product_category/subcategory`, `product_score` = vencedor; botões `{AMAZON:slug}`, faixa `{FAIXA:slug}` (o site resolve); capa `/images/covers/<slug>.jpg` obrigatória; `--offline` pula o HEAD das fotos (só teste), `--sem-capa` idem. |
| `rev_art_gen.py` | `arquivo.json` (`BRIEF_REVIEW_UNICA_PAI.md`) | `<slug>.insert.sql` | `kind='review'`; preenche `review` (doc 02 §5.3) e `product_score = nota`; exige produto na loja e linka `/loja/<slug>`. |
| `news_gen.py` | `arquivo.json` (`BRIEF_NOTICIA_PAI.md`) | `<slug>.insert.sql` (+ tags `serie:mercado-do-pai`, `fase-todas`) | `kind='noticia'`, categoria `noticias`, 350–600 palavras, fonte ≤ 48 h linkada, ≥5 links internos, faq 3–6, sem semáforo. `--sem-prazo` só em teste. |
| `review_gen.py` | `arquivo.json` (`BRIEF_REVIEW_LOJA_PAI.md`; `novo: true/false`) | `<slug>.insert.sql` ou `<slug>.stg.sql` + `<slug>.upd.sql` (`k='review:<slug>'`) | Review longa de produto (`products.review`), prós/contras, galeria oficial. |
| `amz.py` | `ASIN [--tries N] [--refresh]` | JSON (title, images[8], bullets, details, rating, reviews, price, available) | Cache em `/tmp/amzcache-vocacaodepai`. A Amazon bloqueia com frequência: repete com pausa. |
| `photo_upgrade.py` | `N [OFFSET]` | `photo_upgrade_out.sql`, `photo_upgrade_log.txt` | Fila de produtos com foto ruim → galeria oficial `_AC_SL1500_` (um UPDATE pequeno por produto). |
| `price_range.py` | `fila [N]` · `sql achados.json` | fila impressa · `price_range_out.sql` | Faixa pesquisada em ≥2 lojas, `max ≤ 3×min`; grava `product_price_checks` + `price_min/max` (`BRIEF_FAIXA_PRECO.md`). |
| `cover_cmp.py` | `<slug> "Nome=url" […]` (1–3) | `public/images/covers/<slug>.jpg` 1280×720 | Capa composta nas cores do site (areia → faixa petróleo/âmbar). Precisa de Pillow. Commitar o JPG. |
| `slugs.sh` | `[saida.txt]` | `slugs.txt` (`/post/`, `/pai-indica/`, `/loja/`, `/ferramentas/` de `src/lib/tools/registry.ts`, `/formacao/`, `/desafios/`, `/categoria/`) | Chama `helpers.py slugs`. |
| `guard.mjs` | `validate.log '<json rotina:status>' [--out guard_out.sql]` | `guard_out.sql` | Doc 10 §13b-a: 3 reprovações seguidas do validador → `rotina_pausada=true` em `_tmp_post_staging` (`k='rotina:status'`). |
| `lisieux.sh` | `inicio "<tarefa>"` · `fim` · `status` | — | Status no Painel Lisieux via `scripts/agente.mjs` (cópia do grupovdp), agente `rt-vocacaodepai`, empresa `f1`; variáveis `LISIEUX_*`. |
| `proibidos.json` | — | — | Termos proibidos (doc 10 §5.3), lidos pelos geradores e por `scripts/validate-content.mjs`. |
| `exemplo_artigo.json` | — | — | Artigo real da seed 0009 no formato aceito por `art_gen.py` (dry-run: `python3 scripts/rotina/art_gen.py scripts/rotina/exemplo_artigo.json --out /tmp/rotina-pai`). |
| `seed_pai_indica/` | specs `.mjs` | `supabase/migrations/0011_seed_pai_indica.sql` | Gerador da seed da Fase 2 (não é da rotina). |

BRIEFs: `BRIEF_ARTIGO_PAI.md` (Padrão A), `BRIEF_NOTICIA_PAI.md` (Mercado do pai), `BRIEF_COMPARATIVO_PAI.md`,
`BRIEF_REVIEW_UNICA_PAI.md`, `BRIEF_REVIEW_LOJA_PAI.md`, `BRIEF_FAIXA_PRECO.md`.
Ainda não existem (pendências registradas em `docs/plano/progresso-fase-8.md`): `jogada_gen.py` + `BRIEF_JOGADA.md`
(Jogada do Dia, doc 10 §4.7) e `backlog.mjs` + `supabase/seed/backlog.json` (doc 12 §9).

## Ordem diária (resumo; o texto completo da Routine está em `docs/rotina/ROTINA-DIARIA.md`)

1. `mkdir -p /tmp/rotina-pai && bash scripts/rotina/slugs.sh /tmp/rotina-pai/slugs.txt`; `lisieux.sh inicio "Rotina diária: início"`.
2. Loja primeiro: `amz.py` → `price_range.py` → `review_gen.py` (produtos dos Pai Indica do dia; até 5 novos).
3. Pai Indica: `cover_cmp.py` → JSON → `cmp_gen.py` / `rev_art_gen.py` → INSERT (3 comparativos + 2 reviews únicas).
4. Blog: `art_gen.py` (3 novos + 2 reformas via `--reforma`).
5. Notícia "Mercado do pai": `news_gen.py` (1).
6. Reviews longas antigas (`review_gen.py`, 10), faixas de preço (`price_range.py`, 15), fotos (`photo_upgrade.py 20`).
7. Moderação da fila `pending` (SQL curto + `moderation_log`).
8. `node scripts/validate-content.mjs --since 24h` → `guard.mjs` → Search Console `notify_index`.
9. Commit (`supabase/rotina/<data>/`, `public/images/covers/`), PR `rotina: <data>`, resumo em PT-BR, `lisieux.sh fim`.

Validação local dos geradores (sem banco): `python3 -m py_compile scripts/rotina/*.py` e o dry-run do `exemplo_artigo.json`;
o SQL gerado pode ser conferido com `node scripts/validate-content.mjs --files <arquivo.insert.sql>`.
