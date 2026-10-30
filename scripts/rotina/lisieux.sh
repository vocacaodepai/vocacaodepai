#!/bin/bash
# Painel Lisieux (grupovdp): avisa o escritório virtual o que a rotina está fazendo (doc 10 §11.2).
# Chama scripts/agente.mjs (cópia sem alteração de /home/user/grupovdp/scripts/agente.mjs).
#
# Uso:
#   bash scripts/rotina/lisieux.sh inicio "Rotina diária: E1 Search Console"   -> status "work" (renova os 90 min)
#   bash scripts/rotina/lisieux.sh fim                                          -> status "rest"
#   bash scripts/rotina/lisieux.sh status                                       -> lista todos os agentes
#
# Variáveis (env da Routine; nunca commitar): LISIEUX_SUPABASE_URL, LISIEUX_SUPABASE_ANON_KEY,
# LISIEUX_STATUS_SECRET (select value from public.lisieux_secrets where name='writer', no projeto do painel),
# LISIEUX_SESSION (opcional). LISIEUX_AGENT_ID (padrão rt-vocacaodepai) e LISIEUX_COMPANY (padrão f1 =
# "Vocação de Pai" em escritorio/data.js do grupovdp). Sem variáveis ou sem rede, o agente.mjs avisa no
# stderr e sai com 0: nunca derruba a rotina.
set -u
DIR="$(cd "$(dirname "$0")/.." && pwd)"
AGENT="${LISIEUX_AGENT_ID:-rt-vocacaodepai}"
COMPANY="${LISIEUX_COMPANY:-f1}"
export LISIEUX_SESSION="${LISIEUX_SESSION:-rotina-$(date +%F)}"
case "${1:-}" in
  inicio|início) node "$DIR/agente.mjs" inicio "$AGENT" "${2:-Rotina diária}" "$COMPANY" ;;
  fim)           node "$DIR/agente.mjs" fim "$AGENT" ;;
  status)        node "$DIR/agente.mjs" status ;;
  *) echo 'uso: lisieux.sh inicio "<tarefa>" | fim | status' >&2; exit 1 ;;
esac
