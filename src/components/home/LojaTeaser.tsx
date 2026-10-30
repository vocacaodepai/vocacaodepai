import { ArrowRight, Baby, Dumbbell, Flame, Hammer, type LucideIcon } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { SectionHeading } from "./SectionHeading";

// Seção 8 da home (doc 03 §5.2): slogan oficial e 4 categorias futuras da Loja
// do Pai. Sem produto fictício: só o convite e as frentes que vão existir.
const CATEGORIES: { name: string; description: string; icon: LucideIcon }[] = [
  {
    name: "Churrasco",
    description: "Churrasqueira, facas, tábuas e o que faz diferença na brasa.",
    icon: Flame,
  },
  {
    name: "Ferramentas",
    description: "Furadeira, kit básico e o que resolve a casa com as próprias mãos.",
    icon: Hammer,
  },
  {
    name: "Esporte",
    description: "Bola, bicicleta e o que coloca pai e filho para se mexer.",
    icon: Dumbbell,
  },
  {
    name: "Pai e Bebê",
    description: "Cadeirinha, carrinho e o essencial do pai de primeira viagem.",
    icon: Baby,
  },
];

export function LojaTeaser() {
  return (
    <section aria-labelledby="loja-title">
      <SectionHeading
        id="loja-title"
        eyebrow="Loja do Pai"
        title="O pai também quer desconto"
        subtitle="Produtos que a gente indicaria para um irmão, com faixa de preço pesquisada e botão direto para a Amazon."
        linkTo="/loja"
        linkLabel="Conhecer a Loja do Pai"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <Link
            key={category.name}
            to="/loja"
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <category.icon className="h-5 w-5" />
            </span>
            <span className="mt-3 font-display text-base font-bold leading-snug">
              {category.name}
            </span>
            <span className="mt-1 text-sm text-muted-foreground">{category.description}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-bold text-primary">
              Em breve na loja
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        O Vocação de Pai participa do Programa de Associados da Amazon: quando você compra pelos
        nossos links, recebemos uma comissão, sem custo extra para você. Isso não muda a nota.{" "}
        <Link to="/politica-de-afiliados" className="font-semibold text-primary hover:underline">
          Política de afiliados
        </Link>
        .
      </p>
    </section>
  );
}
