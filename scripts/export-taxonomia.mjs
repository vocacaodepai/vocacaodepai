#!/usr/bin/env node
// scripts/export-taxonomia.mjs — gera scripts/lib/taxonomia.json e scripts/lib/criterios.json a partir de
// src/lib/pai-indica/taxonomia.ts e criterios.ts (doc 04 §11), para o validador (Node puro) e a rotina (Python)
// lerem a MESMA fonte. Commitar os JSON; o CI confere com `git diff --exit-code scripts/lib`.
// Uso: node scripts/export-taxonomia.mjs   (npm run taxonomia:json)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const taxTs = read("src/lib/pai-indica/taxonomia.ts");
const categories = [
  ...taxTs.matchAll(/\{\s*slug:\s*"([a-z0-9-]+)",\s*name:\s*"([^"]+)"\s*\}/g),
].map((m) => ({ slug: m[1], name: m[2] }));
const subcategories = [
  ...taxTs.matchAll(
    /\{\s*slug:\s*"([a-z0-9-]+)",\s*name:\s*"([^"]+)",\s*category:\s*"([a-z0-9-]+)"\s*\}/g,
  ),
].map((m) => ({ slug: m[1], name: m[2], category: m[3] }));

const critTs = read("src/lib/pai-indica/criterios.ts");
const body = critTs.slice(
  critTs.indexOf("criteriaByCategory"),
  critTs.indexOf("export function criteriaFor"),
);
const criterios = {};
for (const m of body.matchAll(/^\s{2}"?([a-z0-9-]+)"?:\s*\[([\s\S]*?)^\s{2}\],/gm)) {
  criterios[m[1]] = [...m[2].matchAll(/\{\s*name:\s*"([^"]+)",\s*weight:\s*(\d+)\s*\}/g)].map(
    (c) => ({
      name: c[1],
      weight: Number(c[2]),
    }),
  );
}

const errs = [];
if (categories.length !== 10) errs.push(`esperava 10 categorias, achei ${categories.length}`);
for (const c of categories) {
  const n = subcategories.filter((s) => s.category === c.slug).length;
  if (n < 6 || n > 10) errs.push(`${c.slug}: ${n} subcategorias (precisa 6 a 10)`);
  const k = criterios[c.slug];
  if (!k || k.length !== 5) errs.push(`${c.slug}: critérios ≠ 5`);
  else if (k.reduce((s, x) => s + x.weight, 0) !== 100) errs.push(`${c.slug}: pesos não somam 100`);
}
for (const s of subcategories)
  if (!categories.some((c) => c.slug === s.category))
    errs.push(`subcategoria ${s.slug} com categoria inexistente`);
if (errs.length) {
  errs.forEach((e) => console.error(`✗ ${e}`));
  process.exit(1);
}
mkdirSync(join(ROOT, "scripts", "lib"), { recursive: true });
writeFileSync(
  join(ROOT, "scripts/lib/taxonomia.json"),
  JSON.stringify({ categories, subcategories }, null, 2) + "\n",
);
writeFileSync(join(ROOT, "scripts/lib/criterios.json"), JSON.stringify(criterios, null, 2) + "\n");
console.log(
  `✓ ${categories.length} categorias, ${subcategories.length} subcategorias, ${Object.keys(criterios).length} conjuntos de critérios`,
);
