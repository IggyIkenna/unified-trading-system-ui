"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "./query-client"
import { AuthProvider } from "@/hooks/use-auth"

/**
 * Client-side providers wrapper.
 * Wraps children with QueryClientProvider and AuthProvider.
 * All API calls go to the real API gateway (port 8030) which handles mock/real internally.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
