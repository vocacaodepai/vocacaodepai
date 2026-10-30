import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ATUALIZADO_EM, DOMINIOS, FASES, FONTE, faseParaIdade } from "@/lib/tools/marcos-data";
import { idadeEmMeses } from "@/lib/tools/vacinas";
import { parseBRNumber } from "@/lib/tools/format";
import { usePersisted } from "@/hooks/usePersisted";
import { NumberField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/router-compat";

export default function DevelopmentMilestones() {
  const [nasc, setNasc] = useState("");
  const [mesesTxt, setMesesTxt] = useState("");
  const [idx, setIdx] = useState<number | null>(null);
  const [vistos, setVistos] = usePersisted<string[]>("vdp:tool:marcos-do-desenvolvimento", []);
  const idade = /^\d{4}-\d{2}-\d{2}$/.test(nasc) ? idadeEmMeses(nasc) : parseBRNumber(mesesTxt);
  const temIdade = Number.isFinite(idade) && idade >= 0;
  const calc = useMemo(() => faseParaIdade(temIdade ? idade : 0), [idade, temIdade]);
  const i = idx ?? FASES.indexOf(calc.atual);
  const fase = FASES[i];
  const anterior = FASES[i - 1] ?? null;
  const proxima = FASES[i + 1] ?? null;
  const key = (m: string) => `${fase.meses}:${m}`;
  const toggle = (m: string) =>
    setVistos((p) => (p.includes(key(m)) ? p.filter((x) => x !== key(m)) : [...p, key(m)]));
  const vistosFase = fase.marcos.filter((m) => vistos.includes(key(m.texto))).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Label htmlFor="nasc">Data de nascimento</Label>
          <Input
            id="nasc"
            type="date"
            value={nasc}
            onChange={(e) => {
              setNasc(e.target.value);
              setIdx(null);
            }}
            className="mt-1"
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <NumberField
            id="meses"
            label="ou idade em meses"
            value={mesesTxt}
            onChange={(v) => {
              setMesesTxt(v);
              setNasc("");
              setIdx(null);
            }}
          />
        </div>
        <ToolResultCard
          label="Fase em destaque"
          value={fase.titulo}
          hint={
            temIdade
              ? `${Math.floor(idade)} meses de vida`
              : "informe a idade (mostrando a 1ª fase)"
          }
          tone="primary"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!anterior}
          onClick={() => setIdx(i - 1)}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold hover:border-primary disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" /> {anterior ? anterior.titulo : "início"}
        </button>
        <div className="flex flex-wrap justify-center gap-1">
          {FASES.map((f, k) => (
            <button
              key={f.meses}
              type="button"
              onClick={() => setIdx(k)}
              aria-pressed={k === i}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${k === i ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
            >
              {f.titulo}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={!proxima}
          onClick={() => setIdx(i + 1)}
          className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold hover:border-primary disabled:opacity-40"
        >
          {proxima ? `O que vem aí: ${proxima.titulo}` : "última fase"}{" "}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">
            Marcos de {fase.titulo}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({vistosFase}/{fase.marcos.length} vistos)
            </span>
          </h2>
          <ul className="mt-2 space-y-2">
            {fase.marcos.map((m) => (
              <li key={m.texto} className="flex items-start gap-3 text-sm">
                <Checkbox
                  id={`m-${fase.meses}-${m.dominio}-${m.texto.length}`}
                  checked={vistos.includes(key(m.texto))}
                  onCheckedChange={() => toggle(m.texto)}
                  className="mt-0.5"
                />
                <label
                  htmlFor={`m-${fase.meses}-${m.dominio}-${m.texto.length}`}
                  className="cursor-pointer"
                >
                  <span className="mr-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {DOMINIOS[m.dominio]}
                  </span>
                  {m.texto}
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Marque o que você já viu o seu filho fazer; fica salvo neste navegador.
          </p>
        </section>
        <section className="rounded-2xl border border-accent/40 bg-accent/10 p-4">
          <h2 className="font-display text-lg font-bold">O que o pai faz</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
            {fase.oQueOPaiFaz.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {proxima && (
            <p className="mt-4 text-xs text-muted-foreground">
              <strong>O que vem aí ({proxima.titulo}):</strong>{" "}
              {proxima.marcos.map((m) => m.texto).join("; ")}.
            </p>
          )}
        </section>
      </div>
      <SemaforoTrio
        titulo={`Semáforo do pai: ${fase.titulo}`}
        aceso={null}
        ok="Sinal verde: marcos da fase presentes. Siga brincando, conversando e observando; a próxima fase já diz o que vem aí."
        warn={fase.sinalDeAtencao}
        bad={fase.sinalDeAlerta}
      />
      <p className="text-xs text-muted-foreground">
        Fonte:{" "}
        <a
          href={FONTE.url}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          {FONTE.nome}
        </a>
        , conferida em {ATUALIZADO_EM.split("-").reverse().join("/")}. Marcos são faixas, não datas.
        Veja também o{" "}
        <Link
          to="/ferramentas/calendario-de-vacinacao"
          className="font-bold text-primary hover:underline"
        >
          calendário de vacinação
        </Link>{" "}
        e os artigos de{" "}
        <Link
          to="/categoria/paternidade-por-fase"
          className="font-bold text-primary hover:underline"
        >
          Paternidade por fase
        </Link>
        .
      </p>
    </div>
  );
}
