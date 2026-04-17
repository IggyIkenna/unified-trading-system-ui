import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import {
  MOCK_STRATEGY_ALLOCATIONS,
  MOCK_RECON_KPIS,
  MOCK_DRIFT_TIME_SERIES,
  type StrategyAllocation,
  type DriftTimePoint,
} from "@/lib/mocks/fixtures/position-recon";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ReconKpis {
  totalEquity: number;
  totalTarget: number;
  allocatedPct: number;
  unallocatedPct: number;
  worstDriftPct: number;
  activeAlerts: number;
}

export interface ReconciliationSnapshot {
  allocations: StrategyAllocation[];
  kpis: ReconKpis;
  driftTimeSeries: DriftTimePoint[];
}

export interface ReconciliationHistoryEntry {
  timestamp: string;
  totalEquity: number;
  worstDriftPct: number;
  activeAlerts: number;
}

export interface ReconciliationEvaluateResult {
  status: "ok" | "drift_detected" | "error";
  message: string;
  evaluatedAt: string;
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

const isMock = isMockDataMode();

/**
 * Fetch the current reconciliation snapshot (allocations, KPIs, drift series).
 * Mock mode: returns fixture data.
 * Live mode: GET /api/reconciliation/drift/portfolio-snapshot from PBMS.
 */
export function useReconciliationSnapshot() {
  const { user, token } = useAuth();

  return useQuery<ReconciliationSnapshot>({
    queryKey: ["reconciliation-snapshot", user?.id],
    queryFn: async () => {
      if (isMock) {
        return {
          allocations: MOCK_STRATEGY_ALLOCATIONS,
          kpis: MOCK_RECON_KPIS,
          driftTimeSeries: MOCK_DRIFT_TIME_SERIES,
        };
      }
      const result = await apiFetch("/api/reconciliation/drift/portfolio-snapshot", token);
      return result as ReconciliationSnapshot;
    },
    enabled: !!user,
    refetchInterval: 10_000,
  });
}

/**
 * Fetch reconciliation history entries.
 * Mock mode: returns generated history from fixture KPIs.
 * Live mode: GET /api/reconciliation/drift/history?limit=N from PBMS.
 */
export function useReconciliationHistory(limit = 50) {
  const { user, token } = useAuth();

  return useQuery<ReconciliationHistoryEntry[]>({
    queryKey: ["reconciliation-history", user?.id, limit],
    queryFn: async () => {
      if (isMock) {
        const now = new Date();
        return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
          timestamp: new Date(now.getTime() - i * 300_000).toISOString(),
          totalEquity: MOCK_RECON_KPIS.totalEquity + Math.round((Math.random() - 0.5) * 5000),
          worstDriftPct: MOCK_RECON_KPIS.worstDriftPct + (Math.random() - 0.5) * 2,
          activeAlerts: MOCK_RECON_KPIS.activeAlerts,
        }));
      }
      const result = await apiFetch(
        `/api/reconciliation/drift/history?limit=${limit}`,
        token,
      );
      return result as ReconciliationHistoryEntry[];
    },
    enabled: !!user,
  });
}

/**
 * Trigger a reconciliation evaluation.
 * Mock mode: returns simulated success after a brief delay.
 * Live mode: POST /api/reconciliation/drift/evaluate to PBMS.
 */
export function useReconciliationEvaluate() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<ReconciliationEvaluateResult, Error, void>({
    mutationFn: async () => {
      if (isMock) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
          status: "ok" as const,
          message: "Reconciliation evaluation completed successfully",
          evaluatedAt: new Date().toISOString(),
        };
      }
      const result = await apiFetch("/api/reconciliation/drift/evaluate", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return result as ReconciliationEvaluateResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliation-snapshot"] });
      queryClient.invalidateQueries({ queryKey: ["reconciliation-history"] });
    },
  });
}
