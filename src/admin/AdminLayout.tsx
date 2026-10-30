import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyProfile, signOut } from "@/lib/db";
import { Heart, LayoutDashboard, LogOut, Plus } from "lucide-react";
import { SITE_NAME } from "@/lib/site";

export function AdminLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{
    loading: boolean;
    user: { id: string; email?: string } | null;
    profile: { id: string; full_name: string; role: string } | null;
  }>({
    loading: true,
    user: null,
    profile: null,
  });

  useEffect(() => {
    let mounted = true;

    // Resolve o usuário E o perfil juntos, mantendo loading=true até o fim:
    // assim o painel NUNCA redireciona para o login antes de saber o perfil.
    const resolveSession = async (userId: string) => {
      if (mounted) setSession({ loading: true, user: { id: userId }, profile: null });
      let profile: { id: string; full_name: string; role: string } | null = null;
      try {
        profile = await fetchMyProfile();
      } catch {
        profile = null;
      }
      // Garantia: se o perfil não existir (conta sem trigger), cria automaticamente.
      if (!profile) {
        try {
          await supabase.rpc("ensure_profile");
          profile = await fetchMyProfile();
        } catch {
          profile = null;
        }
      }
      if (mounted) setSession({ loading: false, user: { id: userId }, profile });
    };

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!mounted) return;
      const user = session?.user ?? null;
      if (user) {
        await resolveSession(user.id);
      } else {
        setSession({ loading: false, user: null, profile: null });
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      const user = s?.user ?? null;
      if (user) {
        void resolveSession(user.id);
      } else {
        setSession({ loading: false, user: null, profile: null });
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (session.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">...</div>
    );
  }

  if (!session.user || !session.profile) {
    return <Navigate to="/admin/login" replace />;
  }

  const isStaff = session.profile.role === "admin" || session.profile.role === "editor";

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white">
              <Heart className="h-5 w-5 fill-current" />
            </span>
            <span className="font-display text-lg font-bold">{"Painel de Publicação"}</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/editor"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {"Novo artigo"}
            </Link>
            <span className="hidden text-sm text-muted-foreground sm:block">
              {session.profile.full_name} · {session.profile.role}
            </span>
            <button
              onClick={logout}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              {"Sair"}
            </button>
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Site
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Outlet context={{ profile: session.profile, isStaff }} />
      </main>
      <footer className="pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME} — Painel de publicação
      </footer>
    </div>
  );
}
