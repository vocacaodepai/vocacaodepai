#!/usr/bin/env python3
"""cmp_gen.py — Pai Indica COMPARATIVO (kind='comparativo') ou LISTA (kind='lista'): valida o JSON e gera <slug>.insert.sql.
Uso: python3 scripts/rotina/cmp_gen.py arquivo.json [--out DIR] [--slugs slugs.txt] [--offline] [--sem-capa]
Esquema do JSON: BRIEF_COMPARATIVO_PAI.md. Marcação: **negrito**, [texto](/post/slug), {FAIXA:slug} (o site escreve a faixa).
Preenche kind, comparison (doc 02 §5.4: criteria/products/table/winner_slug/verdict_by_profile/how_we_evaluated),
product_category, product_subcategory e product_score (= score do vencedor). Botões "Comprar <produto> agora na Amazon"
com href {AMAZON:slug} (resolvido pelo site com products.affiliate_url). Nunca escreve no banco; nunca DROP/DELETE."""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import helpers as H  # noqa: E402

ROLES_CMP = ["vencedor", "custo-beneficio", "premium", "alternativa", "nao-indicamos"]
ROLES_LISTA = ["escolha-do-editor", "melhor-custo-beneficio", "melhor-premium", "melhor-barato", "melhor-para-iniciantes",
               "melhor-compacto", "melhor-para-familias", "melhor-silencioso", "melhor-desempenho", "sem-selo"]
NOTA_FAIXA = ("As faixas de preço vêm de uma pesquisa feita na internet como um todo, em várias lojas online, e não do "
              "preço da Amazon. O valor do dia pode ser diferente: confira antes de comprar.")
PI_PROIBIDOS = ["ver preço", "cupom", "frete grátis", "menor preço", "% de desconto", "em promoção", "testamos", "usamos por", "na nossa casa"]


def taxonomia():
    tax = json.load(open(os.path.join(H.ROOT, "scripts", "lib", "taxonomia.json"), encoding="utf8"))
    pesos = json.load(open(os.path.join(H.ROOT, "scripts", "lib", "criterios.json"), encoding="utf8"))
    cats = {c["slug"] for c in tax.get("categories", [])}
    subs = {}
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in cats and isinstance(v, list) and v and isinstance(v[0], dict) and "slug" in v[0]:
                    subs[k] = {x["slug"] for x in v}
                walk(v)
        elif isinstance(o, list):
            for x in o:
                walk(x)
    walk(tax)
    return cats, subs, pesos


def weighted(weights, scores):
    return round(sum(w * s for w, s in zip(weights, scores)) / sum(weights) + 1e-9, 1)


def head_ok(url):
    o = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code} %{size_download}", "-m", "30", url],
                       capture_output=True).stdout.decode().split()
    return len(o) == 2 and o[0] == "200" and int(o[1]) > 15000, o


def check_pi_common(d, u, err, offline, sem_capa):
    """Regras comuns ao comparativo, lista e review única (CLAUDE.md §7; doc 04 §11)."""
    cats, subs, pesos = taxonomia()
    pc, ps = d.get("product_category"), d.get("product_subcategory")
    if pc not in cats:
        err.append(f"product_category inválida: {pc} (src/lib/pai-indica/taxonomia.ts)")
    elif subs.get(pc) and ps not in subs[pc]:
        err.append(f"product_subcategory '{ps}' não pertence a {pc}")
    cv = d.get("cover_image_url", "")
    if cv != f"/images/covers/{d['slug']}.jpg":
        err.append(f"cover_image_url deve ser /images/covers/{d['slug']}.jpg (cover_cmp.py)")
    elif not sem_capa and not os.path.exists(os.path.join(H.ROOT, "public", cv.lstrip("/"))):
        err.append(f"capa composta não encontrada em public{cv} (rode cover_cmp.py)")
    d.setdefault("cover", cv)
    d.setdefault("seo_description", d.get("excerpt", ""))
    H.check_meta(d, err)
    return pesos


def check_links_pi(doc, u, err, prod_slugs):
    distinct = H.check_links(doc, u, err, 8)
    if sum(1 for h in distinct if h.startswith("/post/")) < 4:
        err.append("mínimo 4 links para artigos do blog (/post/)")
    for s in prod_slugs:
        if f"/loja/{s}" not in distinct:
            err.append(f"linke a página da loja: /loja/{s}")
    return distinct


def check_products_exist(slugs, u, err):
    missing = [s for s in slugs if s not in u["loja"]]
    for s in missing:
        err.append(f"produto fora da Loja do Pai (products ativo): {s} — crie antes pelo BRIEF_REVIEW_LOJA_PAI.md")
    if H.has_db() and not missing:
        try:
            rows = H.get("/products?select=slug,review,price_min,price_max&active=eq.true&slug=in.(" + ",".join(slugs) + ")")
            for r in rows:
                if not isinstance(r.get("review"), dict):
                    print(f"AVISO: {r['slug']} ainda não tem a review longa na loja (review_gen.py)", file=sys.stderr)
                if not (r.get("price_min") and r.get("price_max")):
                    print(f"AVISO: {r['slug']} sem faixa de preço pesquisada (price_range.py)", file=sys.stderr)
        except Exception as e:
            print(f"AVISO: não consegui conferir products no banco: {e}", file=sys.stderr)


TESTE_FISICO_RE = re.compile(r"(sem|n[ãa]o (houve|fizemos|realizamos|foi feito)) teste f[ií]sico", re.I)


def check_pi_text(doc, d, err):
    H.check_text(doc, err, extra=json.dumps(d.get("faq", []), ensure_ascii=False))
    if not TESTE_FISICO_RE.search(" ".join(d.get("como_avaliamos") or [])):
        err.append('"Como avaliamos" precisa dizer que não houve teste físico (ex.: "Não fizemos teste físico.")')
    t = H.fold(H.text_of(doc) + " " + d.get("title", "") + " " + (d.get("subtitle") or ""))
    for p in PI_PROIBIDOS:
        if H.fold(p) in t:
            err.append(f"expressão vedada no Pai Indica: \"{p}\"")
    for n in H.nodes(doc):
        if n.get("type") == "text" and any(m.get("attrs", {}).get("class") == "btn-comprar" for m in n.get("marks", [])):
            if not re.fullmatch(r"Comprar (.+ )?agora na Amazon", n["text"]):
                err.append(f"botão fora do padrão: {n['text']}")


def post_insert_sql(d, doc, kind, review, comparison, score, faq, quiz, tags):
    cols = ("slug, title, subtitle, excerpt, body, cover_image_url, cover_image_alt, category_id, author_id, kind, review, "
            "comparison, product_category, product_subcategory, product_score, faq, quiz, status, publish_at, seo_title, seo_description")
    vals = [f"'{H.q(d['slug'])}'", f"'{H.q(d['title'])}'", f"'{H.q(d['subtitle'].strip())}'", f"'{H.q(d['excerpt'].strip())}'",
            H.dollar("body", doc), f"'{H.q(d['cover_image_url'])}'", f"'{H.q(d['cover_alt'])}'", H.category_sql("pai-indica"),
            H.AUTHOR_SQL, f"'{kind}'", H.dollar("rev", review) if review else "null", H.dollar("cmp", comparison) if comparison else "null",
            f"'{H.q(d['product_category'])}'", f"'{H.q(d['product_subcategory'])}'", f"{score:.1f}", H.dollar("faq", faq),
            H.dollar("quiz", quiz), "'published'", "now()", f"'{H.q((d.get('seo_title') or d['title']).strip())}'",
            f"'{H.q(d['seo_description'].strip())}'"]
    return (f"-- {d['title']} ({kind}, Pai Indica) — gerado por scripts/rotina/{os.path.basename(sys.argv[0])}\n"
            f"insert into public.posts ({cols})\nvalues (\n  " + ",\n  ".join(vals) + "\n)\non conflict (slug) do nothing;\n"
            + H.tags_sql(d["slug"], tags))


def build(d, err, prods):
    S = lambda lst: list(lst or [])
    body = [H.P(x) for x in d["intro"]]
    body += [H.H2("Em 3 pontos"), H.OL(S(d["em_3_pontos"]))]
    body.append(H.FOTOS([{"slug": p["slug"], "name": p["nome"], "src": p.get("foto", "")} for p in prods]))
    kind = d.get("kind", "comparativo")
    tab = d.get("tabela")
    if kind == "comparativo" or tab:
        body.append(H.H2(f"Os {len(prods)} modelos que comparamos"))
        body.append(H.P(tab.get("intro") or "Colocamos os principais pontos lado a lado para facilitar a decisão."))
        rows = []
        for i, r in enumerate(tab["linhas"]):
            rows.append([str(c).replace("{FAIXA}", f"{{FAIXA:{prods[i]['slug']}}}") if i < len(prods) else str(c) for c in r])
        body.append(H.TABLE(tab["colunas"], rows))
    elif d.get("como_escolhemos"):
        body.append(H.H2("Como escolhemos"))
        body += [H.P(x) for x in d["como_escolhemos"]]
    for p in prods:
        body.append(H.H2(p["titulo"]))
        if p.get("foto"):
            body.append(H.IMG(p["foto"], f"Foto oficial do produto: {p['nome']}"))
            body.append({"type": "paragraph", "content": [{"type": "text", "text": f"Foto oficial do produto: {p['nome']}", "marks": [{"type": "italic"}]}]})
        body.append(H.BTN(p["slug"], p["nome"]))
        body += [H.P(x) for x in p["paragrafos"]]
        body.append(H.P("**Pontos fortes**")); body.append(H.UL(S(p["pros"])))
        body.append(H.P("**Pontos de atenção**")); body.append(H.UL(S(p["contras"])))
        body.append(H.P(f"Ficha completa, faixa de preço pesquisada e a review longa: [{p['nome']} na Loja do Pai](/loja/{p['slug']})."))
    if kind == "lista" and d.get("nao_recomendamos"):
        body.append(H.H2("O que não recomendamos (e por quê)"))
        body += [H.P(x) for x in d["nao_recomendamos"]]
    body.append(H.H2("Por que isso importa antes de comprar"))
    body += [H.P(x) for x in d["por_que_importa"]]
    body.append(H.H2("Variação de preço"))
    body += [H.P(x) for x in d["variacao_preco"]]
    body.append(H.TABLE(["Modelo", "Faixa de preço pesquisada na internet"], [[p["nome"], f"{{FAIXA:{p['slug']}}}"] for p in prods]))
    body.append(H.P(NOTA_FAIXA))
    for p in prods:
        body.append(H.BTN(p["slug"], p["nome"]))
    body.append(H.H2("Qual comprar"))
    if d.get("verdict_by_profile"):
        body.append(H.UL([f"**{v['profile']}:** {next((p['nome'] for p in prods if p['slug'] == v['pick_slug']), v['pick_slug'])}. {v['reason']}"
                          for v in d["verdict_by_profile"]]))
    body += [H.P(x) for x in d["qual_comprar"]]
    win = next((p for p in prods if p["slug"] == d.get("winner_slug")), prods[0])
    body.append(H.BTN(win["slug"], win["nome"]))
    body.append(H.H2("Como avaliamos"))
    body += [H.P(x) for x in d["como_avaliamos"]]
    body.append(H.H2("Outros comparativos e reviews"))
    body += [H.P(x) for x in d["outros"]]
    return H.DOC(body)


def main(argv):
    offline, sem_capa = "--offline" in argv, "--sem-capa" in argv
    opt = lambda k: argv[argv.index(k) + 1] if k in argv and argv.index(k) + 1 < len(argv) else None
    args = [x for x in argv if not x.startswith("--") and x not in (opt("--out"), opt("--slugs"))]
    if not args:
        print(__doc__); sys.exit(2)
    d = json.load(open(args[0], encoding="utf8"))
    err = []
    kind = d.get("kind", "comparativo")
    if kind not in ("comparativo", "lista"):
        err.append("kind deve ser 'comparativo' ou 'lista' (review única: rev_art_gen.py)")
    prods = d.get("produtos", [])
    lo, hi = (2, 3) if kind == "comparativo" else (3, 7)
    if not lo <= len(prods) <= hi:
        err.append(f"{kind}: {lo} a {hi} produtos")
    u = H.universe_from_file(opt("--slugs")) if opt("--slugs") else H.universe()
    pesos = check_pi_common(d, u, err, offline, sem_capa)
    crit = d.get("criteria") or []
    ref = pesos.get(d.get("product_category"), [])
    if len(crit) != 5 or sum(c.get("weight", 0) for c in crit) != 100:
        err.append("criteria: exatamente 5 itens {name, weight}, pesos somando 100")
    elif ref and [c["weight"] for c in crit] != [c["weight"] for c in ref]:
        err.append(f"pesos dos critérios devem ser os da categoria {d['product_category']}: {[c['weight'] for c in ref]}")
    roles = ROLES_CMP if kind == "comparativo" else ROLES_LISTA
    seen = set()
    for p in prods:
        for k in ("slug", "nome", "role", "score", "criteria_scores", "titulo", "paragrafos", "pros", "contras"):
            if k not in p:
                err.append(f"produto {p.get('slug', '?')}: faltou {k}")
        if p.get("role") not in roles:
            err.append(f"role inválido em {p.get('slug')}: {p.get('role')} (use {', '.join(roles)})")
        elif kind == "lista" and p["role"] != "sem-selo":
            if p["role"] in seen:
                err.append(f"selo repetido na lista: {p['role']}")
            seen.add(p["role"])
        if len(crit) == 5 and len(p.get("criteria_scores") or []) == 5:
            calc = weighted([c["weight"] for c in crit], p["criteria_scores"])
            if abs(calc - float(p["score"])) > 0.15:
                err.append(f"{p['slug']}: score {p['score']} ≠ média ponderada {calc}")
        if not 3 <= len(p.get("pros") or []) <= 6 or not 3 <= len(p.get("contras") or []) <= 6:
            err.append(f"{p.get('slug')}: pros e contras com 3 a 6 itens")
    if kind == "comparativo" and not d.get("tabela"):
        err.append("tabela obrigatória no comparativo")
    if d.get("tabela") and len(d["tabela"].get("linhas", [])) != len(prods):
        err.append("tabela.linhas deve ter uma linha por produto, na mesma ordem")
    win = d.get("winner_slug")
    if win not in {p["slug"] for p in prods}:
        err.append("winner_slug precisa ser um dos produtos")
    if len(d.get("verdict_by_profile") or []) < 2:
        err.append("verdict_by_profile: pelo menos 2 perfis {profile, pick_slug, reason}")
    for v in d.get("verdict_by_profile") or []:
        if v.get("pick_slug") not in {p["slug"] for p in prods}:
            err.append(f"verdict_by_profile.pick_slug desconhecido: {v.get('pick_slug')}")
    for k in ("intro", "em_3_pontos", "por_que_importa", "variacao_preco", "qual_comprar", "como_avaliamos", "outros"):
        if not d.get(k):
            err.append(f"faltou {k}")
    if err:
        H.report_errors(err)
    check_products_exist([p["slug"] for p in prods], u, err)
    doc = build(d, err, prods)
    w = H.words(doc)
    if w < 1100:
        err.append(f"curto: {w} palavras (mín. 1100; mire 1500-2000)")
    H.check_headings(doc, err)
    H.check_semaforo(doc, err, required=False)
    distinct = check_links_pi(doc, u, err, [p["slug"] for p in prods])
    for m in re.finditer(r"\{FAIXA:([a-z0-9-]+)\}", H.text_of(doc)):
        if m.group(1) not in {p["slug"] for p in prods}:
            err.append(f"{{FAIXA:{m.group(1)}}} não é um dos produtos comparados")
    check_pi_text(doc, d, err)
    H.check_cover_inline(doc, d["cover_image_url"], err)
    faq, quiz = H.check_faq_quiz(d, err, faq_min=4)
    if not offline:
        for p in prods:
            if p.get("foto"):
                ok, o = head_ok(p["foto"])
                if not ok:
                    err.append(f"foto oficial ruim (HTTP 200 e > 15 KB): {p['foto']} {o}")
                if not p["foto"].startswith("https://m.media-amazon.com/"):
                    err.append(f"foto não é da Amazon (m.media-amazon.com): {p['foto']}")
    H.report_errors(err)
    winner = next(p for p in prods if p["slug"] == win)
    comparison = {
        "criteria": [{"name": c["name"], "weight": c["weight"]} for c in crit],
        "products": [{"product_slug": p["slug"], "name": p["nome"], "role": p["role"], "score": float(p["score"]),
                      "criteria_scores": [float(x) for x in p["criteria_scores"]], "one_liner": p.get("one_liner", "")} for p in prods],
        "winner_slug": win,
        "verdict_by_profile": d.get("verdict_by_profile") or [],
        "how_we_evaluated": " ".join(d["como_avaliamos"]),
    }
    if d.get("tabela"):
        comparison["table"] = {"columns": d["tabela"]["colunas"],
                               "rows": [[str(c).replace("{FAIXA}", f"{{FAIXA:{prods[i]['slug']}}}") for c in r] for i, r in enumerate(d["tabela"]["linhas"])]}
    tags = list(dict.fromkeys(d.get("tags") or []))
    out = opt("--out") or "."
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, f"{d['slug']}.insert.sql")
    open(path, "w", encoding="utf8").write(post_insert_sql(d, doc, kind, None, comparison, float(winner["score"]), faq, quiz, tags))
    print(f"OK {d['slug']} ({kind}): {w} palavras, {len(distinct)} links internos distintos, product_score {float(winner['score']):.1f} -> {path}")
    print(f"  universo de links: {u['source']}")


if __name__ == "__main__":
    main(sys.argv[1:])
