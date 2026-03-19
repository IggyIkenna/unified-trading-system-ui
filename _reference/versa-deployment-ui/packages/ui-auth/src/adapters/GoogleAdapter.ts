/**
 * GoogleAdapter — wraps the existing GoogleAuth.ts implicit-flow logic as a class
 * implementing the internal AuthAdapter interface.
 *
 * This adapter reuses the existing initiateGoogleLogin(), getStoredToken(), and clearToken()
 * functions so no logic is duplicated. The hash-fragment id_token parsing in handleCallback()
 * mirrors RequireAuth.tsx lines 31-41 from the original implementation.
 *
 * No new external dependencies. Full TypeScript strict typing. No `any`.
 */

import { getStoredToken, clearToken, initiateGoogleLogin } from "../GoogleAuth";
import type { AuthAdapter, AuthProviderConfig } from "../types";

export class GoogleAdapter implements AuthAdapter {
  private readonly config: AuthProviderConfig;

  constructor(config: AuthProviderConfig) {
    this.config = config;
  }

  /**
   * Initiates the Google implicit-flow login by calling initiateGoogleLogin()
   * from GoogleAuth.ts. Redirects the browser to Google's OAuth endpoint.
   */
  login(): void {
    initiateGoogleLogin({
      skipAuth: this.config.skipAuth,
      clientId: this.config.clientId || this.config.googleClientId,
      redirectPath: this.extractRedirectPath(this.config.redirectUri),
    });
  }

  /**
   * Clears the stored Google id_token from sessionStorage and navigates
   * away if needed. Delegates to clearToken() from GoogleAuth.ts.
   */
  logout(): void {
    clearToken();
  }

  /**
   * Parses the id_token from the URL hash fragment after Google redirects back.
   * Stores the token in sessionStorage under "google_id_token" and clears the hash.
   * Returns the token on success, null if no id_token is found in the hash.
   */
  async handleCallback(): Promise<string | null> {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    const urlParams = new URLSearchParams(hash);
    const idToken = urlParams.get("id_token");
    if (!idToken) return null;
    sessionStorage.setItem("google_id_token", idToken);
    window.history.replaceState({}, document.title, window.location.pathname);
    return idToken;
  }

  /**
   * Returns the currently stored Google ID token from sessionStorage.
   * Delegates to getStoredToken() from GoogleAuth.ts.
   */
  getToken(): string | null {
    return getStoredToken();
  }

  /**
   * Google implicit flow does not support refresh tokens.
   * Always returns null.
   */
  async refreshToken(): Promise<string | null> {
    return Promise.resolve(null);
  }

  /** Extracts the path portion from a full URI (e.g. "/auth/callback" from "https://host/auth/callback"). */
  private extractRedirectPath(uri: string): string {
    try {
      return new URL(uri).pathname;
    } catch {
      return uri;
    }
  }
}
