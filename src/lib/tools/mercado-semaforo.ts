// Semáforo do dia (doc 06 §3.2): regras fixas, função pura. Sempre os três sinais, na ordem ok → warn → bad.
export interface SemaforoEntrada {
  usdPct: number | null;
  ipca12m: number | null;
  selicMeta: number | null;
  btcChange24h: number | null;
}
export interface SemaforoSaida {
  ok: string;
  warn: string;
  bad: string;
  aceso: "ok" | "warn" | "bad";
}
const APAGADO = "Hoje este sinal não está aceso.";

export function semaforoDoDia(e: SemaforoEntrada): SemaforoSaida {
  const usd = e.usdPct == null ? 0 : Math.abs(e.usdPct);
  const ipca = e.ipca12m;
  const selic = e.selicMeta;
  const btc = e.btcChange24h;

  const bad = usd >= 2.5 || (ipca != null && ipca > 7) || (btc != null && btc <= -8);
  const warn =
    usd >= 1 || (selic != null && selic >= 12) || (ipca != null && ipca >= 5 && ipca <= 7);
  const ok = usd < 1 && (ipca == null || ipca < 5);

  const motivosWarn = [
    usd >= 1 ? `o dólar se mexeu ${usd.toFixed(1).replace(".", ",")}% hoje` : "",
    selic != null && selic >= 12
      ? `a Selic em ${selic.toFixed(2).replace(".", ",")}% deixa qualquer dívida cara`
      : "",
    ipca != null && ipca >= 5 && ipca <= 7
      ? `a inflação de 12 meses (${ipca.toFixed(2).replace(".", ",")}%) passou do centro da meta`
      : "",
  ].filter(Boolean);
  const motivosBad = [
    usd >= 2.5 ? `dólar com solavanco de ${usd.toFixed(1).replace(".", ",")}%` : "",
    ipca != null && ipca > 7
      ? `inflação de 12 meses acima de 7% (${ipca.toFixed(2).replace(".", ",")}%)`
      : "",
    btc != null && btc <= -8
      ? `bitcoin caiu ${Math.abs(btc).toFixed(1).replace(".", ",")}% em 24 h`
      : "",
  ].filter(Boolean);

  return {
    ok: ok
      ? "Sinal verde: dólar e inflação estáveis. Nada no mercado pede ação hoje; siga o orçamento e os aportes combinados em casa."
      : APAGADO,
    warn: warn
      ? `Sinal de atenção: ${motivosWarn.join("; ")}. Evite compra parcelada em dólar e priorize quitar dívida cara antes de investir.`
      : APAGADO,
    bad: bad
      ? `Sinal de alerta: ${motivosBad.join("; ")}. Não tome decisão de investimento com base num dia; se tiver dívida ou dinheiro parado, procure um profissional certificado.`
      : APAGADO,
    aceso: bad ? "bad" : warn ? "warn" : "ok",
  };
}
