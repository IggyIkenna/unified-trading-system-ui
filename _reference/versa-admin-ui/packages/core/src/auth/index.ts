/**
 * @unified-admin/core — shared auth helpers
 *
 * Exports: token fetch/refresh, session management types, OAuth PKCE utilities.
 * Centralises auth logic so all 11 UI repos stop re-implementing it.
 */

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface SessionState {
  authenticated: boolean;
  userId?: string;
  email?: string;
  expiresAt?: number;
}

export interface AuthConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scopes: string[];
}

/** Returns true when the token is within the expiry buffer (5 min). */
export function isTokenExpired(expiresAt: number, bufferMs = 300_000): boolean {
  return Date.now() + bufferMs >= expiresAt;
}

/** Builds the OAuth PKCE authorization URL from config + code challenge. */
export function buildAuthorizationUrl(
  config: AuthConfig,
  codeChallenge: string,
  state: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `${config.authorizationEndpoint}?${params.toString()}`;
}

/** Returns an unauthenticated session state. */
export function createEmptySession(): SessionState {
  return { authenticated: false };
}

// ── Google implicit-flow helpers ──────────────────────────────────────────────
// Module-level consts so vi.resetModules() + vi.stubEnv() in tests picks up
// fresh values on re-import.

const _SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";
const _GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || "";

/** Returns the stored Google id_token from sessionStorage, or null. */
export function getStoredToken(): string | null {
  return sessionStorage.getItem("google_id_token");
}

/** Removes the stored Google id_token from sessionStorage. */
export function clearToken(): void {
  sessionStorage.removeItem("google_id_token");
}

/** Initiates the Google implicit-flow login redirect. */
export function initiateGoogleLogin(): void {
  if (_SKIP_AUTH) {
    sessionStorage.setItem("google_id_token", "dev_token");
    window.location.href = "/";
    return;
  }
  const params = new URLSearchParams({
    client_id: _GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + "/auth/callback",
    response_type: "id_token",
    scope: "openid email profile",
    nonce: Math.random().toString(36).substring(2),
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ── Cognito PKCE helpers ──────────────────────────────────────────────────────

const _COGNITO_CLIENT_ID =
  (import.meta.env.VITE_COGNITO_CLIENT_ID as string) || "";
const _COGNITO_DOMAIN = (
  (import.meta.env.VITE_COGNITO_DOMAIN as string) || ""
).replace(/\/$/, "");
const _COGNITO_REDIRECT_URI =
  (import.meta.env.VITE_COGNITO_REDIRECT_URI as string) ||
  (typeof window !== "undefined"
    ? window.location.origin + "/auth/callback"
    : "");

const _STORAGE_ACCESS_TOKEN = "cognito_access_token";
const _STORAGE_PKCE_VERIFIER = "cognito_pkce_verifier";

/** Returns the stored Cognito access token, or null. */
export function getCognitoToken(): string | null {
  return sessionStorage.getItem(_STORAGE_ACCESS_TOKEN);
}

/** Clears the stored Cognito access token and PKCE verifier. */
export function clearCognitoToken(): void {
  sessionStorage.removeItem(_STORAGE_ACCESS_TOKEN);
  sessionStorage.removeItem(_STORAGE_PKCE_VERIFIER);
}

/** Generates a PKCE verifier+challenge pair using the Web Crypto API. */
export async function generatePKCE(): Promise<{
  verifier: string;
  challenge: string;
}> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return { verifier, challenge };
}

/** Initiates the Cognito PKCE authorization code flow redirect. */
export async function initiateCognitoLogin(): Promise<void> {
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem(_STORAGE_PKCE_VERIFIER, verifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: _COGNITO_CLIENT_ID,
    redirect_uri: _COGNITO_REDIRECT_URI,
    scope: "openid email profile",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  window.location.href = `${_COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

/** Handles the Cognito PKCE callback: exchanges authorization code for access token. */
export async function handleCognitoCallback(): Promise<boolean> {
  const code = new URLSearchParams(window.location.search).get("code");
  if (!code) return false;
  const verifier = sessionStorage.getItem(_STORAGE_PKCE_VERIFIER);
  if (!verifier) return false;
  const response = await fetch(`${_COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: _COGNITO_CLIENT_ID,
      code,
      redirect_uri: _COGNITO_REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  if (!response.ok) return false;
  const tokens = (await response.json()) as { access_token: string };
  sessionStorage.setItem(_STORAGE_ACCESS_TOKEN, tokens.access_token);
  sessionStorage.removeItem(_STORAGE_PKCE_VERIFIER);
  return true;
}

// ── Multi-provider helper ─────────────────────────────────────────────────────

/**
 * Returns the active auth token from sessionStorage.
 * Checks Google id_token first, then Cognito access token.
 */
export function getSessionToken(): string | null {
  return (
    sessionStorage.getItem("google_id_token") ??
    sessionStorage.getItem("cognito_access_token")
  );
}
