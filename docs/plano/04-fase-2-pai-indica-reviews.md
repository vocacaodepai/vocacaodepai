# Fase 2 — Pai Indica: sistema de reviews (individual, comparativo e lista)

> Documento de execução. Leitor: Claude Sonnet 5.5 (esforço médio) rodando Claude Code em `/home/user/vocacaodepai`.
> Pré-requisito: Fase 1 concluída (`docs/plano/03-fase-1-fundacao.md`): repositório clonado do Vocação de Mãe e
> adaptado, Supabase novo (`<SUPABASE_PROJECT_REF>`, sa-east-1) com `0001_core.sql` e `0002_blog.sql` aplicadas,
> tabelas `posts`, `categories`, `products`, `product_categories` existentes, deploy na Vercel funcionando.
> Se `docs/plano/02-arquitetura-e-stack.md` existir, ele prevalece sobre qualquer detalhe de coluna daqui.
>
> Herança: modelo "AI Indica" do Portal da AI (`/home/user/portaldaai`: `lib/types.ts`, `components/ArticleCard.tsx`
> → `ReviewBadge`, `components/ScoreScaleNote.tsx`, `components/AiIndicaFilter.tsx`, `components/ProductCategoryFilter.tsx`,
> `components/filterVisibility.ts`, `components/reviewKinds.ts`) e "Review de Mãe / Padrão B" do Vocação de Mãe
> (`/home/user/vocacaodemae/CLAUDE.md`, `scripts/rotina/BRIEF_COMPARATIVO.md`, `BRIEF_REVIEW.md`, `BRIEF_REVIEW_UNICA.md`,
> `cmp_gen.py`, `rev_art_gen.py`, `review_gen.py`, `cover_cmp.py`, `amz.py`, `src/lib/review-body.ts`,
> `src/components/store/ProductReviewArticle.tsx`). Regras de método e SEO do Review Produtos
> (`/home/user/reviewprodutos/docs/PADRAO-EDITORIAL.md`). Esses repositórios são SOMENTE LEITURA.

## Sumário

1. Conceito e promessa do Pai Indica
2. Modelo de dados (posts com `kind`, `review`, `comparison`, taxonomia e nota)
3. Taxonomia de produtos do pai (`src/lib/pai-indica/taxonomia.ts`)
4. Componentes (esqueletos TSX)
5. Páginas `/pai-indica` e `/pai-indica/$slug`
6. Capa composta (`scripts/rotina/cover_cmp.py`)
7. JSON-LD (Review, Product, ItemList, FAQPage, BreadcrumbList)
8. Regras editoriais obrigatórias
9. Briefs do Pai Indica (`scripts/rotina/BRIEF_*_PAI.md`)
10. Primeiros 20 Pai Indica a publicar
11. Validações (`scripts/validate-content.mjs`)
12. Critérios de aceite
13. Prompt para iniciar esta fase no Sonnet
14. Checklist de pronto

Ordem de execução recomendada (cada bloco vira 1 commit): 2 → 3 → 4 → 5 → 7 → 11 → 6 → 9 → 10 (publicar os 20 em
rodadas de 5 por sessão). Antes de citar qualquer caminho em código, confirme com `ls` que ele existe no repositório
clonado (a Fase 1 pode ter renomeado pastas; nesse caso, adapte e registre em `docs/plano/PROGRESSO.md`).

---

## 1. Conceito e promessa do Pai Indica

**O que é.** Pai Indica é a seção de reviews de produto do Vocação de Pai (`/pai-indica`). Herda a estrutura do
AI Indica (Portal da AI) e do Review de Mãe (Vocação de Mãe): nota de 0 a 10 com casa decimal, 5 critérios com
pesos, prós e contras honestos, "para quem é / para quem não é", faixa de preço pesquisada na internet (nunca preço
exato) e botão **"Comprar agora na Amazon"**. Não é teste físico: é análise de ficha técnica, manual, anúncios da
Amazon Brasil e opiniões de compradores fora da Amazon, e o texto diz isso em "Como avaliamos".

**Voz.** Direta, masculina, respeitosa, prática. De pai para pai. Sem vulgaridade, sem machismo tóxico, sem
superlativo vazio ("imperdível", "o melhor do mundo"). Linha editorial de família tradicional (ver BRIEF e
`CLAUDE.md` da raiz). PT-BR.

**Promessa ao leitor (todo Pai Indica cumpre as 7):**
1. Responde "vale a pena? para quem?" nos primeiros 30 segundos ("Em 3 pontos" logo após a abertura).
2. Diz para quem o produto é e para quem não é.
3. Mostra o que o fabricante não conta (limitações, defeitos recorrentes, cuidados, segurança).
4. Compara com alternativas reais da mesma faixa (ou linka o comparativo irmão).
5. Explica como chegou à nota: 5 critérios com peso visíveis.
6. É honesto sobre o método (sem teste físico; fontes listadas).
7. Traz contexto brasileiro: voltagem, tomada, garantia, assistência, Inmetro/Anatel, Reclame Aqui.

### 1.1 Régua de nota (0 a 10, uma casa decimal)

| Faixa | Rótulo | Significado |
| --- | --- | --- |
| 0 a 5,9 | Não indicamos | Tem problema que compromete o uso ou a segurança; só aparece em comparativo como "o que não comprar". |
| 6,0 a 6,9 | Vale com ressalva | Resolve o básico, mas tem um ponto fraco real que pesa na decisão. |
| 7,0 a 7,9 | Bom, compensa o preço | Sem defeito grave; é a faixa onde cai a maioria das indicações do Pai Indica. |
| 8,0 a 8,9 | Muito bom | Se destaca de verdade dentro da própria categoria. |
| 9,0 a 10 | Excelente | Poucos produtos chegam aqui; indicação sem nenhuma ressalva. |

A casa decimal é proposital (7,8 ≠ 7,5): mostra a diferença entre dois produtos que, arredondados, pareceriam
iguais. A nota **não** é a estrela da Amazon. A nota final é a **média ponderada dos 5 critérios**, arredondada a
1 casa (o validador confere com tolerância de ±0,15). Seja criterioso: a maioria fica entre 6,5 e 8,5.

### 1.2 Os 5 critérios com pesos por categoria de produto

Cada categoria da taxonomia (seção 3) tem **exatamente 5 critérios** com pesos que somam 100. O redator usa os
critérios da categoria do produto; pode trocar o **nome** de um critério por um sinônimo mais específico ao produto
("Desempenho" → "Potência de corte"), mas não o peso nem a quantidade. Fonte: `src/lib/pai-indica/criterios.ts`
(seção 3.2).

| Categoria | Critérios (peso) |
| --- | --- |
| churrasco-e-cozinha | Desempenho (30) · Material e acabamento (20) · Facilidade de uso e limpeza (15) · Durabilidade e garantia (15) · Custo-benefício (20) |
| ferramentas | Desempenho (30) · Ergonomia e peso (15) · Durabilidade (20) · Acessórios e garantia (15) · Custo-benefício (20) |
| carro-e-moto | Funcionalidade (30) · Instalação e praticidade (15) · Qualidade de construção (20) · Segurança e certificação (15) · Custo-benefício (20) |
| tecnologia | Desempenho (25) · Recursos e conectividade (20) · Bateria e autonomia (15) · Construção e conforto (15) · Custo-benefício (25) |
| esporte-e-outdoor | Desempenho no uso (30) · Conforto (20) · Resistência e materiais (20) · Praticidade (10) · Custo-benefício (20) |
| bebe-e-crianca | Segurança e certificação (35) · Praticidade para o pai (20) · Conforto da criança (15) · Durabilidade (10) · Custo-benefício (20) |
| casa-e-jardim | Eficiência (30) · Praticidade (20) · Ruído e consumo (15) · Durabilidade (15) · Custo-benefício (20) |
| saude-do-homem | Eficácia percebida (30) · Precisão e confiabilidade (20) · Conforto e praticidade (15) · Segurança e materiais (15) · Custo-benefício (20) |
| estilo-e-barba | Resultado (30) · Conforto na pele (20) · Bateria e manutenção (15) · Acabamento e durabilidade (15) · Custo-benefício (20) |
| livros-e-formacao | Profundidade do conteúdo (30) · Aplicação prática (25) · Clareza e escrita (20) · Alinhamento com a formação do pai (15) · Custo-benefício (10) |

### 1.3 "Como avaliamos" (texto-base, sem teste físico)

Todo Pai Indica tem uma seção "Como avaliamos" com, no mínimo, estes elementos: (a) fontes: ficha técnica e manual
do fabricante, anúncio da Amazon Brasil, opiniões fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, fóruns,
YouTube); (b) a frase explícita "não fizemos teste físico"; (c) os 5 critérios e pesos usados; (d) a nota é
editorial, não a estrela da Amazon; (e) a faixa de preço vem de pesquisa na internet inteira (≥ 2 lojas), não da
Amazon. Nunca escrever "testamos", "usamos por X dias" ou "na nossa casa".

---

## 2. Modelo de dados

Pai Indica **não cria tabela nova**: usa `posts` (Fase 1, `supabase/migrations/0002_blog.sql`) com `kind` e os
campos JSON. Produtos continuam em `products` (Fase 1 cria a tabela; a Fase 3 — Loja — constrói as páginas).
Um Pai Indica só pode ser publicado se **todos** os produtos citados existirem em `products` com `active = true`.

### 2.1 Colunas usadas (confira com `\d posts` ou `select column_name from information_schema.columns where table_name='posts'`)

| Coluna | Tipo | Uso no Pai Indica |
| --- | --- | --- |
| `kind` | text check in ('artigo','noticia','review','comparativo','lista') | `review` = 1 produto; `comparativo` = 2 a 3 produtos; `lista` = 3 a 7 produtos. |
| `review` | jsonb | Obrigatório em `kind='review'` (esquema 2.3). Null nos outros. |
| `comparison` | jsonb | Obrigatório em `kind in ('comparativo','lista')` (esquema 2.4). Null em `review`. |
| `product_category` | text | Slug da categoria da taxonomia (seção 3). Obrigatório nos 3 kinds. |
| `product_subcategory` | text | Slug da subcategoria. Obrigatório nos 3 kinds; precisa pertencer à categoria. |
| `product_score` | numeric(3,1) | Nota do card: `review.score` (review) ou nota do `winner_slug` (comparativo/lista). |
| `category_id` | uuid → categories | Sempre a categoria editorial **Pai Indica** (`slug='pai-indica'`, id fixo abaixo). |
| `faq` | jsonb | `[{question, answer}]`, mínimo 4. |
| `quiz` | jsonb | Opcional, `[{question, options[4], answer, explanation}]`. |
| `body` | jsonb (Tiptap) | Corpo no Padrão B (seção 5.2), com nós customizados `fotosModelos`, `buyCard`, `galeriaProduto`, `callout`, `table`. |
| `cover_image_url` | text | Sempre `/images/covers/<slug>.jpg` (capa composta, seção 6). |
| `subtitle` | text | Se a Fase 1 criou a coluna (herdada do Vocação de Mãe): obrigatória, 50 a 220 caracteres. Se não existir, usar `seo_description`. |

### 2.2 SQL de verificação e reparo (rodar via `mcp__Supabase__execute_sql`, project `<SUPABASE_PROJECT_REF>`)

Não edite migrations já aplicadas. Se alguma coluna faltar, aplique este bloco idempotente (e registre no
`PROGRESSO.md` que a `0002_blog.sql` da Fase 1 estava incompleta):

```sql
-- Colunas do Pai Indica em posts (idempotente)
alter table public.posts add column if not exists review jsonb;
alter table public.posts add column if not exists comparison jsonb;
alter table public.posts add column if not exists product_category text;
alter table public.posts add column if not exists product_subcategory text;
alter table public.posts add column if not exists product_score numeric(3,1);
alter table public.posts add column if not exists faq jsonb;
alter table public.posts add column if not exists quiz jsonb;

-- Garantia de kind (se a Fase 1 não criou a check)
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_kind_check') then
    alter table public.posts add constraint posts_kind_check
      check (kind in ('artigo','noticia','review','comparativo','lista'));
  end if;
end $$;

-- Coerência: review exige review jsonb; comparativo/lista exigem comparison jsonb
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_pai_indica_shape') then
    alter table public.posts add constraint posts_pai_indica_shape check (
      (kind = 'review' and review is not null and product_category is not null and product_score is not null)
      or (kind in ('comparativo','lista') and comparison is not null and product_category is not null and product_score is not null)
      or (kind in ('artigo','noticia'))
    );
  end if;
end $$;

create index if not exists posts_kind_status_idx on public.posts (kind, status, publish_at desc);
create index if not exists posts_product_category_idx on public.posts (product_category, product_subcategory);

-- Categoria editorial "Pai Indica" (id fixo; mesma ideia do review-de-mae no Vocação de Mãe)
insert into public.categories (id, slug, name, description, color, sort_order)
values ('10000000-0000-0000-0000-000000000010', 'pai-indica', 'Pai Indica',
        'Reviews, comparativos e listas de produtos para o pai, com nota de 0 a 10 e link direto para comprar.',
        '#D9822B', 20)
on conflict (slug) do nothing;

-- Conferência
select kind, count(*) from public.posts group by 1;
select id, slug from public.categories where slug = 'pai-indica';
```

A constraint `posts_pai_indica_shape` só entra se a tabela já estiver vazia de reviews inválidas
(`select count(*) from posts where kind in ('review','comparativo','lista') and product_score is null` deve dar 0).

### 2.3 Esquema de `posts.review` (kind = review) — exemplo completo

```json
{
  "product_slug": "philips-oneblade-qp2724",
  "score": 7.9,
  "criteria": [
    { "name": "Resultado",                 "weight": 30, "score": 8.0, "comment": "Apara e dá acabamento em barba de até 5 mm sem repuxar; não substitui lâmina para pele lisa." },
    { "name": "Conforto na pele",          "weight": 20, "score": 8.5, "comment": "Lâmina não toca a pele diretamente; menos irritação que barbeador de lâmina." },
    { "name": "Bateria e manutenção",      "weight": 15, "score": 7.0, "comment": "Cerca de 45 min por carga (NiMH), carga de 8 h; lâmina dura ~4 meses." },
    { "name": "Acabamento e durabilidade", "weight": 15, "score": 7.5, "comment": "Plástico leve; corpo lavável, mas não é à prova de queda." },
    { "name": "Custo-benefício",           "weight": 20, "score": 8.0, "comment": "Entrada da linha OneBlade; refil é o custo recorrente a considerar." }
  ],
  "pros": [
    "Apara, modela e faz acabamento com uma só lâmina",
    "Corpo lavável em água corrente",
    "Pentes de 1, 3 e 5 mm incluídos",
    "Leve (aprox. 95 g) e fácil de manobrar no pescoço"
  ],
  "cons": [
    "Bateria NiMH com carga lenta (8 h)",
    "Não deixa a pele 100% lisa como lâmina tradicional",
    "Refil da lâmina é despesa recorrente",
    "Sem indicador de bateria em porcentagem"
  ],
  "ideal_for": "Pai que mantém barba curta ou cavanhaque e quer um aparelho só para aparar e dar acabamento, rápido, no banho.",
  "not_ideal_for": "Quem quer a pele totalmente lisa todo dia ou precisa de aparelho profissional para corte de cabelo.",
  "verdict": "O OneBlade QP2724 é a porta de entrada mais sensata da linha: faz o básico muito bem, aguenta o banho e cabe no bolso. A bateria lenta é o preço de ser o modelo simples.",
  "how_we_evaluated": "Análise baseada na ficha técnica e no manual da Philips, no anúncio da Amazon Brasil e em opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, YouTube). Não fizemos teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Estilo e Barba).",
  "sources": ["philips.com.br (ficha e manual)", "Amazon Brasil (anúncio)", "Reclame Aqui", "Mercado Livre", "Magalu"],
  "other_buyers": {
    "intro": "Procuramos padrões que se repetem em avaliações fora da Amazon.",
    "praises": ["Praticidade para aparar no banho", "Não irrita a pele", "Leve"],
    "complaints": ["Bateria demora para carregar", "Refil considerado caro"],
    "sources": ["Reclame Aqui", "Mercado Livre", "Magalu"],
    "none_found": false
  }
}
```

Regras: `criteria` tem **exatamente 5** itens; `weight` soma 100; `score` = média ponderada arredondada a 1 casa
(aqui: 8,0·0,30 + 8,5·0,20 + 7,0·0,15 + 7,5·0,15 + 8,0·0,20 = 7,875 → 7,9); `product_slug` existe em `products`;
`pros`/`cons` com 3 a 6 itens cada; nunca "R$" em nenhum campo.

### 2.4 Esquema de `posts.comparison` (kind = comparativo ou lista) — exemplo completo

```json
{
  "criteria": [
    { "name": "Desempenho", "weight": 30 }, { "name": "Ergonomia e peso", "weight": 15 },
    { "name": "Durabilidade", "weight": 20 }, { "name": "Acessórios e garantia", "weight": 15 },
    { "name": "Custo-benefício", "weight": 20 }
  ],
  "products": [
    { "product_slug": "bosch-gsr-120-li-12v", "name": "Bosch GSR 120-LI", "role": "vencedor", "score": 8.4,
      "criteria_scores": [8.5, 8.5, 8.5, 8.0, 8.0],
      "one_liner": "A mais equilibrada: 2 baterias, maleta e torque de 30 Nm." },
    { "product_slug": "black-decker-ld12sp-b2", "name": "Black+Decker LD12SP", "role": "custo-beneficio", "score": 7.4,
      "criteria_scores": [7.0, 7.5, 7.0, 8.0, 8.0],
      "one_liner": "Para montar móvel e furar drywall de vez em quando." },
    { "product_slug": "makita-hp333dwye-12v", "name": "Makita HP333DWYE", "role": "premium", "score": 8.1,
      "criteria_scores": [8.5, 8.0, 8.5, 7.5, 7.5],
      "one_liner": "Tem impacto para alvenaria leve; paga-se pela marca e pela função extra." }
  ],
  "table": {
    "columns": ["Modelo", "Faixa de preço", "Torque máx.", "Baterias", "Impacto", "Garantia"],
    "rows": [
      ["Bosch GSR 120-LI", "{FAIXA:bosch-gsr-120-li-12v}", "30 Nm", "2 × 1,5 Ah", "Não", "12 meses + 6 com registro"],
      ["Black+Decker LD12SP", "{FAIXA:black-decker-ld12sp-b2}", "20 Nm", "1 × 1,5 Ah", "Não", "24 meses"],
      ["Makita HP333DWYE", "{FAIXA:makita-hp333dwye-12v}", "30 Nm", "2 × 1,5 Ah", "Sim", "12 meses"]
    ]
  },
  "winner_slug": "bosch-gsr-120-li-12v",
  "verdict_by_profile": [
    { "profile": "Se você monta móvel, pendura quadro e troca fechadura de vez em quando", "pick_slug": "black-decker-ld12sp-b2", "reason": "Resolve o uso doméstico leve por menos." },
    { "profile": "Se você quer uma ferramenta para a vida toda e já tem outras Bosch 12 V", "pick_slug": "bosch-gsr-120-li-12v", "reason": "Melhor equilíbrio entre torque, bateria dupla e assistência." },
    { "profile": "Se você fura parede de tijolo com frequência", "pick_slug": "makita-hp333dwye-12v", "reason": "É a única das três com impacto." }
  ],
  "how_we_evaluated": "Comparação baseada em ficha técnica dos fabricantes, manuais, anúncios da Amazon Brasil e opiniões fora da Amazon. Sem teste físico. Nota editorial: média ponderada de 5 critérios (pesos da categoria Ferramentas)."
}
```

Regras: `comparativo` tem 2 a 3 `products`; `lista` tem 3 a 7. `role` ∈ {`vencedor`, `custo-beneficio`, `premium`,
`alternativa`, `nao-indicamos`} em comparativo; em `lista`, `role` é o selo ∈ {`escolha-do-editor`,
`melhor-custo-beneficio`, `melhor-premium`, `melhor-barato`, `melhor-para-iniciantes`, `melhor-compacto`,
`melhor-para-familias`, `melhor-silencioso`, `melhor-desempenho`, `sem-selo`} e no máximo 1 produto por selo (exceto
`sem-selo`). `winner_slug` ∈ `products[].product_slug`; `product_score` do post = `score` do vencedor. `table` é
obrigatória em comparativo e opcional em lista; `{FAIXA:slug}` só nas células da tabela (o gerador troca). A ordem de
`products` = ordem das linhas da tabela = ordem das seções do corpo. `criteria_scores` segue a ordem de `criteria`.

### 2.5 Tipos TS — `src/lib/pai-indica/types.ts`

```ts
export type PaiIndicaKind = "review" | "comparativo" | "lista";

export type Criterion = { name: string; weight: number; score: number; comment?: string };

export type OtherBuyers = {
  intro: string;
  praises: string[];
  complaints: string[];
  sources: string[];
  none_found: boolean;
};

export type ReviewData = {
  product_slug: string;
  score: number;
  criteria: [Criterion, Criterion, Criterion, Criterion, Criterion];
  pros: string[];
  cons: string[];
  ideal_for: string;
  not_ideal_for: string;
  verdict: string;
  how_we_evaluated: string;
  sources?: string[];
  other_buyers?: OtherBuyers;
};

export type ComparisonRole =
  | "vencedor" | "custo-beneficio" | "premium" | "alternativa" | "nao-indicamos"
  | "escolha-do-editor" | "melhor-custo-beneficio" | "melhor-premium" | "melhor-barato"
  | "melhor-para-iniciantes" | "melhor-compacto" | "melhor-para-familias" | "melhor-silencioso"
  | "melhor-desempenho" | "sem-selo";

export type ComparisonProduct = {
  product_slug: string;
  name: string;
  role: ComparisonRole;
  score: number;
  criteria_scores?: number[];
  one_liner?: string;
};

export type ComparisonData = {
  criteria: { name: string; weight: number }[];
  products: ComparisonProduct[];
  table?: { columns: string[]; rows: string[][] };
  winner_slug: string;
  verdict_by_profile: { profile: string; pick_slug: string; reason: string }[];
  how_we_evaluated: string;
};

export type FaqItem = { question: string; answer: string };

/** Linha de `posts` já tipada para o Pai Indica (subconjunto). */
export type PaiIndicaPost = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt: string | null;
  cover_image_url: string | null;
  kind: PaiIndicaKind;
  review: ReviewData | null;
  comparison: ComparisonData | null;
  product_category: string;
  product_subcategory: string;
  product_score: number;
  faq: FaqItem[] | null;
  publish_at: string | null;
  updated_at: string | null;
  reading_time: number | null;
};

export const roleLabels: Record<ComparisonRole, string> = {
  vencedor: "Nossa escolha", "custo-beneficio": "Melhor custo-benefício", premium: "Opção premium",
  alternativa: "Alternativa", "nao-indicamos": "Não indicamos",
  "escolha-do-editor": "Escolha do editor", "melhor-custo-beneficio": "Melhor custo-benefício",
  "melhor-premium": "Melhor premium", "melhor-barato": "Melhor barato", "melhor-para-iniciantes": "Melhor para iniciantes",
  "melhor-compacto": "Melhor compacto", "melhor-para-familias": "Melhor para famílias",
  "melhor-silencioso": "Melhor silencioso", "melhor-desempenho": "Melhor desempenho", "sem-selo": "",
};

export const kindLabels: Record<PaiIndicaKind, { label: string; help: string }> = {
  review: { label: "Review individual", help: "Um único produto a fundo, com nota por critério, prós, contras e veredito." },
  comparativo: { label: "Comparativo", help: "2 ou 3 produtos da mesma categoria lado a lado; dizemos qual compensa para cada perfil." },
  lista: { label: "Lista", help: "De 3 a 7 produtos ranqueados para um uso ou perfil, com selo para cada um." },
};
```

### 2.6 Função utilitária de nota — `src/lib/pai-indica/score.ts`

```ts
import type { Criterion } from "./types";

export function weightedScore(criteria: { weight: number; score: number }[]): number {
  const total = criteria.reduce((s, c) => s + c.weight, 0);
  if (total === 0) return 0;
  const sum = criteria.reduce((s, c) => s + c.weight * c.score, 0);
  return Math.round((sum / total) * 10) / 10;
}

export function formatScore(n: number): string {
  return n.toFixed(1).replace(".", ",");
}

export type ScoreBand = { min: number; max: number; label: string; text: string; tone: "bad" | "warn" | "ok" | "good" | "great" };

export const SCORE_BANDS: ScoreBand[] = [
  { min: 0, max: 5.9, label: "Não indicamos", tone: "bad", text: "Tem problema que compromete o uso ou a segurança." },
  { min: 6, max: 6.9, label: "Vale com ressalva", tone: "warn", text: "Resolve o básico, mas tem um ponto fraco real que pesa na decisão." },
  { min: 7, max: 7.9, label: "Bom, compensa o preço", tone: "ok", text: "Sem defeito grave; é a faixa da maioria das indicações daqui." },
  { min: 8, max: 8.9, label: "Muito bom", tone: "good", text: "Se destaca de verdade dentro da própria categoria." },
  { min: 9, max: 10, label: "Excelente", tone: "great", text: "Poucos produtos chegam aqui; indicação sem ressalva." },
];

export function bandOf(score: number): ScoreBand {
  return SCORE_BANDS.find((b) => score >= b.min && score <= b.max) ?? SCORE_BANDS[2]!;
}

export function validateCriteria(criteria: Criterion[], declared: number): string[] {
  const errs: string[] = [];
  if (criteria.length !== 5) errs.push("review.criteria precisa ter exatamente 5 itens");
  const w = criteria.reduce((s, c) => s + c.weight, 0);
  if (w !== 100) errs.push(`pesos somam ${w}, precisam somar 100`);
  const calc = weightedScore(criteria);
  if (Math.abs(calc - declared) > 0.15) errs.push(`score ${declared} difere da média ponderada ${calc}`);
  criteria.forEach((c) => { if (c.score < 0 || c.score > 10) errs.push(`critério ${c.name} fora de 0-10`); });
  return errs;
}
```

---

## 3. Taxonomia de produtos do pai

Arquivo: `src/lib/pai-indica/taxonomia.ts`. Slugs são **imutáveis** depois de publicados (entram em
`posts.product_category` / `product_subcategory` e nos filtros). Nome exibido pode mudar.

```ts
/**
 * Taxonomia de produto do Pai Indica. Diferente de `categories` (categoria editorial do blog):
 * aqui é "o que o pai está procurando para comprar". Usada pelo filtro de /pai-indica, pelos
 * pesos de critérios (criterios.ts) e pelo validador. Não apagar nem renomear slug publicado.
 */
export const productCategories = [
  { slug: "churrasco-e-cozinha", name: "Churrasco e Cozinha" },
  { slug: "ferramentas", name: "Ferramentas" },
  { slug: "carro-e-moto", name: "Carro e Moto" },
  { slug: "tecnologia", name: "Tecnologia" },
  { slug: "esporte-e-outdoor", name: "Esporte e Outdoor" },
  { slug: "bebe-e-crianca", name: "Bebê e Criança" },
  { slug: "casa-e-jardim", name: "Casa e Jardim" },
  { slug: "saude-do-homem", name: "Saúde do Homem" },
  { slug: "estilo-e-barba", name: "Estilo e Barba" },
  { slug: "livros-e-formacao", name: "Livros e Formação" },
] as const;

export type ProductCategory = (typeof productCategories)[number]["slug"];

export const productSubcategories = [
  // churrasco-e-cozinha
  { slug: "facas-e-cutelaria", name: "Facas e cutelaria", category: "churrasco-e-cozinha" },
  { slug: "churrasqueiras", name: "Churrasqueiras", category: "churrasco-e-cozinha" },
  { slug: "acessorios-de-churrasco", name: "Acessórios de churrasco", category: "churrasco-e-cozinha" },
  { slug: "chapas-e-grelhas", name: "Chapas e grelhas", category: "churrasco-e-cozinha" },
  { slug: "defumacao-e-temperos", name: "Defumação e temperos", category: "churrasco-e-cozinha" },
  { slug: "cervejeiras-e-bebidas", name: "Cervejeiras e bebidas", category: "churrasco-e-cozinha" },
  { slug: "panelas-e-ferro-fundido", name: "Panelas e ferro fundido", category: "churrasco-e-cozinha" },
  { slug: "eletroportateis", name: "Eletroportáteis", category: "churrasco-e-cozinha" },
  { slug: "cafe", name: "Café", category: "churrasco-e-cozinha" },
  // ferramentas
  { slug: "furadeiras-e-parafusadeiras", name: "Furadeiras e parafusadeiras", category: "ferramentas" },
  { slug: "jogos-de-ferramentas", name: "Jogos de ferramentas", category: "ferramentas" },
  { slug: "ferramentas-manuais", name: "Ferramentas manuais", category: "ferramentas" },
  { slug: "medicao-e-nivel", name: "Medição e nível", category: "ferramentas" },
  { slug: "eletrica", name: "Elétrica", category: "ferramentas" },
  { slug: "serras-e-esmerilhadeiras", name: "Serras e esmerilhadeiras", category: "ferramentas" },
  { slug: "organizacao-e-maletas", name: "Organização e maletas", category: "ferramentas" },
  { slug: "epi-e-seguranca", name: "EPI e segurança", category: "ferramentas" },
  // carro-e-moto
  { slug: "eletronicos-automotivos", name: "Eletrônicos automotivos", category: "carro-e-moto" },
  { slug: "emergencia-e-manutencao", name: "Emergência e manutenção", category: "carro-e-moto" },
  { slug: "limpeza-e-estetica", name: "Limpeza e estética", category: "carro-e-moto" },
  { slug: "conforto-e-organizacao", name: "Conforto e organização", category: "carro-e-moto" },
  { slug: "cadeirinhas-e-transporte-infantil", name: "Cadeirinhas e transporte infantil", category: "carro-e-moto" },
  { slug: "moto-e-capacetes", name: "Moto e capacetes", category: "carro-e-moto" },
  { slug: "som-e-multimidia", name: "Som e multimídia", category: "carro-e-moto" },
  // tecnologia
  { slug: "celulares-e-acessorios", name: "Celulares e acessórios", category: "tecnologia" },
  { slug: "fones-e-audio", name: "Fones e áudio", category: "tecnologia" },
  { slug: "notebooks-e-perifericos", name: "Notebooks e periféricos", category: "tecnologia" },
  { slug: "smartwatches", name: "Smartwatches", category: "tecnologia" },
  { slug: "casa-inteligente", name: "Casa inteligente", category: "tecnologia" },
  { slug: "tv-e-video", name: "TV e vídeo", category: "tecnologia" },
  { slug: "games", name: "Games", category: "tecnologia" },
  { slug: "mochilas-e-cases", name: "Mochilas e cases", category: "tecnologia" },
  { slug: "energia-e-carregadores", name: "Energia e carregadores", category: "tecnologia" },
  // esporte-e-outdoor
  { slug: "corrida-e-tenis", name: "Corrida e tênis", category: "esporte-e-outdoor" },
  { slug: "musculacao-em-casa", name: "Musculação em casa", category: "esporte-e-outdoor" },
  { slug: "ciclismo", name: "Ciclismo", category: "esporte-e-outdoor" },
  { slug: "camping-e-trilha", name: "Camping e trilha", category: "esporte-e-outdoor" },
  { slug: "pesca", name: "Pesca", category: "esporte-e-outdoor" },
  { slug: "futebol-e-esportes-com-filhos", name: "Futebol e esportes com os filhos", category: "esporte-e-outdoor" },
  { slug: "garrafas-e-coolers", name: "Garrafas e coolers", category: "esporte-e-outdoor" },
  { slug: "relogios-e-monitores", name: "Relógios e monitores", category: "esporte-e-outdoor" },
  // bebe-e-crianca
  { slug: "cadeirinhas-de-carro", name: "Cadeirinhas de carro", category: "bebe-e-crianca" },
  { slug: "carrinhos-e-cangurus", name: "Carrinhos e cangurus", category: "bebe-e-crianca" },
  { slug: "quarto-e-sono", name: "Quarto e sono", category: "bebe-e-crianca" },
  { slug: "banho-e-higiene", name: "Banho e higiene", category: "bebe-e-crianca" },
  { slug: "alimentacao", name: "Alimentação", category: "bebe-e-crianca" },
  { slug: "brinquedos-e-jogos", name: "Brinquedos e jogos", category: "bebe-e-crianca" },
  { slug: "seguranca-e-monitoramento", name: "Segurança e monitoramento", category: "bebe-e-crianca" },
  { slug: "passeio-e-viagem", name: "Passeio e viagem", category: "bebe-e-crianca" },
  // casa-e-jardim
  { slug: "limpeza-externa", name: "Limpeza externa", category: "casa-e-jardim" },
  { slug: "jardim-e-quintal", name: "Jardim e quintal", category: "casa-e-jardim" },
  { slug: "piscina", name: "Piscina", category: "casa-e-jardim" },
  { slug: "seguranca-residencial", name: "Segurança residencial", category: "casa-e-jardim" },
  { slug: "climatizacao", name: "Climatização", category: "casa-e-jardim" },
  { slug: "iluminacao", name: "Iluminação", category: "casa-e-jardim" },
  { slug: "organizacao-e-garagem", name: "Organização e garagem", category: "casa-e-jardim" },
  { slug: "lavanderia-e-utilidades", name: "Lavanderia e utilidades", category: "casa-e-jardim" },
  // saude-do-homem
  { slug: "monitoramento", name: "Monitoramento (pressão, balança, oxímetro)", category: "saude-do-homem" },
  { slug: "suplementos", name: "Suplementos", category: "saude-do-homem" },
  { slug: "sono-e-descanso", name: "Sono e descanso", category: "saude-do-homem" },
  { slug: "postura-e-dor", name: "Postura e dor", category: "saude-do-homem" },
  { slug: "higiene-bucal", name: "Higiene bucal", category: "saude-do-homem" },
  { slug: "primeiros-socorros", name: "Primeiros socorros", category: "saude-do-homem" },
  { slug: "massagem-e-recuperacao", name: "Massagem e recuperação", category: "saude-do-homem" },
  // estilo-e-barba
  { slug: "barbeadores-e-aparadores", name: "Barbeadores e aparadores", category: "estilo-e-barba" },
  { slug: "cuidados-com-a-barba", name: "Cuidados com a barba", category: "estilo-e-barba" },
  { slug: "perfumes-e-desodorantes", name: "Perfumes e desodorantes", category: "estilo-e-barba" },
  { slug: "cabelo-e-maquinas", name: "Cabelo e máquinas", category: "estilo-e-barba" },
  { slug: "pele-e-protetor-solar", name: "Pele e protetor solar", category: "estilo-e-barba" },
  { slug: "relogios-e-carteiras", name: "Relógios e carteiras", category: "estilo-e-barba" },
  { slug: "calcados-e-roupas", name: "Calçados e roupas", category: "estilo-e-barba" },
  // livros-e-formacao
  { slug: "paternidade", name: "Paternidade", category: "livros-e-formacao" },
  { slug: "casamento-e-familia", name: "Casamento e família", category: "livros-e-formacao" },
  { slug: "financas-pessoais", name: "Finanças pessoais", category: "livros-e-formacao" },
  { slug: "carreira-e-lideranca", name: "Carreira e liderança", category: "livros-e-formacao" },
  { slug: "fe-e-virtudes", name: "Fé e virtudes", category: "livros-e-formacao" },
  { slug: "biografias", name: "Biografias", category: "livros-e-formacao" },
  { slug: "habitos-e-disciplina", name: "Hábitos e disciplina", category: "livros-e-formacao" },
  { slug: "infantis-para-ler-com-os-filhos", name: "Infantis para ler com os filhos", category: "livros-e-formacao" },
] as const;

export type ProductSubcategory = (typeof productSubcategories)[number]["slug"];

export function categoryName(slug: string): string {
  return productCategories.find((c) => c.slug === slug)?.name ?? slug;
}
export function subcategoryName(slug: string): string {
  return productSubcategories.find((s) => s.slug === slug)?.name ?? slug;
}
export function subcategoriesOf(category: string) {
  return productSubcategories.filter((s) => s.category === category);
}
export function isValidPair(category: string, sub: string): boolean {
  return productSubcategories.some((s) => s.slug === sub && s.category === category);
}
```

### 3.2 Pesos por categoria — `src/lib/pai-indica/criterios.ts`

```ts
import type { ProductCategory } from "./taxonomia";

export type CriterionDef = { name: string; weight: number };

/** 5 critérios por categoria; pesos somam 100. Nome pode ser especializado no texto, peso não. */
export const criteriaByCategory: Record<ProductCategory, [CriterionDef, CriterionDef, CriterionDef, CriterionDef, CriterionDef]> = {
  "churrasco-e-cozinha": [
    { name: "Desempenho", weight: 30 }, { name: "Material e acabamento", weight: 20 },
    { name: "Facilidade de uso e limpeza", weight: 15 }, { name: "Durabilidade e garantia", weight: 15 },
    { name: "Custo-benefício", weight: 20 },
  ],
  ferramentas: [
    { name: "Desempenho", weight: 30 }, { name: "Ergonomia e peso", weight: 15 },
    { name: "Durabilidade", weight: 20 }, { name: "Acessórios e garantia", weight: 15 },
    { name: "Custo-benefício", weight: 20 },
  ],
  "carro-e-moto": [
    { name: "Funcionalidade", weight: 30 }, { name: "Instalação e praticidade", weight: 15 },
    { name: "Qualidade de construção", weight: 20 }, { name: "Segurança e certificação", weight: 15 },
    { name: "Custo-benefício", weight: 20 },
  ],
  tecnologia: [
    { name: "Desempenho", weight: 25 }, { name: "Recursos e conectividade", weight: 20 },
    { name: "Bateria e autonomia", weight: 15 }, { name: "Construção e conforto", weight: 15 },
    { name: "Custo-benefício", weight: 25 },
  ],
  "esporte-e-outdoor": [
    { name: "Desempenho no uso", weight: 30 }, { name: "Conforto", weight: 20 },
    { name: "Resistência e materiais", weight: 20 }, { name: "Praticidade", weight: 10 },
    { name: "Custo-benefício", weight: 20 },
  ],
  "bebe-e-crianca": [
    { name: "Segurança e certificação", weight: 35 }, { name: "Praticidade para o pai", weight: 20 },
    { name: "Conforto da criança", weight: 15 }, { name: "Durabilidade", weight: 10 },
    { name: "Custo-benefício", weight: 20 },
  ],
  "casa-e-jardim": [
    { name: "Eficiência", weight: 30 }, { name: "Praticidade", weight: 20 },
    { name: "Ruído e consumo", weight: 15 }, { name: "Durabilidade", weight: 15 },
    { name: "Custo-benefício", weight: 20 },
  ],
  "saude-do-homem": [
    { name: "Eficácia percebida", weight: 30 }, { name: "Precisão e confiabilidade", weight: 20 },
    { name: "Conforto e praticidade", weight: 15 }, { name: "Segurança e materiais", weight: 15 },
    { name: "Custo-benefício", weight: 20 },
  ],
  "estilo-e-barba": [
    { name: "Resultado", weight: 30 }, { name: "Conforto na pele", weight: 20 },
    { name: "Bateria e manutenção", weight: 15 }, { name: "Acabamento e durabilidade", weight: 15 },
    { name: "Custo-benefício", weight: 20 },
  ],
  "livros-e-formacao": [
    { name: "Profundidade do conteúdo", weight: 30 }, { name: "Aplicação prática", weight: 25 },
    { name: "Clareza e escrita", weight: 20 }, { name: "Alinhamento com a formação do pai", weight: 15 },
    { name: "Custo-benefício", weight: 10 },
  ],
};
```

Teste rápido (adicionar em `src/lib/pai-indica/criterios.test.ts` se o repo tiver Vitest; senão, rodar num
`node -e` após o build): para cada categoria, `weights.reduce(+) === 100` e `length === 5`.

---

## 4. Componentes (esqueletos TSX)

Pasta: `src/components/pai-indica/`. Todos usam Tailwind 4 com os tokens da Fase 1 (`--color-primary` #14505C,
`--color-accent` #D9822B, `--color-surface`, `--color-muted`, etc.; conferir nomes em `src/styles.css`). Ícones:
`lucide-react` (já no projeto). Nada de HTML bruto vindo do banco nesses componentes: tudo renderizado como texto.

### 4.1 `filterVisibility.ts` (portado do Portal da AI)

```ts
// src/components/pai-indica/filterVisibility.ts
/** Vários filtros ao mesmo tempo: cada um liga/desliga a própria marca data-hide-<chave>. */
export function setHidden(card: HTMLElement, key: string, hidden: boolean): void {
  const attr = `hide${key.charAt(0).toUpperCase()}${key.slice(1)}`;
  if (hidden) card.dataset[attr] = "1"; else delete card.dataset[attr];
  const anyHidden = Object.keys(card.dataset).some((k) => k.startsWith("hide"));
  card.style.display = anyHidden ? "none" : "";
}
export function cardsOf(rootId: string): HTMLElement[] {
  const root = document.getElementById(rootId);
  return root ? Array.from(root.querySelectorAll<HTMLElement>("article[data-kind]")) : [];
}
export function clearKey(rootId: string, key: string): void {
  cardsOf(rootId).forEach((c) => setHidden(c, key, false));
}
export function chipClass(active: boolean, small = false): string {
  return `inline-flex items-center whitespace-nowrap rounded-lg border font-medium transition ${
    small ? "h-7 px-2.5 text-[11px]" : "h-8 px-3 text-xs"
  } ${active ? "border-primary bg-primary text-white" : "border-border bg-surface text-muted hover:border-accent/60 hover:text-foreground"}`;
}
```

### 4.2 `ReviewBadge.tsx`

```tsx
// src/components/pai-indica/ReviewBadge.tsx
import { Star } from "lucide-react";
import { bandOf, formatScore } from "@/lib/pai-indica/score";

/** Selo de nota 0-10 no card e no topo da página. `size="lg"` para o hero do post. */
export function ReviewBadge({ score, size = "sm", showLabel = false }: { score: number; size?: "sm" | "lg"; showLabel?: boolean }) {
  const band = bandOf(score);
  const base = size === "lg"
    ? "gap-2 rounded-xl px-3 py-2 text-xl font-display font-bold"
    : "gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold";
  return (
    <span className={`inline-flex items-center bg-[#1F2429]/90 text-white backdrop-blur-sm ${base}`} title={`${formatScore(score)} de 10 — ${band.label}`}>
      <Star className={size === "lg" ? "h-5 w-5 text-accent" : "h-3 w-3 text-accent"} fill="currentColor" aria-hidden />
      <span aria-label={`Nota ${formatScore(score)} de 10`}>{formatScore(score)}</span>
      {showLabel && <span className="ml-1 text-xs font-normal text-white/80">{band.label}</span>}
    </span>
  );
}
```

### 4.3 `ScoreScaleNote.tsx` (retrátil, fechado por padrão)

```tsx
// src/components/pai-indica/ScoreScaleNote.tsx
import { ChevronDown } from "lucide-react";
import { SCORE_BANDS } from "@/lib/pai-indica/score";

export function ScoreScaleNote({ className = "" }: { className?: string }) {
  return (
    <details className={`group rounded-xl border border-border bg-surface ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-accent">Como ler a nota</span>
          <span className="mt-1 block font-display text-lg font-bold">Nota de 0 a 10, com casa decimal de propósito</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="px-4 pb-5 sm:px-6 sm:pb-6">
        <p className="max-w-3xl text-sm leading-relaxed text-muted">
          A nota não é a avaliação de estrelas da Amazon: é a nossa análise, com 5 critérios e pesos declarados em
          "Como avaliamos", a partir de ficha técnica, manual, anúncio e opiniões de compradores fora da Amazon,
          sem teste físico. A casa decimal (ex.: 7,8) mostra a diferença entre dois produtos que, arredondados,
          pareceriam iguais.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SCORE_BANDS.map((b) => (
            <div key={b.label} className="rounded-lg border border-border bg-background p-3.5">
              <p className="font-mono text-xs font-semibold text-accent">
                {b.min.toFixed(1).replace(".", ",")} a {b.max.toFixed(1).replace(".", ",")}
              </p>
              <p className="mt-1 font-display text-sm font-semibold">{b.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
```

### 4.4 `ProductCategoryFilter.tsx` e `PaiIndicaFilter.tsx` (filtro em duas camadas, no cliente)

```tsx
// src/components/pai-indica/ProductCategoryFilter.tsx
import { useEffect, useState } from "react";
import { cardsOf, chipClass, clearKey, setHidden } from "./filterVisibility";

type Cat = { slug: string; name: string };
type Sub = { slug: string; name: string; category: string };

export function ProductCategoryFilter({ categories, subcategories, rootId, className = "" }:
  { categories: Cat[]; subcategories: Sub[]; rootId: string; className?: string }) {
  const [cat, setCat] = useState("todos");
  const [sub, setSub] = useState("todos");

  function apply(c: string, s: string) {
    cardsOf(rootId).forEach((card) => {
      const okC = c === "todos" || card.dataset.productCategory === c;
      const okS = s === "todos" || card.dataset.productSubcategory === s;
      setHidden(card, "prod", !(okC && okS));
    });
  }
  useEffect(() => () => clearKey(rootId, "prod"), [rootId]);

  const subs = subcategories.filter((s) => s.category === cat);
  return (
    <div className={className}>
      <nav aria-label="Filtrar por categoria de produto">
        <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
          <li><button type="button" className={chipClass(cat === "todos")} onClick={() => { setCat("todos"); setSub("todos"); apply("todos", "todos"); }}>Todas</button></li>
          {categories.map((c) => (
            <li key={c.slug}><button type="button" className={chipClass(cat === c.slug)} onClick={() => { setCat(c.slug); setSub("todos"); apply(c.slug, "todos"); }}>{c.name}</button></li>
          ))}
        </ul>
      </nav>
      {cat !== "todos" && subs.length > 0 && (
        <nav aria-label="Filtrar por tipo de produto" className="mt-2">
          <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
            <li><button type="button" className={chipClass(sub === "todos", true)} onClick={() => { setSub("todos"); apply(cat, "todos"); }}>Todos</button></li>
            {subs.map((s) => (
              <li key={s.slug}><button type="button" className={chipClass(sub === s.slug, true)} onClick={() => { setSub(s.slug); apply(cat, s.slug); }}>{s.name}</button></li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
```

```tsx
// src/components/pai-indica/PaiIndicaFilter.tsx
import { useEffect, useState } from "react";
import { kindLabels, type PaiIndicaKind } from "@/lib/pai-indica/types";
import { ProductCategoryFilter } from "./ProductCategoryFilter";
import { cardsOf, chipClass, clearKey, setHidden } from "./filterVisibility";

export type PaiIndicaFilterData = Record<PaiIndicaKind | "todos", {
  categories: { slug: string; name: string }[];
  subcategories: { slug: string; name: string; category: string }[];
}>;

/**
 * Primeiro o tipo (Todos / Review individual / Comparativo / Lista); depois categoria e
 * subcategoria de produto, só com as opções que existem dentro do tipo escolhido.
 * Filtra no navegador escondendo <article data-kind data-product-category data-product-subcategory>.
 */
export function PaiIndicaFilter({ data, rootId, className = "" }: { data: PaiIndicaFilterData; rootId: string; className?: string }) {
  const [kind, setKind] = useState<"todos" | PaiIndicaKind>("todos");
  function select(next: "todos" | PaiIndicaKind) {
    setKind(next);
    cardsOf(rootId).forEach((card) => setHidden(card, "kind", !(next === "todos" || card.dataset.kind === next)));
  }
  useEffect(() => () => clearKey(rootId, "kind"), [rootId]);
  const kinds = Object.keys(kindLabels) as PaiIndicaKind[];
  return (
    <div className={className}>
      <nav aria-label="Filtrar por tipo de Pai Indica">
        <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto pb-1">
          <li><button type="button" aria-pressed={kind === "todos"} className={chipClass(kind === "todos")} onClick={() => select("todos")}>Todos</button></li>
          {kinds.map((k) => (
            <li key={k}><button type="button" aria-pressed={kind === k} title={kindLabels[k].help} className={chipClass(kind === k)} onClick={() => select(k)}>{kindLabels[k].label}</button></li>
          ))}
        </ul>
      </nav>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        {kind === "todos" ? kinds.map((k) => `${kindLabels[k].label}: ${kindLabels[k].help}`).join(" ") : kindLabels[kind].help}
      </p>
      <ProductCategoryFilter key={kind} categories={data[kind].categories} subcategories={data[kind].subcategories} rootId={rootId} className="mt-3" />
    </div>
  );
}
```

### 4.5 `AffiliateButton.tsx`

```tsx
// src/components/pai-indica/AffiliateButton.tsx
import { ShoppingBag } from "lucide-react";

/** Texto SEMPRE "Comprar agora na Amazon" (sem preço, sem nome de produto). rel sponsored. */
export function AffiliateButton({ href, className = "", size = "md" }: { href: string; className?: string; size?: "md" | "lg" }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer sponsored nofollow"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-accent font-bold text-white shadow-md transition-transform hover:scale-[1.02] ${
        size === "lg" ? "min-h-14 px-8 py-4 text-base" : "min-h-12 px-6 py-3 text-sm"} ${className}`}>
      <ShoppingBag className="h-4 w-4" aria-hidden />
      Comprar agora na Amazon
    </a>
  );
}
```

### 4.6 `CriteriaScores.tsx`

```tsx
// src/components/pai-indica/CriteriaScores.tsx
import type { Criterion } from "@/lib/pai-indica/types";
import { formatScore } from "@/lib/pai-indica/score";

export function CriteriaScores({ criteria, total }: { criteria: Criterion[]; total: number }) {
  return (
    <section aria-labelledby="criterios-title" className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="criterios-title" className="font-display text-2xl font-bold">Nota por critério</h2>
        <span className="font-display text-3xl font-bold text-primary">{formatScore(total)}<span className="text-base text-muted">/10</span></span>
      </div>
      <ul className="mt-4 space-y-3">
        {criteria.map((c) => (
          <li key={c.name}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{c.name} <span className="text-xs text-muted">(peso {c.weight})</span></span>
              <span className="font-mono font-semibold">{formatScore(c.score)}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border" role="meter" aria-valuemin={0} aria-valuemax={10} aria-valuenow={c.score} aria-label={c.name}>
              <div className="h-full rounded-full bg-primary" style={{ width: `${(c.score / 10) * 100}%` }} />
            </div>
            {c.comment && <p className="mt-1 text-xs leading-relaxed text-muted">{c.comment}</p>}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">Nota final = média ponderada dos 5 critérios. Não é a estrela da Amazon.</p>
    </section>
  );
}
```

### 4.7 `ProsCons.tsx`

```tsx
// src/components/pai-indica/ProsCons.tsx
import { CheckCircle2, XCircle } from "lucide-react";

export function ProsCons({ pros, cons }: { pros: string[]; cons: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-2xl border border-success/30 bg-success/5 p-5">
        <h3 className="font-display text-lg font-bold text-success">Pontos fortes</h3>
        <ul className="mt-3 space-y-2 text-sm">{pros.map((p) => (
          <li key={p} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />{p}</li>))}
        </ul>
      </section>
      <section className="rounded-2xl border border-alert/30 bg-alert/5 p-5">
        <h3 className="font-display text-lg font-bold text-alert">Pontos de atenção</h3>
        <ul className="mt-3 space-y-2 text-sm">{cons.map((c) => (
          <li key={c} className="flex gap-2"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-alert" aria-hidden />{c}</li>))}
        </ul>
      </section>
    </div>
  );
}
```

### 4.8 `ComparisonTable.tsx`

```tsx
// src/components/pai-indica/ComparisonTable.tsx
import type { ComparisonData } from "@/lib/pai-indica/types";
import { roleLabels } from "@/lib/pai-indica/types";
import { formatScore } from "@/lib/pai-indica/score";

/** Tabela de especificações + linha de nota e selo. `faixas` já resolvidas (slug → "de R$ X a R$ Y"). */
export function ComparisonTable({ data, faixas }: { data: ComparisonData; faixas: Record<string, string> }) {
  if (!data.table) return null;
  const rows = data.table.rows.map((r) => r.map((cell) => cell.replace(/\{FAIXA:([a-z0-9-]+)\}/g, (_, s) => faixas[s] ?? "consulte na Amazon")));
  return (
    <div className="table-wrap overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface">
          <tr>{data.table.columns.map((c) => <th key={c} scope="col" className="px-3 py-2 text-left font-semibold">{c}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const p = data.products[i];
            const winner = p?.product_slug === data.winner_slug;
            return (
              <tr key={i} className={winner ? "bg-accent/10" : ""}>
                {r.map((cell, j) => <td key={j} className="px-3 py-2 align-top">{j === 0 && p ? (
                  <span className="flex flex-col"><span className="font-semibold">{cell}</span>
                    <span className="text-xs text-muted">{roleLabels[p.role]} · nota {formatScore(p.score)}</span></span>) : cell}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="px-3 py-2 text-xs text-muted">Faixas de preço pesquisadas na internet (várias lojas), não o preço da Amazon. O valor do dia aparece no botão.</p>
    </div>
  );
}
```

### 4.9 `VerdictByProfile.tsx`

```tsx
// src/components/pai-indica/VerdictByProfile.tsx
import type { ComparisonData } from "@/lib/pai-indica/types";
import { AffiliateButton } from "./AffiliateButton";

export function VerdictByProfile({ data, hrefs }: { data: ComparisonData; hrefs: Record<string, string> }) {
  const byslug = new Map(data.products.map((p) => [p.product_slug, p]));
  return (
    <section aria-labelledby="qual-comprar" className="space-y-4">
      <h2 id="qual-comprar" className="font-display text-2xl font-bold">Qual comprar</h2>
      {data.verdict_by_profile.map((v) => {
        const p = byslug.get(v.pick_slug);
        return (
          <div key={v.profile} className="rounded-2xl border border-border bg-surface p-5">
            <p className="font-semibold">{v.profile}</p>
            <p className="mt-1 text-sm text-muted">Escolha <strong className="text-foreground">{p?.name ?? v.pick_slug}</strong>: {v.reason}</p>
            {hrefs[v.pick_slug] && <AffiliateButton href={hrefs[v.pick_slug]!} className="mt-3" />}
          </div>
        );
      })}
    </section>
  );
}
```

### 4.10 `PaiIndicaCard.tsx` (card da listagem, com data-attributes)

```tsx
// src/components/pai-indica/PaiIndicaCard.tsx
import { Link } from "@tanstack/react-router";
import type { PaiIndicaPost } from "@/lib/pai-indica/types";
import { kindLabels } from "@/lib/pai-indica/types";
import { categoryName, subcategoryName } from "@/lib/pai-indica/taxonomia";
import { ReviewBadge } from "./ReviewBadge";

export function PaiIndicaCard({ post }: { post: PaiIndicaPost }) {
  return (
    <article data-kind={post.kind} data-product-category={post.product_category} data-product-subcategory={post.product_subcategory}
      className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:shadow-lg">
      <Link to="/pai-indica/$slug" params={{ slug: post.slug }} className="block">
        <div className="relative aspect-[16/10] bg-background">
          {post.cover_image_url && <img src={post.cover_image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <ReviewBadge score={post.product_score} />
            <span title={kindLabels[post.kind].help} className="rounded-md bg-white/90 px-1.5 py-1 text-[10px] font-semibold text-[#1B1F23]">{kindLabels[post.kind].label}</span>
          </div>
        </div>
        <div className="p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-accent">{categoryName(post.product_category)} · {subcategoryName(post.product_subcategory)}</p>
          <h3 className="mt-1 font-display text-lg font-bold leading-snug group-hover:text-primary">{post.title}</h3>
          {post.excerpt && <p className="mt-2 line-clamp-3 text-sm text-muted">{post.excerpt}</p>}
        </div>
      </Link>
    </article>
  );
}
```

---

## 5. Páginas

### 5.1 `/pai-indica` — listagem sem paginação, filtros no cliente

Arquivos:
- `src/lib/pai-indica.functions.ts` — server functions (`createServerFn` do TanStack Start; copie o padrão de
  `src/lib/hub.functions.ts` da Fase 1).
- `src/routes/_site/pai-indica/index.tsx` — rota.
- `src/pages/PaiIndicaListPage.tsx` — componente de página.

```ts
// src/lib/pai-indica.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { supabaseServer } from "@/lib/db"; // nome real: conferir em src/lib/db.ts
import type { PaiIndicaPost } from "@/lib/pai-indica/types";

export const getPaiIndicaList = createServerFn({ method: "GET" }).handler(async (): Promise<PaiIndicaPost[]> => {
  const { data, error } = await supabaseServer
    .from("posts")
    .select("id,slug,title,subtitle,excerpt,cover_image_url,kind,product_category,product_subcategory,product_score,publish_at,updated_at,reading_time")
    .in("kind", ["review", "comparativo", "lista"])
    .eq("status", "published")
    .lte("publish_at", new Date().toISOString())
    .order("publish_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as PaiIndicaPost[];
});
```

Sem paginação: até 500 cards vão no HTML (mesma decisão do Portal da AI); quando passar de 300 publicados, abrir
tarefa na Fase 8 para `limit` + "carregar mais". A listagem monta `PaiIndicaFilterData` a partir dos posts
carregados (só categorias/subcategorias que existem em cada kind), ordenadas pela ordem da taxonomia.

```tsx
// src/routes/_site/pai-indica/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { getPaiIndicaList } from "@/lib/pai-indica.functions";
import PaiIndicaListPage from "@/pages/PaiIndicaListPage";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/pai-indica/")({
  loader: async () => ({ posts: await getPaiIndicaList() }),
  head: () => ({
    meta: [
      { title: `Pai Indica: reviews e comparativos com nota de 0 a 10 | ${SITE_NAME}` },
      { name: "description", content: "Reviews, comparativos e listas de produtos para o pai: nota por critério, prós e contras, faixa de preço pesquisada e link direto para comprar." },
      { property: "og:url", content: `${SITE_URL}/pai-indica` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/pai-indica` }],
  }),
  component: () => <PaiIndicaListPage posts={Route.useLoaderData().posts} />,
});
```

```tsx
// src/pages/PaiIndicaListPage.tsx (estrutura)
// 1. Hero curto: "Pai Indica" + frase da promessa + <ScoreScaleNote />.
// 2. <PaiIndicaFilter data={filterData} rootId="pai-indica-grid" />
// 3. <div id="pai-indica-grid" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map(p => <PaiIndicaCard />)}</div>
// 4. Rodapé da seção: link para /loja ("O pai também quer desconto") e /politica-de-afiliados.
// filterData: para cada kind (e "todos"), categories = únicas em posts filtrados, subcategories idem, na ordem de taxonomia.ts.
```

### 5.2 `/pai-indica/$slug` — página de review individual e de comparativo/lista

Arquivos: `src/routes/_site/pai-indica/$slug.tsx` (loader + head com JSON-LD) e `src/pages/PaiIndicaPostPage.tsx`.
O corpo (`posts.body`, Tiptap) é renderizado pelo mesmo caminho do blog (`src/lib/tiptap-html.ts` +
`ToolEmbedHost` para `fotosModelos`/`buyCard`/`galeriaProduto`, herdados do Vocação de Mãe; conferir que a Fase 1 os
manteve). `enhanceReviewBody` (`src/lib/review-body.ts`) continua sendo aplicado. Os blocos estruturados
(`CriteriaScores`, `ProsCons`, `ComparisonTable`, `VerdictByProfile`) são renderizados **pelo React a partir do JSON**,
em posições fixas em volta do corpo.

Loader: `getPostFull({slug})` (Fase 1) + `getProductsBySlugs(slugs)` para os produtos do post
(`select slug,name,brand,affiliate_url,image_url,images,price_min,price_max,price_range_checked_at`), onde
`slugs` = `review.product_slug` ou `comparison.products[].product_slug`. Se `kind` não for review/comparativo/lista,
`throw redirect({ to: "/post/$slug" })`. Na rota `/post/$slug` fazer o inverso: se o post for Pai Indica,
`redirect` 301 para `/pai-indica/$slug` (canônico único).

**Layout do review individual (ordem obrigatória):**

1. Cabeçalho: categoria/subcategoria (links para `/pai-indica` com filtro por hash `#cat=…`), título, subtítulo,
   `ReviewBadge size="lg" showLabel`, autor, data, tempo de leitura.
2. Capa composta (`cover_image_url`, 16:9, `object-fit: contain` sobre fundo areia).
3. Abertura: os 2 primeiros parágrafos do `body`.
4. "Em 3 pontos" (do `body`).
5. **Caixa de veredito** (React, de `review`): `verdict`, `ideal_for`, `not_ideal_for`, `AffiliateButton size="lg"`.
6. Galeria/foto oficial do produto (`galeriaProduto` do body, via `enhanceReviewBody`).
7. `CriteriaScores`.
8. Restante do `body`: ficha técnica (tabela), seções de análise com botões `btn-comprar`, "O que dizem outros
   compradores", "Variação de preço" (faixa, com observação), "Para quem vale a pena", "Como avaliamos", "Outros".
9. `ProsCons` (de `review.pros/cons`) — renderizado logo após a seção "Pontos fortes/atenção" do body, ou, se o body
   não tiver essa seção, antes de "Variação de preço".
10. FAQ (`faq`, acordeão existente do blog) e quiz (se houver).
11. `StickyBuyBar` (herdado) com o produto único.
12. "Continue no Pai Indica": 3 posts da mesma `product_category` + 3 de outras.

**Layout do comparativo e da lista (ordem = Padrão B):**

1. Cabeçalho (igual), com `ReviewBadge` da nota do vencedor e rótulo "Comparativo" ou "Lista".
2. Capa composta.
3. Abertura (2 parágrafos).
4. "Em 3 pontos".
5. Fotos lado a lado (`fotosModelos`, com faixa e botão por produto).
6. "Os N modelos que comparamos" + `ComparisonTable` (React, de `comparison.table`; o body também pode trazer a
   tabela Tiptap — nesse caso o renderer **remove** a primeira `table` do body para não duplicar).
7. Uma seção por produto (body): H2, foto oficial, botão "Comprar agora na Amazon", análise, pontos fortes,
   pontos de atenção.
8. "Por que isso importa antes de comprar" (body, com links para `/post/…`).
9. "Variação de preço" (body: tabela de faixas + observação + botões).
10. `VerdictByProfile` (React) **seguido** do texto "Qual comprar" do body.
11. "Como avaliamos" (body) + lista dos 5 critérios com peso (React, de `comparison.criteria`).
12. FAQ e quiz.
13. "Onde comprar" (`buyCard` por produto, via `enhanceReviewBody`).
14. "Continue no Pai Indica".

Ligação com a Loja (Fase 3): cada produto linka `/loja/<slug>`; se a Fase 3 ainda não existir quando esta fase for
executada, os links continuam sendo gravados (a rota passa a responder depois) e o `AffiliateButton` usa
`products.affiliate_url` direto.

```tsx
// src/routes/_site/pai-indica/$slug.tsx (esqueleto)
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { getPostFull, getPostSeo } from "@/lib/seo.functions";
import { getProductsBySlugs } from "@/lib/pai-indica.functions";
import PaiIndicaPostPage from "@/pages/PaiIndicaPostPage";
import { paiIndicaJsonLd } from "@/lib/pai-indica/jsonld";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/_site/pai-indica/$slug")({
  loader: async ({ params }) => {
    const [seo, full] = await Promise.all([getPostSeo({ data: { slug: params.slug } }), getPostFull({ data: { slug: params.slug } })]);
    if (!seo || !full) throw notFound();
    if (!["review", "comparativo", "lista"].includes(full.kind)) throw redirect({ to: "/post/$slug", params, statusCode: 301 });
    const slugs = full.kind === "review" ? [full.review?.product_slug] : (full.comparison?.products ?? []).map((p) => p.product_slug);
    const products = await getProductsBySlugs({ data: { slugs: slugs.filter(Boolean) as string[] } });
    return { seo, full, products };
  },
  head: ({ params, loaderData }) => {
    const url = `${SITE_URL}/pai-indica/${params.slug}`;
    const title = loaderData?.seo?.title ?? `Pai Indica | ${SITE_NAME}`;
    const description = loaderData?.seo?.description ?? "";
    return {
      meta: [{ title }, { name: "description", content: description }, { property: "og:type", content: "article" }, { property: "og:url", content: url },
        ...(loaderData?.seo?.image ? [{ property: "og:image", content: loaderData.seo.image }] : [])],
      links: [{ rel: "canonical", href: url }],
      scripts: loaderData ? paiIndicaJsonLd({ url, post: loaderData.full, products: loaderData.products }).map((obj) => ({ type: "application/ld+json", children: JSON.stringify(obj) })) : [],
    };
  },
  component: () => { const d = Route.useLoaderData(); return <PaiIndicaPostPage post={d.full} products={d.products} />; },
});
```

### 5.3 Menu, home e sitemap

- Menu do topo (`src/components/layout/Header.tsx` ou equivalente da Fase 1): item **Pai Indica** → `/pai-indica`,
  com cor de destaque âmbar (como o botão "AI Indica" no Portal da AI).
- Home: seção "Pai Indica" com 6 cards mais recentes + `ScoreScaleNote` (fechada). A vitrine "Últimos artigos" não
  pode ficar só de Pai Indica: `getHomeData` escolhe 1 por categoria antes de completar por data (regra herdada).
- `src/routes/sitemap[.]xml.ts`: incluir `/pai-indica` e `/pai-indica/<slug>` para todos os posts dos 3 kinds;
  excluir `/post/<slug>` desses mesmos posts.
- `/categoria/pai-indica` → redirect 301 para `/pai-indica`.
- `/busca`: resultados de Pai Indica linkam `/pai-indica/<slug>`.

---

## 6. Capa composta — `scripts/rotina/cover_cmp.py`

Copiar `/home/user/vocacaodemae/scripts/rotina/cover_cmp.py` para `scripts/rotina/cover_cmp.py` e alterar o que
segue. **Entrada:** `python3 scripts/rotina/cover_cmp.py <slug> "Nome 1=<url ou arquivo>" ["Nome 2=…"] ["Nome 3=…"]`
(1 a 3 produtos; para `lista` com mais de 3, usar os 3 primeiros do ranking). Rodar na raiz do repositório.
**Saída:** `public/images/covers/<slug>.jpg`, 1280×720, JPEG q88, e imprime `/images/covers/<slug>.jpg (NN KB)`.
As fotos são as `images[0]` oficiais da Amazon (`_AC_SL1500_`) baixadas na hora; cada uma vai inteira (sem corte)
num cartão branco com sombra; o nome do modelo é escrito pelo script (nunca por IA). Precisa de Pillow.

Mudanças obrigatórias em relação ao original (cores do Vocação de Pai):

```python
# 1) Degradê de fundo: areia -> azul-petróleo clareado (era rosado)
def gradient() -> Image.Image:
    top, bottom = (244, 239, 230), (205, 222, 225)   # #F4EFE6 -> petróleo a ~20%
    ...

# 2) Sombra dos cartões em petróleo escuro (era (120, 40, 60, 70))
sd.rounded_rectangle((...), 28, fill=(20, 80, 92, 70))

# 3) Cor do nome do modelo: grafite (era (58, 30, 40, 255))
draw.text((...), line, font=font, fill=(31, 36, 41, 255))

# 4) Barra âmbar de marca no rodapé + rótulo "PAI INDICA" (novo)
BAR_H = 10
draw.rectangle((0, H - BAR_H, W, H), fill=(217, 130, 43, 255))        # #D9822B
label_font = ImageFont.truetype(FONT_COND if os.path.exists(FONT_COND) else FONT_BOLD, 26)
draw.text((56, 18), "PAI INDICA", font=label_font, fill=(20, 80, 92, 255))  # #14505C

# 5) Fontes: tentar Barlow Condensed (se baixada em scripts/rotina/fonts/BarlowCondensed-Bold.ttf), senão DejaVu
FONT_COND = os.path.join("scripts", "rotina", "fonts", "BarlowCondensed-Bold.ttf")

# 6) Altura útil dos cartões diminui 28 px por causa do rótulo e da barra: y = 92 ; card_h = H - 92 - 64 - BAR_H
```

Regras: a capa de cada post é única (não reutilizar o mesmo JPG em dois slugs; `select cover_image_url, count(*)
from posts where kind in ('review','comparativo','lista') group by 1 having count(*)>1` deve dar 0). O JPG é
commitado no PR junto com o conteúdo. Verificação visual: abrir o arquivo com `Read` depois de gerar. Também copiar
`backfill_covers.py` (ajustando a consulta para `kind in (...)`) para refazer capas antigas quando necessário.

---

## 7. JSON-LD

Arquivo: `src/lib/pai-indica/jsonld.ts`, função `paiIndicaJsonLd({url, post, products})` que devolve um array de
objetos. Reutilizar `breadcrumbJsonLd` e `faqJsonLd` de `src/lib/seo.ts` (herdados). **Nunca** `aggregateRating`
com estrelas da Amazon; `Review.reviewRating` é a nossa nota (bestRating 10). Preço nunca em `offers.price`
(só `priceCurrency`, `availability` e `url` do afiliado; sem valor).

### 7.1 Review individual (kind = review): Article + Review + Product + BreadcrumbList + FAQPage

```json
{
  "@context": "https://schema.org",
  "@type": "Review",
  "name": "Philips OneBlade QP2724: vale a pena para aparar a barba no banho?",
  "url": "https://vocacaodepai.com.br/pai-indica/philips-oneblade-qp2724-vale-a-pena",
  "datePublished": "2026-11-03",
  "dateModified": "2026-11-03",
  "author": { "@type": "Person", "name": "Bruno Danello" },
  "publisher": { "@type": "Organization", "name": "Vocação de Pai", "logo": { "@type": "ImageObject", "url": "https://vocacaodepai.com.br/images/logo.png" } },
  "reviewBody": "O OneBlade QP2724 é a porta de entrada mais sensata da linha: faz o básico muito bem, aguenta o banho e cabe no bolso.",
  "reviewRating": { "@type": "Rating", "ratingValue": 7.9, "bestRating": 10, "worstRating": 0 },
  "positiveNotes": { "@type": "ItemList", "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Apara, modela e faz acabamento com uma só lâmina" },
    { "@type": "ListItem", "position": 2, "name": "Corpo lavável em água corrente" } ] },
  "negativeNotes": { "@type": "ItemList", "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Bateria NiMH com carga lenta" } ] },
  "itemReviewed": {
    "@type": "Product",
    "name": "Philips OneBlade QP2724",
    "brand": { "@type": "Brand", "name": "Philips" },
    "image": "https://m.media-amazon.com/images/I/XXXXXXXX._AC_SL1500_.jpg",
    "sku": "B0XXXXXXXX",
    "offers": { "@type": "Offer", "url": "https://www.amazon.com.br/dp/B0XXXXXXXX?tag=<TAG_AMAZON>", "priceCurrency": "BRL", "availability": "https://schema.org/InStock" }
  }
}
```

### 7.2 Comparativo / lista: Article + ItemList de Product + BreadcrumbList + FAQPage

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "Bosch GSR 120-LI, Black+Decker LD12SP ou Makita HP333D: qual parafusadeira 12 V comprar?",
  "url": "https://vocacaodepai.com.br/pai-indica/bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v",
  "numberOfItems": 3,
  "itemListOrder": "https://schema.org/ItemListOrderDescending",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "item": {
        "@type": "Product", "name": "Bosch GSR 120-LI", "brand": { "@type": "Brand", "name": "Bosch" },
        "image": "https://m.media-amazon.com/images/I/AAAA._AC_SL1500_.jpg",
        "review": { "@type": "Review", "author": { "@type": "Person", "name": "Bruno Danello" },
                    "reviewRating": { "@type": "Rating", "ratingValue": 8.4, "bestRating": 10 } },
        "offers": { "@type": "Offer", "url": "https://www.amazon.com.br/dp/B0AAAAAAAA?tag=<TAG_AMAZON>", "priceCurrency": "BRL" } } },
    { "@type": "ListItem", "position": 2, "item": { "@type": "Product", "name": "Makita HP333DWYE", "brand": { "@type": "Brand", "name": "Makita" },
        "review": { "@type": "Review", "author": { "@type": "Person", "name": "Bruno Danello" }, "reviewRating": { "@type": "Rating", "ratingValue": 8.1, "bestRating": 10 } } } },
    { "@type": "ListItem", "position": 3, "item": { "@type": "Product", "name": "Black+Decker LD12SP", "brand": { "@type": "Brand", "name": "Black+Decker" },
        "review": { "@type": "Review", "author": { "@type": "Person", "name": "Bruno Danello" }, "reviewRating": { "@type": "Rating", "ratingValue": 7.4, "bestRating": 10 } } } }
  ]
}
```

A ordem do `ItemList` é por nota (vencedor primeiro). O `Article` (headline, image = capa composta, datePublished,
author, publisher, articleSection "Pai Indica") sai do mesmo `articleJsonLd` do blog.

### 7.3 FAQPage

```json
{ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
  { "@type": "Question", "name": "O OneBlade substitui o barbeador de lâmina?",
    "acceptedAnswer": { "@type": "Answer", "text": "Não totalmente. Ele apara e dá acabamento, mas não deixa a pele tão lisa quanto uma lâmina tradicional." } } ] }
```

### 7.4 BreadcrumbList

Início → Pai Indica (`/pai-indica`) → título do post (`/pai-indica/<slug>`). Usar `breadcrumbJsonLd` existente.

---

## 8. Regras editoriais obrigatórias (valem para o redator humano, a rotina e o validador)

1. **Nunca preço em reais no texto** (title, subtitle, excerpt, body, review, comparison, faq). Placeholder
   `{FAIXA:slug-do-produto}`; o gerador escreve a faixa de `products.price_min/price_max` ou "consulte na Amazon".
2. **Faixa de preço**: pesquisada na internet inteira (Mercado Livre, Magalu, Americanas, Casas Bahia, Shopee,
   Kabum, Leroy Merlin, site do fabricante), mesmo item (marca/modelo/cor/voltagem) em **≥ 2 lojas**; `max ≤ 3×min`;
   gravar com `update products set price_min=…, price_max=…, price_range_checked_at=now() where slug='…'`. Sem 2
   lojas: não gravar. O texto diz sempre "faixa consultada na internet, não é o preço da Amazon".
3. **Botão**: sempre "Comprar agora na Amazon" (nunca "Ver preço", nunca preço no botão). `rel="noopener noreferrer
   sponsored nofollow"`, `target="_blank"`, `href` = `products.affiliate_url` real (`/dp/<ASIN>?tag=<TAG_AMAZON>`).
   Mínimo de botões: review 4; comparativo 1 por produto + 1 em "Qual comprar" + 1 em "Variação de preço"; lista 1
   por produto.
4. **Tamanho**: mínimo **1100 palavras** (mirar 1500 a 2000); lista: mínimo 120 palavras por produto além dos cards.
5. **Links internos**: ≥ **8 distintos**: ≥ 4 para `/post/<slug>` do blog (existentes) + `/loja/<slug>` de cada
   produto + ≥ 1 para outro `/pai-indica/<slug>` quando existir.
6. **Produtos existem em `products`** (`active = true`, com `affiliate_url`, `image_url`, `images` ≥ 3 fotos oficiais
   `_AC_SL1500_` verificadas com HTTP 200 e > 15 KB) e com a review longa da loja (`products.review`) antes de o
   post ser publicado.
7. **Capa única**: `cover_image_url = /images/covers/<slug>.jpg`, gerada pelo `cover_cmp.py`, commitada no PR;
   não repete capa de outro post.
8. **Nada inventado**: especificação, nota de compradores, nº de avaliações, garantia, medidas só com fonte
   (`amz.py`, site do fabricante, manual). Sem certeza: "o anúncio não informa".
9. **Sem teste físico**: nunca "testamos", "usamos", "na nossa casa". "Como avaliamos" obrigatória.
10. **Opiniões fora da Amazon**: seção "O que dizem outros compradores" em toda review (elogios repetidos primeiro,
    reclamações reais depois, sem número, percentual, nome ou citação literal; fontes nomeadas). Nunca copiar ou
    parafrasear avaliações da Amazon.
11. **Promoção proibida**: cupom, frete grátis, menor preço, "% de desconto", "em promoção", "corra".
12. **Título**: variar formato (pergunta, comparação "A ou B", superlativo/ano, cenário de uso, veredito
    antecipado); dois posts da mesma rodada não repetem o molde. `seo_title` ≤ 62 caracteres. Sem preço no título.
13. **Subtítulo** (se a coluna existir): 50 a 220 caracteres, diferente do excerpt.
14. **FAQ**: ≥ 4 `{question, answer}`, respostas de 2 a 4 frases com dado concreto.
15. **Segurança primeiro**: cadeirinha, ferramenta elétrica, churrasqueira, suplemento → sempre um "Sinal de
    alerta: " (callout `tone: bad`) quando houver risco real; semáforo do pai com os 3 callouts ("Sinal verde: ",
    "Sinal de atenção: ", "Sinal de alerta: ") quando o tema envolver risco à criança ou à saúde.
16. **Linha editorial**: família tradicional (pai e mãe); sem conteúdo ou imagem LGBTQI; sem vulgaridade; sem
    machismo tóxico. Sem menção a IA na produção do conteúdo.
17. **Categoria editorial** sempre `pai-indica`; `product_category`/`product_subcategory` válidos na taxonomia.
18. **Publicação**: Pai Indica entra sempre `status='published'`, `publish_at=now()`.
19. **Loja e post contam a mesma história com textos diferentes**: mesma nota e mesmo veredito em
    `products.review` e em `posts.review`, mas parágrafos reescritos (sem canibalização no Google).
20. **Nunca** `DELETE`/`DROP`; não alterar outros posts; `UPDATE` sempre com `where slug='…' returning slug`.

---

## 9. Briefs do Pai Indica (gravar em `scripts/rotina/`)

Também copiar (sem alterar a lógica, só textos/consultas) de `/home/user/vocacaodemae/scripts/rotina/`:
`amz.py`, `cmp_gen.py`, `rev_art_gen.py`, `review_gen.py`, `photo_upgrade.py`, `backfill_covers.py`, `README.md`.
Ajustes nos geradores: (a) `category_id` fixo `'10000000-0000-0000-0000-000000000010'`; (b) gravar `kind`
(`'comparativo'`/`'lista'` em `cmp_gen.py` via campo `"kind"` do JSON, default `comparativo`; `'review'` em
`rev_art_gen.py`); (c) gravar `comparison`/`review`, `product_category`, `product_subcategory`, `product_score`;
(d) URL do REST = Supabase do Vocação de Pai (anon key de `src/integrations/supabase/client.ts`); (e) cache
`/tmp/amzcache-vocacaodepai`; (f) texto "Review de Mãe" → "Pai Indica", "mãe" → "pai", "A mãe quer desconto!" →
"O pai também quer desconto". Linha de comando e saídas (`<slug>.insert.sql`, `.stg.sql`, `.upd.sql`) iguais.

### 9.1 `scripts/rotina/BRIEF_COMPARATIVO_PAI.md`

```markdown
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
- Título varia de formato entre os comparativos do dia (pergunta "A ou B: qual comprar?", "Os 3 melhores X de 2026", cenário "X para quem mora em apartamento", veredito antecipado). `seo_title` ≤ 62 caracteres.

## Passo a passo
1. `python3 scripts/rotina/amz.py <ASIN>` para cada produto (cache em /tmp/amzcache-vocacaodepai; use run_in_background se demorar). `images[0]` = foto oficial (`_AC_SL1500_`).
2. WebSearch: site do fabricante, manual, medidas, voltagem, Inmetro/Anatel, garantia. Cruze com os bullets.
3. FAIXA DE PREÇO (antes do artigo): mesmo item em OUTRAS lojas (Mercado Livre, Magalu, Americanas, Casas Bahia, Shopee, Kabum, Leroy Merlin, fabricante). ≥ 2 lojas com preço em reais; min/max; descarte se max > 3×min. Confirmou: `update products set price_min=<n>, price_max=<n>, price_range_checked_at=now() where slug='<slug>' returning slug;`. Não confirmou: não grave.
4. FOTOS: produto com < 3 fotos na galeria: `update products set image_url='<images[0]>', images=array['..','..']::text[], updated_at=now() where slug='<slug>' returning slug;` (até 8, só HTTP 200 e > 15 KB).
5. CAPA COMPOSTA: `python3 scripts/rotina/cover_cmp.py <slug> "Nome 1=<images[0]>" "Nome 2=<...>" ["Nome 3=..."]` (mesma ordem da tabela). Grava `public/images/covers/<slug>.jpg`; coloque em `cover_image_url` e COMMITE o JPG no PR.
6. Escreva o JSON (esquema abaixo) em `/tmp/rotina-cmp/<slug>.json` e rode `python3 <repo>/scripts/rotina/cmp_gen.py <slug>.json` nesse diretório até "OK". Mínimo 1100 palavras (mire 1500-2000), 8 links internos distintos (≥ 4 `/post/`, os `/loja/<slug>`, ≥ 1 `/pai-indica/` se houver).
7. Aplique `<slug>.insert.sql` com `mcp__Supabase__execute_sql` (project_id `<SUPABASE_PROJECT_REF>`), conteúdo INTEIRO. Idempotente por slug.
8. Rode `node scripts/validate-content.mjs --slug <slug>` (precisa dar "✓"). Verifique: `select slug,kind,product_score,status,jsonb_array_length(body->'content') from posts where slug='<slug>'`. Responda em até 12 linhas: slug, palavras, links, faixas gravadas, fotos, problemas.

## Esquema do JSON
```json
{
 "slug": "bosch-gsr-120-ou-black-decker-ld12-ou-makita-hp333-parafusadeira-12v",
 "kind": "comparativo",
 "title": "Bosch GSR 120-LI, Black+Decker LD12SP ou Makita HP333D: qual parafusadeira 12 V comprar?",
 "subtitle": "OBRIGATÓRIO (50-220 caracteres): o que comparamos e para quem serve; sem valor em reais",
 "seo_title": "(opcional) até 62 caracteres",
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
 "verdict_by_profile": [{"profile":"Se você ...","pick_slug":"...","reason":"..."}],
 "por_que_importa": ["1 a 3 parágrafos com links para /post/"],
 "variacao_preco": ["1 a 2 parágrafos; use {FAIXA:slug} se citar valores"],
 "qual_comprar": ["parágrafos por perfil com a opinião técnica final"],
 "como_avaliamos": ["fontes, sem teste físico, 5 critérios e pesos"],
 "outros": ["links para outros posts, Pai Indica e loja"],
 "faq": [{"q":"..","a":".."}, "... mínimo 4"],
 "quiz": [{"question":"..","options":["a","b","c","d"],"answer":0,"explanation":".."}]
}
```
Ordem de `tabela.linhas` = ordem de `produtos`. `role` ∈ vencedor | custo-beneficio | premium | alternativa | nao-indicamos. Para `kind: "lista"` (3 a 7 produtos) `role` é o selo (escolha-do-editor, melhor-custo-beneficio, melhor-premium, melhor-barato, melhor-para-iniciantes, melhor-compacto, melhor-para-familias, melhor-silencioso, melhor-desempenho, sem-selo), máximo 1 produto por selo, e as seções extras são "Como escolhemos" (no lugar da tabela, opcional) e "O que não recomendamos (e por quê)". Marcação: `**negrito**`, `[texto](/post/slug)`, `[texto](/loja/slug)`, `[texto](/pai-indica/slug)`.

## Onde achar slugs para links
`select slug, title from posts where status='published' order by created_at desc` (ou REST `/rest/v1/posts?select=slug,title,kind&status=eq.published`). Só slugs existentes (o gerador confere).
```

### 9.2 `scripts/rotina/BRIEF_REVIEW_UNICA_PAI.md`

```markdown
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
```

### 9.3 `scripts/rotina/BRIEF_REVIEW_LOJA_PAI.md`

```markdown
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
```

---

## 10. Primeiros 20 Pai Indica a publicar

Todos os produtos são reais e vendidos na Amazon Brasil; **confirmar o ASIN com `amz.py` antes de escrever** (se o
modelo exato não estiver disponível, trocar pela versão/voltagem vigente da mesma linha e anotar no PROGRESSO.md).
Publicar em 4 rodadas de 5 (uma sessão cada), misturando categorias e formatos de título.

| # | Tipo | Título provisório | Produtos (marca/modelo) | Categoria / subcategoria |
| --- | --- | --- | --- | --- |
| 1 | comparativo | Bosch GSR 120-LI, Black+Decker LD12SP ou Makita HP333D: qual parafusadeira 12 V comprar? | Bosch GSR 120-LI; Black+Decker LD12SP-B2; Makita HP333DWYE | ferramentas / furadeiras-e-parafusadeiras |
| 2 | comparativo | Tramontina Churrasco ou Mundial Dynamic: qual faca 8" para o churrasco de domingo? | Tramontina Churrasco 8" (22250); Mundial Dynamic 8"; Tramontina Polywood 10" | churrasco-e-cozinha / facas-e-cutelaria |
| 3 | review | Philips OneBlade QP2724: vale a pena para aparar a barba no banho? | Philips OneBlade QP2724/10 | estilo-e-barba / barbeadores-e-aparadores |
| 4 | comparativo | Wap Eco Wash 2200, Kärcher K2 ou Electrolux UWS31: lavadora de alta pressão para a casa e o carro | Wap Eco Wash 2200; Kärcher K2 Basic; Electrolux Ultra Wash UWS31 | casa-e-jardim / limpeza-externa |
| 5 | lista | 5 livros de finanças pessoais que todo pai de família deveria ler | Pai Rico, Pai Pobre (Kiyosaki); O Homem Mais Rico da Babilônia (Clason); Os Segredos da Mente Milionária (Eker); Me Poupe! (Nathalia Arcuri); Do Mil ao Milhão (Thiago Nigro) | livros-e-formacao / financas-pessoais |
| 6 | comparativo | 70mai A500S ou 70mai 1S: qual câmera veicular protege você numa batida? | 70mai Dash Cam A500S; 70mai Dash Cam 1S | carro-e-moto / eletronicos-automotivos |
| 7 | comparativo | Burigotto Matrix Evolution K, Chicco Seat Up 012 ou Litet Isofix 360: cadeirinha que o pai instala sem erro | Burigotto Matrix Evolution K; Chicco Seat Up 012; Litet Isofix 360 | bebe-e-crianca / cadeirinhas-de-carro |
| 8 | review | Xiaomi Mi Body Composition Scale 2: a balança que mostra se a dieta está funcionando | Xiaomi Mi Body Composition Scale 2 | saude-do-homem / monitoramento |
| 9 | comparativo | Amazfit Bip 5, Xiaomi Smart Band 9 ou Galaxy Fit3: qual acompanha o treino e o sono do pai? | Amazfit Bip 5; Xiaomi Smart Band 9; Samsung Galaxy Fit3 | esporte-e-outdoor / relogios-e-monitores |
| 10 | review | Schulz Air Plus 12 V: o compressor portátil para calibrar o pneu na garagem | Schulz Air Plus 12 V | carro-e-moto / emergencia-e-manutencao |
| 11 | lista | 7 ferramentas que todo pai precisa ter em casa (sem gastar à toa) | Bosch GO 3,6 V; Tramontina PRO alicate universal 8"; Stanley martelo unha 20 oz; Vonder trena 5 m; Tramontina PRO jogo de chaves 19 pç; Vonder nível de alumínio 30 cm; Tramontina estilete profissional 18 mm | ferramentas / jogos-de-ferramentas |
| 12 | comparativo | JBL Tune 520BT ou Soundcore P20i: fone para o trajeto e para a ligação do trabalho | JBL Tune 520BT; Anker Soundcore P20i; JBL Wave Buds | tecnologia / fones-e-audio |
| 13 | review | Kärcher K2 Basic: vale a pena para lavar o carro e o quintal? | Kärcher K2 Basic | casa-e-jardim / limpeza-externa |
| 14 | comparativo | Stanley Classic 1 L ou Termolar Lúmina 1 L: qual garrafa mantém o café quente o dia todo? | Stanley Classic Legendary 1 L; Termolar Lúmina 1 L; Mor Garrafa Térmica 1 L | esporte-e-outdoor / garrafas-e-coolers |
| 15 | lista | 6 itens para montar o kit de churrasco de fim de semana | Tramontina faca 8" Churrasco; Tramontina garfo trinchante; Tramontina tábua Carne 50×30; Tramontina espeto duplo 85 cm; Mor pegador de carne; Tramontina afiador de facas | churrasco-e-cozinha / acessorios-de-churrasco |
| 16 | comparativo | Philips BT3206 ou Panasonic ER-GB42: qual aparador deixa a barba no ponto? | Philips BT3206/14; Panasonic ER-GB42; Mondial BG-03 | estilo-e-barba / barbeadores-e-aparadores |
| 17 | review | Omron HEM-7122: o medidor de pressão para o pai que quer parar de adiar o check-up | Omron HEM-7122 | saude-do-homem / monitoramento |
| 18 | comparativo | Olympikus Corre 3, Mizuno Wave Rider 27 ou Asics Gel-Excite 10: tênis para voltar a correr depois dos 35 | Olympikus Corre 3; Mizuno Wave Rider 27; Asics Gel-Excite 10 | esporte-e-outdoor / corrida-e-tenis |
| 19 | lista | 5 itens que não podem faltar no porta-malas (kit de emergência do carro) | Luxcar triângulo de sinalização; Tramontina chave de roda cruz 17/19/21/23; Schulz Air Plus 12 V; Vonder cabo para bateria 2,5 m; Nautika lanterna LED Tático | carro-e-moto / emergencia-e-manutencao |
| 20 | comparativo | Nautika Dome 4, Mor Luna 4 ou Guepardo Vênus Ultra 4: barraca para o primeiro acampamento com os filhos | Nautika Dome 4; Mor Luna 4; Guepardo Vênus Ultra 4 | esporte-e-outdoor / camping-e-trilha |

Rodadas: R1 = 1, 3, 5, 7, 9 · R2 = 2, 4, 6, 8, 11 · R3 = 10, 12, 13, 14, 15 · R4 = 16, 17, 18, 19, 20. Cada rodada
usa formatos de título diferentes entre si e tem pelo menos 1 tema em alta confirmado (ver briefs). Cada produto
entra em `products` com review longa **antes** do post (BRIEF_REVIEW_LOJA_PAI). Antes dos 20, publicar ≥ 8 artigos
Padrão A no blog (Fase 1 / backlog) para haver `/post/` para linkar.

---

## 11. Validações — `scripts/validate-content.mjs`

Validador em Node (sem dependências além de `node:` e `fetch`), lê pelo REST público do Supabase (anon key de
`src/integrations/supabase/client.ts`, só leitura) e bloqueia publicação incorreta. Também é chamado pela rotina
(Fase 8) e pelo CI (`npm run validate:content`). Uso:

```
node scripts/validate-content.mjs                 # todos os posts Pai Indica publicados
node scripts/validate-content.mjs --slug <slug>   # um post
node scripts/validate-content.mjs --images        # também confere HTTP 200 e > 15 KB das fotos
```

Regras por `kind` (erro = "✗", bloqueia):

**Comuns (review, comparativo, lista):**
- `status='published'`, `publish_at ≤ now()`, `category_id = '10000000-0000-0000-0000-000000000010'`.
- `product_category` ∈ taxonomia; `product_subcategory` pertence à categoria (`isValidPair`).
- `product_score` numérico 0–10 com 1 casa; igual a `review.score` (review) ou à nota do `winner_slug`.
- `cover_image_url` começa com `/images/covers/` e o arquivo existe em `public/images/covers/`; não repete em outro post.
- `title` 20–100 caracteres; `seo_title` ≤ 62 se preenchido; `excerpt` ≤ 155; `subtitle` 50–220 (se a coluna existir).
- Sem `R$` nem `\d+,\d{2}` precedido de "R" em title/subtitle/excerpt/body/review/comparison/faq.
- Sem "Ver preço", "cupom", "frete grátis", "menor preço", "% de desconto", "em promoção", "testamos", "usamos por".
- Palavras do body ≥ 1100; headings nível 2 ≥ 6; links internos distintos ≥ 8 (≥ 4 `/post/`, todos os
  `/loja/<slug>` dos produtos); todo `/post/<slug>` linkado existe e está publicado.
- Botões `btn-comprar` (ou `buyCard`): texto contém "Comprar" e "agora na Amazon"; `href` contém `amazon.com.br/dp/` e `tag=`.
- `faq` com ≥ 4 `{question, answer}` não vazios.
- Body contém heading "Como avaliamos" e heading "Variação de preço".
- Todos os produtos existem em `products` (`active=true`), têm `affiliate_url`, `image_url` e `images` ≥ 3, e `review` jsonb objeto.

**kind = review:** `review` objeto; `criteria.length === 5`; pesos somam 100 e batem com `criteriaByCategory[product_category]`
(mesmos pesos na mesma ordem; nomes podem diferir); `score` = média ponderada ±0,15; `pros`/`cons` 3–6; `ideal_for`,
`not_ideal_for`, `verdict`, `how_we_evaluated` não vazios; `product_slug` existe; `comparison` é null; body tem
heading "O que dizem outros compradores"; ≥ 4 botões.

**kind = comparativo:** `comparison` objeto; `products` 2–3; `role` ∈ {vencedor, custo-beneficio, premium,
alternativa, nao-indicamos}; exatamente 1 `vencedor` = `winner_slug`; `table.columns.length === rows[i].length`;
`rows.length === products.length`; `criteria` 5 itens somando 100; `verdict_by_profile` ≥ 2 com `pick_slug` válido;
`review` é null; body tem nó `fotosModelos` com os mesmos slugs; ≥ 1 botão por produto.

**kind = lista:** `comparison` objeto; `products` 3–7; `role` ∈ selos; no máximo 1 produto por selo (exceto
sem-selo); `winner_slug` tem selo `escolha-do-editor`; body tem heading por produto (contém o nome) e heading "Como
escolhemos" e "O que não recomendamos"; ≥ 120 palavras entre o heading de um produto e o seguinte; `review` é null.

Esqueleto:

```js
#!/usr/bin/env node
// scripts/validate-content.mjs — valida posts do Pai Indica pelo REST público (só leitura).
import { readFileSync, existsSync } from "node:fs";
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://<SUPABASE_PROJECT_REF>.supabase.co";
const ANON = process.env.SUPABASE_ANON_KEY ?? readAnonFromClient();
const args = process.argv.slice(2);
const slugArg = args.includes("--slug") ? args[args.indexOf("--slug") + 1] : null;
const checkImages = args.includes("--images");

const TAXONOMIA = JSON.parse(readFileSync(new URL("./lib/taxonomia.json", import.meta.url))); // gerado por `npm run taxonomia:json`
const PESOS = JSON.parse(readFileSync(new URL("./lib/criterios.json", import.meta.url)));

async function rest(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}
function texts(node, out = []) { if (Array.isArray(node)) node.forEach((n) => texts(n, out)); else if (node && typeof node === "object") { if (node.type === "text" && node.text) out.push(node.text); Object.values(node).forEach((v) => texts(v, out)); } return out; }
function links(node, out = []) { /* percorre marks type=link e nós buyCard/fotosModelos; devolve hrefs */ return out; }
function headings(doc, level = 2) { return (doc?.content ?? []).filter((n) => n.type === "heading" && (n.attrs?.level ?? 2) === level).map((h) => texts(h).join(" ")); }
const weighted = (cs) => Math.round((cs.reduce((s, c) => s + c.weight * c.score, 0) / cs.reduce((s, c) => s + c.weight, 0)) * 10) / 10;

async function validate(post, ctx) {
  const errs = [];
  const all = JSON.stringify([post.title, post.subtitle, post.excerpt, post.body, post.review, post.comparison, post.faq]);
  if (/R\$\s?\d/.test(all)) errs.push("valor em reais no conteúdo");
  for (const bad of ["Ver preço", "cupom", "frete grátis", "menor preço", "% de desconto", "em promoção", "testamos", "usamos por"]) if (all.toLowerCase().includes(bad.toLowerCase())) errs.push(`termo proibido: "${bad}"`);
  // ... demais regras da seção 11, uma por `if`
  return errs;
}

const posts = await rest(`posts?select=*&kind=in.(review,comparativo,lista)${slugArg ? `&slug=eq.${slugArg}` : "&status=eq.published"}&limit=1000`);
const products = await rest(`products?select=slug,active,affiliate_url,image_url,images,review&limit=5000`);
const published = new Set((await rest(`posts?select=slug&status=eq.published&limit=5000`)).map((p) => p.slug));
let failed = 0;
for (const p of posts) { const errs = await validate(p, { products, published }); if (errs.length) { failed++; console.log(`✗ ${p.slug}`); errs.forEach((e) => console.log(`   - ${e}`)); } else console.log(`✓ ${p.slug}`); }
console.log(`\n${posts.length - failed}/${posts.length} válidos`);
process.exit(failed ? 1 : 0);
```

`scripts/lib/taxonomia.json` e `criterios.json` são gerados por `scripts/export-taxonomia.mjs` (lê os `.ts` via
`tsx` ou duplica a constante) e commitados; o CI falha se estiverem desatualizados (`git diff --exit-code`).
Adicionar em `package.json`: `"validate:content": "node scripts/validate-content.mjs"` e
`"taxonomia:json": "node scripts/export-taxonomia.mjs"`.

---

## 12. Critérios de aceite da Fase 2

1. `npm run typecheck` (ou `tsc --noEmit`) e `npm run build` passam; `npm run lint` sem erro novo.
2. SQL da seção 2.2 aplicado: `select slug from categories where slug='pai-indica'` retorna 1 linha; constraints
   `posts_kind_check` e `posts_pai_indica_shape` existem; índices criados.
3. `src/lib/pai-indica/{types,score,taxonomia,criterios,jsonld}.ts` existem; 10 categorias, cada uma com 6 a 10
   subcategorias; todos os pesos somam 100 (teste automatizado ou `node -e`).
4. `src/components/pai-indica/` contém `filterVisibility.ts`, `ReviewBadge.tsx`, `ScoreScaleNote.tsx`,
   `ProductCategoryFilter.tsx`, `PaiIndicaFilter.tsx`, `AffiliateButton.tsx`, `CriteriaScores.tsx`, `ProsCons.tsx`,
   `ComparisonTable.tsx`, `VerdictByProfile.tsx`, `PaiIndicaCard.tsx`.
5. `/pai-indica` renderiza no servidor com todos os cards (`<article data-kind …>`), filtro em duas camadas
   funcionando sem recarregar, `ScoreScaleNote` fechada por padrão; sem paginação.
6. `/pai-indica/<slug>` renderiza review individual (ordem da seção 5.2) e comparativo/lista (ordem do Padrão B);
   `/post/<slug>` de um Pai Indica redireciona 301 para `/pai-indica/<slug>`; `/categoria/pai-indica` → `/pai-indica`.
7. JSON-LD presente e válido no Rich Results Test / validator.schema.org: Article + Review + Product (review);
   Article + ItemList (comparativo/lista); BreadcrumbList e FAQPage em todos; nenhum `aggregateRating`; nenhum `price`.
8. Menu com "Pai Indica" em destaque; home com seção Pai Indica; sitemap com `/pai-indica` e os slugs.
9. `scripts/rotina/` contém `amz.py`, `cmp_gen.py`, `rev_art_gen.py`, `review_gen.py`, `cover_cmp.py` (cores do
   Vocação de Pai), `photo_upgrade.py`, `backfill_covers.py`, `README.md`, `BRIEF_COMPARATIVO_PAI.md`,
   `BRIEF_REVIEW_UNICA_PAI.md`, `BRIEF_REVIEW_LOJA_PAI.md`; `cover_cmp.py` gera um JPG 1280×720 de teste (abrir com
   `Read` e conferir degradê areia→petróleo, barra âmbar, rótulo "PAI INDICA").
10. `node scripts/validate-content.mjs` roda e dá "✓" nos 20 posts publicados; CI com `validate:content`.
11. Os 20 Pai Indica da seção 10 publicados (ou, no mínimo, as rodadas R1 e R2 = 10 posts, com R3/R4 registradas
    como pendência em `PROGRESSO.md`), cada um com capa composta commitada, produtos na loja com review longa e
    faixa de preço pesquisada (ou "estimativa" registrada).
12. Lighthouse mobile em `/pai-indica/<slug>` ≥ 85 em performance e 100 em SEO; sem CLS por imagem sem dimensão.
13. `docs/plano/PROGRESSO.md` atualizado com data, o que foi feito, pendências e decisões tomadas fora deste doc.
14. `CLAUDE.md` da raiz ganha a seção "Pai Indica" resumindo: régua de nota, 5 critérios por categoria, regras
    editoriais (seção 8), caminhos dos briefs e do validador.

---

## 13. Prompt para iniciar esta fase no Sonnet

```text
Você está em /home/user/vocacaodepai (TanStack Start + React 19 + Tailwind 4 + Supabase, clonado do Vocação de Mãe e adaptado na Fase 1). Leia, nesta ordem: CLAUDE.md (raiz), docs/plano/02-arquitetura-e-stack.md (se existir, ele prevalece), docs/plano/03-fase-1-fundacao.md (para saber o que já existe) e docs/plano/04-fase-2-pai-indica-reviews.md (este é o documento que você vai EXECUTAR). Depois, confira com `ls` os caminhos citados antes de criar ou editar arquivos; se algo tiver nome diferente do planejado, adapte e anote em docs/plano/PROGRESSO.md.

Execute a Fase 2 (Pai Indica) na ordem do documento, um commit por bloco, em uma branch `claude/fase-2-pai-indica`:
1. Seção 2.2: rode o SQL de verificação/reparo no Supabase (project `<SUPABASE_PROJECT_REF>`, via mcp__Supabase__execute_sql; carregue a ferramenta com ToolSearch "select:mcp__Supabase__execute_sql"). Nunca DELETE/DROP.
2. Seções 2.5, 2.6, 3 e 3.2: crie src/lib/pai-indica/{types,score,taxonomia,criterios}.ts exatamente como especificado (10 categorias, 6 a 10 subcategorias cada, 5 critérios por categoria somando 100).
3. Seção 4: crie os 11 arquivos de src/components/pai-indica/ a partir dos esqueletos, ajustando os nomes dos tokens de cor ao src/styles.css real.
4. Seção 5: crie src/lib/pai-indica.functions.ts, src/routes/_site/pai-indica/index.tsx, src/routes/_site/pai-indica/$slug.tsx, src/pages/PaiIndicaListPage.tsx e src/pages/PaiIndicaPostPage.tsx; redirecione /post/$slug → /pai-indica/$slug para kinds review/comparativo/lista e /categoria/pai-indica → /pai-indica; inclua "Pai Indica" no menu, na home e no sitemap.
5. Seção 7: crie src/lib/pai-indica/jsonld.ts (Review+Product, ItemList, FAQPage, BreadcrumbList; sem aggregateRating e sem price).
6. Seção 11: crie scripts/validate-content.mjs, scripts/export-taxonomia.mjs e os scripts npm validate:content e taxonomia:json.
7. Seções 6 e 9: copie de /home/user/vocacaodemae/scripts/rotina/ (somente leitura) os scripts listados para scripts/rotina/, aplique as adaptações da seção 9 (category_id, kind, review/comparison, product_category/subcategory/score, REST do novo Supabase, cache /tmp/amzcache-vocacaodepai, textos) e as cores da seção 6 em cover_cmp.py; grave os três briefs BRIEF_COMPARATIVO_PAI.md, BRIEF_REVIEW_UNICA_PAI.md e BRIEF_REVIEW_LOJA_PAI.md com o texto literal do documento.
8. Rode typecheck, build e lint; corrija até passar. Teste /pai-indica e /pai-indica/<slug> com `npm run dev` (ou o comando da Fase 1) e um post de exemplo inserido a partir do JSON das seções 2.3/2.4.
9. Seção 10: publique a rodada R1 (posts 1, 3, 5, 7, 9) seguindo os briefs à risca: amz.py → faixa de preço (≥ 2 lojas) → fotos → review longa da loja → capa composta → JSON → gerador → INSERT → `node scripts/validate-content.mjs --slug <slug>` até "✓". Commite os JPGs das capas.
10. Atualize CLAUDE.md (seção "Pai Indica") e docs/plano/PROGRESSO.md; abra o PR com resumo em PT-BR e a lista de pendências (rodadas R2 a R4).

Regras que não podem ser quebradas: nunca preço em reais no texto (use {FAIXA:slug}); botão sempre "Comprar agora na Amazon"; produtos precisam existir em products com review longa antes do post; fotos oficiais _AC_SL1500_ verificadas; capa única por post; mínimo 1100 palavras e 8 links internos; sem teste físico ("Como avaliamos" obrigatória); linha editorial de família tradicional, sem conteúdo LGBTQI, sem vulgaridade; PT-BR. Se faltar informação, decida pelo que está no documento e registre a decisão em PROGRESSO.md em vez de parar. Ao terminar, responda em até 15 linhas: o que foi feito, o que ficou pendente, comandos de verificação executados e resultado.
```

---

## 14. Checklist de pronto

- [ ] SQL 2.2 aplicado; categoria `pai-indica` com id `10000000-0000-0000-0000-000000000010`; constraints e índices criados.
- [ ] `src/lib/pai-indica/types.ts`, `score.ts`, `taxonomia.ts` (10 × 6–10), `criterios.ts` (5 × 100), `jsonld.ts` criados e tipados.
- [ ] 11 componentes em `src/components/pai-indica/` compilando; `ScoreScaleNote` retrátil; `ReviewBadge` com faixa; botão sempre "Comprar agora na Amazon".
- [ ] `/pai-indica` com filtro em duas camadas (tipo → categoria → subcategoria) via `data-kind`/`data-product-category`/`data-product-subcategory`, sem paginação.
- [ ] `/pai-indica/$slug` com layout de review individual e de comparativo/lista nas ordens da seção 5.2; `StickyBuyBar` na review única; "Onde comprar" no fim do comparativo.
- [ ] Redirects 301: `/post/<slug>` (Pai Indica) → `/pai-indica/<slug>`; `/categoria/pai-indica` → `/pai-indica`.
- [ ] JSON-LD: Review+Product (review), ItemList (comparativo/lista), FAQPage, BreadcrumbList, Article; sem `aggregateRating`, sem `price`.
- [ ] Menu "Pai Indica" em destaque âmbar; seção na home; sitemap atualizado; busca linkando `/pai-indica/`.
- [ ] `scripts/rotina/` completo (amz, cmp_gen, rev_art_gen, review_gen, cover_cmp com cores do VDP, photo_upgrade, backfill_covers, README) + 3 briefs `_PAI.md`.
- [ ] `cover_cmp.py` testado: JPG 1280×720, degradê areia→petróleo, barra âmbar, rótulo "PAI INDICA", nome do modelo em grafite.
- [ ] `scripts/validate-content.mjs` com todas as regras da seção 11; `npm run validate:content` no CI.
- [ ] Rodada R1 (5 posts) publicada e validada ("✓"); produtos na loja com review longa; faixas de preço gravadas ou registradas como estimativa; capas commitadas.
- [ ] Rodadas R2–R4 publicadas ou registradas como pendência datada em `PROGRESSO.md`.
- [ ] `npm run typecheck`, `npm run build`, `npm run lint` passando; Lighthouse mobile ≥ 85 perf / 100 SEO em um `/pai-indica/<slug>`.
- [ ] `CLAUDE.md` com a seção "Pai Indica"; `docs/plano/PROGRESSO.md` atualizado; PR aberto com resumo em PT-BR.
