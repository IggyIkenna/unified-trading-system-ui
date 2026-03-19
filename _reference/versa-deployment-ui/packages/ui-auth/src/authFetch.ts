/**
 * authFetch.ts — provider-agnostic authenticated fetch utilities.
 *
 * Provides two variants:
 *
 * 1. `authFetch(input, init?, getToken?)` — usable outside React component trees.
 *    If a `getToken` callback is provided, uses it to get the token.
 *    Otherwise falls back to reading sessionStorage keys in priority order:
 *      "google_id_token" first, then "cognito_access_token".
 *    The existing call signature authFetch(input, init?) remains fully backward-compatible.
 *
 * 2. `useAuthFetch()` — React hook variant. Returns an authFetch-like function
 *    that is pre-bound to the current context token via useAuth().
 *    Must be used inside an <AuthProvider>.
 *
 * No breaking change to the existing authFetch(input, init?) signature.
 * The third `getToken` parameter is optional.
 */

import { useCallback } from "react";
import { useAuth } from "./AuthContext";

export type AuthFetchInit = RequestInit & { skipAuth?: boolean };

/** Reads the best available token from sessionStorage (provider-agnostic fallback). */
function readStoredToken(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  return (
    sessionStorage.getItem("google_id_token") ??
    sessionStorage.getItem("cognito_access_token")
  );
}

/**
 * Performs an authenticated fetch request.
 *
 * @param input   - The URL or Request to fetch.
 * @param init    - Standard RequestInit options. Set `skipAuth: true` to omit the Authorization header.
 * @param getToken - Optional callback to retrieve the token. If omitted, falls back to sessionStorage.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: AuthFetchInit,
  getToken?: () => string | null,
): Promise<Response> {
  const { skipAuth, ...rest } = init ?? {};
  const headers = new Headers(rest?.headers);
  if (!skipAuth) {
    const token = getToken ? getToken() : readStoredToken();
    if (token) headers.set("Authorization", "Bearer " + token);
  }
  return fetch(input, { ...rest, headers });
}

/**
 * Like `authFetch` but parses the response as JSON and throws on non-OK status.
 *
 * @param input   - The URL or Request to fetch.
 * @param init    - Standard RequestInit options.
 * @param getToken - Optional callback to retrieve the token.
 */
export async function authFetchJson<T>(
  input: RequestInfo | URL,
  init?: AuthFetchInit,
  getToken?: () => string | null,
): Promise<T> {
  const res = await authFetch(input, init, getToken);
  if (!res.ok) throw new Error("HTTP " + res.status + ": " + res.statusText);
  return res.json() as Promise<T>;
}

/**
 * React hook that returns an `authFetch`-like function pre-bound to the
 * current context token from `useAuth()`. Must be used inside an <AuthProvider>.
 *
 * The returned function signature is `(input, init?) => Promise<Response>`,
 * without the `getToken` parameter (token is already bound from context).
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const fetch = useAuthFetch();
 *   const handleClick = async () => {
 *     const res = await fetch("/api/data");
 *     ...
 *   };
 * }
 * ```
 */
export function useAuthFetch(): (
  input: RequestInfo | URL,
  init?: AuthFetchInit,
) => Promise<Response> {
  const { token } = useAuth();
  const getToken = useCallback((): string | null => token, [token]);
  return useCallback(
    (input: RequestInfo | URL, init?: AuthFetchInit) =>
      authFetch(input, init, getToken),
    [getToken],
  );
}
