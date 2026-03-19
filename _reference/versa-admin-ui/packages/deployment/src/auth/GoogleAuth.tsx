const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export function getStoredToken(): string | null {
  return sessionStorage.getItem("google_id_token");
}

export function clearToken(): void {
  sessionStorage.removeItem("google_id_token");
}

export function initiateGoogleLogin(): void {
  if (SKIP_AUTH) {
    sessionStorage.setItem("google_id_token", "dev_token");
    window.location.href = "/";
    return;
  }
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: window.location.origin + "/auth/callback",
    response_type: "id_token",
    scope: "openid email profile",
    nonce: Math.random().toString(36).substring(2),
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
