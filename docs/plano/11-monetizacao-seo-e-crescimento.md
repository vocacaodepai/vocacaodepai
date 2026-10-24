# 11 — Monetização, SEO e Crescimento — Vocação de Pai

> Documento do plano de criação do **Vocação de Pai** (vocacaodepai.com.br). Leitor: sessões do Claude Code (Sonnet 5.5, esforço médio) executando as fases 03–10.
> Data: 24/10/2026. Dono: Bruno Danello (grupo VDP). Tudo em PT-BR.
> Regras herdadas e FIXAS (ver `BRIEF`/`PLANO-MESTRE.md`): botão de afiliado sempre **"Comprar agora na Amazon"**; preço sempre **FAIXA pesquisada na internet** (2 lojas, mesma marca/modelo, `max ≤ 3×min`), nunca preço exato; linha editorial católica de família tradicional; tom direto, masculino, respeitoso, prático.
> Fontes de regras citadas neste documento: `/home/user/reviewprodutos/docs/PESQUISA-REFERENCIAS.md` (seções 4, 5, 6 e 7.10 — "PR §x.y" abaixo), `/home/user/vocacaodemae/CLAUDE.md` (rotina, Padrão A/B, faixa de preço — "VDM"), `/home/user/portaldaai/CLAUDE.md` e inventário (`AdSlot`, Resend no contato — "PAI").

## Sumário

1. Modelo de receita e ordem de ativação
2. Google AdSense
3. Amazon Associados Brasil
4. Outras redes de afiliados (Mercado Livre, Shopee, Magalu, Hotmart)
5. Newsletter (Resend)
6. Plano pago futuro ("Irmandade Premium")
7. Produtos digitais do pai
8. SEO (15 clusters, links internos automáticos, E-E-A-T)
9. Redes sociais (YouTube / Instagram / TikTok)
10. Parcerias
11. Metas por trimestre (12 meses) e KPIs
12. Critérios de aceite deste documento (o que cada fase precisa entregar)

---

## 1. Modelo de receita e ordem de ativação

| Ordem | Fonte | Quando ativar | Pré-requisito técnico | Fase do plano |
|---|---|---|---|---|
| 1 | Amazon Associados BR (links em Pai Indica + Loja) | Dia 1 do site público (links já no ar), inscrição formal só com ≥ 20 artigos publicados (PR §6.12) | `products.affiliate_url`, componente `<AmazonButton>`, aviso de afiliado global | Fase 2 e 3 |
| 2 | Newsletter (Resend) — ativo de audiência, não receita direta | Dia 1 (formulário) | `newsletter_subscribers`, double opt-in, cron de boas-vindas | Fase 1 (form) / Fase 8 (cron) |
| 3 | Google AdSense | Pedir revisão só com ≥ 40–60 artigos indexados e todas as institucionais no ar (PR §5.11) | `AdSenseLoader`, `AdSlot`, `ads.txt`, CMP/banner LGPD | Fase 8 |
| 4 | Outras redes (Mercado Livre, Shopee, Magalu) | Após 3 vendas Amazon confirmadas (não dispersar antes) | `products.marketplace_urls` jsonb, adapter de link | Fase 3 (schema) / Fase 8 (uso) |
| 5 | Produtos digitais (e-book, planilha, checklist) | Mês 3–4 | Hotmart (checkout externo) ou Mercado Pago + entrega por e-mail (Resend) | Fase 7 |
| 6 | Plano pago "Irmandade Premium" | Mês 6–9, após ≥ 1.000 membros gratuitos | `plans`, `subscriptions`, webhook Mercado Pago | Fase 7 (schema) / pós-plano |
| 7 | Patrocínio de seção/newsletter (mídia kit `/anuncie`) | Mês 9+ | Página `/anuncie` com números reais do painel | Fase 8 |

Regra de ouro (PR §5.2 e §4.2): **conteúdo editorial > publicidade em toda página**. O AdSense e a Amazon reprovam/derrubam sites "afiliados finos". Cada artigo precisa de **um dado próprio** (tabela consolidada, medição, foto própria, cálculo) — ver §8.3.

---

## 2. Google AdSense

### 2.1 Requisitos de aprovação (com fonte)

- Elegibilidade oficial: 18+, site próprio com acesso ao HTML, conteúdo original e conformidade com as políticas. **Não há** idade mínima de domínio, tráfego mínimo ou número mínimo de artigos no Brasil (a regra de 6 meses é só China/Índia) — PR §5.1, https://support.google.com/adsense/answer/9724.
- Motivos oficiais de reprovação (PR §5.2, https://support.google.com/adsense/answer/81904): conteúdo insuficiente; "affiliate program content should form only a minor part of the content"; navegação ruim (login, links quebrados, pop-ups); idioma não suportado. "We may review all pages of your site".
- Meta prática do grupo antes de pedir revisão (PR §5.11 + experiência BR §5.9): **40–60 artigos** publicados e indexados, cada categoria do blog com **≥ 5 posts**, nenhuma categoria vazia linkada, tags **noindex**, institucionais em PT-BR no menu e no rodapé.
- Checagens técnicas: HTTPS válido com redirect HTTP→HTTPS; `robots.txt` liberando `Mediapartners-Google` e `Google-Display-Ads-Bot`; nenhuma página "em construção" indexada; zero links quebrados (rodar `scripts/check-links.ts` antes de pedir revisão).

### 2.2 Páginas obrigatórias (todas linkadas no menu "Institucional" e no rodapé)

| Rota | Conteúdo mínimo | Observação |
|---|---|---|
| `/sobre` | Quem somos (Bruno Danello + autores), missão, método editorial ("Como avaliamos" resumido), **como o site ganha dinheiro** (AdSense, afiliados, produtos próprios) | Foto real e bio dos autores (E-E-A-T, §8.4) |
| `/contato` | E-mail funcional + formulário (server function `/api/contato` com Resend, honeypot e `startedAt`, copiado do PAI) | Responder em até 2 dias úteis |
| `/politica-de-privacidade` | Seção AdSense com os 4 pontos exigidos (PR §5.5, https://support.google.com/adsense/answer/1348695): (1) terceiros, incluindo o Google, usam cookies para veicular anúncios com base em visitas anteriores; (2) os cookies de publicidade do Google permitem anúncios baseados em visitas a este e a outros sites; (3) o usuário pode desativar anúncios personalizados em https://www.google.com/settings/ads ou https://www.aboutads.info; (4) link para https://policies.google.com/technologies/partner-sites. Mais: seção Amazon Associados; itens do art. 9º da LGPD (finalidade, retenção, compartilhamento, direitos, canal do encarregado); seção Cookies | Texto próprio, PT-BR |
| `/termos-de-uso` | Uso do site, conta de membro, conteúdo gerado por usuário (histórias, perguntas, vagas), moderação, propriedade intelectual | Inclui regras da Irmandade |
| `/politica-de-afiliados` | Frase oficial da Amazon (§3.1), lista de redes, explicação da **faixa de preço pesquisada na internet**, "Este conteúdo contém publicidade na forma de links de afiliado (CONAR/CDC art. 36)" | Link no rodapé de TODAS as páginas |
| `/politica-editorial` (opcional, recomendado) | "Como avaliamos" completo (critérios 0–10 do Pai Indica, independência, correção de erros) | Usada pelo E-E-A-T |

### 2.3 Componentes e variáveis de ambiente

Replicar o padrão do Portal da AI (PAI: `AdSenseLoader`, `AdSlot`, `AdUnit`, `CookieConsent`) em TanStack Start:

```
src/components/ads/AdSenseLoader.tsx   // <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"> só em produção, 1x no root layout
src/components/ads/AdSlot.tsx          // <ins class="adsbygoogle"> com min-height reservado por breakpoint; useEffect push({}) em try/catch; key = pathname+slot (evita push duplicado na navegação client-side)
src/components/ads/AdLabel.tsx         // rótulo "Publicidade" (só este texto; nunca "Recursos", "Ofertas", "Links úteis")
src/components/consent/CookieConsent.tsx // banner LGPD padrão ANPD + Consent Mode v2
public/ads.txt                          // google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Env (Vercel): `VITE_ADSENSE_CLIENT=ca-pub-...`, `VITE_ADSENSE_SLOT_LEADERBOARD`, `VITE_ADSENSE_SLOT_RECTANGLE`, `VITE_ADSENSE_SLOT_IN_ARTICLE`, `VITE_ADSENSE_SLOT_MULTIPLEX`, `VITE_ADSENSE_SLOT_ANCHOR`. Sem a variável, `AdSlot` renderiza `null` (nunca um espaço vazio com rótulo).

Regras do `AdSlot` (PR §5.7, guia GPT "Minimize layout shift"):
- Reservar espaço com CSS (`min-height`): mobile 280px para retângulo/in-article, desktop 90px leaderboard, 600px sidebar. Nunca reservar via JS. Slots "fluid" só abaixo da dobra.
- `loading` preguiçoso para slots abaixo da dobra (IntersectionObserver com `rootMargin: 600px`).
- Não renderizar quando `profile.role` tem assinatura ativa (benefício do plano pago) nem em rotas da lista "sem anúncio" (§2.5).

### 2.4 Posicionamento por template

Regras gerais (PR §5.3, https://support.google.com/adsense/answer/1346295 e Better Ads https://support.google.com/webtools/answer/7073774): nenhum anúncio adjacente a menus, botões, inputs, players ou tabelas interativas; densidade mobile ≤ 30% da altura do conteúdo; sticky ≤ 30% da tela e nunca cobrindo conteúdo; distância mínima de **400 caracteres** de texto entre um anúncio e um botão "Comprar agora na Amazon" (herdado do `prepareArticleHtml` do PAI); rótulo "Publicidade" acima de cada bloco.

| Template | Slot 1 | Slot 2 | Slot 3 | Sidebar desktop | Anchor mobile | Proibido |
|---|---|---|---|---|---|---|
| **Home** `/` | Leaderboard/multiplex **após** a 2ª seção editorial (depois de "Últimos artigos") | Multiplex antes do rodapé | — | Não | Não | Nada acima da dobra; nada dentro do bloco "Pai Indica em destaque" |
| **Artigo** `/post/$slug` (artigo, notícia, guia) | In-article após a introdução (depois do 1º `h2`, ≥ 400 caracteres de texto) | In-article antes do 3º `h2` (ou do semáforo, o que vier antes — nunca dentro do semáforo) | In-article antes do bloco FAQ | 1 retângulo 300×600 sticky, abaixo do índice | Sim (Auto ads anchor, só rodapé) | Anúncio entre título e imagem de capa; dentro de listas/checklists; a menos de 400 caracteres de botão de afiliado; em notícias com < 300 palavras (então só Slot 1) |
| **Pai Indica** `/pai-indica/$slug` (review, comparativo, lista) | In-article após a seção "Veredito em 30 segundos" (antes de "Como avaliamos") | In-article após a tabela comparativa (nunca dentro dela nem entre card e botão) | In-article antes da FAQ | 1 retângulo 300×600 | Sim | Entre o card do produto e seu botão "Comprar agora na Amazon"; ao lado da `ScoreScale`; páginas com < 600 palavras editoriais |
| **Loja** `/loja`, `/loja/categoria/$slug` | Multiplex após a 8ª linha de produtos | — | — | Não | Não | Qualquer anúncio acima do 1º produto; em `/loja/ofertas` (página majoritariamente afiliada: sem AdSense) |
| **Produto** `/loja/$slug` | In-article dentro da review longa, após o 2º `h2` (≥ 400 caracteres do botão) | — | — | Não (botão de compra fica na sidebar) | Não | Perto do botão, dos preços (faixa) e da galeria |
| **Ferramenta** `/ferramentas/$slug` | Retângulo **abaixo do bloco de resultado**, separado por `<hr>` e rótulo, nunca ao lado de inputs/botões | In-article ao fim do texto explicativo "Como usar / Como calculamos" (texto obrigatório ≥ 300 palavras por ferramenta) | — | 1 retângulo, só desktop, só se a ferramenta não tiver sidebar de controles | Não | Qualquer anúncio entre o formulário e o botão "Calcular/Converter"; em `/ferramentas/mercado-financeiro` junto de tabelas com atualização automática (anúncio só após o texto) |
| **Categoria** `/categoria/$slug` | Multiplex após o 6º card | — | — | Não | Não | Categorias com < 5 posts (sem anúncio e `noindex`) |
| **Irmandade** `/historias/$id`, `/perguntas/$slug` | In-article após o corpo principal (UGC moderado conta como conteúdo) | — | — | 1 retângulo | Não | Em formulários (`/nova`), fila de moderação, perfil |

### 2.5 Rotas SEM anúncio (lista fixa em `src/lib/ads/no-ads-routes.ts`)

`/busca`, `/404`, `/entrar`, `/cadastro`, `/minha-conta`, `/area-do-pai/*`, `/admin/*`, `/newsletter/confirmar`, `/newsletter/obrigado`, `/sobre`, `/contato`, `/politica-*`, `/termos-de-uso`, `/anuncie`, `/pai-indica-pai/vagas/nova`, `/historias/nova`, `/loja/ofertas`, qualquer `/categoria/$slug` com `< 5` posts, qualquer página com `< 300` palavras de conteúdo editorial, e qualquer página para usuário com assinatura ativa.

### 2.6 ads.txt

- Arquivo estático `public/ads.txt` servido em `https://vocacaodepai.com.br/ads.txt` (apex). Linha: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` (PR §5.4, https://support.google.com/adsense/answer/12171612). Se o site rodar em `www`, o apex deve redirecionar para `www/ads.txt` (redirects só dentro do mesmo domínio raiz).
- Verificação de propriedade: além do loader no `<head>`, incluir `<meta name="google-adsense-account" content="ca-pub-XXXX">` no root (útil porque a home não terá anúncio acima da dobra).
- Após aprovação, conferir "last crawled" do ads.txt no painel; mudanças levam dias (até 1 mês com pouco tráfego).

### 2.7 Consentimento (LGPD + EEE)

- Banner próprio em PT-BR no padrão do Guia ANPD (PR §5.5): 1º nível com "Aceitar", **"Rejeitar não necessários"** (mesmo destaque) e "Gerenciar"; 2º nível com categorias Necessários (sempre ativos) / Analíticos / Publicidade **desativadas por padrão**; link permanente "Gerenciar cookies" no rodapé; log de consentimento (`localStorage` + evento `tool_usage`-like opcional) com timestamp e versão do banner.
- Google Consent Mode v2: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` = `denied` até aceite; com rejeição, servir anúncios não personalizados.
- EEE/UK/CH: ativar a CMP gratuita do Google (Privacy & messaging > European regulations); a política é acionada pela localização do **visitante**, não do site (PR §5.5). Revisar os toggles automáticos de 2026 ("Consent message optimization", gatilhos de vignette) e **desativar vignette** ou limitar a 1 por sessão.
- GA4 só carrega após consentimento analítico (padrão do PAI).

### 2.8 Política para site de família / crianças

- O Vocação de Pai é um site **para homens adultos** (pais), não um site "dirigido a crianças". Não marcar como child-directed; manter linguagem adulta e sóbria. Isso evita as restrições de anúncios para público infantil e mantém o inventário normal.
- Imagens de crianças: só stock licenciado (Pexels/Unsplash/Wikimedia) ou próprias com consentimento escrito. Em `historias`, `perguntas` e `events`, a moderação (`moderation_log`) rejeita fotos com rosto de menores enviadas por membros, e-mails/telefones de terceiros e dados de localização de crianças.
- Saúde do homem e saúde da criança são YMYL: todo artigo da categoria `corpo-e-saude-do-homem` e dos temas médicos de `paternidade-por-fase` traz fontes (SBU, SBP, Ministério da Saúde, OMS), data de revisão e aviso "não substitui consulta médica". Sem isso o AdSense pode classificar como "conteúdo de baixa qualidade" e o Google como YMYL fraco.
- Temas conjugais (categoria `casamento-e-familia`): tratar intimidade com discrição e sem imagens sugestivas; nenhum conteúdo adulto/explícito (política de conteúdo sexual do AdSense).
- Restrições de publisher (PR §5.3, https://support.google.com/adsense/answer/10437795): "facas táticas"/canivetes automáticos, acessórios de armas, tabaco/vape, **venda online de álcool**, suplementos com ingredientes perigosos. Decisões: (a) facas de churrasco são utensílios de cozinha — permitido; nada de "faca tática"; (b) conteúdo sobre cerveja/vinho no churrasco é permitido com moderação, mas **a Loja não lista bebidas alcoólicas** (mesmo com 13% de comissão na Amazon) e não há "melhores cervejas" no Pai Indica; (c) suplementos: só creatina/whey de marcas com registro, com fontes, nunca "para emagrecer rápido"; (d) armas/caça: fora da pauta.
- Conteúdo religioso (fé católica) é permitido pelo AdSense; manter respeito a outras crenças e jamais atacar grupos.

### 2.9 O que evitar (resumo PR §5.10)

- Pedir revisão cedo demais (categorias vazias, institucionais genéricas, < 40 artigos).
- Artigos só "melhores X" com texto reescrito da Amazon (thin affiliation).
- Preços e estrelas copiados da Amazon; imagens re-hospedadas da Amazon sem licença.
- Anúncios em pop-ups/overlays; rótulos enganosos; anúncio colado no box de produto; anúncio ao lado de menu/botão/tabela interativa.
- Anúncios em páginas sem conteúdo (busca vazia, 404, obrigado, login, tags).
- Densidade mobile > 30%; vignette agressivo; sticky que cobre conteúdo.
- Banner dark pattern ("OK/Ciente" único); ignorar o EEE.
- Reservar espaço de anúncio via JS; push duplicado em navegação client-side.

---

## 3. Amazon Associados Brasil

Fonte primária: Contrato Operacional (https://associados.amazon.com.br/help/operating/agreement, 15/10/2025) e Políticas do Programa (https://associados.amazon.com.br/help/operating/policies, vigência 14/04/2026), lidos em PR §6.

### 3.1 Aviso de afiliado (Cláusula 5 — PR §6.2)

Frase exata, exibida de forma clara e destacada:

> **"Como participante do Programa de Associados da Amazon, sou remunerado pelas compras qualificadas efetuadas."**

Implementação (constante em `src/lib/affiliate/disclosure.ts`): renderizar (1) em `<aside class="aviso-afiliado">` **acima do primeiro link de afiliado** de todo review/comparativo/lista/produto; (2) no rodapé global; (3) em `/politica-de-afiliados` com o complemento "Este conteúdo contém publicidade na forma de links de afiliado (CONAR/CDC art. 36)". Teste de build (`scripts/check-affiliate.ts`): falha se uma página renderizada com `?tag=` não contiver a frase. Proibido sugerir endosso ("recomendado pela Amazon", "parceiro oficial").

### 3.2 Links (PR §6.3)

- Formato: `https://www.amazon.com.br/dp/{ASIN}?tag={ID}-20`. Componente `<AmazonButton asin tag>` → `rel="sponsored nofollow noopener"`, `target="_blank"`, texto **sempre "Comprar agora na Amazon"** (regra do grupo; nunca "Ver preço na Amazon").
- Tracking IDs por canal (permitido): `vdp-review-20`, `vdp-comparativo-20`, `vdp-lista-20`, `vdp-loja-20`, `vdp-news-20` (newsletter), `vdp-tool-20` (ferramentas). Salvar em `products.affiliate_url` o link já com a tag da Loja; o renderer troca a tag conforme o contexto.
- Proibido: encurtadores (exceto `amzn.to` do SiteStripe), redirects internos `/go/...`, links em PDFs/e-books, pop-ups, e-mails não solicitados, extensões, iframes com Amazon, incentivo (cashback/sorteio) por clicar, compras próprias, anúncios pagos apontando para a Amazon (desqualificado desde 14/04/2026), "amazon/amzn/kindle" em domínio ou handles.
- Lint de conteúdo na rotina: bloquear qualquer `href` amazon.com.br sem `?tag=`, qualquer `bit.ly`/`tinyurl`.

### 3.3 Preço: sem preço exato (PR §6.4 + regra do grupo VDM)

- A Amazon só permite exibir preço/disponibilidade vindos da API ou de widget oficial, com carimbo de data/hora. O grupo **não exibe preço da Amazon**: exibe **faixa de preço pesquisada na internet** (`products.price_min`/`price_max`, `price_range_checked_at`, histórico em `product_price_checks`), com o texto fixo "Faixa consultada na internet em DD/MM/AAAA; não é o preço da Amazon, que pode variar".
- Regra da faixa: 2 lojas, mesma marca/modelo/cor, `max ≤ 3 × min`; sem pesquisa, faixa estimada (−15% / +20% do último `price`) rotulada "estimativa".
- Texto corrido nunca contém valor em R$, "desconto de X%", "menor preço", "promoção", "frete grátis", "cupom", "estrelas", "N avaliações" associados à Amazon. Validador regex na rotina (`scripts/rotina/validate_post.py`) reprova o artigo.
- Toda menção a evento com prazo (Prime Day, Black Friday) carrega `valid_until` no `posts.review`/`comparison` jsonb; job diário neutraliza trechos vencidos.

### 3.4 Imagens e avaliações (PR §6.5–6.6)

- Sem Creators API não há caminho oficial para imagens da Amazon. Padrão do grupo (VDM): fotos oficiais do produto são usadas via URL da galeria, sem download/re-hospedagem; campo `products.images` jsonb com `source` (`own`, `manufacturer`, `stock`, `amazon_gallery`). Nunca screenshots, nunca overlays. Em caso de dúvida, foto do fabricante ou stock.
- **Nunca** copiar/parafrasear avaliações da Amazon nem exibir "4,7 estrelas (12.345)". `products.rating`/`rating_count` são **nota própria do Pai Indica** (0–10 convertida) e número de avaliações de **membros do site**.

### 3.5 Aprovação, 180 dias / 3 vendas, dormência (PR §6.12)

- Após a inscrição: **3 vendas qualificadas em 180 dias** (https://associados.amazon.com.br/help/node/topic/G7MJTPEP9NC3YKMG) ou a conta é cancelada; conta rejeitada **não é restabelecida** (só nova candidatura). 1 ano sem venda = encerramento por ociosidade. Compras próprias/família causam rejeição definitiva.
- Fluxo: inscrever só com ≥ 20 artigos originais públicos + aviso + política de privacidade (Fase 2 concluída). Nos primeiros 180 dias priorizar pautas de fundo de funil (Pai Indica de ferramentas, churrasqueiras, facas, cadeirinhas, relógios — ver backlog 12).
- Venda qualificada: clique → compra em 24h (sessão) → envio/pagamento em até 180 dias, sem devolução (PR §6.11). Pagamento ~60 dias após o mês, depósito no Brasil, mínimo R$ 30.

### 3.6 PA-API / Creators API (PR §6.10)

- **PA-API 5 está descontinuada** (403 `AccessDeniedException`; desligamento maio/2026). Substituta: **Creators API**, exige **≥ 10 vendas qualificadas nos últimos 30 dias**, credenciais via Associates Central (Tools > Creators API), OAuth 2.0, `partnerTag` brasileiro `-20`, marketplace `www.amazon.com.br`.
- Decisão: o site nasce em **"modo sem API"** (CTA sem preço, faixa pesquisada, fotos conforme §3.4). Quando atingir 10 vendas/30 dias, criar `src/lib/affiliate/creators-api.ts` (GetItems até 10 ASINs, revalidação ≤ 24h, nunca persistir URL de imagem > 24h, exibir texto da API com aviso "AS IS"). O ASIN é a única coisa persistida (`products.asin`).
- Nenhum crawler/scraper em amazon.com.br (PR §6.7); user-agent de qualquer agente HTTP que toque a Amazon: `Agent/vocacaodepai`.

### 3.7 Tabela de comissões (PR §6.14 — https://associados.amazon.com.br/help/node/topic/GRXPHT8U84RAYDXZ)

| Taxa | Categorias relevantes para o pai |
|---|---|
| 13% | Bebê, Saúde e Cuidados Pessoais, Aparelhos de Cuidados Pessoais (barbeadores), Alimentos e Bebidas, Audiolivros |
| 11% | Roupas |
| 10% | Livros, Livros Digitais |
| 9,5% | Dispositivos Amazon (Echo, Fire TV, Kindle) |
| 8% | Esportes, Brinquedos, Casa, Construção e Reforma, **Ferramentas**, **Cozinha** (churrasqueiras, facas), Eletrônicos, Informática, Celulares, Games |
| 7% | Relógios, Malas, Calçados, **Automotivo** |

Bounties: Prime R$ 9, Kindle Unlimited R$ 15, Audible/Music, **Lista do Bebê R$ 6 + R$ 6** (usar em artigos de pai de primeira viagem). Priorizar pautas de ticket alto × taxa alta: bebê (cadeirinha, carrinho), cuidados pessoais (barbeador, aparador), ferramentas, churrasco.

### 3.8 CONAR (PR §6.15)

Desde 01/06/2026, comissão por link = publicidade: identificação clara, ostensiva e na primeira tela. Nos posts sociais que divulgam Pai Indica, usar `#publi` + ferramenta nativa de parceria paga.

---

## 4. Outras redes de afiliados (PR §6.16)

Schema já previsto: `products.affiliate_network` (default `amazon`) e `products.marketplace_urls` jsonb, formato:

```json
{ "mercadolivre": {"url": "https://...", "checked_at": "2026-11-01"},
  "shopee": {"url": "https://...", "checked_at": "2026-11-01"},
  "magalu": {"url": "https://...", "checked_at": "2026-11-01"} }
```

Regra visual: o botão principal é sempre "Comprar agora na Amazon"; os demais aparecem como links secundários "Ver no Mercado Livre / Ver na Shopee / Ver no Magalu" **abaixo**, com `rel="sponsored nofollow noopener"` e a mesma camada de aviso. **Não** misturar conteúdo vindo da API da Amazon (quando houver) em páginas que ofereçam o mesmo item em outra loja (PR §6.8) — enquanto houver só o modo sem API, não há conflito.

| Rede | Quando usar no VDP | Comissão (PR §6.16, confiança média/baixa) | Requisitos | Adapter |
|---|---|---|---|---|
| **Mercado Livre Afiliados** | Ferramentas, automotivo, churrasqueiras grandes, peças de carro/moto (categorias onde a Amazon é fraca) | 8% Ferramentas/Construção/Acessórios para veículos; 4% eletrônicos; venda indireta = metade; cookie ~24h | CPF, conta Mercado Pago, canal aprovado; mínimo R$ 80 com 3 compradores | `src/lib/affiliate/mercadolivre.ts` (link com `matt_tool`/`matt_word` do painel) |
| **Shopee Afiliados** | Acessórios baratos (afiadores, luvas, organizadores), itens < R$ 100 | até 10% Casa/Esportes, 8% eletrônicos; cookie 7 dias; saque mínimo ~R$ 10 | Conta Shopee; blogs aceitos | `shopee.ts` (links do painel) |
| **Parceiro Magalu** | Eletrodomésticos, bebê, brinquedos (Dia das Crianças) | 2–12% por nível; mínimo R$ 50 | CPF/PIS | `magalu.ts` |
| **Hotmart** (infoprodutos) | Cursos de churrasco, finanças, formação católica masculina de terceiros; e **nossos próprios produtos digitais** (§7) | Definida por produto (30–60% para afiliados de terceiros) | Conta Hotmart | `hotmart.ts` (hotlink) — sempre com aviso de afiliado; nunca em PDFs |
| **Awin** (Centauro, Casas Bahia) | Fase 2 (esporte, eletro) | Varia; pode exigir depósito | — | adiar |

Critério para ativar cada rede: só após 3 vendas confirmadas na Amazon e só nas categorias listadas; cada link novo passa pelo mesmo lint (aviso presente, `rel="sponsored"`, sem preço em texto).

---

## 5. Newsletter (Resend)

### 5.1 Decisões

- Provedor: **Resend** (já usado no grupo; PAI usa só no contato — a newsletter é construída do zero aqui). Domínio de envio: `news.vocacaodepai.com.br` (SPF/DKIM/DMARC no DNS da Vercel). Remetente: `Vocação de Pai <ola@news.vocacaodepai.com.br>`; reply-to `contato@vocacaodepai.com.br`.
- Dois produtos de e-mail: **"Jogada do Dia"** (diário, 5 linhas, 1 ação prática + 1 link; inspirado no "Play of the Day" do All Pro Dad) e **"A Semana do Pai"** (semanal, sexta 7h: 3 artigos, 1 Pai Indica, 1 ferramenta, 1 vaga/evento). Assinante escolhe a frequência.
- Tabela única: `newsletter_subscribers (id, email unique, user_id, status, segments jsonb, confirmed_at)`. `status` ∈ `pending | confirmed | unsubscribed | bounced`. `segments` jsonb:

```json
{ "frequencia": "diaria" | "semanal",
  "fases": ["gestacao","0-1","1-3","3-6","6-10","10-14","14-18","adulto"],
  "interesses": ["churrasco","ferramentas","carro","dinheiro","fe","saude","carreira","esporte"],
  "origem": "home|post|ferramenta|cadastro|loja",
  "token": "uuid", "welcome_step": 0, "welcome_next_at": "2026-11-02T10:00:00Z",
  "last_sent_at": null, "utm_source": null }
```

### 5.2 Fluxo de captura (double opt-in — obrigatório, PR §6.3 e LGPD)

1. Formulário (`<NewsletterForm>`) em: rodapé de todo artigo (após FAQ), sidebar desktop, barra fina na home, fim das ferramentas, passo 2 do `/cadastro` (checkbox pré-desmarcado → `profiles.newsletter_opt_in`). Campos: e-mail (obrigatório), fase do filho (select múltiplo, opcional), frequência (rádio diária/semanal, default semanal). Honeypot + `startedAt` (padrão do PAI).
2. Server function `POST /api/newsletter/inscrever`: valida e-mail, `upsert` com `status='pending'`, gera `segments.token`, envia **e-mail de confirmação** (abaixo). Resposta genérica "Verifique seu e-mail" (não revela se já existia).
3. `GET /newsletter/confirmar?token=...`: `status='confirmed'`, `confirmed_at=now()`, `welcome_step=0`, `welcome_next_at=now()`; redireciona a `/newsletter/obrigado` (sem anúncio) com link para completar perfil (fases/interesses) e para `/cadastro`.
4. Descadastro: link `GET /newsletter/sair?token=...` em todo e-mail (one-click, cabeçalho `List-Unsubscribe`), `status='unsubscribed'`. Webhook Resend `/api/newsletter/webhook` marca `bounced`/complaints.
5. Cron (Vercel Cron, `0 10 * * *` UTC = 7h Brasília) `GET /api/cron/newsletter`: (a) envia próximo e-mail de boas-vindas para quem tem `welcome_next_at <= now()` e `welcome_step < 4`; (b) envia Jogada do Dia (diários) ou A Semana do Pai (sexta); (c) respeita `status='confirmed'` e consentimento.

Sem link de afiliado em e-mail não solicitado; como o opt-in é duplo e registrado (`confirmed_at`), links da Amazon em newsletter **são permitidos** (tag `vdp-news-20`), sempre com a frase de aviso no rodapé do e-mail.

### 5.3 Segmentação por fase do filho

- `fases` vem do formulário ou, para membros, é recalculada diariamente a partir de `children.birth_date` (função SQL `public.child_phase(birth_date)` → `0-1`, `1-3`, `3-6`, `6-10`, `10-14`, `14-18`, `adulto`; `gestacao` quando `birth_date > now()`).
- Jogada do Dia tem versões por fase: a rotina gera 1 jogada por fase por dia (8 textos de 5 linhas) a partir de posts publicados (`posts` com `category=paternidade-por-fase` e tag da fase). Quem tem várias fases recebe a do filho mais novo.
- Blocos dinâmicos de A Semana do Pai: artigo da fase + Pai Indica do interesse + ferramenta + vaga (se `interesses` inclui `carreira`) + evento próximo (por `profiles.uf`).

### 5.4 E-mail de confirmação (template `confirm.tsx`, React Email)

Assunto: `Confirme sua inscrição no Vocação de Pai`
```
Olá, pai.

Falta um clique para você entrar: confirme seu e-mail no botão abaixo.

[Confirmar inscrição]  → https://vocacaodepai.com.br/newsletter/confirmar?token={{token}}

Você escolheu receber: {{frequencia_humana}}. Dá para mudar quando quiser.
Se não foi você, ignore este e-mail — nada será enviado.

Vocação de Pai — vocacaodepai.com.br
```

### 5.5 Os 4 e-mails de boas-vindas (prontos — sequência D0, D2, D5, D9)

**E-mail 1 — D0 (logo após confirmar)** — assunto: `Bem-vindo à Vocação de Pai. Comece por aqui.`
```
Olá, {{nome|pai}}.

Você entrou num lugar feito para homens que levam a sério ser pai, marido e provedor.
Sem mimimi, sem machismo barato: coisa prática, fé firme e um bom churrasco no fim de semana.

Três coisas para fazer hoje (leva 10 minutos):

1. Faça o Check-up do Pai — 20 perguntas, um radar de 5 áreas (Presença, Provisão, Proteção, Fé, Corpo)
   e uma trilha recomendada no fim.
   → https://vocacaodepai.com.br/ferramentas/check-up-do-pai

2. Diga a idade do seu filho (ou se está a caminho). Tudo o que mandarmos passa a ser da fase dele.
   → https://vocacaodepai.com.br/newsletter/preferencias?token={{token}}

3. Leia o artigo que mais ajuda pais de primeira viagem:
   "Pai de primeira viagem: os 30 primeiros dias, hora a hora"
   → https://vocacaodepai.com.br/post/pai-de-primeira-viagem-30-primeiros-dias

Nos próximos dias você recebe mais três e-mails curtos: como funciona o Pai Indica (e por que a gente
nunca mostra preço exato), a Caixa de Ferramentas, e a Irmandade. Depois disso, só o que você escolheu:
{{frequencia_humana}}.

Um abraço,
Bruno Danello — Vocação de Pai

P.S.: responda este e-mail com uma frase: qual é a sua maior dificuldade como pai hoje? Eu leio todas.
```

**E-mail 2 — D2** — assunto: `Como a gente escolhe o que indicar (e por que não mostramos preço)`
```
{{nome|Pai}},

O Pai Indica é a nossa seção de reviews: individual, comparativo ("A ou B?") e lista ("os 7 melhores").
Cada produto recebe nota de 0 a 10 em 5 critérios e um veredito honesto — inclusive "não compre".

Três regras que você vai notar:
• Nunca mostramos preço exato. Mostramos uma FAIXA pesquisada em pelo menos duas lojas da internet,
  porque preço muda todo dia e a gente não quer te enganar.
• O botão é sempre "Comprar agora na Amazon". Se você comprar por ele, recebemos uma comissão — sem custo
  a mais para você. Isso paga o site. (Como participante do Programa de Associados da Amazon, somos
  remunerados pelas compras qualificadas efetuadas.)
• Todo review tem "Para quem é" e "Para quem NÃO é". Se você está no segundo grupo, a gente te fala.

Para começar:
→ Faca de churrasco: Tramontina Churrasco 8" ou Mundial? (comparativo)
  https://vocacaodepai.com.br/pai-indica/faca-de-churrasco-tramontina-ou-mundial
→ As 7 melhores furadeiras para o pai que faz tudo em casa
  https://vocacaodepai.com.br/pai-indica/melhores-furadeiras-para-casa

Quer que a gente avalie um produto? Responda este e-mail com o nome dele.

Bruno — Vocação de Pai
```

**E-mail 3 — D5** — assunto: `Sua Caixa de Ferramentas: conversor, mercado, churrasco e orçamento`
```
{{nome|Pai}},

Além dos artigos, o site tem ferramentas de verdade, grátis, sem cadastro:

• Conversor de moedas (dólar, euro, bitcoin → real) — para a viagem, a compra importada ou a conta do mês.
  https://vocacaodepai.com.br/ferramentas/conversor-de-moedas
• Mercado financeiro — Ibovespa, dólar, Selic, bitcoin, num painel só, com explicação em português claro.
  https://vocacaodepai.com.br/ferramentas/mercado-financeiro
• Calculadora de churrasco — quantos gramas de carne, pão, carvão e bebida por pessoa, e a lista de compras.
  https://vocacaodepai.com.br/ferramentas/calculadora-de-churrasco
• Orçamento da família — quanto sobra, quanto vai para a reserva e quanto é "dinheiro do pai".
  https://vocacaodepai.com.br/ferramentas/orcamento-familiar
• 15 minutos com seu filho — diga quanto tempo tem (5, 15 ou 60 min) e receba uma ideia para hoje.
  https://vocacaodepai.com.br/ferramentas/15-minutos

Salve as que usar: na Área do Pai elas ficam a um clique.

Bruno — Vocação de Pai
```

**E-mail 4 — D9** — assunto: `Nenhum pai cresce sozinho. Conheça a Irmandade.`
```
{{nome|Pai}},

Último e-mail de boas-vindas. Depois disso você recebe só {{frequencia_humana}}.

A Irmandade é a parte do site onde pais se ajudam:
• Perguntas & Respostas — pergunte sobre pensão, cólica, carro, fé, carreira; outros pais e nossos
  moderadores respondem. https://vocacaodepai.com.br/perguntas
• Histórias de pai — "Meu pai me ensinou": conte a sua, leia as dos outros. https://vocacaodepai.com.br/historias
• Pai Indica Pai — vagas de emprego indicadas por pais, diretório de profissionais e mentoria de 30 minutos
  com quem já passou pelo que você está passando. https://vocacaodepai.com.br/pai-indica-pai
• Formação — trilhas curtas (ex.: "33 dias com São José", "Primeiro ano do bebê para pais") com insígnias.
  https://vocacaodepai.com.br/formacao

Para participar, crie sua conta gratuita (1 minuto): https://vocacaodepai.com.br/cadastro

E uma pergunta que faço a todo pai que entra: quem é o seu "âncora" — o homem com quem você conversa
quando o peso aumenta? Se a resposta é "ninguém", a Irmandade é para você.

São José, rogai por nós.
Bruno Danello — Vocação de Pai
```

Rodapé fixo de todos os e-mails: endereço do grupo, "Como participante do Programa de Associados da Amazon, somos remunerados pelas compras qualificadas efetuadas." (quando houver link Amazon), link "Alterar preferências" e "Sair da lista".

### 5.6 KPIs de newsletter

Taxa de confirmação ≥ 60%; abertura ≥ 40% (semanal) / ≥ 45% (Jogada do Dia); clique ≥ 6%; descadastro < 0,5%/envio; bounces < 1%. Métricas gravadas via webhook do Resend e exibidas no Painel Lisieux.

---

## 6. Plano pago futuro — "Irmandade Premium"

### 6.1 Nome e posicionamento

- Plano gratuito: **"Irmão"** (`plans.slug = 'irmao'`, `price_cents = 0`): conta, salvar itens, perguntas, histórias, 2 e-books da Biblioteca do Pai, trilhas básicas, vagas.
- Plano pago: **"Irmandade Premium"** (`plans.slug = 'irmandade-premium'`). Promessa: *"Tudo o que o site tem, sem anúncio, com os grupos fechados e a Biblioteca completa — e se não ajudar você a ser um pai melhor em 30 dias, devolvemos o dinheiro."* (modelo "Apostolate Promise" do Exodus 90).

### 6.2 O que vender (features jsonb)

```json
["sem_anuncios", "biblioteca_completa", "trilhas_premium", "grupos_fechados_4a6",
 "ancora_semanal", "caderno_do_pai_pdf", "kit_encontro_pai_filho_mensal",
 "desconto_produtos_digitais_30", "selo_premium_perfil", "acesso_antecipado_turmas"]
```

- Sem anúncios (AdSense desligado para `subscriptions.status='active'`).
- Biblioteca do Pai completa (e-books §7) + novos títulos mensais.
- Trilhas premium (`tracks.is_premium = true`): "90 dias do Pai", "Finanças do provedor em 8 semanas", "Churrasco do Pai em vídeo".
- Grupos fechados de 4–6 homens com âncora e check-in semanal por e-mail (`mentorships`).
- Caderno do Pai em PDF ao concluir trilhas; Kit de Encontro Pai & Filho mensal (PDF).
- 30% de desconto nos produtos digitais; acesso antecipado às turmas (coortes).

### 6.3 Preço sugerido

| Intervalo | Preço | Observação |
|---|---|---|
| Mensal | **R$ 19,90** | `plans.interval='month'`, `price_cents=1990` |
| Anual | **R$ 149,00** (≈ R$ 12,40/mês, 2 meses grátis) | `interval='year'`, `price_cents=14900`; padrão destacado |
| Bolsa | R$ 0 sob pedido (formulário "Preciso de ajuda para pagar") | `subscriptions.provider='bolsa'`, aprovado em `/admin` |

Trial: 14 dias sem cobrança (cartão exigido) no anual; garantia de 30 dias (reembolso manual).

### 6.4 Provedor: Mercado Pago vs Stripe — decisão

| Critério | Mercado Pago | Stripe BR |
|---|---|---|
| Pix e boleto em assinatura | Sim (Pix recorrente via Assinaturas/preapproval desde 2025; boleto avulso) | Pix só avulso; sem boleto recorrente estável |
| Pessoa física (CPF) | Aceita CPF | Exige CNPJ e conta PJ |
| Taxa cartão | ~4,98% + R$ 0,49 (varia por plano de recebimento) | ~3,99% + R$ 0,39 + conversões |
| Webhooks/SDK | `mercadopago` npm, webhook `preapproval` | Excelente DX |
| Público do site | Pai brasileiro que paga com Pix/cartão nacional | Internacional |

**Decisão: Mercado Pago primeiro** (`subscriptions.provider = 'mercadopago'`, `provider_id` = id do preapproval). Stripe fica reservado para o futuro (cartão internacional) sem mudança de schema. Implementação (fase pós-plano, pré-requisito Fase 5): server functions `/api/assinatura/criar`, `/api/assinatura/webhook` (valida assinatura do header, atualiza `subscriptions.status` e `current_period_end`), página `/area-do-pai/assinatura`. Nunca armazenar dados de cartão; só ids do provedor.

### 6.5 Gatilhos para lançar

≥ 1.000 membros gratuitos **e** ≥ 20.000 sessões/mês **e** ≥ 4 trilhas publicadas **e** Biblioteca com ≥ 5 e-books. Meta de conversão: 2–3% dos membros ativos no primeiro trimestre pós-lançamento.

---

## 7. Produtos digitais do pai

Todos entregues por e-mail (Resend) após pagamento, hospedados em Supabase Storage (bucket privado `digital-products`, URL assinada 7 dias). Checkout: **Hotmart** no início (cuida de nota fiscal, afiliados e reembolso) e migração para Mercado Pago quando o plano pago existir. **Nenhum link de afiliado dentro dos PDFs** (PR §6.3).

| # | Produto | Formato | Conteúdo | Preço | Isca gratuita derivada |
|---|---|---|---|---|---|
| 1 | **Guia do churrasco do pai** (e-book) | PDF 60–80 páginas + versão Kindle depois | 12 cortes com diagrama, ponto da carne por espessura, fogo (carvão/lenha/gás), acompanhamentos, calculadora impressa, 10 erros do semáforo, cardápios para 6/12/20 pessoas, receitas de 3 molhos | **R$ 29,90** (lançamento R$ 19,90) | Capítulo "Os 5 cortes que todo pai precisa dominar" (PDF, troca por e-mail confirmado) |
| 2 | **Planilha de orçamento da família do pai** | Google Sheets + Excel | Abas: renda, fixos, variáveis, reserva de emergência, "dinheiro do pai", filhos (escola, saúde), metas, dashboard; versão com Bitcoin/investimentos | **R$ 24,90** | Versão enxuta (3 abas) gratuita em `/ferramentas/orcamento-familiar` (download) |
| 3 | **Checklist do pai de primeira viagem** | PDF imprimível 12 páginas + versão web na Área do Pai | Pré-natal (consultas que o pai vai), mala da maternidade do pai, documentos (certidão, CPF, plano), licença-paternidade (como pedir), primeiras 72h, 30 dias, lista de compras com faixa de preço | **R$ 14,90** | Checklist "72 horas" gratuito como lead magnet no cluster de primeira viagem |
| 4 (mês 6+) | Kit de Encontro Pai & Filho (12 PDFs) | PDF mensal | Roteiro de 35 min: pergunta, jogo, virtude do mês, oração | R$ 39,90/ano (incluso no Premium) | 1 kit grátis |
| 5 (mês 9+) | Curso "Churrasco do Pai" em vídeo | 8 aulas, na Formação | Do fogo ao corte | R$ 97 (Premium: R$ 67) | Aula 1 grátis |

Produção: texto pelo redator do grupo a partir dos artigos já publicados (reaproveitar os clusters 3, 6 e 1), diagramação via Canva (modelo da marca), revisão humana obrigatória. Página de vendas em `/loja/digital/$slug` (sem AdSense). Metas: 100 vendas no 1º trimestre após lançamento somando os 3 produtos.

---

## 8. SEO

### 8.1 Os 15 clusters de palavras-chave (PT-BR)

Legenda — Intenção: **I** informacional, **C** comercial, **N** navegacional, **T** transacional. Formato: `padrao-a` (artigo informativo com semáforo/FAQ/quiz), `guia` (pilar longo), `noticia`, `review`, `comparativo`, `lista`, `ferramenta`. Hub = página pilar do cluster (artigo `guia` + categoria).

**Cluster 1 — Pai de primeira viagem** (hub: `/post/guia-do-pai-de-primeira-viagem`; categoria `paternidade-por-fase`)
| Keyword | Int. | Formato |
|---|---|---|
| pai de primeira viagem | I | guia |
| o que o pai faz no parto | I | padrao-a |
| como segurar um recém-nascido | I | padrao-a |
| mala da maternidade do pai | I/C | padrao-a + lista |
| pai pode dormir no hospital | I | padrao-a |
| como ajudar a esposa no pós-parto | I | padrao-a |
| primeira semana do bebê em casa | I | padrao-a |
| cólica do bebê o que o pai pode fazer | I | padrao-a |
| depressão pós-parto paterna | I | padrao-a (YMYL, fontes) |
| checklist do pai de primeira viagem | I/T | ferramenta/produto digital |

**Cluster 2 — Licença-paternidade e direitos do pai** (hub: `/post/licenca-paternidade-guia-completo`; categoria `direitos-do-pai`)
| Keyword | Int. | Formato |
|---|---|---|
| licença paternidade quantos dias | I | padrao-a |
| licença paternidade 20 dias empresa cidadã | I | padrao-a |
| como pedir licença paternidade | I | padrao-a |
| licença paternidade CLT 2026 | I | noticia/padrao-a |
| licença paternidade servidor público | I | padrao-a |
| licença paternidade MEI e autônomo | I | padrao-a |
| pensão alimentícia quanto é | I | padrao-a |
| guarda compartilhada como funciona | I | guia |
| direito do pai de registrar o filho | I | padrao-a |
| salário-família quem tem direito | I | padrao-a |

**Cluster 3 — Churrasco e cortes de carne** (hub: `/ferramentas/cortes-de-carne` + `/post/guia-dos-cortes-de-carne-para-churrasco`; categoria `churrasco-e-cozinha`)
| Keyword | Int. | Formato |
|---|---|---|
| cortes de carne para churrasco | I | guia |
| picanha como escolher | I | padrao-a |
| ponto da carne tempo de cada lado | I | padrao-a + tabela própria |
| quanto de carne por pessoa churrasco | I/T | ferramenta (calculadora) |
| fraldinha ou maminha diferença | I | padrao-a |
| como acender churrasqueira sem álcool | I | padrao-a |
| melhor churrasqueira a carvão | C | lista |
| melhor faca de churrasco | C | comparativo/lista |
| costela no bafo quanto tempo | I | padrao-a |
| sal grosso ou sal de parrilla | I | padrao-a |

**Cluster 4 — Ferramentas e reparos em casa** (hub: `/post/caixa-de-ferramentas-basica-do-pai`; categoria `caixa-de-ferramentas-e-reparos`)
| Keyword | Int. | Formato |
|---|---|---|
| ferramentas básicas para ter em casa | I/C | guia + lista |
| melhor furadeira para uso doméstico | C | lista |
| parafusadeira ou furadeira qual comprar | C | comparativo |
| como furar parede sem rachar | I | padrao-a |
| como trocar resistência do chuveiro | I | padrao-a (semáforo elétrico) |
| como desentupir pia | I | padrao-a |
| como instalar suporte de TV | I | padrao-a |
| kit ferramentas tramontina vale a pena | C | review |
| como trocar tomada | I | padrao-a |
| melhor parafusadeira a bateria | C | lista |

**Cluster 5 — Carro e moto** (hub: `/post/manutencao-do-carro-guia-do-pai`; categoria `carro-e-moto`)
| Keyword | Int. | Formato |
|---|---|---|
| cadeirinha de bebê para carro como escolher | I/C | guia + lista |
| melhor cadeirinha de carro | C | lista |
| como trocar pneu furado | I | padrao-a |
| quando trocar óleo do carro | I | padrao-a |
| carro de 7 lugares barato | C | lista |
| melhor SUV para família | C | lista |
| luz da injeção acesa o que fazer | I | padrao-a |
| como calibrar pneu | I | padrao-a |
| kit de emergência para carro | C | lista |
| vale a pena comprar carro usado | I | padrao-a |

**Cluster 6 — Dinheiro do pai / orçamento** (hub: `/post/orcamento-familiar-guia-do-pai`; categoria `dinheiro-do-pai`)
| Keyword | Int. | Formato |
|---|---|---|
| planilha de orçamento familiar | I/T | ferramenta + produto |
| quanto custa criar um filho no brasil | I | padrao-a (dado próprio) |
| reserva de emergência quanto guardar | I | padrao-a |
| como sair das dívidas | I | guia |
| mesada quanto dar | I | padrao-a |
| como ensinar filho a lidar com dinheiro | I | padrao-a |
| seguro de vida vale a pena para pai | I/C | padrao-a |
| previdência privada para filho | I/C | padrao-a |
| quanto custa escola particular | I | padrao-a |
| cartão de crédito para filho adolescente | I/C | padrao-a |

**Cluster 7 — Investimentos e bitcoin** (hub: `/post/como-comecar-a-investir-guia-do-pai`; categoria `dinheiro-do-pai`, subcategoria `investimentos`)
| Keyword | Int. | Formato |
|---|---|---|
| como começar a investir com pouco dinheiro | I | guia |
| tesouro direto para iniciantes | I | padrao-a |
| bitcoin vale a pena para iniciante | I | padrao-a |
| como comprar bitcoin com segurança | I | padrao-a |
| carteira de bitcoin fria o que é | I/C | padrao-a + review |
| investir para filho desde o nascimento | I | padrao-a |
| CDB ou tesouro selic | I | comparativo |
| dólar vai subir | I | ferramenta (mercado) + noticia |
| fundos imobiliários como funcionam | I | padrao-a |
| cotação do dólar hoje | N/I | ferramenta (conversor) |

**Cluster 8 — Saúde do homem** (hub: `/post/check-up-do-homem-guia`; categoria `corpo-e-saude-do-homem`)
| Keyword | Int. | Formato |
|---|---|---|
| exames que todo homem deve fazer | I | guia (YMYL) |
| exame de próstata com que idade | I | padrao-a |
| testosterona baixa sintomas | I | padrao-a |
| como perder barriga depois dos 40 | I | padrao-a |
| treino para pai sem tempo | I | padrao-a |
| sono do pai com bebê recém-nascido | I | padrao-a |
| pressão alta no homem jovem | I | padrao-a |
| calvície o que funciona | I/C | padrao-a + lista |
| vasectomia como funciona | I | padrao-a |
| burnout paterno sinais | I | padrao-a |

**Cluster 9 — Fé e virtude / São José** (hub: `/post/sao-jose-modelo-de-pai`; categoria `fe-e-virtude`)
| Keyword | Int. | Formato |
|---|---|---|
| são josé padroeiro dos pais | I | guia |
| consagração a são josé 33 dias | I/T | trilha + padrao-a |
| oração de são josé pelos filhos | I | padrao-a |
| dia de são josé 19 de março | I | padrao-a/noticia |
| são josé operário 1 de maio | I | padrao-a |
| como rezar o terço em família | I | padrao-a |
| como ser um bom pai católico | I | guia |
| liderança espiritual do homem na família | I | padrao-a |
| exodus 90 o que é | I | padrao-a |
| bênção do pai sobre os filhos | I | padrao-a |

**Cluster 10 — Casamento e família** (hub: `/post/como-ser-um-bom-marido`; categoria `casamento-e-familia`)
| Keyword | Int. | Formato |
|---|---|---|
| como ser um bom marido | I | guia |
| casamento depois do primeiro filho | I | padrao-a |
| como dividir tarefas de casa | I | padrao-a |
| crise no casamento o que fazer | I | padrao-a |
| linguagens do amor da esposa | I | padrao-a |
| noite de encontro com a esposa ideias | I | lista |
| como lidar com a sogra | I | padrao-a |
| presente para esposa no pós-parto | C | lista |
| como pedir desculpas para a esposa | I | padrao-a |
| casamento católico renovação de votos | I | padrao-a |

**Cluster 11 — Provedor e carreira** (hub: `/post/pai-provedor-carreira-e-familia`; categoria `provedor-e-carreira`)
| Keyword | Int. | Formato |
|---|---|---|
| como pedir aumento de salário | I | padrao-a |
| como fazer um currículo bom | I | padrao-a |
| trabalhar em casa com filho pequeno | I | padrao-a |
| segunda fonte de renda para pai | I | lista |
| como abrir MEI | I | padrao-a |
| entrevista de emprego perguntas | I | padrao-a |
| vagas de emprego home office | N/T | `/pai-indica-pai/vagas` |
| como fazer networking | I | padrao-a |
| demissão o que fazer | I | padrao-a |
| conciliar trabalho e família | I | guia |

**Cluster 12 — Esporte e lazer com os filhos** (hub: `/post/o-que-fazer-com-os-filhos-no-fim-de-semana`; categoria `esporte-e-lazer-com-os-filhos`)
| Keyword | Int. | Formato |
|---|---|---|
| o que fazer com os filhos no fim de semana | I | guia (série "Fim de semana de 940") |
| brincadeiras de pai e filho | I | lista |
| como ensinar filho a andar de bicicleta | I | padrao-a |
| acampar com crianças o que levar | I/C | padrao-a + lista |
| pescaria com filho iniciante | I | padrao-a |
| melhor bicicleta infantil | C | lista |
| jogos de tabuleiro para família | C | lista |
| ensinar filho a jogar futebol | I | padrao-a |
| trilha com crianças | I | padrao-a |
| filmes para ver com os filhos | I | lista viva |

**Cluster 13 — Estilo e cuidados do homem** (hub: `/post/guia-de-estilo-do-pai`; categoria `estilo-e-cuidados`)
| Keyword | Int. | Formato |
|---|---|---|
| como cuidar da barba | I | padrao-a |
| melhor barbeador elétrico | C | lista |
| melhor aparador de barba | C | lista |
| perfume masculino bom e barato | C | lista |
| como se vestir bem com pouco dinheiro | I | padrao-a ("1 look, 3 orçamentos") |
| relógio masculino até 500 reais | C | lista |
| como passar camisa | I | padrao-a |
| skincare masculino básico | I | padrao-a |
| tênis para o dia a dia masculino | C | lista |
| corte de cabelo masculino clássico | I | padrao-a |

**Cluster 14 — Tecnologia do pai** (hub: `/post/tecnologia-para-pais-guia`; categoria `tecnologia-do-pai`)
| Keyword | Int. | Formato |
|---|---|---|
| controle parental como configurar | I | guia |
| melhor babá eletrônica | C | lista |
| celular para criança qual idade | I | padrao-a |
| melhor smartwatch infantil | C | lista |
| tempo de tela por idade | I | padrao-a |
| como bloquear sites no roteador | I | padrao-a |
| melhor caixa de som bluetooth | C | lista |
| melhor câmera de segurança residencial | C | lista |
| aplicativos para pais | I | lista |
| notebook para trabalhar em casa | C | lista |

**Cluster 15 — Presentes e datas do pai** (hub: `/loja/presentes`; sazonal/comercial)
| Keyword | Int. | Formato |
|---|---|---|
| presente de dia dos pais | C | lista (URL fixa sem ano, selo "Atualizado") |
| presente para pai que gosta de churrasco | C | lista |
| presente para pai de primeira viagem | C | lista |
| presente de natal para pai | C | lista |
| presente para sogro | C | lista |
| presente para esposa no dia das mães do pai | C | lista |
| presente para filho de 5 anos | C | lista |
| presente para padrinho | C | lista |
| black friday ferramentas vale a pena | C | guia sazonal |
| kit churrasco presente | C | lista |

### 8.2 Arquitetura de links internos — regras automáticas

Implementar em `src/lib/seo/internal-links.ts` (executado na renderização do post e na rotina de publicação) e em `scripts/rotina/link_audit.py` (auditoria semanal).

1. **Breadcrumb** em todo post: Home › Categoria › (Subcategoria) › Título, com JSON-LD `BreadcrumbList`.
2. **Hub ↔ spoke**: todo artigo de um cluster linka para o hub do cluster no 1º ou 2º parágrafo (âncora = keyword principal do hub); todo hub lista todos os spokes publicados (bloco "Neste guia" gerado por consulta `posts where category_id = X and tags && hub_tags`).
3. **"Leia também" (3 links)** após o 2º `h2`: mesma categoria, ordenados por `ts_rank(search_content, plainto_tsquery(title))`, excluindo o próprio post, só `status='published'`.
4. **Ponte editorial → comercial (1 link)**: todo artigo informativo linka 1 Pai Indica cujo `product_category` está no mapa `categoria_blog → product_category` (ex.: `churrasco-e-cozinha → churrasqueiras|facas`, `caixa-de-ferramentas-e-reparos → ferramentas-eletricas`, `carro-e-moto → cadeirinhas|acessorios-auto`, `paternidade-por-fase(0-1) → bebe`). Texto fixo: "No Pai Indica: {{título}}".
5. **Ponte → ferramenta (1 link)**: mapa `categoria → tool_slug` (`churrasco → calculadora-de-churrasco`, `dinheiro-do-pai → orcamento-familiar|conversor-de-moedas|mercado-financeiro`, `paternidade-por-fase → 15-minutos|check-up-do-pai`, `direitos-do-pai → calculadora-de-pensao`).
6. **Fase do filho**: posts com tag de fase linkam o hub `/blog/por-idade/{fase}`; o hub por idade lista posts por `publish_at desc`.
7. **Pai Indica → blog**: todo review/comparativo linka 2 artigos informativos do mesmo cluster (seção "Antes de comprar, leia").
8. **Loja ↔ Pai Indica**: página de produto linka o review (`posts.review->>'product_slug' = products.slug`) e vice-versa; categorias da loja linkam a lista "Os melhores" correspondente.
9. **Limites**: máximo 1 link de afiliado a cada 300 palavras em artigos informativos; máximo 12 links internos por artigo padrão-a; nenhum link para páginas `noindex` (busca, tags, admin, área logada).
10. **Âncoras**: nunca "clique aqui"; âncora = título ou keyword; sem repetir a mesma âncora para URLs diferentes no mesmo post.
11. **Órfãos**: auditoria semanal lista posts publicados com `< 3` links internos recebidos; a rotina adiciona "Leia também" nos 3 posts mais próximos.
12. **Sitemaps**: `/sitemap.xml` índice → `sitemap-posts.xml`, `sitemap-pai-indica.xml`, `sitemap-loja.xml`, `sitemap-ferramentas.xml`, `sitemap-paginas.xml`; `lastmod` real; notícias com `<news:news>` nas últimas 48h.
13. **Canonical** absoluto; paginação `?page=` com canonical na própria página e `noindex` a partir da página 3 de categoria; URLs sem ano (ex.: `/pai-indica/melhores-furadeiras-para-casa`), ano só no `title`/`h1` com selo "Atualizado em".
14. **Redirecionamentos**: mudança de slug cria linha em `seo_search_stats`? Não — usa tabela de redirects em `vercel.json`/middleware; o slug antigo nunca é reutilizado.

### 8.3 E-E-A-T

- **Autor real** (`profiles` com `role in ('editor','admin')`): página `/autor/$slug` com foto, bio, credenciais (pai de N filhos, profissão, formação), links sociais, lista de artigos; `Person` JSON-LD e `author` em todo `Article`. Autor principal: Bruno Danello. Conteúdo gerado pela rotina é publicado sob o autor humano que revisou (campo `author_id`) e traz "Revisado por" com data.
- **"Como avaliamos"** (`/politica-editorial`, link em todo Pai Indica): 5 critérios 0–10 (adaptados do AI Indica: desempenho, construção/durabilidade, custo-benefício na faixa, segurança/ergonomia, facilidade de uso), peso de cada um, escala (`ScoreScaleNote`), independência (ninguém paga por nota), como escolhemos os produtos, política de correção. Todo review traz a seção "Como avaliamos este produto" com o que foi de fato verificado (ficha técnica, manual, testes de terceiros, uso próprio quando houver — nunca inventar uso).
- **Um dado próprio por artigo** (PR §4.2 e §7.7): tabela consolidada própria, cálculo (ex.: custo por churrasco), medição, comparação de fichas, levantamento de preço de 2 lojas, consulta a norma (ABNT/Inmetro), entrevista curta.
- **Fontes com link** ao fim de artigos YMYL e de direitos (lei com número e artigo, portal do Planalto, TST, SBU, SBP, Ministério da Saúde, Banco Central para dados de mercado). Campo `posts.faq`/`body` inclui nó "Fontes".
- **Datas**: `publish_at` e `updated_at` visíveis; refresh anual de listas e guias (rotina marca "Atualizado em").
- **Dados estruturados**: `Article`/`NewsArticle`, `BreadcrumbList`, `FAQPage` (só quando a FAQ é visível), `Product` + `Review` com `author` para reviews individuais (nota própria, nunca agregada de terceiros — PR §4.6), `ItemList` para listas, `WebSite` com `SearchAction`.
- **Rel sponsored** em todo link de afiliado (PR §4.5).
- **Página "Sobre" com modelo de negócio explícito** e canal de correção (`/contato` com assunto "Correção").

### 8.4 Métricas de SEO (gravadas em `seo_search_stats` via Search Console API, exibidas no Painel Lisieux)

Cliques, impressões, CTR e posição média por página e por cluster; páginas indexadas vs publicadas; Core Web Vitals (CrUX) p75: LCP < 2,5 s, INP < 200 ms, CLS < 0,1; posts órfãos; posts sem link comercial.

---

## 9. Redes sociais — 20 ideias de vídeo curto (YouTube Shorts / Instagram Reels / TikTok)

Formato: 30–60 s, vertical, legenda queimada, CTA para o artigo/ferramenta (link na bio → `/links`). Produção: celular + microfone de lapela; 3 por semana; cada vídeo nasce de um artigo publicado (reaproveitamento). `#publi` quando houver produto afiliado.

| # | Ideia | Gancho (3 primeiros segundos) | Leva para |
|---|---|---|---|
| 1 | O ponto da picanha em 40 segundos | "Você está estragando a picanha assim" | `/post/ponto-da-carne-tempo-de-cada-lado` |
| 2 | Quanto de carne por pessoa (com a calculadora na tela) | "Churrasco para 12 pessoas: a conta certa" | `/ferramentas/calculadora-de-churrasco` |
| 3 | Fraldinha × maminha: como diferenciar no açougue | "O açougueiro te vende isso como aquilo" | artigo cluster 3 |
| 4 | Como acender a churrasqueira sem álcool em 5 minutos | "Pare de usar álcool na churrasqueira" | artigo |
| 5 | Como furar parede sem rachar (3 regras) | "Furou e rachou? Faltou isso" | artigo cluster 4 |
| 6 | Trocar a resistência do chuveiro com segurança | "Desliga o disjuntor. Sempre." | artigo + semáforo |
| 7 | Furadeira ou parafusadeira? 30 segundos para decidir | "Você comprou a errada" | comparativo Pai Indica |
| 8 | Licença-paternidade: 5 ou 20 dias? | "Seu RH pode estar te devendo 15 dias" | artigo cluster 2 |
| 9 | Quanto custa criar um filho no Brasil (nossa conta) | "R$ X até os 18 anos. Fizemos a conta." | artigo cluster 6 |
| 10 | Reserva de emergência do pai em 3 passos | "Se você perdesse o emprego hoje..." | artigo + planilha |
| 11 | Bitcoin para pai iniciante: o que NÃO fazer | "Não compre bitcoin assim" | artigo cluster 7 |
| 12 | Conversor de moedas: quanto custa aquela compra gringa de verdade | "Dólar + IOF + imposto = isso" | `/ferramentas/conversor-de-moedas` |
| 13 | Cadeirinha de carro: o erro que 7 em 10 pais cometem | "O cinto está frouxo e você não sabe" | artigo + lista |
| 14 | Como trocar pneu furado (com o filho ajudando) | "Ensina seu filho isso antes dos 12" | artigo cluster 5 |
| 15 | Os 5 exames que todo homem de 40 precisa | "Homem não vai ao médico. Até que vai tarde." | artigo cluster 8 |
| 16 | Treino de 12 minutos para pai sem tempo | "Sem academia, sem desculpa" | artigo |
| 17 | São José: por que ele é o modelo de pai (1 minuto) | "O homem que não disse uma palavra na Bíblia" | artigo cluster 9 |
| 18 | Bênção do pai sobre os filhos: como fazer hoje à noite | "Faça isso antes de dormir" | artigo |
| 19 | 15 minutos com seu filho: 3 ideias para hoje | "Você tem 15 minutos? Então tem tudo" | `/ferramentas/15-minutos` |
| 20 | Jogada do Dia (série diária) | "Jogada do dia: ..." | `/newsletter` |

Canais: YouTube (Shorts + 1 vídeo longo/mês: "Churrasco do Pai", "Reparo com o pai"), Instagram (Reels + carrossel do semáforo + Pai Indica em card), TikTok (Shorts reaproveitados), Pinterest (capas de listas/presentes — tráfego para cluster 15), WhatsApp/Telegram (canal da Irmandade com Jogada do Dia). Métricas no Painel Lisieux via YouTube Data API.

---

## 10. Parcerias

| Parceiro | O que propor | Benefício mútuo | Como medir |
|---|---|---|---|
| **Vocação de Mãe** (vocacaodemae.com.br) | Cross-link permanente no rodapé e na seção "Para a mãe / Para o pai"; série conjunta "Ela diz / Ele diz"; newsletter cruzada no Dia das Mães e Dia dos Pais; a Loja compartilha produtos de bebê (mesma base de ASINs, faixas de preço reaproveitadas) | Audiência feminina (metade do público de sites de pai é mulher — Fatherly) e vice-versa | UTM `vdm→vdp`, referrals no GA4 |
| **Portal da AI / Review Produtos / Blog do Bitcoin** (grupo) | Links contextuais (ferramentas de IA para o pai, reviews de eletrônicos, bitcoin); republicação cruzada de notícias de mercado | Autoridade de domínio do grupo | Referrals |
| **Paróquias e pastorais familiares** | Kit de Encontro Pai & Filho gratuito para pastorais; página `/eventos` divulgando encontros; cartaz com QR code | Canal offline → membros | `event_rsvps`, UTM `paroquia` |
| **Exodus 90 / Fraternus Brasil** (confirmar presença no Brasil antes de citar publicamente — res-sites marca "NÃO VERIFICADO") | Artigos explicativos, divulgação das turmas, código de parceiro se existir; convidar fraternidades para a Irmandade | Conteúdo de formação masculina já validado | Cliques, inscrições na trilha "90 dias do Pai" |
| **Churrascarias, açougues e marcas de churrasco** (Tramontina, Weber, Netão Bom Beef, Swift, Friboi) | Patrocínio da seção Churrasco (rótulo "Apresentado por", separado do editorial), produto para teste real (foto própria = E-E-A-T), receita assinada | Receita de patrocínio, dado próprio | Mídia kit `/anuncie`, CPM da seção |
| **Marcas de ferramentas e automotivo** (Tramontina PRO, Bosch, Makita, Vonder, Chevrolet/Fiat concessionárias locais) | Produto para teste; conteúdo "Reparo com o pai" patrocinado | Idem | Idem |
| **Escolas e cursos** (supletivo, técnico, idiomas) | Vagas e mentoria no Pai Indica Pai; descontos para membros | Receita via Hotmart/afiliado | Cliques em `jobs`/`mentorships` |
| **Influenciadores de paternidade BR** (Paizinho, Vírgula!; Nerd Pai; Café com Pais) | Entrevistas em "Histórias de pai"; troca de newsletters | Alcance | Referrals |

Regra: todo conteúdo patrocinado tem rótulo visível ("Conteúdo patrocinado por X"), não influencia nota do Pai Indica, e nunca mistura o Conteúdo do Programa da Amazon com promoção de outra loja na mesma página (PR §6.8).

---

## 11. Metas por trimestre (12 meses a partir do lançamento público) e KPIs

Premissas: lançamento público ao fim da Fase 3 (≈ 8 semanas após o início), rotina diária publicando 2 artigos Padrão A + 1 Pai Indica/dia a partir da Fase 8, benchmarks do Vocação de Mãe.

| Meta | T1 (meses 1–3) | T2 (4–6) | T3 (7–9) | T4 (10–12) |
|---|---|---|---|---|
| Artigos publicados (acumulado) | 150 | 330 | 520 | 720 |
| Pai Indica publicados (acumulado) | 40 | 100 | 170 | 240 |
| Produtos na Loja | 120 | 250 | 400 | 550 |
| Sessões/mês (GA4) | 8.000 | 30.000 | 80.000 | 150.000 |
| Páginas indexadas / publicadas | ≥ 80% | ≥ 90% | ≥ 92% | ≥ 95% |
| Assinantes newsletter confirmados | 500 | 2.000 | 5.000 | 10.000 |
| Membros (profiles) | 300 | 1.500 | 4.000 | 8.000 |
| Vendas Amazon qualificadas | ≥ 3 (destrava conta) | ≥ 10/30 dias (destrava Creators API) | 60/mês | 120/mês |
| Receita afiliados (R$/mês) | 150 | 800 | 2.500 | 5.000 |
| AdSense | Pedir revisão (mês 2–3) | Aprovado; RPM ≥ R$ 8 | R$ 600/mês | R$ 1.500/mês |
| Produtos digitais (vendas acumuladas) | — | 100 | 300 | 600 |
| Irmandade Premium (assinantes) | — | — | lançamento; 80 | 250 |
| Vagas aprovadas (`jobs`) | 20 | 80 | 200 | 400 |
| Perguntas respondidas (`questions` com `best_answer_id`) | 50 | 300 | 800 | 1.500 |
| Trilhas concluídas (`track_progress` 100%) | 50 | 300 | 900 | 2.000 |
| Vídeos curtos publicados | 24 | 60 | 100 | 140 |

### KPIs semanais (Painel Lisieux, tabela de origem entre parênteses)

- Tráfego: sessões, usuários, páginas/sessão, % orgânico (GA4); cliques/impressões/CTR/posição por cluster (`seo_search_stats`).
- Conteúdo: posts publicados/semana por `kind` e categoria (`posts`); % posts com dado próprio (checklist); órfãos (< 3 links recebidos).
- Monetização: cliques em "Comprar agora na Amazon" (`post_view_events` com `event='affiliate_click'`), CTR afiliado por template, pedidos/receita (relatório Amazon importado), RPM AdSense, receita/1.000 sessões total.
- Audiência: confirmados líquidos/semana, abertura e clique (`newsletter_subscribers` + webhook Resend); membros novos, membros ativos 7d (`profiles`, `tool_usage`, `track_progress`).
- Comunidade: vagas pendentes/aprovadas e tempo de moderação (`jobs`, `moderation_log`), perguntas sem resposta > 48h, histórias aprovadas, RSVPs (`event_rsvps`).
- Ferramentas: usos por ferramenta (`tool_usage`), cache hits do mercado (`market_cache`).
- Qualidade: CWV p75, erros 404, links quebrados, alertas do Policy Center do AdSense, alertas de ads.txt.

---

## 12. Critérios de aceite (o que cada fase deve entregar deste documento)

- **Fase 1**: institucionais (§2.2) publicadas e no rodapé; `public/ads.txt` com placeholder; `CookieConsent` LGPD + Consent Mode v2; `NewsletterForm` + double opt-in (§5.2 passos 1–4); rotas sem anúncio listadas (§2.5); constante de aviso Amazon no rodapé.
- **Fase 2**: `<AmazonButton>` com texto fixo e `rel="sponsored nofollow noopener"`; aviso acima do 1º link; `scripts/check-affiliate.ts`; validador de preço/estrelas na rotina; "Como avaliamos" (`/politica-editorial`) e página de autor; JSON-LD de review; tracking IDs por canal.
- **Fase 3**: faixa de preço (`price_min/max`, `product_price_checks`) e texto "faixa consultada na internet"; `marketplace_urls`; página `/loja/presentes` (cluster 15) e `/loja/ofertas` sem AdSense.
- **Fase 4**: texto "Como usar" ≥ 300 palavras por ferramenta; `AdSlot` só abaixo do resultado; `tool_usage`.
- **Fase 5**: `plans` com `irmao` e `irmandade-premium` (inativo), `subscriptions` com provider `mercadopago`; flag "sem anúncios" para assinante.
- **Fase 7**: Biblioteca do Pai (bucket privado), 3 produtos digitais cadastrados (§7) com checkout Hotmart.
- **Fase 8**: `AdSenseLoader`/`AdSlot` por template (§2.4); cron de newsletter (§5.2 passo 5) com os 4 e-mails (§5.5); `internal-links.ts` com as 14 regras (§8.2); `link_audit.py`; métricas no Painel Lisieux (§11); pedido de revisão do AdSense só após o checklist §2.1.
