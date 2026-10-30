#!/usr/bin/env node
// scripts/rotina/guard.mjs — pausa automática da rotina (doc 10 §13b-a).
// Uso: node scripts/rotina/guard.mjs /tmp/rotina-pai/validate.log '<json atual de rotina:status>' [--out guard_out.sql]
// Lê o log do validador (linhas "✗ <kind> <slug>" e "✓ <kind> <slug>"): cada slug que CONTINUA reprovado
// (último registro é ✗) soma 1 em falhas_seguidas; nenhum reprovado zera o contador; ao chegar a 3,
// rotina_pausada=true com o motivo. Grava guard_out.sql (INSERT ... ON CONFLICT em _tmp_post_staging, k='rotina:status').
// O dono libera com: update public._tmp_post_staging set data = '{"last_run":null,"falhas_seguidas":0,"rotina_pausada":false,"motivo":""}' where k='rotina:status';
import { readFileSync, writeFileSync } from "node:fs";

const [logPath, statusJson, ...rest] = process.argv.slice(2);
if (!logPath) {
  console.error(
    "uso: node scripts/rotina/guard.mjs <validate.log> '<json status atual>' [--out guard_out.sql]",
  );
  process.exit(2);
}
const outIdx = rest.indexOf("--out");
const outPath = outIdx >= 0 ? rest[outIdx + 1] : "guard_out.sql";

let status = { last_run: null, falhas_seguidas: 0, rotina_pausada: false, motivo: "" };
try {
  if (statusJson && statusJson.trim()) status = { ...status, ...JSON.parse(statusJson) };
} catch {
  console.error("aviso: json de status inválido; partindo de zero");
}

const last = new Map(); // slug -> "ok" | "bad" (último registro vence)
for (const line of readFileSync(logPath, "utf8").split(/\r?\n/)) {
  const m = /^\s*([✓✗])\s+\S+\s+([a-z0-9-]+)/u.exec(line);
  if (m) last.set(m[2], m[1] === "✓" ? "ok" : "bad");
}
const failing = [...last.entries()].filter(([, v]) => v === "bad").map(([s]) => s);

const hoje = new Date().toISOString().slice(0, 10);
const next = { ...status, last_run: hoje };
if (failing.length) {
  next.falhas_seguidas = Number(status.falhas_seguidas || 0) + failing.length;
} else {
  next.falhas_seguidas = 0;
}
if (next.falhas_seguidas >= 3 && !next.rotina_pausada) {
  next.rotina_pausada = true;
  next.motivo = `3+ reprovações seguidas do validador (${hoje}): ${failing.slice(0, 3).join(", ") || status.motivo}`;
}
const data = JSON.stringify(next);
const sql =
  `insert into public._tmp_post_staging (k, data) values ('rotina:status', $g$${data}$g$)\n` +
  `  on conflict (k) do update set data = excluded.data;\n`;
writeFileSync(outPath, sql);
console.log(
  `${failing.length} reprovado(s) hoje; falhas_seguidas=${next.falhas_seguidas}; rotina_pausada=${next.rotina_pausada} -> ${outPath}`,
);
if (failing.length) console.log("  reprovados: " + failing.join(", "));
process.exit(0);
