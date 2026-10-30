import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "@/lib/router-compat";
import {
  Camera,
  Check,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Star,
  Tags,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateShort } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { asinFromUrl, buildAmazonUrl } from "@/lib/loja/affiliate";
import { productPriceRange } from "@/lib/loja/price-range";
import { subcategoryName } from "@/lib/loja/categories";
import { checkImageUrls, type ImageCheck } from "@/lib/loja/admin.functions";
import type { Product, ProductCategory, ProductReviewData } from "@/lib/loja/types";
import {
  applyProductPhotos,
  asinQueue,
  fetchAdminProduct,
  fetchAdminProducts,
  fetchProductCategories,
  fetchProductSlugs,
  photoQueue,
  priceQueue,
  savePriceChecks,
  setProductFlags,
  upsertAdminProduct,
  validateProductInput,
  type AdminProductInput,
  type PriceCheckInput,
} from "./admin-products-db";

// Admin de produtos da Loja do Pai (doc 05 §7): lista, criar/editar, fila de
// fotos e fila de faixa de preço. Rotas em src/routes/_admin/admin/produtos/*.

const PENDENTE_SEARCH = (name: string) =>
  `https://www.amazon.com.br/s?k=${encodeURIComponent(name)}`;

function Shell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const nav = [
    { to: "/admin/produtos", label: "Produtos", icon: Tags },
    { to: "/admin/produtos/fila-fotos", label: "Fila de fotos", icon: Camera },
    { to: "/admin/produtos/fila-precos", label: "Fila de faixa de preço", icon: Search },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Loja do Pai</p>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Link
            to="/admin/produtos/novo"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </Link>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        ))}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

const chip = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
    active ? "bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground",
  );

/* ============================================================ Lista */

type ListFilter = "todos" | "inativos" | "sem-review" | "sem-faixa" | "poucas-fotos" | "sem-asin";

export function AdminProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ListFilter>("todos");
  const [categoryId, setCategoryId] = useState("");
  const [query, setQuery] = useState("");

  const reload = () => {
    setLoading(true);
    Promise.all([fetchAdminProducts(), fetchProductCategories()])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (filter === "inativos" && p.active) return false;
      if (filter === "sem-review" && p.review) return false;
      if (filter === "sem-faixa" && p.price_min != null && p.price_max != null) return false;
      if (filter === "poucas-fotos" && p.images.length >= 5) return false;
      if (filter === "sem-asin" && (p.asin || asinFromUrl(p.affiliate_url))) return false;
      if (
        q &&
        !(
          p.name.toLowerCase().includes(q) ||
          p.slug.includes(q) ||
          (p.asin ?? "").toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    });
  }, [products, filter, categoryId, query]);

  const toggle = async (p: Product, flags: { active?: boolean; featured?: boolean }) => {
    try {
      await setProductFlags(p.id, flags);
      setProducts((l) => l.map((x) => (x.id === p.id ? { ...x, ...flags } : x)));
      toast.success("Produto atualizado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar.");
    }
  };

  const counts = {
    todos: products.length,
    inativos: products.filter((p) => !p.active).length,
    "sem-review": products.filter((p) => !p.review).length,
    "sem-faixa": products.filter((p) => p.price_min == null || p.price_max == null).length,
    "poucas-fotos": products.filter((p) => p.images.length < 5).length,
    "sem-asin": asinQueue(products).length,
  };
  const labels: Record<ListFilter, string> = {
    todos: "Todos",
    inativos: "Inativos",
    "sem-review": "Sem review",
    "sem-faixa": "Sem faixa",
    "poucas-fotos": "Menos de 5 fotos",
    "sem-asin": "Sem ASIN (pendente)",
  };

  return (
    <Shell title="Produtos">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(labels) as ListFilter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={chip(filter === f)}>
            {labels[f]} ({counts[f]})
          </button>
        ))}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 rounded-full border border-border bg-card px-3 text-xs font-bold text-muted-foreground"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome, slug ou ASIN"
            className="h-9 w-64 rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="mt-4 space-y-2">
          {list.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum produto.</p>
          )}
          {list.map((p) => {
            const info = productPriceRange(p);
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft sm:flex-row sm:items-center"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt=""
                      className="h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                  ) : (
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5",
                        p.active
                          ? "bg-primary/15 text-primary"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {p.active ? "Ativo" : "Inativo"}
                    </span>
                    {p.featured && (
                      <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-accent-foreground">
                        Destaque
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {p.category?.name ?? "—"}
                      {p.subcategory ? ` · ${subcategoryName(p.subcategory)}` : ""}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-display font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    /loja/{p.slug} · {p.brand ?? "sem marca"} · ASIN{" "}
                    {p.asin ?? asinFromUrl(p.affiliate_url) ?? "PENDENTE"} · {p.images.length} fotos
                    · {p.review ? "com review" : "sem review"} ·{" "}
                    {info
                      ? `${info.kind === "market" ? "faixa" : "estimativa"} ${info.text}`
                      : "sem faixa"}
                    {p.price_range_checked_at
                      ? ` (${formatDateShort(p.price_range_checked_at)})`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link
                    to={`/admin/produtos/${p.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <button
                    onClick={() => toggle(p, { featured: !p.featured })}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-muted-foreground hover:border-accent hover:text-accent-foreground"
                    title="Destacar na vitrine"
                  >
                    <Star className={cn("h-3.5 w-3.5", p.featured && "fill-current")} />
                  </button>
                  <button
                    onClick={() => toggle(p, { active: !p.active })}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    {p.active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                    {p.active ? "Desativar" : "Ativar"}
                  </button>
                  <a
                    href={p.affiliate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Amazon
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

/* ============================================================ Formulário */

const EMPTY: AdminProductInput = {
  slug: "",
  name: "",
  brand: null,
  asin: null,
  affiliate_network: "amazon",
  affiliate_url: "",
  marketplace_urls: {},
  image_url: null,
  images: [],
  short_description: null,
  description: null,
  pros: [],
  cons: [],
  review: null,
  category_id: null,
  subcategory: null,
  price: null,
  price_min: null,
  price_max: null,
  price_range_checked_at: null,
  rating: null,
  rating_count: 0,
  featured: false,
  sort_order: 0,
  active: false,
};

const lines = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));

export function AdminProductForm() {
  const params = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const id = params.id;
  const [form, setForm] = useState<AdminProductInput>(EMPTY);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [reviewText, setReviewText] = useState("");
  const [imagesText, setImagesText] = useState("");
  const [marketText, setMarketText] = useState("{}");
  const [checks, setChecks] = useState<ImageCheck[]>([]);
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProductCategories()
      .then(setCategories)
      .catch(() => {});
    fetchProductSlugs()
      .then(setSlugs)
      .catch(() => {});
    if (!id) return;
    fetchAdminProduct(id)
      .then((p) => {
        if (!p) {
          toast.error("Produto não encontrado.");
          navigate("/admin/produtos");
          return;
        }
        const { category: _c, created_at: _a, updated_at: _u, ...rest } = p;
        setForm(rest);
        setReviewText(p.review ? JSON.stringify(p.review, null, 2) : "");
        setImagesText(p.images.join("\n"));
        setMarketText(JSON.stringify(p.marketplace_urls ?? {}, null, 2));
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const set = <K extends keyof AdminProductInput>(k: K, v: AdminProductInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const importFromAmazon = () => {
    const asin = (form.asin ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      toast.error("Informe um ASIN de 10 caracteres.");
      return;
    }
    set("asin", asin);
    set("affiliate_url", buildAmazonUrl(asin));
    toast.success(`Link preenchido. Ficha e fotos: python3 scripts/rotina/amz.py ${asin}`);
  };

  const testImages = async () => {
    const urls = lines(imagesText);
    if (urls.length === 0) return;
    try {
      const r = await checkImageUrls({ data: { urls } });
      setChecks(r);
      const bad = r.filter((x) => !x.ok).length;
      if (bad) toast.error(`${bad} foto(s) reprovada(s).`);
      else toast.success("Todas as fotos passaram (200, imagem, > 15 KB).");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao testar.");
    }
  };

  const save = async () => {
    let review: ProductReviewData | null = null;
    if (reviewText.trim()) {
      try {
        review = JSON.parse(reviewText) as ProductReviewData;
      } catch {
        toast.error("Review: JSON inválido.");
        return;
      }
    }
    let marketplace_urls: Record<string, string> = {};
    try {
      marketplace_urls = marketText.trim()
        ? (JSON.parse(marketText) as Record<string, string>)
        : {};
    } catch {
      toast.error("marketplace_urls: JSON inválido.");
      return;
    }
    const images = lines(imagesText).slice(0, 8);
    const asin = (form.asin ?? "").trim().toUpperCase() || asinFromUrl(form.affiliate_url);
    const input: AdminProductInput = {
      ...form,
      asin: asin || null,
      slug: form.slug || slugify(form.name),
      affiliate_url:
        form.affiliate_url.trim() ||
        (asin ? buildAmazonUrl(asin) : `${PENDENTE_SEARCH(form.name)}#PENDENTE`),
      images,
      image_url: form.image_url || images[0] || null,
      review,
      marketplace_urls,
    };
    const errors = validateProductInput(input);
    if (!id && slugs.includes(input.slug)) errors.push("Slug já existe.");
    if (errors.length) {
      errors.forEach((e) => toast.error(e));
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertAdminProduct(input);
      toast.success("Produto salvo.");
      if (!id) navigate(`/admin/produtos/${saved.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 animate-pulse rounded-2xl bg-muted" />;

  const field =
    "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary";
  const area =
    "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary";
  const label = "text-xs font-bold uppercase tracking-wider text-muted-foreground";

  return (
    <Shell
      title={id ? `Editar: ${form.name || "produto"}` : "Novo produto"}
      actions={
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-secondary px-5 text-sm font-bold text-secondary-foreground shadow-soft disabled:opacity-60"
        >
          <Check className="h-4 w-4" />
          {saving ? "Salvando…" : "Salvar"}
        </button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label>
              <span className={label}>ASIN</span>
              <input
                value={form.asin ?? ""}
                onChange={(e) => set("asin", e.target.value.toUpperCase())}
                placeholder="B0XXXXXXXX"
                className={field}
              />
            </label>
            <button
              type="button"
              onClick={importFromAmazon}
              className="mt-5 inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-4 text-sm font-bold hover:border-primary hover:text-primary"
            >
              Importar da Amazon
            </button>
          </div>
          <label className="block">
            <span className={label}>Nome</span>
            <input
              value={form.name}
              onChange={(e) => {
                set("name", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              className={field}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={label}>Slug</span>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", e.target.value);
                }}
                className={field}
              />
            </label>
            <label>
              <span className={label}>Marca</span>
              <input
                value={form.brand ?? ""}
                onChange={(e) => set("brand", e.target.value || null)}
                className={field}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={label}>Categoria</span>
              <select
                value={form.category_id ?? ""}
                onChange={(e) => set("category_id", e.target.value || null)}
                className={field}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={label}>Subcategoria (slug do doc 04 §3)</span>
              <input
                value={form.subcategory ?? ""}
                onChange={(e) => set("subcategory", slugify(e.target.value) || null)}
                placeholder="furadeiras-e-parafusadeiras"
                className={field}
              />
            </label>
          </div>
          <label className="block">
            <span className={label}>
              Descrição curta (≤ 130) · {(form.short_description ?? "").length}/130
            </span>
            <input
              value={form.short_description ?? ""}
              onChange={(e) => set("short_description", e.target.value || null)}
              className={field}
            />
          </label>
          <label className="block">
            <span className={label}>Descrição</span>
            <textarea
              rows={4}
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value || null)}
              className={area}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={label}>Prós (um por linha, 3-6)</span>
              <textarea
                rows={5}
                value={form.pros.join("\n")}
                onChange={(e) => set("pros", lines(e.target.value))}
                className={area}
              />
            </label>
            <label>
              <span className={label}>Contras (um por linha, 3-6)</span>
              <textarea
                rows={5}
                value={form.cons.join("\n")}
                onChange={(e) => set("cons", lines(e.target.value))}
                className={area}
              />
            </label>
          </div>
          <label className="block">
            <span className={label}>
              Fotos oficiais (uma URL m.media-amazon.com por linha, até 8; a 1ª é a principal)
            </span>
            <textarea
              rows={5}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              className={cn(area, "font-mono text-xs")}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={testImages}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-bold hover:border-primary hover:text-primary"
            >
              Testar fotos (HEAD 200, &gt; 15 KB)
            </button>
            {checks.map((c) => (
              <span
                key={c.url}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                  c.ok ? "bg-primary/15 text-primary" : "bg-destructive/10 text-destructive",
                )}
                title={c.url}
              >
                {c.ok ? "ok" : c.reason} {c.bytes ? `· ${Math.round(c.bytes / 1024)} KB` : ""}
              </span>
            ))}
          </div>
          <label className="block">
            <span className={label}>
              Review longa (JSON do review_gen.py: nota, 5 critérios, 3 pontos, ≥ 6 seções/3 cta,
              ficha ≥ 5, faq ≥ 4)
            </span>
            <textarea
              rows={10}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className={cn(area, "font-mono text-xs")}
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <label className="block">
              <span className={label}>affiliate_url</span>
              <input
                value={form.affiliate_url}
                onChange={(e) => set("affiliate_url", e.target.value)}
                className={cn(field, "font-mono text-xs")}
              />
            </label>
            <label className="block">
              <span className={label}>Marketplace principal</span>
              <select
                value={form.affiliate_network}
                onChange={(e) =>
                  set("affiliate_network", e.target.value as AdminProductInput["affiliate_network"])
                }
                className={field}
              >
                {["amazon", "mercadolivre", "shopee", "magalu", "outro"].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={label}>marketplace_urls (JSON)</span>
              <textarea
                rows={3}
                value={marketText}
                onChange={(e) => setMarketText(e.target.value)}
                className={cn(area, "font-mono text-xs")}
              />
            </label>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-bold">Preço (nunca exibido exato)</p>
            <label className="block">
              <span className={label}>price (interno, base da estimativa)</span>
              <input
                value={form.price ?? ""}
                onChange={(e) => set("price", numOrNull(e.target.value))}
                className={field}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={label}>price_min</span>
                <input
                  value={form.price_min ?? ""}
                  onChange={(e) => set("price_min", numOrNull(e.target.value))}
                  className={field}
                />
              </label>
              <label>
                <span className={label}>price_max (≤ 3×min)</span>
                <input
                  value={form.price_max ?? ""}
                  onChange={(e) => set("price_max", numOrNull(e.target.value))}
                  className={field}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Faixa pesquisada: use a{" "}
              <Link to="/admin/produtos/fila-precos" className="font-semibold text-primary">
                fila de faixa de preço
              </Link>{" "}
              (grava em product_price_checks).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={label}>Nota compradores (0-5)</span>
                <input
                  value={form.rating ?? ""}
                  onChange={(e) => set("rating", numOrNull(e.target.value))}
                  className={field}
                />
              </label>
              <label>
                <span className={label}>Nº avaliações</span>
                <input
                  value={form.rating_count}
                  onChange={(e) => set("rating_count", Number(e.target.value) || 0)}
                  className={field}
                />
              </label>
            </div>
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set("active", e.target.checked)}
              />
              Ativo (aparece na loja; exige ASIN e foto oficial)
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
              />
              Destaque do Pai
            </label>
            <label className="block">
              <span className={label}>sort_order</span>
              <input
                value={form.sort_order}
                onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
                className={field}
              />
            </label>
          </div>
          {id && (
            <a
              href={`/loja/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Ver na loja
            </a>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ============================================================ Fila de fotos */

export function AdminPhotoQueue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pasted, setPasted] = useState<Record<string, string>>({});

  const reload = () => {
    setLoading(true);
    fetchAdminProducts()
      .then(setProducts)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const queue = useMemo(
    () => [...photoQueue(products), ...asinQueue(products).filter((p) => !p.active)],
    [products],
  );

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success("Comando copiado."));
  };

  const apply = async (p: Product) => {
    const raw = (pasted[p.id] ?? "").trim();
    if (!raw) return;
    let urls: string[] = [];
    try {
      const j = JSON.parse(raw) as { images?: string[] };
      urls = Array.isArray(j.images) ? j.images : [];
    } catch {
      urls = lines(raw);
    }
    if (urls.length === 0) {
      toast.error("Cole o JSON do amz.py (campo images) ou uma URL por linha.");
      return;
    }
    try {
      const r = await checkImageUrls({ data: { urls } });
      const good = r.filter((x) => x.ok).map((x) => x.url);
      if (good.length < 2) {
        toast.error(`Só ${good.length} foto(s) válida(s); precisa de pelo menos 2.`);
        return;
      }
      await applyProductPhotos(p.id, good);
      toast.success(`${good.length} fotos gravadas em ${p.slug}.`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao aplicar.");
    }
  };

  return (
    <Shell title="Fila de fotos oficiais">
      <p className="text-sm text-muted-foreground">
        Produtos ativos sem foto <code>_AC_SL1500_</code> ou com menos de 5 fotos (mesma lógica de{" "}
        <code>scripts/rotina/photo_upgrade.py</code>), mais os inativos sem ASIN. Rode o comando,
        cole o JSON e aplique: só entram fotos com HEAD 200 e mais de 15 KB.
      </p>
      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="mt-4 space-y-3">
          {queue.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Fila vazia.</p>
          )}
          {queue.map((p) => {
            const asin = p.asin ?? asinFromUrl(p.affiliate_url);
            const cmd = asin ? `python3 scripts/rotina/amz.py ${asin}` : "";
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display font-bold">{p.name}</p>
                  <span className="text-xs text-muted-foreground">
                    ASIN {asin ?? "PENDENTE"} · {p.images.length} fotos ·{" "}
                    {p.active ? "ativo" : "inativo"}
                  </span>
                  <Link
                    to={`/admin/produtos/${p.id}`}
                    className="ml-auto text-xs font-bold text-primary hover:underline"
                  >
                    Editar
                  </Link>
                </div>
                {p.images.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {p.images.map((u) => (
                      <img
                        key={u}
                        src={u}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain p-1"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
                {cmd ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <code className="rounded-lg bg-muted px-2 py-1 text-xs">{cmd}</code>
                    <button
                      onClick={() => copy(cmd)}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold hover:border-primary hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar comando
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-destructive">
                    Sem ASIN: confirme o ASIN no formulário antes de buscar fotos.
                  </p>
                )}
                <textarea
                  rows={3}
                  value={pasted[p.id] ?? ""}
                  onChange={(e) => setPasted((s) => ({ ...s, [p.id]: e.target.value }))}
                  placeholder='Cole o JSON do amz.py ({"images": [...]}) ou uma URL por linha'
                  className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                />
                <button
                  onClick={() => apply(p)}
                  className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground"
                >
                  <Camera className="h-3.5 w-3.5" />
                  Aplicar fotos
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}

/* ============================================================ Fila de faixa de preço */

const STORES = [
  "Amazon",
  "Mercado Livre",
  "Magalu",
  "Casas Bahia",
  "Americanas",
  "Kabum",
  "Leroy Merlin",
  "Centauro",
  "Decathlon",
  "Shopee",
  "Site do fabricante",
];

export function AdminPriceQueue() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Record<string, PriceCheckInput[]>>({});

  const reload = () => {
    setLoading(true);
    fetchAdminProducts()
      .then(setProducts)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const queue = useMemo(() => priceQueue(products, 15), [products]);
  const rowsOf = (id: string) =>
    rows[id] ?? [
      { store: "Amazon", price: 0, url: "" },
      { store: "Mercado Livre", price: 0, url: "" },
    ];
  const setRow = (id: string, i: number, patch: Partial<PriceCheckInput>) =>
    setRows((r) => {
      const list = rowsOf(id).map((x, k) => (k === i ? { ...x, ...patch } : x));
      return { ...r, [id]: list };
    });

  const save = async (p: Product) => {
    try {
      const { min, max } = await savePriceChecks(p.id, rowsOf(p.id));
      toast.success(`Faixa gravada: ${min} a ${max}.`);
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gravar.");
    }
  };

  return (
    <Shell title="Fila de faixa de preço">
      <p className="text-sm text-muted-foreground">
        Até 15 produtos ativos sem <code>price_range_checked_at</code> (depois, os com mais de 60
        dias). Pesquise o <strong>mesmo item</strong> (marca, modelo, cor/quantidade) em pelo menos
        2 lojas; a faixa é recusada se o máximo passar de 3× o mínimo. Grava em{" "}
        <code>product_price_checks</code>e atualiza a faixa do produto.
      </p>
      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : (
        <div className="mt-4 space-y-3">
          {queue.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Fila vazia.</p>
          )}
          {queue.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display font-bold">{p.name}</p>
                <span className="text-xs text-muted-foreground">
                  {p.brand ?? ""} · ASIN {p.asin ?? asinFromUrl(p.affiliate_url) ?? "PENDENTE"} ·{" "}
                  {p.price_range_checked_at
                    ? `última pesquisa ${formatDateShort(p.price_range_checked_at)}`
                    : "nunca pesquisado"}
                </span>
                <a
                  href={p.affiliate_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs font-bold text-primary hover:underline"
                >
                  Abrir na Amazon
                </a>
              </div>
              <div className="mt-3 space-y-2">
                {rowsOf(p.id).map((r, i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[160px_120px_1fr]">
                    <select
                      value={r.store}
                      onChange={(e) => setRow(p.id, i, { store: e.target.value })}
                      className="h-9 rounded-xl border border-border bg-background px-2 text-xs"
                    >
                      {STORES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      value={r.price || ""}
                      onChange={(e) =>
                        setRow(p.id, i, { price: Number(e.target.value.replace(",", ".")) || 0 })
                      }
                      placeholder="preço"
                      className="h-9 rounded-xl border border-border bg-background px-2 text-xs"
                    />
                    <input
                      value={r.url}
                      onChange={(e) => setRow(p.id, i, { url: e.target.value })}
                      placeholder="URL do anúncio"
                      className="h-9 rounded-xl border border-border bg-background px-2 text-xs"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setRows((s) => ({
                      ...s,
                      [p.id]: [...rowsOf(p.id), { store: "Magalu", price: 0, url: "" }],
                    }))
                  }
                  className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-bold hover:border-primary hover:text-primary"
                >
                  + loja
                </button>
                <button
                  onClick={() => save(p)}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                  Gravar faixa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
