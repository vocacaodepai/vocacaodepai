import { useMemo, useState } from "react";
import { CalendarPlus, Printer } from "lucide-react";
import {
  ATUALIZADO_EM,
  DOSES,
  VACINAS,
  dataDaDose,
  diasAte,
  estadoDaDose,
  gerarIcs,
  idadeEmMeses,
  rotuloIdade,
  type EstadoDose,
} from "@/lib/tools/vacinas";
import { formatDateBR } from "@/lib/tools/format";
import { usePersisted } from "@/hooks/usePersisted";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/router-compat";

const ESTADO: Record<EstadoDose, { rotulo: string; cls: string }> = {
  feita: { rotulo: "Feita", cls: "bg-success/15 text-success" },
  "no-prazo": { rotulo: "No prazo", cls: "bg-primary/15 text-primary" },
  proxima: { rotulo: "Próxima", cls: "bg-accent/20 text-accent-foreground" },
  atrasada: { rotulo: "Atrasada", cls: "bg-warning/25 text-foreground" },
  "fora-da-janela": { rotulo: "Fora da janela", cls: "bg-destructive/15 text-destructive" },
  futura: { rotulo: "Mais tarde", cls: "bg-muted text-muted-foreground" },
};
const br = (d: string) => formatDateBR(`${d}T12:00:00Z`);

export default function VaccinationCalendar() {
  const [nasc, setNasc] = usePersisted<string>("vdp:tool:vacinas:nascimento", "");
  const [nome, setNome] = useState("");
  const valido = /^\d{4}-\d{2}-\d{2}$/.test(nasc);
  const [feitas, setFeitas] = usePersisted<string[]>(
    `vdp:tool:vacinas:${valido ? nasc : "sem-data"}`,
    [],
  );
  const idade = valido ? idadeEmMeses(nasc) : null;
  const linhas = useMemo(
    () =>
      DOSES.map((d) => ({
        d,
        estado:
          idade == null ? ("futura" as EstadoDose) : estadoDaDose(d, idade, feitas.includes(d.id)),
      })),
    [idade, feitas],
  );
  const atrasadas = linhas.filter((l) => l.estado === "atrasada").length;
  const proximas = valido
    ? linhas.filter((l) => l.estado === "proxima" || l.estado === "no-prazo").slice(0, 3)
    : [];
  const grupos = useMemo(() => {
    const m = new Map<number, typeof linhas>();
    for (const l of linhas) m.set(l.d.idadeMeses, [...(m.get(l.d.idadeMeses) ?? []), l]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [linhas]);
  const toggle = (id: string) =>
    setFeitas((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const baixarIcs = () => {
    const blob = new Blob(
      [
        gerarIcs(
          nasc,
          proximas.map((p) => p.d),
          nome.trim() || "seu filho",
        ),
      ],
      { type: "text/calendar;charset=utf-8" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vacinas-vocacao-de-pai.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 print:hidden">
        <div className="rounded-2xl border border-border bg-card p-4">
          <Label htmlFor="nasc">Data de nascimento</Label>
          <Input
            id="nasc"
            type="date"
            value={nasc}
            onChange={(e) => setNasc(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <Label htmlFor="nome">Nome do filho (opcional)</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="mt-1"
            placeholder="só para o título"
          />
        </div>
        <ToolResultCard
          label="Idade"
          value={
            idade == null
              ? "—"
              : idade < 24
                ? `${Math.floor(idade)} meses`
                : `${Math.floor(idade / 12)} anos`
          }
          hint={
            atrasadas
              ? `${atrasadas} dose(s) atrasada(s)`
              : valido
                ? "nenhuma dose atrasada"
                : "informe a data"
          }
          tone={atrasadas ? "warning" : "success"}
        />
      </div>
      <p className="text-sm font-bold">Quem leva é você: a caderneta vai na sua carteira.</p>
      {valido && proximas.length > 0 && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">
              Próximas doses{nome.trim() ? ` de ${nome.trim()}` : ""}
            </h2>
            <button
              type="button"
              onClick={baixarIcs}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-xs font-bold hover:border-primary"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Adicionar à agenda (lembrete 3 dias antes)
            </button>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {proximas.map((p) => (
              <li key={p.d.id}>
                <strong>{p.d.vacina}</strong> ({p.d.dose}) — {br(dataDaDose(nasc, p.d))}
                {diasAte(nasc, p.d) > 0 ? ` · em ${diasAte(nasc, p.d)} dias` : " · já pode"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground print:hidden">
        <span>
          Calendário Nacional de Vacinação conferido em{" "}
          {ATUALIZADO_EM.split("-").reverse().join("/")} ·{" "}
          <a
            href={VACINAS.fonte.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary"
          >
            fonte oficial
          </a>
        </span>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 font-bold hover:border-primary"
        >
          <Printer className="h-3.5 w-3.5" /> Imprimir
        </button>
      </div>
      <ol className="space-y-4">
        {grupos.map(([meses, ls]) => (
          <li key={meses} className="rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-bold">
              {rotuloIdade(meses)}
              {valido && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({br(dataDaDose(nasc, ls[0].d))})
                </span>
              )}
            </h2>
            <ul className="mt-2 divide-y divide-border">
              {ls.map(({ d, estado }) => (
                <li key={d.id} className="flex items-start gap-3 py-2 text-sm">
                  <Checkbox
                    id={`v-${d.id}`}
                    checked={feitas.includes(d.id)}
                    onCheckedChange={() => toggle(d.id)}
                    className="mt-0.5 print:hidden"
                    disabled={!valido}
                  />
                  <label htmlFor={`v-${d.id}`} className="flex-1 cursor-pointer">
                    <span className="font-bold">{d.vacina}</span>{" "}
                    <span className="text-muted-foreground">· {d.dose}</span>
                    <span className="block text-xs text-muted-foreground">
                      Protege contra {d.protege}.{d.obs ? ` ${d.obs}.` : ""}
                    </span>
                  </label>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ESTADO[estado].cls}`}
                  >
                    {ESTADO[estado].rotulo}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <SemaforoTrio
        titulo="Semáforo do pai: as vacinas"
        aceso={valido ? (atrasadas ? "warn" : "ok") : null}
        ok="Sinal verde: tudo em dia. Agende a próxima dose e guarde a caderneta na sua carteira."
        warn="Sinal de atenção: há dose atrasada. Vá à UBS esta semana; vacina atrasada se recupera, não se pula, e o esquema continua de onde parou."
        bad="Sinal de alerta: febre acima de 39 °C que não cede, choro inconsolável por horas, convulsão ou inchaço importante após a vacina — procure a UPA ou ligue 192."
      />
      <p className="text-sm text-muted-foreground print:hidden">
        Veja também{" "}
        <Link
          to="/ferramentas/marcos-do-desenvolvimento"
          className="font-bold text-primary hover:underline"
        >
          os marcos do desenvolvimento
        </Link>{" "}
        e o{" "}
        <Link
          to="/ferramentas/checklist-da-maternidade"
          className="font-bold text-primary hover:underline"
        >
          checklist do pai para o parto
        </Link>
        .
      </p>
    </div>
  );
}
