/**
 * RequireAuth — guards a route by requiring authentication.
 *
 * Reads auth state from useAuth() (AuthContext) instead of calling
 * getStoredToken() / initiateGoogleLogin() directly. Provider-agnostic:
 * triggers Google or Cognito login depending on the AuthProvider config.
 *
 * Must be used inside an <AuthProvider>. Throws a runtime error if the
 * context is not found (not wrapped in AuthProvider).
 *
 * Props interface is unchanged from v0.1.0:
 *   children:     ReactNode  — content to render when authenticated
 *   callbackPath: string     — (unused in new impl, kept for compat) default "/auth/callback"
 *   loginPath:    string     — if provided, navigate() here when unauthenticated;
 *                              otherwise call auth.login() (provider redirect)
 */

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export interface RequireAuthProps {
  children: ReactNode;
  /** @deprecated No longer used by the new AuthContext-based implementation. Kept for prop API compat. */
  callbackPath?: string;
  /** If provided, navigate to this path when unauthenticated instead of calling auth.login(). */
  loginPath?: string;
}

export function RequireAuth({
  children,
  loginPath,
}: RequireAuthProps): ReactNode {
  const auth = useAuth(); // Throws if used outside AuthProvider — intentional.
  const navigate = useNavigate();

  const { isLoading, isAuthenticated, login } = auth;

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (loginPath) {
      navigate(loginPath);
    } else {
      login();
    }
  }, [isLoading, isAuthenticated, loginPath, navigate, login]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Redirecting to login...</div>;
  return <>{children}</>;
}
