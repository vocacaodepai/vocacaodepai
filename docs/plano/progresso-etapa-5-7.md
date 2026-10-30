# Progresso — Fase 1, Etapas 5 (Home) e 7 (Páginas institucionais)

> Registro desta sessão (branch `claude/fase-1-etapa-5-home-institucional`, 2026-10-30).
> Quem consolidar a Fase 1 copia as linhas de status para `PROGRESSO.md` e marca as caixas 5.x e 7.x
> em `13-checklist-de-execucao.md` (não editados aqui para não conflitar com as outras etapas em paralelo).

## Status

| Etapa | Status | Observações |
|---|---|---|
| 5 — Home | concluída (código) | 9 seções na ordem do doc 03 §5.2; placeholders noindex; `/entrar` → `/admin/login`. Lighthouse fica para depois do deploy. |
| 7 — Páginas institucionais | concluída (código) | `/sobre` (manifesto do doc 00 §8 sem alteração), `/contato` (server function), `/politica-de-privacidade`, `/termos-de-uso`, `/politica-de-afiliados`. Teste real de e-mail ("teste fase 1") depende de `RESEND_API_KEY` na Vercel. |

Validação nesta sessão: `npm run build`, `npx tsc --noEmit` e `npm run lint` verdes (só avisos pré-existentes de
fast-refresh em arquivos de outras etapas). SSR conferido com `vite dev` e Supabase apontado para uma porta
fechada (banco "vazio"): as 13 rotas respondem 200 com título, H1 e estados vazios; `/entrar` responde 307 para
`/admin/login`; placeholders saem com `<meta name="robots" content="noindex">`.

## Arquivos desta sessão

- Home: `src/pages/Home.tsx`, `src/routes/_site/index.tsx`, `src/lib/home.functions.ts` (novo),
  `src/components/home/{HomeHero,LatestArticles,PaiIndicaTeaser,ToolsTeaser,HomeCategories,AreaDoPaiCta,NewsletterSection,LojaTeaser,MostRead,SectionHeading,ComingSoon}.tsx` (novos).
- Placeholders: `src/routes/_site/{pai-indica,loja,ferramentas,pai-indica-pai,formacao}/index.tsx`,
  `src/routes/_site/{area-do-pai,irmandade,entrar}.tsx` (novos).
- Institucional: `src/pages/{About,Contact,PrivacyPolicy,TermsOfUse}.tsx` (reescritos), `src/pages/AffiliatePolicy.tsx` (novo),
  `src/routes/_site/{sobre,contato,politica-de-privacidade,termos-de-uso}.tsx` (títulos/descrições estavam do Vocação de Mãe),
  `src/routes/_site/politica-de-afiliados.tsx` (novo), `src/lib/contact.functions.ts` (novo),
  `src/lib/site.ts` (+ `CONTACT_TO_EMAIL`, `RESEND_FROM`), `supabase/functions/notify-contact-message/index.ts` (remetente/destinatário).
- `src/routeTree.gen.ts` regenerado pelo build.

## Decisões tomadas durante a execução

- 2026-10-30 · F1/5 · `ComingSoon` fica em `src/components/home/ComingSoon.tsx`, não em `components/layout/` como o doc 03 §5.3 pedia,
  porque `components/layout/*` é da etapa 4 (Header/Footer) em andamento em paralelo. Mover é trocar um import.
- 2026-10-30 · F1/5 · Dados extras da home (`paiIndica`, `mainCategories`) vêm de `getHomeExtras` em `src/lib/home.functions.ts`,
  e o loader de `/_site/` faz `Promise.all([getHomeData(), getHomeExtras()])`. `hub.functions.ts`/`queries.ts` (etapa 6) não foram
  tocados; se a etapa 6 acrescentar `paiIndica` em `HomeData`, basta remover a parte duplicada de `home.functions.ts`.
  As colunas `kind`/`product_score`/`parent_id` ainda não estão em `src/integrations/supabase/types.ts`, por isso a consulta usa o client sem tipagem de tabela.
- 2026-10-30 · F1/5 · As 14 categorias da home são as de `parent_id is null and sort_order < 900` (0002_blog.sql). `categories.icon` vem nulo
  na seed, então `HomeCategories.tsx` mapeia ícone lucide por slug (com fallback por `icon` e `Compass`). Se a consulta falhar, cai nas
  categorias do hub filtrando `sort_order < 900`.
- 2026-10-30 · F1/5 · Cartões da Caixa de Ferramentas e da Loja do Pai são estáticos e apontam para os placeholders `/ferramentas` e `/loja`
  (doc 03 §5.2); as rotas finais ficam no `title` dos cartões. Nenhum dado fictício de produto.
- 2026-10-30 · F1/7 · Envio do contato: server function `sendContact` grava em `contact_messages` (service role se `SUPABASE_SERVICE_ROLE_KEY`
  existir, senão chave anon com a policy de insert público) e, se `RESEND_API_KEY` existir no servidor, manda o e-mail direto pelo Resend
  para `CONTACT_TO_EMAIL`. A edge function `notify-contact-message` NÃO é chamada pelo app: ela exige `CONTACT_NOTIFY_SECRET` no Vault,
  nome que não está na lista fechada do CLAUDE.md §13; fica para o trigger `AFTER INSERT` (pg_net) do doc 02, se o dono quiser.
  Campo-isca `website` no formulário (robô preenche, humano não vê) e validação igual no cliente e no servidor (10–5.000 caracteres).
- 2026-10-30 · F1/7 · `CONTACT_TO_EMAIL` e `RESEND_FROM` entraram em `src/lib/site.ts` como constantes (CLAUDE.md §13), ambos
  `contato@vocacaodepai.com.br`. O dono troca o destinatário ali se quiser receber em outra caixa.
- 2026-10-30 · F1/7 · `/sobre` usa o manifesto do doc 00 §8 colado sem alteração (H1 "Sobre o Vocação de Pai"), mais os blocos
  "Quem está por trás" (Bruno Danello) e "O grupo VDP" (links `rel="noopener"` sem nofollow, doc 00 §9.1). O "Blog do Bitcoin" é citado
  no texto, sem link, porque o plano não dá a URL.
- 2026-10-30 · F1/7 · `AMAZON_DISCLOSURE` (frase exata do doc 11 §3.1) exportada de `src/pages/AffiliatePolicy.tsx`; a Fase 2 move
  para `src/lib/affiliate/disclosure.ts` quando criar o `<aside class="aviso-afiliado">` dos reviews.
- 2026-10-30 · F1/5+7 · As páginas não chamam mais `useSeo` no cliente: título, descrição, canonical, OG e JSON-LD saem do `head()` da rota (SSR).

## Pendências para outras etapas / para o dono

- **Etapa 4 (layout, outro agente):** adicionar o link "Política de afiliados" (`/politica-de-afiliados`) no rodapé e os itens de menu
  das seções (placeholders já existem). O rodapé também deve exibir a frase da Amazon (doc 11 §3.1) quando a Fase 2 ligar os afiliados.
- **Sitemap (`src/routes/sitemap[.]xml.ts`, não editado):** incluir `/politica-de-afiliados` em `STATIC_PAGES`. Os placeholders
  ficam fora, como manda o doc 03 §5.3.
- **Supabase client (`src/integrations/supabase/client.ts`, etapa 1):** com os placeholders `<SUPABASE_URL>` o SSR responde 500 em
  TODAS as páginas (`Invalid supabaseUrl`), porque o client é criado na importação do módulo. Resolve-se ao preencher `VITE_SUPABASE_URL`
  /`VITE_SUPABASE_ANON_KEY` (ou os fallbacks) no fim da Etapa 1; não é causado por estas etapas.
- **NewsletterSignup (etapa 6):** continua gravando em `subscribers`; a tabela do VDP é `newsletter_subscribers` (0001_core.sql).
  Os placeholders e a home usam o componente como está, com `source` = `home` / `em-breve-<secao>`.
- **Dono:** `RESEND_API_KEY` na Vercel para o contato chegar por e-mail (sem ela a mensagem fica em `contact_messages`, visível no
  admin); confirmar o domínio `vocacaodepai.com.br` no Resend para o remetente `contato@vocacaodepai.com.br`; testar `/contato` com
  assunto "teste fase 1" depois do deploy; rodar Lighthouse mobile na home (meta: ≥ 85 performance, 100 acessibilidade/SEO).
- Nenhuma dependência nova foi instalada.
