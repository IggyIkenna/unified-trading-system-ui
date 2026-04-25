"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Entitlement } from "@/lib/config/auth";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getAuthProvider } from "@/lib/auth/get-provider";
import type { AuthUser } from "@/lib/auth/types";
import { FirebaseAuthProvider } from "@/lib/auth/firebase-provider";
import { applyTierOverride, TIER_OVERRIDE_EVENT } from "@/lib/auth/tier-override";

export type { AuthUser } from "@/lib/auth/types";

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginError: string | null;
  loginByEmail: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasEntitlement: (entitlement: Entitlement) => boolean;
  isAdmin: () => boolean;
  isInternal: () => boolean;
}

export const AuthContext = React.createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const provider = React.useMemo(() => getAuthProvider(), []);
  const [rawUser, setRawUser] = React.useState<AuthUser | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loginError, setLoginError] = React.useState<string | null>(null);
  // Force re-render when DemoPlanToggle flips the tier-override flag.
  const [overrideEpoch, setOverrideEpoch] = React.useState(0);
  const syncZustand = useAuthStore((s) => s.setPersonaId);
  const router = useRouter();

  // Effective user has the tier override applied — entitlements replaced by
  // the active tier's set when the email matches a TierBundle. Identity
  // fields (email, uid, org, displayName, role) are untouched.
  const user = React.useMemo<AuthUser | null>(
    () => applyTierOverride(rawUser),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawUser, overrideEpoch],
  );

  React.useEffect(() => {
    const onTierOverrideChange = () => setOverrideEpoch((e) => e + 1);
    window.addEventListener(TIER_OVERRIDE_EVENT, onTierOverrideChange);
    return () => window.removeEventListener(TIER_OVERRIDE_EVENT, onTierOverrideChange);
  }, []);

  React.useEffect(() => {
    const unsubscribe = provider.onAuthStateChanged((authUser) => {
      setRawUser(authUser);
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
      setRawUser(restored);
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
      setLoginError(null);
      const result = await provider.login(email, password);

      if (!result) {
        if (
          provider instanceof FirebaseAuthProvider &&
          provider.getLastLoginError() === "user-disabled"
        ) {
          setLoginError(
            "Your account is currently under review. You will receive an email once it has been approved.",
          );
        }
        return false;
      }

      if (
        result.status === "pending_approval" ||
        (result.authorized === false && result.status !== "active")
      ) {
        setRawUser(result);
        router.push("/pending");
        return true;
      }

      setRawUser(result);
      const newToken = await provider.getToken();
      setToken(newToken);
      syncZustand(result.id);
      return true;
    },
    [provider, syncZustand, router],
  );

  const logout = React.useCallback(async () => {
    await provider.logout();
    setRawUser(null);
    setToken(null);
    setLoginError(null);
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
      loginError,
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
      loginError,
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
