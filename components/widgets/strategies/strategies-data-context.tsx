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
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { getStrategyIdsForScope, getClientIdsForOrgs } from "@/lib/stores/scope-helpers";
import { getStrategiesForScope, type SeedStrategy } from "@/lib/mock-data";
import { CLIENTS } from "@/lib/trading-data";

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
  const { scope: globalScope } = useGlobalScope();

  const rawPayload =
    (perfData as Record<string, unknown> | undefined)?.data ??
    (perfData as Record<string, unknown> | undefined)?.strategies;
  const perfRaw: unknown[] = Array.isArray(rawPayload) ? rawPayload : [];
  const allStrategies: Strategy[] = React.useMemo(() => {
    if (perfRaw.length > 0) return perfRaw as Strategy[];
    // Merge registry strategies with seed data for richer org/client info
    const seedStrats = getStrategiesForScope(
      globalScope.organizationIds,
      globalScope.clientIds,
      globalScope.strategyIds,
    );
    if (seedStrats.length > 0 && (globalScope.organizationIds.length > 0 || globalScope.clientIds.length > 0 || globalScope.strategyIds.length > 0)) {
      // When scope filters are active, use seed data which has org/client/strategy relationships
      return seedStrats.map((s: SeedStrategy) => {
        const existing = DEFAULT_STRATEGIES.find((d) => d.id === s.id);
        if (existing) return { ...existing, clientId: s.clientId };
        return {
          id: s.id,
          name: s.name,
          description: `${s.archetype} strategy`,
          archetype: s.archetype,
          assetClass: s.archetype.includes("defi") || s.archetype.includes("yield") ? "DeFi" : s.archetype.includes("sport") ? "Sports" : "Crypto",
          status: s.status,
          venues: [],
          sharpe: s.sharpe,
          mtdReturn: s.mtdReturn,
          aum: s.aum,
          clientId: s.clientId,
          pnl: 0,
          maxDrawdown: 0,
        } as Strategy;
      });
    }
    return DEFAULT_STRATEGIES;
  }, [perfRaw, globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);

  // Apply global scope filtering: org -> client -> strategy cascade
  const scopeStrategyIds = React.useMemo(() => getStrategyIdsForScope({ organizationIds: globalScope.organizationIds, clientIds: globalScope.clientIds, strategyIds: globalScope.strategyIds }), [globalScope.organizationIds, globalScope.clientIds, globalScope.strategyIds]);
  const scopeClientIds = React.useMemo(() => {
    if (globalScope.clientIds.length > 0) return globalScope.clientIds;
    if (globalScope.organizationIds.length > 0) return getClientIdsForOrgs(globalScope.organizationIds);
    return [];
  }, [globalScope.organizationIds, globalScope.clientIds]);

  const strategies: Strategy[] = React.useMemo(() => {
    let result = allStrategies;
    if (scopeStrategyIds.length > 0) {
      result = result.filter((s) => scopeStrategyIds.includes(s.id));
    } else if (scopeClientIds.length > 0) {
      result = result.filter((s) => scopeClientIds.includes(s.clientId));
    }
    return result;
  }, [allStrategies, scopeStrategyIds, scopeClientIds]);

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
