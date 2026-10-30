import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { PaiIndicaCard } from "@/components/pai-indica/PaiIndicaCard";
import { PaiIndicaFilter, type PaiIndicaFilterData } from "@/components/pai-indica/PaiIndicaFilter";
import { ScoreScaleNote } from "@/components/pai-indica/ScoreScaleNote";
import { AffiliateDisclosure } from "@/components/pai-indica/AffiliateDisclosure";
import { criteriaByCategory } from "@/lib/pai-indica/criterios";
import { SCORE_BANDS } from "@/lib/pai-indica/score";
import { productCategories, productSubcategories } from "@/lib/pai-indica/taxonomia";
import { PAI_INDICA_KINDS, type PaiIndicaPost } from "@/lib/pai-indica/types";

const GRID_ID = "pai-indica-grid";

/** Só categorias/subcategorias que existem nos posts de cada tipo, na ordem da taxonomia. */
function buildFilterData(posts: PaiIndicaPost[]): PaiIndicaFilterData {
  const forKind = (list: PaiIndicaPost[]) => {
    const cats = new Set(list.map((p) => p.product_category));
    const subs = new Set(list.map((p) => `${p.product_category}/${p.product_subcategory}`));
    return {
      categories: productCategories.filter((c) => cats.has(c.slug)).map((c) => ({ ...c })),
      subcategories: productSubcategories
        .filter((s) => subs.has(`${s.category}/${s.slug}`))
        .map((s) => ({ ...s })),
    };
  };
  const data = { todos: forKind(posts) } as PaiIndicaFilterData;
  for (const k of PAI_INDICA_KINDS) data[k] = forKind(posts.filter((p) => p.kind === k));
  return data;
}

/** /pai-indica: listagem sem paginação, filtro em duas camadas no navegador (doc 04 §5.1). */
export default function PaiIndicaListPage({ posts }: { posts: PaiIndicaPost[] }) {
  const filterData = useMemo(() => buildFilterData(posts), [posts]);
  // Links do cabeçalho de cada post chegam com `#cat=<slug>`; o filtro abre já naquela categoria.
  const [initialCategory, setInitialCategory] = useState<string | null>(null);
  useEffect(() => {
    const m = /cat=([a-z0-9-]+)/.exec(window.location.hash);
    setInitialCategory(m ? m[1]! : "todos");
  }, []);

  return (
    <div className="container py-8">
      <Breadcrumbs items={[{ name: "Pai Indica", path: "/pai-indica" }]} />

      <header className="mt-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Pai Indica</p>
        <h1 className="mt-1 font-display text-3xl font-bold md:text-4xl">
          Reviews, comparativos e listas com nota de 0 a 10
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
          Vale a pena? Para quem? Respondemos nos primeiros 30 segundos: nota por critério, prós e
          contras no mesmo tamanho, para quem é e para quem não é, faixa de preço pesquisada e o
          botão direto para comprar. Sem teste físico inventado e sem preço exato.
        </p>
        <p className="mt-2 text-xs font-semibold text-primary">
          {posts.length} {posts.length === 1 ? "publicação" : "publicações"}
        </p>
      </header>

      <ScoreScaleNote className="mt-6" />

      <AdSlot format="leaderboard" className="mt-6" />

      {posts.length > 0 && (
        <PaiIndicaFilter
          key={initialCategory ?? "ssr"}
          data={filterData}
          rootId={GRID_ID}
          initialCategory={initialCategory ?? "todos"}
          className="mt-8"
        />
      )}

      {posts.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          <p className="font-display text-xl font-bold">O Pai Indica está sendo preparado.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Os primeiros reviews, comparativos e listas entram em breve. Enquanto isso, o{" "}
            <Link to="/blog" className="font-semibold text-primary hover:underline">
              Blog
            </Link>{" "}
            já está no ar.
          </p>
        </div>
      ) : (
        <div id={GRID_ID} className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <PaiIndicaCard key={p.id} post={p} />
          ))}
        </div>
      )}

      <AffiliateDisclosure className="mt-10" />

      {/* "Como avaliamos": régua, critérios e independência (doc 04 §5.4, versão na própria listagem) */}
      <section
        id="como-avaliamos"
        aria-labelledby="como-avaliamos-title"
        className="mt-14 scroll-mt-24 space-y-6"
      >
        <h2 id="como-avaliamos-title" className="font-display text-2xl font-bold md:text-3xl">
          Como avaliamos
        </h2>
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          O Pai Indica é análise de ficha técnica, manual do fabricante, anúncio da Amazon Brasil e
          opiniões de compradores fora da Amazon (Reclame Aqui, Mercado Livre, Magalu, fóruns,
          YouTube). Não fazemos teste físico, e o texto de cada review diz isso. A nota é editorial,
          não é a estrela da Amazon. A faixa de preço vem de pesquisa em pelo menos duas lojas e
          nunca vira preço exato. Ninguém paga por nota; link de afiliado não muda nota nem ordem;
          marca não revisa texto.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SCORE_BANDS.map((b) => (
            <div key={b.label} className="rounded-lg border border-border bg-card p-3.5">
              <p className="font-mono text-xs font-semibold text-accent">
                {b.min.toFixed(1).replace(".", ",")} a {b.max.toFixed(1).replace(".", ",")}
              </p>
              <p className="mt-1 font-display text-sm font-semibold">{b.label}</p>
            </div>
          ))}
        </div>
        <div className="table-wrap overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Categoria
                </th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">
                  Os 5 critérios (peso)
                </th>
              </tr>
            </thead>
            <tbody>
              {productCategories.map((c) => (
                <tr key={c.slug} className="border-t border-border">
                  <td className="px-3 py-2 align-top font-semibold">{c.name}</td>
                  <td className="px-3 py-2 align-top text-muted-foreground">
                    {criteriaByCategory[c.slug].map((k) => `${k.name} (${k.weight})`).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          O nome do critério pode ser especializado no texto; o peso não. Erro apontado é corrigido
          e datado: use a página de{" "}
          <Link to="/contato" className="font-semibold text-primary hover:underline">
            contato
          </Link>
          . Veja também a{" "}
          <Link to="/politica-de-afiliados" className="font-semibold text-primary hover:underline">
            política de afiliados
          </Link>{" "}
          e a{" "}
          <Link to="/loja" className="font-semibold text-primary hover:underline">
            Loja do Pai
          </Link>{" "}
          (o pai também quer desconto).
        </p>
      </section>
    </div>
  );
}
