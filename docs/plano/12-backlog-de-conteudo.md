# 12 — Backlog de conteúdo do Vocação de Pai

> Documento executável. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code dentro de
> `/home/user/vocacaodepai`. Tudo em PT-BR. Decisões já tomadas: não reabrir.
>
> O que este documento é: a **fila de pautas** do site — 150 artigos do Blog, 40 ideias de Pai Indica
> (além das 20 do doc 04), 10 modelos de notícia, o calendário dos primeiros 30 dias de publicação,
> o calendário sazonal do ano do pai, as regras de links internos entre as pautas e o formato do
> arquivo `supabase/seed/backlog.json` que a rotina da Fase 8 consome.
>
> O que este documento **não** é: não é código de site, não é migration de schema e não é texto de
> artigo. Nenhuma sessão deve "montar o site" a partir daqui; a sessão que executa este documento cria
> apenas o JSON de seed, o script de fila e, quando chamada para isso, produz as pautas na ordem.
>
> Fontes que prevalecem, nesta ordem: `docs/plano/02-arquitetura-e-stack.md` (tabelas, colunas, rotas)
> → `docs/plano/00-visao-posicionamento-e-marca.md` §3 (taxonomia das 14 categorias, normativa)
> → `docs/plano/11-monetizacao-seo-e-crescimento.md` §8 (clusters e hubs) → este documento.
> Repositórios de referência (somente leitura): `/home/user/vocacaodemae`, `/home/user/portaldaai`,
> `/home/user/reviewprodutos`, `/home/user/grupovdp`.

---

## Sumário

0. Como ler e executar este documento
1. Como usar o backlog (ordem, prioridades, como a rotina consome, como marcar publicado)
2. Os 150 artigos do Blog (tabela por categoria)
3. 40 ideias de Pai Indica (#21 a #60)
4. 10 modelos de notícia (`kind='noticia'`)
5. Calendário editorial dos primeiros 30 dias
6. Calendário sazonal do ano do pai
7. Regras de links internos entre as pautas (clusters, pilar → satélites, pontes)
8. "Não escrever aqui" e os 60 espelhos com o Vocação de Mãe
9. Seed `supabase/seed/backlog.json` e script `scripts/rotina/backlog.mjs`
10. Critérios de aceite
11. Prompt para iniciar esta fase no Sonnet
12. Checklist de pronto

---

## 0. Como ler e executar este documento

1. Leia antes, nesta ordem: `CLAUDE.md`, `PLANO-MESTRE.md`, `docs/plano/02-arquitetura-e-stack.md` §4.2 e §5,
   `docs/plano/00-visao-posicionamento-e-marca.md` §3 a §5, `docs/plano/11-monetizacao-seo-e-crescimento.md` §8,
   `docs/plano/10-fase-8-automacao-rotinas-e-painel.md` §2 a §4 e `docs/plano/PROGRESSO.md`.
2. Este documento tem **duas formas de uso**:
   - **Uso A — montar a fila** (uma sessão, Fase 1 Etapa 1.20 ou início da Fase 8): criar
     `supabase/seed/backlog.json` (seção 9.1) com todos os itens das seções 2, 3 e 4 e o script
     `scripts/rotina/backlog.mjs` (seção 9.3). Não escreve artigo nenhum.
   - **Uso B — produzir pautas** (toda sessão de conteúdo e a rotina diária da Fase 8): pedir ao script
     os próximos itens (`node scripts/rotina/backlog.mjs next --tipo artigo --n 3`), escrever seguindo o
     `BRIEF_ARTIGO_PAI.md` (doc 10 §4.2) ou os briefs do Pai Indica (doc 04 §9), publicar, marcar
     (`backlog.mjs mark`), commitar o JSON no mesmo PR.
3. Cada tabela daqui é **plano**, não estado. O estado de cada pauta (pendente, em produção, publicado)
   vive em `supabase/seed/backlog.json` e, em última instância, no banco (`select slug from posts`).
   **Nunca** editar as tabelas deste documento para marcar "publicado".
4. Nomes e slugs aqui são definitivos. Slug publicado nunca muda (doc 11 §8.2 item 14). Se um título
   precisar mudar, muda só `title`/`seo_title`; o slug fica.
5. Toda pauta obedece ao Padrão A do Pai (`CLAUDE.md` §6; doc 03 §9.3; doc 10 §4.2): abertura, H2 em frase
   ou pergunta, Semáforo do pai com 3 callouts ("Sinal verde: ", "Sinal de atenção: ", "Sinal de alerta: "),
   ≥ 10 links internos para slugs existentes, tabela, checklist, fechamento "Continue lendo: ", FAQ e/ou quiz,
   capa nunca repetida no corpo, 1.200 a 2.200 palavras.
6. Linha editorial (doc 00 §4): família tradicional, pai e mãe; tom direto, masculino, respeitoso; sem
   preço exato; sem promessa médica, jurídica ou financeira sem o aviso do `ContentNotice`; sem a palavra
   "guia" no título ou no corpo (doc 00 §4.3 item 17 — os slugs de hub herdados do doc 11 que contêm
   `guia` ficam como estão, porque slug não é texto visível; o `title` e o `seo_title` não usam a palavra).

### 0.1 Decisões fixas desta fase (não rediscutir)

| Decisão | Valor |
|---|---|
| Taxonomia do Blog | As 14 categorias e subcategorias do doc 00 §3.2–3.5 (`src/content/taxonomia.json`), com `parent_id` em `categories` |
| Categoria dos posts de Pai Indica | `category_id` = categoria técnica `pai-indica` (doc 02 §4.2 seed; doc 04 §8 regra 17). O filtro de `/pai-indica` usa `product_category`/`product_subcategory` (doc 04 §3) |
| Categoria das notícias | `category_id` = categoria técnica `noticias` (doc 02 §4.2 seed). O doc 10 chama essa categoria de `mercado-do-pai`; **prevalece o doc 02**: slug `noticias`, nome exibido "Notícias", série `serie:mercado-do-pai` via tag |
| Fase do filho | Tag `fase-<slug>` com os slugs do doc 07 §3.1 (`gestacao`, `recem-nascido`, `bebe`, `primeira-infancia`, `infancia`, `pre-adolescencia`, `adolescencia`, `adulto`) ou `fase-todas` |
| Intenção de busca | `informacional`, `comercial`, `navegacional` (o "transacional" do doc 11 vira `comercial`) |
| Formato | `padrao-a` (artigo Padrão A do Pai), `guia` (artigo-pilar do cluster, mesmo Padrão A, 1.800–2.600 palavras, bloco "Neste artigo" listando os satélites), `noticia` (doc 10 §4.4) |
| Prioridade | `P0` = primeiros 30 dias de publicação (seção 5); `P1` = dias 31 a 90; `P2` = depois de 90 dias ou quando a fase exigida existir |
| Autor | `author_id` = perfil "Equipe Vocação de Pai" (`role='editor'`, criado na Fase 1 — doc 10 §3 item 8) ou o dono |
| Status ao publicar | `status='published'`, `publish_at=now()` (CLAUDE.md §4.2); nos 10 posts da Fase 1, `publish_at` escalonado 1/dia (doc 03 §9.2) |
| Fonte de slugs para links | `scripts/rotina/slugs.sh` → `slugs.txt` (doc 10 §4.1); antes dele existir, `select slug from posts where status='published'` |

### 0.2 Reconciliação de taxonomia (ler antes de inserir qualquer categoria)

O plano tem quatro listas diferentes de categorias do Blog. Esta é a reconciliação que vale para o backlog:

| Onde | O que diz | O que fazer |
|---|---|---|
| `00-visao-posicionamento-e-marca.md` §3.2–3.5 | 14 categorias com subcategorias (`parent_id`), cores, pilares; SQL de seed em §3.4; JSON em §3.5 | **É a taxonomia normativa.** O seed de `categories` em `supabase/migrations/0002_blog.sql` deve ser o SQL do doc 00 §3.4 (14 mães + filhas) **mais** as duas categorias técnicas abaixo. `src/content/taxonomia.json` = doc 00 §3.5 |
| `02-arquitetura-e-stack.md` §4.2 | `categories` sem `parent_id`/`color`; seed com 10 slugs (`paternidade`, `financas-da-familia`, … `pai-indica`, `noticias`) | Prevalece para **colunas**: adicionar `parent_id uuid null references public.categories(id)` e `color text` com `add column if not exists` em `0002_blog.sql` (o doc 00 §3.2 autoriza). Dos 10 slugs, ficam **só** `pai-indica` e `noticias` como categorias técnicas (sem pilar, `sort_order` 900 e 910, não aparecem no filtro de `/blog`) |
| `03-fase-1-fundacao.md` §9.1 | Outras 14 categorias (`gravidez-e-recem-nascido`, `educacao-dos-filhos`, …) | **Não usar.** Os 10 posts do §9.2 mantêm os slugs e são remapeados para as categorias do doc 00 (tabela da seção 2, marcados "seed F1") |
| `10-fase-8-automacao-rotinas-e-painel.md` §4.2 e `13-checklist-de-execucao.md` 1.11 | Listas curtas (`pai-de-primeira-viagem`, `mercado-do-pai`, …) | **Não usar.** Ao executar a Fase 8, substituir no `BRIEF_ARTIGO_PAI.md` a lista de categorias pelos 14 slugs do doc 00 e trocar `mercado-do-pai` por `noticias` |

Registrar esta reconciliação em `docs/plano/PROGRESSO.md` → "Decisões tomadas durante a execução" na primeira
sessão que tocar em `categories` (texto sugerido: "AAAA-MM-DD · F1/1.11 · categories = doc 00 §3.4 + `pai-indica` +
`noticias`; `parent_id` e `color` adicionados; docs 03/10/13 remapeados · motivo: doc 12 §0.2").

---

## 1. Como usar o backlog

### 1.1 Ordem de consumo

1. **Prioridade**: `P0` antes de `P1` antes de `P2`. Dentro da mesma prioridade, a ordem é a da seção 5
   (dias 1 a 30) e depois a ordem numérica da seção 2.
2. **Hub antes de satélite**: o artigo-pilar (`formato = guia`) de cada cluster sai antes dos satélites do
   cluster, para que todo satélite já possa linkar o hub no 1º ou 2º parágrafo (doc 11 §8.2 item 2).
3. **Rotação de categoria**: no mesmo dia, nunca dois artigos da mesma categoria (doc 10 §2.3 E3:
   "3 temas Padrão A, categorias diferentes").
4. **Fase exigida** (`requires_phase` no JSON): uma pauta que precisa de rota ainda inexistente (ex.: linka
   `/ferramentas/licenca-paternidade`, que nasce na Fase 4) só entra quando `PROGRESSO.md` marca a fase como
   `concluída`. Até lá, o script pula a pauta.
5. **Sazonalidade** (`season` no JSON): dentro da janela de antecedência da seção 6, a pauta sobe para o topo
   da sua prioridade, mesmo que seja `P1` ou `P2`.
6. **Pai Indica** segue a ordem das 4 rodadas do doc 04 §10 (R1 a R4) e depois os itens #21 a #60 da seção 3,
   sempre com o produto já em `products` com review longa (doc 04 §8 regra 6).
7. **Notícia**: 1 por dia útil a partir da Fase 8, pelos modelos da seção 4 (o modelo N1 "Mercado do pai"
   toda segunda-feira; os outros quando o gatilho acontece).

### 1.2 Como a rotina da Fase 8 consome o backlog

A rotina diária (doc 10 §2.3) tem a etapa **E3 — Planejamento**. Com este documento, E3 passa a ser:

```text
E3 (5 min) Planejamento:
  a) node scripts/rotina/backlog.mjs next --tipo artigo --n 3 --json > /tmp/rotina-pai/backlog-artigos.json
     (3 pautas pendentes, categorias diferentes, P0 → P1 → P2, respeitando requires_phase e season)
  b) node scripts/rotina/backlog.mjs next --tipo pai-indica --n 5 --json > /tmp/rotina-pai/backlog-pi.json
     (3 comparativos + 2 reviews; produtos não cobertos nos últimos 60 dias — query do doc 10 §2.5)
  c) node scripts/rotina/backlog.mjs next --tipo noticia --n 1 --json (modelo do dia; N1 às segundas)
  d) Os ≥ 2 "temas em alta" (E2) substituem até 2 das 3 pautas de artigo do dia, nunca o hub de um cluster.
     A pauta substituída volta para a fila (status continua `pendente`).
  e) Gravar o plano em /tmp/rotina-pai/plano.json com o campo `backlog_id` de cada item.
```

Depois de publicar e conferir com `SELECT` (E12), a rotina roda `node scripts/rotina/backlog.mjs mark <id> --slug <slug>`
para cada item e commita `supabase/seed/backlog.json` no PR `claude/rotina-AAAA-MM-DD` (E14). Se o validador
despublicar um post (`status='draft'`), a rotina roda `backlog.mjs unmark <id>` no mesmo dia.

Antes da Fase 8 (sessões manuais das Fases 1 a 7), o mesmo fluxo vale, só que quem roda os comandos é a sessão.

### 1.3 Como marcar uma pauta como publicada (passo a passo)

1. Inserir o post (`INSERT` único, doc 10 §3) e conferir:
   `select slug, kind, status, publish_at from posts where slug = '<slug>';` → 1 linha, `published`.
2. `node scripts/rotina/backlog.mjs mark <backlog_id> --slug <slug>` → o script grava `status: "publicado"`,
   `published_slug`, `published_at` (ISO) e imprime a linha alterada.
3. `git add supabase/seed/backlog.json` no mesmo commit do SQL (`supabase/rotina/AAAA-MM-DD/<slug>.sql`) ou do
   seed (`supabase/seed/posts/<slug>.json`, doc 03 §9.4).
4. Uma vez por semana (ou quando houver dúvida): `node scripts/rotina/backlog.mjs check` — reconcilia o JSON com o
   banco pela REST pública (anon key): item `pendente` cujo slug já existe em `posts` vira `publicado`; item
   `publicado` cujo slug não existe (ou está `draft`) volta para `pendente` com `notes` explicando. Imprime o
   resumo e sai com código 1 se mudou alguma coisa (para a rotina commitar).
5. Nunca marcar à mão no JSON sem rodar `check` depois; nunca marcar neste documento.

### 1.4 Regras de título, slug e metadados para todas as pautas

- `title`: frase ou pergunta, entidade principal no início, sem "guia", sem preço, sem superlativo vazio
  (doc 00 §4.3 itens 7, 16 e 17; §5.4). O título da tabela é o editorial; `seo_title` é o mesmo cortado
  a ≤ 60 caracteres (CLAUDE.md §6 item 10) mantendo a palavra-alvo.
- `slug`: minúsculas, sem acento, hífens, ≤ 80 caracteres, sem ano (doc 11 §8.2 item 13). Os slugs desta tabela
  são finais; o `backlog.mjs check` falha se dois itens tiverem o mesmo slug.
- `excerpt` ≤ 160 caracteres; `seo_description` 140–155; `reading_time` = palavras/200.
- `category_id` resolvido por slug da **subcategoria** quando ela existir (`select id from categories where slug='<sub>'`);
  a listagem da categoria-mãe inclui as filhas (doc 00 §3.2).
- Tags obrigatórias em `post_tags`: 1 tag `fase-*` (ou `fase-todas`), 1 a 2 tags `verbo:*` (doc 00 §3.6) e,
  quando for série, a tag `serie:<slug>` (doc 00 §3.7).
- `cover_image_url`: cascata do CLAUDE.md §5.3 (Pexels → Pixabay → Unsplash → Wikimedia), nunca repetida
  (`select cover_image_url from posts`), linha editorial em toda imagem.

---

## 2. Os 150 artigos do Blog

Legenda das colunas: **Int.** = intenção (`I` informacional, `C` comercial, `N` navegacional; `I/C` quando o
artigo informa e termina com ponte comercial). **Fase** = valor da tag `fase-<valor>`. **Prior.** = prioridade.
**Formato**: `padrao-a` ou `guia` (hub do cluster). "seed F1" na coluna de título = um dos 10 posts do doc 03 §9.2
(mesmo slug; título ajustado para tirar a palavra "guia"; categoria remapeada para o doc 00).

Distribuição: 14 · 11 · 10 · 13 · 10 · 11 · 15 · 12 · 9 · 8 · 10 · 8 · 11 · 8 = **150**. Mínimo de 8 por categoria cumprido.
Formato `guia` = 16 artigos: 14 hubs de cluster (um por cluster do doc 11 §8.1; `hub: true` no JSON) + 2 pilares secundários
(#40 como-sair-das-dividas-plano-de-90-dias e #139 guarda-compartilhada-como-funciona, `hub: false`). O cluster 15, "Presentes e datas",
mora em `/loja/presentes`, sem hub no Blog.

### 2.1 `paternidade-por-fase` — 14 artigos · hub C1 = `guia-do-pai-de-primeira-viagem`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Pai de primeira viagem: o que fazer da gestação aos primeiros 100 dias | guia-do-pai-de-primeira-viagem | paternidade-por-fase | gestacao-e-parto | I | pai de primeira viagem; o que o pai faz | guia | gestacao | P0 |
| 2 | Vai ser pai: o primeiro trimestre explicado para o homem (seed F1) | vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem | paternidade-por-fase | gestacao-e-parto | I | vai ser pai; primeiro trimestre gestação | padrao-a | gestacao | P0 |
| 3 | O que o pai faz no parto: antes, durante e nas primeiras horas | o-que-o-pai-faz-no-parto | paternidade-por-fase | gestacao-e-parto | I | o que o pai faz no parto; pai na sala de parto | padrao-a | gestacao | P0 |
| 4 | Mala da maternidade do pai: o que levar para não voltar em casa | mala-da-maternidade-do-pai | paternidade-por-fase | gestacao-e-parto | I/C | mala da maternidade do pai; pai pode dormir no hospital | padrao-a | gestacao | P1 |
| 5 | Como segurar um recém-nascido com segurança (e sem medo) (seed F1) | como-segurar-um-recem-nascido-com-seguranca | paternidade-por-fase | recem-nascido | I | como segurar um recém-nascido | padrao-a | recem-nascido | P0 |
| 6 | Rotina do pai nos primeiros 30 dias do bebê (seed F1) | rotina-do-pai-nos-primeiros-30-dias-do-bebe | paternidade-por-fase | recem-nascido | I | primeira semana do bebê em casa; rotina do pai | padrao-a | recem-nascido | P0 |
| 7 | Cólica do bebê: o que o pai pode fazer às 3 da manhã | colica-do-bebe-o-que-o-pai-pode-fazer | paternidade-por-fase | recem-nascido | I | cólica do bebê o que o pai pode fazer | padrao-a | recem-nascido | P1 |
| 8 | Introdução alimentar: o papel do pai na hora de comer | introducao-alimentar-o-papel-do-pai | paternidade-por-fase | recem-nascido | I | introdução alimentar pai; bebê 6 meses comer | padrao-a | bebe | P1 |
| 9 | Birra aos 2 anos: como o pai segura a onda sem gritar | birra-aos-2-anos-como-o-pai-segura-a-onda | paternidade-por-fase | 1-a-3-anos | I | birra 2 anos o que fazer | padrao-a | primeira-infancia | P1 |
| 10 | Como dar limites sem gritar: autoridade com calma (seed F1) | como-dar-limites-sem-gritar-autoridade-com-calma | paternidade-por-fase | 4-a-7-anos | I | como dar limite sem gritar; como dar limite sem bater | padrao-a | infancia | P0 |
| 11 | Como conversar com um filho de 8 a 12 anos que só responde "nada" | como-conversar-com-filho-de-8-a-12-anos | paternidade-por-fase | 8-a-12-anos | I | como conversar com filho de 8 anos | padrao-a | pre-adolescencia | P1 |
| 12 | Filho adolescente não fala comigo: como reabrir a conversa | filho-adolescente-nao-fala-comigo | paternidade-por-fase | adolescencia | I | filho adolescente não fala comigo; como conversar com filho adolescente | padrao-a | adolescencia | P1 |
| 13 | Como falar de pornografia com o filho adolescente | como-falar-de-pornografia-com-o-filho-adolescente | paternidade-por-fase | adolescencia | I | como falar de pornografia com filho | padrao-a | adolescencia | P1 |
| 14 | Filho adulto: como ser pai (e avô) sem invadir a casa dele | filho-adulto-como-ser-pai-sem-invadir | paternidade-por-fase | filho-adulto | I | como ser um bom avô; filho adulto | padrao-a | adulto | P2 |

### 2.2 `casamento-e-familia` — 11 artigos · hub C10 = `como-ser-um-bom-marido`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 15 | Como ser um bom marido: as 7 obrigações de quem lidera servindo | como-ser-um-bom-marido | casamento-e-familia | vida-a-dois | I | como ser um bom marido | guia | todas | P0 |
| 16 | Como ser um marido presente depois que o bebê chega (seed F1) | como-ser-um-marido-presente-depois-que-o-bebe-chega | casamento-e-familia | vida-a-dois | I | casamento depois do primeiro filho | padrao-a | recem-nascido | P0 |
| 17 | Puerpério visto pelo pai: o que acontece com ela e o que é seu | puerperio-visto-pelo-pai | casamento-e-familia | vida-a-dois | I | como ajudar a esposa no pós-parto; puerpério | padrao-a | recem-nascido | P0 |
| 18 | Liderança servidora em casa: o que é e o que não é | lideranca-servidora-em-casa | casamento-e-familia | vida-a-dois | I | liderança do homem na família; líder servidor | padrao-a | todas | P0 |
| 19 | Como dividir as tarefas de casa sem planilha de guerra | como-dividir-as-tarefas-de-casa | casamento-e-familia | rotina-da-casa | I | como dividir tarefas de casa | padrao-a | todas | P1 |
| 20 | Comunicação no casamento: 5 frases que acabam com a briga | comunicacao-no-casamento-5-frases-que-acabam-com-a-briga | casamento-e-familia | comunicacao-e-conflitos | I | crise no casamento o que fazer; comunicação do casal | padrao-a | todas | P1 |
| 21 | Como pedir desculpas para a esposa (e não repetir o erro) | como-pedir-desculpas-para-a-esposa | casamento-e-familia | comunicacao-e-conflitos | I | como pedir desculpas para a esposa | padrao-a | todas | P1 |
| 22 | As linguagens do amor da sua esposa: como descobrir a dela | linguagens-do-amor-da-esposa | casamento-e-familia | intimidade-conjugal | I | linguagens do amor da esposa | padrao-a | todas | P1 |
| 23 | Noite de encontro com a esposa: 12 ideias que cabem no orçamento | noite-de-encontro-com-a-esposa-ideias | casamento-e-familia | vida-a-dois | I | noite de encontro com a esposa ideias | padrao-a | todas | P1 |
| 24 | Curso de noivos: o que o homem precisa saber antes de casar | curso-de-noivos-o-que-o-homem-precisa-saber | casamento-e-familia | preparacao-para-o-casamento | I | curso de noivos igreja católica; como se preparar para o casamento | padrao-a | todas | P1 |
| 25 | Briga entre irmãos: o que o pai faz (e o que não faz) | briga-entre-irmaos-o-que-o-pai-faz | casamento-e-familia | familia-grande | I | briga entre irmãos o que fazer | padrao-a | infancia | P1 |

### 2.3 `provedor-e-carreira` — 10 artigos · hub C11 = `pai-provedor-carreira-e-familia`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 26 | Pai provedor: carreira e família sem perder nenhuma das duas | pai-provedor-carreira-e-familia | provedor-e-carreira | equilibrio-trabalho-e-casa | I | conciliar trabalho e família | guia | todas | P0 |
| 27 | Como pedir aumento de salário: o roteiro do pai que precisa | como-pedir-aumento-de-salario | provedor-e-carreira | salario-e-negociacao | I | como pedir aumento de salário | padrao-a | todas | P0 |
| 28 | Currículo que chama para a entrevista: modelo e os erros que eliminam | como-fazer-um-curriculo-bom | provedor-e-carreira | primeiro-emprego-e-recolocacao | I | como fazer um currículo bom | padrao-a | todas | P1 |
| 29 | Entrevista de emprego: as 15 perguntas e como responder sem decorar | entrevista-de-emprego-perguntas-e-respostas | provedor-e-carreira | primeiro-emprego-e-recolocacao | I | entrevista de emprego perguntas | padrao-a | todas | P1 |
| 30 | Fui demitido e tenho filhos: o que fazer nas primeiras 72 horas | demissao-o-que-fazer-com-filhos | provedor-e-carreira | primeiro-emprego-e-recolocacao | I | demissão o que fazer; seguro-desemprego | padrao-a | todas | P0 |
| 31 | Trabalhar em casa com filho pequeno: a rotina que funciona | trabalhar-em-casa-com-filho-pequeno | provedor-e-carreira | trabalho-remoto-e-home-office | I | trabalhar em casa com filho pequeno | padrao-a | primeira-infancia | P1 |
| 32 | Segunda fonte de renda para pai: 10 opções reais (sem pirâmide) | segunda-fonte-de-renda-para-pai | provedor-e-carreira | empreender-com-familia | I | segunda fonte de renda | padrao-a | todas | P1 |
| 33 | Como abrir MEI: passo a passo e o que muda na sua casa | como-abrir-mei-passo-a-passo | provedor-e-carreira | empreender-com-familia | I | como abrir MEI | padrao-a | todas | P1 |
| 34 | Liderar uma equipe sem virar o chefe que você odiava | como-liderar-uma-equipe | provedor-e-carreira | lideranca-no-trabalho | I | como liderar uma equipe | padrao-a | todas | P2 |
| 35 | Jovem aprendiz e primeiro emprego do filho: como o pai ajuda | primeiro-emprego-do-filho-jovem-aprendiz | provedor-e-carreira | primeiro-emprego-e-recolocacao | I | primeiro emprego jovem aprendiz | padrao-a | adolescencia | P2 |

### 2.4 `dinheiro-do-pai` — 13 artigos · hubs C6 = `orcamento-familiar-guia-do-pai` e C7 = `como-comecar-a-investir-guia-do-pai`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 36 | Orçamento familiar: o método do pai em 5 categorias | orcamento-familiar-guia-do-pai | dinheiro-do-pai | orcamento-familiar | I | planilha de orçamento familiar; orçamento familiar | guia | todas | P0 |
| 37 | Orçamento familiar para quem vai ser pai: passo a passo (seed F1) | orcamento-familiar-para-quem-vai-ser-pai | dinheiro-do-pai | orcamento-familiar | I | quanto custa o primeiro ano de um filho | padrao-a | gestacao | P0 |
| 38 | Quanto custa criar um filho no Brasil: a conta por idade | quanto-custa-criar-um-filho-no-brasil | dinheiro-do-pai | orcamento-familiar | I | quanto custa criar um filho no brasil | padrao-a | todas | P0 |
| 39 | Reserva de emergência: quanto guardar quando se tem filhos | reserva-de-emergencia-quanto-guardar | dinheiro-do-pai | reserva-e-seguros | I | reserva de emergência quanto guardar | padrao-a | todas | P0 |
| 40 | Como sair das dívidas: o plano de 90 dias do pai endividado | como-sair-das-dividas-plano-de-90-dias | dinheiro-do-pai | dividas-e-credito | I | como sair das dívidas | guia | todas | P1 |
| 41 | Como começar a investir: o caminho do pai com pouco dinheiro | como-comecar-a-investir-guia-do-pai | dinheiro-do-pai | investimentos-para-a-familia | I | como começar a investir com pouco dinheiro | guia | todas | P0 |
| 42 | Tesouro Direto para iniciantes: Selic, IPCA+ e prefixado sem mistério | tesouro-direto-para-iniciantes | dinheiro-do-pai | investimentos-para-a-familia | I | tesouro direto para iniciantes | padrao-a | todas | P0 |
| 43 | Bitcoin vale a pena para iniciante? O que o pai entende antes de comprar | bitcoin-vale-a-pena-para-iniciante | dinheiro-do-pai | bitcoin-e-cripto | I | bitcoin vale a pena para iniciante | padrao-a | todas | P1 |
| 44 | Como comprar bitcoin com segurança (e guardar sem perder) | como-comprar-bitcoin-com-seguranca | dinheiro-do-pai | bitcoin-e-cripto | I | como comprar bitcoin com segurança; carteira fria o que é | padrao-a | todas | P1 |
| 45 | Previdência do filho: investir desde o nascimento sem cair em conversa de gerente | previdencia-do-filho-investir-desde-o-nascimento | dinheiro-do-pai | investimentos-para-a-familia | I | previdência privada para filho; investir para filho desde o nascimento | padrao-a | recem-nascido | P1 |
| 46 | Seguro de vida vale a pena para quem tem filhos? | seguro-de-vida-vale-a-pena-para-pai | dinheiro-do-pai | reserva-e-seguros | I/C | seguro de vida vale a pena para pai | padrao-a | todas | P1 |
| 47 | Mesada: quanto dar e como ensinar o filho a lidar com dinheiro | mesada-quanto-dar-e-como-ensinar | dinheiro-do-pai | orcamento-familiar | I | mesada quanto dar; como ensinar filho a lidar com dinheiro | padrao-a | infancia | P1 |
| 48 | Dólar subiu: o que muda no bolso da sua família | dolar-subiu-o-que-muda-no-bolso-da-familia | dinheiro-do-pai | cambio-e-moedas | I | dólar vai subir; cotação do dólar hoje | padrao-a | todas | P1 |

### 2.5 `fe-e-virtude` — 10 artigos · hub C9 = `sao-jose-modelo-de-pai`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 49 | São José, modelo de pai: o que o silêncio dele ensina ao homem de hoje | sao-jose-modelo-de-pai | fe-e-virtude | sao-jose-e-os-santos | I | são josé padroeiro dos pais; como ser um bom pai católico | guia | todas | P0 |
| 50 | Consagração a São José em 33 dias: como fazer em família | consagracao-a-sao-jose-33-dias | fe-e-virtude | sao-jose-e-os-santos | I | consagração a são josé 33 dias | padrao-a | todas | P0 |
| 51 | Oração em família: como começar quando ninguém reza em casa | oracao-em-familia-como-comecar | fe-e-virtude | oracao-do-pai | I | oração em família; como rezar em família | padrao-a | todas | P0 |
| 52 | Como rezar o terço em família com crianças pequenas | como-rezar-o-terco-em-familia | fe-e-virtude | oracao-do-pai | I | como rezar o terço em família | padrao-a | primeira-infancia | P1 |
| 53 | Bênção do pai sobre os filhos: palavras, gesto e quando dar | bencao-do-pai-sobre-os-filhos | fe-e-virtude | transmitir-a-fe-aos-filhos | I | bênção do pai sobre os filhos | padrao-a | todas | P1 |
| 54 | Dia de São José (19 de março): como celebrar com a família | dia-de-sao-jose-19-de-marco | fe-e-virtude | sao-jose-e-os-santos | I | dia de são josé 19 de março | padrao-a | todas | P1 |
| 55 | São José Operário e o 1º de Maio: o trabalho como vocação | sao-jose-operario-1-de-maio | fe-e-virtude | sao-jose-e-os-santos | I | são josé operário 1 de maio | padrao-a | todas | P1 |
| 56 | Liderança espiritual do homem na família: por onde começar | lideranca-espiritual-do-homem-na-familia | fe-e-virtude | virtudes-masculinas | I | liderança espiritual do homem na família | padrao-a | todas | P0 |
| 57 | Filho não quer ir à missa: o que o pai faz | filho-nao-quer-ir-a-missa | fe-e-virtude | transmitir-a-fe-aos-filhos | I | filho não quer ir à missa | padrao-a | adolescencia | P1 |
| 58 | Luto de pai: como seguir cuidando dos filhos quando a dor é sua | luto-de-pai-como-seguir | fe-e-virtude | luto-e-esperanca | I | pai viúvo como criar filhos; luto do pai | padrao-a | todas | P2 |

### 2.6 `corpo-e-saude-do-homem` — 11 artigos · hub C8 = `check-up-do-homem-guia`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 59 | Check-up do homem: os exames por idade, dos 20 aos 60 | check-up-do-homem-guia | corpo-e-saude-do-homem | check-up-por-idade | I | exames que todo homem deve fazer | guia | todas | P0 |
| 60 | Exames que todo homem deve fazer a partir dos 30 anos (seed F1) | exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos | corpo-e-saude-do-homem | check-up-por-idade | I | exames homem 30 anos | padrao-a | todas | P0 |
| 61 | Exame de próstata: com que idade começar e como é de verdade | exame-de-prostata-com-que-idade | corpo-e-saude-do-homem | saude-sexual-e-prostata | I | exame de próstata com que idade | padrao-a | todas | P0 |
| 62 | Treino de 20 minutos em casa para pais sem tempo (seed F1) | treino-de-20-minutos-em-casa-para-pais-sem-tempo | corpo-e-saude-do-homem | treino-em-casa-e-academia | I | treino para pai sem tempo | padrao-a | todas | P0 |
| 63 | Sono do pai com recém-nascido: como dormir o suficiente | sono-do-pai-com-recem-nascido | corpo-e-saude-do-homem | sono-e-energia | I | sono do pai com bebê recém-nascido | padrao-a | recem-nascido | P0 |
| 64 | Como perder barriga depois dos 40 sem dieta maluca | como-perder-barriga-depois-dos-40 | corpo-e-saude-do-homem | alimentacao-do-homem | I | como perder barriga depois dos 40 | padrao-a | todas | P1 |
| 65 | Testosterona baixa: sintomas reais e o que o médico vai pedir | testosterona-baixa-sintomas | corpo-e-saude-do-homem | saude-sexual-e-prostata | I | testosterona baixa sintomas | padrao-a | todas | P1 |
| 66 | Pressão alta no homem jovem: por que acontece e o que fazer | pressao-alta-no-homem-jovem | corpo-e-saude-do-homem | check-up-por-idade | I | pressão alta no homem jovem | padrao-a | todas | P1 |
| 67 | Burnout paterno: os sinais que o pai ignora até cair | burnout-paterno-sinais | corpo-e-saude-do-homem | saude-mental-e-estresse | I | burnout paterno sinais; depressão pós-parto paterna | padrao-a | recem-nascido | P1 |
| 68 | Engasgo, queda e corte: primeiros socorros que o pai precisa saber | primeiros-socorros-em-casa-engasgo-queda-corte | corpo-e-saude-do-homem | primeiros-socorros-em-casa | I | primeiros socorros em casa criança engasgo | padrao-a | primeira-infancia | P0 |
| 69 | Como largar a pornografia: um plano de 30 dias para o homem | como-largar-a-pornografia-plano-de-30-dias | corpo-e-saude-do-homem | vicios-e-liberdade | I | como parar de ver pornografia | padrao-a | todas | P1 |

### 2.7 `churrasco-e-cozinha` — 15 artigos · hub C3 = `guia-dos-cortes-de-carne-para-churrasco`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 70 | Cortes de carne para churrasco: do boi ao espeto, corte por corte | guia-dos-cortes-de-carne-para-churrasco | churrasco-e-cozinha | cortes-de-carne | I | cortes de carne para churrasco | guia | todas | P0 |
| 71 | Cortes de carne para churrasco: o básico para o pai iniciante (seed F1) | cortes-de-carne-para-churrasco-guia-do-pai-iniciante | churrasco-e-cozinha | cortes-de-carne | I | churrasco para iniciantes; o que comprar | padrao-a | todas | P0 |
| 72 | Picanha: como escolher no açougue e não levar coxão duro | picanha-como-escolher | churrasco-e-cozinha | cortes-de-carne | I | picanha como escolher | padrao-a | todas | P0 |
| 73 | Fraldinha ou maminha: diferença, preparo e qual comprar | fraldinha-ou-maminha-diferenca | churrasco-e-cozinha | cortes-de-carne | I | fraldinha ou maminha diferença | padrao-a | todas | P0 |
| 74 | Costela no bafo: tempo, fogo e o erro que resseca a carne | costela-no-bafo-quanto-tempo | churrasco-e-cozinha | cortes-de-carne | I | costela no bafo quanto tempo | padrao-a | todas | P0 |
| 75 | Cupim na churrasqueira: como deixar macio sem papel alumínio | cupim-na-churrasqueira-como-deixar-macio | churrasco-e-cozinha | cortes-de-carne | I | cupim na churrasqueira | padrao-a | todas | P1 |
| 76 | Acém: o corte barato que vira churrasco (e panela) de respeito | acem-o-corte-barato-que-vira-churrasco | churrasco-e-cozinha | cortes-de-carne | I | acém churrasco; acém na panela | padrao-a | todas | P1 |
| 77 | Alcatra e contrafilé: o bife de domingo sem errar o ponto | alcatra-e-contrafile-bife-de-domingo | churrasco-e-cozinha | cortes-de-carne | I | alcatra ou contrafilé; bife de contrafilé | padrao-a | todas | P1 |
| 78 | Ponto da carne: tempo de cada lado por espessura | ponto-da-carne-tempo-de-cada-lado | churrasco-e-cozinha | tecnicas-de-churrasco | I | ponto da carne tempo de cada lado | padrao-a | todas | P0 |
| 79 | Quanto de carne por pessoa no churrasco (com as crianças na conta) | quanto-de-carne-por-pessoa-no-churrasco | churrasco-e-cozinha | tecnicas-de-churrasco | I | quanto de carne por pessoa churrasco | padrao-a | todas | P0 |
| 80 | Como acender a churrasqueira sem álcool em 10 minutos | como-acender-churrasqueira-sem-alcool | churrasco-e-cozinha | tecnicas-de-churrasco | I | como acender churrasqueira sem álcool | padrao-a | todas | P0 |
| 81 | Carvão ou lenha: qual escolher e quanto comprar | carvao-ou-lenha-qual-escolher | churrasco-e-cozinha | tecnicas-de-churrasco | I/C | melhor carvão para churrasco; quanto de carvão | padrao-a | todas | P1 |
| 82 | Sal grosso ou sal de parrilla: quando usar cada um | sal-grosso-ou-sal-de-parrilla | churrasco-e-cozinha | tecnicas-de-churrasco | I | sal grosso ou sal de parrilla | padrao-a | todas | P1 |
| 83 | Acompanhamentos de churrasco: 10 que a família come de verdade | acompanhamentos-de-churrasco | churrasco-e-cozinha | receitas-de-churrasco | I | acompanhamentos de churrasco | padrao-a | todas | P1 |
| 84 | Cozinhar com os filhos: 5 receitas seguras por idade | cozinhar-com-os-filhos-receitas-por-idade | churrasco-e-cozinha | cozinhar-com-os-filhos | I | receitas para fazer com crianças | padrao-a | infancia | P2 |

### 2.8 `caixa-de-ferramentas-e-reparos` — 12 artigos · hub C4 = `caixa-de-ferramentas-basica-do-pai`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 85 | Caixa de ferramentas básica do pai: o que ter e o que passa a resolver | caixa-de-ferramentas-basica-do-pai | caixa-de-ferramentas-e-reparos | ferramentas-essenciais | I/C | ferramentas básicas para ter em casa | guia | todas | P0 |
| 86 | Kit básico de ferramentas para a casa: o que todo pai precisa ter (seed F1) | kit-basico-de-ferramentas-para-a-casa | caixa-de-ferramentas-e-reparos | ferramentas-essenciais | I/C | kit de ferramentas básico | padrao-a | todas | P0 |
| 87 | Furadeira ou parafusadeira: qual comprar primeiro | furadeira-ou-parafusadeira-qual-comprar | caixa-de-ferramentas-e-reparos | ferramentas-essenciais | C | parafusadeira ou furadeira qual comprar | padrao-a | todas | P0 |
| 88 | Como furar parede sem rachar (e sem acertar o fio) | como-furar-parede-sem-rachar | caixa-de-ferramentas-e-reparos | ferramentas-essenciais | I | como furar parede sem rachar | padrao-a | todas | P0 |
| 89 | Nível a laser: quando vale a pena e como pendurar tudo reto | nivel-a-laser-quando-vale-a-pena | caixa-de-ferramentas-e-reparos | ferramentas-essenciais | I/C | nível a laser vale a pena | padrao-a | todas | P1 |
| 90 | Como trocar a resistência do chuveiro sem levar choque | como-trocar-resistencia-do-chuveiro | caixa-de-ferramentas-e-reparos | eletrica-basica | I | como trocar resistência do chuveiro | padrao-a | todas | P0 |
| 91 | Como trocar uma tomada (e quando chamar o eletricista) | como-trocar-tomada | caixa-de-ferramentas-e-reparos | eletrica-basica | I | como trocar tomada | padrao-a | todas | P1 |
| 92 | Como desentupir a pia sem produto químico | como-desentupir-pia | caixa-de-ferramentas-e-reparos | hidraulica-e-vazamentos | I | como desentupir pia | padrao-a | todas | P0 |
| 93 | Torneira pingando e descarga vazando: os 5 consertos de sábado | torneira-pingando-e-descarga-vazando | caixa-de-ferramentas-e-reparos | hidraulica-e-vazamentos | I | torneira pingando como consertar | padrao-a | todas | P1 |
| 94 | Como instalar suporte de TV na parede (drywall e alvenaria) | como-instalar-suporte-de-tv | caixa-de-ferramentas-e-reparos | marcenaria-e-montagem | I | como instalar suporte de TV | padrao-a | todas | P1 |
| 95 | Segurança da casa com crianças: tomadas, janelas, escada e produtos | seguranca-da-casa-com-criancas | caixa-de-ferramentas-e-reparos | seguranca-da-casa | I | segurança da casa para bebê | padrao-a | primeira-infancia | P1 |
| 96 | Projetos de marcenaria simples para fazer com o filho | projetos-de-marcenaria-com-o-filho | caixa-de-ferramentas-e-reparos | projetos-com-os-filhos | I | marcenaria com crianças projetos | padrao-a | infancia | P2 |

### 2.9 `carro-e-moto` — 9 artigos · hub C5 = `manutencao-do-carro-guia-do-pai`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 97 | Manutenção do carro: o calendário do pai (semanal, 5 mil e 10 mil km) | manutencao-do-carro-guia-do-pai | carro-e-moto | manutencao-e-revisao | I | revisão do carro quando fazer; manutenção preventiva | guia | todas | P0 |
| 98 | Quando trocar o óleo do carro (e o que acontece se atrasar) | quando-trocar-oleo-do-carro | carro-e-moto | manutencao-e-revisao | I | quando trocar óleo do carro | padrao-a | todas | P0 |
| 99 | Como calibrar o pneu e quando trocar: o checklist do portão | como-calibrar-pneu-e-quando-trocar | carro-e-moto | manutencao-e-revisao | I | como calibrar pneu; quando trocar pneu | padrao-a | todas | P0 |
| 100 | Como trocar pneu furado com as crianças no carro | como-trocar-pneu-furado | carro-e-moto | manutencao-e-revisao | I | como trocar pneu furado | padrao-a | todas | P1 |
| 101 | Cadeirinha de bebê para carro: como escolher pela idade e pelo peso | cadeirinha-de-bebe-para-carro-como-escolher | carro-e-moto | seguranca-e-cadeirinha | I/C | cadeirinha de bebê para carro como escolher | padrao-a | recem-nascido | P0 |
| 102 | Luz da injeção acesa: o que fazer antes de ir à oficina | luz-da-injecao-acesa-o-que-fazer | carro-e-moto | manutencao-e-revisao | I | luz da injeção acesa o que fazer | padrao-a | todas | P1 |
| 103 | Vale a pena comprar carro usado para a família? | vale-a-pena-comprar-carro-usado | carro-e-moto | carro-de-familia | I | vale a pena comprar carro usado; carro de 7 lugares | padrao-a | todas | P1 |
| 104 | Viagem de carro com filhos: paradas, enjoo e o kit do banco de trás | viagem-de-carro-com-filhos | carro-e-moto | viagem-de-carro-com-filhos | I | viagem de carro com crianças dicas | padrao-a | infancia | P1 |
| 105 | Como ensinar o filho a dirigir sem brigar | como-ensinar-o-filho-a-dirigir | carro-e-moto | ensinar-o-filho-a-dirigir | I | como ensinar filho a dirigir | padrao-a | adolescencia | P2 |

### 2.10 `estilo-e-cuidados` — 8 artigos · hub C13 = `guia-de-estilo-do-pai`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 106 | Estilo do pai: as 10 peças que resolvem trabalho, missa e churrasco | guia-de-estilo-do-pai | estilo-e-cuidados | guarda-roupa-essencial | I | como se vestir bem homem; estilo masculino clássico | guia | todas | P0 |
| 107 | Como cuidar da barba: a rotina de 5 minutos | como-cuidar-da-barba | estilo-e-cuidados | barba-e-cabelo | I | como cuidar da barba | padrao-a | todas | P0 |
| 108 | Como se vestir bem com pouco dinheiro: 1 look, 3 orçamentos | como-se-vestir-bem-com-pouco-dinheiro | estilo-e-cuidados | guarda-roupa-essencial | I/C | como se vestir bem com pouco dinheiro | padrao-a | todas | P1 |
| 109 | Como passar camisa em 6 minutos | como-passar-camisa | estilo-e-cuidados | guarda-roupa-essencial | I | como passar camisa | padrao-a | todas | P1 |
| 110 | Skincare masculino básico: 3 produtos e nada mais | skincare-masculino-basico | estilo-e-cuidados | higiene-e-pele | I | skincare masculino básico | padrao-a | todas | P1 |
| 111 | Corte de cabelo masculino clássico: o que pedir ao barbeiro | corte-de-cabelo-masculino-classico | estilo-e-cuidados | barba-e-cabelo | I | corte de cabelo masculino clássico | padrao-a | todas | P2 |
| 112 | Como pentear o cabelo da filha (e fazer um rabo que dura) | como-pentear-o-cabelo-da-filha | estilo-e-cuidados | cuidar-dos-filhos-no-dia-a-dia | I | como pentear cabelo de menina | padrao-a | infancia | P1 |
| 113 | Etiqueta do pai: aperto de mão, mesa e como se portar na festa da escola | etiqueta-do-pai-aperto-de-mao-mesa-e-postura | estilo-e-cuidados | etiqueta-e-postura | I | etiqueta masculina; postura | padrao-a | todas | P2 |

### 2.11 `esporte-e-lazer-com-os-filhos` — 10 artigos · hub C12 = `o-que-fazer-com-os-filhos-no-fim-de-semana`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 114 | O que fazer com os filhos no fim de semana: 52 ideias por idade e custo | o-que-fazer-com-os-filhos-no-fim-de-semana | esporte-e-lazer-com-os-filhos | fim-de-semana-de-940 | I | o que fazer com os filhos no fim de semana | guia | todas | P0 |
| 115 | Fim de semana de 940: por que cada sábado conta | fim-de-semana-de-940-por-que-cada-sabado-conta | esporte-e-lazer-com-os-filhos | fim-de-semana-de-940 | I | fim de semana com os filhos | padrao-a | todas | P0 |
| 116 | Brincadeiras de pai e filho que não precisam de nada | brincadeiras-de-pai-e-filho | esporte-e-lazer-com-os-filhos | atividades-por-idade | I | brincadeiras de pai e filho | padrao-a | primeira-infancia | P0 |
| 117 | Como ensinar o filho a andar de bicicleta em um fim de semana | como-ensinar-filho-a-andar-de-bicicleta | esporte-e-lazer-com-os-filhos | bicicleta-natacao-e-corrida | I | como ensinar filho a andar de bicicleta | padrao-a | infancia | P1 |
| 118 | Acampar com crianças: o que levar na primeira vez | acampar-com-criancas-o-que-levar | esporte-e-lazer-com-os-filhos | pesca-acampamento-e-natureza | I/C | acampar com crianças o que levar | padrao-a | infancia | P1 |
| 119 | Pescaria com o filho iniciante: onde, com o quê e como não desanimar | pescaria-com-filho-iniciante | esporte-e-lazer-com-os-filhos | pesca-acampamento-e-natureza | I | pescaria com filho iniciante | padrao-a | infancia | P1 |
| 120 | Como ensinar o filho a jogar futebol sem virar o pai que grita na beira | como-ensinar-filho-a-jogar-futebol | esporte-e-lazer-com-os-filhos | futebol-e-esportes-coletivos | I | ensinar filho a jogar futebol | padrao-a | infancia | P1 |
| 121 | Trilha com crianças: distância por idade e o que levar | trilha-com-criancas | esporte-e-lazer-com-os-filhos | pesca-acampamento-e-natureza | I | trilha com crianças | padrao-a | infancia | P2 |
| 122 | Jogos de tabuleiro para a família: 10 que o pai também curte | jogos-de-tabuleiro-para-familia | esporte-e-lazer-com-os-filhos | jogos-de-mesa-e-brincadeiras | C | jogos de tabuleiro para família | padrao-a | pre-adolescencia | P1 |
| 123 | Filmes para ver com os filhos antes dos 10 anos | filmes-para-ver-com-os-filhos-antes-dos-10 | esporte-e-lazer-com-os-filhos | filmes-livros-e-musica | I | filmes para ver com os filhos | padrao-a | infancia | P2 |

### 2.12 `tecnologia-do-pai` — 8 artigos · hub C14 = `tecnologia-para-pais-guia`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 124 | Tecnologia para pais: controle parental, telas e segurança em uma página | tecnologia-para-pais-guia | tecnologia-do-pai | controle-parental-e-telas | I | controle parental como configurar; tecnologia para pais | guia | todas | P0 |
| 125 | Como configurar o controle parental no celular do filho (Android e iPhone) | como-configurar-controle-parental-no-celular-do-filho | tecnologia-do-pai | controle-parental-e-telas | I | controle parental como configurar | padrao-a | pre-adolescencia | P0 |
| 126 | Celular para criança: com que idade e com quais regras | celular-para-crianca-qual-idade | tecnologia-do-pai | celular-e-acessorios | I | celular para criança qual idade | padrao-a | pre-adolescencia | P0 |
| 127 | Tempo de tela por idade: a tabela que o pai cola na geladeira | tempo-de-tela-por-idade | tecnologia-do-pai | controle-parental-e-telas | I | tempo de tela por idade | padrao-a | primeira-infancia | P1 |
| 128 | Como bloquear sites no roteador de casa | como-bloquear-sites-no-roteador | tecnologia-do-pai | seguranca-digital-da-familia | I | como bloquear sites no roteador | padrao-a | pre-adolescencia | P1 |
| 129 | Games e filhos: classificação, tempo e como jogar junto | games-e-filhos-classificacao-tempo-e-jogar-junto | tecnologia-do-pai | games-e-filhos | I | videogame para crianças idade; classificação indicativa jogos | padrao-a | infancia | P1 |
| 130 | IA no dia a dia do pai: 10 usos que economizam tempo | ia-no-dia-a-dia-do-pai | tecnologia-do-pai | ia-no-dia-a-dia-do-pai | I | como usar inteligência artificial no dia a dia | padrao-a | todas | P2 |
| 131 | Golpes no WhatsApp: como proteger seus pais e seus filhos | golpes-no-whatsapp-como-proteger-a-familia | tecnologia-do-pai | seguranca-digital-da-familia | I | golpes no whatsapp como se proteger | padrao-a | todas | P1 |

### 2.13 `direitos-do-pai` — 11 artigos · hub C2 = `licenca-paternidade-guia-completo`

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 132 | Licença-paternidade: quantos dias, como pedir e o que muda até 2029 | licenca-paternidade-guia-completo | direitos-do-pai | licenca-paternidade-e-trabalho | I | licença paternidade quantos dias; como pedir licença paternidade | guia | gestacao | P0 |
| 133 | Lei 15.371/2026: o que muda na licença-paternidade ano a ano | lei-15371-2026-licenca-paternidade-o-que-muda | direitos-do-pai | licenca-paternidade-e-trabalho | I | licença paternidade 2027; lei 15.371; salário-paternidade | padrao-a | gestacao | P0 |
| 134 | Empresa Cidadã: como pedir os 20 dias de licença-paternidade | licenca-paternidade-20-dias-empresa-cidada | direitos-do-pai | licenca-paternidade-e-trabalho | I | licença paternidade 20 dias empresa cidadã | padrao-a | gestacao | P0 |
| 135 | Licença-paternidade para MEI, autônomo e servidor: o que vale para você | licenca-paternidade-mei-autonomo-e-servidor | direitos-do-pai | licenca-paternidade-e-trabalho | I | licença paternidade MEI; licença paternidade servidor público | padrao-a | gestacao | P1 |
| 136 | Lei do Acompanhante: o pai pode ficar no parto e na maternidade? | lei-do-acompanhante-pai-no-parto | direitos-do-pai | escola-saude-e-direitos-do-filho | I | lei do acompanhante parto; pai pode dormir no hospital | padrao-a | gestacao | P0 |
| 137 | Como registrar o filho: prazo, documentos e o pai que registra sozinho | como-registrar-o-filho-prazo-e-documentos | direitos-do-pai | registro-e-documentos-do-filho | I | direito do pai de registrar o filho; registro de nascimento prazo | padrao-a | recem-nascido | P0 |
| 138 | Salário-família: quem tem direito, valor e como pedir | salario-familia-quem-tem-direito | direitos-do-pai | licenca-paternidade-e-trabalho | I | salário-família quem tem direito | padrao-a | todas | P0 |
| 139 | Guarda compartilhada: como funciona na prática (Lei 13.058/2014) | guarda-compartilhada-como-funciona | direitos-do-pai | guarda-e-convivencia | I | guarda compartilhada como funciona | guia | todas | P0 |
| 140 | Pensão alimentícia: quanto é, como se calcula e o que a Justiça olha | pensao-alimenticia-quanto-e | direitos-do-pai | pensao-alimenticia | I | pensão alimentícia quanto é | padrao-a | todas | P0 |
| 141 | Alienação parental: sinais, o que a lei diz e o que o pai faz | alienacao-parental-o-que-fazer | direitos-do-pai | alienacao-parental | I | alienação parental o que fazer | padrao-a | todas | P1 |
| 142 | Pai viúvo: salário-maternidade, pensão por morte e os direitos dos filhos | pai-viuvo-direitos-salario-maternidade-e-pensao | direitos-do-pai | heranca-e-testamento | I | salário-maternidade pai viúvo; pensão por morte filhos | padrao-a | todas | P2 |

Fontes obrigatórias desta categoria (doc 00 §4.3 item 9 — citar lei com número e ano, link oficial ao fim):
Lei 15.371/2026 (Senado: https://www12.senado.leg.br/noticias/materias/2026/04/01/sancionado-o-aumento-gradual-da-licenca-paternidade ;
Câmara: https://www.camara.leg.br/noticias/1259716-lei-amplia-licenca-paternidade-para-20-dias-e-cria-salario-paternidade ;
texto no Planalto **a confirmar** antes de linkar: `https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/lei/l15371.htm`),
Lei 11.770/2008 (Empresa Cidadã), Lei 11.108/2005 (acompanhante), Lei 13.058/2014 (guarda compartilhada),
Lei 8.213/1991 art. 65-70 (salário-família) e art. 71-B (salário-maternidade ao pai viúvo), Portaria Interministerial
MPS/MF nº 13/2026 (valores 2026). Cronograma da Lei 15.371/2026 a usar no texto: 5 dias em 2026; 10 dias a partir
de 01/01/2027; 15 em 2028; 20 em 2029 (última etapa condicionada a meta fiscal, segundo análise do ConJur). Todo
artigo traz o `ContentNotice` jurídico e termina com "procure um advogado ou a Defensoria Pública".

### 2.14 `historias-de-pai` — 8 artigos (formatos das séries)

Regra desta categoria (doc 00 §4.3 itens 12, 13 e 15): nenhuma história é inventada. Os itens 143 e 144 são
artigos de formato (como participar / como escrever) e saem em `P0`. Os itens 145 a 150 só são publicados
quando houver **relato real aprovado em `stories`** (Fase 7) ou entrevista registrada pelo dono; até lá ficam
`pendente` com `requires_phase: "F7"`. Sem nome completo de criança; foto só do próprio filho do autor com
consentimento marcado. O semáforo nesses artigos é "Semáforo do pai: o que compartilhar e o que guardar".

| # | Título SEO | slug | categoria | subcategoria | Int. | palavras-alvo | formato | fase | prior. |
|---|---|---|---|---|---|---|---|---|---|
| 143 | Meu pai me ensinou: como enviar a sua história (chamada mensal) | meu-pai-me-ensinou-como-enviar-a-sua-historia | historias-de-pai | meu-pai-me-ensinou | I | histórias de pai; meu pai me ensinou | padrao-a | todas | P0 |
| 144 | Carta ao filho: como escrever a sua (com modelo e 20 perguntas) | carta-ao-filho-como-escrever-a-sua | historias-de-pai | cartas-ao-filho | I | carta para o filho modelo; carta de pai para filho | padrao-a | todas | P0 |
| 145 | Primeiros dias: o diário do pai nas 72 horas depois do parto | primeiros-dias-o-diario-do-pai | historias-de-pai | primeiros-dias | I | relato de pai primeiro filho | padrao-a | recem-nascido | P1 |
| 146 | Recomeço: a história do pai que voltou a ser presente depois da separação | recomeco-pai-presente-depois-da-separacao | historias-de-pai | recomeco | I | pai separado presente; história real | padrao-a | todas | P1 |
| 147 | Conversão: como a paternidade trouxe o homem de volta à Igreja | conversao-como-a-paternidade-trouxe-o-homem-de-volta | historias-de-pai | conversao-e-fe | I | conversão católica testemunho pai | padrao-a | todas | P1 |
| 148 | Pais que inspiram: Luigi Martin, Karol Wojtyła e outros homens que formaram santos | pais-que-inspiram-pais-de-santos | historias-de-pai | pais-que-inspiram | I | pais de santos; Luigi Martin; pai de João Paulo II | padrao-a | todas | P1 |
| 149 | Pai viúvo que criou os filhos sozinho: o relato e o que ele faria diferente | pai-viuvo-que-criou-os-filhos-sozinho | historias-de-pai | recomeco | I | pai viúvo criar filhos sozinho | padrao-a | todas | P2 |
| 150 | O avô que ensinou o neto a rezar: histórias de três gerações | o-avo-que-ensinou-o-neto-a-rezar | historias-de-pai | meu-pai-me-ensinou | I | avô e neto fé; como ensinar a rezar para o neto | padrao-a | adulto | P2 |

### 2.15 Conferência rápida da tabela (rodar depois de montar o JSON)

```bash
# 150 artigos, slugs únicos, 14 categorias com >= 8, 16 guias, 14 hubs
node -e '
const b = require("./supabase/seed/backlog.json");
const a = b.items.filter(i => i.type === "artigo");
const slugs = new Set(a.map(i => i.slug));
const porCat = {}; a.forEach(i => porCat[i.category] = (porCat[i.category] || 0) + 1);
console.log({ artigos: a.length, slugsUnicos: slugs.size, guias: a.filter(i => i.format === "guia").length, hubs: a.filter(i => i.hub).length, porCat });
process.exit(a.length === 150 && slugs.size === 150 && Object.values(porCat).every(n => n >= 8) ? 0 : 1);'
```

---

## 3. 40 ideias de Pai Indica (#21 a #60)

Continuação da tabela "Primeiros 20 Pai Indica a publicar" do doc 04 §10 (nunca repetir produto, título ou molde
daquela lista). Regras que valem para todos (doc 04 §8): produto real vendido na Amazon Brasil, **ASIN confirmado com
`scripts/rotina/amz.py` antes de escrever** (se o modelo exato não estiver disponível, trocar pela versão/voltagem
vigente da mesma linha e anotar no `PROGRESSO.md`); todo produto entra em `products` com review longa antes do post;
faixa de preço em 2 lojas; capa composta por `cover_cmp.py`; `category_id = pai-indica`; `product_category` e
`product_subcategory` da taxonomia do doc 04 §3; nota pela régua do doc 04 §1.1; botão "Comprar agora na Amazon".

Coluna **tipo**: `review` (1 produto), `comparativo` (2 a 4), `lista` ("Os N melhores"). Itens marcados `[1p3o]` levam a
tag `serie:1-produto-3-orcamentos` (doc 00 §3.7) e organizam os produtos em Econômico / Equilibrado / Premium.

| # | tipo | Título (variar o molde dentro da rodada) | Produtos reais (marca e modelo) | product_category / product_subcategory | Por que agora |
|---|---|---|---|---|---|
| 21 | comparativo | Weber Smokey Joe Premium, Tramontina TCP-460 ou Mor Apolo: churrasqueira portátil para varanda e praia | Weber Smokey Joe Premium 37 cm; Tramontina TCP-460; Mor Apolo | churrasco-e-cozinha / churrasqueiras | Mesmo trio usado como exemplo de `review`/`comparison` no doc 02 §5.3–5.4; o pai de apartamento é a persona nº 1 |
| 22 | comparativo [1p3o] | Faca de churrasco 8": Tramontina Polywood, Tramontina Century ou Victorinox Swiss Classic? | Tramontina Polywood 8" (22250); Tramontina Century 8"; Victorinox Swiss Classic 8" | churrasco-e-cozinha / facas-e-cutelaria | Estreia da série "1 produto, 3 orçamentos"; a Polywood é o produto nº 1 do seed da loja (`faca-churrasco-tramontina-polywood-8`) |
| 23 | lista | Os 5 melhores termômetros de carne para acertar o ponto sem adivinhar | ThermoPro TP-01S; ThermoPro TP19H; Inkbird IHT-1P; Inkbird IBT-4XS (Bluetooth); Incoterm termômetro culinário tipo espeto | churrasco-e-cozinha / acessorios-de-churrasco | Ponte comercial do artigo #78 (ponto da carne); produto do seed da loja (doc 05 §10.1) |
| 24 | comparativo | Frigideira de ferro fundido 26 cm: Fundição Santana, Lodge ou Tramontina Trento? | Fundição Santana 26 cm; Lodge L8SK3 (26 cm); Tramontina Trento ferro fundido 26 cm | churrasco-e-cozinha / panelas-e-ferro-fundido | Churrasco de apartamento e bife de domingo (#77); ferro fundido dura a vida inteira (doc 05 §10.1) |
| 25 | review | Acendedor de carvão Weber Rapidfire: vale a pena para acender sem álcool? | Weber Rapidfire (chaminé de acendimento) | churrasco-e-cozinha / acessorios-de-churrasco | Ponte do artigo #80; segurança (semáforo com "Sinal de alerta" sobre álcool) |
| 26 | comparativo | Bialetti Moka Express, prensa francesa Bodum ou Nespresso Essenza Mini: o café do pai que acorda cedo | Bialetti Moka Express 6 xícaras; Bodum Brazil 1 L; Nespresso Essenza Mini | churrasco-e-cozinha / cafe | Presente clássico (doc 05 §10.10) e rotina do pai com recém-nascido (#63) |
| 27 | review | Air fryer Philco PFR15PI 5,5 L: dá conta da janta da família? | Philco Air Fryer PFR15PI 5,5 L | churrasco-e-cozinha / eletroportateis | Cozinha do dia a dia; alto volume de busca; produto da faixa de entrada |
| 28 | comparativo | Furadeira de impacto Bosch GSB 13 RE, Makita HP1630 ou DeWalt DWD024: qual fura concreto sem drama? | Bosch GSB 13 RE 650 W; Makita HP1630; DeWalt DWD024 | ferramentas / furadeiras-e-parafusadeiras | Keyword "melhor furadeira para uso doméstico" (cluster 4); Bosch GSB 13 RE está no seed da loja |
| 29 | lista [1p3o] | Caixa de ferramentas em 3 níveis: básica, intermediária e profissional | Tramontina jogo de ferramentas 40 peças (básico); Tramontina Master 110 peças com maleta (intermediário); Stanley kit profissional 142 peças (pro) | ferramentas / jogos-de-ferramentas | Ideia P0 nº 25 da pesquisa (`res-ecossistema.md`); ponte do hub #85 e do seed #86 |
| 30 | comparativo | Nível a laser Bosch GLL 2-12 G, DeWalt DW088K ou Vonder NLV 002: pendurar reto sem brigar com a trena | Bosch GLL 2-12 G; DeWalt DW088K; Vonder NLV 002 | ferramentas / medicao-e-nivel | Ponte do artigo #89; tema pedido pelo dono (nível a laser) |
| 31 | comparativo | Trena a laser Bosch GLM 20 ou GLM 50-27 CG: qual medir a casa inteira? | Bosch GLM 20; Bosch GLM 50-27 CG | ferramentas / medicao-e-nivel | Produto do seed da loja (doc 05 §10.2); comparativo de 2 modelos da mesma linha |
| 32 | comparativo | Esmerilhadeira Bosch GWS 850, Makita 9557HPG ou DeWalt DWE4120: a primeira do pai | Bosch GWS 850; Makita 9557HPG; DeWalt DWE4120 | ferramentas / serras-e-esmerilhadeiras | Reforma e quintal; semáforo de EPI obrigatório |
| 33 | review | Serra tico-tico Bosch GST 650: a primeira serra para projetos com os filhos? | Bosch GST 650 450 W | ferramentas / serras-e-esmerilhadeiras | Produto do seed (doc 05 §10.2); ponte do artigo #96 |
| 34 | lista | 5 itens de proteção para não se machucar no conserto de sábado | 3M óculos de segurança Vision 3000; Vonder luva de vaqueta; 3M protetor auricular tipo concha H6; 3M máscara PFF2 (9320); Vonder joelheira | ferramentas / epi-e-seguranca | Segurança primeiro (doc 04 §8 regra 15); linka #88, #90 e #32 |
| 35 | comparativo | Compressor 12 V Multilaser AU608, Schulz Air Plus ou Xiaomi Portable Air Compressor 1S: calibrar no portão de casa | Multilaser AU608; Schulz Air Plus 12 V; Xiaomi Mi Portable Electric Air Compressor 1S | carro-e-moto / emergencia-e-manutencao | Ponte do artigo #99; o doc 04 #10 é review do Schulz, este é comparativo de 3 |
| 36 | comparativo | Assento de elevação Burigotto Protege, Chicco Quasar Plus ou Multikids Baby Safe Booster: dos 4 aos 10 anos | Burigotto Protege Reclinável; Chicco Quasar Plus; Multikids Baby Safe Booster | carro-e-moto / cadeirinhas-e-transporte-infantil | Continuação do doc 04 #7 (cadeirinha 0-36 kg) para a fase `infancia`; semáforo de segurança |
| 37 | lista | Kit para lavar o carro em casa sem riscar: 5 produtos Vonixx que resolvem | Vonixx V-Floc 1,5 L; Vonixx Blend Carnaúba Sílica Paste Wax; Vonixx Sintra Fast; Vonixx Native Carnaúba; Vonixx toalha de microfibra | carro-e-moto / limpeza-e-estetica | Produtos do seed (doc 05 §10.3); atividade de sábado com o filho (#114) |
| 38 | review | Carregador de bateria NOCO Genius1: para o carro que fica parado no home office | NOCO Genius1 6 V/12 V | carro-e-moto / emergencia-e-manutencao | Produto do seed (doc 05 §10.3); ponte com #31 (home office) |
| 39 | comparativo | Capacete LS2 FF353 Rapid, Norisk FF302 Razor ou Pro Tork Evolution G8: qual protege o pai motociclista? | LS2 FF353 Rapid; Norisk FF302 Razor; Pro Tork Evolution G8 | carro-e-moto / moto-e-capacetes | Certificação Inmetro no semáforo; produto do seed (doc 05 §10.3) |
| 40 | review | Aspirador automotivo Black+Decker AV1200: dá conta das migalhas da cadeirinha? | Black+Decker AV1200 12 V | carro-e-moto / limpeza-e-estetica | Produto do seed (doc 05 §10.3); título em pergunta de cenário |
| 41 | comparativo | Roteador TP-Link Archer AX23, Archer C6 ou Xiaomi AX3000: Wi-Fi para home office e crianças no streaming | TP-Link Archer AX23; TP-Link Archer C6; Xiaomi Router AX3000 | tecnologia / casa-inteligente | Ponte do artigo #128 (bloquear sites no roteador); produto do seed (doc 05 §10.4) |
| 42 | comparativo | Echo Dot 5ª geração, Echo Pop ou Echo Show 5: qual Alexa para a casa com crianças? | Amazon Echo Dot 5ª geração; Echo Pop; Echo Show 5 (3ª geração) | tecnologia / casa-inteligente | Produto do seed (doc 05 §10.4); timer do churrasco e lembrete de remédio |
| 43 | comparativo | Kindle Paperwhite 16 GB ou Kindle 11ª geração: para o pai que lê depois que todos dormem | Kindle Paperwhite 16 GB (12ª geração); Kindle 11ª geração 16 GB | tecnologia / leitores-digitais (**adicionar** `{ slug: "leitores-digitais", name: "Leitores digitais", category: "tecnologia" }` em `src/lib/pai-indica/taxonomia.ts` antes de publicar) | Produto do seed (`kindle-paperwhite-16gb-12a-geracao`); taxonomia não tinha subcategoria de leitura |
| 44 | lista | 4 carregadores portáteis para viagem, consulta longa e apagão | Anker PowerCore 10000; Baseus Bipow 20000 mAh; Xiaomi Mi Power Bank 3 10000 mAh; Samsung Battery Pack 25 W 10000 mAh (EB-P3300) | tecnologia / energia-e-carregadores | Produto do seed (doc 05 §10.4); viagem de carro com filhos (#104) |
| 45 | review | Câmera Wi-Fi Intelbras Mibo iM3: ver o portão e o quintal pelo celular | Intelbras Mibo iM3 | tecnologia / casa-inteligente | Produto do seed (doc 05 §10.9); segurança da casa (#95) |
| 46 | comparativo | Samsung Galaxy A16, Motorola Moto G15 ou Xiaomi Redmi 14C: o primeiro celular do filho (trocar pela geração vigente ao confirmar com `amz.py`) | Samsung Galaxy A16; Motorola Moto G15; Xiaomi Redmi 14C | tecnologia / celulares-e-acessorios | Ponte do artigo #126; controle parental já configurado (#125) |
| 47 | lista | Notebook para o home office do pai: 3 modelos que aguentam o dia inteiro | Lenovo IdeaPad 1i; Acer Aspire 5; Samsung Galaxy Book4 | tecnologia / notebooks-e-perifericos | Keyword "notebook para trabalhar em casa" (cluster 14); ponte com #31 |
| 48 | comparativo | Bicicleta infantil aro 16 Nathor, Caloi ou Verden: a primeira sem rodinhas | Nathor aro 16; Caloi Hot Wheels aro 16; Verden Jack aro 16 | esporte-e-outdoor / ciclismo | Ponte do artigo #117; Dia das Crianças (seção 6) |
| 49 | lista | 6 itens para a primeira pescaria com o filho (sem gastar como profissional) | Marine Sports vara telescópica; Marine Sports molinete Brisa 3000; Marine Sports caixa de pesca; Marine Sports kit anzóis; boia luminosa; balde dobrável | esporte-e-outdoor / pesca | Ponte do artigo #119; férias (seção 6) |
| 50 | comparativo | Lanterna de cabeça Ledlenser MH3, Petzl Tikkina ou Nautika Spark: mãos livres no acampamento e no conserto | Ledlenser MH3; Petzl Tikkina; Nautika Spark | esporte-e-outdoor / camping-e-trilha | Produto do seed (doc 05 §10.5); ponte com #118 e #90 |
| 51 | lista | 5 itens para treinar em casa sem academia (e sem ocupar a sala) | Vollo kit de halteres 20 kg; Vollo elástico de resistência (kit); Vollo corda de pular; Vollo colchonete; Vollo barra fixa de porta | esporte-e-outdoor / musculacao-em-casa | Ponte do seed #62 (treino de 20 minutos) e do Dia do Homem (seção 6) |
| 52 | review | Caixa térmica Coleman 28 QT: a do churrasco, da praia e da pescaria | Coleman 28 QT (26 L) | esporte-e-outdoor / garrafas-e-coolers | Produto do seed (doc 05 §10.5); título de cenário |
| 53 | comparativo | Canguru Ergobaby Omni Breeze, Infantino Flip 4 em 1 ou Kababy: o pai com o bebê no colo e as mãos livres | Ergobaby Omni Breeze; Infantino Flip 4 em 1; Kababy canguru ergonômico | bebe-e-crianca / carrinhos-e-cangurus | Produto do seed (doc 05 §10.6); antes de publicar, conferir se o Vocação de Mãe já avaliou (doc 00 §9.1 item 5): se sim, linkar em vez de duplicar |
| 54 | comparativo | Termômetro infravermelho G-Tech FR1DZ1, Multilaser HC260 ou Omron MC-720: febre às 3 da manhã sem acordar a criança | G-Tech FR1DZ1; Multilaser HC260; Omron MC-720 | bebe-e-crianca / seguranca-e-monitoramento | Produto do seed (doc 05 §10.6); ponte com #68 (primeiros socorros); mesma regra de espelho com o VDM |
| 55 | comparativo | Escova elétrica Oral-B Vitality 100 ou Philips Sonicare 1100: qual vale para o pai que escova correndo? | Oral-B Vitality 100; Philips Sonicare 1100 | saude-do-homem / higiene-bucal | Dia do Homem (15/07); check-up (#59) |
| 56 | lista | O que ter na caixa de primeiros socorros da casa: 6 itens com produto certo | G-Tech termômetro digital clínico; Cremer kit de curativos; Johnson & Johnson Band-Aid sortido; soro fisiológico 0,9% (Arboreto ou equivalente); Descarpack luvas de procedimento; tesoura de ponta redonda Mundial | saude-do-homem / primeiros-socorros | Ponte do artigo #68; "Sinal de alerta" com SAMU 192 |
| 57 | comparativo | Máquina de cortar cabelo Wahl Super Taper, Wahl Color Pro ou Philips HC3505: cortar o cabelo dos filhos em casa | Wahl Clipper Super Taper; Wahl Color Pro; Philips Hairclipper HC3505 | estilo-e-barba / cabelo-e-maquinas | Produto do seed (doc 05 §10.8); economia doméstica com crianças |
| 58 | comparativo [1p3o] | Relógio de pai que aguenta tudo: Casio MRW-200H, Casio AE-1200WH ou Casio G-Shock DW-5600E? | Casio MRW-200H; Casio AE-1200WH; Casio G-Shock DW-5600E-1V | estilo-e-barba / relogios-e-carteiras | Produto do seed (doc 05 §10.8); presente de Dia dos Pais (seção 6) |
| 59 | lista | 5 livros católicos para o homem que quer ser pai de verdade | Seja Homem! (Pe. Larry Richards, Ecclesiae); Consagração a São José (Pe. Donald Calloway); Pais Fortes, Filhas Felizes (Meg Meeker); Bíblia Sagrada Ave-Maria (edição de bolso); Hábitos Atômicos (James Clear) | livros-e-formacao / fe-e-virtudes | Trilha de consagração (#50) e Dia de São José; 3 dos 5 já estão no seed da loja (doc 05 §10.7) |
| 60 | comparativo | Aparador de grama Tramontina AP1000T, Black+Decker GL1000 ou Vonder AG 1000: o quintal em 20 minutos | Tramontina AP1000T 1000 W; Black+Decker GL1000; Vonder AG 1000 | casa-e-jardim / jardim-e-quintal | Produto do seed (doc 05 §10.9); sábado de quintal (#114) |

### 3.1 Rodadas (5 por sessão, molde de título variado, ≥ 1 tema em alta por rodada)

| Rodada | Itens | Observação |
|---|---|---|
| R5 | 36, 57, 41, 28, 30 | Entram nos dias 22 a 26 da seção 5 |
| R6 | 56, 53, 21, 22, 24 | Dias 27 a 30 (#24 fecha o mês) |
| R7 | 23, 25, 29, 35, 42 | Primeira rodada da Fase 8 |
| R8 | 26, 27, 31, 37, 44 | |
| R9 | 32, 33, 34, 38, 45 | |
| R10 | 39, 40, 43, 46, 47 | #43 exige a subcategoria nova na taxonomia |
| R11 | 48, 49, 50, 51, 52 | Alinhar com férias/Dia das Crianças (seção 6) |
| R12 | 54, 55, 58, 59, 60 | Alinhar com Dia do Homem / Dia dos Pais (seção 6) |

Depois de R12, a rotina gera pautas novas de Pai Indica pelo `BRIEF_COMPARATIVO.md`/`BRIEF_REVIEW_UNICA.md` a partir dos
produtos ativos sem review e dos temas em alta (doc 10 §2.3 E3), registrando cada pauta nova no `backlog.json` com
`origin: "rotina"`.

---

## 4. 10 modelos de notícia (`kind='noticia'`)

Regras comuns (doc 10 §4.4, `BRIEF_NOTICIA.md`): `category_id` = `noticias` (seção 0.1); 350 a 600 palavras; fonte
principal datada de ≤ 48 h citada no 1º ou 2º parágrafo com link externo; estrutura fixa = 1 parágrafo "o que aconteceu"
→ 1 parágrafo "o que muda para o pai" → `bulletList` "Na prática" (3 a 5 itens) → 1 parágrafo "o que acompanhar" →
parágrafo "Continue lendo: " com ≥ 3 links internos; sem semáforo, sem quiz, `faq` opcional (2); nunca "R$" no texto
(percentuais e ordens de grandeza); nunca recomendação de investimento; capa de objeto/cédula genérica/gráfico
(Wikimedia/Pexels), nunca rosto de pessoa pública sem licença. Tag `fase-todas`. Gerador: `news_gen.py`.

| # | Modelo | Gatilho / cadência | Fonte(s) oficial(is) | Padrão de slug | Links internos obrigatórios |
|---|---|---|---|---|---|
| N1 | Mercado do pai da semana | Toda segunda-feira (rotina); tag `serie:mercado-do-pai` | BCB PTAX e SGS (Selic), B3 (Ibovespa), CoinGecko (BTC) via `market_cache` | `mercado-do-pai-semana-AAAA-SS` (SS = semana ISO) | `/ferramentas/mercado-financeiro`, `/ferramentas/conversor-de-moedas`, `/post/dolar-subiu-o-que-muda-no-bolso-da-familia` |
| N2 | Copom decidiu a Selic | 8 reuniões por ano, na quarta-feira da decisão (calendário do BCB) | Comunicado do Copom (bcb.gov.br) | `copom-selic-AAAA-MM-o-que-muda-para-a-familia` | `/post/tesouro-direto-para-iniciantes`, `/post/reserva-de-emergencia-quanto-guardar`, `/ferramentas/juros-compostos` |
| N3 | IPCA do mês e o preço da comida | Mensal, no dia da divulgação do IBGE (por volta do dia 10) | IBGE (ipca) + Cepea/Esalq para carne quando houver | `ipca-AAAA-MM-o-que-subiu-na-mesa-do-pai` | `/post/orcamento-familiar-guia-do-pai`, `/post/quanto-de-carne-por-pessoa-no-churrasco`, `/ferramentas/calculadora-de-churrasco` |
| N4 | Salário mínimo, teto do INSS e salário-família do ano | Janeiro (portaria interministerial MPS/MF); republicar quando houver reajuste | Portaria no DOU (in.gov.br), gov.br/inss | `salario-minimo-e-salario-familia-AAAA-o-que-muda` | `/post/salario-familia-quem-tem-direito`, `/post/orcamento-familiar-guia-do-pai`, `/ferramentas/custo-do-filho` |
| N5 | Licença-paternidade: marco da Lei 15.371/2026 | 01/01/2027 (10 dias), 01/01/2028 (15), 01/01/2029 (20) e qualquer alteração legislativa | Senado, Câmara, Planalto (texto da lei, confirmar URL), ConJur como análise | `licenca-paternidade-AAAA-passa-a-N-dias` | `/post/licenca-paternidade-guia-completo`, `/post/lei-15371-2026-licenca-paternidade-o-que-muda`, `/ferramentas/licenca-paternidade` |
| N6 | Imposto de Renda: prazo, dependentes e pensão | Abertura do prazo (março) e última semana (maio) | Receita Federal (gov.br/receitafederal) | `imposto-de-renda-AAAA-dependentes-e-pensao-o-que-o-pai-declara` | `/post/pensao-alimenticia-quanto-e`, `/post/orcamento-familiar-guia-do-pai`, `/post/previdencia-do-filho-investir-desde-o-nascimento` |
| N7 | Recall ou alerta de produto infantil/doméstico | Quando o Inmetro, a Anvisa ou a Senacon publicarem alerta de cadeirinha, brinquedo, ferramenta, eletroportátil | gov.br/inmetro, gov.br/anvisa, gov.br/mj (Senacon) | `recall-<produto>-AAAA-MM-o-que-fazer` | `/post/cadeirinha-de-bebe-para-carro-como-escolher` ou `/post/seguranca-da-casa-com-criancas`, `/pai-indica/<review relacionado>`, `/loja/<produto>` (se houver) |
| N8 | Lançamento de produto do universo do pai | Quando um fabricante lançar no Brasil ferramenta, celular de entrada, carro de família, churrasqueira (só se vendido no BR) | Site/press release do fabricante; nunca rumor | `<marca>-<modelo>-chega-ao-brasil-o-que-o-pai-precisa-saber` | 2 artigos do cluster do produto + `/pai-indica/<comparativo da categoria>` |
| N9 | Datas e pesquisas de consumo (Dia dos Pais, volta às aulas, Black Friday) | 30 dias antes da data, com pesquisa datada (CNC, Fecomércio, Procon, Serasa) | Fonte da pesquisa + gov.br/procon quando houver | `<data>-AAAA-pesquisa-<fonte>-o-que-muda-para-o-pai` | `/loja/presentes` (Dia dos Pais/Natal), `/post/mesada-quanto-dar-e-como-ensinar` (volta às aulas), `/pai-indica/<lista de ferramentas>` (Black Friday) |
| N10 | Benefícios e campanhas do fim do ano (13º, FGTS, Novembro Azul) | 13º: até 30/11 e 20/12; FGTS/benefícios quando houver calendário; Novembro Azul: 1ª semana de novembro | Ministério do Trabalho, Caixa, Ministério da Saúde/SBU | `decimo-terceiro-AAAA-como-usar-sem-perder` · `novembro-azul-AAAA-exames-do-homem` | `/post/reserva-de-emergencia-quanto-guardar`, `/post/como-sair-das-dividas-plano-de-90-dias`, `/post/exame-de-prostata-com-que-idade`, `/post/check-up-do-homem-guia` |

### 4.1 Esqueleto do JSON do `news_gen.py` para o modelo N1 (copiar e preencher)

```json
{
  "modelo": "N1",
  "slug": "mercado-do-pai-semana-2027-03",
  "title": "Mercado do pai: dólar, Selic e bitcoin na semana de 18 de janeiro",
  "excerpt": "O que mexeu no câmbio, nos juros e no bitcoin nesta semana e o que isso muda na conta de quem sustenta uma casa.",
  "seo_title": "Mercado do pai: dólar, Selic e bitcoin nesta semana",
  "seo_description": "Resumo semanal do câmbio, da Selic e do bitcoin com leitura prática para o orçamento da família. Informação educativa, sem recomendação.",
  "cover": "https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg",
  "cover_alt": "Cédulas e moedas sobre uma mesa de madeira",
  "fonte": { "url": "https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes", "veiculo": "Banco Central do Brasil (PTAX)", "data": "2027-01-18" },
  "paragrafos": ["O que aconteceu…", "O que muda para o pai…", "O que acompanhar…"],
  "na_pratica": ["…", "…", "…"],
  "continue_lendo": ["/ferramentas/mercado-financeiro", "/ferramentas/conversor-de-moedas", "/post/dolar-subiu-o-que-muda-no-bolso-da-familia"],
  "tags": ["fase-todas", "serie:mercado-do-pai", "verbo:investir"]
}
```

---

## 5. Calendário editorial dos primeiros 30 dias

"Dia 1" é o primeiro dia com o Blog no ar em produção (Fase 1, Etapa 1.20 / doc 03 §9). Os dias são dias de
publicação, não dias corridos: se uma sessão não acontecer, o dia seguinte continua de onde parou (o `backlog.mjs next`
devolve a mesma fila). Coerência com as fases: dias 1–10 = Fase 1 (seed), dias 8–21 = Fases 2 e 3 em paralelo, dias
13–26 = Fase 4, dias 26–30 = início da Fase 5. Todos os slugs de artigo são da seção 2 (número entre parênteses);
"R1…R4" são as rodadas do doc 04 §10; "#NN" em Pai Indica são os itens da seção 3; produtos citam as tabelas do doc 05 §10.

| Dia | Fase/sessão | Artigos (slugs) | Pai Indica | Produtos (Loja do Pai) | Ferramenta ou feature |
|---|---|---|---|---|---|
| 1 | F1 · 1.20 | vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem (2) | — | — | Home, `/blog`, `/post/$slug`, institucionais, RSS, sitemap no ar |
| 2 | F1 | como-segurar-um-recem-nascido-com-seguranca (5) | — | — | `/categoria/$slug` com as 14 categorias + filhas; `/busca` |
| 3 | F1 | rotina-do-pai-nos-primeiros-30-dias-do-bebe (6) | — | — | `/admin` editor Tiptap com callout/table/taskList |
| 4 | F1 | como-dar-limites-sem-gritar-autoridade-com-calma (10) · guia-do-pai-de-primeira-viagem (1) | — | — | `scripts/validate-content.mjs` (regras do Blog); `backlog.json` + `backlog.mjs` criados (seção 9) |
| 5 | F1 | orcamento-familiar-para-quem-vai-ser-pai (37) · licenca-paternidade-guia-completo (132) | — | — | `ContentNotice` jurídico/médico/financeiro; `ParaAEsposa` (doc 00 §9.1) |
| 6 | F1 | exames-que-todo-homem-deve-fazer-a-partir-dos-30-anos (60) · o-que-o-pai-faz-no-parto (3) | — | — | Newsletter: formulário + double opt-in (doc 11 §5.2 passos 1–4) |
| 7 | F1 | cortes-de-carne-para-churrasco-guia-do-pai-iniciante (71) · ponto-da-carne-tempo-de-cada-lado (78) | — | — | Tags `fase-*`, `verbo:*`, `serie:*` no editor; hub `/blog/por-idade` |
| 8 | F1 → F3 · 3.1–3.3 | treino-de-20-minutos-em-casa-para-pais-sem-tempo (62) · check-up-do-homem-guia (59) | — | 5 do seed `supabase/seed/0003_loja_seed.sql` (faca-churrasco-tramontina-polywood-8, parafusadeira-furadeira-bosch-gsr-120-li, kindle-paperwhite-16gb-12a-geracao, cadeira-auto-chicco-unico-plus-0-36kg, o-homem-mais-rico-da-babilonia-clason) | `/loja` no ar com as 10 categorias (doc 05 §3) |
| 9 | F1 · 1.22 + F3 | como-ser-um-marido-presente-depois-que-o-bebe-chega (16) · como-ser-um-bom-marido (15) | — | 6 de Churrasco e Cozinha (doc 05 §10.1) | PR "Fase 1 — Fundação"; `/loja/categoria/$slug` |
| 10 | F3 · 3.4–3.7 | kit-basico-de-ferramentas-para-a-casa (86) · caixa-de-ferramentas-basica-do-pai (85) | — | 6 de Ferramentas (doc 05 §10.2) | `/loja/$slug` com review longa; `/admin/produtos`; fila de faixa de preço (`product_price_checks`) |
| 11 | F2 · 2.1–2.4 + F3 | guia-dos-cortes-de-carne-para-churrasco (70) · picanha-como-escolher (72) · quanto-custa-criar-um-filho-no-brasil (38) | — | 6 de Carro e Moto (doc 05 §10.3) | Taxonomia de produto (`src/lib/pai-indica/taxonomia.ts`), `ReviewBadge`, `ScoreScaleNote`, nó `fotosModelos` |
| 12 | F2 · 2.5–2.7 | quanto-de-carne-por-pessoa-no-churrasco (79) · como-acender-churrasqueira-sem-alcool (80) | R1 = doc 04 #1, #3, #5, #7, #9 | Produtos da R1 (OneBlade QP2724, 5 livros de finanças, 3 cadeirinhas, 3 pulseiras/relógios) | `/pai-indica` e `/pai-indica/$slug` no ar; JSON-LD Product/Review/ItemList |
| 13 | F4 · 4.1–4.4 + F3 | orcamento-familiar-guia-do-pai (36) · reserva-de-emergencia-quanto-guardar (39) | — | 6 de Tecnologia (doc 05 §10.4) | `/ferramentas` + `/ferramentas/conversor-de-moedas` (AwesomeAPI/PTAX, `market_cache`) |
| 14 | F4 · 4.5 | como-comecar-a-investir-guia-do-pai (41) · tesouro-direto-para-iniciantes (42) | — | 6 de Esporte e Outdoor (doc 05 §10.5) | `/ferramentas/mercado-financeiro` + bloco "Mercado do pai hoje" na home |
| 15 | F2 · 2.11 | sao-jose-modelo-de-pai (49) · oracao-em-familia-como-comecar (51) | R2 = doc 04 #2, #4, #6, #8, #11 | Produtos da R2 (3 facas, 3 lavadoras, 2 dashcams, balança Xiaomi, 7 ferramentas da lista) | Capa composta `cover_cmp.py` com as cores do Vocação de Pai (doc 10 §4.5) |
| 16 | F4 · 4.6 | fraldinha-ou-maminha-diferenca (73) · costela-no-bafo-quanto-tempo (74) | — | 6 de Paternidade Prática (doc 05 §10.6) | `/ferramentas/calculadora-de-churrasco` (Tabela 4 de `res-ecossistema.md` §E.2) |
| 17 | F4 · 4.7 | manutencao-do-carro-guia-do-pai (97) · quando-trocar-oleo-do-carro (98) · demissao-o-que-fazer-com-filhos (30) | — | 6 de Livros e Formação (doc 05 §10.7) | `/ferramentas/cortes-de-carne` (`src/lib/tools/cortes.json`, Tabela 1 de `res-ecossistema.md` §E.1) |
| 18 | F2 · 2.11 | pai-provedor-carreira-e-familia (26) · como-pedir-aumento-de-salario (27) | R3 = doc 04 #10, #12, #13, #14, #15 | Produtos da R3 (Schulz Air Plus, 3 fones, Kärcher K2, 3 garrafas, 6 itens do kit de churrasco) | Bloco "Pai Indica" na home e no fim dos artigos (2.9) |
| 19 | F4 | lei-15371-2026-licenca-paternidade-o-que-muda (133) · licenca-paternidade-20-dias-empresa-cidada (134) | — | 6 de Estilo e Barba (doc 05 §10.8) | `/ferramentas/licenca-paternidade` (regras em JSON: 5/10/15/20 dias, Empresa Cidadã, PcD) |
| 20 | F4 | guarda-compartilhada-como-funciona (139) · pensao-alimenticia-quanto-e (140) · brincadeiras-de-pai-e-filho (116) | — | 6 de Casa e Jardim (doc 05 §10.9) | `/ferramentas/pensao-alimenticia` (educativa) + `/ferramentas/custo-do-filho` |
| 21 | F2 · 2.11–2.12 + F3 · 3.10–3.12 | o-que-fazer-com-os-filhos-no-fim-de-semana (114) · fim-de-semana-de-940-por-que-cada-sabado-conta (115) | R4 = doc 04 #16, #17, #18, #19, #20 | Produtos da R4 + 6 de Presentes para o Pai (doc 05 §10.10) → **60 produtos** | PRs "Fase 2 — Pai Indica" e "Fase 3 — Loja do Pai"; `/loja/presentes` e `/loja/ofertas` (doc 11 §12) |
| 22 | F4 · 4.8 | como-calibrar-pneu-e-quando-trocar (99) · cadeirinha-de-bebe-para-carro-como-escolher (101) | #36 (assentos de elevação) | Burigotto Protege, Chicco Quasar Plus, Multikids Baby Safe Booster | `/ferramentas/orcamento-familiar`, `/ferramentas/reserva-de-emergencia`, `/ferramentas/juros-compostos` |
| 23 | F4 | guia-de-estilo-do-pai (106) · como-cuidar-da-barba (107) · consagracao-a-sao-jose-33-dias (50) | #57 (máquinas de cortar cabelo) | Wahl Super Taper, Wahl Color Pro, Philips HC3505 | `/ferramentas/kit-de-ferramentas` (links para a Loja) + `/ferramentas/conversor-de-unidades` |
| 24 | F4 · 4.10 | tecnologia-para-pais-guia (124) · como-configurar-controle-parental-no-celular-do-filho (125) | #41 (roteadores) | TP-Link Archer AX23, Archer C6, Xiaomi AX3000 | PWA: `manifest.webmanifest`, service worker, calculadoras offline |
| 25 | F4 | celular-para-crianca-qual-idade (126) · furadeira-ou-parafusadeira-qual-comprar (87) | #28 (furadeiras de impacto) | Bosch GSB 13 RE, Makita HP1630, DeWalt DWD024 | `/ferramentas/nomes-de-filhos`, `/ferramentas/calendario-de-vacinacao`, `/ferramentas/marcos-do-desenvolvimento` |
| 26 | F4 · 4.12 → F5 · 5.1 | como-furar-parede-sem-rachar (88) · como-trocar-resistencia-do-chuveiro (90) | #30 (níveis a laser) | Bosch GLL 2-12 G, DeWalt DW088K, Vonder NLV 002 | PR "Fase 4 — Caixa de Ferramentas"; Supabase Auth (e-mail/senha + Google) configurado |
| 27 | F5 · 5.2–5.3 | como-desentupir-pia (92) · primeiros-socorros-em-casa-engasgo-queda-corte (68) · exame-de-prostata-com-que-idade (61) | #56 (caixa de primeiros socorros) | 6 itens da lista #56 | `/entrar`, `/cadastro`, trigger `handle_new_user` |
| 28 | F5 · 5.3–5.5 | puerperio-visto-pelo-pai (17) · sono-do-pai-com-recem-nascido (63) | #53 (cangurus) | Ergobaby Omni Breeze, Infantino Flip 4 em 1, Kababy | Onboarding em 3 passos; `/area-do-pai` com widgets; tags `fase-*` alimentam o painel |
| 29 | F5 · 5.6–5.7 | lideranca-servidora-em-casa (18) · lideranca-espiritual-do-homem-na-familia (56) · meu-pai-me-ensinou-como-enviar-a-sua-historia (143) | #21 (churrasqueiras portáteis) | Weber Smokey Joe Premium, Tramontina TCP-460, Mor Apolo | `SaveButton` em post/produto/ferramenta; newsletter com segmentos por fase |
| 30 | F5 · 5.8–5.9 | como-registrar-o-filho-prazo-e-documentos (137) · salario-familia-quem-tem-direito (138) · lei-do-acompanhante-pai-no-parto (136) · carta-ao-filho-como-escrever-a-sua (144) | #22 (faca 8", 1 produto 3 orçamentos) | Tramontina Century 8", Victorinox Swiss Classic 8" (Polywood já existe) | Iscas de cadastro (e-book "Guia do churrasco do pai", capítulo grátis — doc 11 §7); `plans` seed; **pedido de inscrição no Amazon Associados** (≥ 20 páginas com afiliado — doc 00 §10.1); `backlog.mjs check` + `PROGRESSO.md` do mês |

Totais ao fim do dia 30: 10 posts seed + 55 artigos `P0` = **65 artigos do Blog**; 20 + 9 = **29 Pai Indica**; **60 + 14 produtos**;
15 ferramentas da lista fechada do doc 06 §0.2 (as 2 restantes, `imc-e-gasto-calorico` e `checklist-da-maternidade`, entram na
Fase 4 sem data de pauta). Isso cumpre o pré-requisito do AdSense (40 a 60 artigos, cada categoria com 5+, doc 00 §10.1) e o
do Amazon Associados (15 a 20 páginas com afiliado).

---

## 6. Calendário sazonal do ano do pai

Regras: (a) URL sem ano, selo "Atualizado em <mês/ano>" e refresh anual via reforma (doc 11 §8.2 item 13);
(b) a pauta sazonal entra na fila com antecedência da coluna "Publicar até" — o `backlog.mjs` lê `season.start` e
`season.end` e sobe a pauta ao topo dentro da janela; (c) o Pai Indica e a Loja preparam as listas comerciais
**30 dias antes** da data e os artigos informativos **14 dias antes**; (d) notícia (modelo N9) 30 dias antes com
pesquisa datada; (e) nada de "promoção relâmpago", "corra" ou preço (doc 00 §4.3 itens 7 e 16).
Datas móveis calculadas para 2026/2027: Advento 29/11/2026; Quarta-feira de Cinzas 10/02/2027; Páscoa 28/03/2027;
Dia das Mães 09/05/2027; Corpus Christi 27/05/2027; Dia dos Pais 08/08/2027 (2º domingo de agosto); Black Friday
27/11/2026 e 26/11/2027. Recalcular todo ano no `backlog.mjs` (função `seasonDates(ano)`, seção 9.3).

| Data | Ocasião | O que publicar (slugs da seção 2 / itens da seção 3 / rotas) | Publicar até | Ação |
|---|---|---|---|---|
| 01–30/11 | Novembro Azul (saúde do homem) | #61 exame-de-prostata-com-que-idade (refresh), #59 check-up-do-homem-guia, #65; notícia N10 "novembro-azul"; Pai Indica #55 | 01/11 (notícia), 07/11 (artigos) | Banner na home com `ContentNotice` médico; série `serie:check-up-do-mes` |
| 19/11 | Dia Internacional do Homem | #56 lideranca-espiritual-do-homem-na-familia, #18 lideranca-servidora-em-casa; Jogada do Dia especial | 12/11 | E-mail da newsletter com os 2 artigos |
| 27/11/2026 · 26/11/2027 | Black Friday | Pai Indica listas #29 (caixa em 3 níveis), #28, #23; `/loja/ofertas` (faixa, nunca preço); notícia N9 "black friday ferramentas vale a pena" (cluster 15) | 13/11 (listas), 20/11 (notícia) | Rotina de faixa de preço prioriza os produtos citados (15/dia); sem "desconto de X%" |
| 29/11/2026 | 1º domingo do Advento | #51 oracao-em-familia-como-comecar, #52 como-rezar-o-terco-em-familia; desafio "7 dias de oração em família" (nome do doc 13 item 7.9; slug a confirmar no doc 09) | 15/11 | Abrir turma do desafio (Fase 7) |
| 30/11 e 20/12 | 13º salário (1ª e 2ª parcelas) | Notícia N10 "decimo-terceiro"; #39 reserva-de-emergencia-quanto-guardar, #40 como-sair-das-dividas-plano-de-90-dias | 25/11 | Bloco "Mercado do pai" com leitura do 13º |
| 08/12 | Dia Nacional da Família (Imaculada Conceição) | #15 como-ser-um-bom-marido (refresh), #25 briga-entre-irmaos-o-que-o-pai-faz | 01/12 | Link cruzado com o Vocação de Mãe (doc 00 §9.1 item 2) |
| 25/12 | Natal | `/loja/presentes` (seção "Natal para o pai"), Pai Indica #26 (café), #58 (relógios), #59 (livros); #84 cozinhar-com-os-filhos-receitas-por-idade; #79 churrasco de fim de ano | 25/11 (loja), 11/12 (artigos) | Lista de presentes com faixa; e-mail "Presente para o seu marido" vai pela newsletter do VDM (doc 00 §9.1 item 9) |
| 15/12–31/01 | Férias de verão | #114 o-que-fazer-com-os-filhos-no-fim-de-semana (refresh "férias"), #118 acampar-com-criancas-o-que-levar, #119 pescaria-com-filho-iniciante, #104 viagem-de-carro-com-filhos; Pai Indica #49, #50, #52 | 10/12 | Série "Fim de semana de 940" vira "Dia de férias" nas 6 semanas |
| 01/01/2027 | Licença-paternidade passa a 10 dias (Lei 15.371/2026) | Notícia N5; reforma de #132 e #133 com o novo prazo; `/ferramentas/licenca-paternidade` atualizada | 28/12/2026 | Repetir em 01/01/2028 (15 dias) e 01/01/2029 (20 dias) |
| 2ª semana de janeiro | Salário mínimo, INSS e salário-família do ano | Notícia N4; reforma de #138 com os valores novos (Portaria interministerial) | 2 dias após a portaria | `backlog.mjs` marca #138 como `reforma` todo janeiro |
| 04/01/2027 (1ª segunda de janeiro) | Início do desafio "30 dias de pai presente" | Chamada no Blog (post curto da série) + #115 fim-de-semana-de-940-por-que-cada-sabado-conta | 21/12/2026 | Turma (coorte) aberta na Formação; badge "Pai presente" (PLANO-MESTRE §8 item 7) |
| 25/01–10/02 | Volta às aulas (1º semestre) | Espelho `mochila-escolar-e-material-o-pai-na-volta-as-aulas` (seção 8.2), #47 mesada-quanto-dar-e-como-ensinar, #126 celular-para-crianca-qual-idade; notícia N9 (Procon: custo do material) | 15/01 | Pai Indica #46 (primeiro celular) alinhado |
| 09/02/2027 | Carnaval (feriado prolongado) | #114 (bloco "feriado prolongado"), #121 trilha-com-criancas | 02/02 | Jogada do Dia com 4 ideias sem festa |
| 10/02/2027 | Quarta-feira de Cinzas (Quaresma) | #69 como-largar-a-pornografia-plano-de-30-dias, #51; desafio longo de 90 dias ("Êxodo do Pai 90", ideia 12 de `res-ecossistema.md`, se existir no doc 09) | 27/01 | Abrir turma; grupo de 4-6 com âncora (Fase 7) |
| 15/02/2027 | Início da turma da consagração (33 dias → 19/03) | #50 consagracao-a-sao-jose-33-dias (refresh com datas), trilha "Consagração a São José" (doc 13 item 7.9) | 01/02 | E-mail de convite aos membros com filhos cadastrados |
| 15/03–31/05 | Imposto de Renda | Notícia N6 na abertura e na última semana; #140 pensao-alimenticia-quanto-e (dedução), #45 previdencia-do-filho | 01/03 | `ContentNotice` financeiro; sem conselho tributário prescritivo |
| 19/03 | Dia de São José (padroeiro dos pais) | #54 dia-de-sao-jose-19-de-marco, #49 sao-jose-modelo-de-pai (refresh), #148 pais-que-inspiram-pais-de-santos; Pai Indica #59 (livros) | 05/03 | Encerramento da consagração; e-mail especial; badge "Filho de São José" (doc 13 item 7.8) |
| 25–28/03/2027 | Tríduo Pascal e Páscoa | #51, #53 bencao-do-pai-sobre-os-filhos; #83 acompanhamentos-de-churrasco (almoço de Páscoa) | 14/03 | Jogada do Dia da Semana Santa |
| 24/04 | Dia do Churrasco | #70 guia-dos-cortes-de-carne-para-churrasco (refresh), #79, #80; `/ferramentas/calculadora-de-churrasco`; Pai Indica #21, #23, #25 | 10/04 | Série `serie:corte-da-semana` especial; e-book "Guia do churrasco do pai" (doc 11 §7) em destaque |
| 01/05 | São José Operário · Dia do Trabalhador | #55 sao-jose-operario-1-de-maio, #26 pai-provedor-carreira-e-familia, #27 como-pedir-aumento-de-salario | 17/04 | Campanha "Indique uma vaga" no Pai Indica Pai (Fase 6) |
| 09/05/2027 | Dia das Mães | "Presente para a sua esposa" → link para a loja do Vocação de Mãe (doc 00 §9.1 item 9); #22 linguagens-do-amor-da-esposa, #23 noite-de-encontro-com-a-esposa-ideias | 25/04 | Sem lista própria de produtos maternos (um tema, um dono) |
| 27/05/2027 | Corpus Christi (feriado prolongado) | #114 (bloco "feriado"), #117 como-ensinar-filho-a-andar-de-bicicleta | 20/05 | — |
| 12/06 | Dia dos Namorados | #23, #22, #24 curso-de-noivos-o-que-o-homem-precisa-saber | 29/05 | Tom de casal católico; sem erotismo (doc 00 §4.3 item 4) |
| 01–31/07 | Férias de julho | #118, #121, #119, #104; Pai Indica #48 (bicicleta), #49 (pescaria), #50 (lanterna) | 20/06 | "Dia de férias" na série 940 |
| 15/07 | Dia do Homem | #59 check-up-do-homem-guia (refresh), #64 como-perder-barriga-depois-dos-40, #62 treino-de-20-minutos; Pai Indica #51, #55 | 01/07 | `serie:check-up-do-mes` |
| 26/07 | Dia dos Avós | #14 filho-adulto-como-ser-pai-sem-invadir, #150 o-avo-que-ensinou-o-neto-a-rezar | 12/07 | Chamada "Meu pai me ensinou" com tema "meu avô" |
| 08/08/2027 | **Dia dos Pais** (2º domingo de agosto) + Semana Nacional da Família (CNBB) | `/loja/presentes` atualizado (cluster 15: "presente de dia dos pais", "presente para pai que gosta de churrasco", "presente para pai de primeira viagem"); Pai Indica doc 04 #15 (kit de churrasco), #26, #58, #59; #143 e-mail especial "Meu pai me ensinou"; #144 carta-ao-filho; notícia N9 (CNC/Fecomércio) | 24/06 (loja), 08/07 (listas), 25/07 (artigos e notícia) | Maior data comercial do site: rotina de faixa de preço e fotos prioriza os produtos das listas desde 15/06; e-mail da semana com os 3 melhores relatos |
| 27/07–10/08 | Volta às aulas (2º semestre) | #125 como-configurar-controle-parental-no-celular-do-filho, #127 tempo-de-tela-por-idade | 20/07 | — |
| 01–30/09 | Setembro Amarelo | #67 burnout-paterno-sinais, #58 luto-de-pai-como-seguir | 25/08 | `ContentNotice` com CVV 188 (doc 00 §4.4) |
| 12/10 | Dia das Crianças | Lista "presente para filho de 5 anos" em `/loja/presentes` (cluster 15), #122 jogos-de-tabuleiro-para-familia, #116 brincadeiras-de-pai-e-filho; Pai Indica #48 | 12/09 (loja), 28/09 (artigos) | Produtos com certificação Inmetro no semáforo |
| 01–30/11 e 19/11 | Novembro Azul e Dia do Homem (2º ano) | Reforma dos mesmos itens da 1ª linha com "Atualizado em" | 01/11 | Ciclo recomeça |

---

## 7. Regras de links internos entre as pautas

Complementam as 14 regras automáticas do doc 11 §8.2 (que valem para o código `src/lib/seo/internal-links.ts` e para
`scripts/rotina/link_audit.py`). As regras daqui valem para **quem escreve** (sessão ou rotina) e para o validador.

### 7.1 Mapa pilar → satélites (clusters do doc 11 §8.1)

| Cluster | Hub (`formato = guia`) | Satélites (números da seção 2) | Ponte comercial padrão (Pai Indica) | Ponte de ferramenta padrão |
|---|---|---|---|---|
| C1 Pai de primeira viagem | #1 guia-do-pai-de-primeira-viagem | 2, 3, 4, 5, 6, 7, 8, 17, 63, 67, 136, 137 | doc 04 #7 (cadeirinhas), #53 (cangurus) | `/ferramentas/licenca-paternidade`, `/ferramentas/custo-do-filho`, `/ferramentas/nomes-de-filhos` |
| C2 Licença-paternidade e direitos | #132 licenca-paternidade-guia-completo | 133, 134, 135, 136, 137, 138, 141, 142 (+ hub secundário #139 guarda-compartilhada-como-funciona com 140, 141) | — (sem produto; linkar `/pai-indica-pai/profissionais` quando a Fase 6 existir) | `/ferramentas/licenca-paternidade`, `/ferramentas/pensao-alimenticia` |
| C3 Churrasco e cortes | #70 guia-dos-cortes-de-carne-para-churrasco | 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84 | doc 04 #2 (facas), #15 (kit); #21, #22, #23, #24, #25 | `/ferramentas/cortes-de-carne`, `/ferramentas/calculadora-de-churrasco`, `/ferramentas/conversor-de-unidades` |
| C4 Ferramentas e reparos | #85 caixa-de-ferramentas-basica-do-pai | 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96 | doc 04 #1 (parafusadeiras 12 V), #11 (7 ferramentas); #28, #29, #30, #31, #34 | `/ferramentas/kit-de-ferramentas`, `/ferramentas/conversor-de-unidades` |
| C5 Carro e moto | #97 manutencao-do-carro-guia-do-pai | 98, 99, 100, 101, 102, 103, 104, 105 | doc 04 #6 (câmera veicular), #10 (compressor), #19 (kit de emergência); #35, #36, #37, #38, #39, #40 | `/ferramentas/orcamento-familiar` (custo do carro) |
| C6 Orçamento | #36 orcamento-familiar-guia-do-pai | 37, 38, 39, 40, 46, 47, 48 | doc 04 #5 (livros de finanças) | `/ferramentas/orcamento-familiar`, `/ferramentas/reserva-de-emergencia`, `/ferramentas/custo-do-filho` |
| C7 Investimentos e bitcoin | #41 como-comecar-a-investir-guia-do-pai | 42, 43, 44, 45, 48 | doc 04 #5 | `/ferramentas/juros-compostos`, `/ferramentas/mercado-financeiro`, `/ferramentas/conversor-de-moedas` |
| C8 Saúde do homem | #59 check-up-do-homem-guia | 60, 61, 62, 63, 64, 65, 66, 67, 68, 69 | doc 04 #8 (balança), #17 (medidor de pressão), #9 (pulseiras); #51, #55, #56 | `/ferramentas/imc-e-gasto-calorico` |
| C9 Fé e São José | #49 sao-jose-modelo-de-pai | 50, 51, 52, 53, 54, 55, 56, 57, 58, 148 | #59 (livros católicos) | `/formacao/<trilha de consagração>` (Fase 7) |
| C10 Casamento | #15 como-ser-um-bom-marido | 16, 17, 18, 19, 20, 21, 22, 23, 24, 25 | — (sem produto; "Presente para a sua esposa" aponta para a loja do VDM) | — |
| C11 Provedor e carreira | #26 pai-provedor-carreira-e-familia | 27, 28, 29, 30, 31, 32, 33, 34, 35 | #47 (notebooks) | `/pai-indica-pai/vagas` (Fase 6), `/ferramentas/orcamento-familiar` |
| C12 Esporte e lazer | #114 o-que-fazer-com-os-filhos-no-fim-de-semana | 115, 116, 117, 118, 119, 120, 121, 122, 123 | doc 04 #20 (barracas), #14 (garrafas); #48, #49, #50, #52 | — |
| C13 Estilo | #106 guia-de-estilo-do-pai | 107, 108, 109, 110, 111, 112, 113 | doc 04 #3 (OneBlade), #16 (aparadores); #57, #58 | — |
| C14 Tecnologia | #124 tecnologia-para-pais-guia | 125, 126, 127, 128, 129, 130, 131 | doc 04 #12 (fones); #41, #42, #43, #44, #45, #46, #47 | — |
| (sem hub) Histórias de pai | — | 143 a 150 linkam o hub do tema da história (C1, C9, C10) | — | `/historias` (Fase 7) |

### 7.2 Regras de escrita (numeradas; o validador confere 1, 5, 8, 9 e 10)

1. **Mínimo 10 e máximo 12 links internos** por artigo Padrão A (CLAUDE.md §6 item 4; doc 11 §8.2 item 9), todos para
   slugs **publicados** (`select slug from posts where status='published'` ou `slugs.txt`). Nunca linkar um slug desta
   tabela que ainda não foi publicado, nem no "Continue lendo".
2. **Hub no início**: todo satélite linka o hub do seu cluster no 1º ou 2º parágrafo, com âncora igual à palavra-alvo
   do hub (ex.: "cortes de carne para churrasco"). Se o hub ainda não existe (só acontece nos dias 1–3), linkar o
   satélite mais próximo e registrar em `notes` no `backlog.json` para a reforma do hub incluir o link de volta.
3. **Hub lista os satélites**: o artigo `guia` tem um H2 "Neste artigo" seguido de `bulletList` com um link por satélite
   publicado. A cada 5 satélites novos do cluster, a rotina reforma o hub (staging + `UPDATE` curto, doc 10 §3) para
   incluir os links; a reforma conta como uma das 2 reformas do dia.
4. **Irmãos**: ≥ 3 links para artigos do mesmo cluster, tecidos nas frases (não só no "Continue lendo").
5. **Pontes entre clusters** (≥ 2 por artigo), seguindo a tabela abaixo; a âncora é o título ou a palavra-alvo do destino.
6. **Ponte comercial** (exatamente 1 por artigo informativo, texto fixo "No Pai Indica: {{título}}", doc 11 §8.2 item 4):
   um Pai Indica da coluna da tabela 7.1. Antes de existir Pai Indica publicado, omitir (nunca linkar `/loja/$slug`
   em artigo Padrão A antes da Fase 3; depois dela, no máximo 1 link de afiliado a cada 300 palavras).
7. **Ponte de ferramenta** (1 por artigo quando houver na tabela 7.1), só com a ferramenta já no ar (`src/lib/tools/registry.ts`).
8. **Continue lendo**: 4 a 10 links, texto = título do post, separados por ", " e " e ", terminando em "." (CLAUDE.md §6 item 8);
   contam para o total, mas sozinhos não bastam (≥ 6 links no corpo).
9. **Âncoras**: nunca "clique aqui", "veja mais", "neste link"; nunca a mesma âncora para URLs diferentes no mesmo post;
   nunca linkar o próprio slug.
10. **Formato do nó**: `marks: [{type:"link", attrs:{href:"/post/<slug>", class:null, rel:null, target:null}}]`; rotas
    permitidas: `/post/`, `/pai-indica/`, `/loja/`, `/ferramentas/`, `/formacao/`, `/desafios/`, `/pai-indica-pai/`;
    nunca `/admin`, `/busca`, `/area-do-pai`, `/minha-conta` (noindex).
11. **Fase do filho**: artigo com tag `fase-*` (exceto `fase-todas`) linka o hub `/blog/por-idade` uma vez (doc 00 §3.6).
12. **Espelho com o Vocação de Mãe**: artigos de `paternidade-por-fase` e `casamento-e-familia` com espelho (seção 8.2)
    recebem o callout `ParaAEsposa` antes do "Continue lendo"; se a API do VDM não devolver o espelho, omitir (doc 00 §9.1 item 2).
13. **Órfãos**: auditoria semanal (`link_audit.py`, doc 11 §8.2 item 11) lista posts com < 3 links recebidos; a rotina
    acrescenta o link nos 3 posts mais próximos do mesmo cluster via reforma.

### 7.3 Tabela de pontes entre clusters (≥ 2 por artigo; escolher as da linha do seu cluster)

| Cluster de origem | Pontes recomendadas (cluster destino → exemplos de slug) |
|---|---|
| C1 Primeira viagem | C2 (#132, #136, #137) · C6 (#37, #38) · C8 (#63, #67) · C10 (#16, #17) · C5 (#101) |
| C2 Direitos | C1 (#1, #3, #6) · C6 (#36, #38) · C11 (#30) · C9 (#58) |
| C3 Churrasco | C4 (#85, #88 — acendedor, chapa) · C12 (#114) · C6 (#36 — custo do churrasco) · C8 (#64 — moderação) |
| C4 Ferramentas | C3 (#80, #79) · C5 (#99) · C12 (#116, #96) · C14 (#45 — câmera) |
| C5 Carro | C1 (#101) · C4 (#85) · C12 (#104) · C6 (#36, #39) |
| C6 Orçamento | C7 (#41, #42) · C2 (#138, #140) · C11 (#27, #30) · C1 (#37) |
| C7 Investimentos | C6 (#36, #39) · C2 (#142) · C11 (#32) · notícias N1/N2 |
| C8 Saúde | C1 (#6, #63) · C12 (#117, #120) · C9 (#69 ↔ #51) · C3 (#64 ↔ #79) |
| C9 Fé | C10 (#15, #18) · C1 (#53 ↔ #5) · C12 (#115) · C14 (#13 ↔ #69) |
| C10 Casamento | C1 (#17 ↔ #6) · C9 (#56) · C6 (#19 ↔ #36) · C13 (#23 ↔ #108) |
| C11 Provedor | C6 (#36, #39) · C2 (#132, #135) · C14 (#47, #31) · C9 (#55) |
| C12 Lazer | C3 (#79, #83) · C4 (#96) · C5 (#104) · C13 (#112) |
| C13 Estilo | C8 (#110 ↔ #59) · C10 (#108 ↔ #23) · C12 (#112) |
| C14 Tecnologia | C1 (#126 ↔ #11) · C8 (#128 ↔ #69) · C11 (#47 ↔ #31) · C4 (#45 ↔ #95) |

### 7.4 Consultas de auditoria (SQL Editor ou `mcp__Supabase__execute_sql`)

```sql
-- 1) links para slugs inexistentes (deve retornar 0 linhas)
with links as (
  select p.slug as origem, regexp_replace(l #>> '{attrs,href}', '^/post/', '') as destino
  from posts p, jsonb_path_query(p.body, 'strict $.**.marks[*] ? (@.type == "link")') l
  where p.status = 'published' and (l #>> '{attrs,href}') like '/post/%')
select origem, destino from links
where destino not in (select slug from posts where status = 'published');

-- 2) órfãos: publicados com menos de 3 links recebidos
with recebidos as (
  select regexp_replace(l #>> '{attrs,href}', '^/post/', '') as destino, count(distinct p.slug) as n
  from posts p, jsonb_path_query(p.body, 'strict $.**.marks[*] ? (@.type == "link")') l
  where p.status = 'published' and (l #>> '{attrs,href}') like '/post/%'
  group by 1)
select p.slug, coalesce(r.n, 0) as links_recebidos
from posts p left join recebidos r on r.destino = p.slug
where p.status = 'published' and coalesce(r.n, 0) < 3
order by links_recebidos, p.publish_at;

-- 3) hubs sem o bloco "Neste artigo"
select p.slug from posts p
where p.slug in ('guia-do-pai-de-primeira-viagem','licenca-paternidade-guia-completo','guia-dos-cortes-de-carne-para-churrasco',
  'caixa-de-ferramentas-basica-do-pai','manutencao-do-carro-guia-do-pai','orcamento-familiar-guia-do-pai',
  'como-comecar-a-investir-guia-do-pai','check-up-do-homem-guia','sao-jose-modelo-de-pai','como-ser-um-bom-marido',
  'pai-provedor-carreira-e-familia','o-que-fazer-com-os-filhos-no-fim-de-semana','guia-de-estilo-do-pai','tecnologia-para-pais-guia')
  and p.status = 'published'
  and not exists (select 1 from jsonb_path_query(p.body, 'strict $.content[*] ? (@.type == "heading")') h
                  where (h #>> '{content,0,text}') ilike 'Neste artigo%');
```

---

## 8. "Não escrever aqui" e os 60 espelhos com o Vocação de Mãe

### 8.1 Não escrever aqui (um tema, um dono — doc 00 §9.2)

A rotina (E2/E3) e toda sessão consultam esta tabela antes de aceitar uma pauta. Se o tema é de outro site do grupo,
o Vocação de Pai **linka** e não escreve.

| Tema | Dono no grupo | O que o Vocação de Pai faz |
|---|---|---|
| Gestação, parto, amamentação, puerpério, sono do bebê, introdução alimentar, puericultura **do ponto de vista da mãe** | Vocação de Mãe (vocacaodemae.com.br) | Escreve só o ângulo do pai (seção 8.2: espelhos) e aponta para o artigo dela via `ParaAEsposa` |
| Produtos maternos (bomba de leite, sutiã de amamentação, pós-parto, enxoval da mãe) e "Review de Mãe" de produto de bebê já avaliado lá | Vocação de Mãe | Nunca avalia; em cadeirinha, carrinho, babá eletrônica e canguru, quem publica primeiro fica com o review (doc 00 §9.1 item 5) |
| Reviews e notícias de ferramentas de IA (ChatGPT, Claude, etc.), "AI Indica" de eletrônicos sem ângulo de família (TV, monitor gamer, placa de vídeo) | Portal da AI (portaldaai.com.br) | `ia-no-dia-a-dia-do-pai` (#130) linka o Portal como aprofundamento; Pai Indica só avalia tecnologia com uso de pai/família (roteador da casa, celular do filho, Alexa com crianças) |
| Comparativos de produto genérico sem ângulo de pai (ex.: "melhor smart TV 55 polegadas") | Review Produtos (reviewprodutos.com.br) | Linka; o Pai Indica fica com ferramentas, churrasco, automotivo, bebê (ângulo do pai), saúde do homem, estilo, livros |
| Bitcoin em profundidade (halving, mineração, trading, altcoins, análise técnica) | Blog do Bitcoin | #43 e #44 explicam o básico para a família e linkam o Blog do Bitcoin; nunca "sinal de compra" (doc 00 §4.3 item 10) |
| Política partidária, eleições | Ninguém no grupo | Não escreve (doc 00 §4.3 item 11) |
| Apostas, bets, "renda extra garantida" | Ninguém | Só como alerta de vício em `vicios-e-liberdade` |

### 8.2 Os 60 primeiros espelhos com o Vocação de Mãe (doc 00 §9.1 item 3)

Cada tema de fase existe nos dois sites: lá do ponto de vista da mãe, aqui do pai (o que o pai faz, como apoia a
esposa, o que é dele). Regra de nunca duplicar (doc 00 §9.1 item 4): título, ângulo, exemplos e links diferentes; o
validador bloqueia similaridade > 60 % com o VDM. Os 25 primeiros já estão na seção 2; os 35 seguintes entram no
`backlog.json` como `type: "artigo"`, `priority: "P2"`, `mirror: true`, `format: "padrao-a"`, e viram `P1` quando a
rotina detectar o espelho publicado no VDM (busca pelo "termo no VDM" na API pública dele). O slug `sono-do-bebe-aos-2-meses-rotina-e-o-que-esperar`
é o artigo de referência do Padrão A do VDM (`/home/user/vocacaodemae/CLAUDE.md`) e serve de exemplo de espelho.

| # | Tema (ângulo do pai) | slug aqui | Termo de busca no VDM | categoria / subcategoria | fase |
|---|---|---|---|---|---|
| 1 | Primeiro trimestre da gestação | vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem (#2) | primeiro trimestre gestação | paternidade-por-fase / gestacao-e-parto | gestacao |
| 2 | O parto | o-que-o-pai-faz-no-parto (#3) | parto normal o que esperar | paternidade-por-fase / gestacao-e-parto | gestacao |
| 3 | Mala da maternidade | mala-da-maternidade-do-pai (#4) | mala da maternidade | paternidade-por-fase / gestacao-e-parto | gestacao |
| 4 | Segurar o recém-nascido | como-segurar-um-recem-nascido-com-seguranca (#5) | como segurar o bebê | paternidade-por-fase / recem-nascido | recem-nascido |
| 5 | Primeiros 30 dias | rotina-do-pai-nos-primeiros-30-dias-do-bebe (#6) | primeiro mês do bebê | paternidade-por-fase / recem-nascido | recem-nascido |
| 6 | Cólica | colica-do-bebe-o-que-o-pai-pode-fazer (#7) | cólica do bebê | paternidade-por-fase / recem-nascido | recem-nascido |
| 7 | Introdução alimentar | introducao-alimentar-o-papel-do-pai (#8) | introdução alimentar | paternidade-por-fase / recem-nascido | bebe |
| 8 | Birra aos 2 anos | birra-aos-2-anos-como-o-pai-segura-a-onda (#9) | birra 2 anos | paternidade-por-fase / 1-a-3-anos | primeira-infancia |
| 9 | Limites sem gritar | como-dar-limites-sem-gritar-autoridade-com-calma (#10) | como dar limites | paternidade-por-fase / 4-a-7-anos | infancia |
| 10 | Conversar com filho de 8 a 12 | como-conversar-com-filho-de-8-a-12-anos (#11) | como conversar com filho | paternidade-por-fase / 8-a-12-anos | pre-adolescencia |
| 11 | Adolescente fechado | filho-adolescente-nao-fala-comigo (#12) | filho adolescente | paternidade-por-fase / adolescencia | adolescencia |
| 12 | Pornografia e adolescente | como-falar-de-pornografia-com-o-filho-adolescente (#13) | pornografia adolescente | paternidade-por-fase / adolescencia | adolescencia |
| 13 | Casamento depois do bebê | como-ser-um-marido-presente-depois-que-o-bebe-chega (#16) | casamento depois do bebê | casamento-e-familia / vida-a-dois | recem-nascido |
| 14 | Puerpério | puerperio-visto-pelo-pai (#17) | puerpério | casamento-e-familia / vida-a-dois | recem-nascido |
| 15 | Divisão de tarefas | como-dividir-as-tarefas-de-casa (#19) | divisão de tarefas | casamento-e-familia / rotina-da-casa | todas |
| 16 | Briga entre irmãos | briga-entre-irmaos-o-que-o-pai-faz (#25) | briga entre irmãos | casamento-e-familia / familia-grande | infancia |
| 17 | Custo do primeiro ano | orcamento-familiar-para-quem-vai-ser-pai (#37) | quanto custa um bebê | dinheiro-do-pai / orcamento-familiar | gestacao |
| 18 | Sono dos pais com recém-nascido | sono-do-pai-com-recem-nascido (#63) | sono da mãe recém-nascido | corpo-e-saude-do-homem / sono-e-energia | recem-nascido |
| 19 | Depressão pós-parto (dele e dela) | burnout-paterno-sinais (#67) | depressão pós-parto | corpo-e-saude-do-homem / saude-mental-e-estresse | recem-nascido |
| 20 | Primeiros socorros | primeiros-socorros-em-casa-engasgo-queda-corte (#68) | engasgo bebê | corpo-e-saude-do-homem / primeiros-socorros-em-casa | primeira-infancia |
| 21 | Cadeirinha | cadeirinha-de-bebe-para-carro-como-escolher (#101) | cadeirinha de carro | carro-e-moto / seguranca-e-cadeirinha | recem-nascido |
| 22 | Viagem de carro | viagem-de-carro-com-filhos (#104) | viagem com bebê | carro-e-moto / viagem-de-carro-com-filhos | infancia |
| 23 | Celular para criança | celular-para-crianca-qual-idade (#126) | celular criança idade | tecnologia-do-pai / celular-e-acessorios | pre-adolescencia |
| 24 | Tempo de tela | tempo-de-tela-por-idade (#127) | tempo de tela | tecnologia-do-pai / controle-parental-e-telas | primeira-infancia |
| 25 | Acompanhante no parto | lei-do-acompanhante-pai-no-parto (#136) | acompanhante no parto | direitos-do-pai / escola-saude-e-direitos-do-filho | gestacao |
| 26 | Sono do bebê aos 2 meses | sono-do-bebe-aos-2-meses-o-que-o-pai-faz-a-noite | sono do bebê aos 2 meses (slug conhecido: sono-do-bebe-aos-2-meses-rotina-e-o-que-esperar) | paternidade-por-fase / recem-nascido | recem-nascido |
| 27 | Enxoval | enxoval-do-bebe-o-que-o-pai-compra | enxoval do bebê lista | paternidade-por-fase / gestacao-e-parto | gestacao |
| 28 | Parto normal ou cesárea | parto-normal-ou-cesarea-como-o-pai-apoia-a-decisao | parto normal ou cesárea | paternidade-por-fase / gestacao-e-parto | gestacao |
| 29 | Amamentação | amamentacao-como-o-pai-ajuda-sem-atrapalhar | amamentação | paternidade-por-fase / recem-nascido | recem-nascido |
| 30 | Banho do recém-nascido | banho-do-recem-nascido-passo-a-passo-para-o-pai | banho do recém-nascido | paternidade-por-fase / recem-nascido | recem-nascido |
| 31 | Troca de fralda | troca-de-fralda-para-o-pai-sem-drama | troca de fralda | paternidade-por-fase / recem-nascido | recem-nascido |
| 32 | Vacinas do 1º ano | vacinas-do-primeiro-ano-o-calendario-que-o-pai-acompanha | calendário de vacinação | paternidade-por-fase / recem-nascido | bebe |
| 33 | Primeiros dentes | primeiros-dentes-o-que-o-pai-faz-na-madrugada | primeiros dentes | paternidade-por-fase / recem-nascido | bebe |
| 34 | Brincar com bebê de 6 meses | bebe-de-6-meses-brincadeiras-com-o-pai | bebê de 6 meses | paternidade-por-fase / recem-nascido | bebe |
| 35 | Primeiros passos | primeiros-passos-como-o-pai-incentiva | primeiros passos | paternidade-por-fase / 1-a-3-anos | primeira-infancia |
| 36 | Adaptação na creche | adaptacao-na-creche-o-papel-do-pai | adaptação creche | paternidade-por-fase / 1-a-3-anos | primeira-infancia |
| 37 | Febre na criança | febre-na-crianca-o-que-o-pai-faz | febre criança | paternidade-por-fase / 1-a-3-anos | primeira-infancia |
| 38 | Terror noturno | terror-noturno-e-pesadelo-como-o-pai-acalma | terror noturno | paternidade-por-fase / 1-a-3-anos | primeira-infancia |
| 39 | Desfralde | desfralde-como-o-pai-ajuda | desfralde | paternidade-por-fase / 1-a-3-anos | primeira-infancia |
| 40 | Chupeta e mamadeira | chupeta-e-mamadeira-quando-tirar-a-visao-do-pai | tirar a chupeta | paternidade-por-fase / 1-a-3-anos | primeira-infancia |
| 41 | Irmão chegando | irmao-chegando-como-preparar-o-filho-mais-velho | preparar o filho mais velho | casamento-e-familia / familia-grande | primeira-infancia |
| 42 | Segundo filho | segundo-filho-o-que-muda-para-o-pai | segundo filho | casamento-e-familia / familia-grande | todas |
| 43 | Alfabetização | alfabetizacao-como-o-pai-ajuda-em-casa | alfabetização | paternidade-por-fase / 4-a-7-anos | infancia |
| 44 | Lição de casa | licao-de-casa-sem-briga-o-metodo-do-pai | lição de casa | paternidade-por-fase / 8-a-12-anos | pre-adolescencia |
| 45 | Bullying | bullying-na-escola-o-que-o-pai-faz | bullying | paternidade-por-fase / 8-a-12-anos | pre-adolescencia |
| 46 | Puberdade do filho | puberdade-do-filho-como-o-pai-conversa | puberdade | paternidade-por-fase / 8-a-12-anos | pre-adolescencia |
| 47 | Primeira menstruação da filha | primeira-menstruacao-da-filha-o-que-o-pai-precisa-saber | primeira menstruação | paternidade-por-fase / 8-a-12-anos | pre-adolescencia |
| 48 | Namoro na adolescência | namoro-na-adolescencia-as-regras-do-pai | namoro adolescente | paternidade-por-fase / adolescencia | adolescencia |
| 49 | Redes sociais do adolescente | redes-sociais-do-filho-adolescente-limites | redes sociais adolescente | tecnologia-do-pai / controle-parental-e-telas | adolescencia |
| 50 | Drogas e álcool | drogas-e-alcool-como-o-pai-previne | drogas adolescente | paternidade-por-fase / adolescencia | adolescencia |
| 51 | Vestibular e carreira | vestibular-e-escolha-de-carreira-o-pai-ajuda-sem-impor | escolha de carreira | paternidade-por-fase / adolescencia | adolescencia |
| 52 | Filho saindo de casa | filho-saindo-de-casa-como-o-pai-se-prepara | filho saindo de casa | paternidade-por-fase / filho-adulto | adulto |
| 53 | Depressão pós-parto da esposa | depressao-pos-parto-da-esposa-como-o-pai-reconhece | depressão pós-parto | casamento-e-familia / vida-a-dois | recem-nascido |
| 54 | Intimidade depois do bebê | intimidade-depois-do-bebe-o-tempo-do-casal | intimidade depois do bebê | casamento-e-familia / intimidade-conjugal | recem-nascido |
| 55 | Volta ao trabalho da esposa | volta-ao-trabalho-da-esposa-como-o-pai-divide-a-rotina | volta ao trabalho | casamento-e-familia / rotina-da-casa | bebe |
| 56 | Gêmeos | gemeos-o-pai-de-dois-de-uma-vez | gêmeos | paternidade-por-fase / recem-nascido | recem-nascido |
| 57 | Prematuro na UTI neonatal | prematuro-na-uti-neonatal-o-pai-no-hospital | prematuro UTI | paternidade-por-fase / recem-nascido | recem-nascido |
| 58 | Perda gestacional | perda-gestacional-como-o-pai-vive-o-luto | perda gestacional | fe-e-virtude / luto-e-esperanca | gestacao |
| 59 | Avós que ajudam demais | avos-que-ajudam-demais-como-o-pai-poe-limite | avós | casamento-e-familia / familia-grande | todas |
| 60 | Volta às aulas | mochila-escolar-e-material-o-pai-na-volta-as-aulas | volta às aulas | paternidade-por-fase / 4-a-7-anos | infancia |

Com os 35 espelhos novos, o backlog soma **185 artigos + 40 Pai Indica + 10 modelos de notícia = 235 pautas**
("200+ títulos", PLANO-MESTRE §6).

---

## 9. Seed `supabase/seed/backlog.json` e script `scripts/rotina/backlog.mjs`

### 9.1 Formato do arquivo

Um único JSON (`supabase/seed/backlog.json`, UTF-8, 2 espaços, chaves ordenadas como abaixo), versionado no repositório.
Não vai para o banco: é lido pelo script e commitado junto com as publicações. Campos:

| Campo | Tipo | Obrigatório | Valores / regra |
|---|---|---|---|
| `id` | string | sim | `art-001` … `art-185`, `pi-021` … `pi-060`, `not-N1` … `not-N10`; itens criados pela rotina: `art-r-AAAAMMDD-N` |
| `type` | string | sim | `artigo` · `pai-indica` · `noticia` |
| `title` | string | sim | Título editorial da tabela (sem "guia", sem preço) |
| `slug` | string | sim (artigo, pai-indica) | Final; notícia usa `slug_pattern` |
| `category` | string | sim | Slug da categoria-mãe (doc 00 §3.2) ou `pai-indica` / `noticias` |
| `subcategory` | string ou null | artigo | Slug da subcategoria (doc 00 §3.3) |
| `intent` | string | sim | `informacional` · `comercial` · `navegacional` |
| `keywords` | string[] | sim | Palavras-alvo da tabela, 1 a 4 |
| `format` | string | sim | `padrao-a` · `guia` · `noticia` · (pai-indica) `review` · `comparativo` · `lista` |
| `phase` | string | artigo | `gestacao` … `adulto` ou `todas` (vira tag `fase-<phase>`) |
| `priority` | string | sim | `P0` · `P1` · `P2` |
| `cluster` | string ou null | artigo | `C1` … `C14` |
| `hub` | boolean | artigo | `true` só nos 14 hubs de cluster (#40 e #139 são `guia` com `hub: false`) |
| `requires_phase` | string | sim | `F1` … `F8`: fase do plano que precisa estar `concluída` em `PROGRESSO.md` (artigos sem ponte de ferramenta: `F1`; com `/ferramentas/`: `F4`; com `/pai-indica-pai/` ou `/historias`: `F6`/`F7`; Pai Indica: `F3`; notícia: `F8`) |
| `series` | string ou null | — | `serie:<slug>` (doc 00 §3.7) |
| `season` | objeto ou null | — | `{ "start": "MM-DD", "end": "MM-DD", "publish_by": "MM-DD" }` (seção 6); datas móveis via `seasonDates()` |
| `mirror` | boolean | artigo | `true` nos 60 espelhos (seção 8.2) |
| `mirror_query` | string ou null | artigo | "Termo de busca no VDM" |
| `day` | number ou null | — | Dia do calendário da seção 5 (1 a 30) |
| `products` | objeto[] | pai-indica | `[{ "brand": "Bosch", "model": "GSB 13 RE", "asin": null, "product_slug": null }]`; `asin`/`product_slug` preenchidos ao confirmar com `amz.py` |
| `product_category` / `product_subcategory` | string | pai-indica | Slugs do doc 04 §3 |
| `why_now` | string | pai-indica | Coluna "Por que agora" |
| `round` | string ou null | pai-indica | `R5` … `R12` |
| `template` | string | noticia | `N1` … `N10` |
| `cadence` | string | noticia | Texto da coluna "Gatilho / cadência" |
| `sources` | string[] | noticia | URLs oficiais |
| `slug_pattern` | string | noticia | Ex.: `mercado-do-pai-semana-AAAA-SS` |
| `required_links` | string[] | sim | Hub, pontes e ferramenta obrigatórias (rotas internas) |
| `status` | string | sim | `pendente` · `em_producao` · `publicado` · `descartado` |
| `published_slug` / `published_at` | string ou null | — | Preenchidos por `backlog.mjs mark` |
| `origin` | string | sim | `doc-12` · `rotina` · `dono` |
| `notes` | string | — | Livre (ex.: "doc 03 #7 — título sem 'guia'") |

Três itens de exemplo (um por tipo), para copiar:

```json
{
  "version": "1.0",
  "generated_from": "docs/plano/12-backlog-de-conteudo.md",
  "items": [
    {
      "id": "art-070", "type": "artigo",
      "title": "Cortes de carne para churrasco: do boi ao espeto, corte por corte",
      "slug": "guia-dos-cortes-de-carne-para-churrasco",
      "category": "churrasco-e-cozinha", "subcategory": "cortes-de-carne",
      "intent": "informacional", "keywords": ["cortes de carne para churrasco"],
      "format": "guia", "phase": "todas", "priority": "P0", "cluster": "C3", "hub": true,
      "requires_phase": "F1", "series": null,
      "season": { "start": "04-10", "end": "04-24", "publish_by": "04-10" },
      "mirror": false, "mirror_query": null, "day": 11,
      "required_links": ["/post/cortes-de-carne-para-churrasco-guia-do-pai-iniciante", "/post/ponto-da-carne-tempo-de-cada-lado"],
      "status": "pendente", "published_slug": null, "published_at": null,
      "origin": "doc-12", "notes": "Hub do cluster C3 (doc 11 §8.1). Bloco \"Neste artigo\" obrigatório."
    },
    {
      "id": "pi-028", "type": "pai-indica",
      "title": "Furadeira de impacto Bosch GSB 13 RE, Makita HP1630 ou DeWalt DWD024: qual fura concreto sem drama?",
      "slug": "bosch-gsb-13-re-makita-hp1630-ou-dewalt-dwd024-furadeira-de-impacto",
      "category": "pai-indica", "subcategory": null,
      "intent": "comercial", "keywords": ["melhor furadeira para uso doméstico"],
      "format": "comparativo", "phase": "todas", "priority": "P0", "cluster": "C4", "hub": false,
      "requires_phase": "F3", "series": null, "season": null, "mirror": false, "mirror_query": null, "day": 25,
      "products": [
        { "brand": "Bosch", "model": "GSB 13 RE 650 W", "asin": null, "product_slug": null },
        { "brand": "Makita", "model": "HP1630", "asin": null, "product_slug": null },
        { "brand": "DeWalt", "model": "DWD024", "asin": null, "product_slug": null }
      ],
      "product_category": "ferramentas", "product_subcategory": "furadeiras-e-parafusadeiras",
      "why_now": "Keyword do cluster 4; Bosch GSB 13 RE está no seed da loja", "round": "R5",
      "required_links": ["/post/caixa-de-ferramentas-basica-do-pai", "/post/como-furar-parede-sem-rachar", "/post/furadeira-ou-parafusadeira-qual-comprar"],
      "status": "pendente", "published_slug": null, "published_at": null, "origin": "doc-12", "notes": ""
    },
    {
      "id": "not-N1", "type": "noticia",
      "title": "Mercado do pai da semana", "slug": null,
      "category": "noticias", "subcategory": null,
      "intent": "informacional", "keywords": ["dólar hoje", "selic", "bitcoin hoje"],
      "format": "noticia", "phase": "todas", "priority": "P0", "cluster": "C7", "hub": false,
      "requires_phase": "F8", "series": "serie:mercado-do-pai", "season": null, "mirror": false, "mirror_query": null, "day": null,
      "template": "N1", "cadence": "toda segunda-feira",
      "sources": ["https://www.bcb.gov.br/estabilidadefinanceira/historicocotacoes", "https://www.bcb.gov.br/controleinflacao/historicotaxasjuros"],
      "slug_pattern": "mercado-do-pai-semana-AAAA-SS",
      "required_links": ["/ferramentas/mercado-financeiro", "/ferramentas/conversor-de-moedas", "/post/dolar-subiu-o-que-muda-no-bolso-da-familia"],
      "status": "pendente", "published_slug": null, "published_at": null, "origin": "doc-12", "notes": "Modelos de notícia são reutilizáveis: mark cria uma cópia com id not-N1-AAAA-SS e mantém o modelo pendente."
    }
  ]
}
```

### 9.2 Como montar o JSON (Uso A, uma sessão)

1. `git checkout -b claude/backlog-seed` a partir de `main` atualizada.
2. Criar `supabase/seed/backlog.json` com **todos** os itens: 150 artigos da seção 2 (`art-001` a `art-150`, na ordem da
   tabela), 35 espelhos da seção 8.2 (`art-151` a `art-185`, `priority: "P2"`, `mirror: true`), 40 Pai Indica da seção 3
   (`pi-021` a `pi-060`; `slug` proposto a partir do título, ≤ 80 caracteres, sem ano) e 10 modelos de notícia (`not-N1` a `not-N10`).
   Preencher `day` com a seção 5, `season` com a seção 6, `required_links` com a tabela 7.1 e `requires_phase` pela regra da tabela 9.1.
3. Criar `scripts/rotina/backlog.mjs` (seção 9.3) e rodar `node scripts/rotina/backlog.mjs check --offline` (valida
   estrutura, slugs únicos, categorias contra `src/content/taxonomia.json`, `product_category`/`product_subcategory` contra
   `src/lib/pai-indica/taxonomia.ts`, 150/35/40/10 itens, 14 hubs, ≥ 8 por categoria).
4. Rodar a conferência da seção 2.15.
5. Adicionar ao `README.md` de `scripts/rotina/` (doc 10 §4.1) a linha do `backlog.mjs`.
6. No workflow de validação da Fase 8 (`validate.yml`, doc 10 §10.2), adicionar o passo
   `node scripts/rotina/backlog.mjs check --offline` (sem acesso ao banco no CI).
7. `npm run build && npm run lint && node scripts/validate-content.mjs` verdes; commit `docs(backlog): seed do backlog de conteúdo e script de fila`;
   PR `Backlog de conteúdo — seed e script` contra `main`; `PROGRESSO.md` atualizado (linha "Backlog · seed · concluída").

### 9.3 Esqueleto de `scripts/rotina/backlog.mjs` (Node 22, ESM, sem dependências)

```js
#!/usr/bin/env node
// scripts/rotina/backlog.mjs — fila de pautas do Vocação de Pai (lê/grava supabase/seed/backlog.json).
// Comandos:
//   next  --tipo artigo|pai-indica|noticia --n 3 [--fase F4] [--json] [--hoje AAAA-MM-DD]
//   mark  <id> --slug <slug> [--data AAAA-MM-DDTHH:MM:SSZ]
//   unmark <id>
//   check [--offline]          (reconcilia com o banco pela REST pública; --offline só valida o arquivo)
//   stats                       (contagens por tipo/prioridade/categoria/status)
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const FILE = resolve(ROOT, "supabase/seed/backlog.json");
const TAXONOMIA = resolve(ROOT, "src/content/taxonomia.json");
const PROGRESSO = resolve(ROOT, "docs/plano/PROGRESSO.md");
const PHASES = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8"];

const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, def) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : def; };
const flag = (name) => args.includes(`--${name}`);

const load = () => JSON.parse(readFileSync(FILE, "utf8"));
const save = (db) => writeFileSync(FILE, JSON.stringify(db, null, 2) + "\n");

/** Maior fase marcada como "concluída" na linha-resumo de PROGRESSO.md (ou --fase). */
function currentPhase() {
  const forced = opt("fase");
  if (forced) return forced;
  const md = readFileSync(PROGRESSO, "utf8");
  let max = 0;
  for (const m of md.matchAll(/^\| F(\d) [^|]*\| — \| ([^|]+)\|/gm)) {
    if (m[2].trim() === "concluída") max = Math.max(max, Number(m[1]));
  }
  return `F${Math.max(max, 1)}`;
}
const phaseOk = (item, cur) => PHASES.indexOf(item.requires_phase) <= PHASES.indexOf(cur);

/** Datas móveis do ano (seção 6): Páscoa (Meeus), Cinzas, Corpus Christi, Dia das Mães, Dia dos Pais, Black Friday, Advento. */
export function seasonDates(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  const easter = new Date(Date.UTC(year, month - 1, day));
  const add = (dt, n) => new Date(dt.getTime() + n * 86400000);
  const nthSunday = (mo, n) => { const d = new Date(Date.UTC(year, mo, 1)); const off = (7 - d.getUTCDay()) % 7; return add(d, off + 7 * (n - 1)); };
  const fourthThursdayNov = () => { const d = new Date(Date.UTC(year, 10, 1)); return add(d, ((4 - d.getUTCDay() + 7) % 7) + 21); };
  const fmt = (dt) => dt.toISOString().slice(5, 10);
  const natal = new Date(Date.UTC(year, 11, 25));
  return {
    pascoa: fmt(easter), cinzas: fmt(add(easter, -46)), corpusChristi: fmt(add(easter, 60)),
    diaDasMaes: fmt(nthSunday(4, 2)), diaDosPais: fmt(nthSunday(7, 2)),
    blackFriday: fmt(add(fourthThursdayNov(), 1)),
    advento: fmt(add(natal, -(21 + (natal.getUTCDay() || 7)))), // 4º domingo antes do Natal
  };
}

const inSeason = (item, today) => {
  if (!item.season) return false;
  const md = today.toISOString().slice(5, 10);
  const { start, end } = item.season;
  return start <= end ? md >= start && md <= end : md >= start || md <= end; // janela que vira o ano
};

function cmdNext(db) {
  const tipo = opt("tipo", "artigo"), n = Number(opt("n", 3)), cur = currentPhase();
  const today = new Date(opt("hoje", new Date().toISOString().slice(0, 10)));
  const rank = { P0: 0, P1: 1, P2: 2 };
  const pool = db.items
    .filter((i) => i.type === tipo && i.status === "pendente" && phaseOk(i, cur))
    .sort((a, b) => (inSeason(b, today) - inSeason(a, today)) || (rank[a.priority] - rank[b.priority]) || ((a.day ?? 99) - (b.day ?? 99)) || a.id.localeCompare(b.id));
  const out = [], cats = new Set();
  for (const i of pool) {
    if (tipo === "artigo" && cats.has(i.category)) continue; // rotação de categoria
    if (tipo === "artigo" && !i.hub && i.cluster) {
      const hub = db.items.find((h) => h.hub && h.cluster === i.cluster);
      if (hub && hub.status !== "publicado" && !out.includes(hub)) { if (phaseOk(hub, cur)) { out.push(hub); cats.add(hub.category); if (out.length >= n) break; } continue; } // hub antes de satélite
    }
    out.push(i); cats.add(i.category);
    if (out.length >= n) break;
  }
  if (flag("json")) console.log(JSON.stringify(out, null, 2));
  else for (const i of out) console.log(`${i.id}\t${i.priority}\t${i.category}${i.subcategory ? "/" + i.subcategory : ""}\t${i.slug ?? i.slug_pattern}\t${i.title}`);
  console.error(`fase atual: ${cur}; pendentes elegíveis: ${pool.length}`);
}

function cmdMark(db) {
  const id = args[1], slug = opt("slug"), data = opt("data", new Date().toISOString());
  const item = db.items.find((i) => i.id === id);
  if (!item || !slug) { console.error("uso: mark <id> --slug <slug>"); process.exit(2); }
  if (item.type === "noticia") { // modelo reutilizável: cria uma cópia publicada
    const copy = { ...item, id: `${item.id}-${slug.slice(-7)}`, slug, status: "publicado", published_slug: slug, published_at: data, origin: "rotina" };
    db.items.push(copy); save(db); console.log(JSON.stringify(copy)); return;
  }
  Object.assign(item, { status: "publicado", published_slug: slug, published_at: data });
  save(db); console.log(JSON.stringify(item));
}

function cmdUnmark(db) {
  const item = db.items.find((i) => i.id === args[1]);
  if (!item) process.exit(2);
  Object.assign(item, { status: "pendente", published_slug: null, published_at: null, notes: `${item.notes ?? ""} | despublicado em ${new Date().toISOString().slice(0, 10)}`.trim() });
  save(db); console.log(JSON.stringify(item));
}

async function cmdCheck(db) {
  const errors = [];
  const tax = JSON.parse(readFileSync(TAXONOMIA, "utf8"));
  const cats = new Set(tax.categories.map((c) => c.slug).concat(["pai-indica", "noticias"]));
  const subs = new Set(tax.categories.flatMap((c) => c.subcategories.map((s) => s.slug)));
  const slugs = new Map();
  for (const i of db.items) {
    if (!cats.has(i.category)) errors.push(`${i.id}: categoria inválida ${i.category}`);
    if (i.subcategory && !subs.has(i.subcategory)) errors.push(`${i.id}: subcategoria inválida ${i.subcategory}`);
    if (i.slug) { if (slugs.has(i.slug)) errors.push(`${i.id}: slug duplicado de ${slugs.get(i.slug)}`); slugs.set(i.slug, i.id); }
    if (i.slug && !/^[a-z0-9-]{3,80}$/.test(i.slug)) errors.push(`${i.id}: slug fora do padrão`);
    if (/\bguia\b/i.test(i.title)) errors.push(`${i.id}: título com a palavra "guia" (doc 00 §4.3 item 17)`);
    if (/R\$\s?\d/.test(i.title)) errors.push(`${i.id}: preço no título`);
    if (!PHASES.includes(i.requires_phase)) errors.push(`${i.id}: requires_phase inválida`);
  }
  const art = db.items.filter((i) => i.type === "artigo");
  const porCat = {}; art.forEach((i) => (porCat[i.category] = (porCat[i.category] || 0) + 1));
  if (art.filter((i) => i.hub).length !== 14) errors.push("hubs != 14");
  if (Object.values(porCat).some((v) => v < 8)) errors.push("categoria com < 8 artigos");
  if (!flag("offline")) {
    const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) { console.error("SUPABASE_URL/SUPABASE_ANON_KEY ausentes; use --offline"); process.exit(2); }
    const res = await fetch(`${url}/rest/v1/posts?select=slug,status&limit=5000`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const posts = new Map((await res.json()).map((p) => [p.slug, p.status]));
    let changed = 0;
    for (const i of db.items) {
      const s = i.published_slug ?? i.slug;
      if (!s) continue;
      if (i.status === "pendente" && posts.get(s) === "published") { Object.assign(i, { status: "publicado", published_slug: s, published_at: new Date().toISOString() }); changed++; }
      if (i.status === "publicado" && posts.get(s) !== "published") { Object.assign(i, { status: "pendente", notes: `${i.notes ?? ""} | check: slug ausente ou não publicado`.trim() }); changed++; }
    }
    if (changed) { save(db); console.log(`check: ${changed} item(ns) reconciliado(s) com o banco`); }
    if (changed && !errors.length) process.exit(1); // sinaliza à rotina que há JSON para commitar
  }
  if (errors.length) { console.error(errors.join("\n")); process.exit(2); }
  console.log("check: ok");
}

function cmdStats(db) {
  const by = (k) => db.items.reduce((acc, i) => ((acc[i[k]] = (acc[i[k]] || 0) + 1), acc), {});
  console.log(JSON.stringify({ total: db.items.length, tipo: by("type"), prioridade: by("priority"), status: by("status"), categoria: by("category") }, null, 2));
}

const db = load();
({ next: cmdNext, mark: cmdMark, unmark: cmdUnmark, check: cmdCheck, stats: cmdStats }[cmd] ?? (() => { console.error("comando inválido"); process.exit(2); }))(db);
```

Observações para o executor: `import.meta.dirname` existe no Node 22 (CLAUDE.md §2); não adicionar dependências;
se `src/content/taxonomia.json` ainda não existir quando o script for criado, criá-lo primeiro copiando o JSON do
doc 00 §3.5 (é tarefa da Fase 1, etapa 1.11). O `check` sem `--offline` precisa de `SUPABASE_URL` e `SUPABASE_ANON_KEY`
no ambiente (nunca commitados); na rotina, as mesmas variáveis dos outros scripts (doc 10 §4).

---

## 10. Critérios de aceite

- [ ] CA-1 `supabase/seed/backlog.json` existe com 185 `artigo` (150 + 35 espelhos), 40 `pai-indica` (`pi-021` a `pi-060`) e 10 `noticia`;
      `node scripts/rotina/backlog.mjs stats` confirma; `check --offline` imprime `check: ok`.
- [ ] CA-2 Todos os 150 slugs da seção 2 são únicos e batem com os 10 slugs do doc 03 §9.2 e com os 14 hubs do doc 11 §8.1
      (`grep -c` dos 14 slugs de hub no JSON = 14).
- [ ] CA-3 Toda `category`/`subcategory` do JSON existe em `src/content/taxonomia.json` (+ `pai-indica`, `noticias`); todo
      `product_category`/`product_subcategory` existe em `src/lib/pai-indica/taxonomia.ts` (com `leitores-digitais` adicionada).
- [ ] CA-4 Nenhum `title` contém "guia" nem "R$"; nenhum `slug` contém ano.
- [ ] CA-5 `backlog.mjs next --tipo artigo --n 3 --fase F1` devolve 3 itens de categorias diferentes, começando pelos dias 1–4 da seção 5
      e com hub antes de satélite; `--fase F4` passa a incluir itens com `/ferramentas/` em `required_links`.
- [ ] CA-6 `backlog.mjs mark art-002 --slug vai-ser-pai-guia-do-primeiro-trimestre-para-o-homem` grava `publicado` e
      `unmark art-002` reverte; `mark not-N1 --slug mercado-do-pai-semana-2027-03` cria cópia e mantém o modelo `pendente`.
- [ ] CA-7 `seasonDates(2027)` devolve `pascoa: "03-28"`, `cinzas: "02-10"`, `corpusChristi: "05-27"`, `diaDasMaes: "05-09"`,
      `diaDosPais: "08-08"`, `blackFriday: "11-26"`, `advento: "11-28"`; `seasonDates(2026)` devolve `blackFriday: "11-27"` e `advento: "11-29"`.
- [ ] CA-8 A reconciliação de taxonomia (seção 0.2) está registrada em `PROGRESSO.md` → "Decisões tomadas durante a execução"
      e refletida em `0002_blog.sql` (14 categorias do doc 00 + `pai-indica` + `noticias`, `parent_id`, `color`).
- [ ] CA-9 Em modo de produção de pautas (Uso B), cada artigo publicado passa em `scripts/validate-content.mjs`, tem ≥ 10 links
      para slugs publicados (consulta 1 da seção 7.4 vazia), linka o hub no 1º/2º parágrafo e tem 1 tag `fase-*`.
- [ ] CA-10 Ao fim do dia 30 da seção 5: ≥ 65 artigos, ≥ 29 Pai Indica, ≥ 60 produtos, 15 ferramentas; cada categoria com ≥ 5 artigos
      (pré-requisito do AdSense, doc 00 §10.1); `backlog.mjs check` sem divergência com o banco.
- [ ] CA-11 `npm run build && npm run lint && node scripts/validate-content.mjs` verdes; PR aberto; `PROGRESSO.md` e
      `13-checklist-de-execucao.md` atualizados.

---

## 11. Prompt para iniciar esta fase no Sonnet

Dois prompts: o primeiro monta a fila (Uso A); o segundo produz as pautas de um dia (Uso B). O dono cola um ou outro.

```text
Você está em /home/user/vocacaodepai (TanStack Start + React 19 + Tailwind 4 + Supabase + Vercel). Leia primeiro, nesta ordem:
CLAUDE.md, PLANO-MESTRE.md, docs/plano/02-arquitetura-e-stack.md (§4.2 e §5), docs/plano/00-visao-posicionamento-e-marca.md (§3 a §5),
docs/plano/11-monetizacao-seo-e-crescimento.md (§8), docs/plano/12-backlog-de-conteudo.md e docs/plano/PROGRESSO.md.
Execute o USO A do documento 12 (seção 9.2 "Como montar o JSON"), sem escrever nenhum artigo e sem montar nenhuma página do site:
1. Crie a branch claude/backlog-seed a partir de main.
2. Se src/content/taxonomia.json não existir, crie-o copiando o JSON do doc 00 §3.5 (byte a byte).
3. Crie supabase/seed/backlog.json com TODOS os itens: art-001 a art-150 (seção 2, na ordem), art-151 a art-185 (os 35 espelhos
   novos da seção 8.2, priority P2, mirror true), pi-021 a pi-060 (seção 3) e not-N1 a not-N10 (seção 4), nos campos da tabela 9.1,
   com day (seção 5), season (seção 6), required_links (tabela 7.1), requires_phase (regra da tabela 9.1) e status "pendente".
4. Crie scripts/rotina/backlog.mjs copiando o esqueleto da seção 9.3 e rode: node scripts/rotina/backlog.mjs check --offline,
   node scripts/rotina/backlog.mjs stats e a conferência da seção 2.15. Corrija até os três passarem.
5. Adicione o passo "node scripts/rotina/backlog.mjs check --offline" ao workflow de validação (validate.yml do doc 10 §10.2, se existir;
   senão, registre em PROGRESSO.md que o passo entra na Fase 8) e a linha do backlog.mjs no scripts/rotina/README.md (se existir).
6. Registre em docs/plano/PROGRESSO.md → "Decisões tomadas durante a execução" a reconciliação de taxonomia da seção 0.2, e adicione a
   linha "Backlog · seed · concluída · <data>" na tabela de progresso.
7. npm run build && npm run lint && node scripts/validate-content.mjs verdes; commit "docs(backlog): seed do backlog de conteúdo e script de fila";
   PR "Backlog de conteúdo — seed e script" contra main com o Checklist de pronto da seção 12 no corpo.
Não invente slugs, categorias nem produtos fora do documento 12. Se algo conflitar com o código existente, siga o código e anote em PROGRESSO.md.
Não faça perguntas: tome a decisão mais simples compatível com o documento.
```

```text
Você está em /home/user/vocacaodepai. Leia CLAUDE.md, docs/plano/12-backlog-de-conteudo.md (seções 1, 5, 7 e 8),
docs/plano/10-fase-8-automacao-rotinas-e-painel.md (§3 e §4.2) e docs/plano/PROGRESSO.md.
Execute o USO B do documento 12 para o DIA <N> da seção 5:
1. Branch claude/conteudo-dia-<N> a partir de main. Rode node scripts/rotina/backlog.mjs next --tipo artigo --n <quantidade do dia> --json
   e confira que os itens batem com a linha do dia <N> da seção 5 (se não baterem, use a fila do script e anote em PROGRESSO.md).
2. Para cada item: escreva o artigo pelo Padrão A do Pai (CLAUDE.md §6; doc 10 §4.2), com o hub do cluster linkado no 1º ou 2º parágrafo,
   ≥ 10 links internos só para slugs já publicados (select slug from posts where status='published'), as pontes da tabela 7.3,
   1 tag fase-*, capa pela cascata do CLAUDE.md §5.3 (nunca repetida), FAQ ≥ 4 e, se for hub (format guia), o H2 "Neste artigo".
3. Insira com um único INSERT por post (status published, publish_at now()), confira com SELECT, rode node scripts/validate-content.mjs
   e node scripts/rotina/backlog.mjs mark <id> --slug <slug> para cada um.
4. Se o dia tiver Pai Indica ou produtos (colunas da seção 5), siga os briefs do doc 04 §9 e a ordem "Loja primeiro" do doc 10 §2.3 (E4 → E5).
5. Commit do SQL (supabase/rotina/<data>/ ou supabase/seed/posts/) junto com supabase/seed/backlog.json; PR "Conteúdo — dia <N>" contra main;
   PROGRESSO.md com os slugs publicados, palavras, links e pendências. Relatório final em PT-BR em até 10 linhas.
Regras duras: nunca DROP/DELETE; nunca preço em reais; nunca a palavra "guia" no título; linha editorial do CLAUDE.md §3; nada de "testamos".
```

---

## 12. Checklist de pronto

```markdown
## Backlog de conteúdo (doc 12) — Checklist de pronto
### Fila (Uso A)
- [ ] `src/content/taxonomia.json` igual ao doc 00 §3.5
- [ ] `supabase/seed/backlog.json`: 185 artigos (150 + 35 espelhos), 40 Pai Indica, 10 modelos de notícia; `stats` confere
- [ ] `scripts/rotina/backlog.mjs` com `next`, `mark`, `unmark`, `check`, `stats`, `seasonDates`; `check --offline` = ok
- [ ] Conferência da seção 2.15 = 150 artigos, 150 slugs únicos, 16 guias, 14 hubs, ≥ 8 por categoria
- [ ] `seasonDates(2027)` bate com as 7 datas da seção 6
- [ ] Passo `backlog.mjs check --offline` no workflow de validação (ou registrado para a Fase 8)
- [ ] Reconciliação de taxonomia (§0.2) em `PROGRESSO.md` e em `0002_blog.sql` (14 + `pai-indica` + `noticias`, `parent_id`, `color`)
- [ ] `src/lib/pai-indica/taxonomia.ts` com a subcategoria `leitores-digitais`
### Produção (Uso B, por dia da seção 5)
- [ ] Itens do dia publicados (`status='published'`), validados, marcados com `backlog.mjs mark`
- [ ] Hub linkado no 1º/2º parágrafo; ≥ 10 links para slugs publicados; consulta 1 da §7.4 vazia
- [ ] Tag `fase-*` + `verbo:*` (+ `serie:*` quando for série); capa única; FAQ ≥ 4
- [ ] Pai Indica do dia com produto em `products` (review longa, ≥ 3 fotos oficiais, faixa em 2 lojas) antes do post
- [ ] `backlog.json` commitado no mesmo PR do SQL
### Qualidade
- [ ] `npm run build && npm run lint && node scripts/validate-content.mjs` verdes
- [ ] `docs/plano/PROGRESSO.md` e `docs/plano/13-checklist-de-execucao.md` atualizados; PR aberto
```
