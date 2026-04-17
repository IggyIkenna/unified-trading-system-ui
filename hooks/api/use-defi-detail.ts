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
// DeFi Basis
// =============================================================================

export function useFundingMatrix(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "funding-matrix", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/basis/funding-matrix", params), token);
    },
    enabled: !!user,
  });
}

export function useLstCollateral(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "lst-collateral", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/basis/lst-collateral", params), token);
    },
    enabled: !!user,
  });
}

export function useVenueAllocation(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "venue-allocation", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/basis/venue-allocation", params), token);
    },
    enabled: !!user,
  });
}

export function useBasisDirections(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "basis-directions", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/basis/directions", params), token);
    },
    enabled: !!user,
  });
}

// =============================================================================
// DeFi Lending
// =============================================================================

export function useLendingRates(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "lending-rates", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/lending/rates", params), token);
    },
    enabled: !!user,
  });
}

export function useLendingPositions(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "lending-positions", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/lending/positions", params), token);
    },
    enabled: !!user,
  });
}

// =============================================================================
// DeFi LP
// =============================================================================

export function useLPPositionRange(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "lp-position-range", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/lp/position-range", params), token);
    },
    enabled: !!user,
  });
}

export function useImpermanentLoss(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "impermanent-loss", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return {};
      return apiFetch(buildUrl("/api/defi/lp/impermanent-loss", params), token);
    },
    enabled: !!user,
  });
}

export function useRebalanceHistory(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "rebalance-history", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/lp/rebalance-history", params), token);
    },
    enabled: !!user,
  });
}

export function useLPMLConfidence(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "lp-ml-confidence", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return {};
      return apiFetch(buildUrl("/api/defi/lp/ml-confidence", params), token);
    },
    enabled: !!user,
  });
}

export function useLPFeeRevenue(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "lp-fee-revenue", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/lp/fee-revenue", params), token);
    },
    enabled: !!user,
  });
}

// =============================================================================
// DeFi Liquidation
// =============================================================================

export function useLiquidationHeatmap(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "liquidation-heatmap", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/liquidation/risk-heatmap", params), token);
    },
    enabled: !!user,
  });
}

export function useCascadeRisk(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "cascade-risk", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return {};
      return apiFetch(buildUrl("/api/defi/liquidation/cascade-risk", params), token);
    },
    enabled: !!user,
  });
}

export function useLiquidationEvents(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "liquidation-events", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/liquidation/events", params), token);
    },
    enabled: !!user,
  });
}

export function useCapturedPositions(params?: Record<string, string>) {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: ["defi", "captured-positions", params, user?.id],
    queryFn: async () => {
      if (mockDataMode) return [];
      return apiFetch(buildUrl("/api/defi/liquidation/captured-positions", params), token);
    },
    enabled: !!user,
  });
}
