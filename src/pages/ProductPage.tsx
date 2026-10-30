import { getRouteApi } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { ArrowLeft, CheckCircle2, Info, Star } from "lucide-react";
import { MARKETPLACE_NAMES, AFFILIATE_REL } from "@/lib/loja/affiliate";
import { subcategoryName } from "@/lib/loja/categories";
import { formatDateShort } from "@/lib/site";
import { ProductCard } from "@/components/loja/ProductCard";
import { ProductGallery } from "@/components/loja/ProductGallery";
import { ProductReviewArticle } from "@/components/loja/ProductReviewArticle";
import { AffiliateNotice } from "@/components/loja/AffiliateNotice";
import { BuyButton } from "@/components/loja/BuyButton";
import { PriceRange } from "@/components/loja/PriceRange";
import { StickyProductBar } from "@/components/loja/StickyProductBar";
import { SaveButton } from "@/components/area-do-pai/SaveButton";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AdSlot } from "@/components/blog/AdSlot";
import { productPriceRange } from "@/lib/loja/price-range";
import { cn } from "@/lib/utils";

const productRouteApi = getRouteApi("/_site/loja/$slug");

/**
 * /loja/$slug (doc 05 §4.7): galeria (até 8 fotos oficiais), nome/marca/nota de
 * compradores, faixa de preço com o texto exato, botão "Comprar agora na Amazon"
 * (tag no servidor), Prós/Contras, Review do Pai (products.review), "Produtos
 * parecidos", "No Pai Indica" (posts_for_product), aviso de afiliado e barra fixa.
 */
export default function ProductPage() {
  const { product, similar, relatedPosts, priceChecks } = productRouteApi.useLoaderData();
  const images =
    product.images.length > 0 ? product.images : product.image_url ? [product.image_url] : [];
  const info = productPriceRange(product);
  const hasRating = product.rating != null && product.rating_count > 0;
  const marketplaces = Object.entries(product.marketplace_urls ?? {}).filter(
    ([k, v]) => k !== product.affiliate_network && typeof v === "string" && v.startsWith("http"),
  );

  return (
    <div className="pb-16">
      <div className="container py-6">
        <Breadcrumbs
          items={[
            { name: "Loja do Pai", path: "/loja" },
            ...(product.category
              ? [{ name: product.category.name, path: `/loja/categoria/${product.category.slug}` }]
              : []),
            { name: product.name, path: `/loja/${product.slug}` },
          ]}
        />
        <Link
          to={product.category ? `/loja/categoria/${product.category.slug}` : "/loja"}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          {product.category ? `Voltar para ${product.category.name}` : "Voltar para a Loja do Pai"}
        </Link>
      </div>

      <div className="container grid gap-8 lg:grid-cols-2">
        <div>
          <ProductGallery name={product.name} images={images} />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <Link
                to={`/loja/categoria/${product.category.slug}`}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            {product.subcategory && (
              <span className="rounded-full bg-secondary/60 px-3 py-1 text-xs font-bold text-secondary-foreground">
                {subcategoryName(product.subcategory)}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">
            {product.name}
          </h1>
          {product.brand && (
            <p className="mt-1 text-sm text-muted-foreground">Marca: {product.brand}</p>
          )}

          {hasRating && (
            <div
              className="mt-3 flex items-center gap-1"
              aria-label={`Nota de compradores: ${product.rating} de 5, ${product.rating_count} avaliações`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.round(product.rating!)
                      ? "fill-accent text-accent"
                      : "fill-muted text-muted-foreground/40",
                  )}
                />
              ))}
              <span className="ml-1.5 text-xs font-semibold text-muted-foreground">
                {product.rating!.toFixed(1).replace(".", ",")} · nota de compradores (
                {product.rating_count.toLocaleString("pt-BR")} avaliações)
              </span>
            </div>
          )}

          <div className="mt-5">
            {info ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {info.kind === "estimate" ? "Faixa estimada" : "Faixa de preço"}
                </p>
                <p className="font-display text-3xl font-extrabold text-foreground">{info.text}</p>
              </>
            ) : null}
            <PriceRange product={product} className="mt-1" />
          </div>

          {product.short_description && (
            <p className="mt-4 text-base leading-relaxed text-foreground/80">
              {product.short_description}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <BuyButton
              href={product.affiliate_url}
              network={product.affiliate_network}
              productName={product.name}
              size="lg"
              className="min-w-[220px] flex-1"
            />
            {/* Salvar na Área do Pai (saved_items, item_type 'product') */}
            <SaveButton itemType="product" itemId={product.id} size="lg" />
          </div>
          {marketplaces.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Também disponível em:{" "}
              {marketplaces.map(([k, v], i) => (
                <span key={k}>
                  {i > 0 && " · "}
                  <a
                    href={v}
                    target="_blank"
                    rel={AFFILIATE_REL}
                    className="font-semibold text-primary hover:underline"
                  >
                    {MARKETPLACE_NAMES[k] ?? k}
                  </a>
                </span>
              ))}
            </p>
          )}
          <AffiliateNotice className="mt-3" />

          {product.description && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h2 className="font-display text-lg font-bold">O que é</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">
                {product.description}
              </p>
            </div>
          )}

          {(product.pros.length > 0 || product.cons.length > 0) && (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {product.pros.length > 0 && (
                <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Prós
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {product.pros.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm leading-relaxed text-foreground/80"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {product.cons.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                    <Info className="h-5 w-5 text-destructive" />
                    Contras
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {product.cons.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm leading-relaxed text-foreground/80"
                      >
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <ProductReviewArticle product={product} />
      </div>

      <AdSlot format="leaderboard" className="container mt-10" />

      {similar.length > 0 && (
        <section className="container mt-14" aria-labelledby="similar-title">
          <h2 id="similar-title" className="font-display text-2xl font-bold">
            Produtos parecidos
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {relatedPosts.length > 0 && (
        <section className="container mt-14" aria-labelledby="pai-indica-title">
          <h2 id="pai-indica-title" className="font-display text-2xl font-bold">
            No Pai Indica
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reviews e comparativos que analisam este produto.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((post) => (
              <Link
                key={post.id}
                to={`/pai-indica/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-elegant"
              >
                {post.cover_image_url && (
                  <img
                    src={post.cover_image_url}
                    alt={post.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-video w-full bg-white object-contain p-4"
                  />
                )}
                <div className="p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {post.kind === "comparativo"
                      ? "Comparativo"
                      : post.kind === "lista"
                        ? "Lista"
                        : "Review"}
                    {typeof post.product_score === "number" &&
                      ` · Nota ${post.product_score.toFixed(1).replace(".", ",")}`}
                  </p>
                  <p className="mt-1 font-display text-base font-bold leading-snug group-hover:text-primary">
                    {post.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="container mt-12 space-y-3">
        {priceChecks.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
            <p className="font-bold text-foreground">Onde pesquisamos o preço</p>
            <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {priceChecks.map((c) => (
                <li key={c.id}>
                  {c.store} · {formatDateShort(c.checked_at)}
                </li>
              ))}
            </ul>
          </div>
        )}
        <AffiliateNotice />
      </div>

      <StickyProductBar product={product} />
    </div>
  );
}
