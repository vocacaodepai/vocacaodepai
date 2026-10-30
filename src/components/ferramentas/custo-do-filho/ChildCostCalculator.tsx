import { useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ATUALIZADO_EM,
  FASES,
  calcularCusto,
  type Fase,
  type Perfil,
} from "@/lib/tools/custo-filho-data";
import { formatBRL, formatFaixaBRL, formatNumber, parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Link } from "@/lib/router-compat";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ChildCostCalculator() {
  const [fase, setFase] = useState<Fase>("0-1");
  const [perfil, setPerfil] = useState<Perfil>("medio");
  const [escola, setEscola] = useState(false);
  const [plano, setPlano] = useState(true);
  const [filhos, setFilhos] = useState("1");
  const [renda, setRenda] = useState("");
  const r = useMemo(() => {
    const rd = parseBRNumber(renda);
    return calcularCusto({
      fase,
      perfil,
      escolaParticular: escola,
      planoSaude: plano,
      filhos: Math.max(1, parseBRNumber(filhos) || 1),
      renda: Number.isFinite(rd) && rd > 0 ? rd : null,
    });
  }, [fase, perfil, escola, plano, filhos, renda]);
  const dados = r.porCategoria.map((c) => ({
    nome: c.nome,
    min: Math.round(c.min),
    max: Math.round(c.max),
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <SelectField
          id="fase"
          label="Fase do filho"
          value={fase}
          onChange={(v) => setFase(v as Fase)}
          options={[
            { value: "0-1", label: "Ainda vai nascer / 0 a 1 ano" },
            ...FASES.slice(1).map((f) => ({ value: f.id, label: f.nome })),
          ]}
        />
        <SelectField
          id="perfil"
          label="Perfil de gasto da casa"
          value={perfil}
          onChange={(v) => setPerfil(v as Perfil)}
          options={[
            { value: "enxuto", label: "Enxuto (SUS, escola pública, roupa herdada)" },
            { value: "medio", label: "Médio (plano básico, escola de bairro)" },
            { value: "amplo", label: "Amplo (escola cara, plano completo, cursos)" },
          ]}
        />
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="escola">Escola particular</Label>
          <Switch id="escola" checked={escola} onCheckedChange={setEscola} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="plano">Plano de saúde</Label>
          <Switch id="plano" checked={plano} onCheckedChange={setPlano} />
        </div>
        <NumberField
          id="filhos"
          label="Quantos filhos"
          value={filhos}
          onChange={setFilhos}
          hint="A partir do 2º, 15% de desconto em roupas, brinquedos e material."
        />
        <NumberField
          id="renda"
          label="Renda líquida da casa (opcional)"
          value={renda}
          onChange={setRenda}
          suffix="R$/mês"
          hint="Com a renda, o Semáforo do pai diz se a faixa cabe."
        />
        <p className="text-xs text-muted-foreground">
          Faixas de referência revisadas em {ATUALIZADO_EM.split("-").reverse().join("/")}.
        </p>
      </form>

      <section aria-live="polite" className="space-y-4">
        <ToolResultCard
          big
          label={`Faixa mensal (${r.filhos} filho${r.filhos > 1 ? "s" : ""})`}
          value={`entre ${formatFaixaBRL(r.min, r.max)}`}
          tone="primary"
          hint={
            r.pctRenda != null
              ? `O máximo consome ${formatNumber(r.pctRenda, 0)}% da renda informada`
              : "Informe a renda para ver o peso no orçamento"
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolResultCard
            label="Até os 18 anos (valores de hoje)"
            value={`${formatBRL(r.ate18Min, 0)} a ${formatBRL(r.ate18Max, 0)}`}
          />
          <ToolResultCard
            label="O que mais pesa nesta fase"
            value={r.maisPesa.nome}
            hint={`até ${formatBRL(r.maisPesa.max, 0)} por mês`}
          />
        </div>
        <figure className="rounded-2xl border border-border bg-card p-4">
          <figcaption className="mb-2 text-sm font-bold">
            Composição por categoria (mín. e máx. mensal)
          </figcaption>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dados} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" tickFormatter={(v: number) => formatBRL(v, 0)} />
              <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatBRL(Number(v), 0)} />
              <Bar dataKey="min" name="Mínimo" fill="hsl(var(--primary))" fillOpacity={0.5} />
              <Bar dataKey="max" name="Máximo" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </figure>
        <SemaforoTrio
          titulo="Semáforo do pai: a conta cabe na renda?"
          aceso={r.semaforo}
          ok="Sinal verde: a faixa máxima consome até um quarto da renda. Cabe, e ainda sobra para a reserva de emergência."
          warn="Sinal de atenção: a faixa fica entre 25% e 40% da renda. Cabe, mas não sobra para reserva; um imprevisto vira dívida. Reveja o Estilo de vida no Orçamento familiar."
          bad="Sinal de alerta: a faixa passa de 40% da renda e a conta não fecha. Corte despesas, mude de perfil ou aumente a renda antes de o bebê chegar; procure um planejador financeiro ou a renegociação das dívidas."
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            to="/ferramentas/orcamento-familiar"
            className="text-sm font-bold text-primary hover:underline"
          >
            Levar a faixa para o Orçamento familiar →
          </Link>
          <ToolShareButton
            title="Quanto custa um filho — Vocação de Pai"
            text={`Faixa mensal estimada: entre ${formatFaixaBRL(r.min, r.max)} (${FASES.find((f) => f.id === fase)?.nome}, perfil ${perfil})`}
          />
        </div>
      </section>
    </div>
  );
}
