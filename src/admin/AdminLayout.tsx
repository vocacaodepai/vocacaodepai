import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, LogOut, Plus, ShieldAlert, ShoppingBag, Users } from "lucide-react";
import { SITE_NAME } from "@/lib/site";
import { fetchAdminProfile, fetchIsAdmin, type AdminProfile } from "./admin-db";

export interface AdminOutletContext {
  profile: AdminProfile;
  isStaff: boolean;
}

type Session =
  | { state: "loading" }
  | { state: "anonymous" }
  | { state: "forbidden"; profile: AdminProfile | null }
  | { state: "ok"; profile: AdminProfile };

/**
 * Guarda das rotas `/_admin/*` (doc 03 §8.1): só `profiles.role in ('editor','admin')`,
 * conferido pela função `public.is_admin()` (mesma usada nas policies RLS).
 * Sem sessão → `/admin/login`; com sessão sem papel → mensagem "Acesso restrito à equipe".
 */
export function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session>({ state: "loading" });

  useEffect(() => {
    let mounted = true;

    const resolve = async () => {
      if (mounted) setSession({ state: "loading" });
      try {
        const [isAdmin, profile] = await Promise.all([fetchIsAdmin(), fetchAdminProfile()]);
        if (!mounted) return;
        const staffRole = profile?.role === "admin" || profile?.role === "editor";
        if (profile && (isAdmin || staffRole)) setSession({ state: "ok", profile });
        else setSession({ state: "forbidden", profile });
      } catch {
        if (mounted) setSession({ state: "forbidden", profile: null });
      }
    };

    (async () => {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      if (s?.user) await resolve();
      else setSession({ state: "anonymous" });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      if (s?.user) void resolve();
      else setSession({ state: "anonymous" });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (session.state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando acesso…
      </div>
    );
  }

  if (session.state === "anonymous") {
    return <Navigate to="/admin/login" replace />;
  }

  if (session.state === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-elegant">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-bold">Acesso restrito à equipe</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {session.profile
              ? `A conta ${session.profile.display_name} está logada, mas não tem papel de editor ou admin. Peça ao administrador para liberar o acesso.`
              : "Não foi possível carregar o seu perfil. Tente entrar de novo."}
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={logout}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              <LogOut className="h-4 w-4" />
              Sair e entrar com outra conta
            </button>
            <Link
              to="/"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const ctx: AdminOutletContext = { profile: session.profile, isStaff: true };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-primary">{SITE_NAME}</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">· Painel</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/admin/editor"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Novo artigo
            </Link>
            <Link
              to="/admin/produtos"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ShoppingBag className="h-4 w-4" />
              Loja do Pai
            </Link>
            {session.profile.role === "admin" && (
              <Link
                to="/admin/membros"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <Users className="h-4 w-4" />
                Membros
              </Link>
            )}
            <Link
              to="/admin/irmandade"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Users className="h-4 w-4" />
              Irmandade
            </Link>
            <span className="hidden text-sm text-muted-foreground md:block">
              {session.profile.display_name} · {session.profile.role}
            </span>
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Site
            </Link>
            <button
              onClick={logout}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Outlet context={ctx} />
      </main>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME} — Painel de publicação
      </footer>
    </div>
  );
}
