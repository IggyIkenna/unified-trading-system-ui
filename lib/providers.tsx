"use client";

import { AppAccessProvider } from "@/hooks/use-app-access";
import { AuthProvider } from "@/hooks/use-auth";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { getQueryClient } from "./query-client";

function clientMockModeEnabled(): boolean {
  return isMockDataMode();
}

/**
 * In mock/demo mode, wait until fetch interception is installed before mounting
 * children so the first React Query / fetch calls never hit the real Next server
 * (which has no /api routes when rewrites are disabled).
 */
function useMockFetchReady(): boolean {
  const mock = clientMockModeEnabled();
  const [ready, setReady] = React.useState(!mock);

  React.useLayoutEffect(() => {
    if (!mock) return;
    let cancelled = false;
    void import("@/lib/api/mock-handler").then(({ installMockHandler }) => {
      if (cancelled) return;
      installMockHandler();
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mock]);

  return ready;
}

/**
 * Client-side providers wrapper.
 * QueryClient -> Auth (Firebase identity) -> AppAccess (authorization/capabilities).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const mockFetchReady = useMockFetchReady();

  if (!mockFetchReady) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-background text-muted-foreground text-sm"
        aria-busy="true"
        aria-live="polite"
      >
        Preparing demo…
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppAccessProvider>{children}</AppAccessProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
