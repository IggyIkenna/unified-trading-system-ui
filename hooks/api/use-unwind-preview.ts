import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api/fetch";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import {
  getMockCostPreview,
  getMockFastUnwindCost,
  getMockSlowUnwindCost,
  type CostPreview,
} from "@/lib/mocks/fixtures/position-recon";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ExecutionStyle = "TWAP" | "MARKET";

export interface UnwindPreviewRequest {
  action: "reduce" | "flatten";
  strategy_id?: string;
  reduce_pct?: number;
  execution_style: ExecutionStyle;
  twap_duration_minutes?: number;
  total_exposure: number;
}

// ── Hooks ──────────────────────────────────────────────────────────────────────

const isMock = isMockDataMode();

/**
 * Fetch unwind cost preview from execution-service.
 * Mock mode: returns getMockCostPreview / getMockFastUnwindCost / getMockSlowUnwindCost.
 * Live mode: POST /api/preview/unwind to execution-service.
 *
 * Uses useQuery (not useMutation) so the preview auto-refreshes when
 * the request params change (e.g. user drags the reduction slider).
 * The query is only enabled when the request is provided.
 */
export function useUnwindPreview(request: UnwindPreviewRequest | null) {
  const { user, token } = useAuth();

  return useQuery<CostPreview>({
    queryKey: ["unwind-preview", request, user?.id],
    queryFn: async () => {
      if (!request) throw new Error("No request provided");

      if (isMock) {
        if (request.execution_style === "MARKET") {
          return getMockFastUnwindCost(request.total_exposure);
        }
        if (request.action === "flatten") {
          return getMockSlowUnwindCost(request.total_exposure);
        }
        return getMockCostPreview(request.reduce_pct ?? 100, request.total_exposure);
      }

      const result = await apiFetch("/api/preview/unwind", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      return result as CostPreview;
    },
    enabled: !!user && request !== null,
    staleTime: 5_000,
  });
}

/**
 * Convenience hook: fetch both TWAP and MARKET cost previews for comparison.
 */
export function useUnwindComparison(totalExposure: number | null) {
  const { user, token } = useAuth();

  return useQuery<{ conservative: CostPreview; aggressive: CostPreview }>({
    queryKey: ["unwind-comparison", totalExposure, user?.id],
    queryFn: async () => {
      if (totalExposure === null) throw new Error("No exposure provided");

      if (isMock) {
        return {
          conservative: getMockSlowUnwindCost(totalExposure),
          aggressive: getMockFastUnwindCost(totalExposure),
        };
      }

      const [conservative, aggressive] = await Promise.all([
        apiFetch("/api/preview/unwind", token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "flatten",
            execution_style: "TWAP",
            twap_duration_minutes: 25,
            total_exposure: totalExposure,
          }),
        }),
        apiFetch("/api/preview/unwind", token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "flatten",
            execution_style: "MARKET",
            total_exposure: totalExposure,
          }),
        }),
      ]);
      return {
        conservative: conservative as CostPreview,
        aggressive: aggressive as CostPreview,
      };
    },
    enabled: !!user && totalExposure !== null && totalExposure > 0,
    staleTime: 10_000,
  });
}
