# Briefing: REVIEW LONGA do produto na Loja do Pai "O pai também quer desconto" — Vocação de Pai

A página `/loja/<slug>` mostra no topo a chamada de loja (galeria, faixa de preço, botão) e abaixo a REVIEW LONGA (estilo AI Indica): veredito com nota e 5 critérios, prós e contras, "Ideal para", "Em 3 pontos", seções com botões "Comprar agora na Amazon", variação de preço (a página escreve a faixa), ficha técnica, "O que dizem outros compradores", como avaliamos, opinião e FAQ. Tudo vem de um JSON e do gerador `review_gen.py`. PT-BR, de pai para pai, direto e honesto. Família tradicional.

## Regras duras
- NUNCA valor em reais nem preço do dia. A faixa é escrita pelo componente a partir do banco. Em `preco_texto` fale só do que faz o preço variar (vendedor, cor, voltagem, kit), sem números.
- Botão sempre "Comprar agora na Amazon" (embutido). Nunca "Ver preço na Amazon".
- Nada inventado: `amz.py` + WebSearch (fabricante, manual). Sem certeza = não escreva ou "o anúncio não informa".
- Não é teste físico: diga em `como_avaliamos`.
- Segurança primeiro (ferramenta elétrica, churrasqueira, cadeirinha, suplemento, voltagem).
- Nunca DELETE/DROP.

## Pai Indica e loja contam a mesma história, com textos diferentes
Todo produto de um Pai Indica (comparativo: TODOS; review única: o produto; lista: TODOS) TEM que estar na loja e TEM que ter esta review longa. Mesma nota geral, mesmos pontos fortes e fracos, mesmo veredito; texto REESCRITO (outras palavras, outra ordem de seções, outros exemplos). Nunca copie parágrafos do artigo. A loja mostra o Pai Indica relacionado; o artigo linka `/loja/<slug>`.

## Opiniões fora da Amazon (obrigatório)
Seção `secoes` "O que dizem outros compradores": elogios mais repetidos PRIMEIRO, reclamações reais depois (defeito recorrente, atendimento, troca, durabilidade). Só padrões que se repetem ("vários pais elogiam...", "há queixas de que..."). Sem número, percentual, nome ou citação. Reclame Aqui: cite como fonte e só afirme o registrado. Sem opinião suficiente: "não encontramos opiniões suficientes fora da Amazon". Fontes (só nomes) em `como_avaliamos`.

## Fila diária (produtos sem review longa)
10 produtos por dia (mais os novos), nesta ordem: 1) produtos em Pai Indica publicados sem review longa; 2) `featured`; 3) resto por `sort_order`.
```sql
with em_pi as (
  select distinct x.slug
  from posts p, products x
  where p.status='published' and p.kind in ('review','comparativo','lista')
    and (p.review->>'product_slug' = x.slug
         or exists (select 1 from jsonb_array_elements(coalesce(p.comparison->'products','[]'::jsonb)) c where c->>'product_slug' = x.slug)))
select x.slug, x.name, x.affiliate_url
from products x
where x.active and (x.review is null or jsonb_typeof(x.review)<>'object')
order by (x.slug in (select slug from em_pi)) desc, x.featured desc, x.sort_order
limit 10;
```
ASIN vem de `affiliate_url` (`/dp/<ASIN>`).

## Ferramentas
- `python3 scripts/rotina/amz.py <ASIN>` → JSON (title, images até 8, bullets, details, rating, reviews, available). Cache `/tmp/amzcache-vocacaodepai`.
- `python3 scripts/rotina/review_gen.py <arquivo>.json` (em `/tmp/rotina-rev/`) → valida e gera o SQL.

## Esquema do JSON
```json
{
 "slug": "slug-do-produto",
 "novo": false,
 "images": ["<amz images>", "... 3 a 8 fotos oficiais; images[0] é a principal"],
 "image_url": "<igual a images[0]> (obrigatório se novo)",
 "pros": ["4 a 6 itens com fato concreto"], "cons": ["4 a 6 itens honestos"],
 "short_description": "(opcional no existente) até 130 caracteres",
 "review": {
  "titulo": "Bosch GSR 120-LI: a parafusadeira que resolve a casa toda",
  "resumo": "2 a 3 frases: o que é, para quem serve, o veredito.",
  "nota": 8.4,
  "criterios": [{"nome":"Desempenho","peso":30,"nota":8.5}, "... exatamente 5, pesos da categoria do produto"],
  "ideal_para": "Quem ... e aceita ...",
  "em_3_pontos": ["3 frases fortes"],
  "secoes": [{"titulo":"O que a GSR 120 entrega","paragrafos":["..",".."],"cta":true}, "... mínimo 6 seções, ≥ 3 com cta: true, incluindo 'O que dizem outros compradores'"],
  "preco_texto": "Por que o preço varia (sem números).",
  "ficha": ["Modelo: ...","Tensão da bateria: ...", "... mínimo 5 linhas confirmadas"],
  "como_avaliamos": "Como a nota foi pensada, fontes, sem teste físico.",
  "opiniao": "Opinião técnica final, com recomendação clara e para quem NÃO serve.",
  "faq": [{"q":"..","a":".."}, "... mínimo 4"]
 }
}
```
Campos extras para produto NOVO: asin, name, brand, category (slug de `product_categories`), subcategory (slug da taxonomia do Pai Indica), description (2 a 3 frases), short_description, price (só se o amz.py trouxe; senão null). Mínimo 900 palavras (mire 1200-1600). Notas 0-10 com 1 casa decimal; a maioria entre 6,5 e 8,5.

## Faixa de preço
Depois da review: mesmo item em ≥ 2 OUTRAS lojas; min/max; descarte se max > 3×min. Confirmou: `update products set price_min=<n>, price_max=<n>, price_range_checked_at=now() where slug='<slug>' returning slug;`. Não: não grave.

## Aplicar no banco (project_id `<SUPABASE_PROJECT_REF>`)
- Existente: `<slug>.stg.sql` depois `<slug>.upd.sql` (o upd retorna o slug; vazio → repita os dois).
- Novo: `<slug>.insert.sql` (pula se slug ou ASIN existirem).
- Confira: `select slug, review->>'nota', jsonb_array_length(review->'secoes'), array_length(images,1), price_min, price_max from products where slug='<slug>'`.

## Resposta final (até 10 linhas)
slug, nota, palavras, nº de fotos, faixa gravada (ou não), problemas.
