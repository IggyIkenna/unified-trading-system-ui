/**
 * Type-safe API fetch helpers using generated OpenAPI types.
 *
 * The generated types in `api-generated.ts` use full service-prefixed paths
 * (e.g., `/position-balance-monitor-service/positions`) while the UI calls
 * gateway paths (e.g., `/api/positions`) that Next.js rewrites to the API
 * gateway at localhost:8100, which routes to backend services.
 *
 * Because the path namespaces don't match 1:1, this module provides:
 *
 * 1. `ApiResponse<P>` — a utility type that extracts the 200 JSON response
 *    type for any path in the generated `paths` interface. Use it to type
 *    individual hooks without coupling to a typed fetch function.
 *
 * 2. `typedFetch<T>()` — a thin wrapper around `apiFetch` that casts the
 *    result to `T`. The caller supplies the concrete response type (typically
 *    via `ApiResponse`), keeping the runtime behaviour identical to `apiFetch`.
 *
 * Usage in a hook:
 *
 *   import type { ApiResponse } from "@/lib/api/typed-fetch"
 *   import { typedFetch } from "@/lib/api/typed-fetch"
 *
 *   type PositionsResponse = ApiResponse<"/position-balance-monitor-service/positions">
 *
 *   export function usePositions() {
 *     const { user, token } = useAuth()
 *     return useQuery<PositionsResponse>({
 *       queryKey: ["positions", user?.id],
 *       queryFn: () => typedFetch<PositionsResponse>("/api/positions", token),
 *       enabled: !!user,
 *     })
 *   }
 */

import type { paths } from "@/lib/types/api-generated"

/**
 * Extract the 200 JSON response body type for a GET endpoint.
 *
 * Resolves to `never` when the path has no GET 200 JSON response.
 */
export type ApiResponse<P extends keyof paths> =
  paths[P] extends {
    get: { responses: { 200: { content: { "application/json": infer R } } } }
  }
    ? R
    : never

/**
 * Type-safe fetch that delegates to the standard fetch API with auth headers.
 *
 * Identical runtime behaviour to `apiFetch` in `./fetch.ts` — the only
 * difference is the return type is narrowed to `T` instead of `unknown`.
 */
export async function typedFetch<T>(
  url: string,
  token: string | null,
  options?: RequestInit,
): Promise<T> {
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

  return res.json() as Promise<T>
}
