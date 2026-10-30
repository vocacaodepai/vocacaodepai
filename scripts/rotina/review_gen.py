#!/usr/bin/env python3
"""Valida um JSON de review longa de produto da Loja do Pai e gera o SQL (doc 05 §8.3).
Uso: python3 scripts/rotina/review_gen.py arquivo.json
  - "novo": true  -> gera INSERT do produto (com review) em <slug>.insert.sql
  - senão         -> gera <slug>.stg.sql (staging em _tmp_post_staging, k='review:<slug>') e <slug>.upd.sql (UPDATE curto com md5)
Campos: slug, asin (novo), name, brand, category (slug de product_categories), subcategory (slug do doc 04 §3),
description, short_description, price (número ou 'R$ 1.234,56' ou null; só alimenta products.price), image_url,
images[], pros[], cons[], review{titulo, resumo, nota, criterios[5], ideal_para, em_3_pontos[3], secoes[>=6, >=3 cta],
preco_texto, ficha[>=5], como_avaliamos, opiniao, faq[>=4 {q,a}]}.
Regras: preço NUNCA exato no texto (só faixa escrita pelo componente); botão sempre 'Comprar agora na Amazon';
fotos oficiais (HTTP 200, > 15 KB); tag de afiliado de PUBLIC_AMAZON_TAG."""
import sys, json, re, hashlib, subprocess, os, datetime

TAG = os.environ.get("PUBLIC_AMAZON_TAG", "vocacaodepai-20")

def words(r):
    t = [r.get("titulo", ""), r.get("resumo", ""), r.get("ideal_para", ""), r.get("preco_texto", ""),
         r.get("como_avaliamos", ""), r.get("opiniao", "")]
    t += r.get("em_3_pontos", [])
    for s in r.get("secoes", []):
        t.append(s.get("titulo", "")); t += s.get("paragrafos", [])
    for f in r.get("faq", []):
        t += [f.get("q", ""), f.get("a", "")]
    return len(" ".join(t).split())

def head_ok(u):
    out = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{size_download}", "-m", "30", u], capture_output=True).stdout.decode().split()
    return len(out) == 2 and out[0] == "200" and int(out[1]) > 15000, out

def check(d):
    err = []
    r = d.get("review") or {}
    if not isinstance(r.get("nota"), (int, float)) or not 0 <= r["nota"] <= 10: err.append("nota 0-10")
    if len(r.get("criterios", [])) != 5: err.append("exatamente 5 critérios {nome,nota}")
    if len(r.get("em_3_pontos", [])) != 3: err.append("em_3_pontos precisa ter 3")
    secs = r.get("secoes", [])
    if len(secs) < 6: err.append("mínimo 6 seções")
    if sum(1 for s in secs if s.get("cta")) < 3: err.append("mínimo 3 seções com cta:true")
    if len(r.get("faq", [])) < 4: err.append("mínimo 4 perguntas no faq")
    if len(r.get("ficha", [])) < 5: err.append("ficha com pelo menos 5 linhas")
    for k in ("titulo", "resumo", "ideal_para", "como_avaliamos", "opiniao", "preco_texto"):
        if not r.get(k): err.append(f"faltou {k}")
    if not 4 <= len(d.get("pros", [])) <= 6: err.append("pros: 4 a 6")
    if not 4 <= len(d.get("cons", [])) <= 6: err.append("cons: 4 a 6")
    if len(d.get("images", [])) < 3: err.append("images: mínimo 3 fotos oficiais")
    for u in d.get("images", []):
        if not u.startswith("https://m.media-amazon.com/"): err.append(f"foto não oficial: {u}")
    w = words(r)
    if w < 900: err.append(f"review curta: {w} palavras (mín. 900)")
    blob = json.dumps(r, ensure_ascii=False) + json.dumps(d.get("pros", []) + d.get("cons", []), ensure_ascii=False)
    if re.search(r"R\$\s?\d", blob): err.append("valor em reais no texto (nunca preço exato; a faixa é escrita pelo componente)")
    if re.search(r"ver pre[çc]o", blob, re.I): err.append("não use 'Ver preço na Amazon'")
    for u in d.get("images", []):
        ok, out = head_ok(u)
        if not ok: err.append(f"imagem ruim: {u} {out}")
    if d.get("novo"):
        for k in ("asin", "name", "brand", "category", "subcategory", "description", "short_description"):
            if not d.get(k): err.append(f"novo: faltou {k}")
        if d.get("asin") and not re.fullmatch(r"[A-Z0-9]{10}", d["asin"]): err.append("asin inválido")
        if d.get("images") and d.get("image_url") != d["images"][0]: err.append("image_url deve ser images[0]")
    return err, w

def q(s): return str(s).replace("'", "''")

def price_num(v):
    if v is None or v == "": return "NULL"
    if isinstance(v, (int, float)): return f"{float(v):.2f}"
    n = re.sub(r"[^\d,]", "", str(v)).replace(",", ".")
    try: return f"{float(n):.2f}"
    except ValueError: return "NULL"

def main():
    d = json.load(open(sys.argv[1], encoding="utf8"))
    err, w = check(d)
    if err:
        print("ERROS:\n- " + "\n- ".join(err)); sys.exit(1)
    d["review"].setdefault("atualizado_em", datetime.date.today().isoformat())
    slug = d["slug"]
    rj = json.dumps(d["review"], ensure_ascii=False, separators=(",", ":"))
    pj = json.dumps(d["pros"], ensure_ascii=False, separators=(",", ":"))
    cj = json.dumps(d["cons"], ensure_ascii=False, separators=(",", ":"))
    ij = json.dumps(d["images"][:8], ensure_ascii=False, separators=(",", ":"))
    if d.get("novo"):
        asin = d["asin"]
        sql = ("insert into public.products (id, slug, name, brand, asin, affiliate_network, affiliate_url, image_url, images, short_description, description, pros, cons, review, category_id, subcategory, price, featured, active, sort_order)\n"
               f"select gen_random_uuid(), '{q(slug)}', '{q(d['name'])}', '{q(d['brand'])}', '{asin}', 'amazon', "
               f"'https://www.amazon.com.br/dp/{asin}/?tag={q(TAG)}', '{q(d['images'][0])}', '{q(ij)}'::jsonb, "
               f"'{q(d['short_description'])}', '{q(d['description'])}', $p${pj}$p$::jsonb, $c${cj}$c$::jsonb, $r${rj}$r$::jsonb, "
               f"(select id from public.product_categories where slug='{q(d['category'])}'), '{q(d['subcategory'])}', {price_num(d.get('price'))}, false, true, "
               f"(select coalesce(max(sort_order),0)+10 from public.products)\n"
               f"where not exists (select 1 from public.products where slug='{q(slug)}' or asin='{asin}') returning slug;\n")
        open(f"{slug}.insert.sql", "w", encoding="utf8").write(sql)
        print(f"OK novo {slug}: {w} palavras -> {slug}.insert.sql")
    else:
        full = json.dumps({"review": d["review"], "pros": d["pros"], "cons": d["cons"], "images": d["images"][:8],
                           "short_description": d.get("short_description")}, ensure_ascii=False, separators=(",", ":"))
        assert "$stg$" not in full
        h = hashlib.md5(full.encode()).hexdigest()
        stg = f"insert into public._tmp_post_staging (k, data) values ('review:{q(slug)}', $stg${full}$stg$) on conflict (k) do update set data = excluded.data;\n"
        upd = (f"update public.products p set review = (s.data::jsonb)->'review', pros = (s.data::jsonb)->'pros', cons = (s.data::jsonb)->'cons', "
               f"images = (s.data::jsonb)->'images', image_url = (s.data::jsonb)->'images'->>0, "
               f"short_description = coalesce((s.data::jsonb)->>'short_description', p.short_description), updated_at = now() "
               f"from public._tmp_post_staging s where s.k = 'review:{q(slug)}' and p.slug = '{q(slug)}' and md5(s.data) = '{h}' returning p.slug;\n")
        open(f"{slug}.stg.sql", "w", encoding="utf8").write(stg); open(f"{slug}.upd.sql", "w", encoding="utf8").write(upd)
        print(f"OK existente {slug}: {w} palavras -> {slug}.stg.sql + {slug}.upd.sql")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    main()
