#!/usr/bin/env python3
"""rev_art_gen.py — Pai Indica REVIEW ÚNICA (kind='review', 1 produto): valida o JSON e gera <slug>.insert.sql.
Uso: python3 scripts/rotina/rev_art_gen.py arquivo.json [--out DIR] [--slugs slugs.txt] [--offline] [--sem-capa]
Esquema do JSON: BRIEF_REVIEW_UNICA_PAI.md. Preenche kind='review', review (doc 02 §5.3: product_slug, score,
criteria[5]{name,weight,score,comment}, pros, cons, ideal_for, not_ideal_for, verdict, how_we_evaluated, sources,
other_buyers), product_category/product_subcategory e product_score = score. O produto precisa existir na Loja do Pai
(ativo) e ter a review longa (products.review, review_gen.py). Nunca escreve no banco; nunca DROP/DELETE."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import helpers as H  # noqa: E402
from cmp_gen import (NOTA_FAIXA, check_links_pi, check_pi_common, check_pi_text, check_products_exist, head_ok,  # noqa: E402
                     post_insert_sql, weighted)


def build(d, prod, crit, nota):
    nome, slug = prod["nome"], prod["slug"]
    BUY = lambda: H.BTN(slug, nome)
    fmt = lambda x: f"{float(x):.1f}".replace(".", ",")
    body = [H.P(x) for x in d["intro"]]
    body += [H.H2("Em 3 pontos"), H.OL(list(d["em_3_pontos"]))]
    body.append(H.FOTOS([{"slug": slug, "name": nome, "src": prod.get("foto", "")}]))
    body.append(H.H2(f"Nossa nota para o {nome}: {fmt(nota)} de 10"))
    body.append(H.P(f"**Ideal para:** {d['ideal_para']}"))
    body.append(H.P(f"**Não é para:** {d['nao_ideal_para']}"))
    body.append(H.TABLE(["Critério", "Peso", "Nota", "Comentário"],
                        [[c["nome"], f"{c['peso']}%", fmt(c["nota"]), c.get("comentario", "")] for c in crit]))
    body.append(BUY())
    body.append(H.H2("Ficha técnica"))
    body.append(H.TABLE(["Característica", "Detalhe"], [[x.split(":", 1)[0].strip(), x.split(":", 1)[1].strip()] for x in d["ficha"] if ":" in x]))
    for i, sec in enumerate(d["secoes"]):
        body.append(H.H2(sec["titulo"]))
        if i == 0 and prod.get("foto"):
            body.append(H.IMG(prod["foto"], f"Foto oficial do produto: {nome}"))
            body.append({"type": "paragraph", "content": [{"type": "text", "text": f"Foto oficial do produto: {nome}", "marks": [{"type": "italic"}]}]})
        body += [H.P(x) for x in sec["paragrafos"]]
        if sec.get("cta"):
            body.append(BUY())
    body.append(H.H2("Pontos fortes e pontos de atenção"))
    body.append(H.P("**Pontos fortes**")); body.append(H.UL(list(d["pros"])))
    body.append(H.P("**Pontos de atenção**")); body.append(H.UL(list(d["contras"])))
    oc = d["outros_compradores"]
    body.append(H.H2("O que dizem outros compradores"))
    body.append(H.P(oc["intro"]))
    if not oc.get("sem_opiniao_externa"):
        body.append(H.P("**O que mais elogiam**")); body.append(H.UL(list(oc["elogios"])))
        body.append(H.P("**O que mais reclamam**")); body.append(H.UL(list(oc["reclamacoes"])))
        body.append(H.P("Fontes consultadas, todas fora da Amazon: " + ", ".join(oc["fontes"]) + ". Resumimos os padrões que se repetem; não copiamos textos nem citamos pessoas."))
    else:
        body.append(H.P("Não encontramos opiniões suficientes fora da Amazon para este produto; a análise se apoia na ficha técnica, no manual e no anúncio."))
    body.append(H.H2("Variação de preço"))
    body += [H.P(x) for x in d["variacao_preco"]]
    body.append(H.TABLE(["Modelo", "Faixa de preço pesquisada na internet"], [[nome, f"{{FAIXA:{slug}}}"]]))
    body.append(H.P(NOTA_FAIXA))
    body.append(BUY())
    body.append(H.H2("Para quem vale a pena (e para quem não)"))
    body += [H.P(x) for x in d["para_quem"]]
    body.append(H.P(f"Ficha completa, galeria oficial, faixa de preço pesquisada e a review longa: [{nome} na Loja do Pai](/loja/{slug})."))
    body.append(BUY())
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
    prod = d.get("produto") or {}
    if not prod.get("slug") or not prod.get("nome"):
        err.append("produto {slug, nome, foto} obrigatório")
    u = H.universe_from_file(opt("--slugs")) if opt("--slugs") else H.universe()
    pesos = check_pi_common(d, u, err, offline, sem_capa)
    crit = d.get("criterios") or []
    ref = pesos.get(d.get("product_category"), [])
    if len(crit) != 5 or any(k not in c for c in crit for k in ("nome", "peso", "nota")):
        err.append("criterios: exatamente 5 itens {nome, peso, nota, comentario}")
    elif sum(c["peso"] for c in crit) != 100:
        err.append("pesos dos critérios somam 100")
    elif ref and [c["peso"] for c in crit] != [c["weight"] for c in ref]:
        err.append(f"pesos dos critérios devem ser os da categoria {d['product_category']}: {[c['weight'] for c in ref]}")
    nota = float(d.get("nota", -1))
    if not 0 <= nota <= 10:
        err.append("nota fora de 0 a 10")
    if len(crit) == 5 and abs(weighted([c["peso"] for c in crit], [c["nota"] for c in crit]) - nota) > 0.15:
        err.append(f"nota {nota} ≠ média ponderada {weighted([c['peso'] for c in crit], [c['nota'] for c in crit])}")
    secs = d.get("secoes") or []
    if len(secs) < 4 or sum(1 for s in secs if s.get("cta")) < 3:
        err.append("mínimo 4 seções, pelo menos 3 com cta: true")
    if len(d.get("ficha") or []) < 5:
        err.append("ficha: mínimo 5 linhas 'Campo: valor'")
    if not 3 <= len(d.get("pros") or []) <= 6 or not 3 <= len(d.get("contras") or []) <= 6:
        err.append("pros e contras com 3 a 6 itens")
    oc = d.get("outros_compradores") or {}
    if not oc.get("intro"):
        err.append("outros_compradores.intro obrigatório")
    if not oc.get("sem_opiniao_externa"):
        if len(oc.get("elogios") or []) < 3 or len(oc.get("reclamacoes") or []) < 2:
            err.append("outros_compradores: mínimo 3 elogios e 2 reclamações (ou sem_opiniao_externa: true)")
        if not oc.get("fontes"):
            err.append("outros_compradores.fontes: liste os sites consultados (fora da Amazon)")
    for k in ("intro", "em_3_pontos", "ideal_para", "nao_ideal_para", "veredito", "variacao_preco", "para_quem", "como_avaliamos", "outros"):
        if not d.get(k):
            err.append(f"faltou {k}")
    if err:
        H.report_errors(err)
    check_products_exist([prod["slug"]], u, err)
    doc = build(d, prod, crit, nota)
    w = H.words(doc)
    if w < 1100:
        err.append(f"curto: {w} palavras (mín. 1100; mire 1300-1800)")
    H.check_headings(doc, err)
    H.check_semaforo(doc, err, required=False)
    distinct = check_links_pi(doc, u, err, [prod["slug"]])
    for m in re.finditer(r"\{FAIXA:([a-z0-9-]+)\}", H.text_of(doc)):
        if m.group(1) != prod["slug"]:
            err.append(f"{{FAIXA:{m.group(1)}}} não é o produto da review")
    check_pi_text(doc, d, err)
    H.check_cover_inline(doc, d["cover_image_url"], err)
    faq, quiz = H.check_faq_quiz(d, err, faq_min=4)
    if not offline and prod.get("foto"):
        ok, o = head_ok(prod["foto"])
        if not ok:
            err.append(f"foto oficial ruim (HTTP 200 e > 15 KB): {prod['foto']} {o}")
        if not prod["foto"].startswith("https://m.media-amazon.com/"):
            err.append(f"foto não é da Amazon (m.media-amazon.com): {prod['foto']}")
    H.report_errors(err)
    sources = list(dict.fromkeys((d.get("fontes") or ["Amazon Brasil (anúncio)", "site do fabricante (ficha e manual)"]) + list(oc.get("fontes") or [])))
    review = {
        "product_slug": prod["slug"], "score": nota,
        "criteria": [{"name": c["nome"], "weight": c["peso"], "score": float(c["nota"]), "comment": c.get("comentario", "")} for c in crit],
        "pros": list(d["pros"]), "cons": list(d["contras"]),
        "ideal_for": d["ideal_para"], "not_ideal_for": d["nao_ideal_para"], "verdict": d["veredito"],
        "how_we_evaluated": " ".join(d["como_avaliamos"]), "sources": sources,
        "other_buyers": {"intro": oc["intro"], "praises": list(oc.get("elogios") or []), "complaints": list(oc.get("reclamacoes") or []),
                         "sources": list(oc.get("fontes") or []), "none_found": bool(oc.get("sem_opiniao_externa"))},
    }
    if H.has_reais(json.dumps(review, ensure_ascii=False)):
        H.report_errors(["valor em reais dentro do review (nunca)"])
    tags = list(dict.fromkeys(d.get("tags") or []))
    out = opt("--out") or "."
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, f"{d['slug']}.insert.sql")
    open(path, "w", encoding="utf8").write(post_insert_sql(d, doc, "review", review, None, nota, faq, quiz, tags))
    print(f"OK {d['slug']} (review): {w} palavras, {len(distinct)} links internos distintos, product_score {nota:.1f} -> {path}")
    print(f"  universo de links: {u['source']}")


if __name__ == "__main__":
    main(sys.argv[1:])
