import { Link } from "@/lib/router-compat";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CategoryIcon } from "./category-icon";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      to={`/categoria/${category.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/60 text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <CategoryIcon name={category.icon} className="h-6 w-6" />
      </span>
      <span>
        <span className="block font-display text-base font-bold text-foreground">
          {category.name}
        </span>
        <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">
          {category.description}
        </span>
      </span>
    </Link>
  );
}
