/**
 * @unified-trading/ui-auth — Provider-agnostic OAuth 2.0 PKCE auth library
 * (Google + AWS Cognito) for Unified Trading UIs.
 *
 * New public API (v0.2.0):
 *   AuthProvider, useAuth, useAuthToken, RequireAuth,
 *   authFetch, authFetchJson, useAuthFetch,
 *   GoogleAdapter, CognitoAdapter,
 *   AuthProviderConfig, AuthUser, AuthState
 *
 * Deprecated (backward-compat until all consumers migrate to AuthProvider):
 *   getStoredToken, clearToken, initiateGoogleLogin, GoogleAuthConfig
 */

// ---- New provider-agnostic API -------------------------------------------

// Components
export { AuthProvider } from "./AuthContext";
export type { AuthProviderProps } from "./AuthContext";

// Internal hook (also used by RequireAuth and useAuthToken — exported for advanced use)
export { useAuth } from "./AuthContext";

// Hooks
export { useAuthToken } from "./useAuthToken";
export type { UseAuthTokenResult } from "./useAuthToken";

// Route guard
export { RequireAuth } from "./RequireAuth";
export type { RequireAuthProps } from "./RequireAuth";

// Fetch utilities
export { authFetch, authFetchJson, useAuthFetch } from "./authFetch";
export type { AuthFetchInit } from "./authFetch";

// Concrete adapters (for advanced / custom use)
export { GoogleAdapter } from "./adapters/GoogleAdapter";
export {
  CognitoAdapter,
  generateCodeVerifier,
  generateCodeChallenge,
} from "./adapters/CognitoAdapter";

// Types
export type {
  AuthProviderConfig,
  AuthUser,
  AuthState,
  Provider,
} from "./types";
// AuthAdapter is intentionally NOT exported — it is an internal contract.

// Auth event telemetry (v0.2.1)
export { emitAuthEvent } from "./authEvents";
export type { AuthEventName } from "./authEvents";

// ---- Deprecated backward-compat exports ----------------------------------
// These remain until all three consumer UI repos have migrated to AuthProvider.

/**
 * @deprecated Use useAuthToken().token from <AuthProvider> context instead.
 */
export { getStoredToken } from "./GoogleAuth";

/**
 * @deprecated Use useAuth().logout() from <AuthProvider> context instead.
 */
export { clearToken } from "./GoogleAuth";

/**
 * @deprecated Use useAuth().login() from <AuthProvider> context instead.
 */
export { initiateGoogleLogin } from "./GoogleAuth";

export type { GoogleAuthConfig } from "./GoogleAuth";
