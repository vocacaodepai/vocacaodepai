import {
  Baby,
  Bike,
  BookOpen,
  Briefcase,
  Car,
  Church,
  Compass,
  Flame,
  HeartHandshake,
  HeartPulse,
  Scale,
  Shirt,
  Smartphone,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/lib/router-compat";
import type { Category } from "@/lib/types";
import { SectionHeading } from "./SectionHeading";

// Ícone por slug das 14 categorias-mãe (0002_blog.sql). `categories.icon`
// vem nulo na seed; quando preenchido, entra pelo nome do lucide abaixo.
const ICON_BY_SLUG: Record<string, LucideIcon> = {
  "paternidade-por-fase": Baby,
  "casamento-e-familia": HeartHandshake,
  "provedor-e-carreira": Briefcase,
  "dinheiro-do-pai": Wallet,
  "fe-e-virtude": Church,
  "corpo-e-saude-do-homem": HeartPulse,
  "churrasco-e-cozinha": Flame,
  "caixa-de-ferramentas-e-reparos": Wrench,
  "carro-e-moto": Car,
  "estilo-e-cuidados": Shirt,
  "esporte-e-lazer-com-os-filhos": Bike,
  "tecnologia-do-pai": Smartphone,
  "direitos-do-pai": Scale,
  "historias-de-pai": BookOpen,
};

const ICON_BY_NAME: Record<string, LucideIcon> = {
  baby: Baby,
  bike: Bike,
  "book-open": BookOpen,
  briefcase: Briefcase,
  car: Car,
  church: Church,
  flame: Flame,
  "heart-handshake": HeartHandshake,
  "heart-pulse": HeartPulse,
  scale: Scale,
  shirt: Shirt,
  smartphone: Smartphone,
  wallet: Wallet,
  wrench: Wrench,
};

function iconFor(category: Category): LucideIcon {
  return (
    ICON_BY_SLUG[category.slug] ??
    (category.icon ? ICON_BY_NAME[category.icon] : undefined) ??
    Compass
  );
}

// Seção 5 da home: as 14 categorias-mãe do blog. A cor do chip deriva da
// primária com opacidade (não existe categories.color no doc 02 §4.2).
export function HomeCategories({ categories }: { categories: Category[] }) {
  return (
    <section aria-labelledby="categories-title">
      <SectionHeading
        id="categories-title"
        title="Explore por assunto"
        subtitle="Catorze frentes, um só homem: tudo que forma o pai, o marido, o provedor e o filho de Deus."
        linkTo="/blog"
        linkLabel="Ir para o blog"
      />
      {categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon = iconFor(category);
            return (
              <Link
                key={category.id}
                to={`/categoria/${category.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-bold text-foreground">
                    {category.name}
                  </span>
                  {category.description && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          As categorias do blog aparecem aqui assim que o banco for semeado.
        </p>
      )}
    </section>
  );
}
