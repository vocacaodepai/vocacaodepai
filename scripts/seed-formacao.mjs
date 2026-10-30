#!/usr/bin/env node
// Gera supabase/migrations/0016_seed_formacao.sql a partir de supabase/seed/tracks.json e
// supabase/seed/challenges.json (doc 09 §5.3 e §6.1). Node 22, sem dependência.
//   node scripts/seed-formacao.mjs            # escreve a migration (upsert idempotente)
// O SQL é commitado E aplicado com mcp__Supabase__apply_migration (name: "0016_seed_formacao").
// Rodar de novo é seguro: `on conflict (slug)` / `(track_id, position)` / `(challenge_id, day)`.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tracksSeed = JSON.parse(readFileSync(join(root, "supabase/seed/tracks.json"), "utf8"));
const challengesSeed = JSON.parse(
  readFileSync(join(root, "supabase/seed/challenges.json"), "utf8"),
);
const OUT = join(root, "supabase/migrations/0016_seed_formacao.sql");

const q = (v) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const qjson = (v) => `$seed$${JSON.stringify(v)}$seed$::jsonb`;

/* ---------- Tiptap builders ---------- */
const text = (t) => ({ type: "text", text: t });
const p = (...parts) => ({
  type: "paragraph",
  content: parts.map((x) => (typeof x === "string" ? text(x) : x)),
});
const h2 = (t) => ({ type: "heading", attrs: { level: 2 }, content: [text(t)] });
const bullets = (items) => ({
  type: "bulletList",
  content: items.map((i) => ({ type: "listItem", content: [p(i)] })),
});
const tasks = (items) => ({
  type: "taskList",
  content: items.map((i) => ({ type: "taskItem", attrs: { checked: false }, content: [p(i)] })),
});
const callout = (tone, t) => ({ type: "callout", attrs: { tone }, content: [p(t)] });
const link = (t, href) => ({
  type: "text",
  text: t,
  marks: [{ type: "link", attrs: { href, class: null, rel: null, target: null } }],
});

/** Divide o resumo em itens (checklist): "a; b; c" ou "a, b, c". */
function itemsFromSummary(summary) {
  const main = summary.split(/\.\s(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/)[0].replace(/\.$/, "");
  const sep = main.includes(";") ? ";" : ",";
  return main
    .split(sep)
    .map((s) => s.trim().replace(/^(e|ou)\s+/i, ""))
    .filter((s) => s.length > 1)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

/** Semáforo do pai quando o resumo traz "(verde)", "(atenção)" e "(alerta: …)". */
function semaforoFromSummary(summary) {
  const m =
    /Semáforo[^:]*:\s*(.+?)\s*\(verde\),\s*(.+?)\s*\(atenção\),\s*(.+?)\s*\(alerta:\s*(.+?)\)/i.exec(
      summary,
    );
  if (!m) return [];
  return [
    h2("Semáforo do pai"),
    callout("ok", `Sinal verde: ${m[1]}. Faz parte da fase; siga acompanhando.`),
    callout(
      "warn",
      `Sinal de atenção: ${m[2]}. Converse com a esposa e ajuste a rotina nesta semana.`,
    ),
    callout(
      "bad",
      `Sinal de alerta: ${m[3]}. Não espere passar sozinho: procure ${m[4].replace(/\s*agora$/, "")} agora.`,
    ),
  ];
}

const INTRO_BY_TYPE = {
  leitura: "Leia com calma e, no fim, marque o passo como concluído.",
  artigo: "Abra o artigo indicado, leia até o fim e volte aqui para concluir o passo.",
  video:
    "Enquanto o vídeo não é gravado, este passo funciona como leitura: leia o resumo e o artigo indicado.",
  checklist:
    "Marque cada item conforme for resolvendo. O passo conclui quando todos estiverem marcados.",
  exercicio:
    "Este passo é prático: escreva no campo abaixo (mínimo de 80 caracteres). O que você escrever fica guardado no seu Caderno do Pai.",
};

/** Corpo real (sem lorem) a partir do resumo da tabela do doc 09 §5.2. */
function buildBody(track, step) {
  const [, , type, title, summary, , post] = step;
  const content = [];
  if (track.sao_jose) {
    const [leitura, acao] = summary.split(" · ");
    content.push(h2("Leitura"), p(leitura.trim()));
    content.push(
      p(
        "Medite por alguns minutos: o que, na vida de São José, ilumina o seu dia de hoje como marido, pai e trabalhador? Ele não deixou palavras escritas; deixou obediência, trabalho e silêncio. É esse o modelo.",
      ),
    );
    content.push(
      h2("Oração"),
      p(
        'Pai-Nosso. Depois: "A vós, São José, recorremos em nossa tribulação e, depois de implorar o auxílio de vossa santíssima Esposa, cheios de confiança solicitamos também o vosso patrocínio." Aos domingos, reze a Ladainha de São José.',
      ),
    );
    content.push(
      h2("Ação do dia"),
      p((acao ?? "Viva a leitura de hoje com um gesto concreto.").trim()),
    );
    content.push(p("Quando terminar a ação, marque o passo como concluído. Amanhã tem mais."));
    return { type: "doc", content };
  }
  content.push(p(summary));
  content.push(p(INTRO_BY_TYPE[type]));
  if (type === "checklist") {
    content.push(h2(`Checklist do pai: ${title.toLowerCase()}`), tasks(itemsFromSummary(summary)));
  } else if (type === "exercicio") {
    content.push(
      h2("O exercício"),
      p(
        "Não precisa ficar bonito; precisa ser verdadeiro. Escreva como quem fala com um irmão: o que aconteceu, o que você decidiu e qual o próximo passo.",
      ),
      p("Escreva abaixo."),
    );
  } else {
    const sem = semaforoFromSummary(summary);
    if (sem.length) content.push(...sem);
    content.push(
      h2("Na prática"),
      bullets([
        "Separe dez minutos sem celular para este passo.",
        "Anote uma coisa que você vai fazer diferente ainda hoje.",
        "Conte à sua esposa o que decidiu: compromisso dito em voz alta se cumpre mais.",
      ]),
    );
  }
  if (post) {
    content.push(p("Leitura relacionada: ", link("abrir o artigo no Blog", `/post/${post}`), "."));
  }
  if (type === "video")
    content.push(
      p("Quando o vídeo existir, ele aparece aqui e o passo conclui após 60% assistidos."),
    );
  content.push(p("Marque o passo e siga para o próximo. Um passo por dia já é formação."));
  return { type: "doc", content };
}

function dayTitle(task) {
  const base = task.split(/[(:;]/)[0].trim().replace(/[.,]$/, "");
  return base.length > 64 ? `${base.slice(0, 61).trim()}…` : base;
}

/* ---------- SQL ---------- */
const lines = [
  "-- 0016_seed_formacao.sql — seeds da Formação (doc 09 §5.2, §6.2 e §8): 8 trilhas (107 passos), 3 desafios",
  "-- de 30 dias e 2 eventos de exemplo em draft. GERADO por scripts/seed-formacao.mjs a partir de",
  "-- supabase/seed/tracks.json e supabase/seed/challenges.json — editar os JSON, não este arquivo.",
  "-- Idempotente (upsert). post_id é resolvido pelo slug publicado; se não existir, fica nulo.",
  "",
];

for (const t of tracksSeed.tracks) {
  lines.push(`-- ===== trilha ${t.slug} =====`);
  lines.push(
    `insert into public.tracks (slug, title, description, cover_image_url, level, estimated_minutes, estimated_days, audience, pillar, is_premium, outcomes, status, sort_order)
values (${q(t.slug)}, ${q(t.title)}, ${q(t.description)}, ${q(t.cover_image_url)}, ${q(t.level)}, ${t.estimated_minutes ?? "null"}, ${t.estimated_days ?? "null"}, ${q(t.audience)}, ${q(t.pillar)}, ${t.is_premium ? "true" : "false"}, ${qjson(t.outcomes ?? [])}, ${q(t.status ?? "published")}, ${t.sort_order ?? 0})
on conflict (slug) do update set title = excluded.title, description = excluded.description,
  cover_image_url = coalesce(public.tracks.cover_image_url, excluded.cover_image_url), level = excluded.level,
  estimated_minutes = excluded.estimated_minutes, estimated_days = excluded.estimated_days, audience = excluded.audience,
  pillar = excluded.pillar, is_premium = excluded.is_premium, outcomes = excluded.outcomes, status = excluded.status,
  sort_order = excluded.sort_order, updated_at = now();`,
  );
  for (const s of t.steps) {
    const [position, module, type, title, summary, rule, post, minutes] = s;
    const body = s.body ?? buildBody(t, s);
    lines.push(
      `insert into public.track_steps (track_id, position, module, type, title, summary, completion_rule, related_post_slug, video_url, estimated_minutes, body, post_id)
select t.id, ${position}, ${q(module)}, ${q(type)}, ${q(title)}, ${q(summary)}, ${q(rule)}, ${q(post)}, null, ${minutes ?? (type === "exercicio" ? 15 : 10)}, ${qjson(body)},
  (select p.id from public.posts p where p.slug = ${q(post ?? "")} and p.status = 'published' limit 1)
from public.tracks t where t.slug = ${q(t.slug)}
on conflict (track_id, position) do update set module = excluded.module, type = excluded.type, title = excluded.title,
  summary = excluded.summary, completion_rule = excluded.completion_rule, related_post_slug = excluded.related_post_slug,
  video_url = coalesce(public.track_steps.video_url, excluded.video_url), estimated_minutes = excluded.estimated_minutes,
  body = excluded.body, post_id = coalesce(excluded.post_id, public.track_steps.post_id);`,
    );
  }
  lines.push("");
}

for (const c of challengesSeed.challenges) {
  lines.push(`-- ===== desafio ${c.slug} =====`);
  lines.push(
    `insert into public.challenges (slug, title, description, cover_image_url, days, pillar, badge_slug, is_premium, status, sort_order)
values (${q(c.slug)}, ${q(c.title)}, ${q(c.description)}, ${q(c.cover_image_url)}, ${c.days}, ${q(c.pillar)}, ${q(c.badge_slug)}, false, ${q(c.status ?? "published")}, ${c.sort_order ?? 0})
on conflict (slug) do update set title = excluded.title, description = excluded.description,
  cover_image_url = coalesce(public.challenges.cover_image_url, excluded.cover_image_url), days = excluded.days,
  pillar = excluded.pillar, badge_slug = excluded.badge_slug, status = excluded.status, sort_order = excluded.sort_order, updated_at = now();`,
  );
  for (const [day, task, reflection] of c.days_list) {
    lines.push(
      `insert into public.challenge_days (challenge_id, day, title, task, reflection, body)
select c.id, ${day}, ${q(dayTitle(task))}, ${q(task)}, ${q(reflection)}, null from public.challenges c where c.slug = ${q(c.slug)}
on conflict (challenge_id, day) do update set title = excluded.title, task = excluded.task, reflection = excluded.reflection;`,
    );
  }
  lines.push("");
}

lines.push("-- ===== eventos de exemplo (draft: o dono publica em /admin/eventos) =====");
for (const e of challengesSeed.events ?? []) {
  lines.push(
    `insert into public.events (slug, title, description, starts_at, ends_at, mode, kind, city, uf, address, url, organizer, price_text, cover_image_url, capacity, status)
values (${q(e.slug)}, ${q(e.title)}, ${q(e.description)}, ${q(e.starts_at)}, ${q(e.ends_at)}, ${q(e.mode)}, ${q(e.kind)}, ${q(e.city)}, ${q(e.uf)}, ${q(e.address)}, ${q(e.url)}, ${q(e.organizer)}, ${q(e.price_text)}, ${q(e.cover_image_url)}, ${e.capacity ?? "null"}, ${q(e.status ?? "draft")})
on conflict (slug) do update set title = excluded.title, description = excluded.description, starts_at = excluded.starts_at,
  ends_at = excluded.ends_at, mode = excluded.mode, kind = excluded.kind, city = excluded.city, uf = excluded.uf, address = excluded.address,
  url = excluded.url, organizer = excluded.organizer, price_text = excluded.price_text, capacity = excluded.capacity, updated_at = now();`,
  );
}

writeFileSync(OUT, lines.join("\n") + "\n");
const nSteps = tracksSeed.tracks.reduce((a, t) => a + t.steps.length, 0);
const nDays = challengesSeed.challenges.reduce((a, c) => a + c.days_list.length, 0);
console.log(
  `ok: ${tracksSeed.tracks.length} trilhas, ${nSteps} passos, ${challengesSeed.challenges.length} desafios, ${nDays} dias, ${(challengesSeed.events ?? []).length} eventos → ${OUT}`,
);
