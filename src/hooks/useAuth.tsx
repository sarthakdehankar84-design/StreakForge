import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  fullName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

function mapUser(u: SupabaseUser): AuthUser {
  return {
    id: u.id,
    email: u.email!,
    username:
      u.user_metadata?.username ||
      u.user_metadata?.full_name ||
      u.user_metadata?.name ||
      u.email!.split("@")[0],
    avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture,
    fullName: u.user_metadata?.full_name || u.user_metadata?.name,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) setUser(mapUser(data.user));
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) setUser(mapUser(s.user));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s?.user) {
        setUser(mapUser(s.user));
      } else {
        setUser(null);
      }
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
