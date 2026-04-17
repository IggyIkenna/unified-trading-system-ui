/**
 * Shared test wrapper providing all React context providers needed for tests.
 *
 * Use this instead of bare render() for any component that uses hooks
 * requiring context (useAuth, useQuery, etc.).
 *
 * Usage:
 *   import { TestWrapper } from "@/tests/helpers/test-wrapper";
 *   render(<MyComponent />, { wrapper: TestWrapper });
 */

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "@/hooks/use-auth";
import type { AuthState } from "@/hooks/use-auth";

// Minimal mock auth state for tests — no real Firebase, no real tokens
const MOCK_AUTH_STATE: AuthState = {
  user: {
    uid: "test-user-001",
    email: "test@example.com",
    displayName: "Test User",
    role: "admin",
    entitlements: [],
    organisationId: "test-org",
    subscriptionTier: "internal",
  },
  token: "test-token-mock",
  loading: false,
  loginError: null,
  loginByEmail: async () => true,
  logout: async () => {},
  hasEntitlement: () => true,
  isAdmin: () => true,
  isInternal: () => true,
} as unknown as AuthState;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, gcTime: 0 },
    mutations: { retry: false },
  },
});

/**
 * Wraps components with QueryClientProvider + mock AuthProvider.
 * Uses the real AuthContext from use-auth.tsx so useAuth() finds the provider.
 */
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(AuthContext.Provider, { value: MOCK_AUTH_STATE }, children),
  );
}
