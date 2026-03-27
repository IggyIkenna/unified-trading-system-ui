"use client";

import * as React from "react";
import {
  STRATEGIES as DEFAULT_STRATEGIES,
  type Strategy,
  getTotalAUM,
  getTotalPnL,
  getTotalMTDPnL,
} from "@/lib/strategy-registry";
import { useStrategyPerformance } from "@/hooks/api/use-strategies";
import { useExecutionMode } from "@/lib/execution-mode-context";

export interface StrategiesData {
  strategies: Strategy[];
  filteredStrategies: Strategy[];
  groupedStrategies: Record<string, Strategy[]>;
  isLoading: boolean;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedAssetClasses: string[];
  toggleAssetClass: (ac: string) => void;
  selectedArchetypes: string[];
  toggleArchetype: (arch: string) => void;
  selectedStatuses: string[];
  toggleStatus: (status: string) => void;
  hasFilters: boolean;
  clearFilters: () => void;

  totalAUM: number;
  totalPnL: number;
  totalMTDPnL: number;
  activeCount: number;

  isLive: boolean;
  mode: string;
}

const StrategiesDataContext = React.createContext<StrategiesData | null>(null);

export function StrategiesDataProvider({ children }: { children: React.ReactNode }) {
  const { mode, isLive } = useExecutionMode();
  const { data: perfData, isLoading } = useStrategyPerformance();

  const rawPayload =
    (perfData as Record<string, unknown> | undefined)?.data ??
    (perfData as Record<string, unknown> | undefined)?.strategies;
  const perfRaw: unknown[] = Array.isArray(rawPayload) ? rawPayload : [];
  const strategies: Strategy[] = perfRaw.length > 0 ? (perfRaw as Strategy[]) : DEFAULT_STRATEGIES;

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedAssetClasses, setSelectedAssetClasses] = React.useState<string[]>([]);
  const [selectedArchetypes, setSelectedArchetypes] = React.useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);

  const filteredStrategies = React.useMemo(() => {
    let result = strategies;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.venues.some((v) => v.toLowerCase().includes(query)),
      );
    }

    if (selectedAssetClasses.length > 0) {
      result = result.filter((s) => selectedAssetClasses.includes(s.assetClass));
    }

    if (selectedArchetypes.length > 0) {
      result = result.filter((s) => selectedArchetypes.includes(s.archetype));
    }

    if (selectedStatuses.length > 0) {
      result = result.filter((s) => selectedStatuses.includes(s.status));
    }

    return result;
  }, [strategies, searchQuery, selectedAssetClasses, selectedArchetypes, selectedStatuses]);

  const groupedStrategies = React.useMemo(() => {
    const groups: Record<string, Strategy[]> = {};
    filteredStrategies.forEach((s) => {
      if (!groups[s.assetClass]) groups[s.assetClass] = [];
      groups[s.assetClass].push(s);
    });
    return groups;
  }, [filteredStrategies]);

  const hasFilters = selectedAssetClasses.length > 0 || selectedArchetypes.length > 0 || selectedStatuses.length > 0;

  const clearFilters = React.useCallback(() => {
    setSelectedAssetClasses([]);
    setSelectedArchetypes([]);
    setSelectedStatuses([]);
  }, []);

  const toggleAssetClass = React.useCallback((ac: string) => {
    setSelectedAssetClasses((prev) => (prev.includes(ac) ? prev.filter((x) => x !== ac) : [...prev, ac]));
  }, []);

  const toggleArchetype = React.useCallback((arch: string) => {
    setSelectedArchetypes((prev) => (prev.includes(arch) ? prev.filter((x) => x !== arch) : [...prev, arch]));
  }, []);

  const toggleStatus = React.useCallback((status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((x) => x !== status) : [...prev, status]));
  }, []);

  const totalAUM = React.useMemo(() => getTotalAUM(strategies), [strategies]);
  const totalPnL = React.useMemo(() => getTotalPnL(strategies), [strategies]);
  const totalMTDPnL = React.useMemo(() => getTotalMTDPnL(strategies), [strategies]);
  const activeCount = React.useMemo(() => strategies.filter((s) => s.status === "live").length, [strategies]);

  const value = React.useMemo(
    () => ({
      strategies,
      filteredStrategies,
      groupedStrategies,
      isLoading,
      searchQuery,
      setSearchQuery,
      selectedAssetClasses,
      toggleAssetClass,
      selectedArchetypes,
      toggleArchetype,
      selectedStatuses,
      toggleStatus,
      hasFilters,
      clearFilters,
      totalAUM,
      totalPnL,
      totalMTDPnL,
      activeCount,
      isLive,
      mode,
    }),
    [
      strategies,
      filteredStrategies,
      groupedStrategies,
      isLoading,
      searchQuery,
      selectedAssetClasses,
      selectedArchetypes,
      selectedStatuses,
      hasFilters,
      clearFilters,
      toggleAssetClass,
      toggleArchetype,
      toggleStatus,
      totalAUM,
      totalPnL,
      totalMTDPnL,
      activeCount,
      isLive,
      mode,
    ],
  );

  return <StrategiesDataContext.Provider value={value}>{children}</StrategiesDataContext.Provider>;
}

export function useStrategiesData(): StrategiesData {
  const ctx = React.useContext(StrategiesDataContext);
  if (!ctx) throw new Error("useStrategiesData must be used within StrategiesDataProvider");
  return ctx;
}
