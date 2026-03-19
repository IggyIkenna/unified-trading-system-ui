/**
 * CognitoAdapter — implements AuthAdapter for AWS Cognito Hosted UI using
 * OAuth 2.0 authorization_code grant with PKCE (Proof Key for Code Exchange).
 *
 * No @okta/* dependencies. No external npm packages.
 * Uses only the Web Crypto API (crypto.getRandomValues + crypto.subtle),
 * available in all modern browsers and in jsdom for tests.
 *
 * Storage keys (sessionStorage):
 *   "cognito_access_token"   — the current access token
 *   "cognito_refresh_token"  — the refresh token (used by refreshToken())
 *   "cognito_pkce_verifier"  — the PKCE code verifier (cleared after callback)
 *
 * Full TypeScript strict typing. No `any`.
 */

import type { AuthAdapter, AuthProviderConfig } from "../types";

const STORAGE_ACCESS_TOKEN = "cognito_access_token";
const STORAGE_REFRESH_TOKEN = "cognito_refresh_token";
const STORAGE_PKCE_VERIFIER = "cognito_pkce_verifier";

/** Shape of the token endpoint JSON response from Cognito. */
interface CognitoTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}

/**
 * Generates a PKCE code verifier: 43–128 URL-safe characters using
 * crypto.getRandomValues. The character set is [A-Za-z0-9\-._~] per RFC 7636.
 */
export function generateCodeVerifier(): string {
  const CHARS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(96); // 96 bytes → 96 chars (within 43-128 range)
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => CHARS[byte % CHARS.length])
    .join("");
}

/**
 * Generates the PKCE code challenge from a verifier using SHA-256.
 * Encodes the digest as base64url without padding, per RFC 7636 §4.2.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  // base64url encode (no padding)
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export class CognitoAdapter implements AuthAdapter {
  private readonly config: AuthProviderConfig;
  private readonly cognitoDomain: string;

  constructor(config: AuthProviderConfig) {
    if (!config.cognitoDomain) {
      throw new Error(
        "CognitoAdapter requires config.cognitoDomain to be set.",
      );
    }
    this.config = config;
    // Strip trailing slash for consistent URL construction.
    this.cognitoDomain = config.cognitoDomain.replace(/\/$/, "");
  }

  /**
   * Initiates the PKCE authorization code flow.
   * 1. Generates a code verifier and stores it in sessionStorage.
   * 2. Computes the SHA-256 code challenge.
   * 3. Redirects to the Cognito Hosted UI /oauth2/authorize endpoint.
   */
  login(): void {
    const verifier = generateCodeVerifier();
    sessionStorage.setItem(STORAGE_PKCE_VERIFIER, verifier);

    // Challenge computation is async; we chain via then() so login() stays synchronous
    // from the caller's perspective (it redirects after the async step completes).
    void generateCodeChallenge(verifier).then((challenge) => {
      const params = new URLSearchParams({
        response_type: "code",
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        scope: this.config.scopes.join(" "),
        code_challenge: challenge,
        code_challenge_method: "S256",
      });
      window.location.href = `${this.cognitoDomain}/oauth2/authorize?${params.toString()}`;
    });
  }

  /**
   * Handles the OAuth callback after Cognito redirects back with ?code=.
   * 1. Reads the authorization code from URL search params.
   * 2. Reads the stored PKCE verifier from sessionStorage.
   * 3. POSTs to /oauth2/token (application/x-www-form-urlencoded).
   * 4. Stores access_token and refresh_token in sessionStorage.
   * 5. Clears the verifier.
   * Returns the access_token on success, null otherwise.
   */
  async handleCallback(): Promise<string | null> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (!code) return null;

    const verifier = sessionStorage.getItem(STORAGE_PKCE_VERIFIER);
    if (!verifier) return null;

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      code,
      code_verifier: verifier,
    });

    try {
      const response = await fetch(`${this.cognitoDomain}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as CognitoTokenResponse;
      sessionStorage.setItem(STORAGE_ACCESS_TOKEN, data.access_token);
      if (data.refresh_token) {
        sessionStorage.setItem(STORAGE_REFRESH_TOKEN, data.refresh_token);
      }
      // Clear the verifier — it must only be used once per RFC 7636.
      sessionStorage.removeItem(STORAGE_PKCE_VERIFIER);

      return data.access_token;
    } catch {
      sessionStorage.removeItem(STORAGE_PKCE_VERIFIER);
      return null;
    }
  }

  /** Returns the currently stored Cognito access token, or null. */
  getToken(): string | null {
    return sessionStorage.getItem(STORAGE_ACCESS_TOKEN);
  }

  /**
   * Refreshes the access token using the stored refresh_token.
   * POSTs to /oauth2/token with grant_type=refresh_token.
   * Updates the stored access_token on success.
   * Returns the new access_token on success, null on failure.
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = sessionStorage.getItem(STORAGE_REFRESH_TOKEN);
    if (!refreshToken) return null;

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.config.clientId,
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch(`${this.cognitoDomain}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as CognitoTokenResponse;
      sessionStorage.setItem(STORAGE_ACCESS_TOKEN, data.access_token);
      return data.access_token;
    } catch {
      return null;
    }
  }

  /**
   * Logs the user out by clearing all stored Cognito tokens and redirecting
   * to the Cognito Hosted UI /logout endpoint.
   */
  logout(): void {
    sessionStorage.removeItem(STORAGE_ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_PKCE_VERIFIER);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      logout_uri: this.config.redirectUri,
    });
    window.location.href = `${this.cognitoDomain}/logout?${params.toString()}`;
  }
}
