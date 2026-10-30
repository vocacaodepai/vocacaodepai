import { useMemo, useState } from "react";
import {
  EPI,
  NIVEIS,
  TAREFAS,
  montarKit,
  type Moradia,
  type Nivel,
  type Tarefa,
} from "@/lib/tools/kit-ferramentas-data";
import { usePersisted } from "@/hooks/usePersisted";
import { SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@/lib/router-compat";

export default function ToolkitBuilder() {
  const [moradia, setMoradia] = useState<Moradia>("apartamento");
  const [tarefas, setTarefas] = useState<Tarefa[]>(["montar-moveis", "furar-parede"]);
  const [nivel, setNivel] = useState<Nivel>("basico");
  const [tenho, setTenho] = usePersisted<string[]>("vdp:tool:kit-de-ferramentas", []);
  const kit = useMemo(() => montarKit({ moradia, tarefas, nivel }), [moradia, tarefas, nivel]);
  const toggleT = (t: Tarefa) =>
    setTarefas((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const toggleTenho = (id: string) =>
    setTenho((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const faltam = [...kit.comecePorEstes, ...kit.quandoPrecisar].filter(
    (i) => !tenho.includes(i.id),
  ).length;
  const furaSemDetector = tarefas.includes("furar-parede") && !tenho.includes("detector");
  const eletrica = tarefas.includes("eletrica-basica");
  const Lista = ({ titulo, itens }: { titulo: string; itens: typeof kit.comecePorEstes }) => (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="font-display text-lg font-bold">{titulo}</h2>
      {itens.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">Nada aqui para as tarefas marcadas.</p>
      )}
      <ul className="mt-2 divide-y divide-border">
        {itens.map((i) => (
          <li
            key={i.id}
            className={`flex items-start gap-3 py-2 ${tenho.includes(i.id) ? "opacity-50" : ""}`}
          >
            <Checkbox
              id={`t-${i.id}`}
              checked={tenho.includes(i.id)}
              onCheckedChange={() => toggleTenho(i.id)}
              className="mt-1"
            />
            <label htmlFor={`t-${i.id}`} className="flex-1 cursor-pointer text-sm">
              <span className="font-bold">{i.nome}</span>
              <span className="block text-muted-foreground">{i.paraQue}</span>
            </label>
            <Link
              to={i.productSlug ? `/loja/${i.productSlug}` : `/loja/categoria/${i.categoriaLoja}`}
              className="shrink-0 text-xs font-bold text-primary hover:underline"
            >
              Ver na Loja do Pai
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <SelectField
          id="moradia"
          label="Onde você mora"
          value={moradia}
          onChange={(v) => setMoradia(v as Moradia)}
          options={[
            { value: "apartamento", label: "Apartamento" },
            { value: "casa", label: "Casa" },
            { value: "sitio", label: "Sítio ou chácara" },
          ]}
        />
        <fieldset>
          <legend className="text-sm font-medium">O que pretende fazer</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {TAREFAS.map((t) => (
              <label key={t.id} className="flex items-center gap-2">
                <Checkbox checked={tarefas.includes(t.id)} onCheckedChange={() => toggleT(t.id)} />{" "}
                {t.nome}
              </label>
            ))}
          </div>
        </fieldset>
        <SelectField
          id="nivel"
          label="Nível"
          value={nivel}
          onChange={(v) => setNivel(v as Nivel)}
          options={NIVEIS.map((n) => ({ value: n.id, label: n.nome }))}
        />
        <p className="text-xs text-muted-foreground">"Já tenho" fica salvo só neste navegador.</p>
      </form>
      <section aria-live="polite" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolResultCard
            big
            label="Itens que faltam"
            value={String(faltam)}
            tone="primary"
            hint={`${tenho.length} marcados como "já tenho"`}
          />
          <ToolResultCard
            label="Faixa de investimento"
            value="em pesquisa"
            hint="aparece quando todos os produtos vinculados tiverem faixa de preço pesquisada na Loja do Pai"
          />
        </div>
        <Lista titulo="Comece por estes" itens={kit.comecePorEstes} />
        <Lista titulo="Quando precisar" itens={kit.quandoPrecisar} />
        <div className="rounded-2xl border border-success/40 bg-success/5 p-4 text-sm">
          <p className="font-bold">EPI em toda lista</p>
          <p className="text-muted-foreground">{EPI.join(" · ")}</p>
        </div>
        <SemaforoTrio
          titulo="Semáforo do pai: segurança na oficina"
          aceso={eletrica ? "bad" : furaSemDetector ? "warn" : "ok"}
          ok="Sinal verde: EPI na lista e ferramenta certa para a tarefa. Guarde tudo na mesma caixa e ensine o filho a devolver cada peça."
          warn="Sinal de atenção: furar parede sem detector de cano e fio. Cano e fio passam onde você menos espera; o detector custa menos que um reparo."
          bad="Sinal de alerta: elétrica só com o disjuntor geral desligado e teste de ausência de tensão. Quadro, chuveiro, padrão de entrada e gás são serviço de eletricista ou profissional habilitado."
        />
      </section>
    </div>
  );
}
