import { useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ProfessionalCard } from "@/components/pai-indica-pai/ProfessionalCard";
import {
  EmptyState,
  PipNav,
  btnOutline,
  btnPrimary,
  inputCls,
} from "@/components/pai-indica-pai/shared";
import type { ProfessionalsSearch } from "@/lib/pai-indica-pai/schemas";
import { JOB_AREAS, UFS } from "@/lib/pai-indica-pai/taxonomies";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/_site/pai-indica-pai/profissionais/");

/** Diretório Pai Profissional (doc 08 §3.5): filtros por área/busca, UF, cidade, remoto, mentor. */
export default function ProfessionalsPage() {
  const pros = routeApi.useLoaderData();
  const search = routeApi.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [cidade, setCidade] = useState(search.cidade ?? "");

  const go = (next: ProfessionalsSearch) => {
    const clean = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== "" && v !== false),
    ) as ProfessionalsSearch;
    void navigate({ to: "/pai-indica-pai/profissionais", search: clean });
  };

  return (
    <div className="container space-y-8 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Pai Profissional", path: "/pai-indica-pai/profissionais" },
        ]}
      />
      <PipNav current="/pai-indica-pai/profissionais" />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Pai Profissional</h1>
          <p className="mt-1 text-muted-foreground">
            Pais que fazem bem o que fazem. Contrate um pai e ajude uma família.
          </p>
        </div>
        <Link to="/pai-indica-pai/profissionais/novo" search={{}} className={btnPrimary}>
          <Plus className="h-4 w-4" /> Criar meu perfil
        </Link>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go({ ...search, q: q.trim() || undefined, cidade: cidade.trim() || undefined });
        }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_200px_160px_120px_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Profissão ou palavra-chave"
            className={cn(inputCls, "pl-9")}
            aria-label="Buscar profissional"
          />
        </div>
        <select
          className={inputCls}
          value={search.area ?? ""}
          onChange={(e) =>
            go({ ...search, area: (e.target.value || undefined) as ProfessionalsSearch["area"] })
          }
          aria-label="Área"
        >
          <option value="">Todas as áreas</option>
          {Object.entries(JOB_AREAS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <input
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          placeholder="Cidade"
          className={inputCls}
          aria-label="Cidade"
        />
        <select
          className={inputCls}
          value={search.uf ?? ""}
          onChange={(e) =>
            go({ ...search, uf: (e.target.value || undefined) as ProfessionalsSearch["uf"] })
          }
          aria-label="UF"
        >
          <option value="">UF</option>
          {UFS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <button type="submit" className={btnOutline}>
          Buscar
        </button>
        <div className="flex flex-wrap gap-4 md:col-span-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={Boolean(search.remoto)}
              onChange={(e) => go({ ...search, remoto: e.target.checked || undefined })}
            />{" "}
            Atende remoto
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-primary"
              checked={Boolean(search.mentor)}
              onChange={(e) => go({ ...search, mentor: e.target.checked || undefined })}
            />{" "}
            É mentor
          </label>
        </div>
      </form>

      {pros.length === 0 ? (
        <EmptyState
          title="Nenhum profissional com esses filtros"
          text="O diretório cresce com os pais. Se você faz bem o que faz, crie seu perfil e seja encontrado."
          action={
            <Link to="/pai-indica-pai/profissionais/novo" search={{}} className={btnPrimary}>
              Criar meu perfil
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pros.map((p) => (
            <ProfessionalCard key={p.id} pro={p} />
          ))}
        </div>
      )}
    </div>
  );
}
