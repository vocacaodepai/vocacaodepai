#!/usr/bin/env python3
"""news_gen.py — notícia curta (kind='noticia'), série "Mercado do pai" por padrão (doc 10 §4.4; CLAUDE.md §6 fim).
Uso: python3 scripts/rotina/news_gen.py arquivo.json [--out DIR] [--slugs slugs.txt] [--sem-prazo]
JSON: {slug, title, subtitle, excerpt, seo_title, seo_description, cover, cover_alt,
       fonte: {url, veiculo, data: "AAAA-MM-DD", titulo?},
       o_que_aconteceu: ["1-2 parágrafos; cite a fonte com [veículo](url) e a data"],
       o_que_muda: ["1-2 parágrafos"], na_pratica: ["3 a 5 itens"], o_que_acompanhar: ["1 parágrafo"],
       continue_lendo: [{"title": "...", "href": "/post/..."}, ...],   # 3+ (ferramentas e artigos do blog)
       faq: [3 a 6 itens {question, answer}], serie?: "mercado-do-pai", tags?: ["fase-todas"]}
Regras: categoria noticias + tags serie:<serie> e fase-todas; 350-600 palavras; fonte datada <= 48 h com link externo
no 1º ou 2º parágrafo; >= 5 links internos distintos e reais; faq 3-6; sem semáforo, sem quiz; nunca "R$" (percentuais e ordens
de grandeza); nunca recomendação de investimento específico. Gera <slug>.insert.sql (+ tags/post_tags). Nunca DROP/DELETE."""
import datetime as dt
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import helpers as H  # noqa: E402

INVEST_RE = re.compile(r"\b(compre|venda|invista)\b[^.]{0,60}\b(a[çc][õo]es?|bitcoin|cripto|fundo|cdb|tesouro)\b", re.I)


def build(d):
    f = d["fonte"]
    ac = list(d["o_que_aconteceu"])
    link_md = f"[{f['veiculo']}]({f['url']})"
    if f["url"] not in " ".join(ac[:2]):
        try:
            data_br = dt.date.fromisoformat(f["data"]).strftime("%d/%m/%Y")
        except ValueError:
            data_br = f["data"]
        ac[0] = ac[0].rstrip() + f" Fonte: {link_md}, {data_br}."
    body = [H.P(x) for x in ac]
    body.append(H.H2("O que muda para o pai"))
    body += [H.P(x) for x in d["o_que_muda"]]
    body.append(H.H2("Na prática"))
    body.append(H.UL(list(d["na_pratica"])))
    body.append(H.H2("O que acompanhar"))
    body += [H.P(x) for x in d["o_que_acompanhar"]]
    links = [(x["title"], x["href"]) if isinstance(x, dict) else tuple(x) for x in d["continue_lendo"]]
    body.append(H.CONTINUE_LENDO(links))
    return H.DOC(body)


def main(argv):
    opt = lambda k: argv[argv.index(k) + 1] if k in argv and argv.index(k) + 1 < len(argv) else None
    args = [x for x in argv if not x.startswith("--") and x not in (opt("--out"), opt("--slugs"))]
    if not args:
        print(__doc__); sys.exit(2)
    d = json.load(open(args[0], encoding="utf8"))
    err = []
    H.check_meta(d, err)
    f = d.get("fonte") or {}
    if not (f.get("url", "").startswith("http") and f.get("veiculo") and f.get("data")):
        err.append("fonte {url, veiculo, data} obrigatória")
    else:
        try:
            age = dt.datetime.now() - dt.datetime.fromisoformat(f["data"])
            if age > dt.timedelta(hours=48) and "--sem-prazo" not in argv:
                err.append(f"fonte datada de {f['data']}: mais de 48 h (não é notícia; use --sem-prazo só em teste)")
        except ValueError:
            err.append("fonte.data em AAAA-MM-DD (ou AAAA-MM-DDTHH:MM)")
    for k in ("o_que_aconteceu", "o_que_muda", "o_que_acompanhar"):
        if not d.get(k):
            err.append(f"faltou {k}")
    if not 3 <= len(d.get("na_pratica") or []) <= 5:
        err.append("na_pratica: 3 a 5 itens")
    if len(d.get("continue_lendo") or []) < 3:
        err.append("continue_lendo: pelo menos 3 links")
    if d.get("quiz"):
        err.append("notícia não leva quiz")
    if err:
        H.report_errors(err)
    u = H.universe_from_file(opt("--slugs")) if opt("--slugs") else H.universe()
    doc = build(d)
    w = H.words(doc)
    if not 350 <= w <= 600:
        err.append(f"{w} palavras (notícia: 350 a 600)")
    H.check_headings(doc, err)
    if any(n.get("type") == "callout" for n in H.nodes(doc)):
        err.append("notícia não leva semáforo")
    if f.get("url") not in H.external_hrefs(doc):
        err.append("a fonte precisa estar linkada no texto")
    H.check_links(doc, u, err, 5)
    H.check_cover_inline(doc, d.get("cover"), err)
    H.check_text(doc, err)
    if INVEST_RE.search(H.text_of(doc)):
        err.append("recomendação de investimento específico (nunca; conteúdo educativo)")
    faq, _ = H.check_faq_quiz(d, err, faq_min=3)  # o validador exige faq (3-6) também na notícia
    H.report_errors(err)
    serie = d.get("serie", "mercado-do-pai")
    tags = list(dict.fromkeys([f"serie:{serie}"] + (d.get("tags") or ["fase-todas"])))
    if not any(t.startswith("fase-") for t in tags):
        tags.append("fase-todas")
    names = {"serie:mercado-do-pai": "Mercado do pai", "serie:jogada-do-dia": "Jogada do dia"}
    cols = ("slug, title, subtitle, excerpt, body, cover_image_url, cover_image_alt, category_id, author_id, kind, faq, quiz, "
            "status, publish_at, seo_title, seo_description")
    vals = [f"'{H.q(d['slug'])}'", f"'{H.q(d['title'])}'", f"'{H.q(d['subtitle'].strip())}'", f"'{H.q(d['excerpt'].strip())}'",
            H.dollar("body", doc), f"'{H.q(d['cover'])}'", f"'{H.q(d['cover_alt'])}'", H.category_sql("noticias"), H.AUTHOR_SQL,
            "'noticia'", H.dollar("faq", faq), "'[]'::jsonb", "'published'", "now()",
            f"'{H.q((d.get('seo_title') or d['title']).strip())}'", f"'{H.q(d['seo_description'].strip())}'"]
    sql = (f"-- {d['title']} (noticia, série {serie}) — gerado por scripts/rotina/news_gen.py\n"
           f"insert into public.posts ({cols})\nvalues (\n  " + ",\n  ".join(vals) + "\n)\non conflict (slug) do nothing;\n"
           + H.tags_sql(d["slug"], tags, names))
    out = opt("--out") or "."
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, f"{d['slug']}.insert.sql")
    open(path, "w", encoding="utf8").write(sql)
    print(f"OK {d['slug']} (noticia): {w} palavras, {len(set(H.internal_hrefs(doc)))} links internos distintos, tags {tags} -> {path}")
    print(f"  universo de links: {u['source']}")


if __name__ == "__main__":
    main(sys.argv[1:])
