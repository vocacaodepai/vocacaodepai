# Rotina semanal — newsletter, faixas de preço e Search Console

> Complemento da rotina diária (`ROTINA-DIARIA.md`). Parte roda sozinha em GitHub Actions; parte é uma Routine semanal
> do Claude Code ("Vocação de Pai: rotina semanal", **domingo 07:07 America/Sao_Paulo**, mesmas variáveis e conectores da
> diária). Até o fim da Fase 8 o dono mescla o PR.

## O que já roda sozinho (GitHub Actions, sem IA)

| Workflow | Quando | O que faz | Segredo / variável |
| --- | --- | --- | --- |
| `market-refresh.yml` | a cada 30 min | `POST /api/market/refresh` → `market_cache` (câmbio, Selic, índices) | `CRON_SECRET`, `vars.PUBLIC_SITE_URL` |
| `newsletter-weekly.yml` | domingo 08:00 BRT (+ manual com `dry_run`) | `POST /api/newsletter/weekly` → resumo semanal por fase do filho (Resend) | `CRON_SECRET`, `vars.PUBLIC_SITE_URL` |
| `event-reminder.yml` | de hora em hora | `GET /api/cron/event-reminder` → lembrete 24 h antes dos encontros | `CRON_SECRET`, `vars.PUBLIC_SITE_URL` |
| `jobs-expire.yml` | só manual | `POST /api/cron/expire-jobs` (rota da Fase 6; o agendamento é o pg_cron `vdp-expire-jobs`) | `CRON_SECRET` |
| `validate.yml` | push/PR em `main` + domingo 06:17 BRT | build, lint, typecheck, validador (seeds em `--files`; banco em `--since 7d`/`--all` quando houver secrets) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (opcionais) |

Antes do domingo, conferir no GitHub → Actions que `newsletter-weekly` e `validate` ficaram verdes na semana.
Se o resumo semanal falhar, reexecutar `newsletter-weekly.yml` à mão com `dry_run=false`.

## Prompt literal da Routine semanal

```text
Você é a rotina semanal do Vocação de Pai (vocacaodepai.com.br). Repositório vocacaodepai/vocacaodepai, Supabase
project_id <SUPABASE_PROJECT_REF>. Responda em português do Brasil. Leia CLAUDE.md (seções 4, 5 e 7) e
scripts/rotina/README.md. Nunca DROP/DELETE/TRUNCATE; UPDATE sempre curto; nunca preço exato; nunca segredo em commit ou resumo.

S0 (2 min) git fetch; git checkout -b claude/semanal-$(date +%F) origin/main; mkdir -p /tmp/rotina-pai supabase/rotina/$(date +%F);
   bash scripts/rotina/lisieux.sh inicio "Rotina semanal: início"; bash scripts/rotina/slugs.sh /tmp/rotina-pai/slugs.txt.
S1 (10 min) Newsletter: confira o último envio (select * from moderation_log where entity='newsletter' order by created_at desc limit 5;
   e o run de newsletter-weekly.yml). Se o resumo de domingo não saiu, dispare o workflow (gh workflow run newsletter-weekly.yml
   -f dry_run=false) e registre. Conte assinantes confirmados por segmento (select segments, count(*) from newsletter_subscribers
   where status='confirmed' group by 1) para o resumo.
S2 (30 min) Faixas de preço — revisão semanal (BRIEF_FAIXA_PRECO.md): python3 scripts/rotina/price_range.py fila 30 (primeiro os
   sem price_range_checked_at, depois os com mais de 60 dias). Para cada produto, WebSearch do MESMO item em 2+ lojas; só grave
   com 2 lojas e max <= 3 x min; achados.json → python3 scripts/rotina/price_range.py sql achados.json → aplique
   price_range_out.sql com mcp__Supabase__execute_sql e copie para supabase/rotina/<data>/. Sem confirmação: não grave.
   Confira depois: select count(*) from products where active and price_range_checked_at is null.
S3 (15 min) Pai Indica da semana: 1 review única OU 1 comparativo extra sobre o produto mais buscado da semana
   (seo_search_stats, consultas com "melhor", "vale a pena", "ou") seguindo BRIEF_REVIEW_UNICA_PAI.md / BRIEF_COMPARATIVO_PAI.md,
   com a review longa da loja antes (review_gen.py) e capa composta (cover_cmp.py).
S4 (10 min) Search Console: POST na edge function seo-search-console (header x-cron-secret = CRON_SECRET) com
   {"action":"sync","site_url":"sc-domain:vocacaodepai.com.br","days":28}. Liste as 10 páginas com mais impressões e menor CTR
   e as 10 consultas sem página correspondente; grave em /tmp/rotina-pai/seo-semana.md e inclua no resumo as 5 reformas e os 5
   temas sugeridos para a rotina diária da semana. Depois {"action":"notify_index","urls":[...]} com as URLs publicadas na semana.
S5 (8 min) Saúde do conteúdo: node scripts/validate-content.mjs --since 7d --images | tee /tmp/rotina-pai/validate-semana.log;
   corrija ou despublique (status='draft') o que reprovar; select count(*) from posts where status='published' and (subtitle is
   null or btrim(subtitle)='' or seo_description is null) deve ser 0; select count(*) from products where active and review is null
   (fila de reviews longas) para o resumo.
S6 (5 min) Commit (supabase/rotina/<data>/, public/images/covers/), git push -u origin HEAD, gh pr create --base main
   --title "semanal: <data>" --body "<resumo>". Grave o resumo em _tmp_post_staging (k='rotina:resumo:semanal:<data>');
   bash scripts/rotina/lisieux.sh fim.

RESUMO (<= 30 linhas, PT-BR): newsletter (enviada? quantos por segmento); faixas gravadas/puladas e quantos produtos ainda sem faixa;
Pai Indica da semana (slug, nota); Search Console (impressões/cliques da semana, 5 reformas e 5 temas sugeridos); validador;
link do PR; pendências. Sem segredo.
```
