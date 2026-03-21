/**
 * Shared authenticated fetch wrapper for all API hooks.
 *
 * Sends `Authorization: Bearer <token>` when a token is available.
 * The token comes from the auth provider (DemoAuthProvider in dev,
 * OAuthProvider in production).
 *
 * All requests go through Next.js rewrites (`/api/*` -> trading API),
 * so hooks use relative paths like `/api/positions/active`.
 */

export async function apiFetch(
  url: string,
  token: string | null,
  options?: RequestInit,
): Promise<unknown> {
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) ?? {}),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }

  return res.json()
}
