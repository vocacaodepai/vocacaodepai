#!/usr/bin/env python3
"""Lê a página mobile da Amazon Brasil de um ASIN e imprime JSON com título, fotos oficiais
em alta (data-a-hires, _AC_SL1500_), bullets, descrição, nota, avaliações, preço e disponibilidade.
Uso: python3 scripts/rotina/amz.py ASIN [--file caminho.html] [--tries N] [--refresh]
A Amazon bloqueia com frequência (resposta de ~2 KB): o script repete com pausa longa.
Herdado do Vocação de Mãe (doc 05 §8.1). O `price` do JSON só alimenta products.price
(base da estimativa) e nunca vai para o texto."""
import sys, re, json, html, time, subprocess, os

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 "
      "(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")
CACHE = "/tmp/amzcache-vocacaodepai"

def fetch(asin, tries=6):
    for i in range(tries):
        r = subprocess.run(["curl", "-s", "-m", "30", "-A", UA, "-H", "Accept-Language: pt-BR",
                            f"https://www.amazon.com.br/gp/aw/d/{asin}"], capture_output=True)
        s = r.stdout.decode("utf8", "ignore")
        if len(s) > 300000 and ("add-to-cart-button" in s or "feature-bullets" in s):
            return s
        time.sleep(25 + 10 * i)
    return None

def clean(t):
    t = re.sub(r"<[^>]+>", " ", t)
    return re.sub(r"\s+", " ", html.unescape(t)).strip()

def parse(s):
    out = {}
    m = re.search(r"<title>([^<]+)", s)
    out["title"] = clean(m.group(1)).replace(" | Amazon.com.br", "") if m else None
    ids, imgs = set(), []
    for u in re.findall(r'data-a-hires="(https://m\.media-amazon\.com/images/I/[^"]+)"', s):
        m = re.search(r"/images/I/([A-Za-z0-9+%-]+)\.", u)
        if not m or m.group(1) in ids:
            continue
        ids.add(m.group(1))
        imgs.append(f"https://m.media-amazon.com/images/I/{m.group(1)}._AC_SL1500_.jpg")
    out["images"] = imgs[:8]
    i = s.find('id="feature-bullets"')
    bullets = []
    if i >= 0:
        seg = s[i:i + 12000]
        seg = seg.split("Veja mais")[0]
        for b in re.findall(r"<span class=\"a-list-item\"[^>]*>(.*?)</span>", seg, flags=re.S):
            c = clean(b)
            if c:
                bullets.append(c)
        if not bullets:
            bullets = [x.strip() for x in clean(re.sub(r"<(li|span)[^>]*>", "|", seg)).split("|") if len(x.strip()) > 20][:10]
    out["bullets"] = bullets[:12]
    m = re.search(r'id="productDescription".*?</div>', s, flags=re.S)
    out["description"] = clean(m.group(0))[:1500] if m else None
    m = re.search(r"([\d,]+) de 5 estrelas", s)
    out["rating"] = m.group(1) if m else None
    m = re.search(r"([\d.]+)\s+avalia", s)
    out["reviews"] = m.group(1) if m else None
    m = re.search(r'a-offscreen">(R\$[^<]+)', s)
    out["price"] = m.group(1).strip() if m else None
    out["available"] = "add-to-cart-button" in s
    details = {}
    for k, v in re.findall(r"<th[^>]*>\s*([^<]{2,40}?)\s*</th>\s*<td[^>]*>\s*(.*?)\s*</td>", s, flags=re.S):
        details[clean(k)] = clean(v)[:120]
    out["details"] = dict(list(details.items())[:20])
    return out

if __name__ == "__main__":
    if len(sys.argv) < 2 or not re.fullmatch(r"[A-Z0-9]{10}", sys.argv[1]):
        print("Uso: python3 scripts/rotina/amz.py <ASIN de 10 caracteres> [--file x.html] [--tries N] [--refresh]")
        sys.exit(2)
    asin = sys.argv[1]
    tries = 6
    if "--tries" in sys.argv:
        tries = int(sys.argv[sys.argv.index("--tries") + 1])
    os.makedirs(CACHE, exist_ok=True)
    cf = os.path.join(CACHE, asin + ".json")
    if "--file" not in sys.argv and os.path.exists(cf) and "--refresh" not in sys.argv:
        print(open(cf, encoding="utf8").read()); sys.exit(0)
    if "--file" in sys.argv:
        s = open(sys.argv[sys.argv.index("--file") + 1], encoding="utf8", errors="ignore").read()
    else:
        s = fetch(asin, tries)
    if not s:
        print(json.dumps({"asin": asin, "error": "bloqueado pela Amazon após várias tentativas"}, ensure_ascii=False))
        sys.exit(1)
    d = parse(s)
    d["asin"] = asin
    out = json.dumps(d, ensure_ascii=False, indent=1)
    if d.get("title") and "--file" not in sys.argv:
        open(cf, "w", encoding="utf8").write(out)
    print(out)
