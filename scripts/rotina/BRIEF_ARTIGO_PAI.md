# Briefing: artigo Padrão A do Pai (novo ou reforma)

Você escreve UM artigo informativo do blog Vocação de Pai (vocacaodepai.com.br) e o grava no banco.
Responda sempre em português do Brasil. Nunca use DROP/DELETE. Projeto Supabase: `<SUPABASE_PROJECT_REF>`.
Público: homens que são pais (ou vão ser), maridos, provedores. Voz: direta, masculina, respeitosa,
prática, com humor seco quando couber; sem vulgaridade, sem machismo tóxico, sem autoajuda vazia.
Visão católica de família tradicional (homem e mulher, pai e mãe). Nunca conteúdo ou imagem LGBTQI.

## Ferramentas (em `scripts/rotina/`)
- `art_gen.py`: `python3 scripts/rotina/art_gen.py arquivo.json --out /tmp/rotina-pai` (novo) gera `<slug>.insert.sql`;
  `python3 scripts/rotina/art_gen.py --reforma arquivo.json --out /tmp/rotina-pai` gera `<slug>.stg.sql` + `<slug>.upd.sql`.
  Ele valida: palavras, links reais, semáforo, tabela, checklist, "R$", termos proibidos, capa ≠ inline, SEO, faq/quiz.
  Só grave o SQL depois de ele imprimir "OK". `--slugs /tmp/rotina-pai/slugs.txt` usa o universo de links gravado por `slugs.sh`.
- `slugs.sh`: `bash scripts/rotina/slugs.sh /tmp/rotina-pai/slugs.txt` grava os hrefs válidos (`/post/`, `/pai-indica/`, `/loja/`,
  `/ferramentas/`, `/formacao/`, `/desafios/`, `/categoria/`). Sem banco, usa os seeds do repositório.
- `exemplo_artigo.json`: artigo real completo (forma com `body` Tiptap pronto). A forma estruturada está abaixo; as duas são aceitas.
- `proibidos.json`: termos proibidos (lista única, lida também pelo validador).
- Trabalhe em `/tmp/rotina-pai/` (crie se não existir).

## Estrutura obrigatória do `body` (Tiptap JSON), nesta ordem (CLAUDE.md §6)
1. Abertura: 2 parágrafos sem heading. O 1º dá o contexto (a situação do pai). O 2º diz o que o artigo
   vai resolver e já traz 1 link interno.
2. Seções com `heading` nível 2 em forma de frase ou pergunta ("O que muda no sono do pai no 1º mês",
   "Vale a pena comprar uma parrilla?"). Cada seção: 1 ou 2 parágrafos curtos, ou uma `bulletList`
   seguida de 1 parágrafo com link. Mínimo 5 seções.
3. Semáforo do pai (obrigatório em todo artigo Padrão A — o validador exige):
   - `heading` nível 2 "Semáforo do pai: <tema>";
   - EXATAMENTE 3 blocos `callout` seguidos, nesta ordem:
     `tone: "ok"`   → texto começa por "Sinal verde: ";
     `tone: "warn"` → texto começa por "Sinal de atenção: ";
     `tone: "bad"`  → texto começa por "Sinal de alerta: " e termina com a orientação concreta e o profissional certo
                      (procurar o médico/pediatra, parar a obra e chamar o eletricista, falar com o advogado, o padre, o contador...).
   - Sem link dentro do callout; sem 4º callout em outro ponto.
4. Listas: `bulletList` por padrão; `orderedList` só para passo a passo real (receita, montagem, instalação).
5. Links internos contextuais: MÍNIMO 10 destinos distintos por artigo, para slugs REAIS (confira em slugs.txt), tecidos no
   meio das frases ao longo do texto. Vale `/post/<slug>`, `/pai-indica/<slug>`, `/loja/<slug>`,
   `/ferramentas/<slug>`, `/formacao/<slug>`, `/categoria/<slug>`. Os do "Continue lendo" contam, mas sozinhos não bastam.
   Formato: `marks: [{type:"link", attrs:{href:"/post/<slug>", class:null, rel:null, target:null}}]` (ou `[texto](/post/slug)` na forma estruturada).
6. Imagem inline (opcional, 0 a 2): bloco `image` com `attrs:{src, alt, title:null}`. NUNCA repetir a capa
   (comparar URL sem o `?`). Foto nova, do assunto da seção, não usada em outro post. Ver regra de imagens.
7. Tabela (`table` > `tableRow` > `tableHeader`/`tableCell`) com colunas do tema, sob um heading nível 2
   (ex.: "Corte / Para que serve / Tempo na grelha").
8. Checklist: `taskList` com 5 ou 6 `taskItem` (`attrs:{checked:false}`), itens curtos sem ponto final, sob o
   heading "Checklist do pai: <tema>"; o último é "Ficar atento aos sinais do semáforo acima".
9. Fechamento: 1 parágrafo de reforço, firme e encorajador, sem links; depois 1 parágrafo "Continue lendo: "
   com 4 a 10 links, texto = título do post com inicial maiúscula, separados por ", " e o último com " e ", fim em ".".

`faq` (3 a 6, `{question, answer}`) e `quiz` (3 a 5, `{question, options[4], correct (índice 0-based), explanation}`)
são colunas separadas; pelo menos um dos dois. `kind = 'artigo'`. `subtitle` 50–220 caracteres (obrigatório, diferente
do título e do excerpt). `excerpt` ≤ 160. `seo_title` ≤ 60 caracteres; `seo_description` 120–155 caracteres.
Toda tag de fase vai em `tags` (`fase-gestacao`, `fase-recem-nascido`, `fase-bebe`, `fase-primeira-infancia`, `fase-infancia`,
`fase-pre-adolescencia`, `fase-adolescencia`, `fase-adulto` ou `fase-todas`; sem nenhuma, o gerador põe `fase-todas`).

## Tamanho e qualidade
- 1200 a 2200 palavras (novo e reforma; mire 1300–1600).
- Fatos com fonte (site oficial, lei, SBP, Ministério da Saúde, Inmetro, fabricante, IBGE). Sem diagnóstico,
  sem dose de remédio, sem promessa de resultado. Sempre orientar a procurar o profissional certo.
- Dinheiro: nunca valor em reais no texto. Para produto da loja use `{FAIXA:slug}`; para outras quantias use
  ordem de grandeza ("algumas centenas de reais") ou percentuais.
- Pode citar produtos da Loja do Pai (`/loja/<slug>`) e comparativos (`/pai-indica/<slug>`) só se o slug existir.

## Linha editorial (obrigatória)
Família = homem e mulher. Pai como marido, provedor, educador e líder servidor. Respeito à esposa sempre.
Proibidos: conteúdo/imagem LGBTQI; vulgaridade; piada com a esposa; "macho alfa", "red pill", "mulher tem que";
apostas/bet; conteúdo adulto; dica de "pegar mulher". Nunca usar a categoria Fé e virtude (`fe-e-virtude`) para artigo da rotina
(ela é editorial, escrita pelo dono), nem `historias-de-pai` (conteúdo de membros).

## Categorias do blog (slugs reais do `0002_blog.sql`; confirme com `select slug from categories where parent_id is null`)
`paternidade-por-fase`, `casamento-e-familia`, `provedor-e-carreira`, `dinheiro-do-pai`, `corpo-e-saude-do-homem`,
`churrasco-e-cozinha`, `caixa-de-ferramentas-e-reparos`, `carro-e-moto`, `estilo-e-cuidados`, `esporte-e-lazer-com-os-filhos`,
`tecnologia-do-pai`, `direitos-do-pai`. Prefira a **subcategoria** quando ela existir (ex.: `gestacao-e-parto`, `recem-nascido`,
`orcamento-familiar`: `select slug from categories where parent_id is not null`); a listagem da categoria-mãe inclui as filhas.
`fe-e-virtude` e `historias-de-pai` só o dono; `pai-indica` só reviews; `noticias` só notícias (série "Mercado do pai" pela tag
`serie:mercado-do-pai`). Fase do filho é tag (`fase-<slug>` ou `fase-todas`), nunca categoria.

## Fontes e imagens
- Capa (só novo): cascata Pexels → Pixabay → Unsplash (`mcp__Unsplash__search_photos`, URL do CDN `images.unsplash.com`) →
  Wikimedia Commons (só CC0/CC BY/CC BY-SA, com atribuição no `title`), ou a edge function `stock-photos`
  (`POST {query, source, per_page}`). Preferir: homem sozinho, pai com filho(a), objeto, cena de trabalho/cozinha/oficina.
  Nunca "casal" genérico sem conferir. Conferir com HEAD (200). Não repetir nenhuma capa já usada: `select cover_image_url from posts`.
- Produto físico: só foto oficial da Amazon (`amz.py`, `_AC_SL1500_`, HTTP 200 e > 15 KB).

## Temas em alta (≥ 2 por dia, somando artigos e Pai Indica)
1. WebSearch (pt-BR, ≤ 14 dias): Google Trends BR em paternidade/família/homem, notícias (licença-paternidade,
   INSS, IR, reajustes, recall Inmetro/Anvisa, saúde do homem, Novembro Azul, campanhas), virais em grupos de pais,
   sazonalidade (Dia dos Pais, férias, volta às aulas, Black Friday, Natal, churrasco de fim de ano).
2. Confirmar com ≥ 1 fonte datada (≤ 14 dias) citada no texto com data e link externo confiável; preencher
   `tema_em_alta: {fonte, data}` no JSON (o gerador exige o link no texto). Sem fonte, não é tema em alta.
3. Tom sereno e útil; nunca alarmista. No resumo, listar quais itens foram "tema em alta" e a fonte.

## Reforma
Mantém id, slug, categoria, publish_at e capa; reescreve body/excerpt/subtitle/faq/seo pelo staging
(INSERT em `_tmp_post_staging` + UPDATE curto com md5). Nunca mande o body inteiro dentro de um UPDATE.
Antes, leia o body atual (`select body from posts where slug='…'`) e preserve o que é bom. Fila de reforma:
query "Artigos finos" do doc 10 §2.5 (< 1200 palavras ou < 10 links).

## Esquema do JSON (forma estruturada; o `art_gen.py` monta o body na ordem acima)
```json
{
  "slug": "primeiro-mes-do-bebe-o-que-o-pai-precisa-saber",
  "title": "Primeiro mês do bebê: o que o pai precisa saber",
  "subtitle": "50 a 220 caracteres, complementa o título sem repetir o excerpt",
  "excerpt": "Até 160 caracteres.",
  "seo_title": "até 60 caracteres",
  "seo_description": "120 a 155 caracteres",
  "category": "recem-nascido",
  "kind": "artigo",
  "cover": "https://…", "cover_alt": "Pai segurando o filho recém-nascido",
  "tags": ["fase-recem-nascido"],
  "abertura": ["parágrafo 1", "parágrafo 2 com [um link](/post/slug-real)"],
  "secoes": [
    {"titulo": "O que muda na primeira semana", "paragrafos": ["…", "…"]},
    {"titulo": "Como dividir a noite com a esposa", "lista": ["item", "item"], "paragrafos_depois": ["parágrafo com [link](/post/…)"],
     "imagem": {"src": "https://…", "alt": "…"}}
  ],
  "posicao_semaforo": 3,
  "semaforo": {"tema": "o primeiro mês", "ok": "Sinal verde: …", "atencao": "Sinal de atenção: …", "alerta": "Sinal de alerta: … procure o pediatra."},
  "tabela": {"titulo": "O que fazer em cada semana", "colunas": ["Semana", "Tarefa do pai"], "linhas": [["1", "Registro civil"], ["2", "…"]]},
  "checklist": {"tema": "primeiro mês", "itens": ["Item curto", "…", "Ficar atento aos sinais do semáforo acima"]},
  "fechamento": "Parágrafo firme e encorajador, sem links.",
  "continue_lendo": [{"title": "Título do post", "href": "/post/slug-real"}, "… 4 a 10"],
  "faq": [{"question": "…", "answer": "…"}],
  "quiz": [{"question": "…", "options": ["a", "b", "c", "d"], "correct": 0, "explanation": "…"}],
  "tema_em_alta": {"fonte": "https://…", "data": "2026-10-20"}
}
```
`posicao_semaforo` (opcional) = depois de qual seção o semáforo entra; sem ele, entra depois da última seção.
Em vez da forma estruturada você pode mandar `"body": {"type":"doc","content":[…]}` já em Tiptap (ver `exemplo_artigo.json`).

## Aplicar no banco
`mcp__Supabase__execute_sql` (project_id `<SUPABASE_PROJECT_REF>`), SQL VERBATIM do arquivo. Novo = 1 chamada
(INSERT + tags). Reforma = 2 chamadas (stg, depois upd). Depois confira:
`select slug, kind, status, reading_time from posts where slug='…'` e `node scripts/validate-content.mjs --slug <slug>`.
Timeout → SELECT antes de repetir. Reforma falhou 2× → desista e relate.

## Entrega
Salve o SQL em `/tmp/rotina-pai/` e copie para `supabase/rotina/<AAAA-MM-DD>/`. Informe: slug, título, categoria,
nº de palavras, nº de links, se foi tema em alta (fonte), caminho do(s) .sql e ressalvas. NÃO faça git (a rotina faz).
