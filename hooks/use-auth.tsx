"use client";

import * as React from "react";
import type { Entitlement } from "@/lib/config/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getAuthProvider } from "@/lib/auth/get-provider";
import type { AuthUser } from "@/lib/auth/types";

export type { AuthUser } from "@/lib/auth/types";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginByEmail: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasEntitlement: (entitlement: Entitlement) => boolean;
  isAdmin: () => boolean;
  isInternal: () => boolean;
}

const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const provider = React.useMemo(() => getAuthProvider(), []);
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const syncZustand = useAuthStore((s) => s.setPersonaId);

  React.useEffect(() => {
    const unsubscribe = provider.onAuthStateChanged((authUser) => {
      setUser(authUser);
      syncZustand(authUser?.id ?? null);
      if (authUser) {
        provider.getToken().then(setToken);
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    const restored = provider.getUser();
    if (restored) {
      setUser(restored);
      syncZustand(restored.id);
      provider.getToken().then(setToken);
      setLoading(false);
    }

    const timeout = setTimeout(() => setLoading(false), 3000);
    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [provider, syncZustand]);

  const loginByEmail = React.useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const result = await provider.login(email, password);
      if (!result) return false;
      setUser(result);
      const newToken = await provider.getToken();
      setToken(newToken);
      syncZustand(result.id);
      return true;
    },
    [provider, syncZustand],
  );

  const logout = React.useCallback(async () => {
    await provider.logout();
    setUser(null);
    setToken(null);
    syncZustand(null);
  }, [provider, syncZustand]);

  const hasEntitlement = React.useCallback(
    (entitlement: Entitlement): boolean => {
      return provider.hasEntitlement(entitlement);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, user],
  );

  const isAdmin = React.useCallback((): boolean => {
    return user?.role === "admin";
  }, [user]);

  const isInternal = React.useCallback((): boolean => {
    return user?.role === "internal" || user?.role === "admin";
  }, [user]);

  const value = React.useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      loginByEmail,
      logout,
      hasEntitlement,
      isAdmin,
      isInternal,
    }),
    [
      user,
      token,
      loading,
      loginByEmail,
      logout,
      hasEntitlement,
      isAdmin,
      isInternal,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
