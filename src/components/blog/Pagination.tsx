import { Link, useSearchParams } from "@/lib/router-compat";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  const [searchParams] = useSearchParams();

  const buildHref = (p: number) => {
    const params = new URLSearchParams(searchParams);
    if (p <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(p));
    }
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginação" className="flex items-center justify-center gap-2">
      {page > 1 && (
        <Link
          to={buildHref(page - 1)}
          className="inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
          {"Anterior"}
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          to={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition-colors",
            p === page
              ? "border-primary bg-primary text-primary-foreground shadow-soft"
              : "border-border bg-card text-foreground hover:border-primary hover:text-primary",
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link
          to={buildHref(page + 1)}
          className="inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {"Próxima"}
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
