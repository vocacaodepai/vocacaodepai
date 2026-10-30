import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import {
  ARTIGO_MALA,
  GRUPOS,
  QUANDO,
  TOTAL_ITENS,
  type Quando,
} from "@/lib/tools/checklist-maternidade-data";
import { getPublishedSlugs } from "@/lib/tools/related.functions";
import { usePersisted } from "@/hooks/usePersisted";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/router-compat";

const DAY = 86400000;

export default function HospitalBagChecklist() {
  const [feitos, setFeitos] = usePersisted<string[]>("vdp:tool:checklist-da-maternidade", []);
  const [dpp, setDpp] = usePersisted<string>("vdp:tool:checklist-da-maternidade:dpp", "");
  const [filtro, setFiltro] = useState<Quando | "todos">("todos");
  const slugs = useMemo(
    () =>
      GRUPOS.flatMap((g) => g.itens.map((i) => i.link ?? ""))
        .filter((l) => l.startsWith("/post/"))
        .map((l) => l.replace("/post/", ""))
        .concat([ARTIGO_MALA.replace("/post/", "")]),
    [],
  );
  const pub = useQuery({
    queryKey: ["checklist:artigos"],
    queryFn: () => getPublishedSlugs({ data: { slugs } }),
    staleTime: 3_600_000,
    retry: 0,
  });
  const publicados = pub.data ?? [];
  const toggle = (id: string) =>
    setFeitos((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const pct = Math.round((feitos.length / TOTAL_ITENS) * 100);
  const dias = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dpp)) return null;
    const d = new Date(`${dpp}T12:00:00Z`).getTime();
    const hoje = Date.now();
    return {
      paraParto: Math.ceil((d - hoje) / DAY),
      para36: Math.ceil((d - 28 * DAY - hoje) / DAY),
    };
  }, [dpp]);
  const pendentes36 = GRUPOS.filter((g) => ["documentos", "carro"].includes(g.id))
    .flatMap((g) => g.itens)
    .filter((i) => i.quando === "36-semanas" && !feitos.includes(i.id)).length;
  const aceso = dias == null ? null : dias.para36 <= 0 && pendentes36 > 0 ? "warn" : "ok";
  const linkOk = (l?: string) =>
    l && (!l.startsWith("/post/") || publicados.includes(l.replace("/post/", "")));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <ToolResultCard
          big
          label="Progresso"
          value={`${feitos.length} de ${TOTAL_ITENS}`}
          hint={`${pct}% pronto`}
          tone="primary"
        />
        <div className="rounded-2xl border border-border bg-card p-4 print:hidden">
          <Label htmlFor="dpp">Data prevista do parto</Label>
          <Input
            id="dpp"
            type="date"
            value={dpp}
            onChange={(e) => setDpp(e.target.value)}
            className="mt-1"
          />
        </div>
        <ToolResultCard
          label="Contagem regressiva"
          value={
            dias
              ? dias.para36 > 0
                ? `${dias.para36} dias`
                : dias.paraParto > 0
                  ? `${dias.paraParto} dias`
                  : "chegou a hora"
              : "—"
          }
          hint={
            dias
              ? dias.para36 > 0
                ? "para a 36ª semana (tudo pronto)"
                : "para a data prevista"
              : "informe a data prevista"
          }
        />
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted print:hidden">
        <div className="h-full bg-success" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {[{ id: "todos" as const, nome: "Todos" }, ...QUANDO].map((q) => (
          <button
            key={q.id}
            type="button"
            onClick={() => setFiltro(q.id)}
            aria-pressed={filtro === q.id}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${filtro === q.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
          >
            {q.nome}
          </button>
        ))}
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold hover:border-primary"
        >
          <Printer className="h-3.5 w-3.5" /> Imprimir
        </button>
        <ToolShareButton
          title="Checklist do pai — Vocação de Pai"
          text={`Checklist do pai: ${feitos.length} de ${TOTAL_ITENS} itens prontos.`}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {GRUPOS.map((g) => {
          const itens = g.itens.filter((i) => filtro === "todos" || i.quando === filtro);
          if (!itens.length) return null;
          return (
            <section key={g.id} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-bold">{g.titulo}</h2>
              <ul className="mt-2 space-y-2">
                {itens.map((i) => (
                  <li key={i.id} className="flex items-start gap-3 text-sm">
                    <Checkbox
                      id={`c-${i.id}`}
                      checked={feitos.includes(i.id)}
                      onCheckedChange={() => toggle(i.id)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={`c-${i.id}`}
                      className={`cursor-pointer ${feitos.includes(i.id) ? "line-through opacity-60" : ""}`}
                    >
                      {i.texto}
                      {linkOk(i.link) && (
                        <>
                          {" "}
                          <Link to={i.link!} className="font-bold text-primary hover:underline">
                            →
                          </Link>
                        </>
                      )}
                      <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {QUANDO.find((q) => q.id === i.quando)?.nome}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {publicados.includes(ARTIGO_MALA.replace("/post/", "")) && (
        <Link
          to={ARTIGO_MALA}
          className="inline-block text-sm font-bold text-primary hover:underline"
        >
          Ler o artigo: a mala da maternidade do pai →
        </Link>
      )}
      <SemaforoTrio
        titulo="Semáforo do pai: o dia do parto"
        aceso={aceso}
        ok="Sinal verde: mala, documentos e carro prontos antes da 36ª semana. Agora é só esperar e cuidar da esposa."
        warn="Sinal de atenção: a 36ª semana passou e ainda há documento ou item do carro em aberto. Resolva hoje; o parto pode vir antes da data."
        bad="Sinal de alerta: bolsa rota, sangramento, dor de cabeça forte com visão turva, pressão alta ou contrações regulares antes de 37 semanas — leve a esposa à maternidade agora ou ligue 192."
      />
    </div>
  );
}
