/**
 * Type-safe API fetch helpers using generated OpenAPI types.
 *
 * The generated types in `api-generated.ts` use full service-prefixed paths
 * (e.g., `/position-balance-monitor-service/positions`) while the UI calls
 * gateway paths (e.g., `/api/positions`) that Next.js rewrites to the API
 * gateway at localhost:8100, which routes to backend services.
 *
 * Because the path namespaces don't match 1:1, this module provides:
 *
 * 1. `ApiResponse<P>` — a utility type that extracts the 200 JSON response
 *    type for any path in the generated `paths` interface. Use it to type
 *    individual hooks without coupling to a typed fetch function.
 *
 * 2. `typedFetch<T>()` — a thin wrapper around `apiFetch` that casts the
 *    result to `T`. The caller supplies the concrete response type (typically
 *    via `ApiResponse`), keeping the runtime behaviour identical to `apiFetch`.
 *
 * Usage in a hook:
 *
 *   import type { ApiResponse } from "@/lib/api/typed-fetch"
 *   import { typedFetch } from "@/lib/api/typed-fetch"
 *
 *   type PositionsResponse = ApiResponse<"/position-balance-monitor-service/positions">
 *
 *   export function usePositions() {
 *     const { user, token } = useAuth()
 *     return useQuery<PositionsResponse>({
 *       queryKey: ["positions", user?.id],
 *       queryFn: () => typedFetch<PositionsResponse>("/api/positions", token),
 *       enabled: !!user,
 *     })
 *   }
 */

import type { paths } from "@/lib/types/api-generated";

/**
 * Extract the 200 JSON response body type for a GET endpoint.
 *
 * Resolves to `never` when the path has no GET 200 JSON response.
 */
export type ApiResponse<P extends keyof paths> = paths[P] extends {
  get: { responses: { 200: { content: { "application/json": infer R } } } };
}
  ? R
  : never;

/**
 * Maps UI gateway paths (`/api/...`) to their generated backend paths.
 *
 * The UI calls Next.js rewrite paths (e.g. `/api/positions/active`) which
 * proxy to `/unified-trading-api/positions/active`.  This map lets us write
 * `GatewayApiResponse<"/api/positions/active">` and get the same type as
 * `ApiResponse<"/unified-trading-api/positions/active">`.
 */
export interface GatewayPathMap {
  // --- positions ---
  "/api/positions/active": "/unified-trading-api/positions/active";
  "/api/positions/summary": "/unified-trading-api/positions/summary";
  "/api/positions/balances": "/unified-trading-api/positions/balances";
  // --- execution / orders ---
  "/api/execution/orders": "/unified-trading-api/execution/orders";
  "/api/execution/fills": "/unified-trading-api/execution/fills";
  "/api/execution/venues": "/unified-trading-api/execution/venues";
  "/api/execution/algos": "/unified-trading-api/execution/algos";
  "/api/execution/grid-configs": "/unified-trading-api/execution/grid-configs";
  "/api/execution/backtests": "/unified-trading-api/execution/backtests";
  // --- market data ---
  "/api/market-data/candles": "/unified-trading-api/market-data/candles";
  "/api/market-data/orderbook": "/unified-trading-api/market-data/orderbook";
  "/api/market-data/trades": "/unified-trading-api/market-data/trades";
  "/api/market-data/tickers": "/unified-trading-api/market-data/tickers";
  // --- risk ---
  "/api/risk/limits": "/unified-trading-api/risk/limits";
  "/api/risk/var": "/unified-trading-api/risk/var";
  "/api/risk/greeks": "/unified-trading-api/risk/greeks";
  "/api/risk/stress": "/unified-trading-api/risk/stress";
  "/api/risk/var-summary": "/unified-trading-api/risk/var-summary";
  "/api/risk/stress-test": "/unified-trading-api/risk/stress-test";
  "/api/risk/correlation-matrix": "/unified-trading-api/risk/correlation-matrix";
  "/api/risk/regime": "/unified-trading-api/risk/regime";
  "/api/risk/exposure": "/unified-trading-api/risk/exposure";
  // --- analytics / strategies ---
  "/api/analytics/strategies": "/unified-trading-api/analytics/strategies";
  "/api/analytics/strategies/catalog": "/unified-trading-api/analytics/strategies/catalog";
  "/api/analytics/strategy-configs": "/unified-trading-api/analytics/strategy-configs";
  "/api/trading/performance": "/unified-trading-api/analytics/performance";
  // --- alerts ---
  "/api/alerts/list": "/unified-trading-api/alerts/list";
  "/api/alerts/summary": "/unified-trading-api/alerts/summary";
  "/api/alerts/active": "/unified-trading-api/alerts/active";
  // --- defi basis ---
  "/api/defi/basis/funding-matrix": "/unified-trading-api/defi/basis/funding-matrix";
  "/api/defi/basis/lst-collateral": "/unified-trading-api/defi/basis/lst-collateral";
  "/api/defi/basis/venue-allocation": "/unified-trading-api/defi/basis/venue-allocation";
  "/api/defi/basis/directions": "/unified-trading-api/defi/basis/directions";
  // --- defi lending ---
  "/api/defi/lending/rates": "/unified-trading-api/defi/lending/rates";
  "/api/defi/lending/positions": "/unified-trading-api/defi/lending/positions";
  // --- defi LP ---
  "/api/defi/lp/position-range": "/unified-trading-api/defi/lp/position-range";
  "/api/defi/lp/impermanent-loss": "/unified-trading-api/defi/lp/impermanent-loss";
  "/api/defi/lp/rebalance-history": "/unified-trading-api/defi/lp/rebalance-history";
  "/api/defi/lp/ml-confidence": "/unified-trading-api/defi/lp/ml-confidence";
  "/api/defi/lp/fee-revenue": "/unified-trading-api/defi/lp/fee-revenue";
  // --- defi liquidation ---
  "/api/defi/liquidation/risk-heatmap": "/unified-trading-api/defi/liquidation/risk-heatmap";
  "/api/defi/liquidation/cascade-risk": "/unified-trading-api/defi/liquidation/cascade-risk";
  "/api/defi/liquidation/events": "/unified-trading-api/defi/liquidation/events";
  "/api/defi/liquidation/captured-positions": "/unified-trading-api/defi/liquidation/captured-positions";
  // --- data status ---
  "/api/data-status": "/unified-trading-api/data-status";
  "/api/data-status/turbo": "/unified-trading-api/data-status/turbo";
  "/api/data-status/coverage-summary": "/unified-trading-api/data-status/coverage-summary";
  "/api/data-status/venue-filters": "/unified-trading-api/data-status/venue-filters";
  "/api/data-status/pipeline-overview": "/unified-trading-api/data-status/pipeline-overview";
  "/api/data-status/instruments": "/unified-trading-api/data-status/instruments";
  "/api/data-status/instrument-availability": "/unified-trading-api/data-status/instrument-availability";
  // --- sports ---
  "/api/sports/fixtures": "/unified-trading-api/api/sports/fixtures";
  "/api/sports/leagues": "/unified-trading-api/api/sports/leagues";
  "/api/sports/history": "/unified-trading-api/api/sports/history";
  // --- risk (kill-switch / circuit-breaker) ---
  "/api/risk/kill-switch": "/unified-trading-api/risk/kill-switch";
  "/api/risk/circuit-breaker": "/unified-trading-api/risk/circuit-breaker";
  // --- ML ---
  "/api/ml/model-families": "/unified-trading-api/ml/model-families";
  "/api/ml/experiments": "/unified-trading-api/ml/experiments";
  "/api/ml/training-runs": "/unified-trading-api/ml/training-runs";
  "/api/ml/versions": "/unified-trading-api/ml/versions";
  "/api/ml/deployments": "/unified-trading-api/ml/deployments";
  "/api/ml/features": "/unified-trading-api/ml/features";
  "/api/ml/datasets": "/unified-trading-api/ml/datasets";
  "/api/ml/training-jobs": "/unified-trading-api/ml/training-jobs";
  "/api/ml/monitoring": "/unified-trading-api/ml/monitoring";
  "/api/ml/governance": "/unified-trading-api/ml/governance";
  "/api/ml/grid-configs": "/unified-trading-api/ml/grid-configs";
}

/**
 * Convenience type: resolve a UI gateway path to the backend 200 response type.
 *
 *   type Positions = GatewayApiResponse<"/api/positions/active">
 */
export type GatewayApiResponse<G extends keyof GatewayPathMap> =
  ApiResponse<GatewayPathMap[G]>;

/**
 * Type-safe fetch that delegates to the standard fetch API with auth headers.
 *
 * Identical runtime behaviour to `apiFetch` in `./fetch.ts` — the only
 * difference is the return type is narrowed to `T` instead of `unknown`.
 */
export async function typedFetch<T>(
  url: string,
  token: string | null,
  options?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
