"use client";

import { isCompleted, isLive, isUpcoming } from "@/components/trading/sports/helpers";
import type { Bet, CLVRecord, Fixture, FootballLeague, Prediction, Standing } from "@/components/trading/sports/types";
import { useSportsLiveUpdates } from "@/hooks/use-sports-live-updates";
import { useExecutionMode } from "@/lib/execution-mode-context";
import {
  MOCK_BETS,
  MOCK_CLV_RECORDS,
  MOCK_FIXTURES,
  MOCK_PREDICTIONS,
  MOCK_STANDINGS,
} from "@/lib/mocks/fixtures/sports-data";
import { DEFAULT_ARB_THRESHOLD, FOOTBALL_LEAGUES } from "@/lib/mocks/fixtures/sports-fixtures";

export { FOOTBALL_LEAGUES };
import { CLIENTS } from "@/lib/mocks/fixtures/trading-data";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import * as React from "react";

export type SportsDateRange = "today" | "week" | "all" | "matchday" | "custom";
export type SportsStatusFilter = "all" | "live" | "upcoming" | "completed";

// ---------------------------------------------------------------------------
// ML Pipeline types (moved from sports-ml-status-widget per § 0.3)
// ---------------------------------------------------------------------------

export interface ModelFamily {
  id: string;
  name: string;
  targets: string[];
  lastTrained: string;
  accuracy: number;
  status: "healthy" | "stale" | "training" | "failed";
  featureCount: number;
  trainingDuration: string;
  nextScheduled: string;
}

export interface FeatureFreshness {
  group: string;
  columns: number;
  lastUpdated: string;
  staleness: "fresh" | "ok" | "stale";
  coverage: number;
}

const MOCK_MODEL_FAMILIES: ModelFamily[] = [
  {
    id: "pregame_fundamental",
    name: "Pre-Game Fundamental",
    targets: ["home_xg", "away_xg", "goal_diff", "total_goals", "home_win_flag"],
    lastTrained: "2026-04-15T06:00:00Z",
    accuracy: 0.684,
    status: "healthy",
    featureCount: 312,
    trainingDuration: "14m 22s",
    nextScheduled: "2026-04-16T06:00:00Z",
  },
  {
    id: "pregame_market",
    name: "Pre-Game Market (CLV)",
    targets: ["home_clv_bps", "draw_clv_bps", "away_clv_bps"],
    lastTrained: "2026-04-15T06:15:00Z",
    accuracy: 0.627,
    status: "healthy",
    featureCount: 285,
    trainingDuration: "11m 08s",
    nextScheduled: "2026-04-16T06:00:00Z",
  },
  {
    id: "ht_fundamental",
    name: "Half-Time Fundamental",
    targets: ["home_xg_2h", "away_xg_2h", "next_goal_team"],
    lastTrained: "2026-04-14T06:00:00Z",
    accuracy: 0.591,
    status: "stale",
    featureCount: 248,
    trainingDuration: "9m 45s",
    nextScheduled: "2026-04-15T18:00:00Z",
  },
  {
    id: "ht_market",
    name: "Half-Time Market (CLV)",
    targets: ["clv_bps", "move_direction_flag"],
    lastTrained: "2026-04-14T06:15:00Z",
    accuracy: 0.553,
    status: "stale",
    featureCount: 198,
    trainingDuration: "7m 33s",
    nextScheduled: "2026-04-15T18:00:00Z",
  },
  {
    id: "meta",
    name: "Meta (Bet Quality)",
    targets: ["bet_quality_score", "positive_roi_flag"],
    lastTrained: "2026-04-15T07:00:00Z",
    accuracy: 0.715,
    status: "healthy",
    featureCount: 635,
    trainingDuration: "18m 55s",
    nextScheduled: "2026-04-16T07:00:00Z",
  },
];

const MOCK_FEATURE_FRESHNESS: FeatureFreshness[] = [
  { group: "team_form", columns: 48, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 1.0 },
  { group: "team_xg", columns: 36, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 0.98 },
  { group: "odds_features", columns: 120, lastUpdated: "2026-04-15T08:00:00Z", staleness: "fresh", coverage: 0.95 },
  { group: "h2h", columns: 28, lastUpdated: "2026-04-14T06:00:00Z", staleness: "ok", coverage: 0.92 },
  { group: "injury_impact", columns: 18, lastUpdated: "2026-04-14T12:00:00Z", staleness: "ok", coverage: 0.88 },
  { group: "weather", columns: 12, lastUpdated: "2026-04-13T06:00:00Z", staleness: "stale", coverage: 0.75 },
  { group: "elo", columns: 8, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 1.0 },
  { group: "poisson_xg", columns: 24, lastUpdated: "2026-04-15T05:30:00Z", staleness: "fresh", coverage: 0.97 },
];

export interface GlobalFilters {
  leagues: FootballLeague[];
  dateRange: SportsDateRange;
  statusFilter: SportsStatusFilter;
  search: string;
  matchday?: string;
  customDate?: string;
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

    if (filters.dateRange === "matchday" && filters.matchday) {
      if (f.round !== filters.matchday) return false;
    } else if (filters.dateRange === "custom" && filters.customDate) {
      const kickoff = new Date(f.kickoff);
      const target = new Date(filters.customDate);
      target.setHours(0, 0, 0, 0);
      const targetEnd = new Date(target.getTime() + 24 * 60 * 60 * 1000);
      if (kickoff < target || kickoff >= targetEnd) {
        if (!isLive(f.status) && f.status !== "HT" && f.status !== "SUSP") return false;
      }
    } else if (filters.dateRange !== "all") {
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

  standings: Standing[];

  clvRecords: CLVRecord[];
  predictions: Record<string, Prediction>;
  modelFamilies: ModelFamily[];
  featureFreshness: FeatureFreshness[];

  activeTab: SportsWorkspaceTab;
  setActiveTab: (t: SportsWorkspaceTab) => void;
  handleViewArb: (fixtureId?: string) => void;
  mode?: string;
  wsStatus?: string;
}

const SportsDataContext = React.createContext<SportsDataContextValue | null>(null);

export function SportsDataProvider({ children }: { children: React.ReactNode }) {
  const { isPaper, isBatch, mode } = useExecutionMode();
  const globalScope = useWorkspaceScope();

  // Check if selected org has a sports desk
  const hasSportsDesk = React.useMemo(() => {
    if (globalScope.organizationIds.length === 0) return true; // no filter = show all
    return CLIENTS.some((c) => globalScope.organizationIds.includes(c.orgId) && c.id === "sports-desk");
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

  const { updates: liveUpdates, status: wsStatus } = useSportsLiveUpdates({ enabled: true });

  const allFixtures = React.useMemo(() => {
    // Start with mock fixtures as base (in all modes -- real mode will overlay with API data)
    const base = [...MOCK_FIXTURES];

    // Overlay WebSocket live updates onto fixtures
    if (liveUpdates.size > 0) {
      for (const [fixtureId, update] of liveUpdates) {
        const idx = base.findIndex((f) => f.id === fixtureId);
        if (idx >= 0) {
          // Update existing fixture with live data
          base[idx] = {
            ...base[idx],
            status: update.status as (typeof base)[0]["status"],
            minute: update.minute ?? base[idx].minute,
            score: update.score ?? base[idx].score,
            ...(update.stats
              ? {
                  stats: {
                    home: {
                      xg: base[idx].stats?.home.xg ?? 0,
                      shotsTotal: update.stats.home.shots,
                      shotsOnTarget: update.stats.home.shots_on_target,
                      possession: update.stats.home.possession,
                      corners: update.stats.home.corners,
                      fouls: base[idx].stats?.home.fouls ?? 0,
                      yellowCards: base[idx].stats?.home.yellowCards ?? 0,
                      redCards: base[idx].stats?.home.redCards ?? 0,
                      dangerousAttacks: base[idx].stats?.home.dangerousAttacks ?? 0,
                    },
                    away: {
                      xg: base[idx].stats?.away.xg ?? 0,
                      shotsTotal: update.stats.away.shots,
                      shotsOnTarget: update.stats.away.shots_on_target,
                      possession: update.stats.away.possession,
                      corners: update.stats.away.corners,
                      fouls: base[idx].stats?.away.fouls ?? 0,
                      yellowCards: base[idx].stats?.away.yellowCards ?? 0,
                      redCards: base[idx].stats?.away.redCards ?? 0,
                      dangerousAttacks: base[idx].stats?.away.dangerousAttacks ?? 0,
                    },
                  },
                }
              : {}),
            ...(update.events && update.events.length > 0
              ? {
                  events: update.events.map((e) => ({
                    minute: e.minute,
                    type: e.type as "goal" | "yellow_card" | "red_card" | "substitution" | "var" | "penalty",
                    team: e.team,
                    player: e.player,
                    detail: e.detail,
                  })),
                }
              : {}),
          };
        }
      }
    }
    return base;
  }, [liveUpdates]);
  // Batch mode: only show settled/completed fixtures
  // Org scope: show all fixtures (they're global) but mark as view-only if no sports desk
  const filteredFixtures = React.useMemo(() => {
    const filtered = applyFilters(allFixtures, filters);
    if (isBatch) return filtered.filter((f) => isCompleted(f.status));
    return filtered;
  }, [allFixtures, filters, isBatch]);

  const selectedFixture = React.useMemo(() => {
    if (!selectedFixtureId) return null;
    return allFixtures.find((f) => f.id === selectedFixtureId) ?? null;
  }, [selectedFixtureId, allFixtures]);

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

  const standings = React.useMemo(() => {
    const selectedLeague = filters.leagues.length === 1 ? filters.leagues[0] : "EPL";
    return MOCK_STANDINGS[selectedLeague] ?? MOCK_STANDINGS["EPL"] ?? [];
  }, [filters.leagues]);

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
      standings,
      clvRecords: MOCK_CLV_RECORDS,
      predictions: MOCK_PREDICTIONS,
      modelFamilies: MOCK_MODEL_FAMILIES,
      featureFreshness: MOCK_FEATURE_FRESHNESS,
      activeTab,
      mode,
      setActiveTab,
      handleViewArb,
      wsStatus,
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
      standings,
      activeTab,
      mode,
      handleViewArb,
      wsStatus,
    ],
  );

  return <SportsDataContext.Provider value={value}>{children}</SportsDataContext.Provider>;
}

export function useSportsData(): SportsDataContextValue {
  const ctx = React.useContext(SportsDataContext);
  if (!ctx) throw new Error("useSportsData must be used within SportsDataProvider");
  return ctx;
}
