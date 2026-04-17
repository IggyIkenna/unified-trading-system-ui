import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";

const mockDataMode = isMockDataMode();

function buildUrl(path: string, params?: Record<string, string>): string {
  if (!params) return path;
  const qs = new URLSearchParams(params).toString();
  return qs ? `${path}?${qs}` : path;
}

// =============================================================================
// Data Status
// =============================================================================

export function useDataStatus(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["data-status", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return {};
      return apiFetch(buildUrl("/api/data-status", params), token);
    },
    enabled: !!user,
  });
}

export function useDataStatusTurbo(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["data-status-turbo", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return {};
      return apiFetch(buildUrl("/api/data-status/turbo", params), token);
    },
    enabled: !!user,
  });
}

export function useCoverageSummary(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["data-status", "coverage-summary", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return {};
      return apiFetch(buildUrl("/api/data-status/coverage-summary", params), token);
    },
    enabled: !!user,
  });
}

export function useVenueFilters() {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["data-status", "venue-filters", user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch("/api/data-status/venue-filters", token);
    },
    enabled: !!user,
  });
}

export function usePipelineOverview(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["data-status", "pipeline-overview", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return {};
      return apiFetch(buildUrl("/api/data-status/pipeline-overview", params), token);
    },
    enabled: !!user,
  });
}

export function useInstrumentAvailability(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["data-status", "instrument-availability", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/data-status/instrument-availability", params), token);
    },
    enabled: !!user,
  });
}
