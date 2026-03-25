"use client";

import * as React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "./query-client";
import { AuthProvider } from "@/hooks/use-auth";
import { AppAccessProvider } from "@/hooks/use-app-access";

/**
 * Client-side providers wrapper.
 * QueryClient -> Auth (Firebase identity) -> AppAccess (authorization/capabilities).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  // Install mock fetch handler in mock mode — intercepts /api/* calls
  // with client-side mock data so no backend is needed
  React.useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_MOCK_API === "true" ||
      process.env.NEXT_PUBLIC_AUTH_PROVIDER === "demo"
    ) {
      import("@/lib/api/mock-handler").then(({ installMockHandler }) => {
        installMockHandler();
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppAccessProvider>{children}</AppAccessProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
