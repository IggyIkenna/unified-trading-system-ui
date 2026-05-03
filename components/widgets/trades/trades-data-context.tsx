"use client";

import { getTradesForPosition, getTradesForScope } from "@/lib/mocks/fixtures/mock-data-index";
import type { SeedTrade } from "@/lib/mocks/fixtures/mock-data-seed";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { useSearchParams } from "next/navigation";
import * as React from "react";

export type TradeSide = "all" | "buy" | "sell";
export type TradeType = "all" | SeedTrade["tradeType"];
export type TradeStatus = "all" | SeedTrade["status"];
export type { SeedTrade as TradeRecord };

interface TradesContextValue {
  trades: SeedTrade[];
  filteredTrades: SeedTrade[];
  isLoading: boolean;

  positionIdFilter: string;
  setPositionIdFilter: (id: string) => void;
  sideFilter: TradeSide;
  setSideFilter: (s: TradeSide) => void;
  typeFilter: TradeType;
  setTypeFilter: (t: TradeType) => void;
  statusFilter: TradeStatus;
  setStatusFilter: (s: TradeStatus) => void;
  venueFilter: string;
  setVenueFilter: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;

  uniqueVenues: string[];
  activeFilterCount: number;
}

const TradesDataContext = React.createContext<TradesContextValue | null>(null);

export function TradesDataProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const urlPositionId = searchParams.get("position_id") ?? "";
  const scope = useWorkspaceScope();

  const [positionIdFilter, setPositionIdFilter] = React.useState(urlPositionId);
  const [sideFilter, setSideFilter] = React.useState<TradeSide>("all");
  const [typeFilter, setTypeFilter] = React.useState<TradeType>("all");
  const [statusFilter, setStatusFilter] = React.useState<TradeStatus>("all");
  const [venueFilter, setVenueFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Stay in sync when positions table pushes ?position_id= into the URL
  React.useEffect(() => {
    setPositionIdFilter(urlPositionId);
  }, [urlPositionId]);

  const trades = React.useMemo(
    () => getTradesForScope(scope.organizationIds, scope.clientIds, scope.strategyIds),
    [scope.organizationIds, scope.clientIds, scope.strategyIds],
  );

  const filteredTrades = React.useMemo(() => {
    let rows = positionIdFilter ? getTradesForPosition(positionIdFilter) : trades;
    if (sideFilter !== "all") rows = rows.filter((t) => t.side === sideFilter);
    if (typeFilter !== "all") rows = rows.filter((t) => t.tradeType === typeFilter);
    if (statusFilter !== "all") rows = rows.filter((t) => t.status === statusFilter);
    if (venueFilter !== "all") rows = rows.filter((t) => t.venue === venueFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.instrument.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.counterparty.toLowerCase().includes(q) ||
          t.venue.toLowerCase().includes(q),
      );
    }
    return [...rows].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [trades, positionIdFilter, sideFilter, typeFilter, statusFilter, venueFilter, searchQuery]);

  const uniqueVenues = React.useMemo(() => [...new Set(trades.map((t) => t.venue))].sort(), [trades]);

  const activeFilterCount = [
    positionIdFilter,
    sideFilter !== "all" ? sideFilter : "",
    typeFilter !== "all" ? typeFilter : "",
    statusFilter !== "all" ? statusFilter : "",
    venueFilter !== "all" ? venueFilter : "",
    searchQuery,
  ].filter(Boolean).length;

  const resetFilters = React.useCallback(() => {
    setPositionIdFilter("");
    setSideFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setVenueFilter("all");
    setSearchQuery("");
  }, []);

  const value = React.useMemo<TradesContextValue>(
    () => ({
      trades,
      filteredTrades,
      isLoading: false,
      positionIdFilter,
      setPositionIdFilter,
      sideFilter,
      setSideFilter,
      typeFilter,
      setTypeFilter,
      statusFilter,
      setStatusFilter,
      venueFilter,
      setVenueFilter,
      searchQuery,
      setSearchQuery,
      resetFilters,
      uniqueVenues,
      activeFilterCount,
    }),
    [
      trades,
      filteredTrades,
      positionIdFilter,
      sideFilter,
      typeFilter,
      statusFilter,
      venueFilter,
      searchQuery,
      resetFilters,
      uniqueVenues,
      activeFilterCount,
    ],
  );

  return <TradesDataContext.Provider value={value}>{children}</TradesDataContext.Provider>;
}

export function useTradesData(): TradesContextValue {
  const ctx = React.useContext(TradesDataContext);
  if (!ctx) throw new Error("useTradesData must be used within TradesDataProvider");
  return ctx;
}
