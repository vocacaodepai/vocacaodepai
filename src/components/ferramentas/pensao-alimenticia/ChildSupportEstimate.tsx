import { useMemo, useState } from "react";
import { pensaoEstimativa } from "@/lib/tools/financas";
import { formatBRL, formatFaixaBRL, parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";

export default function ChildSupportEstimate() {
  const [renda, setRenda] = useState("5000");
  const [filhos, setFilhos] = useState("1");
  const [guarda, setGuarda] = useState<"compartilhada" | "unilateral">("unilateral");
  const [custos, setCustos] = useState("");
  const [situacao, setSituacao] = useState<"homologado" | "verbal" | "atraso">("verbal");
  const r = useMemo(() => {
    const c = parseBRNumber(custos);
    return pensaoEstimativa({
      rendaLiquida: parseBRNumber(renda) || 0,
      filhos: parseBRNumber(filhos) || 1,
      guarda,
      custosFixosFilho: Number.isFinite(c) && c > 0 ? c : undefined,
    });
  }, [renda, filhos, guarda, custos]);
  const aceso = situacao === "atraso" ? "bad" : situacao === "verbal" ? "warn" : "ok";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <NumberField
          id="renda"
          label="Renda líquida mensal"
          value={renda}
          onChange={setRenda}
          suffix="R$"
          hint="O que cai na conta depois dos descontos legais."
        />
        <NumberField id="filhos" label="Número de filhos" value={filhos} onChange={setFilhos} />
        <SelectField
          id="guarda"
          label="Tipo de guarda"
          value={guarda}
          onChange={(v) => setGuarda(v as typeof guarda)}
          options={[
            { value: "unilateral", label: "Unilateral (filho mora com a mãe)" },
            { value: "compartilhada", label: "Compartilhada" },
          ]}
        />
        <NumberField
          id="custos"
          label="Custos fixos do filho (opcional)"
          value={custos}
          onChange={setCustos}
          suffix="R$/mês"
          hint="Escola, plano de saúde e outros fixos: o lado da 'necessidade'."
        />
        <SelectField
          id="situacao"
          label="Situação do acordo"
          value={situacao}
          onChange={(v) => setSituacao(v as typeof situacao)}
          options={[
            { value: "homologado", label: "Acordo escrito e homologado em juízo" },
            { value: "verbal", label: "Acordo verbal, sem homologação" },
            { value: "atraso", label: "Atraso de 3 meses ou mais / execução em curso" },
          ]}
        />
      </form>
      <section aria-live="polite" className="space-y-4">
        <ToolResultCard
          big
          label={`Faixa observada na prática (${r.pctMin}% a ${r.pctMax}% da renda líquida)`}
          value={`entre ${formatFaixaBRL(r.totalMin, r.totalMax)}`}
          tone="primary"
          hint={
            r.filhos > 1
              ? `total para ${r.filhos} filhos · por filho: ${formatFaixaBRL(r.porFilhoMin, r.porFilhoMax)}`
              : "1 filho"
          }
        />
        {r.reduzida && (
          <ToolResultCard
            label={`Guarda compartilhada com despesas divididas (${r.reduzida.pctMin}% a ${r.reduzida.pctMax}%)`}
            value={`entre ${formatFaixaBRL(r.reduzida.totalMin, r.reduzida.totalMax)}`}
            hint="faixa reduzida quando a decisão prevê divisão direta das despesas"
          />
        )}
        {r.custosFixosFilho != null && (
          <ToolResultCard
            label="Custos fixos informados (lado da necessidade)"
            value={formatBRL(r.custosFixosFilho, 0)}
            hint={
              r.custosFixosFilho > r.totalMax
                ? "acima da faixa: o juiz pode fixar mais, se houver possibilidade"
                : "dentro ou abaixo da faixa"
            }
          />
        )}
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-bold">O binômio da lei (CC art. 1.694, §1º)</p>
          <p className="mt-1 text-muted-foreground">
            Não existe percentual legal. O juiz equilibra a <strong>necessidade</strong> de quem
            recebe e a <strong>possibilidade</strong> de quem paga. As faixas acima são costume
            forense, não regra.
          </p>
          <p className="mt-3 font-bold">O que costuma entrar na base</p>
          <p className="mt-1 text-muted-foreground">
            Salário líquido, 13º e férias; horas extras, bônus e PLR conforme a decisão. Descontos
            legais (INSS, IR) saem antes.
          </p>
          <p className="mt-3 font-bold">O que nunca fazer</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Parar de pagar por conta própria: se a renda caiu, peça revisão judicial</li>
            <li>Pagar por fora sem recibo: não abate a pensão</li>
            <li>Condicionar o pagamento às visitas: são direitos independentes</li>
          </ul>
        </div>
        <SemaforoTrio
          titulo="Semáforo do pai: a situação do acordo"
          aceso={aceso}
          ok="Sinal verde: acordo escrito e homologado em juízo. Pague pelo meio fixado, guarde os comprovantes e revise quando a renda mudar."
          warn="Sinal de atenção: acordo verbal. Formalize na Defensoria Pública ou com advogado; a homologação protege os dois lados e o filho."
          bad="Sinal de alerta: atraso de 3 meses ou execução em curso. Procure a Defensoria Pública ou um advogado de família hoje; a prisão civil é possível."
        />
      </section>
    </div>
  );
}
