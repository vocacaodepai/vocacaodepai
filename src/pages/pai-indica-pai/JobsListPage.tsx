import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Rss } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AlertsPreferencesForm } from "@/components/pai-indica-pai/AlertsPreferencesForm";
import { JobCard } from "@/components/pai-indica-pai/JobCard";
import { JobFilters } from "@/components/pai-indica-pai/JobFilters";
import {
  AntifraudNotice,
  EmptyState,
  PipNav,
  btnOutline,
  btnPrimary,
} from "@/components/pai-indica-pai/shared";
import type { JobsSearch } from "@/lib/pai-indica-pai/schemas";

const routeApi = getRouteApi("/_site/pai-indica-pai/vagas/");

/** Lista de vagas (doc 08 §3.2): filtros na URL, busca, ordenação, 12 por página, estado vazio. */
export default function JobsListPage() {
  const { items, total, page, perPage, cities } = routeApi.useLoaderData();
  const search = routeApi.useSearch();
  const navigate = useNavigate();
  const pages = Math.max(1, Math.ceil(total / perPage));

  const go = (next: JobsSearch) => {
    const clean = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== "" && v !== false),
    ) as JobsSearch;
    void navigate({ to: "/pai-indica-pai/vagas", search: clean });
  };

  return (
    <div className="container space-y-8 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Vagas", path: "/pai-indica-pai/vagas" },
        ]}
      />
      <PipNav current="/pai-indica-pai/vagas" />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Vagas indicadas por pais</h1>
          <p className="mt-1 text-muted-foreground">
            {total === 0
              ? "Nenhuma vaga encontrada"
              : `${total} ${total === 1 ? "vaga encontrada" : "vagas encontradas"}`}{" "}
            · moderadas, sem taxa, sem intermediação.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/pai-indica-pai/vagas/rss.xml" className={btnOutline} title="Feed RSS das vagas">
            <Rss className="h-4 w-4" /> RSS
          </a>
          <Link to="/pai-indica-pai/vagas/nova" className={btnPrimary}>
            <Plus className="h-4 w-4" /> Publicar vaga
          </Link>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <JobFilters search={search} cities={cities} onChange={go} />
        <div className="space-y-6">
          {items.length === 0 ? (
            <EmptyState
              title="Nenhuma vaga com esses filtros"
              text="Publique a primeira! Uma vaga da sua empresa ou que você conhece pode ser o sustento de outro pai."
              action={
                <Link to="/pai-indica-pai/vagas/nova" className={btnPrimary}>
                  Publicar vaga
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((j) => (
                <JobCard key={j.id} job={j} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav aria-label="Paginação" className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => go({ ...search, pagina: page - 1 })}
                className={btnOutline}
              >
                Anterior
              </button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages}
                onClick={() => go({ ...search, pagina: page + 1 })}
                className={btnOutline}
              >
                Próxima
              </button>
            </nav>
          )}
          <AntifraudNotice />
          <AlertsPreferencesForm compact />
        </div>
      </div>
    </div>
  );
}
