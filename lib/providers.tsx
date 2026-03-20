"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "./query-client"
import { AuthProvider } from "@/hooks/use-auth"

/**
 * Client-side providers wrapper.
 * Wraps children with QueryClientProvider, AuthProvider, and initialises MSW in dev/mock mode.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOCK_API === "true") {
      import("./mocks/browser").then(({ startMockWorker }) => startMockWorker())
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
