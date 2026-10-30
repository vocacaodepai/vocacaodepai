import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeftRight } from "lucide-react";
import { getFxDaily, getFxLast, getPtax } from "@/lib/market/fetchers";
import type { Cached, FxLast } from "@/lib/market/types";
import { CURRENCIES } from "@/lib/tools/currencies";
import {
  formatDateTimeBR,
  formatMoney,
  formatNumber,
  formatPct,
  parseBRNumber,
} from "@/lib/tools/format";
import { MarketStale, MarketUnavailable } from "@/components/ferramentas/MarketStale";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const route = getRouteApi("/_site/ferramentas/$slug");
const PTAX_LIST = "USD, EUR, GBP, JPY, CHF, CAD, AUD, DKK, NOK, SEK";

function readQuery() {
  if (typeof window === "undefined") return { de: "USD", para: "BRL", valor: "100" };
  const q = new URLSearchParams(window.location.search);
  const ok = (c: string | null) =>
    c && CURRENCIES.some((x) => x.code === c.toUpperCase()) ? c.toUpperCase() : null;
  return {
    de: ok(q.get("de")) ?? "USD",
    para: ok(q.get("para")) ?? "BRL",
    valor: q.get("valor") ?? "100",
  };
}

export default function CurrencyConverter() {
  const { preloaded } = route.useLoaderData() as { preloaded: Cached<FxLast> | null };
  const [{ de, para, valor }, set] = useState(readQuery);
  const amount = parseBRNumber(valor);

  const fx = useQuery({
    queryKey: ["fx:last"],
    queryFn: () => getFxLast(),
    initialData: preloaded ?? undefined,
    staleTime: 15 * 60_000,
    refetchInterval: 15 * 60_000,
    retry: 1,
  });
  const pairCode = de === "BRL" ? para : de;
  const daily = useQuery({
    queryKey: ["fx:daily", pairCode],
    queryFn: () => getFxDaily({ data: { pair: `${pairCode}-BRL`, days: 30 } }),
    staleTime: 6 * 3_600_000,
    enabled: pairCode !== "BRL",
    retry: 0,
  });
  const ptax = useQuery({
    queryKey: ["ptax", pairCode],
    queryFn: () => getPtax({ data: { code: pairCode } }),
    staleTime: 6 * 3_600_000,
    enabled: pairCode !== "BRL",
    retry: 0,
  });

  const data = fx.data?.data;
  const rate = useMemo(() => {
    const brl = (code: string) => (code === "BRL" ? 1 : (data?.[code]?.bid ?? null));
    const a = brl(de);
    const b = brl(para);
    return a && b ? a / b : null;
  }, [data, de, para]);
  const result = rate && Number.isFinite(amount) ? amount * rate : null;
  const quote = data?.[pairCode];
  const digits = (code: string) => (code === "BTC" || code === "ETH" ? 6 : 2);

  const swap = () => set((s) => ({ ...s, de: s.para, para: s.de }));
  const shareText =
    result != null
      ? `${formatMoney(amount, de, digits(de))} = ${formatMoney(result, para, digits(para))} (cotação comercial)`
      : "";
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ferramentas/conversor-de-moedas?de=${de}&para=${para}&valor=${encodeURIComponent(valor)}`
      : undefined;
  const opts = CURRENCIES.map((c) => (
    <option key={c.code} value={c.code}>
      {c.flag} {c.code} — {c.name}
    </option>
  ));
  const selectCls =
    "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <Label htmlFor="valor">Valor</Label>
          <Input
            id="valor"
            inputMode="decimal"
            value={valor}
            onChange={(e) => set((s) => ({ ...s, valor: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <div>
            <Label htmlFor="de">De</Label>
            <select
              id="de"
              value={de}
              onChange={(e) => set((s) => ({ ...s, de: e.target.value }))}
              className={selectCls}
            >
              {opts}
            </select>
          </div>
          <button
            type="button"
            onClick={swap}
            aria-label="Inverter moedas"
            className="mb-1 rounded-full border border-border p-2 hover:border-primary"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <div>
            <Label htmlFor="para">Para</Label>
            <select
              id="para"
              value={para}
              onChange={(e) => set((s) => ({ ...s, para: e.target.value }))}
              className={selectCls}
            >
              {opts}
            </select>
          </div>
        </div>
        {fx.data && (
          <MarketStale
            fetchedAt={fx.data.fetchedAt}
            stale={fx.data.stale}
            sources={[
              quote?.provider === "frankfurter"
                ? "Frankfurter (BCE)"
                : quote?.provider === "erapi"
                  ? "Rates By Exchange Rate API"
                  : "AwesomeAPI",
              "Banco Central do Brasil (PTAX)",
            ]}
          />
        )}
        {!fx.data && !fx.isLoading && <MarketUnavailable what="Cotação" />}
      </form>

      <section aria-live="polite" className="space-y-4">
        <ToolResultCard
          big
          label={`${formatMoney(Number.isFinite(amount) ? amount : 0, de, digits(de))} em ${para}`}
          value={
            result != null
              ? formatMoney(result, para, digits(para))
              : fx.isLoading
                ? "Carregando…"
                : "Indisponível agora"
          }
          hint={
            rate
              ? `1 ${de} = ${formatNumber(rate, 4)} ${para} · 1 ${para} = ${formatNumber(1 / rate, 4)} ${de}`
              : undefined
          }
          tone="primary"
        />
        {quote && (
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <ToolResultCard
              label="Variação do dia"
              value={formatPct(quote.pctChange)}
              tone={quote.pctChange >= 0 ? "success" : "danger"}
            />
            <ToolResultCard label="Máxima" value={formatNumber(quote.high, 4)} />
            <ToolResultCard label="Mínima" value={formatNumber(quote.low, 4)} />
            <ToolResultCard
              label="PTAX (fechamento)"
              value={ptax.data?.data ? formatNumber(ptax.data.data.venda, 4) : "sem PTAX"}
              hint={ptax.data?.data ? `BCB · ${ptax.data.data.dataCotacao}` : `só ${PTAX_LIST}`}
            />
          </div>
        )}
        {daily.data?.data?.length ? (
          <figure className="rounded-2xl border border-border bg-card p-4">
            <figcaption className="mb-2 text-sm font-bold">
              {pairCode} em reais — últimos 30 dias
            </figcaption>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily.data.data}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`}
                  minTickGap={24}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  width={64}
                  tickFormatter={(v: number) => formatNumber(v, 2)}
                />
                <Tooltip
                  formatter={(v) => formatNumber(Number(v), 4)}
                  labelFormatter={(d) => String(d).split("-").reverse().join("/")}
                />
                <Area
                  type="monotone"
                  dataKey="bid"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            {daily.data.stale && (
              <MarketStale fetchedAt={daily.data.fetchedAt} stale sources={["AwesomeAPI"]} />
            )}
          </figure>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{quote ? `Cotação comercial de ${formatDateTimeBR(quote.timestamp)}` : ""}</span>
          {shareText && (
            <ToolShareButton
              title="Conversor de moedas — Vocação de Pai"
              text={shareText}
              url={shareUrl}
            />
          )}
        </div>
      </section>
    </div>
  );
}
