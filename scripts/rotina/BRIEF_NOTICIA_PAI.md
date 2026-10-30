# Briefing: notícia "Mercado do pai" (1 por dia)

Nota curta e útil sobre economia doméstica, trabalho, benefícios, impostos, juros, câmbio, preço de
combustível/carne/energia, mercado de trabalho, direitos do pai (licença-paternidade, pensão, guarda),
sempre do ponto de vista de quem sustenta uma família. `kind='noticia'`, categoria `noticias` (slug do doc 02 §4.2;
"Mercado do pai" é a série, marcada pela tag `serie:mercado-do-pai` em `post_tags`, mais `fase-todas`),
status published. 350 a 600 palavras. Fonte principal datada de ≤ 48 h (Banco Central, IBGE, Receita,
Ministério do Trabalho, agências de notícia) citada no 1º ou 2º parágrafo com link externo e data.
Estrutura: 1–2 parágrafos "o que aconteceu"; "O que muda para o pai" (1–2 parágrafos); `bulletList` "Na prática"
(3 a 5 itens); "O que acompanhar" (1 parágrafo); "Continue lendo: " com 3+ links internos (ferramentas
`/ferramentas/conversor-de-moedas`, `/ferramentas/mercado-financeiro`, `/ferramentas/juros-compostos` quando o tema
for câmbio/juros, e artigos de `dinheiro-do-pai` / `provedor-e-carreira`). No total, **≥ 5 links internos distintos**
e reais (o validador exige 5 para notícia). Sem semáforo, sem quiz; `faq` com 3 a 6 itens (o validador exige).
Nunca recomendação de investimento específico; nunca "R$" no texto (usar percentuais e ordens de grandeza).
Capa: Pexels/Pixabay/Unsplash/Wikimedia (objeto, cédula genérica, gráfico, mesa de trabalho); nunca rosto de pessoa
pública sem licença. `subtitle` 50–220, `seo_title` ≤ 60, `seo_description` 120–155, `excerpt` ≤ 160.
Linha editorial do `BRIEF_ARTIGO_PAI.md` vale inteira. Tom sereno: informa e orienta, não assusta.

Gerador: `python3 scripts/rotina/news_gen.py arquivo.json --out /tmp/rotina-pai` → `<slug>.insert.sql` (INSERT do post
+ tags/post_tags). `--sem-prazo` só em teste (pula a regra das 48 h). Aplicar com `mcp__Supabase__execute_sql`, conteúdo
inteiro, e conferir com `node scripts/validate-content.mjs --slug <slug>`.

## Esquema do JSON
```json
{
  "slug": "selic-mantida-o-que-muda-para-o-pai-que-tem-divida",
  "title": "Selic mantida: o que muda para o pai que tem dívida",
  "subtitle": "50 a 220 caracteres",
  "excerpt": "Até 160 caracteres.",
  "seo_title": "até 60 caracteres",
  "seo_description": "120 a 155 caracteres",
  "cover": "https://…", "cover_alt": "Mesa de trabalho com calculadora e contas",
  "fonte": {"url": "https://www.bcb.gov.br/…", "veiculo": "Banco Central", "data": "2026-10-30", "titulo": "Copom mantém a Selic"},
  "o_que_aconteceu": ["Parágrafo com o fato e a fonte: [Banco Central](https://www.bcb.gov.br/…), 30/10/2026."],
  "o_que_muda": ["Parágrafo com o efeito no bolso da família e [um link interno](/post/slug-real)."],
  "na_pratica": ["Item 1", "Item 2", "Item 3"],
  "o_que_acompanhar": ["Parágrafo com o que observar nas próximas semanas."],
  "continue_lendo": [{"title": "Conversor de moedas", "href": "/ferramentas/conversor-de-moedas"}, {"title": "Título exato do post", "href": "/post/slug-real"}],
  "faq": [{"question": "…", "answer": "…"}, {"question": "…", "answer": "…"}, {"question": "…", "answer": "…"}],
  "serie": "mercado-do-pai",
  "tags": ["fase-todas"]
}
```
Se o 1º/2º parágrafo não trouxer o link da fonte, o gerador acrescenta "Fonte: [veículo](url), dd/mm/aaaa." ao 1º parágrafo.
O texto de cada link do "Continue lendo" é o título exato do post (o validador avisa quando difere).
