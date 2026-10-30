# Briefing: REVIEW ÚNICA "Pai Indica" (artigo de 1 produto) — Vocação de Pai

Artigo do Pai Indica sobre **um produto só** (ex.: "Philips OneBlade QP2724: vale a pena para aparar a barba no banho?"), irmão do comparativo. Mesma voz: de pai para pai, direto, honesto, com números e fonte; família tradicional; PT-BR. Regras de preço, imagem, segurança e linha editorial são as do `BRIEF_COMPARATIVO_PAI.md` ("Regras duras").

## O que é diferente do comparativo
- Um produto, **nota 0-10 com 5 critérios da categoria** (pesos de `src/lib/pai-indica/criterios.ts`), ficha técnica, seções de análise com botões "Comprar agora na Amazon", pontos fortes e de atenção, **"O que dizem outros compradores"** (fora da Amazon), "Para quem vale a pena (e para quem não)", "Variação de preço", "Como avaliamos".
- `posts.review` recebe o JSON estruturado (score, criteria[5] com comment, pros, cons, ideal_for, not_ideal_for, verdict, how_we_evaluated, sources, other_buyers). O gerador monta a partir dos campos abaixo.
- Títulos variados, nunca sempre "vale a pena?": alterne pergunta, veredito ("OneBlade QP2724: o aparador que cabe no banho e no bolso"), cenário de uso e "review completo". Dois artigos do mesmo dia não repetem o formato.
- Produto real, vendido na Amazon Brasil (ASIN conferido pelo `amz.py`), diferente dos que já têm review ou comparativo recente.

## O artigo e a loja não repetem texto
O produto TAMBÉM tem a review longa em `products.review` (`BRIEF_REVIEW_LOJA_PAI.md`): mesma nota, mesmo veredito, textos diferentes. Faça primeiro a review da loja (ou confirme que existe), depois o artigo do zero com outro ângulo. O artigo linka `/loja/<slug>` ao menos uma vez.

## Passo a passo
1. `python3 scripts/rotina/amz.py <ASIN>` (fotos oficiais, bullets, ficha, nota e nº de avaliações). `images[0]` = foto principal.
2. WebSearch: fabricante, manual, Inmetro/Anatel, garantia, voltagem. Cruze com os bullets.
3. Opiniões fora da Amazon: Reclame Aqui, Mercado Livre, Magalu, fóruns, YouTube. Elogios repetidos primeiro, reclamações reais depois, sem número nem citação. Sem opinião suficiente: `"sem_opiniao_externa": true` e diga isso no texto.
4. Faixa de preço (≥ 2 lojas, max ≤ 3×min) e review da loja pelo `BRIEF_REVIEW_LOJA_PAI.md` (`novo: true` se não está na loja).
5. Capa: `python3 scripts/rotina/cover_cmp.py <slug> "<Nome do produto>=<images[0]>"`. Commite o JPG.
6. JSON em `/tmp/rotina-rev/<slug>.json` (esquema abaixo); rode nesse diretório `python3 <repo>/scripts/rotina/rev_art_gen.py <slug>.json` até "OK". Mínimo 1100 palavras (mire 1300-1800), 8 links internos distintos (≥ 4 `/post/`, 1 `/loja/<slug>`), 4 a 6 botões.
7. Aplique `<slug>.insert.sql` com `mcp__Supabase__execute_sql` (project_id `<SUPABASE_PROJECT_REF>`), conteúdo inteiro.
8. `node scripts/validate-content.mjs --slug <slug>` → "✓". Responda em até 10 linhas: slug, nota, palavras, links, faixa gravada, problemas.

## Esquema do JSON
```json
{
 "slug": "philips-oneblade-qp2724-vale-a-pena",
 "title": "Philips OneBlade QP2724: vale a pena para aparar a barba no banho?",
 "subtitle": "OBRIGATÓRIO (50-220 caracteres)",
 "seo_title": "(opcional) até 62 caracteres",
 "excerpt": "Até 155 caracteres: o que é, para quem serve, o veredito.",
 "product_category": "estilo-e-barba", "product_subcategory": "barbeadores-e-aparadores",
 "cover_image_url": "/images/covers/philips-oneblade-qp2724-vale-a-pena.jpg",
 "cover_alt": "Foto oficial do Philips OneBlade QP2724",
 "intro": ["parágrafo 1: a dúvida do pai", "parágrafo 2: o que analisamos e o veredito; pode ter [texto](/post/slug)"],
 "em_3_pontos": ["ponto 1","ponto 2","ponto 3"],
 "produto": {"slug": "philips-oneblade-qp2724", "nome": "Philips OneBlade QP2724", "foto": "<images[0]>"},
 "nota": 7.9,
 "criterios": [{"nome":"Resultado","peso":30,"nota":8.0,"comentario":"1 frase"}, "... exatamente 5, pesos da categoria"],
 "ideal_para": "Quem ... e aceita ...",
 "nao_ideal_para": "Quem ...",
 "veredito": "2 a 3 frases.",
 "secoes": [{"titulo":"O que o OneBlade entrega","paragrafos":["..",".."],"cta":true}, "... mínimo 4 seções, ≥ 3 com cta: true; a 1ª recebe a foto oficial"],
 "pros": ["4 a 6 itens com fato concreto"], "contras": ["4 a 6 itens honestos"],
 "outros_compradores": {"intro":"1 parágrafo","elogios":["mín. 3"],"reclamacoes":["mín. 2"],"fontes":["Reclame Aqui","Mercado Livre"],"sem_opiniao_externa": false},
 "variacao_preco": ["1 a 2 parágrafos; {FAIXA:slug} se citar valores"],
 "ficha": ["Modelo: ...","Bateria: ...", "... mínimo 5 linhas 'Campo: valor' confirmadas"],
 "para_quem": ["para quem vale e para quem NÃO; inclua [texto](/loja/slug)"],
 "como_avaliamos": ["fontes, 5 critérios e pesos, sem teste físico"],
 "outros": ["links para outros posts, Pai Indica e loja"],
 "faq": [{"q":"..","a":".."}, "... mínimo 4"],
 "quiz": [{"question":"..","options":["a","b","c","d"],"answer":0,"explanation":".."}]
}
```
`nota` deve ser a média ponderada dos `criterios` (±0,15). Nunca valor em reais; nunca "Ver preço na Amazon".
