import { useMemo } from "react";
import { Download, Printer, Trash2 } from "lucide-react";
import {
  GRUPOS,
  PLANILHA_URL,
  orcamentoCsv,
  resumir,
  type Orcamento,
} from "@/lib/tools/orcamento-data";
import { formatBRL, formatNumber, parseBRNumber } from "@/lib/tools/format";
import { usePersisted } from "@/hooks/usePersisted";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Form {
  rendas: { eu: string; esposa: string };
  gastos: Record<string, string>;
}
const VAZIO: Form = { rendas: { eu: "", esposa: "" }, gastos: {} };
const num = (s: string | undefined) => {
  const v = parseBRNumber(s ?? "");
  return Number.isFinite(v) && v > 0 ? v : 0;
};

export default function FamilyBudget() {
  const [form, setForm] = usePersisted<Form>("vdp:tool:orcamento-familiar", VAZIO);
  const orc: Orcamento = useMemo(
    () => ({
      rendas: [
        { nome: "Minha renda", valor: num(form.rendas.eu) },
        { nome: "Renda da esposa", valor: num(form.rendas.esposa) },
      ],
      gastos: Object.fromEntries(Object.entries(form.gastos).map(([k, v]) => [k, num(v)])),
    }),
    [form],
  );
  const r = useMemo(() => resumir(orc), [orc]);
  const setGasto = (cat: string, v: string) =>
    setForm((p) => ({ ...p, gastos: { ...p.gastos, [cat]: v } }));
  const exportar = () => {
    const blob = new Blob(["﻿" + orcamentoCsv(orc)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "orcamento-familiar-vocacao-de-pai.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const metaTxt = (m: { max?: number; min?: number; sugerido?: number }) =>
    m.max != null
      ? `meta: até ${m.max * 100}%`
      : m.min != null
        ? `meta: pelo menos ${m.min * 100}%`
        : `sugerido: ${(m.sugerido ?? 0) * 100}%`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5 print:hidden"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="eu">Sua renda líquida</Label>
            <Input
              id="eu"
              inputMode="decimal"
              value={form.rendas.eu}
              onChange={(e) =>
                setForm((p) => ({ ...p, rendas: { ...p.rendas, eu: e.target.value } }))
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="esposa">Renda da esposa</Label>
            <Input
              id="esposa"
              inputMode="decimal"
              value={form.rendas.esposa}
              onChange={(e) =>
                setForm((p) => ({ ...p, rendas: { ...p.rendas, esposa: e.target.value } }))
              }
              className="mt-1"
            />
          </div>
        </div>
        <Accordion type="multiple" defaultValue={["essenciais"]}>
          {GRUPOS.map((g) => (
            <AccordionItem key={g.id} value={g.id}>
              <AccordionTrigger className="font-bold">
                {g.nome}{" "}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({metaTxt(g.meta)})
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2">
                {g.categorias.map((c) => (
                  <div key={c} className="grid grid-cols-[1fr_120px] items-center gap-2">
                    <Label htmlFor={c} className="text-xs">
                      {c}
                    </Label>
                    <Input
                      id={c}
                      inputMode="decimal"
                      value={form.gastos[c] ?? ""}
                      onChange={(e) => setGasto(c, e.target.value)}
                    />
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportar}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold hover:border-primary"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold hover:border-primary"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimir
          </button>
          <button
            type="button"
            onClick={() => setForm(VAZIO)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold hover:border-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Limpar
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Fica salvo só neste navegador. Nada vai para o nosso servidor.
        </p>
      </form>

      <section aria-live="polite" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <ToolResultCard label="Renda do mês" value={formatBRL(r.renda, 0)} />
          <ToolResultCard label="Gastos" value={formatBRL(r.gastos, 0)} />
          <ToolResultCard
            big
            label={r.sobra >= 0 ? "Sobra" : "Falta"}
            value={formatBRL(Math.abs(r.sobra), 0)}
            tone={r.sobra < 0 ? "danger" : r.sobraPct < 0.1 ? "warning" : "success"}
            hint={
              r.renda > 0 ? `${formatNumber(r.sobraPct * 100, 0)}% da renda` : "informe a renda"
            }
          />
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="font-display text-lg font-bold">A regra do pai: 50-20-20-10</h2>
          {r.grupos.map((g) => (
            <div key={g.id}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{g.nome}</span>
                <span>
                  {formatBRL(g.total, 0)} · {formatNumber(g.pct * 100, 0)}%{" "}
                  <span className="text-xs text-muted-foreground">({metaTxt(g.meta)})</span>
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full ${g.status === "warn" ? "bg-warning" : g.status === "ok" ? "bg-success" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, g.pct * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <SemaforoTrio
          titulo="Semáforo do pai: a casa fecha a conta?"
          aceso={r.renda > 0 ? r.semaforo : null}
          ok="Sinal verde: sobra pelo menos 10% do mês e o Futuro recebe sua parte. Mantenha o ritmo e revise todo mês com a esposa."
          warn="Sinal de atenção: sobra pouco (menos de 10%), o Futuro está abaixo de 15% ou os Essenciais passam de 60%. Um imprevisto vira dívida: encolha o Estilo de vida e garanta uma reserva mínima."
          bad="Sinal de alerta: a conta não fecha. Corte o Estilo de vida primeiro, renegocie as dívidas mais caras e, se persistir, procure um planejador financeiro ou os canais oficiais de renegociação (Serasa, Procon)."
        />
        {PLANILHA_URL && (
          <a href={PLANILHA_URL} className="text-sm font-bold text-primary hover:underline">
            Quer a planilha completa, com abas por filho e metas? →
          </a>
        )}
      </section>
    </div>
  );
}
