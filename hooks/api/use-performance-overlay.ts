/**
 * React Query hook for the Plan C performance series.
 *
 * Wraps `lib/api/performance-overlay#fetchPerformanceSeries`. The HTTP
 * layer applies its own 60s/1h cache TTLs; React Query stale-time on the
 * UI side keeps re-renders cheap when the same instance/range is shown
 * across multiple consumers (FOMO tearsheet + DART terminal at once).
 */

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import {
  fetchPerformanceSeries,
  type PerformanceQueryParams,
  type PerformanceSeriesResponse,
} from "@/lib/api/performance-overlay";

const STALE_TIME_MS = 60_000;

export function usePerformanceOverlay(
  instanceId: string,
  params: PerformanceQueryParams,
): UseQueryResult<PerformanceSeriesResponse, Error> {
  const { user, token } = useAuth();
  const viewsKey = [...params.views].sort().join(",");
  return useQuery<PerformanceSeriesResponse, Error>({
    queryKey: [
      "performance-overlay",
      instanceId,
      viewsKey,
      params.from ?? null,
      params.to ?? null,
      params.perVenue ?? false,
      user?.id ?? null,
    ],
    queryFn: () => fetchPerformanceSeries(instanceId, params, token),
    enabled: !!instanceId,
    staleTime: STALE_TIME_MS,
  });
}
