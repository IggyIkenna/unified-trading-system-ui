"use client";

/**
 * WorkspaceScopeProvider — hydrates the WorkspaceScopeStore from URL search
 * params on mount, then leaves the Zustand store as the source of truth.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §7:
 *   1. URL params beat localStorage.
 *   2. localStorage beats defaults.
 *   3. browser back/forward restores previous scope.
 *   4. `stream=live` is honoured on hydration only if persona has live-trading
 *      entitlement; otherwise silently downgrades to `paper` (§4.3).
 *
 * Mounted at the top of `app/(platform)/layout.tsx`; replaces the prior
 * `<DashboardFilterProvider>`.
 */

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { hydrateScopeFromUrl } from "@/lib/stores/workspace-scope-store";

interface WorkspaceScopeProviderProps {
  readonly children: React.ReactNode;
}

export function WorkspaceScopeProvider({ children }: WorkspaceScopeProviderProps) {
  const searchParams = useSearchParams();
  const { hasEntitlement } = useAuth();

  // Detect live-trading entitlement for §4.3 safety contract.
  // `execution-full` is the canonical entitlement for live execution; demo /
  // signals-only personas don't carry it.
  const hasLiveTradingEntitlement = React.useMemo(() => {
    return hasEntitlement?.("execution-full") ?? false;
  }, [hasEntitlement]);

  // One-time hydration on mount (and on URL changes — covers back/forward
  // navigation as well as deep links).
  const lastHydratedRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = searchParams?.toString() ?? "";
    if (lastHydratedRef.current === qs) return;
    lastHydratedRef.current = qs;
    if (qs.length === 0) return; // No URL params: leave persisted scope intact
    hydrateScopeFromUrl(new URLSearchParams(qs), {
      hasLiveTradingEntitlement,
    });
  }, [searchParams, hasLiveTradingEntitlement]);

  return <>{children}</>;
}
