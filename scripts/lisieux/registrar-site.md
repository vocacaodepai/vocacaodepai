# Registrar o Vocação de Pai no Painel Lisieux (repositório `grupovdp`)

> Doc 10 §11. O painel (`/home/user/grupovdp`) coleta GA4, Search Console e AdSense de cada site em
> `data/metrics.json` (`scripts/refresh-sites.mjs`, rodado por `.github/workflows/refresh-youtube.yml`) e mostra
> o escritório virtual dos agentes (`escritorio/`). Este arquivo tem **os passos exatos e o diff pronto** para o
> PR `claude/vocacaodepai-no-painel` no grupovdp. Nada aqui é executado automaticamente: é trabalho de uma
> sessão no repositório do painel + 1 secret que só o dono cria.

## 0. Decisão fixa: a empresa é `f1`

Em `escritorio/data.js` do grupovdp **já existe** a empresa do Vocação de Pai:
`DEFAULT_NAMES = { f1: "Vocação de Pai", f2: "Apostolado São José", f3: "Vocação de Mãe", … }` e
`SEED_TEAM` tem `["f1", "Tiago", "Redator", "Helena", "Pesquisadora"]`. Portanto `<COMPANY_ID_VDP>` = **`f1`**
(o Vocação de Mãe é `f3`). Não criar empresa nova. O id está registrado em `docs/plano/PROGRESSO.md` → "Decisões".

## 1. Passos (ordem)

1. No grupovdp: `git checkout -b claude/vocacaodepai-no-painel origin/main` e aplicar o diff da seção 2.
2. **Secret** `GA4_PROPERTY_VOCACAODEPAI` (Settings → Secrets and variables → Actions → Secrets) = ID numérico da
   propriedade GA4 do Vocação de Pai (Admin → Propriedade → Detalhes → "ID da propriedade"). Só o dono.
3. **GA4**: adicionar o e-mail da service account (`GOOGLE_SA_JSON.client_email`, secret que já existe no grupovdp)
   como "Leitor" na propriedade GA4 do Vocação de Pai. Só o dono.
4. **Search Console**: adicionar o mesmo e-mail como usuário em `sc-domain:vocacaodepai.com.br`
   (o script acha a propriedade sozinho, `findSearchConsoleSite`). Só o dono.
5. **AdSense**: nada no código; quando o domínio for aprovado, o relatório por `DOMAIN_NAME` passa a trazer
   `vocacaodepai.com.br`. Até lá o painel mostra "conta conectada, mas sem dados para este domínio ainda".
6. **Métricas internas** (`/api/hub/metrics`, doc 10 §11.4): a rota ainda não existe no site (pendência da Fase 8,
   ver `docs/plano/progresso-fase-8.md`). O diff abaixo já deixa `metricsUrl`/`metricsKeyEnv` na entrada e o loop
   tolerante a erro; o secret `HUB_API_KEY_VOCACAODEPAI` no grupovdp recebe o **mesmo valor de `CRON_SECRET`** do
   site (doc 02 §8: `HUB_API_KEY` → `CRON_SECRET`). Enquanto a rota não existir, `errors.internal` fica honesto.
7. Abrir o PR `claude/vocacaodepai-no-painel` contra `main` do grupovdp. Depois do merge e do próximo run do
   `refresh-youtube.yml`, conferir que `data/metrics.json` tem `sites.vocacaodepai` com `ga4`/`searchConsole`
   (ou mensagens de erro honestas) e que `node scripts/agente.mjs status` lista `rt-vocacaodepai` depois da
   primeira rodada da rotina.

## 2. Diff pronto (aplicar com `git apply` ou à mão)

```diff
--- a/scripts/refresh-sites.mjs
+++ b/scripts/refresh-sites.mjs
@@
 const SITES = [
   { key: "portaldaai", label: "Portal da AI", domain: "portaldaai.com.br", ga4Env: "GA4_PROPERTY_PORTALDAAI" },
   { key: "vocacaodemae", label: "Vocação de Mãe", domain: "vocacaodemae.com.br", ga4Env: "GA4_PROPERTY_VOCACAODEMAE" },
+  { key: "vocacaodepai", label: "Vocação de Pai", domain: "vocacaodepai.com.br", ga4Env: "GA4_PROPERTY_VOCACAODEPAI",
+    metricsUrl: "https://vocacaodepai.com.br/api/hub/metrics", metricsKeyEnv: "HUB_API_KEY_VOCACAODEPAI" },
 ];
@@
     if (adsense) {
       const rows = adsense.byDomain[s.domain] || adsense.byDomain["www." + s.domain];
       if (rows) out.adsense = { currency: adsense.currency, daily: rows };
       else out.errors.adsense = "conta conectada, mas sem dados para este domínio ainda";
     } else out.errors.adsense = adsenseError;
+    // métricas internas do site (doc 10 §11.4 do vocacaodepai): GET /api/hub/metrics com Authorization: Bearer <secret>
+    if (s.metricsUrl && s.metricsKeyEnv) {
+      const key = process.env[s.metricsKeyEnv];
+      if (!key) out.errors.internal = `secret ${s.metricsKeyEnv} ausente`;
+      else {
+        try {
+          const res = await fetch(s.metricsUrl, { headers: { Authorization: "Bearer " + key }, signal: AbortSignal.timeout(20000) });
+          if (!res.ok) throw new Error(res.status + " " + (await res.text()).slice(0, 200));
+          out.internal = await res.json();
+        } catch (e) { out.errors.internal = String(e.message || e); }
+      }
+    }

     // preserva a última leitura boa de cada fonte quando a de agora falhou
     const prev = (existing.sites || {})[s.key] || {};
-    for (const src of ["ga4", "searchConsole", "adsense"]) if (!out[src] && prev[src]) { out[src] = prev[src]; out.errors[src] = "usando última leitura boa (" + out.errors[src] + ")"; }
+    for (const src of ["ga4", "searchConsole", "adsense", "internal"]) if (!out[src] && prev[src]) { out[src] = prev[src]; out.errors[src] = "usando última leitura boa (" + out.errors[src] + ")"; }
```

```diff
--- a/.github/workflows/refresh-youtube.yml
+++ b/.github/workflows/refresh-youtube.yml
@@ passo "Buscar GA4, Search Console e AdSense dos sites"
         env:
           GOOGLE_SA_JSON: ${{ secrets.GOOGLE_SA_JSON }}
           GA4_PROPERTY_PORTALDAAI: ${{ secrets.GA4_PROPERTY_PORTALDAAI }}
           GA4_PROPERTY_VOCACAODEMAE: ${{ secrets.GA4_PROPERTY_VOCACAODEMAE }}
+          GA4_PROPERTY_VOCACAODEPAI: ${{ secrets.GA4_PROPERTY_VOCACAODEPAI }}
+          HUB_API_KEY_VOCACAODEPAI: ${{ secrets.HUB_API_KEY_VOCACAODEPAI }}
           YT_CLIENT_ID: ${{ secrets.YT_CLIENT_ID }}
```

```diff
--- a/escritorio/data.js
+++ b/escritorio/data.js
@@ var ROUTINES = [
     ["rt-vocacaodemae",       "Mariana",  "Editora · artigos, reviews e loja",   "f3", null, ["Redator", "Redator", "Redator", "Redator", "Redator"], 16, "editora + 15 subagentes, até 5 ao mesmo tempo (comparativos e reviews)"],
+    ["rt-vocacaodepai",       "Bruno",    "Editor · artigos, Pai Indica e Loja do Pai", "f1", null, ["Redator", "Redator", "Redator", "Redator", "Redator"], 16, "editor + 15 subagentes, até 5 ao mesmo tempo (Padrão A, Pai Indica e reviews)"],
```

Se a página do escritório tiver um `blog` (5º campo) para os sites com link, deixar `null` como no VDM.

## 3. Como a rotina do site reporta (já pronto neste repositório)

- `scripts/agente.mjs`: cópia sem alteração do grupovdp (fora do ESLint para continuar idêntico).
- `scripts/rotina/lisieux.sh inicio "<tarefa>" | fim | status`: chama o `agente.mjs` com `rt-vocacaodepai` e empresa `f1`.
- Variáveis da Routine (nunca commitar): `LISIEUX_SUPABASE_URL` (hoje o projeto do Vocação de Mãe, provisório —
  `supabase/LEIAME.md` do grupovdp), `LISIEUX_SUPABASE_ANON_KEY` (chave publicável), `LISIEUX_STATUS_SECRET`
  (`select value from public.lisieux_secrets where name='writer'` no SQL Editor daquele projeto), `LISIEUX_SESSION` (opcional).
- Alternativa sem variáveis, pelo conector Supabase do projeto do painel (doc 10 §11.3):
  ```sql
  select agent_id from public.lisieux_set_status((select value from public.lisieux_secrets where name = 'writer'),
    'rt-vocacaodepai', 'work', 'Rotina diária: início', 'f1', null);
  select agent_id from public.lisieux_set_status((select value from public.lisieux_secrets where name = 'writer'),
    'rt-vocacaodepai', 'rest', '', 'f1', null);
  ```
- Quem fica > 90 min em `work` sem aviso volta ao descanso: a rotina chama `lisieux.sh inicio` a cada etapa longa.
