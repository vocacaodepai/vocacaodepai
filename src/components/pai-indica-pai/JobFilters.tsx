import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { JobsSearch } from "@/lib/pai-indica-pai/schemas";
import { JOB_AREAS, JOB_ORDERS, JOB_TYPES, UFS } from "@/lib/pai-indica-pai/taxonomies";
import { cn } from "@/lib/utils";
import { btnOutline, inputCls } from "./shared";

/** Barra lateral (desktop) / painel retrátil (mobile) de filtros de vagas (doc 08 §3.2). */
export function JobFilters({
  search,
  cities,
  onChange,
}: {
  search: JobsSearch;
  cities: string[];
  onChange: (next: JobsSearch) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(search.q ?? "");
  const [cidade, setCidade] = useState(search.cidade ?? "");
  const set = (patch: Partial<JobsSearch>) => onChange({ ...search, ...patch, pagina: undefined });
  const active = [
    search.uf,
    search.cidade,
    search.remoto,
    search.tipo,
    search.area,
    search.q,
  ].filter(Boolean).length;

  return (
    <aside className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          set({ q: q.trim() || undefined, cidade: cidade.trim() || undefined });
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por cargo, empresa…"
            className={cn(inputCls, "pl-9")}
            aria-label="Buscar vagas"
          />
        </div>
        <button type="submit" className={btnOutline}>
          Buscar
        </button>
      </form>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(btnOutline, "w-full lg:hidden")}
      >
        <SlidersHorizontal className="h-4 w-4" /> Filtros {active ? `(${active})` : ""}
      </button>
      <div
        className={cn(
          "space-y-4 rounded-2xl border border-border bg-card p-5",
          open ? "block" : "hidden lg:block",
        )}
      >
        <div>
          <label className="text-sm font-bold">UF</label>
          <select
            className={inputCls}
            value={search.uf ?? ""}
            onChange={(e) => set({ uf: (e.target.value || undefined) as JobsSearch["uf"] })}
          >
            <option value="">Todas</option>
            {UFS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold">Cidade</label>
          <input
            list="pip-cidades"
            className={inputCls}
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            onBlur={() => set({ cidade: cidade.trim() || undefined })}
            placeholder="Ex.: Campinas"
          />
          <datalist id="pip-cidades">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            className="h-5 w-5 accent-primary"
            checked={Boolean(search.remoto)}
            onChange={(e) => set({ remoto: e.target.checked || undefined })}
          />{" "}
          Só remotas
        </label>
        <div>
          <span className="text-sm font-bold">Tipo</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {Object.entries(JOB_TYPES).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() =>
                  set({ tipo: search.tipo === k ? undefined : (k as JobsSearch["tipo"]) })
                }
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-bold",
                  search.tipo === k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm font-bold">Área</label>
          <select
            className={inputCls}
            value={search.area ?? ""}
            onChange={(e) => set({ area: (e.target.value || undefined) as JobsSearch["area"] })}
          >
            <option value="">Todas</option>
            {Object.entries(JOB_AREAS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-bold">Ordenar</label>
          <select
            className={inputCls}
            value={search.ordem ?? "recentes"}
            onChange={(e) => set({ ordem: e.target.value as JobsSearch["ordem"] })}
          >
            {Object.entries(JOB_ORDERS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        {active > 0 && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCidade("");
              onChange({});
            }}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
          >
            <X className="h-4 w-4" /> Limpar filtros
          </button>
        )}
      </div>
    </aside>
  );
}
