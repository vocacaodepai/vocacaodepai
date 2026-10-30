import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CORTES, PREPAROS, corteBySlug, cortesPorPreparo } from "@/lib/tools/cortes";
import { CORTES_DATA } from "@/lib/tools/cortes";
import { getPublishedSlugs } from "@/lib/tools/related.functions";
import { formatFaixaBRL } from "@/lib/tools/format";
import { SemaforoCallout } from "@/components/ferramentas/SemaforoCallout";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/lib/router-compat";
import { BeefDiagram } from "./BeefDiagram";

const initial = () => {
  if (typeof window === "undefined") return "picanha";
  const q = new URLSearchParams(window.location.search).get("corte");
  return q && corteBySlug(q) ? q : "picanha";
};
const dots = (n: number) => "●".repeat(n) + "○".repeat(5 - n);

function Faixa({ c }: { c: NonNullable<ReturnType<typeof corteBySlug>> }) {
  const f = c.faixa_preco;
  if (f.min == null || f.max == null || !f.pesquisado_em)
    return <span className="text-muted-foreground">faixa ainda não pesquisada</span>;
  return (
    <span>
      Faixa de referência por kg pesquisada em {f.pesquisado_em.split("-").reverse().join("/")}:{" "}
      {formatFaixaBRL(f.min, f.max)}
    </span>
  );
}

function Painel({ slug, publicados }: { slug: string; publicados: string[] }) {
  const c = corteBySlug(slug);
  if (!c) return null;
  const artigos = c.artigos.filter((a) => publicados.includes(a));
  return (
    <div className="rounded-2xl border border-border bg-card p-5" aria-live="polite">
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {c.regiao}
      </p>
      <h2 className="font-display text-2xl font-bold">{c.nome_br}</h2>
      <p className="text-sm text-muted-foreground">Nos EUA: {c.nome_eua}</p>
      <dl className="mt-4 grid gap-2 text-sm">
        <div>
          <dt className="font-bold">Textura</dt>
          <dd>{c.textura}</dd>
        </div>
        <div>
          <dt className="font-bold">Preparo ideal</dt>
          <dd className="flex flex-wrap gap-1.5">
            {c.preparo.map((p) => (
              <span
                key={p}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary"
              >
                {PREPAROS[p]}
              </span>
            ))}
          </dd>
        </div>
        <div>
          <dt className="font-bold">Ponto recomendado</dt>
          <dd>{c.ponto}</dd>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <dt className="font-bold">Maciez</dt>
            <dd aria-label={`${c.maciez} de 5`}>{dots(c.maciez)}</dd>
          </div>
          <div>
            <dt className="font-bold">Gordura</dt>
            <dd aria-label={`${c.gordura} de 5`}>{dots(c.gordura)}</dd>
          </div>
          <div>
            <dt className="font-bold">Preço relativo</dt>
            <dd aria-label={`${c.preco_relativo} de 5`}>{dots(c.preco_relativo)}</dd>
          </div>
        </div>
        <div>
          <dt className="font-bold">Faixa de preço</dt>
          <dd>
            <Faixa c={c} />
          </dd>
        </div>
      </dl>
      <div className="mt-4">
        <SemaforoCallout tone={c.erro_comum_semaforo.sinal === "alerta" ? "bad" : "warn"}>
          {c.erro_comum_semaforo.texto}
        </SemaforoCallout>
      </div>
      <p className="mt-4 rounded-xl bg-accent/10 p-3 text-sm">
        <strong>Dica do pai:</strong> {c.dica_do_pai}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        {artigos.map((a) => (
          <Link key={a} to={`/post/${a}`} className="font-bold text-primary hover:underline">
            Ler o artigo →
          </Link>
        ))}
        <Link
          to="/loja/categoria/churrasco-e-cozinha"
          className="font-bold text-primary hover:underline"
        >
          Utensílios na Loja do Pai →
        </Link>
        <ToolShareButton
          title={`${c.nome_br} — Guia de cortes`}
          text={`${c.nome_br} (${c.nome_eua}): ${c.preparo.map((p) => PREPAROS[p]).join(", ")}. ${c.ponto}.`}
          url={
            typeof window !== "undefined"
              ? `${window.location.origin}/ferramentas/cortes-de-carne?corte=${c.slug}`
              : undefined
          }
        />
      </div>
    </div>
  );
}

export default function BeefCutsGuide() {
  const [sel, setSel] = useState<string>(initial);
  const [preparo, setPreparo] = useState("panela");
  const [ordem, setOrdem] = useState<"nome_br" | "regiao" | "maciez" | "preco_relativo">("nome_br");
  const slugs = useMemo(() => Array.from(new Set(CORTES.flatMap((c) => c.artigos))), []);
  const pub = useQuery({
    queryKey: ["cortes:artigos"],
    queryFn: () => getPublishedSlugs({ data: { slugs } }),
    staleTime: 3_600_000,
    retry: 0,
  });
  const publicados = pub.data ?? [];
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      u.searchParams.set("corte", sel);
      window.history.replaceState(null, "", u.toString());
    } catch {
      /* ignore */
    }
  }, [sel]);
  const tabela = useMemo(
    () =>
      [...CORTES].sort((a, b) =>
        typeof a[ordem] === "number"
          ? (b[ordem] as number) - (a[ordem] as number)
          : String(a[ordem]).localeCompare(String(b[ordem])),
      ),
    [ordem],
  );

  return (
    <Tabs defaultValue="diagrama">
      <TabsList className="flex-wrap">
        <TabsTrigger value="diagrama">1. Diagrama</TabsTrigger>
        <TabsTrigger value="preparo">2. Carne × preparo</TabsTrigger>
        <TabsTrigger value="tabela">3. Tabela completa</TabsTrigger>
      </TabsList>
      <TabsContent value="diagrama">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div>
            <BeefDiagram selected={sel} onSelect={setSel} />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CORTES.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setSel(c.slug)}
                  aria-pressed={sel === c.slug}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${sel === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
                >
                  {c.nome_br}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Equivalências Brasil × EUA aproximadas; dados revisados em{" "}
              {CORTES_DATA.atualizado_em.split("-").reverse().join("/")}.
            </p>
          </div>
          <Painel slug={sel} publicados={publicados} />
        </div>
      </TabsContent>
      <TabsContent value="preparo">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PREPAROS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => setPreparo(k)}
              aria-pressed={preparo === k}
              className={`rounded-full border px-4 py-1.5 text-sm font-bold ${preparo === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {cortesPorPreparo(preparo).map((c) => (
            <li key={c.slug} className="rounded-2xl border border-border bg-card p-4">
              <p className="font-display text-lg font-bold">{c.nome_br}</p>
              <p className="text-sm text-muted-foreground">{c.textura}</p>
              <p className="mt-1 text-sm">
                <strong>Ponto:</strong> {c.ponto}
              </p>
              <p className="mt-1 text-xs">
                <Faixa c={c} />
              </p>
              <button
                type="button"
                onClick={() => setSel(c.slug)}
                className="mt-2 text-sm font-bold text-primary hover:underline"
              >
                Ver no diagrama
              </button>
            </li>
          ))}
        </ul>
      </TabsContent>
      <TabsContent value="tabela">
        <div className="mb-2 text-sm">
          Ordenar por:{" "}
          {(["nome_br", "regiao", "maciez", "preco_relativo"] as const).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setOrdem(o)}
              className={`mr-2 font-bold ${ordem === o ? "text-primary underline" : ""}`}
            >
              {
                {
                  nome_br: "nome",
                  regiao: "região",
                  maciez: "maciez",
                  preco_relativo: "preço relativo",
                }[o]
              }
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Corte</th>
                <th className="p-2">EUA</th>
                <th className="p-2">Região</th>
                <th className="p-2">Preparo</th>
                <th className="p-2">Ponto</th>
                <th className="p-2">Maciez</th>
                <th className="p-2">Faixa</th>
              </tr>
            </thead>
            <tbody>
              {tabela.map((c) => (
                <tr key={c.slug} className="border-t border-border">
                  <td className="p-2 font-bold">{c.nome_br}</td>
                  <td className="p-2">{c.nome_eua}</td>
                  <td className="p-2">{c.regiao}</td>
                  <td className="p-2">{c.preparo.map((p) => PREPAROS[p]).join(", ")}</td>
                  <td className="p-2">{c.ponto}</td>
                  <td className="p-2">{dots(c.maciez)}</td>
                  <td className="p-2">
                    <Faixa c={c} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
    </Tabs>
  );
}
