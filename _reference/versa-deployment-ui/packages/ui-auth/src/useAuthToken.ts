/**
 * useAuthToken — provider-agnostic hook to read current auth token and user.
 *
 * Reads state from AuthContext (set up by <AuthProvider>) instead of
 * directly accessing sessionStorage. The old window.addEventListener("storage")
 * pattern is removed — state management is owned by AuthContext.
 *
 * Return value is expanded from the original `string | null` to include
 * `user` and `isAuthenticated` for richer consumer access. For backward
 * compatibility, consumers that only destructure `token` continue to work.
 *
 * @deprecated Direct token import (getStoredToken) — migrate callers to
 *   useAuthToken from AuthProvider context.
 */

import { useAuth } from "./AuthContext";
import type { AuthUser } from "./types";

export interface UseAuthTokenResult {
  /** The current access/ID token, or null when unauthenticated. */
  token: string | null;
  /** The authenticated user profile, or null when unauthenticated. */
  user: AuthUser | null;
  /** True when the user has a valid token. */
  isAuthenticated: boolean;
}

/**
 * Returns the current auth token, user, and authentication state from context.
 *
 * Must be used inside an `<AuthProvider>`.
 *
 * ```tsx
 * const { token, user, isAuthenticated } = useAuthToken();
 * // Backward-compatible usage (only token destructured):
 * const { token } = useAuthToken();
 * ```
 */
export function useAuthToken(): UseAuthTokenResult {
  const { token, user, isAuthenticated } = useAuth();
  return { token, user, isAuthenticated };
}
