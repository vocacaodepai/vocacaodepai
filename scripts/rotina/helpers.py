#!/usr/bin/env python3
"""helpers.py — base comum dos geradores da rotina do Vocação de Pai (doc 10 §4; CLAUDE.md §6 e §7).

Importado por art_gen.py, cmp_gen.py, rev_art_gen.py e news_gen.py. Também serve de CLI:
  python3 scripts/rotina/helpers.py slugs [saida.txt]   -> grava os hrefs internos válidos (um por linha)
  python3 scripts/rotina/helpers.py env                  -> diz se o banco está configurado (sem imprimir a chave)

Ambiente (CLAUDE.md §13): SUPABASE_URL (ou VITE_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY (ou VITE_SUPABASE_ANON_KEY),
lidos do ambiente ou de .env/.env.local. Sem banco, o universo de slugs vem dos seeds em supabase/migrations e seed/.
Os scripts NUNCA escrevem no banco e nunca geram DROP/DELETE/TRUNCATE: só produzem .sql que a rotina aplica.
"""
import glob
import hashlib
import json
import os
import re
import sys
import unicodedata
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))

# ---------------------------------------------------------------- ambiente
def env(*names):
    """Primeiro nome preenchido no ambiente; depois em .env / .env.local (sem dotenv)."""
    for n in names:
        v = os.environ.get(n)
        if v:
            return v.strip()
    for f in (".env", ".env.local"):
        p = os.path.join(ROOT, f)
        if not os.path.exists(p):
            continue
        for line in open(p, encoding="utf8"):
            m = re.match(r"\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$", line)
            if m and m.group(1) in names and m.group(2).strip("\"'"):
                return m.group(2).strip("\"'")
    return ""

SUPABASE_URL = env("SUPABASE_URL", "VITE_SUPABASE_URL").rstrip("/")
SUPABASE_KEY = env("SUPABASE_SERVICE_ROLE_KEY", "VITE_SUPABASE_ANON_KEY")
AMAZON_TAG = env("PUBLIC_AMAZON_TAG") or "vocacaodepai-20"

def has_db():
    return (SUPABASE_URL.startswith("http") and "<" not in SUPABASE_URL
            and bool(SUPABASE_KEY) and not SUPABASE_KEY.startswith("<"))

def get(path, timeout=60):
    """GET na REST do Supabase (só leitura)."""
    req = urllib.request.Request(SUPABASE_URL + "/rest/v1" + path,
                                 headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"})
    return json.load(urllib.request.urlopen(req, timeout=timeout))

# ---------------------------------------------------------------- constantes do site
AUTHOR_UUID = "e8bb17c5-ce46-4d2c-bda7-4d86d975f6fa"  # perfil "Equipe Vocação de Pai" (0008_seed_autor.sql)
AUTHOR_SQL = ("coalesce((select id from auth.users where lower(email) = 'contato@vocacaodepai.com.br'), "
              f"'{AUTHOR_UUID}'::uuid)")
def category_sql(slug):
    return f"(select id from public.categories where slug = '{q(slug)}')"

SEMAFORO = [("ok", "Sinal verde: "), ("warn", "Sinal de atenção: "), ("bad", "Sinal de alerta: ")]
PROFISSIONAL_RE = re.compile(
    r"m[eé]dic|pediatra|obstetra|profissional|padre|advogad|contador|psic[oó]log|terapeuta|dentista|"
    r"nutricionista|especialista|cardiologista|urologista|fisioterapeuta|hospital|pronto[- ]socorro|"
    r"emerg[eê]ncia|samu|\b192\b|\b193\b|eletricista|bombeiro|engenheir|mec[aâ]nic", re.I)
SECTIONS = ["/blog", "/busca", "/pai-indica", "/loja", "/ferramentas", "/area-do-pai", "/irmandade", "/historias",
            "/perguntas", "/eventos", "/formacao", "/desafios", "/pai-indica-pai", "/sobre", "/contato",
            "/politica-de-privacidade", "/politica-de-afiliados", "/termos-de-uso", "/newsletter"]
CHECKLIST_ULTIMO = "Ficar atento aos sinais do semáforo acima"
PROIBIDOS = json.load(open(os.path.join(HERE, "proibidos.json"), encoding="utf8"))

# ---------------------------------------------------------------- texto
def fold(s):
    return "".join(c for c in unicodedata.normalize("NFD", str(s or "")) if unicodedata.category(c) != "Mn").lower()

def proibidos_found(text):
    """Termos proibidos (doc 10 §5.3) casados por palavra inteira, sem acento."""
    t = fold(text)
    out = []
    for term in PROIBIDOS:
        pat = r"(?<![\w])" + re.escape(fold(term)).replace(r"\ ", r"\s+") + r"(?![\w])"
        if re.search(pat, t):
            out.append(term)
    return out

def has_reais(text):
    return bool(re.search(r"R\$\s?\d", text or ""))

def q(s):
    return str(s).replace("'", "''")

def dollar(tag, obj):
    """JSON como literal dollar-quoted ($tag$...$tag$::jsonb), compacto, sem escapar aspas."""
    s = obj if isinstance(obj, str) else json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    assert f"${tag}$" not in s, f"texto contém ${tag}$"
    return f"${tag}${s}${tag}$::jsonb"

def md5(s):
    return hashlib.md5(s.encode("utf8")).hexdigest()

# ---------------------------------------------------------------- Tiptap (mesmos nós de src/lib/tiptap-html.ts)
def link_mark(href):
    return {"type": "link", "attrs": {"href": href, "class": None, "rel": None, "target": None}}

_INLINE = re.compile(r"\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|_([^_]+)_")

def inline(md):
    """Converte **negrito**, _itálico_ e [texto](href) em nós de texto."""
    out, pos = [], 0
    for m in _INLINE.finditer(md):
        if m.start() > pos:
            out.append({"type": "text", "text": md[pos:m.start()]})
        if m.group(1):
            out.append({"type": "text", "text": m.group(1), "marks": [{"type": "bold"}]})
        elif m.group(2):
            out.append({"type": "text", "text": m.group(2), "marks": [link_mark(m.group(3))]})
        else:
            out.append({"type": "text", "text": m.group(4), "marks": [{"type": "italic"}]})
        pos = m.end()
    if pos < len(md):
        out.append({"type": "text", "text": md[pos:]})
    return [n for n in out if n["text"]]

def P(md):
    return {"type": "paragraph", "content": inline(md)}
def H2(t):
    return {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": t}]}
def H3(t):
    return {"type": "heading", "attrs": {"level": 3}, "content": [{"type": "text", "text": t}]}
def UL(items):
    return {"type": "bulletList", "content": [{"type": "listItem", "content": [P(i)]} for i in items]}
def OL(items):
    return {"type": "orderedList", "content": [{"type": "listItem", "content": [P(i)]} for i in items]}
def TASKS(items):
    return {"type": "taskList", "content": [{"type": "taskItem", "attrs": {"checked": False}, "content": [P(i)]} for i in items]}
def IMG(src, alt, title=None):
    return {"type": "image", "attrs": {"src": src, "alt": alt, "title": title}}
def TABLE(cols, rows):
    cell = lambda k, t: {"type": k, "attrs": {"colspan": 1, "rowspan": 1}, "content": [P(str(t))]}
    return {"type": "table", "content": [{"type": "tableRow", "content": [cell("tableHeader", c) for c in cols]}] +
            [{"type": "tableRow", "content": [cell("tableCell", c) for c in r]} for r in rows]}
def CALLOUT(tone, text):
    """Callout do Semáforo do pai: prefixo em negrito (doc 02 §5.2) + texto; nunca com link."""
    pref = dict(SEMAFORO)[tone]
    body = text[len(pref):] if text.startswith(pref) else text
    return {"type": "callout", "attrs": {"tone": tone}, "content": [{"type": "paragraph", "content": [
        {"type": "text", "text": pref, "marks": [{"type": "bold"}]}, {"type": "text", "text": body}]}]}
def SEMAFORO_BLOCO(tema, ok, warn, bad):
    return [H2(f"Semáforo do pai: {tema}"), CALLOUT("ok", ok), CALLOUT("warn", warn), CALLOUT("bad", bad)]
def BTN(slug, name=None):
    """Botão de afiliado: sempre "Comprar [produto] agora na Amazon"; href resolvido pelo site ({AMAZON:slug})."""
    return {"type": "paragraph", "attrs": {"class": "btn-comprar-wrap"}, "content": [{
        "type": "text", "text": f"Comprar {name} agora na Amazon" if name else "Comprar agora na Amazon",
        "marks": [{"type": "link", "attrs": {"href": f"{{AMAZON:{slug}}}", "class": "btn-comprar",
                                              "rel": "sponsored nofollow noopener", "target": "_blank"}}]}]}
def FOTOS(modelos):
    """Nó fotosModelos (fotos oficiais lado a lado); o site completa href/faixa a partir de products."""
    return {"type": "fotosModelos", "attrs": {"data": {"modelos": [
        {"slug": m["slug"], "name": m["name"], "src": m.get("src", ""), "href": ""} for m in modelos]}}}
def CONTINUE_LENDO(links):
    """links = [(título, href)]: 'Continue lendo: A, B, C e D.'"""
    runs = [{"type": "text", "text": "Continue lendo: "}]
    n = len(links)
    for i, (t, h) in enumerate(links):
        runs.append({"type": "text", "text": t, "marks": [link_mark(h)]})
        runs.append({"type": "text", "text": ", " if i < n - 2 else (" e " if i == n - 2 else ".")})
    return {"type": "paragraph", "content": runs}
def DOC(blocks):
    return {"type": "doc", "content": blocks}

# ---------------------------------------------------------------- percorrer
def nodes(n):
    if isinstance(n, dict):
        yield n
        for v in n.values():
            if isinstance(v, (list, dict)):
                yield from nodes(v)
    elif isinstance(n, list):
        for x in n:
            yield from nodes(x)

def text_of(n):
    return " ".join(x["text"] for x in nodes(n) if x.get("type") == "text" and x.get("text"))

def words(n):
    return len(text_of(n).split())

def hrefs(n):
    out = []
    for x in nodes(n):
        if x.get("type") == "link" and isinstance(x.get("attrs"), dict) and x["attrs"].get("href"):
            out.append(x["attrs"]["href"])
    return out

def internal_hrefs(n):
    return [h for h in hrefs(n) if h.startswith("/")]

def external_hrefs(n):
    return [h for h in hrefs(n) if re.match(r"https?://", h)]

# ---------------------------------------------------------------- universo de slugs (links internos)
def _tool_slugs():
    p = os.path.join(ROOT, "src", "lib", "tools", "registry.ts")
    return set(re.findall(r'slug:\s*"([a-z0-9-]+)"', open(p, encoding="utf8").read())) if os.path.exists(p) else set()

def _seed_universe():
    """Offline: slugs dos INSERTs de seed (supabase/migrations/00NN_*.sql) e dos JSON de supabase/seed."""
    posts, prods, cats = {}, set(), set()
    for f in sorted(glob.glob(os.path.join(ROOT, "supabase", "migrations", "0*_*.sql"))):
        s = open(f, encoding="utf8").read()
        for m in re.finditer(r"insert into public\.posts\s*\(([^)]*)\)\s*(?:values\s*\(|select)\s*(?:'([a-z0-9-]+)'|\$(\w+)\$([a-z0-9-]+)\$\3\$)", s):
            cols = [c.strip() for c in m.group(1).split(",")]
            slug = m.group(2) or m.group(4)
            # kind: literal da coluna kind depois do body (ignora os blocos $tag$...$tag$ do JSON)
            tail = re.sub(r"\$([a-z]+)\$.*?\$\1\$", "", s[m.end():m.end() + 400000], flags=re.S)
            nxt = re.search(r"insert into public\.", tail)
            tail = tail[: nxt.start()] if nxt else tail
            km = re.search(r"'(artigo|noticia|review|comparativo|lista)'", tail)
            posts[slug] = km.group(1) if (km and "kind" in cols) else "artigo"
        for m in re.finditer(r"insert into public\.products\s*\([^)]*\)\s*(?:values\s*\(|select)\s*'([a-z0-9-]+)'", s):
            prods.add(m.group(1))
        # tuplas ('slug', 'Nome', ...) e ('uuid', 'slug', ...) das categorias e subcategorias (CTE `sub` + insert)
        for m in re.finditer(r"(?:with sub\b|insert into public\.categories\b)", s):
            region = s[m.start():]
            nxt = re.search(r"insert into public\.(?!categories)", region)
            region = region[: nxt.start()] if nxt else region
            found = re.findall(r"\(\s*'[0-9a-f-]{36}'\s*,\s*'([a-z0-9-]+)'", region)
            found += re.findall(r"^\s*\(\s*'([a-z][a-z0-9-]+)'\s*,\s*'", region, re.M)
            found += re.findall(r"^\s*\(\s*'[a-z0-9-]+'\s*,\s*'([a-z0-9-]+)'\s*,\s*'[^']*'\s*,\s*\d+\s*\)", region, re.M)
            cats |= {c for c in found if not re.fullmatch(r"[0-9a-f-]{36}", c)}
    tracks, challenges = set(), set()
    for name, dest in (("tracks.json", tracks), ("challenges.json", challenges)):
        p = os.path.join(ROOT, "supabase", "seed", name)
        if os.path.exists(p):
            dest |= set(re.findall(r'"slug":\s*"([a-z0-9-]+)"', open(p, encoding="utf8").read()))
    return posts, prods, cats, tracks, challenges

def universe(extra_posts=()):
    """dict com os conjuntos de slugs válidos por seção. Banco se configurado; senão seeds do repositório."""
    u = {"post": set(), "pai-indica": set(), "loja": set(), "ferramentas": _tool_slugs(), "formacao": set(),
         "desafios": set(), "categoria": set(), "source": "seeds"}
    if has_db():
        try:
            for p in get("/posts?select=slug,kind&status=eq.published&limit=5000"):
                (u["pai-indica"] if p.get("kind") in ("review", "comparativo", "lista") else u["post"]).add(p["slug"])
            u["loja"] |= {x["slug"] for x in get("/products?select=slug&active=eq.true&limit=5000")}
            u["categoria"] |= {x["slug"] for x in get("/categories?select=slug&limit=1000")}
            try:
                u["formacao"] |= {x["slug"] for x in get("/tracks?select=slug&status=eq.published&limit=500")}
                u["desafios"] |= {x["slug"] for x in get("/challenges?select=slug&status=eq.published&limit=500")}
            except Exception:
                pass
            u["source"] = "banco"
        except Exception as e:  # banco fora do ar: cai para os seeds e avisa
            print(f"AVISO: banco indisponível ({e}); usando os seeds do repositório", file=sys.stderr)
    if u["source"] == "seeds":
        posts, prods, cats, tracks, challenges = _seed_universe()
        for s, k in posts.items():
            (u["pai-indica"] if k in ("review", "comparativo", "lista") else u["post"]).add(s)
        u["loja"] |= prods; u["categoria"] |= cats; u["formacao"] |= tracks; u["desafios"] |= challenges
    for s in extra_posts:
        u["post"].add(s)
    return u

def universe_from_file(path):
    """slugs.txt gerado por slugs.sh (um href por linha: /post/x, /loja/y, ...)."""
    u = {"post": set(), "pai-indica": set(), "loja": set(), "ferramentas": set(), "formacao": set(), "desafios": set(),
         "categoria": set(), "source": path}
    for line in open(path, encoding="utf8"):
        m = re.match(r"\s*/(post|pai-indica|loja|ferramentas|formacao|desafios|categoria)/([a-z0-9-]+)\s*$", line)
        if m:
            u[m.group(1)].add(m.group(2))
    return u

def link_ok(href, u):
    clean = href.split("?")[0].split("#")[0].rstrip("/") or "/"
    m = re.match(r"^/(post|pai-indica|loja|ferramentas|formacao|desafios|categoria)/([a-z0-9-]+)$", clean)
    if not m:
        return clean == "/" or clean in SECTIONS or clean.startswith("/loja/categoria/") or clean.startswith("/pai-indica-pai/")
    sec, slug = m.group(1), m.group(2)
    if sec == "ferramentas" and not u["ferramentas"]:
        return True
    return slug in u[sec]

def write_slugs(path, u):
    lines = []
    for sec in ("post", "pai-indica", "loja", "ferramentas", "formacao", "desafios", "categoria"):
        lines += [f"/{sec}/{s}" for s in sorted(u[sec])]
    open(path, "w", encoding="utf8").write("\n".join(lines) + "\n")
    return len(lines)

# ---------------------------------------------------------------- checagens comuns
def check_meta(a, err, kind="artigo"):
    """subtitle, excerpt, seo_title, seo_description, slug (CLAUDE.md §6 item 10; validador)."""
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", a.get("slug", "")):
        err.append("slug inválido (minúsculas, números e hífens)")
    if not a.get("title", "").strip():
        err.append("faltou title")
    sub = (a.get("subtitle") or "").strip()
    if not 50 <= len(sub) <= 220:
        err.append("subtitle obrigatório (50 a 220 caracteres): frase sob o título que complementa, sem repetir o excerpt")
    elif sub.lower() in (a.get("title", "").strip().lower(), (a.get("excerpt") or "").strip().lower()):
        err.append("subtitle não pode ser igual ao título nem ao excerpt")
    ex = (a.get("excerpt") or "").strip()
    if not ex or len(ex) > 160:
        err.append("excerpt obrigatório, até 160 caracteres")
    st = (a.get("seo_title") or a.get("title") or "").strip()
    if len(st) > 60:
        err.append(f"seo_title com {len(st)} caracteres (máx. 60)")
    sd = (a.get("seo_description") or "").strip()
    if not 120 <= len(sd) <= 155:
        err.append(f"seo_description com {len(sd)} caracteres (120 a 155)")
    if not a.get("cover") and not a.get("cover_image_url"):
        err.append("faltou a capa (cover)")
    if not (a.get("cover_alt") or "").strip():
        err.append("faltou cover_alt (alt descritivo em PT-BR)")
    blob = " ".join([a.get("title", ""), sub, ex, st, sd])
    if has_reais(blob):
        err.append("valor em reais no título/subtítulo/excerpt/SEO")
    for t in proibidos_found(blob):
        err.append(f"termo proibido nos metadados: {t}")

def norm_faq(items):
    return [{"question": (x.get("question") or x.get("q") or "").strip(),
             "answer": (x.get("answer") or x.get("a") or "").strip()} for x in (items or [])]

def norm_quiz(items):
    out = []
    for x in items or []:
        c = x.get("correct", x.get("answer"))
        out.append({"question": (x.get("question") or "").strip(), "options": list(x.get("options") or []),
                    "correct": c, "explanation": (x.get("explanation") or "").strip()})
    return out

def check_faq_quiz(a, err, faq_min=3, quiz_required=False):
    faq = norm_faq(a.get("faq"))
    if len(faq) < faq_min or len(faq) > 6 or any(not f["question"] or not f["answer"] for f in faq):
        err.append(f"faq: {faq_min} a 6 itens {{question, answer}} sem vazio")
    quiz = norm_quiz(a.get("quiz"))
    if quiz:
        if not 3 <= len(quiz) <= 5:
            err.append("quiz: 3 a 5 perguntas")
        for qz in quiz:
            if not qz["question"] or len(qz["options"]) < 2 or not qz["explanation"]:
                err.append("quiz: pergunta, 2+ opções e explanation obrigatórios")
            if not (isinstance(qz["correct"], int) and 0 <= qz["correct"] < len(qz["options"])):
                err.append("quiz: correct é o índice (0-based) da opção certa")
    elif quiz_required:
        err.append("quiz obrigatório")
    if has_reais(json.dumps(faq + quiz, ensure_ascii=False)):
        err.append("valor em reais no faq/quiz")
    return faq, quiz

def check_links(doc, u, err, min_links):
    ints = internal_hrefs(doc)
    distinct = set(ints)
    if len(distinct) < min_links:
        err.append(f"{len(distinct)} links internos distintos (mínimo {min_links})")
    for h in sorted(distinct):
        if not link_ok(h, u):
            err.append(f"link para slug inexistente: {h}")
    return distinct

def check_headings(doc, err):
    for n in nodes(doc):
        if n.get("type") == "heading" and n.get("attrs", {}).get("level") not in (2, 3):
            err.append("heading fora dos níveis 2 e 3")
        if n.get("type") in ("listItem", "taskItem") and not text_of(n).strip():
            err.append("item de lista vazio")

def check_semaforo(doc, err, required=True):
    top = doc["content"]
    cal = [i for i, n in enumerate(top) if n.get("type") == "callout"]
    deep = sum(1 for n in nodes(doc) if n.get("type") == "callout")
    if not cal:
        if required:
            err.append("artigo sem Semáforo do pai (3 callouts ok/warn/bad)")
        return
    if deep != 3 or len(cal) != 3 or cal != [cal[0], cal[0] + 1, cal[0] + 2]:
        err.append("semáforo precisa de exatamente 3 callouts seguidos, no nível raiz do body")
        return
    h = top[cal[0] - 1] if cal[0] > 0 else None
    if not (h and h.get("type") == "heading" and re.match(r"^Sem[áa]foro do pai\b", text_of(h).strip(), re.I)):
        err.append('o heading antes dos callouts deve começar com "Semáforo do pai"')
    for i, (tone, pref) in enumerate(SEMAFORO):
        c = top[cal[i]]
        t = text_of(c).strip()
        if c.get("attrs", {}).get("tone") != tone or not t.startswith(pref):
            err.append(f"callout {i + 1} fora da ordem/prefixo ({tone}: \"{pref}\")")
        if hrefs(c):
            err.append(f"link dentro do callout {i + 1}")
        if i == 2 and not PROFISSIONAL_RE.search(t):
            err.append('"Sinal de alerta" sem orientação de procurar ajuda profissional (médico, padre, advogado, contador…)')

def check_cover_inline(doc, cover, err):
    base = (cover or "").split("?")[0]
    for n in nodes(doc):
        if n.get("type") == "image":
            src = (n.get("attrs") or {}).get("src", "")
            if not src or not (n.get("attrs") or {}).get("alt"):
                err.append("imagem inline sem src ou sem alt")
            elif src.split("?")[0] == base:
                err.append("capa repetida no corpo")

def check_text(doc, err, extra=""):
    t = text_of(doc) + " " + extra
    if has_reais(t):
        err.append("valor em reais no texto (use {FAIXA:slug} ou ordem de grandeza)")
    if re.search(r"ver pre[çc]o", t, re.I):
        err.append("não use 'Ver preço na Amazon'")
    for p in proibidos_found(t):
        err.append(f"termo proibido: {p}")

def tags_sql(slug, tags, names=None):
    """INSERTs idempotentes em tags/post_tags (0002): fase-*, serie:*."""
    names = names or {}
    if not tags:
        return ""
    vals = ",".join(f"('{q(t)}','{q(names.get(t) or _tag_name(t))}')" for t in tags)
    lst = ",".join(f"'{q(t)}'" for t in tags)
    return (f"insert into public.tags (slug, name) values {vals} on conflict (slug) do nothing;\n"
            f"insert into public.post_tags (post_id, tag_id) select p.id, t.id from public.posts p, public.tags t "
            f"where p.slug = '{q(slug)}' and t.slug in ({lst}) on conflict do nothing;\n")

def _tag_name(t):
    if t == "fase-todas":
        return "Todas as fases"
    if t.startswith("fase-"):
        return "Fase: " + t[5:].replace("-", " ")
    if t.startswith("serie:"):
        return t[6:].replace("-", " ").capitalize()
    return t

def report_errors(err):
    if err:
        print("ERROS:\n- " + "\n- ".join(dict.fromkeys(err)))
        sys.exit(1)

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "slugs":
        u = universe()
        n = write_slugs(sys.argv[2] if len(sys.argv) > 2 else "slugs.txt", u)
        print(f"{n} hrefs válidos gravados (fonte: {u['source']})")
    elif cmd == "env":
        print("banco configurado" if has_db() else "sem banco: usando seeds do repositório")
    else:
        print(__doc__); sys.exit(2)
