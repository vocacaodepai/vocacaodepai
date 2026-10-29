# Fase 8 — Automação, rotinas e painel (fábrica de conteúdo do Vocação de Pai)

> Documento executável. Leitor: Claude Sonnet 5.5 (esforço médio) em sessões de Claude Code dentro de `/home/user/vocacaodepai`.
> Pré-requisitos: Fases 1 a 7 concluídas (site no ar na Vercel, Supabase `<SUPABASE_PROJECT_REF>` com as migrations 0001–0007 aplicadas, categorias e produtos iniciais carregados).
> Tudo em PT-BR. Decisões fixas do `BRIEF.md` e, se existir, `docs/plano/02-arquitetura-e-stack.md` prevalecem sobre qualquer coisa escrita aqui.

---

## 0. Índice

1. Visão da fábrica de conteúdo
2. Rotina diária (Claude Code Routine) — quantidades, ordem, tempos, erros
3. Regras de escrita no banco
4. Scripts em `scripts/rotina/` e BRIEFs (inclui `BRIEF_ARTIGO_PAI.md` completo)
5. Validador `scripts/validate-content.mjs` e CI
6. Imagens: cascata, licenças, pessoas reais, Vault, edge function `stock-photos`
7. Mercado financeiro: refresh a cada 30 min (YAML completo)
8. Newsletter: semanal = edge function `weekly-digest` (doc 07 §6.6, pg_cron) com os blocos novos da F8; diária = Jogada do Dia (`/api/newsletter/daily`)
9. Expiração de vagas (cron diário)
10. GitHub workflows completos (6 YAMLs)
11. Painel Lisieux (grupovdp): registrar o site e reportar status da rotina
12. Tabela de secrets
13. PROMPT COMPLETO DA ROTINA DIÁRIA (texto literal)
13b. Salvaguardas e entregas extras da Fase 8 (guard, e-mail ao dono, similaridade com o VDM, `/loja/ofertas`, `/anuncie`, backlog)
14. Critérios de aceite
15. Prompt para iniciar esta fase no Sonnet
16. Checklist de pronto

---

## 1. Visão da fábrica de conteúdo

O Vocação de Pai nasce com a mesma máquina que já roda no Vocação de Mãe (vocacaodemae.com.br), adaptada à voz do pai e às seções novas do site. A fábrica tem **cinco linhas de produção** e **três esteiras de manutenção**, todas disparadas uma vez por dia por uma única **Routine do Claude Code** (sem chave de API paga; usa a assinatura do Claude):

| Linha | O que produz | Para onde vai |
| --- | --- | --- |
| **Blog (Padrão A do Pai)** | 3 artigos informativos novos + 2 reformas de artigos finos | `posts` com `kind='artigo'` → `/post/$slug` |
| **Pai Indica** | 3 comparativos (`kind='comparativo'`) + 2 reviews únicas (`kind='review'`), todos com capa composta | `posts` → `/pai-indica/$slug` |
| **Loja do Pai** ("O pai também quer desconto") | 5 produtos novos com review longa + 10 reviews longas de produtos antigos | `products` → `/loja/$slug` |
| **Mercado do pai** | 1 notícia curta (`kind='noticia'`) sobre economia doméstica/trabalho/mercado | `posts` → `/post/$slug` na categoria `noticias` (slug do doc 02 §4.2) com a tag `serie:mercado-do-pai` |
| **Jogada do Dia** | 1 post curto por dia (80–120 palavras, 1 ação prática com o filho), gerados em lote de 30 na 1ª rodada do mês | `posts` com `kind='noticia'`, tag `serie:jogada-do-dia` → e-mail diário (§8.4) |

| Esteira | O que faz | Limite/dia |
| --- | --- | --- |
| **Faixa de preço** | Pesquisa o mesmo produto em ≥2 lojas e grava `price_min`/`price_max` | 15 produtos |
| **Fotos oficiais** | Troca fotos ruins pela galeria oficial da Amazon (`_AC_SL1500_`) | 20 produtos |
| **Moderação** | Aprova/rejeita a fila de `jobs`, `job_referrals`, `stories`, `questions` com status `pending` | toda a fila (só moderar; nunca criar vaga de exemplo) |

Além da rotina diária, há **automações sem IA**: em GitHub Actions, refresh do mercado financeiro (30 min), envio diário da Jogada do Dia (§8.4), expiração de vagas (diário) e auto-merge dos PRs `claude/*` após o deploy da Vercel; no Supabase, o resumo semanal da newsletter — edge function `weekly-digest` + pg_cron, **criada na Fase 5** (doc 07 §6.6); a Fase 8 só acrescenta blocos ao template (§8). E um **validador** (`scripts/validate-content.mjs`) que roda no CI e dentro da rotina, bloqueando conteúdo fora do padrão antes do PR.

Princípios herdados do grupo (não negociáveis):
- Linha editorial católica de família tradicional; tom direto, masculino, respeitoso, prático; sem vulgaridade e sem machismo tóxico.
- Botão de afiliado sempre **"Comprar agora na Amazon"**. Preço sempre **faixa** pesquisada na internet (2 lojas, `max ≤ 3×min`), nunca exato, nunca "R$" digitado no texto.
- Nunca inventar especificação, nota, número de avaliações, tendência ou fonte.
- Nunca `DROP`/`DELETE` na rotina. `INSERT` direto; reforma via `_tmp_post_staging` + `UPDATE` curto.
- O site é só PT-BR.

---

## 2. Rotina diária (Claude Code Routine)

### 2.1 Identidade

- Nome da Routine em claude.ai/code → Routines: **"Vocação de Pai: rotina diária"**.
- Repositório: `vocacaodepai/vocacaodepai`, branch base `main`, branch de trabalho `claude/rotina-AAAA-MM-DD`.
- Horário: **05:37 (America/Sao_Paulo)** todos os dias (minuto quebrado para fugir do pico). Se a rodada estourar o tempo, uma segunda Routine idêntica às **13:37** é permitida, desde que leia a fila (`SELECT` antes de repetir) e não duplique.
- Agente no Painel Lisieux: `rt-vocacaodepai` (nome "Bruno", ver §11).

### 2.2 Quantidades por dia (fixas)

| # | Item | Quantidade | Gerador | Kind / tabela |
| --- | --- | --- | --- | --- |
| 1 | Artigos Padrão A do Pai novos | 3 | `art_gen.py` | `posts.kind='artigo'` |
| 2 | Reformas de artigos finos (< 900 palavras ou < 10 links) | 2 | `art_gen.py --reforma` | `posts` (staging + UPDATE) |
| 3 | Pai Indica comparativos | 3 | `cmp_gen.py` + `cover_cmp.py` | `posts.kind='comparativo'` |
| 4 | Pai Indica reviews únicas | 2 | `rev_art_gen.py` + `cover_cmp.py` | `posts.kind='review'` |
| 5 | Produtos novos na Loja do Pai (com review longa) | 5 (os dos itens 3 e 4 contam; completar até 5) | `review_gen.py --novo` | `products` INSERT |
| 6 | Reviews longas de produtos antigos | 10 | `review_gen.py` | `products.review` (staging + UPDATE) |
| 7 | Faixas de preço | 15 | `price_range.py` + WebSearch | `products.price_min/max` |
| 8 | Fotos oficiais | 20 | `photo_upgrade.py 20` | `products.image_url/images` |
| 9 | Temas em alta (dentro dos itens 1, 3 e 4) | ≥ 2, com fonte datada ≤ 14 dias | — | — |
| 10 | Notícia "Mercado do pai" | 1 | `news_gen.py` | `posts.kind='noticia'`, categoria `noticias` + tag `serie:mercado-do-pai` |
| 11 | Moderação da fila | toda a fila `pending` | SQL curto | `jobs`, `job_referrals`, `stories`, `questions`, `moderation_log` |
| 12 | Search Console | 1 sync + `notify_index` dos slugs novos | edge function `seo-search-console` | `seo_search_stats` |
| 13 | PR + resumo | 1 PR `claude/rotina-*` com capas e SQL; resumo em PT-BR | `gh pr create` | — |
| 14 | Jogada do Dia | 1 (30 por mês, gerados em lote na 1ª rodada do mês) | `jogada_gen.py` | `posts.kind='noticia'`, tag `serie:jogada-do-dia`, 80–120 palavras, 1 link interno |

### 2.3 Ordem exata de execução (com limites de tempo)

Tempo total alvo: **≤ 150 min**. Cada etapa tem um teto; estourou, pula para a próxima e registra no resumo.

| Etapa | Ação | Teto |
| --- | --- | --- |
| E0 | `git fetch && git checkout -b claude/rotina-$(date +%F) origin/main`; **salvaguarda** (§13b-a): `select data from public._tmp_post_staging where k='rotina:status'` — se contiver `"rotina_pausada":true`, não produzir nada, registrar no resumo e encerrar; `node scripts/agente.mjs inicio rt-vocacaodepai "Rotina diária: início" <COMPANY_ID_VDP>` (id de empresa do §11.1 item 7; ou o SQL do §11.3) | 2 min |
| E1 | **Search Console**: `POST` na edge function `seo-search-console` com `{"action":"sync","site_url":"sc-domain:vocacaodepai.com.br","days":28}` (header `x-seo-sync-secret`). Ler `seo_search_stats`: páginas com impressões altas e CTR baixo viram candidatas a reforma; consultas sem página viram temas. | 5 min |
| E2 | **Temas em alta**: WebSearch (pt-BR, últimos 14 dias) sobre paternidade, homens, família, trabalho, finanças domésticas, churrasco/carnes, ferramentas, saúde do homem, datas (Dia dos Pais, volta às aulas, Black Friday, Natal). Escolher ≥ 2 temas com fonte datada. | 8 min |
| E3 | **Planejamento**: escolher 3 temas Padrão A (categorias diferentes), 2 reformas (query do §2.5), 3 comparativos e 2 reviews únicas (produtos reais com ASIN; nenhum já coberto nos últimos 60 dias). Gravar o plano em `/tmp/rotina-pai/plano.json`. | 5 min |
| E4 | **Loja primeiro**: para cada produto dos comparativos e reviews únicas: `amz.py ASIN`, pesquisa de faixa (`price_range.py`), fotos, `review_gen.py` (novo ou existente). Aplicar SQL. Até 5 produtos novos. | 35 min |
| E5 | **Pai Indica**: `cover_cmp.py` (capa composta) → JSON → `cmp_gen.py` / `rev_art_gen.py` → "OK" → `INSERT`. 3 comparativos + 2 reviews únicas. Pode rodar em até 5 subagentes em paralelo (1 por artigo), cada um lendo o BRIEF correspondente. | 35 min |
| E6 | **Blog Padrão A**: 3 novos (`art_gen.py`) + 2 reformas (`art_gen.py --reforma`). Até 5 subagentes em paralelo, cada um com `BRIEF_ARTIGO_PAI.md`. | 30 min |
| E7 | **Notícia Mercado do pai**: `news_gen.py` (1 item, 350–600 palavras, fonte datada ≤ 48h, categoria `noticias` + tag `serie:mercado-do-pai`). **Só na 1ª rodada do mês** (`date +%d` = 01, ou quando `select count(*) from posts where slug like 'jogada-do-dia-' || to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM') || '%'` = 0): `BRIEF_JOGADA.md` + `jogada_gen.py` geram as 30 Jogadas do Dia do mês (§4.7), um INSERT por dia com `publish_at` escalonado. | 6 min (+10 min na 1ª rodada do mês) |
| E8 | **Reviews longas antigas**: fila de 10 (query do `BRIEF_REVIEW.md`), `review_gen.py` por produto, staging + UPDATE curto. | 20 min |
| E9 | **Faixa de preço**: até 15 produtos (`price_range_checked_at is null` primeiro; depois > 60 dias). | 10 min |
| E10 | **Fotos oficiais**: `python3 scripts/rotina/photo_upgrade.py 20`; aplicar `photo_upgrade_out.sql` linha a linha. | 8 min |
| E11 | **Moderação**: aprovar/rejeitar `pending` em `jobs`, `job_referrals`, `stories`, `questions` com as regras do §2.6; registrar em `moderation_log`. | 5 min |
| E12 | **Validação**: `node scripts/validate-content.mjs --since 24h --images --similaridade | tee /tmp/rotina-pai/validate.log`; corrigir ou despublicar (`status='draft'`) o que falhar; depois `node scripts/rotina/guard.mjs /tmp/rotina-pai/validate.log '<status atual>'` e aplicar `guard_out.sql` (§13b-a). Conferir `select count(*) from posts where status='published' and (seo_description is null or btrim(seo_description)='')` = 0. | 6 min |
| E13 | **Search Console notify_index** com as URLs novas/reformadas. | 2 min |
| E14 | **PR**: commitar `public/images/covers/*.jpg` e `supabase/rotina/AAAA-MM-DD/*.sql`; `gh pr create --base main --title "rotina: AAAA-MM-DD" --body "<resumo>"`. O auto-merge cuida do resto. | 3 min |
| E15 | Gravar o resumo em `_tmp_post_staging` (`k='rotina:resumo:AAAA-MM-DD'`, `data` = texto do resumo; `insert … on conflict (k) do update`) para o e-mail semanal ao dono (§13b-b); `node scripts/agente.mjs fim rt-vocacaodepai`; resumo final em PT-BR (≤ 40 linhas). | 1 min |

Entre as etapas longas (E4, E5, E6, E8) atualizar o status do Lisieux com a tarefa atual (`agente.mjs inicio rt-vocacaodepai "E5: Pai Indica 2/5"`), porque o escritório devolve ao descanso quem fica > 90 min sem aviso.

### 2.4 O que fazer em erro

| Situação | Ação |
| --- | --- |
| Amazon bloqueou (`amz.py` devolveu `error`) | Repetir uma vez após 60 s; se persistir, trocar o produto por outro do plano (nunca inventar ficha). |
| `execute_sql` deu timeout | **Não repetir às cegas.** `select slug from posts where slug='…'` (ou `products`). Se existe, seguir; se não, repetir uma vez. |
| Reforma falhou 2 vezes | Pular o artigo (o texto antigo continua no ar) e registrar no resumo. |
| Gerador não imprimiu "OK" após 3 correções | Descartar o item, registrar o motivo. |
| Capa composta falhou (foto < 15 KB, HTTP ≠ 200) | Trocar por outra foto da galeria `images[]`; sem foto válida → trocar o produto. |
| Faixa de preço sem 2 lojas | Não gravar nada (fica a estimativa). |
| Fonte do tema em alta não encontrada (≤ 14 dias) | Não é tema em alta; escrever tema perene e dizer no resumo. |
| Validador reprovou um post publicado | `update posts set status='draft' where slug='…'` (UPDATE curto, permitido) e corrigir no dia seguinte. |
| Edge function `seo-search-console` 403/500 | Registrar e seguir; priorizar por backlog (`docs/plano/12-backlog-de-conteudo.md`). |
| Vercel check vermelho no PR | Ler o log (`mcp__Vercel__get_deployment`), corrigir, `git push`. É trabalho da rotina, não do dono. |
| Qualquer etapa estourou o teto | Encerrar a etapa, registrar o que ficou pendente (a fila é consultada por `SELECT`, então o dia seguinte continua). |

### 2.5 Queries de fila (copiar e usar)

```sql
-- Artigos finos para reforma (2 por dia): poucos links internos ou poucas palavras
select p.slug, p.title, c.slug as categoria,
       array_length(regexp_split_to_array(coalesce(p.search_content::text,''), '\s+'),1) as palavras,
       (select count(*) from jsonb_path_query(p.body, 'strict $.**.marks[*] ? (@.type == "link")')) as links
from posts p join categories c on c.id = p.category_id
where p.status = 'published' and p.kind = 'artigo'
  and (array_length(regexp_split_to_array(coalesce(p.search_content::text,''), '\s+'),1) < 900
       or (select count(*) from jsonb_path_query(p.body, 'strict $.**.marks[*] ? (@.type == "link")')) < 10)
order by p.updated_at asc limit 2;

-- Produtos sem review longa (10 por dia): primeiro os que aparecem em Pai Indica
with em_pi as (
  select distinct mo->>'slug' as s
  from posts p, jsonb_array_elements(p.body->'content') n,
       jsonb_array_elements(n->'attrs'->'data'->'modelos') mo
  where p.kind in ('comparativo','review','lista') and p.status='published' and n->>'type'='fotosModelos')
select x.slug, x.name, x.affiliate_url, x.asin
from products x
where x.active and (x.review is null or jsonb_typeof(x.review) <> 'object')
order by (x.slug in (select s from em_pi)) desc, x.featured desc, x.sort_order
limit 10;

-- Faixa de preço (15 por dia)
select slug, name, brand, asin from products
where active and price_range_checked_at is null
order by featured desc, sort_order limit 15;
-- quando zerar:
select slug, name, brand, asin from products
where active and price_range_checked_at < now() - interval '60 days'
order by price_range_checked_at asc limit 15;

-- Produtos já cobertos em Pai Indica nos últimos 60 dias (não repetir)
select distinct mo->>'slug' from posts p, jsonb_array_elements(p.body->'content') n,
  jsonb_array_elements(n->'attrs'->'data'->'modelos') mo
where p.kind in ('comparativo','review') and p.publish_at > now() - interval '60 days' and n->>'type'='fotosModelos';

-- Fila de moderação
select 'job' as t, id::text, title, created_at from jobs where status='pending'
union all select 'referral', id::text, title, created_at from job_referrals where status='pending'
union all select 'story', id::text, title, created_at from stories where status='pending'
union all select 'question', id::text, title, created_at from questions where status='pending'
order by created_at;
```

### 2.6 Regras de moderação (só moderar; nunca criar vaga de exemplo)

Aprovar (`status='approved'`, `moderated_by = <id do admin da rotina>`, `moderated_at=now()`) quando: título e descrição claros; sem palavrão, golpe ("pague taxa para se candidatar"), pirâmide, conteúdo adulto, discriminação ou contato inválido; `expires_at` ≤ 45 dias (se nulo, definir `now() + interval '30 days'`); UF válida. Rejeitar (`status='rejected'`) nos demais casos, com `note` em `moderation_log`. Em dúvida: deixar `pending` e listar no resumo para o dono — o resumo diário é gravado em `_tmp_post_staging` (E15) e chega ao dono pelo e-mail semanal do §13b-b, que também traz a contagem da fila `pending`. Um UPDATE curto por registro:

```sql
update jobs set status='approved', moderated_by='<ADMIN_UUID>', moderated_at=now(),
       expires_at = coalesce(expires_at, now() + interval '30 days'), updated_at=now()
 where id='<id>' and status='pending' returning slug;
insert into moderation_log (actor_id, entity, entity_id, action, note)
values ('<ADMIN_UUID>','jobs','<id>','approved','rotina diária');
```

---

## 3. Regras de escrita no banco (herdadas do CLAUDE.md do Vocação de Mãe)

O conector Supabase pede confirmação manual para `DROP`, `DELETE` e `UPDATE` que troca um `body` grande; na rotina ninguém aprova, a chamada espera 60 s e falha. `INSERT` não pede confirmação.

1. **Artigo/produto novo** → um único `INSERT` por registro, com o JSON em `$body$…$body$::jsonb`. Idempotente: `on conflict (slug) do nothing`.
2. **Reforma (post ou review de produto)** → duas etapas:
   ```sql
   insert into public._tmp_post_staging (k, data) values ('<slug>', $stg$<json>$stg$)
     on conflict (k) do update set data = excluded.data;
   update posts p set body = s.data::jsonb, excerpt = '<excerpt>',
          search_content = to_tsvector('portuguese', (select string_agg(t #>> '{}', ' ') from jsonb_path_query(s.data::jsonb, 'strict $.**.text') t)),
          reading_time = ceil(array_length(regexp_split_to_array((select string_agg(t #>> '{}', ' ') from jsonb_path_query(s.data::jsonb, 'strict $.**.text') t), '\s+'),1) / 200.0),
          updated_at = now()
     from public._tmp_post_staging s
    where s.k = '<slug>' and p.slug = '<slug>' and md5(s.data) = '<md5 do json>';
   ```
   Para `products.review`: `k = 'review:<slug>'` e `update products set review = s.data::jsonb, pros=…, cons=…, updated_at=now() from _tmp_post_staging s where …`.
3. **Nunca** `DROP` nem `DELETE`. Para "remover", `status='archived'`/`active=false`.
4. **Nunca** montar `body` em pedaços com vários `UPDATE` (se travar no meio, o artigo fica pela metade no site).
5. **Sempre `SELECT` antes de repetir** uma escrita que deu timeout.
6. `_tmp_post_staging` (RLS ativa, sem acesso público) é permanente — não limpar.
7. `search_content` é `tsvector` (ver 02): preencher com `to_tsvector('portuguese', …)` como acima. Se a coluna for mantida por trigger no 02, o gerador omite.
8. Todo post da rotina sobe **publicado**: `status='published'`, `publish_at=now()`, `author_id = <AUTHOR_UUID>` (perfil "Equipe Vocação de Pai", `role='editor'`, criado na Fase 1).
9. SQL gerado fica commitado em `supabase/rotina/AAAA-MM-DD/<slug>.sql` para histórico; a aplicação real é via `mcp__Supabase__execute_sql` (`project_id = <SUPABASE_PROJECT_REF>`), colando o arquivo inteiro, byte a byte.

---

## 4. Scripts em `scripts/rotina/` e BRIEFs

Copiar de `/home/user/vocacaodemae/scripts/rotina/` e adaptar. **Mudanças comuns a todos:** URL/chave lidas de `SUPABASE_URL` e `SUPABASE_ANON_KEY` (env) com fallback para `src/integrations/supabase/client.ts`; `AUTHOR` e categorias por slug (consultar `categories` pela REST em vez de UUID fixo); coluna `kind` sempre preenchida; `seo_title`/`seo_description` (não `seo_meta_*`); cache da Amazon em `/tmp/amzcache-pai`; diretório de trabalho `/tmp/rotina-pai/`.

### 4.1 Tabela de scripts

| Script | Entrada | Saída | O que muda em relação ao vocacaodemae |
| --- | --- | --- | --- |
| `art_gen.py` (une `artigo/gen.py` + `rgen.py` + `helpers.py`) | `arquivo.json` (esquema §4.2); `--reforma` | `<slug>.insert.sql` **ou** `<slug>.stg.sql` + `<slug>.upd.sql` | Semáforo do pai ("Sinal verde/atenção/alerta"); `kind='artigo'`; checklist termina em "Ficar atento aos sinais do semáforo acima"; `check` exige ≥10 links para slugs reais (`/post/`, `/pai-indica/`, `/loja/`, `/ferramentas/`, `/formacao/`); recusa "R$" no texto e termos proibidos (§5.3) |
| `cmp_gen.py` | `arquivo.json` (esquema do `BRIEF_COMPARATIVO.md` do VDM, com `kind`) | `<slug>.insert.sql` | `kind='comparativo'`; `comparison` jsonb preenchido com `{produtos:[{slug,nome,score}], vencedor, criterios}`; `product_category`/`product_subcategory` obrigatórios; `product_score` = nota do vencedor; links para `/pai-indica/<slug>`; `cover_image_url` deve existir em `public/images/covers/` |
| `rev_art_gen.py` | `arquivo.json` (esquema do `BRIEF_REVIEW_UNICA.md`) | `<slug>.insert.sql` | `kind='review'`; `review` jsonb `{nota, criterios[5], ideal_para, pros, cons}`; `product_score = nota`; exige `products.review` do produto já gravado |
| `review_gen.py` | `arquivo.json` (`novo: true/false`) | INSERT ou stg+upd (`k='review:<slug>'`) | Colunas do BRIEF: `asin`, `affiliate_network='amazon'`, `marketplace_urls`, `category_id` por slug de `product_categories`, `subcategory`; FAQ `{q,a}`; tom de pai |
| `cover_cmp.py` | `<slug> "Nome=url" …` (1–3) | `public/images/covers/<slug>.jpg` 1280×720 | **Cores do Vocação de Pai**: degradê areia `#F4EFE6` → `#E4D9C8`; cartões brancos com sombra; nome em grafite `#1F2429`; faixa inferior de 10 px em azul-petróleo `#14505C` com detalhe âmbar `#D9822B`; fonte Barlow Condensed se disponível em `public/fonts/`, senão DejaVuSans-Bold |
| `amz.py` | `ASIN [--tries N] [--refresh]` | JSON (title, images[8], bullets, details, rating, reviews, price, available) | Só o cache (`/tmp/amzcache-pai`) |
| `photo_upgrade.py` | `N [OFFSET]` | `photo_upgrade_out.sql`, `photo_upgrade_log.txt` | Base da REST; usa `products.asin` quando existe, senão extrai de `affiliate_url` |
| `price_range.py` (novo) | `--fila N` ou `--slug s --lojas "ML=199.90,Magalu=249.00"` | `price_range_out.sql` (um UPDATE pequeno por produto) e checklist de busca | Novo: imprime as consultas de WebSearch sugeridas por produto e valida `max ≤ 3×min`, ≥2 lojas, mesma marca/modelo; grava também `product_price_checks` |
| `news_gen.py` (novo) | `arquivo.json` (§4.4) | `<slug>.insert.sql` | Novo: `kind='noticia'`, categoria `noticias` + tag `serie:mercado-do-pai` em `post_tags`, 350–600 palavras, fonte datada ≤ 48 h obrigatória com link externo, 3+ links internos, sem semáforo |
| `jogada_gen.py` (novo) | `arquivo.json` com as jogadas do mês (§4.7) | `jogada-do-dia-AAAA-MM-DD.insert.sql` (um por dia) | Novo: `kind='noticia'`, categoria `noticias`, tags `serie:jogada-do-dia` + `fase-*`, 80–120 palavras, exatamente 1 link interno real, `publish_at` = dia correspondente às 06:00 BRT |
| `guard.mjs` (novo) | `validate.log` + status atual | `guard_out.sql` | Novo (§13b-a): conta reprovações seguidas do validador e pausa a rotina na 3ª (`_tmp_post_staging`, `k='rotina:status'`) |
| `slugs.sh` | — | `slugs.txt` (posts, produtos, ferramentas, trilhas publicados) | Inclui `/pai-indica/`, `/loja/`, `/ferramentas/`, `/formacao/`; os slugs de ferramenta vêm de `TOOLS` em `src/lib/tools/registry.ts` (`grep -o 'slug: "[a-z0-9-]*"' src/lib/tools/registry.ts`), não de arquivos de rota — a rota é única, `/ferramentas/$slug` (doc 06) |
| `README.md` | — | — | Tabela igual a esta |

BRIEFs em `scripts/rotina/`: `BRIEF_ARTIGO_PAI.md` (§4.2, completo), `BRIEF_COMPARATIVO.md`, `BRIEF_REVIEW_UNICA.md`, `BRIEF_REVIEW.md` (os três copiados do VDM, com as substituições do §4.3), `BRIEF_NOTICIA.md` (§4.4) e `BRIEF_JOGADA.md` (§4.7).

### 4.2 `scripts/rotina/BRIEF_ARTIGO_PAI.md` (texto completo — gravar como está)

```markdown
# Briefing: artigo Padrão A do Pai (novo ou reforma)

Você escreve UM artigo informativo do blog Vocação de Pai (vocacaodepai.com.br) e o grava no banco.
Responda sempre em português do Brasil. Nunca use DROP/DELETE. Projeto Supabase: `<SUPABASE_PROJECT_REF>`.
Público: homens que são pais (ou vão ser), maridos, provedores. Voz: direta, masculina, respeitosa,
prática, com humor seco quando couber; sem vulgaridade, sem machismo tóxico, sem autoajuda vazia.
Visão católica de família tradicional (homem e mulher, pai e mãe). Nunca conteúdo ou imagem LGBTQI.

## Ferramentas (em `scripts/rotina/`)
- `art_gen.py`: `python3 scripts/rotina/art_gen.py arquivo.json` (novo) gera `<slug>.insert.sql`;
  `python3 scripts/rotina/art_gen.py --reforma arquivo.json` gera `<slug>.stg.sql` + `<slug>.upd.sql`.
  Ele valida: palavras, links reais, semáforo, "R$", termos proibidos, capa ≠ inline.
- `slugs.sh`: `bash scripts/rotina/slugs.sh /tmp/rotina-pai/slugs.txt` grava os slugs publicados
  (posts, /pai-indica, /loja, /ferramentas, /formacao) usados na validação dos links.
- `exemplo_artigo.json`: artigo completo de referência (copie a estrutura).
- Trabalhe em `/tmp/rotina-pai/` (crie se não existir).

## Estrutura obrigatória do `body` (Tiptap JSON), nesta ordem
1. Abertura: 2 parágrafos sem heading. O 1º dá o contexto (a situação do pai). O 2º diz o que o artigo
   vai resolver e já traz 1 link interno.
2. Seções com `heading` nível 2 em forma de frase ou pergunta ("O que muda no sono do pai no 1º mês",
   "Vale a pena comprar uma parrilla?"). Cada seção: 1 ou 2 parágrafos curtos, ou uma `bulletList`
   seguida de 1 parágrafo com link. Mínimo 5 seções.
3. Semáforo do pai (obrigatório quando houver risco, sintoma, segurança, dinheiro ou "quando pedir ajuda"):
   - `heading` nível 2 "Semáforo do pai — <tema>: o que é esperado, o que observar e quando agir";
   - EXATAMENTE 3 blocos `callout`, nesta ordem:
     `tone: "ok"`   → texto começa por "Sinal verde: ";
     `tone: "warn"` → texto começa por "Sinal de atenção: ";
     `tone: "bad"`  → texto começa por "Sinal de alerta: " e termina com a orientação concreta
                      (procurar médico/pediatra, parar a obra, falar com o advogado, chamar o eletricista...).
   - Sem link dentro do callout; sem 4º callout em outro ponto.
4. Listas: `bulletList` por padrão; `orderedList` só para passo a passo real (receita, montagem, instalação).
5. Links internos contextuais: MÍNIMO 10 por artigo, para slugs REAIS (confira em slugs.txt), tecidos no
   meio das frases ao longo do texto. Vale `/post/<slug>`, `/pai-indica/<slug>`, `/loja/<slug>`,
   `/ferramentas/<slug>`, `/formacao/<slug>`. Os do "Continue lendo" contam, mas sozinhos não bastam.
   Formato: `marks: [{type:"link", attrs:{href:"/post/<slug>", class:null, rel:null, target:null}}]`.
6. Imagem inline (opcional, 0 a 2): bloco `image` com `attrs:{src, alt, title:null}`. NUNCA repetir a capa
   (comparar URL sem o `?`). Foto nova, do assunto da seção, não usada em outro post. Ver regra de imagens.
7. Tabela (`table` > `tableRow` > `tableHeader`/`tableCell`) com colunas do tema, sob um heading nível 2
   (ex.: "Corte / Para que serve / Tempo na grelha").
8. Checklist: `taskList` com 5 ou 6 `taskItem` (`attrs:{checked:false}`), itens curtos sem ponto final, sob o
   heading "Checklist do pai: <tema>"; o último é "Ficar atento aos sinais do semáforo acima" quando houver semáforo.
9. Fechamento: 1 parágrafo de reforço, firme e encorajador, sem links; depois 1 parágrafo "Continue lendo: "
   com 4 a 10 links, texto = título do post com inicial maiúscula, separados por ", " e o último com " e ", fim em ".".

`faq` (mínimo 4, `{question, answer}`) e `quiz` (5, `{question, options[4], answer (índice), explanation}`)
são colunas separadas. `kind = 'artigo'`. `seo_title` ≤ 60 caracteres; `seo_description` 120–155 caracteres.

## Tamanho e qualidade
- 1100 a 1400 palavras no novo; na reforma, ≥ 1100.
- Fatos com fonte (site oficial, lei, SBP, Ministério da Saúde, Inmetro, fabricante, IBGE). Sem diagnóstico,
  sem dose de remédio, sem promessa de resultado. Sempre orientar a procurar o profissional certo.
- Dinheiro: nunca valor em reais no texto. Para produto da loja use `{FAIXA:slug}`; para outras quantias use
  ordem de grandeza ("algumas centenas de reais") ou percentuais.
- Pode citar produtos da Loja do Pai (`/loja/<slug>`) e comparativos (`/pai-indica/<slug>`) só se o slug existir.

## Linha editorial (obrigatória)
Família = homem e mulher. Pai como marido, provedor, educador e líder servidor. Respeito à esposa sempre.
Proibidos: conteúdo/imagem LGBTQI; vulgaridade; piada com a esposa; "macho alfa", "red pill", "mulher tem que";
apostas/bet; conteúdo adulto; dica de "pegar mulher". Nunca usar a categoria Fé e virtudes (`fe-e-virtudes`) para artigo da rotina
(ela é editorial, escrita pelo dono).

## Categorias do blog (slugs do seed de `categories`, doc 02 §4.2)
paternidade, casamento-e-familia, financas-da-familia, carreira-e-trabalho, saude-do-homem, churrasco-e-cozinha,
casa-carro-e-ferramentas, fe-e-virtudes (só o dono), pai-indica (só reviews), noticias (só notícias e Jogada do Dia;
"Mercado do pai" é série, marcada pela tag `serie:mercado-do-pai`). Confirme com `select slug from categories` antes de usar.
Fase do filho é tag (`fase-<slug>` ou `fase-todas`, doc 07 §3.1), nunca categoria: todo artigo da rotina leva ao menos uma.

## Fontes e imagens
- Capa (só novo): cascata Wikimedia → Pexels → Pixabay via edge function `stock-photos`
  (`POST {query, source, per_page}`), ou `mcp__Unsplash__search_photos` quando disponível. Preferir: homem sozinho,
  pai com filho(a), objeto, cena de trabalho/cozinha/oficina. Nunca "casal" genérico sem conferir. Checar licença
  (Wikimedia: só CC0/CC BY/CC BY-SA com atribuição no `alt`/`title`). Não repetir nenhuma capa já usada:
  `select cover_image_url from posts`.
- Produto físico: só foto oficial da Amazon (`amz.py`, `_AC_SL1500_`, HTTP 200 e > 15 KB).

## Temas em alta (≥ 2 por dia, somando artigos e Pai Indica)
1. WebSearch (pt-BR, ≤ 14 dias): Google Trends BR em paternidade/família/homem, notícias (licença-paternidade,
   INSS, IR, reajustes, recall Inmetro/Anvisa, saúde do homem, Novembro Azul, campanhas), virais em grupos de pais,
   sazonalidade (Dia dos Pais, férias, volta às aulas, Black Friday, Natal, churrasco de fim de ano).
2. Confirmar com ≥ 1 fonte datada (≤ 14 dias) citada no texto com data e link externo confiável. Sem fonte,
   não é tema em alta.
3. Tom sereno e útil; nunca alarmista. No resumo, listar quais itens foram "tema em alta" e a fonte.

## Reforma
Mantém id, slug, categoria, publish_at e capa; reescreve body/excerpt/faq/seo_description pelo staging
(INSERT em `_tmp_post_staging` + UPDATE curto com md5). Nunca mande o body inteiro dentro de um UPDATE.
Antes, leia o body atual (`select body from posts where slug='…'`) e preserve o que é bom.

## Aplicar no banco
`mcp__Supabase__execute_sql` (project_id `<SUPABASE_PROJECT_REF>`), SQL VERBATIM do arquivo. Novo = 1 chamada
(INSERT). Reforma = 2 chamadas (stg, depois upd). Depois confira:
`select slug, kind, status, array_length(regexp_split_to_array(search_content::text,'\s+'),1) from posts where slug='…'`.
Timeout → SELECT antes de repetir. Reforma falhou 2× → desista e relate.

## Entrega
Salve o SQL em `/tmp/rotina-pai/` e copie para `supabase/rotina/<AAAA-MM-DD>/`. Informe: slug, título, categoria,
nº de palavras, nº de links, se foi tema em alta (fonte), caminho do(s) .sql e ressalvas. NÃO faça git (a rotina faz).
```

Esquema do JSON que `art_gen.py` consome (igual ao `artigo/gen.py` do VDM, com campos novos):

```json
{
  "slug": "primeiro-mes-do-bebe-o-que-o-pai-precisa-saber",
  "title": "Primeiro mês do bebê: o que o pai precisa saber",
  "excerpt": "Até 155 caracteres.",
  "seo_title": "até 60 caracteres",
  "seo_description": "120 a 155 caracteres",
  "category": "paternidade",
  "kind": "artigo",
  "cover": "https://…",
  "cover_alt": "Pai segurando o filho recém-nascido",
  "body": { "type": "doc", "content": [ "…nós Tiptap conforme §4.2…" ] },
  "faq": [ {"question": "…", "answer": "…"} ],
  "quiz": [ {"question": "…", "options": ["a","b","c","d"], "answer": 0, "explanation": "…"} ],
  "tema_em_alta": {"fonte": "https://…", "data": "2026-10-20"}
}
```

Esqueleto do `art_gen.py` (pontos que diferem do VDM; o restante é cópia de `helpers.py`/`gen.py`/`rgen.py`):

```python
#!/usr/bin/env python3
"""Padrão A do Pai: valida o JSON e gera INSERT (novo) ou stg+upd (--reforma)."""
import sys, os, json, re, hashlib, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__))
URL = os.environ.get("SUPABASE_URL") or re.search(r'https://[a-z0-9]+\.supabase\.co', open(os.path.join(HERE,"..","..","src","integrations","supabase","client.ts")).read()).group(0)
KEY = os.environ.get("SUPABASE_ANON_KEY") or re.search(r'"(eyJ[A-Za-z0-9._-]+)"', open(os.path.join(HERE,"..","..","src","integrations","supabase","client.ts")).read()).group(1)
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
PROIBIDOS = ["macho alfa","red pill","aposta","bet365","lgbt","casal gay","mulher tem que"]
SEMAFORO = [("ok","Sinal verde: "),("warn","Sinal de atenção: "),("bad","Sinal de alerta: ")]

def get(path): return json.load(urllib.request.urlopen(urllib.request.Request(URL+"/rest/v1"+path, headers=H), timeout=60))
def texts(n, out):  # igual ao cmp_gen.py
    ...
def check(a, slugs):
    err = []
    t = " ".join(texts(a["body"], []))
    w = len(t.split())
    if w < 1100: err.append(f"{w} palavras (< 1100)")
    if re.search(r"R\$\s?\d", t): err.append("valor em reais no texto")
    for p in PROIBIDOS:
        if p in t.lower(): err.append(f"termo proibido: {p}")
    links = {m["attrs"]["href"] for m in _marks(a["body"]) if m["type"]=="link"}
    internos = {l for l in links if l.startswith("/")}
    if len(internos) < 10: err.append(f"{len(internos)} links internos (< 10)")
    for l in internos:
        if l not in slugs: err.append(f"link para slug inexistente: {l}")
    cal = [n for n in _nodes(a["body"]) if n["type"]=="callout"]
    if cal:
        if len(cal) != 3: err.append("semáforo precisa de exatamente 3 callouts")
        for n,(tone,pref) in zip(cal, SEMAFORO):
            if n["attrs"].get("tone")!=tone or not _first_text(n).startswith(pref): err.append(f"callout fora da ordem/prefixo: {pref}")
    cover = a["cover"].split("?")[0]
    for n in _nodes(a["body"]):
        if n["type"]=="image" and n["attrs"]["src"].split("?")[0]==cover: err.append("capa repetida no corpo")
    if len(a.get("faq",[])) < 4: err.append("faq < 4")
    if not (120 <= len(a.get("seo_description","")) <= 155): err.append("seo_description fora de 120-155")
    return err, w, len(internos)

def insert_sql(a, cat_id, author):
    b = json.dumps(a["body"], ensure_ascii=False, separators=(",",":")); assert "$body$" not in b
    q = lambda s: s.replace("'","''")
    return (f"insert into posts (slug,title,excerpt,body,cover_image_url,category_id,author_id,kind,faq,quiz,status,publish_at,reading_time,search_content,seo_title,seo_description)\n"
            f"select '{a['slug']}','{q(a['title'])}','{q(a['excerpt'])}',x.b,'{a['cover']}','{cat_id}','{author}','artigo',"
            f"$body${json.dumps(a['faq'],ensure_ascii=False)}$body$::jsonb,$body${json.dumps(a['quiz'],ensure_ascii=False)}$body$::jsonb,"
            f"'published',now(),ceil(array_length(regexp_split_to_array(x.t,'\\s+'),1)/200.0),to_tsvector('portuguese',x.t),'{q(a['seo_title'])}','{q(a['seo_description'])}'\n"
            f"from (select b, (select string_agg(t #>> '{{}}',' ') from jsonb_path_query(b,'strict $.**.text') t) as t from (select $body${b}$body$::jsonb as b) y) x\n"
            f"on conflict (slug) do nothing;\n")

def reforma_sql(a):
    b = json.dumps(a["body"], ensure_ascii=False, separators=(",",":")); m = hashlib.md5(b.encode()).hexdigest()
    stg = f"insert into public._tmp_post_staging (k,data) values ('{a['slug']}', $stg${b}$stg$) on conflict (k) do update set data=excluded.data;\n"
    upd = (f"update posts p set body=s.data::jsonb, excerpt='{a['excerpt'].replace(chr(39),chr(39)*2)}', faq=$f${json.dumps(a['faq'],ensure_ascii=False)}$f$::jsonb, "
           f"seo_description='{a['seo_description'].replace(chr(39),chr(39)*2)}', search_content=to_tsvector('portuguese',(select string_agg(t #>> '{{}}',' ') from jsonb_path_query(s.data::jsonb,'strict $.**.text') t)), updated_at=now() "
           f"from public._tmp_post_staging s where s.k='{a['slug']}' and p.slug='{a['slug']}' and md5(s.data)='{m}' returning p.slug;\n")
    return stg, upd
```

### 4.3 Substituições nos BRIEFs copiados do VDM

Ao copiar `BRIEF_COMPARATIVO.md`, `BRIEF_REVIEW_UNICA.md` e `BRIEF_REVIEW.md`:

| De (VDM) | Para (VDP) |
| --- | --- |
| `Vocação de Mãe`, "mãe para mãe", "a mãe" | `Vocação de Pai`, "de pai para pai", "o pai" |
| "Review de Mãe" / `review-de-mae` / `CAT = 1000…000b` | "Pai Indica" / `kind` (`comparativo`, `review`, `lista`) + categoria `pai-indica` |
| "A mãe quer desconto!" | "Loja do Pai — O pai também quer desconto" |
| `<REF_SUPABASE_DO_VOCACAODEMAE>` | `<SUPABASE_PROJECT_REF>` |
| `/tmp/rotina-cmp/`, `/tmp/rotina-rev/`, `/tmp/amzcache-vocacao` | `/tmp/rotina-pai/`, `/tmp/amzcache-pai` |
| "Segurança infantil acima de tudo" | mantém + "segurança elétrica, de ferramentas, de fogo e de trânsito quando o produto envolver" |
| Links `/post/` para posts do blog | `/post/` (artigos), `/pai-indica/` (reviews), `/loja/`, `/ferramentas/` |
| `grupos de mães` | `grupos de pais, fóruns de churrasco/ferramentas/carros, YouTube` |
| Exemplos de produto (carrinho, banheira) | parrilla, furadeira, cadeirinha, kit churrasco, mochila, relógio, barbeador, cafeteira |
| Capa "degradê rosado" | "degradê areia com faixa azul-petróleo" (`cover_cmp.py` novo) |

Campos extras exigidos pelo `cmp_gen.py`/`rev_art_gen.py` do VDP no JSON: `"product_category"` (slug de `product_categories`), `"product_subcategory"` (texto livre), e em comparativo `"vencedor"` (slug do produto) para preencher `comparison` e `product_score`.

### 4.4 `scripts/rotina/BRIEF_NOTICIA.md` (Mercado do pai)

```markdown
# Briefing: notícia "Mercado do pai" (1 por dia)

Nota curta e útil sobre economia doméstica, trabalho, benefícios, impostos, juros, câmbio, preço de
combustível/carne/energia, mercado de trabalho, direitos do pai (licença-paternidade, pensão, guarda),
sempre do ponto de vista de quem sustenta uma família. `kind='noticia'`, categoria `noticias` (slug do doc 02 §4.2;
"Mercado do pai" é a série, marcada pela tag `serie:mercado-do-pai` em `post_tags`, mais `fase-todas`),
status published. 350 a 600 palavras. Fonte principal datada de ≤ 48 h (Banco Central, IBGE, Receita,
Ministério do Trabalho, agências de notícia) citada no 1º ou 2º parágrafo com link externo e data.
Estrutura: 1 parágrafo "o que aconteceu"; 1 parágrafo "o que muda para o pai"; `bulletList` "Na prática"
(3 a 5 itens); 1 parágrafo "o que acompanhar"; "Continue lendo: " com 3+ links internos (ferramentas
`/ferramentas/conversor-de-moedas`, `/ferramentas/mercado-financeiro` quando o tema for câmbio/juros, e
artigos de `carreira-e-dinheiro`). Sem semáforo, sem quiz; `faq` opcional (2). Nunca recomendação de
investimento específico; nunca "R$" no texto (usar percentuais e ordens de grandeza). Capa: Wikimedia/Pexels
(objeto, cédula genérica, gráfico, mesa de trabalho); nunca rosto de pessoa pública sem licença.
Gerador: `python3 scripts/rotina/news_gen.py arquivo.json` → `<slug>.insert.sql`.
```

JSON do `news_gen.py`: `{slug, title, excerpt, seo_title, seo_description, cover, cover_alt, fonte:{url, veiculo, data}, paragrafos:[…4], na_pratica:[…], continue_lendo:["/post/…", "/ferramentas/…"], faq?}`. O gerador monta o `body` (marcação `[texto](url)` e `**negrito**` como no `cmp_gen.py`), valida fonte ≤ 48 h, 350–600 palavras, ≥3 links internos reais, 0 "R$", e emite o `INSERT` com `kind='noticia'` e `category_id = (select id from categories where slug='noticias')`, seguido de `insert into tags (slug, name) values ('serie:mercado-do-pai','Mercado do pai'),('fase-todas','Todas as fases') on conflict (slug) do nothing;` e `insert into post_tags (post_id, tag_id) select p.id, t.id from posts p, tags t where p.slug='<slug>' and t.slug in ('serie:mercado-do-pai','fase-todas') on conflict do nothing;` (tabelas `tags`/`post_tags` da 0002, doc 02 §4.2).

### 4.5 `cover_cmp.py` — trecho que muda (cores)

```python
W, H = 1280, 720
FONT_BOLD = next((f for f in ["public/fonts/BarlowCondensed-Bold.ttf",
                              "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if os.path.exists(f)), None)
TOP, BOTTOM = (244, 239, 230), (228, 217, 200)      # areia #F4EFE6 -> #E4D9C8
TEXT = (31, 36, 41)                                 # grafite #1F2429
BAR, ACCENT = (20, 80, 92), (217, 130, 43)          # petróleo #14505C, âmbar #D9822B
# ... depois de desenhar os cartões:
draw.rectangle([0, H-10, W, H], fill=BAR)
draw.rectangle([0, H-10, 180, H], fill=ACCENT)
```

Uso idêntico ao VDM: `python3 scripts/rotina/cover_cmp.py <slug> "Nome 1=<url>" ["Nome 2=…"] ["Nome 3=…"]` → `public/images/covers/<slug>.jpg`; commitar o JPG no PR; o gerador confere se o arquivo existe e se nenhum outro post usa a mesma capa.

### 4.6 `price_range.py` (novo) — esqueleto

```python
#!/usr/bin/env python3
"""Faixa de preço pesquisada na internet (nunca preço da Amazon).
  python3 scripts/rotina/price_range.py --fila 15            -> lista produtos e as buscas sugeridas
  python3 scripts/rotina/price_range.py --slug s --lojas "Mercado Livre=199.90|https://…,Magalu=249.00|https://…"
     -> valida (>=2 lojas, max<=3*min) e grava price_range_out.sql (UPDATE products + INSERT product_price_checks)."""
import sys, re, json, urllib.request, os
# ... get() da REST com SUPABASE_URL/SUPABASE_ANON_KEY ...
def fila(n):
    rows = get(f"/products?select=slug,name,brand,asin&active=eq.true&price_range_checked_at=is.null&order=featured.desc,sort_order.asc&limit={n}")
    if len(rows) < n:
        rows += get(f"/products?select=slug,name,brand,asin&active=eq.true&price_range_checked_at=lt.{(date.today()-timedelta(60)).isoformat()}&order=price_range_checked_at.asc&limit={n-len(rows)}")
    for r in rows:
        print(r["slug"], "|", f'WebSearch: "{r["brand"]} {r["name"]}" preço  (Mercado Livre, Magalu, Americanas, Casas Bahia, Shopee, Kabum, Leroy Merlin, site do fabricante)')
def gravar(slug, lojas):
    itens = [(n.strip(), float(v.split("|")[0]), v.split("|")[1] if "|" in v else None) for n, v in (x.split("=") for x in lojas.split(","))]
    if len(itens) < 2: sys.exit("ERRO: precisa de 2 lojas")
    lo, hi = min(i[1] for i in itens), max(i[1] for i in itens)
    if hi > 3*lo: sys.exit(f"ERRO: max {hi} > 3 x min {lo} (item diferente?)")
    with open("price_range_out.sql","a") as f:
        f.write(f"update products set price_min={lo:.2f}, price_max={hi:.2f}, price_range_checked_at=now(), updated_at=now() where slug='{slug}' returning slug;\n")
        for n,v,u in itens:
            f.write(f"insert into product_price_checks (product_id, store, price, url, checked_at) select id,'{n}',{v:.2f},{('null' if not u else repr(u))},now() from products where slug='{slug}';\n")
```

### 4.7 `jogada_gen.py` (novo) + `scripts/rotina/BRIEF_JOGADA.md` — Jogada do Dia

Produto "Jogada do Dia" (série `serie:jogada-do-dia` do doc 00 §3.7; ideia 1 do doc 01 §4.2; produto de e-mail do doc 11 §5.1): um texto de 80–120 palavras com **uma** ação prática para o pai fazer com o filho hoje e **um** link interno. Gerado em lote: na 1ª rodada do mês (§2.3 E7) a rotina escreve as 30 (ou 31) jogadas do mês num único JSON e `jogada_gen.py` emite um INSERT por dia.

```markdown
# Briefing: Jogada do Dia (lote mensal, 1 por dia)

Escreva N jogadas (N = dias do mês), uma por dia, cada uma com: título "Jogada do dia: <ação em 3 a 6 palavras>",
80 a 120 palavras em 1 ou 2 parágrafos, voz direta de pai para pai, 1 ação concreta que cabe em 15 minutos
(brincadeira, conversa, tarefa a dois, oração curta, passeio, conserto junto), 1 link interno real
(`/post/`, `/ferramentas/`, `/formacao/`, conferido em slugs.txt). Sem "R$", sem produto, sem semáforo, sem FAQ.
Variar: 2/3 das jogadas servem a qualquer idade (tag `fase-todas`); 1/3 cita a fase no título ("com o bebê",
"com o adolescente") e leva a tag `fase-<slug>` correspondente (8 fases do doc 07 §3.1).
Slug fixo: `jogada-do-dia-AAAA-MM-DD`. A linha editorial do BRIEF_ARTIGO_PAI.md vale inteira.
Gerador: `python3 scripts/rotina/jogada_gen.py arquivo.json` → um `jogada-do-dia-AAAA-MM-DD.insert.sql` por dia.
```

JSON: `{ "mes": "2026-11", "jogadas": [ { "dia": 1, "title": "Jogada do dia: …", "paragrafos": ["…"], "link": "/post/<slug>", "fase": "todas" } ] }` (`fase` = `todas` ou um dos 8 slugs de `src/lib/phases.ts`).

O gerador valida 80–120 palavras, exatamente 1 link interno existente em `slugs.txt`, 0 "R$", termos proibidos (§5.3), e grava cada `jogada-do-dia-AAAA-MM-DD.insert.sql` com `kind='noticia'`, `category_id` de `noticias`, `status='published'`, `publish_at = '<AAAA-MM-DD> 06:00-03'`, `cover_image_url = '/images/covers/jogada-do-dia.jpg'` (capa fixa da série, commitada uma única vez em `public/images/covers/` — exceção à regra de capa única no validador, §5.1), `excerpt` = 1ª frase, `seo_title` = título (≤ 60), `seo_description` = texto até 150 caracteres, `faq = '[]'`, e os INSERTs em `tags`/`post_tags` (`serie:jogada-do-dia` + `fase-*`, mesmo padrão do §4.4). As listagens do site filtram `publish_at <= now()`, então as jogadas futuras ficam invisíveis até o dia. O e-mail diário (§8.4) lê a jogada do dia; o resumo semanal (§8.2) inclui as jogadas da semana.

---

## 5. Validador `scripts/validate-content.mjs`

Node 22 (CLAUDE.md §2), sem dependências. Lê pela REST pública (anon key) os posts/produtos recentes ou os slugs passados e aplica as regras. Sai com código 1 se algo falhar.

```
Uso: node scripts/validate-content.mjs [--since 24h|7d] [--slug a,b] [--images] [--all] [--similaridade]
```

### 5.1 Regras por `kind`

| Regra | `artigo` | `noticia` | `review` | `comparativo` | `lista` |
| --- | --- | --- | --- | --- | --- |
| Palavras mínimas | 1100 | 350 (máx. 600) | 1000 | 1100 | 900 |
| Links internos distintos mínimos | 10 | 3 | 8 (1 para `/loja/`) | 8 (≥4 `/post/` + todos os `/loja/<slug>` dos produtos) | 8 |
| Semáforo | se houver callout: exatamente 3, ordem ok/warn/bad, prefixos "Sinal verde: ", "Sinal de atenção: ", "Sinal de alerta: ", sem links dentro | proibido | opcional (mesma regra) | opcional | opcional |
| Capa | obrigatória, única entre posts, ≠ de toda `image` inline (sem `?`) | idem | obrigatória em `/images/covers/<slug>.jpg` existente no repo | idem | idem |
| `faq` | ≥4 `{question, answer}` não vazios | opcional | ≥4 | ≥4 | ≥3 |
| `review` jsonb | — | — | `{nota 0-10, criterios[5]{nome,nota}, ideal_para, pros[], cons[]}` e `product_score = nota` | — | — |
| `comparison` jsonb | — | — | — | `{produtos[≥2]{slug,nome,score}, vencedor ∈ produtos, criterios[]}`; `product_score` = score do vencedor | `{produtos[≥3]}` |
| `product_category` / `product_subcategory` | — | — | obrigatórios | obrigatórios | obrigatórios |
| Produtos existem | — | — | todo `/loja/<slug>` citado existe em `products.active` e tem `review` objeto | idem | idem |
| Fonte datada | só se `tema_em_alta` | obrigatória: link externo no 1º/2º parágrafo | — | — | — |
| `seo_title`/`seo_description` | ≤60 / 120–155 | idem | idem | idem | idem |
| `status`/`publish_at` | published + publish_at ≤ now | idem | idem | idem | idem |

**Exceção da série Jogada do Dia** (slug com prefixo `jogada-do-dia-`, `kind='noticia'`, §4.7): 80–120 palavras, exatamente 1 link interno, fonte datada dispensada, `faq` vazio permitido, capa fixa da série compartilhada entre as jogadas (não conta como "capa repetida"), e `publish_at` pode estar até 31 dias no futuro (lote mensal).

Regras comuns a todos: **nenhum "R$" seguido de dígito** no texto do `body`, `excerpt`, `faq` (a faixa é escrita pelo componente); **termos proibidos** (lista §5.3) ausentes; botão de compra sempre com texto "Comprar … agora na Amazon" (nunca "Ver preço"); todos os `href` internos existem (posts publicados, produtos ativos, `/ferramentas/<slug>` com `slug` presente em `TOOLS` de `src/lib/tools/registry.ts` — a rota é única, `/ferramentas/$slug`, doc 06 —, trilhas publicadas); `bulletList`/`taskItem` sem item vazio; `heading` só nível 2 e 3; `reading_time > 0`.

Regras de `products` (quando `--products`): `review` objeto com `nota`, 5 `criterios`, `em_3_pontos[3]`, ≥6 `secoes`, ≥3 com `cta`, `faq ≥4 {q,a}`; `image_url` contém `_AC_SL1500_`; `images` 3–8; `pros`/`cons` 4–6; `affiliate_url` contém `/dp/` + ASIN; `price_min ≤ price_max ≤ 3×price_min` quando preenchidos; `category_id` existe.

### 5.2 Esqueleto

```js
#!/usr/bin/env node
// Valida posts e produtos recentes direto do Supabase (REST anon). Sai 1 se houver erro.
import { readFileSync, existsSync } from "node:fs";
const URL = process.env.SUPABASE_URL || /https:\/\/[a-z0-9]+\.supabase\.co/.exec(readFileSync("src/integrations/supabase/client.ts","utf8"))[0];
const KEY = process.env.SUPABASE_ANON_KEY || /"(eyJ[\w.-]+)"/.exec(readFileSync("src/integrations/supabase/client.ts","utf8"))[1];
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i+1] : d; };
const since = opt("--since", "24h"), slugs = opt("--slug", "")?.split(",").filter(Boolean);
const ms = { h: 3600e3, d: 86400e3 }[since.slice(-1)] * parseInt(since);
const get = async (p) => (await fetch(`${URL}/rest/v1${p}`, { headers: H })).json();

const MIN = { artigo: [1100, 10], noticia: [350, 3], review: [1000, 8], comparativo: [1100, 8], lista: [900, 8] };
const PROIBIDOS = ["macho alfa", "red pill", "bet365", "aposta esportiva", "lgbt", "casal gay", "mulher tem que", "ver preço na amazon"];
const SEM = [["ok", "Sinal verde: "], ["warn", "Sinal de atenção: "], ["bad", "Sinal de alerta: "]];

const walk = (n, f) => { if (Array.isArray(n)) n.forEach(x => walk(x, f)); else if (n && typeof n === "object") { f(n); Object.values(n).forEach(v => walk(v, f)); } };
const textOf = (b) => { const t = []; walk(b, n => n.type === "text" && t.push(n.text)); return t.join(" "); };
const linksOf = (b) => { const s = new Set(); walk(b, n => n.type === "link" && n.attrs?.href?.startsWith("/") && s.add(n.attrs.href)); return s; };
const base = (u) => (u || "").split("?")[0];
// Ferramentas: a rota é única (/ferramentas/$slug, doc 06); os slugs válidos vivem em TOOLS de src/lib/tools/registry.ts
const TOOL_SLUGS = new Set([...readFileSync("src/lib/tools/registry.ts", "utf8").matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map(m => m[1]));
const isJogada = (p) => p.kind === "noticia" && p.slug.startsWith("jogada-do-dia-"); // série Jogada do Dia (§4.7)

const posts = slugs.length
  ? await get(`/posts?select=*&slug=in.(${slugs.join(",")})`)
  : await get(`/posts?select=*&status=eq.published&updated_at=gte.${new Date(Date.now()-ms).toISOString()}&limit=200`);
const allPosts = await get(`/posts?select=slug,kind,cover_image_url&status=eq.published&limit=5000`);
const products = await get(`/products?select=slug,review,active&active=eq.true&limit=5000`);
const covers = new Map(); allPosts.forEach(p => covers.set(p.slug, base(p.cover_image_url)));
const exists = (href) => {
  const [, sec, slug] = href.match(/^\/(post|pai-indica|loja|ferramentas|formacao|categoria)\/([^/?#]+)/) || [];
  if (!sec) return ["/blog","/pai-indica","/loja","/ferramentas","/formacao","/irmandade","/pai-indica-pai"].some(r => href.startsWith(r));
  if (sec === "post") return allPosts.some(p => p.slug === slug && ["artigo","noticia"].includes(p.kind));
  if (sec === "pai-indica") return allPosts.some(p => p.slug === slug && ["review","comparativo","lista"].includes(p.kind));
  if (sec === "loja") return products.some(p => p.slug === slug);
  if (sec === "ferramentas") return TOOL_SLUGS.has(slug);
  return true; // formacao/categoria: checadas no CI de build
};

let failed = 0;
for (const p of posts) {
  const e = [], t = textOf(p.body), words = t.split(/\s+/).filter(Boolean).length, links = linksOf(p.body);
  const [minW, minL] = isJogada(p) ? [80, 1] : (MIN[p.kind] || [900, 8]);
  if (words < minW) e.push(`${words} palavras (< ${minW})`);
  const maxW = isJogada(p) ? 120 : 600; if (p.kind === "noticia" && words > maxW) e.push(`${words} palavras (> ${maxW})`);
  if (links.size < minL) e.push(`${links.size} links internos (< ${minL})`);
  for (const l of links) if (!exists(l)) e.push(`link para slug inexistente: ${l}`);
  if (/R\$\s?\d/.test(t + " " + p.excerpt + " " + JSON.stringify(p.faq || []))) e.push("valor em reais no texto");
  for (const w of PROIBIDOS) if ((t + " " + p.title).toLowerCase().includes(w)) e.push(`termo proibido: ${w}`);
  const cal = []; walk(p.body, n => n.type === "callout" && cal.push(n));
  if (p.kind === "noticia" && cal.length) e.push("notícia não leva semáforo");
  else if (cal.length && cal.length !== 3) e.push(`semáforo com ${cal.length} callouts (precisa 3)`);
  else cal.forEach((c, i) => { if (c.attrs?.tone !== SEM[i][0] || !textOf(c).startsWith(SEM[i][1])) e.push(`callout ${i+1} fora do padrão (${SEM[i][1]})`); if (linksOf(c).size) e.push("link dentro do callout"); });
  if (!p.cover_image_url) e.push("sem capa");
  for (const [s, c] of covers) if (s !== p.slug && c && c === base(p.cover_image_url) && !(isJogada(p) && s.startsWith("jogada-do-dia-"))) e.push(`capa repetida com ${s}`);
  walk(p.body, n => n.type === "image" && base(n.attrs?.src) === base(p.cover_image_url) && e.push("capa repetida no corpo"));
  if (["review","comparativo","lista"].includes(p.kind)) {
    if (!p.cover_image_url?.startsWith("/images/covers/") || !existsSync(`public${p.cover_image_url}`)) e.push("capa composta ausente em public/images/covers");
    if (!p.product_category || !p.product_subcategory) e.push("product_category/product_subcategory vazios");
    for (const l of links) if (l.startsWith("/loja/")) { const pr = products.find(x => x.slug === l.slice(6)); if (pr && (!pr.review || typeof pr.review !== "object")) e.push(`produto sem review longa: ${l}`); }
  }
  if (p.kind === "review") { const r = p.review || {}; if (!(r.nota >= 0 && r.nota <= 10) || !Array.isArray(r.criterios) || r.criterios.length !== 5) e.push("review jsonb inválido (nota 0-10, 5 critérios)"); if (Number(p.product_score) !== Number(r.nota)) e.push("product_score ≠ review.nota"); }
  if (p.kind === "comparativo") { const c = p.comparison || {}; if (!Array.isArray(c.produtos) || c.produtos.length < 2 || !c.produtos.some(x => x.slug === c.vencedor)) e.push("comparison jsonb inválido"); }
  const faq = p.faq || []; if ((p.kind !== "noticia" && faq.length < 4) || faq.some(f => !f.question?.trim() || !f.answer?.trim())) e.push("faq inválido");
  if ((p.seo_title || "").length > 60) e.push("seo_title > 60"); if (!(p.seo_description?.length >= 120 && p.seo_description.length <= 155)) e.push("seo_description fora de 120-155");
  if (p.kind === "noticia" && !isJogada(p)) { let ext = 0; walk(p.body, n => n.type === "link" && /^https?:/.test(n.attrs?.href || "") && ext++); if (!ext) e.push("notícia sem fonte externa"); }
  if (e.length) { failed++; console.log(`✗ ${p.kind} ${p.slug}`); e.forEach(x => console.log(`   - ${x}`)); } else console.log(`✓ ${p.kind} ${p.slug} (${words} palavras, ${links.size} links)`);
}
console.log(`\n${posts.length - failed}/${posts.length} posts válidos`);
process.exit(failed ? 1 : 0);
```

Com `--images`, para cada capa e `image` inline fazer `fetch(url, {method:"HEAD"})` e exigir 200 e `content-length > 15000` (capas compostas locais: `statSync` > 15 KB). Com `--similaridade`, comparar cada post com os títulos/excerpts publicados do Vocação de Mãe e reprovar acima de 0,60 (§13b-c).

### 5.3 Termos proibidos (linha editorial) — lista única, importada também pelos geradores Python

`macho alfa`, `red pill`, `bet365`, `aposta esportiva`, `tigrinho`, `lgbt`, `lgbtqi`, `casal gay`, `casal do mesmo sexo`, `homoafetivo`, `mulher tem que`, `ver preço na amazon`, `preço de hoje`, `garantido`, `cura`, `100% seguro`. Manter em `scripts/rotina/proibidos.json` e ler dos dois lados.

### 5.4 No CI

`validate.yml` (§10.2) roda `node scripts/validate-content.mjs --since 7d` a cada PR e `--all` 1× por semana (domingo 06:17). Falha do validador = PR não mescla (o auto-merge só age depois do check da Vercel; adicionar `validate` como required check em Settings → Branches → `main`).

---

## 6. Imagens

### 6.1 Cascata para capa e inline (artigos e notícias)

1. **Wikimedia Commons** (API pública, sem chave) — quando o tema é enciclopédico (corte de carne, ferramenta específica, cena histórica, lugar) ou quando a licença por arquivo importa. Aceitar só `CC0`, `Public domain`, `CC BY`, `CC BY-SA`; para CC BY/BY-SA gravar atribuição no `title` do nó `image` ("Foto: Autor, CC BY-SA 4.0, Wikimedia Commons").
2. **Pexels** → 3. **Pixabay** — foto "de catálogo" (homem sozinho, pai com filho, cozinha, oficina). Uso comercial livre; sem conferência de licença.
4. **Unsplash** via `mcp__Unsplash__search_photos` quando o MCP estiver carregado na sessão (URL `https://images.unsplash.com/photo-…?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080`).
5. **Google Custom Search**: desativado (mesmo problema do VDM) — não usar até o dono confirmar.

Regra de escolha: **a melhor foto para o trecho**, não a primeira fonte da cascata; a cascata é a ordem de busca, não de preferência.

### 6.2 Produto físico

Sempre **foto oficial da Amazon** (`amz.py`, `_AC_SL1500_`, HTTP 200, > 15 KB). Capa de Pai Indica = capa composta (`cover_cmp.py`). Galeria `products.images` com 3–8 fotos oficiais. Nunca foto de banco de imagens para produto.

### 6.3 Pessoas reais e linha editorial

- Preferir homem sozinho, pai com filho(a), objeto, cena de trabalho. Buscas "couple"/"family" só com conferência visual (a descrição do Pexels não é confiável — caso documentado no VDM) ou com contexto que deixe claro homem + mulher.
- Nunca imagem que mostre ou sugira casal do mesmo sexo ou conteúdo LGBTQI.
- Pessoa pública/rosto identificável: só Wikimedia com licença válida e atribuição; nunca em notícia de "Mercado do pai" sem isso.
- Crianças: sem rosto em close quando a cena permitir; nunca imagem sugestiva.
- Sem marca d'água, sem screenshot de rede social, sem imagem gerada por IA apresentada como foto.

### 6.4 Chaves e edge function

- `PEXELS_API_KEY`, `PIXABAY_API_KEY` (e `GOOGLE_CSE_API_KEY`/`GOOGLE_CSE_CX`, inativos) ficam no **Supabase Vault** do projeto novo (`select vault.create_secret('<valor>', 'PEXELS_API_KEY')`), lidas pela função `public.get_secret(secret_name)` (`security definer`, só `service_role`), herdada do VDM.
- Edge function **`stock-photos`** copiada de `/home/user/vocacaodemae/supabase/functions/stock-photos` para `supabase/functions/stock-photos/index.ts`; deploy com `mcp__Supabase__deploy_edge_function` (ou `supabase functions deploy stock-photos --project-ref <SUPABASE_PROJECT_REF>`). Body: `{ "query": "pai cozinhando", "source": "wikimedia|pexels|pixabay|google", "per_page": 12 }`. É a **única** parte do código que lê chaves; editor (admin) e rotina sempre passam por ela.
- Edge function **`seo-search-console`** copiada do VDM (`supabase/functions/seo-search-console/index.ts`), com `GOOGLE_SEARCH_CONSOLE_SA_JSON` e `SEO_SYNC_INTERNAL_SECRET` no Vault e `verify_jwt: true`. Ações: `list_sites`, `sync`, `notify_index`. Pré-requisito manual do dono: adicionar o e-mail da service account como usuário da propriedade `sc-domain:vocacaodepai.com.br` no Search Console.

---

## 7. Mercado financeiro: refresh a cada 30 min

A Fase 4 criou a server function `src/routes/api/market/refresh.ts` (TanStack Start `createServerFileRoute`) que busca câmbio (USD, EUR, BTC), Selic/CDI, Ibovespa e grava em `market_cache` (`key`, `data`, `fetched_at`, `ttl_seconds=1800`). Ela exige o header `x-market-secret` = `MARKET_REFRESH_SECRET` (env da Vercel). A página `/ferramentas/mercado-financeiro` só lê `market_cache`.

Decisão: **GitHub Actions schedule** (não Vercel Cron, para não depender do plano da Vercel). Arquivo `.github/workflows/market-refresh.yml`:

```yaml
name: Mercado do pai — atualizar cotações
on:
  schedule:
    - cron: "*/30 * * * *"
  workflow_dispatch: {}
permissions:
  contents: read
concurrency:
  group: market-refresh
  cancel-in-progress: true
jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Chamar /api/market/refresh
        env:
          URL: https://vocacaodepai.com.br/api/market/refresh
          SECRET: ${{ secrets.MARKET_REFRESH_SECRET }}
        run: |
          set -e
          code=$(curl -sS -o /tmp/out.json -w "%{http_code}" -X POST "$URL" \
            -H "x-market-secret: $SECRET" -H "Content-Type: application/json" --max-time 60)
          echo "HTTP $code"; cat /tmp/out.json | head -c 2000; echo
          test "$code" = "200"
      - name: Conferir frescor no Supabase
        env:
          SB_URL: ${{ secrets.SUPABASE_URL }}
          SB_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          curl -sS "$SB_URL/rest/v1/market_cache?select=key,fetched_at&order=fetched_at.desc&limit=5" \
            -H "apikey: $SB_KEY" -H "Authorization: Bearer $SB_KEY"
```

Esqueleto da server function (se a Fase 4 ainda não a tiver criado exatamente assim, alinhar):

```ts
// src/routes/api/market/refresh.ts
import { createServerFileRoute } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

export const ServerRoute = createServerFileRoute("/api/market/refresh").methods({
  POST: async ({ request }) => {
    if (request.headers.get("x-market-secret") !== process.env.MARKET_REFRESH_SECRET)
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const fx = await (await fetch("https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,BTC-BRL")).json();
    const selic = await (await fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json")).json();
    const rows = [
      { key: "fx", data: fx, fetched_at: new Date().toISOString(), ttl_seconds: 1800 },
      { key: "selic", data: selic, fetched_at: new Date().toISOString(), ttl_seconds: 86400 },
    ];
    const { error } = await sb.from("market_cache").upsert(rows, { onConflict: "key" });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true, keys: rows.map(r => r.key) }), { headers: { "Content-Type": "application/json" } });
  },
});
```

Aceite: após 2 execuções do workflow, `select key, fetched_at from market_cache` mostra `fetched_at` < 35 min; a página mostra "Atualizado há X min" e nunca quebra se o cache estiver vazio (mostra "cotações indisponíveis no momento").

---

## 8. Newsletter: semanal (`weekly-digest`, Fase 5) e diária (Jogada do Dia, Fase 8)

### 8.1 Decisão: uma implementação só

O envio semanal **já existe desde a Fase 5**: edge function `supabase/functions/weekly-digest/index.ts` acionada pelo **pg_cron** `weekly-digest` (domingo 11:00 UTC = 08:00 BRT), template em `supabase/functions/_shared/email-templates.ts`, envio via Resend Batch, registro em `moderation_log` e idempotência por `last_digest_at` — tudo definido no doc 07 §6.6 (cron no fim de `0008_area_do_pai.sql`, doc 07 §2.2). A Fase 8 **não cria** outra rota agendada, outro workflow com `schedule` nem outra edge function de newsletter (não existe `newsletter-send`, `src/emails/weekly.ts` nem `NEWSLETTER_CRON_SECRET`): ela só acrescenta dois blocos ao template (§8.2), liga o disparo manual (§8.3) e cria o e-mail diário da Jogada do Dia (§8.4).

Segmentos: um esquema único, o do doc 07. `newsletter_subscribers.segments` é um **array jsonb** (doc 07 §2.2) com itens `fase:<slug>`, onde `<slug>` é uma das 8 fases de `src/lib/phases.ts` (doc 07 §3.1): `gestacao`, `recem-nascido`, `bebe`, `primeira-infancia`, `infancia`, `pre-adolescencia`, `adolescencia`, `adulto`. Cada fase casa com a tag `fase-<slug>` dos posts (`post_tags`), e a `weekly-digest` escolhe os posts por essa tag (assinante com `user_id` → fases calculadas de `children`; sem `user_id` → `segments`; sem nada → posts com `fase-todas`). A Fase 8 acrescenta ao mesmo array o item de frequência `frequencia:diaria` ou `frequencia:semanal` (doc 11 §5.1; gravado no cadastro e em `/minha-conta` → aba notificações, doc 07 §6), com `frequencia:semanal` como padrão quando o item não existe. Nenhum outro esquema de segmento (`esperando`/`bebe`/`pequeno`/`crianca`, `idade-*`, `0-1`/`1-3`, `diaria`/`semanal` soltos) é usado em lugar nenhum.

### 8.2 O que a Fase 8 acrescenta ao template da `weekly-digest`

Em `supabase/functions/_shared/email-templates.ts`, na função do resumo semanal, inserir dois blocos entre "Para ler" e o rodapé (mesmo estilo inline, 600 px, cores do site):

```html
<tr><td style="padding:8px 32px"><h2 style="font-family:'Barlow Condensed',Arial;color:#1F2429;margin:16px 0 8px">Sua formação</h2>
  <!-- assinante com user_id: trilha em andamento (track_progress) e próximo passo; desafio ativo (challenge_progress) e dia atual.
       sem user_id ou sem progresso: a trilha publicada em destaque (tracks.status='published' order by sort_order limit 1). -->
  <p><strong>{{trilha.title}}</strong> — próximo passo: <a href="https://vocacaodepai.com.br/formacao/{{trilha.slug}}?utm_source=newsletter&utm_medium=email&utm_campaign=semanal" style="color:#14505C;font-weight:600">{{passo.title}}</a></p>
  {{#desafio}}<p>Desafio <strong>{{desafio.title}}</strong>: dia {{desafio.dia}} de {{desafio.days}} · <a href="https://vocacaodepai.com.br/desafios/{{desafio.slug}}?utm_source=newsletter" style="color:#14505C">continuar</a></p>{{/desafio}}
</td></tr>
<tr><td style="padding:8px 32px"><h2 style="font-family:'Barlow Condensed',Arial;color:#1F2429;margin:16px 0 8px">Pai Indica da semana</h2>
  <!-- até 2 posts kind in ('review','comparativo','lista') publicados nos últimos 7 dias, maior product_score primeiro -->
  {{#reviews}}<p><a href="https://vocacaodepai.com.br/pai-indica/{{slug}}?utm_source=newsletter&utm_medium=email&utm_campaign=semanal" style="color:#14505C;font-weight:600">{{title}}</a> · nota {{product_score}}<br><span style="color:#555">{{excerpt}}</span></p>{{/reviews}}
  <p style="font-size:12px;color:#777">Links da Amazon são de afiliado (Amazon Associados BR). Preços são faixas pesquisadas na internet, não o preço da Amazon.</p>
</td></tr>
```

Também entra no resumo semanal um bloco "Jogadas da semana" com os posts `jogada-do-dia-*` dos últimos 7 dias (título + link), para quem tem `frequencia:semanal`. Consultas (service_role, dentro da função; colunas do doc 02 §4.6): trilha = `select t.slug, t.title, s.title as passo from tracks t join track_steps s on s.track_id = t.id where t.status='published' and s.position = (select coalesce(max(s2.position),0)+1 from track_steps s2 join track_progress tp on tp.step_id = s2.id where tp.user_id = $1 and s2.track_id = t.id) order by t.sort_order limit 1`; desafio = `select c.slug, c.title, c.days, max(cp.day) as dia from challenges c join challenge_progress cp on cp.challenge_id = c.id where cp.user_id = $1 and c.status='published' group by c.id, c.slug, c.title, c.days limit 1`. Registro, idempotência, lotes de 100 e `moderation_log` ficam como no doc 07 §6.6. Depois da mudança: `supabase functions deploy weekly-digest` (ou `mcp__Supabase__deploy_edge_function`).

### 8.3 Disparo manual e fallback (sem schedule próprio)

- `src/routes/api/newsletter/weekly.ts` (listada no doc 02 §1.3): **disparo manual** da `weekly-digest`, mesmo padrão de `api/cron/expire-jobs.ts` do doc 02. `POST`, `Authorization: Bearer CRON_SECRET` (comparação em tempo constante), faz `fetch` na edge function com `x-internal-secret: INTERNAL_FN_SECRET` (doc 07 §6.6) e devolve o JSON dela; `?dry_run=true` é repassado e a função só conta. Nenhum agendamento aqui: quem agenda é o pg_cron do doc 07.
- `src/routes/api/newsletter/unsubscribe.ts` (doc 02 §1.3): alvo do cabeçalho `List-Unsubscribe`; recebe `?token=<confirm_token>` e chama a função de descadastro por token do doc 07 §2.2 (nunca `UPDATE` direto), redirecionando para `/newsletter/sair`.
- `.github/workflows/newsletter-weekly.yml` (listado no doc 02 §1): **só `workflow_dispatch`** (input `dry_run`, default `true`), **sem `schedule`**, chamando `/api/newsletter/weekly` com `Authorization: Bearer ${{ secrets.CRON_SECRET }}`. Serve para o dono testar e para reenviar se o pg_cron falhar (conferir com `select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname='weekly-digest') order by start_time desc limit 5`).

```yaml
name: Newsletter semanal — disparo manual (o agendamento é o pg_cron weekly-digest)
on:
  workflow_dispatch:
    inputs:
      dry_run:
        description: "true = só monta e devolve contagem, não envia"
        default: "true"
permissions:
  contents: read
jobs:
  send:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Disparar weekly-digest via /api/newsletter/weekly
        env:
          URL: https://vocacaodepai.com.br/api/newsletter/weekly
          SECRET: ${{ secrets.CRON_SECRET }}
          DRY: ${{ github.event.inputs.dry_run || 'true' }}
        run: |
          set -e
          code=$(curl -sS -o /tmp/out.json -w "%{http_code}" -X POST "$URL?dry_run=$DRY" \
            -H "Authorization: Bearer $SECRET" --max-time 300)
          echo "HTTP $code"; cat /tmp/out.json; echo
          test "$code" = "200"
```

### 8.4 Envio diário — `/api/newsletter/daily` (07:07 BRT, workflow `newsletter-daily.yml`, mesmo segredo `CRON_SECRET`)

`src/routes/api/newsletter/daily.ts` (`POST`, `Authorization: Bearer CRON_SECRET`, service_role no servidor):

1. Busca a jogada do dia: `select slug, title, body, excerpt from posts where kind='noticia' and slug = 'jogada-do-dia-' || to_char(now() at time zone 'America/Sao_Paulo','YYYY-MM-DD') and status='published' limit 1`. Sem jogada → responde `{ok:true, enviados:0, motivo:'sem jogada'}` e registra em `moderation_log` (`entity='newsletter'`, `action='daily_skipped'`).
2. Seleciona assinantes `status='confirmed' and segments @> '["frequencia:diaria"]'::jsonb`, em páginas de 100.
3. Monta o e-mail curto (doc 00 §8 item 3: cabeçalho petróleo sobre areia, título "Jogada do Dia" em Barlow Condensed, o texto de 80–120 palavras, 1 botão âmbar "Ver no site" → `/post/<slug>?utm_source=newsletter&utm_medium=email&utm_campaign=jogada`, rodapé com `List-Unsubscribe` → `/api/newsletter/unsubscribe?token=…`). O template `jogadaDoDia()` fica em `supabase/functions/_shared/email-templates.ts` e é importado pela rota por caminho relativo (um único arquivo de templates; sem segundo sistema).
4. Envia por Resend Batch (`from: "Vocação de Pai <nao-responda@vocacaodepai.com.br>"`, `reply_to: contato@vocacaodepai.com.br`), grava `moderation_log` (`action='daily_sent'`, `note='jogada <slug>: N e-mails, M falhas'`).
5. Idempotência: antes de enviar, confere `moderation_log` por `action='daily_sent'` com a mesma jogada no dia; se existir, responde `{ok:true, enviados:0, motivo:'já enviado'}`.

A semanal (§8.2) inclui as jogadas da semana para quem tem `frequencia:semanal`; quem tem `frequencia:diaria` recebe as duas (a diária e o resumo de domingo).

Workflow `.github/workflows/newsletter-daily.yml` (também abriga o resumo semanal ao dono do §13b-b):

```yaml
name: Newsletter diária (Jogada do Dia) e resumo ao dono
on:
  schedule:
    - cron: "7 10 * * *"    # 07:07 America/Sao_Paulo — Jogada do Dia
    - cron: "0 21 * * 5"    # sexta 18:00 America/Sao_Paulo — resumo semanal ao dono (§13b-b)
  workflow_dispatch:
    inputs:
      alvo:
        description: "daily | owner-weekly"
        default: "daily"
permissions:
  contents: read
jobs:
  daily:
    if: github.event.schedule == '7 10 * * *' || (github.event_name == 'workflow_dispatch' && github.event.inputs.alvo == 'daily')
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - name: Enviar Jogada do Dia
        env:
          URL: https://vocacaodepai.com.br/api/newsletter/daily
          SECRET: ${{ secrets.CRON_SECRET }}
        run: |
          set -e
          code=$(curl -sS -o /tmp/out.json -w "%{http_code}" -X POST "$URL" -H "Authorization: Bearer $SECRET" --max-time 300)
          echo "HTTP $code"; cat /tmp/out.json; echo
          test "$code" = "200"
  owner-weekly:
    if: github.event.schedule == '0 21 * * 5' || (github.event_name == 'workflow_dispatch' && github.event.inputs.alvo == 'owner-weekly')
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Enviar resumo da semana ao dono
        env:
          URL: https://vocacaodepai.com.br/api/newsletter/owner-weekly
          SECRET: ${{ secrets.CRON_SECRET }}
        run: |
          set -e
          code=$(curl -sS -o /tmp/out.json -w "%{http_code}" -X POST "$URL" -H "Authorization: Bearer $SECRET" --max-time 120)
          echo "HTTP $code"; cat /tmp/out.json; echo
          test "$code" = "200"
```

Aceite: `workflow_dispatch` de `newsletter-weekly.yml` com `dry_run=true` devolve a contagem por segmento (`{segmentos:{"fase:bebe":N,…}, posts:…}`) e o template renderiza "Sua formação" e "Pai Indica da semana"; um envio real para o e-mail do dono chega com os links funcionando e o cancelamento muda `status='unsubscribed'`; `newsletter-daily.yml` (job `daily`) com uma jogada publicada para hoje e 1 assinante `frequencia:diaria` entrega o e-mail e grava `daily_sent` em `moderation_log`; sem jogada, responde 200 com `motivo:'sem jogada'`.

---

## 9. Expiração de vagas (cron diário)

Server function `src/routes/api/jobs/expire.ts` protegida por `x-jobs-secret` = `JOBS_CRON_SECRET`:

```sql
update jobs set status='expired', updated_at=now()
 where status='approved' and expires_at is not null and expires_at < now()
 returning slug;
-- aviso 3 dias antes (opcional, via Resend ao posted_by):
select j.slug, j.title, p.id as user_id from jobs j join profiles p on p.id=j.posted_by
 where j.status='approved' and j.expires_at between now() and now() + interval '3 days';
```

Registra em `moderation_log` (`entity='jobs'`, `action='expired'`, `note='<n> vagas'`). Workflow `.github/workflows/jobs-expire.yml`:

```yaml
name: Expirar vagas vencidas
on:
  schedule:
    - cron: "23 6 * * *"   # 03:23 America/Sao_Paulo
  workflow_dispatch: {}
permissions:
  contents: read
jobs:
  expire:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Chamar /api/jobs/expire
        env:
          URL: https://vocacaodepai.com.br/api/jobs/expire
          SECRET: ${{ secrets.JOBS_CRON_SECRET }}
        run: |
          set -e
          code=$(curl -sS -o /tmp/out.json -w "%{http_code}" -X POST "$URL" -H "x-jobs-secret: $SECRET" --max-time 60)
          echo "HTTP $code"; cat /tmp/out.json; echo
          test "$code" = "200"
```

Aceite: vaga de teste com `expires_at = now() - interval '1 day'` vira `expired` na próxima execução e some de `/pai-indica-pai/vagas`.

---

## 10. GitHub workflows completos

Todos em `.github/workflows/`. Secrets em Settings → Secrets and variables → Actions (tabela no §12).

### 10.1 `auto-merge.yml` (cópia do vocacaodemae)

```yaml
name: Auto-merge PRs do Claude
on:
  status:
permissions:
  contents: write
  pull-requests: write
jobs:
  merge:
    if: github.event.state == 'success' && github.event.context == 'Vercel'
    runs-on: ubuntu-latest
    steps:
      - env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SHA: ${{ github.event.sha }}
        run: |
          pr=$(gh pr list -R "$GITHUB_REPOSITORY" --state open --search "$SHA" \
            --json number,headRefName -q '.[] | select(.headRefName|startswith("claude/")) | .number')
          if [ -n "$pr" ]; then gh pr merge "$pr" -R "$GITHUB_REPOSITORY" --merge; fi
```

Observação: o `gh pr merge` respeita os required checks do branch `main`; com `validate` marcado como required (§5.4), o PR só mescla se Vercel **e** validate passarem.

### 10.2 `validate.yml`

```yaml
name: Validar build, lint e conteúdo
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  schedule:
    - cron: "17 9 * * 0"   # domingo 06:17 America/Sao_Paulo: validação completa
  workflow_dispatch: {}
permissions:
  contents: read
concurrency:
  group: validate-${{ github.ref }}
  cancel-in-progress: true
jobs:
  validate:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - name: Lint
        run: npm run lint
      - name: Typecheck
        run: npx tsc --noEmit
      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npm run build
      - name: Validar conteúdo (7 dias ou tudo no domingo)
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          if [ "${{ github.event_name }}" = "schedule" ]; then
            node scripts/validate-content.mjs --all --images
          else
            node scripts/validate-content.mjs --since 7d --images
          fi
      - name: Validar capas commitadas (> 15 KB, 1280x720)
        run: |
          python3 - <<'EOF'
          import glob, os, struct, sys
          bad = 0
          for f in glob.glob("public/images/covers/*.jpg"):
              if os.path.getsize(f) < 15000: print("pequena:", f); bad += 1
          sys.exit(1 if bad else 0)
          EOF
```

### 10.3 `market-refresh.yml` — ver §7 (YAML completo).
### 10.4 `newsletter-weekly.yml` (só `workflow_dispatch`; o agendamento semanal é o pg_cron `weekly-digest` do doc 07 §6.6) — ver §8.3.
### 10.4b `newsletter-daily.yml` (Jogada do Dia 07:07 BRT + resumo ao dono sexta 18:00 BRT) — ver §8.4.
### 10.5 `jobs-expire.yml` — ver §9.

---

## 11. Painel Lisieux (grupovdp)

O painel do grupo (`/home/user/grupovdp`, repositório `grupovdp`) coleta GA4, Search Console e AdSense de cada site em `data/metrics.json` (script `scripts/refresh-sites.mjs`, rodado pelo workflow `refresh-youtube.yml` a cada 5 min) e mostra o escritório virtual dos agentes (Supabase provisório no projeto do Vocação de Mãe, `<REF_SUPABASE_DO_VOCACAODEMAE>`, tabelas `lisieux_*`).

### 11.1 Registrar o site (PR no repositório grupovdp)

1. Em `scripts/refresh-sites.mjs`, adicionar a entrada em `SITES`:
   ```js
   const SITES = [
     { key: "portaldaai",   label: "Portal da AI",   domain: "portaldaai.com.br",   ga4Env: "GA4_PROPERTY_PORTALDAAI" },
     { key: "vocacaodemae", label: "Vocação de Mãe", domain: "vocacaodemae.com.br", ga4Env: "GA4_PROPERTY_VOCACAODEMAE" },
     { key: "vocacaodepai", label: "Vocação de Pai", domain: "vocacaodepai.com.br", ga4Env: "GA4_PROPERTY_VOCACAODEPAI" },
   ];
   ```
2. Em `.github/workflows/refresh-youtube.yml`, no passo "Buscar GA4, Search Console e AdSense dos sites", adicionar `GA4_PROPERTY_VOCACAODEPAI: ${{ secrets.GA4_PROPERTY_VOCACAODEPAI }}`.
3. Secret `GA4_PROPERTY_VOCACAODEPAI` no repositório grupovdp = ID numérico da propriedade GA4 criada na Fase 1 (Admin → Propriedade → Detalhes → "ID da propriedade").
4. **GA4**: adicionar o e-mail da service account (`GOOGLE_SA_JSON.client_email`) como "Leitor" na propriedade GA4 do Vocação de Pai.
5. **Search Console**: adicionar o mesmo e-mail como usuário (Permissão completa ou restrita) em `sc-domain:vocacaodepai.com.br`. O script encontra a propriedade sozinho (`findSearchConsoleSite`).
6. **AdSense**: nada a configurar no código; quando o domínio for aprovado no AdSense, o relatório por `DOMAIN_NAME` passa a trazer `vocacaodepai.com.br` e o painel mostra. Até lá, aparece "conta conectada, mas sem dados para este domínio ainda".
7. Em `escritorio/data.js`, constante `ROUTINES`, acrescentar a linha (formato `[id, nome, função, empresa, blog, subagentes, agentes por execução, como trabalha]`):
   ```js
   ["rt-vocacaodepai", "Bruno", "Editor · artigos, Pai Indica e Loja do Pai", "<COMPANY_ID_VDP>", null, ["Redator","Redator","Redator","Redator","Redator"], 16, "editor + 15 subagentes, até 5 ao mesmo tempo (Padrão A, Pai Indica e reviews)"],
   ```
   (`<COMPANY_ID_VDP>` = o id da empresa do Vocação de Pai no painel. Em `escritorio/data.js`, `COMPANY_IDS` tem `chefia`, `f1`…`f9` e `central`, e `rt-vocacaodemae` usa `"f3"`; hoje não existe entrada própria do Vocação de Pai. Os docs 00 §9.2 e 01 §3.9 usam `"f1"`. Regra: conferir `COMPANIES`/`SEED_TEAM` no arquivo; se já houver empresa do Vocação de Pai, usar o id dela; se não houver, criar a entrada própria em `COMPANIES` (id livre entre `f1`…`f9`, nome "Vocação de Pai") no mesmo PR e usar esse id em todos os pontos (§2.3 E0, §11.2, §11.3, §13 E0). Registrar o id escolhido em `docs/plano/PROGRESSO.md` → "Decisões tomadas durante a execução".)
8. Incluir no mesmo PR as métricas internas do §11.4 (`metricsUrl`, `metricsKeyEnv`, secret `HUB_API_KEY_VOCACAODEPAI`). Abrir PR `claude/vocacaodepai-no-painel` no grupovdp e conferir, após o merge e o próximo run, que `data/metrics.json` tem `sites.vocacaodepai` com `ga4`/`searchConsole`/`internal` ou mensagens de erro honestas.

### 11.2 Como a rotina reporta status com `scripts/agente.mjs`

Copiar `/home/user/grupovdp/scripts/agente.mjs` para `/home/user/vocacaodepai/scripts/agente.mjs` **sem alteração** (ele não tem dependências). Como o `escritorio/config.js` não existe no repositório do site, a rotina passa as três variáveis:

| Variável | Valor | Onde |
| --- | --- | --- |
| `LISIEUX_SUPABASE_URL` | `https://<REF_SUPABASE_DO_VOCACAODEMAE>.supabase.co` (provisório; muda quando o Lisieux tiver Supabase próprio — ver `supabase/LEIAME.md` do grupovdp) | env da Routine |
| `LISIEUX_SUPABASE_ANON_KEY` | chave publicável do projeto acima (pública) | env da Routine |
| `LISIEUX_STATUS_SECRET` | `select value from public.lisieux_secrets where name='writer'` (SQL Editor do projeto Vocação de Mãe) — nunca commitar | env da Routine |
| `LISIEUX_SESSION` | opcional, ex.: `rotina-2026-10-24` | env da Routine |

Comandos exatos:

```bash
node scripts/agente.mjs inicio rt-vocacaodepai "Rotina diária: E1 Search Console" <COMPANY_ID_VDP>   # 4º argumento = id da empresa (§11.1 item 7)
node scripts/agente.mjs inicio rt-vocacaodepai "E5: Pai Indica 2/5"          # a cada etapa (renova os 90 min)
node scripts/agente.mjs fim rt-vocacaodepai
node scripts/agente.mjs status                                               # lista todos
```

Sem as variáveis ou sem rede, o script avisa em uma linha no stderr e sai com 0 — nunca derruba a rotina.

### 11.3 Alternativa sem variáveis (via conector Supabase, como o LEIAME do grupovdp sugere)

Com `mcp__Supabase__execute_sql` no projeto `<REF_SUPABASE_DO_VOCACAODEMAE>`:

```sql
select agent_id from public.lisieux_set_status(
  (select value from public.lisieux_secrets where name = 'writer'),
  'rt-vocacaodepai', 'work', 'Rotina diária: início', '<COMPANY_ID_VDP>', null);   -- id da empresa, §11.1 item 7
-- ... no fim:
select agent_id from public.lisieux_set_status(
  (select value from public.lisieux_secrets where name = 'writer'),
  'rt-vocacaodepai', 'rest', '', '<COMPANY_ID_VDP>', null);
```

### 11.4 Métricas internas para o painel — `GET /api/hub/metrics`

O doc 02 §7 prevê `src/lib/hub.functions.ts` (copiado do VDM) expondo métricas internas para o grupovdp consumir; sem isso os KPIs semanais do doc 11 §11 (usos por ferramenta, vagas pendentes e tempo de moderação, membros ativos, RSVPs, perguntas sem resposta) não têm fonte no painel. Entregas:

1. **Rota** `src/routes/api/hub/metrics.ts` (`GET`, header `Authorization: Bearer HUB_API_KEY` — doc 02 §7 e §8; comparação em tempo constante; 401 sem/erro; cache de 5 min em memória). Devolve, via `hub.functions.ts` com service_role:
   ```json
   {
     "site": "vocacaodepai", "generated_at": "2026-11-01T10:00:00Z",
     "posts_published": 0, "posts_7d": 0,
     "products_active": 0,
     "affiliate_clicks_7d": null,
     "tool_usage_stats": [ { "tool_slug": "conversor-de-moedas", "uses": 0 } ],
     "jobs": { "pending": 0, "approved_7d": 0, "avg_moderation_hours": 0 },
     "members": { "total": 0, "active_7d": 0 },
     "newsletter_confirmed": 0,
     "rsvps_next_30d": 0,
     "questions_unanswered_48h": 0,
     "rotina_last_run": "2026-11-01"
   }
   ```
   Fontes (colunas do doc 02): `posts` (`status='published'`; `publish_at > now() - interval '7 days'`); `products.active`; `affiliate_clicks_7d` = GA4 Data API (evento `click_afiliado`) quando `GA4_PROPERTY_VOCACAODEPAI` + service account estiverem no servidor, senão `null` (a tabela `post_view_events` do doc 02 §4.2 só guarda views, não cliques — não usar como fallback); `public.tool_usage_stats(7)` (doc 02 §4.7); `jobs` (`status='pending'`; `status='approved' and moderated_at > now() - interval '7 days'`; `avg(extract(epoch from moderated_at - created_at))/3600` dos moderados em 30 dias); `profiles` (`count(*)`; `active_7d` = `auth.users.last_sign_in_at > now() - interval '7 days'` lido com service_role); `newsletter_subscribers` (`status='confirmed'`); `event_rsvps` com `status='going'` de `events` com `starts_at` nos próximos 30 dias; `questions` com `status='approved'`, `answers_count = 0` e `created_at < now() - interval '48 hours'`; `rotina_last_run` = campo `last_run` do JSON em `_tmp_post_staging` com `k='rotina:status'` (§13b-a).
2. **grupovdp**: em `scripts/refresh-sites.mjs`, a entrada do §11.1 ganha `metricsUrl: "https://vocacaodepai.com.br/api/hub/metrics"` e `metricsKeyEnv: "HUB_API_KEY_VOCACAODEPAI"`; o loop `for (const s of SITES)` faz `fetch(s.metricsUrl, { headers: { Authorization: "Bearer " + process.env[s.metricsKeyEnv] } })` quando os dois campos existem e grava o JSON em `data/metrics.json` → `sites.vocacaodepai.internal` (erro → `errors.internal` honesto, sem derrubar o restante). Secret `HUB_API_KEY_VOCACAODEPAI` no repositório grupovdp (Settings → Secrets → Actions) e no passo "Buscar GA4, Search Console e AdSense dos sites" de `.github/workflows/refresh-youtube.yml`. Tudo no mesmo PR `claude/vocacaodepai-no-painel` do §11.1.
3. Aceite: `curl -s -H "Authorization: Bearer $HUB_API_KEY" https://vocacaodepai.com.br/api/hub/metrics | jq .jobs` devolve os três campos; sem header → 401; após o próximo run do grupovdp, `data/metrics.json` tem `sites.vocacaodepai.internal.tool_usage_stats`.

---

## 12. Tabela de secrets

| Nome | Onde | Para quê |
| --- | --- | --- |
| `SUPABASE_URL` | GitHub Actions (vocacaodepai), Vercel, Routine | URL `https://<SUPABASE_PROJECT_REF>.supabase.co` (pública) |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | GitHub Actions, Vercel, Routine, scripts | Leitura pública (REST) para geradores e validador |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server functions) somente; também no Supabase Vault para o pg_cron da `weekly-digest` (doc 07 §6.6) | Upsert em `market_cache`, disparo manual/diário da newsletter (§8.3, §8.4), métricas do hub (§11.4), expiração de vagas |
| `MARKET_REFRESH_SECRET` | Vercel + GitHub Actions | Header `x-market-secret` de `/api/market/refresh` |
| `CRON_SECRET` | Vercel (server) + GitHub Actions + Supabase Vault (doc 02 §8) | `Authorization: Bearer` das rotas `/api/newsletter/weekly` (disparo manual), `/api/newsletter/daily` e `/api/newsletter/owner-weekly` (§8.3, §8.4, §13b-b) |
| `INTERNAL_FN_SECRET` | Supabase Vault + Vercel (server) | Header `x-internal-secret` da edge function `weekly-digest` (doc 07 §6.6); a rota manual `/api/newsletter/weekly` repassa |
| `HUB_API_KEY` | Vercel (server) + grupovdp (lá como `HUB_API_KEY_VOCACAODEPAI`) | Autoriza o Painel Lisieux a ler `GET /api/hub/metrics` (§11.4; doc 02 §7 e §8) |
| `VDM_SUPABASE_URL`, `VDM_SUPABASE_ANON_KEY` | GitHub Actions + Routine (valores públicos do Vocação de Mãe) | `validate-content.mjs --similaridade` lê títulos/excerpts publicados do VDM pela REST anon (§13b-c) |
| `JOBS_CRON_SECRET` | Vercel + GitHub Actions | Header `x-jobs-secret` de `/api/jobs/expire` |
| `RESEND_API_KEY` | Vercel + Supabase Vault (edge functions) | Envio de e-mails (newsletter semanal e diária, resumo ao dono, contato, avisos de vaga) |
| `PEXELS_API_KEY`, `PIXABAY_API_KEY` | Supabase Vault | Edge function `stock-photos` |
| `GOOGLE_CSE_API_KEY`, `GOOGLE_CSE_CX` | Supabase Vault (inativos) | Fonte Google Imagens (bloqueada; não usar) |
| `GOOGLE_SEARCH_CONSOLE_SA_JSON` | Supabase Vault | Edge function `seo-search-console` (sync + Indexing API) |
| `SEO_SYNC_INTERNAL_SECRET` | Supabase Vault + Routine | Header `x-seo-sync-secret` para a rotina disparar o sync sem service_role |
| `GA4_PROPERTY_VOCACAODEPAI` | GitHub Actions (grupovdp) | ID da propriedade GA4 para `refresh-sites.mjs` |
| `GOOGLE_SA_JSON` | GitHub Actions (grupovdp) — já existe | Service account do painel (GA4 + Search Console) |
| `LISIEUX_SUPABASE_URL`, `LISIEUX_SUPABASE_ANON_KEY`, `LISIEUX_STATUS_SECRET` | Routine do Claude Code | `scripts/agente.mjs` reportar status ao escritório |
| `VERCEL_TOKEN` (opcional) | Routine | Conferir deploy via CLI quando o MCP da Vercel não estiver carregado |
| `GITHUB_TOKEN` | automático nos workflows | `gh pr merge` no auto-merge |
| `AMAZON_ASSOCIATE_TAG` | Vercel (`VITE_…`) e código | Tag de afiliado nos `affiliate_url` (`?tag=…`) |

Nenhum segredo entra em commit, em `escritorio/config.js`, em mensagem de PR ou no resumo da rotina.

---

## 13. PROMPT COMPLETO DA ROTINA DIÁRIA (criar a Routine com este texto)

```text
Você é a rotina diária do Vocação de Pai (vocacaodepai.com.br), um editor-chefe que coordena até 5 subagentes redatores.
Repositório: vocacaodepai/vocacaodepai. Supabase: project_id <SUPABASE_PROJECT_REF>. Responda sempre em português do Brasil.
Leia primeiro CLAUDE.md e docs/plano/10-fase-8-automacao-rotinas-e-painel.md (seções 2, 3 e 4) e siga à risca.

REGRAS DURAS
- Nunca rode DROP ou DELETE. Artigo/produto novo = um INSERT (idempotente por slug). Reforma = INSERT em _tmp_post_staging + um UPDATE curto com md5. Nunca mande o body inteiro num UPDATE nem monte o body em pedaços. Se uma escrita der timeout, confira com SELECT antes de repetir. Reforma que falhar 2 vezes é pulada.
- Linha editorial católica de família tradicional (homem e mulher). Nunca conteúdo ou imagem LGBTQI. Tom direto, masculino, respeitoso, prático; sem vulgaridade, sem machismo tóxico. Termos proibidos em scripts/rotina/proibidos.json.
- Botão sempre "Comprar agora na Amazon". Nunca valor em reais no texto: use {FAIXA:slug}. Faixa de preço só com o mesmo produto em 2 lojas e max ≤ 3×min; senão não grave.
- Nunca invente especificação, nota, nº de avaliações, tendência ou fonte. Produto físico só com foto oficial da Amazon (amz.py). Capa de Pai Indica = capa composta (cover_cmp.py) commitada em public/images/covers/.
- Todo post sai publicado (status published, publish_at now()), com kind, seo_title (≤60) e seo_description (120–155).
- Não crie vagas, indicações ou histórias de exemplo. Só modere a fila pending.

PASSO A PASSO (tetos de tempo entre parênteses; estourou, registre e siga)
E0 (2 min) git fetch; git checkout -b claude/rotina-$(date +%F) origin/main; mkdir -p /tmp/rotina-pai supabase/rotina/$(date +%F). Salvaguarda: select data from public._tmp_post_staging where k='rotina:status' — se contiver "rotina_pausada":true, NÃO produza nada: registre "rotina pausada pelo guard (doc 10 §13b-a); o dono precisa liberar" no resumo e encerre. node scripts/agente.mjs inicio rt-vocacaodepai "Rotina diária: início" <COMPANY_ID_VDP>. Carregue com ToolSearch: select:mcp__Supabase__execute_sql e, se precisar, WebSearch, WebFetch, mcp__Unsplash__search_photos.
E1 (5 min) Search Console: POST na edge function seo-search-console {"action":"sync","site_url":"sc-domain:vocacaodepai.com.br","days":28} com o header x-seo-sync-secret. Leia seo_search_stats: páginas com muitas impressões e CTR baixo → candidatas a reforma; consultas sem página → temas.
E2 (8 min) Temas em alta: WebSearch pt-BR dos últimos 14 dias (paternidade, homem, família, trabalho, finanças domésticas, churrasco, ferramentas, saúde do homem, datas). Escolha ≥2 temas com fonte datada; sem fonte não é tema em alta.
E3 (5 min) Plano em /tmp/rotina-pai/plano.json: 3 temas Padrão A (categorias diferentes), 2 reformas (query "Artigos finos" da seção 2.5), 3 comparativos e 2 reviews únicas com produtos reais (ASIN conferido, não cobertos nos últimos 60 dias — query da seção 2.5). Ao menos 2 itens marcados tema_em_alta.
E4 (35 min) Loja primeiro: para cada produto dos itens de Pai Indica rode python3 scripts/rotina/amz.py <ASIN>; pesquise a faixa (price_range.py --slug … --lojas …); grave galeria oficial; escreva a review longa pelo BRIEF_REVIEW.md e aplique com review_gen.py (novo: true se não existir). Complete até 5 produtos novos no dia. Aplique cada SQL com mcp__Supabase__execute_sql, conteúdo inteiro.
E5 (35 min) Pai Indica: abra até 5 subagentes em paralelo (Agent tool), um por artigo, cada um lendo BRIEF_COMPARATIVO.md ou BRIEF_REVIEW_UNICA.md. Cada um: cover_cmp.py → JSON em /tmp/rotina-pai/ → cmp_gen.py ou rev_art_gen.py até "OK" → INSERT → SELECT de conferência → relatório de até 12 linhas. Atualize o Lisieux: node scripts/agente.mjs inicio rt-vocacaodepai "E5: Pai Indica".
E6 (30 min) Blog Padrão A do Pai: até 5 subagentes (3 novos + 2 reformas) com BRIEF_ARTIGO_PAI.md e art_gen.py. Atualize o Lisieux.
E7 (6 min) Notícia "Mercado do pai": BRIEF_NOTICIA.md + news_gen.py, 1 item com fonte ≤48h, categoria noticias + tag serie:mercado-do-pai. Na 1ª rodada do mês (ou se não houver jogada-do-dia-<AAAA-MM>-* no banco): BRIEF_JOGADA.md + jogada_gen.py geram as 30 Jogadas do Dia do mês (+10 min), um INSERT por dia com publish_at escalonado; aplique os 30 INSERTs.
E8 (20 min) Reviews longas de 10 produtos antigos (query da seção 2.5), review_gen.py, staging + UPDATE curto. Atualize o Lisieux.
E9 (10 min) Faixa de preço de até 15 produtos (price_range.py --fila 15; WebSearch por produto; grave só com 2 lojas).
E10 (8 min) python3 scripts/rotina/photo_upgrade.py 20; aplique photo_upgrade_out.sql linha a linha.
E11 (5 min) Moderação: fila pending de jobs, job_referrals, stories, questions com as regras da seção 2.6; um UPDATE curto por registro + moderation_log. Em dúvida, deixe pending e liste no resumo.
E12 (6 min) node scripts/validate-content.mjs --since 24h --images --similaridade | tee /tmp/rotina-pai/validate.log. O que reprovar: corrija, ou despublique (update posts set status='draft' where slug='…') e registre. Depois: node scripts/rotina/guard.mjs /tmp/rotina-pai/validate.log '<json atual de rotina:status>' e aplique guard_out.sql (3 reprovações seguidas pausam a rotina — doc 10 §13b-a). Confira: select count(*) from posts where status='published' and (seo_description is null or btrim(seo_description)='') deve ser 0.
E13 (2 min) Search Console notify_index com as URLs novas e reformadas.
E14 (3 min) Copie os .sql para supabase/rotina/<data>/; git add public/images/covers supabase/rotina; commit "rotina: <data>"; git push -u origin HEAD; gh pr create --base main --title "rotina: <data>" --body "<resumo>". O auto-merge mescla após o deploy da Vercel. Se o check ficar vermelho, corrija e empurre.
E15 (1 min) Grave o resumo final em _tmp_post_staging (insert into public._tmp_post_staging (k, data) values ('rotina:resumo:<data>', $r$<resumo>$r$) on conflict (k) do update set data = excluded.data) — alimenta o e-mail semanal ao dono; node scripts/agente.mjs fim rt-vocacaodepai.

RESUMO FINAL (≤40 linhas, PT-BR): artigos novos (slug, categoria, palavras, links, tema em alta + fonte); reformas; comparativos e reviews únicas (slug, produtos, faixa real ou estimativa); produtos novos e reviews longas (slugs); faixas de preço gravadas/puladas; fotos atualizadas; notícia; moderação (aprovados/rejeitados/pendentes); validador (ok/erros); Search Console (ok/erro); link do PR; pendências e erros com o motivo. Não inclua segredo nenhum.
```

---

## 13b. Salvaguardas e entregas extras da Fase 8

Itens previstos em outros docs e atribuídos à Fase 8 (doc 00 §9.1 item 4 e riscos 3/6/15; doc 01 §3.9, §4.1 ideia 30 e ideia 18; doc 02 §1.3; doc 11 §1 ordem 7; doc 13 item 8.10) que não estavam neste documento. Todos entram na mesma branch `claude/fase-8-automacao`, depois dos itens 1–8 do §15.

### 13b-a. Pausa automática da rotina — `scripts/rotina/guard.mjs`

- Estado da rotina em `_tmp_post_staging` com `k = 'rotina:status'` e `data` = JSON `{"last_run":"AAAA-MM-DD","falhas_seguidas":N,"rotina_pausada":false,"motivo":""}` (tabela interna do doc 02 §4.1, `k text primary key, data text`; escrita só via `mcp__Supabase__execute_sql`, nunca pelo anon).
- `node scripts/rotina/guard.mjs /tmp/rotina-pai/validate.log '<json do status atual>'` lê o log do validador (E12) e o status: cada item que **continua reprovado** depois das correções (linha `✗` cujo slug não voltou como `✓` nem foi despublicado) soma 1 em `falhas_seguidas`; um item aprovado zera o contador; ao chegar a **3**, grava `rotina_pausada=true` e `motivo` com os 3 slugs. Saída: `guard_out.sql` com `insert into public._tmp_post_staging (k, data) values ('rotina:status', $g$…$g$) on conflict (k) do update set data = excluded.data;`, que a rotina aplica em E12.
- Na E0 a Routine lê `select data from public._tmp_post_staging where k='rotina:status'`; com `"rotina_pausada":true` ela **não produz nada**: registra no resumo e encerra (§13 E0). O dono libera no SQL Editor com um UPDATE curto: `update public._tmp_post_staging set data = '{"last_run":null,"falhas_seguidas":0,"rotina_pausada":false,"motivo":""}' where k='rotina:status';`. Nunca `DELETE`.
- Aceite: `guard.mjs` com um log de 3 `✗` seguidos gera SQL com `"rotina_pausada":true`; com `✗ ✓ ✗` deixa `falhas_seguidas=1`.

### 13b-b. E-mail semanal "o que publiquei" para o dono — `/api/newsletter/owner-weekly`

- Rota `src/routes/api/newsletter/owner-weekly.ts` (`POST`, `Authorization: Bearer CRON_SECRET`), disparada pelo job `owner-weekly` de `newsletter-daily.yml` (sexta 18:00 BRT, §8.4). Envia via Resend para `CONTACT_TO_EMAIL` (doc 02 §8), assunto "Vocação de Pai — semana de <dd/mm> a <dd/mm>".
- Corpo (texto simples + lista de links): publicados nos últimos 7 dias por `kind` (`select kind, count(*) from posts where status='published' and publish_at > now() - interval '7 days' group by kind`) com título e link; produtos novos e reviews longas (`products.created_at`/`updated_at` em 7 dias); fila `pending` (`jobs`, `job_referrals`, `stories`, `questions`) com link para `/admin`; itens que a rotina deixou em dúvida e posts despublicados pelo validador (`status='draft'` com `updated_at` em 7 dias); os 7 resumos diários (`_tmp_post_staging` com `k like 'rotina:resumo:%'` dos últimos 7 dias, gravados em §13 E15); o status do guard (`rotina:status`) com aviso em destaque se `rotina_pausada=true`. Sem segredo no corpo.
- Aceite: `curl -X POST … -H "Authorization: Bearer $CRON_SECRET"` entrega o e-mail ao dono com as contagens batendo com o SQL acima.

### 13b-c. Similaridade com o Vocação de Mãe — `validate-content.mjs --similaridade`

- Risco documentado (doc 00 §9.1 item 4 e riscos 3/6): a rotina do VDP reaproveitar pauta do VDM e os dois sites competirem no Google. Com `--similaridade`, o validador baixa uma vez por execução `slug,title,excerpt` dos posts publicados do VDM pela REST anon pública (`${VDM_SUPABASE_URL}/rest/v1/posts?select=slug,title,excerpt&status=eq.published&limit=5000`, header `apikey: VDM_SUPABASE_ANON_KEY`; valores públicos, lidos de env — §12) e, para cada post validado, compara `title + " " + primeiros 300 caracteres do texto do body` com `title + " " + excerpt` de cada post do VDM pelo coeficiente de Dice sobre bigramas de palavras (minúsculas, sem acento, sem stopwords). Similaridade **> 0,60** reprova (`✗ … similar a vocacaodemae:/post/<slug> (0,72)`).
- Sem `VDM_SUPABASE_URL` no ambiente, o validador avisa em uma linha e pula a checagem (não derruba o CI). A rotina roda com a flag em E12; o `validate.yml` roda com a flag no domingo (`--all`).
- Aceite: um post de teste com o título e a abertura copiados de um artigo do VDM é reprovado; um artigo próprio sobre o mesmo tema (texto diferente) passa.

### 13b-d. `/loja/ofertas` — faixas pesquisadas nos últimos 7 dias

- Rota `src/routes/_site/loja/ofertas.tsx` (listada no doc 02 §1.3 como rota extra da Loja do Pai; doc 01 ideia 18). Sem tabela nova: a esteira de faixa de preço (E9) já grava `products.price_range_checked_at` e `product_price_checks`. A página mostra **até 10** produtos ativos com pesquisa de até 7 dias, priorizando os que ficaram mais baratos. Como `product_price_checks` só tem leitura de staff (doc 02 §4.3), criar em `supabase/migrations/00NN_loja_ofertas.sql` a função `public.get_loja_ofertas()` (`security definer`, `grant execute to anon, authenticated`) que devolve:
  ```sql
  select p.slug, p.name, p.image_url, p.price_min, p.price_max, p.price_range_checked_at,
         (select min(c.price) from public.product_price_checks c where c.product_id = p.id and c.checked_at > now() - interval '7 days') as menor_7d,
         (select min(c.price) from public.product_price_checks c where c.product_id = p.id and c.checked_at between now() - interval '60 days' and now() - interval '7 days') as menor_anterior
  from public.products p
  where p.active and p.price_range_checked_at > now() - interval '7 days' and p.price_min is not null
  order by (case when (select min(c.price) from public.product_price_checks c where c.product_id = p.id and c.checked_at between now() - interval '60 days' and now() - interval '7 days') >
                      (select min(c.price) from public.product_price_checks c where c.product_id = p.id and c.checked_at > now() - interval '7 days') then 0 else 1 end),
           p.price_range_checked_at desc
  limit 10;
  ```
- Cada card usa os mesmos componentes da loja (faixa "Faixa de preço pesquisada em <data>: R$ X a R$ Y", botão "Comprar agora na Amazon", aviso de afiliado); selo "caiu de preço" só quando `menor_7d < menor_anterior`. Nunca preço exato, nunca "oferta da Amazon". Título: "Ofertas que valem — faixas pesquisadas esta semana". Entra no sitemap e no menu da Loja.
- Aceite: com 3 produtos pesquisados hoje, a página lista os 3; com nenhum, mostra "Nenhuma faixa pesquisada nos últimos 7 dias" e link para `/loja`.

### 13b-e. `/anuncie` — mídia kit

- Rota `src/routes/_site/anuncie.tsx` (doc 02 §1.3, Institucional; doc 01 §3.9 e ideia 30; doc 11 §1 ordem 7). Página estática em PT-BR: quem é o leitor (pai, 25–45 anos, decisor de compra da casa), números públicos atualizados à mão pelo dono (visitas/mês, assinantes, seguidores — placeholders até o GA4 ter 30 dias), formatos oferecidos em **faixas** de investimento (post patrocinado, Pai Indica patrocinado com selo "conteúdo pago", banner na newsletter, menção na Jogada do Dia), regras editoriais (linha editorial do §1; nada de bet, bebida para menores, conteúdo adulto) e formulário "Quero anunciar" com nome, e-mail, empresa, mensagem e Turnstile (mesmo widget e verificação server-side do doc 07 §4.4), gravando em `contact_messages` com `subject='anuncie'` (tabela do doc 02 §4.1) e disparando a edge function `notify-contact-message` já existente.
- `seo_title` "Anuncie no Vocação de Pai"; página pública (sem `noindex`); link no rodapé ao lado de "Política de afiliados".
- Aceite: envio do formulário cria a linha em `contact_messages` e o dono recebe o e-mail; sem token Turnstile → 400.

### 13b-f. Backlog pós-Fase 8 (não executar sem doc próprio)

`/podcast` (episódios + transcrição) e push de novo artigo no PWA (PLANO-MESTRE §8 ideias 14 e 15; doc 02 §1.3 "Futuro") ficam **fora** da Fase 8: não criar rota, tabela nem workflow para eles. Registrar em `PROGRESSO.md` → "Backlog" quando a fase fechar.

---

## 14. Critérios de aceite da Fase 8

1. `scripts/rotina/` contém: `art_gen.py`, `cmp_gen.py`, `rev_art_gen.py`, `review_gen.py`, `cover_cmp.py`, `amz.py`, `photo_upgrade.py`, `price_range.py`, `news_gen.py`, `jogada_gen.py`, `guard.mjs`, `slugs.sh`, `proibidos.json`, `exemplo_artigo.json`, `README.md`, `BRIEF_ARTIGO_PAI.md`, `BRIEF_COMPARATIVO.md`, `BRIEF_REVIEW_UNICA.md`, `BRIEF_REVIEW.md`, `BRIEF_NOTICIA.md`, `BRIEF_JOGADA.md`. Nenhum contém `<REF_SUPABASE_DO_VOCACAODEMAE>`, "mãe" ou "Review de Mãe".
2. `python3 scripts/rotina/art_gen.py scripts/rotina/exemplo_artigo.json` imprime "OK" e gera um `.insert.sql` com `kind='artigo'`, ≥1100 palavras, ≥10 links, semáforo "Sinal verde/atenção/alerta".
3. `python3 scripts/rotina/cover_cmp.py teste "A=<url>" "B=<url>"` gera `public/images/covers/teste.jpg` 1280×720 com degradê areia e faixa azul-petróleo/âmbar (apagar depois).
4. `node scripts/validate-content.mjs --all` roda sem exceção e reprova corretamente um post de teste com "R$ 10" no texto ou com 2 callouts.
5. Os 6 workflows existem (`validate.yml` com `node-version: 22`), têm YAML válido (`actionlint` ou `gh workflow list`) e `market-refresh` executou com sucesso via `workflow_dispatch`; `market_cache.fetched_at` < 35 min.
6. `newsletter-weekly.yml` (`workflow_dispatch`, `dry_run=true`) devolve contagem por segmento `fase:*` e o template da `weekly-digest` traz "Sua formação" e "Pai Indica da semana"; um envio de teste chegou ao e-mail do dono; `newsletter-daily.yml` (job `daily`) entregou uma Jogada do Dia de teste e gravou `daily_sent` em `moderation_log` (§8.4).
7. `jobs-expire` expirou uma vaga de teste vencida.
8. Edge functions `stock-photos` e `seo-search-console` deployadas no projeto novo; `{"action":"list_sites"}` devolve `sc-domain:vocacaodepai.com.br`.
9. PR aberto no grupovdp com `SITES` + `ROUTINES` + secret `GA4_PROPERTY_VOCACAODEPAI`; `node scripts/agente.mjs status` lista `rt-vocacaodepai`.
10. A Routine "Vocação de Pai: rotina diária" existe em claude.ai/code com o prompt do §13 e as variáveis do §11.2, e a primeira execução real abriu um PR `claude/rotina-*` mesclado sozinho, com o resumo em PT-BR e sem segredo exposto.
11. Depois da primeira rodada: `select kind, count(*) from posts where publish_at > now() - interval '1 day' group by kind` mostra artigo ≥3, comparativo ≥3, review ≥2, noticia ≥1; `select count(*) from products where created_at > now() - interval '1 day'` ≥ 5; `select count(*) from products where review is not null and updated_at > now() - interval '1 day'` ≥ 15.
12. `CLAUDE.md` do vocacaodepai ganhou as seções "Rotina diária", "Como escrever no banco", "Padrão A do Pai", "Pai Indica", "Faixa de preço", "Imagens" (adaptadas do VDM), e `docs/plano/PROGRESSO.md` marca a Fase 8 como concluída.
13. Jogada do Dia: `python3 scripts/rotina/jogada_gen.py` com o JSON do mês gera um `.insert.sql` por dia (80–120 palavras, 1 link, tag `serie:jogada-do-dia`); `select count(*) from posts where slug like 'jogada-do-dia-<AAAA-MM>-%'` = dias do mês; `validate-content.mjs` aprova as jogadas (exceção §5.1) e reprova uma com 2 links.
14. `GET /api/hub/metrics` com `HUB_API_KEY` devolve o JSON do §11.4; sem header → 401; `validate-content.mjs --similaridade` reprova um post copiado do VDM (§13b-c).
15. Salvaguardas e extras do §13b: `guard.mjs` pausa a rotina após 3 reprovações seguidas e a Routine encerra em E0 com `rotina_pausada=true`; `/api/newsletter/owner-weekly` entregou o resumo ao dono; `/loja/ofertas` e `/anuncie` no ar (formulário gravando em `contact_messages`); `/podcast` e push PWA registrados como backlog, sem código.

---

## 15. Prompt para iniciar esta fase no Sonnet

```text
Você está em /home/user/vocacaodepai (TanStack Start + Supabase <SUPABASE_PROJECT_REF> + Vercel). Vamos executar a FASE 8 do plano:
leia docs/plano/10-fase-8-automacao-rotinas-e-painel.md inteiro e, se existir, docs/plano/02-arquitetura-e-stack.md (ele prevalece em nomes de colunas).
Repositórios de referência, só leitura: /home/user/vocacaodemae (scripts/rotina/*, CLAUDE.md, .github/workflows/auto-merge.yml, supabase/functions/stock-photos e seo-search-console) e /home/user/grupovdp (scripts/agente.mjs, scripts/refresh-sites.mjs, escritorio/data.js).

Faça, nesta ordem, em uma branch claude/fase-8-automacao, com commits pequenos e PT-BR:
1. Copie scripts/rotina/ do vocacaodemae e aplique as adaptações da seção 4 (tabela 4.1 e substituições 4.3): art_gen.py novo (une gen/rgen/helpers; semáforo "Sinal verde/atenção/alerta"; kind='artigo'), cmp_gen.py e rev_art_gen.py com kind/comparison/review/product_category/product_score, review_gen.py com as colunas do BRIEF, cover_cmp.py com as cores do Vocação de Pai (4.5), price_range.py, news_gen.py e jogada_gen.py novos (4.6, 4.4 e 4.7), guard.mjs (13b-a), slugs.sh (slugs de ferramenta lidos de src/lib/tools/registry.ts), proibidos.json, exemplo_artigo.json, README.md. Grave BRIEF_ARTIGO_PAI.md exatamente como está na seção 4.2, BRIEF_NOTICIA.md como na 4.4 e BRIEF_JOGADA.md como na 4.7; copie e adapte os outros três BRIEFs. Categorias e tags: só os slugs do doc 02 §4.2 (categoria `noticias` + tag `serie:mercado-do-pai` para a notícia; tags `fase-*`). Nenhum arquivo pode conter o ref do Supabase do VDM, "mãe" ou "Review de Mãe".
2. Escreva scripts/validate-content.mjs conforme a seção 5 (regras por kind, R$, termos proibidos, capa única e ≠ inline, review/comparison válidos, produtos existem, ferramentas conferidas em TOOLS de src/lib/tools/registry.ts, exceção da Jogada do Dia, --images, --similaridade da 13b-c) e adicione "validate:content" ao package.json.
3. Crie src/routes/api/market/refresh.ts (seção 7) e src/routes/api/jobs/expire.ts (seção 9). Newsletter (seção 8): NÃO crie outra implementação do envio semanal — ele é a edge function weekly-digest + pg_cron da Fase 5 (doc 07 §6.6); acrescente ao template de supabase/functions/_shared/email-templates.ts os blocos "Sua formação" e "Pai Indica da semana" (8.2) e faça o redeploy da função; crie src/routes/api/newsletter/weekly.ts como disparo manual (8.3), src/routes/api/newsletter/unsubscribe.ts (8.3), src/routes/api/newsletter/daily.ts (8.4, Jogada do Dia) e src/routes/api/newsletter/owner-weekly.ts (13b-b), todas com Authorization: Bearer CRON_SECRET. Crie src/routes/api/hub/metrics.ts com HUB_API_KEY (11.4). Sem segredo no código.
4. Crie os 6 workflows da seção 10 (auto-merge.yml, validate.yml com node-version 22, market-refresh.yml, newsletter-weekly.yml só com workflow_dispatch, newsletter-daily.yml, jobs-expire.yml) com o YAML exatamente como está no documento.
5. Copie supabase/functions/stock-photos e supabase/functions/seo-search-console do vocacaodemae; troque o domínio para vocacaodepai.com.br; faça o deploy com mcp__Supabase__deploy_edge_function no projeto <SUPABASE_PROJECT_REF>; crie os secrets do Vault listados na seção 12 com os valores que o dono fornecer (se não fornecer, deixe um TODO claro no resumo, nunca invente).
6. Copie /home/user/grupovdp/scripts/agente.mjs para scripts/agente.mjs sem alterar. Prepare (em /tmp/grupovdp-pr/) o diff das seções 11.1 e 11.4 para o repositório grupovdp (SITES com metricsUrl/metricsKeyEnv, workflow com GA4_PROPERTY_VOCACAODEPAI e HUB_API_KEY_VOCACAODEPAI, ROUTINES com o id de empresa conferido em COMPANIES — registre o id em PROGRESSO.md) e descreva no resumo como abrir esse PR.
6b. Entregas extras da seção 13b: guard.mjs, /api/newsletter/owner-weekly, --similaridade, /loja/ofertas (função get_loja_ofertas em migration nova), /anuncie (Turnstile → contact_messages). /podcast e push PWA ficam no backlog, sem código.
7. Atualize CLAUDE.md com as seções da seção 14 item 12 e docs/plano/PROGRESSO.md.
8. Rode os critérios de aceite 1 a 5 da seção 14 (gere e apague a capa de teste; valide YAML com gh workflow list após o push). Abra o PR contra main com o resumo em PT-BR.
9. Entregue no final: o texto da seção 13 (prompt da Routine) pronto para colar em claude.ai/code → Routines, a lista de variáveis de ambiente da Routine (seção 11.2) e a tabela de secrets que ainda faltam ser preenchidos pelo dono.
Regras: nunca DROP/DELETE; nunca commitar segredo; nunca "Ver preço na Amazon"; nunca valor em reais em texto de conteúdo; PT-BR em tudo.
```

---

## 16. Checklist de pronto

- [ ] `scripts/rotina/` completo (18 arquivos da seção 14.1), sem resíduos do VDM
- [ ] `art_gen.py` valida exemplo e gera INSERT com `kind='artigo'` e semáforo do pai
- [ ] `cmp_gen.py` / `rev_art_gen.py` preenchem `kind`, `comparison`/`review`, `product_category`, `product_subcategory`, `product_score`
- [ ] `review_gen.py` grava `products` com `asin`, `affiliate_network`, `price_min/max`, `review`, `pros`, `cons`
- [ ] `cover_cmp.py` nas cores do Vocação de Pai (areia → faixa petróleo/âmbar)
- [ ] `price_range.py`, `news_gen.py`, `jogada_gen.py` e `guard.mjs` funcionando
- [ ] `BRIEF_ARTIGO_PAI.md`, `BRIEF_NOTICIA.md`, `BRIEF_JOGADA.md` gravados como no documento; outros 3 BRIEFs adaptados
- [ ] `scripts/validate-content.mjs` com todas as regras da seção 5, `--images` e `--similaridade`; ferramentas conferidas em `src/lib/tools/registry.ts`
- [ ] Server functions `/api/market/refresh`, `/api/newsletter/weekly` (disparo manual), `/api/newsletter/unsubscribe`, `/api/newsletter/daily`, `/api/newsletter/owner-weekly`, `/api/jobs/expire` protegidas por segredo; `/api/hub/metrics` por `HUB_API_KEY`
- [ ] 6 workflows criados e válidos (`validate.yml` com Node 22; `newsletter-weekly.yml` sem schedule); `validate` marcado como required check em `main`
- [ ] Edge functions `stock-photos` e `seo-search-console` deployadas no projeto novo; `weekly-digest` redeployada com os blocos "Sua formação" e "Pai Indica da semana"
- [ ] Secrets do Vault, da Vercel e do GitHub preenchidos (ou TODO explícito no resumo)
- [ ] `scripts/agente.mjs` copiado; diff do grupovdp preparado (SITES com `metricsUrl`, workflow, ROUTINES com id de empresa conferido, secrets `GA4_PROPERTY_VOCACAODEPAI` e `HUB_API_KEY_VOCACAODEPAI`)
- [ ] Jogadas do Dia do mês corrente no banco (`jogada-do-dia-AAAA-MM-*`); e-mail diário de teste entregue
- [ ] §13b: `guard.mjs` testado; e-mail semanal ao dono entregue; `--similaridade` reprovando cópia do VDM; `/loja/ofertas` e `/anuncie` no ar; `/podcast` e push PWA só no backlog
- [ ] Service account adicionada no GA4 e no Search Console do Vocação de Pai
- [ ] Routine "Vocação de Pai: rotina diária" criada com o prompt da seção 13 e variáveis da 11.2 (05:37 America/Sao_Paulo)
- [ ] Primeira rodada real: PR `claude/rotina-*` mesclado sozinho, resumo em PT-BR, contagens do aceite 11 batendo
- [ ] `CLAUDE.md` e `docs/plano/PROGRESSO.md` atualizados
