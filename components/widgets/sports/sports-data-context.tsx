"use client";

import * as React from "react";
import { useExecutionMode } from "@/lib/execution-mode-context";
import { useGlobalScope } from "@/lib/stores/global-scope-store";
import { CLIENTS } from "@/lib/trading-data";
import type { Bet, Fixture, FootballLeague } from "@/components/trading/sports/types";
import { MOCK_FIXTURES, MOCK_BETS } from "@/components/trading/sports/mock-data";
import { DEFAULT_ARB_THRESHOLD } from "@/components/trading/sports/mock-fixtures";
import { isLive, isCompleted, isUpcoming } from "@/components/trading/sports/helpers";

export type SportsDateRange = "today" | "week" | "all";
export type SportsStatusFilter = "all" | "live" | "upcoming" | "completed";

export interface GlobalFilters {
  leagues: FootballLeague[];
  dateRange: SportsDateRange;
  statusFilter: SportsStatusFilter;
  search: string;
}

export type SportsWorkspaceTab = "fixtures" | "arb" | "my-bets";

function applyFilters(fixtures: Fixture[], filters: GlobalFilters): Fixture[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return fixtures.filter((f) => {
    if (filters.leagues.length > 0 && !filters.leagues.includes(f.league)) return false;

    if (filters.statusFilter === "live" && !isLive(f.status) && f.status !== "HT" && f.status !== "SUSP") return false;
    if (filters.statusFilter === "upcoming" && !isUpcoming(f.status)) return false;
    if (filters.statusFilter === "completed" && !isCompleted(f.status)) return false;

    if (filters.dateRange !== "all") {
      const kickoff = new Date(f.kickoff);
      if (
        filters.dateRange === "today" &&
        (kickoff < today || kickoff > new Date(today.getTime() + 24 * 60 * 60 * 1000))
      ) {
        if (!isLive(f.status) && f.status !== "HT" && f.status !== "SUSP") return false;
      }
      if (filters.dateRange === "week" && kickoff > weekEnd) return false;
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!f.home.name.toLowerCase().includes(q) && !f.away.name.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

interface SportsDataContextValue {
  filters: GlobalFilters;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>;

  allFixtures: Fixture[];
  filteredFixtures: Fixture[];
  selectedFixtureId: string | null;
  setSelectedFixtureId: (id: string | null) => void;
  selectedFixture: Fixture | null;

  arbThreshold: number;
  setArbThreshold: (t: number) => void;

  openBets: Bet[];
  settledBets: Bet[];
  allBets: Bet[];

  activeTab: SportsWorkspaceTab;
  setActiveTab: (t: SportsWorkspaceTab) => void;
  handleViewArb: (fixtureId?: string) => void;
  mode?: string;
}

const SportsDataContext = React.createContext<SportsDataContextValue | null>(null);

export function SportsDataProvider({ children }: { children: React.ReactNode }) {
  const { isPaper, isBatch, mode } = useExecutionMode();
  const { scope: globalScope } = useGlobalScope();

  // Check if selected org has a sports desk
  const hasSportsDesk = React.useMemo(() => {
    if (globalScope.organizationIds.length === 0) return true; // no filter = show all
    return CLIENTS.some(
      (c) => globalScope.organizationIds.includes(c.orgId) && c.id === "sports-desk",
    );
  }, [globalScope.organizationIds]);
  const [filters, setFilters] = React.useState<GlobalFilters>({
    leagues: [],
    dateRange: "today",
    statusFilter: "all",
    search: "",
  });
  const [selectedFixtureId, setSelectedFixtureId] = React.useState<string | null>(null);
  const [arbThreshold, setArbThreshold] = React.useState(DEFAULT_ARB_THRESHOLD);
  const [activeTab, setActiveTab] = React.useState<SportsWorkspaceTab>("fixtures");

  const allFixtures = MOCK_FIXTURES;
  // Batch mode: only show settled/completed fixtures
  // Org scope: show all fixtures (they're global) but mark as view-only if no sports desk
  const filteredFixtures = React.useMemo(() => {
    const filtered = applyFilters(allFixtures, filters);
    if (isBatch) return filtered.filter((f) => isCompleted(f.status));
    return filtered;
  }, [allFixtures, filters, isBatch]);

  const selectedFixture = React.useMemo(() => {
    if (!selectedFixtureId) return null;
    return MOCK_FIXTURES.find((f) => f.id === selectedFixtureId) ?? null;
  }, [selectedFixtureId]);

  const allBets = MOCK_BETS;
  // Paper mode: zero out all bet amounts (simulated, no real stakes)
  // Org scope: hide bets if selected org has no sports desk
  const adjustedBets = React.useMemo(() => {
    if (!hasSportsDesk) return [];
    if (!isPaper) return allBets;
    return allBets.map((b) => ({ ...b, stake: 0 }));
  }, [allBets, isPaper, hasSportsDesk]);

  const openBets = React.useMemo(() => adjustedBets.filter((b) => b.status === "open"), [adjustedBets]);
  const settledBets = React.useMemo(() => adjustedBets.filter((b) => b.status !== "open"), [adjustedBets]);

  const handleViewArb = React.useCallback((_fixtureId?: string) => {
    setActiveTab("arb");
  }, []);

  const value = React.useMemo(
    () => ({
      filters,
      setFilters,
      allFixtures,
      filteredFixtures,
      selectedFixtureId,
      setSelectedFixtureId,
      selectedFixture,
      arbThreshold,
      setArbThreshold,
      openBets,
      settledBets,
      allBets: adjustedBets,
      activeTab,
      mode,
      setActiveTab,
      handleViewArb,
    }),
    [
      filters,
      allFixtures,
      filteredFixtures,
      selectedFixtureId,
      selectedFixture,
      arbThreshold,
      openBets,
      settledBets,
      adjustedBets,
      activeTab,
      isPaper,
      isBatch,
      mode,
      handleViewArb,
    ],
  );

  return <SportsDataContext.Provider value={value}>{children}</SportsDataContext.Provider>;
}

export function useSportsData(): SportsDataContextValue {
  const ctx = React.useContext(SportsDataContext);
  if (!ctx) throw new Error("useSportsData must be used within SportsDataProvider");
  return ctx;
}
