import { Link } from "@/lib/router-compat";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  name: string;
  path: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Início", path: "/" }, ...items];
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((item, i) => {
          const isLast = i === all.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-1.5">
              {i === 0 && <Home className="h-3.5 w-3.5" />}
              {isLast ? (
                <span aria-current="page" className="line-clamp-1 font-semibold text-foreground/80">
                  {item.name}
                </span>
              ) : (
                <Link to={item.path} className="transition-colors hover:text-primary">
                  {item.name}
                </Link>
              )}
              {!isLast && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
