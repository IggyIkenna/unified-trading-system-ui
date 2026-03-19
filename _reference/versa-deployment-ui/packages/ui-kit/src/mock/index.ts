/**
 * Mock mode infrastructure for unified trading UIs.
 *
 * When VITE_MOCK_API=true, all /api/* fetch calls are intercepted and
 * return realistic simulated data. No real backend is needed.
 *
 * Usage in each UI's main.tsx:
 *   import { installMockHandlers } from '@unified-trading/ui-kit/mock'
 *   installMockHandlers()
 */

/**
 * NOTE: MOCK_MODE cannot be evaluated in a library — import.meta.env is resolved
 * at library build time, not consuming app build time. Each app must define its own:
 *   const MOCK_MODE = import.meta.env.VITE_MOCK_API === 'true'
 * and pass it to installMockHandlers(MOCK_MODE).
 */

type MockHandler = (url: string, init?: RequestInit) => Promise<Response>;

const mockHandlers: Map<RegExp, MockHandler> = new Map();

/**
 * Register a mock handler for a URL pattern.
 * Call this from each UI's mock-api.ts before installMockHandlers().
 */
export function registerMockHandler(pattern: RegExp, handler: MockHandler) {
  mockHandlers.set(pattern, handler);
}

/**
 * Intercept window.fetch for all /api/* routes.
 * Must be called once at app startup (in main.tsx), passing the app-local MOCK_MODE:
 *   installMockHandlers(import.meta.env.VITE_MOCK_API === 'true')
 */
export function installMockHandlers(mockMode = false) {
  if (!mockMode) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : (input as Request).url;

    if (url.startsWith("/api/") || url.includes("/api/")) {
      for (const [pattern, handler] of mockHandlers) {
        if (pattern.test(url)) {
          return handler(url, init);
        }
      }
      // Default: 404 for unregistered mock routes (no console in production)
      return new Response(
        JSON.stringify({ error: "Mock: no handler registered", url }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };

  // MOCK MODE ACTIVE — /api/* requests intercepted (no console in production)
}

/** Helper to build a mock JSON response */
export function mockJson<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Helper: simulate network delay (optional, call with await) */
export function mockDelay(ms = 80): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
