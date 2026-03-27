"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type { FootballLeague, Fixture, FixtureStatus } from "./types";
import { MOCK_FIXTURES } from "./mock-data";
import { FOOTBALL_LEAGUES } from "./mock-fixtures";
import { isLive, isCompleted, isUpcoming } from "./helpers";
import { LeagueBadge } from "./shared";
import { FixturesTab } from "./fixtures-tab";
import { ArbTab } from "./arb-tab";
import { MyBetsTab } from "./my-bets-tab";

// ─── Filter Types ─────────────────────────────────────────────────────────────

type DateRange = "today" | "week" | "all";
type StatusFilter = "all" | "live" | "upcoming" | "completed";

export interface GlobalFilters {
  leagues: FootballLeague[];
  dateRange: DateRange;
  statusFilter: StatusFilter;
  search: string;
}

// ─── Global Filter Bar ────────────────────────────────────────────────────────

interface FilterBarProps {
  filters: GlobalFilters;
  onChange: (next: GlobalFilters) => void;
}

const DATE_TABS: { value: DateRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "all", label: "All" },
];

const STATUS_CHIPS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

function FilterBar({ filters, onChange }: FilterBarProps) {
  function toggleLeague(league: FootballLeague) {
    const next = filters.leagues.includes(league)
      ? filters.leagues.filter((l) => l !== league)
      : [...filters.leagues, league];
    onChange({ ...filters, leagues: next });
  }

  return (
    <div className="flex flex-col gap-2 border-b border-zinc-800 bg-[#0d0d0d] px-4 py-2.5">
      {/* Row 1: date range + status + search */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Date range */}
        <div className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-900/60 p-0.5">
          {DATE_TABS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, dateRange: value })}
              className={cn(
                "px-3 py-1.5 text-sm font-semibold rounded transition-colors",
                filters.dateRange === value
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {STATUS_CHIPS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, statusFilter: value })}
              className={cn(
                "px-3 py-1.5 text-sm font-semibold rounded-sm border transition-colors",
                filters.statusFilter === value
                  ? "bg-[#22d3ee]/15 text-[#22d3ee] border-[#22d3ee]/40"
                  : "border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto w-52 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            className="h-9 pl-9 pr-9 text-sm bg-zinc-900/60 border-zinc-800 focus:border-zinc-600"
            placeholder="Search teams…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: league pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onChange({ ...filters, leagues: [] })}
          className={cn(
            "px-2.5 py-1 text-xs font-bold rounded-sm border transition-colors uppercase tracking-wide",
            filters.leagues.length === 0
              ? "bg-zinc-700 text-white border-zinc-600"
              : "border-zinc-800 text-zinc-500 hover:text-zinc-300",
          )}
        >
          All Leagues
        </button>
        {FOOTBALL_LEAGUES.map((league) => (
          <button key={league} onClick={() => toggleLeague(league)}>
            <LeagueBadge
              league={league}
              className={cn(
                "cursor-pointer transition-opacity",
                filters.leagues.length > 0 &&
                  !filters.leagues.includes(league) &&
                  "opacity-40",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Fixture Filtering Logic ──────────────────────────────────────────────────

function applyFilters(fixtures: Fixture[], filters: GlobalFilters): Fixture[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  return fixtures.filter((f) => {
    // League filter
    if (filters.leagues.length > 0 && !filters.leagues.includes(f.league))
      return false;

    // Status filter
    if (
      filters.statusFilter === "live" &&
      !isLive(f.status) &&
      f.status !== "HT" &&
      f.status !== "SUSP"
    )
      return false;
    if (filters.statusFilter === "upcoming" && !isUpcoming(f.status))
      return false;
    if (filters.statusFilter === "completed" && !isCompleted(f.status))
      return false;

    // Date filter
    if (filters.dateRange !== "all") {
      const kickoff = new Date(f.kickoff);
      if (
        filters.dateRange === "today" &&
        (kickoff < today ||
          kickoff > new Date(today.getTime() + 24 * 60 * 60 * 1000))
      ) {
        // Allow live/ongoing matches even if they started "today" slightly past midnight
        if (!isLive(f.status) && f.status !== "HT" && f.status !== "SUSP")
          return false;
      }
      if (filters.dateRange === "week" && kickoff > weekEnd) return false;
    }

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !f.home.name.toLowerCase().includes(q) &&
        !f.away.name.toLowerCase().includes(q)
      )
        return false;
    }

    return true;
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SportsPage() {
  const [filters, setFilters] = React.useState<GlobalFilters>({
    leagues: [],
    dateRange: "today",
    statusFilter: "all",
    search: "",
  });
  const [activeTab, setActiveTab] = React.useState("fixtures");

  // Derived fixtures after global filter — passed to all tabs
  const filteredFixtures = React.useMemo(
    () => applyFilters(MOCK_FIXTURES, filters),
    [filters],
  );

  // Allow the Arb tab's "View Arb" action from a fixture card to switch tabs
  function handleViewArb(_fixtureId?: string) {
    setActiveTab("arb");
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <FilterBar filters={filters} onChange={setFilters} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 min-h-0"
      >
        {/* Tab triggers */}
        <div className="border-b border-zinc-800 bg-[#0d0d0d] px-4">
          <TabsList className="h-10 bg-transparent gap-0 p-0">
            {[
              { value: "fixtures", label: "Fixtures" },
              { value: "arb", label: "Arb" },
              { value: "my-bets", label: "My Bets" },
            ].map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="data-[state=active]:border-b-2 data-[state=active]:border-[#22d3ee] data-[state=active]:text-[#22d3ee] data-[state=active]:bg-transparent text-zinc-500 hover:text-zinc-300 rounded-none px-4 text-sm font-bold h-10 transition-colors"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent
          value="fixtures"
          className="flex-1 min-h-0 overflow-hidden mt-0 p-0 flex flex-col"
        >
          <FixturesTab fixtures={filteredFixtures} onViewArb={handleViewArb} />
        </TabsContent>

        <TabsContent
          value="arb"
          className="flex-1 min-h-0 overflow-hidden mt-0 p-0"
        >
          <ArbTab fixtures={filteredFixtures} />
        </TabsContent>

        <TabsContent
          value="my-bets"
          className="flex-1 min-h-0 overflow-auto mt-0 p-0"
        >
          <MyBetsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
