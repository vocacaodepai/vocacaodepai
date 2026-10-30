# Workflows desativados (guardados para o fim da Fase 8)

## `auto-merge.yml`

Cópia **sem alteração** de `/home/user/vocacaodemae/.github/workflows/auto-merge.yml` (doc 10 §10.1): mescla
sozinho (merge commit) qualquer PR aberto de uma branch `claude/*` assim que o check de status `Vercel`
fica verde. Está **desativado** porque o GitHub só executa workflows que ficam em `.github/workflows/`,
e o CLAUDE.md §4.1 e §15 proíbem auto-merge antes da conclusão da Fase 8 ("até a Fase 8 o dono mescla").

### Pré-requisitos para ligar (todos, nesta ordem)

1. `validate.yml` verde em pelo menos 5 PRs seguidos (build + lint + typecheck + validador de conteúdo).
2. Em GitHub → Settings → Branches → `main` → "Require status checks to pass": marcar **`validate`** e o
   check **`Vercel`** como required. Com isso o `gh pr merge` do workflow só mescla se os dois passarem.
3. Projeto Vercel `vocacaodepai` ligado ao repositório, com deploy de preview em cada PR (é o check `Vercel`).
4. Decisão explícita do dono registrada em `docs/plano/PROGRESSO.md` → "Decisões tomadas durante a execução"
   (data + "auto-merge ligado").
5. Opcional (doc 02 §8): se o `GITHUB_TOKEN` padrão não puder mesclar (branch protegida com "Restrict who can
   push"), criar o secret `GH_PAT_AUTOMERGE` (token com `repo`) e trocar `secrets.GITHUB_TOKEN` por
   `secrets.GH_PAT_AUTOMERGE` no workflow.

### Como ligar

```bash
git mv .github/workflows-disabled/auto-merge.yml .github/workflows/auto-merge.yml
git commit -m "chore(ci): ligar auto-merge dos PRs claude/* (fim da Fase 8)"
```

Depois do primeiro PR `claude/rotina-*` mesclado sozinho, conferir o deploy na Vercel
(`mcp__Vercel__list_deployments`). Para desligar: mover o arquivo de volta para esta pasta.
