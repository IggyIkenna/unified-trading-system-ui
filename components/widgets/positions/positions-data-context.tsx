"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { usePositions } from "@/hooks/api/use-positions";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getPositionsForScope } from "@/lib/mocks/fixtures/mock-data-index";
import { getStrategyIdsForScope } from "@/lib/stores/scope-helpers";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useWebSocket } from "@/hooks/use-websocket";
import { useQueryClient } from "@tanstack/react-query";
import type { FilterDefinition } from "@/components/shared/filter-bar";

export type InstrumentType = "All" | "Spot" | "Perp" | "Futures" | "Options" | "DeFi" | "Prediction";

type AssetClassFilter = Exclude<InstrumentType, "All">;

const ASSET_CLASS_OPTIONS: AssetClassFilter[] = ["Spot", "Perp", "Futures", "Options", "DeFi", "Prediction"];

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function classifyInstrument(instrument: string): AssetClassFilter {
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

function getInstrumentRoute(instrument: string, type: AssetClassFilter): string {
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
  /** Total unrealized P&L since entry */
  net_pnl: number;
  net_pnl_pct: number;
  /** Today's slice of unrealized P&L (mock / derived) */
  today_pnl: number;
  today_pnl_pct: number;
  unrealized_pnl?: number;
  venue: string;
  margin: number;
  leverage: number;
  updated_at: string;
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
  isLoading: boolean;
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
  instrumentTypeFilters: AssetClassFilter[];
  setInstrumentTypeFilters: React.Dispatch<React.SetStateAction<AssetClassFilter[]>>;
  toggleInstrumentTypeFilter: (t: AssetClassFilter) => void;
  resetFilters: () => void;

  uniqueVenues: string[];
  uniqueStrategies: [string, string][];
  filterDefs: FilterDefinition[];
  filterValues: Record<string, unknown>;
  handleFilterChange: (key: string, value: unknown) => void;

  assetClassOptions: AssetClassFilter[];
  isLive: boolean;

  classifyInstrument: (instrument: string) => AssetClassFilter;
  getInstrumentRoute: (instrument: string, type: AssetClassFilter) => string;
}

const PositionsDataContext = React.createContext<PositionsDataContextValue | null>(null);

function mapRawRowToPosition(row: Record<string, unknown>): PositionRecord {
  const id = String(row.id ?? "");
  const entry = Number(row.entry_price ?? 0);
  const current = Number(row.current_price ?? 0);
  const netPnl = Number(row.net_pnl ?? row.pnl ?? row.unrealized_pnl ?? 0);
  const netPct =
    row.net_pnl_pct != null
      ? Number(row.net_pnl_pct)
      : row.pnl_pct != null
        ? Number(row.pnl_pct)
        : entry > 0
          ? ((current - entry) / entry) * 100
          : 0;
  const h = hashId(id);
  const dailyFrac = 0.1 + (h % 21) / 100;
  const todayPnl = row.today_pnl != null ? Number(row.today_pnl) : Math.round(netPnl * dailyFrac * 100) / 100;
  const qty = Number(row.quantity ?? 0);
  const todayPct =
    row.today_pnl_pct != null
      ? Number(row.today_pnl_pct)
      : entry > 0 && Math.abs(qty) > 0
        ? (todayPnl / (Math.abs(qty) * entry)) * 100
        : dailyFrac * netPct;

  return {
    id,
    strategy_id: String(row.strategy_id ?? ""),
    strategy_name: String(row.strategy_name ?? ""),
    instrument: String(row.instrument ?? ""),
    side: (String(row.side ?? "LONG").toUpperCase() === "SHORT" ? "SHORT" : "LONG") as "LONG" | "SHORT",
    quantity: qty,
    entry_price: entry,
    current_price: current,
    net_pnl: netPnl,
    net_pnl_pct: netPct,
    today_pnl: todayPnl,
    today_pnl_pct: todayPct,
    unrealized_pnl: row.unrealized_pnl != null ? Number(row.unrealized_pnl) : netPnl,
    venue: String(row.venue ?? ""),
    margin: Number(row.margin ?? 0),
    leverage: Number(row.leverage ?? 0),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
  };
}

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

  const [searchQuery, setSearchQuery] = React.useState("");
  const [venueFilter, setVenueFilter] = React.useState("all");
  const [sideFilter, setSideFilter] = React.useState<"all" | "LONG" | "SHORT">("all");
  const [strategyFilter, setStrategyFilter] = React.useState(strategyIdFilter || "all");
  const [instrumentTypeFilters, setInstrumentTypeFilters] = React.useState<AssetClassFilter[]>([]);

  const queryClient = useQueryClient();
  const handleWsMessage = React.useCallback(
    (msg: Record<string, unknown>) => {
      if (msg.channel === "positions" && msg.type === "pnl_update") {
        const updatedPositions = (msg.data as Record<string, unknown>)?.positions as
          | Record<string, unknown>[]
          | undefined;
        if (updatedPositions) {
          queryClient.setQueryData(["positions", undefined], (old: unknown) => {
            if (!old) return old;
            const oldData = old as Record<string, unknown>;
            const oldPositions = (oldData.positions ?? oldData) as Record<string, unknown>[];
            if (!Array.isArray(oldPositions)) return old;
            const updateMap = new Map(
              updatedPositions.map((p) => [
                String((p as Record<string, unknown>).instrument) + String((p as Record<string, unknown>).venue),
                p,
              ]),
            );
            const merged = oldPositions.map((p) => {
              const row = p as Record<string, unknown>;
              const update = updateMap.get(String(row.instrument) + String(row.venue));
              if (update) {
                const u = update as Record<string, unknown>;
                return {
                  ...row,
                  unrealized_pnl: u.unrealized_pnl,
                  current_price: u.current_price,
                  net_pnl: u.net_pnl ?? u.unrealized_pnl ?? row.net_pnl,
                };
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

  const scopeStrategyIds = React.useMemo(
    () =>
      getStrategyIdsForScope({
        organizationIds: globalScope.organizationIds,
        clientIds: globalScope.clientIds,
        strategyIds: globalScope.strategyIds,
      }),
    [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds],
  );

  const positions: PositionRecord[] = React.useMemo(() => {
    const raw = positionsRaw as Record<string, unknown> | undefined;
    const arr = raw ? (Array.isArray(raw) ? raw : (raw as Record<string, unknown>).positions) : undefined;
    let result: PositionRecord[] = [];

    if (Array.isArray(arr) && arr.length > 0) {
      result = (arr as Record<string, unknown>[]).map((row) => mapRawRowToPosition(row));
    } else {
      const seed = getPositionsForScope(globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds);
      result = seed.map((s) => {
        const netPnl = s.unrealisedPnl;
        const netPct = s.entryPrice > 0 ? ((s.currentPrice - s.entryPrice) / s.entryPrice) * 100 : 0;
        const h = hashId(s.id);
        const dailyFrac = 0.1 + (h % 21) / 100;
        const todayPnl = Math.round(netPnl * dailyFrac * 100) / 100;
        const todayPct =
          s.entryPrice > 0 && Math.abs(s.quantity) > 0
            ? (todayPnl / (Math.abs(s.quantity) * s.entryPrice)) * 100
            : dailyFrac * netPct;
        return {
          id: s.id,
          strategy_id: s.strategyId,
          strategy_name: s.strategyName,
          instrument: s.instrument,
          side: s.side.toUpperCase() as "LONG" | "SHORT",
          quantity: s.quantity,
          entry_price: s.entryPrice,
          current_price: s.currentPrice,
          net_pnl: netPnl,
          net_pnl_pct: netPct,
          today_pnl: todayPnl,
          today_pnl_pct: todayPct,
          unrealized_pnl: netPnl,
          venue: s.venue,
          margin: Math.abs(s.quantity * s.entryPrice * 0.1),
          leverage: 10,
          updated_at: new Date().toISOString(),
        };
      });
    }

    if (scopeStrategyIds.length > 0) {
      result = result.filter((p) => scopeStrategyIds.includes(p.strategy_id));
    }
    return result;
  }, [positionsRaw, scopeStrategyIds, globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);

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
    if (instrumentTypeFilters.length > 0) {
      result = result.filter((p) => instrumentTypeFilters.includes(classifyInstrument(p.instrument)));
    }
    return result;
  }, [positions, searchQuery, strategyFilter, venueFilter, sideFilter, instrumentTypeFilters]);

  const summary: PositionsSummary = React.useMemo(
    () => ({
      totalPositions: filteredPositions.length,
      totalNotional: filteredPositions.reduce((sum, p) => sum + Math.abs(p.quantity * p.current_price), 0),
      unrealizedPnL: filteredPositions.reduce((sum, p) => sum + p.net_pnl, 0),
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

  const toggleInstrumentTypeFilter = React.useCallback((t: AssetClassFilter) => {
    setInstrumentTypeFilters((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }, []);

  const resetFilters = React.useCallback(() => {
    setSearchQuery("");
    setStrategyFilter("all");
    setVenueFilter("all");
    setSideFilter("all");
    setInstrumentTypeFilters([]);
  }, []);

  const value: PositionsDataContextValue = React.useMemo(
    () => ({
      positions,
      isLoading: positionsLoading,
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
      instrumentTypeFilters,
      setInstrumentTypeFilters,
      toggleInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      assetClassOptions: ASSET_CLASS_OPTIONS,
      isLive,
      classifyInstrument,
      getInstrumentRoute,
    }),
    [
      positions,
      positionsLoading,
      positionsError,
      refetchPositions,
      filteredPositions,
      summary,
      searchQuery,
      venueFilter,
      sideFilter,
      strategyFilter,
      instrumentTypeFilters,
      toggleInstrumentTypeFilter,
      resetFilters,
      uniqueVenues,
      uniqueStrategies,
      filterDefs,
      filterValues,
      handleFilterChange,
      isLive,
    ],
  );

  return <PositionsDataContext.Provider value={value}>{children}</PositionsDataContext.Provider>;
}

export function usePositionsData(): PositionsDataContextValue {
  const ctx = React.useContext(PositionsDataContext);
  if (!ctx) throw new Error("usePositionsData must be used within PositionsDataProvider");
  return ctx;
}

export type { PositionRecord, PositionsSummary, AssetClassFilter };
