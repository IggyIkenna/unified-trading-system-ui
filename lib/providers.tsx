"use client"

import * as React from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { getQueryClient } from "./query-client"
import { AuthProvider } from "@/hooks/use-auth"
import { AppAccessProvider } from "@/hooks/use-app-access"
import { installMockHandler } from "@/lib/api/mock-handler"

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MOCK_API === "true") {
  installMockHandler()
}

/**
 * Client-side providers wrapper.
 * QueryClient → Auth (identity) → AppAccess (authorization/capabilities).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppAccessProvider>{children}</AppAccessProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
