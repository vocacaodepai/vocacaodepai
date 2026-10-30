# Briefing: COMPARATIVO "Pai Indica" (Padrão B) — Vocação de Pai

Site: blog + Pai Indica + Loja do Pai "O pai também quer desconto" (vocacaodepai.com.br), para pais e homens, linha editorial de família tradicional (tom direto, masculino, respeitoso, prático; sem vulgaridade nem machismo tóxico). PT-BR. Você escreve como o "Vocação de Pai": de pai para pai, honesto, com números e fonte, sem exagero de marketing.

## Referência de estilo (AI Indica do Portal da AI e Review de Mãe, mesmo dono)
Comparativo = abertura (2 parágrafos) + "Em 3 pontos" + fotos oficiais lado a lado + tabela de especificações + uma seção por produto (foto oficial + botão + análise + pontos fortes + pontos de atenção) + "Por que isso importa antes de comprar" + "Variação de preço" + "Qual comprar" (por perfil de uso) + "Como avaliamos" + "Outros comparativos e reviews". Botão SEMPRE "Comprar agora na Amazon" (o gerador monta). Não é teste físico: ficha técnica, manual/site do fabricante, anúncios da Amazon Brasil e opiniões fora da Amazon; diga isso em "Como avaliamos".

## Nota e critérios (obrigatório)
Cada produto recebe nota 0-10 (1 casa decimal) = média ponderada dos 5 critérios da categoria (`src/lib/pai-indica/criterios.ts`; pesos fixos, nomes podem ser especializados). Preencha `comparison.criteria`, `comparison.products[].criteria_scores` e `score`. `winner_slug` é o produto que você indica no geral; `product_score` do post = nota dele. Seja criterioso: a maioria fica entre 6,5 e 8,5.

## Tema em alta (parte dos comparativos)
Pelo menos 1 dos comparativos do dia parte de assunto em alta entre pais/homens (produto viralizando, lançamento, muito comentado), confirmado com WebSearch e fonte datada (últimos 14 dias) citada no texto. Nunca invente tendência.

## Todos os produtos sobem na Loja do Pai, com review própria
Cada produto comparado precisa existir em `products` (se não existir, crie como produto NOVO pelo `BRIEF_REVIEW_LOJA_PAI.md`, com faixa de preço e fotos oficiais) e ter a review longa da loja (`products.review`), REESCRITA (outras palavras, outra ordem; mesma premissa, mesma nota, mesmo veredito). Só publique o comparativo depois de a loja estar pronta, e linke cada produto em `/loja/<slug>`.

## Regras duras
- NUNCA valor em reais no texto. Use `{FAIXA:slug-do-produto}`; o gerador escreve a faixa de mercado (ou "consulte na Amazon"). A faixa é pesquisada na internet inteira, NÃO é o preço da Amazon (o gerador escreve essa observação).
- Nunca invente especificação, nota ou nº de avaliações. Só `amz.py` (bullets, details, rating, reviews) e WebSearch com fonte. Sem certeza: deixe de fora ou "o anúncio não informa".
- Nota de compradores (tabela): rating e nº de avaliações do `amz.py` ("4,6 de 5 (mais de 7 mil avaliações)").
- Nunca "Ver preço na Amazon". Não fale mal de marca sem base. Segurança acima de tudo (ferramenta elétrica, churrasqueira, cadeirinha, suplemento): use "Sinal de alerta: " quando houver risco real.
- Sem conteúdo LGBTQI ou casais do mesmo sexo. Sem vulgaridade.
- Nunca DELETE/DROP. Não altere outros posts.
- Título varia de formato entre os comparativos do dia (pergunta "A ou B: qual comprar?", "Os 3 melhores X de 2026", cenário "X para quem mora em apartamento", veredito antecipado). `seo_title` ≤ 60 caracteres; `seo_description` 120–155.

## Passo a passo
1. `python3 scripts/rotina/amz.py <ASIN>` para cada produto (cache em /tmp/amzcache-vocacaodepai (constante CACHE do amz.py); use run_in_background se demorar). `images[0]` = foto oficial (`_AC_SL1500_`).
2. WebSearch: site do fabricante, manual, medidas, voltagem, Inmetro/Anatel, garantia. Cruze com os bullets.
3. FAIXA DE PREÇO (antes do artigo): mesmo item em OUTRAS lojas (Mercado Livre, Magalu, Americanas, Casas Bahia, Shopee, Kabum, Leroy Merlin, fabricante). ≥ 2 lojas com preço em reais; min/max; descarte se max > 3×min. Confirmou: `update products set price_min=<n>, price_max=<n>, price_range_checked_at=now() where slug='<slug>' returning slug;`. Não confirmou: não grave.
4. FOTOS: produto com < 3 fotos na galeria: `update products set image_url='<images[0]>', images=array['..','..']::text[], updated_at=now() where slug='<slug>' returning slug;` (até 8, só HTTP 200 e > 15 KB).
5. CAPA COMPOSTA: `python3 scripts/rotina/cover_cmp.py <slug> "Nome 1=<images[0]>" "Nome 2=<...>" ["Nome 3=..."]` (mesma ordem da tabela). Grava `public/images/covers/<slug>.jpg`; coloque em `cover_image_url` e COMMITE o JPG no PR.
6. Escreva o JSON (esquema abaixo) em `/tmp/rotina-pai/<slug>.json` e rode `python3 scripts/rotina/cmp_gen.py /tmp/rotina-pai/<slug>.json --out /tmp/rotina-pai` até "OK" (`--offline` só em teste, pula o HEAD das fotos; `--slugs /tmp/rotina-pai/slugs.txt` usa o universo gravado por `slugs.sh`). Mínimo 1100 palavras (mire 1500-2000), 8 links internos distintos (≥ 4 `/post/`, os `/loja/<slug>`, ≥ 1 `/pai-indica/` se houver).
7. Aplique `<slug>.insert.sql` com `mcp__Supabase__execute_sql` (project_id `<SUPABASE_PROJECT_REF>`), conteúdo INTEIRO. Idempotente por slug.
8. Rode `node scripts/validate-content.mjs --slug <slug>` (precisa dar "✓"). Verifique: `select slug,kind,product_score,status,jsonb_array_length(body->'content') from posts where slug='<slug>'`. Responda em até 12 linhas: slug, palavras, links, faixas gravadas, fotos, problemas.

## Esquema do JSON
```json
{
 "slug": "bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v",
 "kind": "comparativo",
 "title": "Bosch GSR 120-LI, Black+Decker LD12SP ou Makita HP333D: qual parafusadeira 12 V comprar?",
 "subtitle": "OBRIGATÓRIO (50-220 caracteres): o que comparamos e para quem serve; sem valor em reais",
 "seo_title": "até 60 caracteres (obrigatório quando o title passa de 60)", "seo_description": "120 a 155 caracteres (sem valor em reais)",
 "excerpt": "Até 155 caracteres.",
 "product_category": "ferramentas", "product_subcategory": "furadeiras-e-parafusadeiras",
 "cover_image_url": "/images/covers/<slug>.jpg",
 "cover_alt": "Comparativo: Bosch GSR 120-LI, Black+Decker LD12SP e Makita HP333D (fotos oficiais)",
 "intro": ["parágrafo 1 (a dúvida do pai)", "parágrafo 2 (o que comparamos e o que descobrimos; pode ter [texto](/post/slug))"],
 "em_3_pontos": ["ponto 1","ponto 2","ponto 3"],
 "tabela": {"intro": "frase curta", "colunas": ["Modelo","Faixa de preço","Torque máx.","Baterias","Impacto","Nota de compradores"],
            "linhas": [["Bosch GSR 120-LI","{FAIXA}","30 Nm","2 × 1,5 Ah","Não","4,8 de 5 (mais de 9 mil avaliações)"], ["..."]]},
 "produtos": [
  {"slug": "bosch-gsr-120-li-12v", "nome": "Bosch GSR 120-LI", "foto": "<images[0]>", "role": "vencedor", "score": 8.4,
   "criteria_scores": [8.5, 8.5, 8.5, 8.0, 8.0], "one_liner": "A mais equilibrada do trio.",
   "titulo": "Bosch GSR 120-LI: a que resolve a casa toda", "paragrafos": ["2 a 4 parágrafos"], "pros": ["3 a 5"], "contras": ["3 a 5"]}
 ],
 "criteria": [{"name":"Desempenho","weight":30},{"name":"Ergonomia e peso","weight":15},{"name":"Durabilidade","weight":20},{"name":"Acessórios e garantia","weight":15},{"name":"Custo-benefício","weight":20}],
 "winner_slug": "bosch-gsr-120-li-12v",
 "verdict_by_profile": [{"profile":"Se você ...","pick_slug":"...","reason":"..."}, "... mínimo 2 perfis"],
 "por_que_importa": ["1 a 3 parágrafos com links para /post/"],
 "variacao_preco": ["1 a 2 parágrafos; use {FAIXA:slug} se citar valores"],
 "qual_comprar": ["parágrafos por perfil com a opinião técnica final"],
 "como_avaliamos": ["fontes, 5 critérios e pesos; a frase \"Não fizemos teste físico.\" é obrigatória"],
 "outros": ["links para outros posts, Pai Indica e loja"],
 "faq": [{"q":"..","a":".."}, "... mínimo 4"],
 "quiz": [{"question":"..","options":["a","b","c","d"],"correct":0,"explanation":".."}]
}
```
Ordem de `tabela.linhas` = ordem de `produtos`. `role` ∈ vencedor | custo-beneficio | premium | alternativa | nao-indicamos. Para `kind: "lista"` (3 a 7 produtos) `role` é o selo (escolha-do-editor, melhor-custo-beneficio, melhor-premium, melhor-barato, melhor-para-iniciantes, melhor-compacto, melhor-para-familias, melhor-silencioso, melhor-desempenho, sem-selo), máximo 1 produto por selo, e as seções extras são "Como escolhemos" (no lugar da tabela, opcional) e "O que não recomendamos (e por quê)". Marcação: `**negrito**`, `[texto](/post/slug)`, `[texto](/loja/slug)`, `[texto](/pai-indica/slug)`.

## Onde achar slugs para links
`select slug, title from posts where status='published' order by created_at desc` (ou REST `/rest/v1/posts?select=slug,title,kind&status=eq.published`). Só slugs existentes (o gerador confere).
