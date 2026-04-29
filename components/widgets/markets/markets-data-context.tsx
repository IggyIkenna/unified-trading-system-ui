"use client";

import * as React from "react";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { generateLiveBookUpdates, generateOrderFlowData } from "@/lib/mocks/generators/order-flow-generators";
import { MOCK_RECON_RUNS } from "@/lib/mocks/fixtures/recon-runs";
import { MOCK_LATENCY_METRICS } from "@/lib/mocks/fixtures/latency-metrics";
import type { MarketsAssetClass } from "@/lib/config/services/markets.config";
import type { LatencyMetric, LiveBookUpdate, OrderFlowEntry, ReconRun } from "@/lib/types/markets";

export interface MarketsDataContextValue {
  orderFlowData: OrderFlowEntry[];
  liveBookUpdates: LiveBookUpdate[];
  ownOrders: OrderFlowEntry[];

  orderFlowRange: "1d" | "1w" | "1m";
  setOrderFlowRange: (r: "1d" | "1w" | "1m") => void;
  orderFlowView: "orders" | "book" | "own";
  setOrderFlowView: (v: "orders" | "book" | "own") => void;
  assetClass: MarketsAssetClass;
  setAssetClass: (ac: MarketsAssetClass) => void;
  bookDepth: number;
  setBookDepth: (d: number) => void;

  reconRuns: ReconRun[];

  latencyMetrics: LatencyMetric[];
  selectedLatencyService: string | null;
  setSelectedLatencyService: (id: string | null) => void;
  latencyViewMode: "cross-section" | "time-series";
  setLatencyViewMode: (m: "cross-section" | "time-series") => void;
  latencyDataMode: "live" | "batch" | "compare";
  setLatencyDataMode: (m: "live" | "batch" | "compare") => void;

  viewMode: "cross-section" | "time-series";
  setViewMode: (m: "cross-section" | "time-series") => void;
  dataMode: "live" | "batch";
  setDataMode: (m: "live" | "batch") => void;
  dateRange: string;
  setDateRange: (d: string) => void;

  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  mode?: string;
}

const MarketsDataContext = React.createContext<MarketsDataContextValue | null>(null);

export function MarketsDataProvider({ children }: { children: React.ReactNode }) {
  const { isPaper, isBatch, mode } = useExecutionMode();
  const globalScope = useWorkspaceScope();
  const scopeStrategyIds = React.useMemo(() => getStrategyIdsForScope({ organizationIds: globalScope.organizationIds, clientIds: globalScope.clientIds, strategyIds: globalScope.strategyIds }), [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);
  const [viewMode, setViewMode] = React.useState<"cross-section" | "time-series">("cross-section");
  const [dataMode, setDataMode] = React.useState<"live" | "batch">("live");
  const [dateRange, setDateRange] = React.useState("today");

  const [selectedLatencyService, setSelectedLatencyService] = React.useState<string | null>(null);
  const [latencyViewMode, setLatencyViewMode] = React.useState<"cross-section" | "time-series">("cross-section");
  const [latencyDataMode, setLatencyDataMode] = React.useState<"live" | "batch" | "compare">("live");

  const [orderFlowRange, setOrderFlowRange] = React.useState<"1d" | "1w" | "1m">("1d");
  const [orderFlowView, setOrderFlowView] = React.useState<"orders" | "book" | "own">("orders");
  const [assetClass, setAssetClass] = React.useState<MarketsAssetClass>("crypto");
  const [bookDepth, setBookDepth] = React.useState(5);

  const orderFlowData = React.useMemo(
    () => generateOrderFlowData(orderFlowRange, assetClass),
    [orderFlowRange, assetClass],
  );

  // Batch mode: disable live book updates (empty array, no ticking)
  // Paper mode: add slight delay simulation by taking a snapshot (no live ticking)
  const liveBookUpdates = React.useMemo(() => {
    if (isBatch) return [];
    return generateLiveBookUpdates(orderFlowRange, assetClass, bookDepth);
  }, [orderFlowRange, assetClass, bookDepth, isBatch]);

  const ownOrders = React.useMemo(() => {
    let own = orderFlowData.filter((o) => o.isOwn);
    // When scope is narrowed, reduce own orders deterministically based on scope
    if (scopeStrategyIds.length > 0) {
      own = own.filter((_, i) => i % Math.max(1, Math.ceil(own.length / Math.max(scopeStrategyIds.length, 3))) === 0);
    }
    return own;
  }, [orderFlowData, scopeStrategyIds]);

  const refetch = React.useCallback(() => {}, []);

  const value = React.useMemo(
    (): MarketsDataContextValue => ({
      orderFlowData,
      liveBookUpdates,
      ownOrders,
      orderFlowRange,
      setOrderFlowRange,
      orderFlowView,
      setOrderFlowView,
      assetClass,
      setAssetClass,
      bookDepth,
      setBookDepth,
      reconRuns: MOCK_RECON_RUNS,
      latencyMetrics: MOCK_LATENCY_METRICS,
      selectedLatencyService,
      setSelectedLatencyService,
      latencyViewMode,
      setLatencyViewMode,
      latencyDataMode,
      setLatencyDataMode,
      viewMode,
      setViewMode,
      dataMode,
      setDataMode,
      dateRange,
      setDateRange,
      isLoading: false,
      isError: false,
      refetch,
      mode,
    }),
    [
      orderFlowData,
      liveBookUpdates,
      ownOrders,
      orderFlowRange,
      orderFlowView,
      assetClass,
      bookDepth,
      selectedLatencyService,
      latencyViewMode,
      latencyDataMode,
      viewMode,
      dataMode,
      dateRange,
      isPaper,
      isBatch,
      mode,
      refetch,
    ],
  );

  return <MarketsDataContext.Provider value={value}>{children}</MarketsDataContext.Provider>;
}

export function useMarketsData(): MarketsDataContextValue {
  const ctx = React.useContext(MarketsDataContext);
  if (!ctx) throw new Error("useMarketsData must be used within MarketsDataProvider");
  return ctx;
}

export type { OrderFlowEntry, LiveBookUpdate, ReconRun, LatencyMetric };
