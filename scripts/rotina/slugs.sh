#!/bin/bash
# Grava em slugs.txt (ou no caminho passado) os hrefs internos válidos, um por linha:
# /post/<slug>, /pai-indica/<slug>, /loja/<slug>, /ferramentas/<slug> (TOOLS de src/lib/tools/registry.ts),
# /formacao/<slug>, /desafios/<slug>, /categoria/<slug>. Usado pelos geradores (--slugs) e pelos redatores.
# Fonte: banco (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY ou VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY); sem banco, os seeds.
# Uso: bash scripts/rotina/slugs.sh [/tmp/rotina-pai/slugs.txt]
set -euo pipefail
exec python3 "$(dirname "$0")/helpers.py" slugs "${1:-slugs.txt}"
