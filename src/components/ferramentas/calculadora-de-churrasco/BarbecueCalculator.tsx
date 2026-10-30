import { useMemo, useState } from "react";
import { Copy, Printer } from "lucide-react";
import {
  FATOR_DURACAO,
  PRESETS,
  calcularChurrasco,
  listaComoTexto,
} from "@/lib/tools/churrasco-regras";
import { copyText } from "@/lib/tools/share";
import { parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/router-compat";

const n = (s: string) => Math.max(0, Math.floor(parseBRNumber(s) || 0));

export default function BarbecueCalculator() {
  const [homens, setHomens] = useState("6");
  const [mulheres, setMulheres] = useState("4");
  const [criancas, setCriancas] = useState("2");
  const [bebem, setBebem] = useState("6");
  const [duracao, setDuracao] = useState<keyof typeof FATOR_DURACAO>("4h");
  const [preset, setPreset] = useState<keyof typeof PRESETS>("classico");
  const [queijo, setQueijo] = useState(false);
  const [abacaxi, setAbacaxi] = useState(false);
  const lista = useMemo(
    () =>
      calcularChurrasco({
        homens: n(homens),
        mulheres: n(mulheres),
        criancas: n(criancas),
        adultosQueBebem: n(bebem),
        duracao,
        preset,
        extras: { queijoCoalho: queijo, abacaxi },
      }),
    [homens, mulheres, criancas, bebem, duracao, preset, queijo, abacaxi],
  );
  const texto = listaComoTexto(lista);
  const kg = (v: number) => `${v.toFixed(1).replace(".", ",")} kg`;
  const itens: Array<[string, string]> = [
    ["Carne (total)", kg(lista.carneKg)],
    ...lista.porCorte.map((c) => [`  ${c.nome}`, kg(c.kg)] as [string, string]),
    ["Carvão", `${lista.carvaoKg} kg (${lista.carvaoSacos})`],
    ["Sal grosso", `${lista.salG} g`],
    ["Pão de alho", `${lista.paoDeAlho} un`],
    ["Farofa", kg(lista.farofaKg)],
    ["Vinagrete", kg(lista.vinagreteKg)],
    ["Arroz", kg(lista.arrozKg)],
    ...(lista.cervejaL > 0
      ? [
          [
            "Cerveja",
            `${lista.cervejaL.toFixed(1).replace(".", ",")} L (${lista.cervejaLatas} latas de 350 ml)`,
          ] as [string, string],
        ]
      : []),
    ["Refrigerante", `${lista.refrigeranteL} L`],
    ["Água", `${lista.aguaL.toFixed(1).replace(".", ",")} L`],
    ["Gelo", `${lista.geloKg} kg`],
    ...(lista.queijoCoalhoUn
      ? [["Queijo coalho", `${lista.queijoCoalhoUn} espetos`] as [string, string]]
      : []),
    ...(lista.abacaxiUn ? [["Abacaxi", `${lista.abacaxiUn} un`] as [string, string]] : []),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5 print:hidden"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="grid grid-cols-3 gap-3">
          <NumberField id="homens" label="Homens" value={homens} onChange={setHomens} />
          <NumberField id="mulheres" label="Mulheres" value={mulheres} onChange={setMulheres} />
          <NumberField
            id="criancas"
            label="Crianças (3–12)"
            value={criancas}
            onChange={setCriancas}
          />
        </div>
        <NumberField
          id="bebem"
          label="Adultos que bebem cerveja"
          value={bebem}
          onChange={setBebem}
        />
        <SelectField
          id="duracao"
          label="Duração"
          value={duracao}
          onChange={(v) => setDuracao(v as keyof typeof FATOR_DURACAO)}
          options={[
            { value: "2h", label: "Curto (2 h)" },
            { value: "4h", label: "Normal (4 h)" },
            { value: "6h+", label: "Longo (6 h ou mais)" },
          ]}
        />
        <SelectField
          id="preset"
          label="Cortes"
          value={preset}
          onChange={(v) => setPreset(v as keyof typeof PRESETS)}
          options={[
            {
              value: "classico",
              label: "Clássico: picanha, contrafilé, fraldinha, linguiça, frango",
            },
            { value: "economico", label: "Econômico: alcatra, fraldinha, linguiça, frango" },
            { value: "premium", label: "Premium: picanha, ancho, costela, linguiça" },
          ]}
        />
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox checked={queijo} onCheckedChange={(v) => setQueijo(Boolean(v))} /> Queijo
            coalho
          </label>
          <label className="flex items-center gap-2">
            <Checkbox checked={abacaxi} onCheckedChange={(v) => setAbacaxi(Boolean(v))} /> Abacaxi
          </label>
        </div>
      </form>

      <section aria-live="polite" className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <ToolResultCard
            big
            label="Carne"
            value={kg(lista.carneKg)}
            tone="primary"
            hint={`${lista.pessoas} pessoas, já com 10% de folga`}
          />
          <ToolResultCard label="Carvão" value={`${lista.carvaoKg} kg`} hint={lista.carvaoSacos} />
          <ToolResultCard
            label="Cerveja"
            value={lista.cervejaL > 0 ? `${lista.cervejaL.toFixed(1).replace(".", ",")} L` : "—"}
            hint={lista.cervejaL > 0 ? `${lista.cervejaLatas} latas` : "ninguém bebe"}
          />
        </div>
        <div id="lista-churrasco" className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">Lista de compras</h2>
            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={() => copyText(texto, "Lista copiada. Cole no grupo da família.")}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold hover:border-primary"
              >
                <Copy className="h-3.5 w-3.5" /> Copiar lista
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold hover:border-primary"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </button>
            </div>
          </div>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {itens.map(([k, v]) => (
                <tr key={k} className="border-t border-border">
                  <td
                    className={`py-1.5 ${k.startsWith("  ") ? "pl-5 text-muted-foreground" : "font-semibold"}`}
                  >
                    {k.trim()}
                  </td>
                  <td className="py-1.5 text-right">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground print:hidden">
            Utensílios que fazem diferença (faca, tábua com canaleta, termômetro de espeto):{" "}
            <Link
              to="/loja/categoria/churrasco-e-cozinha"
              className="font-bold text-primary hover:underline"
            >
              Loja do Pai › Churrasco & Cozinha
            </Link>
            .
          </p>
        </div>
        <SemaforoTrio
          titulo="Semáforo do pai: segurança na churrasqueira"
          aceso={null}
          ok="Sinal verde: carne bovina inteira (picanha, contrafilé, fraldinha) pode ir ao ponto, 55 a 63 °C no termômetro."
          warn="Sinal de atenção: frango, linguiça e carne moída só bem passados, 74 °C no termômetro de espeto; nunca sirva rosado."
          bad="Sinal de alerta: churrasqueira a carvão em ambiente fechado gera monóxido de carbono. Em caso de tontura, dor de cabeça ou vômito, saia para o ar livre e ligue 192."
        />
        <div className="print:hidden">
          <ToolShareButton
            title="Calculadora de churrasco — Vocação de Pai"
            text={`Churrasco para ${lista.pessoas} pessoas: ${kg(lista.carneKg)} de carne, ${lista.carvaoKg} kg de carvão${lista.cervejaL ? `, ${lista.cervejaL.toFixed(1).replace(".", ",")} L de cerveja` : ""}.`}
          />
        </div>
      </section>
    </div>
  );
}
