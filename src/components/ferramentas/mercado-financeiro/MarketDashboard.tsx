import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getFxDaily, getMarketSnapshot } from "@/lib/market/fetchers";
import type { MarketSnapshot } from "@/lib/market/types";
import { formatBRL, formatNumber, formatPct } from "@/lib/tools/format";
import { INSIGHTS, type InsightKey } from "@/lib/tools/mercado-insights";
import { semaforoDoDia } from "@/lib/tools/mercado-semaforo";
import { MarketStale, MarketUnavailable } from "@/components/ferramentas/MarketStale";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { SemaforoCallout } from "@/components/ferramentas/SemaforoCallout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const route = getRouteApi("/_site/ferramentas/$slug");
const CHART_PAIRS = [
  { pair: "USD-BRL", label: "Dólar" },
  { pair: "EUR-BRL", label: "Euro" },
  { pair: "BTC-BRL", label: "Bitcoin" },
];

function Card({
  label,
  value,
  pct,
  insightKey,
  hint,
}: {
  label: string;
  value: string;
  pct?: number;
  insightKey: InsightKey;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <ToolResultCard
        label={label}
        value={value}
        hint={hint}
        tone={pct == null ? "neutral" : pct >= 0 ? "success" : "danger"}
        className="border-0 bg-transparent p-0"
      />
      {pct != null && (
        <p className={`mt-1 text-sm font-bold ${pct >= 0 ? "text-success" : "text-destructive"}`}>
          {formatPct(pct)} hoje
        </p>
      )}
      <details className="mt-3 text-sm text-muted-foreground">
        <summary className="cursor-pointer font-bold text-foreground">
          O que isso muda no seu bolso
        </summary>
        <p className="mt-2 leading-relaxed">{INSIGHTS[insightKey]}</p>
      </details>
    </div>
  );
}

function Grupo({
  id,
  titulo,
  stale,
  children,
}: {
  id: string;
  titulo: string;
  stale?: { fetchedAt: string; stale: boolean; sources: string[] } | null;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="font-display text-xl font-bold">
          {titulo}
        </h2>
        {stale && (
          <MarketStale fetchedAt={stale.fetchedAt} stale={stale.stale} sources={stale.sources} />
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export default function MarketDashboard() {
  const { preloaded } = route.useLoaderData() as { preloaded: MarketSnapshot | null };
  const snap = useQuery({
    queryKey: ["market:snapshot"],
    queryFn: () => getMarketSnapshot(),
    initialData: preloaded ?? undefined,
    staleTime: 10 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  });
  const [pair, setPair] = useState("USD-BRL");
  const daily = useQuery({
    queryKey: ["fx:daily", pair],
    queryFn: () => getFxDaily({ data: { pair, days: 30 } }),
    staleTime: 6 * 3_600_000,
    retry: 0,
  });
  const d = snap.data;
  if (!d)
    return snap.isLoading ? (
      <div className="h-64 animate-pulse rounded-2xl bg-muted" aria-busy />
    ) : (
      <MarketUnavailable what="Painel de mercado" />
    );
  const fx = d.fx?.data;
  const ind = d.indicators?.data;
  const cr = d.crypto?.data;
  const st = d.stocks?.data;
  const sem = semaforoDoDia({
    usdPct: fx?.USD?.pctChange ?? null,
    ipca12m: ind?.ipca12m?.value ?? null,
    selicMeta: ind?.selicMeta?.value ?? null,
    btcChange24h: cr?.find((c) => c.symbol === "BTC")?.change24h ?? null,
  });
  const nada = !fx && !ind && !cr && !st;
  const ms = (c: { fetchedAt: string; stale: boolean } | null, sources: string[]) =>
    c ? { fetchedAt: c.fetchedAt, stale: c.stale, sources } : null;

  return (
    <div className="space-y-8">
      <section aria-labelledby="sem-dia">
        <h2 id="sem-dia" className="font-display text-xl font-bold">
          Semáforo do dia
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <SemaforoCallout tone="ok" muted={sem.aceso !== "ok"}>
            {sem.ok}
          </SemaforoCallout>
          <SemaforoCallout tone="warn" muted={sem.aceso !== "warn"}>
            {sem.warn}
          </SemaforoCallout>
          <SemaforoCallout tone="bad" muted={sem.aceso !== "bad"}>
            {sem.bad}
          </SemaforoCallout>
        </div>
      </section>

      {nada && <MarketUnavailable what="Painel de mercado" />}

      {fx && (
        <Grupo
          id="cambio"
          titulo="Câmbio"
          stale={ms(d.fx, [
            fx.USD?.provider === "awesomeapi" || !fx.USD?.provider
              ? "AwesomeAPI"
              : fx.USD.provider === "frankfurter"
                ? "Frankfurter"
                : "Rates By Exchange Rate API",
          ])}
        >
          {["USD", "EUR", "GBP", "ARS"].map(
            (c) =>
              fx[c] && (
                <Card
                  key={c}
                  label={fx[c].name}
                  value={formatBRL(fx[c].bid, c === "ARS" ? 4 : 2)}
                  pct={fx[c].pctChange}
                  insightKey={c === "USD" ? "dolar" : "cambio"}
                  hint={
                    d.ptaxUsd?.data && c === "USD"
                      ? `PTAX ${formatNumber(d.ptaxUsd.data.venda, 4)} (${d.ptaxUsd.data.dataCotacao})`
                      : undefined
                  }
                />
              ),
          )}
        </Grupo>
      )}

      <figure className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <figcaption className="font-bold">Últimos 30 dias</figcaption>
          <Tabs value={pair} onValueChange={setPair}>
            <TabsList>
              {CHART_PAIRS.map((p) => (
                <TabsTrigger key={p.pair} value={p.pair}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {daily.data?.data?.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={daily.data.data}>
              <XAxis
                dataKey="date"
                tickFormatter={(x: string) => `${x.slice(8, 10)}/${x.slice(5, 7)}`}
                minTickGap={24}
              />
              <YAxis
                domain={["auto", "auto"]}
                width={72}
                tickFormatter={(v: number) => formatNumber(v, pair === "BTC-BRL" ? 0 : 2)}
              />
              <Tooltip
                formatter={(v) => formatBRL(Number(v), pair === "BTC-BRL" ? 0 : 4)}
                labelFormatter={(x) => String(x).split("-").reverse().join("/")}
              />
              <Line
                type="monotone"
                dataKey="bid"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            {daily.isLoading ? "Carregando histórico…" : "Histórico indisponível no momento."}
          </p>
        )}
      </figure>

      {cr && (
        <Grupo id="cripto" titulo="Cripto" stale={ms(d.crypto, ["CoinGecko", "AwesomeAPI"])}>
          {cr.map((c) => (
            <Card
              key={c.id}
              label={c.name}
              value={formatBRL(c.brl, 0)}
              pct={c.change24h}
              insightKey="bitcoin"
            />
          ))}
        </Grupo>
      )}

      {st && st.length > 0 && (
        <Grupo id="bolsa" titulo="Bolsa (B3)" stale={ms(d.stocks, ["Brapi"])}>
          {st.map((s) => (
            <Card
              key={s.symbol}
              label={s.name}
              value={s.symbol === "^BVSP" ? `${formatNumber(s.price, 0)} pts` : formatBRL(s.price)}
              pct={s.changePct}
              insightKey={s.symbol === "^BVSP" ? "ibovespa" : "acoes"}
            />
          ))}
        </Grupo>
      )}

      {ind && (
        <Grupo
          id="juros"
          titulo="Juros, inflação e poupança"
          stale={ms(d.indicators, ["Banco Central do Brasil (SGS)"])}
        >
          {ind.selicMeta && (
            <Card
              label="Selic (meta)"
              value={`${formatNumber(ind.selicMeta.value)}% a.a.`}
              insightKey="selic"
              hint={`desde ${ind.selicMeta.date.split("-").reverse().join("/")}`}
            />
          )}
          {ind.cdiAnual && (
            <Card
              label="CDI"
              value={`${formatNumber(ind.cdiAnual.value)}% a.a.`}
              insightKey="cdi"
            />
          )}
          {ind.ipcaMensal && (
            <Card
              label="IPCA do mês"
              value={`${formatNumber(ind.ipcaMensal.value)}%`}
              insightKey="ipca"
              hint={ind.ipcaMensal.date.slice(0, 7).split("-").reverse().join("/")}
            />
          )}
          {ind.ipca12m && (
            <Card
              label="IPCA 12 meses"
              value={`${formatNumber(ind.ipca12m.value)}%`}
              insightKey="ipca12"
            />
          )}
          {ind.poupancaMensal && (
            <Card
              label="Poupança"
              value={`${formatNumber(ind.poupancaMensal.value)}% a.m.`}
              insightKey="poupanca"
              hint="pela regra da Selic (+ TR)"
            />
          )}
        </Grupo>
      )}

      <p className="text-xs text-muted-foreground">
        Fontes: AwesomeAPI, Frankfurter, Rates By Exchange Rate API, Banco Central do Brasil (PTAX e
        SGS), CoinGecko e Brapi. Informação educativa; não é recomendação de investimento. Dados com
        atraso de até 30 minutos. Gerado em{" "}
        {new Date(d.generatedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.
      </p>
    </div>
  );
}
