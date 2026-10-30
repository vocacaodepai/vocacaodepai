import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import {
  BROCAS_POLEGADA,
  BUCHAS,
  CATEGORIAS,
  FORNO,
  PONTO_CARNE,
  convert,
  type Categoria,
} from "@/lib/tools/unidades";
import { formatNumber, parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fmt = (v: number) => (Number.isFinite(v) ? formatNumber(v, Math.abs(v) >= 100 ? 2 : 4) : "—");

export default function UnitConverter() {
  const [cat, setCat] = useState<Categoria | "brocas">("comprimento");
  const c = CATEGORIAS.find((x) => x.id === cat) ?? CATEGORIAS[0];
  const [de, setDe] = useState(c.unidades[0].id);
  const [para, setPara] = useState(c.unidades[1].id);
  const [valor, setValor] = useState("1");
  const v = parseBRNumber(valor);
  const res = useMemo(
    () => (cat === "brocas" ? NaN : convert(cat, de, para, v)),
    [cat, de, para, v],
  );
  const mudaCat = (id: string) => {
    setCat(id as Categoria | "brocas");
    const nc = CATEGORIAS.find((x) => x.id === id);
    if (nc) {
      setDe(nc.unidades[0].id);
      setPara(nc.unidades[1].id);
    }
  };
  const opts = c.unidades.map((u) => ({ value: u.id, label: u.nome }));
  const nome = (id: string) => c.unidades.find((u) => u.id === id)?.nome ?? id;

  return (
    <Tabs value={cat} onValueChange={mudaCat}>
      <TabsList className="h-auto flex-wrap justify-start">
        {CATEGORIAS.map((x) => (
          <TabsTrigger key={x.id} value={x.id}>
            {x.nome}
          </TabsTrigger>
        ))}
        <TabsTrigger value="brocas">Brocas e buchas</TabsTrigger>
      </TabsList>
      {CATEGORIAS.map((x) => (
        <TabsContent key={x.id} value={x.id}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <form
              className="space-y-4 rounded-2xl border border-border bg-card p-5"
              onSubmit={(e) => e.preventDefault()}
            >
              <NumberField id="valor" label="Valor" value={valor} onChange={setValor} />
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <SelectField id="de" label="De" value={de} onChange={setDe} options={opts} />
                <button
                  type="button"
                  aria-label="Inverter unidades"
                  onClick={() => {
                    setDe(para);
                    setPara(de);
                  }}
                  className="mb-1 rounded-full border border-border p-2 hover:border-primary"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
                <SelectField
                  id="para"
                  label="Para"
                  value={para}
                  onChange={setPara}
                  options={opts}
                />
              </div>
            </form>
            <section aria-live="polite" className="space-y-4">
              <ToolResultCard
                big
                label={`${Number.isFinite(v) ? formatNumber(v, 4).replace(/,?0+$/, "") : "—"} ${nome(de)} em ${nome(para)}`}
                value={fmt(res)}
                tone="primary"
              />
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-sm font-bold">Tabela rápida</p>
                <table className="mt-2 w-full text-sm">
                  <tbody>
                    {c.unidades
                      .filter((u) => u.id !== de)
                      .slice(0, 6)
                      .map((u) => (
                        <tr key={u.id} className="border-t border-border">
                          <td className="py-1">{u.nome}</td>
                          <td className="py-1 text-right font-semibold">
                            {fmt(convert(x.id, de, u.id, v))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {x.id === "temperatura" && (
                <div className="grid gap-3 sm:grid-cols-2 text-sm">
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-bold">Forno</p>
                    {FORNO.map((f) => (
                      <p key={f.nome}>
                        {f.nome}: {f.c} °C / {Math.round((f.c * 9) / 5 + 32)} °F
                      </p>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-bold">Ponto da carne (interno)</p>
                    {PONTO_CARNE.map((p) => (
                      <p key={p.nome}>
                        {p.nome}: {p.c}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        </TabsContent>
      ))}
      <TabsContent value="brocas">
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold">Polegada fracionária → mm</p>
            <table className="mt-2 w-full">
              <tbody>
                {BROCAS_POLEGADA.map((b) => (
                  <tr key={b.pol} className="border-t border-border">
                    <td className="py-1">{b.pol}</td>
                    <td className="py-1 text-right font-semibold">{formatNumber(b.mm, 3)} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-bold">Bucha → broca → parafuso</p>
            <table className="mt-2 w-full">
              <tbody>
                {BUCHAS.map((b) => (
                  <tr key={b.bucha} className="border-t border-border">
                    <td className="py-1">{b.bucha}</td>
                    <td className="py-1 font-semibold">broca {b.brocaMm} mm</td>
                    <td className="py-1 text-right text-muted-foreground">{b.parafuso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              Parede oca (drywall, tijolo furado) pede bucha específica.
            </p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
