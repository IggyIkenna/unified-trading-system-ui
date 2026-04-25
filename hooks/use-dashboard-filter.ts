"use client";

/**
 * useDashboardFilter — public hook over `DashboardFilterContext`.
 *
 * Always returns a context value; callers MUST render inside
 * `<DashboardFilterProvider>` (mounted at app/(platform)/layout.tsx). Use
 * `useOptionalDashboardFilter` below for non-platform surfaces that may
 * render outside the provider.
 */

import {
  useDashboardFilterContext,
  useOptionalDashboardFilterContext,
  type DashboardFilterContextValue,
} from "@/lib/context/dashboard-filter-context";

export function useDashboardFilter(): DashboardFilterContextValue {
  return useDashboardFilterContext();
}

export function useOptionalDashboardFilter(): DashboardFilterContextValue | null {
  return useOptionalDashboardFilterContext();
}
