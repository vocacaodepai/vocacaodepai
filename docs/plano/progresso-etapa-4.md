# Progresso — Fase 1, Etapa 4 (tokens, header, footer, menu móvel e conformidade §4.6)

> Registro da sessão da Etapa 4 (branch `claude/fase-1-etapa-4-layout`, worktree próprio).
> Ao fechar a Fase 1, copiar as decisões e pendências para `PROGRESSO.md` (seções "Decisões
> tomadas durante a execução" e "Pendências do dono") e marcar 1.12 no `13-checklist-de-execucao.md`.

Data: 2026-10-30 · Status: **concluída** (sem push; PR fica para o orquestrador da Fase 1).

## O que ficou pronto

| Entrega | Onde | Situação |
|---|---|---|
| Tokens §4.1 (`@theme` + `:root`/`.dark`), fontes Barlow Condensed/Inter, `--color-success/warning/danger`, títulos 600/700 `tracking-tight`, `tabular-nums` em tabelas | `src/styles.css` | feito; cores do semáforo (`.callout-ok/warn/bad`) e do `btn-comprar` (âmbar, Barlow Condensed) passaram para os tokens |
| Fontes §4.2 no `head()` (pesos 500/600/700 + Inter 400-700, `display=swap`) e `favicon.svg` | `src/routes/__root.tsx` | feito |
| Header: faixa "O pai também quer desconto → Loja do Pai", logo (Bússola do Pai), 7 seções em uma linha a partir de `xl` (Blog com dropdown de `fetchCategories`), Sobre/Contato a partir de `2xl`, busca, `ThemeToggle`, menu de conta (Área do Pai, Minha conta, Admin se admin/editor, Sair), botão "Entrar" → `/entrar` | `src/components/layout/SiteLayout.tsx`, `nav.ts`, `Logo.tsx` | feito |
| Menu móvel acessível (`aria-controls`/`aria-expanded`, foco no 1º link, Esc fecha, fecha ao navegar) com as 7 seções, chips de categoria, Sobre/Contato e conta | `src/components/layout/MobileMenu.tsx` | feito |
| Footer §4.4 em 4 colunas: marca + slogan + bloco "Para a sua esposa: Vocação de Mãe" (`rel="noopener"`, sem `nofollow`) · Seções · Institucional (+ Política de Afiliados + "Gerenciar cookies") · Newsletter; linha final "© ano · Um site do Grupo VDP · Participante do Programa de Associados da Amazon" + assinatura do doc 00 §7.9 | `src/components/layout/Footer.tsx` | feito |
| CookieConsent §4.6-1: 1º nível "Aceitar" / "Rejeitar não necessários" / "Gerenciar" (mesmo destaque); 2º nível Necessários (fixo) / Analíticos / Publicidade desmarcados; `localStorage` `vdp-consent` (`{v, ts, analytics, ads}`); Consent Mode v2 `default` denied no `__root` antes de qualquer script do Google; GA4 só carrega após `analytics_storage=granted` | `src/components/layout/CookieConsent.tsx`, `src/lib/ga4.ts`, `src/routes/__root.tsx` | feito |
| Newsletter double opt-in §4.6-3: `POST /api/newsletter` (valida, upsert `pending`, e-mail Resend, resposta genérica) e `GET /api/newsletter/confirmar?token=` (`confirmed` + `confirmed_at`, página mínima `noindex`) | `src/routes/api/newsletter.ts`, `src/routes/api/newsletter.confirmar.ts`, `src/lib/newsletter.ts`, `src/lib/newsletter.server.ts`, `src/components/blog/NewsletterSignup.tsx` | feito |
| Antispam §4.6-4: Turnstile (widget só com `TURNSTILE_SITE_KEY`; validação só com `TURNSTILE_SECRET_KEY`; sem chave degrada), honeypot `website`, tempo mínimo `startedAt` (2,5 s), rate limit 10/h por IP e rota (memória) | idem | feito |
| `src/lib/ads/no-ads-routes.ts` com a lista do doc 11 §2.5 e `isNoAdsRoute(pathname)` | `src/lib/ads/no-ads-routes.ts` | feito (o `AdSlot` ainda não chama; ver pendências) |
| `public/logo.svg`, `public/favicon.svg`, `manifest.webmanifest` | `public/` | feito |
| `src/lib/site.ts`: slogan e meta description do doc 00 §7.9, `EMAIL_FROM`/`CONTACT_EMAIL`, `VDM_URL`, `SITE_URL` de `PUBLIC_SITE_URL` | `src/lib/site.ts` | feito |

## Validação

- `npx tsc --noEmit` ✔ · `npm run lint` ✔ (0 erros; 8 avisos `react-refresh/only-export-components`, pré-existentes em `router-compat.tsx`/`Callout.tsx` e 2 em `CookieConsent.tsx` por exportar `reopenCookieConsent`/`getStoredConsent`, mesmo padrão do VDM) · `npm run build` ✔.
- Bundle do cliente (`.vercel/output/static`): sem `siteverify`, `api.resend.com`, `RESEND_API_KEY` (nada de servidor vazou), sem `pagead2.googlesyndication`; o `gtag/js` aparece só como string dentro de `loadGa4()`.
- `vite dev` com Supabase fictício (`VITE_SUPABASE_URL=https://example.supabase.co`): `/`, `/sobre`, `/blog`, `/busca`, `/contato`, `/politica-de-privacidade` → 200 com o novo header/rodapé; HTML da home traz as fontes §4.2, o `gtag('consent','default', …denied)`, **nenhuma** tag `googletagmanager.com/gtag/js` nem AdSense, bloco "Para a sua esposa", "Gerenciar cookies", faixa "O pai também quer desconto".
- `POST /api/newsletter`: honeypot → 200 genérico; e-mail inválido → 400; JSON ruim → 400; 10 pedidos reais e o **11º → 429**; `GET /api/newsletter/confirmar` sem token → 400, token não-UUID → 404, UUID → página com `X-Robots-Tag: noindex` (500 só porque o banco era fictício).
- Sem `.env` no worktree a SSR cai em "Invalid supabaseUrl" (placeholder `<SUPABASE_URL>`): comportamento pré-existente da base, não desta etapa.
- Não testado com banco real nem com Resend/Turnstile (chaves não existem aqui): aceite completo da §4.6 (linha `pending` → `confirmed`) fica para quando o dono preencher as variáveis.

## Decisões tomadas durante a execução

- **Símbolo do logo = Bússola do Pai (doc 00 §7.2/§7.3), não escudo.** O doc 03 §4.3 e o briefing desta etapa falam em "escudo com VP", mas o doc 00 (identidade de marca) escolhe explicitamente o Conceito C e reserva o escudo para o selo "Escolha do Pai Indica". Prevaleceu o doc de marca; "VP" fica no círculo central. SVG simples; o dono troca depois. `Logo.tsx` renderiza inline (`currentColor`) e `public/logo.svg` é a versão estática. Os demais arquivos de `public/brand/` (doc 00 §7.3) e `src/components/brand/Logo.tsx` ficam para a etapa 6.6.
- **GA4 sem fallback de ID**: `src/lib/ga4.ts` lê só `PUBLIC_GA4_ID`; o ID herdado do VDM (`G-RSP3KRCSEF`) foi removido para não mandar tráfego do VDP para a propriedade da Vocação de Mãe. Sem a variável, o GA4 fica desligado.
- **AdSense removido do `__root.tsx`**: o `ADSENSE_PUBLISHER_ID` (`src/lib/adsense.ts`) e o `public/ads.txt` ainda são os do VDM. Carregar esse ID no domínio do VDP violaria a política do AdSense; o script volta quando o dono tiver a conta do VDP (ver pendências). O Consent Mode v2 já nasce `denied` para quando voltar.
- **`vite.config.ts`**: acrescentado `vite: { envPrefix: ["VITE_", "PUBLIC_", "TURNSTILE_SITE_KEY"] }` (doc 02 §8) para `PUBLIC_GA4_ID`, `PUBLIC_SITE_URL` e `TURNSTILE_SITE_KEY` chegarem ao cliente. Única edição fora da lista de arquivos da etapa; sem isso o GA4 e o Turnstile não funcionam.
- **Resend por HTTP (`fetch` em `https://api.resend.com/emails`)**, sem o SDK `resend`: evita dependência nova no worktree compartilhado. Se a Fase 5/8 preferir o SDK, trocar só `sendEmail()` em `newsletter.server.ts`.
- **Confirmação em `/api/newsletter/confirmar`** (handler GET que já marca `confirmed` e mostra "Inscrição confirmada" numa página mínima `noindex`), porque a rota de conteúdo `/newsletter/confirmar` (doc 03 §4.6) é de outro agente/etapa. Quando ela existir, trocar a resposta HTML por `302` para `/newsletter/obrigado` e manter o link do e-mail apontando para a API.
- **Tipos do Supabase**: `newsletter_subscribers` ainda não está em `src/integrations/supabase/types.ts` (herdado do VDM); `newsletter.server.ts` usa um cast local. Regenerar os tipos (`mcp__Supabase__generate_typescript_types`) quando o projeto real existir.
- **Caixa "Minha esposa também quer receber o Vocação de Mãe"**: implementada no formulário e na API (`spouseEmail` → `forwardSpouseToVdm` com segmento `indicado-pelo-marido`), mas **escondida** (`SPOUSE_NEWSLETTER_ENABLED=false` em `src/lib/newsletter.ts`) porque a API de newsletter do VDM ainda não aceita esse POST (doc 03 §4.6 item 3). Para ligar: preencher `VDM_NEWSLETTER_ENDPOINT`.
- **"Admin" no menu de conta** aparece para `role` `admin` **ou** `editor` (o perfil seed "Equipe Vocação de Pai" é `editor` e precisa do painel). O plano diz "se `is_admin`"; `is_admin()` do banco decide o acesso real.
- `CookieConsent` nunca envia dado de consentimento ao servidor (só `localStorage`); o "log de consentimento" opcional do doc 11 §2.7 fica para quando `tool_usage` existir (Fase 4).
- `trackEvent()` em `ga4.ts` para os eventos do doc 02 §7 (`newsletter_subscribe` já é disparado).
- Links para rotas ainda inexistentes (`/pai-indica`, `/loja`, `/ferramentas`, `/pai-indica-pai`, `/irmandade`, `/formacao`, `/entrar`, `/area-do-pai`, `/minha-conta`, `/politica-de-afiliados`) usam o `Link` de `src/lib/router-compat.tsx` (que tipa `to` como string): typecheck verde sem truque extra; até as rotas existirem, caem no `notFoundComponent` do `__root`.

## Pendências do dono / de outras etapas

1. **Variáveis**: `PUBLIC_GA4_ID` (propriedade GA4 do VDP), `PUBLIC_SITE_URL`, `RESEND_API_KEY` (domínio `vocacaodepai.com.br` verificado no Resend), `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (site Turnstile para `vocacaodepai.com.br`). Sem elas: GA4 desligado, e-mail de confirmação não sai (inscrição fica `pending`), Turnstile ausente (honeypot + rate limit seguram). Acrescentar as duas do Turnstile ao `.env.example` (arquivo ainda não existe no worktree; dono da etapa 1/2).
2. **AdSense do VDP**: criar a conta/propriedade, trocar `ADSENSE_PUBLISHER_ID` em `src/lib/adsense.ts` e `public/ads.txt`, e religar o script em `src/routes/__root.tsx` (comentário no local).
3. **`AdSlot.tsx`** (etapa 6/anúncios): passar a devolver `null` quando `isNoAdsRoute(useLocation().pathname)`.
4. **Favicons PNG/ICO e `apple-touch-icon.png`** ainda são os herdados do VDM; `favicon.svg` já é o do VDP. Gerar os PNG (16/32/180/512) e o `og-default.jpg` na etapa 6.6 (`public/brand/`).
5. **Rota `/newsletter/confirmar` e `/newsletter/obrigado`** (rotas de conteúdo, outra etapa): ao criá-las, trocar o HTML do handler por redirect e registrar no doc 02 §1.3 como o plano pede.
6. **API do VDM** para o segmento `indicado-pelo-marido` (doc 00 §9.1 item 8): tarefa no repositório do Vocação de Mãe; depois ligar `VDM_NEWSLETTER_ENDPOINT`.
7. Redes sociais do VDP: preencher `SOCIAL_LINKS` em `src/lib/site.ts` quando existirem (hoje o rodapé não mostra o bloco).

## Arquivos

- Novos: `src/components/layout/Footer.tsx`, `MobileMenu.tsx`, `Logo.tsx`, `nav.ts`; `src/lib/newsletter.ts`, `src/lib/newsletter.server.ts`, `src/lib/ads/no-ads-routes.ts`; `src/routes/api/newsletter.ts`, `src/routes/api/newsletter.confirmar.ts`; `public/logo.svg`, `public/favicon.svg`; este arquivo.
- Alterados: `src/styles.css`, `src/routes/__root.tsx`, `src/components/layout/SiteLayout.tsx`, `CookieConsent.tsx`, `ThemeToggle.tsx`, `src/components/blog/NewsletterSignup.tsx`, `src/lib/ga4.ts`, `src/lib/site.ts`, `public/manifest.webmanifest`, `vite.config.ts`, `src/routeTree.gen.ts` (gerado pelo build).
- Dependências novas: **nenhuma** (`npm install` não foi executado).
