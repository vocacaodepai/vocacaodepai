import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import {
  ChevronDown,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Tag,
  User,
  UserRound,
  X,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { Footer } from "./Footer";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { NAV_END, NAV_MAIN } from "./nav";
import { fetchCategories } from "@/lib/db";
import { trackPageView } from "@/lib/ga4";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";

// Layout do site (doc 03 §4.3): faixa fina "O pai também quer desconto", header
// com logo (Bússola do Pai), as 7 seções em uma linha a partir de xl (Blog com
// dropdown de categorias), Sobre/Contato a partir de 2xl, busca, tema, conta e
// menu móvel; rodapé em 4 colunas (Footer.tsx).

const MOBILE_MENU_ID = "menu-movel";

const navItemClass = (isActive: boolean, store?: boolean) =>
  cn(
    "rounded-md px-3 py-2 text-[15px] font-semibold transition-colors",
    isActive
      ? "text-primary"
      : store
        ? "text-accent hover:text-accent/80"
        : "text-muted-foreground hover:text-foreground",
  );

export function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, ready, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [blogOpen, setBlogOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isStaff = profile?.role === "admin" || profile?.role === "editor";
  const closeMobile = useCallback(() => setOpen(false), []);

  // Google Analytics: page_view a cada navegação da SPA (só conta após consentimento).
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  // Fecha menus ao navegar.
  useEffect(() => {
    setOpen(false);
    setBlogOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

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

  const blogActive =
    location.pathname.startsWith("/blog") || location.pathname.startsWith("/categoria");

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Atalho de teclado/leitor de tela para pular o cabeçalho e o menu */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-elegant"
      >
        Pular para o conteúdo
      </a>
      <div className="site-texture" aria-hidden />

      {/* Faixa fina acima do header (doc 03 §4.3) */}
      <div className="relative z-40 bg-secondary text-secondary-foreground">
        <div className="container flex h-8 items-center justify-center gap-2 text-xs">
          <Tag className="h-3.5 w-3.5 text-accent" aria-hidden />
          <span className="truncate">O pai também quer desconto</span>
          <Link to="/loja" className="shrink-0 font-bold text-accent hover:underline">
            Loja do Pai →
          </Link>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="shrink-0 text-primary" aria-label={`${SITE_NAME} — início`}>
            <Logo symbolClassName="h-8 w-8 sm:h-9 sm:w-9" />
          </Link>

          <nav
            className="hidden items-center gap-0.5 whitespace-nowrap xl:flex"
            aria-label="Principal"
          >
            {NAV_MAIN.map((item) =>
              item.to === "/blog" ? (
                /* Blog com dropdown de categorias */
                <div
                  key={item.to}
                  className="relative"
                  onMouseEnter={() => setBlogOpen(true)}
                  onMouseLeave={() => setBlogOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setBlogOpen((v) => !v)}
                    aria-expanded={blogOpen}
                    aria-haspopup="menu"
                    className={cn("inline-flex items-center gap-1", navItemClass(blogActive))}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn("h-4 w-4 transition-transform", blogOpen && "rotate-180")}
                      aria-hidden
                    />
                  </button>
                  {blogOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setBlogOpen(false)}
                        aria-hidden
                      />
                      <div
                        role="menu"
                        className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2 rounded-lg border border-border bg-card p-2 shadow-elegant"
                      >
                        <Link
                          to="/blog"
                          role="menuitem"
                          onClick={() => setBlogOpen(false)}
                          className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm font-bold text-foreground transition-colors hover:bg-primary/10"
                        >
                          Todos os artigos
                          <span className="text-xs font-bold text-primary">→</span>
                        </Link>
                        <div className="my-2 h-px bg-border" />
                        <p className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Categorias
                        </p>
                        {categories.length === 0 && (
                          <p className="px-3 py-1.5 text-sm text-muted-foreground">Carregando…</p>
                        )}
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/categoria/${cat.slug}`}
                            role="menuitem"
                            onClick={() => setBlogOpen(false)}
                            className="block rounded-md px-3 py-1.5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => navItemClass(isActive, item.store)}
                >
                  {item.label}
                </NavLink>
              ),
            )}

            {NAV_END.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => cn("hidden 2xl:inline-block", navItemClass(isActive))}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {showSearch ? (
              <form onSubmit={submitSearch} className="flex items-center gap-1" role="search">
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar no site…"
                  aria-label="Buscar no site"
                  className="h-9 w-40 rounded-md border border-border bg-card px-3 text-sm outline-none focus:border-primary sm:w-56"
                />
                <button
                  type="button"
                  onClick={() => setShowSearch(false)}
                  aria-label="Fechar busca"
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                aria-label="Buscar"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Search className="h-4 w-4" aria-hidden />
              </button>
            )}
            <ThemeToggle />
            {ready &&
              (user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Minha conta"
                    className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        crossOrigin="anonymous"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (profile?.full_name ?? user.email ?? "P").charAt(0).toUpperCase()
                    )}
                  </button>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                        aria-hidden
                      />
                      <div
                        role="menu"
                        className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-border bg-card p-2 shadow-elegant"
                      >
                        <p className="truncate px-3 py-2 text-sm font-bold text-foreground">
                          {profile?.full_name ?? user.email ?? "Minha conta"}
                        </p>
                        <Link
                          to="/area-do-pai"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
                        >
                          <UserRound className="h-4 w-4" aria-hidden />
                          Área do Pai
                        </Link>
                        <Link
                          to="/minha-conta"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary/10"
                        >
                          <User className="h-4 w-4" aria-hidden />
                          Minha conta
                        </Link>
                        {isStaff && (
                          <Link
                            to="/admin"
                            role="menuitem"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary/10"
                          >
                            <ShieldCheck className="h-4 w-4" aria-hidden />
                            Admin
                          </Link>
                        )}
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setUserMenuOpen(false);
                            void logout();
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-primary/10"
                        >
                          <LogOut className="h-4 w-4" aria-hidden />
                          Sair
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/entrar"
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-primary px-3.5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">Entrar</span>
                </Link>
              ))}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              aria-controls={MOBILE_MENU_ID}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-muted-foreground xl:hidden"
            >
              {open ? (
                <X className="h-4 w-4" aria-hidden />
              ) : (
                <Menu className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <MobileMenu
          id={MOBILE_MENU_ID}
          open={open}
          onClose={closeMobile}
          categories={categories}
          ready={ready}
          user={user}
          isStaff={isStaff}
          onLogout={() => void logout()}
        />
      </header>

      <main id="conteudo" tabIndex={-1} className="relative z-10 flex-1 outline-none">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
