import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { supabase } from "@/lib/supabase";
import { mapSupabaseUser } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((u: AuthUser) => setUser(u), []);
  const logout = useCallback(() => setUser(null), []);

  useEffect(() => {
    let mounted = true;

    // Safety #1: check existing session (page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) login(mapSupabaseUser(session.user));
      if (mounted) setLoading(false);
    });

    // Safety #2: listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "SIGNED_IN" && session?.user) {
        login(mapSupabaseUser(session.user));
        setLoading(false);
      } else if (event === "SIGNED_OUT") {
        logout();
        setLoading(false);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        login(mapSupabaseUser(session.user));
      } else if (event === "USER_UPDATED" && session?.user) {
        login(mapSupabaseUser(session.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return createElement(AuthContext.Provider, { value: { user, loading, login, logout } }, children);
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
