import { SemaforoCallout, type SemaforoTone } from "./SemaforoCallout";

const APAGADO = "Hoje este sinal não está aceso.";

/** Os 3 sinais do Semáforo do Pai na ordem fixa ok → warn → bad; os que não valem para o caso ficam em cinza. */
export function SemaforoTrio({
  titulo,
  ok,
  warn,
  bad,
  aceso,
}: {
  titulo: string;
  ok: string;
  warn: string;
  bad: string;
  /** qual sinal está aceso agora; null = mostrar só as regras (todos acesos) */
  aceso: SemaforoTone | null;
}) {
  const items: Array<{ tone: SemaforoTone; text: string }> = [
    { tone: "ok", text: ok },
    { tone: "warn", text: warn },
    { tone: "bad", text: bad },
  ];
  return (
    <section aria-labelledby="semaforo-pai" className="mt-6">
      <h2 id="semaforo-pai" className="font-display text-xl font-bold">
        {titulo}
      </h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {items.map((i) => {
          const muted = aceso != null && aceso !== i.tone;
          return (
            <SemaforoCallout key={i.tone} tone={i.tone} muted={muted}>
              {muted ? APAGADO : i.text}
            </SemaforoCallout>
          );
        })}
      </div>
    </section>
  );
}
