import { useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ReferralCard } from "@/components/pai-indica-pai/ReferralCard";
import {
  AntifraudNotice,
  EmptyState,
  PipNav,
  btnOutline,
  btnPrimary,
  inputCls,
} from "@/components/pai-indica-pai/shared";
import type { ReferralsSearch } from "@/lib/pai-indica-pai/schemas";
import { REFERRAL_KINDS, UFS } from "@/lib/pai-indica-pai/taxonomies";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/_site/pai-indica-pai/indicacoes/");

/** Indicações (doc 08 §3.6): abas por tipo, filtros UF/cidade/categoria, lista e CTA. */
export default function ReferralsPage() {
  const items = routeApi.useLoaderData();
  const search = routeApi.useSearch();
  const navigate = useNavigate();
  const [cidade, setCidade] = useState(search.cidade ?? "");
  const [categoria, setCategoria] = useState(search.categoria ?? "");

  const go = (next: ReferralsSearch) => {
    const clean = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== ""),
    ) as ReferralsSearch;
    void navigate({ to: "/pai-indica-pai/indicacoes", search: clean });
  };

  return (
    <div className="container space-y-8 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Indicações", path: "/pai-indica-pai/indicacoes" },
        ]}
      />
      <PipNav current="/pai-indica-pai/indicacoes" />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Indicações de confiança</h1>
          <p className="mt-1 text-muted-foreground">
            Profissional, serviço ou empresa indicados por um pai que já usou e aprovou.
          </p>
        </div>
        <Link to="/pai-indica-pai/indicacoes/nova" className={btnPrimary}>
          <Plus className="h-4 w-4" /> Indicar alguém
        </Link>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => go({ ...search, tipo: undefined })}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-bold",
            !search.tipo
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          Todas
        </button>
        {Object.entries(REFERRAL_KINDS).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => go({ ...search, tipo: k as ReferralsSearch["tipo"] })}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-bold",
              search.tipo === k
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          go({
            ...search,
            cidade: cidade.trim() || undefined,
            categoria: categoria.trim() || undefined,
          });
        }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-[1fr_1fr_120px_auto]"
      >
        <input
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          placeholder="Categoria (ex.: elétrica, contabilidade)"
          className={inputCls}
          aria-label="Categoria"
        />
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
            go({ ...search, uf: (e.target.value || undefined) as ReferralsSearch["uf"] })
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
          Filtrar
        </button>
      </form>

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma indicação com esses filtros"
          text="Conhece um profissional honesto, um serviço que resolve ou uma empresa séria? Indique: outro pai agradece."
          action={
            <Link to="/pai-indica-pai/indicacoes/nova" className={btnPrimary}>
              Indicar alguém
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <ReferralCard key={r.id} referral={r} />
          ))}
        </div>
      )}
      <AntifraudNotice />
    </div>
  );
}
