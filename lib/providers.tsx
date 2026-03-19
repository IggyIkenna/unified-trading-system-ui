"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "./query-client"

/**
 * Client-side providers wrapper.
 * Wraps children with QueryClientProvider and initialises MSW in dev/mock mode.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  // Start MSW worker on mount (only when NEXT_PUBLIC_MOCK_API=true)
  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_API === "true") {
      import("./mocks/browser").then(({ startMockWorker }) => startMockWorker())
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
