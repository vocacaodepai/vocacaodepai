import { ArrowRight, Wrench } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/router-compat";
import { featuredTools, toolPath } from "@/lib/tools/registry";
import { getMarketTickerItems } from "@/lib/market/fetchers";
import { SectionHeading } from "./SectionHeading";

// Seção 4 da home: cartões reais do registry (Fase 4) + bloco "Mercado do pai hoje" (doc 06 §3.2.6),
// que só lê o cache de mercado e some quando o cache está vazio.
function MarketTicker() {
  const q = useQuery({
    queryKey: ["market:ticker"],
    queryFn: () => getMarketTickerItems(),
    staleTime: 15 * 60_000,
    retry: 0,
  });
  const items = q.data ?? [];
  if (!items.length) return null;
  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-5 py-3">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
        Mercado do pai hoje
      </span>
      {items.map((i) => (
        <span key={i.label} className="text-sm">
          <span className="text-muted-foreground">{i.label}</span> <strong>{i.value}</strong>
          {i.changePct != null && (
            <span
              className={`ml-1 text-xs font-bold ${i.changePct >= 0 ? "text-success" : "text-destructive"}`}
            >
              {i.changePct >= 0 ? "+" : ""}
              {i.changePct.toFixed(2).replace(".", ",")}%
            </span>
          )}
        </span>
      ))}
      <Link
        to="/ferramentas/mercado-financeiro"
        className="ml-auto text-xs font-bold text-primary hover:underline"
      >
        Ver o painel completo →
      </Link>
    </div>
  );
}

export function ToolsTeaser() {
  const tools = featuredTools().slice(0, 4);
  return (
    <section aria-labelledby="tools-title">
      <SectionHeading
        id="tools-title"
        eyebrow="Caixa de Ferramentas"
        title="Ferramentas práticas do pai"
        subtitle="Calculadoras e guias do pai: conversor de moedas, mercado financeiro, custo do filho, churrasco, cortes de carne e orçamento."
        linkTo="/ferramentas"
        linkLabel="Ver todas"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            to={toolPath(tool.slug)}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <tool.icon className="h-5 w-5" />
            </span>
            <span className="mt-3 font-display text-base font-bold leading-snug">{tool.title}</span>
            <span className="mt-1 text-sm text-muted-foreground">{tool.short}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-primary">
              Abrir ferramenta
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
      <MarketTicker />
      <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" />
        Toda ferramenta é informação educativa, de graça, sem cadastro. Nenhuma dá conselho de
        investimento.
      </p>
    </section>
  );
}
