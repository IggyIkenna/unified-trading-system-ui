/**
 * React Query hooks for Phase U2 strategy runs API.
 *
 * GET /api/strategy/{strategyId}/runs?mode=batch|paper|live
 * Returns mode-tagged P&L + fill bundles for the DART 3-way view (Phase U5).
 *
 * SSOT: plans/active/promote_workflow_may23_cli_path_2026_05_10.md § Phase U2
 */

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { fetchStrategyRuns, type StrategyRunsResponse } from "@/lib/api/promote-client";
import { isMockDataMode } from "@/lib/runtime/data-mode";

const mockDataMode = isMockDataMode();

export function useStrategyRuns(strategyId: string | null | undefined, mode: "batch" | "paper" | "live") {
  const { user, token } = useAuth();

  return useQuery<StrategyRunsResponse>({
    queryKey: ["strategy-runs", strategyId, mode, user?.id],
    queryFn: async () => {
      if (mockDataMode || !strategyId) {
        return { strategy_id: strategyId ?? "", mode, runs: [], total_count: 0, page: 1, page_size: 20 };
      }
      return fetchStrategyRuns(strategyId, mode, token);
    },
    enabled: !!user && !!strategyId,
    staleTime: 30_000,
  });
}

/** Fetch all three modes in parallel for the DART 3-way comparison. */
export function useStrategyRunsAllModes(strategyId: string | null | undefined) {
  const batchQuery = useStrategyRuns(strategyId, "batch");
  const paperQuery = useStrategyRuns(strategyId, "paper");
  const liveQuery = useStrategyRuns(strategyId, "live");
  return { batch: batchQuery, paper: paperQuery, live: liveQuery };
}
