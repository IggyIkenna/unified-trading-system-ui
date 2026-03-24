import { QueryClient } from "@tanstack/react-query";

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
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Get the query client.
 *
 * Server: fresh client per request (prevents cross-request state leakage).
 * Browser: singleton (persists across navigations).
 *
 * NOTE: For full SSR hydration (dehydrate/HydrationBoundary), this pattern
 * needs to be extended for server-side data fetching.
 * See: https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr
 */
export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
