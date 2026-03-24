"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./query-client";
import { AuthProvider } from "@/hooks/use-auth";
import { installMockHandler } from "@/lib/api/mock-handler";

// Install mock fetch interceptor once for static visual preview mode
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_MOCK_API === "true"
) {
  installMockHandler();
}

/**
 * Client-side providers wrapper.
 * Wraps children with QueryClientProvider and AuthProvider.
 * When NEXT_PUBLIC_MOCK_API=true, all /api/* calls are intercepted client-side (no backend needed).
 * Otherwise, calls go to the real API gateway (port 8030) which handles mock/real internally.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );
}
