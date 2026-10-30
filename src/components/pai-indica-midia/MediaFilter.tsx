import { useEffect, useState } from "react";
import { cardsOf, chipClass, clearKey, setHidden } from "@/components/pai-indica/filterVisibility";
import { ageTiers, mediaTypeLabels, platformSlug } from "@/lib/pai-indica-midia/taxonomia";
import { MEDIA_TYPES, type MediaType } from "@/lib/pai-indica-midia/types";

export interface MediaFilterData {
  /** Tipos que existem nas fichas publicadas. */
  types: MediaType[];
  /** Plataformas que existem (nome como gravado no banco), em ordem de frequência. */
  platforms: string[];
}

/**
 * Filtro em três camadas, no navegador (doc 14 §5.1): tipo → faixa etária do pai → plataforma.
 * Esconde <article data-kind data-age-tier data-platforms> via as marcas `data-hide-*` de
 * filterVisibility.ts (mesmo mecanismo do /pai-indica). Nada de rota nova por filtro.
 */
export function MediaFilter({
  data,
  rootId,
  className = "",
}: {
  data: MediaFilterData;
  rootId: string;
  className?: string;
}) {
  const [type, setType] = useState<"todos" | MediaType>("todos");
  const [tier, setTier] = useState<string>("todos");
  const [platform, setPlatform] = useState<string>("todos");

  function selectType(next: "todos" | MediaType) {
    setType(next);
    cardsOf(rootId).forEach((c) =>
      setHidden(c, "kind", !(next === "todos" || c.dataset["kind"] === next)),
    );
  }
  function selectTier(next: string) {
    setTier(next);
    cardsOf(rootId).forEach((c) =>
      setHidden(c, "age", !(next === "todos" || c.dataset["ageTier"] === next)),
    );
  }
  function selectPlatform(next: string) {
    setPlatform(next);
    const slug = platformSlug(next);
    cardsOf(rootId).forEach((c) =>
      setHidden(
        c,
        "platform",
        !(next === "todos" || (c.dataset["platforms"] ?? "").split(" ").includes(slug)),
      ),
    );
  }
  useEffect(
    () => () => {
      clearKey(rootId, "kind");
      clearKey(rootId, "age");
      clearKey(rootId, "platform");
    },
    [rootId],
  );

  const types = MEDIA_TYPES.filter((t) => data.types.includes(t));
  return (
    <div className={`space-y-3 ${className}`}>
      <nav aria-label="Filtrar por tipo">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Tipo
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <button
              type="button"
              aria-pressed={type === "todos"}
              className={chipClass(type === "todos")}
              onClick={() => selectType("todos")}
            >
              Todos
            </button>
          </li>
          {types.map((t) => (
            <li key={t}>
              <button
                type="button"
                aria-pressed={type === t}
                title={mediaTypeLabels[t].help}
                className={chipClass(type === t)}
                onClick={() => selectType(t)}
              >
                {mediaTypeLabels[t].plural}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Filtrar pela idade do filho">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Idade do seu filho (faixa do pai, não a ClassInd)
        </p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <button
              type="button"
              aria-pressed={tier === "todos"}
              className={chipClass(tier === "todos", true)}
              onClick={() => selectTier("todos")}
            >
              Todas
            </button>
          </li>
          {ageTiers.map((t) => (
            <li key={t.slug}>
              <button
                type="button"
                aria-pressed={tier === t.slug}
                title={t.help}
                className={chipClass(tier === t.slug, true)}
                onClick={() => selectTier(t.slug)}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {data.platforms.length > 0 && (
        <nav aria-label="Filtrar por plataforma">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Onde assistir ou jogar
          </p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                aria-pressed={platform === "todos"}
                className={chipClass(platform === "todos", true)}
                onClick={() => selectPlatform("todos")}
              >
                Todas
              </button>
            </li>
            {data.platforms.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  aria-pressed={platform === p}
                  className={chipClass(platform === p, true)}
                  onClick={() => selectPlatform(p)}
                >
                  {p}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
