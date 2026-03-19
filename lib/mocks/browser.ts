/**
 * MSW Browser Setup
 * 
 * Configures the mock service worker for browser-side mocking.
 * This is used in development and demo mode.
 */

import { setupWorker } from "msw/browser"
import { handlers } from "./handlers"

// Create the worker with all handlers
export const worker = setupWorker(...handlers)

// Start function with default options
export async function startMocking() {
  if (typeof window === "undefined") return
  
  // Only start in development or when explicitly enabled
  const shouldMock = process.env.NODE_ENV === "development" || 
                     process.env.NEXT_PUBLIC_ENABLE_MSW === "true"
  
  if (!shouldMock) return
  
  return worker.start({
    onUnhandledRequest: "bypass", // Don't warn about unhandled requests
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  })
}
