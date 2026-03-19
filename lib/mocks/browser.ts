/**
 * MSW browser worker — activated when NEXT_PUBLIC_MOCK_API=true.
 *
 * Import this in a client component to start the mock service worker.
 * The worker intercepts fetch() calls and serves mock data from handlers.
 */

import { setupWorker } from "msw/browser"
import { handlers } from "./handlers"

export const worker = setupWorker(...handlers)

/**
 * Start the MSW worker if mock mode is enabled.
 * Call this once at app startup (e.g., in a provider or layout effect).
 */
export async function startMockWorker() {
  if (typeof window === "undefined") return
  if (process.env.NEXT_PUBLIC_MOCK_API !== "true") return

  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: false,
  })

  console.log("[MSW] Mock service worker started")
}
