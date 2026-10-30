import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/area-do-pai/client";
import type { Author } from "@/lib/types";
import { AuthContext, type AuthUser } from "@/lib/auth-context";
import type { MemberProfile } from "@/lib/area-do-pai/types";

// AuthProvider da Área do Pai (doc 07 §4.2). Sem modal: `openLogin()` navega para
// /entrar?next=<rota atual>. O perfil vem de `get_my_profile()` (0013) e, se a
// função ainda não existir no banco, de um SELECT no próprio registro (RLS).

function toAuthUser(u: User | null): AuthUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    emailConfirmed: !!u.email_confirmed_at,
    providers: (u.identities ?? []).map((i) => i.provider).filter(Boolean) as string[],
  };
}

function toMember(row: Record<string, unknown> | null): MemberProfile | null {
  if (!row || typeof row.id !== "string") return null;
  return {
    id: row.id,
    display_name: typeof row.display_name === "string" ? row.display_name : "Pai",
    avatar_url: (row.avatar_url as string | null) ?? null,
    role: (row.role as MemberProfile["role"]) ?? "member",
    bio: (row.bio as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    uf: (row.uf as string | null) ?? null,
    onboarding_done: Boolean(row.onboarding_done),
    newsletter_opt_in: Boolean(row.newsletter_opt_in),
    interests: Array.isArray(row.interests) ? (row.interests as string[]) : [],
    consent_terms_at: (row.consent_terms_at as string | null) ?? null,
    consent_privacy_at: (row.consent_privacy_at as string | null) ?? null,
    created_at: (row.created_at as string) ?? "",
    updated_at: (row.updated_at as string) ?? "",
  };
}

export function memberToAuthor(m: MemberProfile): Author {
  return {
    id: m.id,
    full_name: m.display_name,
    avatar_url: m.avatar_url,
    bio: m.bio,
    // `Author.role` não tem 'member': membro comum vira 'author' (sem privilégio).
    role: m.role === "admin" || m.role === "editor" ? m.role : "author",
  };
}

export async function loadMyMember(userId: string): Promise<MemberProfile | null> {
  try {
    const { data, error } = await db.rpc("get_my_profile");
    if (!error && data) return toMember(data as Record<string, unknown>);
  } catch {
    /* função ausente (banco antigo/placeholder): cai no SELECT abaixo */
  }
  const { data } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  return toMember((data as unknown as Record<string, unknown> | null) ?? null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [member, setMember] = useState<MemberProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = (userId: string) => {
      // setTimeout: nunca chamar o Supabase dentro do callback de onAuthStateChange.
      setTimeout(async () => {
        try {
          const m = await loadMyMember(userId);
          if (mounted) setMember(m);
        } catch {
          if (mounted) setMember(null);
        }
      }, 0);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const u = toAuthUser(session?.user ?? null);
      setUser(u);
      if (!u) setMember(null);
      else loadProfile(u.id);
    });

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const u = toAuthUser(data.user);
        setUser(u);
        if (u) loadProfile(u.id);
      })
      .catch(() => {
        if (mounted) setUser(null);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
      void sub.subscription.unsubscribe();
    };
  }, []);

  const openLogin = useCallback(() => {
    if (typeof window === "undefined") return;
    const next = window.location.pathname + window.location.search;
    window.location.assign(`/entrar?next=${encodeURIComponent(next)}`);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setMember(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) {
      setMember(null);
      return;
    }
    setUser(toAuthUser(u));
    setMember(await loadMyMember(u.id));
  }, []);

  const profile = member ? memberToAuthor(member) : null;

  return (
    <AuthContext.Provider
      value={{ user, profile, member, ready, openLogin, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
