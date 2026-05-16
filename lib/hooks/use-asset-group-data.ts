"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetch";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspaceScopeStore } from "@/lib/stores/workspace-scope-store";
import type { WidgetAssetGroup } from "@/lib/types/asset-group";

/**
 * Asset-group-aware market-data hook.
 *
 * Resolves the right API gateway endpoint by `(assetGroup, viewType)` tuple
 * and threads the active asset_group from `global-scope-store` when callers
 * don't pass one explicitly. Backed by the existing TanStack Query stack
 * (`useQuery`) and the typed-fetch helper.
 *
 * Endpoint convention: `/api/market-data/<view-type>?asset_group=<lowercase>`
 * (e.g. `/api/market-data/funding-rate-matrix?asset_group=cefi`).
 *
 * In tier-0 dev mode (`NEXT_PUBLIC_MOCK_API=true`), the request is
 * intercepted by `lib/api/mock-handler.ts` and resolved against in-repo
 * fixtures — see the late-April Tier-0 SSOT in CLAUDE.md.
 *
 * The actual `/api/market-data/*` endpoints are added per-widget in
 * Phases P1–P4 of the DART cross-asset-group market-data terminal plan.
 * The hook is foundation-level — early consumers will see 404s until
 * those endpoints land, which the tier-0 mock fixtures cover during
 * local dev.
 */
export type MarketDataViewType =
  // Coinglass-style derivatives positioning (P1)
  | "funding-rate-matrix"
  | "open-interest-ranking"
  | "liquidation-heatmap"
  | "long-short-ratio"
  | "basis-curve"
  // DefiLlama-style DeFi metrics (P2)
  | "tvl-by-chain"
  | "tvl-by-protocol"
  | "dex-volume-ranking"
  | "yield-farm-ranking"
  | "stablecoin-supply"
  // CoinMarketCap-style discovery (P3)
  | "market-cap-ranking"
  | "gainers-losers"
  | "volume-dominance"
  | "trending-tokens"
  // Polymarket-style prediction (P3a)
  | "market-probability-curve"
  | "outcome-order-book"
  | "outcome-volume"
  | "trending-markets"
  | "closing-soon"
  | "topic-browser"
  | "resolution-ledger"
  // TradFi (P4)
  | "rates-curve"
  | "vol-surface"
  | "etf-flows"
  | "sector-heatmap"
  // Cross-asset-group screeners (P5)
  | "asset-group-screener"
  // Deribit-style options analytics (P6 — UI scaffolds; backend Greeks/IV
  // computation lands in features-derivatives-service before these go live)
  | "iv-smile"
  | "iv-term-structure"
  | "max-pain"
  | "put-call-ratio";

export interface UseAssetGroupDataOptions<TParams extends Record<string, string | number> = Record<string, never>> {
  /**
   * Override the asset_group axis. When omitted, the hook reads the active
   * asset_group from `global-scope-store.assetGroupIds[0]`. The hook is
   * disabled (no fetch) when neither is available.
   */
  assetGroup?: WidgetAssetGroup;
  /** Extra query string params (e.g. asset symbol, venue, time range). */
  params?: TParams;
  /** When true, the query is disabled regardless of asset_group state. */
  disabled?: boolean;
  /** Stale time override (ms). Default 60_000 (1 min). */
  staleTime?: number;
}

function buildSearchParams(assetGroup: WidgetAssetGroup, params: Record<string, string | number> | undefined): string {
  const sp = new URLSearchParams();
  sp.set("asset_group", assetGroup.toLowerCase());
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      sp.set(k, String(v));
    }
  }
  return sp.toString();
}

/**
 * Hook returning a TanStack Query result for the given view type, scoped to
 * the active asset_group.
 *
 * Generic `TResponse` is the response shape; consumers SHOULD pass a
 * specific type rather than rely on `unknown`. Once `/api/market-data/*`
 * endpoints are wired into the OpenAPI generator, the convention is to
 * derive the response type via `ApiResponse<"/market-data/<view>">` from
 * `lib/api/typed-fetch.ts`.
 */
export function useAssetGroupData<TResponse, TParams extends Record<string, string | number> = Record<string, never>>(
  viewType: MarketDataViewType,
  options: UseAssetGroupDataOptions<TParams> = {},
): UseQueryResult<TResponse> {
  const { token, user } = useAuth();
  const activeAssetGroups = useWorkspaceScopeStore((s) => s.scope.assetGroups);
  const resolvedAssetGroup = options.assetGroup ?? (activeAssetGroups[0] as WidgetAssetGroup | undefined) ?? undefined;

  const { params, disabled, staleTime = 60_000 } = options;
  const enabled = !disabled && resolvedAssetGroup !== undefined && !!user;

  return useQuery<TResponse>({
    queryKey: ["market-data", viewType, resolvedAssetGroup ?? null, params ?? null, user?.id ?? null],
    queryFn: async () => {
      if (!resolvedAssetGroup) {
        throw new Error("useAssetGroupData: no asset_group resolved (check global scope or pass options.assetGroup)");
      }
      const qs = buildSearchParams(resolvedAssetGroup, params);
      const path = `/api/market-data/${viewType}?${qs}`;
      return (await apiFetch(path, token)) as TResponse;
    },
    enabled,
    staleTime,
  });
}
