import { createContext, useContext } from "react";
import type { Author } from "@/lib/types";
import type { MemberProfile } from "@/lib/area-do-pai/types";

// Contexto de autenticação (doc 07 §4.2). `profile` mantém o formato `Author`
// (full_name/role) que o layout e o blog já consomem; `member` é a linha completa
// de `profiles` (display_name, onboarding_done, interests…) usada pela Área do Pai.

export interface AuthUser {
  id: string;
  email?: string;
  emailConfirmed: boolean;
  /** Provedores vinculados (email, google…). */
  providers: string[];
}

export interface AuthState {
  user: AuthUser | null;
  profile: Author | null;
  member: MemberProfile | null;
  ready: boolean;
  /** Leva para /entrar?next=<rota atual> (substitui o modal do VDM). */
  openLogin: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  member: null,
  ready: false,
  openLogin: () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);
