/**
 * AuthContext.tsx — React context for provider-agnostic OAuth 2.0 auth.
 *
 * Exports:
 *   AuthProvider  — component that wraps the app and provides auth state.
 *   useAuth       — internal hook (also exported for use by RequireAuth, useAuthToken, etc.)
 *
 * Design notes:
 *   - No import.meta.env access here. skipAuth comes only from config prop.
 *   - The correct adapter (Google or Cognito) is selected based on config.provider.
 *   - On mount, handles OAuth callbacks (PKCE ?code= or Google #id_token=).
 *   - AuthContext default is null; useAuth() throws if used outside AuthProvider.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

import { GoogleAdapter } from "./adapters/GoogleAdapter";
import { CognitoAdapter } from "./adapters/CognitoAdapter";
import { emitAuthEvent, SESSION_SENTINEL_KEY } from "./authEvents";
import type {
  AuthAdapter,
  AuthProviderConfig,
  AuthState,
  AuthUser,
} from "./types";

// ----- Context value shape ------------------------------------------------

interface AuthContextValue extends AuthState {
  /** Initiates the provider login flow. */
  login(): void;
  /** Logs the user out and clears stored tokens. */
  logout(): void;
}

// Default is null — requires AuthProvider to be present.
const AuthContext = createContext<AuthContextValue | null>(null);

// ----- Helpers -------------------------------------------------------------

/** Minimal base64url decode for the JWT payload section. */
function decodeJwtPayload(token: string): Partial<AuthUser> {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    // base64url → base64 → atob
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json) as Partial<AuthUser>;
  } catch {
    return {};
  }
}

function payloadToUser(payload: Partial<AuthUser>): AuthUser | null {
  if (!payload.sub || !payload.email) return null;
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

function buildAdapter(config: AuthProviderConfig): AuthAdapter {
  if (config.provider === "cognito") {
    return new CognitoAdapter(config);
  }
  return new GoogleAdapter(config);
}

// ----- AuthProvider --------------------------------------------------------

export interface AuthProviderProps {
  config: AuthProviderConfig;
  children: ReactNode;
}

/**
 * `<AuthProvider>` wraps your application (or a subtree) and provides auth
 * state to all descendant components via `useAuth()`.
 *
 * Example:
 * ```tsx
 * <AuthProvider config={{ provider: "google", clientId: "...", redirectUri: "...", scopes: ["openid"] }}>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({
  config,
  children,
}: AuthProviderProps): ReactNode {
  // Dev bypass: immediately authenticated without any adapter interaction.
  if (config.skipAuth === true) {
    const devValue: AuthContextValue = {
      isAuthenticated: true,
      isLoading: false,
      token: "dev_token",
      user: { sub: "dev", email: "dev@local" },
      login: () => undefined,
      logout: () => undefined,
    };
    return (
      <AuthContext.Provider value={devValue}>{children}</AuthContext.Provider>
    );
  }

  return <AuthProviderInner config={config}>{children}</AuthProviderInner>;
}

/** Inner component — handles real adapter lifecycle (split out to keep hook rules clean). */
function AuthProviderInner({ config, children }: AuthProviderProps): ReactNode {
  const adapter = useMemo(() => buildAdapter(config), [config]);

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    user: null,
  });

  const { eventEndpoint, provider, serviceName } = config;
  const eventDetails = useMemo(
    () =>
      ({
        provider,
        service: serviceName ?? null,
      }) satisfies Record<string, string | boolean | null>,
    [provider, serviceName],
  );

  useEffect(() => {
    let cancelled = false;

    async function initAuth(): Promise<void> {
      // Determine if this looks like a callback URL.
      const isCodeCallback = window.location.search.includes("code=");
      const isHashCallback = window.location.hash.includes("id_token=");

      let token: string | null = null;

      if (isCodeCallback || isHashCallback) {
        token = await adapter.handleCallback();
        if (!cancelled) {
          if (token) {
            // OAuth callback completed successfully.
            sessionStorage.setItem(SESSION_SENTINEL_KEY, "1");
            emitAuthEvent("LOGIN_SUCCESS", eventDetails, eventEndpoint);
          } else {
            // OAuth callback returned no token — provider error or user cancelled.
            emitAuthEvent("LOGIN_FAILURE", eventDetails, eventEndpoint);
          }
        }
      }

      if (!token) {
        // Not a callback (or callback failed) — check existing stored token.
        const hadPreviousSession =
          sessionStorage.getItem(SESSION_SENTINEL_KEY) === "1";
        token = adapter.getToken();

        if (!cancelled && !token && hadPreviousSession) {
          // Had a session but token is now gone — session expired between visits.
          sessionStorage.removeItem(SESSION_SENTINEL_KEY);
          emitAuthEvent("SESSION_EXPIRED", eventDetails, eventEndpoint);
        }
      }

      if (cancelled) return;

      if (token) {
        const payload = decodeJwtPayload(token);
        const user = payloadToUser(payload);
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token,
          user,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
          user: null,
        });
      }
    }

    void initAuth();
    return () => {
      cancelled = true;
    };
  }, [adapter, eventEndpoint, eventDetails]);

  const login = useCallback(() => {
    emitAuthEvent("LOGIN_INITIATED", eventDetails, eventEndpoint);
    adapter.login();
  }, [adapter, eventEndpoint, eventDetails]);

  const logout = useCallback(() => {
    emitAuthEvent("LOGOUT", eventDetails, eventEndpoint);
    sessionStorage.removeItem(SESSION_SENTINEL_KEY);
    adapter.logout();
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      user: null,
    });
  }, [adapter, eventEndpoint, eventDetails]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({ ...authState, login, logout }),
    [authState, login, logout],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// ----- useAuth hook --------------------------------------------------------

/**
 * Internal hook. Returns the current auth context value.
 * Throws a descriptive error if called outside an `<AuthProvider>`.
 *
 * Used by: RequireAuth, useAuthToken, authFetch (useAuthFetch variant).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error(
      "useAuth() must be used inside an <AuthProvider>. " +
        "Wrap your component tree with <AuthProvider config={...}>.",
    );
  }
  return ctx;
}
