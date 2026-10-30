#!/usr/bin/env node
// scripts/validate-content.mjs — Validador de conteúdo do Vocação de Pai.
// Regras: CLAUDE.md §4.3, §5, §6 e §7; doc 03 §9.5 (Fase 1). As Fases 2 e 8 estendem ESTE arquivo.
// Node 22, sem dependências (só node:fs, node:path e fetch). Sai com código 1 se qualquer regra falhar.
//
// Uso:
//   node scripts/validate-content.mjs                        # = --since 7d (posts publicados/atualizados na semana, via banco)
//   node scripts/validate-content.mjs --all                  # todos os posts publicados do banco
//   node scripts/validate-content.mjs --since 24h            # janela: Nh ou Nd
//   node scripts/validate-content.mjs --slug a,b             # só esses slugs (banco)
//   node scripts/validate-content.mjs --files f.sql g.json   # posts/produtos dentro de arquivos de seed, SEM banco
//                                                            # (.sql: INSERTs em public.posts/public.products; .json: objeto ou array)
//   opções: --products        valida também os produtos (banco ou arquivos)
//           --images          faz HEAD em capa e imagens inline (exige 200 e content-type de imagem)
//           --known-slugs a,b slugs de posts que vão existir (modo --files, para links entre arquivos ainda não gravados)
//
// Banco: VITE_SUPABASE_URL (ou SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY (preferida: lê rascunhos) ou VITE_SUPABASE_ANON_KEY
// (ou VITE_SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY), do ambiente ou do .env/.env.local. Sem variáveis → aviso e saída 0.

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------- argumentos
const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const opt = (k, d) => {
  const i = args.indexOf(k);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : d;
};
const listAfter = (k) => {
  const i = args.indexOf(k);
  if (i < 0) return [];
  const out = [];
  for (let j = i + 1; j < args.length && !args[j].startsWith("--"); j++) out.push(args[j]);
  return out;
};
const FILES = listAfter("--files");
const SLUGS = (opt("--slug", "") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const KNOWN = (opt("--known-slugs", "") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const SINCE = opt("--since", "7d");
const ALL = has("--all");
const WANT_PRODUCTS = has("--products");
const WANT_IMAGES = has("--images");
const FILES_MODE = FILES.length > 0;

// ---------------------------------------------------------------- ambiente (.env sem dotenv)
function loadEnv() {
  const env = { ...process.env };
  for (const f of [".env", ".env.local"]) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (!m || env[m[1]] !== undefined) continue;
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      env[m[1]] = v;
    }
  }
  return env;
}
const ENV = loadEnv();
const DB_URL = (ENV.VITE_SUPABASE_URL || ENV.SUPABASE_URL || "").replace(/\/+$/, "");
const DB_KEY =
  ENV.SUPABASE_SERVICE_ROLE_KEY ||
  ENV.VITE_SUPABASE_ANON_KEY ||
  ENV.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ENV.SUPABASE_ANON_KEY ||
  "";
const HAS_DB = Boolean(DB_URL && DB_KEY);

async function dbGet(path) {
  const r = await fetch(`${DB_URL}/rest/v1${path}`, {
    headers: { apikey: DB_KEY, Authorization: `Bearer ${DB_KEY}` },
  });
  if (!r.ok) throw new Error(`REST ${r.status} em ${path}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// ---------------------------------------------------------------- termos proibidos (lista única, doc 10 §5.3)
const PROIBIDOS_PATH = join(ROOT, "scripts", "rotina", "proibidos.json");
const PROIBIDOS = existsSync(PROIBIDOS_PATH)
  ? JSON.parse(readFileSync(PROIBIDOS_PATH, "utf8"))
  : [];
const fold = (s) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const PROIBIDOS_RE = PROIBIDOS.map((t) => [
  t,
  new RegExp(
    `(^|[^\\p{L}\\p{N}])${esc(fold(t)).replace(/\s+/g, "\\s+")}(?=[^\\p{L}\\p{N}]|$)`,
    "u",
  ),
]);

// ---------------------------------------------------------------- helpers de Tiptap
const walk = (n, f) => {
  if (Array.isArray(n)) n.forEach((x) => walk(x, f));
  else if (n && typeof n === "object") {
    f(n);
    if (Array.isArray(n.content)) walk(n.content, f);
  }
};
const textOf = (b) => {
  const t = [];
  walk(b, (n) => n.type === "text" && typeof n.text === "string" && t.push(n.text));
  return t.join(" ");
};
const wordsOf = (s) => s.split(/\s+/).filter(Boolean).length;
const linkNodes = (b) => {
  const out = [];
  walk(b, (n) => {
    if (n.type === "text" && Array.isArray(n.marks))
      for (const m of n.marks)
        if (m.type === "link" && m.attrs?.href)
          out.push({ href: String(m.attrs.href), text: n.text || "", attrs: m.attrs });
  });
  return out;
};
const internalLinks = (b) => linkNodes(b).filter((l) => l.href.startsWith("/"));
const base = (u) =>
  String(u || "")
    .split("?")[0]
    .split("#")[0];
const SEM = [
  ["ok", "Sinal verde: "],
  ["warn", "Sinal de atenção: "],
  ["bad", "Sinal de alerta: "],
];
const PROFISSIONAL_RE =
  /m[eé]dic|pediatra|obstetra|profissional|padre|advogad|contador|psic[oó]log|terapeuta|dentista|nutricionista|especialista|cardiologista|urologista|fisioterapeuta|hospital|pronto[- ]socorro|emerg[eê]ncia|samu|192|193/i;

// ---------------------------------------------------------------- parser de INSERTs SQL (seeds)
const skipWs = (s, i) => {
  while (i < s.length) {
    if (/\s/.test(s[i])) i++;
    else if (s.startsWith("--", i)) {
      const e = s.indexOf("\n", i);
      i = e < 0 ? s.length : e + 1;
    } else if (s.startsWith("/*", i)) {
      const e = s.indexOf("*/", i);
      i = e < 0 ? s.length : e + 2;
    } else break;
  }
  return i;
};

function decodeBare(raw) {
  const r = raw.trim();
  if (/^null$/i.test(r)) return null;
  if (/^true$/i.test(r)) return true;
  if (/^false$/i.test(r)) return false;
  if (/^-?\d+(\.\d+)?$/.test(r)) return Number(r);
  return { expr: r };
}

function readBalanced(s, i) {
  let depth = 0,
    j = i;
  while (j < s.length) {
    const c = s[j];
    if (c === "'") {
      let q = j + 1;
      for (;;) {
        q = s.indexOf("'", q);
        if (q < 0) throw new Error("string sem fechamento");
        if (s[q + 1] === "'") {
          q += 2;
          continue;
        }
        break;
      }
      j = q + 1;
      continue;
    }
    if (c === "$") {
      const tm = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(s.slice(j));
      if (tm) {
        const e = s.indexOf(tm[0], j + tm[0].length);
        if (e < 0) throw new Error("dollar-quote sem fechamento");
        j = e + tm[0].length;
        continue;
      }
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return [s.slice(i, j + 1), j + 1];
    }
    j++;
  }
  throw new Error("parênteses sem fechamento");
}

function parseTuple(s, i) {
  if (s[i] !== "(") throw new Error(`esperava "(" na posição ${i}`);
  i++;
  const vals = [];
  for (;;) {
    i = skipWs(s, i);
    let v;
    if (s[i] === "'") {
      let j = i + 1,
        buf = "";
      for (;;) {
        const q = s.indexOf("'", j);
        if (q < 0) throw new Error("string sem fechamento");
        buf += s.slice(j, q);
        if (s[q + 1] === "'") {
          buf += "'";
          j = q + 2;
          continue;
        }
        j = q + 1;
        break;
      }
      v = buf;
      i = j;
    } else if (s[i] === "$") {
      const tm = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(s.slice(i));
      if (!tm) throw new Error(`token inesperado na posição ${i}`);
      const end = s.indexOf(tm[0], i + tm[0].length);
      if (end < 0) throw new Error("dollar-quote sem fechamento");
      v = s.slice(i + tm[0].length, end);
      i = end + tm[0].length;
    } else if (s[i] === "(") {
      const [txt, next] = readBalanced(s, i);
      v = { expr: txt };
      i = next;
    } else {
      let j = i,
        depth = 0;
      while (j < s.length) {
        const c = s[j];
        if (c === "'") {
          j = s.indexOf("'", j + 1);
          if (j < 0) throw new Error("string sem fechamento");
          j++;
          continue;
        }
        if (c === "(") depth++;
        else if (c === ")") {
          if (depth === 0) break;
          depth--;
        } else if (c === "," && depth === 0) break;
        j++;
      }
      v = decodeBare(s.slice(i, j));
      i = j;
    }
    const cm = /^\s*::\s*[A-Za-z_]+(?:\s*\[\])?/.exec(s.slice(i));
    if (cm) {
      i += cm[0].length;
      if (/jsonb?/i.test(cm[0]) && typeof v === "string") {
        try {
          v = JSON.parse(v);
        } catch (e) {
          v = { __invalidJson: e.message };
        }
      }
    }
    vals.push(v);
    i = skipWs(s, i);
    if (s[i] === ",") {
      i++;
      continue;
    }
    if (s[i] === ")") return [vals, i + 1];
    throw new Error(`token inesperado na posição ${i}: ${JSON.stringify(s.slice(i, i + 30))}`);
  }
}

function parseSqlInserts(sql, table) {
  const out = [];
  const re = new RegExp(`insert\\s+into\\s+(?:public\\.)?${table}\\s*\\(`, "gi");
  let m;
  while ((m = re.exec(sql))) {
    let i = m.index + m[0].length;
    const close = sql.indexOf(")", i);
    const cols = sql
      .slice(i, close)
      .split(",")
      .map((c) => c.trim().replace(/^"|"$/g, ""))
      .filter(Boolean);
    i = close + 1;
    const vm = /^\s*values\s*/i.exec(sql.slice(i));
    if (!vm) continue; // insert ... select: não suportado
    i += vm[0].length;
    for (;;) {
      i = skipWs(sql, i);
      if (sql[i] !== "(") break;
      const [vals, next] = parseTuple(sql, i);
      i = next;
      const row = {};
      cols.forEach((c, k) => {
        row[c] = vals[k];
      });
      out.push(row);
      i = skipWs(sql, i);
      if (sql[i] === ",") {
        i++;
        continue;
      }
      break;
    }
    re.lastIndex = i;
  }
  return out;
}

const exprSlug = (v) =>
  v && typeof v === "object" && typeof v.expr === "string"
    ? (/slug\s*=\s*'([^']+)'/i.exec(v.expr) || [])[1]
    : undefined;

function normalizePost(row, origin) {
  const p = { ...row, __origin: origin };
  if (p.category_id && typeof p.category_id === "object") {
    p.category_slug = p.category_slug || exprSlug(p.category_id) || null;
  }
  for (const k of ["body", "faq", "quiz", "review", "comparison"])
    if (typeof p[k] === "string") {
      try {
        p[k] = JSON.parse(p[k]);
      } catch {
        p[k] = { __invalidJson: `coluna ${k} não é JSON válido` };
      }
    }
  if (p.faq == null) p.faq = [];
  if (p.quiz == null) p.quiz = [];
  if (p.kind == null) p.kind = "artigo";
  if (p.status == null) p.status = "published";
  return p;
}

function postsFromFile(file) {
  const ext = extname(file).toLowerCase(),
    raw = readFileSync(file, "utf8"),
    name = basename(file);
  if (ext === ".json") {
    const j = JSON.parse(raw);
    const arr = Array.isArray(j) ? j : Array.isArray(j.posts) ? j.posts : [j];
    return {
      posts: arr.filter((x) => x && (x.body || x.slug)).map((x) => normalizePost(x, name)),
      products: (Array.isArray(j.products) ? j.products : []).map((x) => ({
        ...x,
        __origin: name,
      })),
    };
  }
  return {
    posts: parseSqlInserts(raw, "posts").map((r) => normalizePost(r, name)),
    products: parseSqlInserts(raw, "products").map((r) => ({
      ...r,
      category_slug: exprSlug(r.category_id),
      __origin: name,
    })),
  };
}

// Fase 3: slugs de product_categories (0003_loja.sql e seeds) para validar products.category_id.
function productCategorySlugsFromMigrations() {
  const set = new Set();
  const dir = join(ROOT, "supabase", "migrations");
  if (!existsSync(dir)) return set;
  for (const f of readdirSync(dir)) {
    if (!/^\d{4}_.*\.sql$/.test(f)) continue;
    const sql = readFileSync(join(dir, f), "utf8");
    if (!/product_categories/i.test(sql)) continue;
    try {
      for (const r of parseSqlInserts(sql, "product_categories"))
        if (typeof r.slug === "string") set.add(r.slug);
    } catch {
      /* ignora */
    }
  }
  return set;
}

function categorySlugsFromMigrations() {
  const set = new Set();
  const dir = join(ROOT, "supabase", "migrations");
  if (!existsSync(dir)) return set;
  for (const f of readdirSync(dir)) {
    if (!/^\d{4}_.*\.sql$/.test(f)) continue;
    const sql = readFileSync(join(dir, f), "utf8");
    if (!/categories/i.test(sql)) continue;
    try {
      for (const r of parseSqlInserts(sql, "categories"))
        if (typeof r.slug === "string") set.add(r.slug);
    } catch {
      /* ignora */
    }
    for (const m of sql.matchAll(
      /\(\s*'([a-z0-9-]+)'\s*,\s*'([a-z0-9-]+)'\s*,\s*'[^']*'\s*,\s*\d+\s*\)/g,
    ))
      set.add(m[2]); // CTE sub(parent_slug, slug, name, pos)
  }
  return set;
}

// ---------------------------------------------------------------- carga do universo (posts conhecidos, produtos, categorias)
const seedFiles = () => {
  const out = [];
  const mig = join(ROOT, "supabase", "migrations");
  if (existsSync(mig))
    for (const f of readdirSync(mig)) if (/^\d{4}_.*\.sql$/.test(f)) out.push(join(mig, f));
  const seed = join(ROOT, "supabase", "seed");
  const rec = (d) => {
    for (const f of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, f.name);
      if (f.isDirectory()) rec(p);
      else if (/\.(sql|json)$/i.test(f.name)) out.push(p);
    }
  };
  if (existsSync(seed)) rec(seed);
  return out;
};

let posts = [],
  products = [],
  universePosts = new Map(),
  universeProducts = new Map(),
  categories = new Set(),
  productCategories = new Set(),
  warnings = [];

if (FILES_MODE) {
  for (const f of FILES) {
    const p = resolve(f);
    if (!existsSync(p)) {
      console.error(`✗ arquivo não encontrado: ${f}`);
      process.exit(1);
    }
    try {
      const r = postsFromFile(p);
      posts.push(...r.posts);
      products.push(...r.products);
    } catch (e) {
      console.error(`✗ ${f}: não consegui extrair os INSERTs (${e.message})`);
      process.exit(1);
    }
  }
  // universo: arquivos passados + seeds do repositório (só os 00NN_*.sql do projeto) + --known-slugs + banco (se houver)
  for (const p of posts) universePosts.set(p.slug, p);
  for (const pr of products) universeProducts.set(pr.slug, pr);
  for (const f of seedFiles()) {
    if (FILES.some((x) => resolve(x) === f)) continue;
    try {
      const r = postsFromFile(f);
      for (const p of r.posts)
        if (p.slug && !universePosts.has(p.slug)) universePosts.set(p.slug, p);
      for (const pr of r.products)
        if (pr.slug && !universeProducts.has(pr.slug)) universeProducts.set(pr.slug, pr);
    } catch {
      /* arquivo com SQL fora do formato de seed: ignorado no universo */
    }
  }
  for (const s of KNOWN)
    if (!universePosts.has(s))
      universePosts.set(s, { slug: s, kind: "artigo", status: "published", __known: true });
  categories = categorySlugsFromMigrations();
  productCategories = productCategorySlugsFromMigrations();
  if (HAS_DB) {
    try {
      for (const p of await dbGet(
        `/posts?select=slug,kind,status,title,cover_image_url&status=eq.published&limit=5000`,
      ))
        if (!universePosts.has(p.slug)) universePosts.set(p.slug, { ...p, __db: true });
      for (const pr of await dbGet(
        `/products?select=slug,active,price_min,price_max,review&active=eq.true&limit=5000`,
      ))
        if (!universeProducts.has(pr.slug)) universeProducts.set(pr.slug, pr);
      for (const c of await dbGet(`/categories?select=slug&limit=1000`)) categories.add(c.slug);
      for (const c of await dbGet(`/product_categories?select=slug&limit=100`))
        productCategories.add(c.slug);
    } catch (e) {
      warnings.push(`banco indisponível, universo só com arquivos: ${e.message}`);
    }
  }
} else {
  if (!HAS_DB) {
    console.log(
      "validate-content: sem VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) no ambiente ou .env — nada a validar no banco.",
    );
    console.log("Dica: use --files <seed.sql|seed.json> para validar arquivos de seed sem banco.");
    process.exit(0);
  }
  let q;
  if (SLUGS.length)
    q = `/posts?select=*&slug=in.(${SLUGS.map(encodeURIComponent).join(",")})&limit=5000`;
  else if (ALL) q = `/posts?select=*&status=eq.published&limit=5000`;
  else {
    const m = /^(\d+)\s*([hd])$/i.exec(SINCE);
    if (!m) {
      console.error(`--since inválido: ${SINCE} (use 24h, 7d…)`);
      process.exit(1);
    }
    const ms = Number(m[1]) * (m[2].toLowerCase() === "h" ? 3600e3 : 86400e3);
    q = `/posts?select=*&status=eq.published&updated_at=gte.${new Date(Date.now() - ms).toISOString()}&limit=5000`;
  }
  posts = (await dbGet(q)).map((p) => normalizePost(p, "banco"));
  for (const p of await dbGet(
    `/posts?select=id,slug,kind,status,title,cover_image_url&status=eq.published&limit=5000`,
  ))
    universePosts.set(p.slug, { ...p, __db: true });
  for (const p of posts) universePosts.set(p.slug, p);
  const prods = await dbGet(`/products?select=*&limit=5000`);
  for (const pr of prods) if (pr.active) universeProducts.set(pr.slug, pr);
  if (WANT_PRODUCTS) products = prods;
  const catRows = await dbGet(`/categories?select=id,slug&limit=1000`);
  const catById = new Map(catRows.map((c) => [c.id, c.slug]));
  for (const c of catRows) categories.add(c.slug);
  const pcatRows = await dbGet(`/product_categories?select=id,slug&limit=100`);
  const pcatById = new Map(pcatRows.map((c) => [c.id, c.slug]));
  for (const c of pcatRows) productCategories.add(c.slug);
  for (const pr of products)
    if (pr.category_id && typeof pr.category_id === "string")
      pr.category_slug = pcatById.get(pr.category_id) || null;
  for (const p of posts)
    if (p.category_id && typeof p.category_id === "string")
      p.category_slug = catById.get(p.category_id) || null;
}

// ---------------------------------------------------------------- existência de links internos
const TOOL_SLUGS = (() => {
  const f = join(ROOT, "src", "lib", "tools", "registry.ts");
  return existsSync(f)
    ? new Set([...readFileSync(f, "utf8").matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]))
    : null;
})();
const SECTIONS = [
  "/blog",
  "/busca",
  "/pai-indica",
  "/loja",
  "/ferramentas",
  "/area-do-pai",
  "/minha-conta",
  "/entrar",
  "/cadastro",
  "/pai-indica-pai",
  "/irmandade",
  "/historias",
  "/perguntas",
  "/eventos",
  "/formacao",
  "/desafios",
  "/sobre",
  "/contato",
  "/politica-de-privacidade",
  "/termos-de-uso",
  "/politica-de-afiliados",
];
function linkExists(href) {
  const clean = base(href).replace(/\/+$/, "") || "/";
  if (clean === "/") return true;
  const [, sec, slug] =
    clean.match(
      /^\/(post|pai-indica|loja|ferramentas|formacao|categoria|desafios|historias|perguntas)\/([^/]+)$/,
    ) || [];
  if (!sec)
    return (
      SECTIONS.includes(clean) ||
      clean.startsWith("/loja/categoria/") ||
      clean.startsWith("/pai-indica-pai/")
    );
  if (sec === "post") {
    const p = universePosts.get(slug);
    return Boolean(
      p &&
      ["artigo", "noticia"].includes(p.kind || "artigo") &&
      (p.status || "published") === "published",
    );
  }
  if (sec === "pai-indica") {
    const p = universePosts.get(slug);
    return Boolean(
      p &&
      ["review", "comparativo", "lista"].includes(p.kind) &&
      (p.status || "published") === "published",
    );
  }
  if (sec === "loja") return universeProducts.size ? universeProducts.has(slug) : true; // Fase 1: só o prefixo enquanto a loja não tem dados
  if (sec === "ferramentas") return TOOL_SLUGS && TOOL_SLUGS.size ? TOOL_SLUGS.has(slug) : true;
  if (sec === "categoria") return categories.size ? categories.has(slug) : true;
  return true; // formacao/desafios/historias/perguntas: checados no build
}

// ---------------------------------------------------------------- regras por post
const WORDS = {
  artigo: [1200, 2200],
  noticia: [350, 600],
  review: [1000, 4000],
  comparativo: [1100, 4000],
  lista: [900, 4000],
};
const MIN_LINKS = { artigo: 10, noticia: 5, review: 8, comparativo: 8, lista: 8 };

function validatePost(p) {
  const e = [],
    w = [];
  const kind = p.kind || "artigo";
  const body = p.body;
  if (!p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))
    e.push("slug ausente ou fora do padrão kebab-case");
  if (!p.title || !String(p.title).trim()) e.push("title vazio");
  if (
    !body ||
    body.__invalidJson ||
    body.type !== "doc" ||
    !Array.isArray(body.content) ||
    !body.content.length
  ) {
    e.push(`body inválido (${body?.__invalidJson || "esperava {type:'doc', content:[...]}"})`);
    return { e, w, words: 0, links: 0, distinct: 0 };
  }
  if (!["artigo", "noticia", "review", "comparativo", "lista"].includes(kind))
    e.push(`kind inválido: ${kind}`);

  const text = textOf(body),
    words = wordsOf(text);
  const [minW, maxW] = WORDS[kind] || [900, 4000];
  if (words < minW) e.push(`${words} palavras (mínimo ${minW})`);
  if (words > maxW) e.push(`${words} palavras (máximo ${maxW})`);

  // links internos
  const links = internalLinks(body),
    distinct = new Set(links.map((l) => base(l.href)));
  const minL = MIN_LINKS[kind] || 8;
  if (links.length < minL) e.push(`${links.length} links internos (mínimo ${minL})`);
  else if (distinct.size < minL)
    e.push(
      `${distinct.size} destinos internos distintos (mínimo ${minL}; repetir o mesmo href não conta)`,
    );
  for (const h of distinct) if (!linkExists(h)) e.push(`link para destino inexistente: ${h}`);
  for (const l of links)
    if (l.href.startsWith("/post/") && base(l.href).slice(6) === p.slug)
      w.push(`link para o próprio post (${l.href})`);
  for (const l of linkNodes(body)) {
    if (/amazon\.com\.br/i.test(l.href)) {
      if (!/^Comprar (?:.+ )?agora na Amazon$/.test(l.text.trim()))
        e.push(
          `botão de afiliado com texto diferente de "Comprar agora na Amazon": "${l.text.trim()}"`,
        );
      if (!/sponsored/.test(String(l.attrs?.rel || "")))
        e.push(`link da Amazon sem rel="sponsored nofollow noopener" (${l.href.slice(0, 60)})`);
    }
  }
  if (/ver pre[çc]o/i.test(text))
    e.push('texto "Ver preço" é proibido (botão é "Comprar agora na Amazon")');

  // preço exato
  const money = `${text} ${p.title || ""} ${p.subtitle || ""} ${p.excerpt || ""} ${JSON.stringify(p.faq || [])} ${JSON.stringify(p.quiz || [])}`;
  if (/R\$\s?\d/.test(money))
    e.push(
      'valor em reais ("R$ <número>") no texto, excerpt, faq ou quiz — só faixa escrita pelo componente',
    );

  // termos proibidos
  const corpus = fold(
    `${p.title || ""} ${p.subtitle || ""} ${p.excerpt || ""} ${text} ${JSON.stringify(p.faq || [])}`,
  );
  for (const [t, re] of PROIBIDOS_RE) if (re.test(corpus)) e.push(`termo proibido: "${t}"`);

  // nós: headings 2-3, itens vazios, imagens
  walk(body, (n) => {
    if (n.type === "heading" && ![2, 3].includes(Number(n.attrs?.level)))
      e.push(`heading nível ${n.attrs?.level} (só 2 e 3)`);
    if ((n.type === "listItem" || n.type === "taskItem") && !textOf(n).trim())
      e.push(`${n.type} vazio`);
    if (n.type === "image") {
      if (
        !/^https?:\/\//.test(String(n.attrs?.src || "")) &&
        !String(n.attrs?.src || "").startsWith("/")
      )
        e.push("imagem inline sem src válido");
      if (!String(n.attrs?.alt || "").trim())
        e.push(`imagem inline sem alt (${base(n.attrs?.src).slice(0, 60)})`);
    }
    if (n.type === "text" && typeof n.text !== "string") e.push("nó text sem texto");
  });

  // capa
  const cover = base(p.cover_image_url);
  if (!p.cover_image_url) e.push("sem cover_image_url");
  else {
    if (!/^https?:\/\//.test(p.cover_image_url) && !p.cover_image_url.startsWith("/"))
      e.push("cover_image_url não é URL");
    for (const [s, o] of universePosts)
      if (s !== p.slug && o.cover_image_url && base(o.cover_image_url) === cover)
        e.push(`capa repetida com o post ${s}`);
    walk(
      body,
      (n) => n.type === "image" && base(n.attrs?.src) === cover && e.push("capa repetida no corpo"),
    );
  }
  if (!String(p.cover_image_alt || "").trim())
    w.push("sem cover_image_alt (alt descritivo em PT-BR)");

  // semáforo
  const top = body.content;
  const callouts = [];
  walk(body, (n) => n.type === "callout" && callouts.push(n));
  if (kind === "noticia") {
    if (callouts.length) e.push("notícia não leva semáforo (callout)");
  } else {
    if (kind === "artigo" && callouts.length === 0)
      e.push("artigo sem Semáforo do Pai (3 callouts ok/warn/bad)");
    if (callouts.length && callouts.length !== 3)
      e.push(`semáforo com ${callouts.length} callouts (precisa exatamente 3)`);
    if (callouts.length === 3) {
      callouts.forEach((c, i) => {
        const t = textOf(c).trim();
        if (c.attrs?.tone !== SEM[i][0])
          e.push(`callout ${i + 1} com tone "${c.attrs?.tone}" (esperado "${SEM[i][0]}")`);
        if (!t.startsWith(SEM[i][1])) e.push(`callout ${i + 1} não começa com "${SEM[i][1]}"`);
        if (linkNodes(c).length) e.push(`link dentro do callout ${i + 1}`);
        if (i === 2 && !PROFISSIONAL_RE.test(t))
          e.push(
            '"Sinal de alerta" sem orientação de procurar ajuda profissional (médico, padre, advogado, contador…)',
          );
      });
      const first = top.findIndex((n) => n.type === "callout");
      const idx = top.map((n) => n.type);
      if (first < 0 || idx.slice(first, first + 3).some((t) => t !== "callout"))
        e.push("os 3 callouts precisam ficar juntos, no nível raiz do body");
      const h = first > 0 ? top[first - 1] : null;
      if (!(h && h.type === "heading" && /^Sem[áa]foro do pai\b/i.test(textOf(h).trim())))
        e.push('falta o heading "Semáforo do pai: <tema>" logo antes dos callouts');
    }
  }

  // tabela, checklist, fechamento (artigo)
  if (kind === "artigo") {
    const tables = top.filter((n) => n.type === "table");
    if (!tables.length) e.push("sem tabela (table/tableRow/tableHeader/tableCell)");
    else if (!tables.some((t) => (t.content || []).length >= 2))
      e.push("tabela com menos de 2 linhas");
    const lists = top.map((n, i) => [n, i]).filter(([n]) => n.type === "taskList");
    if (!lists.length) e.push("sem checklist (taskList)");
    for (const [tl, i] of lists) {
      const items = (tl.content || []).filter((n) => n.type === "taskItem");
      if (items.length < 5 || items.length > 6)
        e.push(`checklist com ${items.length} itens (precisa 5 ou 6)`);
      if (
        items.length &&
        textOf(items[items.length - 1]).trim() !== "Ficar atento aos sinais do semáforo acima"
      )
        e.push('último item do checklist deve ser "Ficar atento aos sinais do semáforo acima"');
      for (const it of items)
        if (/[.]$/.test(textOf(it).trim()))
          e.push(`item do checklist termina com ponto final: "${textOf(it).trim().slice(0, 40)}"`);
      if (items.some((it) => it.attrs?.checked)) e.push("taskItem com checked:true");
      const h = top[i - 1];
      if (!(h && h.type === "heading" && /^Checklist do pai\b/i.test(textOf(h).trim())))
        e.push('falta o heading "Checklist do pai: <tema>" logo antes do checklist');
    }
  }
  if (kind === "artigo" || kind === "noticia") {
    const last = top[top.length - 1],
      prev = top[top.length - 2];
    if (!(last && last.type === "paragraph" && textOf(last).startsWith("Continue lendo: ")))
      e.push('último parágrafo deve começar com "Continue lendo: "');
    else {
      const cl = internalLinks(last);
      if (cl.length < 4 || cl.length > 10)
        e.push(`"Continue lendo" com ${cl.length} links (precisa 4 a 10)`);
      if (!/\.$/.test(textOf(last).trim())) e.push('"Continue lendo" deve terminar em "."');
      const plain = (last.content || [])
        .filter((n) => n.type === "text" && !(n.marks || []).some((m) => m.type === "link"))
        .map((n) => n.text);
      if (plain.length > 2 && !plain.slice(1, -1).every((t) => t === ", " || t === " e "))
        e.push('"Continue lendo": separar os links com ", " e o último com " e "');
      if (plain.length > 2 && plain[plain.length - 2] !== " e ")
        e.push('"Continue lendo": o último link entra com " e "');
      for (const l of cl) {
        const t = universePosts.get(base(l.href).replace(/^\/post\//, ""));
        if (t?.title && fold(t.title) !== fold(l.text))
          w.push(`"Continue lendo": texto "${l.text}" ≠ título do post ${t.slug}`);
      }
      if (!(prev && prev.type === "paragraph"))
        e.push("o parágrafo de fechamento (antes do Continue lendo) precisa ser um paragraph");
      else if (internalLinks(prev).length || linkNodes(prev).length)
        e.push("parágrafo de fechamento não pode ter links");
    }
    if (!(top[0]?.type === "paragraph"))
      e.push("abertura: o body deve começar com parágrafo (sem heading antes)");
  }

  // faq / quiz
  const faq = Array.isArray(p.faq) ? p.faq : null,
    quiz = Array.isArray(p.quiz) ? p.quiz : null;
  if (!faq) e.push("faq não é array");
  if (!quiz) e.push("quiz não é array");
  const faqOk =
    faq &&
    faq.length >= 3 &&
    faq.length <= 6 &&
    faq.every((f) => f && String(f.question || "").trim() && String(f.answer || "").trim());
  const quizOk =
    quiz &&
    quiz.length >= 3 &&
    quiz.length <= 5 &&
    quiz.every(
      (q) =>
        q &&
        String(q.question || "").trim() &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every((o) => String(o).trim()) &&
        (typeof q.correct === "number"
          ? q.correct >= 0 && q.correct < q.options.length
          : q.options.includes(q.correct)) &&
        String(q.explanation || "").trim(),
    );
  if (faq && faq.length && !faqOk) e.push("faq inválido: 3-6 itens {question, answer} não vazios");
  if (quiz && quiz.length && !quizOk)
    e.push("quiz inválido: 3-5 itens {question, options[], correct, explanation}");
  if (!faqOk && !quizOk) e.push("precisa de faq (3-6) e/ou quiz (3-5)");
  if (faq)
    for (const f of faq)
      if (f && (/\bq\b/.test(Object.keys(f).join(" ")) || "a" in f))
        e.push("faq com chaves {q, a}: use {question, answer}");

  // metadados
  if ((p.excerpt || "").length > 160)
    e.push(`excerpt com ${p.excerpt.length} caracteres (máximo 160)`);
  if (!String(p.excerpt || "").trim()) e.push("excerpt vazio");
  if ((p.seo_title || "").length > 60)
    e.push(`seo_title com ${p.seo_title.length} caracteres (máximo 60)`);
  if (!(p.seo_description && p.seo_description.length >= 120 && p.seo_description.length <= 155))
    e.push(`seo_description com ${(p.seo_description || "").length} caracteres (precisa 120-155)`);
  if (!String(p.subtitle || "").trim()) w.push("sem subtitle");
  if (p.reading_time != null && !(Number(p.reading_time) > 0)) e.push("reading_time deve ser > 0");
  if (p.reading_time == null && !FILES_MODE)
    e.push("reading_time nulo (o trigger deveria ter calculado)");
  if (p.reading_time != null && Math.abs(Number(p.reading_time) - Math.ceil(words / 200)) > 2)
    w.push(`reading_time ${p.reading_time} ≠ palavras/200 (${Math.ceil(words / 200)})`);
  if (p.category_slug != null && categories.size && !categories.has(p.category_slug))
    e.push(`category "${p.category_slug}" não existe`);
  if (p.category_slug === null && p.category_id == null) e.push("sem category_id");
  if (p.status !== "published")
    (FILES_MODE ? w : e).push(`status "${p.status}" (esperado published)`);
  else {
    const pa = p.publish_at;
    if (pa == null) e.push("publish_at nulo");
    else if (typeof pa === "string") {
      const d = new Date(pa);
      if (Number.isNaN(d.getTime())) e.push(`publish_at inválido: ${pa}`);
      else if (d.getTime() > Date.now()) e.push(`publish_at no futuro (${pa})`);
    } else if (typeof pa === "object" && pa.expr && !/now\(\)/i.test(pa.expr))
      e.push(`publish_at com expressão não reconhecida: ${pa.expr}`);
    else if (typeof pa === "object" && pa.expr && /\+\s*interval/i.test(pa.expr))
      e.push(`publish_at no futuro (${pa.expr})`);
  }

  // Pai Indica
  if (["review", "comparativo", "lista"].includes(kind)) {
    if (!p.product_category || !p.product_subcategory)
      e.push("Pai Indica sem product_category/product_subcategory");
    if (!(Number(p.product_score) >= 0 && Number(p.product_score) <= 10))
      e.push("Pai Indica sem product_score (0-10)");
    if (kind === "review") {
      const r = p.review;
      if (!r || typeof r !== "object" || r.__invalidJson) e.push("review jsonb ausente/inválido");
      else {
        if (["nota", "criterios", "ideal_para", "pros_e_contras"].some((k) => k in r))
          e.push("review com chaves em português (use score, criteria, ideal_for…)");
        if (!(Number(r.score) >= 0 && Number(r.score) <= 10)) e.push("review.score fora de 0-10");
        if (!Array.isArray(r.criteria) || r.criteria.length !== 5)
          e.push("review.criteria precisa de exatamente 5 itens {name, weight, score, comment}");
        else if (r.criteria.reduce((s, c) => s + Number(c.weight || 0), 0) !== 100)
          e.push("review.criteria: soma dos weight ≠ 100");
        if (!r.product_slug) e.push("review.product_slug ausente");
        else if (universeProducts.size && !universeProducts.has(r.product_slug))
          e.push(`review.product_slug "${r.product_slug}" não é produto ativo`);
        if (Number(p.product_score) !== Number(r.score)) e.push("product_score ≠ review.score");
        for (const k of ["pros", "cons"])
          if (!Array.isArray(r[k]) || r[k].length < 3 || r[k].length > 6)
            e.push(`review.${k} precisa de 3-6 itens`);
        for (const k of ["ideal_for", "not_ideal_for", "verdict", "how_we_evaluated"])
          if (!String(r[k] || "").trim()) e.push(`review.${k} vazio`);
        if (/R\$\s?\d/.test(JSON.stringify(r))) e.push('review com "R$" (nunca preço exato)');
      }
    } else {
      const c = p.comparison;
      if (!c || typeof c !== "object" || c.__invalidJson)
        e.push("comparison jsonb ausente/inválido");
      else {
        if (["produtos", "vencedor", "criterios"].some((k) => k in c))
          e.push("comparison com chaves em português (use products, winner_slug, criteria…)");
        const min = kind === "lista" ? 3 : 2;
        if (!Array.isArray(c.products) || c.products.length < min)
          e.push(`comparison.products precisa de ≥${min} itens`);
        else {
          if (!c.products.some((x) => x.product_slug === c.winner_slug))
            e.push("comparison.winner_slug não está em products[]");
          const win = c.products.find((x) => x.product_slug === c.winner_slug);
          if (win && Number(win.score) !== Number(p.product_score))
            e.push("product_score ≠ score do vencedor");
          for (const x of c.products)
            if (universeProducts.size && !universeProducts.has(x.product_slug))
              e.push(`comparison: produto "${x.product_slug}" não é produto ativo`);
          for (const x of c.products)
            if (!links.some((l) => base(l.href) === `/loja/${x.product_slug}`))
              e.push(`comparativo sem link /loja/${x.product_slug}`);
        }
        if (
          kind === "comparativo" &&
          !(c.table && Array.isArray(c.table.columns) && Array.isArray(c.table.rows))
        )
          e.push("comparison.table {columns, rows} obrigatória em comparativo");
        if (!Array.isArray(c.criteria) || !c.criteria.length) e.push("comparison.criteria vazio");
        if (/R\$\s?\d/.test(JSON.stringify(c))) e.push('comparison com "R$" (nunca preço exato)');
      }
    }
    for (const h of distinct)
      if (h.startsWith("/loja/") && universeProducts.size) {
        const pr = universeProducts.get(h.slice(6));
        if (pr && (!pr.review || typeof pr.review !== "object"))
          w.push(`produto sem review longa: ${h}`);
      }
  }
  return { e, w, words, links: links.length, distinct: distinct.size };
}

const AMAZON_IMG = /^https:\/\/m\.media-amazon\.com\//;

// Review longa de products.review (formato do review_gen.py / doc 05 §4.1).
function validateProductReview(r) {
  const e = [];
  if (!r || typeof r !== "object" || r.__invalidJson) return ["review jsonb inválido"];
  if (!(Number(r.nota) >= 0 && Number(r.nota) <= 10)) e.push("review.nota fora de 0-10");
  if (!Array.isArray(r.criterios) || r.criterios.length !== 5)
    e.push("review.criterios precisa de exatamente 5 itens {nome, nota}");
  else
    for (const c of r.criterios)
      if (!c || !String(c.nome || "").trim() || !(Number(c.nota) >= 0 && Number(c.nota) <= 10))
        e.push("review.criterios: item sem nome ou nota fora de 0-10");
  if (!Array.isArray(r.em_3_pontos) || r.em_3_pontos.length !== 3)
    e.push("review.em_3_pontos precisa de 3 frases");
  const secs = Array.isArray(r.secoes) ? r.secoes : [];
  if (secs.length < 6) e.push(`review.secoes com ${secs.length} seções (mínimo 6)`);
  if (secs.filter((x) => x && x.cta).length < 3) e.push("review.secoes: mínimo 3 com cta:true");
  for (const x of secs)
    if (
      !x ||
      !String(x.titulo || "").trim() ||
      !Array.isArray(x.paragrafos) ||
      !x.paragrafos.length
    )
      e.push("review.secoes: seção sem titulo/paragrafos");
  if (!Array.isArray(r.ficha) || r.ficha.length < 5) e.push("review.ficha com menos de 5 linhas");
  if (!Array.isArray(r.faq) || r.faq.length < 4) e.push("review.faq com menos de 4 itens");
  else
    for (const f of r.faq)
      if (!f || !String(f.q || "").trim() || !String(f.a || "").trim())
        e.push("review.faq: use {q, a} não vazios");
  for (const k of ["titulo", "resumo", "ideal_para", "preco_texto", "como_avaliamos", "opiniao"])
    if (!String(r[k] || "").trim()) e.push(`review.${k} vazio`);
  return e;
}

function validateProduct(pr) {
  const e = [];
  if (!pr.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pr.slug))
    e.push("slug ausente ou fora do padrão kebab-case");
  if (!pr.name || !String(pr.name).trim()) e.push("sem name");
  if (pr.asin != null && !/^[A-Z0-9]{10}$/.test(String(pr.asin)))
    e.push(`asin fora do padrão (10 caracteres A-Z/0-9): ${pr.asin}`);
  if (
    pr.category_slug != null &&
    productCategories.size &&
    !productCategories.has(pr.category_slug)
  )
    e.push(`product_category "${pr.category_slug}" não existe em product_categories`);
  if (pr.category_slug == null && pr.category_id == null) e.push("sem category_id");
  if (pr.subcategory != null && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(pr.subcategory)))
    e.push(`subcategory fora do padrão kebab-case: ${pr.subcategory}`);
  const pros = Array.isArray(pr.pros) ? pr.pros : null,
    cons = Array.isArray(pr.cons) ? pr.cons : null;
  if (!pros || !cons) e.push("pros/cons precisam ser arrays");
  else {
    if (pros.length < 3 || pros.length > 6) e.push(`pros com ${pros.length} itens (precisa 3-6)`);
    if (cons.length < 3 || cons.length > 6) e.push(`cons com ${cons.length} itens (precisa 3-6)`);
    for (const x of [...pros, ...cons])
      if (!String(x || "").trim()) e.push("pros/cons com item vazio");
  }
  if (pr.short_description != null && String(pr.short_description).length > 130)
    e.push(`short_description com ${String(pr.short_description).length} caracteres (máximo 130)`);
  const images = Array.isArray(pr.images) ? pr.images : pr.images == null ? [] : null;
  if (images === null) e.push("images precisa ser array jsonb");
  else {
    if (images.length > 8) e.push(`images com ${images.length} fotos (máximo 8)`);
    for (const u of images)
      if (!AMAZON_IMG.test(String(u)))
        e.push(`foto fora de m.media-amazon.com: ${String(u).slice(0, 60)}`);
    if (images.length && pr.image_url && images[0] !== pr.image_url)
      e.push("image_url deve ser images[0]");
  }
  if (pr.image_url && !/media-amazon\.com/.test(pr.image_url))
    e.push("image_url não é a foto oficial da Amazon (m.media-amazon.com)");
  const min = Number(pr.price_min),
    max = Number(pr.price_max);
  const hasRange = pr.price_min != null || pr.price_max != null;
  if (hasRange) {
    if (pr.price_min == null || pr.price_max == null)
      e.push("faixa incompleta: price_min e price_max");
    else {
      if (!(min > 0 && max > 0)) e.push("price_min/price_max precisam ser > 0");
      if (max < min) e.push("price_max < price_min");
      if (max > 3 * min) e.push(`price_max (${max}) > 3 × price_min (${min})`);
    }
  }
  if (pr.rating != null && !(Number(pr.rating) >= 0 && Number(pr.rating) <= 5))
    e.push("rating fora de 0-5");
  if (pr.affiliate_url && /amazon\.com\.br/i.test(pr.affiliate_url)) {
    const asin = (/\/dp\/([A-Z0-9]{10})/i.exec(pr.affiliate_url) || [])[1];
    if (asin && pr.asin && asin.toUpperCase() !== String(pr.asin).toUpperCase())
      e.push("asin diferente do ASIN do affiliate_url");
  }
  const blob = JSON.stringify({
    n: pr.name,
    d: pr.description,
    s: pr.short_description,
    r: pr.review,
    p: pr.pros,
    c: pr.cons,
  });
  if (/R\$\s?\d/.test(blob)) e.push('"R$" em texto do produto (nunca preço exato)');
  if (/ver pre[çc]o/i.test(blob)) e.push('texto "Ver preço" é proibido');
  const corpus = fold(blob);
  for (const [t, re] of PROIBIDOS_RE) if (re.test(corpus)) e.push(`termo proibido: "${t}"`);
  if (pr.review != null) e.push(...validateProductReview(pr.review));
  // Regras só para produto ativo (o que aparece na loja): faixa, link com ASIN e foto oficial.
  if (pr.active === false) return e;
  if (pr.price_min == null || pr.price_max == null)
    e.push("sem faixa de preço (price_min/price_max)");
  if (!pr.affiliate_url) e.push("sem affiliate_url");
  else if (!/amazon\.com\.br\/dp\/[A-Z0-9]{10}/i.test(pr.affiliate_url))
    e.push(
      "affiliate_url fora do padrão https://www.amazon.com.br/dp/<ASIN>/?tag=<PUBLIC_AMAZON_TAG>",
    );
  if (!pr.asin && !/\/dp\/[A-Z0-9]{10}/i.test(pr.affiliate_url || ""))
    e.push("produto ativo sem ASIN");
  if (!pr.image_url) e.push("sem image_url");
  if (images && images.length < 1) e.push("produto ativo sem fotos oficiais (images)");
  return e;
}

async function checkImages(p, e) {
  const urls = new Set();
  if (p.cover_image_url) urls.add(p.cover_image_url);
  walk(p.body, (n) => n.type === "image" && n.attrs?.src && urls.add(n.attrs.src));
  for (const u of urls) {
    if (!/^https?:\/\//.test(u)) continue;
    try {
      const r = await fetch(u, { method: "HEAD", redirect: "follow" });
      if (!r.ok || !/^image\//.test(r.headers.get("content-type") || ""))
        e.push(`imagem não responde 200/image: ${base(u).slice(0, 80)}`);
    } catch (err) {
      e.push(`imagem inacessível: ${base(u).slice(0, 80)} (${err.message})`);
    }
  }
}

// ---------------------------------------------------------------- execução
for (const w of warnings) console.log(`! ${w}`);
const dupes = new Map();
for (const p of posts) dupes.set(p.slug, (dupes.get(p.slug) || 0) + 1);
let failed = 0;
for (const p of posts) {
  const r = validatePost(p);
  if (dupes.get(p.slug) > 1) r.e.push("slug duplicado no conjunto validado");
  if (WANT_IMAGES) await checkImages(p, r.e);
  if (r.e.length) {
    failed++;
    console.log(`✗ ${p.kind} ${p.slug} [${p.__origin}]`);
    r.e.forEach((x) => console.log(`   - ${x}`));
  } else
    console.log(
      `✓ ${p.kind} ${p.slug} (${r.words} palavras, ${r.links} links internos, ${r.distinct} destinos distintos)`,
    );
  r.w.forEach((x) => console.log(`   ! ${x}`));
}
let pfailed = 0;
const toCheck = FILES_MODE ? products : WANT_PRODUCTS ? products : [];
for (const pr of toCheck) {
  const e = validateProduct(pr);
  if (e.length) {
    pfailed++;
    console.log(`✗ produto ${pr.slug || "?"} [${pr.__origin || "banco"}]`);
    e.forEach((x) => console.log(`   - ${x}`));
  } else console.log(`✓ produto ${pr.slug}`);
}
if (!posts.length && !toCheck.length)
  console.log(
    FILES_MODE ? "Nenhum post ou produto encontrado nos arquivos." : "Nenhum post no período.",
  );
console.log(
  `\n${posts.length - failed}/${posts.length} posts válidos${toCheck.length ? `, ${toCheck.length - pfailed}/${toCheck.length} produtos válidos` : ""}`,
);
process.exit(failed || pfailed ? 1 : 0);
