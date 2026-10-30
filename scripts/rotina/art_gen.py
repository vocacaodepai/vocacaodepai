#!/usr/bin/env python3
"""art_gen.py — Padrão A do Pai (CLAUDE.md §6; doc 10 §4.2): valida o JSON e gera o SQL.

Uso:
  python3 scripts/rotina/art_gen.py arquivo.json                 -> <slug>.insert.sql (artigo novo, publicado)
  python3 scripts/rotina/art_gen.py --reforma arquivo.json       -> <slug>.stg.sql + <slug>.upd.sql (staging + UPDATE curto com md5)
  opções: --slugs /tmp/rotina-pai/slugs.txt (universo de links; padrão: banco ou seeds)  --out DIR  --known a,b (slugs que vão existir)

O JSON pode trazer o `body` já em Tiptap OU a forma estruturada (abertura, secoes, semaforo, tabela, checklist,
fechamento, continue_lendo), que o gerador monta na ordem do CLAUDE.md §6. Esquema completo: BRIEF_ARTIGO_PAI.md;
exemplo: exemplo_artigo.json. Marcação nos textos: **negrito**, _itálico_, [texto](/post/slug).
Valida: 1200-2200 palavras, >=10 links internos distintos e reais, Semáforo do pai (3 callouts ok/warn/bad com
"Sinal verde/atenção/alerta: ", sem link, alerta com profissional), tabela, checklist (5-6 itens; último fixo),
fechamento sem links + "Continue lendo: " (4-10 links), capa != inline, "R$", termos proibidos, faq/quiz, SEO, tags fase-*.
Nunca escreve no banco; nunca gera DROP/DELETE."""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import helpers as H  # noqa: E402

CATEGORIAS_VETADAS = {"fe-e-virtude", "pai-indica", "noticias", "historias-de-pai"}  # editoriais/do dono ou de outro kind


def build_body(a):
    """Monta o body Tiptap a partir da forma estruturada (ordem do CLAUDE.md §6)."""
    b = [H.P(x) for x in a.get("abertura", [])]
    sem = a.get("semaforo")
    pos_sem = a.get("posicao_semaforo")  # 1-based: depois de qual seção entra o semáforo (padrão: depois de todas)
    secs = a.get("secoes", [])
    for i, s in enumerate(secs, 1):
        b.append(H.H2(s["titulo"]))
        for sub in s.get("subsecoes", []):
            b.append(H.H3(sub["titulo"]))
            b += [H.P(x) for x in sub.get("paragrafos", [])]
        b += [H.P(x) for x in s.get("paragrafos", [])]
        if s.get("lista"):
            b.append((H.OL if s.get("ordenada") else H.UL)(s["lista"]))
        b += [H.P(x) for x in s.get("paragrafos_depois", [])]
        if s.get("imagem"):
            im = s["imagem"]
            b.append(H.IMG(im["src"], im["alt"], im.get("title")))
        if sem and pos_sem == i:
            b += H.SEMAFORO_BLOCO(sem["tema"], sem["ok"], sem.get("atencao") or sem.get("warn"), sem.get("alerta") or sem.get("bad"))
            if sem.get("imagem"):
                b.append(H.IMG(sem["imagem"]["src"], sem["imagem"]["alt"], sem["imagem"].get("title")))
    if sem and not pos_sem:
        b += H.SEMAFORO_BLOCO(sem["tema"], sem["ok"], sem.get("atencao") or sem.get("warn"), sem.get("alerta") or sem.get("bad"))
        if sem.get("imagem"):
            b.append(H.IMG(sem["imagem"]["src"], sem["imagem"]["alt"], sem["imagem"].get("title")))
    if a.get("tabela"):
        t = a["tabela"]
        b.append(H.H2(t["titulo"]))
        if t.get("intro"):
            b.append(H.P(t["intro"]))
        b.append(H.TABLE(t["colunas"], t["linhas"]))
    if a.get("checklist"):
        c = a["checklist"]
        b.append(H.H2(f"Checklist do pai: {c['tema']}"))
        b.append(H.TASKS(c["itens"]))
    if a.get("fechamento"):
        b.append(H.P(a["fechamento"]))
    if a.get("continue_lendo"):
        links = [(x["title"], x["href"]) if isinstance(x, dict) else tuple(x) for x in a["continue_lendo"]]
        b.append(H.CONTINUE_LENDO(links))
    return H.DOC(b)


def check(a, doc, u, reforma=False):
    err = []
    H.check_meta(a, err)
    cat = a.get("category", "")
    if cat not in u["categoria"] and u["categoria"]:
        err.append(f"categoria desconhecida: {cat} (select slug from categories)")
    if cat in CATEGORIAS_VETADAS:
        err.append(f"categoria {cat} não recebe artigo da rotina (Padrão A usa as categorias do blog)")
    if a.get("kind", "artigo") != "artigo":
        err.append("kind precisa ser 'artigo' (notícia usa news_gen.py; Pai Indica usa cmp_gen.py/rev_art_gen.py)")
    w = H.words(doc)
    if not 1200 <= w <= 2200:
        err.append(f"{w} palavras (Padrão A: 1200 a 2200)")
    top = doc["content"]
    # abertura: 2 parágrafos antes do 1º heading
    first_h = next((i for i, n in enumerate(top) if n.get("type") == "heading"), len(top))
    if first_h < 2 or any(n.get("type") != "paragraph" for n in top[:first_h]):
        err.append("abertura precisa de 2 parágrafos antes do primeiro heading")
    if sum(1 for n in top if n.get("type") == "heading" and n["attrs"]["level"] == 2) < 5:
        err.append("mínimo 5 seções com heading nível 2")
    H.check_headings(doc, err)
    H.check_semaforo(doc, err, required=True)
    if not any(n.get("type") == "table" for n in top):
        err.append("falta a tabela (table sob um heading nível 2)")
    tasks = [n for n in top if n.get("type") == "taskList"]
    if len(tasks) != 1:
        err.append("precisa de exatamente 1 checklist (taskList)")
    else:
        items = [H.text_of(x).strip() for x in tasks[0]["content"]]
        idx = top.index(tasks[0])
        h = top[idx - 1] if idx > 0 else None
        if not (h and h.get("type") == "heading" and H.text_of(h).strip().lower().startswith("checklist do pai")):
            err.append('o checklist fica sob o heading "Checklist do pai: <tema>"')
        if not 5 <= len(items) <= 6:
            err.append(f"checklist com {len(items)} itens (5 ou 6)")
        if any(it.endswith(".") for it in items):
            err.append("itens do checklist sem ponto final")
        if items and items[-1] != H.CHECKLIST_ULTIMO:
            err.append(f'último item do checklist deve ser "{H.CHECKLIST_ULTIMO}"')
    # fechamento + continue lendo
    if len(top) < 2 or top[-1].get("type") != "paragraph" or not H.text_of(top[-1]).startswith("Continue lendo: "):
        err.append('o último bloco deve ser o parágrafo "Continue lendo: " com 4 a 10 links')
    else:
        cl = top[-1]
        n_links = len(H.hrefs(cl))
        if not 4 <= n_links <= 10:
            err.append(f'"Continue lendo" com {n_links} links (4 a 10)')
        if not H.text_of(cl).rstrip().endswith("."):
            err.append('"Continue lendo" termina em "."')
        fech = top[-2]
        if fech.get("type") != "paragraph" or H.hrefs(fech) or fech.get("type") == "heading":
            err.append("antes do Continue lendo vem 1 parágrafo de fechamento sem links")
    H.check_links(doc, u, err, 10)
    H.check_cover_inline(doc, a.get("cover") or a.get("cover_image_url"), err)
    H.check_text(doc, err)
    faq, quiz = H.check_faq_quiz(a, err, faq_min=3)
    if not faq and not quiz:
        err.append("pelo menos um de faq ou quiz")
    tags = list(dict.fromkeys(a.get("tags") or []))
    if not any(t.startswith("fase-") for t in tags):
        tags.append("fase-todas")
    bad_tags = [t for t in tags if not re.fullmatch(r"(fase-[a-z-]+|serie:[a-z-]+|[a-z0-9-]+)", t)]
    if bad_tags:
        err.append(f"tags inválidas: {bad_tags}")
    ta = a.get("tema_em_alta")
    if ta:
        if not ta.get("fonte") or not ta.get("data"):
            err.append("tema_em_alta precisa de fonte (url) e data")
        elif ta["fonte"] not in H.external_hrefs(doc):
            err.append("tema_em_alta: a fonte precisa estar linkada no texto")
    return err, w, faq, quiz, tags


def insert_sql(a, doc, faq, quiz, tags):
    cols = ("slug, title, subtitle, excerpt, body, cover_image_url, cover_image_alt, category_id, author_id, kind, "
            "faq, quiz, status, publish_at, seo_title, seo_description")
    vals = [f"'{H.q(a['slug'])}'", f"'{H.q(a['title'])}'", f"'{H.q(a['subtitle'].strip())}'", f"'{H.q(a['excerpt'].strip())}'",
            H.dollar("body", doc), f"'{H.q(a.get('cover') or a['cover_image_url'])}'", f"'{H.q(a['cover_alt'])}'",
            H.category_sql(a["category"]), H.AUTHOR_SQL, "'artigo'", H.dollar("faq", faq), H.dollar("quiz", quiz),
            "'published'", "now()", f"'{H.q((a.get('seo_title') or a['title']).strip())}'", f"'{H.q(a['seo_description'].strip())}'"]
    return (f"-- {a['title']} (artigo, Padrão A do Pai) — gerado por scripts/rotina/art_gen.py\n"
            f"insert into public.posts ({cols})\nvalues (\n  " + ",\n  ".join(vals) + "\n)\non conflict (slug) do nothing;\n"
            + H.tags_sql(a["slug"], tags))


def reforma_sql(a, doc, faq, quiz, tags):
    data = json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
    assert "$stg$" not in data
    h = H.md5(data)
    stg = (f"insert into public._tmp_post_staging (k, data) values ('{H.q(a['slug'])}', $stg${data}$stg$)\n"
           f"  on conflict (k) do update set data = excluded.data;\n")
    sets = [f"body = s.data::jsonb", f"excerpt = '{H.q(a['excerpt'].strip())}'", f"subtitle = '{H.q(a['subtitle'].strip())}'",
            f"faq = {H.dollar('f', faq)}", f"seo_title = '{H.q((a.get('seo_title') or a['title']).strip())}'",
            f"seo_description = '{H.q(a['seo_description'].strip())}'", "reading_time = null", "updated_at = now()"]
    if quiz:
        sets.insert(4, f"quiz = {H.dollar('z', quiz)}")
    upd = (f"update public.posts p set " + ", ".join(sets) +
           f"\n  from public._tmp_post_staging s\n where s.k = '{H.q(a['slug'])}' and p.slug = '{H.q(a['slug'])}' and md5(s.data) = '{h}'\n"
           f" returning p.slug;\n" + H.tags_sql(a["slug"], tags))
    return stg, upd


def main(argv):
    reforma = "--reforma" in argv
    args = [x for x in argv if not x.startswith("--")]
    opt = lambda k: argv[argv.index(k) + 1] if k in argv and argv.index(k) + 1 < len(argv) else None
    if not args:
        print(__doc__); sys.exit(2)
    a = json.load(open(args[0], encoding="utf8"))
    known = [s for s in (opt("--known") or "").split(",") if s]
    u = H.universe_from_file(opt("--slugs")) if opt("--slugs") else H.universe(extra_posts=known)
    for s in known:
        u["post"].add(s)
    doc = a["body"] if isinstance(a.get("body"), dict) else build_body(a)
    err, w, faq, quiz, tags = check(a, doc, u, reforma)
    H.report_errors(err)
    out = opt("--out") or "."
    os.makedirs(out, exist_ok=True)
    slug = a["slug"]
    n_links = len(set(H.internal_hrefs(doc)))
    if reforma:
        stg, upd = reforma_sql(a, doc, faq, quiz, tags)
        open(os.path.join(out, f"{slug}.stg.sql"), "w", encoding="utf8").write(stg)
        open(os.path.join(out, f"{slug}.upd.sql"), "w", encoding="utf8").write(upd)
        print(f"OK reforma {slug}: {w} palavras, {n_links} links internos distintos -> {slug}.stg.sql + {slug}.upd.sql (aplicar nessa ordem)")
    else:
        open(os.path.join(out, f"{slug}.insert.sql"), "w", encoding="utf8").write(insert_sql(a, doc, faq, quiz, tags))
        print(f"OK {slug}: {w} palavras, {n_links} links internos distintos, tags {tags} -> {slug}.insert.sql")
    print(f"  universo de links: {u['source']}")


if __name__ == "__main__":
    main(sys.argv[1:])
