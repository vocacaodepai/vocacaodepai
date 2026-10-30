# Pesquisa técnica — APIs, integrações e regras (Vocação de Pai)

Data da pesquisa: 24/10/2026. Método: chamadas reais (curl) aos endpoints + leitura da documentação oficial + buscas web.
Legenda: **[VERIFICADO]** = testado/lido na fonte oficial hoje; **[FONTE TERCEIRA]** = só fontes não oficiais; **[NÃO CONFIRMADO]** = não foi possível abrir a fonte oficial.

---

## 1. Tabela-resumo de APIs

| API | URL da documentação | Grátis? | Limite | Endpoint de exemplo | Uso no site |
|---|---|---|---|---|---|
| Banco Central — SGS | https://dadosabertos.bcb.gov.br/dataset/20542-saldo-da-carteira-de-credito-com-recursos-livres---total (portal) / API `api.bcb.gov.br/dados/serie` | Sim, sem chave | Não documentado; uso diário leve é tolerado | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json` | SELIC meta (432), SELIC diária (11), CDI (12), IPCA (433), dólar venda (1) na /ferramentas/mercado-financeiro |
| Banco Central — PTAX (Olinda/OData) | https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/aplicacao#!/recursos | Sim, sem chave | Não documentado | `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='10-23-2026'&$top=1&$format=json` | Dólar PTAX oficial (compra/venda) — fonte "oficial" do conversor |
| AwesomeAPI (economia) | https://docs.awesomeapi.com.br/api-de-moedas | Sim (sem chave: cache 1 min; com chave gratuita: até 100.000 req) | Sem chave: respostas em cache de 1 min e cota por IP (recebemos **429 QuotaExceeded** hoje). Séries: 100 registros sem chave / 1.500 com chave. `/json/daily`: máx. 360 dias | `https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL` e `.../json/daily/USD-BRL/15` | Câmbio comercial em "tempo real" (USD, EUR, GBP, ARS, BTC...) — usar COM chave (`?token=`) e cache próprio |
| Frankfurter | https://frankfurter.dev/ | Sim, sem chave, open source | Sem cota diária/mensal; rate limit anti-abuso | `https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL,EUR` (v1 ainda ativa; v2: `/v2/rates?base=USD&quotes=BRL`) | Fallback do conversor (taxas diárias de bancos centrais, 223 moedas) |
| ExchangeRate-API Open Access | https://www.exchangerate-api.com/docs/free | Sim, sem chave | 1 atualização/dia; 429 se abusar (bloqueio ~20 min); recomendado ≤ 1 req/hora; **atribuição obrigatória** ("Rates By Exchange Rate API") | `https://open.er-api.com/v6/latest/USD` | 2º fallback do conversor (160+ moedas, base USD) |
| Brapi.dev | https://brapi.dev/docs e https://brapi.dev/pricing | Plano gratuito | Grátis: 15.000 req/mês, 1 ticker/req, 1 req simultânea, cotação atualizada a cada 30 min, histórico 3 meses. Sandbox sem token só PETR4/VALE3/MGLU3/ITUB4 (20 req/min/IP). `^BVSP` exige token (erro `MISSING_TOKEN`). Startup R$ 99,99/mês (anual): 150k req, 10 tickers, Selic/CDI/IPCA. Pro R$ 116,66/mês: 500k req, Tesouro Direto, moedas PTAX cruzadas | `https://brapi.dev/api/quote/PETR4?token=<BRAPI_TOKEN>` ; `https://brapi.dev/api/quote/%5EBVSP?token=...` | Ibovespa, ações (PETR4, VALE3...) na /ferramentas/mercado-financeiro |
| CoinGecko | https://docs.coingecko.com/ | Sim (público) e Demo key gratuita | Público: 5–15 chamadas/min (variável). Demo key: 30 chamadas/min estável (header `x-cg-demo-api-key`) | `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl,usd&include_24hr_change=true` | Bitcoin/Ethereum em BRL (sinergia com blogdobitcoin) |
| Tesouro Transparente (CKAN) | https://www.tesourotransparente.gov.br/ckan/dataset/taxas-dos-titulos-ofertados-pelo-tesouro-direto | Sim (ODbL) | Download do CSV devolveu **429** hoje (muito pesado, centenas de MB e cresce diariamente); API CKAN de metadados funciona | `https://www.tesourotransparente.gov.br/ckan/api/3/action/package_show?id=taxas-dos-titulos-ofertados-pelo-tesouro-direto` | Taxas do Tesouro Direto — **fase 2**, via job noturno que baixa o CSV e grava só o último dia em `market_cache` |
| Resend | https://resend.com/pricing | Free | 3.000 e-mails/mês, **100/dia**, 3 domínios, retenção 30 dias. Pro US$ 20/mês = 50.000/mês | `POST https://api.resend.com/emails` | Newsletter, magic link (SMTP custom do Supabase), alertas de vagas |
| Cloudflare Turnstile | https://developers.cloudflare.com/turnstile/ | Sim | Token expira em 300 s, uso único, ≤ 2.048 chars; validação server-side obrigatória | `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` (secret, response, remoteip) | Formulários: cadastro, contato, nova vaga, nova história, comentários |
| Vercel Cron Jobs | https://vercel.com/docs/cron-jobs/usage-and-pricing | Em todos os planos | Hobby: 100 crons/projeto, **mínimo 1×/dia**, precisão ±59 min. Pro: 1×/min, precisão por minuto | `vercel.json` → `{"crons":[{"path":"/api/cron/market","schedule":"0 */2 * * *"}]}` (só Pro) | Atualização de `market_cache`, expiração de vagas, digest semanal |
| GitHub Actions `schedule` | https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule | Sim (repo privado tem cota de minutos) | Mínimo 5 min; UTC (campo `timezone` IANA disponível); atrasos em horários de pico; repo **público** desativa após 60 dias sem atividade; roda só no branch default | `on: schedule: - cron: "7 */2 * * *"` | Alternativa gratuita ao cron horário da Vercel: chama `POST /api/cron/market` com `CRON_SECRET` |

---

## 2. Respostas JSON reais capturadas hoje (24/10/2026)

**SGS 432 (SELIC meta)** — `[{"data":"04/11/2026","valor":"13.75"}]`
**SGS 11 (SELIC diária)** — `[{"data":"23/10/2026","valor":"0.050788"}]`
**SGS 12 (CDI diário)** — `[{"data":"22/10/2026","valor":"0.050788"}]`
**SGS 433 (IPCA mensal)** — `[{"data":"01/09/2026","valor":"0.82"}]`
**SGS 1 (dólar venda)** — `[{"data":"23/10/2026","valor":"5.0377"}]`
Observações: `valor` vem como **string** com ponto decimal; `data` em `DD/MM/AAAA`. Série 11 e 12 são taxas **diárias** (% ao dia); anualizar com `((1+v/100)^252 - 1)*100`.

**PTAX (Olinda)**
```json
{"@odata.context":"https://was-p.bcnet.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata$metadata#_CotacaoDolarDia",
 "value":[{"cotacaoCompra":5.03710,"cotacaoVenda":5.03770,"dataHoraCotacao":"2026-10-23 13:07:14.754567"}]}
```
Formato da data no parâmetro: `MM-DD-AAAA`. Em fim de semana/feriado `value` vem vazio → buscar o dia útil anterior (loop até 5 dias).

**Frankfurter** — `{"amount":1.0,"base":"USD","date":"2026-10-23","rates":{"BRL":5.0465,"EUR":0.89342}}`

**open.er-api.com** (trecho) — `{"result":"success","provider":"https://www.exchangerate-api.com","time_last_update_utc":"Sat, 24 Oct 2026 00:02:31 +0000","time_next_update_utc":"Sun, 25 Oct 2026 00:33:01 +0000","time_eol_unix":0,"base_code":"USD","rates":{"USD":1,"BRL":5.04,...}}`

**CoinGecko** — `{"bitcoin":{"brl":399977,"brl_24h_change":-1.3458,"usd":80330,"usd_24h_change":-1.2785},"ethereum":{"usd":2334.74,"brl":11625.12,...}}`

**Brapi PETR4 (sem token, sandbox)** (trecho) — `{"results":[{"symbol":"PETR4","longName":"Petroleo Brasileiro SA Pfd","currency":"BRL","regularMarketPrice":58.68,"regularMarketChange":0.85,"regularMarketChangePercent":1.47,"regularMarketTime":"2026-10-23T21:37:25.000Z","marketCap":788886152374,"fiftyTwoWeekRange":"29.53 - 59.79","priceEarnings":5.67,...}]}`
**Brapi ^BVSP sem token** — `{"error":true,"message":"Token de autenticação não fornecido","code":"MISSING_TOKEN"}`

**AwesomeAPI sem chave (do IP do servidor)** — `{"status":429,"code":"QuotaExceeded","message":"Quota exceeded. To continue using the service, please see https://docs.awesomeapi.com.br/aviso-sobre-limites"}` → **nunca depender da AwesomeAPI sem chave**. Formato esperado com chave: `{"USDBRL":{"code":"USD","codein":"BRL","name":"Dólar Americano/Real Brasileiro","high":"...","low":"...","varBid":"...","pctChange":"...","bid":"...","ask":"...","timestamp":"...","create_date":"..."}}` (docs oficiais).

---

## 3. Fatos verificados por tema (com fonte)

### (a) Câmbio
- AwesomeAPI: cadastro gratuito dá até **100.000 requisições**; sem chave as respostas ficam em cache de **1 minuto** e há cota por IP (429 observado). `/json/daily/:moeda/:dias` máx. 360 dias; séries `/:moeda/:qtd` 100 registros sem chave, 1.500 com chave. Oferece pares `USD-BRLPTAX`, `EUR-BRLPTAX`. **[VERIFICADO]** https://docs.awesomeapi.com.br/api-de-moedas
- BCB SGS: endpoint `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{n}?formato=json` e por período `.../dados?formato=json&dataInicial=DD/MM/AAAA&dataFinal=DD/MM/AAAA`. **[VERIFICADO por chamada]**
- PTAX Olinda: recurso `CotacaoDolarDia(dataCotacao=@dataCotacao)`; para outras moedas `CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='EUR'`. **[VERIFICADO por chamada]** https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/aplicacao
- Frankfurter: gratuito, sem chave, sem cota diária, dados diários (BCE + 105 bancos centrais); `api.frankfurter.app` redireciona (301) para `api.frankfurter.dev`; v1 "deprecated mas disponível", v2 em `/v2/rates`. **[VERIFICADO]** https://frankfurter.dev/
- open.er-api.com: 1 atualização/dia, 429 ao abusar, **link de atribuição obrigatório** na página que exibe as taxas, cache permitido, redistribuição proibida. **[VERIFICADO]** https://www.exchangerate-api.com/docs/free

### (b) Mercado financeiro
- Brapi: plano gratuito 15.000 req/mês, 1 ticker por requisição, atualização a cada 30 min, sem tempo real; 429 com chamadas paralelas; token via `?token=` ou header `Authorization: Bearer`. ^BVSP só com token. **[VERIFICADO]** https://brapi.dev/pricing , https://brapi.dev/docs
- CoinGecko: API pública 5–15 chamadas/min; Demo key gratuita 30 chamadas/min. **[VERIFICADO]** https://support.coingecko.com/hc/en-us/articles/4538771776153-What-is-the-rate-limit-for-CoinGecko-API-public-plan
- Tesouro Direto: dataset oficial no CKAN (licença ODbL), `metadata_modified` 16/10/2026; o JSON antigo `tesourodireto.com.br/json/.../treasurybondsinfo.json` respondeu **"gone"**. **[VERIFICADO]** A Brapi vende Tesouro Direto só no plano Pro.

### (c) Supabase, cobrança, e-mail, antibot
- **Supabase Auth — Google OAuth**: criar OAuth Client (Web application) no Google Cloud; colocar a callback copiada do Dashboard (`https://<ref>.supabase.co/auth/v1/callback`; local `http://127.0.0.1:54321/auth/v1/callback`); colar Client ID/Secret no Dashboard; cliente chama `supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo } })`; em SSR usar `@supabase/ssr` (PKCE em cookie) e na rota de callback `exchangeCodeForSession(code)`. **[VERIFICADO]** https://supabase.com/docs/guides/auth/social-login/auth-google
- **Magic link / OTP**: `signInWithOtp({ email, options:{ emailRedirectTo, shouldCreateUser } })`; uso único; reenvio a cada **60 s**; expira em **1 h** (configurável); fluxo PKCE usa `{{ .TokenHash }}` no template e `verifyOtp({ token_hash, type:'email' })` em `/auth/confirm`. **[VERIFICADO]** https://supabase.com/docs/guides/auth/auth-email-passwordless . Produção: configurar SMTP customizado (Resend) em Auth → SMTP Settings.
- **RLS**: habilitar `alter table X enable row level security;` em TODAS as tabelas públicas; políticas por `auth.uid()`; `service_role` só no servidor (server functions). Fonte: https://supabase.com/docs/guides/database/postgres/row-level-security
- **Supabase Vault**: `select vault.create_secret('valor','nome','descricao');` lê-se via view `vault.decrypted_secrets` (coluna `decrypted_secret`); segredo cifrado em disco/backup (libsodium); restringir acesso à view; migração para projeto novo via pg_dump não descriptografa. **[VERIFICADO]** https://supabase.com/docs/guides/database/vault — uso: guardar `BRAPI_TOKEN`, `AWESOME_TOKEN`, `RESEND_API_KEY` para funções SQL/pg_net; no app usar env vars da Vercel.
- **Stripe Brasil (oficial)**: cartão nacional **3,99% + R$ 0,39**; internacional +2%; **Pix 1,19% (somente por convite)**; boleto R$ 3,45; Billing (assinaturas) +0,7% do volume; sem mensalidade; contestação R$ 55. **[VERIFICADO]** https://stripe.com/br/pricing
- **Mercado Pago**: página oficial de custos bloqueou (403). Fontes terceiras (calculadoradetaxas.com.br, 07/2026): checkout online crédito ~4,98% na hora / 4,49% 14 dias / 3,98% 30 dias; **Pix ~0,99%** ou grátis conforme modalidade. Assinaturas via API `preapproval` e webhooks (notificações IPN/Webhooks). **[FONTE TERCEIRA]** Oficial a conferir: https://www.mercadopago.com.br/custos e https://www.mercadopago.com.br/developers/pt/docs/subscriptions/landing
- **Asaas**: páginas de preços redirecionam para login. Docs oficiais de assinaturas (boleto/Pix/cartão, webhooks de cobrança, Pix Automático separado): https://docs.asaas.com/docs/assinaturas-recorrência , https://docs.asaas.com/reference/assinaturas . Tarifas públicas **[NÃO CONFIRMADO]** (mercado: Pix ~R$ 1,99/transação ou faixa gratuita, boleto ~R$ 1,99–3,49, cartão ~2,99%+R$0,49).
- **Recomendação de cobrança**: **Mercado Pago** para a Área do Pai (plano pago): maior aceitação de Pix no Brasil, Pix barato/gratuito, assinaturas nativas (`preapproval`) com cartão, Checkout Pro sem PCI, webhooks estáveis, conta já usual no ecossistema ML. Stripe fica como 2ª opção (Pix só por convite, 3,99% + R$ 0,39). Asaas é a 3ª (ótimo para boleto/Pix recorrente B2B, API simples), caso o MP crie atrito.
- **Resend**: Free 3.000/mês e 100/dia, 3 domínios; Pro US$ 20 (50k). **[VERIFICADO]** https://resend.com/pricing → newsletter > 100 destinatários/dia exige Pro ou envio em lotes diários.
- **Turnstile**: gratuito; sitekey pública no HTML (`<script src="https://challenges.cloudflare.com/turnstile/v0/api.js">`, `<div class="cf-turnstile" data-sitekey="...">`, campo `cf-turnstile-response`); validar no servidor via `siteverify`; token 300 s, uso único. **[VERIFICADO]** https://developers.cloudflare.com/turnstile/get-started/

### (d) Afiliados
- **Amazon Associados BR — Acordo Operacional**: aviso obrigatório, texto literal: **"Como participante do Programa de Associados da Amazon, sou remunerado pelas compras qualificadas efetuadas"**; links só nos formatos rastreados; proibido contatar clientes; rescisão com 7 dias. **[VERIFICADO]** https://associados.amazon.com.br/help/operating/agreement
- **Políticas do Programa (BR)**: preço/disponibilidade **só** se obtidos via PA-API/Creators API, com **carimbo de data/hora** e o aviso **"Os preços e a disponibilidade dos produtos estão corretos na data/horário indicados"**; imagens só do próprio site, sem cache (link por 24 h); proibido e-mail/offline/PDF/cloaking/encurtador que esconda a Amazon; avaliações/estrelas só via API. **[VERIFICADO]** https://associados.amazon.com.br/help/operating/policies → confirma a decisão do grupo: **faixa de preço pesquisada, nunca preço exato da Amazon**.
- **Regra 180 dias / 3 vendas**: conta nova precisa de 3 vendas qualificadas em 180 dias para ser avaliada — presente só em fontes terceiras e na Central de Ajuda (não abriu hoje). **[FONTE TERCEIRA]** Verificar em https://associados.amazon.com.br/help/node/topic/GRVEXDFGCWVL7HJR (Central de Ajuda → "Análise da conta").
- **PA-API 5 foi DESCONTINUADA** → substituída pela **Creators API** (REST); chamadas ao PA-API 5 retornam HTTP 403 "Product Advertising API is deprecated. Please migrate to Creators API". Regra histórica: acesso revogado após 30 dias sem vendas (429). **[VERIFICADO]** https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation e https://webservices.amazon.com/paapi5/documentation/troubleshooting/api-rates.html → **não planejar PA-API 5**; Creators API só depois de volume de vendas.
- **Mercado Livre Afiliados**: exige conta ML + Mercado Pago, 18+, perfil público/site; não pode ser vendedor; comissão variável por categoria. **[FONTE TERCEIRA]** Oficial: https://www.mercadolivre.com.br/afiliados
- **Shopee Afiliados**: cadastro no app/site, aprovação 1–3 dias úteis, cookie ~7 dias, comissão até ~14%, pagamento via ShopeePay após confirmação de entrega. **[FONTE TERCEIRA]** Oficial: https://affiliate.shopee.com.br/
- **Parceiro Magalu**: PF cria "loja" sem estoque; sem taxa; comissão 1–12% por categoria/nível (Bronze→Diamante). **[FONTE TERCEIRA]** Oficial: https://www.parceiromagalu.com.br/

### (e) Google AdSense
- Elegibilidade: 18+, conteúdo original e de qualidade, acesso ao HTML do site, cumprir políticas. **[VERIFICADO]** https://support.google.com/adsense/answer/9724
- `ads.txt`: linha `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0` na raiz (`/ads.txt`); não obrigatório mas fortemente recomendado; verificação leva dias (até 1 mês em sites pequenos). **[VERIFICADO]** https://support.google.com/adsense/answer/12171612
- Políticas do programa (conteúdo proibido, cliques inválidos, páginas sem conteúdo): https://support.google.com/adsense/answer/48182 . Prática consolidada do grupo (reviewprodutos/docs): páginas /sobre, /contato, /politica-de-privacidade, /termos-de-uso, /politica-de-afiliados, navegação clara, ≥ 20–30 artigos originais antes de pedir aprovação.

### (f) TanStack Start / Vercel / cron
- `createServerFn({ method:'GET'|'POST' }).validator(zodSchema).handler(async ({ data }) => ...)`; no loader `loader: () => fn()`; no componente `useServerFn(fn)`; server-only: `getRequest()`, `getRequestHeader()`, `setResponseHeader(s)()`, `setResponseStatus()` de `@tanstack/react-start/server`; `throw redirect({to})` / `throw notFound()`; CSRF via `createCsrfMiddleware()` em `src/start.ts`; organizar `.functions.ts` (wrappers) / `.server.ts` (helpers). **[VERIFICADO]** https://tanstack.com/start/latest/docs/framework/react/guide/server-functions
- Deploy Vercel: instalar `nitro` e usar `plugins: [tanstackStart(), nitro(), viteReact()]` no `vite.config.ts`; build `vite build` (saída `.output`); deploy one-click. **[VERIFICADO]** https://tanstack.com/start/latest/docs/framework/react/guide/hosting (o repo vocacaodemae já tem a config — copiar).
- Vercel Cron: Hobby = 1×/dia e ±59 min; Pro = por minuto. 100 crons/projeto em todos os planos. **[VERIFICADO]** https://vercel.com/docs/cron-jobs/usage-and-pricing
- GitHub Actions schedule: mínimo 5 min, UTC, atrasos em pico, desativa em repo público após 60 dias sem commits. **[VERIFICADO]**

### (g) OG image, busca, JSON-LD
- `@vercel/og`: usa Satori + Resvg; `new ImageResponse(<jsx/>, { width:1200, height:630 })`; roda em Node.js runtime; só flexbox (sem grid); fontes ttf/otf/woff; **bundle ≤ 500 KB**; adiciona headers de cache CDN; liberar `/api/og/*` no robots.txt. **[VERIFICADO]** https://vercel.com/docs/og-image-generation
- Busca: Postgres `to_tsvector('portuguese', ...)` em coluna gerada `generated always as (...) stored` + índice GIN + `websearch_to_tsquery` + `ts_rank` com `setweight` (A título, B resumo, C corpo); supabase-js `.textSearch('fts', q, { type:'websearch', config:'portuguese' })` e `.rpc()` para ranking. **[VERIFICADO]** https://supabase.com/docs/guides/database/full-text-search . Pagefind indexa só HTML estático pós-build (≈100–300 kB carregados), inadequado para conteúdo em banco/SSR dinâmico → **usar Postgres FTS** (igual ao vocacaodemae). https://pagefind.app/
- **JobPosting** (Google for Jobs) — obrigatórios: `title` (só cargo), `description` (HTML completo), `datePosted` (ISO 8601), `hiringOrganization` (ou "confidential"), `jobLocation` com `addressCountry` (dispensado se remoto com `applicantLocationRequirements`). Recomendados: `validThrough` (obrigatório se expira; vaga expirada deve sair ou ter validThrough no passado/404/410), `baseSalary` (real, `unitText` MONTH etc.), `employmentType`, `jobLocationType:"TELECOMMUTE"` + `applicantLocationRequirements` (Country BR) para remoto, `directApply`, `identifier`. Só em páginas de UMA vaga, descrição sem login. **[VERIFICADO]** https://developers.google.com/search/docs/appearance/structured-data/job-posting
- **Review / AggregateRating**: `Review` exige `author` (Person/Organization < 100 chars), `itemReviewed` (ou aninhado em `Product`), `reviewRating.ratingValue` (+ `bestRating`/`worstRating`; escala padrão 1–5; usar ponto decimal); `AggregateRating` exige `ratingValue` + `ratingCount` ou `reviewCount`; conteúdo visível; sem reviews de terceiros agregados. Para o Pai Indica (nota 0–10): `reviewRating: { ratingValue: 8.5, bestRating: 10, worstRating: 0 }` dentro de `Product`. **[VERIFICADO]** https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- **Product**: https://developers.google.com/search/docs/appearance/structured-data/product-snippet — `name`, `image`, `description`, `review`/`aggregateRating`; **não** incluir `offers.price` se o preço for faixa pesquisada (evitar incoerência com Amazon). **ItemList** para comparativos/listas: https://developers.google.com/search/docs/appearance/structured-data/carousel (`itemListElement` com `ListItem.position/url`).
- **FAQPage**: rich result **descontinuado** — deixou de aparecer em 07/05/2026 e a documentação foi removida em 15/06/2026 (desde 2023 só governo/saúde). **[VERIFICADO]** https://developers.google.com/search/docs/appearance/structured-data/faqpage → **não gastar esforço com FAQPage**; manter FAQs em HTML comum.

---

## 4. Recomendações técnicas (arquitetura de dados de mercado)

### 4.1 Tabela `market_cache` (migration 0007_ferramentas.sql)
```sql
create table if not exists public.market_cache (
  key         text primary key,            -- ex.: 'fx:USD-BRL', 'sgs:432', 'ptax:USD', 'stock:PETR4', 'index:^BVSP', 'crypto:bitcoin'
  provider    text not null,               -- 'awesomeapi' | 'bcb_sgs' | 'bcb_ptax' | 'frankfurter' | 'erapi' | 'brapi' | 'coingecko'
  payload     jsonb not null,              -- resposta normalizada {value, change_pct, high, low, unit, as_of}
  as_of       timestamptz,                 -- data do dado na fonte
  fetched_at  timestamptz not null default now(),
  ttl_seconds int not null default 1800,
  stale       boolean generated always as (false) stored
);
alter table public.market_cache enable row level security;
create policy "market_cache_public_read" on public.market_cache for select using (true);
-- escrita só via service_role (server function / cron)
```
Chaves fixas: `fx:USD-BRL, fx:EUR-BRL, fx:GBP-BRL, fx:ARS-BRL, ptax:USD, ptax:EUR, sgs:432, sgs:11, sgs:12, sgs:433, sgs:1, index:^BVSP, stock:PETR4, stock:VALE3, stock:ITUB4, stock:BBAS3, crypto:bitcoin, crypto:ethereum`.

### 4.2 Estratégia de atualização (cron)
- **Fonte de verdade: o servidor, nunca o navegador** (chaves ficam em env vars da Vercel; o cliente só lê `market_cache` via server function `getMarketData`).
- Rota `POST /api/cron/market` protegida por header `Authorization: Bearer ${CRON_SECRET}`.
- Agendamento: Vercel Hobby só permite **1×/dia** → usar **GitHub Actions** `cron: "7 */2 * * 1-5"` (a cada 2 h em dias úteis, minuto 7 para evitar pico) + `"7 12 * * 0,6"` fim de semana, chamando a rota com `curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" https://vocacaodepai.com.br/api/cron/market`. Se o time "Portal da AI" estiver no plano **Pro**, usar `vercel.json` `"schedule": "0 */2 * * *"` diretamente.
- TTLs: câmbio 30 min (AwesomeAPI com chave); PTAX e SGS 1×/dia às 19h BRT (dados saem à tarde; SGS 433 é mensal); ações/Ibovespa 30 min (compatível com o plano gratuito da Brapi: 15.000 req/mês ÷ 6 tickers ≈ 83 req/ticker/dia → a cada 30 min em pregão cabe); crypto 15 min (CoinGecko Demo 30/min).
- **Stale-while-revalidate**: a página sempre renderiza o último `payload` mesmo vencido, com rótulo "Atualizado às HH:MM (dd/mm)"; o cron só substitui a linha se a nova chamada der 200 e o JSON validar (zod). Nunca apagar cache em erro.

### 4.3 Cadeia de fallback (conversor de moedas)
1. AwesomeAPI `/last/USD-BRL,EUR-BRL,...` **com `?token=`** (tempo quase real, 100k req grátis) →
2. Frankfurter `/v1/latest?base=USD&symbols=BRL,EUR,GBP,...` (diário, sem chave) →
3. open.er-api `/v6/latest/USD` (diário; exibir "Rates By Exchange Rate API" no rodapé da ferramenta, exigência de uso) →
4. Último valor de `market_cache` (marcar `stale: true` no payload e mostrar "Sinal de atenção: cotação pode estar desatualizada").
Sempre exibir também o **PTAX do dia** (BCB) como referência oficial — é o número que o pai vê no contrato/viagem.

### 4.4 Mercado financeiro (/ferramentas/mercado-financeiro)
- Cartões: Dólar comercial (AwesomeAPI), Dólar PTAX (BCB), Euro, Ibovespa (Brapi com token), 4 ações blue-chip (Brapi), Bitcoin/Ethereum em BRL (CoinGecko), SELIC meta e CDI anualizado (SGS 432/12), IPCA do mês (SGS 433).
- Disclaimer fixo: "Dados com atraso de até 30 minutos; não é recomendação de investimento." (a Brapi gratuita não é tempo real).
- Tesouro Direto: fase 2 — job noturno (GitHub Actions) baixa o CSV `PrecoTaxaTesouroDireto.csv` do CKAN (URL obtida via `package_show`), filtra o último dia e grava `tesouro:<titulo>` em `market_cache`; se 429, manter o cache.

### 4.5 Chaves e segredos
- Env vars (Vercel): `AWESOME_API_TOKEN`, `BRAPI_TOKEN`, `COINGECKO_DEMO_KEY`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (server-only). Públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TURNSTILE_SITE_KEY`.
- Supabase Vault só para segredos consumidos dentro do banco (ex.: funções SQL com pg_net).

### 4.6 Afiliados e preço (reforço das regras do grupo)
- Botão "Comprar agora na Amazon" + aviso literal do Acordo em `/politica-de-afiliados` e no rodapé de cada post com link.
- **Nunca** exibir preço da Amazon (sem API não é permitido). Exibir **faixa** "R$ X – R$ Y (pesquisa em 2 lojas, dd/mm/aaaa)" armazenada em `product_price_checks` (campos `store`, `price`, `checked_at`, `url`).
- Imagens: nunca copiar/cachear imagens da Amazon → usar fotos próprias/Wikimedia/Pexels (regra já do Portal da AI).
- Não planejar PA-API 5 (descontinuada). Creators API só após a conta ter vendas recorrentes.

### 4.7 Cobrança (Área do Pai — plano pago futuro)
- Mercado Pago: Checkout Pro (link) para avulso + `preapproval` para assinatura mensal; webhook `/api/webhooks/mercadopago` valida assinatura `x-signature`, grava em `subscriptions` (status, `external_reference` = `profiles.id`, `next_payment_date`). Plano gratuito continua sem gateway.
- Guardar `plans` (slug, preço em centavos, intervalo) e `subscriptions` (provider, provider_id, status, current_period_end) desde a migration 0004_membros.sql, mesmo que o gateway entre só depois.

### 4.8 E-mail e antibot
- Supabase Auth com SMTP do Resend (domínio `vocacaodepai.com.br` verificado; remetente `pai@vocacaodepai.com.br`); limite Free de 100/dia → newsletter semanal em lotes ou Pro quando passar de ~700 assinantes.
- Turnstile em `/cadastro`, `/contato`, `/pai-indica-pai/vagas/nova`, `/historias/nova`, comentários; validar em server function antes de gravar.

---

## 5. Fontes oficiais consultadas (URLs reais)
- https://docs.awesomeapi.com.br/api-de-moedas
- https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json (e séries 11, 12, 433, 1)
- https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/aplicacao
- https://frankfurter.dev/
- https://www.exchangerate-api.com/docs/free
- https://brapi.dev/docs · https://brapi.dev/pricing
- https://support.coingecko.com/hc/en-us/articles/4538771776153-What-is-the-rate-limit-for-CoinGecko-API-public-plan
- https://www.tesourotransparente.gov.br/ckan/dataset/taxas-dos-titulos-ofertados-pelo-tesouro-direto
- https://supabase.com/docs/guides/auth/social-login/auth-google · https://supabase.com/docs/guides/auth/auth-email-passwordless · https://supabase.com/docs/guides/database/vault · https://supabase.com/docs/guides/database/full-text-search
- https://stripe.com/br/pricing · https://docs.asaas.com/docs/assinaturas-recorrência · https://www.mercadopago.com.br/developers/pt/docs/subscriptions/landing
- https://resend.com/pricing
- https://developers.cloudflare.com/turnstile/get-started/
- https://associados.amazon.com.br/help/operating/agreement · https://associados.amazon.com.br/help/operating/policies · https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation · https://webservices.amazon.com/paapi5/documentation/troubleshooting/api-rates.html
- https://support.google.com/adsense/answer/9724 · https://support.google.com/adsense/answer/12171612 · https://support.google.com/adsense/answer/48182
- https://tanstack.com/start/latest/docs/framework/react/guide/server-functions · https://tanstack.com/start/latest/docs/framework/react/guide/hosting
- https://vercel.com/docs/cron-jobs/usage-and-pricing · https://vercel.com/docs/og-image-generation
- https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule
- https://developers.google.com/search/docs/appearance/structured-data/job-posting · .../review-snippet · .../product-snippet · .../carousel · .../faqpage
- https://pagefind.app/
