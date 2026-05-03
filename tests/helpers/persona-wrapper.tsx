import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import type { AuthState } from "@/hooks/use-auth";
import type { AuthUser } from "@/lib/auth/types";
import type {
  AuthPersona,
  Entitlement,
  EntitlementOrWildcard,
  StrategyFamilyEntitlement,
  TradingEntitlement,
} from "@/lib/config/auth";
import { ALL_ENTITLEMENTS, isTradingEntitlement } from "@/lib/config/auth";
import { getPersonaById } from "@/lib/auth/personas";

function personaToAuthUser(p: AuthPersona): AuthUser {
  return {
    id: p.id,
    email: p.email,
    displayName: p.displayName,
    role: p.role,
    org: p.org,
    entitlements: p.entitlements,
  };
}

function makeAuthState(persona: AuthPersona | null): AuthState {
  const user = persona ? personaToAuthUser(persona) : null;
  const entitlements: readonly (EntitlementOrWildcard | TradingEntitlement | StrategyFamilyEntitlement)[] =
    user?.entitlements ?? [];
  const hasWildcard = (entitlements as readonly unknown[]).includes(ALL_ENTITLEMENTS);

  const hasEntitlement = (e: Entitlement): boolean => {
    if (!user) return false;
    if (hasWildcard) return true;
    return entitlements.some((ent) => !isTradingEntitlement(ent) && ent === e);
  };

  return {
    user,
    token: persona ? `test-token-${persona.id}` : null,
    loading: false,
    loginError: null,
    loginByEmail: async () => true,
    logout: async () => {},
    hasEntitlement,
    isAdmin: () => user?.role === "admin",
    isInternal: () => user?.role === "internal",
  } as unknown as AuthState;
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithPersona(personaId: string | null): {
  Wrapper: React.FC<{ children: React.ReactNode }>;
} {
  const persona = personaId ? (getPersonaById(personaId) ?? null) : null;
  const authState = makeAuthState(persona);
  const queryClient = makeQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(AuthContext.Provider, { value: authState }, children),
    );

  return { Wrapper };
}
