#!/usr/bin/env python3
"""Troca as fotos de produtos da Loja do Pai por fotos oficiais em alta (galeria da Amazon).
Uso: python3 scripts/rotina/photo_upgrade.py N [OFFSET]
  -> processa N produtos da fila (image_url sem _AC_SL1500_ ou menos de 5 fotos, ordem featured desc, sort_order),
     grava photo_upgrade_out.sql (um UPDATE pequeno por produto; images é jsonb) e photo_upgrade_log.txt.
Ambiente: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (CLAUDE.md §13), do ambiente ou do .env/.env.local.
Não escreve no banco: quem aplica o SQL é a rotina/agente (mcp__Supabase__execute_sql). Nunca DELETE/DROP.
Adaptado do Vocação de Mãe (doc 05 §8.2)."""
import sys, json, re, subprocess, time, urllib.request, urllib.parse, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import amz

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")

def _env(name):
    v = os.environ.get(name)
    if v:
        return v
    for f in (".env", ".env.local"):
        p = os.path.join(ROOT, f)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding="utf8"):
            m = re.match(r"\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$", line)
            if m and m.group(1) == name:
                return m.group(2).strip("\"'")
    return None

URL = (_env("VITE_SUPABASE_URL") or "").rstrip("/")
KEY = _env("VITE_SUPABASE_ANON_KEY") or ""
if not URL.startswith("http") or not KEY or KEY.startswith("<"):
    print("Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ambiente ou .env).", file=sys.stderr)
    sys.exit(2)
BASE = URL + "/rest/v1/products"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

def q(url):
    req = urllib.request.Request(url, headers=H)
    return json.load(urllib.request.urlopen(req, timeout=60))

def queue(n, offset):
    rows = q(BASE + "?select=slug,name,asin,image_url,images,affiliate_url,featured,sort_order&active=eq.true&order=featured.desc,sort_order.asc&limit=1000")
    need = []
    for r in rows:
        imgs = r.get("images") or []
        hi = r.get("image_url") and "_AC_SL1500_" in r["image_url"]
        if hi and len(imgs) >= 5:
            continue
        asin = r.get("asin")
        if not asin:
            m = re.search(r"/dp/([A-Z0-9]{10})", r.get("affiliate_url") or "")
            asin = m.group(1) if m else None
        if not asin:
            continue  # sem ASIN confirmado: fila de ASIN do admin
        r["asin"] = asin
        need.append(r)
    return need[offset:offset + n], len(need)

def head_ok(u):
    r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{size_download}", "-m", "30", u], capture_output=True)
    parts = r.stdout.decode().split()
    return len(parts) == 2 and parts[0] == "200" and int(parts[1]) > 15000

def main():
    n = int(sys.argv[1]); off = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    items, total = queue(n, off)
    log = open("photo_upgrade_log.txt", "a"); out = open("photo_upgrade_out.sql", "a")
    log.write(f"fila total={total}, processando {len(items)}\n"); log.flush()
    for r in items:
        s = amz.fetch(r["asin"], tries=5)
        if not s:
            log.write(f"BLOQ {r['slug']}\n"); log.flush(); continue
        d = amz.parse(s)
        good = [u for u in d["images"] if head_ok(u)]
        if len(good) < 2:
            log.write(f"POUCAS {r['slug']} {len(good)}\n"); log.flush(); continue
        arr = json.dumps(good[:8], ensure_ascii=False).replace("'", "''")
        out.write(f"update public.products set image_url='{good[0]}', images='{arr}'::jsonb, updated_at=now() where slug='{r['slug']}' returning slug;\n"); out.flush()
        log.write(f"OK {r['slug']} {len(good)} fotos\n"); log.flush()
        time.sleep(5)

main()
