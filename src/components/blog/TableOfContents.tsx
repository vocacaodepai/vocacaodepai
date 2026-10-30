import { BookOpen } from "lucide-react";
import type { Heading } from "@/lib/content";
import { cn } from "@/lib/utils";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 3) return null;

  return (
    <nav
      aria-label={"Neste artigo"}
      className="rounded-2xl border border-border bg-card p-5 shadow-soft"
    >
      <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <BookOpen className="h-4 w-4 text-primary" />
        {"Neste artigo"}
      </p>
      <ol className="space-y-2 border-l-2 border-border">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "block text-sm leading-snug transition-colors hover:text-primary",
                h.level === 3 ? "pl-8 text-muted-foreground" : "pl-4 font-semibold text-foreground",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
