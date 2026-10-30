import {
  Baby,
  CalendarHeart,
  Flower2,
  Heart,
  HeartPulse,
  Milk,
  MoonStar,
  Puzzle,
  ShoppingBag,
  Sprout,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  baby: Baby,
  "heart-pulse": HeartPulse,
  milk: Milk,
  "moon-star": MoonStar,
  sprout: Sprout,
  "flower-2": Flower2,
  "calendar-heart": CalendarHeart,
  puzzle: Puzzle,
  "shopping-bag": ShoppingBag,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Heart;
  return <Icon className={className} />;
}
