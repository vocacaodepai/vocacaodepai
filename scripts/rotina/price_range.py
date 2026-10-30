#!/usr/bin/env python3
"""Fila e gravação da faixa de preço da Loja do Pai (doc 05 §8.4; CLAUDE.md §5.2).

Uso:
  python3 scripts/rotina/price_range.py fila [N]            -> imprime a fila (ativos sem price_range_checked_at,
                                                                depois os com mais de 60 dias), N = 15 por padrão
  python3 scripts/rotina/price_range.py sql achados.json    -> valida e gera price_range_out.sql

achados.json = [{"slug": "...", "checks": [{"store": "Mercado Livre", "price": 389.90, "url": "https://..."},
                                            {"store": "Magalu", "price": 429.00, "url": "https://..."}]}, ...]
Regras: mesmo item (marca, modelo, cor/quantidade) em >= 2 lojas diferentes; min = menor, max = maior;
se max > 3 x min, descarta (provável item diferente) e não grava nada. Sem confirmação: não grava.
Quem aplica o SQL é a rotina/agente (mcp__Supabase__execute_sql). Nunca DELETE/DROP.
Ambiente: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ambiente ou .env/.env.local)."""
import sys, json, re, os, urllib.request

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

def q(path):
    url = (_env("VITE_SUPABASE_URL") or "").rstrip("/")
    key = _env("VITE_SUPABASE_ANON_KEY") or ""
    if not url.startswith("http") or not key or key.startswith("<"):
        print("Faltam VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ambiente ou .env).", file=sys.stderr)
        sys.exit(2)
    req = urllib.request.Request(url + "/rest/v1" + path, headers={"apikey": key, "Authorization": f"Bearer {key}"})
    return json.load(urllib.request.urlopen(req, timeout=60))

def fila(n):
    never = q("/products?select=slug,name,brand,asin&active=eq.true&price_range_checked_at=is.null&order=featured.desc,sort_order.asc&limit=1000")
    import datetime
    cut = (datetime.datetime.utcnow() - datetime.timedelta(days=60)).isoformat() + "Z"
    stale = q(f"/products?select=slug,name,brand,asin&active=eq.true&price_range_checked_at=lt.{cut}&order=price_range_checked_at.asc&limit=1000")
    rows = (never + stale)[:n]
    for r in rows:
        print(f"{r['slug']}\t{r.get('brand') or ''}\t{r['name']}\tASIN {r.get('asin') or 'PENDENTE'}")
    print(f"-- {len(rows)} na fila (sem faixa: {len(never)}, com mais de 60 dias: {len(stale)})", file=sys.stderr)

def esc(s):
    return str(s).replace("'", "''")

def sql(path):
    items = json.load(open(path, encoding="utf8"))
    out, skipped = [], []
    for it in items:
        slug = it.get("slug", "")
        checks = [c for c in it.get("checks", []) if c.get("store") and float(c.get("price") or 0) > 0]
        stores = {c["store"].strip().lower() for c in checks}
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or len(checks) < 2 or len(stores) < 2:
            skipped.append((slug, "menos de 2 lojas diferentes")); continue
        prices = [float(c["price"]) for c in checks]
        mn, mx = min(prices), max(prices)
        if mx > 3 * mn:
            skipped.append((slug, f"max {mx} > 3 x min {mn}")); continue
        vals = ",\n  ".join(
            f"((select id from public.products where slug='{esc(slug)}'), '{esc(c['store'].strip())}', {float(c['price']):.2f}, {('NULL' if not c.get('url') else chr(39)+esc(c['url'])+chr(39))})"
            for c in checks)
        out.append(
            f"insert into public.product_price_checks (product_id, store, price, url) values\n  {vals};\n"
            f"update public.products set price_min={mn:.2f}, price_max={mx:.2f}, price_range_checked_at=now() where slug='{esc(slug)}' returning slug;\n")
    open("price_range_out.sql", "w", encoding="utf8").write("\n".join(out))
    print(f"OK: {len(out)} produto(s) com faixa -> price_range_out.sql; pulados: {len(skipped)}")
    for s, why in skipped:
        print(f"  PULADO {s}: {why}")

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "fila"
    if cmd == "fila":
        fila(int(sys.argv[2]) if len(sys.argv) > 2 else 15)
    elif cmd == "sql" and len(sys.argv) > 2:
        sql(sys.argv[2])
    else:
        print(__doc__); sys.exit(2)
