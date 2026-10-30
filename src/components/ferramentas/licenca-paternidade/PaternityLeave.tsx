import { useMemo, useState } from "react";
import { REGRAS, calcularLicenca } from "@/lib/tools/licenca";
import { formatDateBR, parseBRNumber } from "@/lib/tools/format";
import { NumberField, SelectField } from "@/components/ferramentas/NumberField";
import { SemaforoTrio } from "@/components/ferramentas/SemaforoTrio";
import { ToolResultCard } from "@/components/ferramentas/ToolResultCard";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const hoje = () => new Date().toISOString().slice(0, 10);
const br = (d: string) => formatDateBR(`${d}T12:00:00Z`);

export default function PaternityLeave() {
  const [regime, setRegime] = useState("clt");
  const [aderiu, setAderiu] = useState(false);
  const [nasc, setNasc] = useState(hoje);
  const [adocao, setAdocao] = useState(false);
  const [diasManuais, setDiasManuais] = useState("10");
  const [situacao, setSituacao] = useState<"claro" | "nao-aderiu" | "negou">("claro");
  const regimeEfetivo = regime === "clt" && aderiu ? "clt-empresa-cidada" : regime;
  const r = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(nasc)) return null;
    return calcularLicenca({
      regime: regimeEfetivo,
      nascimento: nasc,
      diasManuais: parseBRNumber(diasManuais) || 0,
    });
  }, [regimeEfetivo, nasc, diasManuais]);
  const aceso = situacao === "negou" ? "bad" : situacao === "nao-aderiu" ? "warn" : "ok";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <SelectField
          id="regime"
          label="Seu regime de trabalho"
          value={regime}
          onChange={setRegime}
          options={REGRAS.regimes
            .filter((x) => x.id !== "clt-empresa-cidada")
            .map((x) => ({ value: x.id, label: x.nome }))}
        />
        {regime === "clt" && (
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="aderiu">Minha empresa aderiu ao Empresa Cidadã</Label>
            <Switch id="aderiu" checked={aderiu} onCheckedChange={setAderiu} />
          </div>
        )}
        {regime === "servidor-estadual-municipal" && (
          <NumberField
            id="dias"
            label="Dias previstos no estatuto do seu ente"
            value={diasManuais}
            onChange={setDiasManuais}
            suffix="dias"
          />
        )}
        <div>
          <Label htmlFor="nasc">
            {adocao ? "Data da guarda/adoção" : "Data do nascimento (real ou prevista)"}
          </Label>
          <Input
            id="nasc"
            type="date"
            value={nasc}
            onChange={(e) => setNasc(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="adocao">É adoção (mesmas regras)</Label>
          <Switch id="adocao" checked={adocao} onCheckedChange={setAdocao} />
        </div>
        <SelectField
          id="situacao"
          label="Como está a conversa com a empresa?"
          value={situacao}
          onChange={(v) => setSituacao(v as typeof situacao)}
          options={[
            { value: "claro", label: "Regime claro, RH de acordo" },
            { value: "nao-aderiu", label: "Empresa não aderiu ao Empresa Cidadã" },
            { value: "negou", label: "Empresa negou os dias legais" },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Regras revisadas em {REGRAS.atualizado_em.split("-").reverse().join("/")}. Fontes no fim
          desta ferramenta.
        </p>
      </form>

      <section aria-live="polite" className="space-y-4">
        {r && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <ToolResultCard
                big
                label="Dias de licença"
                value={String(r.dias)}
                tone="primary"
                hint={`${r.regime.contagem} · ${r.regime.nome}`}
              />
              <ToolResultCard
                label="Primeiro dia"
                value={r.dias > 0 ? br(r.inicio) : "—"}
                hint={
                  r.nascimentoFimDeSemana && r.regime.id.startsWith("clt")
                    ? "começa no 1º dia útil após o nascimento"
                    : undefined
                }
              />
              <ToolResultCard
                label="Volta ao trabalho"
                value={br(r.retorno)}
                tone="success"
                hint={
                  r.dias > 0
                    ? `último dia de licença: ${br(r.fim)}`
                    : "sem licença remunerada prevista"
                }
              />
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              <p>
                <strong>Base legal:</strong> {r.baseLegal}
              </p>
              {r.marco && (
                <p className="mt-1 text-warning">
                  <strong>Marco legal na data informada:</strong> {r.marco.dias_clt} dias para a CLT
                  a partir de {br(r.marco.vigencia)} ({r.marco.base}). Conferir o texto consolidado
                  no Planalto antes de contar com o prazo.
                </p>
              )}
              {r.prazoProrrogacao && (
                <p className="mt-1">
                  <strong>Prazo para pedir a prorrogação por escrito:</strong> até{" "}
                  {br(r.prazoProrrogacao)} (2 dias úteis após o parto).
                </p>
              )}
              <p className="mt-1">
                <strong>O que levar ao RH:</strong> certidão de nascimento (ou termo de
                guarda/adoção)
                {regimeEfetivo === "clt-empresa-cidada"
                  ? ", pedido de prorrogação por escrito e comprovante do programa de paternidade responsável"
                  : ""}
                . {r.regime.aviso}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              <p className="font-bold">Os dias do pai: o que resolver nesse período</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                <li>
                  Registro civil no cartório (gratuito, prazo de 15 dias; a DNV do hospital é
                  obrigatória)
                </li>
                <li>Incluir o bebê no plano de saúde (até 30 dias, sem carência)</li>
                <li>Conferir BCG e hepatite B na caderneta e marcar a 1ª consulta do pediatra</li>
                <li>Garantir o descanso da esposa: visitas, casa e comida são seus</li>
                <li>Avisar o RH e guardar o protocolo do pedido de licença</li>
              </ul>
            </div>
          </>
        )}
        <SemaforoTrio
          titulo="Semáforo do pai: a licença"
          aceso={aceso}
          ok="Sinal verde: regime claro e RH alinhado. Entregue a certidão, guarde o protocolo e use os dias para a família."
          warn="Sinal de atenção: a empresa não aderiu ao Empresa Cidadã. Peça ao RH a adesão; é dedução fiscal para a empresa e 15 dias a mais para você. Até lá, valem os dias da lei geral."
          bad="Sinal de alerta: empresa negou os dias previstos em lei. Não discuta sozinho: procure o sindicato, a Superintendência Regional do Trabalho ou um advogado trabalhista."
        />
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer font-bold">Fontes oficiais</summary>
          <ul className="mt-2 space-y-1">
            {REGRAS.fontes.map((f) => (
              <li key={f.url}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary"
                >
                  {f.nome}
                </a>
              </li>
            ))}
          </ul>
        </details>
        {r && (
          <ToolShareButton
            title="Licença-paternidade — Vocação de Pai"
            text={`Licença-paternidade: ${r.dias} dias (${r.regime.nome}), de ${br(r.inicio)} a ${br(r.fim)}; volta em ${br(r.retorno)}.`}
          />
        )}
      </section>
    </div>
  );
}
