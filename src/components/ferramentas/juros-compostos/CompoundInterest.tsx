import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getIndicators } from "@/lib/market/fetchers";
import { jurosCompostos, semaforoTaxa } from "@/lib/tools/financas";
import { formatBRL, formatNumber, parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { MarketStale } from "@/components/ferramentas/MarketStale";

// Constantes de referência usadas só quando o cache de mercado está vazio (revisar com a data).
const REF = { data: "2026-10-30", selic: 13.75, cdi: 13.65, ipca12: 4.5, ipcaMais: 6.5 };

export default function CompoundInterest() {
  const [inicial, setInicial] = useState("0");
  const [aporte, setAporte] = useState("500");
  const [taxa, setTaxa] = useState("10");
  const [prazo, setPrazo] = useState("10");
  const [unidade, setUnidade] = useState<"anos" | "meses">("anos");
  const [inflacao, setInflacao] = useState("");
  const ind = useQuery({
    queryKey: ["sgs:indicators"],
    queryFn: () => getIndicators(),
    staleTime: 3_600_000,
    retry: 0,
  });
  const i = ind.data?.data;
  const selic = i?.selicMeta?.value ?? REF.selic;
  const cdi = i?.cdiAnual?.value ?? REF.cdi;
  const ipca12 = i?.ipca12m?.value ?? REF.ipca12;
  const poupanca = i?.poupancaMensal
    ? ((1 + i.poupancaMensal.value / 100) ** 12 - 1) * 100
    : selic * 0.7;
  const meses = Math.max(1, Math.round(parseBRNumber(prazo) || 0) * (unidade === "anos" ? 12 : 1));
  const taxaN = parseBRNumber(taxa) || 0;
  const infl = parseBRNumber(inflacao);
  const r = useMemo(
    () =>
      jurosCompostos({
        inicial: parseBRNumber(inicial) || 0,
        aporteMensal: parseBRNumber(aporte) || 0,
        taxaAnual: taxaN,
        meses,
        inflacaoAnual: Number.isFinite(infl) ? infl : undefined,
      }),
    [inicial, aporte, taxaN, meses, infl],
  );
  const anual = r.serie.filter((p) => p.mes % 12 === 0 || p.mes === meses);
  const sem = semaforoTaxa(taxaN, i?.cdiAnual?.value ?? null);
  const pct = (v: number) => formatNumber(v, 2);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <NumberField
          id="inicial"
          label="Valor inicial"
          value={inicial}
          onChange={setInicial}
          suffix="R$"
        />
        <NumberField
          id="aporte"
          label="Aporte mensal"
          value={aporte}
          onChange={setAporte}
          suffix="R$"
        />
        <NumberField id="taxa" label="Taxa anual" value={taxa} onChange={setTaxa} suffix="% a.a." />
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">Usar taxas de hoje:</span>
          <button
            type="button"
            onClick={() => setTaxa(pct(poupanca))}
            className="rounded-full border border-border px-2.5 py-0.5 font-bold hover:border-primary"
          >
            Poupança ≈ {pct(poupanca)}%
          </button>
          <button
            type="button"
            onClick={() => setTaxa(pct(cdi))}
            className="rounded-full border border-border px-2.5 py-0.5 font-bold hover:border-primary"
          >
            CDI 100% = {pct(cdi)}%
          </button>
          <button
            type="button"
            onClick={() => setTaxa(pct(REF.ipcaMais + ipca12))}
            className="rounded-full border border-border px-2.5 py-0.5 font-bold hover:border-primary"
          >
            Tesouro IPCA+ ≈ {pct(REF.ipcaMais + ipca12)}%
          </button>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <NumberField id="prazo" label="Prazo" value={prazo} onChange={setPrazo} />
          <SelectField
            id="unidade"
            label="Unidade"
            value={unidade}
            onChange={(v) => setUnidade(v as "anos" | "meses")}
            options={[
              { value: "anos", label: "anos" },
              { value: "meses", label: "meses" },
            ]}
          />
        </div>
        <NumberField
          id="inflacao"
          label="Inflação anual (opcional)"
          value={inflacao}
          onChange={setInflacao}
          suffix="% a.a."
          hint={`IPCA 12 meses de referência: ${pct(ipca12)}%`}
          placeholder={pct(ipca12)}
        />
        {ind.data ? (
          <MarketStale
            fetchedAt={ind.data.fetchedAt}
            stale={ind.data.stale}
            sources={["Banco Central (SGS)"]}
          />
        ) : (
          <p className="text-xs text-muted-foreground">
            Sem dados do Banco Central agora: presets com constantes de{" "}
            {REF.data.split("-").reverse().join("/")}.
          </p>
        )}
      </form>

      <section aria-live="polite" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ToolResultCard
            big
            label="Montante final"
            value={formatBRL(r.final, 0)}
            tone="primary"
            className="sm:col-span-2"
          />
          <ToolResultCard label="Você aportou" value={formatBRL(r.aportado, 0)} />
          <ToolResultCard label="Juros ganhos" value={formatBRL(r.juros, 0)} tone="success" />
          {r.finalReal != null && (
            <ToolResultCard
              label="Valor real (hoje)"
              value={formatBRL(r.finalReal, 0)}
              hint="descontada a inflação"
              className="sm:col-span-2"
            />
          )}
        </div>
        <figure className="rounded-2xl border border-border bg-card p-4">
          <figcaption className="mb-2 text-sm font-bold">
            Aportes × juros ao longo do tempo
          </figcaption>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={r.serie.filter((_, idx) => meses <= 120 || idx % 3 === 0)}>
              <XAxis
                dataKey="mes"
                tickFormatter={(m: number) => `${Math.round(m / 12)}a`}
                minTickGap={24}
              />
              <YAxis width={72} tickFormatter={(v: number) => formatBRL(v, 0)} />
              <Tooltip
                formatter={(v) => formatBRL(Number(v), 0)}
                labelFormatter={(m) => `Mês ${m}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="aportado"
                name="Aportes"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.35}
              />
              <Area
                type="monotone"
                dataKey="juros"
                name="Juros"
                stackId="1"
                stroke="hsl(var(--accent))"
                fill="hsl(var(--accent))"
                fillOpacity={0.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </figure>
        <details className="rounded-2xl border border-border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-bold">Tabela ano a ano</summary>
          <table className="mt-2 w-full">
            <thead className="text-left text-xs text-muted-foreground">
              <tr>
                <th>Ano</th>
                <th>Aportado</th>
                <th>Juros</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {anual.map((p) => (
                <tr key={p.mes} className="border-t border-border">
                  <td className="py-1">{Math.ceil(p.mes / 12)}</td>
                  <td>{formatBRL(p.aportado, 0)}</td>
                  <td>{formatBRL(p.juros, 0)}</td>
                  <td className="font-bold">{formatBRL(p.saldo, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <SemaforoTrio
          titulo="Semáforo do pai: a taxa é realista?"
          aceso={sem}
          ok="Sinal verde: taxa até o CDI + 2 pontos é cenário normal de renda fixa (Tesouro Selic, CDB, fundo DI)."
          warn="Sinal de atenção: taxa acima do CDI + 2 pontos. Promessa alta pede garantia (FGC?) e liquidez claras no papel antes de aplicar."
          bad="Sinal de alerta: taxa acima de 30% ao ano ou 'rendimento garantido' muito acima do CDI é sinal clássico de golpe. Verifique na CVM e procure um profissional certificado antes de aplicar."
        />
        <ToolShareButton
          title="Juros compostos — Vocação de Pai"
          text={`${formatBRL(parseBRNumber(aporte) || 0, 0)}/mês a ${pct(taxaN)}% a.a. por ${meses} meses = ${formatBRL(r.final, 0)} (${formatBRL(r.juros, 0)} de juros)`}
        />
      </section>
    </div>
  );
}
