import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { EventCard } from "@/components/irmandade/EventCard";
import { cn } from "@/lib/utils";

const routeApi = getRouteApi("/_site/eventos/");

/** /eventos (doc 09 §8): abas Próximos/Passados, filtro de modo e UF. */
export default function EventosPage() {
  const { proximos, passados } = routeApi.useLoaderData();
  const [tab, setTab] = useState<"proximos" | "passados">("proximos");
  const [mode, setMode] = useState<"todos" | "online" | "presencial">("todos");
  const [uf, setUf] = useState("todas");
  const base = tab === "proximos" ? proximos : passados;
  const ufs = Array.from(new Set(base.map((e) => e.uf).filter((x): x is string => !!x))).sort();
  const list = base.filter(
    (e) => (mode === "todos" || e.mode === mode) && (uf === "todas" || e.uf === uf),
  );
  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-bold",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-card text-muted-foreground",
    );
  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Irmandade", path: "/irmandade" },
          { name: "Encontros", path: "/eventos" },
        ]}
      />
      <header className="mt-6 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Irmandade</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">Encontros</h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          Café dos pais, lives, retiros e o Galpão do Pai. Confirme presença e receba o lembrete um
          dia antes.
        </p>
      </header>
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className={chip(tab === "proximos")}
          onClick={() => setTab("proximos")}
        >
          Próximos
        </button>
        <button
          type="button"
          className={chip(tab === "passados")}
          onClick={() => setTab("passados")}
        >
          Passados
        </button>
        <span className="mx-2 border-l border-border" />
        {(["todos", "online", "presencial"] as const).map((m) => (
          <button key={m} type="button" className={chip(mode === m)} onClick={() => setMode(m)}>
            {m === "todos" ? "Todos" : m === "online" ? "On-line" : "Presencial"}
          </button>
        ))}
        {ufs.length > 0 && (
          <select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold"
          >
            <option value="todas">Todas as UFs</option>
            {ufs.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
      </div>
      {list.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {tab === "proximos"
            ? "Nenhum encontro agendado por enquanto. Quer organizar um na sua cidade? Fale com a gente em /contato."
            : "Nenhum encontro realizado ainda."}
        </p>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
