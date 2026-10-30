import {
  ArrowRight,
  Calculator,
  Coins,
  Flame,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import { SectionHeading } from "./SectionHeading";

// Seção 4 da home (doc 03 §5.2): 4 cartões estáticos. Até a Fase 4 todos
// apontam para /ferramentas (placeholder); as rotas finais ficam no comentário.
const TOOLS: {
  name: string;
  description: string;
  icon: LucideIcon;
  to: string;
  finalPath: string;
  soon?: boolean;
}[] = [
  {
    name: "Conversor de Moedas",
    description:
      "Dólar, euro e bitcoin em reais, na hora, para o pai que planeja compra ou viagem.",
    icon: Coins,
    to: "/ferramentas",
    finalPath: "/ferramentas/conversor-de-moedas",
  },
  {
    name: "Mercado Financeiro",
    description: "Selic, IPCA, poupança e bolsa explicados em um minuto. Informação, não conselho.",
    icon: TrendingUp,
    to: "/ferramentas",
    finalPath: "/ferramentas/mercado-financeiro",
  },
  {
    name: "Orçamento da Família",
    description: "Quanto entra, quanto sai e quanto sobra para a reserva e os filhos.",
    icon: Calculator,
    to: "/ferramentas",
    finalPath: "/ferramentas/orcamento-da-familia",
    soon: true,
  },
  {
    name: "Calculadora de Churrasco",
    description: "Carne, carvão e bebida na medida certa para o número de convidados.",
    icon: Flame,
    to: "/ferramentas",
    finalPath: "/ferramentas/calculadora-de-churrasco",
    soon: true,
  },
];

export function ToolsTeaser() {
  return (
    <section aria-labelledby="tools-title">
      <SectionHeading
        id="tools-title"
        eyebrow="Caixa de Ferramentas"
        title="Ferramentas práticas do pai"
        subtitle="Calculadoras e ferramentas práticas do pai: conversor de moedas, mercado financeiro, cortes de carne, churrasco, orçamento e idade do filho."
        linkTo="/ferramentas"
        linkLabel="Ver todas"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.name}
            to={tool.to}
            title={tool.finalPath}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
          >
            {tool.soon && (
              <span className="absolute right-4 top-4 rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
                Em breve
              </span>
            )}
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <tool.icon className="h-5 w-5" />
            </span>
            <span className="mt-3 font-display text-base font-bold leading-snug">{tool.name}</span>
            <span className="mt-1 text-sm text-muted-foreground">{tool.description}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-primary">
              {tool.soon ? "Saber mais" : "Abrir ferramenta"}
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" />
        Toda ferramenta é informação educativa, de graça, sem cadastro. Nenhuma dá conselho de
        investimento.
      </p>
    </section>
  );
}
