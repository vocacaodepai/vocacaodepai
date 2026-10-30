import { useMemo, useState } from "react";
import {
  FATOR_ATIVIDADE,
  aguaDiariaMl,
  classeImc,
  gastoDiario,
  imc,
  metaCalorica,
  riscoCintura,
  semaforoSaude,
  tmbMifflin,
  type NivelAtividade,
} from "@/lib/tools/saude";
import { formatNumber, parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";

export default function BmiAndCalories() {
  const [sexo, setSexo] = useState<"homem" | "mulher">("homem");
  const [idade, setIdade] = useState("38");
  const [altura, setAltura] = useState("178");
  const [peso, setPeso] = useState("85");
  const [cintura, setCintura] = useState("");
  const [nivel, setNivel] = useState<NivelAtividade>("moderado");
  const [objetivo, setObjetivo] = useState<"manter" | "perder" | "ganhar">("manter");
  const r = useMemo(() => {
    const kg = parseBRNumber(peso);
    const cm = parseBRNumber(altura);
    const id = parseBRNumber(idade);
    if (!(kg > 0 && cm > 0 && id > 0)) return null;
    const cin = parseBRNumber(cintura);
    const i = imc(kg, cm);
    const tmb = tmbMifflin(kg, cm, id, sexo);
    const get = gastoDiario(tmb, nivel);
    return {
      i,
      classe: classeImc(i),
      tmb,
      get,
      meta: metaCalorica(get, objetivo),
      agua: aguaDiariaMl(kg),
      cintura: Number.isFinite(cin) && cin > 0 ? cin : null,
      rc: riscoCintura(Number.isFinite(cin) ? cin : null, sexo),
      sem: semaforoSaude(i, Number.isFinite(cin) ? cin : null, sexo),
    };
  }, [sexo, idade, altura, peso, cintura, nivel, objetivo]);
  const pos = r ? Math.min(100, Math.max(0, ((r.i - 15) / 25) * 100)) : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <SelectField
          id="sexo"
          label="Para quem"
          value={sexo}
          onChange={(v) => setSexo(v as typeof sexo)}
          options={[
            { value: "homem", label: "Para mim (homem)" },
            { value: "mulher", label: "Para a esposa" },
          ]}
        />
        <div className="grid grid-cols-3 gap-3">
          <NumberField id="idade" label="Idade" value={idade} onChange={setIdade} />
          <NumberField id="altura" label="Altura (cm)" value={altura} onChange={setAltura} />
          <NumberField id="peso" label="Peso (kg)" value={peso} onChange={setPeso} />
        </div>
        <NumberField
          id="cintura"
          label="Cintura (cm, opcional)"
          value={cintura}
          onChange={setCintura}
          hint="Na altura do umbigo, sem apertar."
        />
        <SelectField
          id="nivel"
          label="Nível de atividade"
          value={nivel}
          onChange={(v) => setNivel(v as NivelAtividade)}
          options={Object.keys(FATOR_ATIVIDADE).map((k) => ({
            value: k,
            label:
              {
                sedentario: "Sedentário",
                leve: "Leve (caminha, tarefas de casa)",
                moderado: "Moderado (treina 3–5×/semana)",
                intenso: "Intenso (6–7×/semana)",
                atleta: "Atleta / trabalho pesado",
              }[k] ?? k,
          }))}
        />
        <SelectField
          id="objetivo"
          label="Objetivo"
          value={objetivo}
          onChange={(v) => setObjetivo(v as typeof objetivo)}
          options={[
            { value: "manter", label: "Manter o peso" },
            { value: "perder", label: "Perder peso (−500 kcal/dia)" },
            { value: "ganhar", label: "Ganhar massa (+300 kcal/dia)" },
          ]}
        />
      </form>
      <section aria-live="polite" className="space-y-4">
        {r && (
          <>
            <ToolResultCard
              big
              label="IMC"
              value={formatNumber(r.i, 1)}
              hint={r.classe}
              tone={r.i < 18.5 || r.i >= 25 ? (r.i >= 30 ? "danger" : "warning") : "success"}
            />
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-gradient-to-r from-warning via-success to-destructive"
              role="img"
              aria-label={`IMC ${formatNumber(r.i, 1)}`}
            >
              <div className="h-full w-1 bg-foreground" style={{ marginLeft: `${pos}%` }} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ToolResultCard
                label="Metabolismo basal"
                value={`${formatNumber(r.tmb, 0)} kcal`}
                hint="Mifflin-St Jeor"
              />
              <ToolResultCard label="Gasto diário" value={`${formatNumber(r.get, 0)} kcal`} />
              <ToolResultCard
                label="Meta para o objetivo"
                value={`${formatNumber(r.meta - 100, 0)}–${formatNumber(r.meta + 100, 0)} kcal`}
                tone="primary"
              />
              <ToolResultCard label="Água por dia" value={`${formatNumber(r.agua / 1000, 1)} L`} />
            </div>
            {r.cintura != null && (
              <ToolResultCard
                label="Cintura e risco (OMS)"
                value={`${formatNumber(r.cintura, 0)} cm`}
                hint={
                  r.rc === "bad"
                    ? "risco aumentado"
                    : r.rc === "warn"
                      ? "atenção"
                      : "dentro do esperado"
                }
                tone={r.rc === "bad" ? "danger" : r.rc === "warn" ? "warning" : "success"}
              />
            )}
          </>
        )}
        <SemaforoTrio
          titulo="Semáforo do pai: o corpo"
          aceso={r?.sem ?? null}
          ok="Sinal verde: IMC entre 18,5 e 24,9 e cintura abaixo de 94 cm. Mantenha o movimento e o check-up anual."
          warn="Sinal de atenção: sobrepeso, peso abaixo do normal ou cintura entre 94 e 102 cm. Ajuste o prato e o movimento; faça o check-up anual."
          bad="Sinal de alerta: obesidade ou cintura acima de 102 cm. Antes de qualquer dieta ou treino intenso, procure um médico para avaliar pressão, glicose e colesterol."
        />
        {r && (
          <ToolShareButton
            title="IMC e gasto calórico — Vocação de Pai"
            text={`IMC ${formatNumber(r.i, 1)} (${r.classe}); gasto diário ${formatNumber(r.get, 0)} kcal; meta ${formatNumber(r.meta, 0)} kcal.`}
          />
        )}
      </section>
    </div>
  );
}
