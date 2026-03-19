const STORAGE_KEY = "google_id_token";

export function getStoredToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export interface GoogleAuthConfig {
  skipAuth?: boolean;
  clientId?: string;
  redirectPath?: string;
}

const defaultRedirectPath = "/auth/callback";

export function initiateGoogleLogin(config?: GoogleAuthConfig): void {
  const skipAuth =
    config?.skipAuth ??
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: { VITE_SKIP_AUTH?: string } }).env
        ?.VITE_SKIP_AUTH === "true");
  const raw =
    config?.clientId ??
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: { VITE_GOOGLE_CLIENT_ID?: string } })
        .env?.VITE_GOOGLE_CLIENT_ID);
  const clientId = typeof raw === "string" ? raw : "";

  if (skipAuth) {
    sessionStorage.setItem(STORAGE_KEY, "dev_token");
    window.location.href = "/";
    return;
  }
  const redirectUri =
    window.location.origin + (config?.redirectPath ?? defaultRedirectPath);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "id_token",
    scope: "openid email profile",
    nonce: Math.random().toString(36).substring(2),
  });
  window.location.href =
    "https://accounts.google.com/o/oauth2/v2/auth?" + params;
}
