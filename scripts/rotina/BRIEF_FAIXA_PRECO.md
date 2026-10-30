# Briefing: faixa de preço da Loja do Pai (2 lojas, mesmo item, `max ≤ 3×min`, 15 por dia)

Regra fixa (CLAUDE.md §5.2 e doc 05 §8.4): **nunca preço exato**. O site mostra "Faixa de preço pesquisada em <data>: R$ X a R$ Y. Não é o preço da Amazon." a partir de `products.price_min`/`price_max`/`price_range_checked_at`. Cada pesquisa fica registrada em `product_price_checks` (store, price, url, checked_at).

## Procedimento (rotina diária, depois do trabalho principal)
1. **Fila**: `python3 scripts/rotina/price_range.py fila 15` (ou `/admin/produtos/fila-precos`). SQL equivalente:
   `select slug, name, brand, asin from products where active and price_range_checked_at is null order by featured desc, sort_order limit 15;`
   Quando zerar, refazer os com `price_range_checked_at < now() - interval '60 days'`.
2. Para cada produto: `WebSearch` do **mesmo** item (nome + marca + modelo + cor/quantidade/voltagem) em Amazon, Mercado Livre, Magalu, Americanas, Casas Bahia, Shopee, Kabum, Leroy Merlin, Centauro, Decathlon e site do fabricante.
3. Só vale com preço em reais em **pelo menos 2 lojas** diferentes e comprovadamente o mesmo item. Kit parecido, outra voltagem ou outro tamanho **não conta** (já deu errado no Vocação de Mãe: kit de 14 protetores voltou como o de 10).
4. `min` = menor, `max` = maior. Se `max > 3 × min`: descartar o outlier; se ainda assim não fechar, não gravar.
5. Montar `achados.json`:
   ```json
   [{"slug": "parafusadeira-furadeira-bosch-gsr-120-li",
     "checks": [{"store": "Mercado Livre", "price": 389.90, "url": "https://..."},
                {"store": "Magalu", "price": 429.00, "url": "https://..."}]}]
   ```
   e rodar `python3 scripts/rotina/price_range.py sql achados.json` → `price_range_out.sql` (um INSERT em `product_price_checks` + um UPDATE curto por produto, numa transação por produto). Aplicar com `mcp__Supabase__execute_sql` e commitar em `supabase/migrations/00NN_faixa_<data>.sql`.
6. Sem confirmação em 2 lojas: **não gravar nada** (continua a estimativa ou "faixa em pesquisa"). Registrar no resumo: quantos ganharam faixa, quantos foram pulados.

## O que nunca fazer
Inventar preço · chutar a faixa · copiar preço da Amazon como se fosse pesquisa · gravar com 1 loja · `DELETE`/`DROP`.
