import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getIndicators } from "@/lib/market/fetchers";
import { reservaEmergencia, type TipoRenda } from "@/lib/tools/financas";
import { formatBRL, formatFaixaBRL, parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/lib/router-compat";

export default function EmergencyFund() {
  const [gasto, setGasto] = useState("4000");
  const [tipo, setTipo] = useState<TipoRenda>("clt");
  const [dep, setDep] = useState("2");
  const [guardado, setGuardado] = useState("0");
  const [aporte, setAporte] = useState("500");
  const [dividaCara, setDividaCara] = useState(false);
  const ind = useQuery({
    queryKey: ["sgs:indicators"],
    queryFn: () => getIndicators(),
    staleTime: 3_600_000,
    retry: 0,
  });
  const selic = ind.data?.data.selicMeta?.value ?? 0;
  const r = useMemo(
    () =>
      reservaEmergencia({
        gastoMensal: parseBRNumber(gasto) || 0,
        tipoRenda: tipo,
        dependentes: parseBRNumber(dep) || 0,
        guardado: parseBRNumber(guardado) || 0,
        aporteMensal: parseBRNumber(aporte) || 0,
        taxaAnual: selic,
      }),
    [gasto, tipo, dep, guardado, aporte, selic],
  );
  const g = parseBRNumber(guardado) || 0;
  const progresso = r.metaMin > 0 ? Math.min(100, (g / r.metaMin) * 100) : 0;
  const aceso = g <= 0 && dividaCara ? "bad" : g >= r.metaMin ? "ok" : "warn";
  const m = (v: number | null) =>
    v == null ? "—" : v === 0 ? "já alcançada" : `${v} ${v === 1 ? "mês" : "meses"}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <NumberField
          id="gasto"
          label="Gasto mensal essencial"
          value={gasto}
          onChange={setGasto}
          suffix="R$"
          hint="Não sabe? Use o total de Essenciais do Orçamento familiar."
        />
        <SelectField
          id="tipo"
          label="Tipo de renda"
          value={tipo}
          onChange={(v) => setTipo(v as TipoRenda)}
          options={[
            { value: "clt", label: "CLT (3 a 6 meses)" },
            { value: "servidor", label: "Servidor estável (3 a 4 meses)" },
            { value: "autonomo", label: "Autônomo / PJ (6 a 12 meses)" },
          ]}
        />
        <NumberField
          id="dep"
          label="Filhos dependentes"
          value={dep}
          onChange={setDep}
          hint="+1 mês por filho, até +3."
        />
        <NumberField
          id="guardado"
          label="Quanto já guardou"
          value={guardado}
          onChange={setGuardado}
          suffix="R$"
        />
        <NumberField
          id="aporte"
          label="Aporte mensal"
          value={aporte}
          onChange={setAporte}
          suffix="R$"
        />
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="divida">Tenho dívida de cartão ou cheque especial</Label>
          <Switch id="divida" checked={dividaCara} onCheckedChange={setDividaCara} />
        </div>
        <p className="text-xs text-muted-foreground">
          {selic
            ? `Prazo calculado com a Selic de hoje (${selic.toFixed(2).replace(".", ",")}% a.a.).`
            : "Sem Selic em cache: prazo calculado sem rendimento."}
        </p>
        <Link
          to="/ferramentas/orcamento-familiar"
          className="text-sm font-bold text-primary hover:underline"
        >
          Abrir o Orçamento familiar →
        </Link>
      </form>
      <section aria-live="polite" className="space-y-4">
        <ToolResultCard
          big
          label={`Meta da reserva (${r.mesesMin} a ${r.mesesMax} meses de gasto)`}
          value={`entre ${formatFaixaBRL(r.metaMin, r.metaMax)}`}
          tone="primary"
        />
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Progresso até a meta mínima</span>
            <span>{progresso.toFixed(0)}%</span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-success" style={{ width: `${progresso}%` }} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Falta {formatBRL(r.falta, 0)} para a meta mínima.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ToolResultCard label="Meses até a meta mínima" value={m(r.mesesParaMetaMin)} />
          <ToolResultCard label="Meses até a meta máxima" value={m(r.mesesParaMetaMax)} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-bold">Onde guardar (informação educativa, sem indicar instituição)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Tesouro Selic: segurança do governo e resgate em 1 dia útil</li>
            <li>
              CDB com liquidez diária pagando ao menos 100% do CDI, de banco sólido (garantia do FGC
              até o limite)
            </li>
            <li>Fundo DI simples, com taxa baixa</li>
            <li>Poupança: aceitável para começar; rende menos</li>
            <li>Nunca: ações, cripto ou fundo com prazo de resgate</li>
          </ul>
        </div>
        <SemaforoTrio
          titulo="Semáforo do pai: a reserva"
          aceso={aceso}
          ok="Sinal verde: a reserva mínima está feita. Siga até a máxima com calma e só depois invista para o futuro."
          warn="Sinal de atenção: a reserva está abaixo da meta mínima. Trate o aporte como conta fixa do mês e evite compra parcelada até fechar o colchão."
          bad="Sinal de alerta: zero guardado e dívida de cartão ou cheque especial. Pague a dívida cara primeiro e, se não conseguir, procure um profissional ou a renegociação oficial (Serasa, Procon, banco)."
        />
        <ToolShareButton
          title="Reserva de emergência — Vocação de Pai"
          text={`Minha meta de reserva: entre ${formatFaixaBRL(r.metaMin, r.metaMax)} (${r.mesesMin}–${r.mesesMax} meses de gasto essencial).`}
        />
      </section>
    </div>
  );
}
