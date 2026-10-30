import {
  Baby,
  BadgeCheck,
  Bike,
  BookOpen,
  Briefcase,
  Car,
  Church,
  Flame,
  Heart,
  HeartHandshake,
  HeartPulse,
  Newspaper,
  PiggyBank,
  Scale,
  Shirt,
  Smartphone,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// `categories.icon` (nome lucide em kebab-case) tem precedência; as 14
// categorias-mãe da 0002 nascem sem ícone, então caem no mapa por slug.
const BY_NAME: Record<string, LucideIcon> = {
  baby: Baby,
  "badge-check": BadgeCheck,
  bike: Bike,
  "book-open": BookOpen,
  briefcase: Briefcase,
  car: Car,
  church: Church,
  flame: Flame,
  heart: Heart,
  "heart-handshake": HeartHandshake,
  "heart-pulse": HeartPulse,
  newspaper: Newspaper,
  "piggy-bank": PiggyBank,
  scale: Scale,
  shirt: Shirt,
  smartphone: Smartphone,
  wrench: Wrench,
};

const BY_SLUG: Record<string, LucideIcon> = {
  "paternidade-por-fase": Baby,
  "casamento-e-familia": HeartHandshake,
  "provedor-e-carreira": Briefcase,
  "dinheiro-do-pai": PiggyBank,
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
  "pai-indica": BadgeCheck,
  noticias: Newspaper,
};

export function CategoryIcon({
  name,
  slug,
  className,
}: {
  name?: string | null;
  slug?: string | null;
  className?: string;
}) {
  const Icon = (name && BY_NAME[name]) || (slug && BY_SLUG[slug]) || Heart;
  return <Icon className={className} aria-hidden />;
}
