import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { reopenCookieConsent } from "./CookieConsent";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";
import { fetchCategories } from "@/lib/db";
import { trackPageView } from "@/lib/ga4";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";

// Menu principal da Fase 1: Início → Blog (com categorias) → Sobre/Contato.
// TODO Fase 1 (etapa 4) e Fases 2-7: itens Pai Indica, Loja do Pai, Caixa de
// Ferramentas, Área do Pai, Pai Indica Pai, Irmandade e Formação (CLAUDE.md §1).
const NAV_MAIN = [{ to: "/", label: "Início", end: true }];
const NAV_END = [
  { to: "/sobre", label: "Sobre", end: false },
  { to: "/contato", label: "Contato", end: false },
];

export function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, ready, openLogin, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogOpen, setBlogOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Google Analytics: registra cada visualização de página da SPA.
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setShowSearch(false);
    setQ("");
    navigate(`/busca?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Atalho de teclado/leitor de tela para pular o cabeçalho e o menu */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-elegant"
      >
        Pular para o conteúdo
      </a>
      <div className="site-texture" aria-hidden />

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* TODO Fase 1 (etapa 6.6): logo em imagem (public/logo-web.png). */}
          <Link
            to="/"
            className="shrink-0 font-display text-2xl font-bold tracking-tight text-primary sm:text-3xl"
            aria-label={SITE_NAME}
          >
            {SITE_NAME}
          </Link>

          <nav
            className="hidden items-center gap-0.5 whitespace-nowrap xl:flex"
            aria-label="Principal"
          >
            {NAV_MAIN.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Blog com dropdown de categorias */}
            <div
              className="relative"
              onMouseEnter={() => setBlogOpen(true)}
              onMouseLeave={() => setBlogOpen(false)}
            >
              <button
                onClick={() => setBlogOpen((v) => !v)}
                aria-expanded={blogOpen}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                  location.pathname.startsWith("/blog") ||
                    location.pathname.startsWith("/categoria")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Blog
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", blogOpen && "rotate-180")}
                />
              </button>
              {blogOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBlogOpen(false)}
                    aria-hidden
                  />
                  <div className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-2xl border border-border bg-card p-2 shadow-elegant">
                    <Link
                      to="/blog"
                      onClick={() => setBlogOpen(false)}
                      className="flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                    >
                      Blog
                      <span className="text-xs font-bold text-primary">→</span>
                    </Link>
                    <div className="my-2 h-px bg-border" />
                    <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Categorias
                    </p>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/categoria/${cat.slug}`}
                        onClick={() => setBlogOpen(false)}
                        className="block rounded-xl px-3 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary/60 hover:text-foreground"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {NAV_END.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "hidden rounded-full px-3 py-2 text-sm font-semibold transition-colors 2xl:inline-block",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {showSearch ? (
              <form onSubmit={submitSearch} className="flex items-center gap-1">
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar artigos..."
                  className="h-9 w-40 rounded-full border border-border bg-card px-4 text-sm outline-none focus:border-primary sm:w-56"
                />
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  aria-label="Fechar busca"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                aria-label="Buscar"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
            <ThemeToggle />
            {ready &&
              (user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-label="Minha conta"
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-bold text-secondary-foreground transition-colors hover:bg-secondary/80"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name}
                        crossOrigin="anonymous"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (profile?.full_name ?? "P").charAt(0).toUpperCase()
                    )}
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-elegant">
                        <p className="truncate px-3 py-2 text-sm font-bold text-foreground">
                          {profile?.full_name ?? user.email ?? "Minha conta"}
                        </p>
                        {(profile?.role === "admin" || profile?.role === "editor") && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-secondary/60"
                          >
                            <ShieldCheck className="h-4 w-4" />
                            Painel Admin
                          </Link>
                        )}
                        {/* TODO Fase 5 (Área do Pai): links /area-do-pai e /minha-conta. */}
                        {/* TODO Fase 7 (Irmandade): link /historias/nova. */}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary/60"
                        >
                          <LogOut className="h-4 w-4" />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={openLogin}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </button>
              ))}
            <button
              onClick={() => setOpen(!open)}
              aria-label="Abrir menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground xl:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <nav aria-label="Menu móvel" className="border-t border-border bg-background xl:hidden">
            <div className="container flex flex-col gap-1 py-3">
              {NAV_MAIN.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-3 text-sm font-semibold",
                      isActive ? "text-primary" : "text-foreground/80",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/blog"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-4 py-3 text-sm font-semibold",
                    isActive ? "text-primary" : "text-foreground/80",
                  )
                }
              >
                Blog
              </NavLink>
              <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Categorias
              </p>
              <div className="flex flex-wrap gap-2 px-4 pb-2">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categoria/${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
              {NAV_END.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "rounded-xl px-4 py-3 text-sm font-semibold",
                      isActive ? "text-primary" : "text-foreground/80",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {ready &&
                (user ? (
                  <>
                    {(profile?.role === "admin" || profile?.role === "editor") && (
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-primary"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Painel Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-foreground/80"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setOpen(false);
                      openLogin();
                    }}
                    className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-primary"
                  >
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </button>
                ))}
            </div>
          </nav>
        )}
      </header>

      <main id="conteudo" tabIndex={-1} className="relative z-10 flex-1 outline-none">
        <Outlet />
      </main>

      <footer className="relative z-10 mt-16 border-t border-border bg-card/60">
        <div className="container grid gap-10 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-display text-2xl font-bold text-primary">{SITE_NAME}</p>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">{SITE_DESCRIPTION}</p>
            <p className="mt-3 max-w-sm rounded-xl bg-secondary/40 p-3 text-xs leading-relaxed text-secondary-foreground">
              Aviso: o conteúdo deste site é informativo e educacional e não substitui a orientação
              de médicos, psicólogos, advogados, contadores ou outros profissionais. Em caso de
              dúvida sobre a sua saúde, a da sua família, finanças ou questões legais, procure
              sempre um profissional qualificado.
            </p>
            <div className="mt-5 max-w-sm">
              <p className="mb-2 text-sm font-bold">Newsletter</p>
              <NewsletterSignup compact source="rodape" />
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Institucional
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/sobre"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Sobre
                </Link>
              </li>
              {/* TODO Fase 3 (Loja do Pai): link /loja "O pai também quer desconto". */}
              <li>
                <Link
                  to="/contato"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Contato
                </Link>
              </li>
              <li>
                <Link
                  to="/politica-de-privacidade"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  to="/termos-de-uso"
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => reopenCookieConsent()}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  Preferências de cookies
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Categorias
            </p>
            <ul className="space-y-2 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/categoria/${c.slug}`}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Selos de confiança */}
        <div className="border-t border-border bg-card/40">
          <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-6">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Site 100% seguro (HTTPS)
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Lock className="h-5 w-5 text-primary" />
              Privacidade e proteção de dados
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <CreditCard className="h-5 w-5 text-primary" />
              Compra processada pela Amazon
            </span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Conteúdo revisado e confiável
            </span>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
            <p>
              © {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.
            </p>
            <p>{SITE_TAGLINE}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
