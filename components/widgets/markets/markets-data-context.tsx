"use client";

import * as React from "react";
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
}

const MarketsDataContext = React.createContext<MarketsDataContextValue | null>(null);

export function MarketsDataProvider({ children }: { children: React.ReactNode }) {
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

  const liveBookUpdates = React.useMemo(
    () => generateLiveBookUpdates(orderFlowRange, assetClass, bookDepth),
    [orderFlowRange, assetClass, bookDepth],
  );

  const ownOrders = React.useMemo(() => orderFlowData.filter((o) => o.isOwn), [orderFlowData]);

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
