/**
 * "Validar Padrão A" no cliente: espelha as regras principais de
 * `scripts/validate-content.mjs` (semáforo, links internos, tabela, checklist,
 * "Continue lendo", FAQ/quiz, palavras e metadados) para o editor apontar o que
 * falta antes de publicar. A validação completa (slugs no banco, termos
 * proibidos, imagens) continua sendo a do script.
 */
import type { TipTapNode } from "@/lib/content";
import type { AdminFaqItem, AdminQuizItem, PostKind } from "./admin-db";

export interface PadraoAInput {
  kind: PostKind;
  title: string;
  slug: string;
  subtitle: string;
  excerpt: string;
  seo_title: string;
  seo_description: string;
  cover_image_url: string;
  cover_image_alt: string;
  category_id: string;
  body: TipTapNode | null | undefined;
  faq: AdminFaqItem[];
  quiz: AdminQuizItem[];
  /** Slugs publicados no banco (para checar links `/post/<slug>`). */
  knownSlugs?: string[];
}

export interface PadraoAResult {
  errors: string[];
  warnings: string[];
  words: number;
  links: number;
  distinct: number;
}

export const SEMAFORO = [
  ["ok", "Sinal verde: "],
  ["warn", "Sinal de atenção: "],
  ["bad", "Sinal de alerta: "],
] as const;

export const CHECKLIST_ULTIMO_ITEM = "Ficar atento aos sinais do semáforo acima";

const PROFISSIONAL_RE =
  /m[eé]dic|pediatra|obstetra|profissional|padre|advogad|contador|psic[oó]log|terapeuta|dentista|nutricionista|especialista|cardiologista|urologista|fisioterapeuta|hospital|pronto[- ]socorro|emerg[eê]ncia|samu|192|193/i;

const WORDS: Record<PostKind, [number, number]> = {
  artigo: [1200, 2200],
  noticia: [350, 600],
  review: [1000, 4000],
  comparativo: [1100, 4000],
  lista: [900, 4000],
};
const MIN_LINKS: Record<PostKind, number> = {
  artigo: 10,
  noticia: 5,
  review: 8,
  comparativo: 8,
  lista: 8,
};

type Link = { href: string; text: string };

export function walkNodes(n: TipTapNode | TipTapNode[] | undefined, f: (n: TipTapNode) => void) {
  if (Array.isArray(n)) n.forEach((x) => walkNodes(x, f));
  else if (n && typeof n === "object") {
    f(n);
    if (Array.isArray(n.content)) walkNodes(n.content, f);
  }
}

export function textOf(n: TipTapNode | TipTapNode[] | undefined): string {
  const t: string[] = [];
  walkNodes(n, (x) => {
    if (x.type === "text" && typeof x.text === "string") t.push(x.text);
  });
  return t.join(" ");
}

export function linkNodes(n: TipTapNode | undefined): Link[] {
  const out: Link[] = [];
  walkNodes(n, (x) => {
    const marks = (x as { marks?: { type: string; attrs?: Record<string, unknown> }[] }).marks;
    if (x.type === "text" && Array.isArray(marks))
      for (const m of marks)
        if (m.type === "link" && m.attrs?.href)
          out.push({ href: String(m.attrs.href), text: x.text ?? "" });
  });
  return out;
}

const internalLinks = (n: TipTapNode | undefined) =>
  linkNodes(n).filter((l) => l.href.startsWith("/"));
const base = (u: string) => u.split("?")[0]!.split("#")[0]!;
const wordsOf = (s: string) => s.split(/\s+/).filter(Boolean).length;
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export function validatePadraoA(p: PadraoAInput): PadraoAResult {
  const e: string[] = [];
  const w: string[] = [];
  const kind = p.kind || "artigo";
  const body = p.body;

  if (!p.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug))
    e.push("slug ausente ou fora do padrão kebab-case");
  if (!p.title.trim()) e.push("título vazio");

  if (!body || body.type !== "doc" || !Array.isArray(body.content) || !body.content.length) {
    e.push("corpo vazio");
    return { errors: e, warnings: w, words: 0, links: 0, distinct: 0 };
  }

  const text = textOf(body);
  const words = wordsOf(text);
  const [minW, maxW] = WORDS[kind] ?? WORDS.artigo;
  if (words < minW) e.push(`${words} palavras (mínimo ${minW})`);
  if (words > maxW) e.push(`${words} palavras (máximo ${maxW})`);

  // links internos
  const links = internalLinks(body);
  const distinct = new Set(links.map((l) => base(l.href)));
  const minL = MIN_LINKS[kind] ?? 8;
  if (links.length < minL) e.push(`${links.length} links internos (mínimo ${minL})`);
  if (links.length && distinct.size < Math.min(minL, 6))
    w.push(`só ${distinct.size} destinos distintos de link interno`);
  if (p.knownSlugs?.length) {
    const known = new Set(p.knownSlugs);
    for (const l of links) {
      const b = base(l.href);
      if (b.startsWith("/post/")) {
        const slug = b.slice("/post/".length);
        if (slug && slug !== p.slug && !known.has(slug)) e.push(`link para post inexistente: ${b}`);
      }
    }
  }
  for (const l of linkNodes(body))
    if (
      /^https?:\/\//.test(l.href) &&
      /amazon\./.test(l.href) &&
      !/^Comprar .*Amazon$/.test(l.text)
    )
      e.push(`link de afiliado com texto "${l.text}" (use "Comprar agora na Amazon")`);

  // preço exato
  const corpus = `${p.title} ${p.subtitle} ${p.excerpt} ${text} ${JSON.stringify(p.faq)} ${JSON.stringify(p.quiz)}`;
  if (/R\$\s?\d/.test(corpus))
    e.push('valor em reais ("R$ <número>") no texto, excerpt, faq ou quiz');

  // nós
  const cover = base(p.cover_image_url || "");
  walkNodes(body, (n) => {
    if (n.type === "heading" && ![2, 3].includes(Number(n.attrs?.level)))
      e.push(`heading nível ${String(n.attrs?.level)} (só 2 e 3)`);
    if ((n.type === "listItem" || n.type === "taskItem") && !textOf(n).trim())
      e.push(`${n.type} vazio`);
    if (n.type === "image") {
      const src = String(n.attrs?.src || "");
      if (!/^https?:\/\//.test(src) && !src.startsWith("/")) e.push("imagem com src inválido");
      if (cover && base(src) === cover) e.push("a capa está repetida no corpo (use outra foto)");
      if (!String(n.attrs?.alt || "").trim()) e.push("imagem sem alt descritivo");
    }
  });
  if (!p.cover_image_url.trim()) e.push("sem capa (cover_image_url)");
  if (!p.cover_image_alt.trim()) w.push("sem cover_image_alt (alt descritivo em PT-BR)");

  // semáforo
  const top = body.content;
  const callouts: TipTapNode[] = [];
  walkNodes(body, (n) => {
    if (n.type === "callout") callouts.push(n);
  });
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
        const [tone, prefix] = SEMAFORO[i]!;
        if (c.attrs?.tone !== tone)
          e.push(`callout ${i + 1} com tone "${String(c.attrs?.tone)}" (esperado "${tone}")`);
        if (!t.startsWith(prefix)) e.push(`callout ${i + 1} não começa com "${prefix}"`);
        if (linkNodes(c).length) e.push(`link dentro do callout ${i + 1}`);
        if (i === 2 && !PROFISSIONAL_RE.test(t))
          e.push(
            '"Sinal de alerta" sem orientação de procurar ajuda profissional (médico, padre, advogado, contador…)',
          );
      });
      const first = top.findIndex((n) => n.type === "callout");
      const idx = top.map((n) => n.type);
      if (first < 0 || idx.slice(first, first + 3).some((t) => t !== "callout"))
        e.push("os 3 callouts precisam ficar juntos, no nível raiz do corpo");
      const h = first > 0 ? top[first - 1] : null;
      if (!(h && h.type === "heading" && /^Sem[áa]foro do pai\b/i.test(textOf(h).trim())))
        e.push('falta o heading "Semáforo do pai: <tema>" logo antes dos callouts');
    }
  }

  // tabela, checklist (artigo)
  if (kind === "artigo") {
    const tables = top.filter((n) => n.type === "table");
    if (!tables.length) e.push("sem tabela");
    else if (!tables.some((t) => (t.content || []).length >= 2))
      e.push("tabela com menos de 2 linhas");
    const lists = top.map((n, i) => [n, i] as const).filter(([n]) => n.type === "taskList");
    if (!lists.length) e.push("sem checklist (taskList)");
    for (const [tl, i] of lists) {
      const items = (tl.content || []).filter((n) => n.type === "taskItem");
      if (items.length < 5 || items.length > 6)
        e.push(`checklist com ${items.length} itens (precisa 5 ou 6)`);
      if (items.length && textOf(items[items.length - 1]).trim() !== CHECKLIST_ULTIMO_ITEM)
        e.push(`último item do checklist deve ser "${CHECKLIST_ULTIMO_ITEM}"`);
      for (const it of items)
        if (/[.]$/.test(textOf(it).trim()))
          e.push(`item do checklist termina com ponto final: "${textOf(it).trim().slice(0, 40)}"`);
      if (items.some((it) => it.attrs?.checked)) e.push("item do checklist marcado (checked)");
      const h = top[i - 1];
      if (!(h && h.type === "heading" && /^Checklist do pai\b/i.test(textOf(h).trim())))
        e.push('falta o heading "Checklist do pai: <tema>" logo antes do checklist');
    }
  }

  // fechamento (artigo e notícia)
  if (kind === "artigo" || kind === "noticia") {
    const last = top[top.length - 1];
    const prev = top[top.length - 2];
    if (!(last && last.type === "paragraph" && textOf(last).startsWith("Continue lendo: ")))
      e.push('último parágrafo deve começar com "Continue lendo: "');
    else {
      const cl = internalLinks(last);
      if (cl.length < 4 || cl.length > 10)
        e.push(`"Continue lendo" com ${cl.length} links (precisa 4 a 10)`);
      if (!/\.$/.test(textOf(last).trim())) e.push('"Continue lendo" deve terminar em "."');
      const plain = (last.content || [])
        .filter(
          (n) =>
            n.type === "text" &&
            !((n as { marks?: { type: string }[] }).marks || []).some((m) => m.type === "link"),
        )
        .map((n) => n.text ?? "");
      if (plain.length > 2 && !plain.slice(1, -1).every((t) => t === ", " || t === " e "))
        e.push('"Continue lendo": separar os links com ", " e o último com " e "');
      if (plain.length > 2 && plain[plain.length - 2] !== " e ")
        e.push('"Continue lendo": o último link entra com " e "');
      if (!(prev && prev.type === "paragraph"))
        e.push("o parágrafo de fechamento (antes do Continue lendo) precisa ser um parágrafo");
      else if (linkNodes(prev).length) e.push("parágrafo de fechamento não pode ter links");
    }
    if (top[0]?.type !== "paragraph")
      e.push("abertura: o corpo deve começar com parágrafo (sem heading antes)");
  }

  // faq / quiz
  const faq = p.faq;
  const quiz = p.quiz;
  const faqOk =
    faq.length >= 3 &&
    faq.length <= 6 &&
    faq.every((f) => f && f.question.trim() && f.answer.trim());
  const quizOk =
    quiz.length >= 3 &&
    quiz.length <= 5 &&
    quiz.every(
      (q) =>
        q &&
        q.question.trim() &&
        Array.isArray(q.options) &&
        q.options.length >= 2 &&
        q.options.every((o) => String(o).trim()) &&
        typeof q.correct === "number" &&
        q.correct >= 0 &&
        q.correct < q.options.length &&
        String(q.explanation || "").trim(),
    );
  if (faq.length && !faqOk) e.push("FAQ inválido: 3-6 itens {question, answer} não vazios");
  if (quiz.length && !quizOk)
    e.push("quiz inválido: 3-5 itens {question, options[], correct, explanation}");
  if (!faqOk && !quizOk) e.push("precisa de FAQ (3-6) e/ou quiz (3-5)");

  // metadados
  if (p.excerpt.length > 160) e.push(`excerpt com ${p.excerpt.length} caracteres (máximo 160)`);
  if (!p.excerpt.trim()) e.push("excerpt vazio");
  if (p.seo_title.length > 60) e.push(`seo_title com ${p.seo_title.length} caracteres (máximo 60)`);
  if (!(p.seo_description.length >= 120 && p.seo_description.length <= 155))
    e.push(`seo_description com ${p.seo_description.length} caracteres (precisa 120-155)`);
  if (!p.subtitle.trim()) w.push("sem subtítulo");
  if (!p.category_id) e.push("sem categoria");
  if (p.title && fold(p.title) === fold(p.excerpt)) w.push("excerpt igual ao título");

  return { errors: e, warnings: w, words, links: links.length, distinct: distinct.size };
}
