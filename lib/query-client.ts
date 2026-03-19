import { QueryClient } from "@tanstack/react-query"

/**
 * Singleton React Query client with sensible defaults for demo mode.
 *
 * - staleTime: 5 min (mock data doesn't change, avoid refetch noise)
 * - retry: 1 (fail fast in demo)
 * - refetchOnWindowFocus: false (avoid confusing re-renders during demo)
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always new client (no sharing between requests)
    return makeQueryClient()
  }
  // Browser: singleton
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient()
  }
  return browserQueryClient
}
