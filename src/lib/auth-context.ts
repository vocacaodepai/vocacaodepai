import { createContext, useContext } from "react";
import type { Author } from "@/lib/types";

export interface AuthState {
  user: { id: string; email?: string } | null;
  profile: Author | null;
  ready: boolean;
  openLogin: () => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  profile: null,
  ready: false,
  openLogin: () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);
