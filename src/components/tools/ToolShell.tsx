import { Link } from "@/lib/router-compat";
import { ArrowLeft } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { ArticlesStrip } from "@/components/blog/ArticlesStrip";
import { ToolGate } from "./ToolGate";
import type { ReactNode } from "react";

export function ToolShell({
  title,
  description,
  children,
  gated = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  /** true = mostra um "gostinho" e trava o acesso completo com login. */
  gated?: boolean;
}) {
  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Caixa de Ferramentas", path: "/ferramentas" },
          { name: title, path: "" },
        ]}
      />
      <Link
        to="/ferramentas"
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Caixa de Ferramentas
      </Link>

      <header className="mt-4 max-w-3xl">
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
      </header>

      <AdSlot format="leaderboard" className="mt-6" />

      <div className="mt-8">{gated ? <ToolGate>{children}</ToolGate> : children}</div>

      {/* Continue no ecossistema: artigos (TODO Fase 3: StorePromo da Loja do Pai) */}
      <ArticlesStrip title="Artigos relacionados" />
    </div>
  );
}
