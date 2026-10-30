import { Suspense, useEffect, type ReactNode } from "react";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { useAuth } from "@/lib/auth-context";
import { logToolUsage } from "@/lib/tools/usage";
import { categoryBySlug } from "@/lib/tools/categories";
import { COMO_USAR } from "@/lib/tools/como-usar";
import type { ToolDefinition } from "@/lib/tools/registry";
import type { RelatedPost } from "@/lib/tools/related.functions";
import { ToolGate } from "./ToolGate";
import { ToolHowTo } from "./ToolHowTo";
import { ToolFaq } from "./ToolFaq";
import { ToolDisclaimer } from "./ToolDisclaimer";
import { ToolSaveButton } from "./ToolSaveButton";
import { ToolShareButton } from "./ToolShareButton";
import { ToolRelatedArticles } from "./ToolRelatedArticles";

// Casca única das ferramentas (doc 06 §1.4). Anúncios só nas posições do doc 11 §2.4:
// nenhum acima da ferramenta; 1º abaixo do resultado (com <hr> e rótulo); 2º ao fim do "Como usar".
export function ToolLayout({
  tool,
  related,
  children,
}: {
  tool: ToolDefinition;
  related: RelatedPost[];
  children: ReactNode;
}) {
  const { user, ready } = useAuth();
  const cat = categoryBySlug(tool.category);

  useEffect(() => {
    if (ready) void logToolUsage(tool.slug, user?.id ?? null);
  }, [ready, user?.id, tool.slug]);

  return (
    <div className="container py-8">
      <div className="print:hidden">
        <Breadcrumbs
          items={[
            { name: "Ferramentas", path: "/ferramentas" },
            { name: tool.title, path: "" },
          ]}
        />
        <Link
          to="/ferramentas"
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Caixa de Ferramentas
        </Link>
      </div>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${cat.badgeClass}`}
          >
            <cat.icon className="h-3.5 w-3.5" /> {cat.name}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold md:text-4xl">{tool.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
            {tool.description}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <ToolSaveButton slug={tool.slug} />
          <ToolShareButton title={tool.title} text={`${tool.title} — Vocação de Pai`} />
        </div>
      </header>

      <div className="mt-8">
        <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" aria-busy />}>
          {tool.gated ? <ToolGate>{children}</ToolGate> : children}
        </Suspense>
      </div>

      {tool.disclaimer && (
        <ToolDisclaimer text={tool.disclaimer} strong={tool.slug === "pensao-alimenticia"} />
      )}

      <div className="print:hidden">
        <hr className="mt-10 border-border" />
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Publicidade
        </p>
        <AdSlot format="rect" className="mt-2" />

        <ToolHowTo steps={tool.howTo} text={COMO_USAR[tool.slug]} />

        <AdSlot format="rect" className="mt-8" />

        <ToolFaq items={tool.faq} />
        <ToolRelatedArticles posts={related} />

        {/* Chamada para a Loja do Pai (a Fase 3 ainda não criou StorePromo em src/components/loja) */}
        <aside className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent-foreground">
              Loja do Pai
            </p>
            <p className="mt-1 font-display text-lg font-bold">O pai também quer desconto</p>
            <p className="text-sm text-muted-foreground">
              Ferramentas, churrasco e utilidades com faixa de preço pesquisada e review honesta.
            </p>
          </div>
          <Link
            to="/loja"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <ShoppingBag className="h-4 w-4" /> Ver a Loja do Pai
          </Link>
        </aside>
      </div>
    </div>
  );
}
