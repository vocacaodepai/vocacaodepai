import { ArrowRight } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { categoryBySlug } from "@/lib/tools/categories";
import { toolPath, type ToolDefinition } from "@/lib/tools/registry";

export function ToolCard({
  tool,
  showCategory = true,
}: {
  tool: ToolDefinition;
  showCategory?: boolean;
}) {
  const cat = categoryBySlug(tool.category);
  return (
    <Link
      to={toolPath(tool.slug)}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
    >
      {tool.featured && (
        <span className="absolute right-4 top-4 rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
          Destaque
        </span>
      )}
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <tool.icon className="h-5 w-5" />
      </span>
      <span className="mt-3 font-display text-base font-bold leading-snug">{tool.title}</span>
      <span className="mt-1 text-sm text-muted-foreground">{tool.short}</span>
      <span className="mt-auto flex items-center justify-between pt-3">
        <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
          Abrir ferramenta <ArrowRight className="h-3.5 w-3.5" />
        </span>
        {showCategory && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cat.badgeClass}`}
          >
            {cat.short}
          </span>
        )}
      </span>
    </Link>
  );
}
