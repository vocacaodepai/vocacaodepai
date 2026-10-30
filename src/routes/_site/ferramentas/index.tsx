import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Wrench } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ToolCard } from "@/components/ferramentas/ToolCard";
import { TOOL_CATEGORIES, type ToolCategorySlug } from "@/lib/tools/categories";
import { TOOLS, featuredTools, toolsByCategory } from "@/lib/tools/registry";
import { breadcrumbJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";

const TITLE = "Caixa de Ferramentas do pai: calculadoras e guias práticos";
const DESCRIPTION =
  "Conversor de moedas, mercado financeiro, custo do filho, licença-paternidade, churrasco, cortes de carne, orçamento e mais: ferramentas grátis para o pai de família.";

// Índice da Caixa de Ferramentas (doc 06 §1.7): destaques do dono no topo, filtro por categoria e 5 grupos na ordem fixa.
export const Route = createFileRoute("/_site/ferramentas/")({
  head: () => ({
    meta: [
      { title: `${TITLE} | ${SITE_NAME}` },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: `${TITLE} | ${SITE_NAME}` },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/ferramentas` },
      { property: "og:image", content: SITE_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ferramentas` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify([
          breadcrumbJsonLd([{ name: "Ferramentas", path: "/ferramentas" }]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Caixa de Ferramentas — Vocação de Pai",
            itemListElement: TOOLS.map((t, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: t.title,
              url: `${SITE_URL}/ferramentas/${t.slug}`,
            })),
          },
        ]),
      },
    ],
  }),
  component: Page,
});

function Page() {
  const [filter, setFilter] = useState<ToolCategorySlug | "todas">("todas");
  const destaques = featuredTools();
  const categorias = TOOL_CATEGORIES.filter((c) => filter === "todas" || c.slug === filter);

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Ferramentas", path: "" }]} />
      <header className="mt-6 max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Caixa de Ferramentas
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold md:text-4xl">
          Ferramentas práticas do pai
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {TOOLS.length} calculadoras e guias para quem segura a casa: dinheiro, família, churrasco,
          oficina e saúde. Tudo de graça, sem cadastro. Toda ferramenta é informação educativa;
          nenhuma dá conselho de investimento, médico ou jurídico.
        </p>
      </header>

      <section aria-labelledby="destaques" className="mt-10">
        <h2 id="destaques" className="font-display text-2xl font-bold">
          Destaques
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destaques.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por categoria">
        {[{ slug: "todas" as const, short: "Todas" }, ...TOOL_CATEGORIES].map((c) => (
          <button
            key={c.slug}
            type="button"
            role="tab"
            aria-selected={filter === c.slug}
            onClick={() => setFilter(c.slug as ToolCategorySlug | "todas")}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors ${filter === c.slug ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}
          >
            {c.short}
          </button>
        ))}
      </div>

      {categorias.map((cat) => {
        const tools = toolsByCategory(cat.slug);
        if (!tools.length) return null;
        return (
          <section key={cat.slug} aria-labelledby={`cat-${cat.slug}`} className="mt-10">
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.badgeClass}`}
              >
                <cat.icon className="h-5 w-5" />
              </span>
              <div>
                <h2 id={`cat-${cat.slug}`} className="font-display text-2xl font-bold">
                  {cat.name}
                </h2>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((t) => (
                <ToolCard key={`${cat.slug}-${t.slug}`} tool={t} showCategory={false} />
              ))}
            </div>
          </section>
        );
      })}

      <p className="mt-12 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Wrench className="h-3.5 w-3.5" />
        Faltou uma ferramenta? Mande pelo Contato: a caixa cresce com o uso dos leitores.
      </p>
    </div>
  );
}
