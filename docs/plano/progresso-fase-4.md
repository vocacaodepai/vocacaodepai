# Progresso — Fase 4 (Caixa de Ferramentas)

> Registro da sessão `claude/fase-4-ferramentas` (2026-10-30). Para fundir em `docs/plano/PROGRESSO.md`
> ("Decisões tomadas durante a execução" e "Pendências do dono") na consolidação da fase.
> Banco Supabase ainda é placeholder: tudo funciona com cache vazio e com as APIs indisponíveis.

## Entregue

| Item (doc 06) | Arquivos | Estado |
|---|---|---|
| Registro das ferramentas (slug, título, SEO, ícone lucide, categoria, howTo, faq, componente lazy) + categorias (Dinheiro, Família, Churrasco & Cozinha, Casa & Oficina, Saúde) | `src/lib/tools/registry.ts`, `categories.ts`, `index.ts`, `como-usar.ts` (14 textos, 387–453 palavras cada), `jsonld.ts`, `format.ts`, `share.ts`, `usage.ts`, `saved.ts`, `related.functions.ts`, `currencies.ts` (32 moedas) | pronto |
| Casca `ToolLayout` (SEO e 4 JSON-LD na rota, "Como usar", FAQ, artigos relacionados, Salvar/Compartilhar, `tool_usage`, anúncios só abaixo do resultado e após o "Como usar") | `src/components/ferramentas/{ToolLayout,ToolGate,ToolHowTo,ToolFaq,ToolDisclaimer,ToolSaveButton,ToolShareButton,ToolRelatedArticles,ToolResultCard,ToolCard,MarketStale,SemaforoCallout,SemaforoTrio,NumberField}.tsx`, `src/hooks/usePersisted.ts` | pronto |
| Rotas `/ferramentas` (índice por categoria, destaques, filtro, JSON-LD ItemList) e `/ferramentas/$slug` (404 para slug inexistente) | `src/routes/_site/ferramentas/{index,$slug}.tsx` | pronto |
| Camada de mercado: tipos, cache (`market_cache` → memória do processo quando não há banco), fontes (AwesomeAPI → Frankfurter → open.er-api; PTAX; SGS 432/11/12/4389/433/13522/1 + poupança pela regra; CoinGecko com fallback AwesomeAPI; Brapi com `BRAPI_TOKEN` opcional), server functions e `refreshAll()` | `src/lib/market/{types,cache,fetchers,refresh}.ts`, `src/lib/market/sources/{awesomeapi,bcb-ptax,bcb-sgs,coingecko,brapi}.ts` | pronto |
| `POST/GET /api/market/refresh` com `CRON_SECRET` (401 sem header) + workflow a cada 30 min (`workflow_dispatch`; sem auto-merge) | `src/routes/api/market/refresh.ts`, `.github/workflows/market-refresh.yml` | pronto (precisa do secret no GitHub e na Vercel) |
| 3.1 `conversor-de-moedas` (32 moedas, PTAX, gráfico 30 dias, `?de=&para=&valor=`, MarketStale) | `conversor-de-moedas/CurrencyConverter.tsx` | pronto |
| 3.2 `mercado-financeiro` ("Mercado do pai": dólar, euro, libra, peso, bitcoin, ethereum, Ibovespa + ações só com token, Selic, CDI, IPCA mês/12 m, poupança; "O que isso muda no seu bolso"; Semáforo do dia; "informação educativa") + bloco "Mercado do pai hoje" na home (lê só o cache; some se vazio) | `mercado-financeiro/MarketDashboard.tsx`, `src/lib/tools/mercado-{insights,semaforo}.ts`, `src/components/home/ToolsTeaser.tsx` | pronto |
| 3.3 `custo-do-filho` (40 faixas: 5 fases × 8 categorias; perfil, escola, plano, filhos, renda; barras; até os 18; semáforo) | `custo-do-filho/ChildCostCalculator.tsx`, `src/lib/tools/custo-filho-data.ts` | pronto |
| 3.4 `licenca-paternidade` (regras 2026: 5 CLT / 20 Empresa Cidadã / 20 federal / manual estadual / 0 autônomo; Lei 15.371/2026: 10 dias 2027, 15 em 2028, 20 em 2029; datas pulando fim de semana e feriados; prazo de 2 dias úteis; fontes) | `licenca-paternidade/PaternityLeave.tsx`, `src/lib/tools/licenca.ts`, `licenca-regras.json` | pronto |
| 3.5 `calculadora-de-churrasco` (450/350/200 g, duração, 3 presets, carvão, bebidas, acompanhamentos, lista com copiar/imprimir, semáforo de segurança) | `calculadora-de-churrasco/BarbecueCalculator.tsx`, `src/lib/tools/churrasco-regras.ts` | pronto |
| 3.6 `cortes-de-carne` (SVG clicável do boi com 16 cortes, teclado e aria; abas Carne × preparo e Tabela; `?corte=`; nome BR/EUA, textura, maciez, gordura, preço relativo, preparo, ponto, erro comum no semáforo, dica do pai; faixa de preço `null` → "ainda não pesquisada") | `cortes-de-carne/{BeefCutsGuide,BeefDiagram}.tsx`, `src/lib/tools/cortes.json`, `cortes.ts` | pronto (só boi; ver pendências) |
| 3.7 `orcamento-familiar` (50-20-20-10, barras, sobra, semáforo, CSV, imprimir, localStorage) | `orcamento-familiar/FamilyBudget.tsx`, `src/lib/tools/orcamento-data.ts` | pronto |
| 3.8 `juros-compostos` (série, gráfico empilhado, tabela anual, valor real, presets com Selic/CDI/IPCA do cache ou constantes datadas, semáforo de taxa) | `juros-compostos/CompoundInterest.tsx`, `src/lib/tools/financas.ts` | pronto |
| 3.9 `reserva-de-emergencia` (meses-base por renda + dependentes, faixa, progresso, meses para a meta com Selic, onde guardar, semáforo) | `reserva-de-emergencia/EmergencyFund.tsx` | pronto |
| 3.10 `pensao-alimenticia` (faixas forenses 15–25 / 25–33 / 33–40 %, guarda compartilhada −5 p.p., binômio, aviso forte) | `pensao-alimenticia/ChildSupportEstimate.tsx` | pronto |
| 3.11 `conversor-de-unidades` (10 categorias + brocas/buchas, forno e ponto da carne, tabela rápida, inverter) | `conversor-de-unidades/UnitConverter.tsx`, `src/lib/tools/unidades.ts` | pronto |
| 3.12 `kit-de-ferramentas` (38 itens, 8 tarefas, 3 níveis, moradia, "já tenho" persistido, EPI, links `/loja/categoria/ferramentas`) | `kit-de-ferramentas/ToolkitBuilder.tsx`, `src/lib/tools/kit-ferramentas-data.ts` | pronto |
| 3.16 `imc-e-gasto-calorico` (IMC/OMS, Mifflin-St Jeor, fator de atividade, meta, água, cintura, semáforo) | `imc-e-gasto-calorico/BmiAndCalories.tsx`, `src/lib/tools/saude.ts` | pronto |
| 3.17 `checklist-da-maternidade` (27 itens do pai, filtro por momento, progresso, contagem para a 36ª semana, links só para posts publicados, imprimir, semáforo) | `checklist-da-maternidade/HospitalBagChecklist.tsx`, `src/lib/tools/checklist-maternidade-data.ts` | pronto |
| Sitemap: `/ferramentas` + 14 slugs (conversor e mercado `hourly`/0.9) | `src/routes/sitemap[.]xml.ts` | pronto |
| `ToolsTeaser` da home lê `featuredTools()` (sem selos "Em breve") | `src/components/home/ToolsTeaser.tsx` | pronto |
| Testes das fórmulas (sem vitest no `node_modules` compartilhado): `node --experimental-strip-types scripts/test-ferramentas.mjs` → 70 casos, todos verdes | `scripts/test-ferramentas.mjs` | pronto |

Validação: `npx tsc --noEmit`, `npm run lint`, `npm run build` e `node scripts/validate-content.mjs` verdes (validador sem banco só avisa).

## Decisões tomadas durante a execução

- **14 das 17 ferramentas.** `nomes-de-filhos`, `calendario-de-vacinacao` e `marcos-do-desenvolvimento` (§3.13–§3.15) ficaram para
  a próxima sessão: dependem de dados próprios escritos do zero a partir das fontes oficiais (Ministério da Saúde / Caderneta da
  Criança) e da adaptação dos 884 nomes do VDM, o que não cabia no tempo desta sessão. O registry está pronto para recebê-las.
- **Sem StorePromo** (`src/components/loja/` não existe; a Fase 3 ainda não rodou): `ToolLayout` fecha com uma chamada simples para
  `/loja`. Quando `StorePromo` existir, trocar o bloco no fim do `ToolLayout`.
- **`SemaforoCallout` vive em `src/components/ferramentas/`**: o blog só tem a extensão Tiptap `callout` (CSS escopado em
  `.article-content`), não um componente React. O componente das ferramentas reproduz o visual com os tokens do tema; sem `PaiSemaforo`.
- **Tipos do Supabase** ainda são os do VDM: `usage.ts`, `saved.ts` e `market/cache.ts` usam `SupabaseClient` sem o genérico
  `Database` (mesma decisão da Fase 1 para o admin). Regenerar `types.ts` depois da 0007 é opcional.
- **Cache sem banco**: `market/cache.ts` cai para um `Map` em memória do processo quando `VITE_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
  não existem ou o upsert falha; a UI mostra "Atualizado às HH:MM (cache)" / "usando dados de <data>" / "indisponível agora".
- **TTLs do CLAUDE.md §10** (câmbio 15 min, índices 60 min, BCB 24 h) prevalecem sobre os do doc 06 §2.3.
- **Cascata de câmbio** do anexo técnico: AwesomeAPI → Frankfurter → open.er-api (com a atribuição "Rates By Exchange Rate API" quando
  é a fonte) → cache stale. Frankfurter/er-api são diários: `pctChange`, `high` e `low` ficam zerados/iguais ao `bid`.
- **Tesouro Direto não entrou** (o JSON público respondeu "gone" no anexo; o CSV do CKAN deu 429): fica para a Fase 8 como job noturno.
- **Poupança** calculada pela regra legal a partir da Selic meta (0,5 % a.m. acima de 8,5 % a.a.; 70 % da Selic abaixo), sem série própria.
- **Juros compostos**: mantida a taxa mensal equivalente do doc (`(1+i)^(1/12)-1`); o "≈ R$ 101–103 mil" do critério de aceite pressupõe
  taxa nominal 10 %/12 — com a fórmula do doc o resultado é ≈ R$ 99,9 mil (registrado no teste). TMB de Mifflin exata para 85 kg/178 cm/38 anos
  é 1.777,5 kcal (o doc arredonda para ≈ 1.782).
- **Cortes de carne só do boi** nesta sessão (16 cortes do doc 06 §3.6); porco e frango do anexo E.1 ficam para a próxima sessão
  (acrescentar ao `cortes.json` e um segundo/terceiro diagrama em `BeefDiagram.tsx`).
- **Faixas de preço dos cortes e do kit**: todas `null` (nenhum preço inventado); a tela mostra "faixa ainda não pesquisada" /
  "em pesquisa" até a rotina de preço (Fase 8) preencher com 2 lojas e data.
- **`licenca-regras.json`**: marcos da Lei 15.371/2026 com as fontes do Senado/Câmara/Agência Brasil do anexo; o texto consolidado no
  Planalto ainda não foi conferido (503 no anexo) — a tela avisa "conferir". Importado com `with { type: "json" }` (TS 5 + Vite).
- **"Mercado do pai hoje"** entrou dentro do `ToolsTeaser` (não se editou `Home.tsx`/`index.tsx`), via `getMarketTickerItems`, que só lê cache.
- **Sem vitest** (não está no `node_modules` compartilhado e `npm install` foi evitado): os testes puros rodam com
  `node --experimental-strip-types scripts/test-ferramentas.mjs`. Trocar por vitest quando o dono instalar.
- **PWA (§4.3)** não feita nesta sessão (manifest, ícones, service worker): item 4.10 continua aberto.
- **`src/components/tools/` → `src/components/ferramentas/`** com `git mv`; `ToolShell.tsx` removido (substituído por `ToolLayout`).

## Pendências do dono

- [ ] `CRON_SECRET` nas secrets do GitHub (workflow `market-refresh.yml`) e na Vercel; depois disparar o workflow 2× por `workflow_dispatch`.
- [ ] `BRAPI_TOKEN` (opcional) na Vercel para o grupo "Bolsa (B3)" aparecer.
- [ ] Aplicar `0007_ferramentas.sql` quando o projeto Supabase existir (`market_cache`, `tool_usage`); até lá o cache é só em memória e o
  `tool_usage` falha silenciosamente.
- [ ] Conferir o texto da Lei 15.371/2026 no Planalto e ajustar `licenca-regras.json` se divergir.

## Próxima sessão (Fase 4, restante)

- `nomes-de-filhos`, `calendario-de-vacinacao`, `marcos-do-desenvolvimento` (§3.13–§3.15) + porco e frango em `cortes-de-carne`.
- PWA (§4.3), pesquisa das faixas de preço dos cortes/kit, Lighthouse, PR "Fase 4 — Caixa de Ferramentas".
