import { useMemo } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { MediaCard } from "@/components/pai-indica-midia/MediaCard";
import { MediaFilter, type MediaFilterData } from "@/components/pai-indica-midia/MediaFilter";
import { ClassIndSeal } from "@/components/pai-indica-midia/MediaBadge";
import { SCORE_BANDS } from "@/lib/pai-indica/score";
import {
  CLASSIND_CONSULTA,
  ageTiers,
  classindLabels,
  contentCategories,
  formatMoral,
  moralScale,
} from "@/lib/pai-indica-midia/taxonomia";
import { CLASSIND_VALUES, type MediaCardRow } from "@/lib/pai-indica-midia/types";

const GRID_ID = "pai-indica-midia-grid";

function buildFilterData(items: MediaCardRow[]): MediaFilterData {
  const count = new Map<string, number>();
  for (const m of items) for (const p of m.platforms) count.set(p, (count.get(p) ?? 0) + 1);
  return {
    types: Array.from(new Set(items.map((m) => m.type))),
    platforms: Array.from(count.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([p]) => p),
  };
}

/** Régua tripla, retrátil e fechada por padrão (mesmo padrão do ScoreScaleNote do Pai Indica). */
function TripleScaleNote({ className = "" }: { className?: string }) {
  return (
    <details className={`group rounded-2xl border border-border bg-card shadow-soft ${className}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:px-6 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-xs font-bold uppercase tracking-wider text-accent">
            Como ler a ficha
          </span>
          <span className="mt-1 block font-display text-lg font-bold">
            Selo oficial ClassInd + nota tripla do pai: qualidade, moral e idade
          </span>
        </span>
        <ChevronDown
          className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-5 px-4 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6 sm:pb-6">
        <p className="max-w-3xl">
          A Classificação Indicativa é lei: vem do Ministério da Justiça e nós só copiamos, com link
          para a consulta oficial. O que é nosso é a leitura de pai: <strong>qualidade</strong> (é
          bem feito? 0 a 10, mesma régua do Pai Indica), <strong>moral</strong> (faz bem ou mal à
          família? -4 a +4) e <strong>idade</strong> (a partir de quando o seu filho dá conta, na
          nossa opinião, que pode ser mais exigente que a oficial). Separar as três evita o erro
          clássico: filme bem feito não é, só por isso, filme bom para criança.
        </p>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
            Selo oficial ClassInd
          </p>
          <ul className="mt-2 flex flex-wrap gap-3">
            {CLASSIND_VALUES.map((c) => (
              <li key={c} className="inline-flex items-center gap-2">
                <ClassIndSeal classind={c} />
                <span className="text-xs">{classindLabels[c].text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            Livros não recebem ClassInd. Conferência:{" "}
            <a
              href={CLASSIND_CONSULTA.filmes}
              target="_blank"
              rel="noopener"
              className="font-semibold text-primary hover:underline"
            >
              filmes e séries
            </a>{" "}
            ·{" "}
            <a
              href={CLASSIND_CONSULTA.jogos}
              target="_blank"
              rel="noopener"
              className="font-semibold text-primary hover:underline"
            >
              jogos e apps
            </a>
            .
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Qualidade (0 a 10)
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {SCORE_BANDS.map((b) => (
                <li key={b.label}>
                  <span className="font-mono font-semibold text-accent">
                    {b.min.toFixed(1).replace(".", ",")}–{b.max.toFixed(1).replace(".", ",")}
                  </span>{" "}
                  {b.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Moral (-4 a +4)
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {moralScale.map((m) => (
                <li key={m.value}>
                  <span className="font-mono font-semibold text-accent">
                    {formatMoral(m.value)}
                  </span>{" "}
                  {m.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Idade do pai
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              {ageTiers.map((t) => (
                <li key={t.slug}>
                  <span className="font-semibold">{t.name}</span> · {t.help}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs">
              E 10 categorias em bolinhas de 0 a 5:{" "}
              {contentCategories.map((c) => c.name.toLowerCase()).join(", ")}.
            </p>
          </div>
        </div>
      </div>
    </details>
  );
}

/** /pai-indica/midia: listagem sem paginação, filtro em três camadas no navegador (doc 14 §5.1). */
export default function MidiaListPage({ items }: { items: MediaCardRow[] }) {
  const filterData = useMemo(() => buildFilterData(items), [items]);
  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Pai Indica", path: "/pai-indica" },
          { name: "Mídia", path: "/pai-indica/midia" },
        ]}
      />

      <header className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Pai Indica Mídia</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
          Esse filme, série, jogo, app ou livro é para o seu filho?
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          A classificação oficial diz a idade. Nós dizemos o resto: o que aparece na tela, o que a
          história ensina, a partir de quando o seu filho dá conta e o que conversar depois. Visão
          de pai católico, sem spoiler desnecessário e sem pôster gerado por computador.
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">
          {items.length} {items.length === 1 ? "ficha" : "fichas"}
        </p>
      </header>

      <TripleScaleNote className="mt-6" />

      <AdSlot format="leaderboard" className="mt-6" />

      {items.length > 0 && <MediaFilter data={filterData} rootId={GRID_ID} className="mt-8" />}

      {items.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          <p className="font-display text-xl font-bold">O Pai Indica Mídia está sendo preparado.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            As primeiras fichas entram em breve. Enquanto isso, o{" "}
            <Link to="/pai-indica" className="font-semibold text-primary hover:underline">
              Pai Indica
            </Link>{" "}
            de produtos e o{" "}
            <Link to="/blog" className="font-semibold text-primary hover:underline">
              Blog
            </Link>{" "}
            já estão no ar.
          </p>
        </div>
      ) : (
        <div id={GRID_ID} className="mt-8 grid gap-5 lg:grid-cols-2">
          {items.map((m) => (
            <MediaCard key={m.id} media={m} />
          ))}
        </div>
      )}

      <section
        id="como-avaliamos"
        aria-labelledby="midia-como-avaliamos"
        className="mt-14 scroll-mt-24 space-y-4"
      >
        <h2 id="midia-como-avaliamos" className="font-display text-2xl font-bold md:text-3xl">
          Como avaliamos
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Assistimos, jogamos ou lemos a obra inteira antes de escrever. A ficha descreve cenas de
          forma objetiva (o que aparece, quantas vezes, em que contexto), sem contar o fim. A nota
          de qualidade segue a régua do Pai Indica; a nota moral olha a cosmovisão dominante da obra
          à luz da fé católica e da família; a idade é opinião de pai, não lei. Nenhum estúdio,
          editora ou loja paga por nota, e o link de afiliado da Amazon (livros e jogos) não muda
          nada. Erro apontado é corrigido e datado: use a página de{" "}
          <Link to="/contato" className="font-semibold text-primary hover:underline">
            contato
          </Link>
          .
        </p>
        <p className="text-xs text-muted-foreground">
          Fonte da classificação oficial: Ministério da Justiça e Segurança Pública,{" "}
          <a
            href={CLASSIND_CONSULTA.sobre}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            Classificação Indicativa <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          . Veja também a{" "}
          <Link to="/politica-de-afiliados" className="font-semibold text-primary hover:underline">
            política de afiliados
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
