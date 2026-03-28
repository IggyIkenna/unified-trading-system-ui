"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { usePositions, useBalances } from "@/hooks/api/use-positions";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import type { FilterDefinition } from "@/components/platform/filter-bar";

const DEFI_VENUES = new Set(["AAVE_V3", "COMPOUND_V3", "AAVE", "COMPOUND", "MORPHO", "EULER"]);

type InstrumentType = "All" | "Spot" | "Perp" | "Futures" | "Options" | "DeFi" | "Prediction";

const INSTRUMENT_TYPES: InstrumentType[] = ["All", "Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"];

function classifyInstrument(instrument: string): Exclude<InstrumentType, "All"> {
  const upper = instrument.toUpperCase();
  if (/\d+-[CP]$/.test(upper) || upper.includes("OPTIONS")) return "Options";
  if (upper.includes("PERPETUAL") || upper.includes("PERP")) return "Perp";
  if (/^[A-Z]+-\d{1,2}[A-Z]{3}\d{2,4}$/.test(upper)) return "Futures";
  if (
    upper.includes("AAVE") ||
    upper.includes("UNISWAP") ||
    upper.includes("LIDO") ||
    upper.includes("WALLET:") ||
    upper.includes("MORPHO")
  )
    return "DeFi";
  if (
    upper.includes("BETFAIR") ||
    upper.includes("POLYMARKET") ||
    upper.includes("KALSHI") ||
    upper.includes("NBA:") ||
    upper.includes("NFL:") ||
    upper.includes("EPL:") ||
    upper.includes("LALIGA:")
  )
    return "Prediction";
  return "Spot";
}

function getInstrumentRoute(instrument: string, type: Exclude<InstrumentType, "All">): string {
  const asset = instrument.split("-")[0].split(":")[0].toUpperCase();
  switch (type) {
    case "Spot":
    case "Perp":
      return "/services/trading/terminal";
    case "Options":
      return `/services/trading/options?tab=chain&asset=${asset}`;
    case "Futures":
      return `/services/trading/options?tab=futures&asset=${asset}`;
    case "DeFi":
      return "/services/trading/defi";
    case "Prediction":
      return "/services/trading/sports";
  }
}

interface PositionRecord {
  id: string;
  strategy_id: string;
  strategy_name: string;
  instrument: string;
  side: "LONG" | "SHORT";
  quantity: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_pct: number;
  unrealized_pnl?: number;
  venue: string;
  margin: number;
  leverage: number;
  updated_at: string;
  health_factor?: number;
}

interface BalanceRecord {
  venue: string;
  free: number;
  locked: number;
  total: number;
}

interface PositionsSummary {
  totalPositions: number;
  totalNotional: number;
  unrealizedPnL: number;
  totalMargin: number;
  longExposure: number;
  shortExposure: number;
}

interface PositionsDataContextValue {
  positions: PositionRecord[];
  balances: BalanceRecord[];
  isLoading: boolean;
  balancesLoading: boolean;
  positionsError: Error | null;
  refetchPositions: () => void;

  filteredPositions: PositionRecord[];
  summary: PositionsSummary;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  sideFilter: "all" | "LONG" | "SHORT";
  setSideFilter: (s: "all" | "LONG" | "SHORT") => void;
  strategyFilter: string;
  setStrategyFilter: (s: string) => void;
  instrumentTypeFilter: InstrumentType;
  setInstrumentTypeFilter: (t: InstrumentType) => void;
  resetFilters: () => void;

  uniqueVenues: string[];
  uniqueStrategies: [string, string][];
  filterDefs: FilterDefinition[];
  filterValues: Record<string, unknown>;
  handleFilterChange: (key: string, value: unknown) => void;

  instrumentTypes: InstrumentType[];
  isLive: boolean;

  classifyInstrument: (instrument: string) => Exclude<InstrumentType, "All">;
  getInstrumentRoute: (instrument: string, type: Exclude<InstrumentType, "All">) => string;
  isDeFiVenue: (venue: string) => boolean;
}

const PositionsDataContext = React.createContext<PositionsDataContextValue | null>(null);

export function PositionsDataProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const strategyIdFilter = searchParams.get("strategy_id");
  const { scope: globalScope } = useGlobalScope();
  const { isLive } = useExecutionMode();

  const {
    data: positionsRaw,
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions,
  } = usePositions();
  const { data: balancesRaw, isLoading: balancesLoading } = useBalances();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("all");
  const [sideFilter, setSideFilter] = React.useState<"all" | "LONG" | "SHORT">("all");
  const [strategyFilter, setStrategyFilter] = React.useState(strategyIdFilter || "all");
  const [instrumentTypeFilter, setInstrumentTypeFilter] = React.useState<InstrumentType>("All");

  const queryClient = useQueryClient();
  const handleWsMessage = React.useCallback(
    (msg: Record<string, unknown>) => {
      if (msg.channel === "positions" && msg.type === "pnl_update") {
        const updatedPositions = (msg.data as Record<string, unknown>)?.positions as PositionRecord[] | undefined;
        if (updatedPositions) {
          queryClient.setQueryData(["positions", undefined], (old: unknown) => {
            if (!old) return old;
            const oldData = old as Record<string, unknown>;
            const oldPositions = (oldData.positions ?? oldData) as PositionRecord[];
            if (!Array.isArray(oldPositions)) return old;
            const updateMap = new Map(updatedPositions.map((p) => [p.instrument + p.venue, p]));
            const merged = oldPositions.map((p) => {
              const update = updateMap.get(p.instrument + p.venue);
              if (update) {
                return { ...p, unrealized_pnl: update.unrealized_pnl, current_price: update.current_price };
              }
              return p;
            });
            return { ...oldData, positions: merged };
          });
        }
      }
    },
    [queryClient],
  );

  useWebSocket({ url: "ws://localhost:8030/ws", enabled: isLive, onMessage: handleWsMessage });

  React.useEffect(() => {
    if (strategyIdFilter) setStrategyFilter(strategyIdFilter);
  }, [strategyIdFilter]);

  const scopeStrategyIds = React.useMemo(() => getStrategyIdsForScope({ organizationIds: globalScope.organizationIds, clientIds: globalScope.clientIds, strategyIds: globalScope.strategyIds }), [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);

  const positions: PositionRecord[] = React.useMemo(() => {
    if (!positionsRaw) return [];
    const raw = positionsRaw as Record<string, unknown>;
    const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).positions;
    let result = Array.isArray(arr) ? (arr as PositionRecord[]) : [];
    if (scopeStrategyIds.length > 0) {
      result = result.filter((p) => scopeStrategyIds.includes(p.strategy_id));
    }
    return result;
  }, [positionsRaw, scopeStrategyIds]);

  const balances: BalanceRecord[] = React.useMemo(() => {
    if (!balancesRaw) return [];
    const raw = balancesRaw as Record<string, unknown>;
    const arr = Array.isArray(raw) ? raw : (raw as Record<string, unknown>).balances;
    return Array.isArray(arr) ? (arr as BalanceRecord[]) : [];
  }, [balancesRaw]);

  const filteredPositions = React.useMemo(() => {
    let result = positions;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.strategy_name.toLowerCase().includes(query) ||
          p.instrument.toLowerCase().includes(query) ||
          p.venue.toLowerCase().includes(query),
      );
    }
    if (strategyFilter !== "all") result = result.filter((p) => p.strategy_id === strategyFilter);
    if (venueFilter !== "all") result = result.filter((p) => p.venue === venueFilter);
    if (sideFilter !== "all") result = result.filter((p) => p.side === sideFilter);
    if (instrumentTypeFilter !== "All") {
      result = result.filter((p) => classifyInstrument(p.instrument) === instrumentTypeFilter);
    }
    return result;
  }, [positions, searchQuery, strategyFilter, venueFilter, sideFilter, instrumentTypeFilter]);

  const summary: PositionsSummary = React.useMemo(
    () => ({
      totalPositions: filteredPositions.length,
      totalNotional: filteredPositions.reduce((sum, p) => sum + Math.abs(p.quantity * p.current_price), 0),
      unrealizedPnL: filteredPositions.reduce((sum, p) => sum + p.pnl, 0),
      totalMargin: filteredPositions.reduce((sum, p) => sum + p.margin, 0),
      longExposure: filteredPositions
        .filter((p) => p.side === "LONG")
        .reduce((sum, p) => sum + Math.abs(p.quantity * p.current_price), 0),
      shortExposure: filteredPositions
        .filter((p) => p.side === "SHORT")
        .reduce((sum, p) => sum + Math.abs(p.quantity * p.current_price), 0),
    }),
    [filteredPositions],
  );

  const uniqueVenues = React.useMemo(() => [...new Set(positions.map((p) => p.venue))].sort(), [positions]);

  const uniqueStrategies = React.useMemo(() => {
    const map = new Map<string, string>();
    positions.forEach((p) => map.set(p.strategy_id, p.strategy_name));
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1])) as [string, string][];
  }, [positions]);

  const filterDefs: FilterDefinition[] = React.useMemo(
    () => [
      { key: "search", label: "Search", type: "search" as const, placeholder: "Search positions..." },
      {
        key: "strategy",
        label: "Strategy",
        type: "select" as const,
        options: uniqueStrategies.map(([id, name]) => ({ value: id, label: name })),
      },
      {
        key: "venue",
        label: "Venue",
        type: "select" as const,
        options: uniqueVenues.map((v) => ({ value: v, label: v })),
      },
      {
        key: "side",
        label: "Side",
        type: "select" as const,
        options: [
          { value: "LONG", label: "Long" },
          { value: "SHORT", label: "Short" },
        ],
      },
    ],
    [uniqueVenues, uniqueStrategies],
  );

  const filterValues = React.useMemo(
    () => ({
      search: searchQuery || undefined,
      strategy: strategyFilter !== "all" ? strategyFilter : undefined,
      venue: venueFilter !== "all" ? venueFilter : undefined,
      side: sideFilter !== "all" ? sideFilter : undefined,
    }),
    [searchQuery, strategyFilter, venueFilter, sideFilter],
  );

  const handleFilterChange = React.useCallback((key: string, value: unknown) => {
    switch (key) {
      case "search":
        setSearchQuery((value as string) || "");
        break;
      case "strategy":
        setStrategyFilter((value as string) || "all");
        break;
      case "venue":
        setVenueFilter((value as string) || "all");
        break;
      case "side":
        setSideFilter(((value as string) || "all") as "all" | "LONG" | "SHORT");
        break;
    }
  }, []);

  const resetFilters = React.useCallback(() => {
    setSearchQuery("");
    setStrategyFilter("all");
    setVenueFilter("all");
    setSideFilter("all");
    setInstrumentTypeFilter("All");
  }, []);

  const isDeFiVenue = React.useCallback((venue: string) => DEFI_VENUES.has(venue), []);

  const value: PositionsDataContextValue = React.useMemo(
    () => ({
      positions,
      balances,
      isLoading: positionsLoading,
      balancesLoading,
      positionsError: positionsError as Error | null,
      refetchPositions,
      filteredPositions,
      summary,
      searchQuery,
      setSearchQuery,
      venueFilter,
      setVenueFilter,
      sideFilter,
      setSideFilter,
      strategyFilter,
      setStrategyFilter,
      instrumentTypeFilter,
      setInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      instrumentTypes: INSTRUMENT_TYPES,
      isLive,
      classifyInstrument,
      getInstrumentRoute,
      isDeFiVenue,
    }),
    [
      positions,
      balances,
      positionsLoading,
      balancesLoading,
      positionsError,
      refetchPositions,
      filteredPositions,
      summary,
      searchQuery,
      venueFilter,
      sideFilter,
      strategyFilter,
      instrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      isLive,
      isDeFiVenue,
    ],
  );

  return <PositionsDataContext.Provider value={value}>{children}</PositionsDataContext.Provider>;
}

export function usePositionsData(): PositionsDataContextValue {
  const ctx = React.useContext(PositionsDataContext);
  if (!ctx) throw new Error("usePositionsData must be used within PositionsDataProvider");
  return ctx;
}

export type { PositionRecord, BalanceRecord, InstrumentType, PositionsSummary };
