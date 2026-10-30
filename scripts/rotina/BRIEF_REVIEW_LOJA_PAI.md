# Briefing: REVIEW longa de produto na Loja do Pai (O pai também quer desconto) — Vocação de Pai

> Segue o doc 04 §9 (Pai Indica → loja) e o doc 05 §4.1/§8 (Loja do Pai). Validação automática:
> `node scripts/validate-content.mjs --products` (regras de `products.review` em `validateProductReview`).

A página do produto (`/loja/<slug>`) mostra no topo a "chamada de loja" (galeria de fotos oficiais, faixa de preço, botão) e, mais abaixo, a **Review do Pai**: review longa no estilo "AI Indica" do Portal da AI (mesmo dono): veredito com nota de 0 a 10 e 5 critérios, prós e contras, "Ideal para", "Em 3 pontos", seções com botões "Comprar agora na Amazon" espalhados, variação de preço (a página escreve sozinha a faixa), ficha técnica, como avaliamos, "A opinião do Vocação de Pai" e FAQ. Tudo vem de um JSON que você escreve e do gerador `scripts/rotina/review_gen.py`. PT-BR, **tom de pai para pai: direto, prático, respeitoso, firme e acolhedor, sem vulgaridade e sem machismo tóxico**. Linha editorial de família tradicional (CLAUDE.md §3).

## Regras duras
- NUNCA escreva valor em reais nem preço do dia. A faixa de preço é escrita pelo componente a partir do banco (pesquisada na internet em 2 lojas, não é preço da Amazon). Em `preco_texto` fale só de por que o preço varia (promoção, vendedor, cor, kit, voltagem), sem números.
- Botão sempre "Comprar agora na Amazon" (já embutido). Nunca "Ver preço na Amazon".
- Nada de inventar: especificação, nota, medidas, garantia, ASIN. Use `amz.py` (bullets, details, rating, reviews) e WebSearch (site do fabricante, manual). Sem certeza = não escreva, ou diga "o anúncio não informa".
- Análise não é teste físico: diga isso em `como_avaliamos` (baseada em ficha técnica, manual e anúncios da Amazon Brasil).
- **Segurança primeiro** (elétrica, corte, calor, trânsito, uso com criança por perto, EPI).
- Nunca rode DELETE ou DROP.

## Pai Indica e loja contam a mesma história, com textos diferentes
Todo produto que aparece num artigo do Pai Indica (review, comparativo ou lista) TEM que estar na loja (`products`, ativo) e TEM que ter esta review longa (`products.review`). Em comparativo e lista, vale para TODOS os produtos. A review da loja segue a MESMA premissa e o mesmo veredito do artigo (mesma nota geral, mesmos pontos fortes e fracos), mas é REESCRITA: outras palavras, outra ordem de seções, exemplos e ângulos diferentes. Nunca copie parágrafos do artigo (as duas páginas não podem competir entre si no Google). O artigo linka `/loja/<slug>` e a página da loja mostra o artigo em "No Pai Indica" (`posts_for_product`).

## Opiniões de compradores FORA da Amazon (obrigatório em toda review)
Pesquise com WebSearch o que compradores dizem do produto ou da marca em fontes que não são da Amazon: Reclame Aqui, avaliações em outras lojas (Mercado Livre, Magalu, Casas Bahia, Kabum, Leroy Merlin, Centauro), fóruns, YouTube e blogs. Regras:
- Inclua uma seção em `secoes` chamada "O que dizem outros compradores" com os elogios mais repetidos PRIMEIRO e depois as reclamações mais repetidas. Valorize os positivos, mas nunca esconda os negativos reais (defeito recorrente, atendimento, troca, durabilidade).
- Só conte padrões que se repetem em mais de uma opinião, em linguagem de síntese ("vários compradores elogiam...", "há queixas de que..."). Não invente número, percentual, nome nem citação literal. Não copie texto de ninguém.
- Reclame Aqui: cite como fonte ("segundo reclamações registradas no Reclame Aqui") e só afirme o que está lá. Se não houver opinião suficiente fora da Amazon, escreva "não encontramos opiniões suficientes fora da Amazon".
- Liste as fontes consultadas (só os nomes dos sites) em `como_avaliamos`.
- Sem texto que contrarie a linha editorial (CLAUDE.md §3).

## Fila diária (produtos sem review longa)
A rotina processa **10 produtos por dia** (mais os novos), nesta ordem:
1. produtos que aparecem em posts do Pai Indica e ainda não têm review longa;
2. produtos em destaque (`featured`);
3. o resto, por `sort_order`.
Consulta da fila (projeto `<SUPABASE_PROJECT_REF>`):
```sql
with em_pi as (
  select p.review->>'product_slug' as s from posts p where p.status='published' and p.kind='review'
  union
  select e->>'product_slug' from posts p, jsonb_array_elements(coalesce(p.comparison->'products','[]'::jsonb)) e
  where p.status='published' and p.kind in ('comparativo','lista'))
select x.slug, x.name, x.asin
from products x
where x.active and (x.review is null or jsonb_typeof(x.review)<>'object')
order by (x.slug in (select s from em_pi)) desc, x.featured desc, x.sort_order
limit 10;
```
O ASIN vem da coluna `asin` (ou de `affiliate_url`, `/dp/<ASIN>`). Produto sem ASIN confirmado fica inativo na fila do admin (`/admin/produtos`, filtro "Sem ASIN").

## Ferramentas
- `python3 scripts/rotina/amz.py <ASIN>` → JSON com title, images (fotos oficiais em alta, até 8), bullets, details, rating, reviews, available. A Amazon bloqueia com frequência: o script repete sozinho com pausas. Cache em `/tmp/amzcache-vocacaodepai`.
- `python3 scripts/rotina/review_gen.py <arquivo>.json` (rode em `/tmp/rotina-rev/`) → valida e gera o SQL.
- `python3 scripts/rotina/photo_upgrade.py N` → fila de fotos oficiais (gera `photo_upgrade_out.sql`).
- `python3 scripts/rotina/price_range.py fila` e `... sql achados.json` → faixa de preço (ver `BRIEF_FAIXA_PRECO.md`).

## Esquema do JSON
```json
{
 "slug": "slug-do-produto",
 "novo": false,                       // true só para produto que ainda NÃO existe na loja
 "asin": "B0XXXXXXXX",                // obrigatório se novo (confirmado, nunca inventado)
 "name": "...", "brand": "...",       // obrigatórios se novo
 "category": "ferramentas",           // slug de product_categories (0003_loja.sql) se novo
 "subcategory": "furadeiras-e-parafusadeiras", // slug do doc 04 §3 se novo
 "description": "2 a 3 frases", "short_description": "1 frase de até 130 caracteres",
 "price": null,                       // número ou "R$ 1.234,56" só se o amz.py trouxe; alimenta products.price (interno)
 "images": ["<amz images>", "... 3 a 8 fotos oficiais; images[0] é a principal"],
 "image_url": "<igual a images[0]> (obrigatório se novo)",
 "pros": ["4 a 6 itens com fato concreto"], "cons": ["4 a 6 itens honestos"],
 "review": {
  "titulo": "Bosch GSR 120-LI: a parafusadeira para 90% dos consertos da casa",
  "resumo": "2 a 3 frases: o que é, para quem serve, o veredito.",
  "nota": 8.6,
  "criterios": [{"nome":"Potência","peso":30,"nota":8.0}, "... exatamente 5 critérios com os nomes e pesos da categoria do produto (src/lib/pai-indica/criterios.ts, doc 04 §3.2); `peso` é informativo, a nota geral é a média ponderada"],
  "ideal_para": "Quem ... e aceita ...",
  "em_3_pontos": ["3 frases fortes"],
  "secoes": [ {"titulo":"O que o X entrega","paragrafos":["..",".."],"cta":true}, "... mínimo 6 seções, pelo menos 3 com cta: true, incluindo obrigatoriamente 'O que dizem outros compradores'" ],
  "preco_texto": "Por que o preço varia (sem números).",
  "ficha": ["Modelo: ...","Material: ...", "... mínimo 5 linhas, só dados confirmados"],
  "como_avaliamos": "Como a nota foi pensada e de onde vêm os dados (sem teste físico).",
  "opiniao": "Opinião técnica final, com recomendação clara e para quem NÃO serve.",
  "faq": [{"q":"..","a":".."}, "... mínimo 4"]
 }
}
```
Seções sugeridas (adapte ao produto): "O que o X entrega", "No dia a dia da casa/oficina/churrasqueira", "Prós e contras na prática", "Para quem vale a pena (e para quem não)", "Segurança e cuidados", "O que dizem outros compradores", "Como ele se compara a outras opções" (fale de tipos de produto/faixas, não invente concorrentes específicos). Mínimo 900 palavras (mire em 1200 a 1600). Notas de 0 a 10 com uma casa decimal, régua do CLAUDE.md §7 (a maioria fica entre 6,5 e 8,5).

## FAIXA DE PREÇO (2 lojas, mesmo item, max ≤ 3×min)
Depois de gravar a review, siga `scripts/rotina/BRIEF_FAIXA_PRECO.md`. Sem confirmação em 2 lojas: não grave nada.

## Aplicar no banco (projeto `<SUPABASE_PROJECT_REF>`; carregue a ferramenta com ToolSearch "select:mcp__Supabase__execute_sql")
- Produto EXISTENTE ("novo": false): o gerador cria `<slug>.stg.sql` e `<slug>.upd.sql`. Execute o conteúdo INTEIRO, primeiro o stg e depois o upd (o upd deve retornar o slug; se retornar vazio, repita os dois).
- Produto NOVO ("novo": true): o gerador cria `<slug>.insert.sql` (INSERT; já pula se o slug ou o ASIN existirem). Execute o conteúdo inteiro.
- Depois confira: `select slug, review->>'nota', jsonb_array_length(review->'secoes'), jsonb_array_length(images), price_min, price_max from products where slug='<slug>'`.
- Commite o `.sql` em `supabase/migrations/00NN_<descricao>.sql` (CLAUDE.md §4.2).

## Resposta final (até 10 linhas)
slug, nota, palavras, nº de fotos, faixa de preço gravada (ou não), problemas.
