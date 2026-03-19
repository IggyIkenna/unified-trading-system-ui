/**
 * Provider-agnostic OAuth 2.0 PKCE types for unified-trading-ui-auth.
 * No `any` types. All interfaces are strictly typed.
 */

/** The supported OAuth provider identifiers. */
export type Provider = "google" | "cognito";

/**
 * Configuration passed to `<AuthProvider config={...}>`.
 * Provider-agnostic — no import.meta.env access inside library code.
 * Callers supply env values through these props.
 */
export interface AuthProviderConfig {
  /** OAuth provider to use. */
  provider: Provider;

  /** OAuth client ID (app client ID for Cognito, Google OAuth client ID for Google). */
  clientId: string;

  /** URI to redirect to after login. Must be registered with the provider. */
  redirectUri: string;

  /** OAuth scopes to request (e.g. ["openid", "email", "profile"]). */
  scopes: string[];

  /**
   * Cognito Hosted UI base URL (e.g. "https://my-domain.auth.us-east-1.amazoncognito.com").
   * Required when provider is "cognito".
   */
  cognitoDomain?: string;

  /**
   * Convenience alias for clientId when provider is "google".
   * If provided and clientId is empty, this value is used.
   */
  googleClientId?: string;

  /**
   * Dev bypass. If true, AuthProvider sets isAuthenticated: true and token: "dev_token" immediately.
   * No adapter login/callback calls are made.
   */
  skipAuth?: boolean;

  /**
   * Backend relay endpoint for UEI auth event emission (e.g. "/api/events").
   * If omitted, auth events are silently dropped — no telemetry is emitted.
   * The endpoint must be provided by `make_events_relay_router()` from unified-trading-library.
   */
  eventEndpoint?: string;

  /**
   * Service name to tag auth events (e.g. "trading-analytics-ui").
   * Included in the event `details` payload for attribution in the event sink.
   */
  serviceName?: string;
}

/** Authenticated user profile parsed from the ID token / userinfo. */
export interface AuthUser {
  /** Subject identifier — unique user ID from the provider. */
  sub: string;
  /** User's email address. */
  email: string;
  /** User's display name (optional). */
  name?: string;
  /** URL of the user's profile picture (optional). */
  picture?: string;
}

/** Snapshot of authentication state held by AuthContext. */
export interface AuthState {
  /** True when the user has a valid token. */
  isAuthenticated: boolean;
  /** True while the adapter is resolving the initial auth state. */
  isLoading: boolean;
  /** The current access/ID token, or null when unauthenticated. */
  token: string | null;
  /** The authenticated user profile, or null when unauthenticated. */
  user: AuthUser | null;
}

/**
 * Internal adapter interface implemented by GoogleAdapter and CognitoAdapter.
 * Not exported from index.ts — consumers always go through AuthProvider/useAuth.
 */
export interface AuthAdapter {
  /** Initiates the provider login flow (redirects the browser). */
  login(): void;
  /** Clears stored tokens and logs the user out (may redirect). */
  logout(): void;
  /**
   * Handles the OAuth callback. Called by AuthProvider on mount when a
   * `?code=` (PKCE) or `#id_token=` (implicit) parameter is found in the URL.
   * Returns the token string on success, null otherwise.
   */
  handleCallback(): Promise<string | null>;
  /** Returns the currently stored token, or null if not authenticated. */
  getToken(): string | null;
  /**
   * Attempts to refresh the access token.
   * Returns the new token on success, null on failure or if refresh is unsupported.
   */
  refreshToken(): Promise<string | null>;
}
