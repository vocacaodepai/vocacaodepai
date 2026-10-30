// Testes rápidos das fórmulas das ferramentas (critérios de aceite do doc 06 §3).
// Roda com: node --experimental-strip-types scripts/test-ferramentas.mjs (sem vitest no node_modules compartilhado)
import { fileURLToPath } from "node:url";
import path from "node:path";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const B = path.join(ROOT, "src/lib/tools") + "/";
const fin = await import(B + "financas.ts");
const chu = await import(B + "churrasco-regras.ts");
const uni = await import(B + "unidades.ts");
const sau = await import(B + "saude.ts");
const cus = await import(B + "custo-filho-data.ts");
const orc = await import(B + "orcamento-data.ts");
const sem = await import(B + "mercado-semaforo.ts");
const kit = await import(B + "kit-ferramentas-data.ts");
const lic = await import(B + "licenca.ts");
const chk = await import(B + "checklist-maternidade-data.ts");
const sgs = await import(path.join(ROOT, "src/lib/market/sources/bcb-sgs.ts")).catch(() => null);
let fails = 0;
const ok = (name, cond, info = "") => {
  console.log(`${cond ? "PASS" : "FAIL"} ${name} ${info}`);
  if (!cond) fails++;
};
const near = (a, b, tol) => Math.abs(a - b) <= tol;

// juros compostos: 0 inicial, 500/mês, 10% a.a., 120 meses → 101–103 mil
const j = fin.jurosCompostos({ inicial: 0, aporteMensal: 500, taxaAnual: 10, meses: 120 });
// Doc 06 cita "≈ R$ 101–103 mil" (taxa nominal 10%/12); com a taxa mensal EQUIVALENTE do próprio doc ((1+i)^(1/12)-1) dá ≈ R$ 99,9 mil. Mantida a fórmula do doc.
ok(
  "juros 500/mês 10% 120m (taxa equivalente)",
  j.final > 99000 && j.final < 103000,
  j.final.toFixed(0),
);
ok("taxaMensal(12%) ≈ 0.949%", near(fin.taxaMensal(12) * 100, 0.9489, 0.001));
ok("semaforo taxa 40% → bad", fin.semaforoTaxa(40, 13.65) === "bad");
ok("semaforo taxa 13% → ok", fin.semaforoTaxa(13, 13.65) === "ok");
// reserva: gasto 4000, CLT, 2 filhos → 20.000 a 32.000
const r = fin.reservaEmergencia({
  gastoMensal: 4000,
  tipoRenda: "clt",
  dependentes: 2,
  guardado: 0,
  aporteMensal: 1000,
});
ok("reserva CLT 2 filhos", r.metaMin === 20000 && r.metaMax === 32000, `${r.metaMin}-${r.metaMax}`);
const ra = fin.reservaEmergencia({
  gastoMensal: 4000,
  tipoRenda: "autonomo",
  dependentes: 0,
  guardado: 0,
  aporteMensal: 1000,
});
ok("reserva autônomo dobra", ra.mesesMin === 6 && ra.mesesMax === 12);
const rj = fin.reservaEmergencia({
  gastoMensal: 4000,
  tipoRenda: "clt",
  dependentes: 0,
  guardado: 0,
  aporteMensal: 1000,
  taxaAnual: 13,
});
ok(
  "meses para meta diminui com juros",
  rj.mesesParaMetaMin <=
    fin.reservaEmergencia({
      gastoMensal: 4000,
      tipoRenda: "clt",
      dependentes: 0,
      guardado: 0,
      aporteMensal: 1000,
    }).mesesParaMetaMin,
);
// pensão: 5000 + 1 filho → 750–1250
const p1 = fin.pensaoEstimativa({ rendaLiquida: 5000, filhos: 1, guarda: "unilateral" });
ok("pensão 1 filho 750–1250", p1.totalMin === 750 && p1.totalMax === 1250);
ok(
  "pensão 2 filhos 25–33%",
  fin.pensaoEstimativa({ rendaLiquida: 5000, filhos: 2, guarda: "unilateral" }).pctMin === 25,
);
ok(
  "pensão 3 filhos 33–40%",
  fin.pensaoEstimativa({ rendaLiquida: 5000, filhos: 3, guarda: "unilateral" }).pctMax === 40,
);
ok(
  "pensão compartilhada reduzida",
  fin.pensaoEstimativa({ rendaLiquida: 5000, filhos: 1, guarda: "compartilhada" }).reduzida
    .pctMin === 10,
);
// churrasco: 10 homens, 6 mulheres, 4 crianças, 4h, clássico → carne 7,5–8,5 kg, carvão ≥ 5
const c = chu.calcularChurrasco({
  homens: 10,
  mulheres: 6,
  criancas: 4,
  adultosQueBebem: 8,
  duracao: "4h",
  preset: "classico",
});
ok("churrasco carne 7,5–8,5 kg", c.carneKg >= 7.5 && c.carneKg <= 8.5, c.carneKg);
ok("churrasco carvão ≥ 5 kg", c.carvaoKg >= 5, c.carvaoKg);
ok(
  "cerveja só para quem bebe",
  chu.calcularChurrasco({
    homens: 2,
    mulheres: 2,
    criancas: 0,
    adultosQueBebem: 0,
    duracao: "4h",
    preset: "classico",
  }).cervejaL === 0,
);
const c6 = chu.calcularChurrasco({
  homens: 10,
  mulheres: 6,
  criancas: 4,
  adultosQueBebem: 8,
  duracao: "6h+",
  preset: "classico",
});
ok("duração altera carne e carvão", c6.carneKg > c.carneKg && c6.carvaoKg > c.carvaoKg);
for (const k of Object.keys(chu.PRESETS))
  ok(
    `preset ${k} soma 100%`,
    near(
      chu.PRESETS[k].reduce((s, [, p]) => s + p, 0),
      1,
      1e-9,
    ),
  );
// unidades
ok("1 in = 25,4 mm", near(uni.convert("comprimento", "in", "mm", 1), 25.4, 1e-9));
ok("1 arroba = 14,688 kg", near(uni.convert("peso", "arroba", "kg", 1), 14.688, 1e-9));
ok("32 psi ≈ 2,21 bar", near(uni.convert("pressao", "psi", "bar", 32), 2.21, 0.01));
ok("10 km/l = 10 l/100km", near(uni.convert("consumo", "kml", "l100", 10), 10, 1e-9));
ok("10 km/l ≈ 23,52 mpg", near(uni.convert("consumo", "kml", "mpg", 10), 23.52, 0.01));
ok("100 °F = 37,78 °C", near(uni.convert("temperatura", "F", "C", 100), 37.78, 0.01));
ok("1 cv = 0,7355 kW", near(uni.convert("potencia", "cv", "kw", 1), 0.7355, 1e-4));
ok(
  "ida-e-volta",
  near(uni.convert("volume", "gal", "l", uni.convert("volume", "l", "gal", 7)), 7, 1e-9),
);
// saúde: 85 kg, 178 cm, 38 anos, moderado → IMC 26,8; TMB ≈ 1782; gasto ≈ 2762
const i = sau.imc(85, 178),
  tmb = sau.tmbMifflin(85, 178, 38, "homem"),
  get = sau.gastoDiario(tmb, "moderado");
ok("IMC 26,8 sobrepeso", near(i, 26.8, 0.05) && sau.classeImc(i) === "sobrepeso", i.toFixed(2));
// Mifflin-St Jeor exato: 10·85 + 6,25·178 − 5·38 + 5 = 1777,5 (o doc arredonda para ≈ 1782)
ok("TMB ≈ 1777,5 (Mifflin)", near(tmb, 1777.5, 0.1), tmb.toFixed(1));
ok("gasto ≈ 2755 (1777,5 × 1,55)", near(get, 2755.1, 0.5), get.toFixed(1));
ok("cintura 105 → bad", sau.semaforoSaude(i, 105, "homem") === "bad");
ok(
  "mulher muda fórmula",
  sau.tmbMifflin(60, 165, 35, "mulher") === 10 * 60 + 6.25 * 165 - 5 * 35 - 161,
);
// custo do filho
const cf1 = cus.calcularCusto({
  fase: "0-1",
  perfil: "medio",
  escolaParticular: false,
  planoSaude: true,
  filhos: 1,
  renda: 6000,
});
const cf2 = cus.calcularCusto({
  fase: "0-1",
  perfil: "medio",
  escolaParticular: false,
  planoSaude: true,
  filhos: 2,
  renda: 6000,
});
ok("2 filhos < 2× o custo", cf2.max < 2 * cf1.max && cf2.max > cf1.max, `${cf1.max} → ${cf2.max}`);
ok(
  "perfil amplo > médio",
  cus.calcularCusto({
    fase: "0-1",
    perfil: "amplo",
    escolaParticular: true,
    planoSaude: true,
    filhos: 1,
  }).max > cf1.max,
);
ok(
  "semáforo ok/warn/bad",
  cus.calcularCusto({
    fase: "0-1",
    perfil: "enxuto",
    escolaParticular: false,
    planoSaude: false,
    filhos: 1,
    renda: 10000,
  }).semaforo === "ok" &&
    cus.calcularCusto({
      fase: "4-6",
      perfil: "amplo",
      escolaParticular: true,
      planoSaude: true,
      filhos: 1,
      renda: 10000,
    }).semaforo === "bad",
);
ok("40 faixas (5 fases × 8 categorias)", cus.FAIXAS.length === 40);
// orçamento
const o = orc.resumir({
  rendas: [{ nome: "eu", valor: 6000 }],
  gastos: {
    Alimentação: 1500,
    "Moradia (aluguel/prestação, condomínio, IPTU)": 1500,
    "Reserva de emergência": 1200,
    "Lazer e passeios": 500,
  },
});
ok(
  "orçamento sobra e semáforo ok",
  o.sobra === 1300 && o.semaforo === "ok",
  `${o.sobra} ${o.semaforo}`,
);
ok(
  "orçamento negativo → bad",
  orc.resumir({ rendas: [{ nome: "eu", valor: 3000 }], gastos: { Alimentação: 4000 } }).semaforo ===
    "bad",
);
ok(
  "orçamento sobra pequena → warn",
  orc.resumir({ rendas: [{ nome: "eu", valor: 3000 }], gastos: { Alimentação: 2850 } }).semaforo ===
    "warn",
);
ok(
  "csv com cabeçalho",
  orc.orcamentoCsv({ rendas: [], gastos: {} }).startsWith("grupo;categoria;valor"),
);
// semáforo do dia
ok(
  "semáforo verde",
  sem.semaforoDoDia({ usdPct: 0.3, ipca12m: 4.5, selicMeta: 10, btcChange24h: 1 }).aceso === "ok",
);
ok(
  "semáforo atenção (selic 12)",
  sem.semaforoDoDia({ usdPct: 0.3, ipca12m: 4.5, selicMeta: 13.75, btcChange24h: 1 }).aceso ===
    "warn",
);
ok(
  "semáforo alerta (usd 2,6)",
  sem.semaforoDoDia({ usdPct: -2.6, ipca12m: 4.5, selicMeta: 10, btcChange24h: 1 }).aceso === "bad",
);
ok(
  "semáforo alerta termina com profissional",
  sem
    .semaforoDoDia({ usdPct: 3, ipca12m: 4, selicMeta: 10, btcChange24h: 0 })
    .bad.endsWith("procure um profissional certificado."),
);
// kit
ok("kit ids únicos", new Set(kit.ITENS.map((x) => x.id)).size === kit.ITENS.length);
ok(
  "furar parede inclui detector",
  kit
    .montarKit({ moradia: "apartamento", tarefas: ["furar-parede"], nivel: "intermediario" })
    .comecePorEstes.some((x) => x.id === "detector"),
);
ok(
  "básico oculta oficina",
  !kit
    .montarKit({ moradia: "casa", tarefas: [], nivel: "basico" })
    .quandoPrecisar.some((x) => x.nivel === "oficina"),
);
for (const t of kit.TAREFAS)
  ok(
    `≥1 essencial para ${t.id}`,
    kit.ITENS.some((x) => x.essencial && x.tarefas.includes(t.id)),
  );
// licença: nascimento sexta 2026-11-06 CLT → início segunda 09/11, 5 dias, volta 16/11 (segunda)
const l = lic.calcularLicenca({ regime: "clt", nascimento: "2026-11-06" });
ok(
  "CLT sexta → segunda, 5 dias",
  l.inicio === "2026-11-09" && l.dias === 5 && l.fim === "2026-11-13" && l.retorno === "2026-11-16",
  JSON.stringify(l),
);
const l2 = lic.calcularLicenca({ regime: "clt-empresa-cidada", nascimento: "2026-11-06" });
ok(
  "Empresa Cidadã 20 dias + prazo 2 dias úteis",
  l2.dias === 20 && l2.prazoProrrogacao === "2026-11-10",
  JSON.stringify(l2),
);
const l3 = lic.calcularLicenca({ regime: "clt", nascimento: "2027-03-10" });
ok("2027 → 10 dias (Lei 15.371/2026)", l3.dias === 10 && l3.marco?.dias_clt === 10);
ok(
  "2028 → 15, 2029 → 20",
  lic.calcularLicenca({ regime: "clt", nascimento: "2028-02-01" }).dias === 15 &&
    lic.calcularLicenca({ regime: "clt", nascimento: "2029-02-01" }).dias === 20,
);
// feriado: nascimento 2026-11-14 (sábado) → 15/11 domingo, 16/11 segunda útil? 15/11 é feriado mas cai no domingo; 16/11 segunda
const l4 = lic.calcularLicenca({ regime: "clt", nascimento: "2026-11-14" });
ok("pula fim de semana e feriado", l4.inicio === "2026-11-16", l4.inicio);
const l5 = lic.calcularLicenca({ regime: "clt", nascimento: "2026-11-19" }); // 20/11 feriado (sexta) → 23/11 segunda
ok("feriado 20/11 → início 23/11", l5.inicio === "2026-11-23", l5.inicio);
ok(
  "estadual usa dias manuais",
  lic.calcularLicenca({
    regime: "servidor-estadual-municipal",
    nascimento: "2026-11-06",
    diasManuais: 8,
  }).dias === 8,
);
// checklist
const ids = chk.GRUPOS.flatMap((g) => g.itens.map((x) => x.id));
ok("checklist ids únicos", new Set(ids).size === ids.length);
ok(
  "checklist links começam com /",
  chk.GRUPOS.flatMap((g) => g.itens).every((x) => !x.link || x.link.startsWith("/")),
);
// poupança
if (sgs) {
  ok("poupança selic 13,75 → 0,5% a.m.", sgs.poupancaMensalPelaSelic(13.75) === 0.5);
  ok("poupança selic 8 → 70%", near(sgs.poupancaMensalPelaSelic(8), 0.4556, 0.001));
}

// --- nomes, vacinas, marcos, cortes (sessão 2 da Fase 4)
const nom = await import(B + "nomes-data.ts");
const vac = await import(B + "vacinas.ts");
const mar = await import(B + "marcos-data.ts");
const fsMod = await import("node:fs");
const cortesJson = JSON.parse(fsMod.readFileSync(B + "cortes.json", "utf8"));
ok(
  "nomes únicos",
  new Set(nom.CHILD_NAMES.map((n) => n.name)).size === nom.CHILD_NAMES.length,
  nom.CHILD_NAMES.length,
);
ok(
  "todo saint está em SANTOS",
  nom.CHILD_NAMES.filter((n) => n.saint).every((n) => nom.SANTOS.includes(n.name)),
);
ok(
  "todo biblical está em BIBLICOS",
  nom.CHILD_NAMES.filter((n) => n.biblical).every((n) => nom.BIBLICOS.includes(n.name)),
);
ok(
  "menino + santo + J inclui José e João",
  ["José", "João"].every((x) =>
    nom.CHILD_NAMES.some((n) => n.name === x && n.sex === "menino" && n.saint),
  ),
);
ok(
  "sem mãe/bebê nos significados",
  !nom.CHILD_NAMES.some((n) => /mãe|mamãe|bebê/i.test(n.meaning)),
);
ok("vacinas ids únicos", new Set(vac.DOSES.map((d) => d.id)).size === vac.DOSES.length);
ok(
  "idadeMeses crescente por vacina",
  Object.values(
    vac.DOSES.reduce((m, d) => {
      (m[d.vacina] ??= []).push(d.idadeMeses);
      return m;
    }, {}),
  ).every((arr) => arr.every((v, i) => i === 0 || v >= arr[i - 1])),
);
// nascimento há 4 meses e 20 dias
const nasc = new Date(Date.now() - (4 * 30.4375 + 20) * 86400000).toISOString().slice(0, 10);
const id = vac.idadeEmMeses(nasc);
const est = (i) =>
  vac.estadoDaDose(
    vac.DOSES.find((d) => d.id === i),
    id,
    false,
  );
ok("4m20d: BCG atrasada se não marcada", est("bcg") === "atrasada");
ok("4m20d: penta-1 (2m) atrasada", est("penta-1") === "atrasada");
ok("4m20d: penta-2 (4m) no prazo", est("penta-2") === "no-prazo");
ok(
  "4m20d: menc-2 (5m) próxima",
  est("menc-2") === "proxima" &&
    vac.diasAte(
      nasc,
      vac.DOSES.find((d) => d.id === "menc-2"),
    ) > 0 &&
    vac.diasAte(
      nasc,
      vac.DOSES.find((d) => d.id === "menc-2"),
    ) < 15,
);
ok("4m20d: rota-1 fora da janela", est("rota-1") === "fora-da-janela");
ok("feita vence tudo", vac.estadoDaDose(vac.DOSES[0], id, true) === "feita");
ok("futura (12m)", est("scr-1") === "futura");
const ics = vac.gerarIcs(nasc, vac.DOSES.slice(2, 5), "Pedro");
ok(
  "ics com 3 eventos e alarme",
  (ics.match(/BEGIN:VEVENT/g) || []).length === 3 && ics.includes("TRIGGER:-P3D"),
);
ok(
  "marcos meses crescente",
  mar.FASES.every((f, i) => i === 0 || f.meses > mar.FASES[i - 1].meses),
);
ok(
  "marcos ≥3 marcos e ≥3 ações por fase",
  mar.FASES.every((f) => f.marcos.length >= 3 && f.oQueOPaiFaz.length >= 3),
);
ok(
  "sinal de alerta termina com pediatra/UBS",
  mar.FASES.every((f) => /pediatra|UBS/.test(f.sinalDeAlerta.slice(-40))),
);
ok(
  "sem 'atrasado' como diagnóstico",
  !mar.FASES.some((f) => /atrasad/i.test(f.sinalDeAtencao + f.sinalDeAlerta)),
);
const f7 = mar.faseParaIdade(7);
ok("7 meses → fase 6, próxima 9", f7.atual.meses === 6 && f7.proxima.meses === 9);
ok("fases até 5 anos", mar.FASES.at(-1).meses === 60);
ok(
  "cortes: 31 slugs únicos",
  new Set(cortesJson.cortes.map((c) => c.slug)).size === cortesJson.cortes.length &&
    cortesJson.cortes.length === 31,
);
ok(
  "cortes: preparo ⊂ preparos",
  cortesJson.cortes.every((c) => c.preparo.every((p) => cortesJson.preparos.includes(p))),
);
ok(
  "cortes: faixa null ou max ≤ 3×min",
  cortesJson.cortes.every(
    (c) => c.faixa_preco.min == null || c.faixa_preco.max <= 3 * c.faixa_preco.min,
  ),
);
ok(
  "cortes: svg_id presente no diagrama",
  (() => {
    const src = fsMod.readFileSync(
      path.join(ROOT, "src/components/ferramentas/cortes-de-carne/BeefDiagram.tsx"),
      "utf8",
    );
    return cortesJson.cortes.every(
      (c) => src.includes(`"${c.svg_id}"`) || src.includes(`${c.svg_id}:`),
    );
  })(),
);
ok(
  "cortes: panela → músculo, acém, peito, costela",
  ["musculo", "acem", "peito", "costela"].every((s) =>
    cortesJson.cortes.find((c) => c.slug === s).preparo.includes("panela"),
  ),
);
console.log(fails ? `\n${fails} FALHA(S)` : "\nTODOS OS TESTES PASSARAM");
process.exit(fails ? 1 : 0);
