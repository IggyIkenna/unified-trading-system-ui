const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "";
const COGNITO_DOMAIN = (import.meta.env.VITE_COGNITO_DOMAIN || "").replace(
  /\/$/,
  "",
);
const COGNITO_REDIRECT_URI =
  import.meta.env.VITE_COGNITO_REDIRECT_URI ||
  window.location.origin + "/auth/callback";

const STORAGE_ACCESS_TOKEN = "cognito_access_token";
const STORAGE_PKCE_VERIFIER = "cognito_pkce_verifier";

async function _generatePKCE(): Promise<{
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

export function getCognitoToken(): string | null {
  return sessionStorage.getItem(STORAGE_ACCESS_TOKEN);
}

export function clearCognitoToken(): void {
  sessionStorage.removeItem(STORAGE_ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_PKCE_VERIFIER);
}

export async function initiateCognitoLogin(): Promise<void> {
  const { verifier, challenge } = await _generatePKCE();
  sessionStorage.setItem(STORAGE_PKCE_VERIFIER, verifier);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: COGNITO_CLIENT_ID,
    redirect_uri: COGNITO_REDIRECT_URI,
    scope: "openid email profile",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  window.location.href = `${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export async function handleCognitoCallback(): Promise<boolean> {
  const code = new URLSearchParams(window.location.search).get("code");
  if (!code) return false;
  const verifier = sessionStorage.getItem(STORAGE_PKCE_VERIFIER);
  if (!verifier) return false;
  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: COGNITO_CLIENT_ID,
      code,
      redirect_uri: COGNITO_REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  if (!response.ok) return false;
  const tokens = (await response.json()) as { access_token: string };
  sessionStorage.setItem(STORAGE_ACCESS_TOKEN, tokens.access_token);
  sessionStorage.removeItem(STORAGE_PKCE_VERIFIER);
  return true;
}
