# Progresso — Fase 8 (Automação, rotinas e painel)

> Registro da sessão `claude/fase-8-automacao` (2026-10-30). Para fundir em `docs/plano/PROGRESSO.md` na consolidação da
> fase. Banco ainda não existe (placeholder `<SUPABASE_PROJECT_REF>`): **nada foi aplicado no Supabase, nenhum workflow
> rodou de verdade, nenhuma Routine foi criada** — tudo o que depende de decisão ou credencial do dono ficou preparado,
> documentado e desligado. Validação local: `npx tsc --noEmit`, `npm run lint` (0 erros, 16 avisos herdados) e
> `npm run build` verdes; `python3 -m py_compile scripts/rotina/*.py` ok; dry-run offline dos 4 geradores com o SQL
> gerado aprovado por `node scripts/validate-content.mjs --files` (4/4 posts válidos).

## Entregue

| Item (doc 10) | Arquivo | Estado |
|---|---|---|
| Base comum dos geradores: nós Tiptap, checagens (R$, termos proibidos, semáforo, links reais, SEO, capa ≠ inline), universo de slugs (banco **ou** seeds do repositório), tags/post_tags | `scripts/rotina/helpers.py` | pronto |
| Padrão A do Pai: novo (INSERT) e `--reforma` (staging + UPDATE curto com md5); forma estruturada ou `body` Tiptap | `scripts/rotina/art_gen.py`, `scripts/rotina/exemplo_artigo.json` (post real da seed 0009) | pronto; dry-run OK (1892 palavras, 10 links) |
| Pai Indica comparativo/lista: `comparison` (doc 02 §5.4), `product_category/subcategory`, `product_score` = vencedor, pesos da categoria, botões `{AMAZON:slug}`, `{FAIXA:slug}`, capa composta obrigatória | `scripts/rotina/cmp_gen.py` | pronto; dry-run OK |
| Pai Indica review única: `review` (doc 02 §5.3), `product_score = nota`, "O que dizem outros compradores", link `/loja/<slug>` | `scripts/rotina/rev_art_gen.py` | pronto; dry-run OK |
| Notícia "Mercado do pai": `kind='noticia'`, categoria `noticias`, tags `serie:mercado-do-pai` + `fase-todas`, fonte ≤ 48 h linkada, 350–600 palavras, ≥ 5 links, faq 3–6 | `scripts/rotina/news_gen.py` | pronto; dry-run OK |
| `price_range.py` / `photo_upgrade.py` lendo `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (fallback `VITE_*`) | `scripts/rotina/price_range.py`, `scripts/rotina/photo_upgrade.py` | pronto |
| Universo de links (`slugs.txt`) | `scripts/rotina/slugs.sh` (→ `helpers.py slugs`) | pronto (179 hrefs a partir dos seeds) |
| Guard da rotina (3 reprovações seguidas → `rotina_pausada`) | `scripts/rotina/guard.mjs` | pronto; testado (✗ ✗ ✓ ✗ → pausa) |
| Painel Lisieux: `agente.mjs` (cópia byte a byte do grupovdp), wrapper, passos e diff do PR no grupovdp | `scripts/agente.mjs`, `scripts/rotina/lisieux.sh`, `scripts/lisieux/registrar-site.md` | prontos (PR do grupovdp **não** aberto) |
| BRIEFs e README da rotina | `scripts/rotina/BRIEF_ARTIGO_PAI.md`, `BRIEF_NOTICIA_PAI.md`, `README.md`; `BRIEF_COMPARATIVO_PAI.md` e `BRIEF_REVIEW_UNICA_PAI.md` alinhados aos geradores | prontos |
| CI: build + lint + typecheck + validador (`--files` das seeds 0008+ com `--products`; banco só com secrets) + capas + sintaxe dos scripts | `.github/workflows/validate.yml` | pronto (sem auto-merge) |
| Crons no mesmo padrão (`CRON_SECRET`, `vars.PUBLIC_SITE_URL`, `workflow_dispatch`) | `market-refresh.yml` (revisado), `newsletter-weekly.yml` (revisado), `event-reminder.yml` (novo, hora em hora), `jobs-expire.yml` (novo, só manual: o agendamento é o pg_cron do doc 02) | prontos |
| Auto-merge guardado e desligado, com os pré-requisitos para ligar | `.github/workflows-disabled/auto-merge.yml` + `README.md` | pronto |
| AdSense: publisher em constante com placeholder claro, `AdSlot` respeitando `isNoAdsRoute` e renderizando a unidade só com publisher real; `ads.txt` com placeholder comentado | `src/lib/adsense.ts`, `src/components/blog/AdSlot.tsx`, `public/ads.txt` | pronto (publisher = pendência do dono) |
| Prompt literal da Routine diária e da semanal, adaptados ao que existe | `docs/rotina/ROTINA-DIARIA.md`, `docs/rotina/ROTINA-SEMANAL.md` | prontos (Routines **não** criadas) |

## Decisões tomadas durante a execução

- 2026-10-30 · F8 · **Empresa do Vocação de Pai no Painel Lisieux = `f1`** (já existe em `escritorio/data.js` do grupovdp:
  `DEFAULT_NAMES.f1 = "Vocação de Pai"`, `SEED_TEAM` com `f1`); `rt-vocacaodepai` entra em `ROUTINES` com `"f1"`. Nenhum anexo
  fixa outro id; o VDM é `f3`.
- 2026-10-30 · F8 · Variáveis dos scripts Python: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` primeiro, com fallback para
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (mesma ordem do `validate-content.mjs`). `SUPABASE_URL` não está na lista fechada
  do CLAUDE.md §13, mas é o nome que o doc 10 §12 e a Routine usam fora do app (não aparece em código do site nem em workflows
  como variável nova: nos workflows é só o **secret** `SUPABASE_URL` já previsto pelo doc 10 §12).
- 2026-10-30 · F8 · `search_content` e `reading_time` **não** são escritos pelos geradores: a trigger `trg_posts_search`
  (0002) preenche os dois em INSERT/UPDATE (doc 10 §3 item 7 autoriza omitir).
- 2026-10-30 · F8 · `{FAIXA:slug}` e `{AMAZON:slug}` ficam literais no body do Pai Indica (como na seed 0011) e são resolvidos
  pelo site (`src/lib/pai-indica/body.ts`); os geradores **não** consultam preço nem `affiliate_url` (sem risco de gravar preço
  exato, e funcionam offline). As fotos oficiais vão em `fotosModelos.src` e no `image` da seção do produto.
- 2026-10-30 · F8 · Regras dos geradores igualadas ao validador (que é a autoridade): artigo 1200–2200 palavras; notícia ≥ 5
  links e faq 3–6; Pai Indica: "Não fizemos teste físico." obrigatório em "Como avaliamos", `verdict_by_profile` ≥ 2, quiz com
  `correct` (índice). Prefixo do callout em **bold** (doc 02 §5.1) + texto.
- 2026-10-30 · F8 · `jobs-expire.yml` só com `workflow_dispatch`: o doc 02 §4.8/§8 prevalece ("expiração = pg_cron
  `vdp-expire-jobs` de `0008_cron.sql`; rota `/api/cron/expire-jobs` só manual; sem workflow agendado"). A rota chega na Fase 6.
- 2026-10-30 · F8 · `event-reminder.yml` criado de hora em hora (a rota `/api/cron/event-reminder` existe desde a F7); o pg_cron da
  0015 aponta para uma edge function que não existe — usar **um** dos dois quando o projeto existir.
- 2026-10-30 · F8 · `validate.yml` roda o validador em `--files` sobre todas as `00NN_*.sql` a partir da 0008 (as DDL 0013/0015
  passam sem posts) + `supabase/rotina/*/*.insert.sql` quando existir; o modo banco só com os secrets `SUPABASE_URL` /
  `SUPABASE_SERVICE_ROLE_KEY`. Build no CI usa placeholders quando os secrets não existem.
- 2026-10-30 · F8 · `scripts/agente.mjs` entra na lista `ignores` do ESLint para continuar **idêntico** ao do grupovdp (doc 10 §11.2).
- 2026-10-30 · F8 · AdSense: `ADSENSE_PUBLISHER_ID = "pub-0000000000000000"` (placeholder, `isAdsenseConfigured()` = false);
  o ID herdado do grupo (`pub-5212610948635761`) saiu do `ads.txt` e do código para não anunciar com conta de outro site.
- 2026-10-30 · F8 · Header do Search Console na Routine: `x-cron-secret` = `CRON_SECRET` (é o que a edge function
  `seo-search-console` deste repositório lê), não `x-seo-sync-secret`.

## Não feito nesta sessão (fica para a próxima / depende do dono)

- `jogada_gen.py` + `BRIEF_JOGADA.md` (Jogada do Dia, doc 10 §4.7) e a rota `/api/newsletter/daily` + `newsletter-daily.yml` (§8.4).
- `backlog.mjs` + `supabase/seed/backlog.json` (doc 12 §9, Uso A — sessão própria); a Routine usa o doc 12 como tabela até lá.
- `validate-content.mjs --similaridade` (doc 10 §13b-c), `/api/newsletter/owner-weekly` (§13b-b), `/api/hub/metrics` (§11.4),
  `/loja/ofertas` (§13b-d), `/anuncie` (§13b-e), `/api/newsletter/unsubscribe` (§8.3), blocos "Sua formação" e "Pai Indica da
  semana" no template semanal (§8.2) — código do site fora do escopo pedido nesta sessão (só AdSlot/adsense).
- `cover_cmp.py` já estava nas cores do site (Fase 2); não foi alterado.
- Seções novas do `CLAUDE.md` (doc 10 §14 item 12) — deixadas para a consolidação da fase, quando a rotina rodar de verdade.
- 8.6 (links cruzados com o VDM), 8.10 (`/podcast`, push PWA — backlog, sem código), 8.11 (checklist SEO/AdSense do doc 11).

## Pendências do dono (só ele resolve)

- Projeto Supabase real + migrations aplicadas; secrets `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no GitHub (modo banco do
  `validate.yml`); variável de repositório `PUBLIC_SITE_URL` (opcional; padrão `https://vocacaodepai.com.br`); secret `CRON_SECRET`.
- Criar as Routines "Vocação de Pai: rotina diária" (05:37) e "rotina semanal" (domingo 07:07) com os prompts de `docs/rotina/`
  e as variáveis listadas lá — **só depois** do banco real e do `validate.yml` verde.
- PR `claude/vocacaodepai-no-painel` no grupovdp (`scripts/lisieux/registrar-site.md`) + secrets `GA4_PROPERTY_VOCACAODEPAI`
  e `HUB_API_KEY_VOCACAODEPAI`; service account no GA4 e no Search Console; valor de `LISIEUX_STATUS_SECRET`.
- Ligar o auto-merge (`.github/workflows-disabled/README.md`) só com `validate` required e decisão registrada.
- Publisher do AdSense (`src/lib/adsense.ts` + `public/ads.txt`) e o loader em `__root.tsx` quando a conta existir.
